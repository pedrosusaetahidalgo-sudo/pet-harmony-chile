import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye } from '@/lib/icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LiveMonthlyReport } from '@/components/reports/LiveMonthlyReport';

const REPORT_TYPE_LABELS: Record<string, string> = {
  owner_weekly: 'Resumen semanal',
  vet_weekly: 'Resumen semanal profesional',
  owner_monthly: 'Reporte mensual',
  vet_monthly: 'Reporte mensual profesional',
};

export default function Reportes() {
  const { user } = useAuth();

  interface ReportRow {
    id: string;
    report_type: string;
    period_start: string;
    period_end: string;
    content_jsonb: Record<string, unknown>;
    pdf_url: string | null;
    viewed_at: string | null;
    created_at: string;
  }

  // periodic_reports es tabla nueva — no está en los types generados aún
  const {
    data: reports,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['all-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Sprint 1 P1 PERF-003: select narrow segun ReportRow interface arriba.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('periodic_reports')
        .select(
          'id, report_type, period_start, period_end, content_jsonb, pdf_url, viewed_at, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as ReportRow[];
    },
    enabled: !!user?.id,
  });

  const markViewed = async (reportId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('periodic_reports')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', reportId);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto p-4 space-y-4">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="h-24 skeleton rounded-xl" />
        <div className="h-24 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-purple-600" />
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          Mis reportes
        </h1>
      </div>

      {/* Reporte en vivo del mes en curso (siempre visible, se actualiza al consultar) */}
      <LiveMonthlyReport />

      {/* Historial de reportes periódicos (PDF descargables generados por cron) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Resúmenes anteriores</h2>
          {reports && reports.length > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {reports.length} {reports.length === 1 ? 'reporte' : 'reportes'}
            </Badge>
          )}
        </div>
      </div>

      {!reports || reports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Los resúmenes semanales y mensuales se generan automáticamente. El próximo llegará
              este domingo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const content = report.content_jsonb as Record<string, unknown> | null;
            const highlights: string[] = (content?.highlights as string[]) || [];
            const isUnread = !report.viewed_at;

            return (
              <Card
                key={report.id}
                className={`transition-all hover:shadow-md ${isUnread ? 'border-l-4 border-l-purple-600' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-purple-100 text-purple-700"
                        >
                          Nuevo
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(report.period_start), 'd MMM', { locale: es })} –{' '}
                        {format(parseISO(report.period_end), 'd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {highlights.slice(0, 3).map((h, i) => (
                    <p key={i} className="text-sm text-foreground">
                      {h}
                    </p>
                  ))}
                  <div className="flex gap-2 pt-1">
                    {isUnread && (
                      <Button size="sm" variant="ghost" onClick={() => markViewed(report.id)}>
                        <Eye className="h-3 w-3 mr-1" /> Marcar como leído
                      </Button>
                    )}
                    {report.pdf_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3 mr-1" /> PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
