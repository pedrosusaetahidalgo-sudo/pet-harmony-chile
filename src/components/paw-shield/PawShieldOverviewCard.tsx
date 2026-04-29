/**
 * PawShieldOverviewCard — Vista transversal en /profile.
 *
 * Lista todas las mascotas del user con estado Paw Shield + CTA a la ficha.
 * No es la activacion (eso vive en PawShieldStatusCard dentro de la ficha
 * clinica tab Identidad). Esta card es solo el "panel de control" rapido.
 *
 * Estados visualizados por pet:
 *   - SIN ACTIVAR (petify_pet_id IS NULL): badge gris "No activado"
 *   - PENDING (nose_print_pending=true): badge ambar "Pendiente"
 *   - LOW (1-2 fotos): badge ambar "Activo, pocas fotos"
 *   - HIGH (>=3 fotos): badge verde "Protegido"
 *
 * Solo se renderiza si feature flag PAW_SHIELD_PETIFY=true.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Shield, AlertCircle, ChevronRight, Loader2 } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isFeatureEnabled } from '@/lib/featureFlags';

interface PetShieldRow {
  id: string;
  name: string;
  species: string;
  petify_pet_id: string | null;
  petify_quality: 'high' | 'low' | null;
  petify_fingerprint_count: number;
  nose_print_pending: boolean;
}

type Status = 'high' | 'low' | 'pending' | 'inactive';

function petStatus(p: PetShieldRow): Status {
  if (p.petify_pet_id && p.petify_quality === 'high') return 'high';
  if (p.petify_pet_id && p.petify_quality === 'low') return 'low';
  if (p.nose_print_pending) return 'pending';
  return 'inactive';
}

export function PawShieldOverviewCard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: pets, isLoading } = useQuery({
    queryKey: ['paw-shield-overview', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pets')
        .select(
          'id, name, species, petify_pet_id, petify_quality, petify_fingerprint_count, nose_print_pending'
        )
        .eq('owner_id', user.id);
      if (error) throw error;
      return (data ?? []) as PetShieldRow[];
    },
    enabled: !!user?.id && isFeatureEnabled('PAW_SHIELD_PETIFY'),
  });

  if (!isFeatureEnabled('PAW_SHIELD_PETIFY')) return null;
  if (!user?.id) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-purple-600" />
            Paw Shield
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando...
        </CardContent>
      </Card>
    );
  }

  if (!pets || pets.length === 0) return null;

  const protectedCount = pets.filter((p) => petStatus(p) === 'high').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-600" />
            Paw Shield
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {protectedCount}/{pets.length} protegidas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pets.map((pet) => {
          const status = petStatus(pet);
          return (
            <button
              key={pet.id}
              onClick={() => navigate(`/ficha/${pet.id}?tab=identidad`)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                {status === 'high' && (
                  <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                {status === 'low' && (
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                )}
                {status === 'pending' && (
                  <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                )}
                {status === 'inactive' && (
                  <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{pet.name}</p>
                  <StatusBadge status={status} />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}

        {pets.some((p) => petStatus(p) === 'inactive') && (
          <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
            Activar Paw Shield es gratis y opcional. Si tu mascota se pierde, cualquier persona
            puede identificarla escaneando su hocico.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    high: { label: 'Protegida', variant: 'default' },
    low: { label: 'Activa, pocas fotos', variant: 'secondary' },
    pending: { label: 'Pendiente', variant: 'secondary' },
    inactive: { label: 'No activada', variant: 'outline' },
  };
  const cfg = map[status];
  return (
    <Badge variant={cfg.variant} className="text-[10px] mt-0.5 h-4 px-1.5 font-normal">
      {cfg.label}
    </Badge>
  );
}
