import { Heart, PawPrint } from "lucide-react";

export const PublicHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <PawPrint className="h-3 w-3 text-secondary absolute -bottom-0.5 -right-0.5" />
          </div>
          <span className="font-bold text-lg bg-warm-gradient bg-clip-text text-transparent">
            Paw Friend
          </span>
        </div>
      </div>
    </header>
  );
};
