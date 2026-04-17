import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mic, Pencil, Calendar, ChevronDown, Paperclip, Stethoscope, FileText } from '@/lib/icons';
import { getRecordTypeIcon, getRecordTypeBadgeClass } from './shared';
import type { VetClinicalNote } from '@/hooks/useVetClinicalNotes';

interface TimelineItem {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string | null;
  source: 'vet_note' | 'medical_record';
  isAudio?: boolean;
  rawTranscript?: string | null;
  followupDate?: string | null;
  followupReason?: string | null;
  alternativeOffered?: boolean;
  alternativesDiscussed?: string | null;
  providerName?: string;
  hasAttachment?: boolean;
}

interface VetClinicalTimelineProps {
  petId: string;
  vetNotes: VetClinicalNote[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'consulta', label: 'Consultas' },
  { value: 'vacuna', label: 'Vacunas' },
  { value: 'control', label: 'Controles' },
  { value: 'cirugia', label: 'Cirugias' },
  { value: 'urgencia', label: 'Urgencias' },
];

export function VetClinicalTimeline({ petId, vetNotes }: VetClinicalTimelineProps) {
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch medical_records to merge with vet notes
  const { data: medicalRecords } = useQuery({
    queryKey: ['pet-medical-records-timeline', petId],
    queryFn: async () => {
      const { data } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .order('date', { ascending: false });
      return data || [];
    },
    enabled: !!petId,
  });

  // Merge both sources into unified timeline
  const timeline = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add vet notes
    for (const note of vetNotes || []) {
      items.push({
        id: `note-${note.id}`,
        date: note.consultation_date || note.created_at,
        type: note.note_type,
        title: note.title,
        description: note.description,
        source: 'vet_note',
        isAudio: note.source === 'audio_transcription',
        rawTranscript: note.raw_transcript,
        followupDate: note.followup_date,
        followupReason: note.followup_reason,
        alternativeOffered: note.alternative_offered,
        alternativesDiscussed: note.alternatives_discussed,
        providerName: note.provider_name,
      });
    }

    // Add medical records (avoid duplicates by checking titles)
    const noteIds = new Set(vetNotes?.map((n) => n.id) || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const rec of (medicalRecords || []) as any[]) {
      items.push({
        id: `rec-${rec.id}`,
        date: rec.date || rec.created_at,
        type: rec.record_type || 'otro',
        title: rec.title || rec.record_type || 'Registro medico',
        description: rec.description || rec.notes || null,
        source: 'medical_record',
        hasAttachment: !!rec.attachment_url,
      });
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  }, [vetNotes, medicalRecords]);

  // Filter by type
  const filtered = useMemo(() => {
    if (typeFilter === 'all') return timeline;
    return timeline.filter((item) => item.type === typeFilter);
  }, [timeline, typeFilter]);

  // Group by month
  const grouped = useMemo(() => {
    const groups: { month: string; items: TimelineItem[] }[] = [];
    let currentMonth = '';
    for (const item of filtered) {
      const monthKey = format(new Date(item.date), 'MMMM yyyy', { locale: es });
      if (monthKey !== currentMonth) {
        currentMonth = monthKey;
        groups.push({ month: monthKey, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Timeline clinica
        </h3>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted rounded-xl">
          <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center mb-3">
            <Stethoscope className="h-6 w-6 text-teal-500" />
          </div>
          <p className="text-sm font-medium mb-1">Sin registros clinicos aun</p>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            Graba una consulta, escribe una nota clinica o registra signos vitales para comenzar el
            historial de este paciente.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
              <Mic className="h-3 w-3 text-red-400" /> Grabar consulta
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
              <FileText className="h-3 w-3 text-teal-500" /> Registrar nota
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
              <Calendar className="h-3 w-3 text-blue-500" /> Agendar seguimiento
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.month}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground capitalize px-2">
                  {group.month}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <TimelineItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineItemCard({ item }: { item: TimelineItem }) {
  let dateStr = '';
  try {
    dateStr = format(new Date(item.date), 'd MMM', { locale: es });
  } catch {
    dateStr = item.date;
  }

  return (
    <div className="flex gap-3 group">
      {/* Date column */}
      <div className="w-14 flex-shrink-0 text-right">
        <span className="text-xs text-muted-foreground font-medium">{dateStr}</span>
      </div>

      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 flex-shrink-0" />
        <div className="w-px flex-1 bg-border/60 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1">{getRecordTypeIcon(item.type)}</span>
          <Badge variant="outline" className={`text-[10px] ${getRecordTypeBadgeClass(item.type)}`}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Badge>
          {item.isAudio && (
            <Badge
              variant="outline"
              className="text-[10px] bg-red-50 text-red-600 border-red-200 gap-0.5"
            >
              <Mic className="h-2.5 w-2.5" />
              Grabada
            </Badge>
          )}
          {item.source === 'medical_record' && (
            <Badge
              variant="outline"
              className="text-[10px] bg-slate-50 text-slate-500 border-slate-200"
            >
              Registro dueno
            </Badge>
          )}
        </div>

        <p className="text-sm font-medium mt-1">{item.title}</p>

        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
        )}

        {item.followupDate && (
          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1.5">
            <Calendar className="h-3 w-3" />
            Seguimiento: {item.followupDate}
            {item.followupReason && <span>— {item.followupReason}</span>}
          </div>
        )}

        {item.alternativeOffered && item.alternativesDiscussed && (
          <p className="text-xs text-green-600 mt-1">Alternativas: {item.alternativesDiscussed}</p>
        )}

        {item.hasAttachment && (
          <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
            <Paperclip className="h-3 w-3" />
            Documento adjunto
          </div>
        )}

        {/* Expandable transcript */}
        {item.isAudio && item.rawTranscript && (
          <Collapsible className="mt-2">
            <CollapsibleTrigger className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors group/t">
              <Mic className="h-3 w-3 text-red-400" />
              Ver transcripcion completa
              <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/t:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1.5 p-2.5 bg-muted/50 rounded text-[11px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border border-border/40">
                {item.rawTranscript}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
