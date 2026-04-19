import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart } from '@/lib/icons';
import { COMMUNITY } from './content/copy';
import { COMMUNITY_CARDS } from './content/pillars';
import { RevealSection } from './RevealSection';

/**
 * Sección "Comunidad pet lover · 5 caminos" — masterplan §9.10 / §15.9.
 *
 * Reducido de 6 cards a 5 (eliminada "Profesionales no-vet" que ya
 * está en el path de registro de vets).
 */
export function CommunitySection() {
  const navigate = useNavigate();

  const handleClick = (to: string) => {
    if (to.startsWith('mailto:') || to.startsWith('http')) {
      window.location.href = to;
    } else {
      navigate(to);
    }
  };

  return (
    <RevealSection
      as="section"
      id="comunidad"
      ariaLabelledby="comunidad-title"
      className="relative px-4 py-20 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pink-50/40 via-white to-amber-50/30" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="mb-12 text-center md:mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
            <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
            {COMMUNITY.badge}
          </span>
          <h2
            id="comunidad-title"
            className="mt-4 text-3xl font-black leading-[1.05] tracking-tight md:text-5xl"
          >
            {COMMUNITY.h2Lead}{' '}
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              {COMMUNITY.h2Highlight}
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            {COMMUNITY.sub}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COMMUNITY_CARDS.map(({ iconSrc, title, description, cta, to, accentFrom, accentTo }) => (
            <button
              key={title}
              type="button"
              onClick={() => handleClick(to)}
              className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentFrom} ${accentTo} shadow-md`}
              >
                <img
                  src={iconSrc}
                  alt=""
                  aria-hidden
                  className="h-6 w-6 brightness-0 invert"
                  loading="lazy"
                />
              </div>
              <h3 className="mb-1 text-base font-bold tracking-tight">{title}</h3>
              <p className="mb-3 text-sm leading-snug text-muted-foreground">{description}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                {cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>

        <p className="mt-10 text-center text-sm italic text-muted-foreground">{COMMUNITY.closer}</p>
      </div>
    </RevealSection>
  );
}
