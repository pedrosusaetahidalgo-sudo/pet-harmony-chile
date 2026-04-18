import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Calendar, Sparkles } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useMyDonationStats } from '@/hooks/usePublicDonations';
import { formatCLP } from '@/lib/format';
import { cn } from '@/lib/utils';

interface MyDonationRecapProps {
  className?: string;
}

/**
 * Card personal "membresia simulada" para el user logueado.
 * Muestra aporte total acumulado + aporte del mes. Solo visible si el user
 * ha donado al menos una vez.
 */
export function MyDonationRecap({ className }: MyDonationRecapProps) {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useMyDonationStats(!!user);

  if (!user || authLoading) return null;

  if (isLoading) {
    return <Skeleton className={cn('h-28 rounded-xl', className)} />;
  }

  if (!data) return null; // no ha donado todavia

  const firstFmt = data.first_donation_at
    ? format(new Date(data.first_donation_at), 'MMMM yyyy', { locale: es })
    : null;

  return (
    <Card
      className={cn(
        'border-violet-200/70 bg-gradient-to-br from-violet-50 via-fuchsia-50/60 to-amber-50/40 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-amber-950/10 overflow-hidden',
        className
      )}
    >
      <CardContent className="p-5 space-y-4 relative">
        <div
          aria-hidden
          className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-violet-300/30 to-fuchsia-300/20 blur-xl pointer-events-none"
        />

        <header className="flex items-center gap-2 flex-wrap relative">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
            <Heart className="h-4 w-4 text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm leading-tight">Tu aporte a Paw Friend</h2>
            <p className="text-[11px] text-muted-foreground">
              Gracias por sostener la causa peluda 💛
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] bg-white/70 dark:bg-slate-900/60 border-violet-300 text-violet-700 dark:text-violet-300"
          >
            <Sparkles className="h-3 w-3 mr-0.5" />
            Miembro voluntario
          </Badge>
        </header>

        <div className="grid grid-cols-2 gap-3 relative">
          <div className="rounded-lg border border-violet-200/60 bg-white/70 dark:bg-slate-900/60 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Total acumulado
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent leading-tight">
              {formatCLP(data.total_clp)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {data.donation_count === 1 ? '1 aporte' : `${data.donation_count} aportes`}
            </div>
          </div>

          <div className="rounded-lg border border-violet-200/60 bg-white/70 dark:bg-slate-900/60 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Este mes
            </div>
            <div className="text-xl font-bold text-foreground leading-tight">
              {formatCLP(data.month_clp)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {firstFmt ? `desde ${firstFmt}` : 'miembro activo'}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground italic relative">
          Esto es un aporte voluntario, no una suscripción. Cada mes puedes decidir si quieres
          volver a aportar o no.
        </p>
      </CardContent>
    </Card>
  );
}
