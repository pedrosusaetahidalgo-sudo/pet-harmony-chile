import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, FileText, Pencil, Trash2, PawPrint, Star } from '@/lib/icons';

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

function getScoreRing(score: number): string {
  if (score >= 80) return 'ring-green-400/60';
  if (score >= 60) return 'ring-yellow-400/60';
  if (score >= 40) return 'ring-orange-400/60';
  return 'ring-red-400/60';
}

function getScoreLabel(score: number): { text: string; className: string } {
  if (score >= 80)
    return { text: 'Excelente', className: 'bg-green-500/15 text-green-700 border-green-300/40' };
  if (score >= 60)
    return { text: 'Bueno', className: 'bg-yellow-500/15 text-yellow-700 border-yellow-300/40' };
  if (score >= 40)
    return { text: 'Regular', className: 'bg-orange-500/15 text-orange-700 border-orange-300/40' };
  return { text: 'Atención', className: 'bg-red-500/15 text-red-700 border-red-300/40' };
}

interface PetCardCompactProps {
  pet: Pet;
  score?: number; // 0-100 overall from pet_paw_progress
  onDelete: (id: string) => void;
}

export function PetCardCompact({ pet, score, onDelete }: PetCardCompactProps) {
  const navigate = useNavigate();

  const age = pet.birth_date ? calculateAge(pet.birth_date) : null;
  const gender = pet.gender ? formatGender(pet.gender) : null;
  const subtitle = [age, gender].filter(Boolean).join(' · ');
  const hasScore = score !== undefined;
  const scoreLabel = hasScore ? getScoreLabel(score) : null;

  return (
    <div className="pet-card-holo h-full">
      <div className="pet-card-holo-inner h-full">
        {/* Sparkle texture */}
        <div className="pet-card-holo-texture" />

        {/* Content — above overlays */}
        <div className="relative z-10 pt-5 pb-5 px-5 text-center flex flex-col items-center gap-1">
          {/* Accent stripe */}
          <div className="pet-card-accent-stripe w-12 mb-3" />

          {/* Score badge — top-left */}
          {hasScore && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-sm px-2 py-0.5 shadow-sm border border-purple-200/40">
                <Star className="h-3 w-3 text-purple-500 fill-purple-500" />
                <span className="text-xs font-bold text-purple-700">{score}</span>
              </div>
            </div>
          )}

          {/* Avatar with score-colored ring */}
          <Avatar
            className={`h-24 w-24 ring-2 ${hasScore ? getScoreRing(score) : 'ring-purple-300/50'} holo-avatar-ring rounded-full`}
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
            {pet.breed && <p className="text-sm text-muted-foreground font-medium">{pet.breed}</p>}
            {subtitle && <p className="text-xs text-muted-foreground/80">{subtitle}</p>}
            {scoreLabel && (
              <div className="pt-1">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${scoreLabel.className}`}
                >
                  <PawPrint className="h-2.5 w-2.5" />
                  {scoreLabel.text}
                </span>
              </div>
            )}
          </div>

          {/* Tiny paw watermark */}
          <PawPrint className="absolute top-4 right-4 h-5 w-5 text-purple-200/40" />

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
  );
}
