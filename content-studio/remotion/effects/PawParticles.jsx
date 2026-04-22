import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';

// Huellas 🐾 flotantes ambient (muy sutiles) usando SVG pawprint paths.
// No distrae, refuerza brand.

const PATHS = Array.from({ length: 8 }).map((_, i) => ({
  id: i,
  startX: (i * 137) % 1080,
  speed: 0.3 + (i % 4) * 0.15,
  phase: i * 0.6,
  size: 28 + (i % 3) * 14,
  opacity: 0.05 + (i % 3) * 0.03,
  rotate: (i * 37) % 360,
}));

// SVG minimalista de pata (inline para no depender de assets externos)
const pawPath = (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15.5c-2 0-4.5 1.3-4.5 3.7 0 1 .6 1.8 1.6 1.8.7 0 1.3-.3 2-.5.4-.1.7-.2.9-.2s.5.1.9.2c.7.2 1.3.5 2 .5 1 0 1.6-.8 1.6-1.8 0-2.4-2.5-3.7-4.5-3.7zM7 13.5c1.1 0 2-1.3 2-2.9s-.9-2.9-2-2.9-2 1.3-2 2.9S5.9 13.5 7 13.5zm10 0c1.1 0 2-1.3 2-2.9s-.9-2.9-2-2.9-2 1.3-2 2.9.9 2.9 2 2.9zM9.5 9c1.1 0 2-1.2 2-2.7S10.6 3.6 9.5 3.6s-2 1.2-2 2.7S8.4 9 9.5 9zm5 0c1.1 0 2-1.2 2-2.7s-.9-2.7-2-2.7-2 1.2-2 2.7.9 2.7 2 2.7z"/>
  </svg>
);

export function PawParticles() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {PATHS.map((p) => {
        const t = (frame / fps) * p.speed + p.phase;
        const y = 1920 - ((t * 120) % 2400); // sube de abajo hacia arriba
        const driftX = Math.sin(t * 1.2) * 30;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.startX + driftX,
              top: y,
              width: p.size,
              height: p.size,
              color: 'white',
              opacity: p.opacity,
              transform: `rotate(${p.rotate + t * 20}deg)`,
              display: 'flex',
            }}
          >
            {pawPath}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
