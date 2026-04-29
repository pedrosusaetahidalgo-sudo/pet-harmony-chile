import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  Server,
  Zap,
  MapPin,
  FileText,
  Mail,
  Heart,
  PawPrint,
  ArrowRight,
  CheckCircle,
} from '@/lib/icons';
import { PageHeader } from '@/components/PageHeader';
import { DonationsTransparency } from '@/components/DonationsTransparency';
import { PawCompanysGrid } from '@/components/PawCompanysGrid';
import { usePublicDonations } from '@/hooks/usePublicDonations';
import { formatCLP } from '@/lib/format';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const COST_BREAKDOWN = [
  {
    icon: Server,
    label: 'Servidores y base de datos',
    pct: 45,
    text: 'Supabase Postgres + storage de fichas médicas, fotos y PDFs.',
  },
  {
    icon: Zap,
    label: 'Edge functions e IA',
    pct: 25,
    text: 'Asistente IA, OCR de carnets, generación de reportes y resúmenes.',
  },
  {
    icon: Mail,
    label: 'Emails transaccionales',
    pct: 10,
    text: 'Recordatorios, reportes semanales, invitaciones vet→dueño.',
  },
  {
    icon: MapPin,
    label: 'Dominios y mapas',
    pct: 8,
    text: 'pawfriend.cl, SSL, geocoding, mobile stores.',
  },
  {
    icon: ShieldCheck,
    label: 'Seguridad y monitoreo',
    pct: 7,
    text: 'Sentry, backups automáticos, auditorías RLS.',
  },
  {
    icon: Heart,
    label: 'Excedente → refugios',
    pct: 5,
    text: 'Si cubrimos costos, el resto va a refugios aliados (con comprobante).',
  },
];

const COMMITMENTS = [
  'Lo esencial de Paw Friend es gratis para dueños de mascotas, para siempre. Los planes Paw Member ($3.990/mes) y Manada ($9.990/mes) son opcionales y desbloquean features avanzadas — pero el plan Free incluye ficha clínica, recordatorios, calendario, OCR y directorio de vets.',
  'No vendemos datos. Ni los tuyos, ni los de tu mascota, ni los de tu vet.',
  'Solo mostramos % de avance hacia la meta anual, no el monto total recaudado.',
  'Si hay excedente, publicamos en esta página a qué refugio se derivó y el comprobante.',
  'Si el proyecto dejara de operar, tu ficha clínica PDF seguirá descargable.',
];

export default function Transparencia() {
  const { data: donations, isLoading } = usePublicDonations(30);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-50/30 dark:to-emerald-950/10">
      <Helmet>
        <title>Transparencia — Paw Friend</title>
        <meta
          name="description"
          content="Cómo se sostiene Paw Friend: desglose honesto de costos, meta de la comunidad, empresas aliadas y compromisos con los usuarios. Proyecto home-made chileno."
        />
        <link rel="canonical" href="https://pawfriend.cl/transparencia" />
        <meta property="og:title" content="Transparencia — Paw Friend" />
        <meta
          property="og:description"
          content="A dónde va cada peso que aporta la comunidad: servidores, IA, emails, refugios. Hecho por una persona en Chile."
        />
      </Helmet>

      <PageHeader title="Transparencia" back={false} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <section className="text-center space-y-3 pt-2">
          <Badge
            variant="outline"
            className="bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Proyecto home-made chileno
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">¿A dónde va cada peso?</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Paw Friend lo hace una sola persona en Chile. Esta página se actualiza sola desde la
            base de datos para que puedas ver, sin intermediarios, cómo se sostiene el proyecto.
          </p>
        </section>

        <DonationsTransparency />

        <section className="space-y-4">
          <header className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Desglose de costos mensuales</h2>
          </header>
          <div className="grid gap-3 md:grid-cols-2">
            {COST_BREAKDOWN.map((item) => (
              <Card key={item.label} className="border-border/60">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-sm">{item.label}</h3>
                      <span className="text-xs font-semibold text-primary">{item.pct}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            Porcentajes aproximados sobre costos mensuales recurrentes. Cambian con el volumen de
            usuarios y se auditan cada trimestre.
          </p>
        </section>

        <section className="space-y-4">
          <header className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold">Compromisos</h2>
          </header>
          <Card className="border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardContent className="p-5">
              <ul className="space-y-2.5">
                {COMMITMENTS.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <header className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-semibold">Empresas aliadas (Paw Companys)</h2>
          </header>
          <PawCompanysGrid />
        </section>

        <section className="space-y-4">
          <header className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Últimos aportes públicos</h2>
          </header>
          {isLoading ? (
            <div className="grid gap-2 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : donations && donations.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {donations.slice(0, 12).map((d) => (
                <Card key={d.id} className="border-border/60">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {d.donor_name || 'Anónimo'}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                        {formatCLP(d.amount_clp)}
                      </span>
                    </div>
                    {d.message && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2">
                        "{d.message}"
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(parseISO(d.paid_at), { addSuffix: true, locale: es })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Aún no hay aportes públicos. Cuando alguien aporte y elija hacerlo público,
                aparecerá aquí.
              </CardContent>
            </Card>
          )}
        </section>

        <section className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
          <h2 className="text-xl font-semibold">Aportar también es sostener</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Si Paw Friend te ayuda a cuidar mejor a tu peludo, un aporte voluntario mantiene el
            proyecto vivo y gratis para todos.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/donaciones">
              Aportar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
