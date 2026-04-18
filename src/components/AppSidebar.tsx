import { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  MessageSquare,
  PawPrint,
  RefreshCw,
  LogOut,
  Settings,
  Map as MapIcon,
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
  ChevronDown,
  Compass,
  Heart,
} from '@/lib/icons';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { LINKS } from '@/lib/links';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
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

// ── Owner: 6 items core (siempre visibles) ──
const coreOwnerItems = [
  { title: 'Inicio', url: LINKS.home(), icon: HomeIcon },
  { title: 'Mis Mascotas', url: LINKS.myPets(), icon: PawPrint },
  { title: 'Buscar vet', url: LINKS.vets(), icon: Search },
  { title: 'Calendario', url: LINKS.calendarToday(), icon: CalendarDays },
  { title: 'Mis reservas', url: LINKS.bookingsTab(), icon: Calendar },
  { title: 'Recordatorios', url: LINKS.remindersTab(), icon: Bell },
];

// ── Owner: items secundarios en sección colapsable "Explorar" ──
// Organizados en sub-grupos desplegables (requerimiento Pedro 2026-04-17):
// dentro de Explorar el usuario puede abrir solo la categoria que le
// interesa sin el listado plano. Feature flags se aplican en el render.
type ExploreItem = {
  title: string;
  url: string;
  icon: typeof HomeIcon;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flag: any;
};

type ExploreSubgroup = {
  key: string;
  label: string;
  icon: typeof HomeIcon;
  items: ExploreItem[];
};

const exploreSubgroups: ExploreSubgroup[] = [
  {
    key: 'dia-dia',
    label: 'Día a día',
    icon: RefreshCw,
    items: [
      { title: 'Rutinas', url: LINKS.routinesTab(), icon: RefreshCw, flag: null },
      { title: 'Reportes', url: '/reportes', icon: BarChart3, flag: null },
    ],
  },
  {
    key: 'servicios',
    label: 'Servicios',
    icon: Briefcase,
    items: [
      { title: 'Servicios', url: '/servicios', icon: Briefcase, flag: null },
      { title: 'Mapa', url: '/maps', icon: MapIcon, flag: null },
    ],
  },
  {
    // Nota: se llamaba "Comunidad" pero con FEED y CHAT desactivados quedaba
    // como "Comunidad > Comunidad" (subgrupo y item con el mismo nombre).
    // Renombrado a "Social" para evitar la duplicacion visual.
    key: 'social',
    label: 'Social',
    icon: Users,
    items: [
      { title: 'Feed', url: '/feed', icon: Activity, flag: 'FEED' as const },
      { title: 'Grupos', url: '/comunidad', icon: Users, flag: 'LABS_COMMUNITY' as const },
      { title: 'Mensajes', url: '/chat', icon: MessageSquare, flag: 'CHAT' as const },
    ],
  },
  {
    // Causas: adopcion, banco de sangre y donaciones. Antes adopcion y banco
    // de sangre estaban enterrados dentro de Paw Labs junto a gamificacion,
    // lo que mezclaba impacto real con features beta ludicas.
    key: 'causas',
    label: 'Causas',
    icon: Heart,
    items: [
      { title: 'Adopción', url: '/adoption', icon: Heart, flag: 'LABS_ADOPTION' as const },
      {
        title: 'Banco de sangre',
        url: '/donantes-sangre',
        icon: Droplets,
        flag: 'LABS_BLOOD_DONORS' as const,
      },
      { title: 'Donaciones', url: '/donaciones', icon: Heart, flag: null },
    ],
  },
  {
    key: 'paw-labs',
    label: 'Paw Labs',
    icon: Trophy,
    items: [
      { title: 'Paw Game', url: '/paw-game', icon: Gamepad2, flag: 'PAWGAME_SIDEBAR' as const },
      { title: 'Misiones', url: '/misiones', icon: Star, flag: 'PAWGAME_SIDEBAR' as const },
      {
        title: 'Colección',
        url: '/paw-collection',
        icon: Trophy,
        flag: 'PAWGAME_SIDEBAR' as const,
      },
    ],
  },
];

// Legacy section maps kept for tutorial system compatibility
const healthItems = coreOwnerItems;

