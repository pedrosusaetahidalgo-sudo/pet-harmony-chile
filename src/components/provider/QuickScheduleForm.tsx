import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2 } from '@/lib/icons';
import { useCreateVetClinicalNote } from '@/hooks/useVetClinicalNotes';
import { toast } from 'sonner';
import type { VetNoteType } from '@/hooks/useVetClinicalNotes';

interface QuickScheduleFormProps {
  petId: string;
  petName: string;
  providerId: string;
  shareTokenId?: string | null;
  onSaved?: () => void;
}

const FOLLOWUP_TYPES: { value: VetNoteType; label: string }[] = [
  { value: 'control', label: 'Control' },
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'cirugia', label: 'Cirugia' },
  { value: 'consulta', label: 'Seguimiento' },
  { value: 'otro', label: 'Otro' },
];

export function QuickScheduleForm({
  petId,
  petName,
  providerId,
  shareTokenId,
  onSaved,
}: QuickScheduleFormProps) {
  const [date, setDate] = useState('');
  const [type, setType] = useState<VetNoteType>('control');
  const [reason, setReason] = useState('');
  const createNote = useCreateVetClinicalNote();

  const handleSave = async () => {
    if (!date) {
      toast.error('Selecciona una fecha');
      return;
    }
    createNote.mutate(
      {
        petId,
        providerId,
        shareTokenId,
        noteType: type,
        title: `Seguimiento programado: ${FOLLOWUP_TYPES.find((t) => t.value === type)?.label || type}`,
        description: reason || undefined,
        followupRequired: true,
        followupDate: date,
        followupReason:
          reason ||
          `${FOLLOWUP_TYPES.find((t) => t.value === type)?.label || 'Control'} de ${petName}`,
      },
      {
        onSuccess: () => {
          toast.success('Seguimiento agendado');
          onSaved?.();
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Fecha</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as VetNoteType)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOLLOWUP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Motivo (opcional)</Label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Control dermatitis, revision post-cirugia..."
          className="h-9"
        />
      </div>
      <Button
        className="w-full h-9 gap-2"
        onClick={handleSave}
        disabled={!date || createNote.isPending}
      >
        {createNote.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Calendar className="h-4 w-4" />
        )}
        Agendar seguimiento
      </Button>
    </div>
  );
}
