import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { LaunchCaption } from './LaunchCaption.jsx';

// =====================================================================
// LaunchReel — video lanzamiento Paw Friend (2026-05-05)
// 9:16, 1080x1920, 30fps, ~18.5s
// Voz Pedro (ElevenLabs) + musica de fondo ducked al 13%
// Quality bar: padding generoso, motion design pulido, brand assets ricos.
// =====================================================================

const FPS = 30;
const COLORS = {
  primary: '#9333EA',
  primaryDark: '#6B21A8',
  primaryLight: '#C084FC',
  primaryDeep: '#1A102B',
  ink: '#0F172A',
  white: '#FFFFFF',
  amber: '#FACC15',
};

// ---------------------------------------------------------------------
// Asset paths (relative a publicDir = assets/)
// ---------------------------------------------------------------------
const ASSETS = {
  // Voz individual (per scene)
  voiceFull: 'launch-voice/narration-full.mp3',
  voice01: 'launch-voice/01-intro.mp3',
  voice02: 'launch-voice/02-pain.mp3',
  voice03: 'launch-voice/03-features.mp3',
  voice04: 'launch-voice/04-built.mp3',
  voice05: 'launch-voice/05-cats.mp3',
  voice06: 'launch-voice/06-cta.mp3',
  // Musica
  music: 'music/semana-01-ema-ofendida-v3.mp3',
  // Raw media
  imgKaiTongue: 'launch-raw/kai-tongue.jpeg',
  imgKaiSleeping: 'launch-raw/kai-sleeping.jpeg',
  imgKaiGazebo: 'launch-raw/kai-gazebo.jpeg',
  imgEma: 'launch-raw/ema-cat.jpeg',
  vidScreen: 'launch-raw/screen-recording.mp4',
  vidKaiRunning: 'launch-raw/kai-running.mp4',
  // Brand v2
  logoSquircle: 'brand-v2/logo/pwa_icon_192.png',
  logoWordmark: 'brand-v2/logo/wordmark.svg',
  logoLockup: 'brand-v2/logo/lockup_tagline.svg',
  iconBell: 'brand-v2/icons/bell.svg',
  iconHeart: 'brand-v2/icons/heart.svg',
  iconShield: 'brand-v2/icons/shield.svg',
  iconMicrochip: 'brand-v2/icons/microchip.svg',
  iconQR: 'brand-v2/icons/qr.svg',
  iconGift: 'brand-v2/icons/gift.svg',
};

// ---------------------------------------------------------------------
// Timeline (en segundos). Outro arranca a 14.6s, reel total ~18.5s.
// ---------------------------------------------------------------------
const T = {
  s1Start: 0.0,    s1Dur: 2.55,   // Hook: Kai con lengua + intro
  s2Start: 2.55,   s2Dur: 2.95,   // Pain: Kai durmiendo + ficha medica
  s3Start: 5.50,   s3Dur: 3.25,   // Features: screen recording + chips
  s4Start: 8.75,   s4Dur: 1.50,   // Built: Kai gazebo + wordmark
  s5Start: 10.25,  s5Dur: 1.50,   // Cats: Ema
  s6Start: 11.75,  s6Dur: 3.50,   // CTA voice: pawfriend.cl
  outroStart: 15.25, outroDur: 3.25, // Outro estatico final
};

const TOTAL_SECONDS = T.outroStart + T.outroDur; // 18.5s
const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const sec = (s) => Math.round(s * FPS);

// Ken Burns: zoom suave 1.0 → 1.06
function useKenBurns(intensity = 0.06) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(frame / durationInFrames, 1);
  return 1 + progress * intensity;
}

