import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Heart, Loader2, Stethoscope } from "@/lib/icons";
import { Label } from "@/components/ui/label";

/* ────────── Scale definitions ────────── */

interface ActionUnit {
  id: string;
  label: string;
  options: [string, string, string]; // score 0, 1, 2
}

const FELINE_SCALE: ActionUnit[] = [
  {
    id: "ears",
    label: "Posición de las orejas",
    options: ["Hacia adelante", "Ligeramente separadas", "Aplanadas / rotadas"],
  },
  {
    id: "muzzle",
    label: "Tensión del hocico",
    options: ["Relajado", "Ligeramente tenso", "Muy tenso / mandíbula apretada"],
  },
  {
    id: "whiskers",
    label: "Posición de los bigotes",
    options: ["Sueltos / curvados", "Ligeramente rectos", "Rectos / hacia adelante"],
  },
  {
    id: "eyes",
    label: "Apertura de los ojos",
    options: ["Abiertos", "Parcialmente cerrados", "Entrecerrados / cerrados"],
  },
  {
    id: "head",
    label: "Posición de la cabeza",
    options: [
      "Por encima de la línea del hombro",
      "Alineada con el hombro",
      "Por debajo / inclinada",
    ],
  },
];

const CANINE_SCALE: ActionUnit[] = [
  {
    id: "face",
    label: "Expresión facial",
    options: ["Relajada", "Tensa", "Muy tensa / mueca"],
  },
  {
    id: "posture",
    label: "Postura corporal",
    options: ["Normal", "Rígida / encorvada", "Muy rígida / inmóvil"],
  },
  {
    id: "activity",
    label: "Actividad",
    options: ["Normal", "Reducida", "Muy reducida / ausente"],
  },
  {
    id: "vocalization",
    label: "Vocalización",
    options: ["Normal", "Quejidos ocasionales", "Quejidos / aullidos frecuentes"],
  },
  {
    id: "touch",
    label: "Reacción al tacto",
    options: ["Normal", "Se retira", "Agresivo / muy reactivo"],
  },
];

/* ────────── Interpretation helpers ────────── */

function getInterpretation(score: number) {
  if (score <= 3) {
    return {
      label: "Dolor mínimo o ausente",
      color: "bg-green-100 text-green-800 border-green-300",
      progressColor: "bg-green-500",
      severity: "low" as const,
    };
  }
  if (score <= 6) {
    return {
      label: "Dolor moderado — considera consulta veterinaria",
      color: "bg-amber-100 text-amber-800 border-amber-300",
      progressColor: "bg-amber-500",
      severity: "medium" as const,
    };
  }
  return {
    label: "Dolor severo — consulta veterinaria urgente",
    color: "bg-red-100 text-red-800 border-red-300",
    progressColor: "bg-red-500",
    severity: "high" as const,
  };
}

/* ────────── Component ────────── */

interface GrimaceChecklistProps {
  petId: string;
  petName: string;
  species: string; // "gato" | "perro"
}

export function GrimaceChecklist({ petId, petName, species }: GrimaceChecklistProps) {
  const isCat = species.toLowerCase() === "gato";
  const scale = isCat ? FELINE_SCALE : CANINE_SCALE;
  const maxScore = scale.length * 2;

  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const answered = Object.keys(scores).length;
  const allAnswered = answered === scale.length;
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const interpretation = getInterpretation(totalScore);

  function handleScore(unitId: string, value: string) {
    setScores((prev) => ({ ...prev, [unitId]: Number(value) }));
  }

  function resetForm() {
    setScores({});
  }

  async function handleSave() {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar la evaluación.");
      return;
    }
    if (!allAnswered) {
      toast.error("Completa todas las categorías antes de guardar.");
      return;
    }

    setSaving(true);
    try {
      const detailScores = scale.map((unit) => ({
        id: unit.id,
        label: unit.label,
        score: scores[unit.id] ?? 0,
        description: unit.options[scores[unit.id] ?? 0],
      }));

      const { error } = await supabase.from("medical_records").insert({
        pet_id: petId,
        owner_id: user.id,
        record_type: "otro",
        title: isCat
          ? "Evaluación de dolor — Escala de Grimace Felina"
          : "Evaluación de dolor — Escala canina",
        description: `Puntaje total: ${totalScore}/${maxScore}. ${interpretation.label}. Detalle: ${detailScores.map((d) => `${d.label}: ${d.score}/2 (${d.description})`).join("; ")}`,
        date: format(new Date(), "yyyy-MM-dd"),
        notes: JSON.stringify({
          assessment_type: "pain_grimace_scale",
          species: isCat ? "feline" : "canine",
          total_score: totalScore,
          max_score: maxScore,
          severity: interpretation.severity,
          details: detailScores,
        }),
      });

      if (error) throw error;

      toast.success("Evaluación de dolor guardada en la ficha clínica.");
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving pain assessment:", err);
      toast.error("No se pudo guardar la evaluación. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Stethoscope className="h-4 w-4" />
          Evaluar dolor
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {isCat ? "Escala de Grimace Felina" : "Evaluación de dolor canino"}
          </DialogTitle>
          <DialogDescription>
            Evalúa el nivel de dolor de {petName} observando cada categoría.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {scale.map((unit) => (
            <Card key={unit.id}>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-sm font-medium mb-3">{unit.label}</p>
                <RadioGroup
                  value={scores[unit.id] !== undefined ? String(scores[unit.id]) : undefined}
                  onValueChange={(v) => handleScore(unit.id, v)}
                  className="space-y-2"
                >
                  {unit.options.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <RadioGroupItem value={String(idx)} id={`${unit.id}-${idx}`} />
                      <Label
                        htmlFor={`${unit.id}-${idx}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        <span className="font-medium text-muted-foreground mr-1.5">
                          {idx}
                        </span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          {/* Score summary */}
          {allAnswered && (
            <Card className="border-2">
              <CardContent className="pt-4 pb-4 px-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Puntaje total</span>
                  <span className="text-lg font-bold">
                    {totalScore} / {maxScore}
                  </span>
                </div>
                <Progress
                  value={(totalScore / maxScore) * 100}
                  className="h-2.5"
                />
                <Badge
                  variant="outline"
                  className={`text-xs px-3 py-1 ${interpretation.color}`}
                >
                  {interpretation.severity === "high" && (
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5 inline" />
                  )}
                  {interpretation.label}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Esta evaluación es orientativa. Ante cualquier duda, consulta con tu veterinario.
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setOpen(false); resetForm(); }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!allAnswered || saving}
              onClick={handleSave}
              className="gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar evaluación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
