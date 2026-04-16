import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
} from '@/lib/icons';

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
}

const SECTIONS: Section[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'providers', label: 'Proveedores', icon: Briefcase },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'finance', label: 'Finanzas', icon: DollarSign },
  { id: 'content', label: 'Contenido', icon: FileText },
  { id: 'gamification', label: 'Gamificación', icon: Gamepad2 },
  { id: 'commercial', label: 'Comercial', icon: Megaphone },
  { id: 'leads-crm', label: 'Leads Vets', icon: Target },
  { id: 'system', label: 'Sistema', icon: Settings },
];

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
          <TabsTrigger value="users">Gestión</TabsTrigger>
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
          <TabsTrigger value="moderation">Moderación</TabsTrigger>
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
          <TabsTrigger value="config">Configuración</TabsTrigger>
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

// ── Main Admin page ──────────────────────────────────────
const Admin = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="w-full px-4 md:px-6 py-4 md:py-6">
        {/* Header compacto + tabs horizontales */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <Shield className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="mr-4">
            <h1 className="text-lg font-semibold tracking-tight text-white leading-tight">
              Centro de Control
            </h1>
            <p className="text-xs text-slate-400">Paw Friend Admin</p>
          </div>
          {/* Tabs horizontales inline con el header */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-1">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content — full width */}
        <main className="w-full">{renderSection()}</main>
      </div>
    </div>
  );
};

export default Admin;
