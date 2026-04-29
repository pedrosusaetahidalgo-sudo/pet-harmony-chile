/**
 * Tier3Pricing — pricing B2C de 3 tiers (Free / Paw Member / Manada).
 *
 * Creado 2026-04-29 (Plan v5 Opcion 3, pivot freemium real).
 *
 * Estructura:
 *   - Hero pequeno + grid 2 cols (Free vs Paw Member, Paw Member destacado)
 *   - Seccion secundaria Manada con CTA secundario
 *   - FAQs cortas
 *
 * Uso en `/paw-member` cuando el user NO es Paw Member ni Manada.
 *
 * El CTA principal llama a `flow-create-subscription` con `plan_type` igual
 * al PlanId DB ('premium' o 'paw_manada'). El edge fn aun puede no aceptar
 * 'paw_manada' — se incluye TODO al lado.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Heart, Sparkles, Crown, Loader2, Shield, FileText, BarChart3 } from '@/lib/icons';
import { PLANS, formatCLP, type PlanId } from '@/lib/plans';
import { cn } from '@/lib/utils';

export interface Tier3PricingProps {
  /** Callback cuando el user clickea CTA. Recibe el PlanId DB ('premium' | 'paw_manada'). */
  onActivate: (planId: PlanId) => void;
  /** Plan que esta procesandose (muestra loader en ese card). */
  processingPlan?: PlanId | null;
  /** Plan actual del user (si Paw Member ya, muestra "Tu plan actual" en su card). */
  currentPlanId?: PlanId | null;
}

const FREE_FEATURES: string[] = [
  '2 mascotas',
  'Ficha clinica completa',
  'Recordatorios y rutinas',
  'OCR carnet de vacunacion',
  'Pet ID Card basica + QR',
  'Memorial de mascotas',
  'Directorio de veterinarios',
  'Sin publicidad',
];

const PAW_MEMBER_EXTRAS: { icon: React.ComponentType<{ className?: string }>; text: string }[] = [
  { icon: Shield, text: 'Paw Shield biometrico (huella nasal anti-perdida)' },
  { icon: FileText, text: 'Paw Passport PDF compartible (8 paginas)' },
  { icon: BarChart3, text: 'Insights Pro · data agregada de tu raza/comuna' },
  { icon: Sparkles, text: 'Audio notes con transcripcion IA' },
  { icon: Heart, text: 'Reportes historicos completos · ficha 1 ano' },
  { icon: Check, text: 'Hasta 4 mascotas + descuentos Paw Partners' },
];

const MANADA_EXTRAS: string[] = [
  'Todo lo de Paw Member',
  'Hasta 5 mascotas',
  'Descuentos Paw Partners exclusivos',
  'Soporte prioritario',
  'Early access a features nuevas',
  'Badge Manada en tu perfil',
];

