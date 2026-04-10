import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Stethoscope,
  Building2,
  Home as HomeIcon,
  PartyPopper,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase;
import { errorMessage } from '@/types/vetDirectory';
import { SANTIAGO_COMUNAS, VET_SPECIALTIES, COMUNAS_POR_ZONA } from '@/lib/vetDirectory';
import { PublicHeader, PublicFooter } from './DirectorioVets';
import { PageHeader } from '@/components/PageHeader';
import { useScrollOnFocus } from '@/hooks/useScrollOnFocus';

type ProviderType = 'individual' | 'home_visit' | 'clinic';

interface FormState {
  // Paso 1
  type: ProviderType | null;
  // Paso 2
  display_name: string;
  email: string;
  password: string;
  phone: string;
  license: string;
  // Paso 3
  bio: string;
  specialties: string[];
  commune: string;
  service_areas: string[];
  experience_years: string;
  price_from: string;
  // Resultado
  createdSlug?: string;
  // Error state
  alreadyRegistered?: boolean;
}

const STEPS = ['Tipo', 'Cuenta', 'Perfil', 'Listo'] as const;

export default function RegistroVeterinario() {
  useScrollOnFocus();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    type: null,
    display_name: '',
    email: '',
    password: '',
    phone: '',
    license: '',
    bio: '',
    specialties: [],
    commune: '',
    service_areas: [],
    experience_years: '',
    price_from: '',
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArr = (k: 'specialties' | 'service_areas', value: string) => {
    setForm((f) => {
      const cur = f[k];
      return { ...f, [k]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
    });
  };

  const canNext = (): boolean => {
    if (step === 0) return !!form.type;
    if (step === 1) {
      return (
        form.display_name.trim().length > 2 &&
        /\S+@\S+\.\S+/.test(form.email) &&
        form.password.length >= 6
      );
    }
    if (step === 2) {
      return (
        form.bio.trim().length >= 50 &&
        form.specialties.length > 0 &&
        !!form.commune &&
        form.service_areas.length > 0
      );
    }
    return false;
  };

  const handleSignupAndCreateProvider = async () => {
    setSubmitting(true);
    try {
      // 1. Auth signup
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { display_name: form.display_name.trim() },
          emailRedirectTo: `${window.location.origin}/provider/dashboard`,
        },
      });
      if (authErr) throw authErr;
      if (!auth.user) throw new Error('No se pudo crear la cuenta');

      // 2. Crear service_provider (RLS permite si user_id = auth.uid())
      const payload = {
        user_id: auth.user.id,
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
        provider_type: form.type!,
        specialties: form.specialties,
        service_areas: form.service_areas,
        commune: form.commune,
        license_number: form.license.trim() || null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        price_from: form.price_from ? Number(form.price_from) : null,
        public_phone: form.phone.trim() || null,
        public_email: form.email.trim(),
        provider_plan: 'provider_free',
        is_directory_visible: false, // se activa cuando complete perfil al 80%
        status: 'pending',
      };

      const { data: provider, error: provErr } = await sb
        .from('service_providers')
        .insert(payload)
        .select('slug')
        .single();
      if (provErr) throw provErr;

      update('createdSlug', (provider as { slug: string }).slug);
      setStep(3);
    } catch (err: unknown) {
      const msg = errorMessage(err, 'Error al crear tu cuenta');
      const isAlreadyRegistered =
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('user_already_exists') ||
        msg.toLowerCase().includes('ya existe');
      if (isAlreadyRegistered) {
        update('alreadyRegistered', true);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step === 2) {
      void handleSignupAndCreateProvider();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <PublicHeader />
      <PageHeader title="Registro veterinario" onBack={() => navigate('/para-veterinarios')} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">
              Paso {step + 1} de {STEPS.length}
            </span>
            <span className="font-medium text-purple-700">{STEPS[step]}</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6 md:p-8">
            {step === 0 && <StepType form={form} update={update} />}
            {step === 1 && <StepAccount form={form} update={update} />}
            {step === 2 && <StepProfile form={form} update={update} toggleArr={toggleArr} setForm={setForm} />}
            {step === 3 && <StepDone slug={form.createdSlug} />}

            {step < 3 && (
              <div className="flex justify-between mt-8 gap-3">
                {step > 0 ? (
                  <Button variant="outline" onClick={back} disabled={submitting}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                  </Button>
                ) : (
                  <Link to="/">
                    <Button variant="ghost">Cancelar</Button>
                  </Link>
                )}
                <Button onClick={next} disabled={!canNext() || submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creando…
                    </>
                  ) : step === 2 ? (
                    'Crear mi cuenta'
                  ) : (
                    <>
                      Continuar <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {step === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link to="/auth" className="text-purple-700 font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

// ============================================================
// Steps
// ============================================================

function StepType({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const options: { value: ProviderType; icon: typeof Stethoscope; title: string; desc: string }[] = [
    {
      value: 'individual',
      icon: Stethoscope,
      title: 'Veterinario individual',
      desc: 'Atiendes en consulta propia o trabajas de manera independiente.',
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
      desc: 'Tienes un local con varios profesionales.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold mb-1">¿Qué tipo de profesional eres?</h1>
        <p className="text-sm text-muted-foreground">Elige el que mejor te describe.</p>
      </div>

      {options.map((opt) => {
        const Icon = opt.icon;
        const active = form.type === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => update('type', opt.value)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-start gap-4 ${
              active
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            <div
              className={`rounded-full p-3 ${
                active ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
              }`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{opt.title}</h3>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </div>
            {active && <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

function StepAccount({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold mb-1">Datos de tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Vamos a crear tu cuenta en Paw Friend.
        </p>
      </div>

      {form.alreadyRegistered && (
        <Alert variant="destructive" className="border-orange-300 bg-orange-50">
          <AlertDescription className="flex flex-col gap-2">
            <span>Ya existe una cuenta con el email <strong>{form.email}</strong>.</span>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => navigate(`/auth?mode=login&email=${encodeURIComponent(form.email)}`)}
            >
              Iniciar sesión con {form.email}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Nombre completo / del negocio *</Label>
        <Input
          id="name"
          value={form.display_name}
          onChange={(e) => update('display_name', e.target.value)}
          placeholder="Dr. Juan Pérez"
        />
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="tu@email.cl"
        />
      </div>

      <div>
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div>
        <Label htmlFor="phone">Teléfono de contacto</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="+56 9 1234 5678"
        />
      </div>

      <div>
        <Label htmlFor="license">N° Colmevet (opcional)</Label>
        <Input
          id="license"
          value={form.license}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, '');
            update('license', val);
          }}
          placeholder="12.345"
          pattern="[0-9]{2}\.[0-9]{3}|[0-9]{1,5}"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Formato: XX.XXX (ej: 12.345). Lo verificaremos para darte el badge ✓ Verificado.
        </p>
      </div>
    </div>
  );
}

function StepProfile({
  form,
  update,
  toggleArr,
  setForm,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleArr: (k: 'specialties' | 'service_areas', value: string) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold mb-1">Construye tu perfil</h1>
        <p className="text-sm text-muted-foreground">
          Esto es lo que verán tus futuros pacientes.
        </p>
      </div>

      <div>
        <Label htmlFor="bio">Bio profesional *</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) => update('bio', e.target.value)}
          placeholder="Cuéntanos tu experiencia, enfoque y qué te diferencia…"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {form.bio.length}/500 · mínimo 50 caracteres
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Especialidades * (al menos 1)</Label>
        <div className="flex flex-wrap gap-2">
          {VET_SPECIALTIES.map((s) => {
            const active = form.specialties.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleArr('specialties', s)}
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

      <div>
        <Label htmlFor="commune">Comuna base *</Label>
        <Select value={form.commune} onValueChange={(v) => update('commune', v)}>
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
        <Label className="mb-2 block">Comunas que atiendes * (al menos 1)</Label>
        {/* Shortcut: toda la RM */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => {
              const allComunas = SANTIAGO_COMUNAS.slice();
              const allSelected = allComunas.every((c) => form.service_areas.includes(c));
              if (allSelected) {
                // Deselect all
                setForm((f) => ({ ...f, service_areas: [] }));
              } else {
                setForm((f) => ({ ...f, service_areas: [...allComunas] }));
              }
            }}
            className={`px-3 py-1.5 rounded-full text-sm border transition font-medium ${
              SANTIAGO_COMUNAS.every((c) => form.service_areas.includes(c))
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-purple-50 text-purple-700 border-purple-300 hover:border-purple-500'
            }`}
          >
            Toda la RM
          </button>
        </div>
        {/* Agrupadas por zona */}
        {Object.entries(COMUNAS_POR_ZONA).map(([zona, comunas]) => (
          <div key={zona} className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">{zona}</span>
              <button
                type="button"
                onClick={() => {
                  const allInZone = comunas.every((c) => form.service_areas.includes(c));
                  if (allInZone) {
                    setForm((f) => ({ ...f, service_areas: f.service_areas.filter((a) => !comunas.includes(a)) }));
                  } else {
                    setForm((f) => ({ ...f, service_areas: [...new Set([...f.service_areas, ...comunas])] }));
                  }
                }}
                className="text-[10px] text-purple-600 hover:underline"
              >
                {comunas.every((c) => form.service_areas.includes(c)) ? 'Quitar zona' : 'Seleccionar zona'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {comunas.map((c) => {
                const active = form.service_areas.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleArr('service_areas', c)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      active
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-foreground border-slate-300 hover:border-purple-400'
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="years">Años de experiencia</Label>
          <Input
            id="years"
            type="number"
            min={0}
            value={form.experience_years}
            onChange={(e) => update('experience_years', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="price">Precio desde (CLP)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            value={form.price_from}
            onChange={(e) => update('price_from', e.target.value)}
            placeholder="25000"
          />
        </div>
      </div>
    </div>
  );
}

function StepDone({ slug }: { slug?: string }) {
  const navigate = useNavigate();
  const profileUrl = slug ? `https://pawfriend.cl/veterinarios/${slug}` : null;

  return (
    <div className="text-center space-y-4 py-4">
      <div className="inline-flex p-4 rounded-full bg-green-100 mb-2">
        <PartyPopper className="h-12 w-12 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold">¡Bienvenido a Paw Friend!</h1>
      <p className="text-muted-foreground">
        Tu cuenta fue creada con éxito. Completa tu perfil al 80% para aparecer en el directorio público.
      </p>

      {profileUrl && (
        <div className="bg-purple-50 rounded-lg p-4 my-4">
          <p className="text-xs text-muted-foreground mb-1">Tu URL pública será:</p>
          <p className="text-sm font-mono text-purple-700 break-all">{profileUrl}</p>
        </div>
      )}

      <Badge variant="secondary" className="text-xs">
        Plan Gratis · 3 meses para empezar
      </Badge>

      <div className="flex flex-col gap-2 pt-4">
        <Button
          size="lg"
          onClick={() => navigate('/provider/profile-edit')}
          className="w-full"
        >
          Completar mi perfil ahora
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/provider/dashboard')}
          className="w-full"
        >
          Ir al dashboard
        </Button>
      </div>
    </div>
  );
}
