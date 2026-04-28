/**
 * PetHeroCard — hero visual de la mascota en foco del Home "Mi mascota hoy"
 *
 * Refactor Maestro 2026-04-23 §5.2.2. Muestra la mascota seleccionada
 * con foto grande, nombre, edad, Paw Card holo sutil + status de salud.
 */
import { Card } from '@/components/ui/card';
import { Heart, Check, AlertTriangle } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface PetHeroCardProps {
  petId: string;
  petName: string;
  species: string;
  breed?: string | null;
  birthDate?: string | null;
  photoUrl?: string | null;
  holoPattern?: string | null;
  /** Status de salud: 'up_to_date' | 'pending' | 'overdue' */
  healthStatus?: 'up_to_date' | 'pending' | 'overdue' | null;
  healthStatusMessage?: string | null;
  className?: string;
  onClick?: () => void;
}

function calculateAge(birthDate?: string | null): string {
  if (!birthDate) return '';
  try {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years >= 1) return `${years} año${years !== 1 ? 's' : ''}`;
    const months = Math.floor((now.getTime() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  } catch {
    return '';
  }
}

const SPECIES_EMOJI: Record<string, string> = {
  perro: '🐶',
  gato: '🐱',
  conejo: '🐰',
  hamster: '🐹',
  ave: '🐦',
  tortuga: '🐢',
  pez: '🐟',
  otro: '🐾',
};

const STATUS_CONFIG: Record<
  NonNullable<PetHeroCardProps['healthStatus']>,
  { label: string; bg: string; text: string; icon: typeof Check }
> = {
  up_to_date: {
    label: 'Al día con su cuidado',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    icon: Check,
  },
  pending: {
    label: 'Tiene pendientes',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: AlertTriangle,
  },
  overdue: {
    label: 'Revisar pendientes urgentes',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    icon: AlertTriangle,
  },
};

export function PetHeroCard({
  petName,
  species,
  breed,
  birthDate,
  photoUrl,
  healthStatus,
  healthStatusMessage,
  className,
  onClick,
}: PetHeroCardProps) {
  const age = calculateAge(birthDate);
  const emoji = SPECIES_EMOJI[species.toLowerCase()] || '🐾';
  const statusConfig = healthStatus ? STATUS_CONFIG[healthStatus] : null;
  const StatusIcon = statusConfig?.icon || Heart;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative overflow-hidden transition-all',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.99]',
        className
      )}
    >
      {/* Background gradient sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50/40 pointer-events-none" />

      <div className="relative p-4 flex items-center gap-4">
        {/* Foto grande */}
        <div className="shrink-0">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 shadow-sm ring-2 ring-white">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={petName}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {emoji}
                </div>
              )}
            </div>
            {/* Mini emoji especie en esquina */}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-7 h-7 flex items-center justify-center text-base shadow-sm border border-border">
              {emoji}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{petName}</h2>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {breed && <span className="text-xs text-muted-foreground truncate">{breed}</span>}
            {breed && age && <span className="text-xs text-muted-foreground">·</span>}
            {age && <span className="text-xs text-muted-foreground">{age}</span>}
          </div>

          {/* Status badge */}
          {statusConfig && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-full border text-xs font-medium',
                statusConfig.bg,
                statusConfig.text
              )}
            >
              <StatusIcon className="h-3 w-3" />
              <span className="truncate max-w-[180px] sm:max-w-none">
                {healthStatusMessage || statusConfig.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
