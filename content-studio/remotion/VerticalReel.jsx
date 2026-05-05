import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  OffthreadVideo,
  Img,
  staticFile,
} from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { TikTokCaptions } from './TikTokCaptions.jsx';
import { AppMockup } from './AppMockup.jsx';
import { BrandedOutro } from './BrandedOutro.jsx';
import { BrandFlash } from './effects/BrandFlash.jsx';
import { BrandDropParticles } from './effects/BrandDropParticles.jsx';
import { ChyronLabel } from './effects/ChyronLabel.jsx';

// Duracion del outro branded que se agrega despues de las scenes del JSON.
// 3.0s para dar aire al outro v3 con micro-CTAs staggered (logo→url→line1→line2→sig).
export const OUTRO_SECONDS = 3.0;

// Intenta cargar SFX opcionales. Si no existen, silencioso (no crashea).
function tryStaticFile(path) {
  try {
    return staticFile(path);
  } catch {
    return null;
  }
}

const COLORS = {
  primary: '#9333EA',
  primaryDark: '#6B21A8',
  accent: '#F59E0B',
  ink: '#0F172A',
  white: '#FFFFFF',
  bg: '#FAF5FF',
};

const LOGO_PRINCIPAL = 'brand/paw_friend_icon_principal.svg';

const sceneStyles = {
  hook: { bg: COLORS.primary, fg: COLORS.white, accent: COLORS.primary },
  context: { bg: COLORS.white, fg: COLORS.ink, accent: COLORS.primary },
  punch: { bg: COLORS.ink, fg: COLORS.white, accent: COLORS.primary },
  cta: { bg: COLORS.bg, fg: COLORS.ink, accent: COLORS.primary },
};

function Scene({ scene }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const style = { ...sceneStyles[scene.kind] };

  const enter = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const exit = 1; // sin fade-to-black por escena (las transiciones manejan el corte)

  const mediaUrl = scene.mediaPath ? staticFile(scene.mediaPath) : null;
  const voiceUrl = scene.voicePath ? staticFile(scene.voicePath) : null;
  const hasCaptions = Array.isArray(scene.captions) && scene.captions.length > 0;
  const isMockup = scene.kind === 'mockup' || scene.mediaKind === 'mockup';
  const hasMedia = !!mediaUrl && !isMockup;

  const headlineSize = hasMedia || isMockup ? 72 : scene.kind === 'hook' ? 140 : 108;
  const scaleIn = interpolate(enter, [0, 1], [0.88, 1]);

  // Ken Burns muy lento y sutil para mood inmersivo
  const zoomProgress = interpolate(frame, [0, durationInFrames], [1.04, 1.12]);

  // Flash solo en hook
  const showFlash = scene.kind === 'hook';

  // Delay de voz dentro de la escena (da aire antes de que empiece a hablar).
  const voiceHeadFrames = Math.round(fps * 0.15);

  return (
    <AbsoluteFill style={{ backgroundColor: style.bg }}>
      {voiceUrl && (
        <Sequence from={voiceHeadFrames}>
          <Audio src={voiceUrl} volume={1} />
        </Sequence>
      )}

      {/* Background: mockup | video | imagen | color */}
      {isMockup && <AppMockup view={scene.mockupView ?? 'home'} switchToView={scene.mockupSwitchTo} />}

      {mediaUrl && scene.mediaKind === 'video' && (
        <AbsoluteFill style={{ transform: `scale(${zoomProgress})` }}>
          <OffthreadVideo src={mediaUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}
      {mediaUrl && scene.mediaKind === 'image' && (
        <AbsoluteFill style={{ transform: `scale(${zoomProgress})` }}>
          <Img src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}
      {(hasMedia || isMockup) && (
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.78) 100%)',
          }}
        />
      )}

      {/* Headline */}
      {!hasMedia && !isMockup && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 80px',
            textAlign: 'center',
            transform: `scale(${scaleIn * exit})`,
          }}
        >
          <div
            style={{
              color: style.fg,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 900,
              fontSize: headlineSize,
              lineHeight: 1.02,
              letterSpacing: '-3px',
            }}
          >
            {scene.headline}
          </div>
          {scene.sub && !hasCaptions && (
            <div
              style={{
                marginTop: 32,
                color: style.fg,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 54,
                lineHeight: 1.25,
                opacity: 0.92,
              }}
            >
              {scene.sub}
            </div>
          )}
        </AbsoluteFill>
      )}

      {(hasMedia || isMockup) && (
        <div
          style={{
            position: 'absolute',
            top: 180,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 72px',
            textAlign: 'center',
            transform: `scale(${scaleIn * exit})`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              color: 'white',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 900,
              fontSize: headlineSize,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              textShadow: '0 4px 24px rgba(0,0,0,0.55)',
              maxWidth: '90%',
            }}
          >
            {scene.headline}
          </div>
        </div>
      )}

      {hasCaptions && <TikTokCaptions captions={scene.captions} accent={style.accent} offsetSec={0.15} />}

      {/* Chyron label tipo TV — solo al inicio de cada escena */}
      <ChyronLabel kind={scene.kind} accent={style.accent} />

      {/* Huellas + wordmarks cayendo del cielo (brand ambient) */}
      <BrandDropParticles />

      {/* Flash blanco al inicio del hook para trigger visual */}
      {showFlash && <BrandFlash intensity={0.8} />}

      {scene.kind === 'cta' && !hasCaptions && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 120 }}>
          <div
            style={{
              background: COLORS.primary,
              color: 'white',
              padding: '28px 64px',
              borderRadius: 999,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 800,
              fontSize: 52,
              letterSpacing: '-0.5px',
            }}
          >
            pawfriend.cl
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

