/**
 * Card uniforme para feed unificado de adopcion (post owner o pet refugio).
 * Ver REFACTOR_ADOPCION_2026_04_24.md §2.4.
 */
import { Heart, MapPin, Building2, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { AdoptableItem } from '@/hooks/useAdoptionFeed';

interface AdoptableItemCardProps {
  item: AdoptableItem;
}

function formatAge(ageMonths: number | null): string | null {
  if (!ageMonths) return null;
  if (ageMonths < 12) return `${ageMonths} ${ageMonths === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(ageMonths / 12);
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

export function AdoptableItemCard({ item }: AdoptableItemCardProps) {
  const navigate = useNavigate();
  const age = formatAge(item.age_months);
  const isShelter = item.source === 'shelter_pet';

  const handleClick = () => {
    if (isShelter && item.shelter_slug) {
      // Lleva al perfil del refugio donde está la mascota (con anchor a la card)
      navigate(`/refugios/${item.shelter_slug}#pet-${item.pet_id}`);
    } else if (item.adoption_post_id) {
      // Para posts de owner — TODO: ruta a detalle del post (bloque 2)
      navigate(`/adoption?post=${item.adoption_post_id}`);
    }
  };

  return (
    <div className="group rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow">
      {/* Foto */}
      <button
        type="button"
        onClick={handleClick}
        className="block w-full aspect-square bg-muted relative overflow-hidden"
        aria-label={`Ver ${item.name}`}
      >
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Heart className="h-12 w-12" />
          </div>
        )}

        {/* Badge de origen */}
        <div className="absolute top-2 left-2">
          <Badge
            variant={isShelter ? 'default' : 'secondary'}
            className={
              isShelter
                ? 'bg-purple-600 text-white hover:bg-purple-700 gap-1'
                : 'bg-white/90 text-foreground gap-1'
            }
          >
            {isShelter ? (
              <>
                <Building2 className="h-3 w-3" /> Refugio
              </>
            ) : (
              <>
                <UserIcon className="h-3 w-3" /> Particular
              </>
            )}
          </Badge>
        </div>
      </button>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{item.name}</h3>
          {item.size && (
            <Badge variant="outline" className="text-xs shrink-0">
              {item.size}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.species && <span className="capitalize">{item.species}</span>}
          {item.breed && <span>· {item.breed}</span>}
          {age && <span>· {age}</span>}
        </div>

        {item.comuna && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.comuna}</span>
          </div>
        )}

        {item.shelter_name && (
          <div className="text-xs text-purple-700 font-medium truncate">{item.shelter_name}</div>
        )}

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        <Button onClick={handleClick} variant="outline" size="sm" className="w-full mt-2">
          Ver más
        </Button>
      </div>
    </div>
  );
}
