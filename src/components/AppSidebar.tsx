import { Compass, Heart, User, Plus, Calendar, MapPin, MessageSquare, PawPrint, LogOut, Home, Dog, Stethoscope, Users, AlertCircle, GraduationCap, Shield, Settings, Map, Gamepad2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

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
  { title: "Inicio", url: "/home", icon: Home },
  { title: "Paw Game", url: "/paw-game", icon: Gamepad2 },
  { title: "Pet Social", url: "/feed", icon: Heart },
  { title: "Mapa", url: "/maps", icon: Map },
  { title: "Mensajes", url: "/chat", icon: MessageSquare },
  { title: "Explorar", url: "/places", icon: MapPin },
  { title: "Adopción", url: "/adoption", icon: Compass },
  { title: "Perdidos", url: "/lost-pets", icon: AlertCircle },
];

const petItems = [
  { title: "Mis Mascotas", url: "/my-pets", icon: Heart },
  { title: "Agregar Mascota", url: "/add-pet", icon: Plus },
  { title: "Historial Médico", url: "/medical-records", icon: Calendar },
];

const serviceItems = [
  { title: "Paseadores", url: "/dog-walkers", icon: Dog },
  { title: "Veterinarios", url: "/home-vets", icon: Stethoscope },
  { title: "Cuidadores", url: "/dog-sitters", icon: Home },
  { title: "Entrenadores", url: "/dog-trainers", icon: GraduationCap },
  { title: "Paseos Grupales", url: "/shared-walks", icon: Users },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const currentPath = location.pathname;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNavigate = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) => currentPath === path;

  const renderMenuItems = (items: typeof mainItems, hoverClass: string, activeClass: string) => (
    <SidebarMenu className="space-y-0.5">
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            isActive={isActive(item.url)}
            onClick={() => handleNavigate(item.url)}
            tooltip={item.title}
            className={`${hoverClass} transition-all duration-200 rounded-lg`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-shrink-0">
            <Heart className="h-7 w-7 text-primary fill-primary" />
            <PawPrint className="h-3 w-3 text-secondary absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg bg-warm-gradient bg-clip-text text-transparent block whitespace-nowrap">
              Paw Friend
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(mainItems, "hover:bg-primary/10", "bg-primary/15 text-primary font-semibold")}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mis Mascotas</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(petItems, "hover:bg-secondary/10", "bg-secondary/15 text-secondary font-semibold")}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Servicios</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(serviceItems, "hover:bg-blue-500/10", "bg-blue-500/15 text-blue-600 font-semibold")}
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive("/admin")}
                    onClick={() => handleNavigate("/admin")}
                    tooltip="Panel Admin"
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span>Panel Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-border/50 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavigate('/profile')} tooltip="Mi Perfil">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="bg-warm-gradient text-white text-xs font-semibold">
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user.email?.split("@")[0]}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavigate('/settings')} tooltip="Configuración">
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span>Configuración</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} tooltip="Cerrar Sesión" className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
