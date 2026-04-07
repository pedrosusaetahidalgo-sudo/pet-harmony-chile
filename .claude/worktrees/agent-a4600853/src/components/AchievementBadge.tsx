import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getAchievementIcon } from "@/lib/gamification";

interface AchievementBadgeProps {
  code: string;
  name: string;
  description?: string;
  unlockedAt?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const AchievementBadge = ({ 
  code, 
  name, 
  description, 
  unlockedAt,
  size = "md",
  showTooltip = true 
}: AchievementBadgeProps) => {
  const icon = getAchievementIcon(code);
  const sizeClasses = {
    sm: "text-xs p-1",
    md: "text-sm p-2",
    lg: "text-base p-3",
  };

  const badge = (
    <Badge 
      variant="secondary" 
      className={`${sizeClasses[size]} flex items-center gap-1 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{name}</span>
    </Badge>
  );

  if (showTooltip && description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">{name}</p>
              <p className="text-xs">{description}</p>
              {unlockedAt && (
                <p className="text-xs text-muted-foreground">
                  Desbloqueado: {new Date(unlockedAt).toLocaleDateString('es-CL')}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

export default AchievementBadge;

