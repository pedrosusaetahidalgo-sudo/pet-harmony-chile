/**
 * ============================================================================
 * AdminExports — UI del Audit Export System
 * ============================================================================
 *
 * ## Guia para agentes IA
 *
 * Este componente tiene 3 secciones visibles, cada una controlable:
 *
 * 1. **Seccion "Nuevo Export"**: formulario para generar exports.
 *    - Tipos de export: definidos en EXPORT_TYPE_OPTIONS (editable).
 *    - Boton genera el Excel y lo descarga.
 *    - Rate limit visible con contador.
 *
 * 2. Seccion "En progreso": barra de progreso durante generacion.
 *    - Solo visible cuando isGenerating === true.
 *
 * 3. Seccion "Historial": tabla con ultimos exports + acciones.
 *    - Columnas definidas en el JSX de la tabla.
 *    - Boton "Regenerar" crea nuevo export con mismos filtros.
 *    - Boton "Descargar" genera signed URL desde Storage.
 *
 * Para agregar/quitar botones o secciones: buscar los comentarios
 * "Seccion:" en el JSX.
 *
 * Para cambiar los sheets incluidos: editar SHEET_DEFINITIONS en auditExport.ts
 * (este componente lee los nombres automaticamente de ahi).
 * ============================================================================
 */
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
  RefreshCw,
} from '@/lib/icons';
import { useAuditExports, type ExportJob } from '@/hooks/useAuditExports';
import { SHEET_DEFINITIONS, type ExportType } from '@/lib/auditExport';
import { cn } from '@/lib/utils';

// ── Export type options (EDITABLE por agente) ──────────────
const EXPORT_TYPE_OPTIONS: {
  value: ExportType;
  label: string;
  icon: typeof FileDown;
  description: string;
}[] = [
  {
    value: 'full',
    label: 'Full Snapshot',
    icon: FileDown,
    description: 'Todas las tablas, todos los registros',
  },
  {
    value: 'period',
    label: 'Por Periodo',
    icon: Calendar,
    description: 'Filtrado por rango de fechas',
  },
];

// ── Helpers ────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
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

// ── Component ──────────────────────────────────────────────

export default function AdminExports() {
  const {
    exports: exportHistory,
    isLoadingHistory,
    isGenerating,
    progress,
    generateExport,
    downloadExport,
    rateLimitReached,
    remainingToday,
    maxPerDay,
  } = useAuditExports();

  const [exportType, setExportType] = useState<ExportType>('full');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleGenerate = () => {
    const filters = exportType === 'period' ? { from_date: fromDate, to_date: toDate } : {};
    generateExport({ exportType, filters });
  };

  const handleRegenerate = (job: ExportJob) => {
    const filters = (job.filters ?? {}) as { from_date?: string; to_date?: string };
    generateExport({ exportType: job.export_type, filters });
  };

  const canGenerate =
    !isGenerating && !rateLimitReached && (exportType === 'full' || (fromDate && toDate));

  // Sheet names for info display
  const enabledSheetNames = SHEET_DEFINITIONS.filter((d) => d.enabled).map((d) => d.sheetName);

  return (
    <div className="space-y-6">
      {/* ── Seccion: Nuevo Export ── */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Database className="h-5 w-5 text-indigo-400" />
            Nuevo Export de Auditoria
          </CardTitle>
          <CardDescription className="text-slate-400">
            Genera <strong>2 archivos</strong>: un Excel (.xlsx) con todas las tablas y un JSON
            (.claude.json) con la misma data en formato machine-readable para analisis automatizado
            por Claude Code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-3">
            {EXPORT_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Button
                  key={opt.value}
                  variant={exportType === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportType(opt.value)}
                  className={cn(
                    exportType === opt.value
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  )}
                  title={opt.description}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {opt.label}
                </Button>
              );
            })}
          </div>

          {/* Date filters (only for period) */}
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

          {/* Sheets info (auto-generated from SHEET_DEFINITIONS) */}
          <div className="text-xs text-slate-500">
            <span className="text-slate-400 font-medium">
              {enabledSheetNames.length + 2} sheets:
            </span>{' '}
            README, {enabledSheetNames.join(', ')}, Calidad_Datos
          </div>

          {/* Rate limit indicator */}
          <div className="text-xs text-slate-500">
            {rateLimitReached ? (
              <span className="text-amber-400">
                Limite diario alcanzado ({maxPerDay}/{maxPerDay}). Intenta manana.
              </span>
            ) : (
              <span>
                {remainingToday} de {maxPerDay} exports disponibles hoy
              </span>
            )}
          </div>

          {/* ── Seccion: Progreso ── */}
          {isGenerating && progress && (
            <div className="space-y-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
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

      {/* ── Seccion: Historial ── */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Clock className="h-5 w-5 text-slate-400" />
            Historial de Exports
          </CardTitle>
          <CardDescription className="text-slate-400">
            Ultimos {exportHistory.length} exports generados. Descarga desde Storage o regenera con
            mismos filtros.
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
                    <th className="text-right py-2 px-2 font-medium">Acciones</th>
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
                          <div className="flex items-center justify-end gap-1">
                            {/* Boton Descargar (solo si tiene archivo en Storage) */}
                            {job.status === 'ready' && job.file_path && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadExport(job)}
                                className="text-indigo-400 hover:text-indigo-300 h-7 px-2"
                                title="Descargar desde Storage"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {/* Boton Regenerar (crea nuevo export con mismos filtros) */}
                            {job.status === 'ready' && !isGenerating && !rateLimitReached && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRegenerate(job)}
                                className="text-slate-400 hover:text-slate-200 h-7 px-2"
                                title="Regenerar con mismos filtros"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {/* Error message tooltip */}
                            {job.status === 'failed' && job.error_message && (
                              <span
                                className="text-xs text-red-400 max-w-[120px] truncate"
                                title={job.error_message}
                              >
                                {job.error_message}
                              </span>
                            )}
                          </div>
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
