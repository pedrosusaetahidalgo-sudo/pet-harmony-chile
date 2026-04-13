import { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  MessageSquare,
  PawPrint,
  RefreshCw,
  LogOut,
  Settings,
  Map,
  Gamepad2,
  UserCog,
  LayoutDashboard,
  Home as HomeIcon,
  Search,
  Briefcase,
  Activity,
  Users,
  Scissors,
  Lock,
  Sparkles,
  Trophy,
  Droplets,
  Star,
  Eye,
  Stethoscope,
  Bell,
  BarChart3,
  Shield,
} from '@/lib/icons';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { LINKS } from '@/lib/links';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';

import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSidebarTutorial } from '@/hooks/useSidebarTutorial';
import { SidebarTutorialDialog } from '@/components/SidebarTutorialDialog';
import { getTutorialBySection, SECTION_ORDER, type SectionKey } from '@/lib/sidebarTutorialContent';
import { Badge } from '@/components/ui/badge';
import { PremiumBadge } from '@/components/PremiumBadge';
import { usePlan } from '@/hooks/usePlan';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

// Sidebar organizado en grupos semánticos para mejor navegación
const healthItems = [
  { title: 'Inicio', url: '/home', icon: HomeIcon },
  { title: 'My Paws', url: '/my-pets', icon: PawPrint },
  { title: 'Recordatorios', url: '/reminders', icon: Calendar },
  { title: 'Rutinas', url: '/rutinas', icon: RefreshCw },
  { title: 'Calendario', url: '/calendario', icon: CalendarDays },
];

const discoverItems = [
  { title: 'Buscar vet', url: '/veterinarios', icon: Search },
  { title: 'Servicios', url: '/servicios', icon: Briefcase },
  { title: 'Mapa', url: '/maps', icon: Map },
  { title: 'Banco de sangre', url: '/donantes-sangre', icon: Droplets },
];

const communityItems = [
  { title: 'Feed', url: '/feed', icon: Activity },
  { title: 'Comunidad', url: '/comunidad', icon: Users },
  { title: 'Mensajes', url: '/chat', icon: MessageSquare },
  { title: 'Coleccion', url: '/paw-collection', icon: Trophy },
  { title: 'Misiones', url: '/misiones', icon: Star },
  { title: 'Paw Game', url: '/paw-game', icon: Gamepad2 },
];

/** Mapeo sección → items */
const SECTION_ITEMS: Record<SectionKey, typeof healthItems> = {
  salud: healthItems,
  descubrir: discoverItems,
  comunidad: communityItems,
};

/** Mapeo sección → label */
const SECTION_LABELS: Record<SectionKey, string> = {
  salud: 'Salud',
  descubrir: 'Descubrir',
  comunidad: 'Comunidad',
};

// Secciones profesionales (modo provider)
const providerConsultItems = [
  { title: 'Dashboard', url: '/provider/dashboard', icon: LayoutDashboard },
  { title: 'Pacientes', url: '/provider/pacientes', icon: Users },
  { title: 'Mis reservas', url: '/mis-reservas', icon: Calendar },
  { title: 'Calendario', url: '/calendario', icon: CalendarDays },
];

const providerCommsItems = [
  { title: 'Mensajes', url: '/chat', icon: MessageSquare },
  { title: 'Seguimientos', url: '/provider/dashboard', icon: Bell },
];