/** Mapeo sección → items (kept for tutorial dialog) */
const SECTION_ITEMS: Record<SectionKey, typeof healthItems> = {
  salud: coreOwnerItems,
  descubrir: [
    { title: 'Buscar vet', url: '/veterinarios', icon: Search },
    { title: 'Servicios', url: '/servicios', icon: Briefcase },
    { title: 'Mapa', url: '/maps', icon: MapIcon },
    { title: 'Banco de sangre', url: '/donantes-sangre', icon: Droplets },
  ],
  comunidad: [
    { title: 'Feed', url: '/feed', icon: Activity },
    { title: 'Comunidad', url: '/comunidad', icon: Users },
    { title: 'Mensajes', url: '/chat', icon: MessageSquare },
  ],
  pawlabs: [
    { title: 'Paw Game', url: '/paw-game', icon: Gamepad2 },
    { title: 'Misiones', url: '/misiones', icon: Star },
    { title: 'Coleccion', url: '/paw-collection', icon: Trophy },
  ],
};

/** Mapeo sección → label */
const SECTION_LABELS: Record<SectionKey, string> = {
  salud: 'Salud',
  descubrir: 'Descubrir',
  comunidad: 'Comunidad',
  pawlabs: 'Paw Labs',
};

// Secciones profesionales (modo provider)
const providerConsultItems = [
  { title: 'Dashboard', url: LINKS.providerDashboard(), icon: LayoutDashboard },
  { title: 'Pacientes', url: LINKS.providerPatients(), icon: Users },
  { title: 'Mis reservas', url: LINKS.bookingsTab(), icon: Calendar },
  { title: 'Calendario', url: LINKS.calendarToday(), icon: CalendarDays },
];

// Filtered at render time by CHAT feature flag
const providerCommsItems = [{ title: 'Mensajes', url: LINKS.chat(), icon: MessageSquare }];