// ---------------------------------------------------------------------
// LogoBadge: squircle esquina superior derecha, fade-in, sutil pulse.
// ---------------------------------------------------------------------
function LogoBadge() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, mass: 1, stiffness: 95 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.5, 1]);
  const pulse = 1 + Math.sin((frame / fps) * 2.0) * 0.018;

  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        right: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 24px 12px 14px',
        background: 'rgba(255,255,255,0.94)',
        borderRadius: 999,
        boxShadow: '0 8px 24px rgba(15,23,42,0.22), 0 2px 6px rgba(15,23,42,0.08)',
        opacity,
        transform: `scale(${scale * pulse})`,
        transformOrigin: 'right center',
      }}
    >
      <Img
        src={staticFile(ASSETS.logoSquircle)}
        style={{ width: 56, height: 56, borderRadius: 14, display: 'block' }}
      />
      <div
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 28,
          color: COLORS.primaryDark,
          letterSpacing: '-0.5px',
          display: 'flex',
        }}
      >
        Paw Friend
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Scene wrapper: full-bleed media con Ken Burns + overlay vignette
// ---------------------------------------------------------------------
function MediaBackdrop({ src, kind = 'image', focusY = 50 }) {
  const zoom = useKenBurns(0.07);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `50% ${focusY}%` }}>
        {kind === 'image' ? (
          <Img
            src={staticFile(src)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <OffthreadVideo
            src={staticFile(src)}
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </AbsoluteFill>
      {/* Vignette top + bottom para legibilidad de captions */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.0) 22%, rgba(15,23,42,0.0) 60%, rgba(15,23,42,0.72) 100%)',
        }}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------
// Scene 1: Hook — Kai con lengua + "Hola, este es Kai 🐾"
// ---------------------------------------------------------------------
function Scene1Hook() {
  return (
    <AbsoluteFill>
      <MediaBackdrop src={ASSETS.vidKaiRunning} kind="video" focusY={50} />
      <Audio src={staticFile(ASSETS.voice01)} startFrom={0} volume={1} />
      <LaunchCaption
        variant="hero"
        tone="light"
        anchor="bottom"
        delayFrames={sec(0.15)}
        holdFrames={sec(T.s1Dur - 0.15)}
      >
        Hola, este es Kai
      </LaunchCaption>
      {/* Paw badge flotante */}
      <PawFloater />
    </AbsoluteFill>
  );
}

function PawFloater() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 12, fps, config: { damping: 12, stiffness: 110 } });
  const scale = interpolate(enter, [0, 1], [0, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const float = Math.sin((frame / fps) * 1.6) * 8;

  return (
    <div
      style={{
        position: 'absolute',
        top: 220,
        left: 80,
        display: 'flex',
        width: 120,
        height: 120,
        background: COLORS.amber,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 72,
        boxShadow: '0 16px 36px rgba(250,204,21,0.45), 0 4px 8px rgba(0,0,0,0.2)',
        transform: `translateY(${float}px) scale(${scale}) rotate(-8deg)`,
        opacity,
      }}
    >
      🐾
    </div>
  );
}

// ---------------------------------------------------------------------
// Scene 2: Pain — Kai durmiendo + caption multilinea
// ---------------------------------------------------------------------
function Scene2Pain() {
  return (
    <AbsoluteFill>
      <MediaBackdrop src={ASSETS.imgKaiSleeping} kind="image" focusY={50} />
      <Audio src={staticFile(ASSETS.voice02)} startFrom={0} volume={1} />
      <LaunchCaption
        variant="body"
        tone="glass"
        anchor="center"
        delayFrames={sec(0.1)}
        holdFrames={sec(T.s2Dur - 0.1)}
      >
        Como cualquier dueño,{'\n'}quería su ficha médica al día.
      </LaunchCaption>
      {/* Heart icon esquina inferior izquierda */}
      <FloatingIcon
        src={ASSETS.iconHeart}
        position={{ bottom: 200, left: 80 }}
        delay={14}
      />
    </AbsoluteFill>
  );
}

function FloatingIcon({ src, position, delay = 0, size = 110 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 95 } });
  const scale = interpolate(enter, [0, 1], [0, 1]);
  const opacity = interpolate(enter, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });
  const float = Math.sin((frame / fps) * 1.4) * 6;

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        display: 'flex',
        width: size,
        height: size,
        background: COLORS.white,
        borderRadius: 28,
        padding: 12,
        boxShadow: '0 14px 34px rgba(15,23,42,0.32), 0 4px 8px rgba(0,0,0,0.15)',
        transform: `translateY(${float}px) scale(${scale})`,
        opacity,
      }}
    >
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Scene 3: Features — screen recording + chips (Vacunas, Peso, Recordatorios)
// ---------------------------------------------------------------------
function Scene3Features() {
  return (
    <AbsoluteFill style={{ background: COLORS.primaryDeep }}>
      <Audio src={staticFile(ASSETS.voice03)} startFrom={0} volume={1} />

      {/* Screen recording centrado, escala media para que se vea pantalla completa */}
      <PhoneFrameWithVideo />

      {/* Chips secuenciales sobre el video */}
      <FeatureChip
        emoji="💉"
        label="Vacunas"
        delay={sec(0.25)}
        position={{ top: 250, left: 80 }}
        accent={COLORS.amber}
      />
      <FeatureChip
        emoji="⚖️"
        label="Peso"
        delay={sec(1.05)}
        position={{ top: 380, right: 80 }}
        accent={COLORS.primaryLight}
      />
      <FeatureChip
        emoji="🔔"
        label="Recordatorios"
        delay={sec(1.85)}
        position={{ top: 510, left: 80 }}
        accent={COLORS.amber}
      />

      {/* Title pill abajo */}
      <LaunchCaption
        variant="pill"
        tone="dark"
        anchor="bottom"
        delayFrames={sec(0.05)}
        holdFrames={sec(T.s3Dur - 0.05)}
      >
        Todo en un solo lugar
      </LaunchCaption>
    </AbsoluteFill>
  );
}

function PhoneFrameWithVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const scaleIn = interpolate(enter, [0, 1], [0.78, 1]);
  const opacity = interpolate(enter, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' });
  const float = Math.sin((frame / fps) * 0.9) * 8;

  // Ken-burns muy sutil sobre el screen recording
  const zoom = useKenBurns(0.04);

  // El video raw es vertical 9:19+ (392x850 ~). Lo metemos en un frame de iPhone.
  const PHONE_W = 540;
  const PHONE_H = 1170;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          width: PHONE_W,
          height: PHONE_H,
          padding: 14,
          background: '#0A0A0A',
          borderRadius: 76,
          boxShadow: `
            0 60px 120px rgba(0,0,0,0.60),
            0 24px 48px rgba(147,51,234,0.30),
            inset 0 0 0 3px #222
          `,
          position: 'relative',
          transform: `translateY(${float}px) scale(${scaleIn})`,
          opacity,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            borderRadius: 64,
            overflow: 'hidden',
            background: COLORS.white,
            position: 'relative',
          }}
        >
          <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
            <OffthreadVideo
              src={staticFile(ASSETS.vidScreen)}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </AbsoluteFill>
          {/* Dynamic Island */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 130,
              height: 36,
              background: '#000',
              borderRadius: 99,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function FeatureChip({ emoji, label, delay, position, accent }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 11, mass: 1, stiffness: 130 },
  });
  const scale = interpolate(enter, [0, 1], [0, 1]);
  const opacity = interpolate(enter, [0, 0.8], [0, 1], { extrapolateRight: 'clamp' });
  // Pequeno bobble despues de aparecer
  const localFrame = frame - delay;
  const bobble = localFrame > fps * 0.3 ? Math.sin((localFrame - fps * 0.3) / fps * 2.0) * 3 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '20px 32px',
        background: COLORS.white,
        borderRadius: 999,
        boxShadow: `0 14px 36px rgba(0,0,0,0.4), 0 0 0 4px ${accent}55, 0 0 24px ${accent}66`,
        transform: `translateY(${bobble}px) scale(${scale})`,
        opacity,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 800,
        fontSize: 42,
        color: COLORS.primaryDark,
        letterSpacing: '-0.5px',
      }}
    >
      <span style={{ display: 'flex', fontSize: 48, lineHeight: 1 }}>{emoji}</span>
      <span style={{ display: 'flex' }}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Scene 4: Built — Kai gazebo + "Así que armé Paw Friend"
