import { useEffect, useState } from 'react';
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
  Gift,
  ExternalLink,
  Crown,
  Shield,
} from '@/lib/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { CategoryIcon } from '@/components/CategoryIcon';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMyDonationStats, useMyDonationHistory } from '@/hooks/usePublicDonations';
import { useDonorBadge } from '@/hooks/useDonorBadge';
import { useIsPawMember } from '@/hooks/useIsPawMember';
import { useIsManada } from '@/hooks/useIsManada';
import { useManadaAporteSummary } from '@/hooks/useManadaAporteSummary';
import { usePawMemberDiscounts } from '@/hooks/usePawCompanys';
import { formatCLP } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { DonorBadge } from '@/components/DonorBadge';
import { PawMemberBadge } from '@/components/PawMemberBadge';
import { BrandBadge } from '@/components/BrandBadge';
import { Tier3Pricing } from '@/components/pricing/Tier3Pricing';
import { supabase } from '@/integrations/supabase/client';
import { errorMessageForUser } from '@/lib/errors';
import { toast } from 'sonner';
import { PLANS, type PlanId } from '@/lib/plans';
import { cn } from '@/lib/utils';

/**
 * /paw-member — pagina dual mode (refactor 2026-04-29 Plan v5 Opcion 3).
 *
 * Si el user NO es Paw Member ni Manada → muestra Tier3Pricing (3 tiers).
 * Si el user es Paw Member o Manada → muestra dashboard activo (stats,
 * historial, descuentos). Si es Manada, ademas muestra "Tu impacto" en
 * el Fondo Paw Friend Refugios.
 *
 * Mantiene la ruta /paw-member (no renombrar archivo).
 */
