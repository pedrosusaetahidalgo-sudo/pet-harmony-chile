import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProviderDashboardStats } from '@/hooks/useProviderDashboardStats';
import { useVetAnalytics } from '@/hooks/useVetAnalytics';
import { usePendingVetLinks } from '@/hooks/usePetVetLinks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Calendar,
  TrendingUp,
  Star,
  ClipboardList,
  FileText,
  Stethoscope,
  BarChart3,
  PawPrint,
  Loader2,
  AlertCircle,
  UserCog,
  Eye,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { QuickActionsBar, type DashboardPeriod } from './dashboard/QuickActionsBar';
import { AlertsBanner } from './dashboard/AlertsBanner';
import { InteractiveMetricCard } from './dashboard/InteractiveMetricCard';
import { ClinicalTab } from './dashboard/ClinicalTab';
import { BusinessTab } from './dashboard/BusinessTab';
import { PatientsTab } from './dashboard/PatientsTab';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { PendingVetLinksCard } from './PendingVetLinksCard';
import { NewPatientForm } from './NewPatientForm';

const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useProviderDashboardStats();
  const [period, setPeriod] = useState<DashboardPeriod>('current_month');
  const [activeTab, setActiveTab] = useState('clinico');
  const [showNewPatient, setShowNewPatient] = useState(false);

  // Fetch display name
  const { data: profile } = useQuery({
    queryKey: ['profile-display', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Vet analytics for business tab
  const { data: vetAnalytics } = useVetAnalytics({ period });

  // Pending links count for alerts
  const { data: pendingLinks } = usePendingVetLinks();
  const pendingLinksCount = pendingLinks?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-muted-foreground">Error al cargar el dashboard</p>
      </div>
    );
  }

  const hasActivity = stats.patientsThisMonth > 0 || stats.bookingsThisMonth > 0;

  return (
    <div className="space-y-4">
      {/* ═══ Zona A: Quick Actions Bar ═══ */}
      <QuickActionsBar
        displayName={profile?.display_name || user?.email?.split('@')[0] || 'Doc'}
        period={period}
        onPeriodChange={setPeriod}
        onNewPatient={() => setShowNewPatient(true)}
        onRecordConsultation={() => setActiveTab('clinico')}
      />

      {/* Profile links */}
      <div className="flex gap-2 flex-wrap">
        {stats.slug && (
          <Link to={`/veterinarios/${stats.slug}`}>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              <Eye className="h-3.5 w-3.5" /> Ver perfil publico
            </Button>
          </Link>
        )}
        <Link to="/provider/profile-edit">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <UserCog className="h-3.5 w-3.5" /> Editar perfil
          </Button>
        </Link>
      </div>

      {/* ═══ Zona B: Alerts ═══ */}
      <PendingVetLinksCard />
      <AlertsBanner
        followupsPending={stats.followupsPending}
        sharedFichasThisWeek={stats.sharedFichasThisWeek}
        pendingLinksCount={pendingLinksCount}
        onClickFollowups={() => setActiveTab('clinico')}
        onClickFichas={() => setActiveTab('clinico')}
        onClickLinks={() => setActiveTab('clinico')}
      />

      {/* ═══ Zona C: Interactive Metric Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InteractiveMetricCard
          label="Pacientes"
          value={stats.patientsThisMonth}
          subtitle={`${stats.notesThisMonth} nota${stats.notesThisMonth !== 1 ? 's' : ''}`}
          icon={Users}
          iconColor="text-purple-600"
          accentColor="#9333ea"
          onClick={() => setActiveTab('pacientes')}
        />
        <InteractiveMetricCard
          label="Reservas"
          value={stats.bookingsThisMonth}
          subtitle="Este mes"
          icon={Calendar}
          iconColor="text-indigo-500"
          accentColor="#6366f1"
          onClick={() => setActiveTab('negocio')}
        />
        <InteractiveMetricCard
          label="Ingresos"
          value={stats.estimatedRevenue > 0 ? formatCLP(stats.estimatedRevenue) : '$0'}
          subtitle="Este mes"
          icon={TrendingUp}
          iconColor="text-green-600"
          accentColor="#16a34a"
          onClick={() => setActiveTab('negocio')}
        />
        <InteractiveMetricCard
          label="Calificacion"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
          subtitle={`${stats.totalReviews} resena${stats.totalReviews !== 1 ? 's' : ''}`}
          icon={Star}
          iconColor="text-yellow-500"
          accentColor="#eab308"
          onClick={() => setActiveTab('negocio')}
        />
        <InteractiveMetricCard
          label="Seguimientos"
          value={stats.followupsPending}
          subtitle="Proximos 7 dias"
          icon={ClipboardList}
          iconColor="text-orange-500"
          accentColor="#f97316"
          onClick={() => setActiveTab('clinico')}
        />
        <InteractiveMetricCard
          label="Fichas"
          value={stats.sharedFichasThisWeek}
          subtitle="Ultimos 7 dias"
          icon={FileText}
          iconColor="text-blue-500"
          accentColor="#3b82f6"
          onClick={() => setActiveTab('clinico')}
        />
      </div>

      {/* ═══ Zona D: Tabbed Content ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clinico" className="text-xs sm:text-sm gap-1">
            <Stethoscope className="h-3.5 w-3.5 hidden sm:inline-block" />
            Clinico
          </TabsTrigger>
          <TabsTrigger value="negocio" className="text-xs sm:text-sm gap-1">
            <BarChart3 className="h-3.5 w-3.5 hidden sm:inline-block" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="pacientes" className="text-xs sm:text-sm gap-1">
            <PawPrint className="h-3.5 w-3.5 hidden sm:inline-block" />
            Pacientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinico" className="mt-4">
          <ClinicalTab providerId={stats.providerId} />
        </TabsContent>

        <TabsContent value="negocio" className="mt-4">
          <BusinessTab
            stats={stats}
            vetSummary={vetAnalytics?.summary ?? null}
            bookingsTimeline={vetAnalytics?.bookingsTimeline ?? []}
          />
        </TabsContent>

        <TabsContent value="pacientes" className="mt-4">
          <PatientsTab onNewPatient={() => setShowNewPatient(true)} />
        </TabsContent>
      </Tabs>

      {/* ═══ Zona E: Activity Feed ═══ */}
      <ActivityFeed />

      {/* Onboarding: vet sin actividad */}
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

      {/* New Patient Dialog */}
      <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo paciente</DialogTitle>
          </DialogHeader>
          <NewPatientForm onCreated={() => setShowNewPatient(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderDashboard;
