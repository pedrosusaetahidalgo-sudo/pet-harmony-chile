import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// Mockup programatico de la app Paw Friend dentro de un iPhone frame.
// Brand-compliant, sin screenshots reales (no requiere Puppeteer).
// Variantes: 'home' | 'ficha' | 'recordatorios'

const COLORS = {
  primary: '#9333EA',
  primaryDark: '#6B21A8',
  primaryLight: '#C084FC',
  ink: '#0F172A',
  inkSoft: '#334155',
  muted: '#64748B',
  bg: '#FAF5FF',
  white: '#FFFFFF',
  success: '#10B981',
  amber: '#F59E0B',
  danger: '#EF4444',
};

function IPhoneFrame({ children, scale = 1 }) {
  // iPhone 15 proporciones: 393x852 pero escalado al area del reel 1080x1920
  const WIDTH = 640 * scale;
  const HEIGHT = 1300 * scale;
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: WIDTH,
        height: HEIGHT,
        borderRadius: 76 * scale,
        background: '#0A0A0A',
        padding: 12 * scale,
        boxShadow: `
          0 50px 100px rgba(0,0,0,0.55),
          0 20px 40px rgba(0,0,0,0.35),
          inset 0 0 0 3px #222,
          inset 0 0 0 6px #0a0a0a
        `,
      }}
    >
      {/* Screen */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          borderRadius: 64 * scale,
          background: COLORS.white,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Dynamic Island */}
        <div
          style={{
            position: 'absolute',
            top: 16 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 140 * scale,
            height: 38 * scale,
            background: '#000',
            borderRadius: 99,
            zIndex: 100,
          }}
        />
        {/* StatusBar global (evita duplicacion cuando se apilan vistas) */}
        <StatusBar scale={scale} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusBar({ scale = 1 }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 54 * scale,
        padding: `0 ${40 * scale}px 0 ${44 * scale}px`,
        fontFamily: 'Inter, sans-serif',
        fontSize: 20 * scale,
        fontWeight: 700,
        color: COLORS.ink,
      }}
    >
      <div style={{ display: 'flex' }}>9:41</div>
      <div style={{ display: 'flex' }} />
    </div>
  );
}

function HomeView({ scale = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${32 * scale}px ${28 * scale}px ${20 * scale}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 * scale }}>
          <img src={staticFile('brand/paw_friend_icon_principal.svg')} width={44 * scale} height={44 * scale} />
          <div
            style={{
              display: 'flex',
              fontFamily: 'Inter, sans-serif',
              fontSize: 22 * scale,
              fontWeight: 800,
              color: COLORS.ink,
            }}
          >
            Paw Friend
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: 40 * scale,
            height: 40 * scale,
            borderRadius: '50%',
            background: COLORS.bg,
          }}
        />
      </div>

      {/* Pet card (Kai) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          margin: `0 ${28 * scale}px ${20 * scale}px`,
          padding: 24 * scale,
          borderRadius: 24 * scale,
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          color: 'white',
          boxShadow: `0 12px 32px rgba(147,51,234,0.35)`,
          gap: 16 * scale,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 * scale }}>
          <div
            style={{
              display: 'flex',
              width: 64 * scale,
              height: 64 * scale,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32 * scale,
            }}
          >
            🐶
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * scale }}>
            <div
              style={{
                display: 'flex',
                fontFamily: 'Inter, sans-serif',
                fontSize: 26 * scale,
                fontWeight: 800,
              }}
            >
              Kai
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'Inter, sans-serif',
                fontSize: 15 * scale,
                opacity: 0.88,
              }}
            >
              Pastor suizo · 3 años
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 * scale, flexWrap: 'wrap' }}>
          {['✓ Vacunas al día', '✓ 28.5 kg', '✓ Antipulgas'].map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.18)',
                padding: `${8 * scale}px ${14 * scale}px`,
                borderRadius: 99,
                fontSize: 14 * scale,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Recordatorios section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `0 ${28 * scale}px`,
          gap: 12 * scale,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Inter, sans-serif',
            fontSize: 18 * scale,
            fontWeight: 800,
            color: COLORS.ink,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Próximos recordatorios
        </div>
        {[
          { icon: '💉', title: 'Vacuna polivalente', date: 'Mañana · 10:00', color: COLORS.amber },
          { icon: '🦴', title: 'Antiparasitario', date: 'En 5 días', color: COLORS.success },
          { icon: '🩺', title: 'Control anual', date: 'En 2 semanas', color: COLORS.primary },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16 * scale,
              padding: 16 * scale,
              borderRadius: 16 * scale,
              background: COLORS.white,
              border: `1px solid ${COLORS.bg}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 44 * scale,
                height: 44 * scale,
                borderRadius: 12 * scale,
                background: r.color + '22',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22 * scale,
              }}
            >
              {r.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * scale, flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 16 * scale,
                  fontWeight: 700,
                  color: COLORS.ink,
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13 * scale,
                  color: COLORS.muted,
                }}
              >
                {r.date}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom tab bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: 'auto',
          padding: `${16 * scale}px 0 ${28 * scale}px`,
          borderTop: `1px solid ${COLORS.bg}`,
          background: COLORS.white,
        }}
      >
        {['🏠', '🐾', '📅', '👤'].map((icon, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              fontSize: 24 * scale,
              opacity: i === 0 ? 1 : 0.45,
            }}
          >
            {icon}
          </div>
        ))}
      </div>
    </div>
  );
}

function FichaView({ scale = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Header con back */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16 * scale,
          padding: `${24 * scale}px ${28 * scale}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 40 * scale,
            height: 40 * scale,
            borderRadius: '50%',
            background: COLORS.bg,
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20 * scale,
            color: COLORS.ink,
          }}
        >
          ‹
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Inter, sans-serif',
            fontSize: 20 * scale,
            fontWeight: 800,
            color: COLORS.ink,
          }}
        >
          Ficha clínica · Kai
        </div>
      </div>
      {/* Vital signs */}
      <div
        style={{
          display: 'flex',
          gap: 12 * scale,
          padding: `0 ${28 * scale}px ${20 * scale}px`,
        }}
      >
        {[
          { label: 'Peso', value: '28.5', unit: 'kg', color: COLORS.primary },
          { label: 'Edad', value: '3', unit: 'años', color: COLORS.amber },
          { label: 'Raza', value: 'Pastor', unit: 'suizo', color: COLORS.success },
        ].map((v, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: 14 * scale,
              background: COLORS.bg,
              borderRadius: 16 * scale,
              gap: 4 * scale,
            }}
          >
            <div style={{ display: 'flex', fontFamily: 'Inter, sans-serif', fontSize: 11 * scale, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
              {v.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 * scale }}>
              <div style={{ display: 'flex', fontFamily: 'Inter, sans-serif', fontSize: 24 * scale, fontWeight: 900, color: v.color }}>{v.value}</div>
              <div style={{ display: 'flex', fontFamily: 'Inter, sans-serif', fontSize: 12 * scale, color: COLORS.muted }}>{v.unit}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: `0 ${28 * scale}px`, gap: 12 * scale, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Inter, sans-serif',
            fontSize: 16 * scale,
            fontWeight: 800,
            color: COLORS.ink,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Historial médico
        </div>
        {[
          { date: '15 Abr', title: 'Vacuna polivalente', tag: 'Aplicada', color: COLORS.success },
          { date: '28 Mar', title: 'Control anual', tag: 'Sano', color: COLORS.primary },
          { date: '10 Mar', title: 'Antiparasitario', tag: 'Próxima: 10 Abr', color: COLORS.amber },
          { date: '02 Feb', title: 'Alergia al pollo', tag: 'Crónico', color: COLORS.danger },
        ].map((ev, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14 * scale,
              padding: `${12 * scale}px ${14 * scale}px`,
              borderRadius: 12 * scale,
              background: COLORS.white,
              border: `1px solid ${COLORS.bg}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 4 * scale,
                height: 40 * scale,
                borderRadius: 2,
                background: ev.color,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 * scale }}>
              <div style={{ display: 'flex', fontFamily: 'Inter, sans-serif', fontSize: 14 * scale, fontWeight: 800, color: COLORS.ink }}>{ev.title}</div>
              <div style={{ display: 'flex', gap: 8 * scale, fontFamily: 'Inter, sans-serif', fontSize: 11 * scale, color: COLORS.muted }}>
                <span>{ev.date}</span>
                <span>·</span>
                <span style={{ color: ev.color, fontWeight: 700 }}>{ev.tag}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 60 * scale }} />
    </div>
  );
}

