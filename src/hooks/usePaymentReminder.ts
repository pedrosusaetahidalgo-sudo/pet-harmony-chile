import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface SendPaymentReminderParams {
  bookingId: string;
  providerId: string;
  ownerId: string;
  amount: number;
  ownerPhone?: string;
  ownerName: string;
  petName: string;
  clinicName: string;
}

export function useSendPaymentReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendPaymentReminderParams) => {
      // Check cooldown: no more than 1 reminder per booking per day
      const { data: existing } = await sb
        .from('payment_reminders_log')
        .select('id')
        .eq('booking_id', params.bookingId)
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('cooldown');
      }

      // Try WhatsApp first if phone available
      let channel: 'whatsapp' | 'in_app' = 'in_app';

      if (params.ownerPhone) {
        try {
          const { error: waError } = await supabase.functions.invoke('send-whatsapp-reminder', {
            body: {
              phone: params.ownerPhone,
              owner_name: params.ownerName,
              reminder_type: 'pago pendiente',
              pet_name: params.petName,
              date: `$${params.amount.toLocaleString('es-CL')} en ${params.clinicName}`,
              related_appointment_id: params.bookingId,
            },
          });

          if (!waError) {
            channel = 'whatsapp';
          }
        } catch {
          // WhatsApp failed, fall back to in-app only
        }
      }

      // Log the reminder
      const { error: logError } = await sb.from('payment_reminders_log').insert({
        booking_id: params.bookingId,
        provider_id: params.providerId,
        owner_id: params.ownerId,
        amount: params.amount,
        channel,
      });

      if (logError) throw logError;

      return { channel };
    },
    onSuccess: (result) => {
      const channelLabel = result.channel === 'whatsapp' ? 'por WhatsApp' : 'in-app';
      toast.success('Recordatorio de pago enviado', {
        description: `Se envió el cobro ${channelLabel}`,
      });
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
    },
    onError: (error: Error) => {
      if (error.message === 'cooldown') {
        toast.error('Ya enviaste un cobro hoy', {
          description: 'Puedes enviar un nuevo recordatorio en 24 horas.',
        });
      } else {
        toast.error('Error al enviar cobro', { description: error.message });
      }
    },
  });
}
