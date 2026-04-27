/**
 * useResearchConsent — lee y actualiza el opt-in del dueño para que su data
 * anonima sea incluida en insights agregados B2B (Pharma, aseguradoras,
 * estudios academicos).
 *
 * Refactor Maestro Fase 2 §7.3.
 *
 * Estados:
 *   null  — nunca decidio (default)
 *   true  — opt-in (incluir en agregados B2B)
 *   false — opt-out (excluir incluso si cumple otros criterios)
 *
 * Lectura barata: una row por usuario, cacheada 5 min. La mutacion invalida
 * la query y dispara toast de confirmacion.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ResearchConsentState {
  consent: boolean | null;
  decidedAt: string | null;
}

export function useResearchConsent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<ResearchConsentState>({
    queryKey: ['research-consent', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!user?.id) return { consent: null, decidedAt: null };
      const { data, error } = await supabase
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('anonymous_data_research_consent, research_consent_at' as any)
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      // Cast porque las columnas son recientes y el tipo generado puede no
      // tenerlas todavia
      const row = (data ?? {}) as {
        anonymous_data_research_consent?: boolean | null;
        research_consent_at?: string | null;
      };
      return {
        consent: row.anonymous_data_research_consent ?? null,
        decidedAt: row.research_consent_at ?? null,
      };
    },
  });

  const setConsent = useMutation({
    mutationFn: async (value: boolean) => {
      if (!user?.id) throw new Error('No autenticado');
      // Cast: el tipo generado puede no tener las columnas nuevas todavia.
      // RLS valida el update server-side.
      const updatePayload: Record<string, unknown> = {
        anonymous_data_research_consent: value,
        research_consent_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);
      if (error) throw error;
      return value;
    },
    onSuccess: (value) => {
      queryClient.invalidateQueries({ queryKey: ['research-consent', user?.id] });
      toast.success(
        value
          ? 'Gracias. Tu data anonima nos ayuda a sostener el proyecto.'
          : 'Listo. Tu data no se va a usar en estudios.'
      );
    },
    onError: () => {
      toast.error('No pudimos guardar tu decision. Probá de nuevo.');
    },
  });

  return {
    consent: query.data?.consent ?? null,
    decidedAt: query.data?.decidedAt ?? null,
    isLoading: query.isLoading,
    setConsent: setConsent.mutate,
    isSaving: setConsent.isPending,
  };
}
