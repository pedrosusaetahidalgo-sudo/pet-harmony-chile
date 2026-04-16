import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Stethoscope,
  Store,
  Scissors,
  Dog,
  ShieldCheck,
  GraduationCap,
  Heart,
  Shield,
  Flame,
  Truck,
  Package,
  HelpCircle,
  Send,
  Sparkles,
} from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
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
import { supabase } from '@/integrations/supabase/client';
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicLayout';
import { SANTIAGO_COMUNAS } from '@/lib/vetDirectory';

// ─── Tipos ──────────────────────────────────────────────────────────────

type Categoria =
  | 'veterinaria'
  | 'tienda'
  | 'peluqueria'
  | 'paseador'
  | 'cuidador'
  | 'entrenador'
  | 'refugio'
  | 'seguro'
  | 'crematorio'
  | 'transporte'
  | 'alimento'
  | 'otro';

interface CategoriaOption {
  value: Categoria;
  icon: typeof Stethoscope;
  title: string;
  desc: string;
  gradient: string;
  iconColor: string;
}

interface FormState {
  categoria: Categoria | null;
  nombre_negocio: string;
  nombre_contacto: string;
  email: string;
  telefono: string;
  website: string;
  instagram: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  descripcion: string;
  servicios_ofrecidos: string;
  horario: string;
}

// ─── Constantes ─────────────────────────────────────────────────────────

const CATEGORIAS: CategoriaOption[] = [
  {
    value: 'veterinaria',
    icon: Stethoscope,
    title: 'Veterinaria / Clínica',
    desc: 'Clínica veterinaria, hospital o consulta particular.',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconColor: 'text-emerald-600',
  },
  {
    value: 'tienda',
    icon: Store,
    title: 'Tienda de mascotas',
    desc: 'Petshop, cadena o tienda online de productos para mascotas.',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconColor: 'text-blue-600',
  },
  {
    value: 'peluqueria',
    icon: Scissors,
    title: 'Peluquería canina',
    desc: 'Grooming profesional, baño, corte y arreglo de mascotas.',
    gradient: 'from-pink-500/10 to-rose-500/10',
    iconColor: 'text-pink-600',
  },
  {
    value: 'paseador',
    icon: Dog,
    title: 'Paseador de perros',
    desc: 'Servicio de paseos profesionales con seguimiento.',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    iconColor: 'text-cyan-600',
  },
  {
    value: 'cuidador',
    icon: ShieldCheck,
    title: 'Cuidador / Dogsitter',
    desc: 'Cuidado temporal de mascotas en tu hogar o el del dueño.',
    gradient: 'from-purple-500/10 to-violet-500/10',
    iconColor: 'text-purple-600',
  },
  {
    value: 'entrenador',
    icon: GraduationCap,
    title: 'Entrenador canino',
    desc: 'Adiestramiento, obediencia y modificación de conducta.',
    gradient: 'from-orange-500/10 to-amber-500/10',
    iconColor: 'text-orange-600',
  },
  {
    value: 'refugio',
    icon: Heart,
    title: 'Refugio / Fundación',
    desc: 'ONG, fundación o santuario de rescate y adopción.',
    gradient: 'from-rose-500/10 to-pink-500/10',
    iconColor: 'text-rose-600',
  },
  {
    value: 'seguro',
    icon: Shield,
    title: 'Seguro de mascotas',
    desc: 'Aseguradora o corredor de seguros para mascotas.',
    gradient: 'from-indigo-500/10 to-blue-500/10',
    iconColor: 'text-indigo-600',
  },
  {
    value: 'crematorio',
    icon: Flame,
    title: 'Crematorio / Memorial',
    desc: 'Servicios de despedida, cremación y urnas.',
    gradient: 'from-slate-500/10 to-gray-500/10',
    iconColor: 'text-slate-600',
  },
  {
    value: 'transporte',
    icon: Truck,
    title: 'Transporte de mascotas',
    desc: 'Traslado nacional o internacional de animales.',
    gradient: 'from-violet-500/10 to-indigo-500/10',
    iconColor: 'text-violet-600',
  },
  {
    value: 'alimento',
    icon: Package,
    title: 'Alimentación / Marca',
    desc: 'Fabricante o distribuidor de alimento para mascotas.',
    gradient: 'from-amber-500/10 to-yellow-500/10',
    iconColor: 'text-amber-600',
  },
  {
    value: 'otro',
    icon: HelpCircle,
    title: 'Otro servicio',
    desc: 'Cualquier otro servicio o producto para mascotas.',
    gradient: 'from-gray-500/10 to-slate-500/10',
    iconColor: 'text-gray-600',
  },
];

