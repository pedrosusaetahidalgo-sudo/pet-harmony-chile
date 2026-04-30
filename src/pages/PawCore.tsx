import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PawPrint,
  Heart,
  Target,
  Sparkles,
  Home,
  Building2,
  Users,
  ShieldCheck,
  Coins,
  Trophy,
  Megaphone,
  Unlock,
  Globe,
  Sprout,
  Bot,
  Smartphone,
  Stethoscope,
  Dog,
  ShoppingBag,
} from '@/lib/icons';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

export default function PawCore() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Paw Core — Nuestra identidad | Paw Friend';
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Paw Core — Nuestra identidad | Paw Friend</title>
        <meta
          name="description"
          content="La misión, visión y valores de Paw Friend. Un proyecto home-made hecho en Chile para dueños y veterinarios peludos de Latinoamérica."
        />
      </Helmet>
      <PageHeader title="Paw Core" onBack={() => navigate(-1)} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(260 80% 92% / 0.6), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(340 90% 92% / 0.4), transparent 70%)',
        }}
      />

      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
        {/* Hero — Brand 2.0: Fredoka display + gradient purple-gold */}
        <section className="text-center space-y-4">
          <Badge
            variant="outline"
            className="bg-violet-50 border-violet-200 text-violet-700 text-[11px]"
          >
            <PawPrint className="h-3 w-3 mr-1" />
            Paw Core · Identidad del proyecto
          </Badge>
          <h1 className="font-display font-semibold text-4xl md:text-5xl leading-[1.08] tracking-tight">
            ¿Quiénes somos y hacia{' '}
            <span className="bg-brand-gold-gradient bg-clip-text text-transparent">
              dónde vamos?
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Paw Friend es un proyecto hecho con amor en Chile por una persona que decidió dedicar
            tiempo a cuidar a las mascotas de la comunidad. Todo sin cobrar por ello.
          </p>
        </section>

        {/* Visión */}
        <Card className="border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/60 dark:from-violet-950/30 dark:to-fuchsia-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold text-lg">Visión</h2>
            </div>
            <p className="text-sm leading-relaxed">
              Ser el espacio de confianza donde cada tutor peludo y cada veterinario en
              Latinoamérica encuentra todo lo que necesita para cuidar a sus mascotas.{' '}
              <b>Gratis, transparente, con una comunidad de por medio</b>.
            </p>
          </CardContent>
        </Card>

        {/* Misión */}
        <Card className="border-pink-200/70 bg-gradient-to-br from-pink-50/70 to-amber-50/40 dark:from-pink-950/30 dark:to-amber-950/10">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
              <h2 className="font-semibold text-lg">Misión</h2>
            </div>
            <p className="text-sm leading-relaxed">
              Simplificar la vida de dueños y veterinarios con tecnología cercana, chilena y hecha
              con amor. Democratizar el acceso a salud animal: ficha clínica, directorio de vets,
              recordatorios, rutinas, red de donantes de sangre, memorial, adopciones — todo al
              alcance de cualquiera, sin paywalls.
            </p>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-lg">Valores</h2>
            </div>
            <ul className="text-sm space-y-2.5">
              <ValueRow
                icon={<Sprout className="h-5 w-5 text-emerald-600" />}
                title="Sostenible por comunidad"
                text="Modelo voluntario: si los aportes alcanzan, seguimos gratis. Sin VC hostiles, sin presión de exit."
              />
              <ValueRow
                icon={<Heart className="h-5 w-5 text-amber-500 fill-amber-500" />}
                title="Empático"
                text="Cada feature se diseña pensando en cómo se siente el dueño peludo frente a la pantalla a las 3 AM."
              />
              <ValueRow
                icon={<Unlock className="h-5 w-5 text-violet-600" />}
                title="Lo esencial gratis para siempre"
                text="Ficha clínica, recordatorios, calendario, OCR, directorio de vets y mapa — todo en el plan Free, para siempre. Paw Member y Manada son opcionales para quien quiera features avanzadas."
              />
              <ValueRow
                icon={<Home className="h-5 w-5 text-rose-500" />}
                title="Home-made en Chile"
                text="Una persona detrás del proyecto. Código transparente, sin letras chicas, sin vender datos."
              />
              <ValueRow
                icon={<Globe className="h-5 w-5 text-sky-500" />}
                title="Escalable a Latam"
                text="Diseñado desde el inicio para crecer hacia Argentina, Perú, Colombia, México — mismo ethos, misma calidad."
              />
            </ul>
          </CardContent>
        </Card>

        {/* Modelo v2: pilares ancla + soporte */}
        <Card className="bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/20 dark:to-rose-950/20 border-amber-200/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-lg">Cómo nos sostenemos</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <b>Modelo B2B de acceso a la ficha</b>: el grueso del revenue lo aportan pharma,
              seguros y retail por acceso a la ficha clínica longitudinal — los pilares ancla a
              escala. Para los dueños es freemium: lo esencial es gratis para siempre y los planes
              Paw Member ($3.990/mes) y Manada ($9.990/mes con aporte a refugios) son opcionales.
              Sumamos Paw Companys y apoyo voluntario de quienes quieran.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <MotorTile
                icon={<Bot className="h-4 w-4 text-blue-600" />}
                title="Pharma animal"
                text="Centrovet, Virbac, Zoetis: sponsored reminders + research deals + contenido educacional. Ancla mes 4-6."
              />
              <MotorTile
                icon={<Heart className="h-4 w-4 text-rose-500 fill-rose-500" />}
                title="Seguros pet"
                text="Sura, BCI, Mapfre: afiliado 10-20% sobre prima + ficha como canal de claims. Mes 6-9."
              />
              <MotorTile
                icon={<Trophy className="h-4 w-4 text-yellow-600" />}
                title="Retail pet"
                text="Master Dog, Falabella Pet: afiliado 3-10% + suscripción alimento + ads contextuales. Mes 8-12."
              />
              <MotorTile
                icon={<Building2 className="h-4 w-4 text-amber-600" />}
                title="Paw Companys"
                text="Empresas sponsor con aporte mensual. Badge + grid público + reporte de impacto."
                action={{
                  label: 'Ver /paw-companys',
                  onClick: () => navigate('/paw-companys'),
                }}
              />
              <MotorTile
                icon={<Heart className="h-4 w-4 text-pink-500" />}
                title="Paw Support"
                text="Apoyo voluntario del dueño que quiera. Trazabilidad pública a refugios."
                action={{ label: 'Ver aportes', onClick: () => navigate('/donaciones') }}
              />
              <MotorTile
                icon={<Megaphone className="h-4 w-4 text-fuchsia-500" />}
                title="Paw Voices"
                text="Creadores peludos que amplifican la misión desde sus redes (barter)."
                action={{
                  label: 'Ver /paw-voices',
                  onClick: () => navigate('/paw-voices'),
                }}
              />
              <MotorTile
                icon={<Sparkles className="h-4 w-4 text-violet-500" />}
                title="Paw Member · Manada (opcional)"
                text="Freemium B2C 3 tiers. Free $0 (lo esencial). Paw Member $3.990/mes (Paw Shield, Paw Passport, Insights Pro, audio IA, descuentos). Manada $9.990/mes (suma exclusivos + early access + $2.000/mes a fondo refugios)."
              />
              <MotorTile
                icon={<Users className="h-4 w-4 text-sky-500" />}
                title="Vets B2B"
                text="Canal de adquisición gratuito (Básica $0, Premium $9.9k). Clínica/Pro Max on-demand."
                action={{
                  label: 'Ver /para-veterinarios',
                  onClick: () => navigate('/para-veterinarios'),
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ideas a futuro */}
        <Card className="border-sky-200/60 bg-gradient-to-br from-sky-50/70 to-indigo-50/60 dark:from-sky-950/30 dark:to-indigo-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-500" />
              <h2 className="font-semibold text-lg">Ideas a futuro</h2>
            </div>
            <ul className="text-sm space-y-2 text-foreground/85">
              <li className="flex gap-2 items-start">
                <Coins className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Paw Points + Paw Crypto:</b> puntos canjeables por productos de partners
                  (alimento, juguetes, servicios vet) o por crypto transable. Use-to-earn de vida
                  real.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Globe className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Internacionalización LatAm:</b> Argentina, Perú, Colombia, México — mismo
                  producto, copy localizado, pasarela local.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Building2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Alianzas con ONG:</b> convenios con refugios y hogares de tránsito con
                  trazabilidad pública del excedente donado.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Bot className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>IA veterinaria avanzada:</b> triage en casa, derivación automática a vet,
                  detección temprana de síntomas a través de fotos y video.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Smartphone className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>App nativa Play Store / App Store:</b> mejor performance, notificaciones push
                  nativas, widgets.
                </span>
              </li>
            </ul>
            <p className="text-[11px] italic text-muted-foreground pt-1">
              Estas ideas son hoja de ruta, no promesa. Las priorizamos según lo que la comunidad
              necesite y el apoyo que recibamos.
            </p>
          </CardContent>
        </Card>

        {/* Llamada a la comunidad pet lover — 6 roles distintos */}
        <Card className="border-pink-200/70 bg-gradient-to-br from-pink-50/70 via-violet-50/50 to-amber-50/40 dark:from-pink-950/30 dark:via-violet-950/20 dark:to-amber-950/10">
          <CardContent className="p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                <h2 className="font-bold text-xl">Si amas a los animales, hay un rol para ti</h2>
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Paw Friend lo hacemos <b>porque queremos</b>, por amor a los animales. Queremos que
                siga gratis para todos y necesitamos una comunidad{' '}
                <span className="font-semibold text-pink-600 dark:text-pink-300">pet friendly</span>{' '}
                y{' '}
                <span className="font-semibold text-violet-600 dark:text-violet-300">
                  pet lover
                </span>{' '}
                que empuje junto. Cada tipo de persona puede ayudar de una forma distinta:
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              <RoleTile
                icon={<Heart className="h-5 w-5 text-pink-500 fill-pink-500" />}
                tone="pink"
                title="Dueños"
                text="Usa la app, cuida a tu peludo y (si quieres) dona lo que sientas justo."
                cta="Empezar"
                onClick={() => navigate('/home')}
              />
              <RoleTile
                icon={<Stethoscope className="h-5 w-5 text-sky-600" />}
                tone="sky"
                title="Veterinarios"
                text="Plan Básica gratis para empezar. Directorio público y ficha clínica compartida."
                cta="Ver planes"
                onClick={() => navigate('/para-veterinarios')}
              />
              <RoleTile
                icon={<Dog className="h-5 w-5 text-emerald-600" />}
                tone="emerald"
                title="Profesionales no-vet"
                text="Paseadores, cuidadores, entrenadores, peluqueros. Tu propia vitrina pública."
                cta="Activar servicios"
                onClick={() => navigate('/servicios')}
              />
              <RoleTile
                icon={<Megaphone className="h-5 w-5 text-fuchsia-600" />}
                tone="fuchsia"
                title="Paw Voices"
                text="¿Creador en redes? Amplifica la misión con tu voz auténtica. Kit listo."
                cta="Aplicar"
                onClick={() => navigate('/paw-voices')}
              />
              <RoleTile
                icon={<Building2 className="h-5 w-5 text-violet-600" />}
                tone="violet"
                title="Paw Companys"
                text="¿Tu empresa ama a los peludos? Sponsor mensual con logo destacado + menciones."
                cta="Aplicar"
                onClick={() => navigate('/paw-companys')}
              />
              <RoleTile
                icon={<ShoppingBag className="h-5 w-5 text-amber-600" />}
                tone="amber"
                title="Paw Partners"
                text="Tiendas, comida, restaurantes, seguros. Descuentos para Paw Members a cambio de publicidad."
                cta="Escríbenos"
                onClick={() =>
                  (window.location.href =
                    'mailto:pedrosusaeta@pawfriend.cl?subject=Quiero%20ser%20Paw%20Partner')
                }
              />
            </div>

            <p className="text-[11px] text-center text-muted-foreground italic pt-2 border-t border-dashed border-pink-200/50">
              No pedimos exclusividad, no hay letra chica. Si compartes el amor por los animales,
              aquí hay un lugar.
            </p>
          </CardContent>
        </Card>

        {/* Cierre */}
        <section className="text-center text-sm text-muted-foreground space-y-1 pt-2">
          <p className="flex items-center justify-center gap-1.5">
            <Home className="h-3.5 w-3.5" />
            Home-made · Chile · Para los peludos amigos
          </p>
          <p className="text-[11px]">
            ¿Tienes ideas para Paw Core? Escríbenos a{' '}
            <a
              href="mailto:pedrosusaeta@pawfriend.cl?subject=Ideas%20para%20Paw%20Core"
              className="underline hover:text-foreground"
            >
              pedrosusaeta@pawfriend.cl
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

function ValueRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="shrink-0 mt-0.5" aria-hidden>
        {icon}
      </span>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <p className="text-xs text-muted-foreground leading-snug">{text}</p>
      </div>
    </li>
  );
}

