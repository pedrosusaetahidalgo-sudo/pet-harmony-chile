import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  PawPrint,
  User,
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  MessageSquare,
  Briefcase,
} from '@/lib/icons';
import { LINKS } from '@/lib/links';
import { cn } from '@/lib/utils';
import { useReminders } from '@/hooks/useReminders';
import { useActiveRole } from '@/hooks/useActiveRole';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { haptics } from '@/lib/haptics';

/**
 * Bottom tab bar nativa para mobile (pivot médico).
 *
 * Solo se muestra en mobile (`< md`). En desktop, el sidebar mantiene la
 * navegación. Las 5 tabs reflejan la jerarquía del pivot médico:
 *  - Inicio (Home)
 *  - Mascotas (Mis Mascotas)
 *  - Buscar vet (directorio público)
 *  - Recordatorios (con badge de vencidos / próximos 24h)
 *  - Perfil
 *
 * Nota: Mensajes (chat) salio del bottom nav. Se accede desde el Header
 * superior y desde el drawer/sidebar. Recordatorios entra porque es la
 * accion fundamental que el usuario olvida (y la promesa core del producto).
 *
 * Respeta safe-area-bottom para iPhones con notch / Android gesture bar.
 */

interface Tab {
  label: string;
  icon: typeof HomeIcon;
  href: string;
  /** Rutas que mantienen la tab activa (ej: /pet/:id activa "Mascotas") */
  matchPaths: (path: string) => boolean;
  /** Si la tab tiene badge, retorna el numero (0 = oculto) */
  badge?: number;
}

export function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { overdueReminders, upcomingReminders } = useReminders();
  const { role, isProvider } = useActiveRole();

  // Badge: vencidos + proximos 24h (today/tomorrow)
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueSoon = upcomingReminders.filter((r) => new Date(r.due_date) <= in24h).length;
  const reminderBadge = overdueReminders.length + dueSoon;

  const OWNER_TABS: Tab[] = [
    {
      label: 'Inicio',
      icon: HomeIcon,
      href: LINKS.home(),
      matchPaths: (p) => p === '/home',
    },
    {
      label: 'My Paws',
      icon: PawPrint,
      href: LINKS.myPets(),
      matchPaths: (p) =>
        p === '/my-pets' ||
        p === '/add-pet' ||
        p.startsWith('/pet/') ||
        p.startsWith('/edit-pet/') ||
        p.startsWith('/ficha/'),
    },
    {
      label: 'Servicios',
      icon: Briefcase,
      href: LINKS.servicios(),
      matchPaths: (p) =>
        p === '/servicios' ||
        p.startsWith('/services') ||
        p.startsWith('/veterinarios') ||
        p === '/maps' ||
        p === '/adoption',
    },
    {
      label: 'Agenda',
      icon: CalendarDays,
      href: LINKS.calendarToday(),
      matchPaths: (p) =>
        p === '/calendario' ||
        p === '/reminders' ||
        p === '/rutinas' ||
        p === '/mis-reservas' ||
        p === '/calendar',
      badge: reminderBadge,
    },
    {
      label: 'Perfil',
      icon: User,
      href: LINKS.profile(),
      matchPaths: (p) => p === '/profile' || p === '/settings',
    },
  ];

  const PROVIDER_TABS: Tab[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: LINKS.providerDashboard(),
      matchPaths: (p) => p === '/provider/dashboard',
    },
    {
      label: 'Pacientes',
      icon: Users,
      href: LINKS.providerPatients(),
      matchPaths: (p) => p === '/provider/pacientes' || p.startsWith('/ficha/'),
    },
    {
      label: 'Reservas',
      icon: Calendar,
      href: LINKS.bookings(),
      matchPaths: (p) => p === '/mis-reservas',
    },
    // Mensajes solo si CHAT esta habilitado
    ...(isFeatureEnabled('CHAT')
      ? [
          {
            label: 'Mensajes',
            icon: MessageSquare,
            href: LINKS.chat(),
            matchPaths: (p: string) => p.startsWith('/chat'),
          },
        ]
      : []),
    {
      label: 'Perfil',
      icon: User,
      href: LINKS.profile(),
      matchPaths: (p) => p === '/profile' || p === '/settings',
    },
  ];

  const TABS = role === 'provider' && isProvider ? PROVIDER_TABS : OWNER_TABS;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
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
              onClick={() => {
                if (!active) haptics.navigate();
                navigate(tab.href);
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full',
                'touch-manipulation transition-colors active:bg-muted/50',
                active ? 'text-purple-600' : 'text-muted-foreground'
              )}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn('h-5 w-5', active && 'fill-purple-600/10')}
                  strokeWidth={active ? 2.5 : 2}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center leading-none"
                    aria-label={`${tab.badge} pendientes`}
                  >
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={cn(
                  'text-[10px] leading-tight truncate max-w-[56px]',
                  active && 'font-semibold'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
