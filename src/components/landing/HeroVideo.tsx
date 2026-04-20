import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Syringe, PawPrint, Stethoscope } from '@/lib/icons';

/**
 * Visual del hero v3: device frame con video real loopeando + 2 cards
 * flotantes con datos del producto. Reemplaza el mockup CSS-only del
 * HeroV2 (ver masterplan §8).
 *
 * Implementación:
 * - Video lazy: solo arranca cuando el componente entra en viewport.
 * - Poster fallback: imagen estática mientras carga (evita CLS).
 * - prefers-reduced-motion: si el usuario lo prefiere, mostramos solo poster.
 * - playsInline + muted: requerido para autoPlay en iOS Safari.
 *
 * NOTA: el video actual `hero-pet.mp4` (2.4 MB) es genérico (peludos).
 * Cuando exista un video específico del producto, reemplazar src.
 */
export function HeroVideo({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setReducedMotion(reduced);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const video = videoRef.current;
    const container = ref.current;
    if (!video || !container || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Algunos navegadores bloquean autoplay aunque sea muted (iOS bajo low-power).
              // Silencioso: el poster sigue visible.
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={`relative mx-auto w-full ${compact ? 'max-w-[280px]' : 'max-w-[420px] md:max-w-[460px]'}`}
    >
      {/* Device frame */}
      <div
        className={`relative bg-neutral-900 shadow-[0_50px_100px_-20px_rgba(147,51,234,0.4)] ${
          compact
            ? 'rounded-[2rem] border-[7px] border-neutral-900'
            : 'rounded-[2.5rem] border-[10px] border-neutral-900'
        }`}
      >
        <div
          className={`overflow-hidden bg-black ${compact ? 'rounded-[1.4rem]' : 'rounded-[1.8rem]'}`}
        >
          <div className="relative aspect-[9/19.5] w-full">
            {reducedMotion ? (
              <img
                src="/paw-friend-assets-v2/social/og_image.jpg"
                alt="Paw Friend"
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                preload="metadata"
                poster="/paw-friend-assets-v2/social/og_image.jpg"
                aria-hidden="true"
              >
                <source src="/videos/hero-pet.mp4" type="video/mp4" />
              </video>
            )}

            {/* Overlay degradado para legibilidad de cards */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Badge "Paw Friend" abajo dentro del frame */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-md">
                  <PawPrint className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                    Paw Friend
                  </p>
                  <p className="truncate text-sm font-bold text-foreground">
                    La salud de tu peludo
                  </p>
                </div>
              </div>
              <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-500" />
            </div>
          </div>
        </div>
        {/* Notch */}
        <div
          className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-b-xl bg-neutral-900 ${
            compact ? 'h-3 w-16' : 'h-4 w-24'
          }`}
        />
      </div>

      {/* Card flotante: próxima vacuna */}
      <div
        className={`${
          compact ? 'hidden' : 'md:flex'
        } absolute -left-8 top-24 hidden items-center gap-2.5 rounded-2xl bg-white p-3 pr-4 shadow-[0_20px_40px_-12px_rgba(251,146,60,0.4)] ring-1 ring-black/5`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Syringe className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
            Próxima vacuna
          </p>
          <p className="text-sm font-bold text-foreground">En 6 días</p>
        </div>
      </div>

      {/* Card flotante: vet verificado cerca */}
      <div
        className={`${
          compact ? 'hidden' : 'md:flex'
        } absolute -right-8 bottom-20 hidden items-center gap-2.5 rounded-2xl bg-white p-3 pr-4 shadow-[0_20px_40px_-12px_rgba(168,85,247,0.4)] ring-1 ring-black/5`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
            Vet verificado
          </p>
          <p className="text-sm font-bold text-foreground">A 1,2 km</p>
        </div>
      </div>
    </div>
  );
}
