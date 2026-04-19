import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { Menu } from '@/lib/icons';
import { HEADER } from './content/copy';
import { cn } from '@/lib/utils';

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
            src="/paw_friend_icon_principal.svg"
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
            <SheetContent side="right" className="w-72 sm:max-w-sm">
              <SheetTitle className="sr-only">Menú principal</SheetTitle>
              <nav aria-label="Móvil" className="mt-6">
                <ul className="flex flex-col gap-1">
                  {HEADER.navItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setSheetOpen(false)}
                        className="block rounded-xl px-4 py-3 text-base font-semibold text-foreground hover:bg-foreground/5"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {!user && (
                    <li className="mt-3">
                      <Link
                        to={LINKS.auth()}
                        onClick={() => setSheetOpen(false)}
                        className="block rounded-xl px-4 py-3 text-base font-semibold text-foreground hover:bg-foreground/5"
                      >
                        {HEADER.ctaAuth}
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
