import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumGateProps {
  feature: string;
  description?: string;
  children: React.ReactNode;
  isPremium?: boolean;
}

const PremiumGate = ({ feature, description, children, isPremium = false }: PremiumGateProps) => {
  const navigate = useNavigate();

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="max-w-sm mx-4 shadow-lg border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Función Premium</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {description || `${feature} está disponible con el plan Premium.`}
            </p>
            <Button onClick={() => navigate("/premium")} className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Ver planes desde $4.990/mes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumGate;
