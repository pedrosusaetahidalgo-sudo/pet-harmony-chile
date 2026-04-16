import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  FileDown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Calendar,
} from '@/lib/icons';
import { useAuditExports } from '@/hooks/useAuditExports';
import type { ExportType } from '@/lib/auditExport';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('es-CL', { timeZone: 'America/Santiago' });
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  queued: { label: 'En cola', variant: 'secondary' },
  processing: { label: 'Generando', variant: 'default' },
  ready: { label: 'Listo', variant: 'outline' },
  failed: { label: 'Error', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'secondary' },
};

export default function AdminExports() {
  const {
    exports: exportHistory,
    isLoadingHistory,
    isGenerating,
    progress,
    generateExport,
    downloadExport,
  } = useAuditExports();

  const [exportType, setExportType] = useState<ExportType>('full');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleGenerate = () => {
    const filters = exportType === 'period' ? { from_date: fromDate, to_date: toDate } : {};
    generateExport({ exportType, filters });
  };

  const canGenerate = !isGenerating && (exportType === 'full' || (fromDate && toDate));

  return (
    <div className="space-y-6">
      {/* ── Nuevo Export ── */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Database className="h-5 w-5 text-indigo-400" />
            Nuevo Export de Auditoria
          </CardTitle>
          <CardDescription className="text-slate-400">
            Genera un archivo Excel con todas las tablas del sistema, incluyendo un reporte de
            calidad de datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-3">
            <Button
              variant={exportType === 'full' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportType('full')}
              className={cn(
                exportType === 'full'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'border-slate-600 text-slate-300 hover:bg-slate-800'
              )}
            >
              <FileDown className="h-4 w-4 mr-1.5" />
              Full Snapshot
            </Button>
            <Button
              variant={exportType === 'period' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportType('period')}
              className={cn(
                exportType === 'period'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'border-slate-600 text-slate-300 hover:bg-slate-800'
              )}
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Por Periodo
            </Button>
          </div>

          {/* Date filters */}
          {exportType === 'period' && (
            <div className="flex gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Desde</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200 w-44"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Hasta</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200 w-44"
                />
              </div>
            </div>
          )}

          {/* Sheets info */}
          <div className="text-xs text-slate-500">
            Sheets incluidos: README, Usuarios, Mascotas, Fichas Medicas, Proveedores, Reservas,
            Pagos, Suscripciones B2B, Resenas, Recordatorios, Config Sistema, Posts Feed, Calidad
            Datos
          </div>

          {/* Progress bar */}
          {isGenerating && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {progress.step}
                </span>
                <span>{progress.pct}%</span>
              </div>
              <Progress value={progress.pct} className="h-2" />
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generar Export
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Historial ── */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Clock className="h-5 w-5 text-slate-400" />
            Historial de Exports
          </CardTitle>
          <CardDescription className="text-slate-400">
            Ultimos 50 exports generados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Cargando historial...
            </div>
          ) : exportHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileDown className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No hay exports generados aun.</p>
              <p className="text-xs mt-1">Genera tu primer export de auditoria arriba.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs">
                    <th className="text-left py-2 px-2 font-medium">Fecha</th>
                    <th className="text-left py-2 px-2 font-medium">Tipo</th>
                    <th className="text-left py-2 px-2 font-medium">Estado</th>
                    <th className="text-right py-2 px-2 font-medium">Sheets</th>
                    <th className="text-right py-2 px-2 font-medium">Registros</th>
                    <th className="text-right py-2 px-2 font-medium">Tamano</th>
                    <th className="text-right py-2 px-2 font-medium">Descargas</th>
                    <th className="text-right py-2 px-2 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.map((job) => {
                    const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.queued;
                    return (
                      <tr
                        key={job.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2 px-2 text-slate-300 text-xs">
                          {formatDate(job.requested_at)}
                        </td>
                        <td className="py-2 px-2">
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-600 text-slate-300"
                          >
                            {job.export_type === 'full' ? 'Full' : 'Periodo'}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={statusCfg.variant} className="text-xs">
                            {job.status === 'ready' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {job.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                            {job.status === 'processing' && (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            )}
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 text-xs">
                          {job.sheets_count ?? '-'}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 text-xs">
                          {job.rows_total?.toLocaleString('es-CL') ?? '-'}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 text-xs">
                          {formatBytes(job.file_size_bytes)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 text-xs">
                          {job.download_count}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {job.status === 'ready' && job.file_path && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadExport(job)}
                              className="text-indigo-400 hover:text-indigo-300 h-7 px-2"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {job.status === 'failed' && job.error_message && (
                            <span className="text-xs text-red-400" title={job.error_message}>
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
