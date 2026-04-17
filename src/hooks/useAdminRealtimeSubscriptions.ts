import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type AdminRealtimeConfig = {
  channelName: string;
  table: string;
  events: Array<'INSERT' | 'UPDATE' | 'DELETE'>;
  invalidateKeys: QueryKey[];
};

const ADMIN_SUBSCRIPTIONS: AdminRealtimeConfig[] = [
  {
    channelName: 'admin-content-reports',
    table: 'content_reports',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-content-reports']],
  },
  {
    channelName: 'admin-profiles',
    table: 'profiles',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-profiles'], ['admin-kpi-active-users-v2'], ['admin-analytics-kpis']],
  },
  {
    channelName: 'admin-error-logs',
    table: 'error_logs',
    events: ['INSERT'],
    invalidateKeys: [['admin-errors-list'], ['admin-errors-kpis']],
  },
  {
    channelName: 'admin-vet-bookings',
    table: 'vet_bookings',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-bookings']],
  },
  {
    channelName: 'admin-service-providers',
    table: 'service_providers',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-service-providers'], ['admin-providers']],
  },
  {
    channelName: 'admin-subscriptions',
    table: 'subscriptions',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    invalidateKeys: [
      ['admin-finance-kpis'],
      ['admin-finance-subs-table'],
      ['admin-finance-plan-dist'],
      ['admin-kpi-revenue-v2'],
    ],
  },
  {
    channelName: 'admin-orders',
    table: 'orders',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-finance-kpis'], ['admin-finance-orders'], ['admin-kpi-revenue-v2']],
  },
  {
    channelName: 'admin-pets',
    table: 'pets',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-kpi-pets-v2'], ['admin-pending-pets']],
  },
];

/**
 * Monta suscripciones realtime de Supabase para el panel admin.
 * Cuando cambia una tabla crítica, invalida las react-query keys asociadas
 * para que se refetch automáticamente. Llamar una sola vez en el root del admin.
 */
export function useAdminRealtimeSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = ADMIN_SUBSCRIPTIONS.map((config) => {
      const channel = supabase.channel(config.channelName);

      config.events.forEach((event) => {
        channel.on('postgres_changes', { event, schema: 'public', table: config.table }, () => {
          config.invalidateKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        });
      });

      return channel.subscribe();
    });

    return () => {
      channels.forEach((channel) => {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      });
    };
  }, [queryClient]);
}
