import { useState, useMemo } from 'react';
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
} from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { formatDate } from '../helpers';
import { EmptyState, getRecordTypeBadgeClass, getRecordTypeIcon } from '../shared';

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
};

/** Registro unificado: puede venir del dueno (medical_records) o del vet (vet_clinical_notes) */
interface UnifiedRecord {
  id: string;
  date: string;
  title: string;
  description: string | null;
  recordType: string;
  source: 'owner' | 'vet_manual' | 'vet_audio';
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
  const { records, isLoading } = useMedicalRecords(petId);
  const { data: vetNotes, isLoading: vetLoading } = useVetClinicalNotesByPet(petId);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  // Unificar records del dueno + notas del vet en un solo array cronologico
  const unified = useMemo<UnifiedRecord[]>(() => {
    const ownerRecords: UnifiedRecord[] = (records ?? []).map((r) => ({
      id: r.id,
      date: r.date,
      title: r.title,
      description: r.description ?? null,
      recordType: r.record_type,
      source: 'owner' as const,
      providerName: null,
      rawTranscript: null,
      followupDate: null,
      followupReason: null,
      alternativeOffered: false,
      alternativesDiscussed: null,
      clinicName: r.clinic_name ?? null,
      vetName: r.veterinarian_name ?? null,
      nextDate: r.next_date ?? null,
    }));

    const vetRecords: UnifiedRecord[] = (vetNotes ?? []).map((n: VetClinicalNote) => ({
      id: n.id,
      date: n.consultation_date ?? n.created_at,
      title: n.title,
      description: n.description,
      recordType: n.note_type,
      source: n.source === 'audio_transcription' ? ('vet_audio' as const) : ('vet_manual' as const),
      providerName: n.provider_name ?? 'Veterinario',
      rawTranscript: n.raw_transcript ?? null,
      followupDate: n.followup_date ?? null,
      followupReason: n.followup_reason ?? null,
      alternativeOffered: n.alternative_offered ?? false,
      alternativesDiscussed: n.alternatives_discussed,
      clinicName: null,
      vetName: null,
      nextDate: null,
    }));

    return [...ownerRecords, ...vetRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [records, vetNotes]);

  // Tipos disponibles para filtro (de ambas fuentes)
  const availableTypes = useMemo(() => {
    const types = [...new Set(unified.map((r) => r.recordType))];
    return types.sort();
  }, [unified]);

  // Filtrado por busqueda, tipo y fuente
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return unified.filter((r) => {
      if (filterType !== 'all' && r.recordType !== filterType) return false;
      if (filterSource === 'owner' && r.source !== 'owner') return false;
      if (filterSource === 'vet' && r.source !== 'vet_manual' && r.source !== 'vet_audio')
        return false;
      if (filterSource === 'audio' && r.source !== 'vet_audio') return false;
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
        icon={Clipboard}
        title="Sin historial medico"
        description="Los registros de consultas, vacunas, examenes y tratamientos apareceran aqui."
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
          </SelectContent>
        </Select>
      </div>

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

/** Badge de fuente: Dueno, Vet (manual), Vet (grabada) */
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
