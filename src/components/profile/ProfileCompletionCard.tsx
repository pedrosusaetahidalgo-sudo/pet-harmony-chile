import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bell, CheckCircle2, ChevronRight, MapPin } from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { COMUNAS_SANTIAGO } from '@/lib/locations';

interface ProfileCompletionCardProps {
  profile: {
    display_name?: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
  } | null;
  petCount: number;
  upcomingReminders?: number;
  /** Callback para abrir el drawer de editar perfil cuando detectamos que location
   * no matchea el catalogo (datos pre-Combobox). */
  onEditProfile?: () => void;
}

const COMUNAS_SET = new Set(COMUNAS_SANTIAGO.map((c) => c.toLowerCase().trim()));

function isLocationOffCatalog(location: string | undefined | null): boolean {
  if (!location) return false;
  const normalized = location.toLowerCase().trim();
  return normalized.length > 0 && !COMUNAS_SET.has(normalized);
}

export function ProfileCompletionCard({
  profile,
  petCount,
  upcomingReminders = 0,
  onEditProfile,
}: ProfileCompletionCardProps) {
  const navigate = useNavigate();

  const fields = [profile?.display_name, profile?.bio, profile?.location, profile?.avatar_url];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  const isComplete = pct === 100 && petCount > 0;
  const locationOffCatalog = isLocationOffCatalog(profile?.location);

  if (isComplete && upcomingReminders === 0 && !locationOffCatalog) {
    return (
      <Card>
        <CardContent className="p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="text-sm text-muted-foreground">Tu perfil está completo</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {pct < 100 && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium">Perfil {pct}% completo</span>
              <span className="text-muted-foreground">
                {filled}/{fields.length}
              </span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        )}

        {locationOffCatalog && onEditProfile && (
          <button
            onClick={onEditProfile}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-sm flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              Actualiza tu comuna (&ldquo;{profile?.location}&rdquo;)
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}

        {petCount === 0 && (
          <button
            onClick={() => navigate(LINKS.addPet())}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-sm text-muted-foreground">Registra tu primera mascota</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}

        {upcomingReminders > 0 && (
          <button
            onClick={() => navigate(LINKS.remindersTab())}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-sm flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-orange-500" />
              {upcomingReminders}{' '}
              {upcomingReminders === 1 ? 'recordatorio próximo' : 'recordatorios próximos'}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
