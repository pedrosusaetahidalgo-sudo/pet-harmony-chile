/**
 * Wizard corto (3 pasos) para que un dueno con perfil completo + mascota con
 * ficha active un servicio (paseo / cuidado / entrenamiento) con
 * auto-aprobacion. La validacion de criterios vive en el RPC
 * activate_owner_service() — el UI solo hace un happy-path.
 *
 * Vet y grooming NO pasan por aca: requieren docs + aprobacion manual
 * (siguen usando BecomeProviderDialog).
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dog, Heart, GraduationCap, ArrowRight, ArrowLeft, Loader2 } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { COMUNAS_SANTIAGO } from '@/lib/locations';

type OwnerServiceType = 'dog_walker' | 'dogsitter' | 'trainer';

// Dia de semana: 0=domingo, 1=lunes..6=sabado (match con schema
// provider_availability_rules.day_of_week CHECK).
interface DayAvailability {
  enabled: boolean;
  start: string; // 'HH:MM'
  end: string; // 'HH:MM'
}

const DAYS: { dow: number; label: string; short: string }[] = [
  { dow: 1, label: 'Lunes', short: 'L' },
  { dow: 2, label: 'Martes', short: 'M' },
  { dow: 3, label: 'Miercoles', short: 'M' },
  { dow: 4, label: 'Jueves', short: 'J' },
  { dow: 5, label: 'Viernes', short: 'V' },
  { dow: 6, label: 'Sabado', short: 'S' },
  { dow: 0, label: 'Domingo', short: 'D' },
];

const DEFAULT_AVAILABILITY: Record<number, DayAvailability> = {
  1: { enabled: true, start: '09:00', end: '18:00' },
  2: { enabled: true, start: '09:00', end: '18:00' },
  3: { enabled: true, start: '09:00', end: '18:00' },
  4: { enabled: true, start: '09:00', end: '18:00' },
  5: { enabled: true, start: '09:00', end: '18:00' },
  6: { enabled: true, start: '10:00', end: '14:00' },
  0: { enabled: false, start: '10:00', end: '14:00' },
};

const SERVICE_OPTIONS: {
  value: OwnerServiceType;
  icon: typeof Dog;
  title: string;
  desc: string;
  suggestedPrice: number;
}[] = [
  {
    value: 'dog_walker',
    icon: Dog,
    title: 'Paseador',
    desc: 'Paseos diarios con mascotas de tu barrio.',
    suggestedPrice: 8000,
  },
  {
    value: 'dogsitter',
    icon: Heart,
    title: 'Cuidador',
    desc: 'Cuidas mascotas en tu casa o visitas la del dueno.',
    suggestedPrice: 15000,
  },
  {
    value: 'trainer',
    icon: GraduationCap,
    title: 'Entrenador casero',
    desc: 'Sesiones de obediencia y socializacion basica.',
    suggestedPrice: 20000,
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferServicesDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [serviceType, setServiceType] = useState<OwnerServiceType | null>(null);
  const [baseCommune, setBaseCommune] = useState('');
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [availability, setAvailability] =
    useState<Record<number, DayAvailability>>(DEFAULT_AVAILABILITY);

  const reset = () => {
    setStep(1);
    setServiceType(null);
    setBaseCommune('');
    setServiceAreas([]);
    setBio('');
    setPriceFrom('');
    setAvailability(DEFAULT_AVAILABILITY);
  };

  const toggleDay = (dow: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], enabled: !prev[dow].enabled },
    }));
  };

  const updateDayTime = (dow: number, field: 'start' | 'end', value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], [field]: value },
    }));
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const toggleArea = (comuna: string) => {
    setServiceAreas((prev) =>
      prev.includes(comuna) ? prev.filter((c) => c !== comuna) : [...prev, comuna]
    );
  };

  const enabledDays = Object.entries(availability)
    .filter(([, day]) => day.enabled)
    .map(([dow, day]) => ({
      day_of_week: Number(dow),
      start_time: day.start,
      end_time: day.end,
    }));

  const handleSubmit = async () => {
    if (!user || !serviceType || !baseCommune || serviceAreas.length === 0 || !priceFrom) {
      toast.error('Completa todos los campos');
      return;
    }
    const price = parseInt(priceFrom, 10);
    if (isNaN(price) || price <= 0) {
      toast.error('Precio invalido');
      return;
    }
    if (enabledDays.length === 0) {
      toast.error('Activa al menos un dia de disponibilidad');
      return;
    }
    // Validar rangos (end > start)
    const invalidDay = enabledDays.find((d) => d.end_time <= d.start_time);
    if (invalidDay) {
      toast.error('La hora de fin debe ser mayor que la de inicio');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('activate_owner_service', {
        p_service_type: serviceType,
        p_base_commune: baseCommune,
        p_service_areas: serviceAreas,
        p_bio: bio.trim() || null,
        p_price_from: price,
        p_availability_rules: enabledDays,
      });
      if (error) throw error;

      toast.success('Servicios activados! Ya apareces en el directorio.', {
        description: 'Puedes ajustar tus horarios cuando quieras desde tu perfil.',
      });
      queryClient.invalidateQueries({ queryKey: ['can-offer-services'] });
      handleClose(false);
      // Lleva directo al tab de horarios para afinar el setup inicial.
      navigate('/provider/profile-edit?tab=schedule');
      void data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al activar servicios';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedService = SERVICE_OPTIONS.find((s) => s.value === serviceType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Activar servicios{' '}
            <span className="text-sm font-normal text-muted-foreground">(paso {step}/4)</span>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Que servicio quieres ofrecer?</p>
            {SERVICE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = serviceType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setServiceType(opt.value);
                    if (!priceFrom) setPriceFrom(String(opt.suggestedPrice));
                  }}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-colors flex items-start gap-3',
                    selected
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0 mt-0.5',
                      selected ? 'text-emerald-500' : 'text-muted-foreground'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{opt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Precio sugerido: ${opt.suggestedPrice.toLocaleString('es-CL')}
                    </p>
                  </div>
                </button>
              );
            })}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!serviceType}>
                Siguiente <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="base-commune">Tu comuna base *</Label>
              <select
                id="base-commune"
                value={baseCommune}
                onChange={(e) => setBaseCommune(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Selecciona...</option>
                {COMUNAS_SANTIAGO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Desde donde operas normalmente.</p>
            </div>

            <div>
              <Label>Comunas donde atiendes * ({serviceAreas.length})</Label>
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                {COMUNAS_SANTIAGO.map((comuna) => (
                  <label
                    key={comuna}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-muted/50 rounded cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={serviceAreas.includes(comuna)}
                      onCheckedChange={() => toggleArea(comuna)}
                    />
                    {comuna}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Atras
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!baseCommune || serviceAreas.length === 0}
              >
                Siguiente <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Precio desde (CLP) *</Label>
              <Input
                id="price"
                type="number"
                min={1000}
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                placeholder={selectedService?.suggestedPrice.toString()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Base. Puedes ajustar por servicio despues.
              </p>
            </div>

            <div>
              <Label htmlFor="bio">Bio corta (opcional)</Label>
              <Textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Soy dueno de Kai (pastor suizo) hace 7 anos. Me gusta pasear perros por el parque bicentenario..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Aparecera en tu perfil publico ({bio.length}/500).
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Atras
              </Button>
              <Button onClick={() => setStep(4)} disabled={!priceFrom}>
                Siguiente <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label>Horarios disponibles *</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Selecciona los dias que atiendes y el rango de horas. Despues puedes ajustarlo desde
                tu dashboard.
              </p>
              <div className="space-y-2">
                {DAYS.map(({ dow, label }) => {
                  const day = availability[dow];
                  return (
                    <div
                      key={dow}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md border transition-colors',
                        day.enabled ? 'bg-emerald-500/5 border-emerald-500/40' : 'border-border'
                      )}
                    >
                      <Checkbox
                        id={`day-${dow}`}
                        checked={day.enabled}
                        onCheckedChange={() => toggleDay(dow)}
                      />
                      <label
                        htmlFor={`day-${dow}`}
                        className="text-sm font-medium w-20 cursor-pointer"
                      >
                        {label}
                      </label>
                      <Input
                        type="time"
                        value={day.start}
                        onChange={(e) => updateDayTime(dow, 'start', e.target.value)}
                        disabled={!day.enabled}
                        className="w-28 h-8 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={day.end}
                        onChange={(e) => updateDayTime(dow, 'end', e.target.value)}
                        disabled={!day.enabled}
                        className="w-28 h-8 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
              <p className="font-medium">Resumen</p>
              <p>
                · Servicio: <strong>{selectedService?.title}</strong>
              </p>
              <p>
                · Base: <strong>{baseCommune}</strong>
              </p>
              <p>
                · Atiendes en <strong>{serviceAreas.length} comunas</strong>
              </p>
              <p>
                · Desde <strong>${parseInt(priceFrom || '0', 10).toLocaleString('es-CL')}</strong>
              </p>
              <p>
                · <strong>{enabledDays.length} dias</strong> disponibles
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)} disabled={loading}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Atras
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || enabledDays.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Activando...
                  </>
                ) : (
                  'Activar servicios'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
