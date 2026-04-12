import { Button } from '@/components/ui/button';
import {
  PawPrint,
  Sparkles,
  Star,
  ShieldCheck,
  Syringe,
  MapPin,
  BadgeCheck,
  ArrowRight,
} from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';

/**
 * HeroV2 — Concepto A "Ficha viva" del blueprint landing-redesign.
 *
 * - Split layout 55/45 en desktop (copy izq, device frame + tarjetas flotantes der).
 * - En mobile: badge → H1 → subhead → visual → CTA primario → CTA ghost → bloque confianza.
 * - Sin 3er CTA de vets, sin fine print de precios, headline ≤ 7 palabras.
 * - El visual es un mockup puro CSS de la ficha clínica (evita stock genérico).
 */
const HeroV2 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePrimary = () => navigate(user ? LINKS.home() : LINKS.auth());
  const handleSecondary = () => {
    const el = document.getElementById('como-funciona');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-hero-gradient">
      {/* Blobs cálidos de fondo */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-amber-300/25 blur-[110px]" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[22rem] w-[22rem] rounded-full bg-rose-300/20 blur-[100px]" />

      <div className="container relative mx-auto max-w-6xl px-4 py-10 md:py-24 lg:py-28">
        <div className="grid items-center gap-8 md:grid-cols-[1.15fr_0.85fr] md:gap-10 lg:gap-16">
          {/* === Columna copy === */}
          <div className="order-1 flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
              <PawPrint className="h-3.5 w-3.5" />
              Hecho en Chile
            </span>

            <h1
              id="hero-title"
              className="mt-3 text-[2rem] font-black leading-[1.05] tracking-tight sm:text-4xl md:text-6xl lg:text-7xl"
            >
              La salud de tu mascota,{' '}
              <span className="bg-warm-gradient bg-clip-text text-transparent">
                en un solo lugar.
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base md:mt-5 md:text-xl">
              Ficha clínica digital, recordatorios automáticos y veterinarios verificados cerca de
              ti.
            </p>

            {/* Visual mobile: va entre subhead y CTAs (regla 3.6) */}
            <div className="order-none mt-5 w-full md:hidden">
              <HeroVisual compact />
            </div>

            <div className="mt-5 flex w-full flex-col gap-3 sm:max-w-md sm:flex-row md:mt-8">
              <Button
                size="lg"
                onClick={handlePrimary}
                className="h-12 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[0_20px_40px_-18px_rgba(251,146,60,0.55)] transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98] sm:h-14"
              >
                {user ? 'Ir al Inicio' : 'Crear cuenta gratis'}
                <ArrowRight className="ml-1.5 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handleSecondary}
                className="h-12 rounded-2xl px-5 text-base font-semibold text-foreground hover:bg-foreground/5 sm:h-14"
              >
                Ver cómo funciona
              </Button>
            </div>

            {/* Bloque de confianza compacto: avatares + rating */}
            <div className="mt-5 flex items-center gap-3 md:mt-8">
              <div className="flex -space-x-2">
                {[
                  'from-amber-300 to-amber-500',
                  'from-rose-300 to-rose-500',
                  'from-purple-300 to-purple-500',
                  'from-sky-300 to-sky-500',
                ].map((grad, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br ${grad} shadow-sm sm:h-9 sm:w-9`}
                    aria-hidden
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">4.9</span>
                <span className="text-muted-foreground">· +1.200 dueños en Chile</span>
              </div>
            </div>
          </div>

          {/* === Columna visual desktop === */}
          <div className="relative hidden md:block">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Mockup del device frame con ficha clínica simulada + tarjetas flotantes.
 * Todo CSS/JSX puro para evitar dependencia de imágenes/stock.
 */
const HeroVisual = ({ compact = false }: { compact?: boolean }) => {
  return (
    <div
      className={`relative mx-auto w-full ${compact ? 'max-w-[260px]' : 'max-w-[340px] md:max-w-[380px]'}`}
    >
      {/* Device frame */}
      <div
        className={`relative bg-neutral-900 shadow-[0_40px_80px_-20px_rgba(168,85,247,0.35)] ${compact ? 'rounded-[1.8rem] border-[6px] border-neutral-900' : 'rounded-[2.4rem] border-[10px] border-neutral-900'}`}
      >
        <div
          className={`overflow-hidden bg-gradient-to-b from-purple-50 via-white to-amber-50 ${compact ? 'rounded-[1.2rem]' : 'rounded-[1.6rem]'}`}
        >
          {/* Status bar fake */}
          <div
            className={`flex items-center justify-between text-[10px] font-semibold text-neutral-700 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}
          >
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
            </span>
          </div>

          {/* Header mascota */}
          <div className={compact ? 'px-3 pb-2 pt-0.5' : 'px-4 pb-3 pt-1'}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Ficha clínica
            </p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <div
                className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-rose-400 text-white shadow-md ${compact ? 'h-9 w-9' : 'h-12 w-12'}`}
              >
                <PawPrint className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
              </div>
              <div>
                <p
                  className={`font-bold leading-tight text-foreground ${compact ? 'text-sm' : 'text-base'}`}
                >
                  Firulais
                </p>
                <p className="text-[10px] text-muted-foreground">Beagle · 4 años</p>
              </div>
              <BadgeCheck className="ml-auto h-4 w-4 text-emerald-500" />
            </div>
          </div>

          {/* Stats row */}
          <div
            className={`mx-3 grid grid-cols-3 gap-1.5 rounded-xl bg-white/80 text-center shadow-sm ring-1 ring-black/5 ${compact ? 'p-1.5' : 'mx-4 gap-2 p-2'}`}
          >
            <div>
              <p className={`font-bold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>12</p>
              <p className="text-[8px] text-muted-foreground">Controles</p>
            </div>
            <div>
              <p className={`font-bold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>6</p>
              <p className="text-[8px] text-muted-foreground">Vacunas</p>
            </div>
            <div>
              <p className={`font-bold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>0</p>
              <p className="text-[8px] text-muted-foreground">Alergias</p>
            </div>
          </div>

          {/* Lista historial — en mobile compact solo 2 filas */}
          <div className={`space-y-1.5 ${compact ? 'mt-2 px-3 pb-3' : 'mt-3 space-y-2 px-4 pb-5'}`}>
            {[
              {
                icon: Syringe,
                title: 'Vacuna séxtuple',
                date: '12 mar · Dra. Paulina',
                tone: 'bg-emerald-100 text-emerald-600',
              },
              {
                icon: ShieldCheck,
                title: 'Desparasitación',
                date: '28 feb · Dr. Rodrigo',
                tone: 'bg-amber-100 text-amber-600',
              },
              ...(!compact
                ? [
                    {
                      icon: MapPin,
                      title: 'Control anual',
                      date: '15 ene · Vetcentro',
                      tone: 'bg-purple-100 text-purple-600',
                    },
                  ]
                : []),
            ].map(({ icon: Icon, title, date, tone }) => (
              <div
                key={title}
                className={`flex items-center gap-2.5 rounded-xl bg-white/70 ring-1 ring-black/5 ${compact ? 'p-2' : 'gap-3 p-2.5'}`}
              >
                <div
                  className={`flex shrink-0 items-center justify-center rounded-lg ${tone} ${compact ? 'h-7 w-7' : 'h-8 w-8'}`}
                >
                  <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-foreground">{title}</p>
                  <p className="truncate text-[9px] text-muted-foreground">{date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Notch simulado */}
        <div
          className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-b-xl bg-neutral-900 ${compact ? 'h-3 w-14' : 'h-4 w-20'}`}
        />
      </div>

      {/* Tarjetas flotantes */}
      <div
        className={`absolute -left-6 top-24 hidden rounded-2xl bg-white p-3 pr-4 shadow-[0_18px_40px_-12px_rgba(251,146,60,0.35)] ring-1 ring-black/5 ${compact ? 'hidden' : 'md:block'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Syringe className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
              Próxima vacuna
            </p>
            <p className="text-xs font-bold text-foreground">En 6 días</p>
          </div>
        </div>
      </div>

      <div
        className={`${compact ? 'right-2 -bottom-4' : 'md:-right-6 md:bottom-16'} absolute rounded-2xl bg-white p-3 pr-4 shadow-[0_18px_40px_-12px_rgba(168,85,247,0.35)] ring-1 ring-black/5`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <BadgeCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
              Vet verificado
            </p>
            <p className="text-xs font-bold text-foreground">A 1,2 km</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroV2;
