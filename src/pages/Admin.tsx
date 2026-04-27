import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield,
  BarChart3,
  Briefcase,
  Users,
  DollarSign,
  FileText,
  Gamepad2,
  Megaphone,
  Settings,
  Activity,
  Calendar,
  Target,
  Bell,
  Search,
  Menu,
  ChevronsLeft,
  ChevronRight,
  User,
  Download,
  Trophy,
  RefreshCw,
} from '@/lib/icons';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

// Section components
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminServiceProviders from '@/components/admin/AdminServiceProviders';
import AdminProviders from '@/components/admin/AdminProviders';
import AdminVetsAtChurnRisk from '@/components/admin/AdminVetsAtChurnRisk';
import AdminShelters from '@/components/admin/AdminShelters';
import AdminVetVerifications from '@/components/admin/AdminVetVerifications';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminVerificationRequests from '@/components/admin/AdminVerificationRequests';
import AdminFinance from '@/components/admin/AdminFinance';
import AdminModeration from '@/components/admin/AdminModeration';
import AdminServicePromotions from '@/components/admin/AdminServicePromotions';
import AdminRewards from '@/components/admin/AdminRewards';
import AdminMissions from '@/components/admin/AdminMissions';
import AdManagement from '@/components/admin/AdManagement';
import AdminPartnerSubmissions from '@/components/admin/AdminPartnerSubmissions';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminPitchApplications from '@/components/admin/AdminPitchApplications';
import AdminPostAdoptionCheckins from '@/components/admin/AdminPostAdoptionCheckins';
import AdminSafetyLogs from '@/components/admin/AdminSafetyLogs';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminSystemHealth from '@/components/admin/AdminSystemHealth';
import AdminDataQuality from '@/components/admin/AdminDataQuality';
import AdminDataExport from '@/components/admin/AdminDataExport';
import AdminMigrationsStatus from '@/components/admin/AdminMigrationsStatus';
import AdminDeviceCompatibility from '@/components/admin/AdminDeviceCompatibility';
import AdminTeam from '@/components/admin/AdminTeam';
import AdminB2BApiKeys from '@/components/admin/AdminB2BApiKeys';
import AdminCorrelations from '@/components/admin/AdminCorrelations';
import AdminMasterKPIs from '@/components/admin/AdminMasterKPIs';
import AdminProjectHealth from '@/components/admin/AdminProjectHealth';
import AdminErrorLog from '@/components/admin/AdminErrorLog';
import AdminPendingPets from '@/components/admin/AdminPendingPets';
import AdminGhostUsers from '@/components/admin/AdminGhostUsers';
import AdminLeadsCRM from '@/components/admin/AdminLeadsCRM';
import AdminBookingsPanel from '@/components/admin/AdminBookingsPanel';
import AdminExports from '@/components/admin/AdminExports';
import AdminPawCompanys from '@/components/admin/AdminPawCompanys';
import AdminPawVoices from '@/components/admin/AdminPawVoices';
import AdminAdvertisements from '@/components/admin/AdminAdvertisements';

// Heavy sections lazy-loaded para no inflar el chunk inicial de /admin
// (AdminSalaInversion + AdminAnalytics usan Recharts; AdminFeedback es grande).
const AdminSalaInversion = lazy(() => import('@/components/admin/AdminSalaInversion'));
const AdminAnalytics = lazy(() => import('@/components/admin/AdminAnalytics'));
const AdminFeedback = lazy(() => import('@/components/admin/AdminFeedback'));

function SectionFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
      Cargando sección…
    </div>
  );
}
import { useAdminRealtimeSubscriptions } from '@/hooks/useAdminRealtimeSubscriptions';

