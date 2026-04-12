import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, FileText, Pencil, Trash2, PawPrint, Sparkles } from '@/lib/icons';

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
  const birth = new Date(birthDate);
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

/* ── Rarity system based on paw points ── */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export function getRarity(score: number): Rarity {
  if (score >= 95) return 'mythic';
  if (score >= 80) return 'legendary';
  if (score >= 60) return 'epic';
  if (score >= 40) return 'rare';
  if (score >= 20) return 'uncommon';
  return 'common';
}

const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Común',
  uncommon: 'Poco Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  mythic: 'Mítico',
};

const RARITY_RING: Record<Rarity, string> = {
  common: 'ring-gray-300',
  uncommon: 'ring-green-400',
  rare: 'ring-blue-400',
  epic: 'ring-purple-400',
  legendary: 'ring-yellow-400',
  mythic: 'ring-pink-400',
};

interface PetCardCompactProps {
  pet: Pet;
  score?: number; // 0-100 overall from pet_paw_progress
  onDelete: (id: string) => void;
}

export function PetCardCompact({ pet, score, onDelete }: PetCardCompactProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const age = pet.birth_date ? calculateAge(pet.birth_date) : null;
  const gender = pet.gender ? formatGender(pet.gender) : null;
  const subtitle = [age, gender].filter(Boolean).join(' · ');
  const pawPoints = score ?? 0;
  const rarity = getRarity(pawPoints);

  /* ── 3D tilt on mouse move (desktop only) ── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Tilt: max ±12 degrees
    const rotateY = ((x - centerX) / centerX) * 12;
    const rotateX = ((centerY - y) / centerY) * 12;

    // Glow position as percentage
    const glowX = ((x / rect.width) * 100).toFixed(1);
    const glowY = ((y / rect.height) * 100).toFixed(1);

    card.style.setProperty('--tcg-rotate-x', `${rotateX}deg`);
    card.style.setProperty('--tcg-rotate-y', `${rotateY}deg`);
    card.style.setProperty('--tcg-glow-x', `${glowX}%`);
    card.style.setProperty('--tcg-glow-y', `${glowY}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--tcg-rotate-x', '0deg');
    card.style.setProperty('--tcg-rotate-y', '0deg');
    card.style.setProperty('--tcg-glow-x', '50%');
    card.style.setProperty('--tcg-glow-y', '50%');
  }, []);

  return (
    <div className="tcg-perspective h-full">
      <div
        ref={cardRef}
        className="pet-card-tcg h-full"
        data-rarity={rarity}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="pet-card-tcg-inner h-full">
          {/* Holographic rainbow overlay */}
          <div className="pet-card-tcg-rainbow" />
          {/* Sparkle texture */}
          <div className="pet-card-tcg-texture" />
          {/* Diagonal shine */}
          <div className="pet-card-tcg-shine" />

          {/* Content */}
          <div className="relative z-10 pt-4 pb-5 px-5 text-center flex flex-col items-center gap-1">
            {/* Top bar: rarity badge + paw points */}
            <div className="flex items-center justify-between w-full mb-2">
              <span className="tcg-rarity-badge" data-rarity={rarity}>
                {RARITY_LABELS[rarity]}
              </span>
              <div className="tcg-paw-points">
                <PawPrint className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  {pawPoints}
                </span>
              </div>
            </div>

            {/* Avatar with rarity-colored ring */}
            <Avatar
              className={`h-24 w-24 ring-[3px] ${RARITY_RING[rarity]} rounded-full shadow-lg`}
            >
              <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-300">
                <Heart className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="mt-3 space-y-0.5">
              <div className="flex items-center justify-center gap-2">
                <h3 className="pet-card-name font-bold text-lg leading-tight">{pet.name}</h3>
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wider font-semibold bg-purple-100/80 text-purple-700 border border-purple-200/50"
                >
                  {pet.species}
                </Badge>
              </div>
              {pet.breed && (
                <p className="text-sm text-muted-foreground font-medium">{pet.breed}</p>
              )}
              {subtitle && <p className="text-xs text-muted-foreground/80">{subtitle}</p>}
            </div>

            {/* Decorative element: sparkles icon for legendary+ */}
            {(rarity === 'legendary' || rarity === 'mythic') && (
              <Sparkles className="absolute top-3 right-3 h-5 w-5 text-yellow-400/60" />
            )}

            {/* Tiny paw watermark */}
            <PawPrint className="absolute bottom-14 right-4 h-8 w-8 text-purple-200/20" />

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 w-full">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-sm shadow-purple-500/20"
                onClick={() => navigate(LINKS.petClinical(pet.id))}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ficha Clínica
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-purple-200/60 hover:bg-purple-50/50"
                  onClick={() => navigate(`/edit-pet/${pet.id}`)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive border-purple-200/60 hover:bg-red-50/50"
                  onClick={() => onDelete(pet.id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
