import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Sparkles,
  Heart,
  Crown,
  Trophy,
  Users,
  PawPrint,
  ShieldCheck,
  Handshake,
  Store,
} from '@/lib/icons';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PawCompanysGrid } from '@/components/PawCompanysGrid';
import { PawCompanyApplyForm } from '@/components/PawCompanyApplyForm';

const BENEFITS = [
  {
    icon: Crown,
    title: 'Badge oficial Paw Company',
    text: 'Bronze / Silver / Gold visible en tu perfil empresarial y en el grid público de /donaciones.',
  },
  {
    icon: Sparkles,
    title: 'Logo destacado',
    text: 'Tu logo en el directorio de empresas aliadas, visible a todos los usuarios de Paw Friend.',
  },
  {
    icon: Trophy,
    title: 'Menciones en comunicación',
    text: 'Te nombramos en redes sociales, newsletter y (si calzamos) en el reel mensual.',
  },
  {
    icon: Users,
    title: 'Audiencia peluda',
    text: 'Acceso a una comunidad de tutores y vets que valoran tu apoyo a la causa animal.',
  },
];

const WHAT_WE_NEED: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Handshake,
    title: 'Una alianza mensual',
    text: 'Aporte mensual por transferencia (sin letra chica, sin compromisos largos).',
  },
  {
    icon: PawPrint,
    title: 'Producto o servicio relacionado',
    text: 'Nos importa que tu empresa tenga sentido para tutores peludos o veterinarios.',
  },
  {
    icon: Heart,
    title: 'Amor por los animales',
    text: 'No aceptamos empresas que no se alineen con la misión de Paw Friend.',
  },
];

const TIERS = [
  {
    name: 'Bronze',
    from: '$49.900',
    color: 'from-amber-400 to-amber-600',
    text: 'Logo en grid, menciones puntuales, badge oficial.',
  },
  {
    name: 'Silver',
    from: '$99.900',
    color: 'from-slate-400 to-slate-600',
    text: 'Todo lo del Bronze + banner en una sección de la app + mención reel mensual.',
  },
  {
    name: 'Gold',
    from: '$199.900',
    color: 'from-yellow-400 to-amber-500',
    text: 'Todo lo anterior + partner destacado + co-creación de contenido + acceso directo fundador.',
  },
];

