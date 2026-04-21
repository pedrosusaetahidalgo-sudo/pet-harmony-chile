import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { usePlan } from '@/hooks/usePlan';

function WeeklyReportSampleCard() {
  return (
    <Card className="border-l-4 border-l-purple-600 bg-purple-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <span className="text-purple-900">Tu resumen semanal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-purple-800">Vacunas de Lu están al día</p>
        <p className="text-sm text-purple-800">Próximo control: en 2 semanas</p>
        <p className="text-sm text-purple-800">Peso estable este mes</p>
        <p className="text-xs text-muted-foreground italic">
          Tu mascota está en excelente estado de salud esta semana.
        </p>
        <Button size="sm" variant="outline" className="w-full mt-2" disabled>
          Ver reporte completo →
        </Button>
      </CardContent>
    </Card>
  );
}

export function WeeklyReportCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPremium } = usePlan();
  const showPremiumTeaser = isFeatureEnabled('USER_PREMIUM') && !isPremium;

  // periodic_reports es tabla nueva — no está en los types generados aún
  const { data: report } = useQuery({
    queryKey: ['latest-unread-report', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('periodic_reports')
        .select('id, report_type, period_start, period_end, content_jsonb')
        .eq('user_id', user.id)
        .is('viewed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as {
        id: string;
        report_type: string;
        period_start: string;
        period_end: string;
        content_jsonb: Record<string, unknown>;
      } | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const markViewed = useMutation({
    mutationFn: async (reportId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('periodic_reports')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-unread-report'] });
    },
  });

  // Si USER_PREMIUM está activo y el usuario es free, mostrar sample (sin gate
  // bloqueante: el pivot 2026-04-19 dejó todo B2C gratis).
  if (showPremiumTeaser) {
    return <WeeklyReportSampleCard />;
  }

  if (!report) return null;

  const content = report.content_jsonb as Record<string, unknown> | null;
  const highlights: string[] = (content?.highlights as string[]) || [];
  const insight = (content?.insight as string) || '';

  const handleOpen = () => {
    markViewed.mutate(report.id);
    navigate(`/reportes`);
  };

  return (
    <Card className="border-l-4 border-l-purple-600 bg-purple-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <span className="text-purple-900">Tu resumen semanal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {highlights.slice(0, 3).map((h, i) => (
          <p key={i} className="text-sm text-purple-800">
            {h}
          </p>
        ))}
        {insight && <p className="text-xs text-muted-foreground italic">{insight}</p>}
        <Button size="sm" variant="outline" onClick={handleOpen} className="w-full mt-2">
          Ver reporte completo →
        </Button>
      </CardContent>
    </Card>
  );
}
