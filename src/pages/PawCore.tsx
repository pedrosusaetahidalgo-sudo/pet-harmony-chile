import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        {/* Hero */}
        <section className="text-center space-y-3">
          <Badge
            variant="outline"
            className="bg-violet-50 border-violet-200 text-violet-700 text-[11px]"
          >
            <PawPrint className="h-3 w-3 mr-1" />
            Paw Core · Identidad del proyecto
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            ¿Quiénes somos y hacia{' '}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
              dónde vamos?
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
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
                icon="🌱"
                title="Sostenible por comunidad"
                text="Modelo voluntario: si las donaciones alcanzan, seguimos gratis. Sin VC hostiles, sin presión de exit."
              />
              <ValueRow
                icon="💛"
                title="Empático"
                text="Cada feature se diseña pensando en cómo se siente el dueño peludo frente a la pantalla a las 3 AM."
              />
              <ValueRow
                icon="🔓"
                title="Gratis y abierto"
                text="Ficha clínica, PDF, directorio de vets, mapa — todo disponible sin membresía, sin gates, para siempre."
              />
              <ValueRow
                icon="🏡"
                title="Home-made en Chile"
                text="Una persona detrás del proyecto. Código transparente, sin letras chicas, sin vender datos."
              />
              <ValueRow
                icon="🌍"
                title="Escalable a Latam"
                text="Diseñado desde el inicio para crecer hacia Argentina, Perú, Colombia, México — mismo ethos, misma calidad."
              />
            </ul>
          </CardContent>
        </Card>

        {/* 6 motores de sostenibilidad */}
        <Card className="bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/20 dark:to-rose-950/20 border-amber-200/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-lg">Cómo nos sostenemos</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              6 motores de revenue que financian la operación. Ninguno bloquea features del lado
              dueño — todos son opcionales o del lado profesional.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <MotorTile
                icon={<Heart className="h-4 w-4 text-rose-500 fill-rose-500" />}
                title="Donaciones"
                text="Aportes voluntarios desde $500 a $500k. 10 días para devolución."
                action={{ label: 'Ver /donaciones', onClick: () => navigate('/donaciones') }}
              />
              <MotorTile
                icon={<Sparkles className="h-4 w-4 text-violet-500" />}
                title="Paw Member"
                text="Membresía mensual voluntaria, solo badge. Sin features exclusivas."
              />
              <MotorTile
                icon={<Users className="h-4 w-4 text-sky-500" />}
                title="Planes Vet"
                text="Free (5 pacientes), Premium $9.9k, Pro Max $29.9k. B2B real."
                action={{
                  label: 'Ver /para-veterinarios',
                  onClick: () => navigate('/para-veterinarios'),
                }}
              />
              <MotorTile
                icon={<Building2 className="h-4 w-4 text-amber-600" />}
                title="Paw Companys"
                text="Empresas con corazón peludo. Badge + grid público en /donaciones."
              />
              <MotorTile
                icon={<Megaphone className="h-4 w-4 text-fuchsia-500" />}
                title="Paw Voices"
                text="Creadores aliados que comparten la misión. Próximamente con perfil dedicado."
              />
              <MotorTile
                icon={<Trophy className="h-4 w-4 text-yellow-600" />}
                title="Publicidad transparente"
                text="Slots de banners claramente etiquetados. No vendemos tus datos personales."
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
              <li className="flex gap-2">
                <span aria-hidden>🪙</span>
                <span>
                  <b>Paw Points + Paw Crypto:</b> puntos canjeables por productos de partners
                  (alimento, juguetes, servicios vet) o por crypto transable. Use-to-earn de vida
                  real.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>🌎</span>
                <span>
                  <b>Internacionalización LatAm:</b> Argentina, Perú, Colombia, México — mismo
                  producto, copy localizado, pasarela local.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>🏥</span>
                <span>
                  <b>Alianzas con ONG:</b> convenios con refugios y hogares de tránsito con
                  trazabilidad pública del excedente donado.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>🤖</span>
                <span>
                  <b>IA veterinaria avanzada:</b> triage en casa, derivación automática a vet,
                  detección temprana de síntomas a través de fotos y video.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>📱</span>
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

        {/* Qué esperamos de los Paw Voices */}
        <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/70 dark:from-violet-950/30 dark:to-fuchsia-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold text-lg">Paw Voices — nuestra red de creadores</h2>
            </div>
            <p className="text-sm text-foreground/85">
              Buscamos creadores peludos (TikTok, Instagram, YouTube, LinkedIn) que quieran
              amplificar la misión. En la etapa inicial te pedimos algo simple:
            </p>
            <ul className="text-sm space-y-1.5 list-disc pl-5">
              <li>Exponer el link de Paw Friend en tu bio o historia.</li>
              <li>Compartir 1 gráfica o reel al mes (nosotros te lo entregamos listo).</li>
              <li>Hablar a tu audiencia desde tu experiencia peluda.</li>
            </ul>
            <p className="text-sm text-foreground/85 pt-1">
              A cambio recibís: badge oficial Paw Voice, perfil destacado en el directorio público,
              código promo para tu audiencia, y mención en nuestras redes.
            </p>
            <div className="pt-2">
              <Button
                onClick={() =>
                  (window.location.href =
                    'mailto:pawfriendcl@gmail.com?subject=Quiero%20ser%20Paw%20Voice')
                }
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
                size="sm"
              >
                Quiero ser Paw Voice →
              </Button>
            </div>
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
              href="mailto:pawfriendcl@gmail.com?subject=Ideas%20para%20Paw%20Core"
              className="underline hover:text-foreground"
            >
              pawfriendcl@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

function ValueRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="text-lg leading-none" aria-hidden>
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
