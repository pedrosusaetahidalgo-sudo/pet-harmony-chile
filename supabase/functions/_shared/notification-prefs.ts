/**
 * Helper compartido para edge functions que envian notificaciones.
 *
 * Plan PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN §27 y §32.2.2.
 *
 * Problema historico: todas las edge fns de notificaciones
 * (send-push-notification, send-whatsapp-reminder, etc.) enviaban sin
 * consultar user_notification_prefs y sin registrar en
 * notification_attempts. El RPC user_can_receive_notification (mig
 * 20260723000000) existia pero nadie lo invocaba.
 *
 * Este modulo centraliza:
 *   - canReceive(): chequea prefs granulares + whatsapp_opted_in
 *   - logAttempt(): registra intento en notification_attempts (con
 *     idempotencia natural via UNIQUE INDEX de la tabla)
 *
 * Fail-open: si el RPC/logging falla por error de infra, canReceive()
 * retorna true (no bloquear envio) y logAttempt() silencia la excepcion.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export type NotificationCategory =
  | 'transactional'
  | 'pet_reminders'
  | 'daily_digest'
  | 'weekly_digest'
  | 'marketing'
  | 'social'
  | 'gamification';

export type NotificationChannel = 'push' | 'email' | 'in_app' | 'whatsapp' | 'sms';

/**
 * Devuelve true si el usuario puede recibir una notificacion de esa
 * categoria por ese canal.
 *
 * - push/email/in_app → llama RPC user_can_receive_notification.
 * - whatsapp/sms → consulta profiles.whatsapp_opted_in + phone.
 *
 * En caso de error de infra (red, RPC no existe, etc.) retorna true
 * (fail-open) para no bloquear envios por un fallo tecnico.
 */
export async function canReceive(
  supabase: SupabaseClient,
  userId: string,
  category: NotificationCategory,
  channel: NotificationChannel
): Promise<boolean> {
  if (!userId) return false;

  if (channel === 'whatsapp' || channel === 'sms') {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('whatsapp_opted_in, whatsapp_number')
        .eq('id', userId)
        .maybeSingle();
      if (error) return true; // fail-open
      return !!data?.whatsapp_opted_in && !!data?.whatsapp_number;
    } catch {
      return true;
    }
  }

  // push / email / in_app → RPC canonico
  try {
    const { data, error } = await supabase.rpc('user_can_receive_notification', {
      p_user_id: userId,
      p_category: category,
      p_channel: channel,
    });
    if (error) return true; // fail-open si RPC aun no desplegada
    return data !== false;
  } catch {
    return true;
  }
}

export type AttemptStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'skipped' | 'read';

export interface AttemptInput {
  bookingType?: string | null;
  bookingId?: string | null;
  reminderType: string;
  channel: NotificationChannel;
  recipientId: string;
  recipientContact?: string | null;
  status: AttemptStatus;
  errorMessage?: string | null;
  externalId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Registra un intento de notificacion en `notification_attempts`.
 *
 * Idempotencia: la tabla tiene UNIQUE INDEX sobre
 * (booking_type, booking_id, reminder_type, channel)
 * WHERE status IN ('sent','delivered','read'). Un segundo INSERT para
 * la misma clave con status='sent' fallara silenciosamente, cual es
 * el comportamiento deseado.
 *
 * Fail-silent: el logging NO debe bloquear el envio. Cualquier error
 * se captura y se silencia (si acaso console.warn).
 */
export async function logAttempt(
  supabase: SupabaseClient,
  input: AttemptInput
): Promise<void> {
  try {
    const { error } = await supabase.from('notification_attempts').insert({
      booking_type: input.bookingType ?? null,
      booking_id: input.bookingId ?? null,
      reminder_type: input.reminderType,
      channel: input.channel,
      recipient_id: input.recipientId,
      recipient_contact: input.recipientContact ?? null,
      status: input.status,
      error_message: input.errorMessage ?? null,
      external_id: input.externalId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) {
      // 23505 = unique violation → ya se registro, es OK (idempotencia)
      if ((error as { code?: string }).code !== '23505') {
        console.warn('[notification-prefs] logAttempt error:', error.message);
      }
    }
  } catch (err) {
    console.warn('[notification-prefs] logAttempt exception:', err);
  }
}

/**
 * Filtra una lista de user IDs dejando solo los que pueden recibir la
 * notificacion. Devuelve tambien la lista de skipped para logging.
 */
export async function filterUserIdsByPrefs(
  supabase: SupabaseClient,
  userIds: string[],
  category: NotificationCategory,
  channel: NotificationChannel
): Promise<{ allowed: string[]; skipped: string[] }> {
  const results = await Promise.all(
    userIds.map(async (id) => {
      const ok = await canReceive(supabase, id, category, channel);
      return { id, ok };
    })
  );
  return {
    allowed: results.filter((r) => r.ok).map((r) => r.id),
    skipped: results.filter((r) => !r.ok).map((r) => r.id),
  };
}
