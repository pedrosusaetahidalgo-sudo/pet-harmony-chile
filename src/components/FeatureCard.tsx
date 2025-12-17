import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: "warm" | "nature";
}

const FeatureCard = ({ icon: Icon, title, description, gradient = "warm" }: FeatureCardProps) => {
  const gradientClass = gradient === "warm" ? "bg-warm-gradient" : "bg-nature-gradient";

  return (
    <Card className="group hover:shadow-medium transition-all hover:-translate-y-1 border-border/50">
      <CardContent className="p-6 space-y-4">
        <div className={`inline-flex p-3 rounded-2xl ${gradientClass}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
