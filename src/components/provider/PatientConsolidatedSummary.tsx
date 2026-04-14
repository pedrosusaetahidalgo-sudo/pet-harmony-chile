import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import {
  useVetPatientSummary,
  type PatientConsolidatedSummary,
  type AlertaItem,
} from '@/hooks/useVetPatientSummary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Stethoscope,
  Pill,
  Syringe,
  AlertTriangle,
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
  Copy,
  RefreshCw,
} from '@/lib/icons';
import { toast } from 'sonner';

interface Props {
  petId: string | null;
  petName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientConsolidatedSummary({ petId, petName, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { data, isLoading, error, isCached, generate, reset } = useVetPatientSummary();

  useEffect(() => {
    if (open && petId) {
      generate(petId);
    }
    if (!open) {
      reset();
    }
  }, [open, petId, generate, reset]);

  const handleGoToFicha = () => {
    if (petId) {
      onOpenChange(false);
      navigate(LINKS.petClinical(petId));
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const text = buildPlainText(data, petName);
    navigator.clipboard.writeText(text).then(
      () => toast.success('Consolidado copiado al portapapeles'),
      () => toast.error('Error al copiar')
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            Consolidado clinico — {petName}
          </DialogTitle>
          <DialogDescription>
            {data
              ? `Generado a partir de ${data.total_sesiones} registros${data.rango_fechas ? ` (${data.rango_fechas})` : ''}`
              : 'Analizando historial clinico...'}
            {isCached && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                Cache
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <LoadingSkeleton />}

        {error && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
            <p className="font-medium">Error al generar consolidado</p>
            <p className="text-xs mt-1">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-1"
              onClick={() => petId && generate(petId)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
          </div>
        )}

        {data && <SummaryContent summary={data} />}

        {data && (
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" className="gap-1.5 flex-1" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button
              className="gap-1.5 flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={handleGoToFicha}
            >
              <FileText className="h-4 w-4" />
              Ver ficha completa
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryContent({ summary }: { summary: PatientConsolidatedSummary }) {
  return (
    <div className="space-y-4">
      {/* Resumen general */}
      <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
        <p className="text-sm text-teal-800">{summary.resumen_general}</p>
      </div>

      {/* Alertas (arriba si hay) */}
      {summary.alertas.length > 0 && (
        <Section
          icon={AlertTriangle}
          title="Alertas"
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          borderColor="border-amber-200"
        >
          <div className="space-y-2">
            {summary.alertas.map((a, i) => (
              <AlertRow key={i} alerta={a} />
            ))}
          </div>
        </Section>
      )}

      {/* Diagnosticos */}
      {summary.diagnosticos.length > 0 && (
        <Section icon={Stethoscope} title="Diagnosticos" iconColor="text-blue-600">
          <div className="space-y-1.5">
            {summary.diagnosticos.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{d.condicion}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      d.estado === 'activo'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : d.estado === 'en_tratamiento'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-green-50 text-green-600 border-green-200'
                    }`}
                  >
                    {d.estado === 'en_tratamiento' ? 'En tratamiento' : d.estado}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {d.apariciones}x · {d.ultima_fecha}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tratamientos activos */}
      {summary.tratamientos.length > 0 && (
        <Section icon={Pill} title="Tratamientos activos" iconColor="text-purple-600">
          <div className="space-y-1.5">
            {summary.tratamientos.map((t, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{t.medicamento}</span>
                <span className="text-muted-foreground">
                  {' '}
                  {t.dosis} · {t.frecuencia}
                </span>
                <span className="text-xs text-muted-foreground ml-2">(desde {t.desde})</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Vacunas */}
      {summary.vacunas.length > 0 && (
        <Section icon={Syringe} title="Vacunas" iconColor="text-green-600">
          <div className="space-y-1.5">
            {summary.vacunas.map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{v.nombre}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      v.estado === 'al_dia'
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : v.estado === 'proxima'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {v.estado === 'al_dia'
                      ? 'Al dia'
                      : v.estado === 'proxima'
                        ? 'Proxima'
                        : 'Vencida'}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {v.fecha}
                  {v.proxima ? ` → ${v.proxima}` : ''}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Seguimientos */}
      {summary.seguimientos.length > 0 && (
        <Section icon={Calendar} title="Proximos seguimientos" iconColor="text-amber-600">
          <div className="space-y-1.5">
            {summary.seguimientos.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-50 text-amber-600 border-amber-200"
                >
                  {s.fecha}
                </Badge>
                <span className="text-muted-foreground">{s.razon}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  iconColor,
  bgColor,
  borderColor,
  children,
}: {
  icon: React.ElementType;
  title: string;
  iconColor: string;
  bgColor?: string;
  borderColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${bgColor || 'bg-muted/30'} ${borderColor || 'border-border/50'}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function AlertRow({ alerta }: { alerta: AlertaItem }) {
  const sevColors = {
    alta: 'bg-red-100 text-red-700 border-red-300',
    media: 'bg-amber-100 text-amber-700 border-amber-300',
    baja: 'bg-blue-100 text-blue-700 border-blue-300',
  };
  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="outline" className={`text-[10px] ${sevColors[alerta.severidad]}`}>
        {alerta.severidad}
      </Badge>
      <Badge variant="outline" className="text-[10px]">
        {alerta.tipo}
      </Badge>
      <span>{alerta.descripcion}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-2">
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-teal-500" />
        Analizando historial clinico con IA...
      </div>
    </div>
  );
}

function buildPlainText(summary: PatientConsolidatedSummary, petName: string): string {
  const lines: string[] = [
    `CONSOLIDADO CLINICO — ${petName}`,
    `${summary.total_sesiones} registros${summary.rango_fechas ? ` (${summary.rango_fechas})` : ''}`,
    '',
    summary.resumen_general,
    '',
  ];

  if (summary.diagnosticos.length) {
    lines.push('DIAGNOSTICOS:');
    summary.diagnosticos.forEach((d) =>
      lines.push(`  - ${d.condicion} (${d.estado}, ${d.apariciones}x, ultima: ${d.ultima_fecha})`)
    );
    lines.push('');
  }

  if (summary.tratamientos.length) {
    lines.push('TRATAMIENTOS ACTIVOS:');
    summary.tratamientos.forEach((t) =>
      lines.push(`  - ${t.medicamento} ${t.dosis} ${t.frecuencia} (desde ${t.desde})`)
    );
    lines.push('');
  }

  if (summary.vacunas.length) {
    lines.push('VACUNAS:');
    summary.vacunas.forEach((v) =>
      lines.push(
        `  - ${v.nombre}: ${v.estado} (${v.fecha})${v.proxima ? ` → proxima: ${v.proxima}` : ''}`
      )
    );
    lines.push('');
  }

  if (summary.alertas.length) {
    lines.push('ALERTAS:');
    summary.alertas.forEach((a) => lines.push(`  - [${a.severidad}] ${a.tipo}: ${a.descripcion}`));
    lines.push('');
  }

  if (summary.seguimientos.length) {
    lines.push('SEGUIMIENTOS:');
    summary.seguimientos.forEach((s) => lines.push(`  - ${s.fecha}: ${s.razon}`));
  }

  return lines.join('\n');
}
