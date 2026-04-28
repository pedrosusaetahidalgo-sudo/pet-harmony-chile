/**
 * Memorial Paw Card — same TCG front as PawCardFlippable but with
 * a memorial back that shows a remembrance message instead of QR.
 * Has a subtle grayscale + purple tint and a memorial badge on top.
 */
import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, FileText } from '@/lib/icons';
import { getRarity, RARITY_RING } from '@/components/PetCardCompact';
import { PawCardHoloPattern } from './PawCardHoloPattern';
import { PawCardMemorialBack } from './PawCardMemorialBack';
import { getSpeciesPalette, getBreedTint, HOLO_PATTERN_MAP } from '@/lib/paw-cards';
import type { HoloPattern } from '@/lib/paw-cards';

interface MemorialPet {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  photo_url?: string | null;
  passed_away_at?: string | null;
  memorial_message?: string | null;
  holo_pattern?: string | null;
  paw_card_id?: string | null;
}

interface PawCardMemorialProps {
  pet: MemorialPet;
  score?: number;
}

export function PawCardMemorial({ pet, score }: PawCardMemorialProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const pawPoints = score ?? 0;
  const rarity = getRarity(pawPoints);
  const holoPattern = (pet.holo_pattern as HoloPattern) || 'holo-none';
  const palette = getSpeciesPalette(pet.species);
  const breedTint = getBreedTint(pet.breed ?? null);
  const holoConfig = HOLO_PATTERN_MAP[holoPattern];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 60) {
      setIsFlipped((prev) => !prev);
    }
  }, []);

  return (
    <div className="paw-card-flip-container h-full">
      <div
        ref={cardRef}
        className={`pet-card-tcg h-full paw-card-flipper ${isFlipped ? 'flipped' : ''} cursor-pointer`}
        data-rarity={rarity}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Volver al frente' : 'Voltear carta'}
        onClick={handleFlip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFlip();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ filter: 'saturate(0.5) brightness(0.95)' }}
      >
        {/* ── FACE A: Front (same TCG layout, slightly desaturated) ── */}
        <div
          className="pet-card-tcg-inner h-full paw-card-face"
          style={{ background: palette.lightBg }}
        >
          {breedTint && (
            <div
              className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
              style={{ background: breedTint }}
            />
          )}
          <div className="pet-card-tcg-rainbow" />
          <PawCardHoloPattern pattern={holoPattern} />
          <div className="pet-card-tcg-texture" />
          <div className="pet-card-tcg-shine" />

          <div className="relative z-10 pt-4 pb-5 px-5 text-center flex flex-col items-center gap-1">
            {/* Top bar: memorial badge + species */}
            <div className="flex items-center justify-between w-full mb-2">
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-600 border-purple-200"
              >
                <Heart className="h-2.5 w-2.5 mr-1 fill-purple-400" />
                In memoriam
              </Badge>
              <span className="text-lg leading-none" title={pet.species}>
                {palette.icon}
              </span>
            </div>

            {/* Avatar */}
            <div className="tcg-avatar-frame" data-rarity={rarity}>
              <Avatar
                className={`h-[88px] w-[88px] ring-[3px] ${RARITY_RING[rarity]} rounded-full shadow-lg`}
              >
                <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-300">
                  <Heart className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="tcg-energy-divider" data-rarity={rarity} />

            {/* Info */}
            <div className="space-y-0.5">
              <h3 className="pet-card-name font-bold text-xl leading-tight" data-rarity={rarity}>
                {pet.name}
              </h3>
              {pet.breed && (
                <p className="text-sm font-medium" style={{ color: palette.accent }}>
                  {pet.breed}
                </p>
              )}
              <p className="text-xs text-purple-400">Por siempre en nuestro corazón</p>
            </div>

            {holoConfig && holoConfig.tier !== 'standard' && (
              <span
                className="paw-holo-tier-badge mt-0.5"
                data-tier={holoConfig.tier}
                style={{ fontSize: '8px' }}
              >
                {holoConfig.name}
              </span>
            )}

            <div className="tcg-corner-accent tcg-corner-tl" data-rarity={rarity} />
            <div className="tcg-corner-accent tcg-corner-br" data-rarity={rarity} />

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-3 w-full">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-sm shadow-purple-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(LINKS.petClinical(pet.id));
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver ficha
              </Button>
            </div>
          </div>
        </div>

        {/* ── FACE B: Memorial Back ── */}
        <div className="paw-card-face-back">
          <PawCardMemorialBack
            petName={pet.name}
            species={pet.species}
            holoPattern={holoPattern}
            rarity={rarity}
            passedAwayAt={pet.passed_away_at}
            memorialMessage={pet.memorial_message}
          />
        </div>
      </div>
    </div>
  );
}
