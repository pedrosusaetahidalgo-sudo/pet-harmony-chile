/**
 * Dialog para que un owner (ya logueado) se registre como profesional.
 * Soporta todos los tipos de servicio: vet, groomer, walker, trainer, sitter.
 * Vet tiene flujo extendido (tipo negocio + especialidades).
 * Los demás tienen un flujo simplificado (bio + comuna + precio).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleActivation } from '@/hooks/useRoleActivation';
import { VET_SPECIALTIES, SANTIAGO_COMUNAS, COMUNAS_POR_ZONA } from '@/lib/vetDirectory';
import { GROOMER_SERVICES } from '@/hooks/useGroomerProfile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Stethoscope,
  Building2,
  Home as HomeIcon,
  ArrowRight,
  CheckCircle2,
  Dog,
  Scissors,
  GraduationCap,
  Heart,
} from 'lucide-react';
import { WizardFooter } from '@/components/ui/wizard-footer';

type ServiceType = 'veterinarian' | 'grooming' | 'dog_walker' | 'dogsitter' | 'trainer';
type ProviderType = 'individual' | 'home_visit' | 'clinic';

const SERVICE_OPTIONS: {
  value: ServiceType;
  icon: typeof Stethoscope;
  title: string;
  desc: string;
  color: string;
}[] = [
  {
    value: 'veterinarian',
    icon: Stethoscope,
    title: 'Veterinario',
    desc: 'Consultas, vacunas, cirugía y atención clínica.',
    color: 'teal',
  },
  {
    value: 'grooming',
    icon: Scissors,
    title: 'Peluquería canina',
    desc: 'Baño, corte, arreglo de raza y spa.',
    color: 'pink',
  },
  {
    value: 'dog_walker',
    icon: Dog,
    title: 'Paseador de perros',
    desc: 'Paseos diarios y ejercicio al aire libre.',
    color: 'blue',
  },
  {
    value: 'dogsitter',
    icon: Heart,
    title: 'Cuidador de mascotas',
    desc: 'Cuidado en tu hogar o en el del cuidador.',
    color: 'purple',
  },
  {
    value: 'trainer',
    icon: GraduationCap,
    title: 'Entrenador canino',
    desc: 'Obediencia, socialización y corrección de conducta.',
    color: 'orange',
  },
];

const VET_TYPE_OPTIONS: {
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BecomeProviderDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  // Sprint 1 P2 ARCH-003: hook compartido encapsula post-submit.
  const activateRole = useRoleActivation();

  // Step: 0=service type, 1=vet business type (vet only), 2=profile form
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [bio, setBio] = useState('');
  const [commune, setCommune] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedGroomerServices, setSelectedGroomerServices] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [businessName, setBusinessName] = useState('');

  const isVet = serviceType === 'veterinarian';
  const isGroomer = serviceType === 'grooming';

  const handleServiceSelect = (type: ServiceType) => {
    setServiceType(type);
  };

  const handleNextFromServiceType = () => {
    if (!serviceType) return;
    if (isVet) {
      setStep(1); // go to vet business type
    } else {
      setStep(2); // skip to profile form
    }
  };

  const handleNextFromVetType = () => {
    if (!providerType) return;
    setStep(2);
  };

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleGroomerService = (s: string) => {
    setSelectedGroomerServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleArea = (c: string) => {
    setSelectedAreas((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const selectAllAreas = () => {
    const all = SANTIAGO_COMUNAS.slice();
    const allSelected = all.every((c) => selectedAreas.includes(c));
    setSelectedAreas(allSelected ? [] : all);
  };

  const selectZone = (comunas: readonly string[]) => {
    const allInZone = comunas.every((c) => selectedAreas.includes(c));
    setSelectedAreas((prev) =>
      allInZone ? prev.filter((a) => !comunas.includes(a)) : [...new Set([...prev, ...comunas])]
    );
  };

  const canSubmit = () => {
    if (bio.trim().length < 20) return false;
    if (!commune) return false;
    if (selectedAreas.length === 0) return false;
    if (isVet && selectedSpecialties.length === 0) return false;
    if (isGroomer && selectedGroomerServices.length === 0) return false;
    return true;
  };

  const handleSubmitProfile = async () => {
    if (!user || !serviceType || !canSubmit()) return;
    setSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();

      const displayName =
        isGroomer && businessName.trim()
          ? businessName.trim()
          : profile?.display_name || user.email?.split('@')[0] || 'Profesional';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        user_id: user.id,
        display_name: displayName,
        bio: bio.trim(),
        primary_service_type: serviceType,
        service_areas: selectedAreas,
        commune,
        experience_years: experienceYears ? Number(experienceYears) : null,
        price_from: priceFrom ? Number(priceFrom) : null,
        public_email: profile?.email || user.email,
        provider_plan: 'provider_free',
        is_directory_visible: false,
        status: 'pending',
      };

      // Vet-specific fields
      if (isVet) {
        payload.provider_type = providerType;
        payload.specialties = selectedSpecialties;
      }

      // Groomer-specific fields
      if (isGroomer) {
        payload.business_name = businessName.trim() || null;
        payload.services_offered = selectedGroomerServices;
        payload.base_price_clp = priceFrom ? Number(priceFrom) : null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newProvider, error } = await (supabase.from('service_providers') as any)
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;

      // Auto-crear provider_service_offerings
      if (newProvider?.id) {
        await supabase.from('provider_service_offerings').upsert(
          {
            provider_id: newProvider.id,
            service_type: serviceType,
            price_base: priceFrom ? Number(priceFrom) : 0,
            price_unit: isVet ? 'session' : 'hour',
            is_active: true,
          },
          { onConflict: 'provider_id,service_type' }
        );
      }

      // Sprint 1 P2 ARCH-003: hook compartido (5 lineas duplicadas → 1).
      await activateRole('provider', {
        successMessage:
          '¡Bienvenido como profesional! Completa tu perfil para aparecer en el directorio.',
        navigateTo: '/provider/dashboard',
        invalidateQueryKeys: [['is-provider-role'], ['my-provider-profile']],
        onClose: () => onOpenChange(false),
      });
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

  const handleBack = () => {
    if (step === 2 && isVet) setStep(1);
    else if (step === 2) setStep(0);
    else if (step === 1) setStep(0);
  };

  const serviceLabel = SERVICE_OPTIONS.find((o) => o.value === serviceType)?.title || 'Profesional';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 0 && '¿Qué tipo de profesional eres?'}
            {step === 1 && '¿Cómo atiendes?'}
            {step === 2 && `Perfil de ${serviceLabel}`}
          </DialogTitle>
          <DialogDescription>
            {step === 0 && 'Elige el tipo de servicio que ofreces a los dueños de mascotas.'}
            {step === 1 && 'Indica cómo prefieres atender a tus clientes.'}
            {step === 2 && 'Completa los datos básicos de tu perfil público.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 0: Choose service type */}
        {step === 0 && (
          <div className="space-y-2.5 mt-2">
            {SERVICE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = serviceType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleServiceSelect(opt.value)}
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
            <Button
              className="w-full mt-4"
              disabled={!serviceType}
              onClick={handleNextFromServiceType}
            >
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 1: Vet business type (only for vets) */}
        {step === 1 && isVet && (
          <div className="space-y-3 mt-2">
            {VET_TYPE_OPTIONS.map((opt) => {
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
            <WizardFooter
              mode="next"
              nextLabel="Continuar"
              onBack={() => setStep(0)}
              onPrimary={handleNextFromVetType}
              primaryDisabled={!providerType}
            />
          </div>
        )}

        {/* Step 2: Profile form */}
        {step === 2 && (
          <div className="space-y-4 mt-2">
            {/* Business name (groomer only) */}
            {isGroomer && (
              <div className="space-y-1.5">
                <Label>Nombre del negocio</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Peluquería Canina Las Patitas"
                  autoComplete="organization"
                  autoCapitalize="words"
                />
              </div>
            )}

            {/* Bio */}
            <div className="space-y-1.5">
              <Label>Descripción profesional *</Label>
              <Textarea
                placeholder="Cuéntanos tu experiencia, enfoque y qué te diferencia..."
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/500 · mínimo 20 caracteres
              </p>
            </div>

            {/* Vet specialties */}
            {isVet && (
              <div className="space-y-1.5">
                <Label>Especialidades * (al menos 1)</Label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
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
              </div>
            )}

            {/* Groomer services */}
            {isGroomer && (
              <div className="space-y-1.5">
                <Label>Servicios que ofreces * (al menos 1)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {GROOMER_SERVICES.map((s) => {
                    const active = selectedGroomerServices.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleGroomerService(s)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition ${
                          active
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-white text-foreground border-slate-300 hover:border-pink-400'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price + experience row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Años de experiencia</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="3"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio desde (CLP)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  placeholder={isVet ? '25000' : '15000'}
                />
              </div>
            </div>

            {/* Comuna base */}
            <div className="space-y-1.5">
              <Label>Comuna base *</Label>
              <Select value={commune} onValueChange={setCommune}>
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
            </div>

            {/* Comunas de atención */}
            <div className="space-y-1.5">
              <Label>Comunas que atiendes * (al menos 1)</Label>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={selectAllAreas}
                  className={`px-2.5 py-1 rounded-full text-xs border transition font-medium ${
                    SANTIAGO_COMUNAS.every((c) => selectedAreas.includes(c))
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-teal-500 hover:text-teal-700'
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
            </div>

            {/* Actions */}
            <WizardFooter
              mode="submit"
              loadingLabel="Creando..."
              submitLabel="Registrarme como profesional"
              loading={submitting}
              primaryDisabled={!canSubmit()}
              onBack={handleBack}
              onPrimary={handleSubmitProfile}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
