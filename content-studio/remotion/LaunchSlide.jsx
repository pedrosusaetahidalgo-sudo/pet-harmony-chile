import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
} from 'remotion';

// =====================================================================
// LaunchSlide — STILL composition (1080x1350 4:5)
// Renderiza un slide individual de carrusel con la calidad visual del
// LaunchReel. Tipografia Inter, brand morado/amber, cards con radius
// generoso, sombras triple, logo squircle, CTA pill con triple-shadow.
//
// Pensada para `remotion still` -> 1 frame estatico por slide.
// =====================================================================

const COLORS = {
  primary: '#9333EA',
  primaryDark: '#581C87',
  primaryDeep: '#1A102B',
  primaryLight: '#C084FC',
  ink: '#0F172A',
  white: '#FFFFFF',
  amber: '#FDE68A',
  amberStrong: '#FACC15',
};

const FONT = 'Inter, system-ui, sans-serif';

const ASSETS = {
  imgKaiTongue: 'launch-raw/kai-tongue.jpeg',
  imgKaiSleeping: 'launch-raw/kai-sleeping.jpeg',
  imgKaiGazebo: 'launch-raw/kai-gazebo.jpeg',
  imgEma: 'launch-raw/ema-cat.jpeg',
  imgKaiFriends: 'launch-raw/kai-friends.jpeg',
  vidScreen: 'launch-raw/screen-recording.mp4',
  logoSquircle: 'brand-v2/logo/pwa_icon_192.png',
  logoWordmark: 'brand-v2/logo/wordmark.svg',
};

// ---------------------------------------------------------------------
// Background variants
// ---------------------------------------------------------------------
function PhotoBg({ src, focusY = 50, scale = 1, overlay }) {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, transformOrigin: `50% ${focusY}%` }}
      >
        <Img
          src={staticFile(src)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
      {overlay && <AbsoluteFill style={{ background: overlay }} />}
    </AbsoluteFill>
  );
}

