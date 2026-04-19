import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { ArrowRight, MapPin, Stethoscope, Star, BadgeCheck, CheckCircle2 } from '@/lib/icons';
import { VETS_DIRECTORY } from './content/copy';
import { RevealSection } from './RevealSection';

/**
 * Joya 2 — Directorio de vets verificados (masterplan §9.7 / §15.6).
 *
 * Mockup visual: mapa estilizado (no Leaflet real por performance, pero
 * con look más sofisticado que el grid CSS del landing viejo) + 4 pines
 * + card con vet anonimizada (Dra. Vet Verificada).
 *
 * Cuando Pedro consiga autorización de Sofía Rosi:
 *   - Reemplazar "Dra. Vet Verificada" por "Dra. Sofía Rosi · Vitacura"
 *   - Mantener anonimizado mientras tanto (no inventar nombre).
 */
export function VetDirectoryShowcase() {
  const navigate = useNavigate();

  return (
    <RevealSection
      as="section"
      id="directorio"
      ariaLabelledby="directorio-title"
      className="relative overflow-hidden px-4 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-50/60 via-white to-amber-50/30" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" />
              {VETS_DIRECTORY.badge}
            </span>
            <h2
              id="directorio-title"
              className="mt-4 font-display font-semibold text-4xl leading-[1.05] tracking-tight md:text-6xl"
            >
              {VETS_DIRECTORY.h2Lead}{' '}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                {VETS_DIRECTORY.h2Highlight}
              </span>
              .
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              {VETS_DIRECTORY.body}
            </p>

            <ul className="mt-7 space-y-3">
              {VETS_DIRECTORY.bullets.map((text) => (
                <li key={text} className="flex items-start gap-3 text-base text-foreground">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              onClick={() => navigate(LINKS.vets())}
              variant="outline"
              className="mt-9 h-14 rounded-2xl border-2 border-primary/30 px-7 text-base font-semibold text-primary hover:bg-primary/5"
            >
              {VETS_DIRECTORY.cta}
              <ArrowRight className="ml-1.5 h-5 w-5" />
            </Button>
          </div>

          {/* Mockup mapa estilizado */}
          <div className="relative">
            <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-purple-100 via-purple-50 to-amber-50 p-6 shadow-[0_40px_80px_-25px_rgba(147,51,234,0.3)] ring-1 ring-black/5">
              {/* Calles simuladas */}
              <svg
                aria-hidden
                className="absolute inset-0 h-full w-full opacity-40"
                viewBox="0 0 400 400"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(147,51,234,0.18)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Calle principal diagonal */}
                <path
                  d="M 0 280 L 400 120"
                  stroke="rgba(147,51,234,0.25)"
                  strokeWidth="6"
                  fill="none"
                />
                <path
                  d="M 100 0 L 280 400"
                  stroke="rgba(147,51,234,0.2)"
                  strokeWidth="5"
                  fill="none"
                />
              </svg>

              {/* Pines */}
              {[
                { top: '18%', left: '28%', active: true },
                { top: '52%', left: '62%' },
                { top: '72%', left: '22%' },
                { top: '30%', left: '70%' },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg ring-2 transition-transform hover:scale-110 ${
                    p.active
                      ? 'bg-primary text-white ring-white/80'
                      : 'bg-white text-primary ring-primary/20'
                  }`}
                  style={{ top: p.top, left: p.left }}
                >
                  <MapPin className="h-4 w-4" />
                  {p.active && (
                    <span
                      className="absolute -inset-2 animate-ping rounded-full bg-primary/40"
                      aria-hidden
                    />
                  )}
                </div>
              ))}

              {/* Card flotante vet — anonimizada hasta tener autorizacion */}
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-700 text-white">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      Vet verificada cerca
                    </p>
                    <p className="truncate text-xs text-muted-foreground">Comuna · 1,2 km de ti</p>
                  </div>
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold">Reseñas verificadas</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Disponible hoy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
