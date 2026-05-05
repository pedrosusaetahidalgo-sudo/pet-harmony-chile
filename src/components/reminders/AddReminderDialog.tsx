/**
 * AddReminderDialog — bottom sheet con 6 presets one-tap.
 *
 * Refactor 2026-04-25: aplicación de la filosofía FICHA_TABS_V2 al flujo
 * de creación de recordatorios. Reemplaza el form de 4 campos (tipo +
 * título + fecha + mascota) por:
 *   1. Step 1: 6 cards one-tap (Vacuna / Antipara / Control vet / Peso /
 *      Baño / Otro). Cada uno autocompleta tipo+título.
 *   2. Step 2: solo fecha (default sugerida según preset) + selector de
 *      mascota si hace falta. Botón "Listo".
 *
 * El user pasa de tocar 4 campos a tocar 2-3.
 *
 * Backwards compat: mismas props (open, onOpenChange, onSubmit, petId,
 * pets, trigger). Sin cambios en el contrato del onSubmit.
 */
import { useState, cloneElement, isValidElement } from 'react';
import type { ReactElement } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
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
import { Syringe, Bug, Stethoscope, Scale, Sparkles, Pencil, ArrowLeft, Heart } from 'lucide-react';
import { addDays, addMonths, addYears, format, startOfWeek, addWeeks } from 'date-fns';
import { type ReminderType } from '@/lib/reminderTypes';

interface Pet {
  id: string;
  name: string;
}

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { pet_id: string; type: string; title: string; due_date: string }) => void;
  petId?: string;
  pets?: Pet[];
  trigger?: React.ReactNode;
}

interface PresetMeta {
  key: string;
  label: string;
  Icon: typeof Syringe;
  iconBg: string;
  iconColor: string;
  reminderType: ReminderType;
  defaultTitle: string;
  /** Días desde hoy para sugerir como due_date */
  defaultDaysAhead: number;
}

const PRESETS: PresetMeta[] = [
  {
    key: 'vaccine',
    label: 'Vacuna refuerzo',
    Icon: Syringe,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    reminderType: 'vaccine',
    defaultTitle: 'Vacuna refuerzo',
    defaultDaysAhead: 365,
  },
  {
    key: 'flea',
    label: 'Antipara mensual',
    Icon: Bug,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    reminderType: 'flea',
    defaultTitle: 'Aplicar antiparasitario',
    defaultDaysAhead: 30,
  },
  {
    key: 'checkup',
    label: 'Control vet',
    Icon: Stethoscope,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    reminderType: 'checkup',
    defaultTitle: 'Control veterinario',
    defaultDaysAhead: 180,
  },
  {
    key: 'weight',
    label: 'Pesar',
    Icon: Scale,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    reminderType: 'weight',
    defaultTitle: 'Control de peso',
    defaultDaysAhead: 30,
  },
  {
    key: 'grooming',
    label: 'Baño',
    Icon: Sparkles,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    reminderType: 'grooming',
    defaultTitle: 'Baño / peluquería',
    defaultDaysAhead: 30,
  },
  {
    key: 'heat_cycle',
    label: 'Celo',
    Icon: Heart,
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
    reminderType: 'heat_cycle',
    defaultTitle: 'Próximo celo',
    defaultDaysAhead: 180,
  },
  {
    key: 'custom',
    label: 'Otro',
    Icon: Pencil,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    reminderType: 'custom',
    defaultTitle: '',
    defaultDaysAhead: 7,
  },
];

// Shortcuts de fecha aproximada: "esta semana", "próxima semana", "en 2
// semanas". Resuelven el caso de uso "no sé el día exacto pero sí la semana"
// (feedback Antonia 2026-05-05). Mapean a un día concreto (sábado de la semana
// objetivo) para no requerir migración de schema con rangos.
type DateShortcut = { key: string; label: string; getDate: () => Date };
const DATE_SHORTCUTS: DateShortcut[] = [
  {
    key: 'this_week',
    label: 'Esta semana',
    getDate: () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 5),
  },
  {
    key: 'next_week',
    label: 'Próxima semana',
    getDate: () => addDays(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), 5),
  },
  {
    key: 'in_2_weeks',
    label: 'En 2 semanas',
    getDate: () => addDays(startOfWeek(addWeeks(new Date(), 2), { weekStartsOn: 1 }), 5),
  },
];

