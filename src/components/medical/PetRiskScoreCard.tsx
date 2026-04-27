/**
 * PetRiskScoreCard — card que muestra el score de salud de la mascota.
 *
 * Refactor Maestro Fase 2 §7.5 + §8.4.5.
 *
 * Diseño:
 *   - Score 0-100 grande, con color por banda (verde/amarillo/rojo)
 *   - Lista de factores positivos (✓) y negativos (!)
 *   - Tooltip explica que es heuristico hoy
 *   - Cuando EMBEDDED_INSURANCE=true, ofrece "Cotizar seguro" con score
 *     pre-calculado (mejor pricing si score alto)
 *
 * El score se calcula via RPC SECURITY DEFINER que solo el owner puede
 * llamar. Si la mig 20260902100000 no esta aplicada, el hook devuelve
 * null y el card no se renderiza.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRiskScore } from '@/hooks/useRiskScore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  petId: string;
}

function scoreBand(score: number): {
  label: string;
  textColor: string;
  bgColor: string;
  tone: 'good' | 'mid' | 'bad';
} {
  if (score >= 80) {
    return {
      label: 'Excelente',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200',
      tone: 'good',
    };
  }
  if (score >= 60) {
    return {
      label: 'Bueno',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
      tone: 'mid',
    };
  }
  return {
    label: 'Atencion',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    tone: 'bad',
  };
}

export function PetRiskScoreCard({ petId }: Props) {
  const { data, isLoading } = useRiskScore(petId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  // Mig pendiente o sin data: no renderizar (no romper la UI con un card vacio)
  if (!data) return null;

  const band = scoreBand(data.risk_score);
  const factors = data.factors ?? {};

  // Construir lista de factores: positivos vs negativos
  const positives: string[] = [];
  const negatives: string[] = [];

  if (factors.has_microchip === true) positives.push('Tiene microchip');
  else if (factors.has_microchip === false) negatives.push('Sin microchip registrado');

  if (factors.neutered === true) positives.push('Esterilizada');

  if (factors.recent_antiparasitic === true) positives.push('Antiparasitario reciente (90d)');

  if (typeof factors.vaccines_overdue === 'number' && factors.vaccines_overdue > 0)
    negatives.push(
      `${factors.vaccines_overdue} vacuna${factors.vaccines_overdue !== 1 ? 's' : ''} vencida${factors.vaccines_overdue !== 1 ? 's' : ''}`
    );

  if (typeof factors.chronic_conditions === 'number' && factors.chronic_conditions > 0)
    negatives.push(
      `${factors.chronic_conditions} condicion${factors.chronic_conditions !== 1 ? 'es' : ''} cronica${factors.chronic_conditions !== 1 ? 's' : ''}`
    );

  if (typeof factors.age_years === 'number' && factors.age_years >= 10)
    negatives.push(`Edad senior (${factors.age_years} años)`);

  return (
    <Card className={cn(band.bgColor)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Heart className={cn('h-4 w-4', band.textColor)} />
          Score de salud
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Que es el score de salud"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/40"
                >
                  <Info className="h-3 w-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Heuristica basada en edad, vacunas al dia, microchip, antiparasitario reciente y
                  condiciones cronicas. Ayuda a saber donde poner foco. Hoy es un estimador general;
                  lo afinaremos con un vet cuando tengamos mas data real.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-3">
          <p className={cn('text-4xl font-bold leading-none', band.textColor)}>{data.risk_score}</p>
          <p className="text-sm text-muted-foreground">/ 100</p>
          <Badge variant="outline" className={cn('ml-auto', band.textColor)}>
            {band.label}
          </Badge>
        </div>

        {(positives.length > 0 || negatives.length > 0) && (
          <div className="space-y-1.5 pt-1">
            {positives.map((p) => (
              <div key={p} className="flex items-center gap-2 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-700">{p}</span>
              </div>
            ))}
            {negatives.map((n) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-slate-700">{n}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
