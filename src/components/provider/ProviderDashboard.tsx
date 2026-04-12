import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProviderDashboardStats } from '@/hooks/useProviderDashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserCog,
  Eye,
  Stethoscope,
  Star,
  Users,
  FileText,
  Calendar,
  Loader2,
  AlertCircle,
  ClipboardList,
  Mail,
  TrendingUp,
} from '@/lib/icons';
import { ProviderDirectoryCard } from './ProviderDirectoryCard';
import { SharedFichasCard } from './SharedFichasCard';
import { TodayAgendaCard } from './TodayAgendaCard';
import { VetFollowupsCard } from './VetFollowupsCard';
import { VetPatientsList } from './VetPatientsList';
import { CreateServicePromotion } from '@/components/CreateServicePromotion';

const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconColor?: string;
}

function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-muted-foreground',
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useProviderDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-muted-foreground">Error al cargar el dashboard</p>
      </div>
    );
  }

  if (!stats) return null;

  const hasActivity = stats.patientsThisMonth > 0 || stats.bookingsThisMonth > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Mi consultorio</h2>
          <p className="text-muted-foreground">Resumen de tu actividad y reputación</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {stats.slug && (
            <Link to={`/veterinarios/${stats.slug}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-1" /> Ver cómo me ven los dueños
              </Button>
            </Link>
          )}
          <Link to="/provider/profile-edit">
            <Button variant="outline">
              <UserCog className="h-4 w-4 mr-1" /> Editar mi perfil público
            </Button>
          </Link>
        </div>
      </div>

      {/* Agenda de hoy */}
      <TodayAgendaCard />

      {/* Seguimientos de esta semana */}
      <VetFollowupsCard />

      {/* Fichas compartidas con este vet en los ultimos 7 dias */}
      <SharedFichasCard providerId={stats.providerId} />

      {/* Onboarding: vet sin actividad */}
      {!hasActivity && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-amber-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-purple-600" />
              Aun no tienes actividad. Vamos a cambiarlo.
            </CardTitle>
            <CardDescription>
              3 pasos para que los duenos te encuentren en tu comuna.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/provider/profile-edit" className="block">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                <div>
                  <p className="text-sm font-semibold">1. Completa tu perfil publico</p>
                  <p className="text-xs text-muted-foreground">
                    Foto, bio, especialidades, comuna y precio.
                  </p>
                </div>
                <Button size="sm" variant="ghost">
                  →
                </Button>
              </div>
            </Link>
            {stats.slug && (
              <Link to={`/veterinarios/${stats.slug}`} className="block">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                  <div>
                    <p className="text-sm font-semibold">2. Revisa como te ven los duenos</p>
                    <p className="text-xs text-muted-foreground">
                      Abre tu perfil publico en una pestana nueva.
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    →
                  </Button>
                </div>
              </Link>
            )}
            <Link to="/veterinarios" className="block">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                <div>
                  <p className="text-sm font-semibold">
                    3. Comparte tu URL en Instagram y WhatsApp
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Las primeras reservas casi siempre vienen de tu propia red.
                  </p>
                </div>
                <Button size="sm" variant="ghost">
                  →
                </Button>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tarjeta del directorio publico */}
      <ProviderDirectoryCard />

      {/* Row 1: Metricas de impacto (4 cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pacientes este mes"
          value={stats.patientsThisMonth}
          subtitle={`${stats.notesThisMonth} nota${stats.notesThisMonth !== 1 ? 's' : ''} clinica${stats.notesThisMonth !== 1 ? 's' : ''}`}
          icon={Users}
          iconColor="text-purple-600"
        />
        <MetricCard
          label="Calificacion"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
          subtitle={`${stats.totalReviews} resena${stats.totalReviews !== 1 ? 's' : ''} verificada${stats.totalReviews !== 1 ? 's' : ''}`}
          icon={Star}
          iconColor="text-yellow-500"
        />
        <MetricCard
          label="Visitas al perfil"
          value={stats.profileViews}
          subtitle="Total desde tu registro"
          icon={Eye}
          iconColor="text-blue-500"
        />
        <MetricCard
          label="Seguimientos pendientes"
          value={stats.followupsPending}
          subtitle="Proximos 7 dias"
          icon={ClipboardList}
          iconColor="text-orange-500"
        />
      </div>

      {/* Row 2: Actividad clinica + reservas (4 cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Fichas compartidas"
          value={stats.sharedFichasThisWeek}
          subtitle="Ultimos 7 dias"
          icon={FileText}
          iconColor="text-green-600"
        />
        <MetricCard
          label="Reservas este mes"
          value={stats.bookingsThisMonth}
          subtitle={
            stats.estimatedRevenue > 0
              ? `${formatCLP(stats.estimatedRevenue)} completadas`
              : 'Via Paw Friend'
          }
          icon={Calendar}
          iconColor="text-indigo-500"
        />
        <MetricCard
          label="Resenas este mes"
          value={stats.reviewsThisMonth}
          subtitle={
            stats.invitationsSent > 0
              ? `${stats.invitationsConverted}/${stats.invitationsSent} invitaciones usadas`
              : 'Invita a tus clientes a opinar'
          }
          icon={Mail}
          iconColor="text-pink-500"
        />
        {stats.estimatedRevenue > 0 ? (
          <MetricCard
            label="Ingresos estimados"
            value={formatCLP(stats.estimatedRevenue)}
            subtitle="Reservas completadas este mes"
            icon={TrendingUp}
            iconColor="text-green-600"
          />
        ) : (
          <Card className="flex flex-col items-center justify-center p-4 text-center">
            <TrendingUp className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Ingresos</p>
            <p className="text-xs text-muted-foreground mt-1">Aparecen cuando completes reservas</p>
          </Card>
        )}
      </div>

      {/* Tabs: Pacientes */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>Tus pacientes atendidos en Paw Friend</CardDescription>
        </CardHeader>
        <CardContent>
          <VetPatientsList />
        </CardContent>
      </Card>

      {/* Promocionar servicios */}
      <CreateServicePromotion />
    </div>
  );
};

export default ProviderDashboard;