export default function PawMember() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado de tier
  const { data: memberInfo, isLoading: memberLoading } = useIsPawMember(user?.id);
  const { data: isManada, isLoading: manadaLoading } = useIsManada(user?.id);
  const isMember = !!memberInfo?.is_member;
  const isActiveTier = isMember || !!isManada;
  const tierLoading = memberLoading || manadaLoading;

  // Datos solo si el user es Member/Manada (dashboard mode)
  const { data: stats, isLoading: statsLoading } = useMyDonationStats(!!user && isActiveTier);
  const { data: history, isLoading: histLoading } = useMyDonationHistory(!!user && isActiveTier);
  const { data: donorBadge } = useDonorBadge(user?.id);
  const { data: memberDiscounts } = usePawMemberDiscounts();
  const { data: manadaSummary, isLoading: summaryLoading } = useManadaAporteSummary(!!isManada);

  // Procesar pago activacion
  const [processingPlan, setProcessingPlan] = useState<PlanId | null>(null);
  // Modal cambiar refugio (solo Manada)
  const [shelterDialogOpen, setShelterDialogOpen] = useState(false);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [savingShelter, setSavingShelter] = useState(false);

  useEffect(() => {
    document.title = 'Paw Member — Tu aporte | Paw Friend';
  }, []);

  // Lista de refugios activos para el modal de cambio (solo Manada)
  const { data: shelters } = useQuery({
    queryKey: ['active-adoption-centers'],
    enabled: !!isManada && shelterDialogOpen,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adoption_centers')
        .select('id, name, slug, comuna')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        slug: string | null;
        comuna: string | null;
      }>;
    },
  });

  const handleActivate = async (planId: PlanId) => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }
    setProcessingPlan(planId);
    try {
      // TODO Pedro: actualizar flow-create-subscription para aceptar plan_type='paw_manada'
      const { data, error } = await supabase.functions.invoke('flow-create-subscription', {
        body: { plan: planId, plan_type: planId },
      });
      if (error) {
        toast.error(error.message || 'No pudimos iniciar el pago');
        return;
      }
      const res = data as { url?: string; error?: string } | null;
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      toast.error('Respuesta inesperada del servidor de pagos');
    } catch (err) {
      toast.error(errorMessageForUser(err));
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleSaveShelter = async () => {
    if (!selectedShelterId) return;
    setSavingShelter(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('set_manada_refugio_preference', {
        p_shelter_id: selectedShelterId,
      });
      if (error) {
        toast.error(error.message || 'No pudimos guardar tu eleccion');
        return;
      }
      toast.success('Refugio actualizado. Gracias por apoyarlo 💛');
      await queryClient.invalidateQueries({ queryKey: ['manada-aporte-summary'] });
      setShelterDialogOpen(false);
    } catch (err) {
      toast.error(errorMessageForUser(err));
    } finally {
      setSavingShelter(false);
    }
  };

  const handleCancelSubscription = () => {
    // Cancelacion la maneja Pedro via soporte hasta tener flujo self-serve
    toast.info(
      'Para cancelar escribenos a pawfriendcl@gmail.com. Mantienes acceso hasta el fin del ciclo pagado.'
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <PawPrint className="h-10 w-10 mx-auto text-violet-500" />
            <h1 className="font-display font-semibold text-2xl tracking-tight">Paw Member</h1>
            <p className="text-sm text-muted-foreground">
              Inicia sesion para ver tu aporte a Paw Friend.
            </p>
            <Button onClick={() => navigate('/auth')}>Iniciar sesion</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Plan id canonico para pricing (Manada gana sobre Member)
  const currentPlanId: PlanId = isManada ? 'paw_manada' : isMember ? 'premium' : 'free';

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
        {/* Loader inicial mientras detectamos tier */}
        {tierLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : !isActiveTier ? (
          // ════════════════════════════════════════════════════════════
          // MODO PRICING: user free → mostrar 3 tiers + FAQ
          // ════════════════════════════════════════════════════════════
          <Tier3Pricing
            onActivate={handleActivate}
            processingPlan={processingPlan}
            currentPlanId={currentPlanId}
          />
        ) : (
          // ════════════════════════════════════════════════════════════
          // MODO DASHBOARD: user Paw Member o Manada
          // ════════════════════════════════════════════════════════════
          <>
            {/* Hero personal con badge del tier */}
            <Card
              className={cn(
                'border-2 overflow-hidden',
                isManada
                  ? 'border-amber-300/70 bg-gradient-to-br from-amber-50 via-orange-50/60 to-rose-50/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/10'
                  : 'border-violet-200/70 bg-gradient-to-br from-violet-50 via-fuchsia-50/60 to-amber-50/40 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-amber-950/10'
              )}
            >
              <CardContent className="p-6 text-center space-y-3 relative">
                <div
                  aria-hidden
                  className={cn(
                    'absolute -top-8 -right-8 h-32 w-32 rounded-full blur-2xl pointer-events-none',
                    isManada
                      ? 'bg-gradient-to-br from-amber-300/40 to-orange-300/30'
                      : 'bg-gradient-to-br from-violet-300/40 to-fuchsia-300/30'
                  )}
                />
                <BrandBadge
                  kind={isManada ? 'paw_member' : 'paw_member'}
                  size="lg"
                  className="mx-auto drop-shadow-xl"
                />

                <div className="space-y-1">
                  <Badge
                    className={cn(
                      'text-white border-0',
                      isManada
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                    )}
                  >
                    {isManada ? (
                      <>
                        <Crown className="h-3 w-3 mr-1" />
                        Manada 👑
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Paw Member 💛
                      </>
                    )}
                  </Badge>
                  <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight tracking-tight">
                    Gracias por sostener{' '}
                    <span className="bg-brand-gold-gradient bg-clip-text text-transparent">
                      Paw Friend
                    </span>
                  </h1>
                  {stats ? (
                    <p className="text-sm text-muted-foreground">
                      Llevas <b>{stats.account_months}</b>{' '}
                      {stats.account_months === 1 ? 'mes' : 'meses'} con nosotros.
                    </p>
                  ) : null}

                  <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                    <PawMemberBadge userId={user.id} size="sm" />
                    <DonorBadge userId={user.id} size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MANADA IMPACT — solo si user es Manada */}
            {isManada && (
              <Card className="border-2 border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-600" />
                    <h2 className="font-semibold text-lg">
                      Tu plan Manada apoya el Fondo Paw Friend Refugios
                    </h2>
                  </div>

                  {summaryLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-20 rounded-lg" />
                      <Skeleton className="h-20 rounded-lg" />
                    </div>
                  ) : (manadaSummary?.aportes_count ?? 0) === 0 ? (
                    <div className="rounded-lg border bg-white/70 dark:bg-slate-900/40 p-4 text-center space-y-2">
                      <Shield className="h-8 w-8 text-amber-500 mx-auto" />
                      <p className="text-sm font-semibold">Tu primer aporte llegará a fin de mes</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Acabas de unirte a Manada. Cada mes,{' '}
                        <strong>
                          {formatCLP(PLANS.paw_manada.manadaRefugioAporteClp)} de tu plan
                        </strong>{' '}
                        van al Fondo Paw Friend Refugios. Aquí verás el detalle cuando se cierre el
                        primer pool mensual.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border bg-white/70 dark:bg-slate-900/40 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Total aportado
                          </p>
                          <p className="font-bold text-xl text-amber-700 dark:text-amber-300 leading-tight">
                            {formatCLP(manadaSummary?.total_aportado_clp ?? 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {manadaSummary?.aportes_count ?? 0}{' '}
                            {manadaSummary?.aportes_count === 1 ? 'aporte' : 'aportes'} acumulados
                          </p>
                        </div>
                        <div className="rounded-lg border bg-white/70 dark:bg-slate-900/40 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Aporte mensual
                          </p>
                          <p className="font-bold text-xl text-amber-700 dark:text-amber-300 leading-tight">
                            {formatCLP(
                              manadaSummary?.current_monthly_clp ??
                                PLANS.paw_manada.manadaRefugioAporteClp
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground">desde tu plan Manada</p>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-white/60 dark:bg-slate-900/40 p-3 space-y-2">
                        <p className="text-xs font-semibold">Refugio que apoyas</p>
                        {manadaSummary?.preferred_shelter_id ? (
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                manadaSummary.preferred_shelter_slug &&
                                navigate(`/refugios/${manadaSummary.preferred_shelter_slug}`)
                              }
                              className="text-sm font-semibold text-amber-800 dark:text-amber-200 hover:underline text-left"
                            >
                              {manadaSummary.preferred_shelter_name}
                            </button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedShelterId(manadaSummary.preferred_shelter_id);
                                setShelterDialogOpen(true);
                              }}
                            >
                              Cambiar refugio
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-xs text-muted-foreground">
                              Aun no eliges. Tu aporte va al pool general hasta que decidas.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedShelterId(null);
                                setShelterDialogOpen(true);
                              }}
                            >
                              Elegir refugio
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-muted-foreground">
                        <p className="leading-relaxed max-w-md">
                          Paw Friend SpA hace la donacion efectiva al refugio que elijas. Tu plan
                          financia el fondo legalmente como persona juridica.
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate('/transparencia')}
                        >
                          Ver impacto del fondo
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* KPIs grandes (donaciones lifetime — para todos los tiers activos) */}
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
                  sub="simula membresia"
                  gradient="from-violet-500 to-fuchsia-500"
                />
                <KpiBig
                  icon={<Calendar className="h-4 w-4 text-amber-600" />}
                  label="Este mes"
                  value={formatCLP(stats.month_clp)}
                  sub={`desde hace ${stats.account_months} ${
                    stats.account_months === 1 ? 'mes' : 'meses'
                  }`}
                  gradient="from-amber-500 to-orange-500"
                />
              </div>
            ) : null}

            {/* Descuentos de alianzas */}
            {memberDiscounts && memberDiscounts.length > 0 ? (
              <Card
                className={cn(
                  'border bg-gradient-to-br',
                  isManada
                    ? 'border-amber-200/70 from-amber-50/70 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20'
                    : 'border-violet-200/70 from-violet-50/70 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/20'
                )}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift
                      className={cn('h-5 w-5', isManada ? 'text-amber-600' : 'text-violet-500')}
                    />
                    <h2 className="font-semibold text-lg">
                      Descuentos {isManada ? 'exclusivos Manada' : 'de tus alianzas'}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isManada
                      ? 'Tus Paw Partners ofrecen estos beneficios exclusivos para usuarios Manada.'
                      : 'Nuestros Paw Partners y Paw Companys ofrecen estos beneficios a miembros activos.'}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {memberDiscounts.map((d) => (
                      <a
                        key={d.id}
                        href={d.website ?? '#'}
                        target={d.website ? '_blank' : undefined}
                        rel={d.website ? 'noopener noreferrer nofollow' : undefined}
                        className="flex items-center gap-2 p-2.5 rounded-lg border bg-white/70 dark:bg-slate-900/60 hover:shadow-sm transition-shadow"
                      >
                        {d.logo_url ? (
                          <img
                            src={d.logo_url}
                            alt={`Logo ${d.name}`}
                            className="h-8 w-8 rounded-md object-contain bg-white border shrink-0"
                          />
                        ) : (
                          <CategoryIcon
                            kind={d.partnership_type === 'partner' ? 'partner' : 'company'}
                            variant="icon"
                            className="h-8 w-8 rounded-md bg-white border shrink-0 p-0.5"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold truncate">{d.name}</span>
                            <Badge
                              variant="outline"
                              className="text-[9px] capitalize"
                              aria-label={`Tipo de alianza ${d.partnership_type}`}
                            >
                              {d.partnership_type === 'partner' ? 'Paw Partner' : 'Paw Company'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-violet-700 dark:text-violet-300 line-clamp-2">
                            🎁 {d.paw_member_discount}
                          </p>
                        </div>
                        {d.website && (
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-violet-200/50 bg-gradient-to-br from-violet-50/40 to-fuchsia-50/30 dark:from-violet-950/20 dark:to-fuchsia-950/10 border-dashed border-2">
                <CardContent className="p-5 text-center space-y-2">
                  <Gift className="h-8 w-8 mx-auto text-violet-400" />
                  <h3 className="font-semibold text-sm">Descuentos de alianzas — proximamente</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Estamos armando alianzas con tiendas peludas, veterinarias, comida y accesorios
                    que van a ofrecer <b>descuentos {isManada ? 'exclusivos' : 'preferentes'}</b>{' '}
                    para {isManada ? 'usuarios Manada' : 'Paw Members'}. Avisamos aca en cuanto
                    esten vivos.
                  </p>
                </CardContent>
              </Card>
            )}

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
                      Tu badge de aportante refleja tu apoyo acumulado. Sigue sumando aportes para
                      avanzar al siguiente nivel.
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('/donaciones')}>
                    <Coins className="h-3.5 w-3.5 mr-1.5" />
                    Hacer otro aporte
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Historial de aportes */}
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
                      Aun no hay aportes en tu cuenta. Cuando hagas tu primer aporte aparecera aqui.
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
                                ? 'Fallo'
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
                              <span className="font-semibold text-sm">
                                {formatCLP(d.amount_clp)}
                              </span>
                              <Badge variant="outline" className={cn('text-[10px]', statusClass)}>
                                {statusLabel}
                              </Badge>
                              {d.is_public && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-violet-50 text-violet-700 border-violet-300"
                                >
                                  Publico en muralla
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

            {/* CTA cierre + cancelar */}
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
                  Aportar
                </Button>
              </CardContent>
            </Card>

            {/* Cancelar suscripcion */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={handleCancelSubscription}
              >
                Cancelar mi suscripcion
              </Button>
            </div>

            {/* Nota legal minima */}
            <section className="text-center text-sm text-muted-foreground space-y-1 pt-2">
              <p className="flex items-center justify-center gap-1.5 text-[11px]">
                <Home className="h-3 w-3" />
                Paw Friend es gratis para todos.{' '}
                {isManada
                  ? 'Tu plan Manada apoya legalmente al Fondo Paw Friend Refugios.'
                  : 'Tu membresia Paw Member desbloquea features premium y descuentos.'}
              </p>
            </section>
          </>
        )}
      </div>

      {/* Modal cambiar refugio (solo Manada) */}
      <Dialog open={shelterDialogOpen} onOpenChange={setShelterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Elegir refugio que apoyo</DialogTitle>
            <DialogDescription>
              Tu aporte mensual de {formatCLP(PLANS.paw_manada.manadaRefugioAporteClp)} ira a este
              refugio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Select
              value={selectedShelterId ?? ''}
              onValueChange={(v) => setSelectedShelterId(v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Buscar refugio..." />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {(shelters ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.comuna ? ` · ${s.comuna}` : ''}
                  </SelectItem>
                ))}
                {!shelters || shelters.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    Cargando refugios...
                  </div>
                ) : null}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Paw Friend SpA hace la donacion efectiva. Puedes cambiar de refugio cuando quieras —
              el cambio aplica al proximo cobro.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShelterDialogOpen(false)}
              disabled={savingShelter}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveShelter} disabled={!selectedShelterId || savingShelter}>
              {savingShelter ? 'Guardando...' : 'Confirmar refugio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
