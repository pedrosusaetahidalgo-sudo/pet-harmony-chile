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

  const reset = () => {
    setStep(1);
    setServiceType(null);
    setBaseCommune('');
    setServiceAreas([]);
    setBio('');
    setPriceFrom('');
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

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('activate_owner_service', {
        p_service_type: serviceType,
        p_base_commune: baseCommune,
        p_service_areas: serviceAreas,
        p_bio: bio.trim() || null,
        p_price_from: price,
      });
      if (error) throw error;

      toast.success('Servicios activados! Ya apareces en el directorio.');
      queryClient.invalidateQueries({ queryKey: ['can-offer-services'] });
      handleClose(false);
      navigate('/provider/dashboard');
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
            <span className="text-sm font-normal text-muted-foreground">(paso {step}/3)</span>
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
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Atras
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !priceFrom}
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
