import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MemorialFlowProps {
  petId: string;
  petName: string;
  onComplete: () => void;
  onCancel: () => void;
}

type Step = "welcome" | "confirm" | "form" | "done";

export function MemorialFlow({ petId, petName, onComplete, onCancel }: MemorialFlowProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    passed_away_at: "",
    passed_away_cause: "",
    memorial_message: "",
  });

  const handleSave = async () => {
    if (!formData.passed_away_at) {
      toast.error("La fecha es necesaria para registrar este momento.");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const undoUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from("pets")
        .update({
          lifecycle_status: "memorial",
          passed_away_at: new Date(formData.passed_away_at).toISOString(),
          passed_away_registered_at: now.toISOString(),
          passed_away_cause: formData.passed_away_cause || null,
          memorial_message: formData.memorial_message || null,
          memorial_undo_until: undoUntil.toISOString(),
          memorial_visibility: "memorial_section_only",
          memorial_remembrance_enabled: false,
        })
        .eq("id", petId);

      if (error) throw error;

      // Mark pending reminders as completed for this pet
      await supabase
        .from("pet_reminders")
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq("pet_id", petId)
        .eq("is_completed", false);

      setStep("done");
    } catch (err) {
      toast.error("No pudimos guardar este momento. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "welcome") {
    return (
      <div className="space-y-6 text-center max-w-md mx-auto py-8 px-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
          <Heart className="h-6 w-6 text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">
          Lamentamos profundamente lo que estás viviendo.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Sabemos que perder a {petName} es una de las experiencias más difíciles
          que puede atravesar una persona. Tomate todo el tiempo que necesites.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Si quieres, podemos ayudarte a registrar este momento en la app y
          acompañarte en el camino. No hay apuro.
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={() => setStep("confirm")} className="bg-purple-600 hover:bg-purple-700">
            Continuar cuando esté listo
          </Button>
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
            Mejor en otro momento
          </Button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-6 max-w-md mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold text-slate-800">
          ¿Quieres registrar la despedida de {petName}?
        </h2>
        <p className="text-muted-foreground">Esto es lo que va a pasar:</p>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            Su ficha pasará a tu sección "En memoria"
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            Se cancelarán recordatorios futuros
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            Su historial médico se preservará completo
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            Podemos acompañarte si lo necesitas
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Puedes deshacer esto en cualquier momento durante las próximas 24 horas.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={() => setStep("form")} className="bg-purple-600 hover:bg-purple-700">
            Sí, continuar
          </Button>
          <Button variant="ghost" onClick={() => setStep("welcome")}>
            Volver atrás
          </Button>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="space-y-6 max-w-md mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Cuéntanos lo que quieras compartir
        </h2>
        <p className="text-xs text-muted-foreground">
          Todos los campos son opcionales, excepto la fecha.
        </p>

        <div className="space-y-2">
          <Label htmlFor="passed_date">¿Cuándo nos dejó {petName}? *</Label>
          <Input
            id="passed_date"
            type="date"
            max={new Date().toISOString().split("T")[0]}
            value={formData.passed_away_at}
            onChange={(e) => setFormData((f) => ({ ...f, passed_away_at: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cause">¿Quieres compartir cómo? (opcional)</Label>
          <Textarea
            id="cause"
            placeholder="Vejez, enfermedad, accidente, prefiero no contarlo..."
            maxLength={300}
            value={formData.passed_away_cause}
            onChange={(e) => setFormData((f) => ({ ...f, passed_away_cause: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">¿Quieres dejarle un mensaje a {petName}? (opcional)</Label>
          <Textarea
            id="message"
            placeholder="Lo que quieras decirle..."
            maxLength={500}
            value={formData.memorial_message}
            onChange={(e) => setFormData((f) => ({ ...f, memorial_message: e.target.value }))}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={loading || !formData.passed_away_at}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? "Guardando..." : "Guardar este momento"}
        </Button>
      </div>
    );
  }

  // step === "done"
  return (
    <div className="space-y-6 text-center max-w-md mx-auto py-8 px-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
        <Heart className="h-6 w-6 text-purple-300" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800">
        {petName} ahora descansa en tu sección "En memoria"
      </h2>
      <p className="text-muted-foreground leading-relaxed">
        Hemos guardado todos sus recuerdos con cuidado. Su historial médico está
        intacto y siempre podrás visitarla.
      </p>
      <div className="flex flex-col gap-3 pt-4">
        <Button onClick={onComplete} className="bg-purple-600 hover:bg-purple-700">
          Ir a En memoria
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
          Quiero estar solo por ahora
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Si esto fue por error, puedes deshacerlo desde "En memoria" durante las próximas 24 horas.
      </p>
    </div>
  );
}
