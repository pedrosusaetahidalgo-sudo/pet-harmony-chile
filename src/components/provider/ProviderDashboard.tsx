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
  Mic,
} from '@/lib/icons';
import { ProviderDirectoryCard } from './ProviderDirectoryCard';
import { SharedFichasCard } from './SharedFichasCard';
import { PendingVetLinksCard } from './PendingVetLinksCard';
import { LinkedPatientsCard } from './LinkedPatientsCard';
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Mi consultorio</h2>
          <p className="text-sm text-muted-foreground">Resumen de tu actividad y reputación</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {stats.slug && (
            <Link to={`/veterinarios/${stats.slug}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-3.5 w-3.5 mr-1" /> Ver perfil
              </Button>
            </Link>
          )}
          <Link to="/provider/profile-edit">
            <Button variant="outline" size="sm">
              <UserCog className="h-3.5 w-3.5 mr-1" /> Editar perfil
            </Button>
          </Link>
        </div>
      </div>

      {/* Solicitudes pendientes — banner urgente arriba de todo */}
      <PendingVetLinksCard />

      {/* Hero metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Pacientes"
          value={stats.patientsThisMonth}
          subtitle={`${stats.notesThisMonth} nota${stats.notesThisMonth !== 1 ? 's' : ''}`}
          icon={Users}
          iconColor="text-purple-600"
        />
        <MetricCard
          label="Calificación"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
          subtitle={`${stats.totalReviews} reseña${stats.totalReviews !== 1 ? 's' : ''}`}
          icon={Star}
          iconColor="text-yellow-500"
        />
        <MetricCard
          label="Visitas perfil"
          value={stats.profileViews}
          subtitle="Total acumulado"
          icon={Eye}
          iconColor="text-blue-500"
        />
        <MetricCard
          label="Seguimientos"
          value={stats.followupsPending}
          subtitle="Próximos 7 días"
          icon={ClipboardList}
          iconColor="text-orange-500"
        />
      </div>

      {/* Grid 2 zonas: clinico (izq) + admin (der) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Zona izquierda: operacion clinica (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Agenda de hoy */}
          <TodayAgendaCard />

          {/* Fichas compartidas */}
          <SharedFichasCard providerId={stats.providerId} />

          {/* Pacientes vinculados */}
          <LinkedPatientsCard />

          {/* Actividad reciente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Actividad reciente</CardTitle>
              <CardDescription className="text-xs">
                Pacientes atendidos en Paw Friend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VetPatientsList />
            </CardContent>
          </Card>
        </div>

        {/* Zona derecha: admin + perfil (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mini perfil publico */}
          <ProviderDirectoryCard />

          {/* Seguimientos de esta semana */}
          <VetFollowupsCard />

          {/* Stats secundarias compactas */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Fichas"
              value={stats.sharedFichasThisWeek}
              subtitle="Últimos 7 días"
              icon={FileText}
              iconColor="text-green-600"
            />
            <MetricCard
              label="Reservas"
              value={stats.bookingsThisMonth}
              subtitle="Este mes"
              icon={Calendar}
              iconColor="text-indigo-500"
            />
            <MetricCard
              label="Reseñas"
              value={stats.reviewsThisMonth}
              subtitle={
                stats.invitationsSent > 0
                  ? `${stats.invitationsConverted}/${stats.invitationsSent} usadas`
                  : 'Invita a opinar'
              }
              icon={Mail}
              iconColor="text-pink-500"
            />
            {stats.estimatedRevenue > 0 ? (
              <MetricCard
                label="Ingresos"
                value={formatCLP(stats.estimatedRevenue)}
                subtitle="Este mes"
                icon={TrendingUp}
                iconColor="text-green-600"
              />
            ) : (
              <Card>
                <CardContent className="py-3 px-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                      Ingresos
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Al completar reservas</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tip: grabación de consultas */}
          <Card className="border-red-100 bg-gradient-to-r from-red-50 to-orange-50">
            <CardContent className="py-3 px-3 flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-md flex-shrink-0">
                <Mic className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Graba consultas con IA</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Usa "Grabar" en fichas compartidas para generar notas automáticas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onboarding: vet sin actividad — solo si no tiene actividad */}
      {!hasActivity && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-purple-600" />
              Primeros pasos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/provider/profile-edit" className="block">
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                <div>
                  <p className="text-xs font-semibold">1. Completa tu perfil publico</p>
                  <p className="text-[11px] text-muted-foreground">
                    Foto, bio, especialidades, comuna.
                  </p>
                </div>
                <span className="text-purple-400">→</span>
              </div>
            </Link>
            {stats.slug && (
              <Link to={`/veterinarios/${stats.slug}`} className="block">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                  <div>
                    <p className="text-xs font-semibold">2. Revisa como te ven los duenos</p>
                    <p className="text-[11px] text-muted-foreground">Abre tu perfil publico.</p>
                  </div>
                  <span className="text-purple-400">→</span>
                </div>
              </Link>
            )}
            <Link to="/veterinarios" className="block">
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                <div>
                  <p className="text-xs font-semibold">3. Comparte tu URL</p>
                  <p className="text-[11px] text-muted-foreground">Instagram, WhatsApp, tu red.</p>
                </div>
                <span className="text-purple-400">→</span>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Promocionar servicios */}
      <CreateServicePromotion />
    </div>
  );
};

export default ProviderDashboard;
