import { Heart, PawPrint, Stethoscope } from '@/lib/icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';

export const PublicHeader = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center px-4 gap-2">
        <Link to="/" className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src="/paw-friend-assets-v2/logo/paw_friend_icon_principal.svg"
            alt="Paw Friend"
            className="h-9 w-9 flex-shrink-0"
          />
          <span className="font-bold text-lg truncate">
            <span className="text-purple-800">Paw</span>
            <span className="text-purple-500 ml-0.5">Friend</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/veterinarios" className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-semibold"
            >
              <Stethoscope className="h-4 w-4 mr-1" />
              Veterinarios
            </Button>
          </Link>

          {user ? (
            <Link to={LINKS.home()}>
              <Button size="sm" className="bg-primary text-primary-foreground font-semibold">
                Ir al inicio
              </Button>
            </Link>
          ) : (
            <Link to={LINKS.auth()}>
              <Button size="sm" variant="outline" className="font-semibold">
                Iniciar sesión
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
