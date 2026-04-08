import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { PawPrint, Home as HomeIcon } from "@/lib/icons";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-background to-emerald-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
          <PawPrint className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="mb-3 text-5xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl font-semibold text-foreground">
          Esta página se nos perdió
        </p>
        <p className="mb-8 text-muted-foreground">
          Tal vez fue tras un gato. Volvamos a terreno conocido.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/">
              <HomeIcon className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/my-pets">
              <PawPrint className="mr-2 h-4 w-4" />
              Mis mascotas
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
