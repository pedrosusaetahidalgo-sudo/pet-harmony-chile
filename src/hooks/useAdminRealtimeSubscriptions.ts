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
  // Nuevas reglas de horarios (booking V2) — para que admin vea providers
  // que acaban de activar servicios con el wizard owner-driven.
  {
    channelName: 'admin-availability-rules',
    table: 'provider_availability_rules',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    invalidateKeys: [['provider-availability-rules'], ['admin-service-providers']],
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
  // Feedback de usuarios — debe verse en vivo para responder rapido
  {
    channelName: 'admin-feedback',
    table: 'feedback_in_app',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-feedback'], ['admin-feedback-list']],
  },
  // Partners (anuncios) — activacion/desactivacion de ads
  {
    channelName: 'admin-partners',
    table: 'partners',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    invalidateKeys: [['partners']],
  },
  // Misiones, rewards y promociones — para gestion de gamificacion
  {
    channelName: 'admin-paw-missions',
    table: 'paw_missions',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    invalidateKeys: [['admin-missions']],
  },
  {
    channelName: 'admin-rewards',
    table: 'rewards',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    invalidateKeys: [['admin-rewards']],
  },
  {
    channelName: 'admin-service-promotions',
    table: 'service_promotions',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    invalidateKeys: [['admin-service-promotions']],
  },
  // Partners y leads
  {
    channelName: 'admin-partner-submissions',
    table: 'partner_submissions',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-partner-submissions']],
  },
  // Verifications — para que el badge de pendientes se actualice solo
  {
    channelName: 'admin-verification-requests',
    table: 'verification_requests',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-verification-requests']],
  },
  {
    channelName: 'admin-vet-verifications',
    table: 'vet_verification_results',
    events: ['INSERT', 'UPDATE'],
    invalidateKeys: [['admin-vet-verifications']],
  },
  // Audit log — para que admin team vea acciones de otros admins en vivo
  {
    channelName: 'admin-audit-log',
    table: 'admin_audit_log',
    events: ['INSERT'],
    invalidateKeys: [['admin-audit-log']],
  },
  // Analytics events — para dashboard live de pageviews / acciones
  {
    channelName: 'admin-analytics-events',
    table: 'analytics_events',
    events: ['INSERT'],
    invalidateKeys: [
      ['admin-analytics-traffic'],
      ['admin-analytics-engagement'],
      ['admin-analytics-features'],
    ],
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
