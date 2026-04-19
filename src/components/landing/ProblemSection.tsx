import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { ArrowRight, Heart, Moon } from '@/lib/icons';
import { PROBLEM } from './content/copy';
import { RevealSection } from './RevealSection';

/**
 * Sección "Problema" — storytelling cinematográfico (masterplan §9.4 / §15.3).
 *
 * Genera la urgencia emocional sin culpar al dueño. Usa background dark
 * con scrim + emoji nocturno para fijar el momento "3 AM".
 *
 * Diseño visual: bloque oscuro con vinieta tipo cine, headline grande
 * en blanco, body suave, CTA final emocional.
 */
export function ProblemSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <RevealSection
      as="section"
      id="problema"
      ariaLabelledby="problema-title"
      className="relative isolate overflow-hidden px-4 py-20 md:py-28"
    >
      {/* Fondo dark con blobs sutiles */}
      <div className="absolute inset-0 -z-10 bg-neutral-950" />
      <div className="absolute -top-32 -right-24 -z-10 h-96 w-96 rounded-full bg-purple-700/30 blur-[120px]" />
      <div className="absolute -bottom-32 -left-24 -z-10 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />

      <div className="container mx-auto max-w-4xl text-center text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-white/20 backdrop-blur">
          <Heart className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
          {PROBLEM.badge}
        </span>

        <h2
          id="problema-title"
          className="mt-6 font-display font-semibold text-4xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
        >
          {PROBLEM.h2Line1}
          <br />
          <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-purple-400 bg-clip-text text-transparent">
            {PROBLEM.h2Line2}
          </span>
        </h2>

        {/* Reloj decorativo */}
        <div className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur">
          <Moon className="h-4 w-4 text-amber-300" />
          <span className="font-mono text-sm tracking-widest text-white/80">03:14 AM</span>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
          {PROBLEM.body}
        </p>

        <p className="mx-auto mt-5 max-w-xl text-base font-semibold text-white md:text-lg">
          {PROBLEM.closer}
        </p>

        <Button
          size="lg"
          onClick={() => navigate(user ? LINKS.myPets() : LINKS.auth())}
          className="mt-9 h-14 rounded-2xl bg-white px-8 text-base font-bold text-neutral-950 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.4)] hover:scale-[1.02] hover:bg-white/95"
        >
          {PROBLEM.cta}
          <ArrowRight className="ml-1.5 h-5 w-5" />
        </Button>

        <p className="mt-8 text-xs text-white/50">{PROBLEM.source}</p>
      </div>
    </RevealSection>
  );
}
