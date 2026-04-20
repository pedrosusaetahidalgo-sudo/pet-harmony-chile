import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Star,
  Globe,
  Calendar,
  Shield,
  Check,
  X,
  ChevronRight,
  FileText,
  BadgeCheck,
  Users,
  ClipboardList,
  UserPlus,
  Search,
  CheckCircle,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { setSeoTags } from '@/lib/vetDirectory';
import { PROVIDER_PLANS } from '@/lib/plans';
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicLayout';
import { FoundingVetBanner } from '@/components/landing/FoundingVetBanner';
import { FOUNDING_VET } from '@/lib/config/marketingConfig';
import { CategoryIcon } from '@/components/CategoryIcon';

// ──────────────────────────────────────────────────────────────
// Value pillars
// ──────────────────────────────────────────────────────────────

const pillars = [
  {
    icon: FileText,
    title: 'Ficha clínica compartida',
    desc: 'Tus pacientes llegan con ficha médica digital completa. Sin papeles, sin repetir datos.',
  },
  {
    icon: Calendar,
    title: 'Reservas y agenda',
    desc: 'Recibe reservas online. Configura tu disponibilidad y deja que los dueños agenden.',
  },
  {
    icon: BadgeCheck,
    title: 'Perfil verificado',
    desc: 'Aparece en el directorio público con verificación Colmevet. Los dueños te encuentran por comuna y especialidad.',
  },
];

// ──────────────────────────────────────────────────────────────
// How it works steps
// ──────────────────────────────────────────────────────────────

const steps = [
  {
    n: '1',
    icon: UserPlus,
    title: 'Regístrate en 5 minutos',
    desc: 'Crea tu perfil básico con tu información profesional.',
  },
  {
    n: '2',
    icon: ClipboardList,
    title: 'Completa tu perfil',
    desc: 'Agrega especialidades, horarios de atención y precios referenciales.',
  },
  {
    n: '3',
    icon: Users,
    title: 'Recibe pacientes',
    desc: 'Apareces en el directorio y los dueños reservan directo contigo.',
  },
];

// ──────────────────────────────────────────────────────────────
// FAQ — se construye con valores de marketingConfig para evitar
// duplicar precios/deadlines del Founding Vet Offer en strings.
// ──────────────────────────────────────────────────────────────

function buildFaq() {
  const deadlineLabel = FOUNDING_VET.deadline.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
  });
  const discountPct = Math.round(100 - (FOUNDING_VET.priceClp / FOUNDING_VET.publicPriceClp) * 100);
  const publicPrice = `$${FOUNDING_VET.publicPriceClp.toLocaleString('es-CL')}`;
  const foundingPrice = `$${FOUNDING_VET.priceClp.toLocaleString('es-CL')}`;

  return [
    {
      q: '¿Cuánto cuesta?',
      a: `Durante el lanzamiento todo es 100% gratis para todos los profesionales: sin limites de pacientes ni reservas. Cuando activemos Premium post-lanzamiento, el precio publico sera ${publicPrice}/mes. Los primeros ${FOUNDING_VET.spotsTotal} veterinarios que se registren antes del ${deadlineLabel} quedan locked a ${foundingPrice}/mes por vida (Founding Vet Offer · ${discountPct}% off lifetime) + badge Vet Pionero + onboarding 1-on-1 con el fundador.`,
    },
    {
      q: '¿Cómo se verifican las reseñas?',
      a: 'Cada reseña proviene de una reserva real hecha por la plataforma. Ningún paciente puede dejarte una reseña sin haberte contratado, y tampoco puedes dejarte reseñas a ti mismo.',
    },
    {
      q: '¿Qué pasa si ya tengo pacientes fuera de la plataforma?',
      a: 'Con el plan Premium o superior puedes enviar invitaciones a reseña: enlaces únicos que mandas a tus pacientes actuales por WhatsApp para que dejen una reseña en tu perfil.',
    },
    {
      q: '¿Cómo funciona la comisión?',
      a: 'Durante el lanzamiento no hay comisiones de ningun tipo. Cuando se activen los planes de pago, las comisiones dependeran del plan elegido. Si un paciente te paga directo (efectivo, transferencia), nunca hay comision.',
    },
    {
      q: '¿Puedo aparecer si no estoy en Santiago?',
      a: 'Sí, el directorio acepta veterinarios de todo Chile. Puedes configurar tu zona base y áreas de servicio manualmente.',
    },
    {
      q: '¿Cuánto tarda en estar mi perfil online?',
      a: 'Apenas completas tu perfil al 80% (foto, bio, especialidades, zona, precio) puedes activar la visibilidad pública. La verificación del N° Colmevet demora 24-48 horas hábiles.',
    },
    {
      q: '¿La ficha clínica reemplaza mi sistema actual?',
      a: 'Paw Friend complementa tu sistema. Los dueños traen su ficha digital con vacunas, alergias y peso actualizado, así puedes consultar el historial sin pedirles papeles.',
    },
  ];
}

