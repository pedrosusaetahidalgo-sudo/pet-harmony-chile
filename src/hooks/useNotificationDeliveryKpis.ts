import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryByChannel {
  channel: 'whatsapp' | 'push' | 'email' | 'in_app' | 'sms';
  sent: number;
  failed: number;
  skipped: number;
  total: number;
  successRate: number; // 0-1, excluye skipped del denominador
}

export interface NotificationDeliveryKpis {
  byChannel: DeliveryByChannel[];
  totalLast24h: number;
  totalFailed24h: number;
  overallSuccessRate: number;
}

/**
 * KPIs de entrega de notificaciones ultimas 24h. Lee de notification_attempts
 * (tabla creada en mig 20260612000001). Si la tabla no existe todavia,
 * retorna datos vacios.
 */
export function useNotificationDeliveryKpis() {
  return useQuery({
    queryKey: ['admin-notif-delivery-24h'],
    queryFn: async (): Promise<NotificationDeliveryKpis> => {
      const since = new Date();
      since.setHours(since.getHours() - 24);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- notification_attempts agregada en mig 20260612000001
      const { data, error } = await (supabase.from('notification_attempts') as any)
        .select('channel, status')
        .gte('attempted_at', since.toISOString());

      if (error) {
        console.warn('[useNotificationDeliveryKpis] error, likely pre-migration:', error);
        return {
          byChannel: [],
          totalLast24h: 0,
          totalFailed24h: 0,
          overallSuccessRate: 0,
        };
      }

      const rows = (data ?? []) as Array<{ channel: DeliveryByChannel['channel']; status: string }>;

      const byChannelMap = new Map<DeliveryByChannel['channel'], DeliveryByChannel>();

      for (const row of rows) {
        const existing = byChannelMap.get(row.channel) ?? {
          channel: row.channel,
          sent: 0,
          failed: 0,
          skipped: 0,
          total: 0,
          successRate: 0,
        };

        existing.total++;
        if (row.status === 'sent' || row.status === 'delivered' || row.status === 'read') {
          existing.sent++;
        } else if (row.status === 'failed') {
          existing.failed++;
        } else if (row.status === 'skipped') {
          existing.skipped++;
        }

        byChannelMap.set(row.channel, existing);
      }

      const byChannel = Array.from(byChannelMap.values()).map((c) => {
        const effectiveTotal = c.sent + c.failed; // excluye skipped del denominador
        return {
          ...c,
          successRate: effectiveTotal === 0 ? 0 : c.sent / effectiveTotal,
        };
      });

      const totalLast24h = rows.length;
      const totalFailed24h = rows.filter((r) => r.status === 'failed').length;
      const totalEffective = byChannel.reduce((acc, c) => acc + c.sent + c.failed, 0);
      const totalSent = byChannel.reduce((acc, c) => acc + c.sent, 0);
      const overallSuccessRate = totalEffective === 0 ? 0 : totalSent / totalEffective;

      return { byChannel, totalLast24h, totalFailed24h, overallSuccessRate };
    },
    staleTime: 60_000 * 2,
  });
}