function MotorTile({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-lg border border-amber-200/50 bg-white/70 dark:bg-slate-900/60 p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <h3 className="font-semibold text-sm leading-tight">{title}</h3>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            'text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:underline'
          )}
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}

function RoleTile({
  icon,
  tone = 'pink',
  title,
  text,
  cta,
  onClick,
}: {
  icon: React.ReactNode;
  tone?: 'pink' | 'sky' | 'emerald' | 'fuchsia' | 'violet' | 'amber';
  title: string;
  text: string;
  cta: string;
  onClick: () => void;
}) {
  const toneMap = {
    pink: {
      border: 'border-pink-200/70',
      bg: 'bg-pink-50/70',
      cta: 'text-pink-600 dark:text-pink-300',
    },
    sky: { border: 'border-sky-200/70', bg: 'bg-sky-50/70', cta: 'text-sky-600 dark:text-sky-300' },
    emerald: {
      border: 'border-emerald-200/70',
      bg: 'bg-emerald-50/70',
      cta: 'text-emerald-600 dark:text-emerald-300',
    },
    fuchsia: {
      border: 'border-fuchsia-200/70',
      bg: 'bg-fuchsia-50/70',
      cta: 'text-fuchsia-600 dark:text-fuchsia-300',
    },
    violet: {
      border: 'border-violet-200/70',
      bg: 'bg-violet-50/70',
      cta: 'text-violet-600 dark:text-violet-300',
    },
    amber: {
      border: 'border-amber-200/70',
      bg: 'bg-amber-50/70',
      cta: 'text-amber-600 dark:text-amber-300',
    },
  };
  const t = toneMap[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title}: ${cta}`}
      className={cn(
        'rounded-xl border bg-white/80 dark:bg-slate-900/60 p-3 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group',
        t.border
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn('shrink-0 w-9 h-9 rounded-lg flex items-center justify-center', t.bg)}
          aria-hidden
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight">{title}</h3>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{text}</p>
          <span
            className={cn(
              'inline-flex items-center text-[11px] font-medium mt-1.5 group-hover:underline',
              t.cta
            )}
          >
            {cta} →
          </span>
        </div>
      </div>
    </button>
  );
}
