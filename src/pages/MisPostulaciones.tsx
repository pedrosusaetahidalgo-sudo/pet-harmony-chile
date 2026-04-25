/**
 * /mis-postulaciones — vista unificada de aplicaciones del usuario.
 *
 * Plan PRODUCT_SYSTEM_COHERENCE §43 / refactor 2026-04-25.
 *
 * El user que postula como Paw Voice, Paw Company o via /aplicar (corfo,
 * startup_chile, angels, refugio, etc.) hoy queda sin feedback porque las
 * paginas publicas filtran por status='active'. Sus rows existen pero no
 * los ve nadie.
 *
 * Esta pagina cierra el loop: lista TODAS sus postulaciones con status,
 * fecha y CTA al detalle correspondiente.
 */
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useMyApplications,
  applicationStatusLabel,
  applicationStatusTone,
  type UnifiedApplication,
} from '@/hooks/useMyApplications';
import { PageHeader } from '@/components/PageHeader';

export default function MisPostulaciones() {
  const { data: applications = [], isLoading } = useMyApplications();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mis postulaciones · Paw Friend</title>
      </Helmet>

      <PageHeader title="Mis postulaciones" subtitle="Estado de tus aplicaciones a Paw Friend" />

      <main className="container max-w-2xl mx-auto px-3 py-4 space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && applications.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="font-semibold text-lg">Aún no postulaste a nada</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Si querés sumar tu empresa, ser Paw Voice o aplicar a financiamiento, empezá desde
                la página de aplicaciones.
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/aplicar">Postular</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/paw-companys">Paw Companys</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/paw-voices">Paw Voices</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && applications.length > 0 && (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard key={`${app.source}-${app.id}`} app={app} />
            ))}
          </div>
        )}

        {!isLoading && applications.length > 0 && (
          <div className="pt-4 text-center">
            <Button asChild variant="outline" size="sm">
              <Link to="/aplicar">
                <FileText className="h-4 w-4 mr-1" />
                Postular a otra cosa
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function ApplicationCard({ app }: { app: UnifiedApplication }) {
  const tone = applicationStatusTone(app.status);
  const label = applicationStatusLabel(app.status);

  const toneClass = {
    pending: 'bg-amber-100 text-amber-800 border-amber-300',
    positive: 'bg-green-100 text-green-800 border-green-300',
    negative: 'bg-red-100 text-red-800 border-red-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
  }[tone];

  const dateLabel = app.createdAt
    ? format(parseISO(app.createdAt), "d 'de' MMM yyyy", { locale: es })
    : '—';

  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-tight">{app.title}</p>
            <Badge variant="outline" className={`shrink-0 text-[10px] ${toneClass}`}>
              {label}
            </Badge>
          </div>
          {app.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">{app.subtitle}</p>
          )}
          <p className="text-[11px] text-muted-foreground">Enviada el {dateLabel}</p>
        </div>
        {app.detailUrl && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
      </CardContent>
    </Card>
  );

  if (app.detailUrl) {
    return <Link to={app.detailUrl}>{inner}</Link>;
  }
  return inner;
}
