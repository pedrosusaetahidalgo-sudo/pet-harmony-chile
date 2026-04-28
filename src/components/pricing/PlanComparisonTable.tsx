/**
 * PlanComparisonTable — componente unico para mostrar diferencias entre
 * planes en los momentos de eleccion de membresia.
 *
 * Dos variantes:
 *   - `PlanComparisonTableB2C`: Gratis vs Paw Member. Deja cristalino que
 *     Paw Member NO desbloquea features de app — solo badge + acceso a
 *     descuentos de alianzas (Paw Partners, Paw Companys).
 *   - `PlanComparisonTableVet`: 4 tiers (Basica / Premium / Clinica / Pro Max)
 *     con "que ganas al subir aqui" + collapsible "ver todas las features".
 *
 * Fuente de verdad: `src/lib/plans.ts` (PLANS + PROVIDER_PLANS).
 */

import { PROVIDER_PLANS, PLANS, formatCLP, type ProviderPlanId } from '@/lib/plans';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Heart, Sparkles, Clock, Loader2 } from '@/lib/icons';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════
// B2C — Gratis vs Paw Member
// ═══════════════════════════════════════════════════════════════════════

/**
 * Lista de features que estan disponibles para TODOS los usuarios B2C
 * (incluyendo free). Esta lista refleja `PLANS.free.features` de forma
 * legible. Si cambias caps en plans.ts, actualiza aqui tambien.
 */
const B2C_CORE_FEATURES: string[] = [
  'Mascotas ilimitadas',
  'Ficha clinica completa',
  'Exportar ficha en PDF',
  'Compartir ficha con veterinario',
  'Asistente veterinario con IA',
  'Calendario, recordatorios y rutinas',
  'Panel Pro de Analytics',
  'Escaneo OCR de carnet',
  'Sin publicidad',
];

/**
 * Lo unico que suma Paw Member sobre Gratis. Deliberadamente corto:
 * NO incluye nada funcional de la app — solo reconocimiento + perks de
 * terceros (alianzas) + soporte prioritario.
 */
const B2C_MEMBER_EXTRAS: { emoji: string; text: string }[] = [
  { emoji: '💛', text: 'Badge Paw Member publico en tu perfil' },
  { emoji: '🎁', text: 'Acceso a descuentos de Paw Partners (tiendas, comida, accesorios)' },
  { emoji: '✨', text: 'Reconocimiento en la muralla publica de donantes' },
  { emoji: '🙏', text: 'Soporte prioritario por correo' },
];

export interface PlanComparisonTableB2CProps {
  /** Callback cuando el user clickea "Hacerme Paw Member". Opcional. */
  onMember?: () => void;
  /** Callback cuando el user clickea "Donacion unica". Opcional. */
  onDonate?: () => void;
  /** Si el user ya es Paw Member, oculta el CTA y muestra estado. */
  isMember?: boolean;
}

