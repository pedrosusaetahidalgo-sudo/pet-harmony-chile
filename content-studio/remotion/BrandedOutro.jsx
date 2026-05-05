import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const COLORS = {
  primary: '#9333EA',
  primaryDark: '#6B21A8',
  primaryLight: '#C084FC',
  white: '#FFFFFF',
  amber: '#FACC15',
};

const LOGO_REVERSE = 'brand/paw_friend_icon_reverse.svg';

// Outro v3 (2026-04-30): tono "ayúdanos / feedback / compartir".
// El video NO debe parecer producto terminado; es un beta que está naciendo.
// Estructura: logo grande → URL pill → 2 líneas de feedback/share → firma founder.
export function BrandedOutro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry spring para el logo
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const logoScale = interpolate(enter, [0, 1], [0.4, 1]);
  const logoOpacity = interpolate(enter, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' });

  // URL pill bounce (entra primero después del logo)
  const urlEnter = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, stiffness: 120 },
  });
  const urlScale = interpolate(urlEnter, [0, 1], [0.6, 1]);
  const urlOpacity = interpolate(urlEnter, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });

  // Línea 1 micro-CTA: "Probala y dime qué falla"
  const line1Enter = spring({
    frame: frame - 22,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const line1Y = interpolate(line1Enter, [0, 1], [24, 0]);
  const line1Opacity = interpolate(line1Enter, [0, 1], [0, 1]);

  // Línea 2 micro-CTA: "Compartila si te tinca"
  const line2Enter = spring({
    frame: frame - 32,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const line2Y = interpolate(line2Enter, [0, 1], [24, 0]);
  const line2Opacity = interpolate(line2Enter, [0, 1], [0, 1]);

  // Firma founder al final
  const sigEnter = spring({
    frame: frame - 44,
    fps,
    config: { damping: 18, stiffness: 80 },
  });
  const sigOpacity = interpolate(sigEnter, [0, 1], [0, 1]);

  // Pulse sutil en el logo
  const pulse = 1 + Math.sin((frame / fps) * 2.5) * 0.025;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, ${COLORS.primaryLight}33 0%, ${COLORS.primary} 35%, ${COLORS.primaryDark} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 32,
        padding: '0 60px',
      }}
    >
      {/* Logo grande con halo */}
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: 240,
          height: 240,
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${logoScale * pulse})`,
          opacity: logoOpacity,
        }}
      >
        {/* Halo */}
        <div
          style={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            filter: 'blur(40px)',
          }}
        />
        <img
          src={staticFile(LOGO_REVERSE)}
          width={240}
          height={240}
          style={{ display: 'block', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.35))' }}
          alt="Paw Friend"
        />
      </div>

      {/* URL Pill — wordmark grande */}
      <div
        style={{
          display: 'flex',
          background: 'white',
          color: COLORS.primaryDark,
          padding: '24px 56px',
          borderRadius: 999,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: '-1.5px',
          transform: `scale(${urlScale})`,
          opacity: urlOpacity,
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
      >
        pawfriend.cl
      </div>

      {/* Micro-CTA línea 1: feedback */}
      <div
        style={{
          display: 'flex',
          color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          textShadow: '0 3px 12px rgba(0,0,0,0.35)',
          transform: `translateY(${line1Y}px)`,
          opacity: line1Opacity,
          marginTop: 12,
        }}
      >
        Probala y dime qué falla.
      </div>

      {/* Micro-CTA línea 2: compartir */}
      <div
        style={{
          display: 'flex',
          color: COLORS.amber,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          textShadow: '0 3px 12px rgba(0,0,0,0.35)',
          transform: `translateY(${line2Y}px)`,
          opacity: line2Opacity,
          marginTop: -8,
        }}
      >
        Compartila si te tinca.
      </div>

      {/* Firma founder */}
      <div
        style={{
          display: 'flex',
          color: 'rgba(255,255,255,0.78)',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: '0.5px',
          opacity: sigOpacity,
          marginTop: 20,
        }}
      >
        — Pedro · Founder
      </div>
    </AbsoluteFill>
  );
}
