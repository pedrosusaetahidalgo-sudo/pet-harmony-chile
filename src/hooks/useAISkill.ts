import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface AISkillOptions<TInput, TOutput> {
  functionName: string;
  skillLabel: string;
  maxRetries?: number;
  onSuccess?: (data: TOutput) => void;
}

interface AISkillState<TOutput> {
  data: TOutput | null;
  isLoading: boolean;
  error: string | null;
  isRateLimited: boolean;
  remaining: number | null;
}

export function useAISkill<TInput, TOutput>(options: AISkillOptions<TInput, TOutput>) {
  const { functionName, skillLabel, maxRetries = 1, onSuccess } = options;
  const [state, setState] = useState<AISkillState<TOutput>>({
    data: null,
    isLoading: false,
    error: null,
    isRateLimited: false,
    remaining: null,
  });

  const invoke = useCallback(
    async (input: TInput) => {
      setState((s) => ({ ...s, isLoading: true, error: null, isRateLimited: false }));

      let lastError: string | null = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: input,
          });

          if (error) throw new Error(error.message || 'Error al conectar con el servicio');

          if (data?.error) {
            if (data.error.includes('Límite')) {
              setState((s) => ({
                ...s,
                isLoading: false,
                isRateLimited: true,
                remaining: 0,
                error: null,
              }));
              toast('Límite alcanzado', {
                description: `Has usado todos tus análisis de ${skillLabel} por hoy. Renueva mañana.`,
              });
              return;
            }
            throw new Error(data.error);
          }

          const result = data as TOutput;
          setState({
            data: result,
            isLoading: false,
            error: null,
            isRateLimited: false,
            remaining: data?.remaining ?? null,
          });
          onSuccess?.(result);
          return result;
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : 'Error desconocido';
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }

      setState((s) => ({ ...s, isLoading: false, error: lastError }));
      toast.error(`No pudimos completar ${skillLabel}`, {
        description: 'Inténtalo de nuevo en unos segundos.',
      });
      return null;
    },
    [functionName, skillLabel, maxRetries, onSuccess]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, isRateLimited: false, remaining: null });
  }, []);

  return { ...state, invoke, reset };
}
