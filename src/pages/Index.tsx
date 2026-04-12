import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { PublicHeader } from '@/components/PublicHeader';
import { LegalFooter } from '@/components/LegalFooter';
import HeroV2 from '@/components/HeroV2';
import LogosBand from '@/components/LogosBand';
import MedicalPDFShowcase from '@/components/MedicalPDFShowcase';
import Testimonials from '@/components/Testimonials';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Stethoscope,
  Bell,
  ArrowRight,
  PawPrint,
  Calendar,
  Sparkles,
  Heart,
  MapPin,
  Star,
  BadgeCheck,
  Users,
  TrendingUp,
} from '@/lib/icons';

// ──────────────────────────────────────────────────────────────
// Datos de contenido (blueprint §4)
// ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    title: 'Crea el perfil de tu mascota',
    description: 'Foto, raza, edad y datos clínicos básicos en menos de 2 minutos.',
    icon: PawPrint,
    accent: 'from-amber-400 to-rose-400',
  },
  {
    n: '02',
    title: 'Encuentra tu veterinario cerca',
    description: 'Filtra por comuna, especialidad y reseñas verificadas. Sin intermediarios.',
    icon: MapPin,
    accent: 'from-purple-400 to-primary',
  },
  {
    n: '03',
    title: 'Lleva la ficha clínica siempre contigo',
    description: 'Vacunas, recordatorios y documentos en un solo PDF compartible.',
    icon: Calendar,
    accent: 'from-emerald-400 to-sky-500',
  },
];

const STATS = [
  { n: '80%', label: 'sin salud al día', desc: 'de dueños chilenos' },
  { n: '55%', label: 'no actualiza vacunas', desc: 'ni lleva controles' },
  { n: '27%', label: 'tiene microchip', desc: 'el resto, en riesgo' },
];

