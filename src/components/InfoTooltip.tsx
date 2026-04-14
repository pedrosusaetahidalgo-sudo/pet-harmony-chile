import { HelpCircle } from '@/lib/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InfoTooltipProps {
  /** The explanation text */
  text: string;
  /** Optional: where the user can find this data */
  where?: string;
  /** Size of the icon */
  size?: 'sm' | 'md';
}

/**
 * Icono (?) con tooltip informativo. Usar en datos que pueden ser
 * dificiles de encontrar o que necesitan contexto adicional.
 *
 * Ejemplo: <InfoTooltip text="Promedio de calificaciones" where="Perfil publico > Resenas" />
 */
export function InfoTooltip({ text, where, size = 'sm' }: InfoTooltipProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Mas informacion"
          >
            <HelpCircle className={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          <p>{text}</p>
          {where && <p className="text-muted-foreground mt-1 text-[10px]">Encontrar en: {where}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
