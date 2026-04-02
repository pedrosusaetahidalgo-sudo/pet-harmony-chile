import { useState, useCallback } from "react";
import { Compass, Heart, Plus, Calendar, MapPin, MessageSquare, PawPrint, LogOut, Home, Dog, Stethoscope, Users, AlertCircle, GraduationCap, Shield, Settings, Map, Gamepad2, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

const allItems = [
  { title: "Paw Game", url: "/paw-game", icon: Gamepad2, section: "main" },
  { title: "Pet Social", url: "/feed", icon: Heart, section: "main" },
  { title: "Mapa", url: "/maps", icon: Map, section: "main" },
  { title: "Mensajes", url: "/chat", icon: MessageSquare, section: "main" },
  { title: "Explorar", url: "/places", icon: MapPin, section: "main" },
  { title: "Adopción", url: "/adoption", icon: Compass, section: "main" },
  { title: "Perdidos", url: "/lost-pets", icon: AlertCircle, section: "main" },
  { title: "Mis Mascotas", url: "/my-pets", icon: PawPrint, section: "pets" },
  { title: "Agregar Mascota", url: "/add-pet", icon: Plus, section: "pets" },
  { title: "Historial Médico", url: "/medical-records", icon: Calendar, section: "pets" },
  { title: "Paseadores", url: "/dog-walkers", icon: Dog, section: "services" },
  { title: "Veterinarios", url: "/home-vets", icon: Stethoscope, section: "services" },
  { title: "Cuidadores", url: "/dog-sitters", icon: ShieldCheck, section: "services" },
  { title: "Entrenadores", url: "/dog-trainers", icon: GraduationCap, section: "services" },
  { title: "Paseos Grupales", url: "/shared-walks", icon: Users, section: "services" },
];

// Mac Dock icon component with magnification effect
function DockIcon({ item, isActive, hoveredIndex, index, onClick }: {
  item: typeof allItems[0];
  isActive: boolean;
  hoveredIndex: number | null;
  index: number;
  onClick: () => void;
}) {
  const getScale = () => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(hoveredIndex - index);
    if (distance === 0) return 1.45;
    if (distance === 1) return 1.25;
    if (distance === 2) return 1.1;
    return 1;
  };

  const scale = getScale();
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`
            relative flex items-center justify-center w-10 h-10 rounded-xl
            transition-all duration-200 ease-out origin-center
            ${isActive
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }
          `}
          style={{ transform: `scale(${scale})`, zIndex: scale > 1 ? 10 : 1 }}
        >
          <Icon className="h-5 w-5" />
          {isActive && (
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const { setOpenMobile, state } = useSidebar();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNavigate = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) => currentPath === path;

  const handleMouseLeave = useCallback(() => setHoveredIndex(null), []);

  // Collapsed dock mode (desktop only)
  if (isCollapsed && !isMobile) {
    const items = isAdmin
      ? [...allItems, { title: "Admin", url: "/admin", icon: Shield, section: "admin" }]
      : allItems;

    return (
      <div className="fixed left-0 top-0 bottom-0 z-30 w-16 flex flex-col items-center bg-background/80 backdrop-blur-xl border-r border-border/40">
        {/* Logo - clickable to Home */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavigate("/home")}
              className="flex items-center justify-center py-4 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="relative">
                <Heart className="h-7 w-7 text-primary fill-primary" />
                <PawPrint className="h-3 w-3 text-secondary absolute -bottom-0.5 -right-0.5" />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Inicio</TooltipContent>
        </Tooltip>

        {/* Dock Icons */}
        <div
          className="flex-1 flex flex-col items-center gap-1 py-2 overflow-y-auto overflow-x-visible"
          onMouseLeave={handleMouseLeave}
        >
          {items.map((item, index) => (
            <div
              key={item.url}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              {/* Section separators */}
              {index > 0 && items[index - 1].section !== item.section && (
                <div className="w-6 h-px bg-border/60 mx-auto my-1.5" />
              )}
              <DockIcon
                item={item}
                isActive={isActive(item.url)}
                hoveredIndex={hoveredIndex}
                index={index}
                onClick={() => handleNavigate(item.url)}
              />
            </div>
          ))}
        </div>

        {/* Footer icons */}
        {user && (
          <div className="flex flex-col items-center gap-1 py-3 border-t border-border/40">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-accent transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Mi Perfil</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavigate('/settings')}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Configuración</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Cerrar Sesión</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    );
  }

  // Expanded sidebar (mobile offcanvas or desktop expanded)
  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/50">
        <button
          onClick={() => handleNavigate("/home")}
          className="flex items-center justify-center gap-3 px-4 py-3 w-full hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="relative flex-shrink-0">
            <Heart className="h-7 w-7 text-primary fill-primary" />
            <PawPrint className="h-3 w-3 text-secondary absolute -bottom-0.5 -right-0.5" />
          </div>
          <span className="font-bold text-lg gradient-text block whitespace-nowrap">
            Paw Friend
          </span>
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {allItems.filter(i => i.section === "main").map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => handleNavigate(item.url)}
                    className="transition-all duration-200 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mis Mascotas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {allItems.filter(i => i.section === "pets").map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => handleNavigate(item.url)}
                    className="transition-all duration-200 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Servicios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {allItems.filter(i => i.section === "services").map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => handleNavigate(item.url)}
                    className="transition-all duration-200 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
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
              <SidebarMenuButton onClick={() => handleNavigate('/profile')}>
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user.email?.split("@")[0]}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavigate('/settings')}>
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span>Configuración</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
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
