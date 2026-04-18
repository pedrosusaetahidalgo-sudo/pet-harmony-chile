import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BuiltWithClaude } from '@/components/BuiltWithClaude';

export function PublicHeader() {
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
        <Link to="/" className="font-bold text-purple-700 text-lg">
          🐾 Paw Friend
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Iniciar sesión
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm">Registrarse</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t bg-white mt-12 py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p className="text-xs">Hecho en Chile, para Chile · Pagos seguros con Flow</p>
        <p>© {new Date().getFullYear()} Paw Friend Chile · pawfriend.cl</p>
        <div className="mt-2 flex justify-center">
          <BuiltWithClaude />
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <Link to="/registro-partner" className="hover:text-purple-700 font-medium">
            Registra tu negocio
          </Link>
          <Link to="/para-veterinarios" className="hover:text-purple-700">
            Para veterinarios
          </Link>
          <Link to="/terms" className="hover:text-purple-700">
            Términos
          </Link>
          <Link to="/privacy" className="hover:text-purple-700">
            Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
