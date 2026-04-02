import { Sparkles } from "lucide-react";

interface Props {
  type?: "medical" | "general";
}

export function AIDisclaimer({ type = "general" }: Props) {
  const text = type === "medical"
    ? "Generado por IA. No reemplaza la consulta con un veterinario profesional."
    : "Contenido generado por inteligencia artificial. Verifica la información.";

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
      <Sparkles className="h-3 w-3 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
