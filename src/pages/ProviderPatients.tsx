import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict, isToday } from 'date-fns';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  PawPrint,
  Mail,
  Loader2,
  Clock,
  UserPlus,
  Check,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  ArrowUpDown,
} from '@/lib/icons';
import { toast } from 'sonner';
import { NewPatientForm } from '@/components/provider/NewPatientForm';
import { PatientConsolidatedSummary } from '@/components/provider/PatientConsolidatedSummary';
import { VetNoteEditor } from '@/components/provider/VetNoteEditor';
import { ConsultationRecorderModal } from '@/components/provider/ConsultationRecorderModal';
import { PatientKPIBar } from '@/components/provider/PatientKPIBar';
import { PatientCard } from '@/components/provider/PatientCard';
import type { PatientCardData } from '@/components/provider/PatientCard';
import { getPatientStatus, calculatePetAge } from '@/hooks/usePatientStatus';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface PatientRow {
  pet_id: string;
  pet_name: string;
  species: string | null;
  breed: string | null;
  birth_date: string | null;
  photo_url: string | null;
  owner_name: string | null;
  last_visit: string;
  first_visit: string | null;
  source: 'linked' | 'note' | 'shared' | 'created';
  // Enriched data
  allergies_food: string[] | null;
  allergies_medication: string[] | null;
  current_medications: Array<{ name: string; dose?: string; frequency?: string }> | null;
  chronic_conditions_detail: Record<string, unknown> | null;
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

type ViewMode = 'cards' | 'table';
type SortMode = 'last_visit' | 'name' | 'followup';
type StatusFilter =
  | 'all'
  | 'active'
  | 'new'
  | 'inactive'
  | 'followup'
  | 'overdue'
  | 'today'
  | 'pending_claim';

export default function ProviderPatients() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('last_visit');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('pf_patients_view') as ViewMode) || 'cards';
    } catch {
      return 'cards';
    }
  });
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [consolidadoPet, setConsolidadoPet] = useState<{ id: string; name: string } | null>(null);
  const [activeNoteDialog, setActiveNoteDialog] = useState<{
    petId: string;
    petName: string;
  } | null>(null);
  const [activeRecorderDialog, setActiveRecorderDialog] = useState<{
    petId: string;
    petName: string;
    species?: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    petId: string;
    petName: string;
  } | null>(null);

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

  // Pacientes activos (3 fuentes) — enriched with clinical data
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
            'pet_id, responded_at, created_at, pets(name, species, breed, birth_date, photo_url, allergies_food, allergies_medication, current_medications, chronic_conditions_detail), profiles!pet_vet_links_owner_id_fkey(display_name)'
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
            birth_date: pet?.birth_date || null,
            photo_url: pet?.photo_url || null,
            owner_name: profile?.display_name || null,
            last_visit: row.responded_at || new Date().toISOString(),
            first_visit: row.created_at || null,
            source: 'linked',
            allergies_food: pet?.allergies_food || null,
            allergies_medication: pet?.allergies_medication || null,
            current_medications: pet?.current_medications || null,
            chronic_conditions_detail: pet?.chronic_conditions_detail || null,
          });
        }
      }

      // Notas clinicas
      const noteProviderId = providerId || user.id;
      const { data: notes } = await sb
        .from('vet_clinical_notes')
        .select(
          'pet_id, created_at, pets(name, species, breed, birth_date, photo_url, allergies_food, allergies_medication, current_medications, chronic_conditions_detail)'
        )
        .eq('provider_id', noteProviderId)
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
          birth_date: pet?.birth_date || null,
          photo_url: pet?.photo_url || null,
          owner_name: null,
          last_visit: note.created_at,
          first_visit: note.created_at,
          source: 'note',
          allergies_food: pet?.allergies_food || null,
          allergies_medication: pet?.allergies_medication || null,
          current_medications: pet?.current_medications || null,
          chronic_conditions_detail: pet?.chronic_conditions_detail || null,
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
            birth_date: null,
            photo_url: pet?.photo_url || null,
            owner_name: null,
            last_visit: row.created_at,
            first_visit: row.created_at,
            source: 'shared',
            allergies_food: null,
            allergies_medication: null,
            current_medications: null,
            chronic_conditions_detail: null,
          });
        }
      }

      // Mascotas creadas por el vet sin dueno (orphan pets)
      const { data: createdPets } = await sb
        .from('pets')
        .select(
          'id, name, species, breed, birth_date, photo_url, allergies_food, allergies_medication, current_medications, chronic_conditions_detail, created_at, pending_owner_name'
        )
        .eq('created_by_vet_id', user.id)
        .is('owner_id', null)
        .order('created_at', { ascending: false })
        .limit(100);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const pet of (createdPets || []) as any[]) {
        const pid = pet.id as string;
        if (map.has(pid)) continue;
        map.set(pid, {
          pet_id: pid,
          pet_name: pet.name || 'Mascota',
          species: pet.species || null,
          breed: pet.breed || null,
          birth_date: pet.birth_date || null,
          photo_url: pet.photo_url || null,
          owner_name: pet.pending_owner_name || null,
          last_visit: pet.created_at || new Date().toISOString(),
          first_visit: pet.created_at || null,
          source: 'created',
          allergies_food: pet.allergies_food || null,
          allergies_medication: pet.allergies_medication || null,
          current_medications: pet.current_medications || null,
          chronic_conditions_detail: pet.chronic_conditions_detail || null,
        });
      }

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime()
      );
    },
    enabled: !!user,
  });

  // Fetch followup data for all patients
  const { data: followupMap } = useQuery({
    queryKey: ['vet-followups-map', providerId],
    queryFn: async () => {
      if (!providerId) return new Map<string, { date: string; reason: string | null }>();
      const { data } = await sb
        .from('vet_clinical_notes')
        .select('pet_id, followup_date, followup_reason')
        .eq('provider_id', providerId)
        .eq('followup_required', true)
        .not('followup_date', 'is', null)
        .order('followup_date', { ascending: true });

      const map = new Map<string, { date: string; reason: string | null }>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of (data || []) as any[]) {
        // Keep the latest followup per pet
        if (
          !map.has(row.pet_id) ||
          new Date(row.followup_date) > new Date(map.get(row.pet_id)!.date)
        ) {
          map.set(row.pet_id, { date: row.followup_date, reason: row.followup_reason });
        }
      }
      return map;
    },
    enabled: !!providerId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch note counts per patient
  const { data: noteCountMap } = useQuery({
    queryKey: ['vet-note-counts', providerId],
    queryFn: async () => {
      if (!providerId) return new Map<string, number>();
      const { data } = await sb
        .from('vet_clinical_notes')
        .select('pet_id')
        .eq('provider_id', providerId);

      const map = new Map<string, number>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of (data || []) as any[]) {
        map.set(row.pet_id, (map.get(row.pet_id) || 0) + 1);
      }
      return map;
    },
    enabled: !!providerId,
    staleTime: 2 * 60 * 1000,
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

  // Bulk: aceptar todas las vinculaciones pendientes en una pasada.
  const handleAcceptAllLinks = async () => {
    if (!pendingLinks || pendingLinks.length === 0) return;
    const count = pendingLinks.length;
    if (!window.confirm(`¿Aceptar las ${count} vinculaciones pendientes?`)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids = pendingLinks.map((l: any) => l.id);
    const { error } = await sb
      .from('pet_vet_links')
      .update({ status: 'active', responded_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      toast.error('Error al aceptar vinculaciones');
      return;
    }
    toast.success(`${count} vinculacion(es) aceptadas`);
    refetchLinks();
    refetch();
  };

  const handleRejectAllLinks = async () => {
    if (!pendingLinks || pendingLinks.length === 0) return;
    const count = pendingLinks.length;
    if (
      !window.confirm(`¿Rechazar las ${count} vinculaciones pendientes? Esta accion no se deshace.`)
    )
      return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids = pendingLinks.map((l: any) => l.id);
    const { error } = await sb
      .from('pet_vet_links')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      toast.error('Error al rechazar vinculaciones');
      return;
    }
    toast.success(`${count} vinculacion(es) rechazadas`);
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

  const handleUnlinkPatient = async (petId: string) => {
    if (!providerId) return;
    try {
      // Deactivate the vet-pet link (soft delete)
      const { error } = await sb
        .from('pet_vet_links')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('provider_id', providerId)
        .eq('pet_id', petId)
        .eq('status', 'active');
      if (error) throw error;
      toast.success(`${deleteConfirm?.petName || 'Paciente'} desvinculado`);
      refetch();
    } catch {
      toast.error('Error al desvincular paciente');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Build enriched patient cards data
  const enrichedPatients = useMemo((): PatientCardData[] => {
    if (!patients) return [];
    return patients.map((p) => {
      const fu = followupMap?.get(p.pet_id);
      return {
        pet_id: p.pet_id,
        pet_name: p.pet_name,
        species: p.species,
        breed: p.breed,
        birth_date: p.birth_date,
        photo_url: p.photo_url,
        owner_name: p.owner_name,
        last_visit: p.last_visit,
        first_visit: p.first_visit,
        followup_date: fu?.date ?? null,
        followup_reason: fu?.reason ?? null,
        total_notes: noteCountMap?.get(p.pet_id) ?? 0,
        allergies: [...(p.allergies_food || []), ...(p.allergies_medication || [])],
        medications: (p.current_medications || []).map((m) => m.name),
        chronic_conditions: p.chronic_conditions_detail
          ? Object.keys(p.chronic_conditions_detail)
          : [],
      };
    });
  }, [patients, followupMap, noteCountMap]);

  // KPI calculations
  const kpis = useMemo(() => {
    const now = new Date();
    let active = 0;
    let today = 0;
    let overdue = 0;

    for (const p of enrichedPatients) {
      const status = getPatientStatus(p.last_visit, p.followup_date ?? null, p.first_visit);
      if (status.status !== 'inactive') active++;
      if (status.status === 'followup_overdue') overdue++;
      if (isToday(new Date(p.last_visit))) today++;
    }

    return { active, today, overdue, pendingClaim: pendingPets?.length ?? 0 };
  }, [enrichedPatients, pendingPets]);

  // Handle KPI filter clicks
  const handleKPIFilter = (key: string | null) => {
    if (!key) {
      setStatusFilter('all');
      return;
    }
    const map: Record<string, StatusFilter> = {
      active: 'active',
      today: 'today',
      overdue: 'overdue',
      pending_claim: 'pending_claim',
    };
    setStatusFilter(map[key] || 'all');
  };

  // Filtered + sorted
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = enrichedPatients.filter((p) => {
      if (filterSpecies !== 'all' && p.species?.toLowerCase() !== filterSpecies) return false;
      if (q) {
        const match =
          p.pet_name.toLowerCase().includes(q) ||
          p.owner_name?.toLowerCase().includes(q) ||
          p.species?.toLowerCase().includes(q) ||
          p.breed?.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (statusFilter === 'all') return true;
      const status = getPatientStatus(p.last_visit, p.followup_date ?? null, p.first_visit);
      switch (statusFilter) {
        case 'active':
          return status.status !== 'inactive';
        case 'new':
          return status.status === 'new';
        case 'inactive':
          return status.status === 'inactive';
        case 'followup':
          return status.status === 'followup_soon' || status.status === 'followup_overdue';
        case 'overdue':
          return status.status === 'followup_overdue';
        case 'today':
          return isToday(new Date(p.last_visit));
        default:
          return true;
      }
    });

    // Sort
    result = [...result];
    switch (sortMode) {
      case 'name':
        result.sort((a, b) => a.pet_name.localeCompare(b.pet_name));
        break;
      case 'followup':
        result.sort((a, b) => {
          if (!a.followup_date && !b.followup_date) return 0;
          if (!a.followup_date) return 1;
          if (!b.followup_date) return -1;
          return new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime();
        });
        break;
      default:
        result.sort((a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime());
    }

    return result;
  }, [enrichedPatients, search, filterSpecies, statusFilter, sortMode]);

  const speciesOptions = useMemo(() => {
    if (!patients) return [];
    return [...new Set(patients.map((p) => p.species).filter(Boolean))] as string[];
  }, [patients]);

  const toggleView = (v: ViewMode) => {
    setViewMode(v);
    try {
      localStorage.setItem('pf_patients_view', v);
    } catch {
      // noop
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
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
            {patients?.length ?? 0} pacientes · {pendingLinks?.length ?? 0} vinculación(es) por
            confirmar
          </p>
        </div>
        <NewPatientForm
          onCreated={() => {
            refetch();
            refetchPending();
          }}
        />
      </div>

      {/* KPIs */}
      <PatientKPIBar
        totalActive={kpis.active}
        todayCount={kpis.today}
        overdueFollowups={kpis.overdue}
        pendingClaim={kpis.pendingClaim}
        pendingLinks={pendingLinks?.length ?? 0}
        activeFilter={statusFilter !== 'all' ? statusFilter : null}
        onFilterChange={handleKPIFilter}
        onClickPendingLinks={() => {
          document
            .getElementById('pending-links-banner')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* Vinculaciones por confirmar — alerta prominente (default open) */}
      {pendingLinks && pendingLinks.length > 0 && (
        <Collapsible defaultOpen>
          <Card
            id="pending-links-banner"
            className="border-red-200 bg-red-50/40 shadow-sm ring-1 ring-red-100"
          >
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>
                    <span className="font-bold">{pendingLinks.length}</span> vinculación(es) por
                    confirmar
                  </span>
                </h2>
                <ChevronDown className="h-4 w-4 text-red-600 transition-transform group-data-[state=open]:rotate-180" />
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Bulk actions: aceptar/rechazar todas. Solo se muestra si hay
                  2+ pendientes (con 1 usar botones individuales del card). */}
              {pendingLinks.length >= 2 && (
                <div className="px-3 pb-2 flex items-center justify-end gap-2 border-b border-red-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptAllLinks();
                    }}
                  >
                    <Check className="h-3 w-3" />
                    Aceptar todas ({pendingLinks.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectAllLinks();
                    }}
                  >
                    <X className="h-3 w-3" />
                    Rechazar todas
                  </Button>
                </div>
              )}
              <div className="px-3 pb-3 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pendingLinks.map((link: any) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-red-100"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {link.pets?.photo_url && <AvatarImage src={link.pets.photo_url} />}
                      <AvatarFallback className="bg-red-100 text-red-700 text-[10px]">
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
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dueno, raza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="new">Nuevos (&lt;30d)</SelectItem>
              <SelectItem value="inactive">Inactivos (&gt;90d)</SelectItem>
              <SelectItem value="followup">Con seguimiento</SelectItem>
              <SelectItem value="overdue">Seg. vencido</SelectItem>
            </SelectContent>
          </Select>
          {speciesOptions.length > 1 && (
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger className="w-[130px] h-9">
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
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[150px] h-9">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_visit">Ultima visita</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="followup">Prox. seguimiento</SelectItem>
            </SelectContent>
          </Select>
          {/* View toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className="h-9 w-9 p-0 rounded-r-none"
              onClick={() => toggleView('cards')}
              title="Vista cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-9 w-9 p-0 rounded-l-none"
              onClick={() => toggleView('table')}
              title="Vista tabla"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Patient list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <PawPrint className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search || statusFilter !== 'all'
              ? 'No se encontraron pacientes con esos filtros.'
              : 'Aun no tienes pacientes registrados.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((patient) => (
            <PatientCard
              key={patient.pet_id}
              patient={patient}
              onRecord={() =>
                setActiveRecorderDialog({
                  petId: patient.pet_id,
                  petName: patient.pet_name,
                  species: patient.species ?? undefined,
                })
              }
              onNote={() =>
                setActiveNoteDialog({ petId: patient.pet_id, petName: patient.pet_name })
              }
              onConsolidado={() =>
                setConsolidadoPet({ id: patient.pet_id, name: patient.pet_name })
              }
              onDelete={() =>
                setDeleteConfirm({ petId: patient.pet_id, petName: patient.pet_name })
              }
            />
          ))}
        </div>
      ) : (
        /* Table view */
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <div className="col-span-3">Paciente</div>
              <div className="col-span-2">Especie / Edad</div>
              <div className="col-span-2">Dueno</div>
              <div className="col-span-1">Notas</div>
              <div className="col-span-2">Ult. visita</div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>
            <div className="divide-y divide-border/50">
              {filtered.map((patient) => {
                const statusInfo = getPatientStatus(
                  patient.last_visit,
                  patient.followup_date ?? null,
                  patient.first_visit
                );
                const ago = formatDistanceToNowStrict(new Date(patient.last_visit), {
                  locale: es,
                  addSuffix: false,
                });
                return (
                  <div
                    key={patient.pet_id}
                    className="flex items-center gap-3 px-4 py-3 md:grid md:grid-cols-12 md:gap-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="md:col-span-3 flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {patient.photo_url && (
                            <AvatarImage src={patient.photo_url} alt={patient.pet_name} />
                          )}
                          <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-xs">
                            {patient.pet_name[0]?.toUpperCase() || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${statusInfo.dotClass}`}
                        />
                      </div>
                      <span className="text-sm font-semibold truncate">{patient.pet_name}</span>
                    </div>
                    <div className="hidden md:flex md:col-span-2 items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] bg-muted/50">
                        {patient.species || 'Mascota'}
                      </Badge>
                      {patient.birth_date && (
                        <span className="text-[10px] text-muted-foreground">
                          {calculatePetAge(patient.birth_date)}
                        </span>
                      )}
                    </div>
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <span className="text-xs text-muted-foreground truncate">
                        {patient.owner_name || '—'}
                      </span>
                    </div>
                    <div className="hidden md:flex md:col-span-1 items-center">
                      <span className="text-xs text-muted-foreground">{patient.total_notes}</span>
                    </div>
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <span className="text-xs text-muted-foreground">hace {ago}</span>
                    </div>
                    <div className="md:col-span-2 flex gap-1.5 flex-shrink-0 ml-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 border-red-200 text-red-600 hover:bg-red-50"
                        title="Grabar consulta"
                        onClick={() =>
                          setActiveRecorderDialog({
                            petId: patient.pet_id,
                            petName: patient.pet_name,
                            species: patient.species ?? undefined,
                          })
                        }
                      >
                        <span className="text-xs">🎙</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 border-teal-200 text-teal-600 hover:bg-teal-50"
                        title="Registrar nota"
                        onClick={() =>
                          setActiveNoteDialog({
                            petId: patient.pet_id,
                            petName: patient.pet_name,
                          })
                        }
                      >
                        <span className="text-xs">📝</span>
                      </Button>
                      <a href={LINKS.petClinicalVet(patient.pet_id)}>
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-xs px-2 bg-teal-600 hover:bg-teal-700"
                        >
                          Ficha
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mascotas pendientes de dueno */}
      {statusFilter !== 'pending_claim' && pendingPets && pendingPets.length > 0 && (
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
                  <div className="flex gap-1 flex-shrink-0">
                    <a href={LINKS.petClinicalVet(pet.id)}>
                      <Button
                        size="sm"
                        className="h-7 gap-1 text-[10px] bg-teal-600 hover:bg-teal-700"
                      >
                        Ficha
                      </Button>
                    </a>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shared dialogs */}
      <PatientConsolidatedSummary
        petId={consolidadoPet?.id ?? null}
        petName={consolidadoPet?.name ?? ''}
        open={!!consolidadoPet}
        onOpenChange={(open) => {
          if (!open) setConsolidadoPet(null);
        }}
      />

      {/* Note editor dialog */}
      {providerId && activeNoteDialog && (
        <Dialog
          open={!!activeNoteDialog}
          onOpenChange={(open) => !open && setActiveNoteDialog(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nota clinica — {activeNoteDialog.petName}</DialogTitle>
            </DialogHeader>
            <VetNoteEditor
              petId={activeNoteDialog.petId}
              petName={activeNoteDialog.petName}
              providerId={providerId}
              onSaved={() => {
                setActiveNoteDialog(null);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Recorder dialog */}
      {providerId && activeRecorderDialog && (
        <ConsultationRecorderModal
          open={!!activeRecorderDialog}
          onOpenChange={(open) => !open && setActiveRecorderDialog(null)}
          providerId={providerId}
          petId={activeRecorderDialog.petId}
          petName={activeRecorderDialog.petName}
          petSpecies={activeRecorderDialog.species}
        />
      )}

      {/* Delete/unlink confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular a {deleteConfirm?.petName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara la vinculacion con este paciente. Tus notas clinicas se mantendran pero
              ya no aparecera en tu lista. El dueno podra volver a vincularte en el futuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirm && handleUnlinkPatient(deleteConfirm.petId)}
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
