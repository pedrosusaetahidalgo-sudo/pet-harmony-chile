import { Compass, Heart, Plus, Calendar, MessageSquare, PawPrint, LogOut, Dog, Stethoscope, Users, AlertCircle, GraduationCap, Shield, Settings, Map, Gamepad2, ShieldCheck, Crown } from "lucide-react";
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

const mainItems = [
  { title: "Paw Game", url: "/paw-game", icon: Gamepad2 },
  { title: "Pet Social", url: "/feed", icon: Heart },
  { title: "Mapa", url: "/maps", icon: Map },
  { title: "Mensajes", url: "/chat", icon: MessageSquare },
  { title: "Adopción", url: "/adoption", icon: Compass },
  { title: "Perdidos", url: "/lost-pets", icon: AlertCircle },
];

const petItems = [
  { title: "Mis Mascotas", url: "/my-pets", icon: PawPrint },
  { title: "Agregar", url: "/add-pet", icon: Plus },
  { title: "Historial", url: "/medical-records", icon: Calendar },
];

const serviceItems = [
  { title: "Calendario", url: "/calendar", icon: Calendar },
  { title: "Paseadores", url: "/services/walkers", icon: Dog },
  { title: "Veterinarios", url: "/services/vets", icon: Stethoscope },
  { title: "Cuidadores", url: "/services/sitters", icon: ShieldCheck },
  { title: "Entrenadores", url: "/services/trainers", icon: GraduationCap },
  { title: "Paseos", url: "/shared-walks", icon: Users },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const currentPath = location.pathname;

  const { data: premiumStatus } = useQuery({
    queryKey: ["user-premium-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const isPremium = !!premiumStatus?.is_premium;

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] px-3 mb-0.5">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive("/premium")}
                  onClick={() => handleNavigate("/premium")}
                  className="h-8 text-xs rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800"
                >
                  <Crown className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    {isPremium ? "Tu Plan" : "Premium"}
                  </span>
                  {!isPremium && (
                    <span className="ml-auto text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                      PRO
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {mainItems.map((item) => (
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

        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] px-3 mb-0.5">Mascotas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {petItems.map((item) => {
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
                          ¡Primera mascota!
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

        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] px-3 mb-0.5">Servicios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {serviceItems.map((item) => (
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
