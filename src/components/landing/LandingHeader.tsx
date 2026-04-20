import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { Briefcase, Coins, Heart, LogIn, Menu, Sparkles, Stethoscope } from '@/lib/icons';
import { HEADER } from './content/copy';
import { cn } from '@/lib/utils';

type MobileNavItem = {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  href: string;
};

type MobileNavSection = {
  title: string;
  items: MobileNavItem[];
};

const MOBILE_NAV_SECTIONS: MobileNavSection[] = [
  {
    title: 'Para tu peludo',
    items: [
      {
        icon: Stethoscope,
        label: 'Buscar un vet',
        subtitle: 'Directorio verificado por comuna',
        href: '/veterinarios',
      },
      {
        icon: Coins,
        label: 'Estimar precio consulta',
        subtitle: 'Promedio por comuna',
        href: '/precios-veterinarios',
      },
    ],
  },
  {
    title: 'Soy profesional',
    items: [
      {
        icon: Briefcase,
        label: 'Planes para veterinarios',
        subtitle: 'Desde $0 · 4 tiers',
        href: '/para-veterinarios',
      },
    ],
  },
  {
    title: 'El proyecto',
    items: [
      {
        icon: Heart,
        label: 'Apoyar',
        subtitle: 'Donaciones y Paw Member',
        href: '/donaciones',
      },
      {
        icon: Sparkles,
        label: 'Nuestra historia',
        subtitle: 'Por qué existe Paw Friend',
        href: '/paw-core',
      },
    ],
  },
];

/**
 * Header sticky del landing nuevo. Contraste con [PublicHeader.tsx](
 *   ../PublicHeader.tsx
 * ) — el cual sigue vivo para otras páginas públicas (PawCore, PawVoices,
 * directorio vets); este es exclusivo del landing `/`.
 *
 * Cambios vs PublicHeader:
 * - Nav extendida (4 links visibles en desktop + sheet en mobile).
 * - CTA primario "Crear cuenta gratis" siempre visible.
 * - Backdrop blur que se intensifica al hacer scroll.
 */
export function LandingHeader() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-border/60 bg-background/85 backdrop-blur-md shadow-sm'
          : 'bg-background/60 backdrop-blur-sm'
      )}
    >
      <div className="container mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* Brand */}
        <Link to="/" className="flex min-w-0 flex-shrink-0 items-center gap-2">
          <img
            src="/paw-friend-assets-v2/logo/paw_friend_icon_principal.svg"
            alt="Paw Friend"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span className="hidden text-lg font-bold tracking-tight sm:inline">
            <span className="text-purple-800">{HEADER.brandLead}</span>
            <span className="ml-0.5 text-purple-500">{HEADER.brandTail}</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav aria-label="Principal" className="ml-2 hidden flex-1 items-center md:flex">
          <ul className="flex items-center gap-1">
            {HEADER.navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTAs */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Link to={LINKS.home()}>
              <Button size="sm" className="rounded-xl font-semibold">
                {HEADER.ctaHome}
              </Button>
            </Link>
          ) : (
            <>
              <Link to={LINKS.auth()} className="hidden sm:inline-flex">
                <Button size="sm" variant="ghost" className="rounded-xl font-semibold">
                  {HEADER.ctaAuth}
                </Button>
              </Link>
              <Link to={LINKS.auth()}>
                <Button
                  size="sm"
                  className="rounded-xl bg-primary font-semibold text-primary-foreground shadow-brand"
                >
                  {HEADER.ctaCreate}
                </Button>
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto sm:max-w-sm">
              <SheetTitle className="sr-only">Menú principal</SheetTitle>

              {/* Brand header dentro del sheet */}
              <div className="mt-2 flex items-center gap-2 border-b border-border/50 pb-4">
                <img
                  src="/paw-friend-assets-v2/logo/paw_friend_icon_principal.svg"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8"
                  aria-hidden="true"
                />
                <div className="leading-tight">
                  <p className="text-base font-bold tracking-tight">
                    <span className="text-purple-800">{HEADER.brandLead}</span>
                    <span className="ml-0.5 text-purple-500">{HEADER.brandTail}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Hecho en Chile · Gratis</p>
                </div>
              </div>

              <nav aria-label="Móvil" className="mt-5 space-y-5">
                {MOBILE_NAV_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className="px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-purple-600">
                      {section.title}
                    </p>
                    <ul className="mt-2 flex flex-col gap-1">
                      {section.items.map(({ icon: Icon, label, subtitle, href }) => (
                        <li key={href}>
                          <Link
                            to={href}
                            onClick={() => setSheetOpen(false)}
                            className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-purple-50 active:bg-purple-100"
                          >
                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 transition-colors group-hover:bg-purple-200">
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <span className="flex min-w-0 flex-col leading-tight">
                              <span className="text-sm font-semibold text-foreground">{label}</span>
                              <span className="text-xs text-muted-foreground">{subtitle}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {!user && (
                  <div className="border-t border-border/50 pt-4">
                    <Link
                      to={LINKS.auth()}
                      onClick={() => setSheetOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-foreground/5"
                    >
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      {HEADER.ctaAuth}
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
