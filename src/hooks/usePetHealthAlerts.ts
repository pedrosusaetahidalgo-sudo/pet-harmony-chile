/**
 * usePetHealthAlerts — alertas automaticas generadas por triggers DB.
 *
 * Refactor Maestro §2.8.3 (cascadas) + §2.8 (ambient computing).
 *
 * Las alertas vienen de la tabla pet_health_alerts. Se crean por triggers
 * (ej: detect_weight_loss_alert) cuando hay senales que el dueño deberia
 * ver pero capaz no detecta solo.
 *
 * Tipos hoy: 'weight_loss_30d'. Tipos planeados: vaccine_overdue,
 * antiparasitic_overdue, no_activity_7d, birthday_window.
 *
 * Uso:
 *   const { alerts, dismiss } = usePetHealthAlerts(petId);
 *   alerts.map(a => <Banner alert={a} onDismiss={() => dismiss(a.id)} />)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type HealthAlertType =
  | 'weight_loss_30d'
  | 'vaccine_overdue'
  | 'no_activity_7d'
  | 'antiparasitic_overdue'
  | 'birthday_window';

export type HealthAlertSeverity = 'low' | 'medium' | 'high';

export interface PetHealthAlert {
  id: string;
  pet_id: string;
  alert_type: HealthAlertType;
  severity: HealthAlertSeverity;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  dismissed_at: string | null;
}

export function usePetHealthAlerts(petId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<PetHealthAlert[]>({
    queryKey: ['pet-health-alerts', petId],
    enabled: !!petId && !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      if (!petId) return [];
      const { data, error } = await supabase
        .from('pet_health_alerts')
        .select('id, pet_id, alert_type, severity, message, metadata, created_at, dismissed_at')
        .eq('pet_id', petId)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false });
      if (error) {
        // Si la tabla no existe (mig pendiente) devolvemos vacio
        return [];
      }
      return (data ?? []) as PetHealthAlert[];
    },
  });

  const dismiss = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error('No autenticado');
      const { error } = await supabase
        .from('pet_health_alerts')
        .update({
          dismissed_at: new Date().toISOString(),
          dismissed_by: user.id,
        } as Record<string, unknown>)
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-health-alerts', petId] });
    },
  });

  return {
    alerts: query.data ?? [],
    isLoading: query.isLoading,
    dismiss: dismiss.mutate,
    isDismissing: dismiss.isPending,
  };
}
