import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Star, Clock } from '@/lib/icons';
import { track, EVENTS } from '@/lib/analytics';
import {
  FOUNDING_VET,
  foundingVetDaysLeft,
  isFoundingVetOfferOpen,
} from '@/lib/config/marketingConfig';

/**
 * Founding Vet Offer (playbook §9.4 · 2026-04-19).
 *
 * Oferta pre-lanzamiento: los primeros N veterinarios que se registran
 * antes del deadline quedan locked al precio preferente de por vida (50%
 * off del precio publico). Crea urgencia real + prueba social.
 *
 * Configuracion: ver `src/lib/config/marketingConfig.ts` (envs soportadas
 * VITE_FOUNDING_VET_*).
 */
export function FoundingVetBanner() {
  const navigate = useNavigate();
  const daysLeft = foundingVetDaysLeft();
  const isOpen = isFoundingVetOfferOpen();
  const deadlineLabel = FOUNDING_VET.deadline.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
  });
  const discountPct = Math.round(100 - (FOUNDING_VET.priceClp / FOUNDING_VET.publicPriceClp) * 100);

  const handleClaim = () => {
    track({
      event: EVENTS.FOUNDING_VET_CTA_CLICKED,
      properties: {
        days_left: daysLeft,
        spots_total: FOUNDING_VET.spotsTotal,
        price_clp: FOUNDING_VET.priceClp,
      },
    });
    navigate('/registro-veterinario');
  };

  return (
    <section aria-labelledby="founding-vet-title" className="container mx-auto px-4 max-w-5xl">
      <Card className="overflow-hidden border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-rose-50 shadow-lg">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:gap-8 md:p-8">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                <Flame className="h-3.5 w-3.5" />
                Founding Vet Offer
              </span>
              {isOpen && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                  <Clock className="h-3.5 w-3.5" />
                  Cierra el {deadlineLabel} · quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                </span>
              )}
            </div>

            <h2
              id="founding-vet-title"
              className="font-display text-2xl font-semibold leading-tight text-purple-900 md:text-3xl"
            >
              Los primeros <span className="text-amber-600">{FOUNDING_VET.spotsTotal} vets</span>{' '}
              pagan{' '}
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
                ${FOUNDING_VET.priceClp.toLocaleString('es-CL')}/mes de por vida
              </span>
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Cuando activemos Premium post-lanzamiento, el precio público será{' '}
              <span className="font-semibold text-purple-900">
                ${FOUNDING_VET.publicPriceClp.toLocaleString('es-CL')}/mes
              </span>
              . Los <b>{FOUNDING_VET.spotsTotal} Vet Pioneros</b> quedan locked al {discountPct}%
              off para siempre — onboarding 1-on-1 con el fundador, badge público en tu perfil y
              acceso anticipado a todas las features B2B futuras sin costo extra.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                Badge Vet Pionero 2026
              </span>
              <span>• Onboarding 1-on-1 con el fundador</span>
              <span>• Locked lifetime al {discountPct}% off</span>
              <span>• Primer mes devuelto si no te convence</span>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 md:w-56 md:shrink-0">
            <Button
              size="lg"
              onClick={handleClaim}
              disabled={!isOpen}
              className="h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-base font-bold text-white shadow-[0_20px_40px_-18px_rgba(244,63,94,0.55)] transition-all hover:scale-[1.02] hover:opacity-95 disabled:opacity-60"
            >
              {isOpen ? 'Reclamar mi cupo' : 'Cupos cerrados'}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Sin tarjeta hoy · cobro al activar Premium
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
