import { Link } from "react-router-dom";

export const LegalFooter = () => {
  return (
    <footer className="w-full py-6 px-4 border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground text-center md:text-left">
          © {new Date().getFullYear()} Paw Friend. Todos los derechos reservados.
        </div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
          <Link 
            to="/terms" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Términos y Condiciones
          </Link>
          <Link 
            to="/privacy" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Política de Privacidad
          </Link>
          <a 
            href="mailto:soporte@pawfriend.cl" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Contacto
          </a>
        </div>
      </div>
    </footer>
  );
};
