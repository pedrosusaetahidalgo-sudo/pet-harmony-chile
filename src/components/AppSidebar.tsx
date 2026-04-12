import { useState } from 'react';
import {
  Calendar,
  MessageSquare,
  PawPrint,
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
} from '@/lib/icons';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { LINKS } from '@/lib/links';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSidebarTutorial } from '@/hooks/useSidebarTutorial';
import { SidebarTutorialDialog } from '@/components/SidebarTutorialDialog';
import { getTutorialBySection, SECTION_ORDER, type SectionKey } from '@/lib/sidebarTutorialContent';
import { Badge } from '@/components/ui/badge';

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
  { title: 'Mis mascotas', url: '/my-pets', icon: PawPrint },
  { title: 'Recordatorios', url: '/reminders', icon: Calendar },
];

const discoverItems = [
  { title: 'Buscar vet', url: '/veterinarios', icon: Search },
  { title: 'Servicios', url: '/servicios', icon: Briefcase },
  { title: 'Mapa', url: '/maps', icon: Map },
];

const communityItems = [
  { title: 'Feed', url: '/feed', icon: Activity },
  { title: 'Comunidad', url: '/comunidad', icon: Users },
  { title: 'Mensajes', url: '/chat', icon: MessageSquare },
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

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const currentPath = location.pathname;

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

  // ¿El usuario es proveedor de servicios? (vet, paseador, etc.)
  const { data: providerRow } = useQuery({
    queryKey: ['user-is-provider', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const isProvider = !!providerRow;

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

          {/* Secciones principales con lógica de bloqueo */}
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
                              unlocked ? handleNavigate(item.url) : handleLockedClick(sectionKey)
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

          {(isProvider || isGroomer) && (
            <>
              <Separator className="mx-2 my-0.5" />
              <SidebarGroup className="py-0.5">
                <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5">
                  Profesional
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive('/provider/dashboard')}
                        onClick={() => handleNavigate('/provider/dashboard')}
                        className="h-7 text-xs rounded-md"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Mi panel</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {isProvider && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={isActive('/provider/profile-edit')}
                          onClick={() => handleNavigate('/provider/profile-edit')}
                          className="h-7 text-xs rounded-md"
                        >
                          <UserCog className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Mi perfil pro</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                    {isGroomer && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={isActive('/peluquero/perfil')}
                          onClick={() => handleNavigate('/peluquero/perfil')}
                          className="h-7 text-xs rounded-md"
                        >
                          <Scissors className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Mi perfil peluquero</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
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
                  onClick={() => handleNavigate('/profile')}
                  className="h-7 text-xs rounded-md"
                >
                  <Avatar className="h-5 w-5 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-semibold">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.email?.split('@')[0]}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigate('/settings')}
                  className="h-7 text-xs rounded-md"
                >
                  <Settings className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Configuración</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  className="h-8 text-xs rounded-md hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Cerrar Sesión</span>
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
