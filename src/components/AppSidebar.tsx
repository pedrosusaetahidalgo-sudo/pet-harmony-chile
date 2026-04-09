import { Compass, Heart, Plus, Calendar, MessageSquare, PawPrint, LogOut, Dog, Stethoscope, Users, AlertCircle, GraduationCap, Shield, Settings, Map, Gamepad2, ShieldCheck, Crown, UserCog, LayoutDashboard, Home as HomeIcon, FileText, Search } from "@/lib/icons";
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

// PIVOT 2026-04-09: sidebar simplificado a 6 items máximo
// Items secundarios (Feed, Adopción, PawGame, Mapa) accesibles desde /profile
const mainItems = [
  { title: "Inicio", url: "/home", icon: HomeIcon },
  { title: "Mi mascota", url: "/my-pets", icon: PawPrint },
  { title: "Buscar vet", url: "/veterinarios", icon: Search },
  { title: "Recordatorios", url: "/reminders", icon: Calendar },
  { title: "Mensajes", url: "/chat", icon: MessageSquare },
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
      <SidebarHeader className="p-2 pb-1">
        <button
          onClick={() => handleNavigate("/home")}
          className="flex items-center gap-2.5 px-2 py-1.5 w-full hover:opacity-80 transition-opacity cursor-pointer rounded-lg"
        >
          <div className="relative flex-shrink-0">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <PawPrint className="h-2.5 w-2.5 text-secondary absolute -bottom-0.5 -right-0.5" />
          </div>
          <span className="font-bold text-sm whitespace-nowrap">
            <span className="text-purple-800">paw</span>
            <span className="text-purple-600 ml-1">friend</span>
          </span>
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 overflow-y-auto overflow-x-hidden">
        {/* NAVEGACIÓN PRINCIPAL */}
        <SidebarGroup className="py-0.5">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {mainItems.map((item) => (
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

        {isProvider && (
          <>
            <Separator className="mx-2 my-0.5" />
            <SidebarGroup className="py-0.5">
              <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5">Profesional</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/provider/dashboard")}
                      onClick={() => handleNavigate("/provider/dashboard")}
                      className="h-7 text-xs rounded-md"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Mi panel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/provider/profile-edit")}
                      onClick={() => handleNavigate("/provider/profile-edit")}
                      className="h-7 text-xs rounded-md"
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
            <Separator className="mx-2 my-0.5" />
            <SidebarGroup className="py-0.5">
              <SidebarGroupLabel className="text-[9px] uppercase tracking-wider px-3 mb-0 h-5">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/admin")}
                      onClick={() => handleNavigate("/admin")}
                      className="h-7 text-xs rounded-md"
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
                className="h-7 text-xs rounded-md"
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
  );
}