function BrandBadge({ handle }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(20px)',
        padding: '10px 20px 10px 10px',
        borderRadius: 999,
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 26,
        fontWeight: 700,
      }}
    >
      <img src={staticFile(LOGO_PRINCIPAL)} width={44} height={44} style={{ display: 'block' }} alt="Paw Friend" />
      {handle}
    </div>
  );
}

function ProgressBar({ totalFrames }) {
  const frame = useCurrentFrame();
  const progress = Math.min(frame / totalFrames, 1);
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 24,
        right: 24,
        height: 4,
        background: 'rgba(255,255,255,0.22)',
        borderRadius: 99,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 99,
        }}
      />
    </div>
  );
}

// Transiciones variadas y cinematograficas.
// Cada cambio de tipo narrativo usa un efecto distinto: slide para abrir,
// wipe direccional para tension, clockWipe para escalada, fade para cierre.
function transitionFor(fromKind, toKind, fromIdx) {
  // Hook → Context: slide suave de la derecha (entrada a la historia)
  if (toKind === 'context' && fromKind === 'hook') {
    return { presentation: slide({ direction: 'from-right' }), frames: 20 };
  }
  // Context → Punch 1: wipe diagonal (tension narrativa)
  if (toKind === 'punch' && fromKind === 'context') {
    return { presentation: wipe({ direction: 'from-bottom-left' }), frames: 18 };
  }
  // Punch → Punch: clockWipe (sensacion de tiempo avanzando / tension escalando)
  if (toKind === 'punch' && fromKind === 'punch') {
    return { presentation: clockWipe({ width: 1080, height: 1920 }), frames: 22 };
  }
  // → CTA: fade largo cinematografico (calma para el cierre)
  if (toKind === 'cta') {
    return { presentation: fade(), frames: 26 };
  }
  return { presentation: fade(), frames: 16 };
}

export function VerticalReel({ scenes, brandHandle, musicPath, sfxPaths = {} }) {
  const { fps, durationInFrames } = useVideoConfig();
  const musicUrl = musicPath ? staticFile(musicPath) : null;
  const outroFrames = Math.round(fps * OUTRO_SECONDS);

  // SFX opcionales. render-video.mjs setea solo los paths que existen en disco.
  const whooshUrl = sfxPaths.whoosh ? staticFile(sfxPaths.whoosh) : null;
  const dingUrl = sfxPaths.ding ? staticFile(sfxPaths.ding) : null;
  const sceneStartFrames = [];
  let sceneAccum = 0;
  for (const scene of scenes) {
    sceneStartFrames.push(sceneAccum);
    sceneAccum += Math.round(scene.durationInSeconds * fps);
  }
  const outroStartFrame = sceneAccum;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* SFX whoosh en cada transicion (si existe archivo) */}
      {whooshUrl && sceneStartFrames.slice(1).map((f, i) => (
        <Sequence key={`sfx${i}`} from={Math.max(0, f - 4)} durationInFrames={Math.round(fps * 1)}>
          <Audio src={whooshUrl} volume={0.55} />
        </Sequence>
      ))}
      {/* Ding al empezar el outro (si existe archivo) */}
      {dingUrl && (
        <Sequence from={Math.max(0, outroStartFrame - 3)} durationInFrames={Math.round(fps * 1.2)}>
          <Audio src={dingUrl} volume={0.45} />
        </Sequence>
      )}

      {musicUrl && (
        <Audio
          src={musicUrl}
          // Crescendo suave lineal, sin ducking automatico.
          // Arranca 18%, termina 32% con pequeño boost al final.
          volume={(frame) => {
            const progress = frame / durationInFrames;
            const base = 0.18 + progress * 0.14;
            const endBoost = progress > 0.88 ? (progress - 0.88) * 0.5 : 0;
            return Math.min(base + endBoost, 0.38);
          }}
          startFrom={Math.round(fps * 12)}
        />
      )}

      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const dur = Math.round(scene.durationInSeconds * fps);
          const prev = scenes[i - 1];
          const elements = [];
          if (i > 0 && prev) {
            const t = transitionFor(prev.kind, scene.kind);
            elements.push(
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={t.presentation}
                timing={linearTiming({ durationInFrames: t.frames })}
              />
            );
          }
          elements.push(
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={dur}>
              <Scene scene={scene} />
            </TransitionSeries.Sequence>
          );
          return elements;
        })}

        {/* Outro branded con logo + URL llamado a accion.
            Slide desde abajo evita fade-to-black entre CTA y outro. */}
        <TransitionSeries.Transition
          key="t-outro"
          presentation={slide({ direction: 'from-bottom' })}
          timing={linearTiming({ durationInFrames: 12 })}
        />
        <TransitionSeries.Sequence key="s-outro" durationInFrames={outroFrames}>
          <BrandedOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <ProgressBar totalFrames={durationInFrames} />
      <BrandBadge handle={brandHandle} />
    </AbsoluteFill>
  );
}
