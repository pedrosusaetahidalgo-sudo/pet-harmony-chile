import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, FileText } from '@/lib/icons';
import { toast } from 'sonner';
import { useCreateVetClinicalNote, type VetNoteType } from '@/hooks/useVetClinicalNotes';
import ConsultationTemplateSelector from './ConsultationTemplateSelector';
import SaveTemplateButton from './SaveTemplateButton';

interface VetNoteEditorProps {
  shareTokenId?: string | null;
  providerId: string;
  petId: string;
  petName: string;
  /**
   * Si se provee, la nota quedara linkeada al booking
   * (vet_clinical_notes.booking_id). Flujo cita completada -> crear nota.
   */
  bookingId?: string;
  onSaved?: () => void;
}

const NOTE_TYPES: { value: VetNoteType; label: string }[] = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'control', label: 'Control' },
  { value: 'cirugia', label: 'Cirugia' },
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'otro', label: 'Otro' },
];

export function VetNoteEditor({
  shareTokenId,
  providerId,
  petId,
  petName,
  bookingId,
  onSaved,
}: VetNoteEditorProps) {
  const [noteType, setNoteType] = useState<VetNoteType>('consulta');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [alternativeOffered, setAlternativeOffered] = useState(false);
  const [alternativesDiscussed, setAlternativesDiscussed] = useState('');
  const [followupRequired, setFollowupRequired] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupReason, setFollowupReason] = useState('');

  const createNote = useCreateVetClinicalNote();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('El titulo es obligatorio');
      return;
    }

    await createNote.mutateAsync({
      shareTokenId: shareTokenId || null,
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
      bookingId,
    });

    toast.success(`Nota guardada en la ficha de ${petName}`);
    setTitle('');
    setDescription('');
    setNoteType('consulta');
    setAlternativeOffered(false);
    setAlternativesDiscussed('');
    setFollowupRequired(false);
    setFollowupDate('');
    setFollowupReason('');
    onSaved?.();
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          Agregar nota clinica para {petName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Usar plantilla</Label>
          <ConsultationTemplateSelector
            providerId={providerId}
            onSelect={(body) => {
              if (body.title && typeof body.title === 'string') setTitle(body.title);
              if (body.description && typeof body.description === 'string')
                setDescription(body.description);
              if (body.noteType && typeof body.noteType === 'string') {
                const valid = NOTE_TYPES.find((t) => t.value === body.noteType);
                if (valid) setNoteType(valid.value);
              }
            }}
          />
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
          <Label className="text-xs">Descripcion (opcional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles de la consulta, indicaciones, observaciones..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="alternative-offered"
              checked={alternativeOffered}
              onCheckedChange={(v) => setAlternativeOffered(v === true)}
            />
            <Label htmlFor="alternative-offered" className="text-xs cursor-pointer">
              ¿Ofreciste alternativa más económica?
            </Label>
          </div>
          {alternativeOffered && (
            <Textarea
              value={alternativesDiscussed}
              onChange={(e) => setAlternativesDiscussed(e.target.value)}
              placeholder="Describe la alternativa que le ofreciste al tutor..."
              rows={2}
            />
          )}
        </div>

        {/* Followup */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="followup-required"
              checked={followupRequired}
              onCheckedChange={(v) => setFollowupRequired(v === true)}
            />
            <Label htmlFor="followup-required" className="text-xs cursor-pointer">
              Requiere seguimiento
            </Label>
          </div>
          {followupRequired && (
            <div className="space-y-2 pl-6">
              <div className="space-y-1">
                <Label className="text-xs">Fecha de seguimiento</Label>
                <Input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Motivo del seguimiento</Label>
                <Input
                  value={followupReason}
                  onChange={(e) => setFollowupReason(e.target.value)}
                  placeholder="Ej: Control post-operatorio, revisar exámenes..."
                  className="h-9"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <SaveTemplateButton
            providerId={providerId}
            getCurrentBody={() => ({
              title,
              description,
              noteType,
            })}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createNote.isPending || !title.trim()}
          className="w-full h-11"
        >
          {createNote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar nota clinica
        </Button>
      </CardContent>
    </Card>
  );
}
