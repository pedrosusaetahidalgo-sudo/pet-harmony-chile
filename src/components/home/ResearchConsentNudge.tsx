/**
 * ResearchConsentNudge — banner sutil en /home que invita al opt-in de
 * data anonima para sostener la app.
 *
 * Refactor Maestro Fase 2 §7.3.
 *
 * Aparece solo si:
 *   - flag RESEARCH_CONSENT_FLOW esta activo
 *   - el usuario nunca decidio (consent === null)
 *   - no fue dismissed en los ultimos 14 dias (LS)
 *
 * Diseño:
 *   - Discreto (no popup, no bloqueante)
 *   - 2 CTAs: "Sumarme" abre el dialog completo, "Despues" lo dismissea 14d
 *   - Lenguaje claro y honesto: "ayuda a sostener Paw Friend gratis"
 *   - No intenta presionar al usuario; el dialog ofrece ambos lados simetricos
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, X } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useResearchConsent } from '@/hooks/useResearchConsent';
import { ResearchConsentDialog } from '@/components/profile/ResearchConsentDialog';

const DISMISS_KEY = 'pf-research-consent-nudge-dismiss';
const DISMISS_DAYS = 14;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function ResearchConsentNudge() {
  const flagOn = isFeatureEnabled('RESEARCH_CONSENT_FLOW');
  const { consent, isLoading } = useResearchConsent();
  const [dismissed, setDismissed] = useState(() => isDismissed());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Solo aparece si el flag esta on Y user nunca decidio Y no fue dismissed
  if (!flagOn || isLoading || consent !== null || dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // no-op
    }
    setDismissed(true);
  };

  return (
    <>
      <ResearchConsentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-900">
              Tu data anonima puede sostener Paw Friend
            </p>
            <p className="text-[11px] text-emerald-700">
              Opcional. Anonimo de verdad. Tu nombre no se comparte.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-100"
          >
            Saber más
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Recordarme despues"
            className="h-7 w-7 rounded-full hover:bg-white/40 flex items-center justify-center text-emerald-700 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </CardContent>
      </Card>
    </>
  );
}
