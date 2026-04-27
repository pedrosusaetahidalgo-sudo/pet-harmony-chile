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
import { AlertTriangle, X, Syringe, Scale, Calendar, Cake, Bug, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  usePetHealthAlerts,
  type HealthAlertSeverity,
  type HealthAlertType,
} from '@/hooks/usePetHealthAlerts';
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

// Cada tipo de alerta tiene su icono y CTA contextual hacia la pestaña
// que el dueño necesita para resolverla. El message viene de la DB; aqui
// solo decidimos donde lo mandamos cuando hace clic.
type TypeMeta = {
  icon: typeof AlertTriangle;
  ctaLabel: string;
  buildHref: (petId: string) => string;
};

const ALERT_TYPE_META: Record<HealthAlertType, TypeMeta> = {
  vaccine_overdue: {
    icon: Syringe,
    ctaLabel: 'Agendar vacuna',
    buildHref: (petId) => `${LINKS.petClinical(petId)}?tab=cuidados&focus=vacunas`,
  },
  weight_loss_30d: {
    icon: Scale,
    ctaLabel: 'Registrar peso',
    buildHref: (petId) => `${LINKS.petClinical(petId)}?tab=cuidados&focus=peso`,
  },
  no_activity_7d: {
    icon: Calendar,
    ctaLabel: 'Volver a la app',
    buildHref: (petId) => `${LINKS.petClinical(petId)}?tab=historia`,
  },
  antiparasitic_overdue: {
    icon: Bug,
    ctaLabel: 'Aplicar antiparasitario',
    buildHref: (petId) => `${LINKS.petClinical(petId)}?tab=cuidados&focus=antiparasitarios`,
  },
  birthday_window: {
    icon: Cake,
    ctaLabel: 'Ver cumple',
    buildHref: (petId) => `${LINKS.petClinical(petId)}?tab=historia`,
  },
  memorial_anniversary: {
    icon: Heart,
    ctaLabel: 'Visitar memorial',
    buildHref: (petId) => `/memoria/${petId}`,
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
        const meta = ALERT_TYPE_META[alert.alert_type] ?? {
          icon: AlertTriangle,
          ctaLabel: 'Ver ficha',
          buildHref: (petId: string) => `${LINKS.petClinical(petId)}?tab=cuidados`,
        };
        const Icon = meta.icon;
        return (
          <Card key={alert.id} className={cn('p-3', style.card)}>
            <div className="flex items-start gap-3">
              <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', style.icon)} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-[10px] uppercase tracking-wider font-semibold', style.icon)}>
                  {style.label}
                </p>
                <p className="text-sm text-slate-900 mt-0.5">{alert.message}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(meta.buildHref(alert.pet_id))}
                    className="h-7 text-xs"
                  >
                    {meta.ctaLabel}
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
