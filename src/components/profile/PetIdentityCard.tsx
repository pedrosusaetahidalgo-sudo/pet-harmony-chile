import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Plus } from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { getRarity, RARITY_LABELS } from '@/components/PetCardCompact';
import { RARITY_BORDER_STYLES } from '@/lib/paw-cards';

interface PetIdentityCardProps {
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    photo_url?: string;
    date_of_birth?: string;
    birth_date?: string;
    paw_score?: number;
  };
}

function petAge(dob?: string): string {
  if (!dob) return '';
  const birth = parseISO(dob);
  const years = differenceInYears(new Date(), birth);
  if (years >= 1) return `${years} ${years === 1 ? 'año' : 'años'}`;
  const months = differenceInMonths(new Date(), birth);
  return months <= 0 ? 'Cachorro' : `${months} ${months === 1 ? 'mes' : 'meses'}`;
}

const speciesLabel: Record<string, string> = {
  perro: 'Perro',
  gato: 'Gato',
  conejo: 'Conejo',
  ave: 'Ave',
  otro: 'Otro',
};

export function PetIdentityCard({ pet }: PetIdentityCardProps) {
  const navigate = useNavigate();
  const age = petAge(pet.date_of_birth || pet.birth_date);
  const rarity = getRarity(pet.paw_score ?? 0);
  const borderStyle = RARITY_BORDER_STYLES[rarity];

  return (
    <div
      className="w-36 flex-shrink-0 snap-start rounded-xl cursor-pointer group active:scale-95 transition-all hover:shadow-md"
      style={{
        padding: borderStyle.padding,
        background: borderStyle.gradient,
        backgroundSize: '300% 300%',
        animation: `holo-shift ${borderStyle.speed} ease-in-out infinite`,
        boxShadow: borderStyle.shadow,
      }}
      onClick={() => navigate(LINKS.petClinical(pet.id))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(LINKS.petClinical(pet.id));
        }
      }}
      role="button"
      tabIndex={0}
    >
      <Card className="overflow-hidden border-0 shadow-none">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden bg-muted relative">
            {pet.photo_url ? (
              <img
                src={pet.photo_url}
                alt={pet.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5">
                <PawPrint className="h-10 w-10 text-primary/30" />
              </div>
            )}
            {/* Rarity badge */}
            <span
              className="tcg-rarity-badge absolute top-1.5 left-1.5 !text-[8px]"
              data-rarity={rarity}
            >
              {RARITY_LABELS[rarity]}
            </span>
          </div>
          <div className="p-2.5">
            <p className="text-sm font-semibold truncate">{pet.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {speciesLabel[pet.species] || pet.species}
              {age ? ` · ${age}` : ''}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate(LINKS.petClinical(pet.id));
              }}
            >
              Ver ficha
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AddPetCardProps {
  onClick: () => void;
}

export function AddPetCard({ onClick }: AddPetCardProps) {
  return (
    <Card
      className="w-36 flex-shrink-0 snap-start overflow-hidden border-dashed hover:shadow-md transition-all cursor-pointer group active:scale-95"
      onClick={onClick}
    >
      <CardContent className="p-0 h-full flex flex-col items-center justify-center aspect-[3/4]">
        <div className="p-3 rounded-full bg-primary/10 group-hover:scale-110 transition-transform">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <p className="text-xs font-medium mt-2 text-muted-foreground">Agregar mascota</p>
      </CardContent>
    </Card>
  );
}
