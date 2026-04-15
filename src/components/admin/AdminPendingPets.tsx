import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PawPrint, Mail, Clock, User, Stethoscope } from '@/lib/icons';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface PendingPet {
  id: string;
  name: string;
  species: string;
  pending_owner_email: string | null;
  pending_owner_name: string | null;
  created_at: string;
  owner_invitation_sent_at: string | null;
  created_by_vet_id: string | null;
  vet_name?: string;
}

/**
 * Admin panel: shows pets created by vets that are still waiting
 * for their owners to claim them.
 */
export default function AdminPendingPets() {
  const { data: pets, isLoading } = useQuery<PendingPet[]>({
    queryKey: ['admin-pending-pets'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('pets')
        .select(
          'id, name, species, pending_owner_email, pending_owner_name, created_at, owner_invitation_sent_at, created_by_vet_id'
        )
        .is('owner_id', null)
        .not('created_by_vet_id', 'is', null)
        .is('owner_invitation_accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Enrich with vet display names
      const vetIds = [
        ...new Set((data || []).map((p: PendingPet) => p.created_by_vet_id).filter(Boolean)),
      ];
      const vetMap = new Map<string, string>();

      if (vetIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', vetIds as string[]);
        profiles?.forEach((p) => vetMap.set(p.id, p.display_name || 'Vet'));
      }

      return (data || []).map((pet: PendingPet) => ({
        ...pet,
        vet_name: pet.created_by_vet_id ? vetMap.get(pet.created_by_vet_id) || 'Vet' : undefined,
      }));
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <PawPrint className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin mascotas pendientes</h3>
          <p className="text-muted-foreground text-sm">
            Todas las mascotas creadas por veterinarios ya fueron reclamadas por sus dueños.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mascotas esperando dueño</h3>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          {pets.length} pendiente{pets.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-2">
        {pets.map((pet) => (
          <Card key={pet.id} className="border-amber-100">
            <CardContent className="py-3 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <PawPrint className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {pet.name} ({pet.species})
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {pet.pending_owner_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {pet.pending_owner_email}
                    </span>
                  )}
                  {pet.pending_owner_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {pet.pending_owner_name}
                    </span>
                  )}
                  {pet.vet_name && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3 w-3" />
                      {pet.vet_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNowStrict(new Date(pet.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  pet.owner_invitation_sent_at
                    ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px]'
                    : 'bg-red-50 text-red-700 border-red-200 text-[10px]'
                }
              >
                {pet.owner_invitation_sent_at ? 'Email enviado' : 'Sin enviar'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
