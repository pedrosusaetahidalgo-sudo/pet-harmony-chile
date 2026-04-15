import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Save, FileText, ChevronDown } from '@/lib/icons';
import { toast } from 'sonner';
import { useCreateVetClinicalNote, type VetNoteType } from '@/hooks/useVetClinicalNotes';
import type { ConsultationSummary } from '@/hooks/useProcessTranscript';

const NOTE_TYPES: { value: VetNoteType; label: string }[] = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'control', label: 'Control' },
  { value: 'cirugia', label: 'Cirugia' },
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'otro', label: 'Otro' },
];

interface ConsultationSummaryViewProps {
  summary: ConsultationSummary;
  rawTranscript: string;
  shareTokenId?: string;
  providerId: string;
  petId: string;
  petName: string;
  onSaved?: () => void;
}

export function ConsultationSummaryView({
  summary,
  rawTranscript,
  shareTokenId,
  providerId,
  petId,
  petName,
  onSaved,
}: ConsultationSummaryViewProps) {
  const [noteType, setNoteType] = useState<VetNoteType>(summary.noteType);
  const [title, setTitle] = useState(summary.title);
  const [description, setDescription] = useState(summary.description);
  const [alternativeOffered, setAlternativeOffered] = useState(summary.alternativeOffered);
  const [alternativesDiscussed, setAlternativesDiscussed] = useState(
    summary.alternativesDiscussed || ''
  );
  const [followupRequired, setFollowupRequired] = useState(summary.followupRequired);
  const [followupDate, setFollowupDate] = useState(summary.followupDate || '');
  const [followupReason, setFollowupReason] = useState(summary.followupReason || '');
  const [showTranscript, setShowTranscript] = useState(false);

  const createNote = useCreateVetClinicalNote();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('El titulo es obligatorio');
      return;
    }

    await createNote.mutateAsync({
      shareTokenId,
      providerId,
      petId,
      noteType,
      title: title.trim(),
      description: description.trim() || undefined,
      alternativeOffered,
      alternativesDiscussed: alternativeOffered
        ? alternativesDiscussed.trim() || undefined
        : undefined,
      followupRequired,
      followupDate: followupRequired ? followupDate || undefined : undefined,
      followupReason: followupRequired ? followupReason.trim() || undefined : undefined,
      source: 'audio_transcription',
      rawTranscript,
    });

    toast.success(`Nota guardada en la ficha de ${petName}`);
    onSaved?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-green-700">
        <FileText className="h-4 w-4" />
        Resumen generado por IA — revisa y edita antes de guardar
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Tipo de nota</Label>
        <Select value={noteType} onValueChange={(v) => setNoteType(v as VetNoteType)}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Titulo</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Control general, Vacuna sextuple..."
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Descripcion</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Resumen de la consulta..."
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="audio-alternative-offered"
            checked={alternativeOffered}
            onCheckedChange={(v) => setAlternativeOffered(v === true)}
          />
          <Label htmlFor="audio-alternative-offered" className="text-xs cursor-pointer">
            ¿Se ofrecio alternativa mas economica?
          </Label>
        </div>
        {alternativeOffered && (
          <Textarea
            value={alternativesDiscussed}
            onChange={(e) => setAlternativesDiscussed(e.target.value)}
            placeholder="Describe la alternativa discutida..."
            rows={2}
          />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="audio-followup-required"
            checked={followupRequired}
            onCheckedChange={(v) => setFollowupRequired(v === true)}
          />
          <Label htmlFor="audio-followup-required" className="text-xs cursor-pointer">
            ¿Requiere seguimiento?
          </Label>
        </div>
        {followupRequired && (
          <div className="space-y-2">
            <Input
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="h-11"
            />
            <Input
              value={followupReason}
              onChange={(e) => setFollowupReason(e.target.value)}
              placeholder="Razon del seguimiento..."
              className="h-11"
            />
          </div>
        )}
      </div>

      {/* Transcripcion original colapsable */}
      <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs text-muted-foreground"
          >
            Ver transcripcion original
            <ChevronDown
              className={`h-3 w-3 transition-transform ${showTranscript ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
            {rawTranscript}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button
        onClick={handleSave}
        disabled={createNote.isPending || !title.trim()}
        className="w-full h-11"
      >
        {createNote.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Guardar nota clinica
      </Button>
    </div>
  );
}
