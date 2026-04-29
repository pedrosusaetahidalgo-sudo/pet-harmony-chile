/* eslint-disable react-refresh/only-export-components -- constantes locales conviven con el componente (no amerita split) */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { isWeb } from '@/lib/platform';

const CONSENT_KEY = 'pf_cookie_consent';
// 2026-04-30: incluir PostHog en HAS_TRACKING. Cierra hallazgo del
// production readiness doc: "PostHog lo trackea sin consent banner".
const HAS_TRACKING = Boolean(
  import.meta.env.VITE_META_PIXEL_ID ||
  import.meta.env.VITE_FIREBASE_API_KEY ||
  import.meta.env.VITE_POSTHOG_KEY
);

type ConsentState = 'pending' | 'accepted' | 'rejected';

/**
 * Cookie/tracking consent banner for web.
 * On native, tracking consent is handled by iOS ATT / Android privacy settings.
 */
export const CookieConsentBanner = () => {
  const [consent, setConsent] = useState<ConsentState>('accepted');

  useEffect(() => {
    if (!isWeb()) return;
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentState | null;
    setConsent(stored || 'pending');
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
    // Re-init analytics ahora que tenemos consent (PostHog/Meta/Firebase
    // estaban gateados en el primer load).
    import('@/lib/analytics').then((m) => m.initAnalytics?.()).catch(() => {});
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setConsent('rejected');
    // Si por alguna razon PostHog ya estaba activo (race condition pre-banner),
    // forzar opt-out. Best-effort: si la lib no esta cargada, no pasa nada.
    import('posthog-js')
      .then((m) => {
        try {
          m.default.opt_out_capturing?.();
        } catch {
          // posthog no inicializado, OK
        }
      })
      .catch(() => {});
  };

  // Don't show on native, if already decided, or if no tracking is configured
  if (!isWeb() || !HAS_TRACKING || consent !== 'pending') return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border px-4 pt-4 shadow-lg animate-fade-in"
      style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom))' }}
      role="region"
      aria-label="Consentimiento de cookies"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Usamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso de la
          app y personalizar contenido. Puedes aceptar o rechazar las cookies opcionales.{' '}
          <a href="/privacy" className="underline text-primary">
            Política de Privacidad
          </a>
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleReject}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Solo esenciales
          </Button>
          <Button onClick={handleAccept} className="w-full sm:w-auto min-h-[44px]">
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Check if user has consented to tracking cookies.
 */
export function hasTrackingConsent(): boolean {
  if (!isWeb()) return true; // Native uses ATT
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}
