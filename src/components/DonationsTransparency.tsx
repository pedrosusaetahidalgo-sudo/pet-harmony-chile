import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Users, Sparkles, Target } from '@/lib/icons';
import { formatCLP } from '@/lib/format';
import { useDonationsGoalProgress } from '@/hooks/usePublicDonations';
import { cn } from '@/lib/utils';

interface DonationsTransparencyProps {
  className?: string;
}

export function DonationsTransparency({ className }: DonationsTransparencyProps) {
  const { data, isLoading } = useDonationsGoalProgress();

  if (isLoading) {
    return (
      <Card className={cn('border-emerald-200/60', className)}>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const pct = data.percent;

  return (
    <Card
      className={cn(
        'border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/20',
        className
      )}
    >
      <CardContent className="p-5 space-y-4">
        <header className="flex items-center gap-2 flex-wrap">
          <Target className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold">Meta de la comunidad</h2>
          <Badge
            variant="outline"
            className="ml-auto text-[10px] bg-white/60 border-emerald-300 text-emerald-700"
          >
            En vivo
          </Badge>
        </header>

        {/* Barra de meta SIN monto visible — solo % de avance. */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Vamos por el{' '}
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                {pct}%
              </span>{' '}
              de la meta anual
            </span>
            <span className="text-[11px] text-muted-foreground italic">
              🐾 gracias a cada aporte
            </span>
          </div>
          <Progress
            value={pct}
            aria-label={`Progreso: ${pct}% hacia la meta anual`}
            className="h-3 bg-emerald-100/60 dark:bg-emerald-950/40"
          />
          <p className="text-[11px] text-muted-foreground italic pt-0.5">
            La meta cubre servidores, edge functions, seguridad y sostener Paw Friend gratis todo el
            año. Mostramos solo el % de avance.
          </p>
        </div>

        {/* Agregados publicos no sensibles */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-dashed border-emerald-200/50">
          <KpiTile
            icon={<Sparkles className="h-4 w-4 text-amber-500" />}
            label="Este mes"
            value={formatCLP(data.month_clp)}
          />
          <KpiTile
            icon={<Users className="h-4 w-4 text-violet-500" />}
            label="Donantes"
            value={data.donors_total.toLocaleString('es-CL')}
            sub={`${data.donors_month} este mes`}
          />
          <KpiTile
            icon={<ShieldCheck className="h-4 w-4 text-sky-500" />}
            label="Transparencia"
            value="En vivo"
            sub="actualizada sola"
          />
        </div>

        <ul className="text-xs space-y-1.5 text-foreground/75 pt-1">
          <li>
            Cada peso va primero a mantener servidores, edge functions, seguridad y el directorio de
            vets gratis.
          </li>
          <li>
            Si hay excedente, publicamos aquí a qué refugio o hogar de tránsito aliado se derivó.
            Próximamente con nombre y comprobante.
          </li>
          <li className="italic text-muted-foreground">
            Paw Friend es un proyecto home-made, una sola persona en Chile.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

function KpiTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-emerald-100/70 bg-white/70 dark:bg-slate-900/60 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-bold text-sm leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
