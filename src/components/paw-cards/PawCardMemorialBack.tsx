/**
 * Back face of a memorial Paw Card.
 * Replaces QR/share with a heartfelt remembrance message.
 */
import { Heart, PawPrint, Star } from '@/lib/icons';
import { PawCardHoloPattern } from './PawCardHoloPattern';
import type { HoloPattern } from '@/lib/paw-cards';
import type { Rarity } from '@/components/PetCardCompact';
import pawIcon from '@/assets/paw_friend_icon.svg';

interface PawCardMemorialBackProps {
  petName: string;
  species: string;
  holoPattern: HoloPattern;
  rarity: Rarity;
  passedAwayAt?: string | null;
  memorialMessage?: string | null;
}

export function PawCardMemorialBack({
  petName,
  species,
  holoPattern,
  rarity,
  passedAwayAt,
  memorialMessage,
}: PawCardMemorialBackProps) {
  const formattedDate = passedAwayAt
    ? new Date(passedAwayAt + 'T00:00:00').toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="paw-card-back h-full" data-rarity={rarity}>
      {/* Watermark background */}
      <div className="paw-card-back-watermark" />

      {/* Holo pattern overlay — more subdued */}
      <div className="absolute inset-0 opacity-10 pointer-events-none rounded-[inherit]">
        <PawCardHoloPattern pattern={holoPattern} />
      </div>

      {/* Decorative corner filigree */}
      <div className="paw-card-back-filigree paw-card-back-filigree-tl" />
      <div className="paw-card-back-filigree paw-card-back-filigree-tr" />
      <div className="paw-card-back-filigree paw-card-back-filigree-bl" />
      <div className="paw-card-back-filigree paw-card-back-filigree-br" />

      {/* Shine effect */}
      <div className="paw-card-back-shine" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-4 px-4 text-center">
        {/* Top: Logo + brand */}
        <div className="flex items-center gap-2">
          <img
            src={pawIcon}
            alt="Paw Friend"
            className="w-6 h-6 rounded-lg shadow-lg shadow-purple-500/30 opacity-80"
          />
          <span className="text-[10px] font-bold text-white/70 tracking-widest uppercase">
            Paw Friend
          </span>
        </div>

        {/* Center: Memorial message */}
        <div className="flex flex-col items-center gap-3 max-w-[200px]">
          <div className="paw-card-back-ornament" />

          {/* Memorial heart icon */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Heart className="h-7 w-7 text-purple-300 fill-purple-300/30" />
            </div>
            <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300/60" />
          </div>

          <p className="text-xs font-semibold text-white/90 leading-relaxed">
            Por siempre en nuestro corazón
          </p>

          {memorialMessage ? (
            <p className="text-[11px] text-purple-200/70 italic leading-relaxed line-clamp-3">
              "{memorialMessage}"
            </p>
          ) : (
            <p className="text-[11px] text-purple-200/50 leading-relaxed">
              Los recuerdos más bonitos nunca se van
            </p>
          )}

          {formattedDate && <p className="text-[10px] text-purple-300/50">{formattedDate}</p>}

          <div className="paw-card-back-ornament" />
        </div>

        {/* Bottom: Pet name + species */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            <PawPrint className="h-3 w-3 text-purple-300" />
            <span className="text-[11px] font-semibold text-white/90">{petName}</span>
            <span className="text-purple-400/40">|</span>
            <span className="text-[11px] text-purple-300/80">{species}</span>
          </div>
          <span className="text-[8px] text-purple-400/30 tracking-widest uppercase">
            In memoriam
          </span>
        </div>
      </div>
    </div>
  );
}