const FAQ = [
  {
    q: '¿Cuánto cuesta usar Paw Friend?',
    a: 'Es gratis para dueños con hasta 2 mascotas. Si tienes más o quieres funciones Premium (como compartir la ficha clínica por link), Premium parte desde $3.990 al mes.',
  },
  {
    q: '¿Cómo encuentro un veterinario?',
    a: 'Entra al directorio público, filtra por comuna y especialidad, y revisa reseñas verificadas de otros dueños antes de reservar.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Tu información médica está protegida y sólo tú decides con qué veterinario compartirla. Cumplimos con la normativa de protección de datos en Chile.',
  },
  {
    q: 'Soy veterinario, ¿cómo me sumo?',
    a: "Tenemos planes para clínicas y profesionales independientes. Ingresa a 'Para veterinarios' para ver los planes y crear tu perfil.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Si el usuario ya esta logueado, la landing publica no tiene sentido.
  useEffect(() => {
    if (!authLoading && user) {
      navigate(LINKS.home(), { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handlePrimary = () => navigate(user ? LINKS.home() : LINKS.auth());

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Paw Friend — La salud de tu mascota en un lugar</title>
        <meta
          name="description"
          content="Ficha clinica digital, directorio de veterinarios verificados y recordatorios automaticos para tu mascota. Gratis en Chile."
        />
        <link rel="canonical" href="https://pawfriend.cl/" />
      </Helmet>
      <PublicHeader />

      {/* 1 · Hero "Ficha viva" */}
      <HeroV2 />

      {/* 2 · Banda de logos clínicas */}
      <LogosBand />

      {/* 3 · Demo en 3 pasos — tarjetas mockup zig-zag */}
      <section
        id="como-funciona"
        aria-labelledby="como-funciona-title"
        className="relative px-4 py-20 md:py-28"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Así de fácil
            </span>
            <h2
              id="como-funciona-title"
              className="mt-4 text-3xl font-black leading-[1.05] tracking-tight md:text-5xl"
            >
              Empieza en 3 pasos.
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Sin instalar nada. Funciona en tu teléfono y en tu computador.
            </p>
          </div>

          <div className="space-y-16 md:space-y-24">
            {STEPS.map(({ n, title, description, icon: Icon, accent }, i) => {
              const reverse = i % 2 === 1;
              return (
                <div
                  key={n}
                  className={`flex flex-col gap-8 md:flex-row md:items-center md:gap-16 ${
                    reverse ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Visual mockup */}
                  <div className="relative flex-1">
                    <div className="relative mx-auto max-w-sm rounded-3xl border border-neutral-200/70 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-[0_30px_60px_-25px_rgba(251,146,60,0.2)] transition-transform duration-300 hover:scale-[1.02] md:p-8">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Paso {n}
                      </p>
                      <p className="mt-2 text-xl font-bold text-foreground">{title}</p>
                      {/* Mini-layout fake app */}
                      <div className="mt-5 space-y-2">
                        <div className="h-2 w-3/4 rounded-full bg-neutral-200" />
                        <div className="h-2 w-5/6 rounded-full bg-neutral-200" />
                        <div className="h-2 w-2/3 rounded-full bg-neutral-200" />
                      </div>
                      <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3">
                        <BadgeCheck className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-700">
                          Listo en segundos
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Copy */}
                  <div className="flex-1">
                    <span className="text-6xl font-black leading-none text-primary/15 md:text-7xl">
                      {n}
                    </span>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h3>
                    <p className="mt-3 max-w-md text-base text-muted-foreground md:text-lg">
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 · Ficha clinica PDF (joya de la corona) */}
      <MedicalPDFShowcase />

      {/* 5 · Directorio de veterinarios verificados */}
      <section className="relative overflow-hidden px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-50/60 via-background to-amber-50/40" />
        <div className="container relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <MapPin className="h-3.5 w-3.5" />
                Directorio público
              </span>
              <h2 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
                Encuentra al veterinario ideal en{' '}
                <span className="bg-warm-gradient bg-clip-text text-transparent">tu comuna</span>.
              </h2>
              <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
                Filtra por especialidad y cercanía. Lee reseñas verificadas y reserva sin
                intermediarios.
              </p>
              <Button
                size="lg"
                onClick={() => navigate(LINKS.vets())}
                variant="outline"
                className="mt-7 h-14 rounded-2xl border-2 border-primary/30 px-7 text-base font-semibold text-primary hover:bg-primary/5"
              >
                Explorar directorio
                <ArrowRight className="ml-1.5 h-5 w-5" />
              </Button>
            </div>

            {/* Mockup mapa estilizado + tarjetas */}
            <div className="relative">
              <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-purple-100 via-purple-50 to-amber-50 p-6 shadow-[0_30px_60px_-25px_rgba(251,146,60,0.25)] ring-1 ring-black/5">
                {/* Grid simulando calles */}
                <div className="absolute inset-0 opacity-30">
                  <div className="grid h-full grid-cols-6 grid-rows-6">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className="border border-purple-300/30" />
                    ))}
                  </div>
                </div>
                {/* Pines */}
                {[
                  { top: '18%', left: '28%', active: true },
                  { top: '52%', left: '62%' },
                  { top: '72%', left: '22%' },
                  { top: '30%', left: '70%' },
                ].map((p, i) => (
                  <div
                    key={i}
                    className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg ${
                      p.active
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-white text-primary ring-1 ring-black/5'
                    }`}
                    style={{ top: p.top, left: p.left }}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                ))}

                {/* Card flotante vet */}
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        Dra. Paulina Muñoz
                      </p>
                      <p className="truncate text-xs text-muted-foreground">Providencia · 1,2 km</p>
                    </div>
                    <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">4.9</span>
                      <span className="text-xs text-muted-foreground">· 128 reseñas</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Disponible hoy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 · Stats del mercado chileno — compactado en 1 banda */}
      <section className="px-4 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-amber-50 to-rose-50 p-10 ring-1 ring-primary/10 md:p-16">
            <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />

            <div className="relative text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                ¿Por qué importa?
              </span>
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
                La salud de las mascotas en Chile.
              </h2>
            </div>

            <div className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {STATS.map(({ n, label, desc }) => (
                <div key={label} className="text-center">
                  <div className="bg-warm-gradient bg-clip-text text-6xl font-black leading-none tracking-tighter text-transparent md:text-7xl">
                    {n}
                  </div>
                  <p className="mt-3 text-base font-bold text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            <p className="relative mt-10 text-center text-xs text-muted-foreground">
              Fuentes: Vetivery, SUBDERE/UC · Mercado chileno 2024
            </p>
          </div>
        </div>
      </section>

      {/* 7 · Testimonios */}
      <Testimonials />

      {/* 8 · Para veterinarios — banda B2B dedicada */}
      <section className="relative overflow-hidden px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />

        <div className="container relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div className="text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-white/20 backdrop-blur">
                <Stethoscope className="h-3.5 w-3.5" />
                Para veterinarios
              </span>
              <h2 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
                ¿Tienes una clínica{' '}
                <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                  veterinaria
                </span>
                ?
              </h2>
              <p className="mt-4 max-w-lg text-base text-white/70 md:text-lg">
                Aparece en el directorio más usado por dueños en Chile, recibe más pacientes y
                gestiona fichas compartidas sin planillas sueltas.
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  { icon: Users, text: 'Más pacientes desde tu comuna' },
                  { icon: Calendar, text: 'Agenda y Google Calendar sincronizados' },
                  { icon: TrendingUp, text: 'Reportes semanales automáticos' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-base text-white/90">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-300 ring-1 ring-white/20">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => navigate(LINKS.paraVeterinarios())}
                  className="h-14 rounded-2xl bg-amber-400 px-7 text-base font-semibold text-neutral-950 hover:bg-amber-300"
                >
                  Ver planes para vets
                  <ArrowRight className="ml-1.5 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => navigate(LINKS.registroVeterinario())}
                  className="h-14 rounded-2xl px-5 text-base font-semibold text-white hover:bg-white/10"
                >
                  Registrar mi clínica
                </Button>
              </div>
            </div>

            {/* Mini dashboard mockup */}
            <div className="relative">
              <div className="relative mx-auto max-w-md rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                      Panel vet
                    </p>
                    <p className="mt-1 text-base font-bold text-white">Dra. Paulina Muñoz</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-300 ring-1 ring-white/20">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { n: '128', l: 'Reseñas' },
                    { n: '42', l: 'Pacientes' },
                    { n: '4.9', l: 'Rating' },
                  ].map(({ n, l }) => (
                    <div
                      key={l}
                      className="rounded-xl bg-white/5 p-3 text-center ring-1 ring-white/10"
                    >
                      <p className="text-xl font-black text-white">{n}</p>
                      <p className="text-[9px] uppercase tracking-wider text-white/60">{l}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Próximas reservas
                  </p>
                  {[
                    { h: '09:30', m: 'Firulais', t: 'Control anual' },
                    { h: '10:15', m: 'Tomás', t: 'Vacuna séxtuple' },
                    { h: '11:00', m: 'Luna', t: 'Consulta general' },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">
                          {r.m} · {r.t}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-white/60">{r.h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9 · FAQ */}
      <section className="px-4 py-20 md:py-24">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-10 text-center md:mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Bell className="h-3.5 w-3.5" />
              Preguntas frecuentes
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">¿Alguna duda?</h2>
          </div>

          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="flex w-full flex-col gap-3"
          >
            {FAQ.map(({ q, a }, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="rounded-2xl border-0 bg-neutral-50 px-5 data-[state=open]:bg-neutral-100/70"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline md:text-lg">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 10 · CTA final */}
      <section className="px-4 pb-20 pt-8">
        <div className="container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-purple-600 to-rose-500 px-6 py-16 text-center shadow-[0_40px_80px_-25px_rgba(168,85,247,0.5)] md:px-12 md:py-20">
            <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />

            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-black leading-[1.05] tracking-tight text-white md:text-5xl">
                Empieza a cuidar a tu mascota hoy.
              </h2>
              <Button
                size="lg"
                onClick={handlePrimary}
                className="mt-8 h-14 rounded-2xl bg-white px-8 text-base font-bold text-primary shadow-xl hover:scale-[1.02] hover:bg-white/95"
              >
                Crear cuenta gratis
                <ArrowRight className="ml-1.5 h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm text-white/80">Sin tarjeta · Cancelas cuando quieras</p>
            </div>
          </div>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
};

export default Index;