const faq = buildFaq();

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────

export default function ParaVeterinarios() {
  const navigate = useNavigate();

  useEffect(() => {
    setSeoTags({
      title: 'Para Veterinarios | Paw Friend',
      description:
        'Gestiona tus pacientes, recibe reservas online y destaca en el directorio veterinario verificado de Chile. Ficha clínica digital compartida. Gratis para empezar.',
      canonical: 'https://pawfriend.cl/para-veterinarios',
    });
  }, []);

  // 4 tiers en 2 tracks (2026-04-19):
  // Individual: Básica (free) + Premium.
  // Clínica: Clínica Starter + Pro Max.
  const planBasica = PROVIDER_PLANS.provider_free;
  const planPremium = PROVIDER_PLANS.provider_premium;
  const planClinica = PROVIDER_PLANS.provider_clinic_starter;
  const planProMax = PROVIDER_PLANS.provider_pro_max;
  void planBasica;
  void planPremium;
  void planClinica;
  void planProMax;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 to-white">
      <PublicHeader />

      {/* ── HERO ── */}
      <section className="container mx-auto px-4 pt-10 pb-8 md:pt-16 md:pb-12 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
              Para veterinarios y clínicas
            </Badge>
            <CategoryIcon kind="vet" variant="full" className="h-24 w-auto -mb-2" />
            <h1 className="font-display font-semibold text-4xl md:text-6xl text-purple-900 leading-[1.05] tracking-tight">
              Gestiona tus pacientes y destaca en el directorio veterinario más grande de Chile
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ficha clínica digital, reservas online y perfil verificado. Gratis para empezar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 h-14 text-base font-bold shadow-xl"
                onClick={() => navigate('/registro-veterinario')}
              >
                <Stethoscope className="h-5 w-5 mr-2" />
                Registrarme gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-base"
                onClick={() => navigate('/veterinarios')}
              >
                <Search className="h-5 w-5 mr-2" />
                Ver directorio
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Sin tarjeta de crédito · Cancela cuando quieras
            </p>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=600&h=600&fit=crop"
              alt="Veterinario con mascota"
              loading="lazy"
              className="rounded-2xl shadow-2xl w-full object-cover aspect-square"
            />
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 max-w-[200px]">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xs font-medium">"Atención excelente, súper recomendado."</p>
              <p className="text-[10px] text-muted-foreground mt-1">— Camila S., paciente real</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDING VET OFFER (playbook §9.4) ── */}
      <FoundingVetBanner />

      {/* ── VALUE PILLARS ── */}
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-3">
            Recibe pacientes, gestiona fichas, destaca tu perfil
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Una sola plataforma para tu consulta veterinaria. Sin instalar nada.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="border-purple-200 hover:shadow-lg transition">
                <CardContent className="pt-8 pb-6 space-y-4 text-center">
                  <div className="rounded-full bg-purple-100 w-14 h-14 flex items-center justify-center mx-auto">
                    <Icon className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-xl">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-purple-50/60 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-3">Cómo funciona</h2>
            <p className="text-muted-foreground">Tres pasos para empezar a recibir pacientes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="text-center space-y-4">
                  <div className="relative mx-auto w-16 h-16">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-purple-700 font-bold text-sm flex items-center justify-center shadow">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-purple-900">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING — 100% gratis durante lanzamiento ── */}
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <div className="text-center mb-8">
          <Badge className="bg-green-100 text-green-800 mb-4 text-sm px-4 py-1">
            100% gratis durante el lanzamiento
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-3">
            Todo incluido, sin costo
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Durante la etapa de lanzamiento, todas las funcionalidades estan disponibles de forma
            gratuita para todos los profesionales. Sin limites, sin comisiones, sin letra chica.
          </p>
        </div>

        <Card className="p-8 border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/40">
          <div className="text-center mb-6">
            <p className="text-4xl font-bold text-purple-700">$0</p>
            <p className="text-muted-foreground">
              Sin costo mientras mejoramos la plataforma contigo
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              'Pacientes ilimitados',
              'Reservas ilimitadas',
              'Perfil publico verificado',
              'Ficha clinica compartida',
              'Transcripcion de consultas',
              'Estadisticas de tu practica',
              '0% comision sobre reservas',
              'Soporte directo del equipo',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" onClick={() => navigate('/registro-veterinario')}>
              Registrarme gratis
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Cuando lancemos planes de pago, los primeros registrados tendran beneficios
              especiales.
            </p>
          </div>
        </Card>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-purple-50/60 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-3">
            Únete a los veterinarios que ya confían en Paw Friend
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Profesionales de todo Chile están usando la plataforma para gestionar sus pacientes y
            crecer.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                quote: 'Los dueños llegan con la ficha digital. Ahorro tiempo en cada consulta.',
                name: 'Dra. Sofía R.',
                role: 'Veterinaria, Providencia',
              },
              {
                quote:
                  'Las reservas online me organizaron la agenda. Ya no pierdo tiempo en WhatsApp.',
                name: 'Dr. Tomás M.',
                role: 'Veterinario a domicilio, Ñuñoa',
              },
              {
                quote:
                  'El perfil verificado genera confianza. Mis pacientes nuevos vienen del directorio.',
                name: 'Clínica PetSalud',
                role: 'Las Condes',
              },
            ].map((t) => (
              <Card key={t.name} className="border-purple-200">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-3">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="space-y-4">
          {faq.map((item) => (
            <Card key={item.q}>
              <CardContent className="pt-5">
                <h3 className="font-semibold mb-2 flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>{item.q}</span>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-10 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Empieza gratis hoy</h2>
          <p className="text-lg text-white/95 mb-6 max-w-xl mx-auto">
            Toma 5 minutos. Sin compromiso, sin tarjeta de crédito. Crea tu perfil profesional y
            empieza a recibir pacientes.
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-white/90 h-14 text-lg font-bold shadow-xl"
            onClick={() => navigate('/registro-veterinario')}
          >
            <Stethoscope className="h-5 w-5 mr-2" />
            Registrarme gratis
          </Button>
          <p className="text-sm text-white/95 mt-4">
            Tus precios aparecen en el{' '}
            <Link to="/precios-veterinarios" className="underline font-semibold">
              comparador público de Paw Friend
            </Link>
            , ayudándote a captar clientes que buscan transparencia.
          </p>
          <p className="text-xs text-white/80 mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link to="/auth" className="underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </section>

      {/* ── CTA para no-vets ── */}
      <section className="py-8 bg-purple-50">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h3 className="text-lg font-bold text-purple-900 mb-2">
            ¿No eres veterinario? También puedes unirte
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Peluquerías, paseadores, tiendas, cuidadores, entrenadores y más — registra tu negocio
            en el directorio de Paw Friend.
          </p>
          <Link to="/registro-partner">
            <Button
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              Registrar otro tipo de negocio
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PlanCard (internal)
// ──────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  highlight,
  ctaLabel,
  onCta,
  features,
  missing,
}: {
  plan: { id: string; name: string; monthlyPrice: number; commissionRate: number; segment: string };
  highlight: boolean;
  ctaLabel: string;
  onCta: () => void;
  features: string[];
  missing: string[];
}) {
  return (
    <Card
      className={`relative ${
        highlight ? 'border-purple-500 border-2 shadow-xl scale-105' : 'border-purple-200'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-purple-500 text-white">Más popular</Badge>
        </div>
      )}
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="font-bold text-xl">{plan.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">
            {plan.segment === 'clinic' ? 'Para clínicas' : 'Para profesionales independientes'}
          </p>
        </div>
        <div>
          <span className="text-3xl font-bold text-purple-700">
            ${plan.monthlyPrice.toLocaleString('es-CL')}
          </span>
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        <ul className="space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
          {missing.map((m) => (
            <li key={m} className="flex items-start gap-2 text-muted-foreground">
              <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full" variant={highlight ? 'default' : 'outline'} onClick={onCta}>
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
