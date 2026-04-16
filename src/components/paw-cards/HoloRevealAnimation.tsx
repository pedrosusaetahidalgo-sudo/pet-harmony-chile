import { useState, useEffect, useCallback } from 'react';
import { PawPrint, Sparkles } from '@/lib/icons';
import { HOLO_PATTERN_MAP } from '@/lib/paw-cards';
import type { HoloPattern } from '@/lib/paw-cards';
import pawIcon from '@/assets/paw_friend_icon.svg';

interface HoloRevealAnimationProps {
  holoPattern: HoloPattern;
  onComplete: () => void;
}

type Phase = 'envelope' | 'opening' | 'card' | 'result' | 'done';

/**
 * Animacion de apertura de sobre para revelar el patron holografico.
 * Se usa al crear una mascota nueva.
 */
export function HoloRevealAnimation({ holoPattern, onComplete }: HoloRevealAnimationProps) {
  const [phase, setPhase] = useState<Phase>('envelope');
  const config = HOLO_PATTERN_MAP[holoPattern];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Sequence: envelope -> opening -> card -> result -> done
    timers.push(setTimeout(() => setPhase('opening'), 800));
    timers.push(setTimeout(() => setPhase('card'), 1600));
    timers.push(setTimeout(() => setPhase('result'), 2400));
    timers.push(setTimeout(() => setPhase('done'), 4500));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === 'done') onComplete();
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => {
    setPhase('done');
  }, []);

  if (phase === 'done') return null;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleSkip}
      role="dialog"
      aria-label="Revelando patron holografico"
    >
      {/* Flash */}
      {(phase === 'card' || phase === 'result') && (
        <div className="holo-reveal-flash" data-tier={config?.tier || 'standard'} />
      )}

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="relative flex flex-col items-center gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Envelope */}
        {(phase === 'envelope' || phase === 'opening') && (
          <div className="relative w-64 h-40">
            {/* Envelope body */}
            <div className="holo-reveal-envelope absolute inset-0 flex items-center justify-center">
              <img src={pawIcon} alt="" className="w-16 h-16 rounded-2xl opacity-80" />
            </div>

            {/* Envelope flap */}
            <div
              className={`holo-reveal-flap absolute top-0 left-0 right-0 h-20 rounded-t-xl ${phase === 'opening' ? 'opening' : ''}`}
            />
          </div>
        )}

        {/* Card emerging */}
        {(phase === 'card' || phase === 'result') && (
          <div className="holo-reveal-card w-48 h-64 rounded-xl overflow-hidden shadow-2xl shadow-purple-500/30">
            <div className="pet-card-tcg h-full" data-rarity="rare">
              <div className="pet-card-tcg-inner h-full flex items-center justify-center">
                <div className="pet-card-tcg-rainbow" />
                <div
                  className={`paw-holo-base ${config?.cssClass || 'paw-holo-none'}`}
                  style={{ opacity: 1 }}
                />
                <div className="pet-card-tcg-texture" />

                <div className="relative z-10 text-center p-6 space-y-3">
                  <PawPrint className="h-12 w-12 text-purple-400 mx-auto" />
                  {config?.tier === 'ultra-rare' && (
                    <Sparkles className="h-8 w-8 text-yellow-400 mx-auto animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result text */}
        {phase === 'result' && config && (
          <div className="text-center space-y-2 animate-fade-in">
            <p className="text-white/60 text-xs uppercase tracking-widest font-medium">Obtuviste</p>
            <h2 className="text-white text-2xl font-bold">{config.name}</h2>
            <span className="paw-holo-tier-badge inline-block" data-tier={config.tier}>
              {Math.round(config.probability * 100)}% de probabilidad
            </span>
          </div>
        )}

        {/* Skip hint */}
        <p className="text-white/30 text-xs mt-4">Toca para saltar</p>
      </div>
    </div>
  );
}
