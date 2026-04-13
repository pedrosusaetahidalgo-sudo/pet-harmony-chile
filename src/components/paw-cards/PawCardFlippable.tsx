import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, FileText, Pencil, Trash2, PawPrint, Sparkles, Share2 } from '@/lib/icons';
import { getRarity, RARITY_LABELS, RARITY_RING } from '@/components/PetCardCompact';
import { PawCardHoloPattern } from './PawCardHoloPattern';
import { PawCardBack } from './PawCardBack';
import { useGyroscope } from '@/hooks/useGyroscope';
import { getSpeciesPalette, getBreedTint, HOLO_PATTERN_MAP } from '@/lib/paw-cards';
import type { HoloPattern } from '@/lib/paw-cards';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  photo_url: string | null;
  gender: string | null;
}

function calculateAge(birthDate: string): string {
  // Append T00:00:00 to force local-time parsing ��� Safari interprets
  // bare YYYY-MM-DD as UTC, which can shift the date by -1 day in UTC- zones.
  const birth = new Date(birthDate + 'T00:00:00');
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years === 0 && months === 0) return '< 1 mes';
  if (years === 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  if (months === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${years} ${years === 1 ? 'año' : 'años'}, ${months} m`;
}

function formatGender(gender: string): string {
  if (gender === 'macho') return 'Macho';
  if (gender === 'hembra') return 'Hembra';
  return gender;
}

interface PawCardFlippableProps {
  pet: Pet;
  score?: number;
  holoPattern?: HoloPattern;
  pawCardId?: string;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  /** Subtitle override (e.g. owner name for collected cards) */
  subtitle?: string;
  /** Hide action buttons (ficha, edit, delete, share) */
  viewOnly?: boolean;
}

export function PawCardFlippable({
  pet,
  score,
  holoPattern = 'holo-none',
  pawCardId = '',
  onDelete,
  onShare,
  subtitle: subtitleOverride,
  viewOnly = false,
}: PawCardFlippableProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const age = pet.birth_date ? calculateAge(pet.birth_date) : null;
  const gender = pet.gender ? formatGender(pet.gender) : null;
  const subtitle = subtitleOverride ?? [age, gender].filter(Boolean).join(' · ');
  const pawPoints = score ?? 0;
  const rarity = getRarity(pawPoints);
  const palette = getSpeciesPalette(pet.species);
  const breedTint = getBreedTint(pet.breed);
  const holoConfig = HOLO_PATTERN_MAP[holoPattern];

  // Mobile gyroscope support
  useGyroscope(cardRef);

  /* ── Glow tracking on mouse move (no tilt/rotation) ── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const glowX = ((x / rect.width) * 100).toFixed(1);
    const glowY = ((y / rect.height) * 100).toFixed(1);

    card.style.setProperty('--tcg-glow-x', `${glowX}%`);
    card.style.setProperty('--tcg-glow-y', `${glowY}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--tcg-glow-x', '50%');
    card.style.setProperty('--tcg-glow-y', '50%');
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  /* ── Touch swipe for flip ── */
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
      {}
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── FACE A: Front ── */}
        <div
          className="pet-card-tcg-inner h-full paw-card-face"
          style={{ background: palette.lightBg }}
          data-species-bg={palette.darkBg}
        >
          {/* Breed tint overlay */}
          {breedTint && (
            <div
              className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
              style={{ background: breedTint }}
            />
          )}
          {/* Holographic rainbow overlay */}
          <div className="pet-card-tcg-rainbow" />
          {/* Holo pattern */}
          <PawCardHoloPattern pattern={holoPattern} />
          {/* Sparkle texture */}
          <div className="pet-card-tcg-texture" />
          {/* Diagonal shine */}
          <div className="pet-card-tcg-shine" />

          {/* Content */}
          <div className="relative z-10 pt-4 pb-5 px-5 text-center flex flex-col items-center gap-1">
            {/* Top bar: rarity badge + species icon + paw points */}
            <div className="flex items-center justify-between w-full mb-2">
              <span className="tcg-rarity-badge" data-rarity={rarity}>
                {RARITY_LABELS[rarity]}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none" title={pet.species}>
                  {palette.icon}
                </span>
                <div className="tcg-paw-points">
                  <PawPrint className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                    {pawPoints}
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar frame — TCG style */}
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

            {/* Energy divider */}
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
              {subtitle && <p className="text-xs text-muted-foreground/80">{subtitle}</p>}
            </div>

            {/* Holo badge always visible */}
            {holoConfig && holoConfig.tier !== 'standard' && (
              <span
                className="paw-holo-tier-badge mt-0.5"
                data-tier={holoConfig.tier}
                style={{ fontSize: '8px' }}
              >
                {holoConfig.name}
              </span>
            )}

            {/* Sparkles icon for legendary+ */}
            {(rarity === 'legendary' || rarity === 'mythic') && (
              <>
                <Sparkles className="absolute top-3 right-3 h-5 w-5 text-yellow-400/60 animate-pulse" />
                <Sparkles
                  className="absolute top-12 left-3 h-3.5 w-3.5 text-yellow-300/40 animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
              </>
            )}

            {/* Corner accents */}
            <div className="tcg-corner-accent tcg-corner-tl" data-rarity={rarity} />
            <div className="tcg-corner-accent tcg-corner-br" data-rarity={rarity} />

            {/* Actions (hidden in viewOnly mode) */}
            {!viewOnly && (
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
                  Ficha Clinica
                </Button>
                {onShare && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-purple-200/60 hover:bg-purple-50/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(pet.id);
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4 text-purple-500" />
                    Compartir con tu vet
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-purple-200/60 hover:bg-purple-50/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/edit-pet/${pet.id}`);
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive border-purple-200/60 hover:bg-red-50/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pet.id);
                      }}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FACE B: Back ── */}
        <div className="paw-card-face-back">
          <PawCardBack
            petName={pet.name}
            species={pet.species}
            pawCardId={pawCardId}
            holoPattern={holoPattern}
            rarity={rarity}
          />
        </div>
      </div>
    </div>
  );
}
