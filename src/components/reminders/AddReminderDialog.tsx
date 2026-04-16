import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { REMINDER_TYPES } from '@/lib/reminderTypes';

interface Pet {
  id: string;
  name: string;
}

interface AddReminderDialogProps {
  /** Whether the dialog is open (controlled) */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Called with reminder data when user submits */
  onSubmit: (data: { pet_id: string; type: string; title: string; due_date: string }) => void;
  /**
   * Fixed pet ID — when provided, the pet selector is hidden
   * (used from PetClinicalRecord where pet is already known).
   */
  petId?: string;
  /**
   * List of user pets for the pet selector.
   * Required when `petId` is not provided.
   */
  pets?: Pet[];
  /** Optional trigger element (rendered inside DialogTrigger) */
  trigger?: React.ReactNode;
}

/**
 * Dialog reutilizable para agregar un recordatorio.
 *
 * Dos modos:
 * 1. Con `petId` fijo (ej: ficha clínica) — no muestra selector de mascota.
 * 2. Sin `petId` pero con `pets[]` — muestra selector de mascota.
 */
export function AddReminderDialog({
  open,
  onOpenChange,
  onSubmit,
  petId,
  pets,
  trigger,
}: AddReminderDialogProps) {
  const [formData, setFormData] = useState({
    pet_id: petId ?? '',
    type: 'vaccine',
    title: '',
    due_date: '',
  });

  const needsPetSelector = !petId;
  const canSubmit =
    formData.title.trim() !== '' && formData.due_date !== '' && (petId || formData.pet_id !== '');

  const handleSubmit = () => {
    onSubmit({
      pet_id: petId ?? formData.pet_id,
      type: formData.type,
      title: formData.title,
      due_date: formData.due_date,
    });
    onOpenChange(false);
    setFormData({ pet_id: petId ?? '', type: 'vaccine', title: '', due_date: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Recordatorio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {needsPetSelector && pets && pets.length > 0 && (
            <div className="space-y-2">
              <Label>Mascota</Label>
              <Select
                value={formData.pet_id}
                onValueChange={(v) => setFormData((d) => ({ ...d, pet_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona mascota" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData((d) => ({ ...d, type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
              placeholder="Ej: Vacuna antirrábica"
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData((d) => ({ ...d, due_date: e.target.value }))}
            />
          </div>
          <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
            Crear recordatorio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
