/**
 * PetHealthAlertsBanner — banner para alertas automaticas en /home.
 *
 * Refactor Maestro §2.8.3 (cascadas) + §2.8 ambient computing.
 *
 * Solo se renderiza si el flag CASCADE_WEIGHT_ALERTS esta on Y la mascota
 * tiene alertas no-dismissed. Severity controla el color del banner.
 *
 * Severity → tone:
 *   low    → amarillo (informativo)
 *   medium → naranja (atencion)
 *   high   → rojo (urgente, "ver al vet")
 *
 * Click "Marcar revisado" → dismiss.
 * Click body del banner → navega a la ficha (tab Cuidados) para registrar
 * peso o evento medico.
 */
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { usePetHealthAlerts, type HealthAlertSeverity } from '@/hooks/usePetHealthAlerts';
import { LINKS } from '@/lib/links';

interface Props {
  petId: string;
}

const SEVERITY_STYLES: Record<HealthAlertSeverity, { card: string; icon: string; label: string }> =
  {
    low: {
      card: 'border-amber-200 bg-amber-50',
      icon: 'text-amber-700',
      label: 'Atencion',
    },
    medium: {
      card: 'border-orange-200 bg-orange-50',
      icon: 'text-orange-700',
      label: 'Importante',
    },
    high: {
      card: 'border-red-200 bg-red-50',
      icon: 'text-red-700',
      label: 'Urgente — vet',
    },
  };

export function PetHealthAlertsBanner({ petId }: Props) {
  const navigate = useNavigate();
  const flagOn = isFeatureEnabled('CASCADE_WEIGHT_ALERTS');
  const { alerts, dismiss } = usePetHealthAlerts(flagOn ? petId : undefined);

  if (!flagOn || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const style = SEVERITY_STYLES[alert.severity];
        return (
          <Card key={alert.id} className={cn('p-3', style.card)}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn('h-5 w-5 shrink-0 mt-0.5', style.icon)} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-[10px] uppercase tracking-wider font-semibold', style.icon)}>
                  {style.label}
                </p>
                <p className="text-sm text-slate-900 mt-0.5">{alert.message}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`${LINKS.petClinical(alert.pet_id)}?tab=cuidados`)}
                    className="h-7 text-xs"
                  >
                    Ver ficha
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismiss(alert.id)}
                    className="h-7 text-xs text-muted-foreground"
                  >
                    Marcar revisado
                  </Button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(alert.id)}
                aria-label="Cerrar alerta"
                className="h-6 w-6 rounded-full hover:bg-white/50 flex items-center justify-center text-slate-500 shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