function calcDefaultDate(daysAhead: number): string {
  let date = new Date();
  if (daysAhead === 365) date = addYears(date, 1);
  else if (daysAhead >= 30) date = addMonths(date, Math.round(daysAhead / 30));
  else date = addDays(date, daysAhead);
  return format(date, 'yyyy-MM-dd');
}

export function AddReminderDialog({
  open,
  onOpenChange,
  onSubmit,
  petId,
  pets,
  trigger,
}: AddReminderDialogProps) {
  const [step, setStep] = useState<'preset' | 'detail'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<PresetMeta | null>(null);
  const [petIdLocal, setPetIdLocal] = useState(petId ?? '');
  const [titleOverride, setTitleOverride] = useState('');
  const [dueDate, setDueDate] = useState('');

  const needsPetSelector = !petId;
  const finalPetId = petId ?? petIdLocal;
  const finalTitle =
    selectedPreset?.key === 'custom' ? titleOverride : (selectedPreset?.defaultTitle ?? '');
  const canSubmit = !!selectedPreset && !!finalPetId && !!dueDate && finalTitle.trim() !== '';

  const reset = () => {
    setStep('preset');
    setSelectedPreset(null);
    setPetIdLocal(petId ?? '');
    setTitleOverride('');
    setDueDate('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const handlePresetSelect = (preset: PresetMeta) => {
    setSelectedPreset(preset);
    setDueDate(calcDefaultDate(preset.defaultDaysAhead));
    setStep('detail');
  };

  const handleSubmit = () => {
    if (!selectedPreset) return;
    onSubmit({
      pet_id: finalPetId,
      type: selectedPreset.reminderType,
      title: finalTitle,
      due_date: dueDate,
    });
    handleClose();
  };

  // Si pasan trigger, lo clonamos con onClick que abre el sheet (controlled).
  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onClick?: () => void }>, {
        onClick: () => onOpenChange(true),
      })
    : null;

  return (
    <>
      {triggerEl}
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        title={step === 'preset' ? 'Nuevo recordatorio' : (selectedPreset?.label ?? 'Detalles')}
        description={
          step === 'preset'
            ? '¿Qué quieres recordar? Te dejamos lo más rápido.'
            : 'Solo fecha y listo. Lo demás ya está prellenado.'
        }
      >
        {step === 'preset' && (
          <div className="grid grid-cols-3 gap-3 px-4 pb-6">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-purple-300 transition-all ${preset.iconBg}`}
              >
                <preset.Icon className={`h-6 w-6 ${preset.iconColor}`} />
                <span className="text-xs font-medium text-center leading-tight">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 'detail' && selectedPreset && (
          <div className="space-y-4 px-4 pb-6">
            {/* Pet selector solo si hace falta */}
            {needsPetSelector && pets && pets.length > 0 && (
              <div className="space-y-2">
                <Label>Mascota</Label>
                <Select value={petIdLocal} onValueChange={setPetIdLocal}>
                  <SelectTrigger>
                    <SelectValue placeholder="¿Para cuál?" />
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

            {/* Título: solo editable si es custom */}
            {selectedPreset.key === 'custom' && (
              <div className="space-y-2">
                <Label>¿Qué quieres recordar?</Label>
                <Input
                  value={titleOverride}
                  onChange={(e) => setTitleOverride(e.target.value)}
                  placeholder="Ej: dar pastilla a Kai"
                />
              </div>
            )}

            {/* Fecha (siempre) — con shortcuts de rango aproximado */}
            <div className="space-y-2">
              <Label>¿Cuándo?</Label>
              <div className="flex flex-wrap gap-2">
                {DATE_SHORTCUTS.map((sc) => (
                  <button
                    key={sc.key}
                    type="button"
                    onClick={() => setDueDate(format(sc.getDate(), 'yyyy-MM-dd'))}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <p className="text-xs text-muted-foreground">
                Sugerimos {format(new Date(dueDate), 'd/M/yyyy')}.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('preset')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Cambiar
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1">
                Listo
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </>
  );
}