const providerBusinessItems = [
  { title: 'Perfil público', url: '/provider/profile-edit', icon: UserCog },
  { title: 'Panel Pro', url: '/panel-pro', icon: Star },
  { title: 'Reportes', url: '/reportes', icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const currentPath = location.pathname;
  const { role, isProvider } = useActiveRole();
  const { isAdmin } = useIsAdmin();
  const { isPremium } = usePlan();
  const showPremiumBadges = isFeatureEnabled('USER_PREMIUM') && !isPremium;

  const {
    loaded: tutorialLoaded,
    isAllComplete,
    isSectionUnlocked,
    completeSection,
    dismissAll,
    nextPendingSection,
  } = useSidebarTutorial();

  const [activeTutorial, setActiveTutorial] = useState<SectionKey | null>(null);

  const { data: userPets } = useQuery({
    queryKey: ['user-pets-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('pets').select('id').eq('owner_id', user.id).limit(1);
      return data || [];
    },
    enabled: !!user?.id,
  });
  const hasPets = (userPets?.length ?? 0) > 0;

  // ¿El usuario es peluquero? (groomer_profiles es tabla aparte)
  const { data: groomerRow } = useQuery({
    queryKey: ['user-is-groomer', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('groomer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const isGroomer = !!groomerRow;

  const handleSignOut = async () => {
    await signOut();
    navigate(LINKS.auth());
  };

  const handleNavigate = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) => currentPath === path;

  /** Click en un item de sección bloqueada → abre tutorial */
  const handleLockedClick = (sectionKey: SectionKey) => {
    setActiveTutorial(sectionKey);
  };

  const handleTutorialComplete = () => {
    if (activeTutorial) {
      completeSection(activeTutorial);
      setActiveTutorial(null);
    }
  };

  const activeTutorialData = activeTutorial ? getTutorialBySection(activeTutorial) : null;

  return (
    <>
      <Sidebar
        collapsible={isMobile ? 'offcanvas' : 'none'}
        className="border-r border-border/40 w-[200px] h-screen sticky top-0"
      >
        <SidebarHeader className="p-2 pb-1">
          <button
            onClick={() => handleNavigate('/home')}
            className="flex items-center gap-2.5 px-2 py-1.5 w-full hover:opacity-80 transition-opacity cursor-pointer rounded-lg"
          >
            <img
              src="/paw_friend_icon_principal.svg"
              alt="Paw Friend"
              className="h-8 w-8 flex-shrink-0"
            />
            <span className="font-bold text-sm whitespace-nowrap">
              <span className="text-purple-800">paw</span>
              <span className="text-purple-500 ml-0.5">friend</span>
            </span>
          </button>
        </SidebarHeader>

        <SidebarContent className="px-2 overflow-y-auto overflow-x-hidden">
          {role === 'owner' ? (
            <>
              {/* Banner de bienvenida cuando hay tutorial pendiente */}
              {tutorialLoaded && !isAllComplete && (
                <div className="mx-1 mb-1 p-2.5 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-purple-800 leading-tight">
                        Recorre cada sección para desbloquearla
                      </p>
                      <button
                        onClick={dismissAll}
                        className="text-[9px] text-purple-500 hover:text-purple-700 underline mt-0.5"
                      >
                        Saltar tutorial
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Secciones de dueño ── */}
              {SECTION_ORDER.map((sectionKey, idx) => {
                const unlocked = isAllComplete || isSectionUnlocked(sectionKey);
                const items = SECTION_ITEMS[sectionKey];
                const label = SECTION_LABELS[sectionKey];

                return (
                  <div key={sectionKey}>
                    {idx > 0 && <Separator className="mx-2 my-0.5" />}
                    <SidebarGroup className="py-0.5">
                      <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5 flex items-center gap-1.5">
                        <span className={cn(!unlocked && 'text-muted-foreground/50')}>{label}</span>
                        {!unlocked && <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />}
                      </SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu className="space-y-0">
                          {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                isActive={unlocked && isActive(item.url)}
                                onClick={() =>
                                  unlocked
                                    ? handleNavigate(item.url)
                                    : handleLockedClick(sectionKey)
                                }
                                className={cn(
                                  'h-7 text-xs rounded-md transition-all',
                                  !unlocked && 'opacity-40 grayscale hover:opacity-60'
                                )}
                              >
                                <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{item.title}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </div>
                );
              })}

              {/* Link compacto a consultorio para dual-role */}
              {isProvider && (
                <>
                  <Separator className="mx-2 my-0.5" />
                  <SidebarGroup className="py-0.5">
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-0">
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            isActive={isActive('/provider/dashboard')}
                            onClick={() => handleNavigate('/provider/dashboard')}
                            className="h-7 text-xs rounded-md text-teal-700"
                          >
                            <Stethoscope className="h-3.5 w-3.5 flex-shrink-0 text-teal-500" />
                            <span>Mi consultorio</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}

              {/* ADMIN (solo si tiene rol admin) */}
              {isAdmin && (
                <>
                  <Separator className="mx-2 my-0.5" />
                  <SidebarGroup className="py-0.5">
                    <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5 flex items-center gap-1.5">
                      <span className="text-purple-600">Admin</span>
                      <Shield className="h-2.5 w-2.5 text-purple-500" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-0">
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            isActive={isActive('/admin')}
                            onClick={() => handleNavigate('/admin')}
                            className="h-7 text-xs rounded-md"
                          >
                            <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Panel admin</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}
            </>
          ) : (
            <>
              {/* ── Modo provider: secciones profesionales ── */}

              {/* CONSULTORIO */}
              <SidebarGroup className="py-0.5">
                <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5 flex items-center gap-1.5">
                  <span className="text-teal-600">Consultorio</span>
                  <Stethoscope className="h-2.5 w-2.5 text-teal-500" />
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0">
                    {providerConsultItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={isActive(item.url)}
                          onClick={() => handleNavigate(item.url)}
                          className="h-7 text-xs rounded-md"
                        >
                          <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <Separator className="mx-2 my-0.5" />

              {/* COMUNICACION */}
              <SidebarGroup className="py-0.5">
                <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5 flex items-center gap-1.5">
                  <span className="text-teal-600">Comunicacion</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0">
                    {providerCommsItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={isActive(item.url)}
                          onClick={() => handleNavigate(item.url)}
                          className="h-7 text-xs rounded-md"
                        >
                          <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <Separator className="mx-2 my-0.5" />

              {/* NEGOCIO */}
              <SidebarGroup className="py-0.5">
                <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5 flex items-center gap-1.5">
                  <span className="text-teal-600">Negocio</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0">
                    {providerBusinessItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={isActive(item.url)}
                          onClick={() => handleNavigate(item.url)}
                          className="h-7 text-xs rounded-md"
                        >
                          <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{item.title}</span>
                          {showPremiumBadges && item.url === '/panel-pro' && (
                            <PremiumBadge size="xs" className="ml-auto" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    {isGroomer && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={isActive('/peluquero/perfil')}
                          onClick={() => handleNavigate('/peluquero/perfil')}
                          className="h-7 text-xs rounded-md"
                        >
                          <Scissors className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Perfil peluquero</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* ADMIN (solo si tiene rol admin) */}
              {isAdmin && (
                <>
                  <Separator className="mx-2 my-0.5" />
                  <SidebarGroup className="py-0.5">
                    <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5 flex items-center gap-1.5">
                      <span className="text-teal-600">Admin</span>
                      <Shield className="h-2.5 w-2.5 text-teal-500" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-0">
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            isActive={isActive('/admin')}
                            onClick={() => handleNavigate('/admin')}
                            className="h-7 text-xs rounded-md"
                          >
                            <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Panel admin</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}

              {/* Link compacto a mascotas para providers que también son dueños */}
              <Separator className="mx-2 my-0.5" />
              <SidebarGroup className="py-0.5">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive('/my-pets')}
                        onClick={() => handleNavigate('/my-pets')}
                        className="h-7 text-xs rounded-md text-purple-700"
                      >
                        <PawPrint className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
                        <span>My Paws</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        {user && (
          <SidebarFooter className="p-2 border-t border-border/40">
            <SidebarMenu className="space-y-0">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigate('/settings')}
                  className="h-7 text-xs rounded-md"
                >
                  <Settings className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Configuracion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  className="h-8 text-xs rounded-md hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Cerrar sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        )}
      </Sidebar>

      {/* Dialog del tutorial por sección */}
      {activeTutorialData && (
        <SidebarTutorialDialog
          tutorial={activeTutorialData}
          open={!!activeTutorial}
          onComplete={handleTutorialComplete}
          onClose={() => setActiveTutorial(null)}
        />
      )}
    </>
  );
}
