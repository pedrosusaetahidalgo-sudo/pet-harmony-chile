import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Heart, Activity, Utensils, Brain, Thermometer, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface BreedTipsProps {
  breed: string;
  species: string;
}

export function BreedTips({ breed, species }: BreedTipsProps) {
  const [tips, setTips] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTips = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("breed-tips", {
        body: { breed, species },
      });

      if (error) {
        if (error.message.includes("429")) {
          toast({
            title: "Límite alcanzado",
            description: "Demasiadas solicitudes. Intenta más tarde.",
            variant: "destructive",
          });
        } else if (error.message.includes("402")) {
          toast({
            title: "Servicio no disponible",
            description: "El servicio de IA requiere créditos adicionales.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setTips(data.tips);
    } catch (error: any) {
      toast({
        title: "Error al obtener consejos",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!tips) {
    return (
      <Button
        onClick={fetchTips}
        disabled={loading}
        variant="outline"
        className="w-full bg-gradient-to-r from-primary/5 to-purple-500/5 hover:from-primary/10 hover:to-purple-500/10 border-primary/20"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Obteniendo consejos...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Ver Consejos por Raza (IA)
          </>
        )}
      </Button>
    );
  }

  const formatTips = (text: string) => {
    const sections = text.split('\n\n').filter(section => section.trim());
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      const title = lines[0];
      const content = lines.slice(1);
      
      let icon = <Heart className="h-4 w-4" />;
      if (title.toLowerCase().includes('ejercicio') || title.toLowerCase().includes('actividad')) {
        icon = <Activity className="h-4 w-4" />;
      } else if (title.toLowerCase().includes('alimentación') || title.toLowerCase().includes('comida')) {
        icon = <Utensils className="h-4 w-4" />;
      } else if (title.toLowerCase().includes('temperamento') || title.toLowerCase().includes('comportamiento')) {
        icon = <Brain className="h-4 w-4" />;
      } else if (title.toLowerCase().includes('salud')) {
        icon = <Thermometer className="h-4 w-4" />;
      } else if (title.toLowerCase().includes('socialización')) {
        icon = <Users className="h-4 w-4" />;
      }

      return (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-semibold">
            {icon}
            <h3 className="text-sm">{title}</h3>
          </div>
          <div className="space-y-1 pl-6">
            {content.map((line, idx) => (
              <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
                {line.replace(/^[-•]\s*/, '')}
              </p>
            ))}
          </div>
          {index < sections.length - 1 && <Separator className="my-4" />}
        </div>
      );
    });
  };

  return (
    <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-background via-primary/5 to-background">
      <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-bold bg-warm-gradient bg-clip-text text-transparent">
              Consejos Personalizados por IA
            </div>
            <div className="text-xs text-muted-foreground font-normal mt-0.5">
              {breed} • Powered by Claude
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {formatTips(tips)}
        <Button
          onClick={() => setTips(null)}
          variant="outline"
          size="sm"
          className="w-full mt-6 hover:bg-primary/5"
        >
          Ocultar Consejos
        </Button>
      </CardContent>
    </Card>
  );
}
