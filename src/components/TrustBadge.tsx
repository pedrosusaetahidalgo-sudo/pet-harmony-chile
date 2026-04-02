import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Star, Clock } from "lucide-react";

interface TrustBadgeProps {
  type: "verified" | "top_rated" | "responsive";
  size?: "sm" | "md";
}

const badges = {
  verified: { icon: ShieldCheck, label: "Verificado", color: "bg-green-500/10 text-green-700 border-green-500/20" },
  top_rated: { icon: Star, label: "Mejor Calificado", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
  responsive: { icon: Clock, label: "Responde Rápido", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
};

export const TrustBadge = ({ type, size = "sm" }: TrustBadgeProps) => {
  const badge = badges[type];
  const Icon = badge.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <Badge variant="outline" className={`${badge.color} gap-1 font-medium ${size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"}`}>
      <Icon className={iconSize} />
      {badge.label}
    </Badge>
  );
};
