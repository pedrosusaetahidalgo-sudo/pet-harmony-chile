import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sparkles,
  Loader2,
  Heart,
  Activity,
  Utensils,
  Brain,
  Thermometer,
  Users,
} from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePlan } from '@/hooks/usePlan';
import { Separator } from '@/components/ui/separator';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { PremiumNudge } from '@/components/PremiumNudge';

interface BreedTipsProps {
  breed: string;
  species: string;
}

// Cache de consejos por raza en sessionStorage. La llamada a Claude para
// generar consejos por raza tarda ~20s, así que cachear la misma raza dentro
// de la sesión evita re-fetches innecesarios cada vez que el usuario navega
// al detalle de la mascota.
const cacheKey = (breed: string, species: string) =>
  `paw-friend:breed-tips:${species}:${breed}`.toLowerCase();

export function BreedTips({ breed, species }: BreedTipsProps) {
  const { checkAccess, isPremium } = usePlan();
  const [usedThisSession, setUsedThisSession] = useState(false);
  const [tips, setTips] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(cacheKey(breed, species));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  // Si cambia la raza/especie (al navegar entre mascotas) reseteamos al
  // valor cacheado correspondiente.
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey(breed, species));
      setTips(cached);
    } catch {
      setTips(null);
    }
  }, [breed, species]);

  const fetchTips = async () => {
    // Plan gate: free users get 1 analysis/month
    const access = checkAccess('ai_behavior_analysis', usedThisSession ? 1 : 0);
    if (!access.allowed) {
      toast.error('Límite alcanzado', {
        description: access.reason || 'Mejora a Premium para análisis ilimitados.',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('breed-tips', {
        body: { breed, species },
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Límite alcanzado', {
            description: 'Demasiadas solicitudes. Intenta más tarde.',
          });
        } else if (error.message.includes('402')) {
          toast.error('Servicio no disponible', {
            description: 'El servicio de IA requiere créditos adicionales.',
          });
        } else {
          throw error;
        }
        return;
      }

      setTips(data.tips);
      setUsedThisSession(true);
      try {
        sessionStorage.setItem(cacheKey(breed, species), data.tips);
      } catch {
        // sessionStorage lleno o deshabilitado: no es bloqueante.
      }
    } catch (error: unknown) {
      toast.error('Error al obtener consejos', {
        description:
          describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]) ||
          'Ocurrió un error inesperado',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if limit is reached before showing the button
  const breedAccess = checkAccess('ai_behavior_analysis', usedThisSession ? 1 : 0);

  if (!tips) {
    if (!isPremium && !breedAccess.allowed) {
      return (
        <PremiumNudge
          feature="ai_behavior_analysis"
          title="¿Te sirvió el análisis?"
          description="Si los tips por raza te ayudaron, apóyanos con un aporte para que sigamos siendo gratis."
          variant="card"
        />
      );
    }

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
    const sections = text.split('\n\n').filter((section) => section.trim());

    return sections.map((section, index) => {
      const lines = section.split('\n').filter((line) => line.trim());
      const title = lines[0];
      const content = lines.slice(1);

      let icon = <Heart className="h-4 w-4" />;
      if (title.toLowerCase().includes('ejercicio') || title.toLowerCase().includes('actividad')) {
        icon = <Activity className="h-4 w-4" />;
      } else if (
        title.toLowerCase().includes('alimentación') ||
        title.toLowerCase().includes('comida')
      ) {
        icon = <Utensils className="h-4 w-4" />;
      } else if (
        title.toLowerCase().includes('temperamento') ||
        title.toLowerCase().includes('comportamiento')
      ) {
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
