import { Compass, Heart, User, Plus, Calendar, MapPin, MessageSquare, PawPrint, LogOut, Home, Dog, Stethoscope, Users, AlertCircle, GraduationCap, Shield, Settings, Map, Gamepad2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Inicio", url: "/home", icon: Home },
  { title: "Paw Game", url: "/paw-game", icon: Gamepad2 },
  { title: "Pet Social", url: "/feed", icon: Heart },
  { title: "Mapa", url: "/maps", icon: Map },
  { title: "Mensajes", url: "/chat", icon: MessageSquare },
  { title: "Explorar", url: "/places", icon: MapPin },
  { title: "Adopción", url: "/adoption", icon: Compass },
  { title: "Perdidos y Encontrados", url: "/lost-pets", icon: AlertCircle },
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
  { title: "Paseos Compartidos", url: "/shared-walks", icon: Users },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const currentPath = location.pathname;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-3 px-4 py-4 overflow-hidden">
          <div className="relative">
            <Heart className="h-8 w-8 text-primary fill-primary flex-shrink-0 animate-pulse" />
            <PawPrint className="h-4 w-4 text-secondary absolute -bottom-1 -right-1" />
          </div>
          <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-xl bg-warm-gradient bg-clip-text text-transparent block whitespace-nowrap">
              Paw Friend
            </span>
            <span className="text-xs text-muted-foreground">Chile</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 overflow-y-auto overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-200 rounded-lg group"
                      activeClassName="bg-gradient-to-r from-primary/15 to-secondary/15 text-primary font-semibold shadow-sm"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="ml-3 truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Mis Mascotas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {petItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-gradient-to-r hover:from-secondary/10 hover:to-primary/10 transition-all duration-200 rounded-lg group"
                      activeClassName="bg-gradient-to-r from-secondary/15 to-primary/15 text-secondary font-semibold shadow-sm"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="ml-3 truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Servicios
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {serviceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 transition-all duration-200 rounded-lg group"
                      activeClassName="bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-blue-600 font-semibold shadow-sm"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="ml-3 truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <Separator className="my-4" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Administración
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin")}>
                      <NavLink
                        to="/admin"
                        className="hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-200 rounded-lg group"
                        activeClassName="bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-600 font-semibold shadow-sm"
                      >
                        <Shield className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="ml-3 truncate">Panel Admin</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
          <div className="p-3 space-y-3 overflow-hidden">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all cursor-pointer group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:justify-center" onClick={() => navigate('/profile')}>
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 flex-shrink-0">
                <AvatarFallback className="bg-warm-gradient text-white font-semibold">
                  {user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-semibold truncate">
                  {user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-h-[44px] hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-0"
                onClick={() => navigate('/profile')}
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Perfil</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px] hover:bg-muted transition-all group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-0"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px] hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-0"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