/** Relativo compacto para el chip del boton "Refrescar todo". */
function formatRelativeShort(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return 'hace segundos';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 1) return 'hace <1m';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr}h`;
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Section definitions ──────────────────────────────────
interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  group: number;
}

const SECTIONS: Section[] = [
  // Group 1: Core
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, group: 1 },
  { id: 'sala-inversion', label: 'Sala de Inversion', icon: Trophy, group: 1 },
  { id: 'analytics', label: 'Analytics', icon: Activity, group: 1 },
  // Group 2: Operations
  { id: 'bookings', label: 'Reservas', icon: Calendar, group: 2 },
  { id: 'providers', label: 'Proveedores', icon: Briefcase, group: 2 },
  { id: 'users', label: 'Usuarios', icon: Users, group: 2 },
  { id: 'finance', label: 'Finanzas', icon: DollarSign, group: 2 },
  // Group 3: Content
  { id: 'content', label: 'Contenido', icon: FileText, group: 3 },
  { id: 'gamification', label: 'Gamificacion', icon: Gamepad2, group: 3 },
  // Group 4: Growth
  { id: 'commercial', label: 'Comercial', icon: Megaphone, group: 4 },
  { id: 'leads-crm', label: 'Leads Vets', icon: Target, group: 4 },
  // Group 5: System
  { id: 'exports', label: 'Exports', icon: Download, group: 5 },
  { id: 'system', label: 'Sistema', icon: Settings, group: 5 },
];

const GROUP_LABELS: Record<number, string> = {
  1: 'Core',
  2: 'Operaciones',
  3: 'Contenido',
  4: 'Crecimiento',
  5: 'Sistema',
};

// ── Section renderers with internal subtabs ──────────────
interface SubSectionProps {
  sub?: string;
  onSubChange?: (sub: string) => void;
}

function useSubState(initial: string, propSub?: string, onChange?: (s: string) => void) {
  const [internal, setInternal] = useState(propSub ?? initial);
  const current = propSub ?? internal;
  const setCurrent = (val: string) => {
    setInternal(val);
    onChange?.(val);
  };
  useEffect(() => {
    if (propSub && propSub !== internal) setInternal(propSub);
  }, [propSub]); // eslint-disable-line react-hooks/exhaustive-deps
  return [current, setCurrent] as const;
}

function ProvidersSection({ sub: propSub, onSubChange }: SubSectionProps) {
  const [sub, setSub] = useSubState('central', propSub, onSubChange);
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList>
          <TabsTrigger value="central">Todos</TabsTrigger>
          <TabsTrigger value="vets">Vets Colmevet</TabsTrigger>
          <TabsTrigger value="shelters">Refugios</TabsTrigger>
          <TabsTrigger value="churn">Churn risk</TabsTrigger>
          <TabsTrigger value="legacy">Legacy</TabsTrigger>
        </TabsList>
        <TabsContent value="central">
          <AdminServiceProviders />
        </TabsContent>
        <TabsContent value="vets">
          <AdminVetVerifications />
        </TabsContent>
        <TabsContent value="shelters">
          <AdminShelters />
        </TabsContent>
        <TabsContent value="churn">
          <AdminVetsAtChurnRisk />
        </TabsContent>
        <TabsContent value="legacy">
          <AdminProviders />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersSection({ sub: propSub, onSubChange }: SubSectionProps) {
  const [sub, setSub] = useSubState('users', propSub, onSubChange);
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList>
          <TabsTrigger value="users">Gestion</TabsTrigger>
          <TabsTrigger value="verifications">Verificaciones</TabsTrigger>
          <TabsTrigger value="pending-pets">Mascotas pendientes</TabsTrigger>
          <TabsTrigger value="ghost-users">Cuentas fantasma</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>
        <TabsContent value="verifications">
          <AdminVerificationRequests />
        </TabsContent>
        <TabsContent value="pending-pets">
          <AdminPendingPets />
        </TabsContent>
        <TabsContent value="ghost-users">
          <AdminGhostUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContentSection({ sub: propSub, onSubChange }: SubSectionProps) {
  const [sub, setSub] = useSubState('feedback', propSub, onSubChange);
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="moderation">Moderacion</TabsTrigger>
          <TabsTrigger value="promotions">Promociones</TabsTrigger>
        </TabsList>
        <TabsContent value="feedback">
          <AdminFeedback />
        </TabsContent>
        <TabsContent value="moderation">
          <AdminModeration />
        </TabsContent>
        <TabsContent value="promotions">
          <AdminServicePromotions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GamificationSection({ sub: propSub, onSubChange }: SubSectionProps) {
  const [sub, setSub] = useSubState('rewards', propSub, onSubChange);
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList>
          <TabsTrigger value="rewards">Paw Shop</TabsTrigger>
          <TabsTrigger value="missions">Misiones</TabsTrigger>
        </TabsList>
        <TabsContent value="rewards">
          <AdminRewards />
        </TabsContent>
        <TabsContent value="missions">
          <AdminMissions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommercialSection({ sub: propSub, onSubChange }: SubSectionProps) {
  const [sub, setSub] = useSubState('paw-companys', propSub, onSubChange);
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="paw-companys">Paw Companys</TabsTrigger>
          <TabsTrigger value="paw-voices">Paw Voices</TabsTrigger>
          <TabsTrigger value="advertisements">Publicidad</TabsTrigger>
          <TabsTrigger value="ads">Anuncios (legacy)</TabsTrigger>
          <TabsTrigger value="partners">Partners (legacy)</TabsTrigger>
        </TabsList>
        <TabsContent value="paw-companys">
          <AdminPawCompanys />
        </TabsContent>
        <TabsContent value="paw-voices">
          <AdminPawVoices />
        </TabsContent>
        <TabsContent value="advertisements">
          <AdminAdvertisements />
        </TabsContent>
        <TabsContent value="ads">
          <AdManagement />
        </TabsContent>
        <TabsContent value="partners">
          <AdminPartnerSubmissions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SystemSection({ sub: propSub, onSubChange }: SubSectionProps) {
  const [sub, setSub] = useSubState('config', propSub, onSubChange);
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="config">Configuracion</TabsTrigger>
          <TabsTrigger value="pitch-applications">Postulaciones</TabsTrigger>
          <TabsTrigger value="post-adoption">Post-adopcion</TabsTrigger>
          <TabsTrigger value="errors">Errores</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="data-quality">Calidad datos</TabsTrigger>
          <TabsTrigger value="export">Export CSV</TabsTrigger>
          <TabsTrigger value="migrations">Migraciones</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="safety">Seguridad</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="b2b-keys">API B2B</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="master-kpis">Master KPIs</TabsTrigger>
          <TabsTrigger value="project-health">Health $</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <AdminSettings />
        </TabsContent>
        <TabsContent value="pitch-applications">
          <AdminPitchApplications />
        </TabsContent>
        <TabsContent value="post-adoption">
          <AdminPostAdoptionCheckins />
        </TabsContent>
        <TabsContent value="errors">
          <AdminErrorLog />
        </TabsContent>
        <TabsContent value="health">
          <AdminSystemHealth />
        </TabsContent>
        <TabsContent value="data-quality">
          <AdminDataQuality />
        </TabsContent>
        <TabsContent value="export">
          <AdminDataExport />
        </TabsContent>
        <TabsContent value="migrations">
          <AdminMigrationsStatus />
        </TabsContent>
        <TabsContent value="devices">
          <AdminDeviceCompatibility />
        </TabsContent>
        <TabsContent value="safety">
          <AdminSafetyLogs />
        </TabsContent>
        <TabsContent value="audit">
          <AdminAuditLog />
        </TabsContent>
        <TabsContent value="team">
          <AdminTeam />
        </TabsContent>
        <TabsContent value="b2b-keys">
          <AdminB2BApiKeys />
        </TabsContent>
        <TabsContent value="correlations">
          <AdminCorrelations />
        </TabsContent>
        <TabsContent value="master-kpis">
          <AdminMasterKPIs />
        </TabsContent>
        <TabsContent value="project-health">
          <AdminProjectHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Notification count hook ──────────────────────────────
function useAdminPendingCounts() {
  return useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: async () => {
      const [providersRes, verificationsRes, moderationRes, voicesRes, companysRes] =
        await Promise.all([
          supabase
            .from('service_providers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('verification_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pendiente'),
          supabase
            .from('content_reports')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          // 2026-04-19: agregar Paw Voices pendientes al badge global.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('paw_voices' as any) as any)
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          // 2026-04-19: agregar Paw Companys pendientes al badge global.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('paw_companys' as any) as any)
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
        ]);
      return (
        (providersRes.count ?? 0) +
        (verificationsRes.count ?? 0) +
        (moderationRes.count ?? 0) +
        (voicesRes.count ?? 0) +
        (companysRes.count ?? 0)
      );
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ── Sidebar navigation component ─────────────────────────
function SidebarNav({
  activeSection,
  collapsed,
  onSelect,
  onToggleCollapse,
}: {
  activeSection: string;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onToggleCollapse: () => void;
}) {
  const groups = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col h-full">
      {/* Gradient overlay at top */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none z-10" />

      {/* Logo area */}
      <div
        className={cn(
          'relative z-20 flex items-center gap-3 px-4 py-5 border-b border-slate-800/60',
          collapsed && 'justify-center px-2'
        )}
      >
        <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 shrink-0">
          <Shield className="h-5 w-5 text-indigo-400" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">Paw Friend</h1>
            <p className="text-[10px] text-slate-500 truncate">Centro de Control</p>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {groups.map((group, gi) => {
          const items = SECTIONS.filter((s) => s.group === group);
          return (
            <div key={group}>
              {gi > 0 && <div className="my-2 mx-2 border-t border-slate-800/40" />}
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  {GROUP_LABELS[group]}
                </p>
              )}
              {items.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => onSelect(section.id)}
                    title={collapsed ? section.label : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 w-full rounded-md text-sm font-medium transition-all duration-150',
                      collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-indigo-400')} />
                    {!collapsed && <span className="truncate">{section.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:flex border-t border-slate-800/60 p-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full rounded-md py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronsLeft
            className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')}
          />
        </button>
      </div>
    </div>
  );
}

// ── Main Admin page ──────────────────────────────────────
const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get('section');
  const subFromUrl = searchParams.get('sub') ?? undefined;
  const validSectionIds = SECTIONS.map((s) => s.id);
  const initialSection =
    sectionFromUrl && validSectionIds.includes(sectionFromUrl) ? sectionFromUrl : 'dashboard';

  const [activeSection, setActiveSection] = useState(initialSection);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('pf_admin_sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(() => {
    try {
      const raw = localStorage.getItem('pf_admin_last_refresh');
      if (!raw) return null;
      const ts = Number(raw);
      return Number.isFinite(ts) ? new Date(ts) : null;
    } catch {
      return null;
    }
  });
  const queryClient = useQueryClient();

  // Botón global: invalida todas las queries del admin (prefix 'admin-*').
  // Util cuando el realtime se desconecto o el usuario volvio de pestaña
  // y quiere forzar actualizacion sin ir panel por panel.
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    try {
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = String(query.queryKey[0] ?? '');
          return key.startsWith('admin-') || key.startsWith('admin_');
        },
      });
      const now = new Date();
      setLastRefreshedAt(now);
      try {
        localStorage.setItem('pf_admin_last_refresh', String(now.getTime()));
      } catch {
        // noop si el storage falla (incognito, cuota)
      }
      toast.success('Admin actualizado — todos los paneles recargaron datos');
    } catch (err) {
      toast.error('No se pudo refrescar. Intenta de nuevo.');
      console.error(err);
    } finally {
      // Pequeno delay para que la animacion del spinner se vea aunque
      // las queries resuelvan rapido.
      setTimeout(() => setIsRefreshingAll(false), 500);
    }
  }, [queryClient]);

  // Re-render cada 30s para que la hora relativa del ultimo refresh
  // se mantenga fresca ("hace 2 minutos" -> "hace 3 minutos").
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    if (!lastRefreshedAt) return;
    const interval = setInterval(() => setRefreshTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [lastRefreshedAt]);
  // refreshTick solo fuerza re-render, lo referenciamos para que eslint no lo elimine.
  void refreshTick;

  useAdminRealtimeSubscriptions();

  const { data: pendingCount = 0 } = useAdminPendingCounts();

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('pf_admin_sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      // noop
    }
  }, [collapsed]);

  // Sync activeSection cuando cambia ?section en la URL
  useEffect(() => {
    if (sectionFromUrl && validSectionIds.includes(sectionFromUrl)) {
      setActiveSection(sectionFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionFromUrl]);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelectSection = useCallback(
    (id: string) => {
      setActiveSection(id);
      setMobileOpen(false);
      setCommandOpen(false);
      const next = new URLSearchParams(searchParams);
      if (id === 'dashboard') {
        next.delete('section');
      } else {
        next.set('section', id);
      }
      next.delete('sub');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleSubChange = useCallback(
    (sub: string) => {
      const next = new URLSearchParams(searchParams);
      if (!sub) {
        next.delete('sub');
      } else {
        next.set('sub', sub);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const activeLabel = SECTIONS.find((s) => s.id === activeSection)?.label ?? 'Dashboard';

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'sala-inversion':
        return <AdminSalaInversion />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'bookings':
        return <AdminBookingsPanel />;
      case 'providers':
        return <ProvidersSection sub={subFromUrl} onSubChange={handleSubChange} />;
      case 'users':
        return <UsersSection sub={subFromUrl} onSubChange={handleSubChange} />;
      case 'finance':
        return <AdminFinance />;
      case 'content':
        return <ContentSection sub={subFromUrl} onSubChange={handleSubChange} />;
      case 'gamification':
        return <GamificationSection sub={subFromUrl} onSubChange={handleSubChange} />;
      case 'commercial':
        return <CommercialSection sub={subFromUrl} onSubChange={handleSubChange} />;
      case 'leads-crm':
        return <AdminLeadsCRM />;
      case 'exports':
        return <AdminExports />;
      case 'system':
        return <SystemSection sub={subFromUrl} onSubChange={handleSubChange} />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 bg-slate-950 border-r border-slate-800 relative transition-all duration-200 overflow-hidden',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarNav
          activeSection={activeSection}
          collapsed={collapsed}
          onSelect={handleSelectSection}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* ── Mobile sidebar (Sheet) ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-slate-950 border-slate-800 lg:hidden">
          <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
          <SidebarNav
            activeSection={activeSection}
            collapsed={false}
            onSelect={handleSelectSection}
            onToggleCollapse={toggleCollapse}
          />
        </SheetContent>
      </Sheet>

      {/* ── Main area (topbar + content) ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ── Top bar ── */}
        <header className="flex items-center h-14 shrink-0 px-4 lg:px-6 bg-slate-900 border-b border-slate-800 gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0 shrink-0">
            <span className="text-slate-500 hidden sm:inline">Centro de Control</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600 hidden sm:block" />
            <span className="text-slate-200 font-medium truncate">{activeLabel}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Command palette trigger */}
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-md border border-slate-700 bg-slate-800/50 text-slate-400 text-xs hover:border-slate-600 hover:text-slate-300 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Buscar...</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-slate-700/60 text-[10px] font-mono text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          {/* Refrescar todo + timestamp del ultimo refresh */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshingAll}
              title={
                lastRefreshedAt
                  ? `Ultimo refresh: ${lastRefreshedAt.toLocaleString('es-CL')}`
                  : 'Refresca todos los paneles del admin a la vez (equivale a entrar a cada uno y tocar su boton refresh)'
              }
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-700 bg-slate-800/50 text-slate-300 text-xs hover:border-indigo-500/40 hover:text-indigo-300 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshingAll && 'animate-spin')} />
              <span className="hidden md:inline">
                {isRefreshingAll ? 'Refrescando...' : 'Refrescar todo'}
              </span>
            </button>
            {lastRefreshedAt && !isRefreshingAll && (
              <span
                className="hidden lg:inline text-[10px] text-slate-500 italic"
                aria-label={`Ultimo refresh: ${lastRefreshedAt.toLocaleString('es-CL')}`}
              >
                {formatRelativeShort(lastRefreshedAt)}
              </span>
            )}
          </div>

          {/* Notification bell */}
          <button className="relative p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>

          {/* User avatar placeholder */}
          <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
            <User className="h-4 w-4 text-slate-400" />
          </div>
        </header>

        {/* ── Content area ── */}
        <main
          className="admin-main flex-1 overflow-y-auto bg-slate-950 px-4 lg:px-6 py-5"
          style={{ scrollbarGutter: 'stable', scrollbarColor: '#334155 transparent' }}
        >
          <Suspense fallback={<SectionFallback />}>{renderSection()}</Suspense>
        </main>
      </div>

      {/* ── Command palette ── */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Buscar seccion..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Secciones">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <CommandItem
                  key={section.id}
                  value={section.label}
                  onSelect={() => handleSelectSection(section.id)}
                >
                  <Icon className="mr-2 h-4 w-4 text-slate-400" />
                  <span>{section.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default Admin;
