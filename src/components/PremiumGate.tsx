import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";

interface Props {
  feature: string;
  currentUsage?: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PremiumGate({ feature, currentUsage, children, fallback }: Props) {
  const navigate = useNavigate();
  const { checkAccess } = usePlan();
  const access = checkAccess(feature, currentUsage);

  if (access.allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative">
      <div className="blur-[2px] opacity-40 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <p className="text-sm font-medium mb-1">Función Premium</p>
        <p className="text-xs text-muted-foreground mb-4 max-w-[240px]">
          {access.reason}
        </p>
        <Button
          size="sm"
          onClick={() => navigate("/premium")}
          className="gap-2"
        >
          <Crown className="h-3.5 w-3.5" />
          {access.upgradeRequired === 'premium_plus' ? 'Mejorar a Premium+' : 'Ver planes'}
        </Button>
      </div>
    </div>
  );
}
