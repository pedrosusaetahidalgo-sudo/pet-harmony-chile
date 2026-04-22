import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Flash blanco brevisimo al inicio (estilo TikTok hook trigger).
// Dura 2 frames a full y se desvanece en 6 frames.
export function BrandFlash({ intensity = 0.85 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Solo visible los primeros ~200ms
  if (frame > fps * 0.3) return null;

  const opacity = interpolate(
    frame,
    [0, 2, fps * 0.3],
    [intensity, intensity, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'white',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
}