// Vista scrolleable: apila HomeView + FichaView + mas contenido y anima scroll
function ScrollingFullView({ scale = 1 }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Delay inicial (0.6s estatico) + scroll suave durante el resto.
  const startFrame = Math.round(fps * 0.6);
  const scrollFrames = durationInFrames - startFrame - Math.round(fps * 0.2);
  const progress = Math.max(0, Math.min(1, (frame - startFrame) / scrollFrames));

  // El contenido combinado mide ~2400px. El frame del iPhone ~1300px.
  // Scroll total = (contentHeight - frameHeight) ≈ 1100px.
  const MAX_SCROLL = 1100 * scale;
  const translateY = -progress * MAX_SCROLL;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          transform: `translateY(${translateY}px)`,
        }}
      >
        <HomeView scale={scale} />
        <FichaView scale={scale} />
      </div>
    </div>
  );
}

const VIEWS = {
  home: HomeView,
  ficha: FichaView,
  recordatorios: HomeView,
  scrolling: ScrollingFullView,
};

export function AppMockup({ view = 'home', floatAmp = 12, switchToView }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animacion de entrada con spring + float sutil
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const scaleIn = interpolate(enter, [0, 1], [0.85, 1]);
  const opacity = interpolate(enter, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' });
  const floatY = Math.sin((frame / fps) * 1.0) * floatAmp;
  const tilt = Math.sin((frame / fps) * 0.6) * 1.2;

  // Si hay switchToView, transicion a la mitad de la escena
  const switchPoint = durationInFrames / 2;
  const showSecondView = switchToView && frame >= switchPoint;
  const CurrentView = showSecondView ? (VIEWS[switchToView] ?? HomeView) : (VIEWS[view] ?? HomeView);

  // Fade entre vistas
  const switchOpacity = switchToView
    ? interpolate(frame, [switchPoint - fps * 0.2, switchPoint + fps * 0.2], [1, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        background: `radial-gradient(circle at 30% 20%, ${COLORS.primaryLight}22 0%, ${COLORS.ink} 60%)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          transform: `translateY(${floatY}px) rotate(${tilt}deg) scale(${scaleIn})`,
          opacity,
        }}
      >
        <IPhoneFrame scale={1}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', opacity: switchOpacity }}>
            <CurrentView scale={1} />
          </div>
        </IPhoneFrame>
      </div>
    </AbsoluteFill>
  );
}
