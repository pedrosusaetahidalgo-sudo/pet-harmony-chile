import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Clipboard,
  Clock,
  MapPin,
  Stethoscope,
  Calendar,
  UserCheck,
  Search,
  Mic,
  Pencil,
  User,
  ChevronDown,
  MessageSquare,
  CheckCircle2,
  Activity,
  Heart,
  Repeat,
} from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { useVetClinicalNotesByPet, type VetClinicalNote } from '@/hooks/useVetClinicalNotes';
import { PremiumNudge } from '@/components/PremiumNudge';
import { formatDate } from '../helpers';
import { EmptyState } from '@/components/ui/EmptyState';
import { getRecordTypeBadgeClass, getRecordTypeIcon } from '../shared';

// Tipos de pet_reminders / pet_activities que duplican medical_records.
// Se excluyen en SQL para evitar que el mismo evento aparezca 2 veces
// (el dueno marca el reminder "vacuna Rabia" y en la misma accion se crea
// un medical_record con titulo "Vacuna Rabia").
const REMINDER_TYPES_DUPLICATE_MEDICAL = [
  'vacuna',
  'vaccine',
  'antiparasitario',
  'desparasitacion',
];
const ACTIVITY_TYPES_DUPLICATE_MEDICAL = ['vet_visit', 'vaccine', 'medication'];

// Titulos legibles para memorial_events (event_type → label de card).
const MEMORIAL_EVENT_TITLES: Record<string, string> = {
  passed_away: 'Despedida',
  memorial_post: 'Mensaje conmemorativo',
  tribute_photo: 'Foto tributo',
  tribute: 'Tributo',
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  vacuna: 'Vacuna',
  consulta: 'Consulta',
  consulta_general: 'Consulta general',
  control_sano: 'Control sano',
  seguimiento: 'Seguimiento',
  segunda_opinion: 'Segunda opinion',
  urgencia: 'Urgencia',
  emergencia: 'Emergencia',
  desparasitacion: 'Desparasitacion',
  antipulgas: 'Antipulgas',
  antiparasitario: 'Antiparasitario',
  cirugia: 'Cirugia',
  esterilizacion: 'Esterilizacion',
  limpieza_dental: 'Limpieza dental',
  ecografia: 'Ecografia',
  rayos_x: 'Rayos X',
  examen_sangre: 'Examen de sangre',
  examen_orina: 'Examen de orina',
  examen: 'Examen',
  medicamento: 'Medicamento',
  tratamiento: 'Tratamiento',
  quimioterapia: 'Quimioterapia',
  rehabilitacion: 'Rehabilitacion',
  hospitalizacion: 'Hospitalizacion',
  alergia: 'Alergia',
  peso: 'Peso',
  microchip: 'Microchip',
  control: 'Control',
  otro: 'Otro',
  // pet_reminders / pet_activities / routine_completions types
  medication: 'Medicacion',
  grooming: 'Aseo',
  checkup: 'Control',
  custom: 'Personalizado',
  walk: 'Paseo',
  achievement: 'Logro',
  streak_milestone: 'Racha',
  weight_check: 'Control de peso',
  exercise: 'Ejercicio',
  meal: 'Comida',
  training: 'Entrenamiento',
  play: 'Juego',
  // memorial events
  passed_away: 'Despedida',
  memorial_post: 'Mensaje conmemorativo',
  tribute_photo: 'Foto tributo',
  tribute: 'Tributo',
};

/**
 * Registro unificado del timeline de la mascota.
 * Cubre: medical_records (dueno), vet_clinical_notes (vet manual+audio),
 * pet_reminders completados, pet_activities, routine_completions
 * completadas y memorial_events.
 *
 * Los nuevos sources no duplican medical_records:
 *   - REMINDER_TYPES_DUPLICATE_MEDICAL filtra vacunas/antiparasitarios
 *     que ya se crean como medical_record en el mismo flujo.
 *   - ACTIVITY_TYPES_DUPLICATE_MEDICAL filtra vet_visit/vaccine/medication
 *     que tambien vienen via medical_records.
 */
interface UnifiedRecord {
  id: string;
  date: string;
  title: string;
  description: string | null;
  recordType: string;
  source:
    | 'owner'
    | 'vet_manual'
    | 'vet_audio'
    | 'reminder_done'
    | 'activity'
    | 'routine'
    | 'memorial';
  providerName: string | null;
  rawTranscript: string | null;
  followupDate: string | null;
  followupReason: string | null;
  alternativeOffered: boolean;
  alternativesDiscussed: string | null;
  clinicName: string | null;
  vetName: string | null;
  nextDate: string | null;
}

