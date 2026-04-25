/**
 * MyApplicationsSection — widget embebible en /profile.
 *
 * Plan PRODUCT_SYSTEM_COHERENCE §33.4 y §43 item 10.
 * Muestra el estado de las postulaciones del usuario (Paw Voices,
 * Paw Companys, Pitch applications) con link a la pagina publica
 * correspondiente. Si no hay ninguna, no renderiza nada.
 */

import { Link } from 'react-router-dom';
import {
  useMyApplications,
  applicationStatusLabel,
  applicationStatusTone,
} from '@/hooks/useMyApplications';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowRight, Loader2 } from '@/lib/icons';
import { cn } from '@/lib/utils';

const TONE_CLASSES: Record<ReturnType<typeof applicationStatusTone>, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  positive: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  negative: 'bg-rose-100 text-rose-800 border-rose-200',
  neutral: 'bg-slate-100 text-slate-800 border-slate-200',
};

export function MyApplicationsSection() {
  const { data: applications, isLoading } = useMyApplications();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mis postulaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando...
        </CardContent>
      </Card>
    );
  }

  if (!applications || applications.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Mis postulaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {applications.map((app) => {
          const tone = applicationStatusTone(app.status);
          return (
            <Link
              key={`${app.source}-${app.id}`}
              to={app.detailUrl ?? '#'}
              className="group flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2 hover:border-primary/40 hover:bg-muted/40 transition"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{app.title}</p>
                {app.subtitle ? (
                  <p className="text-xs text-muted-foreground truncate">{app.subtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={cn('text-[10px] font-medium', TONE_CLASSES[tone])}>
                  {applicationStatusLabel(app.status)}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
              </div>
            </Link>
          );
        })}
        <Link
          to="/mis-postulaciones"
          className="text-xs text-purple-700 hover:text-purple-900 hover:underline block pt-2 text-center"
        >
          Ver historial completo →
        </Link>
        <p className="text-xs text-muted-foreground text-center">
          Recibirás un correo cuando el equipo revise tu postulación.
        </p>
      </CardContent>
    </Card>
  );
}
