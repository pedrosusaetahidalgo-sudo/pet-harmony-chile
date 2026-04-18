import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Sparkles,
  Calendar,
  Trophy,
  PawPrint,
  MessageSquare,
  Home,
  Coins,
} from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useMyDonationStats, useMyDonationHistory } from '@/hooks/usePublicDonations';
import { useDonorBadge } from '@/hooks/useDonorBadge';
import { formatCLP } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { DonorBadge } from '@/components/DonorBadge';
import { PawMemberBadge } from '@/components/PawMemberBadge';
import { cn } from '@/lib/utils';

export default function PawMember() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useMyDonationStats(!!user);
  const { data: history, isLoading: histLoading } = useMyDonationHistory(!!user);
  const { data: donorBadge } = useDonorBadge(user?.id);

  useEffect(() => {
    document.title = 'Paw Member — Tu aporte | Paw Friend';
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <PawPrint className="h-10 w-10 mx-auto text-violet-500" />
            <h1 className="text-xl font-bold">Paw Member</h1>
            <p className="text-sm text-muted-foreground">
              Inicia sesión para ver tu aporte a Paw Friend.
            </p>
            <Button onClick={() => navigate('/auth')}>Iniciar sesión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Paw Member — Tu aporte | Paw Friend</title>
      </Helmet>
      <PageHeader title="Paw Member" onBack={() => navigate('/profile')} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(280 80% 92% / 0.6), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(45 90% 92% / 0.4), transparent 70%)',
        }}
      />

      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Hero personal con logo distintivo */}
        <Card className="border-2 border-violet-200/70 bg-gradient-to-br from-violet-50 via-fuchsia-50/60 to-amber-50/40 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-amber-950/10 overflow-hidden">
          <CardContent className="p-6 text-center space-y-3 relative">
            <div
              aria-hidden
              className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-violet-300/40 to-fuchsia-300/30 blur-2xl pointer-events-none"
            />
            {/* Logo distintivo: circulo con gradiente + paw + corazon + sparkles */}
            <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-900">
              <PawPrint className="h-10 w-10 text-white fill-white" />
              <span className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
              </span>
              <span className="absolute -bottom-1 -left-1 h-6 w-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </span>
            </div>

            <div className="space-y-1">
              <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Paw Member
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold">
                Gracias por sostener{' '}
                <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
                  Paw Friend
                </span>
              </h1>
              {stats ? (
                <p className="text-sm text-muted-foreground">
                  Llevas <b>{stats.account_months}</b>{' '}
                  {stats.account_months === 1 ? 'mes' : 'meses'} con nosotros.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no has realizado un aporte. Cuando lo hagas, lo vas a ver aquí.
                </p>
              )}

              {/* Badges actuales del user */}
              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                <PawMemberBadge userId={user.id} size="sm" />
                <DonorBadge userId={user.id} size="sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs grandes */}
        {statsLoading ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-3">
            <KpiBig
              icon={<Heart className="h-4 w-4 text-rose-500 fill-rose-500" />}
              label="Total aportado"
              value={formatCLP(stats.total_clp)}
              sub={stats.donation_count === 1 ? '1 aporte' : `${stats.donation_count} aportes`}
              gradient="from-rose-500 to-pink-500"
            />
            <KpiBig
              icon={<Sparkles className="h-4 w-4 text-violet-500" />}
              label="Equivalente/mes"
              value={formatCLP(stats.avg_monthly_clp)}
              sub="simula membresía"
              gradient="from-violet-500 to-fuchsia-500"
            />
            <KpiBig
              icon={<Calendar className="h-4 w-4 text-amber-600" />}
              label="Este mes"
              value={formatCLP(stats.month_clp)}
              sub={`desde hace ${stats.account_months} ${stats.account_months === 1 ? 'mes' : 'meses'}`}
              gradient="from-amber-500 to-orange-500"
            />
          </div>
        ) : null}

        {/* Paw Points + Tier badge info */}
        {donorBadge && (
          <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/70 to-rose-50/40 dark:from-amber-950/30 dark:to-rose-950/20">
            <CardContent className="p-4 flex items-center gap-3 flex-wrap">
              <Trophy className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-[180px]">
                <div className="text-sm font-semibold">
                  Paw Angel {donorBadge.tier.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Tu badge de donante refleja tu apoyo acumulado. Sigue sumando aportes para avanzar
                  al siguiente nivel.
                </div>
              </div>
              <Button size="sm" onClick={() => navigate('/donaciones')}>
                <Coins className="h-3.5 w-3.5 mr-1.5" />
                Hacer otro aporte
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Historial de donaciones */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold text-lg">Tu historial</h2>
            </div>
            {histLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : !history || history.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Heart className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  Aún no hay aportes en tu cuenta. Cuando hagas tu primera donación aparecerá aquí.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/donaciones')}>
                  Hacer mi primer aporte
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {history.map((d) => {
                  const date = d.paid_at ?? d.created_at;
                  const statusLabel =
                    d.status === 'paid'
                      ? 'Pagado'
                      : d.status === 'pending'
                        ? 'Pendiente'
                        : d.status === 'cancelled'
                          ? 'Cancelado'
                          : d.status === 'failed'
                            ? 'Falló'
                            : d.status;
                  const statusClass =
                    d.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : d.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300';
                  return (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shrink-0">
                        <Heart className="h-4 w-4 text-white fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm">{formatCLP(d.amount_clp)}</span>
                          <Badge variant="outline" className={cn('text-[10px]', statusClass)}>
                            {statusLabel}
                          </Badge>
                          {d.is_public && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-violet-50 text-violet-700 border-violet-300"
                            >
                              Público en muralla
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {format(new Date(date), "d 'de' MMMM yyyy · HH:mm", {
                            locale: es,
                          })}
                        </div>
                        {d.message && (
                          <p className="text-[11px] text-muted-foreground italic mt-0.5 line-clamp-2">
                            "{d.message}"
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* CTA cierre */}
        <Card className="border-pink-200/60 bg-gradient-to-br from-pink-50/70 to-amber-50/40 dark:from-pink-950/30 dark:to-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <div className="text-sm font-semibold">Seguir sosteniendo Paw Friend</div>
              <div className="text-xs text-muted-foreground">
                Cada aporte nos permite mantener la app gratis para todos los tutores peludos de
                Chile.
              </div>
            </div>
            <Button
              onClick={() => navigate('/donaciones')}
              className="bg-gradient-to-r from-pink-500 to-rose-500"
              size="sm"
            >
              Donar
            </Button>
          </CardContent>
        </Card>

        {/* Nota legal mínima */}
        <section className="text-center text-sm text-muted-foreground space-y-1 pt-2">
          <p className="flex items-center justify-center gap-1.5 text-[11px]">
            <Home className="h-3 w-3" />
            Paw Friend es gratis para todos. Tu aporte es voluntario, sin beneficios exclusivos.
          </p>
        </section>
      </div>
    </div>
  );
}

function KpiBig({
  icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  gradient: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 space-y-1">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          'font-bold text-lg leading-tight bg-gradient-to-r bg-clip-text text-transparent',
          gradient
        )}
      >
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