export function TabHistorial({ petId }: { petId: string }) {
  const { records, isLoading, isHistoryLimited } = useMedicalRecords(petId);
  const { data: vetNotes, isLoading: vetLoading } = useVetClinicalNotesByPet(petId);

  // === Fuentes adicionales del timeline ("vida de la mascota") ===
  //
  // Se cargan en paralelo a medical_records y vet_clinical_notes. Cada
  // una contribuye al mismo array unificado. Limit 100 por fuente para
  // evitar timelines kilometricos en mascotas muy activas.

  const { data: remindersDone } = useQuery({
    queryKey: ['pet-timeline-reminders', petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data } = await supabase
        .from('pet_reminders')
        .select('id, type, title, description, completed_at')
        .eq('pet_id', petId)
        .eq('is_completed', true)
        .not('completed_at', 'is', null)
        .not('type', 'in', `(${REMINDER_TYPES_DUPLICATE_MEDICAL.map((t) => `"${t}"`).join(',')})`)
        .order('completed_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    enabled: !!petId,
  });

  const { data: activities } = useQuery({
    queryKey: ['pet-timeline-activities', petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data } = await supabase
        .from('pet_activities')
        .select('id, activity_type, title, created_at, metadata')
        .eq('pet_id', petId)
        .not(
          'activity_type',
          'in',
          `(${ACTIVITY_TYPES_DUPLICATE_MEDICAL.map((t) => `"${t}"`).join(',')})`
        )
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    enabled: !!petId,
  });

  const { data: routineCompletions } = useQuery({
    queryKey: ['pet-timeline-routines', petId],
    queryFn: async () => {
      if (!petId) return [];
      // JOIN explicito pet_routines para obtener title + category filtrando por pet_id.
      const { data } = await supabase
        .from('routine_completions')
        .select(
          `id, completed_at, notes,
           pet_routines!inner(pet_id, title, category)`
        )
        .eq('pet_routines.pet_id', petId)
        .eq('skipped', false)
        .order('completed_at', { ascending: false })
        .limit(100);
      // PostgREST devuelve joins anidados como array aunque haya 1:1 FK.
      return (data ?? []) as Array<{
        id: string;
        completed_at: string;
        notes: string | null;
        pet_routines: Array<{ title: string; category: string }> | null;
      }>;
    },
    enabled: !!petId,
  });

  const { data: memorialEvents } = useQuery({
    queryKey: ['pet-timeline-memorial', petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data } = await supabase
        .from('memorial_events')
        .select('id, event_type, content, created_at')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!petId,
  });

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  // Unificar las 6 fuentes en un solo array cronologico.
  // Ver doc de UnifiedRecord arriba para el criterio anti-duplicacion.
  const unified = useMemo<UnifiedRecord[]>(() => {
    const emptyBase = {
      providerName: null,
      rawTranscript: null,
      followupDate: null,
      followupReason: null,
      alternativeOffered: false,
      alternativesDiscussed: null,
      clinicName: null,
      vetName: null,
      nextDate: null,
    };

    const ownerRecords: UnifiedRecord[] = (records ?? []).map((r) => ({
      id: `med-${r.id}`,
      date: r.date,
      title: r.title,
      description: r.description ?? null,
      recordType: r.record_type,
      source: 'owner' as const,
      ...emptyBase,
      clinicName: r.clinic_name ?? null,
      vetName: r.veterinarian_name ?? null,
      nextDate: r.next_date ?? null,
    }));

    const vetRecords: UnifiedRecord[] = (vetNotes ?? []).map((n: VetClinicalNote) => ({
      id: `vet-${n.id}`,
      date: n.consultation_date ?? n.created_at,
      title: n.title,
      description: n.description,
      recordType: n.note_type,
      source: n.source === 'audio_transcription' ? ('vet_audio' as const) : ('vet_manual' as const),
      ...emptyBase,
      providerName: n.provider_name ?? 'Veterinario',
      rawTranscript: n.raw_transcript ?? null,
      followupDate: n.followup_date ?? null,
      followupReason: n.followup_reason ?? null,
      alternativeOffered: n.alternative_offered ?? false,
      alternativesDiscussed: n.alternatives_discussed,
    }));

    const reminderRecords: UnifiedRecord[] = (remindersDone ?? []).map((r) => ({
      id: `rem-${r.id}`,
      date: r.completed_at!,
      title: r.title,
      description: r.description ?? null,
      recordType: r.type,
      source: 'reminder_done' as const,
      ...emptyBase,
    }));

    const activityRecords: UnifiedRecord[] = (activities ?? []).map((a) => ({
      id: `act-${a.id}`,
      date: a.created_at,
      title: a.title,
      description: null,
      recordType: a.activity_type,
      source: 'activity' as const,
      ...emptyBase,
    }));

    const routineRecords: UnifiedRecord[] = (routineCompletions ?? []).map((rc) => {
      const routine = rc.pet_routines?.[0];
      return {
        id: `rou-${rc.id}`,
        date: rc.completed_at,
        title: routine?.title ?? 'Rutina completada',
        description: rc.notes ?? null,
        recordType: routine?.category ?? 'otro',
        source: 'routine' as const,
        ...emptyBase,
      };
    });

    const memorialRecords: UnifiedRecord[] = (memorialEvents ?? []).map((m) => ({
      id: `mem-${m.id}`,
      date: m.created_at ?? new Date().toISOString(),
      title: MEMORIAL_EVENT_TITLES[m.event_type] ?? 'Evento memorial',
      description: m.content ?? null,
      recordType: m.event_type,
      source: 'memorial' as const,
      ...emptyBase,
    }));

    return [
      ...ownerRecords,
      ...vetRecords,
      ...reminderRecords,
      ...activityRecords,
      ...routineRecords,
      ...memorialRecords,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, vetNotes, remindersDone, activities, routineCompletions, memorialEvents]);

  // Tipos disponibles para filtro (de ambas fuentes)
  const availableTypes = useMemo(() => {
    const types = [...new Set(unified.map((r) => r.recordType))];
    return types.sort();
  }, [unified]);

  // Filtrado por busqueda, tipo y fuente.
  // Filtros de fuente:
  //   all         → todo
  //   owner       → medical_records del dueno
  //   vet         → vet_clinical_notes (manual + audio)
  //   audio       → solo vet_audio
  //   life        → eventos de vida (reminders cumplidos + actividades + rutinas)
  //   memorial    → eventos de memorial
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return unified.filter((r) => {
      if (filterType !== 'all' && r.recordType !== filterType) return false;
      if (filterSource === 'owner' && r.source !== 'owner') return false;
      if (filterSource === 'vet' && r.source !== 'vet_manual' && r.source !== 'vet_audio')
        return false;
      if (filterSource === 'audio' && r.source !== 'vet_audio') return false;
      if (
        filterSource === 'life' &&
        r.source !== 'reminder_done' &&
        r.source !== 'activity' &&
        r.source !== 'routine'
      )
        return false;
      if (filterSource === 'memorial' && r.source !== 'memorial') return false;
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.clinicName?.toLowerCase().includes(q) ||
        r.vetName?.toLowerCase().includes(q) ||
        r.providerName?.toLowerCase().includes(q) ||
        r.rawTranscript?.toLowerCase().includes(q) ||
        r.recordType?.toLowerCase().includes(q)
      );
    });
  }, [unified, search, filterType, filterSource]);

  if (isLoading || vetLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (unified.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon={Clipboard}
        title="Sin registros en la ficha"
        description="Los registros de consultas, vacunas, exámenes y tratamientos aparecerán aquí."
        action={
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Agregar primer registro
          </Button>
        }
      />
    );
  }

  // Agrupar por ano
  const groupedByYear: Record<string, UnifiedRecord[]> = {};
  filtered.forEach((record) => {
    const year = new Date(record.date).getFullYear().toString();
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(record);
  });
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por titulo, veterinario, clinica..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {RECORD_TYPE_LABELS[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Fuente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fuentes</SelectItem>
            <SelectItem value="owner">Mis registros</SelectItem>
            <SelectItem value="vet">Notas veterinarias</SelectItem>
            <SelectItem value="audio">Solo grabaciones</SelectItem>
            <SelectItem value="life">Vida diaria</SelectItem>
            <SelectItem value="memorial">Memorial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isHistoryLimited && (
        <PremiumNudge
          feature="medical_history"
          title="Historial clínico completo"
          description="Tienes acceso al historial completo de tu mascota sin límite de fecha. Si te sirve, apóyanos para seguir siendo gratis."
          variant="inline"
        />
      )}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No se encontraron registros con esos filtros.
        </p>
      )}

      {/* Timeline unificada por ano */}
      {sortedYears.map((year) => (
        <div key={year} className="space-y-4">
          <h3 className="text-lg font-bold text-purple-600 sticky top-0 bg-background py-1 z-10">
            {year}
          </h3>
          <div className="relative space-y-4 pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
            {groupedByYear[year].map((record) => (
              <UnifiedRecordCard key={record.id} record={record} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Card individual de la timeline unificada */
function UnifiedRecordCard({ record }: { record: UnifiedRecord }) {
  return (
    <div className="relative">
      {/* Icono en la timeline */}
      <div
        className={`absolute -left-8 top-4 w-7 h-7 rounded-full flex items-center justify-center text-xs ${getRecordTypeBadgeClass(record.recordType)}`}
      >
        {getRecordTypeIcon(record.recordType)}
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Titulo + badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{record.title}</p>
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${getRecordTypeBadgeClass(record.recordType)}`}
                >
                  {RECORD_TYPE_LABELS[record.recordType] || record.recordType}
                </Badge>
                <SourceBadge source={record.source} providerName={record.providerName} />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {formatDate(record.date)}
              </p>
            </div>
          </div>

          {/* Descripcion */}
          {record.description && (
            <p className="text-sm text-muted-foreground mt-2">{record.description}</p>
          )}

          {/* Metadata del dueno */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            {record.clinicName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {record.clinicName}
              </span>
            )}
            {record.vetName && (
              <span className="flex items-center gap-1">
                <Stethoscope className="h-3 w-3" /> Dr. {record.vetName}
              </span>
            )}
          </div>

          {/* Proxima cita (records del dueno) */}
          {record.nextDate && (
            <div className="flex items-center gap-1.5 text-xs mt-2 p-2 bg-purple-50 rounded border border-primary/10">
              <Calendar className="h-3 w-3 text-purple-600" />
              <span className="font-medium text-purple-600">Proxima cita:</span>
              <span>{formatDate(record.nextDate)}</span>
            </div>
          )}

          {/* Seguimiento programado (notas vet) */}
          {record.followupDate && (
            <div className="flex items-center gap-1.5 text-xs mt-2 p-2 bg-amber-50 rounded border border-amber-200">
              <Calendar className="h-3 w-3 text-amber-600" />
              <span className="font-medium text-amber-700">Seguimiento:</span>
              <span>{formatDate(record.followupDate)}</span>
              {record.followupReason && (
                <span className="text-amber-600">— {record.followupReason}</span>
              )}
            </div>
          )}

          {/* Alternativas discutidas */}
          {record.alternativeOffered && record.alternativesDiscussed && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <p className="text-xs font-medium text-green-700 flex items-center gap-1 mb-0.5">
                <MessageSquare className="h-3 w-3" />
                Alternativas discutidas
              </p>
              <p className="text-xs text-green-600">{record.alternativesDiscussed}</p>
            </div>
          )}

          {/* Transcripcion original (solo notas de audio) */}
          {record.source === 'vet_audio' && record.rawTranscript && (
            <TranscriptCollapsible transcript={record.rawTranscript} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Badge de fuente para cada card de la timeline.
 * 7 fuentes posibles: owner, vet_manual, vet_audio, reminder_done,
 * activity, routine, memorial.
 */
function SourceBadge({
  source,
  providerName,
}: {
  source: UnifiedRecord['source'];
  providerName: string | null;
}) {
  if (source === 'owner') {
    return (
      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
        <User className="h-3 w-3 mr-1" />
        Dueno
      </Badge>
    );
  }

  if (source === 'reminder_done') {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Cumplido
      </Badge>
    );
  }

  if (source === 'activity') {
    return (
      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
        <Activity className="h-3 w-3 mr-1" />
        Actividad
      </Badge>
    );
  }

  if (source === 'routine') {
    return (
      <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
        <Repeat className="h-3 w-3 mr-1" />
        Rutina
      </Badge>
    );
  }

  if (source === 'memorial') {
    return (
      <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
        <Heart className="h-3 w-3 mr-1" />
        Memorial
      </Badge>
    );
  }

  // vet_manual y vet_audio
  return (
    <>
      <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
        <UserCheck className="h-3 w-3 mr-1" />
        {providerName}
      </Badge>
      {source === 'vet_audio' && (
        <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
          <Mic className="h-3 w-3 mr-1" />
          Grabada
        </Badge>
      )}
      {source === 'vet_manual' && (
        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
          <Pencil className="h-3 w-3 mr-1" />
          Manual
        </Badge>
      )}
    </>
  );
}

/** Transcripcion expandible de una consulta grabada */
function TranscriptCollapsible({ transcript }: { transcript: string }) {
  return (
    <Collapsible className="mt-2">
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
        <Mic className="h-3 w-3 text-red-400" />
        <span>Ver transcripcion original</span>
        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto border border-border/50">
          {transcript}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
