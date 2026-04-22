import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Captions estilo TikTok "word highlighting": toda la frase visible,
// la palabra activa se resalta en amarillo con scale bounce.
// Formato input (Remotion whisper.cpp):
//   [{ text: "Ema", startInSeconds: 0.22 }, ...]
// Agrupa palabras en "frases" de ~6 palabras para mostrarlas juntas.

function buildPhrases(captions, wordsPerPhrase = 6) {
  const phrases = [];
  for (let i = 0; i < captions.length; i += wordsPerPhrase) {
    const group = captions.slice(i, i + wordsPerPhrase);
    if (group.length === 0) continue;
    phrases.push({
      startInSeconds: group[0].startInSeconds,
      words: group.map((c) => ({
        text: (c.text ?? '').trim(),
        startInSeconds: c.startInSeconds,
      })),
    });
  }
  return phrases;
}

// Paleta brand. highlightBg = fondo del chip de la palabra activa.
// textActive = color del texto de esa palabra (inverso al chip).
const BRAND_HIGHLIGHT = {
  bg: '#9333EA',
  text: '#FFFFFF',
};

export function TikTokCaptions({ captions, accent = BRAND_HIGHLIGHT.bg, offsetSec = 0 }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // Los captions de Whisper estan timestampeados desde el inicio del MP3.
  // Si el MP3 arranca en offsetSec dentro de la escena, hay que desplazar.
  const currentSec = frame / fps - offsetSec;
  const sceneDur = durationInFrames / fps;

  if (!captions || captions.length === 0) return null;
  if (currentSec < 0) return null;

  const phrases = buildPhrases(captions, 6);

  // Buscar la frase activa y la palabra activa dentro.
  let activePhraseIdx = -1;
  for (let i = 0; i < phrases.length; i++) {
    if (phrases[i].startInSeconds <= currentSec) activePhraseIdx = i;
    else break;
  }
  if (activePhraseIdx === -1) return null;

  const phrase = phrases[activePhraseIdx];
  const nextPhrase = phrases[activePhraseIdx + 1];
  const phraseEndSec = nextPhrase ? nextPhrase.startInSeconds : sceneDur;
  if (currentSec > phraseEndSec) return null;

  // Palabra activa dentro de la frase.
  let activeWordIdx = -1;
  for (let i = 0; i < phrase.words.length; i++) {
    if (phrase.words[i].startInSeconds <= currentSec) activeWordIdx = i;
    else break;
  }

  // Entry animation para la frase completa
  const phraseStartFrame = phrase.startInSeconds * fps;
  const phraseProgress = Math.max(0, Math.min(1, (frame - phraseStartFrame) / (fps * 0.15)));
  const phraseOpacity = phraseProgress;
  const phraseY = interpolate(phraseProgress, [0, 1], [24, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '22%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 60px',
        pointerEvents: 'none',
        opacity: phraseOpacity,
        transform: `translateY(${phraseY}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 14,
          maxWidth: '90%',
        }}
      >
        {phrase.words.map((word, i) => {
          const isActive = i === activeWordIdx;
          const isPast = i < activeWordIdx;

          // Bounce cuando la palabra se activa
          const wordStartFrame = word.startInSeconds * fps;
          const bounceFrame = frame - wordStartFrame;
          const bounceProgress = isActive ? Math.max(0, Math.min(1, bounceFrame / (fps * 0.12))) : 1;
          const activeScale = isActive ? interpolate(bounceProgress, [0, 1], [0.75, 1.05]) : 1;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: isActive ? 84 : 68,
                fontWeight: 900,
                letterSpacing: '-2px',
                color: isActive ? BRAND_HIGHLIGHT.text : isPast ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)',
                background: isActive ? accent : 'transparent',
                padding: isActive ? '10px 22px' : '6px 8px',
                borderRadius: 14,
                textShadow: isActive ? 'none' : '0 3px 10px rgba(0,0,0,0.55), 0 6px 24px rgba(0,0,0,0.45)',
                boxShadow: isActive ? '0 14px 32px rgba(0,0,0,0.35), inset 0 -5px 0 rgba(0,0,0,0.2)' : 'none',
                transform: `scale(${activeScale})`,
                textTransform: 'uppercase',
                lineHeight: 1,
                transition: 'none',
              }}
            >
              {word.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
