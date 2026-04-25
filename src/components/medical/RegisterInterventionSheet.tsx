/**
 * RegisterInterventionSheet — el corazon de la UX V2 de la ficha.
 *
 * Refactor Maestro 2026-04-25 §FICHA_TABS_V2.
 *
 * Insight Pedro: "no pueden sentirse llenando formularios constantemente".
 *
 * Flujo:
 *   1. Click "+ Registrar" desde TabCuidados.
 *   2. Step 1 — elegir tipo (grid 6 cards one-tap):
 *      💉 Vacuna / 🪲 Antipara / 🏥 Vet / ⚖️ Peso / 🍽️ Comida / 🤧 Sintoma
 *   3. Step 2 — form minimo segun tipo:
 *      - Vacuna / Antipara: select preset (5-6 opciones comunes Chile) + fecha
 *      - Vet: motivo + fecha
 *      - Peso: numero + fecha
 *      - Comida: marca + fecha
 *      - Sintoma: descripcion + severidad + fecha
 *   4. Insert en pet_timeline_events con la categoria correcta.
 *
 * Reusa pet_timeline_events (10 categorias canonicas Fase 0). Las cascadas
 * (recordatorio proxima dosis al insertar vacuna) ya estan en triggers SQL.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Syringe,
  Bug,
  Stethoscope,
  Scale,
  UtensilsCrossed,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { TimelineCategory } from '@/hooks/usePetHistoryTimeline';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

type InterventionKind = 'vaccine' | 'deworming' | 'vet' | 'weight' | 'food' | 'symptom';

interface InterventionTypeMeta {
  kind: InterventionKind;
  label: string;
  Icon: typeof Syringe;
  iconColor: string;
  bgColor: string;
  category: TimelineCategory;
  emoji: string;
}

const INTERVENTION_TYPES: InterventionTypeMeta[] = [
  {
    kind: 'vaccine',
    label: 'Vacuna',
    Icon: Syringe,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    category: 'health',
    emoji: '💉',
  },
  {
    kind: 'deworming',
    label: 'Antipara',
    Icon: Bug,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    category: 'health',
    emoji: '🪲',
  },
  {
    kind: 'vet',
    label: 'Visita vet',
    Icon: Stethoscope,
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-50',
    category: 'health',
    emoji: '🏥',
  },
  {
    kind: 'weight',
    label: 'Peso',
    Icon: Scale,
    iconColor: 'text-sky-600',
    bgColor: 'bg-sky-50',
    category: 'weight',
    emoji: '⚖️',
  },
  {
    kind: 'food',
    label: 'Comida',
    Icon: UtensilsCrossed,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    category: 'nutrition',
    emoji: '🍽️',
  },
  {
    kind: 'symptom',
    label: 'Síntoma',
    Icon: Activity,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    category: 'health',
    emoji: '🤧',
  },
];

// Presets comunes en Chile (Pedro puede expandir despues con admin)
const VACCINE_PRESETS = [
  { value: 'sextuple', label: 'Séxtuple (DHPPiL)' },
  { value: 'antirrabica', label: 'Antirrábica' },
  { value: 'tos_perrera', label: 'Tos perrera (Bordetella)' },
  { value: 'leucemia_felina', label: 'Leucemia felina (gatos)' },
  { value: 'triple_felina', label: 'Triple felina (gatos)' },
  { value: 'otra', label: 'Otra (libre)' },
];

const DEWORMING_PRESETS = [
  { value: 'bravecto', label: 'Bravecto (3 meses)' },
  { value: 'nexgard', label: 'NexGard (1 mes)' },
  { value: 'simparica', label: 'Simparica (1 mes)' },
  { value: 'frontline', label: 'Frontline (tópico)' },
  { value: 'drontal', label: 'Drontal (interno)' },
  { value: 'otra', label: 'Otro (libre)' },
];

interface RegisterInterventionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  petName: string;
}

export function RegisterInterventionSheet({
  open,
  onOpenChange,
  petId,
  petName,
}: RegisterInterventionSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'type' | 'form'>('type');
  const [selectedType, setSelectedType] = useState<InterventionTypeMeta | null>(null);

  // Campos comunes
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [preset, setPreset] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [severity, setSeverity] = useState<'leve' | 'moderado' | 'severo'>('leve');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setStep('type');
    setSelectedType(null);
    setEventDate(format(new Date(), 'yyyy-MM-dd'));
    setPreset('');
    setCustomLabel('');
    setWeightKg('');
    setSeverity('leve');
    setNotes('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const handleTypeSelect = (type: InterventionTypeMeta) => {
    setSelectedType(type);
    setStep('form');
    trackRefactor(RefactorEvent.quickActionTapped, { kind: type.kind });
  };

  // ──────────────────────────────────────────────────────────────────────
  // Insert mutation
  // ──────────────────────────────────────────────────────────────────────
  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedType) throw new Error('Estado invalido');

      // Construir titulo + descripcion segun tipo
      let title = '';
      const description: string | null = notes || null;
      const data: Record<string, unknown> = {};

      switch (selectedType.kind) {
        case 'vaccine': {
          const presetMeta = VACCINE_PRESETS.find((p) => p.value === preset);
          const vaccineName = preset === 'otra' ? customLabel : presetMeta?.label || customLabel;
          if (!vaccineName) throw new Error('Indicá qué vacuna');
          title = `Vacuna: ${vaccineName}`;
          data.vaccine_type = preset;
          data.vaccine_name = vaccineName;
          break;
        }
        case 'deworming': {
          const presetMeta = DEWORMING_PRESETS.find((p) => p.value === preset);
          const productName = preset === 'otra' ? customLabel : presetMeta?.label || customLabel;
          if (!productName) throw new Error('Indicá qué producto');
          title = `Antiparasitario: ${productName}`;
          data.product = preset;
          data.product_name = productName;
          break;
        }
        case 'vet':
          if (!customLabel) throw new Error('Indicá el motivo');
          title = `Visita vet: ${customLabel}`;
          break;
        case 'weight': {
          const weight = parseFloat(weightKg);
          if (isNaN(weight) || weight <= 0) throw new Error('Peso inválido');
          title = `Peso: ${weight.toFixed(1)} kg`;
          data.weight_kg = weight;
          break;
        }
        case 'food':
          if (!customLabel) throw new Error('Indicá la marca/producto');
          title = `Comida: ${customLabel}`;
          break;
        case 'symptom':
          if (!customLabel) throw new Error('Describí el síntoma');
          title = `Síntoma: ${customLabel}`;
          data.severity = severity;
          break;
      }

      const { error } = await supabase.from('pet_timeline_events').insert({
        pet_id: petId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: selectedType.category as any,
        title,
        description,
        event_at: new Date(eventDate).toISOString(),
        is_user_reported: true,
        recorded_by: user.id,
        source: 'manual',
        data: Object.keys(data).length > 0 ? data : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Registrado en la historia de ${petName}`);
      queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
      queryClient.invalidateQueries({ queryKey: ['pet-history-timeline', petId] });
      handleClose();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        step === 'type'
          ? `Registrar para ${petName}`
          : selectedType
            ? `${selectedType.emoji} ${selectedType.label}`
            : ''
      }
      description={
        step === 'type'
          ? '¿Qué pasó? Elegí una y te pedimos lo mínimo.'
          : 'Solo lo esencial. Lo demás se completa solo.'
      }
    >
      {step === 'type' && (
        <div className="grid grid-cols-3 gap-3 px-4 pb-6">
          {INTERVENTION_TYPES.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => handleTypeSelect(t)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-purple-300 transition-all ${t.bgColor}`}
            >
              <t.Icon className={`h-7 w-7 ${t.iconColor}`} />
              <span className="text-xs font-medium text-center">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {step === 'form' && selectedType && (
        <div className="space-y-4 px-4 pb-6">
          {/* Vacuna */}
          {selectedType.kind === 'vaccine' && (
            <>
              <div className="space-y-2">
                <Label>¿Qué vacuna?</Label>
                <Select value={preset} onValueChange={setPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí una" />
                  </SelectTrigger>
                  <SelectContent>
                    {VACCINE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {preset === 'otra' && (
                  <Input
                    placeholder="Nombre de la vacuna"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                  />
                )}
              </div>
            </>
          )}

          {/* Antipara */}
          {selectedType.kind === 'deworming' && (
            <>
              <div className="space-y-2">
                <Label>¿Qué producto?</Label>
                <Select value={preset} onValueChange={setPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí uno" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEWORMING_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {preset === 'otra' && (
                  <Input
                    placeholder="Nombre del producto"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                  />
                )}
              </div>
            </>
          )}

          {/* Vet */}
          {selectedType.kind === 'vet' && (
            <div className="space-y-2">
              <Label>Motivo de la visita</Label>
              <Input
                placeholder="Ej: control anual, alergia, herida"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
              />
            </div>
          )}

          {/* Peso */}
          {selectedType.kind === 'weight' && (
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="Ej: 12.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
          )}

          {/* Comida */}
          {selectedType.kind === 'food' && (
            <div className="space-y-2">
              <Label>Marca o producto</Label>
              <Input
                placeholder="Ej: Pro Plan adult chicken"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
              />
            </div>
          )}

          {/* Sintoma */}
          {selectedType.kind === 'symptom' && (
            <>
              <div className="space-y-2">
                <Label>¿Qué notaste?</Label>
                <Input
                  placeholder="Ej: tose, vomitó, no come"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Severidad</Label>
                <div className="flex gap-2">
                  {(['leve', 'moderado', 'severo'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm capitalize ${
                        severity === s
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-border'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Fecha (común a todos) */}
          <div className="space-y-2">
            <Label>Cuándo</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Notas opcionales */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Algo más a recordar"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep('type')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Cambiar
            </Button>
            <Button onClick={() => save()} disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Guardando…
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </div>
      )}
    </ResponsiveModal>
  );
}
