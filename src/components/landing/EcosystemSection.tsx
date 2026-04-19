import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { ArrowRight, Sparkles } from '@/lib/icons';
import { ECOSYSTEM } from './content/copy';
import { PILLARS } from './content/pillars';
import { RevealSection } from './RevealSection';

/**
 * Sección "4 mundos para tu peludo" — masterplan §9.5 / §15.4.
 * Comunica que PawFriend NO es solo ficha, es ecosistema:
 * Salud · Comunidad · Emergencias · Memoria.
 */
export function EcosystemSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <RevealSection
      as="section"
      id="ecosistema"
      ariaLabelledby="ecosistema-title"
      className="px-4 py-20 md:py-28"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {ECOSYSTEM.badge}
          </span>
          <h2
            id="ecosistema-title"
            className="mt-4 text-3xl font-black leading-[1.05] tracking-tight md:text-5xl"
          >
            {ECOSYSTEM.h2Lead}{' '}
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
              {ECOSYSTEM.h2Highlight}
            </span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">{ECOSYSTEM.sub}</p>
        </div>

        {/* Grid 4 cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ iconSrc, emoji, title, description, accentFrom, accentTo, href }) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(href)}
              className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl border border-neutral-200/70 bg-white p-6 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* Acento de color superior */}
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentFrom} ${accentTo}`}
                aria-hidden
              />
              {/* Icono custom */}
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accentFrom} ${accentTo} text-white shadow-lg`}
              >
                <img
                  src={iconSrc}
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-7 brightness-0 invert"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="text-base">
                  {emoji}
                </span>
                <h3 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                  {title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explorar
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center md:mt-16">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(user ? LINKS.home() : LINKS.auth())}
            className="h-13 rounded-2xl border-2 border-primary/30 px-7 text-base font-semibold text-primary hover:bg-primary/5"
          >
            {ECOSYSTEM.cta}
            <ArrowRight className="ml-1.5 h-5 w-5" />
          </Button>
        </div>
      </div>
    </RevealSection>
  );
}
