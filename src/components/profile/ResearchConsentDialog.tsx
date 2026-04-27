/**
 * ResearchConsentDialog — dialog explicativo del opt-in de data anonima
 * para insights B2B agregados.
 *
 * Refactor Maestro Fase 2 §7.3.
 *
 * Diseño:
 *   - Lenguaje claro, sin lego, sin tecnicismos
 *   - Explica que "anonimo" significa de verdad (sin nombre, sin direccion)
 *   - Dice quien paga y por que (Pharma + aseguradoras → sostener app gratis)
 *   - Ofrece dos botones simetricos (sin dark patterns); dejarlos pensar
 *   - El usuario puede cambiar de opinion despues desde el mismo lugar
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useResearchConsent } from '@/hooks/useResearchConsent';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResearchConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResearchConsentDialog({ open, onOpenChange }: ResearchConsentDialogProps) {
  const { consent, decidedAt, isLoading, setConsent, isSaving } = useResearchConsent();

  const handleAccept = () => {
    setConsent(true);
    onOpenChange(false);
  };

  const handleDecline = () => {
    setConsent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Tu data anonima puede sostener Paw Friend
          </DialogTitle>
          <DialogDescription className="text-left">
            Paw Friend es y va a seguir siendo gratis para vos. Para sostenerlo, vendemos insights
            agregados anonimos a empresas que cuidan mascotas (laboratorios farmaceuticos,
            aseguradoras, universidades).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="font-medium text-emerald-900 mb-1">¿Qué significa "anonimo"?</p>
            <ul className="space-y-1 text-emerald-800 list-disc pl-5">
              <li>Tu nombre, dirección y contacto NO se comparten nunca.</li>
              <li>
                Tampoco el nombre o foto de tu mascota — solo data agregada (raza, peso, edad,
                comuna).
              </li>
              <li>Solo se usa cuando hay 50+ mascotas con la misma característica.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="font-medium text-purple-900 mb-1">¿Para qué sirve?</p>
            <p className="text-purple-800">
              Estudios sobre salud animal, mejores tratamientos, seguros más justos. La plata vuelve
              a Paw Friend para que siga gratis.
            </p>
          </div>

          {consent !== null && decidedAt && (
            <p className="text-xs text-muted-foreground italic">
              Decidiste {consent ? 'aceptar' : 'no participar'} el{' '}
              {format(new Date(decidedAt), "d 'de' MMMM yyyy", { locale: es })}. Podés cambiarlo
              ahora si querés.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Esta decision es opcional y no afecta nada de la app. Podes cambiarla cuando quieras
            desde tu perfil.
          </p>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isLoading || isSaving}
            className="sm:flex-1"
          >
            No participar
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isLoading || isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 sm:flex-1"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sumar mi data anonima'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