// Qué campos extra muestra cada categoría
const FIELD_CONFIG: Record<
  Categoria,
  {
    website: boolean;
    direccion: boolean;
    comuna: boolean;
    ciudad: boolean;
    servicios: boolean;
    horario: boolean;
  }
> = {
  veterinaria: {
    website: true,
    direccion: true,
    comuna: true,
    ciudad: true,
    servicios: true,
    horario: true,
  },
  tienda: {
    website: true,
    direccion: true,
    comuna: true,
    ciudad: true,
    servicios: false,
    horario: true,
  },
  peluqueria: {
    website: true,
    direccion: true,
    comuna: true,
    ciudad: true,
    servicios: true,
    horario: true,
  },
  paseador: {
    website: false,
    direccion: false,
    comuna: true,
    ciudad: true,
    servicios: true,
    horario: true,
  },
  cuidador: {
    website: false,
    direccion: false,
    comuna: true,
    ciudad: true,
    servicios: true,
    horario: true,
  },
  entrenador: {
    website: true,
    direccion: false,
    comuna: true,
    ciudad: true,
    servicios: true,
    horario: true,
  },
  refugio: {
    website: true,
    direccion: true,
    comuna: true,
    ciudad: true,
    servicios: false,
    horario: true,
  },
  seguro: {
    website: true,
    direccion: false,
    comuna: false,
    ciudad: false,
    servicios: false,
    horario: false,
  },
  crematorio: {
    website: true,
    direccion: true,
    comuna: true,
    ciudad: true,
    servicios: true,
    horario: true,
  },
  transporte: {
    website: true,
    direccion: false,
    comuna: false,
    ciudad: true,
    servicios: true,
    horario: false,
  },
  alimento: {
    website: true,
    direccion: false,
    comuna: false,
    ciudad: false,
    servicios: false,
    horario: false,
  },
  otro: {
    website: true,
    direccion: true,
    comuna: true,
    ciudad: true,
    servicios: true,
    horario: true,
  },
};

