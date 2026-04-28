/**
 * WizardFooter — par de botones [Atrás | Acción primaria] reutilizable.
 *
 * Sprint 1 P2 ARCH-003 (2026-04-28): patrón duplicado en BecomeProviderDialog
 * y BecomeShelterDialog (~70 LoC repetidas entre los dos). Extraído acá para
 * que cualquier wizard nuevo (cuando se agregue Vet partner / Paw Voice form
 * embebido / etc) lo consuma directo sin duplicar el JSX.
 *
 * Soporta 2 modos:
 *   - mode="next": el botón primario dice "Siguiente" y NO muestra loader.
 *   - mode="submit": el botón primario muestra `submitLabel` con `Loader2`
 *     animado mientras `loading=true`.
 */
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface WizardFooterProps {
  onBack: () => void;
  onPrimary: () => void;
  /** "next" para steps intermedios; "submit" para la acción final del wizard. */
  mode: 'next' | 'submit';
  /** Texto del botón primario en modo submit (ej "Crear cuenta"). Ignorado en mode=next. */
  submitLabel?: string;
  /** Loading flag — mientras es true, el botón muestra spinner y "submitLabel" cambia a "Creando…". */
  loading?: boolean;
  /** Si true, el botón primario queda disabled (validación). */
  primaryDisabled?: boolean;
  /** Si true, el botón "Atrás" queda disabled (durante submitting). */
  backDisabled?: boolean;
  /** Texto del botón "Atrás". Default: "Atrás". */
  backLabel?: string;
  /** Texto del botón primario en modo "next". Default: "Siguiente". */
  nextLabel?: string;
  /** Texto del botón primario mientras `loading=true`. Default: "Creando…". */
  loadingLabel?: string;
}

export function WizardFooter({
  onBack,
  onPrimary,
  mode,
  submitLabel = 'Crear',
  loading = false,
  primaryDisabled = false,
  backDisabled = false,
  backLabel = 'Atrás',
  nextLabel = 'Siguiente',
  loadingLabel = 'Creando…',
}: WizardFooterProps) {
  return (
    <div className="flex justify-between gap-3 pt-2">
      <Button type="button" variant="outline" onClick={onBack} disabled={loading || backDisabled}>
        <ArrowLeft className="h-4 w-4 mr-1" /> {backLabel}
      </Button>
      {mode === 'next' ? (
        <Button onClick={onPrimary} disabled={primaryDisabled}>
          {nextLabel} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      ) : (
        <Button onClick={onPrimary} disabled={loading || primaryDisabled}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> {loadingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      )}
    </div>
  );
}
