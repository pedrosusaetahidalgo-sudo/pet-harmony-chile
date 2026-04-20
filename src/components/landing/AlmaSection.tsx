import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import {
  ArrowRight,
  Heart,
  Coins,
  Stethoscope,
  Building2,
  Megaphone,
  PawPrint,
  Globe,
  Quote,
} from '@/lib/icons';
import { ALMA } from './content/copy';
import { RevealSection } from './RevealSection';

const SUSTAIN = [
  { icon: Heart, label: 'Donaciones voluntarias', color: 'text-rose-500 bg-rose-50' },
  { icon: PawPrint, label: 'Paw Member ($3.990 voluntario)', color: 'text-amber-600 bg-amber-50' },
  { icon: Stethoscope, label: 'Planes para vets', color: 'text-emerald-600 bg-emerald-50' },
  { icon: Building2, label: 'Paw Companys (sponsors)', color: 'text-orange-600 bg-orange-50' },
  { icon: Megaphone, label: 'Paw Voices (creators)', color: 'text-violet-600 bg-violet-50' },
] as const;

/**
 * Sección "Alma del proyecto" — masterplan §9.8 / §15.7.
 *
 * Diferenciador único: home-made por una persona en Chile + IA.
 * Es lo que NO puede decir competencia ni un SaaS regular.
 *
 * Mientras Pedro no envíe foto del founder + Kai/Ema, usamos un placeholder
 * ilustrativo con paw-print + iniciales. Cuando llegue la foto:
 *   1. Subir a `public/landing/founder-with-kai.jpg`
 *   2. Reemplazar <FounderPlaceholder /> por <img src="/landing/founder-with-kai.jpg" />
 *   3. Borrar el TODO comment
 */
export function AlmaSection() {
  const navigate = useNavigate();

  return (
    <RevealSection
      as="section"
      id="alma"
      ariaLabelledby="alma-title"
      className="relative overflow-hidden px-4 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white to-amber-50/40" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-violet-200/30 blur-[120px]" />

      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          {/* Visual: founder placeholder */}
          <div className="order-2 md:order-1">
            <FounderPlaceholder />
          </div>

          {/* Copy */}
          <div className="order-1 md:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700">
              <Heart className="h-3.5 w-3.5 fill-violet-500 text-violet-500" />
              {ALMA.badge}
            </span>
            <h2
              id="alma-title"
              className="mt-4 font-display font-semibold text-4xl leading-[1.05] tracking-tight md:text-6xl"
            >
              {ALMA.h2Lead}{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
                {ALMA.h2Highlight}
              </span>
              .
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {ALMA.body}
            </p>

            {/* Quote */}
            <figure className="mt-7 rounded-2xl border-l-4 border-violet-400 bg-white/80 p-5 shadow-card backdrop-blur">
              <Quote className="h-6 w-6 text-violet-400" strokeWidth={1.75} />
              <blockquote className="mt-2 text-base leading-relaxed text-foreground md:text-lg">
                &ldquo;{ALMA.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">
                — {ALMA.quoteAuthor}
              </figcaption>
            </figure>

            {/* Cómo nos sostenemos */}
            <div className="mt-8 rounded-2xl bg-amber-50/70 p-5 ring-1 ring-amber-100">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-foreground">{ALMA.sustainTitle}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {ALMA.sustainBody}
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUSTAIN.map(({ icon: Icon, label, color }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm text-foreground">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              size="lg"
              onClick={() => navigate(LINKS.pawCore())}
              className="mt-8 h-14 rounded-2xl bg-violet-600 px-7 text-base font-semibold text-white shadow-[0_20px_40px_-18px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:bg-violet-700"
            >
              {ALMA.cta}
              <ArrowRight className="ml-1.5 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

/**
 * Placeholder mientras llega la foto real del founder + Kai/Ema.
 * Composición visual: avatar circular con paw-print + Chile + Latam.
 *
 * TODO(landing): reemplazar por <img src="/landing/founder-with-kai.jpg" alt="Paw Founder con sus mascotas" />
 * cuando Pedro envíe la foto.
 */
function FounderPlaceholder() {
  return (
    <div className="relative mx-auto max-w-sm">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-violet-200 via-purple-200 to-amber-200 shadow-[0_40px_80px_-25px_rgba(139,92,246,0.35)] ring-1 ring-black/5">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/paw-friend-assets-v2/logo/paw_friend_icon_principal.svg"
            alt=""
            aria-hidden
            className="h-44 w-44 opacity-90 drop-shadow-2xl"
          />
        </div>

        {/* Overlay info */}
        <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
              <PawPrint className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                Paw Founder
              </p>
              <p className="text-sm font-bold text-foreground">Una persona, en Chile</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges flotantes: visión Latam */}
      <div className="absolute -top-3 -right-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Visión
            </p>
            <p className="text-xs font-bold text-foreground">Escalando a Latam</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-3 -left-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">
              Modelo
            </p>
            <p className="text-xs font-bold text-foreground">Gratis para siempre</p>
          </div>
        </div>
      </div>
    </div>
  );
}
