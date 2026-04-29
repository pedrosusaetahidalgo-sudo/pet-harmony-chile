/**
 * Sprint 1 P1 FEAT-004 (2026-04-28): /onboarding-vet → smart redirect.
 *
 * Antes: 3-step pitch decorativo (perfil + disponibilidad + primer paciente)
 * que solo escribia `pf_vet_onboarding_complete=true` a localStorage. Cero
 * writes a DB. "Fake onboarding" → contaba como vets sin que existieran en
 * `service_providers`.
 *
 * Ahora:
 *   - Si el user ya es provider (tiene `service_providers` row): /provider/dashboard.
 *   - Si NO es provider todavia: /para-veterinarios (donde BecomeProviderDialog
 *     hace el registro real con DB write).
 *
 * Mantiene la URL viva porque es deeplink desde el email de bienvenida del
 * vet. Solo cambia el destino: ahora siempre lleva a una pantalla funcional
 * en vez del pitch decorativo.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function OnboardingVetMinimal() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth?returnTo=' + encodeURIComponent('/onboarding-vet'), { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;

      // Marcar onboarding como visto (mantiene la flag legacy para no romper
      // chequeos antiguos si los hay).
      try {
        localStorage.setItem('pf_vet_onboarding_complete', 'true');
      } catch {
        // ignore quota errors
      }

      if (data?.id) {
        navigate('/provider/dashboard', { replace: true });
      } else {
        navigate('/para-veterinarios', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-white">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-slate-600">Preparando tu cuenta…</p>
        </CardContent>
      </Card>
    </div>
  );
}
