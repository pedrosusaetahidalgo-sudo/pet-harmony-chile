import { useState, useEffect, useCallback, useRef } from 'react';
import { PawPrint, Sparkles, Star, X } from '@/lib/icons';
import { HOLO_PATTERN_MAP } from '@/lib/paw-cards';
import { getRarity, RARITY_LABELS } from '@/components/PetCardCompact';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart } from '@/lib/icons';
import type { HoloPattern } from '@/lib/paw-cards';
import type { Rarity } from '@/components/PetCardCompact';
import pawIcon from '@/assets/paw_friend_icon.svg';

interface PetRevealData {
  name: string;
  species: string;
  breed: string | null;
  photo_url: string | null;
  pawCardId: string;
  holoPattern: HoloPattern;
  score: number;
}

interface PawCardRevealCeremonyProps {
  pet: PetRevealData;
  onComplete: () => void;
}

type Phase =
  | 'pack-idle' // Pack glowing, waiting
  | 'pack-shake' // Pack shakes intensely
  | 'pack-crack' // Crack appears with light
  | 'pack-burst' // Pack explodes, energy burst
  | 'card-fly' // Card flies in from burst
  | 'card-land' // Card lands with impact
  | 'card-flip' // Card flips to reveal front
  | 'holo-reveal' // Holo pattern shines
  | 'stats-appear' // Name, rarity, stats appear
  | 'done';

/* ── Synthesized sound effects via Web Audio API ── */
function createAudioContext(): AudioContext | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  delay = 0
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playPackShake(ctx: AudioContext) {
  // Low rumble
  for (let i = 0; i < 6; i++) {
    playTone(ctx, 60 + Math.random() * 40, 0.15, 'sawtooth', 0.06, i * 0.1);
  }
}

function playCrack(ctx: AudioContext) {
  // Sharp crack + sparkle
  playTone(ctx, 800, 0.08, 'square', 0.2);
  playTone(ctx, 1200, 0.05, 'square', 0.15, 0.03);
  playTone(ctx, 2000, 0.1, 'sine', 0.1, 0.06);
}

function playBurst(ctx: AudioContext, isRare: boolean) {
  // Big whoosh + chime
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  noise.connect(g);
  g.connect(ctx.destination);
  noise.start();

  // Rising chime
  const notes = isRare ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
  notes.forEach((f, i) => playTone(ctx, f, 0.4, 'sine', 0.12, i * 0.08));
}

function playCardLand(ctx: AudioContext) {
  playTone(ctx, 200, 0.15, 'triangle', 0.2);
  playTone(ctx, 150, 0.2, 'sine', 0.1, 0.05);
}

function playRevealFanfare(ctx: AudioContext, rarity: Rarity) {
  const fanfares: Record<string, number[]> = {
    common: [392, 440, 523],
    uncommon: [392, 494, 587, 659],
    rare: [392, 494, 587, 784],
    epic: [392, 494, 587, 784, 988],
    legendary: [392, 494, 587, 784, 988, 1175],
    mythic: [392, 494, 587, 784, 988, 1175, 1397],
  };
  const notes = fanfares[rarity] || fanfares.common;
  notes.forEach((f, i) => {
    playTone(ctx, f, 0.6, 'sine', 0.1, i * 0.12);
    if (rarity === 'legendary' || rarity === 'mythic') {
      playTone(ctx, f * 1.5, 0.5, 'triangle', 0.05, i * 0.12 + 0.05);
    }
  });
}

/* ── Particle system ── */
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  type: 'spark' | 'star' | 'ring';
}

const RARITY_COLORS: Record<Rarity, string[]> = {
  common: ['#cd7f32', '#e8c07a', '#b87333'],
  uncommon: ['#c0c0c0', '#e8e8e8', '#a8a8a8'],
  rare: ['#ffd700', '#ffa500', '#ffec8b'],
  epic: ['#00ced1', '#7b68ee', '#da70d6'],
  legendary: ['#ff4500', '#ff6347', '#ffd700', '#ff8c00'],
  mythic: ['#ff0080', '#ffd700', '#00ff88', '#00bfff', '#8b5cf6'],
};

let particleCounter = 0;
function createBurstParticles(rarity: Rarity): Particle[] {
  const colors = RARITY_COLORS[rarity];
  const count =
    rarity === 'mythic' ? 60 : rarity === 'legendary' ? 45 : rarity === 'epic' ? 35 : 20;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const speed = 3 + Math.random() * 5;
    particles.push({
      id: particleCounter++,
      x: 50,
      y: 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      type: Math.random() > 0.7 ? 'star' : 'spark',
    });
  }
  return particles;
}

