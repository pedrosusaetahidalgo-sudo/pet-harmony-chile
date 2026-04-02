import { useState } from "react";
import { Crown, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PremiumBanner() {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("premium_top_banner_dismissed") === "true";
  });

  if (dismissed) return null;

  const navigate = useNavigate();

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("premium_top_banner_dismissed", "true");
  };

  return (
    <div className="sticky top-0 z-[60] bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-medium shadow-md">
      <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">
        Desbloquea todo con <strong>Paw Premium</strong>
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="h-6 px-2 text-[10px] font-bold bg-white text-amber-700 hover:bg-amber-50 flex-shrink-0"
        onClick={() => navigate("/premium")}
      >
        <Crown className="h-3 w-3 mr-1" />
        Ver planes
      </Button>
      <button
        onClick={handleDismiss}
        className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
