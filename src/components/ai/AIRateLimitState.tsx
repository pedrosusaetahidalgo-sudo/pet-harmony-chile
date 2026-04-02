import { Clock } from "lucide-react";

interface Props {
  skillLabel: string;
}

export function AIRateLimitState({ skillLabel }: Props) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
      <Clock className="h-5 w-5 flex-shrink-0" />
      <p>Has usado todos tus análisis de <strong>{skillLabel}</strong> por hoy. Renueva mañana.</p>
    </div>
  );
}
