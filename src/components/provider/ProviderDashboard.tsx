import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCLP } from '@/lib/format';
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
} from '@/lib/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

import { QuickActionsBar, type DashboardPeriod } from './dashboard/QuickActionsBar';
import { ProviderBookingsInbox } from './ProviderBookingsInbox';
import { AlertsBanner } from './dashboard/AlertsBanner';
import { InteractiveMetricCard } from './dashboard/InteractiveMetricCard';
import { ClinicalTab } from './dashboard/ClinicalTab';
import { BusinessTab } from './dashboard/BusinessTab';
import { PatientsTab } from './dashboard/PatientsTab';
import { PendingVetLinksCard } from './PendingVetLinksCard';
import { NewPatientForm } from './NewPatientForm';
import { ViewTutorial, TUTORIALS } from '@/components/ViewTutorial';
import { Next24hCard } from './Next24hCard';
import { MiniProfileCard } from './dashboard/MiniProfileCard';
import { VetExposureTips } from './dashboard/VetExposureTips';
import { GoogleCalendarStatusBanner } from '@/components/GoogleCalendarStatusBanner';
import { UpgradePlanBanner } from './dashboard/UpgradePlanBanner';

// formatCLP imported from @/lib/format

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
      <GoogleCalendarStatusBanner settingsHref="/profile" />
      <UpgradePlanBanner />

      {/* ═══ Header + Quick Actions ═══ */}
      <QuickActionsBar
        displayName={profile?.display_name || user?.email?.split('@')[0] || 'Doc'}
        period={period}
        onPeriodChange={setPeriod}
        onNewPatient={() => setShowNewPatient(true)}
        onRecordConsultation={() => setActiveTab('clinico')}
      />

      {/* ═══ Two-column layout: Metrics+Alerts (left) + Next24h+Actions (right) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: 2/3 width — Metrics */}
        <div className="lg:col-span-2 space-y-3">
          {/* Metric cards 2x3 → 3x2 */}
          <div className="grid grid-cols-3 gap-2">
            <InteractiveMetricCard
              label="Pacientes"
              value={stats.patientsThisMonth}
              subtitle={`${stats.notesThisMonth} nota${stats.notesThisMonth !== 1 ? 's' : ''}`}
              icon={Users}
              iconColor="text-teal-600"
              accentColor="#0d9488"
              onClick={() => setActiveTab('pacientes')}
              tooltip="Mascotas unicas atendidas"
              tooltipWhere="Pacientes"
            />
            <InteractiveMetricCard
              label="Reservas"
              value={stats.bookingsThisMonth}
              subtitle="Este mes"
              icon={Calendar}
              iconColor="text-slate-500"
              accentColor="#64748b"
              onClick={() => setActiveTab('negocio')}
              tooltip="Reservas agendadas"
              tooltipWhere="Reservas"
            />
            <InteractiveMetricCard
              label="Ingresos"
              value={stats.estimatedRevenue > 0 ? formatCLP(stats.estimatedRevenue) : '$0'}
              subtitle="Este mes"
              icon={TrendingUp}
              iconColor="text-emerald-600"
              accentColor="#059669"
              onClick={() => setActiveTab('negocio')}
              tooltip="Reservas completadas"
              tooltipWhere="Negocio"
            />
            <InteractiveMetricCard
              label="Rating"
              value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
              subtitle={`${stats.totalReviews} resena${stats.totalReviews !== 1 ? 's' : ''}`}
              icon={Star}
              iconColor="text-amber-500"
              accentColor="#d97706"
              onClick={() => setActiveTab('negocio')}
              tooltip="Promedio resenas"
              tooltipWhere="Resenas"
            />
            <InteractiveMetricCard
              label="Seguimientos"
              value={stats.followupsPending}
              subtitle="7 dias"
              icon={ClipboardList}
              iconColor="text-orange-500"
              accentColor="#f97316"
              onClick={() => setActiveTab('clinico')}
              tooltip="Seguimientos programados"
              tooltipWhere="Clinico"
            />
            <InteractiveMetricCard
              label="Fichas"
              value={stats.sharedFichasThisWeek}
              subtitle="7 dias"
              icon={FileText}
              iconColor="text-blue-500"
              accentColor="#3b82f6"
              onClick={() => setActiveTab('clinico')}
              tooltip="Fichas compartidas"
              tooltipWhere="Clinico"
            />
          </div>

          {/* Alerts banner (compact) */}
          <AlertsBanner
            followupsPending={stats.followupsPending}
            sharedFichasThisWeek={stats.sharedFichasThisWeek}
            pendingLinksCount={pendingLinksCount}
            onClickFollowups={() => setActiveTab('clinico')}
            onClickFichas={() => setActiveTab('clinico')}
            onClickLinks={() => setActiveTab('clinico')}
          />
        </div>

        {/* Right: 1/3 width — Next 24h + Profile links */}
        <div className="space-y-3">
          <MiniProfileCard
            slug={stats.slug}
            avgRating={stats.avgRating}
            totalReviews={stats.totalReviews}
            isDirectoryVisible={stats.isDirectoryVisible}
            profileViews={stats.profileViews}
          />
          <Next24hCard />
          <PendingVetLinksCard />
        </div>
      </div>

      {/* ═══ Tabbed Content ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reservas" className="text-xs sm:text-sm gap-1">
            <Calendar className="h-3.5 w-3.5 hidden sm:inline-block" />
            Reservas
          </TabsTrigger>
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

        <TabsContent value="reservas" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ProviderBookingsInbox providerId={stats.providerId} />
            </div>
            <div className="lg:col-span-1">
              <VetExposureTips
                slug={stats.slug}
                isDirectoryVisible={stats.isDirectoryVisible}
                profileViews={stats.profileViews}
                avgRating={stats.avgRating}
                totalReviews={stats.totalReviews}
                bookingsThisMonth={stats.bookingsThisMonth}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clinico" className="mt-3">
          <ClinicalTab providerId={stats.providerId} />
        </TabsContent>

        <TabsContent value="negocio" className="mt-3">
          <BusinessTab
            stats={stats}
            vetSummary={vetAnalytics?.summary ?? null}
            bookingsTimeline={vetAnalytics?.bookingsTimeline ?? []}
            serviceBreakdown={vetAnalytics?.serviceBreakdown ?? []}
          />
        </TabsContent>

        <TabsContent value="pacientes" className="mt-3">
          <PatientsTab onNewPatient={() => setShowNewPatient(true)} />
        </TabsContent>
      </Tabs>

      {/* Onboarding: vet sin actividad (compact) */}
      {!hasActivity && (
        <Card className="border-teal-200 bg-teal-50/30">
          <CardContent className="p-3 space-y-1.5">
            <p className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" /> Primeros pasos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <Link
                to="/provider/profile-edit"
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-teal-100 hover:shadow-sm transition text-xs"
              >
                <span className="text-teal-600 font-bold">1</span>
                <span>Completa tu perfil</span>
              </Link>
              {stats.slug && (
                <Link
                  to={`/veterinarios/${stats.slug}`}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-teal-100 hover:shadow-sm transition text-xs"
                >
                  <span className="text-teal-600 font-bold">2</span>
                  <span>Vista previa publica</span>
                </Link>
              )}
              <Link
                to={stats.slug ? `/veterinarios/${stats.slug}` : '/provider/profile-edit'}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-teal-100 hover:shadow-sm transition text-xs"
              >
                <span className="text-teal-600 font-bold">3</span>
                <span>Comparte tu URL</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <ViewTutorial {...TUTORIALS.providerDashboard} />

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
