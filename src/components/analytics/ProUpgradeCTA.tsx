import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "@/lib/icons";
import { track, EVENTS } from "@/lib/analytics";
import { LINKS } from "@/lib/links";

interface ProUpgradeCTAProps {
  variant?: "inline" | "banner" | "minimal";
  context?: string;
}

export function ProUpgradeCTA({ variant = "inline", context = "unknown" }: ProUpgradeCTAProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    track({
      event: EVENTS.PRO_PANEL_UPGRADE_CTA_CLICKED,
      properties: { variant, context },
    });
    navigate("/upgrade");
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={handleClick}
        className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline flex items-center gap-1"
      >
        <Crown className="h-3 w-3" />
        Ver Panel Pro →
      </button>
    );
  }

  if (variant === "banner") {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 via-purple-100/50 to-pink-50">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-purple-200 p-2.5 flex-shrink-0">
              <Crown className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-purple-900">Desbloquea tu Panel Pro</p>
              <p className="text-xs text-purple-700/80">
                Accede a analytics avanzados, comparativos y exportaciones
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleClick}
            className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
          >
            Activar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // inline (default)
  return (
    <Card
      className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="flex items-center gap-3 py-3">
        <div className="rounded-full bg-purple-100 p-2 flex-shrink-0">
          <Crown className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-purple-800">Panel Pro</p>
          <p className="text-xs text-muted-foreground">
            Analytics detallados de tu mascota y su bienestar
          </p>
        </div>
        <span className="text-xs text-purple-500 font-medium flex-shrink-0">
          Ver más →
        </span>
      </CardContent>
    </Card>
  );
}
