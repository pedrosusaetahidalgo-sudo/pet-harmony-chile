import { useNavigate, useLocation } from "react-router-dom";
import { Home as HomeIcon, PawPrint, Stethoscope, MessageSquare, User } from "@/lib/icons";
import { LINKS } from "@/lib/links";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar nativa para mobile (pivot médico).
 *
 * Solo se muestra en mobile (`< md`). En desktop, el sidebar mantiene la
 * navegación. Las 5 tabs reflejan la jerarquía del pivot médico:
 *  - Inicio (Home)
 *  - Mascotas (Mis Mascotas)
 *  - Buscar vet (directorio público)
 *  - Mensajes
 *  - Perfil
 *
 * Respeta safe-area-bottom para iPhones con notch / Android gesture bar.
 */

interface Tab {
  label: string;
  icon: typeof HomeIcon;
  href: string;
  /** Rutas que mantienen la tab activa (ej: /pet/:id activa "Mascotas") */
  matchPaths: (path: string) => boolean;
}

const TABS: Tab[] = [
  {
    label: "Inicio",
    icon: HomeIcon,
    href: LINKS.home(),
    matchPaths: (p) => p === "/home",
  },
  {
    label: "Mascotas",
    icon: PawPrint,
    href: LINKS.myPets(),
    matchPaths: (p) =>
      p === "/my-pets" || p === "/add-pet" || p.startsWith("/pet/") || p.startsWith("/edit-pet/"),
  },
  {
    label: "Buscar vet",
    icon: Stethoscope,
    href: LINKS.vets(),
    matchPaths: (p) => p.startsWith("/veterinarios"),
  },
  {
    label: "Mensajes",
    icon: MessageSquare,
    href: LINKS.chat(),
    matchPaths: (p) => p.startsWith("/chat"),
  },
  {
    label: "Perfil",
    icon: User,
    href: LINKS.profile(),
    matchPaths: (p) => p === "/profile" || p === "/settings",
  },
];

export function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.matchPaths(currentPath);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
                "touch-manipulation transition-colors active:bg-muted/50",
                active ? "text-emerald-600" : "text-muted-foreground"
              )}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn("h-5 w-5", active && "fill-emerald-600/10")}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn("text-[10px]", active && "font-semibold")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
