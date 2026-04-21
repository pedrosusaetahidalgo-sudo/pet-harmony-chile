import { PageHeader } from '@/components/PageHeader';
import { ProviderAgendaCalendar } from '@/components/provider/ProviderAgendaCalendar';
import { useProviderDashboardStats } from '@/hooks/useProviderDashboardStats';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * CC-25 · /provider/agenda — vista operativa semanal del vet.
 *
 * Gated por feature flag PROVIDER_AGENDA_CALENDAR (ver src/lib/featureFlags.ts).
 * Si el flag está en false, la ruta redirige a /provider/dashboard en App.tsx.
 */
export default function ProviderAgenda() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useProviderDashboardStats();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Agenda semanal" />
        <div className="container max-w-6xl mx-auto p-4">
          <Skeleton className="h-[500px] w-full rounded-md" />
        </div>
      </>
    );
  }

  if (!stats?.providerId) {
    return (
      <>
        <PageHeader title="Agenda semanal" />
        <div className="container max-w-4xl mx-auto p-6">
          <p className="text-sm text-muted-foreground text-center py-12">
            Configura tu perfil de profesional para acceder a tu agenda.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Agenda semanal"
        subtitle="Vista consolidada de tus citas. Click en una reserva para gestionarla."
      />
      <div className="container max-w-6xl mx-auto p-4">
        <ProviderAgendaCalendar providerId={stats.providerId} providerUserId={user?.id} />
      </div>
    </>
  );
}
