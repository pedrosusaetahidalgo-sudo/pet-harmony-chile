import { useEffect, useRef, useCallback } from 'react';

interface GyroscopeValues {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

/**
 * Hook que lee DeviceOrientation en mobile para simular el efecto
 * holografico de tilt/glow que en desktop se hace con el mouse.
 * Aplica los CSS vars --tcg-glow-x/y y --tcg-rotate-x/y al elemento ref.
 */
export function useGyroscope(cardRef: React.RefObject<HTMLDivElement | null>) {
  const lastValues = useRef<GyroscopeValues>({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0; // -180..180 (front-back tilt)
      const gamma = e.gamma ?? 0; // -90..90  (left-right tilt)

      // Normalize to -1..1 range, clamped
      const x = Math.max(-1, Math.min(1, gamma / 45));
      const y = Math.max(-1, Math.min(1, (beta - 45) / 45));

      lastValues.current = { x, y };

      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        const card = cardRef.current;
        if (!card) {
          rafId.current = 0;
          return;
        }

        const { x: lx, y: ly } = lastValues.current;
        const rotateY = lx * 12;
        const rotateX = -ly * 12;
        const glowX = (((lx + 1) / 2) * 100).toFixed(1);
        const glowY = (((ly + 1) / 2) * 100).toFixed(1);

        card.style.setProperty('--tcg-rotate-x', `${rotateX}deg`);
        card.style.setProperty('--tcg-rotate-y', `${rotateY}deg`);
        card.style.setProperty('--tcg-glow-x', `${glowX}%`);
        card.style.setProperty('--tcg-glow-y', `${glowY}%`);
        rafId.current = 0;
      });
    },
    [cardRef]
  );

  useEffect(() => {
    // Only on touch devices without fine pointer (mobile)
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (!isMobile || !('DeviceOrientationEvent' in window)) return;

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [handleOrientation]);
}
