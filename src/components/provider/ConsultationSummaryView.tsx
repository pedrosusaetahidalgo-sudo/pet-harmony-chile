import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Loader2,
  Save,
  FileText,
  ChevronDown,
  Stethoscope,
  CalendarDays,
  RefreshCw,
  Sparkles,
  Pencil,
  Eye,
  ClipboardList,
} from '@/lib/icons';
import { toast } from 'sonner';
import { useCreateVetClinicalNote, type VetNoteType } from '@/hooks/useVetClinicalNotes';
import type { ConsultationSummary } from '@/hooks/useProcessTranscript';

const NOTE_TYPES: { value: VetNoteType; label: string; color: string }[] = [
  { value: 'consulta', label: 'Consulta', color: 'bg-blue-500/15 text-blue-700 border-blue-200' },
  { value: 'vacuna', label: 'Vacuna', color: 'bg-green-500/15 text-green-700 border-green-200' },
  { value: 'control', label: 'Control', color: 'bg-teal-500/15 text-teal-700 border-teal-200' },
  {
    value: 'cirugia',
    label: 'Cirugia',
    color: 'bg-orange-500/15 text-orange-700 border-orange-200',
  },
  { value: 'urgencia', label: 'Urgencia', color: 'bg-red-500/15 text-red-700 border-red-200' },
  { value: 'otro', label: 'Otro', color: 'bg-slate-500/15 text-slate-700 border-slate-200' },
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

/**
 * Parses bullet-point description into structured sections.
 * The AI returns text like "- motivo: ...\n- hallazgos: ...\n- diagnostico: ..."
 */
function parseDescriptionSections(description: string) {
  const lines = description.split('\n').filter((l) => l.trim());
  const sections: { label: string; content: string; key: string }[] = [];

  const sectionMap: Record<string, string> = {
    motivo: 'Motivo de consulta',
    hallazgo: 'Hallazgos',
    diagnos: 'Diagnostico',
    tratamiento: 'Tratamiento',
    indicacion: 'Indicaciones',
    examen: 'Examenes solicitados',
    observacion: 'Observaciones',
  };

  for (const line of lines) {
    const clean = line.replace(/^[-*•]\s*/, '').trim();
    if (!clean) continue;

    let matched = false;
    for (const [key, label] of Object.entries(sectionMap)) {
      if (clean.toLowerCase().startsWith(key)) {
        const content = clean.replace(/^[^:]+:\s*/, '');
        sections.push({ label, content: content || clean, key });
        matched = true;
        break;
      }
    }
    if (!matched) {
      sections.push({ label: '', content: clean, key: `line-${sections.length}` });
    }
  }

  return sections;
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
  const [isEditing, setIsEditing] = useState(false);

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

  const noteTypeConfig = NOTE_TYPES.find((t) => t.value === noteType) || NOTE_TYPES[0];
  const parsedSections = parseDescriptionSections(description);

  return (
    <div className="space-y-4">
      {/* ── Header: AI badge + mode toggle ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Nota clinica</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span className="text-[10px] text-indigo-600 font-medium">
                Generada por IA desde audio
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <Eye className="h-3 w-3" /> Vista previa
            </>
          ) : (
            <>
              <Pencil className="h-3 w-3" /> Editar
            </>
          )}
        </Button>
      </div>

      {/* ── Clinical note card ── */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Note type + title row */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Tipo de nota</Label>
                <Select value={noteType} onValueChange={(v) => setNoteType(v as VetNoteType)}>
                  <SelectTrigger className="h-9">
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
                <Label className="text-xs font-medium text-muted-foreground">Titulo</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Control general, Vacuna sextuple..."
                  className="h-9 font-medium"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium mb-1.5 ${noteTypeConfig.color}`}
                >
                  {noteTypeConfig.label}
                </Badge>
                <h3 className="font-semibold text-base leading-snug">{title || 'Sin titulo'}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Paciente: {petName}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* ── Description / Clinical content ── */}
          {isEditing ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ClipboardList className="h-3 w-3" />
                Descripcion clinica
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="- Motivo de consulta&#10;- Hallazgos&#10;- Diagnostico&#10;- Tratamiento&#10;- Indicaciones"
                rows={8}
                className="font-mono text-xs leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {parsedSections.length > 0 ? (
                parsedSections.map((section) => (
                  <div key={section.key}>
                    {section.label ? (
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {section.label}
                        </p>
                        <p className="text-sm leading-relaxed">{section.content}</p>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed pl-0.5">
                        <span className="text-muted-foreground mr-1.5">-</span>
                        {section.content}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin descripcion</p>
              )}
            </div>
          )}

          {/* ── Alternative offered ── */}
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="audio-alternative-offered"
                  checked={alternativeOffered}
                  onCheckedChange={(v) => setAlternativeOffered(v === true)}
                />
                <Label htmlFor="audio-alternative-offered" className="text-xs cursor-pointer">
                  Se ofrecio alternativa mas economica
                </Label>
              </div>
              {alternativeOffered && (
                <Textarea
                  value={alternativesDiscussed}
                  onChange={(e) => setAlternativesDiscussed(e.target.value)}
                  placeholder="Describe la alternativa discutida..."
                  rows={2}
                  className="text-xs"
                />
              )}
            </div>
          ) : alternativeOffered ? (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
              <RefreshCw className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  Alternativa ofrecida
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {alternativesDiscussed || 'Si, se discutieron opciones alternativas'}
                </p>
              </div>
            </div>
          ) : null}

          {/* ── Follow-up ── */}
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="audio-followup-required"
                  checked={followupRequired}
                  onCheckedChange={(v) => setFollowupRequired(v === true)}
                />
                <Label htmlFor="audio-followup-required" className="text-xs cursor-pointer">
                  Requiere seguimiento
                </Label>
              </div>
              {followupRequired && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Fecha</Label>
                    <Input
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Razon</Label>
                    <Input
                      value={followupReason}
                      onChange={(e) => setFollowupReason(e.target.value)}
                      placeholder="Razon del seguimiento..."
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : followupRequired ? (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <CalendarDays className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  Seguimiento programado
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {followupDate && (
                    <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700">
                      {new Date(followupDate + 'T12:00:00').toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Badge>
                  )}
                  {followupReason && (
                    <span className="text-xs text-blue-800">{followupReason}</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Transcripcion original colapsable ── */}
      <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              Transcripcion original
            </span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${showTranscript ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 bg-muted/30 rounded-lg border border-dashed text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
            {rawTranscript}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ── Save button ── */}
      <Button
        onClick={handleSave}
        disabled={createNote.isPending || !title.trim()}
        className="w-full h-11 font-medium"
      >
        {createNote.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Guardar nota clinica
      </Button>

      <p className="text-[10px] text-center text-muted-foreground">
        Revisa el contenido antes de guardar. La nota quedara en la ficha de {petName}.
      </p>
    </div>
  );
}
