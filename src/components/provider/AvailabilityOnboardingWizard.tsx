import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar, Clock, Coffee, Check } from 'lucide-react';
import { useProviderAvailabilityRules } from '@/hooks/useProviderAvailabilityRules';
import { toast } from 'sonner';

/**
 * CC-28 (Booking V3 Master Plan §18.4) — wizard de onboarding de agenda.
 *
 * Antes: el vet nuevo entraba a `/provider/profile-edit` y veía un editor
 * vacío con 7 días × N campos. Muchos lo abandonan ahí.
 *
 * Ahora: 4 preguntas simples (preset horario, duración típica, fines de
 * semana, urgencias) y generamos las reglas automáticas. Luego pueden
 * editarlas finamente en el editor avanzado.
 *
 * Se abre automáticamente cuando el hook useProviderAvailabilityRules
 * devuelve rules.length === 0 (montado desde ProviderProfileEdit o
 * ProviderDashboard). También accesible manualmente con un botón
 * "Re-configurar horario rápido".
 */

type SchedulePreset = 'morning_only' | 'afternoon_only' | 'full_day' | 'custom';
type SlotDuration = 15 | 20 | 30 | 45 | 60;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  onComplete?: () => void;
}

const PRESETS: Record<SchedulePreset, { label: string; start: string; end: string; icon: string }> =
  {
    morning_only: { label: 'Mañanas (9:00 – 13:00)', start: '09:00', end: '13:00', icon: '🌅' },
    afternoon_only: { label: 'Tardes (15:00 – 19:00)', start: '15:00', end: '19:00', icon: '🌆' },
    full_day: {
      label: 'Jornada completa (9:00 – 19:00)',
      start: '09:00',
      end: '19:00',
      icon: '☀️',
    },
    custom: { label: 'Personalizado', start: '10:00', end: '18:00', icon: '⚙️' },
  };

export function AvailabilityOnboardingWizard({
  open,
  onOpenChange,
  providerId,
  onComplete,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [preset, setPreset] = useState<SchedulePreset>('full_day');
  const [customStart, setCustomStart] = useState('10:00');
  const [customEnd, setCustomEnd] = useState('18:00');
  const [duration, setDuration] = useState<SlotDuration>(30);
  const [weekdays, setWeekdays] = useState<boolean>(true);
  const [saturday, setSaturday] = useState<boolean>(false);
  const [sunday, setSunday] = useState<boolean>(false);

  const { upsertRule } = useProviderAvailabilityRules(providerId);
  const [submitting, setSubmitting] = useState(false);

  const effectiveStart = preset === 'custom' ? customStart : PRESETS[preset].start;
  const effectiveEnd = preset === 'custom' ? customEnd : PRESETS[preset].end;

  const generateDaysOfWeek = (): number[] => {
    const days: number[] = [];
    if (weekdays) {
      // Lun–Vie = 1–5
      days.push(1, 2, 3, 4, 5);
    }
    if (saturday) days.push(6);
    if (sunday) days.push(0);
    return days;
  };

  const handleFinish = async () => {
    const daysOfWeek = generateDaysOfWeek();
    if (daysOfWeek.length === 0) {
      toast.error('Selecciona al menos un día');
      return;
    }

    setSubmitting(true);
    try {
      // Generar una rule por cada día seleccionado.
      for (const dow of daysOfWeek) {
        await upsertRule.mutateAsync({
          provider_id: providerId,
          day_of_week: dow,
          start_time: effectiveStart,
          end_time: effectiveEnd,
          service_type: null,
          slot_duration_minutes: duration,
          buffer_minutes: 0,
          capacity: 1,
          is_active: true,
        });
      }

      toast.success('¡Listo! Tu horario quedó configurado', {
        description: `Atiendes ${daysOfWeek.length} días a la semana con citas de ${duration} min.`,
      });
      onComplete?.();
      onOpenChange(false);
      setStep(1);
    } catch {
      toast.error('Error al guardar. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Configura tu horario rápido
          </DialogTitle>
          <DialogDescription>
            4 preguntas y listo. Luego podrás afinar horarios específicos desde tu perfil.
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1.5 mb-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                n === step ? 'bg-purple-600' : n < step ? 'bg-purple-300' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Horario */}
        {step === 1 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">¿Cuál es tu horario habitual?</Label>
            <div className="grid grid-cols-1 gap-2">
              {(
                Object.entries(PRESETS) as [SchedulePreset, (typeof PRESETS)[SchedulePreset]][]
              ).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    preset === key
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl">{value.icon}</span>
                  <span className="text-sm font-medium flex-1">{value.label}</span>
                  {preset === key && <Check className="h-4 w-4 text-purple-600" />}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="time"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="time"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Duración */}
        {step === 2 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              ¿Cuánto dura una consulta típica?
            </Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v) as SlotDuration)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="20">20 minutos</SelectItem>
                <SelectItem value="30">30 minutos (más común)</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Puedes definir duraciones distintas por tipo de servicio más adelante.
            </p>
          </div>
        )}

        {/* Step 3: Fines de semana */}
        {step === 3 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">¿Qué días atiendes?</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-md border hover:bg-slate-50">
                <Checkbox checked={weekdays} onCheckedChange={(v) => setWeekdays(!!v)} />
                <span className="text-sm">Lunes a viernes</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md border hover:bg-slate-50">
                <Checkbox checked={saturday} onCheckedChange={(v) => setSaturday(!!v)} />
                <span className="text-sm">Sábados</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md border hover:bg-slate-50">
                <Checkbox checked={sunday} onCheckedChange={(v) => setSunday(!!v)} />
                <span className="text-sm">Domingos</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Resumen */}
        {step === 4 && (
          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <p className="font-semibold">Resumen de tu agenda</p>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-purple-500" />
                <span>
                  {effectiveStart} – {effectiveEnd} · citas de {duration} min
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3 text-purple-500" />
                <span>
                  {generateDaysOfWeek().length} día
                  {generateDaysOfWeek().length !== 1 ? 's' : ''} a la semana
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <Coffee className="h-3 w-3" />
                <span>Sin pausas configuradas — agrégalas luego si las necesitas.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}>
              Atrás
            </Button>
          )}
          {step < 4 ? (
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={handleFinish}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Guardar horario
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
