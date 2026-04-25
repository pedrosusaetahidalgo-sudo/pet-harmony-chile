/**
 * Página /mis-adopciones — el adopter ve los procesos de adopción que tiene
 * en curso o cerrados. Timeline visual por proceso.
 *
 * Ver REFACTOR_ADOPCION_2026_04_24.md §3.3.
 */
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Loader2, Heart, Building2, ArrowRight, MapPin, PawPrint } from 'lucide-react';
import { LINKS } from '@/lib/links';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';
import { useEffect } from 'react';
import {
  useAdopterProcesses,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ORDER,
  type AdoptionProcessWithPet,
} from '@/hooks/useAdoptionProcesses';
import { Navigate } from 'react-router-dom';

export default function MisAdopciones() {
  const navigate = useNavigate();
  const flagEnabled = isFeatureEnabled('ADOPTION_PROCESSES_V1');
  const { data: processes, isLoading } = useAdopterProcesses();

  useEffect(() => {
    if (flagEnabled) {
      trackRefactor(RefactorEvent.myAdoptionsViewed, { count: processes?.length ?? 0 });
    }
  }, [flagEnabled, processes?.length]);

  if (!flagEnabled) {
    // Si el flag no está activo, redirigir al feed
    return <Navigate to="/adoption" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mis adopciones · Paw Friend</title>
      </Helmet>

      <PageHeader
        title="Mis adopciones"
        subtitle="Estado de tus procesos en curso"
        onBack={() => navigate(LINKS.home())}
      />

      <div className="container max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : !processes || processes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {processes.map((p) => (
              <ProcessCard key={p.id} process={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-3">
        <div className="inline-flex h-14 w-14 rounded-full bg-purple-100 items-center justify-center">
          <Heart className="h-7 w-7 text-purple-600" />
        </div>
        <h3 className="font-semibold">Aún no tenés procesos de adopción</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Cuando expreses interés en una mascota de un refugio, vas a poder seguir el proceso desde
          acá.
        </p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700 mt-2">
          <Link to="/adoption">
            Ver mascotas en adopción <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ProcessCard({ process }: { process: AdoptionProcessWithPet }) {
  const isClosed = process.status === 'rejected' || process.status === 'transferred';
  const visibleStatuses = STATUS_ORDER.filter(
    (s) => s !== 'rejected' || process.status === 'rejected'
  );
  const currentIdx = visibleStatuses.indexOf(process.status);

  return (
    <Card className={isClosed ? 'opacity-80' : ''}>
      <CardContent className="p-4 space-y-3">
        {/* Header pet + shelter */}
        <div className="flex gap-3">
          <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {process.pet?.photo_url ? (
              <img
                src={process.pet.photo_url}
                alt={process.pet.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <PawPrint className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold leading-tight">{process.pet?.name ?? 'Mascota'}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="capitalize">{process.pet?.species}</span>
                  {process.pet?.breed && <span>· {process.pet.breed}</span>}
                </div>
              </div>
              <Badge variant="outline" className={STATUS_COLORS[process.status]}>
                {STATUS_LABELS[process.status]}
              </Badge>
            </div>

            {process.shelter && (
              <Link
                to={process.shelter.slug ? `/refugios/${process.shelter.slug}` : '#'}
                className="flex items-center gap-1 text-xs text-purple-700 hover:underline mt-1.5"
              >
                <Building2 className="h-3 w-3" /> {process.shelter.legal_name}
                {process.shelter.commune && (
                  <span className="text-muted-foreground">
                    <MapPin className="h-3 w-3 inline ml-1" /> {process.shelter.commune}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Timeline visual de status */}
        <div className="flex items-center gap-1 pt-2">
          {visibleStatuses.map((s, i) => {
            const isCurrent = i === currentIdx;
            const isPassed = i < currentIdx;
            const isRejected = s === 'rejected';
            return (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full ${
                  isRejected ? 'bg-red-400' : isPassed || isCurrent ? 'bg-purple-500' : 'bg-muted'
                }`}
                title={STATUS_LABELS[s]}
              />
            );
          })}
        </div>

        {/* Info adicional según status */}
        {process.status === 'visit_scheduled' && process.visit_date && (
          <div className="text-sm bg-purple-50 border border-purple-200 rounded-md p-3">
            <p className="font-medium text-purple-900">Visita agendada</p>
            <p className="text-purple-700 text-xs mt-0.5">
              {new Date(process.visit_date).toLocaleString('es-CL', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </p>
          </div>
        )}

        {process.status === 'rejected' && process.rejected_reason && (
          <div className="text-sm bg-red-50 border border-red-200 rounded-md p-3">
            <p className="font-medium text-red-900">Motivo</p>
            <p className="text-red-700 text-xs mt-0.5">{process.rejected_reason}</p>
          </div>
        )}

        {process.status === 'transferred' && (
          <div className="text-sm bg-emerald-50 border border-emerald-200 rounded-md p-3">
            <p className="font-medium text-emerald-900">¡Adopción confirmada! 🎉</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Revisa tu correo para reclamar a {process.pet?.name} en tu cuenta.
            </p>
          </div>
        )}

        {process.notes_shelter && (
          <div className="text-sm text-muted-foreground border-l-2 border-purple-200 pl-3">
            <p className="text-xs uppercase tracking-wide text-purple-600 font-medium mb-0.5">
              Mensaje del refugio
            </p>
            <p>{process.notes_shelter}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