// Beneficios personalizados por categoría
const BENEFICIOS: Record<Categoria, string[]> = {
  veterinaria: [
    'Perfil público verificado en el directorio de veterinarios de Paw Friend',
    'Recibe reservas directas de dueños de mascotas en tu zona',
    'Sistema de reseñas que genera confianza y posiciona tu clínica',
    'Acceso a herramientas de ficha clínica digital para tus pacientes',
  ],
  tienda: [
    'Aparece en el mapa interactivo de tiendas de Paw Friend',
    'Miles de dueños de mascotas buscan productos cerca de ellos',
    'Enlace directo a tu tienda online o redes sociales',
    'Visibilidad 24/7 sin costo de publicidad adicional',
  ],
  peluqueria: [
    'Perfil con fotos, precios y horarios en el directorio de peluquerías',
    'Recibe reservas directas desde la app de Paw Friend',
    'Sistema de valoraciones que destaca tu trabajo',
    'Llega a nuevos clientes en tu comuna sin pagar publicidad',
  ],
  paseador: [
    'Perfil profesional con tarifas y zonas de cobertura',
    'Reservas directas de dueños que necesitan paseador',
    'Reseñas verificadas que aumentan tu reputación',
    'Visibilidad en una app usada por miles de dueños en Chile',
  ],
  cuidador: [
    'Perfil completo con fotos de tu hogar y tarifas',
    'Reservas directas cuando dueños viajan o necesitan ayuda',
    'Reseñas que generan confianza en tu servicio',
    'Destaca entre los cuidadores de tu comuna',
  ],
  entrenador: [
    'Perfil profesional con especialidades y metodología',
    'Reservas de sesiones directas desde la app',
    'Reseñas de clientes que validan tu experiencia',
    'Llega a dueños que buscan entrenamiento en tu zona',
  ],
  refugio: [
    'Sección dedicada de adopción dentro de Paw Friend',
    'Visibilidad para tus campañas de rescate y adopción',
    'Conexión directa con miles de potenciales adoptantes',
    'Difusión gratuita de tus animales en adopción',
  ],
  seguro: [
    'Presencia en el comparador de seguros de mascotas',
    'Enlace directo a cotización desde la app',
    'Acceso a una audiencia de dueños premium preocupados por la salud de sus mascotas',
    'Posicionamiento como opción recomendada en Paw Friend',
  ],
  crematorio: [
    'Presencia respetuosa en el directorio de servicios memoriales',
    'Contacto directo cuando los dueños más lo necesitan',
    'Mapa con ubicación y horarios para facilitar el acceso',
    'Conexión con la comunidad de Paw Friend en momentos sensibles',
  ],
  transporte: [
    'Visibilidad en el mapa de servicios de transporte',
    'Dueños que buscan traslado nacional e internacional',
    'Enlace directo a cotización o reserva',
    'Posicionamiento frente a dueños que viajan con sus mascotas',
  ],
  alimento: [
    'Presencia de tu marca frente a miles de dueños de mascotas',
    'Enlace directo a tu e-commerce o distribuidores',
    'Asociación con la plataforma de salud animal líder en Chile',
    'Visibilidad en una comunidad activa y en crecimiento',
  ],
  otro: [
    'Visibilidad en el ecosistema de Paw Friend',
    'Contacto directo con dueños de mascotas',
    'Presencia en mapa y directorio de servicios',
    'Comunidad activa y en crecimiento',
  ],
};

const STEPS = ['Categoría', 'Datos', 'Perfil', 'Listo'] as const;

// ─── Componente principal ───────────────────────────────────────────────