export function PlanComparisonTableB2C({
  onMember,
  onDonate,
  isMember,
}: PlanComparisonTableB2CProps) {
  const member = PLANS.premium;

  return (
    <Card className="border-2 border-violet-200/70 overflow-hidden">
      <CardContent className="p-5 md:p-6 space-y-5">
        {/* Banner honesto: NO desbloquea nada */}
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 p-3 text-center">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-0.5">
            Paw Friend es 100% gratis para dueños.
          </p>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            Paw Member <strong>no desbloquea features</strong> — es solo badge + acceso a descuentos
            de alianzas.
          </p>
        </div>

        {/* 2 columnas comparativas */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Gratis */}
          <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-900/40">
            <div>
              <h3 className="font-bold text-lg">Gratis</h3>
              <p className="text-2xl font-bold leading-none mt-1">
                $0
                <span className="text-sm text-muted-foreground font-normal"> /siempre</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Para siempre, sin tarjeta.</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Todas las features
            </p>
            <ul className="space-y-1.5 text-sm">
              {B2C_CORE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Paw Member */}
          <div className="rounded-xl border-2 border-violet-400 p-4 space-y-3 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Voluntario
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                Paw Member <span className="text-xl">💛</span>
              </h3>
              <p className="text-2xl font-bold leading-none mt-1">
                {formatCLP(member.monthlyPrice)}
                <span className="text-sm text-muted-foreground font-normal"> /mes</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O {formatCLP(member.yearlyPrice)} al año ({formatCLP(member.yearlyMonthly)}/mes).
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
              Todo lo de Gratis +
            </p>
            <ul className="space-y-1.5 text-sm">
              {B2C_MEMBER_EXTRAS.map((x) => (
                <li key={x.text} className="flex items-start gap-2">
                  <span aria-hidden className="flex-shrink-0 mt-0.5">
                    {x.emoji}
                  </span>
                  <span>{x.text}</span>
                </li>
              ))}
            </ul>

            {/* Advertencia explicita dentro del card member */}
            <div className="rounded-md bg-white/60 dark:bg-slate-900/40 border border-violet-200 p-2 text-[11px] text-violet-900 dark:text-violet-200">
              <strong>Importante:</strong> Paw Member NO desbloquea funciones de la app. Todas las
              features de arriba ya estan en el plan Gratis.
            </div>

            {isMember ? (
              <div className="w-full rounded-md bg-violet-100 dark:bg-violet-900/40 p-2.5 text-center text-xs font-medium text-violet-800 dark:text-violet-200">
                Ya eres Paw Member 💛
              </div>
            ) : onMember ? (
              <Button
                onClick={onMember}
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white"
              >
                <Heart className="h-4 w-4 mr-1.5 fill-white" />
                Hacerme Paw Member
              </Button>
            ) : null}
          </div>
        </div>

        {/* Alternativa: donacion unica */}
        {onDonate && (
          <div className="text-center text-xs text-muted-foreground">
            <p>
              ¿Prefieres aportar sin compromiso mensual?{' '}
              <button
                onClick={onDonate}
                className="underline font-medium text-violet-700 hover:text-violet-900 dark:text-violet-300"
              >
                Hacer una donacion unica
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// B2B Vet — 4 tiers
// ═══════════════════════════════════════════════════════════════════════

type VetFeatureRow = {
  label: string;
  getValue: (plan: ProviderPlanId) => { value: string; ok: boolean; soon?: boolean };
};

function yesNo(b: boolean): { value: string; ok: boolean } {
  return { value: b ? 'Si' : '—', ok: b };
}

function unlimitedNum(n: number, unit: string): { value: string; ok: boolean } {
  if (n === -1) return { value: 'Ilimitado', ok: true };
  return { value: `${n} ${unit}`, ok: n > 0 };
}

export const VET_FEATURE_ROWS: VetFeatureRow[] = [
  {
    label: 'Pacientes',
    getValue: (p) => unlimitedNum(PROVIDER_PLANS[p].features.max_clients, 'activos'),
  },
  {
    label: 'Reservas / mes',
    getValue: (p) => unlimitedNum(PROVIDER_PLANS[p].features.max_bookings_per_month, 'al mes'),
  },
  {
    label: 'Seats (vets bajo tu cuenta)',
    getValue: (p) => unlimitedNum(PROVIDER_PLANS[p].features.max_vet_seats, 'vets'),
  },
  {
    label: 'Perfil publico en directorio',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.directory_listing),
  },
  {
    label: 'Destacado en directorio',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.featured_position),
  },
  {
    label: 'Transcripcion de consultas (audio)',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.audio_transcription),
  },
  {
    label: 'Importacion masiva de pacientes (CSV)',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.bulk_patient_import),
  },
  {
    label: 'Analytics',
    getValue: (p) => {
      const lvl = PROVIDER_PLANS[p].features.analytics_level;
      if (lvl === 'advanced') return { value: 'Avanzada', ok: true };
      if (lvl === 'basic') return { value: 'Basica', ok: true };
      return { value: '—', ok: false };
    },
  },
  {
    label: 'Branding del perfil',
    getValue: (p) => {
      const lvl = PROVIDER_PLANS[p].features.branding_level;
      if (lvl === 'full') return { value: 'Completo', ok: true };
      if (lvl === 'basic') return { value: 'Basico', ok: true };
      return { value: '—', ok: false };
    },
  },
  {
    label: 'Priority support',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.priority_support),
  },
  {
    label: 'Multi-sucursal',
    getValue: (p) => {
      const val = PROVIDER_PLANS[p].features.multiple_branches;
      if (!val) return { value: '—', ok: false };
      return { value: 'Proximamente', ok: true, soon: true };
    },
  },
  {
    label: 'API access',
    getValue: (p) => {
      const val = PROVIDER_PLANS[p].features.api_access;
      if (!val) return { value: '—', ok: false };
      return { value: 'Proximamente', ok: true, soon: true };
    },
  },
  {
    label: 'Comision en reservas',
    getValue: (p) => ({
      value: `${PROVIDER_PLANS[p].commissionRate}%`,
      ok: PROVIDER_PLANS[p].commissionRate < 10,
    }),
  },
];

