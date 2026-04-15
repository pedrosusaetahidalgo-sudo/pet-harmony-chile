import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Stethoscope, AlertTriangle } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Props {
  petBreed: string;
  petSpecies: string;
  recordType: string;
  onDismiss: () => void;
}

/**
 * Shows a short IA recommendation after a medical record is saved.
 * Calls medical-suggestions edge function with context.
 * Includes medical disclaimer.
 */
export function PostRecordRecommendation({ petBreed, petSpecies, recordType, onDismiss }: Props) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('medical-suggestions', {
          body: { breed: petBreed || 'mestizo', species: petSpecies, recordType },
        });

        if (cancelled) return;

        if (!error && data?.suggestions?.length > 0) {
          // Pick the first suggestion's description as the tip
          const tip = data.suggestions
            .slice(0, 2)
            .map((s: { label: string; description: string }) => `${s.label}: ${s.description}`)
            .join('. ');
          setSuggestion(tip);
        }
      } catch {
        // Silent fail — not critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [petBreed, petSpecies, recordType]);

  if (loading) return null; // Don't show loading state — it appears after save
  if (!suggestion) return null;

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 animate-fade-in">
      <CardContent className="p-3">
        <div className="flex items-start gap-2.5">
          <div className="rounded-full bg-blue-100 p-1.5 flex-shrink-0 mt-0.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-800 mb-1">Sugerencia de cuidado</p>
            <p className="text-xs text-blue-700 leading-relaxed">{suggestion}</p>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <AlertTriangle className="h-2.5 w-2.5" />
              <span>Generado por IA — consulta siempre con tu veterinario</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
