import { useState } from "react";
import { Send, Sparkles, AlertTriangle, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAISkill } from "@/hooks/useAISkill";
import { AILoadingState } from "./AILoadingState";
import { AIErrorState } from "./AIErrorState";
import { AIRateLimitState } from "./AIRateLimitState";
import { AIDisclaimer } from "./AIDisclaimer";

interface PetAssistantResponse {
  respuesta: string;
  nivel_urgencia: "bajo" | "medio" | "alto";
  requiere_veterinario: boolean;
  recordatorios_relevantes: string[];
  sugerencias_accion: string[];
  pet_name: string;
  remaining: number;
}

interface Props {
  petId: string;
  petName: string;
  onClose?: () => void;
}

export function PetAssistant({ petId, petName, onClose }: Props) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Array<{ q: string; a: PetAssistantResponse }>>([]);

  const { isLoading, error, isRateLimited, invoke, reset } = useAISkill<
    { question: string; pet_id: string },
    PetAssistantResponse
  >({
    functionName: "pet-assistant",
    skillLabel: "Asistente Veterinario",
    onSuccess: (data) => {
      setHistory((prev) => [...prev, { q: question, a: data }]);
      setQuestion("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    invoke({ question: question.trim(), pet_id: petId });
  };

  const urgencyColors = {
    bajo: "bg-green-100 text-green-800",
    medio: "bg-amber-100 text-amber-800",
    alto: "bg-red-100 text-red-800",
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Asistente de {petName}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">IA</Badge>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Chat history */}
        <div className="max-h-64 overflow-y-auto space-y-3">
          {history.length === 0 && !isLoading && (
            <div className="text-center py-4">
              <Sparkles className="h-8 w-8 text-primary/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Preguntame sobre {petName}. Conozco su ficha clinica completa.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {[
                  `Cuando toca la proxima vacuna de ${petName}?`,
                  `${petName} no quiere comer`,
                  `Es normal que duerma tanto?`,
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setQuestion(suggestion); }}
                    className="text-[10px] px-2 py-1 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((item, i) => (
            <div key={i} className="space-y-2">
              {/* User question */}
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-xl rounded-tr-sm max-w-[85%]">
                  {item.q}
                </div>
              </div>
              {/* AI response */}
              <div className="space-y-2">
                <div className="bg-muted/50 text-xs px-3 py-2 rounded-xl rounded-tl-sm max-w-[85%]">
                  {item.a.requiere_veterinario && (
                    <div className="flex items-center gap-1.5 mb-2 text-red-600 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Recomendamos consultar con un veterinario
                    </div>
                  )}
                  <p className="whitespace-pre-line">{item.a.respuesta}</p>
                  {item.a.sugerencias_accion.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-medium text-[10px] text-muted-foreground">Sugerencias:</p>
                      {item.a.sugerencias_accion.map((s, j) => (
                        <p key={j} className="text-[10px] text-muted-foreground">* {s}</p>
                      ))}
                    </div>
                  )}
                  {item.a.recordatorios_relevantes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-medium text-[10px] text-amber-700">Recordatorios relacionados:</p>
                      {item.a.recordatorios_relevantes.map((r, j) => (
                        <p key={j} className="text-[10px] text-amber-600">! {r}</p>
                      ))}
                    </div>
                  )}
                </div>
                <Badge className={`text-[9px] ${urgencyColors[item.a.nivel_urgencia]}`}>
                  Urgencia: {item.a.nivel_urgencia}
                </Badge>
              </div>
            </div>
          ))}

          {isLoading && <AILoadingState petName={petName} />}
        </div>

        {isRateLimited && <AIRateLimitState skillLabel="Asistente Veterinario" />}
        {error && <AIErrorState message={error} onRetry={() => invoke({ question, pet_id: petId })} />}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Pregunta sobre ${petName}...`}
            className="text-xs h-9"
            disabled={isLoading || isRateLimited}
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            disabled={isLoading || isRateLimited || !question.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>

        <AIDisclaimer type="medical" />
      </CardContent>
    </Card>
  );
}