function PurpleBg({ haloIntensity = 0.55 }) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 38%, rgba(192,132,252,${haloIntensity}) 0%, ${COLORS.primary} 38%, ${COLORS.primaryDeep} 100%)`,
      }}
    />
  );
}

// ---------------------------------------------------------------------
// Logo squircle — esquina superior derecha (igual al Reel)
// ---------------------------------------------------------------------
function LogoBadge({ withWordmark = true }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        right: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: withWordmark ? '12px 24px 12px 14px' : '10px',
        background: 'rgba(255,255,255,0.94)',
        borderRadius: withWordmark ? 999 : 28,
        boxShadow:
          '0 8px 24px rgba(15,23,42,0.22), 0 2px 6px rgba(15,23,42,0.08)',
      }}
    >
      <Img
        src={staticFile(ASSETS.logoSquircle)}
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          display: 'block',
        }}
      />
      {withWordmark && (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 28,
            color: COLORS.primaryDark,
            letterSpacing: '-0.5px',
            display: 'flex',
          }}
        >
          Paw Friend
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Caption card (igual filosofia que LaunchCaption pero estatica)
// ---------------------------------------------------------------------
function CardSurface({ children, tone = 'glass', anchor = 'center', style }) {
  const TONE = {
    glass: {
      bg: 'rgba(15,23,42,0.78)',
      color: COLORS.white,
      border: '1px solid rgba(255,255,255,0.16)',
      shadow:
        '0 16px 50px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)',
    },
    dark: {
      bg: COLORS.primary,
      color: COLORS.white,
      border: '1px solid rgba(255,255,255,0.18)',
      shadow:
        '0 16px 50px rgba(88,28,135,0.55), 0 4px 12px rgba(0,0,0,0.25)',
    },
    light: {
      bg: 'rgba(255,255,255,0.96)',
      color: COLORS.ink,
      border: '1px solid rgba(147,51,234,0.18)',
      shadow:
        '0 12px 40px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.10)',
    },
    deep: {
      bg: 'rgba(26,16,43,0.88)',
      color: COLORS.white,
      border: '1px solid rgba(192,132,252,0.28)',
      shadow:
        '0 18px 56px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.25)',
    },
  };

  const ANCHOR = {
    top: { top: '8%', alignItems: 'flex-start' },
    center: { top: 0, bottom: 0, alignItems: 'center' },
    bottom: { bottom: '8%', alignItems: 'flex-end' },
  };

  const t = TONE[tone];
  const a = ANCHOR[anchor];

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 64px',
        ...a,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          background: t.bg,
          color: t.color,
          padding: '40px 48px',
          borderRadius: 28,
          boxShadow: t.shadow,
          border: t.border,
          maxWidth: 940,
          fontFamily: FONT,
          textAlign: 'center',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// CTA pill (triple shadow + glow morado, igual al Reel)
// ---------------------------------------------------------------------
function CTAPill({ children, sub }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '14%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '32px 56px',
          background: COLORS.white,
          color: COLORS.primaryDark,
          borderRadius: 999,
          boxShadow: `
            0 24px 60px rgba(15,23,42,0.55),
            0 0 0 6px rgba(192,132,252,0.5),
            0 0 80px rgba(147,51,234,0.5)
          `,
          fontFamily: FONT,
          fontSize: 84,
          fontWeight: 900,
          letterSpacing: '-2px',
        }}
      >
        <Img
          src={staticFile(ASSETS.logoSquircle)}
          style={{
            width: 76,
            height: 76,
            borderRadius: 18,
            display: 'block',
          }}
        />
        {children}
      </div>
      {sub && (
        <div
          style={{
            display: 'flex',
            color: COLORS.amber,
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            textShadow: '0 4px 14px rgba(0,0,0,0.45)',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Beta badge (amber pill rotada -3deg, mismo del Reel outro)
// ---------------------------------------------------------------------
function BetaBadge({ rotate = -3 }) {
  return (
    <div
      style={{
        display: 'flex',
        background: COLORS.amber,
        color: COLORS.primaryDark,
        padding: '12px 26px',
        borderRadius: 999,
        fontFamily: FONT,
        fontSize: 36,
        fontWeight: 900,
        letterSpacing: '4px',
        textTransform: 'uppercase',
        boxShadow:
          '0 8px 22px rgba(0,0,0,0.28), 0 0 0 4px rgba(253,230,138,0.25)',
        transform: `rotate(${rotate}deg)`,
      }}
    >
      Beta
    </div>
  );
}

// ---------------------------------------------------------------------
// Feature chip (capsula blanca con accent ring)
// ---------------------------------------------------------------------
function FeatureChip({ emoji, label, accent = COLORS.amberStrong, position }) {
  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 28px',
        background: COLORS.white,
        borderRadius: 999,
        boxShadow: `
          0 14px 36px rgba(0,0,0,0.4),
          0 0 0 4px ${accent}55,
          0 0 24px ${accent}66
        `,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 38,
        color: COLORS.primaryDark,
        letterSpacing: '-0.5px',
      }}
    >
      <span style={{ display: 'flex', fontSize: 44, lineHeight: 1 }}>
        {emoji}
      </span>
      <span style={{ display: 'flex' }}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Phone frame con video (frame estatico, sin animacion)
// Para slides 04/05 carrusel 1: muestra screen-recording en un frame
// de iPhone con tint morado.
// ---------------------------------------------------------------------
function PhoneFrameStatic({ frameOffsetSec = 0 }) {
  const PHONE_W = 480;
  const PHONE_H = 1040;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          width: PHONE_W,
          height: PHONE_H,
          padding: 12,
          background: '#0A0A0A',
          borderRadius: 64,
          boxShadow: `
            0 60px 120px rgba(0,0,0,0.60),
            0 24px 48px rgba(147,51,234,0.40),
            inset 0 0 0 3px #222
          `,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            borderRadius: 54,
            overflow: 'hidden',
            background: COLORS.white,
            position: 'relative',
          }}
        >
          <OffthreadVideo
            src={staticFile(ASSETS.vidScreen)}
            startFrom={Math.round(frameOffsetSec * 30)}
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 110,
              height: 30,
              background: '#000',
              borderRadius: 99,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------
// Squircle cover — para tapar el numero de telefono en la placa de Ema
// Reusa logoSquircle a 200x200 con sombra (igual estrategia del Reel).
// position: { top, left }
// ---------------------------------------------------------------------
function SquircleCover({ position, size = 200 }) {
  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        display: 'flex',
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: COLORS.white,
        padding: 18,
        boxShadow:
          '0 18px 48px rgba(0,0,0,0.45), 0 6px 14px rgba(0,0,0,0.25)',
        transform: 'rotate(-4deg)',
      }}
    >
      <Img
        src={staticFile(ASSETS.logoSquircle)}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size * 0.18,
          display: 'block',
        }}
      />
    </div>
  );
}

// =====================================================================
// SLIDE LAYOUTS
// =====================================================================

// ----- Carrusel 1 — Lanzamiento -----

function Slide_C1_01_Cover() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgKaiTongue}
        focusY={45}
        scale={1.04}
        overlay="linear-gradient(180deg, rgba(88,28,135,0.30) 0%, rgba(88,28,135,0.10) 35%, rgba(15,23,42,0.55) 100%)"
      />
      <LogoBadge />
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          bottom: 96,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.92)',
            fontFamily: FONT,
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: '-1px',
            textShadow: '0 6px 24px rgba(0,0,0,0.45)',
          }}
        >
          Hoy lancé
        </div>
        <div
          style={{
            display: 'flex',
            color: COLORS.white,
            fontFamily: FONT,
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: '-5px',
            lineHeight: 0.95,
            textShadow: '0 10px 36px rgba(0,0,0,0.55)',
          }}
        >
          Paw Friend
        </div>
        <div style={{ marginTop: 18 }}>
          <BetaBadge rotate={-4} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Slide_C1_02_Stats() {
  return (
    <AbsoluteFill>
      <PurpleBg haloIntensity={0.55} />
      <LogoBadge />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 28,
          padding: '0 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {[
            { num: '2', tail: ' meses.' },
            { num: '1', tail: ' founder solo.' },
            { num: '+', tail: ' IA.' },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                color: COLORS.white,
                fontFamily: FONT,
                fontSize: 132,
                fontWeight: 900,
                letterSpacing: '-3.5px',
                lineHeight: 1.05,
                textShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              <span style={{ display: 'flex', color: COLORS.amber }}>
                {row.num}
              </span>
              <span style={{ display: 'flex' }}>{row.tail}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 32,
            padding: '24px 40px',
            background: 'rgba(255,255,255,0.96)',
            color: COLORS.primaryDark,
            borderRadius: 999,
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: '-1.2px',
            boxShadow:
              '0 18px 48px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.18)',
          }}
        >
          Paw Friend está vivo.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Slide_C1_03_Pain() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgKaiSleeping}
        focusY={50}
        scale={1.05}
        overlay="linear-gradient(180deg, rgba(15,23,42,0.20) 0%, rgba(15,23,42,0.50) 70%, rgba(15,23,42,0.78) 100%)"
      />
      <LogoBadge />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          padding: '0 80px',
        }}
      >
        <CardSurface tone="deep" anchor="center" style={{ gap: 14, padding: '48px 56px' }}>
          {['Como dueño de Kai', 'quería su ficha', 'médica al día'].map(
            (line, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  color: COLORS.white,
                  fontFamily: FONT,
                  fontSize: 88,
                  fontWeight: 900,
                  letterSpacing: '-2px',
                  lineHeight: 1.08,
                  textAlign: 'center',
                }}
              >
                {line}
              </div>
            ),
          )}
        </CardSurface>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Slide_C1_04_App1() {
  return (
    <AbsoluteFill style={{ background: COLORS.primaryDeep }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(147,51,234,0.45) 0%, rgba(26,16,43,0.95) 60%, rgba(26,16,43,1) 100%)',
        }}
      />
      <LogoBadge />
      <PhoneFrameStatic frameOffsetSec={12} />
      <FeatureChip
        emoji="💉"
        label="Vacunas"
        accent={COLORS.amberStrong}
        position={{ top: 220, left: 60 }}
      />
      <FeatureChip
        emoji="⚖️"
        label="Peso"
        accent={COLORS.primaryLight}
        position={{ top: 360, right: 60 }}
      />
      <FeatureChip
        emoji="🔔"
        label="Recordatorios"
        accent={COLORS.amberStrong}
        position={{ bottom: 220, left: 60 }}
      />
    </AbsoluteFill>
  );
}

function Slide_C1_05_App2() {
  return (
    <AbsoluteFill style={{ background: COLORS.primaryDeep }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(147,51,234,0.45) 0%, rgba(26,16,43,0.95) 60%, rgba(26,16,43,1) 100%)',
        }}
      />
      <LogoBadge />
      <PhoneFrameStatic frameOffsetSec={22} />
      <FeatureChip
        emoji="📤"
        label="Compartir ficha"
        accent={COLORS.amberStrong}
        position={{ top: 240, left: 50 }}
      />
      <FeatureChip
        emoji="🩺"
        label="Con tu vet"
        accent={COLORS.primaryLight}
        position={{ bottom: 240, right: 50 }}
      />
    </AbsoluteFill>
  );
}

function Slide_C1_06_Ema() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgEma}
        focusY={45}
        scale={1.04}
        overlay="linear-gradient(180deg, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0.05) 50%, rgba(15,23,42,0.55) 100%)"
      />
      {/* Tapar numero de telefono de la placa con squircle */}
      <SquircleCover position={{ top: 760, left: 510 }} size={220} />
      <LogoBadge />
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          bottom: 96,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.92)',
            fontFamily: FONT,
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: '-1.5px',
            textShadow: '0 6px 24px rgba(0,0,0,0.55)',
          }}
        >
          También
        </div>
        <div
          style={{
            display: 'flex',
            color: COLORS.amber,
            fontFamily: FONT,
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: '-5px',
            lineHeight: 0.98,
            textShadow: '0 10px 36px rgba(0,0,0,0.55)',
          }}
        >
          para gatos.
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Slide_C1_07_Gratis() {
  return (
    <AbsoluteFill>
      <PurpleBg haloIntensity={0.6} />
      <LogoBadge />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 12,
          padding: '0 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: COLORS.white,
            fontFamily: FONT,
            fontSize: 240,
            fontWeight: 900,
            letterSpacing: '-7px',
            lineHeight: 1,
            textShadow: '0 14px 40px rgba(0,0,0,0.45)',
          }}
        >
          Gratis.
        </div>
        <div
          style={{
            display: 'flex',
            color: COLORS.amber,
            fontFamily: FONT,
            fontSize: 132,
            fontWeight: 900,
            letterSpacing: '-3.5px',
            lineHeight: 1,
            textShadow: '0 10px 30px rgba(0,0,0,0.45)',
          }}
        >
          Para siempre.
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            padding: '20px 36px',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.30)',
            color: COLORS.white,
            borderRadius: 999,
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: '-0.4px',
            textAlign: 'center',
          }}
        >
          Para perros, gatos y dueños chilenos.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Slide_C1_08_CTA() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgKaiGazebo}
        focusY={45}
        scale={1.05}
        overlay="linear-gradient(180deg, rgba(88,28,135,0.55) 0%, rgba(88,28,135,0.35) 40%, rgba(15,23,42,0.65) 100%)"
      />
      <LogoBadge />
      <CTAPill sub="Pruébala hoy">pawfriend.cl</CTAPill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 56,
          display: 'flex',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: FONT,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.5px',
        }}
      >
        — Pedro · Founder
      </div>
    </AbsoluteFill>
  );
}

// ----- Carrusel 2 — Kai y Ema -----

function Slide_C2_01_Cover() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgKaiTongue}
        focusY={45}
        scale={1.04}
        overlay="linear-gradient(180deg, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0.10) 55%, rgba(88,28,135,0.55) 100%)"
      />
      <LogoBadge />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 130,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            padding: '32px 56px',
            background: COLORS.primary,
            color: COLORS.white,
            borderRadius: 999,
            fontFamily: FONT,
            fontSize: 92,
            fontWeight: 900,
            letterSpacing: '-2px',
            boxShadow: `
              0 24px 60px rgba(15,23,42,0.55),
              0 0 0 6px rgba(192,132,252,0.5),
              0 0 80px rgba(147,51,234,0.5)
            `,
          }}
        >
          Conoce a Kai y Ema
        </div>
      </div>
    </AbsoluteFill>
  );
}

function NameLabel({ name, sub, color = COLORS.white, accent = COLORS.amber }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        bottom: 96,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          color,
          fontFamily: FONT,
          fontSize: 168,
          fontWeight: 900,
          letterSpacing: '-5px',
          lineHeight: 0.98,
          textShadow: '0 10px 36px rgba(0,0,0,0.55)',
        }}
      >
        {name}
      </div>
      <div
        style={{
          display: 'flex',
          padding: '14px 24px',
          background: 'rgba(15,23,42,0.62)',
          color: accent,
          borderRadius: 999,
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '-0.4px',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function Slide_C2_02_Kai() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgKaiGazebo}
        focusY={45}
        scale={1.05}
        overlay="linear-gradient(180deg, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0.05) 45%, rgba(15,23,42,0.75) 100%)"
      />
      <LogoBadge />
      <NameLabel name="Kai" sub="Pastor Suizo Blanco · 5 años" />
    </AbsoluteFill>
  );
}

function Slide_C2_03_Sofa() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgKaiSleeping}
        focusY={50}
        scale={1.04}
        overlay="linear-gradient(180deg, rgba(15,23,42,0.20) 0%, rgba(15,23,42,0.45) 60%, rgba(15,23,42,0.80) 100%)"
      />
      <LogoBadge />
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          bottom: 110,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '36px 44px',
            background: 'rgba(15,23,42,0.78)',
            color: COLORS.white,
            borderRadius: 24,
            borderLeft: `4px solid ${COLORS.amberStrong}`,
            boxShadow:
              '0 18px 50px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.25)',
            fontFamily: FONT,
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            textAlign: 'left',
            fontStyle: 'italic',
          }}
        >
          Dueño absoluto del sofá.
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Slide_C2_04_Ema() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgEma}
        focusY={45}
        scale={1.04}
        overlay="linear-gradient(180deg, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0.10) 50%, rgba(15,23,42,0.65) 100%)"
      />
      {/* Tapar numero de telefono */}
      <SquircleCover position={{ top: 760, left: 510 }} size={220} />
      <LogoBadge />
      <NameLabel
        name="Ema"
        sub="Siamesa · lleva su placa con orgullo"
        color={COLORS.white}
        accent={COLORS.amber}
      />
    </AbsoluteFill>
  );
}

function Slide_C2_05_Purpose() {
  return (
    <AbsoluteFill>
      <PhotoBg
        src={ASSETS.imgKaiFriends}
        focusY={45}
        scale={1.06}
        overlay="linear-gradient(180deg, rgba(88,28,135,0.30) 0%, rgba(15,23,42,0.30) 50%, rgba(15,23,42,0.78) 100%)"
      />
      <LogoBadge />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 130,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            padding: '32px 52px',
            background: COLORS.primary,
            color: COLORS.white,
            borderRadius: 999,
            fontFamily: FONT,
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: '-2px',
            lineHeight: 1.05,
            textAlign: 'center',
            boxShadow: `
              0 24px 60px rgba(15,23,42,0.55),
              0 0 0 6px rgba(192,132,252,0.5),
              0 0 80px rgba(147,51,234,0.5)
            `,
          }}
        >
          Por ellos hice Paw Friend.
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Slide_C2_06_CTA() {
  return (
    <AbsoluteFill>
      <PurpleBg haloIntensity={0.6} />
      <LogoBadge />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 28,
          padding: '0 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: COLORS.white,
            fontFamily: FONT,
            fontSize: 144,
            fontWeight: 900,
            letterSpacing: '-4px',
            lineHeight: 1,
            textShadow: '0 10px 36px rgba(0,0,0,0.45)',
          }}
        >
          ¿Y los tuyos?
        </div>
        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.95)',
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: '-0.6px',
            textAlign: 'center',
            textShadow: '0 4px 14px rgba(0,0,0,0.4)',
          }}
        >
          Cuéntame en comentarios
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            alignItems: 'center',
            gap: 18,
            padding: '24px 44px',
            background: COLORS.white,
            color: COLORS.primaryDark,
            borderRadius: 999,
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: '-1.5px',
            boxShadow: `
              0 24px 60px rgba(15,23,42,0.55),
              0 0 0 6px rgba(192,132,252,0.5),
              0 0 80px rgba(147,51,234,0.5)
            `,
          }}
        >
          <Img
            src={staticFile(ASSETS.logoSquircle)}
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              display: 'block',
            }}
          />
          pawfriend.cl
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// =====================================================================
// Map de slide id -> componente
// =====================================================================
const SLIDES = {
  // Carrusel 1
  'launch-01': Slide_C1_01_Cover,
  'launch-02': Slide_C1_02_Stats,
  'launch-03': Slide_C1_03_Pain,
  'launch-04': Slide_C1_04_App1,
  'launch-05': Slide_C1_05_App2,
  'launch-06': Slide_C1_06_Ema,
  'launch-07': Slide_C1_07_Gratis,
  'launch-08': Slide_C1_08_CTA,
  // Carrusel 2
  'kai-ema-01': Slide_C2_01_Cover,
  'kai-ema-02': Slide_C2_02_Kai,
  'kai-ema-03': Slide_C2_03_Sofa,
  'kai-ema-04': Slide_C2_04_Ema,
  'kai-ema-05': Slide_C2_05_Purpose,
  'kai-ema-06': Slide_C2_06_CTA,
};

export const SLIDE_IDS = Object.keys(SLIDES);

export function LaunchSlide({ slideId }) {
  const Component = SLIDES[slideId] ?? Slide_C1_01_Cover;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Component />
    </AbsoluteFill>
  );
}

export const LAUNCH_SLIDE_CONFIG = {
  durationInFrames: 30,
  fps: 30,
  width: 1080,
  height: 1350,
};
