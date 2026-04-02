import { Sparkles } from "lucide-react";

interface Props {
  message?: string;
  petName?: string;
}

export function AILoadingState({ message, petName }: Props) {
  const text = message || (petName ? `Analizando a ${petName}...` : "Procesando con IA...");
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 animate-pulse">
      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-4 w-4 text-primary animate-spin" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-primary/10 rounded-full w-3/4" />
        <div className="h-3 bg-primary/10 rounded-full w-1/2" />
      </div>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
