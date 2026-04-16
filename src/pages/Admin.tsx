import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
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
  Target,
  Bell,
  Search,
  Menu,
  ChevronsLeft,
  ChevronRight,
  User,
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
import AdminSafetyLogs from '@/components/admin/AdminSafetyLogs';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminSystemHealth from '@/components/admin/AdminSystemHealth';
import AdminTeam from '@/components/admin/AdminTeam';
import AdminErrorLog from '@/components/admin/AdminErrorLog';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminPendingPets from '@/components/admin/AdminPendingPets';
import AdminLeadsCRM from '@/components/admin/AdminLeadsCRM';
import AdminFeedback from '@/components/admin/AdminFeedback';

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
  { id: 'analytics', label: 'Analytics', icon: Activity, group: 1 },
  // Group 2: Operations
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
function ProvidersSection() {
  const [sub, setSub] = useState('central');
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList>
          <TabsTrigger value="central">Todos</TabsTrigger>
          <TabsTrigger value="vets">Vets Colmevet</TabsTrigger>
          <TabsTrigger value="legacy">Legacy</TabsTrigger>
        </TabsList>
        <TabsContent value="central">
          <AdminServiceProviders />
        </TabsContent>
        <TabsContent value="vets">
          <AdminVetVerifications />
        </TabsContent>
        <TabsContent value="legacy">
          <AdminProviders />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersSection() {
  const [sub, setSub] = useState('users');
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList>
          <TabsTrigger value="users">Gestion</TabsTrigger>
          <TabsTrigger value="verifications">Verificaciones</TabsTrigger>
          <TabsTrigger value="pending-pets">Mascotas pendientes</TabsTrigger>
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
      </Tabs>
    </div>
  );
}

function ContentSection() {
  const [sub, setSub] = useState('feedback');
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

function GamificationSection() {
  const [sub, setSub] = useState('rewards');
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

function CommercialSection() {
  const [sub, setSub] = useState('ads');
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList>
          <TabsTrigger value="ads">Anuncios</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
        </TabsList>
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

function SystemSection() {
  const [sub, setSub] = useState('config');
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="config">Configuracion</TabsTrigger>
          <TabsTrigger value="errors">Errores</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="safety">Seguridad</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <AdminSettings />
        </TabsContent>
        <TabsContent value="errors">
          <AdminErrorLog />
        </TabsContent>
        <TabsContent value="health">
          <AdminSystemHealth />
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
      </Tabs>
    </div>
  );
}

// ── Notification count hook ──────────────────────────────
function useAdminPendingCounts() {
  return useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: async () => {
      const [providersRes, verificationsRes, moderationRes] = await Promise.all([
        supabase
          .from('service_providers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('role_verification_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('content_reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);
      return (providersRes.count ?? 0) + (verificationsRes.count ?? 0) + (moderationRes.count ?? 0);
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
  const [activeSection, setActiveSection] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('pf_admin_sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const { data: pendingCount = 0 } = useAdminPendingCounts();

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('pf_admin_sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      // noop
    }
  }, [collapsed]);

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

  const handleSelectSection = useCallback((id: string) => {
    setActiveSection(id);
    setMobileOpen(false);
    setCommandOpen(false);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const activeLabel = SECTIONS.find((s) => s.id === activeSection)?.label ?? 'Dashboard';

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'providers':
        return <ProvidersSection />;
      case 'users':
        return <UsersSection />;
      case 'finance':
        return <AdminFinance />;
      case 'content':
        return <ContentSection />;
      case 'gamification':
        return <GamificationSection />;
      case 'commercial':
        return <CommercialSection />;
      case 'leads-crm':
        return <AdminLeadsCRM />;
      case 'system':
        return <SystemSection />;
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
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">{renderSection()}</main>
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
