/**
 * Dialog para que un owner (ya logueado) se registre como profesional/vet.
 * Salta el paso de crear cuenta (ya existe). Solo pide tipo + perfil basico.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { vetProfileSchema, type VetProfileFormData } from '@/lib/schemas';
import { VET_SPECIALTIES, SANTIAGO_COMUNAS, COMUNAS_POR_ZONA } from '@/lib/vetDirectory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  Stethoscope,
  Building2,
  Home as HomeIcon,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

type ProviderType = 'individual' | 'home_visit' | 'clinic';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BecomeProviderDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { setRole } = useActiveRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<0 | 1>(0);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VetProfileFormData>({
    resolver: zodResolver(vetProfileSchema),
    defaultValues: {
      bio: '',
      specialties: [],
      commune: '',
      service_areas: [],
      experience_years: '',
      price_from: '',
    },
  });

  const communeValue = watch('commune');

  const toggleSpecialty = (s: string) => {
    const next = selectedSpecialties.includes(s)
      ? selectedSpecialties.filter((x) => x !== s)
      : [...selectedSpecialties, s];
    setSelectedSpecialties(next);
    setValue('specialties', next, { shouldValidate: true });
  };

  const toggleArea = (c: string) => {
    const next = selectedAreas.includes(c)
      ? selectedAreas.filter((x) => x !== c)
      : [...selectedAreas, c];
    setSelectedAreas(next);
    setValue('service_areas', next, { shouldValidate: true });
  };

  const selectAllAreas = () => {
    const all = SANTIAGO_COMUNAS.slice();
    const allSelected = all.every((c) => selectedAreas.includes(c));
    const next = allSelected ? [] : all;
    setSelectedAreas(next);
    setValue('service_areas', next, { shouldValidate: true });
  };

  const selectZone = (comunas: readonly string[]) => {
    const allInZone = comunas.every((c) => selectedAreas.includes(c));
    const next = allInZone
      ? selectedAreas.filter((a) => !comunas.includes(a))
      : [...new Set([...selectedAreas, ...comunas])];
    setSelectedAreas(next);
    setValue('service_areas', next, { shouldValidate: true });
  };

  const onSubmitProfile = async (data: VetProfileFormData) => {
    if (!user || !providerType) return;
    setSubmitting(true);
    try {
      // Get user display_name from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();

      const displayName = profile?.display_name || user.email?.split('@')[0] || 'Profesional';

      const payload = {
        user_id: user.id,
        display_name: displayName,
        bio: data.bio.trim(),
        provider_type: providerType,
        specialties: data.specialties,
        service_areas: data.service_areas,
        commune: data.commune,
        experience_years: data.experience_years ? Number(data.experience_years) : null,
        price_from: data.price_from ? Number(data.price_from) : null,
        public_email: profile?.email || user.email,
        provider_plan: 'provider_free',
        is_directory_visible: false,
        status: 'pending',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('service_providers') as any).insert(payload);

      if (error) throw error;

      // Refetch provider status
      await queryClient.invalidateQueries({ queryKey: ['is-provider-role'] });

      // Switch to provider role
      setRole('provider');
      onOpenChange(false);
      toast.success(
        '¡Bienvenido como profesional! Completa tu perfil para aparecer en el directorio.'
      );
      navigate('/provider/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Error al crear tu perfil profesional';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: {
    value: ProviderType;
    icon: typeof Stethoscope;
    title: string;
    desc: string;
  }[] = [
    {
      value: 'individual',
      icon: Stethoscope,
      title: 'Veterinario individual',
      desc: 'Atiendes en consulta propia o de forma independiente.',
    },
    {
      value: 'home_visit',
      icon: HomeIcon,
      title: 'Atención a domicilio',
      desc: 'Visitas a las mascotas en sus hogares.',
    },
    {
      value: 'clinic',
      icon: Building2,
      title: 'Clínica veterinaria',
      desc: 'Local con varios profesionales.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 0 ? '¿Qué tipo de profesional eres?' : 'Construye tu perfil profesional'}
          </DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-3 mt-2">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = providerType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProviderType(opt.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-start gap-3 ${
                    active ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${
                      active ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{opt.title}</h3>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {active && <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0 mt-1" />}
                </button>
              );
            })}
            <Button className="w-full mt-4" disabled={!providerType} onClick={() => setStep(1)}>
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4 mt-2">
            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bp-bio">Bio profesional *</Label>
              <Textarea
                id="bp-bio"
                placeholder="Cuéntanos tu experiencia, enfoque y qué te diferencia..."
                rows={3}
                maxLength={500}
                {...register('bio')}
              />
              <p className="text-xs text-muted-foreground">
                {watch('bio')?.length || 0}/500 · mínimo 50 caracteres
              </p>
              {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
            </div>

            {/* Especialidades */}
            <div className="space-y-1.5">
              <Label>Especialidades * (al menos 1)</Label>
              <div className="flex flex-wrap gap-1.5">
                {VET_SPECIALTIES.map((s) => {
                  const active = selectedSpecialties.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition ${
                        active
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-foreground border-slate-300 hover:border-teal-400'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {errors.specialties && (
                <p className="text-xs text-destructive">{errors.specialties.message}</p>
              )}
            </div>

            {/* Comuna base */}
            <div className="space-y-1.5">
              <Label>Comuna base *</Label>
              <Select
                value={communeValue}
                onValueChange={(v) => setValue('commune', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige tu comuna principal" />
                </SelectTrigger>
                <SelectContent>
                  {SANTIAGO_COMUNAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.commune && (
                <p className="text-xs text-destructive">{errors.commune.message}</p>
              )}
            </div>

            {/* Comunas de atencion */}
            <div className="space-y-1.5">
              <Label>Comunas que atiendes * (al menos 1)</Label>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={selectAllAreas}
                  className={`px-2.5 py-1 rounded-full text-xs border transition font-medium ${
                    SANTIAGO_COMUNAS.every((c) => selectedAreas.includes(c))
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-teal-50 text-teal-700 border-teal-300 hover:border-teal-500'
                  }`}
                >
                  Toda la RM
                </button>
              </div>
              {Object.entries(COMUNAS_POR_ZONA).map(([zona, comunas]) => (
                <div key={zona} className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      {zona}
                    </span>
                    <button
                      type="button"
                      onClick={() => selectZone(comunas)}
                      className="text-[10px] text-teal-600 hover:underline"
                    >
                      {comunas.every((c) => selectedAreas.includes(c))
                        ? 'Quitar zona'
                        : 'Seleccionar zona'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {comunas.map((c) => {
                      const active = selectedAreas.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleArea(c)}
                          className={`px-2 py-0.5 rounded-full text-[11px] border transition ${
                            active
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-foreground border-slate-300 hover:border-teal-400'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {errors.service_areas && (
                <p className="text-xs text-destructive">{errors.service_areas.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(0)}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creando...
                  </>
                ) : (
                  'Registrarme como profesional'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