const providerBusinessItems = [
  { title: 'Perfil público', url: '/provider/profile-edit', icon: UserCog },
  { title: 'Reportes', url: '/reportes', icon: Activity },
  { title: 'Panel Pro', url: '/panel-pro', icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const currentPath = location.pathname;
  const { role, isProvider } = useActiveRole();
  const { isPremium } = usePlan();
  const showPremiumBadges = isFeatureEnabled('USER_PREMIUM') && !isPremium;
  const [exploreOpen, setExploreOpen] = useState(false);
  // Estado abierto/cerrado por sub-grupo dentro de Explorar. Por defecto
  // Causas abierto (nuevo y el mas accionable: adopcion, sangre, donaciones);
  // el resto cerrado para no saturar.
  const [exploreSubOpen, setExploreSubOpen] = useState<Record<string, boolean>>({
    'dia-dia': false,
    servicios: false,
    social: false,
    causas: true,
    'paw-labs': false,
  });
  const toggleSub = (key: string) => setExploreSubOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const {
    loaded: tutorialLoaded,
    isAllComplete,
    isSectionUnlocked,
    completeSection,
    dismissAll,
    nextPendingSection,
  } = useSidebarTutorial();

  const [activeTutorial, setActiveTutorial] = useState<SectionKey | null>(null);

  // Batch sidebar data into a single query to avoid N+1 (pets, groomer, provider slug)
  const { data: sidebarData } = useQuery({
    queryKey: ['sidebar-user-data', user?.id, isProvider],
    queryFn: async () => {
      if (!user?.id)
        return { hasPets: false, isGroomer: false, providerSlug: null as string | null };

      const [petsResult, providerResult] = await Promise.all([
        supabase.from('pets').select('id').eq('owner_id', user.id).limit(1),
        isProvider
          ? supabase
              .from('service_providers')
              .select('slug, primary_service_type')
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        hasPets: (petsResult.data?.length ?? 0) > 0,
        isGroomer: providerResult.data?.primary_service_type === 'grooming',
        providerSlug: providerResult.data?.slug ?? null,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const hasPets = sidebarData?.hasPets ?? false;
  const isGroomer = sidebarData?.isGroomer ?? false;
  const providerSlug = sidebarData?.providerSlug ?? null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
        className="border-r border-border/40 w-[200px] xl:w-[220px] h-screen sticky top-0"
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
                        Recorre cada seccion para desbloquearla
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

              {/* ── Core: 6 items principales ── */}
              <SidebarGroup className="py-0.5">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0">
                    {coreOwnerItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={isActive(item.url)}
                          onClick={() => handleNavigate(item.url)}
                          className="h-7 text-xs rounded-md transition-all"
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

              {/* ── Explorar: seccion colapsable con items secundarios ── */}
              <SidebarGroup className="py-0.5">
                <SidebarGroupLabel
                  className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5 flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => setExploreOpen((prev) => !prev)}
                >
                  <Compass className="h-2.5 w-2.5" />
                  <span>Explorar</span>
                  <ChevronDown
                    className={cn(
                      'h-2.5 w-2.5 ml-auto transition-transform duration-200',
                      exploreOpen && 'rotate-180'
                    )}
                  />
                </SidebarGroupLabel>
                {exploreOpen && (
                  <SidebarGroupContent>
                    {/* Sub-grupos desplegables: cada categoria se abre
                        independiente. Items filtrados por feature flag; si
                        un sub-grupo queda sin items visibles, no se muestra. */}
                    {exploreSubgroups.map((group) => {
                      const visibleItems = group.items.filter(
                        (item) => item.flag === null || isFeatureEnabled(item.flag)
                      );
                      if (visibleItems.length === 0) return null;
                      const isOpen = !!exploreSubOpen[group.key];
                      return (
                        <div key={group.key} className="mb-1">
                          <button
                            type="button"
                            onClick={() => toggleSub(group.key)}
                            className="w-full flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <group.icon className="h-2.5 w-2.5" />
                            <span className="flex-1 text-left">{group.label}</span>
                            <ChevronDown
                              className={cn(
                                'h-2.5 w-2.5 transition-transform duration-200',
                                isOpen && 'rotate-180'
                              )}
                            />
                          </button>
                          {isOpen && (
                            <SidebarMenu className="space-y-0">
                              {visibleItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                  <SidebarMenuButton
                                    isActive={isActive(item.url)}
                                    onClick={() => handleNavigate(item.url)}
                                    className="h-7 text-xs rounded-md transition-all pl-6"
                                  >
                                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{item.title}</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenu>
                          )}
                        </div>
                      );
                    })}
                  </SidebarGroupContent>
                )}
              </SidebarGroup>

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
                            onClick={() =>
                              handleNavigate(
                                providerSlug
                                  ? `/veterinarios/${providerSlug}`
                                  : '/provider/profile-edit'
                              )
                            }
                            className="h-7 text-xs rounded-md text-teal-700"
                            title={
                              providerSlug
                                ? 'Ver tu perfil publico'
                                : 'Completa tu perfil para tener URL publica'
                            }
                          >
                            <Stethoscope className="h-3.5 w-3.5 flex-shrink-0 text-teal-500" />
                            <span>Mi consultorio</span>
                            {!providerSlug && (
                              <span className="ml-auto text-[9px] text-amber-500 font-medium">
                                Completar
                              </span>
                            )}
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

              {/* COMUNICACION — solo si CHAT esta habilitado */}
              {isFeatureEnabled('CHAT') && (
                <>
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
                </>
              )}

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
            </>
          )}
        </SidebarContent>

        {user && (
          <SidebarFooter className="p-2 border-t border-border/40">
            {/* CTA fijo de donaciones: mas llamativo que los items normales
                del footer (gradiente rosa suave + icono relleno) pero sin ser
                tan fuerte como un boton primario. Visible en cualquier ruta. */}
            <button
              onClick={() => handleNavigate('/donaciones')}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 mb-1 rounded-md',
                'bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50',
                'dark:from-pink-950/40 dark:via-rose-950/30 dark:to-amber-950/30',
                'border border-pink-200/70 dark:border-pink-900/50',
                'text-pink-700 dark:text-pink-300 text-xs font-medium',
                'hover:from-pink-100 hover:via-rose-100 hover:to-amber-100',
                'dark:hover:from-pink-900/50 dark:hover:via-rose-900/40 dark:hover:to-amber-900/40',
                'transition-colors'
              )}
              aria-label="Apoyar Paw Friend con una donacion"
            >
              <Heart className="h-3.5 w-3.5 flex-shrink-0 fill-pink-500 text-pink-500" />
              <span>Apoyar Paw Friend</span>
            </button>
            <SidebarMenu className="space-y-0">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigate('/paw-core')}
                  className="h-7 text-xs rounded-md"
                >
                  <PawPrint className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Paw Core</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