export default function RegistroPartner() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({
    categoria: null,
    nombre_negocio: '',
    nombre_contacto: '',
    email: '',
    telefono: '',
    website: '',
    instagram: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    descripcion: '',
    servicios_ofrecidos: '',
    horario: '',
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canNext = (): boolean => {
    if (step === 0) return !!form.categoria;
    if (step === 1) {
      return (
        form.nombre_negocio.trim().length > 1 &&
        form.nombre_contacto.trim().length > 1 &&
        /\S+@\S+\.\S+/.test(form.email)
      );
    }
    if (step === 2) {
      return form.descripcion.trim().length >= 20;
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!form.categoria) return;
    setSubmitting(true);
    try {
      const serviciosArr = form.servicios_ofrecidos
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase.from('partner_submissions').insert({
        categoria: form.categoria,
        nombre_negocio: form.nombre_negocio.trim(),
        nombre_contacto: form.nombre_contacto.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || null,
        website: form.website.trim() || null,
        instagram: form.instagram.trim() || null,
        direccion: form.direccion.trim() || null,
        comuna: form.comuna || null,
        ciudad: form.ciudad.trim() || null,
        descripcion: form.descripcion.trim() || null,
        servicios_ofrecidos: serviciosArr.length > 0 ? serviciosArr : null,
        horario: form.horario.trim() || null,
      });

      if (error) throw error;

      setSubmitted(true);
      setStep(3);
      toast.success('Solicitud enviada correctamente');
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Error al enviar la solicitud. Intenta nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step === 2) {
      void handleSubmit();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const progress = ((step + 1) / STEPS.length) * 100;

  const catInfo = CATEGORIAS.find((c) => c.value === form.categoria);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <PublicHeader />

      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-purple-600 to-violet-700 text-white py-12 md:py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Programa de Partners
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Haz crecer tu negocio con Paw Friend
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Llega a miles de dueños de mascotas en Chile. Completa el formulario y nos pondremos en
            contacto contigo.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 max-w-2xl -mt-6 relative z-20">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">
              Paso {step + 1} de {STEPS.length}
            </span>
            <span className="font-medium text-purple-700">{STEPS[step]}</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6 md:p-8">
            {step === 0 && <StepCategoria form={form} update={update} />}
            {step === 1 && <StepDatos form={form} update={update} />}
            {step === 2 && <StepPerfil form={form} update={update} catInfo={catInfo} />}
            {step === 3 && <StepListo categoria={form.categoria} />}

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
                <Button
                  onClick={next}
                  disabled={!canNext() || submitting}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando…
                    </>
                  ) : step === 2 ? (
                    <>
                      <Send className="h-4 w-4 mr-1" /> Enviar solicitud
                    </>
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

        {/* Beneficios debajo del form en paso 0 */}
        {step === 0 && form.categoria && (
          <Card className="mt-6 border-brand-200 bg-brand-50/50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-brand-800 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-600" />
                ¿Qué ganas como {catInfo?.title}?
              </h3>
              <ul className="space-y-2">
                {BENEFICIOS[form.categoria].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-700">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-brand-500 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {/* FAQ — siempre visible */}
        <div className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold text-center">Preguntas frecuentes</h3>
          {[
            {
              q: '¿Tiene algún costo registrarse?',
              a: 'No. Registrar tu negocio en el directorio de Paw Friend es completamente gratis. No hay comisiones ocultas ni cobros por aparecer.',
            },
            {
              q: '¿Cuánto tarda la aprobación?',
              a: 'Revisamos las solicitudes en menos de 48 horas hábiles. Te contactaremos por email o WhatsApp para coordinar tu ingreso.',
            },
            {
              q: '¿Qué pasa después de enviar el formulario?',
              a: 'Nuestro equipo revisa tu solicitud, verifica los datos y te contacta para confirmar. Una vez aprobado, tu negocio aparece en el directorio de Paw Friend.',
            },
            {
              q: '¿Puedo editar mis datos después?',
              a: 'Sí. Una vez aprobado, podrás actualizar tu perfil, horarios, fotos y servicios desde tu panel de proveedor.',
            },
            {
              q: '¿En qué ciudades opera Paw Friend?',
              a: 'Actualmente tenemos mayor cobertura en la Región Metropolitana, pero aceptamos partners de todo Chile. Estamos creciendo cada semana.',
            },
          ].map((faq, i) => (
            <details key={i} className="group rounded-lg border bg-white p-4">
              <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                {faq.q}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

// ─── Steps ──────────────────────────────────────────────────────────────

function StepCategoria({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold">¿Qué tipo de servicio ofreces?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona la categoría que mejor describe tu negocio
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIAS.map((cat) => {
          const Icon = cat.icon;
          const selected = form.categoria === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => update('categoria', cat.value)}
              className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                selected
                  ? 'border-brand-500 bg-brand-50 shadow-md'
                  : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
              }`}
            >
              {selected && (
                <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-brand-600" />
              )}
              <div className={`rounded-xl bg-gradient-to-br ${cat.gradient} p-2.5 flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${cat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-sm ${selected ? 'text-brand-800' : ''}`}>
                  {cat.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">{cat.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDatos({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const cfg = form.categoria ? FIELD_CONFIG[form.categoria] : FIELD_CONFIG.otro;

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold">Datos de contacto</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Necesitamos estos datos para comunicarnos contigo
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="nombre_negocio">Nombre del negocio *</Label>
          <Input
            id="nombre_negocio"
            placeholder="Ej: Clínica Veterinaria Happy Paws"
            value={form.nombre_negocio}
            onChange={(e) => update('nombre_negocio', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="nombre_contacto">Nombre de contacto *</Label>
          <Input
            id="nombre_contacto"
            placeholder="Persona responsable"
            value={form.nombre_contacto}
            onChange={(e) => update('nombre_contacto', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@tunegocio.cl"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
            <Input
              id="telefono"
              placeholder="+56 9 1234 5678"
              value={form.telefono}
              onChange={(e) => update('telefono', e.target.value)}
            />
          </div>
        </div>

        {cfg.website && (
          <div>
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              placeholder="https://www.tunegocio.cl"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
            />
          </div>
        )}

        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            placeholder="@tunegocio"
            value={form.instagram}
            onChange={(e) => update('instagram', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function StepPerfil({
  form,
  update,
  catInfo,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  catInfo: CategoriaOption | undefined;
}) {
  const cfg = form.categoria ? FIELD_CONFIG[form.categoria] : FIELD_CONFIG.otro;

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold">
          Cuéntanos sobre tu {catInfo?.title?.toLowerCase() || 'negocio'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Esta información nos ayuda a conectarte con los dueños de mascotas correctos
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="descripcion">
            Descripción de tu negocio *{' '}
            <span className="text-xs text-muted-foreground">(mín. 20 caracteres)</span>
          </Label>
          <Textarea
            id="descripcion"
            placeholder="Cuéntanos qué haces, cuánto tiempo llevas, qué te diferencia..."
            className="min-h-[100px]"
            value={form.descripcion}
            onChange={(e) => update('descripcion', e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {form.descripcion.length} / 20 mín.
          </p>
        </div>

        {(cfg.direccion || cfg.comuna || cfg.ciudad) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cfg.direccion && (
              <div className="sm:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Av. Providencia 1234, Local 5"
                  value={form.direccion}
                  onChange={(e) => update('direccion', e.target.value)}
                />
              </div>
            )}
            {cfg.comuna && (
              <div>
                <Label htmlFor="comuna">Comuna</Label>
                <Select value={form.comuna} onValueChange={(v) => update('comuna', v)}>
                  <SelectTrigger id="comuna">
                    <SelectValue placeholder="Selecciona comuna" />
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
            )}
            {cfg.ciudad && (
              <div>
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  placeholder="Santiago"
                  value={form.ciudad}
                  onChange={(e) => update('ciudad', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {cfg.servicios && (
          <div>
            <Label htmlFor="servicios">Servicios que ofreces</Label>
            <Input
              id="servicios"
              placeholder="Separados por coma: baño, corte, deslanado..."
              value={form.servicios_ofrecidos}
              onChange={(e) => update('servicios_ofrecidos', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Separa cada servicio con una coma</p>
          </div>
        )}

        {cfg.horario && (
          <div>
            <Label htmlFor="horario">Horario de atención</Label>
            <Input
              id="horario"
              placeholder="Lun-Vie 9:00-18:00, Sáb 10:00-14:00"
              value={form.horario}
              onChange={(e) => update('horario', e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StepListo({ categoria }: { categoria: Categoria | null }) {
  const catInfo = CATEGORIAS.find((c) => c.value === categoria);
  const Icon = catInfo?.icon || CheckCircle2;

  return (
    <div className="text-center py-6 space-y-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
        <Icon className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-green-800">¡Solicitud enviada!</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Recibimos tu solicitud como <strong>{catInfo?.title || 'partner'}</strong>. Nuestro equipo
        la revisará y te contactaremos a la brevedad para coordinar tu ingreso al directorio de Paw
        Friend.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link to="/">
          <Button variant="outline">Volver al inicio</Button>
        </Link>
        <Link to="/veterinarios">
          <Button className="bg-brand-600 hover:bg-brand-700">Ver directorio</Button>
        </Link>
      </div>
    </div>
  );
}
