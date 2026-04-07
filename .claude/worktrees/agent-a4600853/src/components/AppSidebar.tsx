import { Compass, Heart, Plus, Calendar, MessageSquare, PawPrint, LogOut, Dog, Stethoscope, Users, AlertCircle, GraduationCap, Shield, Settings, Map, Gamepad2, ShieldCheck, Crown, UserCog, LayoutDashboard, Home as HomeIcon, FileText, Search, Activity } from "@/lib/icons";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { LINKS } from "@/lib/links";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

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
} from "@/components/ui/sidebar";

// PIVOT MÉDICO 2026-04: jerarquía Salud > Servicios > Comunidad
const saludItems = [
  { title: "Inicio", url: "/home", icon: HomeIcon },
  { title: "Buscar veterinario", url: "/veterinarios", icon: Search },
  { title: "Mis Mascotas", url: "/my-pets", icon: PawPrint },
  { title: "Agregar", url: "/add-pet", icon: Plus },
  { title: "Historial médico", url: "/medical-records", icon: FileText },
];

const serviciosItems = [
  { title: "Buscar servicios", url: "/servicios", icon: ShieldCheck },
  { title: "Mis reservas", url: "/calendar", icon: Calendar },
  { title: "Mapa", url: "/maps", icon: Map },
];

const comunidadItems = [
  { title: "Actividad", url: "/actividad", icon: Activity },
  { title: "Feed", url: "/feed", icon: Heart },
  { title: "Mensajes", url: "/chat", icon: MessageSquare },
  { title: "Adopción", url: "/adoption", icon: Compass },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const currentPath = location.pathname;

  const { data: userPets } = useQuery({
    queryKey: ["user-pets-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("pets")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);
      return data || [];
    },
    enabled: !!user?.id,
  });
  const hasPets = (userPets?.length ?? 0) > 0;

  // ¿El usuario es proveedor de servicios? (vet, paseador, etc.)
  const { data: providerRow } = useQuery({
    queryKey: ["user-is-provider", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const isProvider = !!providerRow;

  const handleSignOut = async () => {
    await signOut();
    navigate(LINKS.auth());
  };

  const handleNavigate = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="border-r border-border/40 w-[200px] h-screen sticky top-0"
    >
      <SidebarHeader className="p-3 pb-2">
        <button
          onClick={() => handleNavigate("/home")}
          className="flex items-center gap-2.5 px-2 py-1.5 w-full hover:opacity-80 transition-opacity cursor-pointer rounded-lg"
        >
          <div className="relative flex-shrink-0">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <PawPrint className="h-2.5 w-2.5 text-secondary absolute -bottom-0.5 -right-0.5" />
          </div>
          <span className="font-bold text-sm gradient-text whitespace-nowrap">
            Paw Friend
          </span>
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 overflow-y-auto overflow-x-hidden">
        {/* SALUD */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] px-3 mb-0.5">Salud</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {saludItems.map((item) => {
                const showGlow = !hasPets && item.url === "/add-pet";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive(item.url)}
                      onClick={() => handleNavigate(item.url)}
                      className={`h-8 text-xs rounded-md ${showGlow ? "animate-pulse-glow" : ""}`}
                    >
                      <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{item.title}</span>
                      {showGlow && (
                        <span className="ml-auto text-[9px] font-medium text-primary whitespace-nowrap">
                          ¡Primera!
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-2 my-1" />

        {/* SERVICIOS */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] px-3 mb-0.5">Servicios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {serviciosItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => handleNavigate(item.url)}
                    className="h-8 text-xs rounded-md"
                  >
                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-2 my-1" />

        {/* COMUNIDAD */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] px-3 mb-0.5">Comunidad</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {comunidadItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => handleNavigate(item.url)}
                    className="h-8 text-xs rounded-md"
                  >
                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* PawGame solo si flag activo */}
              {isFeatureEnabled("PAWGAME_SIDEBAR") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive("/paw-game")}
                    onClick={() => handleNavigate("/paw-game")}
                    className="h-8 text-xs rounded-md"
                  >
                    <Gamepad2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Paw Game</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isProvider && (
          <>
            <Separator className="mx-2 my-1" />
            <SidebarGroup className="py-1">
              <SidebarGroupLabel className="text-[10px] px-3 mb-0.5">Profesional</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/provider/dashboard")}
                      onClick={() => handleNavigate("/provider/dashboard")}
                      className="h-8 text-xs rounded-md"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Mi panel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/provider/profile-edit")}
                      onClick={() => handleNavigate("/provider/profile-edit")}
                      className="h-8 text-xs rounded-md"
                    >
                      <UserCog className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Mi perfil pro</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {isAdmin && (
          <>
            <Separator className="mx-2 my-1" />
            <SidebarGroup className="py-1">
              <SidebarGroupLabel className="text-[10px] px-3 mb-0.5">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/admin")}
                      onClick={() => handleNavigate("/admin")}
                      className="h-8 text-xs rounded-md"
                    >
                      <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Panel Admin</span>
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
                onClick={() => handleNavigate('/profile')}
                className="h-8 text-xs rounded-md"
              >
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-semibold">
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user.email?.split("@")[0]}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate('/settings')}
                className="h-8 text-xs rounded-md"
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
  );
}
