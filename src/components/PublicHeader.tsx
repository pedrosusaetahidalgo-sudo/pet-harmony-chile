import { Heart, PawPrint, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const PublicHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center px-4 gap-4">
        <Link to="/" className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <PawPrint className="h-3 w-3 text-secondary absolute -bottom-0.5 -right-0.5" />
          </div>
          <span className="font-bold text-lg bg-warm-gradient bg-clip-text text-transparent">
            Paw Friend
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/veterinarios">
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-semibold"
            >
              <Stethoscope className="h-4 w-4 mr-1" />
              Veterinarios
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
