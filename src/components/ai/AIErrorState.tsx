import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function AIErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-center">
      <AlertCircle className="h-8 w-8 text-destructive/60" />
      <p className="text-sm text-muted-foreground">
        {message || "No se pudo completar el análisis. Intenta de nuevo."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