export function PawCardRevealCeremony({ pet, onComplete }: PawCardRevealCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('pack-idle');
  const [particles, setParticles] = useState<Particle[]>([]);
  const audioRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);

  const rarity = getRarity(pet.score);
  const holoConfig = HOLO_PATTERN_MAP[pet.holoPattern];
  const isRare = rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic';

  // Initialize audio on first interaction
  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = createAudioContext();
    }
    return audioRef.current;
  }, []);

  // Particle animation loop
  const hasParticles = particles.length > 0;
  useEffect(() => {
    if (!hasParticles) return;
    const tick = () => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.3,
            y: p.y + p.vy * 0.3,
            vy: p.vy + 0.05,
            life: p.life - 0.015,
            size: p.size * 0.995,
          }))
          .filter((p) => p.life > 0);
        return next;
      });
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [hasParticles]);

  // Phase sequencer
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Pack appears idle for a moment
    timers.push(
      setTimeout(() => {
        setPhase('pack-shake');
        const ctx = ensureAudio();
        if (ctx) playPackShake(ctx);
      }, 600)
    );

    // Pack starts shaking
    timers.push(
      setTimeout(() => {
        setPhase('pack-crack');
        const ctx = ensureAudio();
        if (ctx) playCrack(ctx);
      }, 1400)
    );

    // Crack widens, light pours out
    timers.push(
      setTimeout(() => {
        setPhase('pack-burst');
        setParticles(createBurstParticles(rarity));
        const ctx = ensureAudio();
        if (ctx) playBurst(ctx, isRare);
      }, 2000)
    );

    // Card flies in
    timers.push(setTimeout(() => setPhase('card-fly'), 2500));

    // Card lands with impact
    timers.push(
      setTimeout(() => {
        setPhase('card-land');
        const ctx = ensureAudio();
        if (ctx) playCardLand(ctx);
        // More particles on land
        if (isRare) {
          setParticles((prev) => [
            ...prev,
            ...createBurstParticles(rarity).map((p) => ({
              ...p,
              y: 65,
              vy: -Math.abs(p.vy) * 0.5,
            })),
          ]);
        }
      }, 3000)
    );

    // Card flips to front
    timers.push(setTimeout(() => setPhase('card-flip'), 3600));

    // Holo pattern shines
    timers.push(
      setTimeout(() => {
        setPhase('holo-reveal');
        const ctx = ensureAudio();
        if (ctx) playRevealFanfare(ctx, rarity);
        // Final burst of particles
        setParticles((prev) => [...prev, ...createBurstParticles(rarity)]);
      }, 4200)
    );

    // Stats and info appear
    timers.push(setTimeout(() => setPhase('stats-appear'), 5000));

    return () => timers.forEach(clearTimeout);
  }, [rarity, isRare, ensureAudio]);

  const handleSkip = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.close().catch(() => {});
    }
    onComplete();
  }, [onComplete]);

  const handleContinue = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.close().catch(() => {});
    }
    onComplete();
  }, [onComplete]);

  // Rarity-specific background effect
  const bgGlow = isRare
    ? rarity === 'mythic'
      ? 'radial-gradient(ellipse at center, rgba(139,92,246,0.3) 0%, rgba(0,191,255,0.15) 40%, transparent 70%)'
      : rarity === 'legendary'
        ? 'radial-gradient(ellipse at center, rgba(255,69,0,0.25) 0%, rgba(255,165,0,0.1) 40%, transparent 70%)'
        : 'radial-gradient(ellipse at center, rgba(123,104,238,0.2) 0%, rgba(0,206,209,0.1) 40%, transparent 70%)'
    : 'none';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      {/* Animated background glow */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: phase !== 'pack-idle' ? bgGlow : 'none' }}
      />

      {/* Light rays for rare+ */}
      {isRare && (phase === 'holo-reveal' || phase === 'stats-appear') && (
        <div className="reveal-light-rays" data-rarity={rarity} />
      )}

      {/* Screen shake wrapper */}
      <div
        className={`relative flex flex-col items-center ${phase === 'pack-burst' || phase === 'card-land' ? 'reveal-screen-shake' : ''}`}
      >
        {/* ═══ PACK ═══ */}
        {(phase === 'pack-idle' || phase === 'pack-shake' || phase === 'pack-crack') && (
          <div
            className={`reveal-pack ${phase === 'pack-shake' ? 'shaking' : ''} ${phase === 'pack-crack' ? 'cracking' : ''}`}
          >
            <div className="reveal-pack-body" data-rarity={rarity}>
              <img src={pawIcon} alt="" className="w-20 h-20 rounded-2xl" />
              <div className="reveal-pack-glow" data-rarity={rarity} />
              {phase === 'pack-crack' && <div className="reveal-pack-crack" />}
            </div>
            <p className="text-white/50 text-sm mt-6 animate-pulse">
              {phase === 'pack-idle'
                ? 'Preparando tu Paw Card...'
                : phase === 'pack-shake'
                  ? 'Algo poderoso se acerca...'
                  : ''}
            </p>
          </div>
        )}

        {/* ═══ BURST FLASH ═══ */}
        {phase === 'pack-burst' && <div className="reveal-burst-flash" data-rarity={rarity} />}

        {/* ═══ CARD ═══ */}
        {(phase === 'card-fly' ||
          phase === 'card-land' ||
          phase === 'card-flip' ||
          phase === 'holo-reveal' ||
          phase === 'stats-appear') && (
          <div className={`reveal-card-container ${phase}`}>
            <div
              className={`reveal-card-inner ${phase === 'card-flip' || phase === 'holo-reveal' || phase === 'stats-appear' ? 'flipped' : ''}`}
            >
              {/* Card Back */}
              <div className="reveal-card-face reveal-card-back" data-rarity={rarity}>
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <img src={pawIcon} alt="" className="w-16 h-16 rounded-xl opacity-80" />
                  <PawPrint className="h-8 w-8 text-white/40" />
                </div>
              </div>
              {/* Card Front */}
              <div className="reveal-card-face reveal-card-front">
                <div className="pet-card-tcg h-full" data-rarity={rarity}>
                  <div className="pet-card-tcg-inner h-full">
                    <div className="pet-card-tcg-rainbow" />
                    {holoConfig && (
                      <div
                        className={`paw-holo-base ${holoConfig.cssClass}`}
                        style={{
                          opacity: phase === 'holo-reveal' || phase === 'stats-appear' ? 1 : 0,
                        }}
                      />
                    )}
                    <div className="pet-card-tcg-texture" />
                    <div className="pet-card-tcg-shine" />

                    <div className="relative z-10 pt-5 pb-4 px-4 text-center flex flex-col items-center gap-2">
                      {/* Rarity badge */}
                      <span className="tcg-rarity-badge" data-rarity={rarity}>
                        {RARITY_LABELS[rarity]}
                      </span>

                      {/* Avatar */}
                      <div className="tcg-avatar-frame" data-rarity={rarity}>
                        <Avatar className="h-20 w-20 ring-[3px] ring-purple-400 rounded-full shadow-lg">
                          <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-300">
                            <Heart className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Energy divider */}
                      <div className="tcg-energy-divider" data-rarity={rarity} />

                      {/* Name & info */}
                      <h3 className="font-bold text-base leading-tight">{pet.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{pet.species}</p>
                      {pet.breed && (
                        <p className="text-[10px] text-muted-foreground/70">{pet.breed}</p>
                      )}

                      {/* Paw Points */}
                      <div className="flex items-center gap-1 mt-1">
                        <PawPrint className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-xs font-bold text-purple-700">{pet.score}</span>
                      </div>

                      {(rarity === 'legendary' || rarity === 'mythic') && (
                        <Sparkles className="absolute top-2 right-2 h-5 w-5 text-yellow-400/60 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STATS PANEL ═══ */}
        {phase === 'stats-appear' && (
          <div className="reveal-stats-panel animate-fade-in-up mt-6 text-center space-y-3">
            <p className="text-white/50 text-xs uppercase tracking-[0.2em] font-medium">
              Tu nueva Paw Card
            </p>
            <h2 className="text-white text-2xl font-bold">{pet.name}</h2>
            <div className="flex items-center justify-center gap-3">
              <span className="tcg-rarity-badge" data-rarity={rarity}>
                {RARITY_LABELS[rarity]}
              </span>
              {holoConfig && holoConfig.id !== 'holo-none' && (
                <span className="paw-holo-tier-badge" data-tier={holoConfig.tier}>
                  {holoConfig.name}
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs">ID: {pet.pawCardId}</p>

            <button
              onClick={handleContinue}
              className="reveal-continue-btn mt-4"
              data-rarity={rarity}
            >
              <Star className="h-4 w-4" />
              Ir a mis mascotas
            </button>
          </div>
        )}

        {/* ═══ PARTICLES ═══ */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          {particles.map((p) => (
            <circle
              key={p.id}
              cx={`${p.x}%`}
              cy={`${p.y}%`}
              r={p.size}
              fill={p.color}
              opacity={p.life}
              filter={p.life > 0.5 ? 'url(#glow)' : undefined}
            />
          ))}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Skip button */}
      {phase !== 'stats-appear' && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 text-white/30 hover:text-white/70 transition-colors flex items-center gap-1 text-xs"
        >
          <X className="h-4 w-4" />
          Saltar
        </button>
      )}
    </div>
  );
}
