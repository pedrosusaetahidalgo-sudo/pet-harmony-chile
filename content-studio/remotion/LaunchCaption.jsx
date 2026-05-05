import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// Caption con padding generoso, esquinas redondeadas, sombra sutil,
// tipografia Inter. Spring entry, fade exit. Quality bar v3.
//
// Variantes:
//   variant: 'hero' (titulo grande), 'body' (texto medio), 'pill' (chip pequeno)
//   tone: 'light' (fondo blanco) | 'dark' (fondo morado) | 'glass' (translucido)
//   anchor: 'top' | 'center' | 'bottom'

const COLORS = {
  primary: '#9333EA',
  primaryDark: '#6B21A8',
  primaryLight: '#C084FC',
  ink: '#0F172A',
  white: '#FFFFFF',
  amber: '#FACC15',
};

const TONE_STYLES = {
  light: {
    bg: 'rgba(255,255,255,0.96)',
    color: COLORS.ink,
    border: 'rgba(147,51,234,0.18)',
  },
  dark: {
    bg: COLORS.primary,
    color: COLORS.white,
    border: 'rgba(255,255,255,0.18)',
  },
  glass: {
    bg: 'rgba(15,23,42,0.62)',
    color: COLORS.white,
    border: 'rgba(255,255,255,0.18)',
  },
};

const VARIANT_STYLES = {
  hero: {
    fontSize: 92,
    fontWeight: 900,
    letterSpacing: '-2px',
    lineHeight: 1.05,
    padding: '36px 48px',
    radius: 28,
  },
  body: {
    fontSize: 60,
    fontWeight: 800,
    letterSpacing: '-1px',
    lineHeight: 1.18,
    padding: '32px 40px',
    radius: 24,
  },
  pill: {
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
    padding: '20px 32px',
    radius: 999,
  },
};

const ANCHOR_STYLES = {
  top: { top: '14%', alignItems: 'flex-start' },
  center: { top: '42%', alignItems: 'center' },
  bottom: { bottom: '18%', alignItems: 'flex-end' },
};

/**
 * LaunchCaption — caption con quality bar v3.
 * Props:
 *   - children: contenido (string o nodes)
 *   - variant: 'hero' | 'body' | 'pill'
 *   - tone: 'light' | 'dark' | 'glass'
 *   - anchor: 'top' | 'center' | 'bottom'
 *   - emoji: opcional, emoji decorativo a la izquierda
 *   - delayFrames: cuando arranca su entrada (default 0)
 *   - holdFrames: cuanto tiempo se queda visible (default = duracion completa)
 *   - exitFrames: opcional, cuando empieza el fade-out (default = holdFrames - 9)
 */
export function LaunchCaption({
  children,
  variant = 'body',
  tone = 'light',
  anchor = 'center',
  emoji,
  delayFrames = 0,
  holdFrames,
  exitFrames,
}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const localFrame = frame - delayFrames;
  const totalHold = holdFrames ?? durationInFrames - delayFrames;
  const exitStart = exitFrames ?? totalHold - 9;

  if (localFrame < 0) return null;
  if (localFrame > totalHold) return null;

  // Spring entry: mass 1, damping 14 (per quality bar)
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, mass: 1, stiffness: 110 },
  });
  const enterOpacity = interpolate(enter, [0, 0.7], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const enterScale = interpolate(enter, [0, 1], [0.85, 1]);
  const enterY = interpolate(enter, [0, 1], [40, 0]);

  // Fade out (ease-out)
  const exitProgress = interpolate(
    localFrame,
    [exitStart, totalHold],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  // ease-out cubic
  const exitEased = 1 - Math.pow(1 - exitProgress, 3);
  const exitOpacity = 1 - exitEased;
  const exitY = exitEased * -16;

  const opacity = enterOpacity * exitOpacity;
  const translateY = enterY + exitY;

  const toneStyle = TONE_STYLES[tone];
  const variantStyle = VARIANT_STYLES[variant];
  const anchorStyle = ANCHOR_STYLES[anchor];

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 64px',
        pointerEvents: 'none',
        ...anchorStyle,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: toneStyle.bg,
          color: toneStyle.color,
          padding: variantStyle.padding,
          borderRadius: variantStyle.radius,
          boxShadow:
            tone === 'light'
              ? '0 12px 40px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.10)'
              : '0 16px 50px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)',
          border: `1px solid ${toneStyle.border}`,
          backdropFilter: tone === 'glass' ? 'blur(24px)' : undefined,
          maxWidth: 'calc(100% - 0px)',
          opacity,
          transform: `translateY(${translateY}px) scale(${enterScale})`,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: variantStyle.fontSize,
          fontWeight: variantStyle.fontWeight,
          letterSpacing: variantStyle.letterSpacing,
          lineHeight: variantStyle.lineHeight,
          textAlign: 'center',
          textWrap: 'balance',
        }}
      >
        {emoji && (
          <span
            style={{
              display: 'flex',
              fontSize: variantStyle.fontSize * 0.85,
              lineHeight: 1,
            }}
          >
            {emoji}
          </span>
        )}
        <span style={{ display: 'flex', whiteSpace: 'pre-wrap' }}>{children}</span>
      </div>
    </div>
  );
}
