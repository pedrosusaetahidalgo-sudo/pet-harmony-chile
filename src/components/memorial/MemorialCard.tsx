import { Card } from '@/components/ui/card';
import { Heart } from '@/lib/icons';

interface MemorialCardProps {
  pet: {
    id: string;
    name: string;
    species: string;
    photo_url: string | null;
    memorial_photo_url?: string | null;
    birth_date?: string | null;
    passed_away_at?: string | null;
    memorial_message?: string | null;
  };
  onClick: () => void;
}

export function MemorialCard({ pet, onClick }: MemorialCardProps) {
  const birthYear = pet.birth_date ? new Date(pet.birth_date + 'T00:00:00').getFullYear() : null;
  const passedYear = pet.passed_away_at ? new Date(pet.passed_away_at).getFullYear() : null;
  const photoUrl = pet.memorial_photo_url || pet.photo_url;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-purple-100"
      onClick={onClick}
    >
      <div className="relative">
        {photoUrl ? (
          <img src={photoUrl} alt={pet.name} loading="lazy" className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-purple-50 flex items-center justify-center">
            <Heart className="h-10 w-10 text-purple-200" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 text-xs text-purple-600">
          <Heart className="h-3 w-3" />
          En nuestro corazón
        </div>
      </div>
      <div className="p-3 text-center">
        <h3 className="font-semibold text-slate-800">{pet.name}</h3>
        {birthYear && passedYear && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {birthYear} — {passedYear}
          </p>
        )}
      </div>
    </Card>
  );
}
