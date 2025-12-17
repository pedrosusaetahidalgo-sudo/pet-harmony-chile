import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface PremiumBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const PremiumBadge = ({ className, size = "md" }: PremiumBadgeProps) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="default"
      className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 ${sizeClasses[size]} ${className}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  );
};

