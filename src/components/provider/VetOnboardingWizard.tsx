import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Stethoscope,
  PartyPopper,
} from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useUpsertProviderProfile,
  uploadProviderAvatar,
  type ProviderProfileForm,
} from '@/hooks/useProviderProfile';
import { useAuth } from '@/hooks/useAuth';
import { SANTIAGO_COMUNAS, VET_SPECIALTIES } from '@/lib/vetDirectory';
import { logger } from '@/lib/logger';

const STEPS = [
  { title: 'Datos básicos', description: 'Nombre, tipo y bio' },
  { title: 'Foto y credenciales', description: 'Foto profesional y Colmevet' },
  { title: 'Servicios y zonas', description: 'Especialidades y comunas' },
  { title: 'Colmevet y precio', description: 'Verificación y precio base' },
];

const EMPTY: ProviderProfileForm = {
  display_name: '',
  bio: '',
  provider_type: 'individual',
  specialties: [],
  service_areas: [],
  commune: null,
  license_number: '',
  experience_years: null,
  price_from: null,
  avatar_url: null,
  public_email: null,
  public_phone: null,
  is_directory_visible: false,
};

export function VetOnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const upsert = useUpsertProviderProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProviderProfileForm>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const update = <K extends keyof ProviderProfileForm>(k: K, v: ProviderProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleInArray = (key: 'specialties' | 'service_areas', value: string) => {
    setForm((f) => {
      const current = f[key];
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      return { ...f, [key]: next };
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Máximo 5 MB');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadProviderAvatar(user.id, file);
      update('avatar_url', url);
      toast.success('Foto subida');
    } catch (err) {
      logger.error(err);
      toast.error('No se pudo subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return form.display_name.trim().length > 0;
    if (step === 1) return true; // foto y credenciales son opcionales
    if (step === 2) return form.specialties.length > 0;
    return true;
  };

  const handleFinish = async () => {
    try {
      await upsert.mutateAsync({ ...form, is_directory_visible: true });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-10 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">¡Perfil creado!</h2>
            <p className="text-sm text-muted-foreground">
              Tu perfil profesional está listo. Puedes editarlo cuando quieras desde tu panel.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/provider/dashboard')}>Ir a mi panel</Button>
              <Button variant="outline" onClick={() => navigate('/provider/profile-edit')}>
                Editar perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-sm">Crear perfil profesional</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Paso {step + 1} de {STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {STEPS[step].title} — {STEPS[step].description}
          </p>
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{STEPS[step].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div>
                  <Label>Nombre completo / del negocio *</Label>
                  <Input
                    value={form.display_name}
                    onChange={(e) => update('display_name', e.target.value)}
                    placeholder="Dr. Juan Pérez"
                  />
                </div>
                <div>
                  <Label>Tipo de atención *</Label>
                  <Select
                    value={form.provider_type}
                    onValueChange={(v) =>
                      update('provider_type', v as ProviderProfileForm['provider_type'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Consulta individual</SelectItem>
                      <SelectItem value="home_visit">Atención a domicilio</SelectItem>
                      <SelectItem value="clinic">Clínica veterinaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bio profesional</Label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => update('bio', e.target.value)}
                    placeholder="Ej: Médico/a veterinario/a con experiencia en medicina interna y cirugía de pequeños animales..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/500</p>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {form.avatar_url ? (
                      <img
                        src={form.avatar_url}
                        alt="Foto"
                        className="w-24 h-24 rounded-full object-cover border-2 border-purple-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
                        <Camera className="h-10 w-10 text-purple-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="inline-flex items-center gap-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-md text-sm">
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        {form.avatar_url ? 'Cambiar foto' : 'Subir foto profesional'}
                      </div>
                    </Label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">JPG o PNG · máx 5 MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Años de experiencia</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.experience_years ?? ''}
                      onChange={(e) =>
                        update('experience_years', e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                  <div>
                    <Label>N° Colmevet</Label>
                    <Input
                      value={form.license_number}
                      onChange={(e) => update('license_number', e.target.value)}
                      placeholder="Ej: 98765"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Email público</Label>
                    <Input
                      type="email"
                      value={form.public_email ?? ''}
                      onChange={(e) => update('public_email', e.target.value || null)}
                      placeholder="contacto@vet.cl"
                    />
                  </div>
                  <div>
                    <Label>Teléfono público</Label>
                    <Input
                      value={form.public_phone ?? ''}
                      onChange={(e) => update('public_phone', e.target.value || null)}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label className="mb-2 block">Especialidades (mínimo 1)</Label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {VET_SPECIALTIES.map((s) => {
                      const active = form.specialties.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleInArray('specialties', s)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-foreground border-slate-300 hover:border-purple-400'}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Comuna base</Label>
                  <Select
                    value={form.commune ?? ''}
                    onValueChange={(v) => update('commune', v || null)}
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
                </div>
                <div>
                  <Label className="mb-2 block">Comunas que atiendes</Label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {SANTIAGO_COMUNAS.map((c) => {
                      const active = form.service_areas.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleInArray('service_areas', c)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-foreground border-slate-300 hover:border-purple-400'}`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <Label>Precio mínimo consulta (CLP)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.price_from ?? ''}
                    onChange={(e) =>
                      update('price_from', e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="25000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Aparecerá como "Desde $X" en tu perfil
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-sm text-purple-900 mb-1">¡Casi listo!</h4>
                  <p className="text-xs text-purple-700">
                    Al finalizar, tu perfil se publicará en el directorio de Paw Friend. Podrás
                    editarlo cuando quieras.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="flex-1">
              Siguiente <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={upsert.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {upsert.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Crear mi perfil
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
