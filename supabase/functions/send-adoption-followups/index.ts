/**
 * send-adoption-followups — cron diario que manda email a adoptantes
 * 30 y 90 días post-transferencia.
 *
 * Refactor Maestro Fase 1 §6.7.
 *
 * Lee adoption_followups WHERE due_at <= NOW() AND sent_at IS NULL.
 * Para cada uno:
 *   1. Busca pet + adopter email
 *   2. Manda email con CTA "Cómo va [nombre]?" → form de respuesta
 *   3. Marca sent_at = NOW()
 *
 * Schedule: cron diario 9am via supabase config.toml o pg_cron.
 *
 * Sin RESEND_API_KEY: la fn igual marca sent_at para no quedarse mandando
 * loops infinitos, pero loguea warning. La data queda registrada para
 * que el shelter pueda preguntar manualmente desde su dashboard.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'Paw Friend <hola@pawfriend.cl>';
const APP_URL = 'https://pawfriend.cl';

interface FollowupRow {
  id: string;
  pet_id: string;
  adopter_user_id: string;
  shelter_id: string;
  kind: '30d' | '90d';
  due_at: string;
}

serve(
  withTelemetry('send-adoption-followups', async (req) => {
    const authError = requireCronAuth(req);
    if (authError) return authError;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Buscar followups due
    const { data: followups, error: followupsErr } = await admin
      .from('adoption_followups')
      .select('id, pet_id, adopter_user_id, shelter_id, kind, due_at')
      .lte('due_at', new Date().toISOString())
      .is('sent_at', null)
      .limit(50); // batch

    if (followupsErr) {
      return new Response(JSON.stringify({ ok: false, error: followupsErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!followups || followups.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, message: 'Sin followups due' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const fu of followups as FollowupRow[]) {
      try {
        // Lookup pet name + adopter email
        const { data: pet } = await admin
          .from('pets')
          .select('name')
          .eq('id', fu.pet_id)
          .maybeSingle();

        const { data: adopterUser } = await admin.auth.admin.getUserById(fu.adopter_user_id);
        const adopterEmail = adopterUser?.user?.email;

        if (!adopterEmail || !pet) {
          throw new Error(`Sin email/pet para followup ${fu.id}`);
        }

        // Mandar email si Resend configurado
        if (RESEND_API_KEY) {
          const subject =
            fu.kind === '30d'
              ? `¿Cómo va ${pet.name}? — 30 días desde la adopción`
              : `${pet.name} cumplió 90 días contigo 🎉`;

          const html = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
  <h1 style="color:#7c3aed;font-size:22px;margin:0 0 16px">${subject}</h1>
  <p>Hola,</p>
  <p>${
    fu.kind === '30d'
      ? `Ya cumplió un mes contigo, ${pet.name}. ¿Cómo se está adaptando?`
      : `${pet.name} ya lleva 3 meses contigo. ¡Eso es un montón!`
  }</p>
  <p>Nos encantaría saber cómo va y si necesitas ayuda con algo:</p>
  <p style="text-align:center;margin:24px 0">
    <a href="${APP_URL}/mis-adopciones" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Contar cómo va ${pet.name}</a>
  </p>
  <p style="font-size:13px;color:#6b7280">Si tienes cualquier duda, escríbenos a hola@pawfriend.cl. Estamos para ayudar.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="font-size:11px;color:#9ca3af;text-align:center">Paw Friend · pawfriend.cl</p>
</div>`;

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: adopterEmail,
              subject,
              html,
            }),
          });

          if (!res.ok) {
            throw new Error(`Resend ${res.status}: ${await res.text()}`);
          }
        } else {
          console.warn('RESEND_API_KEY no configurado, marcando sent sin email');
        }

        // Marcar sent_at
        await admin
          .from('adoption_followups')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', fu.id);

        sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        errors.push(`${fu.id}: ${msg}`);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: followups.length, sent, failed, errors }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  })
);
