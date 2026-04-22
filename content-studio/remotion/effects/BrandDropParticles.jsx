import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';

// Huellas + mini wordmarks cayendo del cielo (sutiles).
// Refuerzan brand sin distraer.

const PAW_SVG = (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15.5c-2 0-4.5 1.3-4.5 3.7 0 1 .6 1.8 1.6 1.8.7 0 1.3-.3 2-.5.4-.1.7-.2.9-.2s.5.1.9.2c.7.2 1.3.5 2 .5 1 0 1.6-.8 1.6-1.8 0-2.4-2.5-3.7-4.5-3.7zM7 13.5c1.1 0 2-1.3 2-2.9s-.9-2.9-2-2.9-2 1.3-2 2.9S5.9 13.5 7 13.5zm10 0c1.1 0 2-1.3 2-2.9s-.9-2.9-2-2.9-2 1.3-2 2.9.9 2.9 2 2.9zM9.5 9c1.1 0 2-1.2 2-2.7S10.6 3.6 9.5 3.6s-2 1.2-2 2.7S8.4 9 9.5 9zm5 0c1.1 0 2-1.2 2-2.7s-.9-2.7-2-2.7-2 1.2-2 2.7.9 2.7 2 2.7z"/>
  </svg>
);

// 12 particulas mezcla huella + wordmark, distribuidas.
// Las primeras 3 son wordmarks, el resto huellas.
const PARTICLES = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  kind: i < 3 ? 'wordmark' : 'paw',
  x: (i * 167) % 1080,
  speed: 0.35 + (i % 5) * 0.12,
  phase: i * 0.8,
  size: i < 3 ? 100 + (i * 12) : 32 + (i % 4) * 18,
  opacity: i < 3 ? 0.06 + (i % 3) * 0.02 : 0.07 + (i % 3) * 0.03,
  rotate: (i * 43) % 360,
  color: i % 2 === 0 ? 'white' : '#C084FC', // white o primary-light
}));

export function BrandDropParticles() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const wordmarkUrl = staticFile('brand/paw_friend_wordmark_horizontal.svg');

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {PARTICLES.map((p) => {
        const t = (frame / fps) * p.speed + p.phase;
        // Caen: empiezan fuera arriba y bajan. Cycle loop.
        const yRaw = -200 + ((t * 140) % 2400);
        const driftX = Math.sin(t * 0.9) * 40;
        // Rotación lenta
        const rot = p.rotate + t * 15;

        if (p.kind === 'wordmark') {
          return (
            <img
              key={p.id}
              src={wordmarkUrl}
              alt=""
              style={{
                position: 'absolute',
                left: p.x + driftX,
                top: yRaw,
                width: p.size * 3,
                height: p.size,
                opacity: p.opacity,
                transform: `rotate(${rot}deg)`,
                filter: 'brightness(1.3)',
                display: 'block',
              }}
            />
          );
        }

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x + driftX,
              top: yRaw,
              width: p.size,
              height: p.size,
              color: p.color,
              opacity: p.opacity,
              transform: `rotate(${rot}deg)`,
              display: 'flex',
            }}
          >
            {PAW_SVG}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
