import { useState } from 'react';
import {
  Send,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Shield,
  ArrowRight,
  Stethoscope,
} from '@/lib/icons';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAISkill } from '@/hooks/useAISkill';
import { AILoadingState } from './AILoadingState';
import { AIErrorState } from './AIErrorState';
import { AIRateLimitState } from './AIRateLimitState';
import { AIDisclaimer } from './AIDisclaimer';

interface TriageResponse {
  step: 'clasificacion' | 'preguntas' | 'resultado';
  message: string;
  urgency: 'emergencia' | 'urgente' | 'pronto' | 'rutina' | null;
  category: string | null;
  questions: string[];
  action: string | null;
  show_directory: boolean;
  disclaimer: string;
  pet_name: string;
  remaining: number;
}

interface Props {
  petId: string;
  petName: string;
  onClose?: () => void;
  onShowDirectory?: () => void;
}

const URGENCY_CONFIG: Record<
  'emergencia' | 'urgente' | 'pronto' | 'rutina',
  { color: string; label: string; Icon: LucideIcon; iconClass: string }
> = {
  emergencia: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Emergencia',
    Icon: AlertCircle,
    iconClass: 'text-red-600',
  },
  urgente: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Urgente',
    Icon: AlertTriangle,
    iconClass: 'text-orange-600',
  },
  pronto: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Consulta pronto',
    Icon: Clock,
    iconClass: 'text-amber-600',
  },
  rutina: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Rutina',
    Icon: CheckCircle2,
    iconClass: 'text-green-600',
  },
};

export function SymptomTriage({ petId, petName, onClose, onShowDirectory }: Props) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string; data?: TriageResponse }>
  >([]);

  const { isLoading, error, isRateLimited, invoke } = useAISkill<
    {
      message: string;
      pet_id: string;
      conversation_history?: Array<{ role: string; content: string }>;
    },
    TriageResponse
  >({
    functionName: 'symptom-triage',
    skillLabel: 'Triage de Sintomas',
    onSuccess: (data) => {
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: data.message, data },
      ]);
      setInput('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const conversationHistory = history.map((h) => ({
      role: h.role,
      content: h.role === 'assistant' && h.data ? JSON.stringify(h.data) : h.content,
    }));

    invoke({
      message: input.trim(),
      pet_id: petId,
      conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined,
    });
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
  };

  const lastAssistantMsg = [...history].reverse().find((h) => h.role === 'assistant');
  const currentUrgency = lastAssistantMsg?.data?.urgency;
  const showResult = lastAssistantMsg?.data?.step === 'resultado';

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Triage de {petName}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              IA
            </Badge>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 overflow-y-auto space-y-3">
          {history.length === 0 && !isLoading && (
            <div className="text-center py-4">
              <Stethoscope className="h-8 w-8 text-blue-500/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Describe los sintomas de {petName} y te ayudo a evaluar la urgencia.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {[
                  `${petName} esta vomitando`,
                  `Tiene una herida`,
                  `No quiere comer desde ayer`,
                  `Esta cojeando`,
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-[10px] px-2 py-1 rounded-full bg-blue-500/5 text-blue-600 hover:bg-blue-500/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((item, i) => (
            <div key={i}>
              {item.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-xl rounded-tr-sm max-w-[85%]">
                    {item.content}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-muted/50 text-xs px-3 py-2.5 rounded-xl rounded-tl-sm max-w-[85%] space-y-2">
                    {/* Urgency badge */}
                    {item.data?.urgency &&
                      URGENCY_CONFIG[item.data.urgency] &&
                      (() => {
                        const cfg = URGENCY_CONFIG[item.data.urgency];
                        return (
                          <div className="flex items-center gap-1.5">
                            <Badge className={`text-[10px] flex items-center gap-1 ${cfg.color}`}>
                              <cfg.Icon className={`h-3 w-3 ${cfg.iconClass}`} />
                              {cfg.label}
                            </Badge>
                          </div>
                        );
                      })()}

                    <p className="whitespace-pre-line leading-relaxed">
                      {item.data?.message || item.content}
                    </p>

                    {/* Suggested question — una sola, la mas relevante.
                         Feedback Pedro 2026-04-21: "deberia ser la pregunta
                         de a una y las respuestas. no muchas preguntas".
                         La IA puede devolver varias en data.questions pero
                         mostramos solo la primera para no abrumar. */}
                    {item.data?.questions && item.data.questions.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {item.data.questions.slice(0, 1).map((q, j) => (
                          <button
                            key={j}
                            onClick={() => handleQuestionClick(q)}
                            className="block w-full text-left text-[10px] px-2 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <ArrowRight className="h-2.5 w-2.5 inline mr-1" />
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Show directory CTA */}
                    {item.data?.show_directory && onShowDirectory && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] w-full mt-1 border-blue-200 text-blue-700"
                        onClick={onShowDirectory}
                      >
                        Buscar veterinario en el directorio
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && <AILoadingState message="Evaluando sintomas..." />}
        </div>

        {isRateLimited && <AIRateLimitState skillLabel="Triage" />}
        {error && <AIErrorState message={error} />}

        {/* Result summary card */}
        {showResult &&
          currentUrgency &&
          URGENCY_CONFIG[currentUrgency] &&
          (() => {
            const cfg = URGENCY_CONFIG[currentUrgency];
            return (
              <div className={`p-3 rounded-lg border-2 ${cfg.color}`}>
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <cfg.Icon className={`h-4 w-4 ${cfg.iconClass}`} />
                  Resultado: {cfg.label}
                </p>
              </div>
            );
          })()}

        {!showResult && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe los sintomas..."
              className="text-xs h-9"
              disabled={isLoading || isRateLimited}
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        )}

        <AIDisclaimer type="medical" />
      </CardContent>
    </Card>
  );
}
