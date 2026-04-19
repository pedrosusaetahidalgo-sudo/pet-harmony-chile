import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { ArrowRight, Heart } from '@/lib/icons';
import { FINAL_CTA } from './content/copy';
import { RevealSection } from './RevealSection';

/**
 * CTA final emocional — masterplan §9.11 / §15.10.
 * Cierra el viaje con un solo botón y un microcopy que elimina objeciones.
 */
export function FinalCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <RevealSection
      as="section"
      id="cta-final"
      ariaLabelledby="cta-final-title"
      className="px-4 pb-20 pt-8"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-purple-600 to-fuchsia-600 px-6 py-16 text-center shadow-[0_40px_80px_-25px_rgba(147,51,234,0.5)] md:px-12 md:py-20">
          <div
            className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl"
            aria-hidden
          />

          <div className="relative">
            <Heart
              className="mx-auto mb-4 h-10 w-10 fill-white/90 text-white/90 drop-shadow"
              aria-hidden
            />
            <h2
              id="cta-final-title"
              className="mx-auto max-w-2xl text-3xl font-black leading-[1.05] tracking-tight text-white md:text-5xl"
            >
              {FINAL_CTA.h2Lead}
              <br />
              <span className="bg-gradient-to-r from-amber-200 via-rose-200 to-white bg-clip-text text-transparent">
                {FINAL_CTA.h2Highlight}
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/85 md:text-lg">
              {FINAL_CTA.body}
            </p>
            <Button
              size="lg"
              onClick={() => navigate(user ? LINKS.home() : LINKS.auth())}
              className="mt-8 h-14 rounded-2xl bg-white px-8 text-base font-bold text-primary shadow-xl hover:scale-[1.02] hover:bg-white/95"
            >
              {FINAL_CTA.cta}
              <ArrowRight className="ml-1.5 h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-white/80">{FINAL_CTA.microcopy}</p>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
