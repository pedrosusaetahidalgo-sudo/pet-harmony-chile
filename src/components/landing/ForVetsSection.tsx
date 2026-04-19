import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { ArrowRight, Stethoscope, Calendar } from '@/lib/icons';
import { FOR_VETS } from './content/copy';
import { VET_BENEFITS } from './content/pillars';
import { RevealSection } from './RevealSection';

/**
 * Banda B2B dedicada — masterplan §9.9 / §15.8.
 *
 * Mantiene la dirección "dark slate + acento ámbar" del landing viejo
 * porque funciona, pero limpia el dashboard mockup y agrega un slot
 * pre-armado para testimonio real (oculto hasta que llegue el de Sofía
 * Rosi con autorización).
 *
 * Cuando Pedro consiga testimonio real:
 *   - Cambiar HAS_REAL_TESTIMONIAL a true
 *   - Editar TESTIMONIAL más abajo (mantener cita corta y específica)
 */
const HAS_REAL_TESTIMONIAL = false;
const TESTIMONIAL = {
  quote: '', // Pedro, llenar cuando tengas autorización por escrito
  author: '',
  location: '',
};

export function ForVetsSection() {
  const navigate = useNavigate();

  return (
    <RevealSection
      as="section"
      id="para-vets"
      ariaLabelledby="para-vets-title"
      className="relative isolate overflow-hidden px-4 py-20 md:py-28"
    >
      <div className="absolute inset-0 -z-10 bg-neutral-950" />
      <div className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
      <div className="absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />

      <div className="container mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* Copy */}
          <div className="text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-white/20 backdrop-blur">
              <Stethoscope className="h-3.5 w-3.5" />
              {FOR_VETS.badge}
            </span>
            <h2
              id="para-vets-title"
              className="mt-4 font-display font-semibold text-4xl leading-[1.05] tracking-tight md:text-6xl"
            >
              {FOR_VETS.h2Lead}{' '}
              <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                {FOR_VETS.h2Highlight}
              </span>
            </h2>
            <p className="mt-4 max-w-lg text-base text-white/75 md:text-lg">{FOR_VETS.body}</p>

            <ul className="mt-7 space-y-3">
              {VET_BENEFITS.map(({ iconSrc, text }) => (
                <li key={text} className="flex items-center gap-3 text-base text-white/90">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                    <img
                      src={iconSrc}
                      alt=""
                      aria-hidden
                      className="h-4 w-4 brightness-0 invert opacity-90"
                      loading="lazy"
                    />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            {/* Slot testimonial — visible sólo cuando exista uno real */}
            {HAS_REAL_TESTIMONIAL && TESTIMONIAL.quote && (
              <figure className="mt-7 rounded-2xl border-l-4 border-amber-300 bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
                <blockquote className="text-sm italic text-white/90 md:text-base">
                  &ldquo;{TESTIMONIAL.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-3 text-xs font-semibold text-amber-300">
                  — {TESTIMONIAL.author}
                  {TESTIMONIAL.location ? ` · ${TESTIMONIAL.location}` : ''}
                </figcaption>
              </figure>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate(LINKS.paraVeterinarios())}
                className="h-14 rounded-2xl bg-amber-400 px-7 text-base font-semibold text-neutral-950 hover:bg-amber-300"
              >
                {FOR_VETS.ctaPrimary}
                <ArrowRight className="ml-1.5 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate(LINKS.registroVeterinario())}
                className="h-14 rounded-2xl px-5 text-base font-semibold text-white hover:bg-white/10"
              >
                {FOR_VETS.ctaSecondary}
              </Button>
            </div>
          </div>

          {/* Mini dashboard mockup (anonimizado) */}
          <div className="relative">
            <div className="relative mx-auto max-w-md rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Panel vet
                  </p>
                  <p className="mt-1 text-base font-bold text-white">Tu clínica</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-300 ring-1 ring-white/20">
                  <Stethoscope className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { n: '128', l: 'Reseñas' },
                  { n: '42', l: 'Pacientes' },
                  { n: '4.9', l: 'Rating' },
                ].map(({ n, l }) => (
                  <div
                    key={l}
                    className="rounded-xl bg-white/5 p-3 text-center ring-1 ring-white/10"
                  >
                    <p className="text-xl font-black text-white">{n}</p>
                    <p className="text-[9px] uppercase tracking-wider text-white/60">{l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Próximas reservas
                </p>
                {[
                  { h: '09:30', t: 'Control anual' },
                  { h: '10:15', t: 'Vacuna séxtuple' },
                  { h: '11:00', t: 'Consulta general' },
                ].map((r) => (
                  <div
                    key={r.h}
                    className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">{r.t}</p>
                    </div>
                    <span className="font-mono text-xs text-white/60">{r.h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
