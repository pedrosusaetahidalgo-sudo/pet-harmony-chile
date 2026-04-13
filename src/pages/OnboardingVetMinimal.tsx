import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Sparkles,
  MapPin,
  Clock,
  Phone,
} from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SANTIAGO_COMUNAS, VET_SPECIALTIES } from '@/lib/vetDirectory';
import { errorMessage } from '@/types/vetDirectory';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function OnboardingVetMinimal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);

  // Step 1: Profile
  const [displayName, setDisplayName] = useState('');
  const [commune, setCommune] = useState('');
  const [communeOpen, setCommuneOpen] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 2: Clinic info
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [schedule, setSchedule] = useState('');
  const [bio, setBio] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const canAdvanceStep1 = displayName.trim().length > 2;

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión primero.');
      return;
    }
    setSubmitting(true);
    try {
      let avatarUrl: string | null = null;

      // Upload photo if provided
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `providers/${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const payload = {
        user_id: user.id,
        display_name: displayName.trim(),
        commune: commune || null,
        specialties: specialties.length > 0 ? specialties : null,
        avatar_url: avatarUrl,
        provider_type: 'individual' as const,
        provider_plan: 'provider_free',
        is_directory_visible: false,
        status: 'pending',
        bio:
          [bio.trim(), schedule.trim() ? `Horario: ${schedule.trim()}` : '']
            .filter(Boolean)
            .join('\n') || null,
        clinic_name: clinicName.trim() || null,
        address: address.trim() || null,
        public_phone: whatsapp.trim() || null,
      };

      const { error: insertErr } = await supabase.from('service_providers').insert(payload);
      if (insertErr) throw insertErr;

      const completeness =
        40 +
        (clinicName ? 10 : 0) +
        (address ? 10 : 0) +
        (bio ? 15 : 0) +
        (whatsapp ? 10 : 0) +
        (avatarUrl ? 15 : 0);
      const pct = Math.min(completeness, 100);

      toast.success(
        `Tu perfil está al ${pct}%. ${pct < 80 ? 'Completa más para aparecer en el directorio.' : '¡Casi listo!'}`,
        {
          duration: 6000,
        }
      );
      navigate('/provider/dashboard');
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Error al crear tu perfil'));
    } finally {
      setSubmitting(false);
    }
  };

  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Paso {step} de 3</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <CardContent className="p-6 md:p-8 space-y-6">
          {/* ============ STEP 1: Profile ============ */}
          {step === 1 && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-1">Crea tu perfil veterinario</h1>
                <p className="text-sm text-muted-foreground">
                  Solo necesitamos lo básico. Puedes completar el resto después.
                </p>
              </div>

              {/* Photo */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group"
                >
                  <Avatar className="h-20 w-20 border-2 border-purple-200">
                    {photoPreview ? <AvatarImage src={photoPreview} alt="Foto de perfil" /> : null}
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-lg font-semibold">
                      {initials || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="vet-name">Nombre *</Label>
                <Input
                  id="vet-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dr. Juan Pérez"
                />
              </div>

              {/* Commune autocomplete */}
              <div>
                <Label>Comuna principal</Label>
                <Popover open={communeOpen} onOpenChange={setCommuneOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={communeOpen}
                      className="w-full justify-between font-normal"
                    >
                      {commune || 'Selecciona tu comuna'}
                      <Check
                        className={`ml-2 h-4 w-4 shrink-0 ${commune ? 'opacity-100' : 'opacity-0'}`}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar comuna..." />
                      <CommandList>
                        <CommandEmpty>Sin resultados.</CommandEmpty>
                        <CommandGroup>
                          {SANTIAGO_COMUNAS.map((c) => (
                            <CommandItem
                              key={c}
                              value={c}
                              onSelect={() => {
                                setCommune(c);
                                setCommuneOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${commune === c ? 'opacity-100' : 'opacity-0'}`}
                              />
                              {c}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Specialties multi-select */}
              <div>
                <Label className="mb-2 block">Especialidades</Label>
                <div className="flex flex-wrap gap-2">
                  {VET_SPECIALTIES.map((s) => {
                    const active = specialties.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${
                          active
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-foreground border-slate-300 hover:border-purple-400'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!canAdvanceStep1}
                onClick={() => setStep(2)}
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {/* ============ STEP 2: Clinic Info ============ */}
          {step === 2 && (
            <>
              <div className="text-center">
                <h1 className="text-xl font-bold mb-1 flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  Tu clínica o consulta
                </h1>
                <p className="text-sm text-muted-foreground">
                  Estos datos ayudan a que los dueños te encuentren. Todo es opcional.
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Nombre de la clínica
                </Label>
                <Input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Ej: Clínica Veterinaria PatitasFelices"
                />
                <p className="text-xs text-slate-400 mt-1">Déjalo vacío si eres independiente.</p>
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Dirección
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Providencia 1234, Providencia"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> WhatsApp de contacto
                </Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Horario de atención
                </Label>
                <Input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Ej: Lun-Vie 9:00-18:00, Sáb 9:00-13:00"
                />
              </div>

              <div>
                <Label>Bio profesional</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntale a los dueños sobre tu experiencia y enfoque profesional..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg">
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Saltar este paso
              </button>
            </>
          )}

          {/* ============ STEP 3: How it works ============ */}
          {step === 3 && (
            <>
              <div className="text-center">
                <h1 className="text-xl font-bold mb-1 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Cómo funciona Paw Friend
                </h1>
                <p className="text-sm text-muted-foreground">
                  Así es como los dueños te encuentran y agendan contigo.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Los dueños te encuentran',
                    desc: 'Tu perfil aparece en el directorio público de veterinarios de pawfriend.cl, filtrable por comuna y especialidad.',
                  },
                  {
                    step: '2',
                    title: 'Agendan contigo',
                    desc: 'Los dueños ven tus servicios, precios y disponibilidad, y reservan directamente desde la app.',
                  },
                  {
                    step: '3',
                    title: 'Gestionas desde tu dashboard',
                    desc: 'Confirmas citas, revisas fichas clínicas y accedes a analytics de tu consulta.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Commission transparency */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm font-medium text-purple-800 mb-1">Modelo transparente</p>
                <p className="text-xs text-purple-600">
                  Plan gratuito: comisión del 10% por reserva completada. Sin costo fijo mensual.
                  Planes pagados reducen la comisión hasta 0%.
                </p>
              </div>

              {/* Preview hint */}
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <p className="text-xs text-slate-500">
                  Después de crear tu perfil, podrás ver exactamente cómo te ven los dueños con el
                  botón{' '}
                  <span className="font-medium text-purple-600">"Ver como me ven los dueños"</span>.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
                </Button>
                <Button className="flex-1" size="lg" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando perfil...
                    </>
                  ) : (
                    'Crear perfil'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
