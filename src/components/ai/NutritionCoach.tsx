import { useState } from 'react';
import { Leaf, AlertTriangle, CheckCircle, Sparkles, Loader2 } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAISkill } from '@/hooks/useAISkill';
import { AIDisclaimer } from './AIDisclaimer';
import { AIRateLimitState } from './AIRateLimitState';

interface NutritionResponse {
  plan: {
    food_type: string;
    daily_portions: string;
    frequency: string;
    hydration: string;
  };
  forbidden_foods: string[];
  safe_treats: string[];
  allergy_warnings: string[];
  vet_referral_needed: boolean;
  vet_referral_reason: string | null;
  tip: string;
  disclaimer: string;
  pet_name: string;
  remaining: number;
}

interface Props {
  petId: string;
  petName: string;
}

export function NutritionCoach({ petId, petName }: Props) {
  const [question, setQuestion] = useState('');

  const { data, isLoading, error, isRateLimited, invoke, reset } = useAISkill<
    { pet_id: string; question?: string },
    NutritionResponse
  >({
    functionName: 'nutrition-coach',
    skillLabel: 'Coach Nutricional',
  });

  const handleGenerate = () => {
    invoke({ pet_id: petId, question: question.trim() || undefined });
  };

  if (!data) {
    return (
      <Card className="border-green-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            Coach nutricional de {petName}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              IA
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Genera un plan nutricional personalizado para {petName} basado en su raza, edad y
            condiciones.
          </p>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ej: ¿Cuanto debe comer ${petName}?`}
            className="text-xs h-9"
            disabled={isLoading}
          />
          <Button
            onClick={handleGenerate}
            disabled={isLoading || isRateLimited}
            className="w-full h-9 text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            Generar plan nutricional
          </Button>
          {isRateLimited && <AIRateLimitState skillLabel="Coach Nutricional" />}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            Plan nutricional de {petName}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={reset}>
            Nuevo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Vet referral warning */}
        {data.vet_referral_needed && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">Consulta a tu veterinario</p>
              <p className="text-[10px] text-amber-700">{data.vet_referral_reason}</p>
            </div>
          </div>
        )}

        {/* Plan card */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-green-50 border border-green-100">
            <p className="text-[10px] font-semibold uppercase text-green-700 mb-0.5">Tipo</p>
            <p className="text-xs text-green-900">{data.plan.food_type}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-green-50 border border-green-100">
            <p className="text-[10px] font-semibold uppercase text-green-700 mb-0.5">Frecuencia</p>
            <p className="text-xs text-green-900">{data.plan.frequency}</p>
          </div>
          <div className="col-span-2 p-2.5 rounded-lg bg-green-50 border border-green-100">
            <p className="text-[10px] font-semibold uppercase text-green-700 mb-0.5">Porciones</p>
            <p className="text-xs text-green-900">{data.plan.daily_portions}</p>
          </div>
          <div className="col-span-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-[10px] font-semibold uppercase text-blue-700 mb-0.5">Hidratacion</p>
            <p className="text-xs text-blue-900">{data.plan.hydration}</p>
          </div>
        </div>

        <Separator />

        {/* Forbidden foods */}
        {data.forbidden_foods.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-red-600 mb-1.5">
              Alimentos prohibidos
            </p>
            <div className="flex flex-wrap gap-1">
              {data.forbidden_foods.map((f, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[10px] border-red-200 text-red-700 bg-red-50"
                >
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Safe treats */}
        {data.safe_treats.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-green-600 mb-1.5">
              Snacks seguros
            </p>
            <div className="flex flex-wrap gap-1">
              {data.safe_treats.map((t, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[10px] border-green-200 text-green-700 bg-green-50"
                >
                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Allergy warnings */}
        {data.allergy_warnings.length > 0 && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-[10px] font-semibold uppercase text-amber-700 mb-1">
              Alertas por alergias
            </p>
            {data.allergy_warnings.map((w, i) => (
              <p key={i} className="text-[10px] text-amber-800">
                - {w}
              </p>
            ))}
          </div>
        )}

        {/* Tip */}
        {data.tip && (
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
            <p className="text-[10px] text-indigo-800">
              <Sparkles className="h-3 w-3 inline mr-1 text-indigo-500" />
              {data.tip}
            </p>
          </div>
        )}

        <AIDisclaimer type="medical" />
      </CardContent>
    </Card>
  );
}