export function Tier3Pricing({ onActivate, processingPlan, currentPlanId }: Tier3PricingProps) {
  const free = PLANS.free;
  const member = PLANS.premium;
  const manada = PLANS.paw_manada;

  const isMemberCurrent = currentPlanId === 'premium';
  const isManadaCurrent = currentPlanId === 'paw_manada';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-2">
        <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          Activa{' '}
          <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Paw Member
          </span>{' '}
          para sacarle todo a Paw Friend
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Lo basico es gratis para siempre. Paw Member desbloquea Paw Shield, Paw Passport e
          Insights Pro.
        </p>
      </div>

      {/* Grid principal: Free vs Paw Member */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free */}
        <Card className="border-2 border-slate-200 dark:border-slate-700">
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="font-bold text-xl">Gratis</h3>
              <p className="text-3xl font-bold leading-none mt-2">
                $0
                <span className="text-sm text-muted-foreground font-normal"> /siempre</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sin tarjeta, sin compromiso.</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lo que incluye
            </p>
            <ul className="space-y-1.5 text-sm">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {currentPlanId === 'free' || !currentPlanId ? (
              <div className="rounded-md bg-slate-100 dark:bg-slate-800/40 p-2 text-center text-[11px] text-muted-foreground">
                Estas en este plan
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Paw Member (highlighted) */}
        <Card className="border-2 border-violet-400 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Recomendado
            </Badge>
          </div>
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="font-bold text-xl flex items-center gap-1.5">
                Paw Member <span className="text-2xl">💛</span>
              </h3>
              <p className="text-3xl font-bold leading-none mt-2">
                {formatCLP(member.monthlyPrice)}
                <span className="text-sm text-muted-foreground font-normal"> /mes</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O {formatCLP(member.yearlyPrice)} al ano ({formatCLP(member.yearlyMonthly)}/mes ·
                17% off).
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
              Todo lo de Gratis +
            </p>
            <ul className="space-y-1.5 text-sm">
              {PAW_MEMBER_EXTRAS.map((x) => {
                const Icon = x.icon;
                return (
                  <li key={x.text} className="flex items-start gap-2">
                    <Icon className="h-4 w-4 text-violet-600 flex-shrink-0 mt-0.5" />
                    <span>{x.text}</span>
                  </li>
                );
              })}
            </ul>
            {isMemberCurrent ? (
              <div className="rounded-md bg-violet-100 dark:bg-violet-900/40 p-2.5 text-center text-xs font-medium text-violet-800 dark:text-violet-200">
                Ya eres Paw Member 💛
              </div>
            ) : (
              <Button
                onClick={() => onActivate('premium')}
                disabled={!!processingPlan}
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white"
              >
                {processingPlan === 'premium' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Redirigiendo...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-1.5 fill-white" />
                    Activar Paw Member · {formatCLP(member.monthlyPrice)}/mes
                  </>
                )}
              </Button>
            )}
            <p className="text-[10px] text-center text-muted-foreground">
              Cancelable cuando quieras · Sin permanencia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Manada secondary */}
      <Card
        className={cn(
          'border-2 border-amber-300/70 bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/10',
          isManadaCurrent && 'ring-2 ring-amber-400'
        )}
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-lg">
                  ¿Tienes 5 mascotas? Mira Plan Manada <span className="text-xl">👑</span>
                </h3>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                Para hogares con muchas mascotas y corazon refugio. Todo lo de Paw Member + extras
                de power user + tu plan aporta{' '}
                <strong>{formatCLP(manada.manadaRefugioAporteClp)}/mes</strong> al Fondo Paw Friend
                Refugios.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold leading-none">
                {formatCLP(manada.monthlyPrice)}
                <span className="text-sm text-muted-foreground font-normal"> /mes</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                O {formatCLP(manada.yearlyPrice)} al ano
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {MANADA_EXTRAS.map((x) => (
              <li key={x} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{x}</span>
              </li>
            ))}
          </ul>

          {isManadaCurrent ? (
            <div className="rounded-md bg-amber-100 dark:bg-amber-900/40 p-2.5 text-center text-xs font-medium text-amber-900 dark:text-amber-200">
              Ya eres Manada 👑
            </div>
          ) : (
            <Button
              onClick={() => onActivate('paw_manada')}
              disabled={!!processingPlan}
              variant="outline"
              className="w-full border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              {processingPlan === 'paw_manada' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Redirigiendo...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-1.5 text-amber-600" />
                  Activar Manada · {formatCLP(manada.monthlyPrice)}/mes
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-base">Preguntas frecuentes</h3>
          <div className="space-y-3 text-sm">
            <FaqItem
              q="¿Tengo que pagar para usar Paw Friend?"
              a="No. El plan Gratis es para siempre y cubre lo esencial: ficha clinica completa, recordatorios, OCR de carnet, hasta 2 mascotas. Paw Member es opcional y desbloquea Paw Shield biometrico, Paw Passport PDF e Insights Pro."
            />
            <FaqItem
              q="¿Puedo cancelar cuando quiera?"
              a="Si. Sin permanencia. Cancelas y mantienes acceso hasta el fin del periodo pagado. Despues vuelves automaticamente a Gratis."
            />
            <FaqItem
              q="¿Que es el Fondo Paw Friend Refugios?"
              a="Solo aplica al plan Manada. De cada cuota mensual de $9.990, Paw Friend SpA destina $2.000 a refugios chilenos verificados. Tu eliges cual apoyar; nosotros hacemos la donacion efectiva."
            />
            <FaqItem
              q="¿Como se procesa el pago?"
              a="Usamos Flow.cl (tarjeta, Webpay, transferencia). Boletas se emiten automaticamente. La cuenta esta a nombre de SUSAETA GARNHAM SOFTWARE ENGINEERING SpA."
            />
            <FaqItem
              q="¿Puedo cambiar de plan despues?"
              a="Si. Subes o bajas cuando quieras desde tu perfil. Si subes de Paw Member a Manada se prorratea el cobro; si bajas, el cambio aplica al cierre del ciclo."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-lg border bg-card p-3 group">
      <summary className="cursor-pointer text-sm font-semibold flex items-center justify-between gap-2 list-none">
        <span>{q}</span>
        <span
          aria-hidden
          className="text-muted-foreground group-open:rotate-180 transition-transform"
        >
          ▾
        </span>
      </summary>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{a}</p>
    </details>
  );
}
