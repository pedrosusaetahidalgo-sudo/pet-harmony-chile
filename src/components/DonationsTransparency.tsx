import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Users, Coins, Sparkles } from '@/lib/icons';
import { formatCLP } from '@/lib/format';
import { usePublicDonationStats } from '@/hooks/usePublicDonations';
import { cn } from '@/lib/utils';

interface DonationsTransparencyProps {
  className?: string;
}

const MONTHLY_OPS_COST_USD = 80;

export function DonationsTransparency({ className }: DonationsTransparencyProps) {
  const { data, isLoading } = usePublicDonationStats();

  if (isLoading) {
    return (
      <Card className={cn('border-emerald-200/60', className)}>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total_clp === 0) return null;

  return (
    <Card
      className={cn(
        'border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/20',
        className
      )}
    >
      <CardContent className="p-5 space-y-4">
        <header className="flex items-center gap-2 flex-wrap">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold">Transparencia — así va la cosa</h2>
          <Badge
            variant="outline"
            className="ml-auto text-[10px] bg-white/60 border-emerald-300 text-emerald-700"
          >
            En vivo
          </Badge>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile
            icon={<Coins className="h-4 w-4 text-emerald-600" />}
            label="Recaudado total"
            value={formatCLP(data.total_clp)}
          />
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
            label="Costo operacional"
            value={`~USD $${MONTHLY_OPS_COST_USD}/mes`}
            sub="servidores + edge fns"
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
            Paw Friend es un proyecto home-made, una sola persona en Chile. Esta tarjeta se
            actualiza sola cuando llegan donaciones.
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
      <div className="font-bold text-base leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