// ---------------------------------------------------------------------
function Scene4Built() {
  return (
    <AbsoluteFill>
      <MediaBackdrop src={ASSETS.imgKaiGazebo} kind="image" focusY={45} />
      <Audio src={staticFile(ASSETS.voice04)} startFrom={0} volume={1} />
      <WordmarkReveal />
    </AbsoluteFill>
  );
}

function WordmarkReveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, mass: 1, stiffness: 95 } });
  const scale = interpolate(enter, [0, 1], [0.65, 1]);
  const opacity = interpolate(enter, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          padding: '52px 64px',
          background: 'rgba(255,255,255,0.96)',
          borderRadius: 36,
          boxShadow: '0 30px 80px rgba(15,23,42,0.45), 0 8px 24px rgba(0,0,0,0.2)',
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 38,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.5px',
            display: 'flex',
            opacity: 0.78,
          }}
        >
          Así que armé
        </div>
        <Img
          src={staticFile(ASSETS.logoWordmark)}
          style={{
            width: 580,
            height: 'auto',
            display: 'block',
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------
// Scene 5: Cats — Ema con placa
// ---------------------------------------------------------------------
function Scene5Cats() {
  return (
    <AbsoluteFill>
      <MediaBackdrop src={ASSETS.imgEma} kind="image" focusY={45} />
      <Audio src={staticFile(ASSETS.voice05)} startFrom={0} volume={1} />
      <LaunchCaption
        variant="hero"
        tone="dark"
        anchor="bottom"
        delayFrames={sec(0.05)}
        holdFrames={sec(T.s5Dur - 0.05)}
        emoji="🐱"
      >
        También para gatos
      </LaunchCaption>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------
// Scene 6: CTA voice — Kai gazebo + "Lo lancé hoy"
// ---------------------------------------------------------------------
function Scene6CTA() {
  return (
    <AbsoluteFill>
      <MediaBackdrop src={ASSETS.imgKaiGazebo} kind="image" focusY={40} />
      <Audio src={staticFile(ASSETS.voice06)} startFrom={0} volume={1} />

      {/* Caption "Hoy lancé el primer beta" arriba */}
      <LaunchCaption
        variant="body"
        tone="dark"
        anchor="top"
        delayFrames={sec(0.05)}
        holdFrames={sec(1.3)}
      >
        Hoy lancé el primer beta
      </LaunchCaption>

      {/* Pill pawfriend.cl en el medio-bajo, aparece despues */}
      <CTAPill />

      {/* Tagline gratis chiquito */}
      <LaunchCaption
        variant="pill"
        tone="light"
        anchor="bottom"
        delayFrames={sec(2.0)}
        holdFrames={sec(T.s6Dur - 2.0)}
        emoji="🎁"
      >
        Gratis para dueños chilenos
      </LaunchCaption>
    </AbsoluteFill>
  );
}

function CTAPill() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = sec(1.2);
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 11, mass: 1, stiffness: 130 },
  });
  const scale = interpolate(enter, [0, 1], [0.55, 1]);
  const opacity = interpolate(enter, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });
  const localFrame = frame - delay;
  const pulse = localFrame > 0 ? 1 + Math.sin(localFrame / fps * 2.5) * 0.025 : 1;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '36px 60px',
          background: COLORS.white,
          color: COLORS.primaryDark,
          borderRadius: 999,
          boxShadow: `
            0 24px 60px rgba(15,23,42,0.55),
            0 0 0 6px rgba(192,132,252,0.5),
            0 0 80px rgba(147,51,234,0.5)
          `,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 76,
          fontWeight: 900,
          letterSpacing: '-2px',
          opacity,
          transform: `scale(${scale * pulse})`,
        }}
      >
        <Img
          src={staticFile(ASSETS.logoSquircle)}
          style={{ width: 76, height: 76, borderRadius: 18, display: 'block' }}
        />
        pawfriend.cl
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------
// Outro: pantalla morada + logo grande + tagline + credito
// ---------------------------------------------------------------------
function Outro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoEnter = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const logoScale = interpolate(logoEnter, [0, 1], [0.45, 1]);
  const logoOpacity = interpolate(logoEnter, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' });

  const wordmarkEnter = spring({
    frame: frame - 12,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const wordmarkY = interpolate(wordmarkEnter, [0, 1], [40, 0]);
  const wordmarkOpacity = interpolate(wordmarkEnter, [0, 1], [0, 1]);

  // Badge BETA: aparece justo despues del wordmark con scale-in + slight rotation
  const betaEnter = spring({
    frame: frame - 18,
    fps,
    config: { damping: 10, mass: 1, stiffness: 130 },
  });
  const betaScale = interpolate(betaEnter, [0, 1], [0, 1]);
  const betaOpacity = interpolate(betaEnter, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });
  const betaRotation = interpolate(betaEnter, [0, 1], [-12, -3]);

  const taglineEnter = spring({
    frame: frame - 26,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const taglineScale = interpolate(taglineEnter, [0, 1], [0.7, 1]);
  const taglineOpacity = interpolate(taglineEnter, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });

  // Micro-CTA linea 1: "Probala y dime que falla."
  const cta1Enter = spring({
    frame: frame - 36,
    fps,
    config: { damping: 16, stiffness: 95 },
  });
  const cta1Opacity = interpolate(cta1Enter, [0, 1], [0, 1]);
  const cta1Y = interpolate(cta1Enter, [0, 1], [18, 0]);

  // Micro-CTA linea 2: "Compartila si te tinca." (stagger +0.4s = +12 frames)
  const cta2Enter = spring({
    frame: frame - 48,
    fps,
    config: { damping: 16, stiffness: 95 },
  });
  const cta2Opacity = interpolate(cta2Enter, [0, 1], [0, 1]);
  const cta2Y = interpolate(cta2Enter, [0, 1], [18, 0]);

  const creditEnter = spring({
    frame: frame - 58,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const creditOpacity = interpolate(creditEnter, [0, 1], [0, 1]);
  const creditY = interpolate(creditEnter, [0, 1], [16, 0]);

  const pulse = 1 + Math.sin((frame / fps) * 2.0) * 0.022;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, ${COLORS.primaryLight}33 0%, ${COLORS.primary} 35%, ${COLORS.primaryDeep} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 40,
        padding: '0 80px',
      }}
    >
      {/* Halo + Logo */}
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: 320,
          height: 320,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: logoOpacity,
          transform: `scale(${logoScale * pulse})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 440,
            height: 440,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.10)',
            filter: 'blur(50px)',
          }}
        />
        <Img
          src={staticFile(ASSETS.logoSquircle)}
          style={{
            width: 320,
            height: 320,
            borderRadius: 72,
            display: 'block',
            filter: 'drop-shadow(0 18px 48px rgba(0,0,0,0.45))',
          }}
        />
      </div>

      {/* Wordmark + BETA badge */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          opacity: wordmarkOpacity,
          transform: `translateY(${wordmarkY}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: COLORS.white,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 110,
            fontWeight: 900,
            letterSpacing: '-3.5px',
            textShadow: '0 6px 24px rgba(0,0,0,0.4)',
          }}
        >
          Paw Friend
        </div>
        {/* Badge BETA: pill amarillo dorado con texto morado oscuro */}
        <div
          style={{
            display: 'flex',
            background: '#fde68a',
            color: '#581c87',
            padding: '12px 24px',
            borderRadius: 999,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            boxShadow: '0 8px 22px rgba(0,0,0,0.28), 0 0 0 4px rgba(253,230,138,0.25)',
            opacity: betaOpacity,
            transform: `scale(${betaScale}) rotate(${betaRotation}deg)`,
          }}
        >
          Beta
        </div>
      </div>

      {/* URL pill */}
      <div
        style={{
          display: 'flex',
          background: COLORS.white,
          color: COLORS.primaryDark,
          padding: '32px 64px',
          borderRadius: 999,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: '-1.5px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.40), 0 0 0 8px rgba(255,255,255,0.18)',
          opacity: taglineOpacity,
          transform: `scale(${taglineScale})`,
        }}
      >
        pawfriend.cl
      </div>

      {/* 2 lineas micro-CTA staggered */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          marginTop: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.95)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: '-0.5px',
            textShadow: '0 4px 14px rgba(0,0,0,0.35)',
            opacity: cta1Opacity,
            transform: `translateY(${cta1Y}px)`,
          }}
        >
          Pruébala y dime qué falla.
        </div>
        <div
          style={{
            display: 'flex',
            color: '#fde68a',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: '-0.5px',
            textShadow: '0 4px 14px rgba(0,0,0,0.35)',
            opacity: cta2Opacity,
            transform: `translateY(${cta2Y}px)`,
          }}
        >
          Compártela si te tinca.
        </div>
      </div>

      {/* Credito final: solo "— Pedro · Founder" */}
      <div
        style={{
          position: 'absolute',
          bottom: 110,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: creditOpacity,
          transform: `translateY(${creditY}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          — Pedro · Founder
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------
// Composition root
// ---------------------------------------------------------------------
export function LaunchReel() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Musica de fondo: ducked al 13%, primeros 18s.
  // Pequeno fade-in y fade-out.
  const fadeInFrames = sec(0.6);
  const fadeOutStart = durationInFrames - sec(1.2);
  const fadeIn = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const musicVolume = 0.13 * fadeIn * fadeOut;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Music bed */}
      <Audio
        src={staticFile(ASSETS.music)}
        volume={() => musicVolume}
        startFrom={0}
      />

      {/* Scenes */}
      <Sequence from={sec(T.s1Start)} durationInFrames={sec(T.s1Dur)}>
        <Scene1Hook />
      </Sequence>
      <Sequence from={sec(T.s2Start)} durationInFrames={sec(T.s2Dur)}>
        <Scene2Pain />
      </Sequence>
      <Sequence from={sec(T.s3Start)} durationInFrames={sec(T.s3Dur)}>
        <Scene3Features />
      </Sequence>
      <Sequence from={sec(T.s4Start)} durationInFrames={sec(T.s4Dur)}>
        <Scene4Built />
      </Sequence>
      <Sequence from={sec(T.s5Start)} durationInFrames={sec(T.s5Dur)}>
        <Scene5Cats />
      </Sequence>
      <Sequence from={sec(T.s6Start)} durationInFrames={sec(T.s6Dur)}>
        <Scene6CTA />
      </Sequence>
      <Sequence from={sec(T.outroStart)} durationInFrames={sec(T.outroDur)}>
        <Outro />
      </Sequence>

      {/* Logo badge persistente esquina superior derecha (excepto en outro) */}
      <Sequence from={sec(0.4)} durationInFrames={sec(T.outroStart - 0.6)}>
        <LogoBadge />
      </Sequence>

      {/* Progress bar arriba */}
      <ProgressBar />
    </AbsoluteFill>
  );
}

function ProgressBar() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(frame / durationInFrames, 1);
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 24,
        right: 24,
        height: 4,
        background: 'rgba(255,255,255,0.18)',
        borderRadius: 99,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 99,
        }}
      />
    </div>
  );
}

// Export config para registrar en Root.jsx
export const LAUNCH_REEL_CONFIG = {
  durationInFrames: TOTAL_FRAMES,
  fps: FPS,
  width: 1080,
  height: 1920,
};
