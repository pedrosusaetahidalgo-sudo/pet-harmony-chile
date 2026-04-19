import { useEffect, useRef, useState } from 'react';

/**
 * Detecta cuando un elemento entra al viewport. Usado por <RevealSection>
 * para fade-in progresivo y por <CountUp> para iniciar la animación solo
 * cuando el bloque es visible.
 *
 * - `freezeOnceVisible`: true por default (no re-trigger al salir/entrar).
 * - `threshold`: porcentaje del elemento visible para activar (0.15 = 15%).
 * - `rootMargin`: margen extra para anticipar (px o %).
 *
 * Respeta `prefers-reduced-motion`: si el usuario lo prefiere, el hook
 * marca `isVisible=true` inmediatamente para que las animaciones de entrada
 * no rompan el flujo (el componente que las consume puede saltar la animación).
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: {
    threshold?: number;
    rootMargin?: string;
    freezeOnceVisible?: boolean;
  } = {}
) {
  const { threshold = 0.15, rootMargin = '0px', freezeOnceVisible = true } = options;
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      // SSR / browser sin soporte: mostramos sin animación para no romper.
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (freezeOnceVisible) observer.unobserve(entry.target);
          } else if (!freezeOnceVisible) {
            setIsVisible(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, freezeOnceVisible]);

  return { ref, isVisible } as const;
}