/** Resumen humano: que suma cada tier sobre el anterior. */
export const VET_PLAN_UPGRADES: Record<ProviderPlanId, { pitch: string; adds: string[] }> = {
  provider_free: {
    pitch: 'Para que pruebes Paw Friend sin costo. Hasta 5 pacientes activos y reservas limitadas.',
    adds: [
      'Perfil publico verificable en el directorio',
      'Hasta 5 pacientes con ficha clinica compartida',
      'Hasta 10 reservas al mes',
    ],
  },
  provider_premium: {
    pitch: 'El salto a volumen real. Sin limites de pacientes ni reservas + bajada de comision.',
    adds: [
      'Pacientes y reservas **ilimitadas**',
      'Tu perfil aparece **destacado** en el directorio por comuna',
      '**Transcripcion de audio** de consultas con IA',
      'Analytics basica del desempeño',
      'Comision baja de **10% → 5%** en reservas pagadas',
    ],
  },
  provider_clinic_starter: {
    pitch: 'Para clinicas con varios vets. Suma 3 seats, carga masiva y comision mas baja.',
    adds: [
      '**3 seats** de veterinarios bajo la misma cuenta clinica',
      '**Carga masiva** de pacientes por CSV/Excel',
      'Analytics **avanzada** y branding completo',
      'Priority support (respuesta < 24h)',
      'Comision baja de **5% → 3%**',
    ],
  },
  provider_pro_max: {
    pitch: 'Para clinicas con varias sucursales. Todo ilimitado, 0% comision, API + branding.',
    adds: [
      '**Seats ilimitados** — toda la clinica en una cuenta',
      '**Multi-sucursal** (proximamente Q3 2026)',
      '**API access** para integrar con tu sistema (proximamente Q3 2026)',
      'Comision **0%** en reservas — todo lo que cobras es tuyo',
    ],
  },
};

const PLAN_ORDER: ProviderPlanId[] = [
  'provider_free',
  'provider_premium',
  'provider_clinic_starter',
  'provider_pro_max',
];

export interface PlanComparisonTableVetProps {
  onCta: (planId: ProviderPlanId) => void;
  ctaLabel: (planId: ProviderPlanId) => string;
  currentPlanId?: ProviderPlanId | null;
  processingPlanId?: ProviderPlanId | null;
  recommendedPlanId?: ProviderPlanId;
  /** Desactiva CTAs (por ejemplo cuando pagos aun no estan activos en landing). */
  ctaDisabled?: boolean;
  /** Planes en los que el CTA aparece deshabilitado (ej. no se puede volver a Basica desde paid). */
  disabledPlanIds?: ProviderPlanId[];
  /** Leyenda opcional bajo los CTAs. */
  footerNote?: string;
  /**
   * Modelo v2: si true, oculta planes con `publicVisible=false` (Clinica + Pro Max)
   * y muestra una tarjeta "Empresarial — contactanos" en su lugar. Activar en
   * `/para-veterinarios`. Mantener false en flows logueados (provider upgrade,
   * admin) que necesitan ver todos los planes.
   */
  publicOnly?: boolean;
  /** Callback cuando el usuario clickea "Contactanos" en la tarjeta Empresarial. */
  onEnterpriseContact?: () => void;
}