export default function PawCompanysPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Paw Companys — Empresas con corazón peludo | Paw Friend';
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Paw Companys — Empresas con corazón peludo | Paw Friend</title>
        <meta
          name="description"
          content="Empresas que patrocinan Paw Friend y apoyan la causa animal. Badge oficial, logo destacado, audiencia peluda. Súmate como Bronze, Silver o Gold."
        />
      </Helmet>
      <PageHeader title="Paw Companys" onBack={() => navigate(-1)} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(45 100% 92% / 0.6), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(340 90% 92% / 0.4), transparent 70%)',
        }}
      />

      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-10 animate-fade-in">
        {/* Hero */}
        <section className="text-center space-y-3">
          <Badge
            variant="outline"
            className="bg-amber-50 border-amber-200 text-amber-700 text-[11px]"
          >
            <Building2 className="h-3 w-3 mr-1" />
            Red de empresas aliadas
          </Badge>
          <h1 className="font-display font-semibold text-4xl md:text-5xl leading-[1.08] tracking-tight">
            Haz que tu empresa sea una{' '}
            <span className="bg-audience-companys-gradient bg-clip-text text-transparent">
              Paw Company
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            Si tu empresa se alinea con la misión de Paw Friend — cuidar mascotas en Chile sin
            paywalls — queremos conocerte.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button
              onClick={() =>
                document.getElementById('aplicar')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="bg-audience-companys-gradient shadow-audience-companys"
            >
              Quiero aplicar →
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              <a href="/pitch/companys.html" target="_blank" rel="noopener noreferrer">
                Ver pitch completo (5 min)
              </a>
            </Button>
            <Button variant="ghost" asChild className="text-purple-800 hover:bg-purple-50">
              <a href="mailto:pedrosusaeta@pawfriend.cl?subject=Paw%20Company%20%E2%80%94%20Quiero%20agendar%20reuni%C3%B3n%20(15%20min)&body=Hola%20Paw%20Founder%2C%0A%0AMe%20gustar%C3%ADa%20coordinar%20una%20reuni%C3%B3n%20de%2015%20minutos%20para%20conocer%20m%C3%A1s%20sobre%20Paw%20Companys%20y%20explorar%20si%20tiene%20sentido%20para%20nuestra%20empresa.%0A%0AEmpresa%3A%20%0AContacto%3A%20%0ADisponibilidad%3A%20%0A%0AGracias!">
                Agendar reunión (15 min) →
              </a>
            </Button>
          </div>
        </section>

        {/* Grid de Paw Companys activos */}
        <PawCompanysGrid />

        {/* Tiers */}
        <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/70 to-rose-50/40 dark:from-amber-950/30 dark:to-rose-950/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-lg">Niveles de alianza</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {TIERS.map((t) => (
                <div
                  key={t.name}
                  className="rounded-lg border border-amber-200/60 bg-white/70 dark:bg-slate-900/60 p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <PawPrint className="h-4 w-4 text-amber-600" />
                    <h3 className="font-semibold text-sm">{t.name}</h3>
                  </div>
                  <div
                    className={`text-base font-bold bg-gradient-to-r ${t.color} bg-clip-text text-transparent`}
                  >
                    Desde {t.from}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{t.text}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground italic pt-1">
              El monto final lo acordamos en conjunto según el encaje y el alcance. Es un aporte
              mensual por transferencia; por ahora no cobramos via Flow recurrente.
            </p>
          </CardContent>
        </Card>

        {/* Qué te pedimos */}
        <Card className="border-pink-200/60 bg-gradient-to-br from-pink-50/70 to-amber-50/40 dark:from-pink-950/30 dark:to-amber-950/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
              <h2 className="font-semibold text-lg">Qué esperamos de ti</h2>
            </div>
            <ul className="space-y-2.5">
              {WHAT_WE_NEED.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-3 items-start">
                    <span
                      className="shrink-0 w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mt-0.5"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{item.title}</div>
                      <p className="text-xs text-muted-foreground leading-snug">{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Qué recibes */}
        <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold text-lg">Qué recibes</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="rounded-lg border border-violet-100 dark:border-violet-900/40 bg-white/70 dark:bg-slate-900/60 p-3 space-y-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-violet-600" />
                      <h3 className="font-semibold text-sm leading-tight">{b.title}</h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{b.text}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transparencia */}
        <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-lg">Cómo lo hacemos transparente</h2>
            </div>
            <ul className="text-sm space-y-1.5 text-foreground/85 list-disc pl-5">
              <li>
                Tu aporte se registra en la Sala de Inversión de Paw Friend y en la tarjeta de
                transparencia pública (total agregado).
              </li>
              <li>
                Cualquier publicidad que contrates va etiquetada como <b>Patrocinado</b> conforme a
                las normas de publicidad transparente de SERNAC (Ley 19.496).
              </li>
              <li>
                <b>No vendemos datos personales</b> de usuarios. Los segmentos publicitarios se
                construyen solo con información agregada y anónima.
              </li>
              <li>
                Puedes cancelar la alianza en cualquier momento. Sin penalización, sin contratos
                blindados.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Form de aplicación */}
        <PawCompanyApplyForm />

        {/* Cierre */}
        <section className="text-center text-sm text-muted-foreground space-y-1 pt-2">
          <p>
            Contacto directo:{' '}
            <a
              href="mailto:pedrosusaeta@pawfriend.cl?subject=Paw%20Company"
              className="underline hover:text-foreground"
            >
              pedrosusaeta@pawfriend.cl
            </a>
          </p>
          <p className="text-[11px] italic">
            Paw Friend es un proyecto home-made hecho en Chile. Cada alianza cuenta.
          </p>
        </section>
      </div>
    </div>
  );
}
