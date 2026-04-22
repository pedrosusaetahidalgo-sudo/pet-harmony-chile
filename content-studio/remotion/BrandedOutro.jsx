import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const COLORS = {
  primary: '#9333EA',
  primaryDark: '#6B21A8',
  primaryLight: '#C084FC',
  white: '#FFFFFF',
  amber: '#FACC15',
};

const LOGO_REVERSE = 'brand/paw_friend_icon_reverse.svg';

export function BrandedOutro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry spring
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const logoScale = interpolate(enter, [0, 1], [0.4, 1]);
  const logoOpacity = interpolate(enter, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' });

  // Texto baja con delay
  const textEnter = spring({
    frame: frame - 10,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const textY = interpolate(textEnter, [0, 1], [40, 0]);
  const textOpacity = interpolate(textEnter, [0, 1], [0, 1]);

  // URL pill bounce
  const urlEnter = spring({
    frame: frame - 20,
    fps,
    config: { damping: 10, stiffness: 120 },
  });
  const urlScale = interpolate(urlEnter, [0, 1], [0.6, 1]);
  const urlOpacity = interpolate(urlEnter, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });

  // Pulse sutil en el logo
  const pulse = 1 + Math.sin((frame / fps) * 2.5) * 0.025;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, ${COLORS.primaryLight}33 0%, ${COLORS.primary} 35%, ${COLORS.primaryDark} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 40,
        padding: '0 60px',
      }}
    >
      {/* Logo grande con halo */}
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: 280,
          height: 280,
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
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            filter: 'blur(40px)',
          }}
        />
        <img
          src={staticFile(LOGO_REVERSE)}
          width={280}
          height={280}
          style={{ display: 'block', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.35))' }}
          alt="Paw Friend"
        />
      </div>

      {/* Wordmark texto */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: '-3px',
            textShadow: '0 4px 20px rgba(0,0,0,0.35)',
          }}
        >
          Paw Friend
        </div>
        <div
          style={{
            display: 'flex',
            color: COLORS.amber,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          Gratis. Siempre.
        </div>
      </div>

      {/* URL Pill */}
      <div
        style={{
          display: 'flex',
          background: 'white',
          color: COLORS.primaryDark,
          padding: '28px 60px',
          borderRadius: 999,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 52,
          fontWeight: 900,
          letterSpacing: '-1px',
          transform: `scale(${urlScale})`,
          opacity: urlOpacity,
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          marginTop: 8,
        }}
      >
        pawfriend.cl
      </div>
    </AbsoluteFill>
  );
}
