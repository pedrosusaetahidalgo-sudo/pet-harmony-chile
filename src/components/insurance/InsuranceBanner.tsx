/**
 * InsuranceBanner — banner sutil en /home que ofrece cotizar seguro a un
 * dueño con ficha completa. Refactor Maestro Fase 2 §7.2.
 *
 * No visible hasta que partner aseguradora firme. El componente esta listo
 * pero gateado por el flag EMBEDDED_INSURANCE = false en featureFlags.ts.
 *
 * Diseño:
 *   - Banner discreto (no popup, no bloqueante)
 *   - Solo aparece si la mascota tiene ficha minima (raza + edad + peso)
 *     porque sin esa data la cotizacion seria inutil
 *   - CTA "Cotizar 1-click" navega a /seguros/cotizar/:petId (no creada
 *     todavia; se conecta cuando el partner firme y tengamos endpoint)
 *   - Dismiss-able: el dueño lo cierra y no aparece en 30d para esa mascota
 *     (LS key 'pf-insurance-dismiss-:petId')
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, X } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

interface InsuranceBannerProps {
  petId: string;
  petName: string;
  hasMinimalProfile: boolean;
}

const DISMISS_DAYS = 30;

function dismissKey(petId: string): string {
  return `pf-insurance-dismiss-${petId}`;
}

function isDismissed(petId: string): boolean {
  try {
    const raw = localStorage.getItem(dismissKey(petId));
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt)) return false;
    const ageMs = Date.now() - dismissedAt;
    return ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InsuranceBanner({ petId, petName, hasMinimalProfile }: InsuranceBannerProps) {
  const flagOn = isFeatureEnabled('EMBEDDED_INSURANCE');
  const [dismissed, setDismissed] = useState(() => isDismissed(petId));

  const shouldShow = useMemo(() => {
    if (!flagOn) return false;
    if (!hasMinimalProfile) return false;
    if (dismissed) return false;
    return true;
  }, [flagOn, hasMinimalProfile, dismissed]);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissKey(petId), String(Date.now()));
    } catch {
      // no-op
    }
    setDismissed(true);
    // El evento todavia no esta tipado en RefactorEvent; usar generic track
    trackRefactor(RefactorEvent.quickActionTapped, {
      action: 'insurance_banner_dismissed',
      pet_id: petId,
    });
  };

  const handleClick = () => {
    trackRefactor(RefactorEvent.quickActionTapped, {
      action: 'insurance_banner_clicked',
      pet_id: petId,
    });
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900">
            Seguro para {petName} desde $8.000/mes
          </p>
          <p className="text-xs text-emerald-700">
            La cotizacion sale prellenada con la ficha. 30 segundos.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={handleClick}
        >
          <Link to={`/seguros/cotizar/${petId}`}>Cotizar</Link>
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Ocultar banner de seguro"
          className="h-7 w-7 rounded-full hover:bg-white/40 flex items-center justify-center text-emerald-700 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}
