import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, Info } from 'lucide-react';
import {
  useVetPriceEstimator,
  VET_SERVICE_LABELS,
  VET_SERVICE_ORDER,
  type VetServiceType,
  type VetPriceStats,
} from '@/hooks/useVetPriceEstimator';
import { formatCLP, slugifyForUrl } from '@/lib/vetDirectory';

interface Props {
  comuna?: string;
  compact?: boolean;
}

/**
 * Widget que muestra el rango de precios reales de servicios
 * veterinarios en una comuna. Lee de la vista vet_prices_by_comuna.
 *
 * - compact: card chiquita con solo consulta general (para el directorio)
 * - completo: tabla con todos los servicios (para /precios-veterinarios)
 */
export default function PriceEstimatorWidget({ comuna, compact = false }: Props) {
  const { byService, isLoading, data } = useVetPriceEstimator(comuna);

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6">
        <Skeleton className="h-6 w-1/2 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
    );
  }

  // Empty state — sin muestras suficientes en esta comuna
  if (data.length === 0) {
    if (compact) {
      // En modo compact no rendereamos nada para no ensuciar el directorio
      return null;
    }
    return (
      <Card className="p-8 text-center bg-amber-50 border-amber-200">
        <Info className="h-10 w-10 mx-auto text-amber-500 mb-3" />
        <h3 className="font-semibold text-lg text-amber-900 mb-2">
          {comuna
            ? `Aún no tenemos suficientes precios para ${comuna}`
            : 'Aún no tenemos suficientes precios publicados'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Necesitamos al menos 3 veterinarios publicando precios por servicio para mostrar
          estadísticas confiables. ¿Eres veterinario?
        </p>
        <Link to="/registro-veterinario">
          <Button className="min-h-[44px]">Sé el primero en publicar tus precios</Button>
        </Link>
      </Card>
    );
  }

  // ----- COMPACT: solo consulta general -----
  if (compact) {
    const consulta = byService.get('consulta_general');
    if (!consulta) return null;
    return (
      <Card className="p-4 bg-purple-50 border-purple-200 mb-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-purple-100 p-2 flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-purple-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-purple-900">
              Consulta general en {comuna}
            </p>
            <p className="text-sm text-purple-800">
              {formatCLP(consulta.min_price)} – {formatCLP(consulta.max_price)}
              <span className="text-xs text-purple-700 ml-2">
                (mediana {formatCLP(consulta.median_price)} · {consulta.sample_size}{' '}
                {consulta.sample_size === 1 ? 'vet' : 'vets'})
              </span>
            </p>
            <Link
              to={`/precios-veterinarios/comuna/${slugifyForUrl(comuna ?? '')}`}
              className="text-xs text-purple-700 underline hover:text-purple-900 inline-block mt-1 min-h-[44px] py-2"
            >
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // ----- COMPLETO: tabla por servicio -----
  return (
    <Card className="p-4 md:p-6">
      <div className="grid gap-3">
        {VET_SERVICE_ORDER.map((svc) => (
          <ServiceRow key={svc} service={svc} stats={byService.get(svc)} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1">
        <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
        Los precios provienen de los propios veterinarios. Mostramos sólo servicios con al menos
        3 profesionales publicando para que la mediana sea representativa.
      </p>
    </Card>
  );
}

function ServiceRow({ service, stats }: { service: VetServiceType; stats?: VetPriceStats }) {
  const label = VET_SERVICE_LABELS[service];

  if (!stats) {
    return (
      <div className="flex items-center justify-between gap-3 py-3 border-b last:border-0 min-h-[44px]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">Sin datos suficientes</span>
      </div>
    );
  }

  // Barra visual: rango p25-p75 marcado, mediana destacada
  const range = stats.max_price - stats.min_price || 1;
  const p25Pct = ((stats.p25_price - stats.min_price) / range) * 100;
  const p75Pct = ((stats.p75_price - stats.min_price) / range) * 100;
  const medianPct = ((stats.median_price - stats.min_price) / range) * 100;

  return (
    <div className="py-3 border-b last:border-0">
      <div className="flex items-center justify-between gap-3 mb-2 min-h-[44px]">
        <span className="font-semibold text-amber-900">{label}</span>
        <span className="text-sm font-bold text-purple-700">
          {formatCLP(stats.median_price)}
        </span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div
          className="absolute h-full bg-purple-200"
          style={{ left: `${p25Pct}%`, width: `${Math.max(p75Pct - p25Pct, 2)}%` }}
        />
        <div
          className="absolute h-full w-1 bg-purple-700"
          style={{ left: `calc(${medianPct}% - 2px)` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatCLP(stats.min_price)}</span>
        <span>
          {stats.sample_size} {stats.sample_size === 1 ? 'vet' : 'vets'}
        </span>
        <span>{formatCLP(stats.max_price)}</span>
      </div>
    </div>
  );
}
