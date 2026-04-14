import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Search,
  PawPrint,
  FileText,
  Mail,
  Loader2,
  Clock,
  Mic,
  Pencil,
  ChevronDown,
  Plus,
  UserPlus,
  Check,
  X,
  Stethoscope,
  Calendar,
  Sparkles,
} from '@/lib/icons';
import { toast } from 'sonner';
import { NewPatientForm } from '@/components/provider/NewPatientForm';
import { PatientConsolidatedSummary } from '@/components/provider/PatientConsolidatedSummary';
import type { VetClinicalNote } from '@/hooks/useVetClinicalNotes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface PatientRow {
  pet_id: string;
  pet_name: string;
  species: string | null;
  breed: string | null;
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
  created_at: string;
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  vacuna: 'Vacuna',
  control: 'Control',
  cirugia: 'Cirugia',
  urgencia: 'Urgencia',
  otro: 'Otro',
};

export default function ProviderPatients() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [consolidadoPet, setConsolidadoPet] = useState<{ id: string; name: string } | null>(null);

  // Fetch provider ID
  const { data: providerId } = useQuery({
    queryKey: ['my-provider-id', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.id ?? null;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Mascotas pendientes de reclamar
  const { data: pendingPets, refetch: refetchPending } = useQuery({
    queryKey: ['vet-pending-pets', user?.id],
    queryFn: async () => {
      if (!user) return [] as PendingPetRow[];
      const { data, error } = await sb
        .from('pets')
        .select(
          'id, name, species, pending_owner_email, pending_owner_name, owner_invitation_sent_at, created_at'
        )
        .eq('created_by_vet_id', user.id)
        .is('owner_invitation_accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return (data || []) as PendingPetRow[];
    },
    enabled: !!user,
  });

  // Pacientes activos (3 fuentes)
  const {
    data: patients,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['vet-patients-full', user?.id, providerId],
    queryFn: async () => {
      if (!user) return [] as PatientRow[];
      const map = new Map<string, PatientRow>();

      // Vinculaciones activas
      if (providerId) {
        const { data: links } = await sb
          .from('pet_vet_links')
          .select(
            'pet_id, responded_at, pets(name, species, breed, photo_url), profiles!pet_vet_links_owner_id_fkey(display_name)'
          )
          .eq('provider_id', providerId)
          .eq('status', 'active')
          .order('responded_at', { ascending: false })
          .limit(200);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of (links || []) as any[]) {
          const pid = row.pet_id as string;
          if (map.has(pid)) continue;
          const pet = row.pets;
          const profile = row.profiles;
          map.set(pid, {
            pet_id: pid,
            pet_name: pet?.name || 'Mascota',
            species: pet?.species || null,
            breed: pet?.breed || null,
            photo_url: pet?.photo_url || null,
            owner_name: profile?.display_name || null,
            last_visit: row.responded_at || new Date().toISOString(),
            source: 'linked',
          });
        }
      }

      // Notas clinicas
      const { data: notes } = await sb
        .from('vet_clinical_notes')
        .select('pet_id, created_at, pets(name, species, breed, photo_url)')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const note of (notes || []) as any[]) {
        const pid = note.pet_id as string;
        if (map.has(pid)) continue;
        const pet = note.pets;
        map.set(pid, {
          pet_id: pid,
          pet_name: pet?.name || 'Mascota',
          species: pet?.species || null,
          breed: pet?.breed || null,
          photo_url: pet?.photo_url || null,
          owner_name: null,
          last_visit: note.created_at,
          source: 'note',
        });
      }

      // Fichas compartidas
      if (providerId) {
        const { data: shared } = await supabase
          .from('medical_share_tokens')
          .select('pet_id, created_at, pets(name, species, photo_url)')
          .eq('target_provider_id', providerId)
          .eq('is_revoked', false)
          .order('created_at', { ascending: false })
          .limit(100);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of (shared || []) as any[]) {
          const pid = row.pet_id as string;
          if (map.has(pid)) continue;
          const pet = row.pets;
          map.set(pid, {
            pet_id: pid,
            pet_name: pet?.name || 'Mascota',
            species: pet?.species || null,
            breed: null,
            photo_url: pet?.photo_url || null,
            owner_name: null,
            last_visit: row.created_at,
            source: 'shared',
          });
        }
      }

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime()
      );
    },
    enabled: !!user,
  });

  // Solicitudes pendientes de vinculacion
  const { data: pendingLinks, refetch: refetchLinks } = useQuery({
    queryKey: ['vet-pending-links', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data } = await sb
        .from('pet_vet_links')
        .select(
          'id, pet_id, message, created_at, pets(name, species, breed, photo_url, birth_date, weight), profiles!pet_vet_links_owner_id_fkey(display_name)'
        )
        .eq('provider_id', providerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!providerId,
  });

  const handleAcceptLink = async (linkId: string) => {
    const { error } = await sb
      .from('pet_vet_links')
      .update({ status: 'active', responded_at: new Date().toISOString() })
      .eq('id', linkId);
    if (error) {
      toast.error('Error al aceptar la solicitud');
      return;
    }
    toast.success('Paciente vinculado');
    refetchLinks();
    refetch();
  };

  const handleRejectLink = async (linkId: string) => {
    const { error } = await sb
      .from('pet_vet_links')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', linkId);
    if (error) {
      toast.error('Error al rechazar');
      return;
    }
    toast.success('Solicitud rechazada');
    refetchLinks();
  };

  const handleResendInvitation = async (petId: string) => {
    setResendingId(petId);
    try {
      const resp = await supabase.functions.invoke('send-pet-invitation', {
        body: { pet_id: petId },
      });
      if (resp.error) throw resp.error;
      toast.success('Invitacion reenviada');
      refetchPending();
    } catch {
      toast.error('Error al reenviar la invitacion');
    } finally {
      setResendingId(null);
    }
  };

  // Filtrado
  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = search.toLowerCase().trim();
    return patients.filter((p) => {
      if (filterSpecies !== 'all' && p.species?.toLowerCase() !== filterSpecies) return false;
      if (!q) return true;
      return (
        p.pet_name.toLowerCase().includes(q) ||
        p.owner_name?.toLowerCase().includes(q) ||
        p.species?.toLowerCase().includes(q) ||
        p.breed?.toLowerCase().includes(q)
      );
    });
  }, [patients, search, filterSpecies]);

  const speciesOptions = useMemo(() => {
    if (!patients) return [];
    return [...new Set(patients.map((p) => p.species).filter(Boolean))] as string[];
  }, [patients]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Mis pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {patients?.length ?? 0} pacientes · {pendingLinks?.length ?? 0} solicitudes pendientes
          </p>
        </div>
        <NewPatientForm
          onCreated={() => {
            refetch();
            refetchPending();
          }}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dueno, raza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {speciesOptions.length > 1 && (
          <Select value={filterSpecies} onValueChange={setFilterSpecies}>
            <SelectTrigger className="w-full sm:w-[140px] h-9">
              <SelectValue placeholder="Especie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {speciesOptions.map((s) => (
                <SelectItem key={s} value={s.toLowerCase()}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Solicitudes pendientes — banner horizontal compacto */}
      {pendingLinks && pendingLinks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-3">
            <h2 className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-2">
              <UserPlus className="h-3.5 w-3.5" />
              {pendingLinks.length} solicitud(es) pendiente(s)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {pendingLinks.map((link: any) => (
                <div
                  key={link.id}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-100"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {link.pets?.photo_url && <AvatarImage src={link.pets.photo_url} />}
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-[10px]">
                      {(link.pets?.name || 'M')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{link.pets?.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {link.pets?.species}
                      {link.profiles?.display_name ? ` · ${link.profiles.display_name}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => handleAcceptLink(link.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleRejectLink(link.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla CRM de pacientes */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <PawPrint className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search
              ? 'No se encontraron pacientes con esos filtros.'
              : 'Aun no tienes pacientes registrados.'}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Header de tabla (solo desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <div className="col-span-4">Paciente</div>
              <div className="col-span-2">Especie</div>
              <div className="col-span-2">Dueño</div>
              <div className="col-span-2">Última visita</div>
              <div className="col-span-2 text-right">Grabar / Ficha</div>
            </div>
            <div className="divide-y divide-border/50">
              {filtered.map((patient) => (
                <PatientCardWithSessions
                  key={patient.pet_id}
                  patient={patient}
                  vetUserId={user?.id ?? ''}
                  onConsolidado={(id, name) => setConsolidadoPet({ id, name })}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mascotas pendientes de dueno */}
      {pendingPets && pendingPets.length > 0 && (
        <Card className="border-muted">
          <CardContent className="p-3">
            <h2 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5" />
              Esperando reclamo ({pendingPets.length})
            </h2>
            <div className="divide-y divide-border/50">
              {pendingPets.map((pet) => (
                <div key={pet.id} className="flex items-center gap-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                      {(pet.name || 'M')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{pet.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {pet.pending_owner_name || pet.pending_owner_email || 'Sin dueno'}
                      {pet.species ? ` · ${pet.species}` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-[10px]"
                    disabled={resendingId === pet.id}
                    onClick={() => handleResendInvitation(pet.id)}
                  >
                    {resendingId === pet.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Mail className="h-3 w-3" />
                    )}
                    {pet.owner_invitation_sent_at ? 'Reenviar' : 'Enviar'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal consolidado IA */}
      <PatientConsolidatedSummary
        petId={consolidadoPet?.id ?? null}
        petName={consolidadoPet?.name ?? ''}
        open={!!consolidadoPet}
        onOpenChange={(open) => {
          if (!open) setConsolidadoPet(null);
        }}
      />
    </div>
  );
}

/** Card de paciente con accordion de sesiones grabadas/escritas */
function PatientCardWithSessions({
  patient,
  vetUserId,
  onConsolidado,
}: {
  patient: PatientRow;
  vetUserId: string;
  onConsolidado: (petId: string, petName: string) => void;
}) {
  const ago = formatDistanceToNowStrict(new Date(patient.last_visit), {
    locale: es,
    addSuffix: false,
  });

  // Fetch vet notes for this patient
  const { data: notes } = useQuery<VetClinicalNote[]>({
    queryKey: ['vet-notes-for-patient', patient.pet_id, vetUserId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('vet_clinical_notes')
        .select('*, service_providers(display_name)')
        .eq('pet_id', patient.pet_id)
        .eq('provider_id', vetUserId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[]).map((row) => ({
        ...row,
        provider_name: row.service_providers?.display_name ?? 'Veterinario',
      }));
    },
    enabled: !!vetUserId,
    staleTime: 2 * 60 * 1000,
  });

  const audioCount = notes?.filter((n) => n.source === 'audio_transcription').length ?? 0;
  const totalNotes = notes?.length ?? 0;

  return (
    <div className="hover:bg-muted/30 transition-colors">
      {/* Row principal */}
      <div className="flex items-center gap-3 px-4 py-3 md:grid md:grid-cols-12 md:gap-2">
        {/* Paciente (avatar + nombre) */}
        <div className="md:col-span-4 flex items-center gap-2.5 min-w-0">
          <Avatar className="h-9 w-9 flex-shrink-0">
            {patient.photo_url && <AvatarImage src={patient.photo_url} alt={patient.pet_name} />}
            <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-xs">
              {patient.pet_name[0]?.toUpperCase() || 'M'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{patient.pet_name}</p>
            {totalNotes > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Stethoscope className="h-2.5 w-2.5" />
                {totalNotes} sesion{totalNotes !== 1 ? 'es' : ''}
                {audioCount > 0 && (
                  <span className="flex items-center gap-0.5 text-red-500">
                    <Mic className="h-2.5 w-2.5" /> {audioCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Especie */}
        <div className="hidden md:flex md:col-span-2 items-center">
          <Badge variant="outline" className="text-[10px] bg-muted/50">
            {patient.species || 'Mascota'}
          </Badge>
        </div>

        {/* Dueño */}
        <div className="hidden md:flex md:col-span-2 items-center">
          <span className="text-xs text-muted-foreground truncate">
            {patient.owner_name || '—'}
          </span>
        </div>

        {/* Última visita */}
        <div className="hidden md:flex md:col-span-2 items-center">
          <span className="text-xs text-muted-foreground">hace {ago}</span>
        </div>

        {/* Acciones */}
        <div className="md:col-span-2 flex gap-1.5 flex-shrink-0 ml-auto">
          <Link to={`${LINKS.petClinical(patient.pet_id)}?grabar=1`}>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs px-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              title="Grabar consulta con IA"
            >
              <Mic className="h-3 w-3" />
              <span className="hidden sm:inline">Grabar</span>
            </Button>
          </Link>
          {totalNotes > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-teal-700 hover:bg-teal-50"
              onClick={() => onConsolidado(patient.pet_id, patient.pet_name)}
              title="Consolidado IA"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          )}
          <Link to={LINKS.petClinical(patient.pet_id)}>
            <Button size="sm" variant="default" className="h-7 gap-1 text-xs px-2">
              <FileText className="h-3 w-3" />
              Ficha
            </Button>
          </Link>
        </div>
      </div>

      {/* Accordion de sesiones (expandible) */}
      {totalNotes > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-[11px] text-teal-700 hover:text-teal-900 transition-colors group w-full px-4 pb-2">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">Sesiones ({totalNotes})</span>
            <ChevronDown className="h-3 w-3 ml-auto transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-3 space-y-1.5">
              {notes?.map((note) => (
                <SessionItem key={note.id} note={note} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

/** Item individual de sesion dentro del accordion */
function SessionItem({ note }: { note: VetClinicalNote }) {
  const isAudio = note.source === 'audio_transcription';
  const dateStr = note.consultation_date ?? note.created_at;
  let formattedDate = '';
  try {
    formattedDate = new Date(dateStr).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    formattedDate = dateStr;
  }

  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
        <Badge variant="outline" className="text-[10px]">
          {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
        </Badge>
        {isAudio ? (
          <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
            <Mic className="h-2.5 w-2.5 mr-0.5" />
            Grabada
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] bg-slate-50 text-slate-500 border-slate-200"
          >
            <Pencil className="h-2.5 w-2.5 mr-0.5" />
            Manual
          </Badge>
        )}
      </div>

      <p className="text-sm font-medium mt-1">{note.title}</p>

      {note.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.description}</p>
      )}

      {note.followup_date && (
        <div className="flex items-center gap-1 text-xs text-amber-600 mt-1.5">
          <Calendar className="h-3 w-3" />
          Seguimiento: {note.followup_date}
          {note.followup_reason && <span>— {note.followup_reason}</span>}
        </div>
      )}

      {note.alternative_offered && note.alternatives_discussed && (
        <p className="text-xs text-green-600 mt-1">Alternativas: {note.alternatives_discussed}</p>
      )}

      {/* Transcripcion original expandible */}
      {isAudio && note.raw_transcript && (
        <Collapsible className="mt-2">
          <CollapsibleTrigger className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors group">
            <Mic className="h-3 w-3 text-red-400" />
            Ver transcripcion completa
            <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1.5 p-2.5 bg-muted/50 rounded text-[11px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border border-border/40">
              {note.raw_transcript}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