export function PlanComparisonTableVet({
  onCta,
  ctaLabel,
  currentPlanId,
  processingPlanId,
  recommendedPlanId,
  ctaDisabled,
  disabledPlanIds,
  footerNote,
  publicOnly,
  onEnterpriseContact,
}: PlanComparisonTableVetProps) {
  const disabledSet = new Set(disabledPlanIds ?? []);
  const visiblePlans = publicOnly
    ? PLAN_ORDER.filter((id) => PROVIDER_PLANS[id].publicVisible !== false)
    : PLAN_ORDER;
  const hasHiddenPlans = publicOnly && visiblePlans.length < PLAN_ORDER.length;
  return (
    <div className="space-y-3">
      <div
        className={cn(
          'grid gap-4 md:grid-cols-2',
          hasHiddenPlans ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
        )}
      >
        {visiblePlans.map((planId) => {
          const plan = PROVIDER_PLANS[planId];
          const isCurrent = planId === currentPlanId;
          const isRecommended =
            planId === recommendedPlanId && (!currentPlanId || currentPlanId === 'provider_free');
          const isProcessing = processingPlanId === planId;

          return (
            <Card
              key={planId}
              className={cn(
                'relative flex flex-col',
                isRecommended && 'border-primary ring-1 ring-primary/30 shadow-lg',
                isCurrent && 'border-emerald-400 ring-1 ring-emerald-300/40'
              )}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Sparkles className="h-3 w-3" />
                    Recomendado
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-3">
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 border-emerald-300 text-emerald-700"
                  >
                    Tu plan actual
                  </Badge>
                </div>
              )}

              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      {plan.segment === 'clinic' ? 'Clinica' : 'Individual'}
                    </p>
                  </div>
                  {plan.badge && (
                    <span aria-hidden className="text-xl">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="mt-1 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {plan.monthlyPrice === 0 ? 'Gratis' : formatCLP(plan.monthlyPrice)}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-xs text-muted-foreground">/mes</span>
                    )}
                  </div>
                  {/* Sprint 1 P1 BIZ-010 (2026-04-28): claridad IVA. Los precios
                      en Chile se publican con IVA incluido por convencion B2C.
                      Para B2B (vets), explicitamos para evitar sorpresas en
                      facturacion contable. */}
                  {plan.monthlyPrice > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">IVA incluido</p>
                  )}
                  {plan.yearlyMonthly > 0 && plan.yearlyMonthly < plan.monthlyPrice && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatCLP(plan.yearlyMonthly)}/mes en plan anual
                    </p>
                  )}
                </div>

                {/* Propuesta de valor: que ganas al subir aqui */}
                <div
                  className={cn(
                    'rounded-md p-3 mb-3 border',
                    planId === 'provider_free'
                      ? 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
                      : 'bg-primary/5 border-primary/20'
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
                    {planId === 'provider_free' ? 'Ideal para empezar' : 'Que ganas al subir aqui'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                    {VET_PLAN_UPGRADES[planId].pitch}
                  </p>
                  <ul className="space-y-1 text-[11px]">
                    {VET_PLAN_UPGRADES[planId].adds.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">+</span>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: bullet
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br/>'),
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Collapsible detalle completo */}
                <details className="text-xs mb-4">
                  <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                    Ver todas las caracteristicas
                  </summary>
                  <ul className="space-y-1.5 text-xs mt-2 pl-1">
                    {VET_FEATURE_ROWS.map((f) => {
                      const v = f.getValue(planId);
                      return (
                        <li key={f.label} className="flex items-start gap-2">
                          {v.ok ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                          )}
                          <span className={cn(!v.ok && 'text-muted-foreground/70')}>
                            <span className="text-[11px] text-muted-foreground">{f.label}:</span>{' '}
                            <strong className="text-foreground">{v.value}</strong>
                            {v.soon && (
                              <Badge
                                variant="outline"
                                className="ml-1 text-[9px] bg-amber-50 border-amber-200 text-amber-700"
                              >
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                Q3 2026
                              </Badge>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </details>

                <div className="mt-auto">
                  {isCurrent ? (
                    <Button disabled className="w-full" variant="secondary">
                      Activo
                    </Button>
                  ) : disabledSet.has(planId) ? (
                    <Button variant="ghost" disabled className="w-full">
                      {ctaLabel(planId)}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isRecommended ? 'default' : 'outline'}
                      onClick={() => onCta(planId)}
                      disabled={ctaDisabled || !!processingPlanId}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Redirigiendo...
                        </>
                      ) : (
                        ctaLabel(planId)
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Tarjeta Empresarial — solo en publicOnly cuando hay planes ocultos */}
        {hasHiddenPlans && (
          <Card className="relative flex flex-col border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-fuchsia-500/5">
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-lg">Empresarial</h3>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    Clinica con varios vets
                  </p>
                </div>
                <span aria-hidden className="text-xl">
                  🏢
                </span>
              </div>

              <div className="mt-1 mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">A medida</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Cotizacion segun seats + sucursales
                </p>
              </div>

              <div className="rounded-md p-3 mb-3 border bg-primary/5 border-primary/20">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
                  Para clinicas establecidas
                </p>
                <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                  Pack de seats multiples, carga masiva CSV, multi-sucursal, branding completo,
                  priority support y comisiones a medida.
                </p>
                <ul className="space-y-1 text-[11px]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">+</span>
                    <span>
                      <strong>3+ vets</strong> bajo una misma cuenta
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">+</span>
                    <span>
                      <strong>Carga masiva</strong> de pacientes (CSV/Excel)
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">+</span>
                    <span>
                      <strong>Multi-sucursal</strong> + branding completo
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">+</span>
                    <span>
                      Comisiones <strong>3% o 0%</strong> segun volumen
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-auto">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => {
                    if (onEnterpriseContact) {
                      onEnterpriseContact();
                    } else {
                      window.location.href =
                        '/aplicar?tipo=vet&segmento=clinica&fuente=para-veterinarios';
                    }
                  }}
                >
                  Contáctanos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {footerNote && <p className="text-xs text-center text-muted-foreground">{footerNote}</p>}
    </div>
  );
}
