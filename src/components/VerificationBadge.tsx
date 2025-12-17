import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle2, 
  Award, 
  ShieldCheck,
  BadgeCheck
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  isVerified: boolean;
  type?: "compact" | "full" | "icon-only";
  providerType?: "dog_walker" | "dogsitter" | "veterinarian" | "trainer";
  totalReviews?: number;
  totalServices?: number;
  className?: string;
}

export const VerificationBadge = ({
  isVerified,
  type = "full",
  providerType,
  totalReviews = 0,
  totalServices = 0,
  className = ""
}: VerificationBadgeProps) => {
  const getVerificationLevel = () => {
    if (!isVerified) return null;
    if (totalReviews >= 50 && totalServices >= 100) return "elite";
    if (totalReviews >= 20 && totalServices >= 50) return "top";
    if (totalReviews >= 5 && totalServices >= 10) return "trusted";
    return "verified";
  };

  const level = getVerificationLevel();

  const levelConfig = {
    elite: {
      label: "Élite",
      icon: Award,
      color: "bg-gradient-to-r from-amber-500 to-yellow-400 text-white",
      description: "Proveedor élite con historial excepcional"
    },
    top: {
      label: "Top Proveedor",
      icon: ShieldCheck,
      color: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
      description: "Uno de los mejores proveedores de la plataforma"
    },
    trusted: {
      label: "Confiable",
      icon: BadgeCheck,
      color: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white",
      description: "Proveedor verificado con buenas reseñas"
    },
    verified: {
      label: "Verificado",
      icon: CheckCircle2,
      color: "bg-primary/10 text-primary",
      description: "Identidad y credenciales verificadas"
    }
  };

  if (!isVerified || !level) {
    return null;
  }

  const config = levelConfig[level];
  const Icon = config.icon;

  if (type === "icon-only") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex ${className}`}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (type === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${config.color} ${className}`}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      {level === "elite" && (
        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
          <Award className="h-3 w-3 mr-1" />
          {totalServices}+ servicios
        </Badge>
      )}
    </div>
  );
};

export default VerificationBadge;