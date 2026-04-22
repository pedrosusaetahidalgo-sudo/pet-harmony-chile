import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// Etiqueta "lower-third" estilo TV que entra desde la izquierda al inicio
// de cada escena. Refuerza la estructura narrativa.
// Labels por kind:
//   hook    → "ESCUCHA"
//   context → "ASÍ ES"
//   punch   → "CRISIS" | "PROBLEMA"
//   cta     → "SOLUCIÓN"

const LABELS = {
  hook: 'ESCUCHA',
  context: 'EL CONTEXTO',
  punch: 'EL PROBLEMA',
  cta: 'LA SOLUCIÓN',
};

export function ChyronLabel({ kind, customLabel, accent = '#FACC15' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry spring desde la izquierda
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const x = interpolate(enter, [0, 1], [-300, 0]);
  const opacity = interpolate(enter, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' });

  // Exit hacia la izquierda al segundo 2 (solo visible al inicio)
  const exitAt = fps * 2;
  const exitProgress = interpolate(frame, [exitAt, exitAt + fps * 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitX = interpolate(exitProgress, [0, 1], [0, -400]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  const label = customLabel ?? LABELS[kind] ?? '';
  if (!label) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 150,
        left: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 22px',
        background: 'rgba(15,23,42,0.88)',
        borderLeft: `5px solid ${accent}`,
        borderRadius: '4px 999px 999px 4px',
        transform: `translateX(${x + exitX}px)`,
        opacity: opacity * exitOpacity,
        pointerEvents: 'none',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 12px ${accent}`,
        }}
      />
      <div
        style={{
          display: 'flex',
          color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}
