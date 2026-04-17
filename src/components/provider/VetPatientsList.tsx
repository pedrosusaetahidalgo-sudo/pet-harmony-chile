import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Stethoscope, ExternalLink, PawPrint, FileText, Mail, Loader2, Clock } from '@/lib/icons';
import { toast } from 'sonner';
import { NewPatientForm } from './NewPatientForm';
import { PatientQuickView } from './PatientQuickView';

interface PatientRow {
  pet_id: string;
  pet_name: string;
  species: string | null;
  photo_url: string | null;
  owner_name: string | null;
  last_visit: string;
  source: 'linked' | 'note' | 'shared';
}

interface PendingPetRow {
  id: string;
  name: string;
  species: string | null;
  pending_owner_email: string | null;
  pending_owner_name: string | null;
  owner_invitation_sent_at: string | null;
  owner_invitation_accepted_at: string | null;
  created_at: string;
}

/**
 * Lista de pacientes (mascotas) que un vet ha atendido.
 * Combina dos fuentes: notas clinicas escritas por el vet y fichas compartidas.
 */
export function VetPatientsList() {
  const { user } = useAuth();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Mascotas creadas por el vet pendientes de reclamar por dueño
  const { data: pendingPets, refetch: refetchPending } = useQuery({
    queryKey: ['vet-pending-pets', user?.id],
    queryFn: async () => {
      if (!user) return [] as PendingPetRow[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('pets')
        .select(
          'id, name, species, pending_owner_email, pending_owner_name, owner_invitation_sent_at, owner_invitation_accepted_at, created_at'
        )
        .eq('created_by_vet_id', user.id)
        .is('owner_invitation_accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [] as PendingPetRow[];
      return (data || []) as PendingPetRow[];
    },
    enabled: !!user,
  });

  const handleResendInvitation = async (petId: string) => {
    setResendingId(petId);
    try {
      const resp = await supabase.functions.invoke('send-pet-invitation', {
        body: { pet_id: petId },
      });
      if (resp.error) throw resp.error;
      toast.success('Invitación reenviada correctamente');
      refetchPending();
    } catch (err) {
      toast.error('Error al reenviar la invitación');
      console.error(err);
    } finally {
      setResendingId(null);
    }
  };

  const {
    data: patients,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['vet-patients', user?.id],
    queryFn: async () => {
      if (!user) return [] as PatientRow[];
      const patientsMap = new Map<string, PatientRow>();

      // 0. Vinculaciones activas (pet_vet_links) — fuente primaria
      const { data: providerRow } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (providerRow?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: links } = await (supabase as any)
          .from('pet_vet_links')
          .select(
            'pet_id, responded_at, pets(name, species, photo_url, owner_id), profiles!pet_vet_links_owner_id_fkey(display_name)'
          )
          .eq('provider_id', providerRow.id)
          .eq('status', 'active')
          .order('responded_at', { ascending: false })
          .limit(100);

        if (links && Array.isArray(links)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const row of links as any[]) {
            const pid = row.pet_id as string;
            if (patientsMap.has(pid)) continue;
            const pet = row.pets as {
              name: string | null;
              species: string | null;
              photo_url: string | null;
            } | null;
            const profile = row.profiles as { display_name: string | null } | null;
            patientsMap.set(pid, {
              pet_id: pid,
              pet_name: pet?.name || 'Mascota',
              species: pet?.species || null,
              photo_url: pet?.photo_url || null,
              owner_name: profile?.display_name || null,
              last_visit: (row.responded_at as string) || new Date().toISOString(),
              source: 'linked',
            });
          }
        }
      }

      // 1. Mascotas donde el vet escribio notas clinicas
      const { data: notes } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('vet_clinical_notes') as any
      )
        .select('pet_id, created_at, pets(name, species, photo_url, owner_id)')
        .eq('provider_id', providerRow?.id || user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (notes && Array.isArray(notes)) {
        for (const note of notes) {
          const pid = note.pet_id as string;
          if (patientsMap.has(pid)) continue;
          const pet = note.pets as {
            name: string | null;
            species: string | null;
            photo_url: string | null;
            owner_id: string | null;
          } | null;
          patientsMap.set(pid, {
            pet_id: pid,
            pet_name: pet?.name || 'Mascota',
            species: pet?.species || null,
            photo_url: pet?.photo_url || null,
            owner_name: null,
            last_visit: note.created_at as string,
            source: 'note',
          });
        }
      }

      // 2. Fichas compartidas con este vet (via service_providers)
      if (providerRow?.id) {
        const { data: shared } = await supabase
          .from('medical_share_tokens')
          .select('pet_id, created_at, pets(name, species, photo_url, owner_id)')
          .eq('target_provider_id', providerRow.id)
          .eq('is_revoked', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (shared && Array.isArray(shared)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const row of shared as any[]) {
            const pid = row.pet_id as string;
            if (patientsMap.has(pid)) continue;
            const pet = row.pets as {
              name: string | null;
              species: string | null;
              photo_url: string | null;
              owner_id: string | null;
            } | null;
            patientsMap.set(pid, {
              pet_id: pid,
              pet_name: pet?.name || 'Mascota',
              species: pet?.species || null,
              photo_url: pet?.photo_url || null,
              owner_name: null,
              last_visit: row.created_at as string,
              source: 'shared',
            });
          }
        }
      }

      // 3. Enriquecer con nombres de duenos
      const ownerIds = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notesList = notes as any[] | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allPets = [...(notesList || []).map((n: any) => n.pets)];
      // Collect owner IDs from all pet data
      for (const [, patient] of patientsMap) {
        // We stored owner_id in the pet join but didn't propagate it yet.
        // We'll fetch profiles separately.
        void patient;
      }

      return Array.from(patientsMap.values()).sort(
        (a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime()
      );
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-purple-600" />
            Mis Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-purple-600" />
            Mis Pacientes
            {patients && patients.length > 0 && (
              <Badge
                variant="outline"
                className="ml-1 bg-purple-50 text-purple-700 border-purple-200"
              >
                {patients.length}
              </Badge>
            )}
          </CardTitle>
          <NewPatientForm
            onCreated={() => {
              refetch();
              refetchPending();
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* En espera de confirmacion del propietario */}
        {pendingPets && pendingPets.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-medium text-amber-700 flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5" />
              En espera de confirmación del propietario ({pendingPets.length})
            </p>
            {pendingPets.map((pet) => {
              const wasSent = !!pet.owner_invitation_sent_at;
              return (
                <div
                  key={pet.id}
                  className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-amber-100 text-amber-700">
                      {(pet.name || 'M')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pet.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {pet.pending_owner_name || pet.pending_owner_email || 'Sin dueño asignado'}
                      {pet.species && ` · ${pet.species}`}
                    </p>
                    <p className="text-xs text-amber-600">
                      {wasSent ? 'Invitación enviada' : 'Invitación no enviada'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs h-8 border-amber-200 text-amber-700 hover:bg-amber-50"
                    disabled={resendingId === pet.id}
                    onClick={() => handleResendInvitation(pet.id)}
                  >
                    {resendingId === pet.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="h-3.5 w-3.5" />
                    )}
                    {wasSent ? 'Reenviar' : 'Enviar'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {!patients || patients.length === 0 ? (
          <div className="text-center py-8">
            <PawPrint className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aún no tienes pacientes registrados.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los pacientes aparecerán cuando un dueño comparta su ficha contigo o crees uno nuevo.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {patients.map((patient) => {
              const ago = formatDistanceToNowStrict(new Date(patient.last_visit), {
                locale: es,
                addSuffix: false,
              });
              return (
                <div
                  key={patient.pet_id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver paciente ${patient.pet_name}`}
                  className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-muted/40 hover:bg-muted/30 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={() => setSelectedPetId(patient.pet_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPetId(patient.pet_id);
                    }
                  }}
                >
                  <Avatar className="h-11 w-11">
                    {patient.photo_url ? (
                      <AvatarImage src={patient.photo_url} alt={patient.pet_name} />
                    ) : null}
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {patient.pet_name[0]?.toUpperCase() || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{patient.pet_name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {patient.species && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {patient.species}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">· hace {ago}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          patient.source === 'linked'
                            ? 'bg-purple-50 text-purple-600 border-purple-200'
                            : patient.source === 'note'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : 'bg-green-50 text-green-600 border-green-200'
                        }`}
                      >
                        {patient.source === 'linked'
                          ? 'Vinculado'
                          : patient.source === 'note'
                            ? 'Nota clínica'
                            : 'Ficha compartida'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Link to={LINKS.petClinicalVet(patient.pet_id)}>
                      <Button size="sm" variant="outline" className="h-9 gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Ver ficha</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <PatientQuickView
        petId={selectedPetId}
        open={!!selectedPetId}
        onClose={() => setSelectedPetId(null)}
      />
    </Card>
  );
}
