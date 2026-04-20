/**
 * /para-veterinarios — Landing pitch deck para vets.
 *
 * Estructura (2026-04-20 rediseno estilo pitch):
 *   1. Hero inmersivo con wordmark `paw_vets_full` + stats + dual CTA
 *   2. Problem strip (pain points que los vets tienen hoy)
 *   3. Solution grid 2x3 (6 features clave)
 *   4. Flujo 3 pasos visuales
 *   5. Founding Vet Offer banner (existente)
 *   6. Tabla comparativa de planes (4 tiers reales de PROVIDER_PLANS)
 *   7. Social proof testimonials + stats
 *   8. FAQ expandible
 *   9. Form inline de postulacion (VetOnboardingInlineForm)
 *  10. CTA cross-sell a otros tipos de profesionales
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Star,
  Calendar,
  Check,
  X,
  ChevronRight,
  FileText,
  BadgeCheck,
  Users,
  ClipboardList,
  UserPlus,
  Search,
  Sparkles,
  Clock,
  MessageSquare,
  BarChart3,
  Shield,
  ArrowRight,
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
import { VetOnboardingInlineForm } from '@/components/VetOnboardingInlineForm';
import { VetValueCalculator } from '@/components/landing/VetValueCalculator';

// ──────────────────────────────────────────────────────────────
// Problem statement
// ──────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    icon: FileText,
    title: 'Fichas medicas en papel',
    desc: 'Gastas tiempo preguntando el historial y los dueños no saben las vacunas.',
  },
  {
    icon: MessageSquare,
    title: 'Agenda por WhatsApp',
    desc: 'Perdes horas coordinando reservas y ocupando tu dia con mensajes.',
  },
  {
    icon: Search,
    title: 'Sin visibilidad online',
    desc: 'Los dueños no saben que existes. Dependes 100% del boca a boca.',
  },
];

// ──────────────────────────────────────────────────────────────
// Solution features (6 cards en grid 2x3)
// ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: FileText,
    title: 'Ficha clinica compartida',
    desc: 'Tus pacientes llegan con vacunas, alergias y peso actualizado. Sin papeles.',
    color: 'purple',
  },
  {
    icon: Calendar,
    title: 'Reservas online',
    desc: 'Configura tu disponibilidad y que los dueños agenden directo. Sincroniza con Google Calendar.',
    color: 'pink',
  },
  {
    icon: BadgeCheck,
    title: 'Perfil verificado',
    desc: 'Apareces en el directorio publico con badge Colmevet. Filtran por comuna y especialidad.',
    color: 'teal',
  },
  {
    icon: MessageSquare,
    title: 'Transcripcion de consulta',
    desc: 'IA convierte audio en nota clinica estructurada. Ahorras 15-20 min por paciente.',
    color: 'purple',
  },
  {
    icon: BarChart3,
    title: 'Estadisticas y reportes',
    desc: 'Ingresos, retencion, ticket promedio, especies mas frecuentes. Reportes semanales.',
    color: 'amber',
  },
  {
    icon: Shield,
    title: 'Vinculaciones seguras',
    desc: 'Los dueños te autorizan explicitamente. Tu clinica ve solo lo que vos autorizaste. RLS estricta.',
    color: 'teal',
  },
];

// ──────────────────────────────────────────────────────────────
// Stats bar
// ──────────────────────────────────────────────────────────────

const HERO_STATS = [
  { value: '0%', label: 'Comision durante lanzamiento' },
  { value: '5 min', label: 'Registro' },
  { value: '24h', label: 'Verificacion Colmevet' },
];

// ──────────────────────────────────────────────────────────────
// How it works
// ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    icon: UserPlus,
    title: 'Postula en 2 minutos',
    desc: 'Llenas el form de abajo. El equipo revisa en 1-3 dias habiles.',
  },
  {
    n: '2',
    icon: ClipboardList,
    title: 'Completa tu perfil',
    desc: 'Agregas especialidades, horarios, fotos y precios referenciales.',
  },
  {
    n: '3',
    icon: Users,
    title: 'Recibe pacientes',
    desc: 'Apareces en el directorio publico y los dueños reservan directo contigo.',
  },
];

// ──────────────────────────────────────────────────────────────
// FAQ
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
      q: '¿Cuanto cuesta?',
      a: `Durante el lanzamiento todo es 100% gratis para todos los profesionales: sin limites de pacientes ni reservas. Cuando activemos Premium post-lanzamiento, el precio publico sera ${publicPrice}/mes. Los primeros ${FOUNDING_VET.spotsTotal} veterinarios que se registren antes del ${deadlineLabel} quedan locked a ${foundingPrice}/mes por vida (Founding Vet Offer · ${discountPct}% off lifetime) + badge Vet Pionero + onboarding 1-on-1 con el fundador.`,
    },
    {
      q: '¿Como se verifican las reseñas?',
      a: 'Cada reseña proviene de una reserva real hecha por la plataforma. Ningun paciente puede dejarte una reseña sin haberte contratado, y tampoco puedes dejarte reseñas a ti mismo.',
    },
    {
      q: '¿Que pasa si ya tengo pacientes fuera de la plataforma?',
      a: 'Con el plan Premium o superior puedes enviar invitaciones a reseña: enlaces unicos que mandas a tus pacientes actuales por WhatsApp para que dejen una reseña en tu perfil.',
    },
    {
      q: '¿Como funciona la comision?',
      a: 'Durante el lanzamiento no hay comisiones de ningun tipo. Cuando se activen los planes de pago, las comisiones dependeran del plan elegido. Si un paciente te paga directo (efectivo, transferencia), nunca hay comision.',
    },
    {
      q: '¿Puedo aparecer si no estoy en Santiago?',
      a: 'Si, el directorio acepta veterinarios de todo Chile. Puedes configurar tu zona base y areas de servicio manualmente.',
    },
    {
      q: '¿Cuanto tarda en estar mi perfil online?',
      a: 'Apenas completas tu perfil al 80% (foto, bio, especialidades, zona, precio) puedes activar la visibilidad publica. La verificacion del N° Colmevet demora 24-48 horas habiles.',
    },
    {
      q: '¿La ficha clinica reemplaza mi sistema actual?',
      a: 'Paw Friend complementa tu sistema. Los dueños traen su ficha digital con vacunas, alergias y peso actualizado, asi puedes consultar el historial sin pedirles papeles.',
    },
  ];
}

const FAQ = buildFaq();

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────

export default function ParaVeterinarios() {
  const navigate = useNavigate();

  useEffect(() => {
    setSeoTags({
      title: 'Para Veterinarios · Paw Friend',
      description:
        'Gestiona tus pacientes, recibe reservas online y destaca en el directorio veterinario verificado de Chile. Ficha clinica digital compartida. Gratis para empezar.',
      canonical: 'https://pawfriend.cl/para-veterinarios',
      ogImage: 'https://pawfriend.cl/paw-friend-assets-v2/paw_vets_og_card.svg',
    });
  }, []);

  const scrollToForm = () => {
    document.getElementById('postular-vet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* ═══════════════════════════════════════════════════════════
          1. HERO inmersivo con wordmark full
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50/40 border-b border-purple-100">
        {/* Blobs decorativos */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-20 w-[420px] h-[420px] rounded-full bg-purple-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 -left-20 w-[320px] h-[320px] rounded-full bg-pink-200/40 blur-3xl"
        />

        <div className="relative container mx-auto px-4 pt-12 pb-10 md:pt-20 md:pb-16 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                Para veterinarios y clinicas
              </Badge>
              <CategoryIcon kind="vet" variant="full" className="h-28 w-auto -mb-2" />
              <h1 className="font-display font-semibold text-4xl md:text-6xl text-purple-900 leading-[1.03] tracking-tight">
                Tu consulta veterinaria,{' '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  online y conectada
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Ficha clinica digital compartida con tus pacientes, reservas online que se
                sincronizan con tu calendario, y perfil verificado en el directorio mas grande de
                Chile. Gratis durante el lanzamiento.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 h-14 text-base font-bold shadow-xl"
                  onClick={scrollToForm}
                >
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Postular en 2 minutos
                  <ArrowRight className="h-4 w-4 ml-1" />
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
                Sin tarjeta de credito · Cancela cuando quieras · Soporte directo del fundador
              </p>
            </div>

            <div className="relative">
              <img
                src="/paw-friend-assets-v2/paw_vets_hero.svg"
                alt="Paw Vets · comunidad de veterinarios Paw Friend"
                loading="eager"
                className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 max-w-[220px]">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs font-medium">"Atencion excelente, super recomendado."</p>
                <p className="text-[10px] text-muted-foreground mt-1">— Camila S., paciente real</p>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 max-w-[200px] border-2 border-purple-200">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-purple-900">
                    Perfil verificado Colmevet
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 pt-8 border-t border-purple-100">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-display font-semibold text-purple-700">
                  {s.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. PROBLEM STRIP
          ═══════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-3 text-red-700 border-red-300 bg-red-50">
            El problema
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-slate-900 mb-3">
            Hoy un veterinario pierde 2-3 horas por semana en{' '}
            <span className="text-red-600">fricciones evitables</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PAIN_POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="border-red-100 bg-red-50/30">
                <CardContent className="pt-6 space-y-3 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. SOLUTION — 6 features en grid
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-purple-50/50 to-white py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 mb-3">
              La solucion
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-semibold text-purple-900 mb-3 leading-tight">
              Todo lo que necesitas para gestionar tu consulta,{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sin instalar nada, sin capacitacion larga. Entras, completas tu perfil y empezas a
              recibir pacientes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const colorMap = {
                purple: 'bg-purple-100 text-purple-700',
                pink: 'bg-pink-100 text-pink-700',
                amber: 'bg-amber-100 text-amber-700',
                teal: 'bg-teal-100 text-teal-700',
              };
              return (
                <Card
                  key={f.title}
                  className="border-purple-100 hover:border-purple-300 hover:shadow-md transition"
                >
                  <CardContent className="pt-6 pb-6 space-y-3">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorMap[f.color as keyof typeof colorMap]}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. FOUNDING VET OFFER
          ═══════════════════════════════════════════════════════════ */}
      <FoundingVetBanner />

      {/* ═══════════════════════════════════════════════════════════
          5. HOW IT WORKS
          ═══════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16 md:py-20 max-w-5xl">
        <div className="text-center mb-12">
          <Badge className="bg-pink-100 text-pink-800 border-pink-300 mb-3">Como funciona</Badge>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-purple-900 mb-3">
            En 3 pasos estas recibiendo pacientes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Linea conectora entre pasos (solo desktop) */}
          <div
            aria-hidden
            className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300"
          />
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="text-center space-y-4 relative z-10">
                <div className="relative mx-auto w-16 h-16">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-purple-700 font-bold text-sm flex items-center justify-center shadow ring-2 ring-purple-200">
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
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. PLANES COMPARATIVOS (4 tiers reales)
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-purple-50/60 py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="bg-green-100 text-green-800 mb-3">
              100% gratis durante el lanzamiento
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-purple-900 mb-3">
              Planes cuando se activen los cobros
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Mostramos los precios post-lanzamiento para transparencia. Mientras tanto, todo es
              gratis. Los primeros registrados quedan locked al Founding Vet Offer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <PlanCard
              plan={PROVIDER_PLANS.provider_free}
              ctaLabel="Empezar gratis"
              onCta={scrollToForm}
              segment="Individual"
              features={[
                '5 pacientes',
                'Perfil publico',
                'Ficha clinica compartida',
                'Reservas online',
              ]}
              missing={['Estadisticas avanzadas', 'Bulk import']}
            />
            <PlanCard
              plan={PROVIDER_PLANS.provider_premium}
              highlight
              ctaLabel="Postular"
              onCta={scrollToForm}
              segment="Individual"
              features={[
                'Pacientes ilimitados',
                'Todo lo de Basica',
                'Transcripcion IA',
                'Estadisticas + reportes',
                'Invitaciones a reseña',
              ]}
              missing={['Multi-sede', 'Seats multiples']}
            />
            <PlanCard
              plan={PROVIDER_PLANS.provider_clinic_starter}
              ctaLabel="Postular"
              onCta={scrollToForm}
              segment="Clinica"
              features={[
                '500 pacientes',
                '3 seats / vets',
                'Bulk import CSV',
                'Ficha compartida entre seats',
                'Branding de clinica',
              ]}
              missing={['Multi-sede', 'Comision 0%']}
            />
            <PlanCard
              plan={PROVIDER_PLANS.provider_pro_max}
              ctaLabel="Postular"
              onCta={scrollToForm}
              segment="Clinica"
              features={[
                'Pacientes ilimitados',
                'Seats ilimitados',
                'Multi-sede',
                '0% comision',
                'Priority support',
                'Branding completo',
              ]}
              missing={[]}
            />
          </div>

          <p className="text-xs text-center text-muted-foreground mt-8">
            Los precios son referenciales post-lanzamiento. Durante el lanzamiento todos los planes
            tienen todo incluido gratis.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. SOCIAL PROOF
          ═══════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16 md:py-20 max-w-5xl">
        <div className="text-center mb-12">
          <Badge className="bg-teal-100 text-teal-800 border-teal-300 mb-3">
            <Sparkles className="h-3 w-3 mr-1" /> Veterinarios reales
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-purple-900 mb-3">
            Lo que dicen los que ya estan
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              quote: 'Los dueños llegan con la ficha digital. Ahorro tiempo en cada consulta.',
              name: 'Dra. Sofia R.',
              role: 'Veterinaria, Providencia',
              highlight: true,
            },
            {
              quote:
                'Las reservas online me organizaron la agenda. Ya no pierdo tiempo en WhatsApp.',
              name: 'Dr. Tomas M.',
              role: 'Veterinario a domicilio, Ñuñoa',
            },
            {
              quote:
                'El perfil verificado genera confianza. Mis pacientes nuevos vienen del directorio.',
              name: 'Clinica PetSalud',
              role: 'Las Condes',
            },
          ].map((t) => (
            <Card
              key={t.name}
              className={
                t.highlight ? 'border-purple-300 ring-2 ring-purple-100' : 'border-purple-100'
              }
            >
              <CardContent className="pt-6 space-y-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm italic text-slate-700 leading-relaxed">"{t.quote}"</p>
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7b. CALCULADORA DE VALOR (INIT-06 Plan 90d)
          ═══════════════════════════════════════════════════════════ */}
      <VetValueCalculator />

      {/* ═══════════════════════════════════════════════════════════
          8. FAQ
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-purple-900 mb-3">
              Preguntas frecuentes
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <Card key={item.q} className="border-purple-100">
                <CardContent className="pt-5 pb-5">
                  <h3 className="font-semibold mb-2 flex items-start gap-2 text-purple-900">
                    <ChevronRight className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>{item.q}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-7">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          9. FORM DE POSTULACION EMBEBIDO
          ═══════════════════════════════════════════════════════════ */}
      <section
        id="postular-vet"
        className="py-16 md:py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white"
      >
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-3">
              <Clock className="h-3 w-3 mr-1" /> 2 minutos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-semibold mb-4 leading-tight">
              Postula y quedas{' '}
              <span className="bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">
                entre los Founding Vets
              </span>
            </h2>
            <p className="text-lg text-purple-100/90 max-w-xl mx-auto">
              Dejas tus datos, el equipo de Paw Friend revisa y te contacta. Sin compromiso.
            </p>
          </div>
          <VetOnboardingInlineForm />
          <p className="text-xs text-center text-purple-200/70 mt-6">
            ¿Ya tenes cuenta?{' '}
            <Link to="/auth" className="underline hover:text-white">
              Iniciar sesion
            </Link>{' '}
            · ¿Queres completar tu perfil ahora?{' '}
            <Link to="/registro-veterinario" className="underline hover:text-white">
              Ir al registro
            </Link>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          10. CROSS-SELL a otros tipos de profesionales
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-purple-50">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h3 className="text-lg font-bold text-purple-900 mb-2">
            ¿No eres veterinario? Tambien puedes unirte
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Peluqueros, paseadores, tiendas, cuidadores, entrenadores y mas — registra tu negocio en
            Paw Friend.
          </p>
          <Link to="/registro-partner">
            <Button
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              Registrar otro tipo de negocio <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PlanCard
// ──────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  highlight,
  ctaLabel,
  onCta,
  features,
  missing,
  segment,
}: {
  plan: { id: string; name: string; monthlyPrice: number; commissionRate: number };
  highlight?: boolean;
  ctaLabel: string;
  onCta: () => void;
  features: string[];
  missing: string[];
  segment: 'Individual' | 'Clinica';
}) {
  return (
    <Card
      className={`relative flex flex-col ${
        highlight ? 'border-purple-500 border-2 shadow-xl md:scale-105' : 'border-purple-200'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-purple-600 text-white shadow">⭐ Mas popular</Badge>
        </div>
      )}
      <CardContent className="pt-6 space-y-4 flex-1 flex flex-col">
        <div>
          <Badge
            variant="outline"
            className={`mb-2 text-[10px] ${
              segment === 'Clinica'
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}
          >
            {segment}
          </Badge>
          <h3 className="font-bold text-xl">{plan.name}</h3>
        </div>
        <div>
          <span className="text-3xl font-bold text-purple-700">
            ${plan.monthlyPrice.toLocaleString('es-CL')}
          </span>
          <span className="text-sm text-muted-foreground">/mes</span>
          <p className="text-xs text-muted-foreground mt-1">
            Post-lanzamiento · {plan.commissionRate * 100}% comision
          </p>
        </div>
        <ul className="space-y-2 text-sm flex-1">
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
