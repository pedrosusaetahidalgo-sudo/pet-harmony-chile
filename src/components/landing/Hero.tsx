import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { ArrowRight, PawPrint, Play, Star } from '@/lib/icons';
import { HERO } from './content/copy';
import { HeroVideo } from './HeroVideo';
import { DemoModal } from './DemoModal';

/**
 * Hero v3 (Immersive). Cambios vs HeroV2:
 * - Visual: video real loopeando en vez de mockup CSS-only.
 * - CTA secundario abre modal demo (no scroll a sección).
 * - Trust signal sin números inflados (rating + linea genérica
 *   "comunidad pioneer" hasta tener metricas reales).
 * - Layout asimétrico 60/40 desktop, stack vertical mobile.
 */
export function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);

  const handlePrimary = () => navigate(user ? LINKS.home() : LINKS.auth());

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-gradient-to-b from-purple-50/60 via-white to-white"
    >
      {/* Blobs cálidos */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-purple-300/30 blur-[110px]" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-[30rem] w-[30rem] rounded-full bg-amber-200/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[22rem] w-[22rem] rounded-full bg-rose-200/30 blur-[100px]" />

      <div className="container relative mx-auto max-w-6xl px-4 py-12 md:py-24 lg:py-28">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12 lg:gap-16">
          {/* === Columna copy (queda primera en DOM = izquierda en grid) === */}
          <div className="flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
              <PawPrint className="h-3.5 w-3.5" />
              {HERO.badge}
            </span>

            <h1
              id="hero-title"
              className="mt-4 font-display font-semibold text-[2.5rem] leading-[1.02] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem]"
            >
              {HERO.h1Lead}{' '}
              <span className="bg-gradient-to-br from-purple-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                {HERO.h1Highlight}
              </span>
              <br className="hidden md:inline" />{' '}
              <span className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                {HERO.h1Tail}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:mt-6 md:text-xl">
              {HERO.sub}
            </p>

            {/* Visual mobile: entre subhead y CTAs */}
            <div className="mt-8 w-full md:hidden">
              <HeroVideo compact />
            </div>

            {/* CTAs */}
            <div className="mt-7 flex w-full flex-col gap-3 sm:max-w-md sm:flex-row md:mt-9">
              <Button
                size="lg"
                onClick={handlePrimary}
                className="h-14 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[0_20px_40px_-18px_rgba(147,51,234,0.55)] transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
              >
                {user ? HERO.ctaPrimaryAuth : HERO.ctaPrimary}
                <ArrowRight className="ml-1.5 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setDemoOpen(true)}
                className="h-14 rounded-2xl px-5 text-base font-semibold text-foreground hover:bg-foreground/5"
              >
                <Play className="mr-1.5 h-4 w-4 fill-current" />
                {HERO.ctaSecondary}
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">{HERO.microcopy}</p>

            {/* Bloque de confianza: rating + comunidad pioneer */}
            <div className="mt-7 flex items-center gap-3 md:mt-10">
              <div className="flex -space-x-2">
                {[
                  'from-amber-300 to-amber-500',
                  'from-rose-300 to-rose-500',
                  'from-purple-300 to-purple-500',
                  'from-sky-300 to-sky-500',
                ].map((grad, i) => (
                  <div
                    key={i}
                    className={`h-9 w-9 rounded-full border-2 border-background bg-gradient-to-br ${grad} shadow-sm`}
                    aria-hidden
                  />
                ))}
              </div>
              <div className="flex flex-col text-xs sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{HERO.trustRating}</span>
                  <span className="text-muted-foreground">comunidad pet lover</span>
                </span>
                <span className="text-muted-foreground">Sumándote desde Chile y Latam</span>
              </div>
            </div>
          </div>

          {/* === Columna visual desktop === */}
          <div className="relative hidden md:block">
            <HeroVideo />
          </div>
        </div>
      </div>

      {/* Demo modal */}
      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
}
