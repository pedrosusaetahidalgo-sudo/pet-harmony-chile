import { useState } from 'react';
import { ClipboardList, CheckCircle, Sparkles, Loader2, HelpCircle, Pencil } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAISkill } from '@/hooks/useAISkill';
import { AIDisclaimer } from './AIDisclaimer';
import { AIRateLimitState } from './AIRateLimitState';

interface PrepResponse {
  questions_for_vet: string[];
  info_checklist: string[];
  observations_to_record: string[];
  tip: string;
  disclaimer: string;
  pet_name: string;
  remaining: number;
}

interface Props {
  petId: string;
  petName: string;
}

export function ConsultationPrep({ petId, petName }: Props) {
  const [reason, setReason] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const { data, isLoading, error, isRateLimited, invoke, reset } = useAISkill<
    { pet_id: string; reason: string },
    PrepResponse
  >({
    functionName: 'consultation-prep',
    skillLabel: 'Preparador de Consulta',
  });

  const handleGenerate = () => {
    if (reason.trim().length < 5) return;
    invoke({ pet_id: petId, reason: reason.trim() });
  };

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  if (!data) {
    return (
      <Card className="border-indigo-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
            Preparar consulta de {petName}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              IA
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Describe el motivo de la consulta y te genero una lista de preguntas y un checklist para
            aprovecharla al maximo.
          </p>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Ej: ${petName} tiene tos seca desde hace 3 dias`}
            className="text-xs h-9"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerate();
            }}
          />
          <Button
            onClick={handleGenerate}
            disabled={isLoading || isRateLimited || reason.trim().length < 5}
            className="w-full h-9 text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            Preparar consulta
          </Button>
          {isRateLimited && <AIRateLimitState skillLabel="Preparador" />}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
            Preparacion para la consulta
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => {
              reset();
              setCheckedItems(new Set());
            }}
          >
            Nuevo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Questions for vet */}
        {data.questions_for_vet.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 mb-2 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              Preguntas para el veterinario
            </p>
            <div className="space-y-1.5">
              {data.questions_for_vet.map((q, i) => (
                <button
                  key={i}
                  onClick={() => toggleCheck(`q-${i}`)}
                  className={`flex items-start gap-2 w-full text-left p-2 rounded-md transition-colors text-xs ${
                    checkedItems.has(`q-${i}`)
                      ? 'bg-green-50 line-through text-muted-foreground'
                      : 'bg-indigo-50 hover:bg-indigo-100'
                  }`}
                >
                  <span
                    className={`mt-0.5 h-3.5 w-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                      checkedItems.has(`q-${i}`)
                        ? 'bg-green-500 border-green-500'
                        : 'border-indigo-300'
                    }`}
                  >
                    {checkedItems.has(`q-${i}`) && (
                      <CheckCircle className="h-2.5 w-2.5 text-white" />
                    )}
                  </span>
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Checklist */}
        {data.info_checklist.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mb-2 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Que llevar / preparar
            </p>
            <div className="space-y-1">
              {data.info_checklist.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleCheck(`c-${i}`)}
                  className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md transition-colors text-xs ${
                    checkedItems.has(`c-${i}`)
                      ? 'line-through text-muted-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded border flex-shrink-0 flex items-center justify-center ${
                      checkedItems.has(`c-${i}`)
                        ? 'bg-green-500 border-green-500'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {checkedItems.has(`c-${i}`) && <CheckCircle className="h-2 w-2 text-white" />}
                  </span>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Observations to record */}
        {data.observations_to_record.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-2 flex items-center gap-1">
              <Pencil className="h-3 w-3" />
              Que observar y anotar
            </p>
            <div className="space-y-1">
              {data.observations_to_record.map((obs, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-1">
                  - {obs}
                </p>
              ))}
            </div>
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

        <AIDisclaimer type="general" />
      </CardContent>
    </Card>
  );
}
