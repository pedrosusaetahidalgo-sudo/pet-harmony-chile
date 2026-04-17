import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { runAllQualityChecks, type QualityCheck } from '@/lib/auditExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Copy, Database } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Panel de calidad de datos — corre todos los quality_checks definidos
 * en `lib/auditExport.ts` y muestra severidad + detalle en vivo.
 *
 * Cada check lanza una query a Supabase. Resultado cacheado 5 min.
 */

export default function AdminDataQuality() {
  const [copiedCheck, setCopiedCheck] = useState<string | null>(null);

  const {
    data: checks,
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['admin-data-quality'],
    queryFn: runAllQualityChecks,
    staleTime: 5 * 60 * 1000,
  });

  const copyOne = useCallback(async (check: QualityCheck) => {
    const text = buildCheckText(check);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCheck(check.name);
      toast.success('Check copiado al clipboard');
      setTimeout(() => setCopiedCheck((c) => (c === check.name ? null : c)), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  }, []);

  const copyAll = useCallback(async () => {
    if (!checks || checks.length === 0) return;
    const failing = checks.filter((c) => c.severity !== 'ok');
    const header = [
      `DATA QUALITY REPORT — Paw Friend`,
      `Generado: ${new Date().toISOString()}`,
      `Total checks: ${checks.length} | Con alerta: ${failing.length}`,
      '',
    ].join('\n');
    const body = checks.map(buildCheckText).join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(header + body);
      toast.success(
        failing.length > 0
          ? `${failing.length} checks con alerta copiados`
          : 'Reporte completo copiado'
      );
    } catch {
      toast.error('No se pudo copiar');
    }
  }, [checks]);

  const summary = {
    total: checks?.length ?? 0,
    ok: checks?.filter((c) => c.severity === 'ok').length ?? 0,
    warn: checks?.filter((c) => c.severity === 'warn').length ?? 0,
    error: checks?.filter((c) => c.severity === 'error').length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-300">Checks totales</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{summary.total}</p>
            <p className="text-xs text-slate-500">integridad + catalogos</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-slate-300">OK</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-400">{summary.ok}</p>
            <p className="text-xs text-slate-500">sin alertas</p>
          </CardContent>
        </Card>
        <Card
          className={cn('bg-slate-900 border-slate-800', summary.warn > 0 && 'border-amber-500/40')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Warnings</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-400">{summary.warn}</p>
            <p className="text-xs text-slate-500">revisar cuando haya margen</p>
          </CardContent>
        </Card>
        <Card
          className={cn('bg-slate-900 border-slate-800', summary.error > 0 && 'border-red-500/40')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-slate-300">Errores</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-400">{summary.error}</p>
            <p className="text-xs text-slate-500">fix inmediato</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Database className="h-4 w-4" />
                Calidad de datos
              </CardTitle>
              <CardDescription className="text-slate-400">
                Integridad referencial, catalogos (razas/comunas) y completitud de perfiles.
                {dataUpdatedAt > 0 && (
                  <span className="ml-2 text-[10px] text-slate-500">
                    Actualizado {format(new Date(dataUpdatedAt), 'HH:mm', { locale: es })}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className={cn('h-3 w-3 mr-1.5', isFetching && 'animate-spin')} />
                {isFetching ? 'Corriendo...' : 'Re-ejecutar'}
              </Button>
              <Button
                size="sm"
                onClick={copyAll}
                disabled={!checks || checks.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                title="Copia todos los checks como texto — listo para pegar en Claude"
              >
                <Copy className="h-3 w-3 mr-1.5" />
                Copiar reporte
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full bg-slate-800" />
              ))}
            </div>
          ) : !checks || checks.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Sin checks disponibles.</p>
          ) : (
            <div className="space-y-2">
              {checks.map((check) => (
                <div
                  key={check.name}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded border',
                    check.severity === 'error'
                      ? 'bg-red-500/5 border-red-500/30'
                      : check.severity === 'warn'
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-slate-900/50 border-slate-800'
                  )}
                >
                  <SeverityIcon severity={check.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200">{check.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          check.severity === 'error'
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : check.severity === 'warn'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-green-500/20 text-green-300 border-green-500/30'
                        )}
                      >
                        {check.result}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 break-words">{check.detail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyOne(check)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded border border-slate-700 hover:border-indigo-500/50 flex items-center gap-1 whitespace-nowrap"
                    title="Copiar este check al clipboard"
                  >
                    {copiedCheck === check.name ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        copiar
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-600 mt-3">
            Los checks se definen en <span className="font-mono">src/lib/auditExport.ts</span>. Para
            agregar uno nuevo, edita <span className="font-mono">QUALITY_CHECK_DEFINITIONS</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: QualityCheck['severity'] }) {
  if (severity === 'error') return <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />;
  if (severity === 'warn')
    return <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />;
  return <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />;
}

function buildCheckText(check: QualityCheck): string {
  return [
    `[${check.severity.toUpperCase()}] ${check.name}`,
    `Resultado: ${check.result}`,
    `Detalle: ${check.detail}`,
  ].join('\n');
}
