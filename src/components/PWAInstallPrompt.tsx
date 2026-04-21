/**
 * PWAInstallPrompt — prompt contextual para instalar la PWA.
 *
 * Se muestra solo cuando:
 *  - Usuario tiene >= 3 sesiones guardadas en localStorage
 *  - No esta ya instalada (display-mode: standalone == false)
 *  - No fue dismiss previamente (localStorage `pf_pwa_prompt_dismissed_at`)
 *  - No se esta corriendo dentro de WebView Capacitor (ya es app nativa)
 *
 * En Chrome/Edge captura `beforeinstallprompt` y llama `prompt()`.
 * En Safari iOS no hay API nativa → muestra instrucciones manuales.
 *
 * Origen: Plan 90d Tanda 16 — reduccion de fricción y retención.
 */

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, X, Share2 } from '@/lib/icons';
import { track } from '@/lib/analytics';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISSED_KEY = 'pf_pwa_prompt_dismissed_at';
const SESSION_COUNT_KEY = 'pf_session_count';
const MIN_SESSIONS = 3;
const DISMISS_COOLDOWN_DAYS = 14;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

function incrementSessionCount(): number {
  try {
    const current = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
    const next = current + 1;
    localStorage.setItem(SESSION_COUNT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

function getSessionCount(): number {
  try {
    return parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function wasRecentlyDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DISMISSED_KEY);
    if (!ts) return false;
    const diffMs = Date.now() - new Date(ts).getTime();
    return diffMs < DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosSheet, setShowIosSheet] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (Capacitor?.isNativePlatform?.()) return;
    if (isStandalone()) return;
    if (wasRecentlyDismissed()) return;

    // Una sesion por mount. Si acaba de abrir la app, contamos.
    incrementSessionCount();

    const sessions = getSessionCount();
    if (sessions < MIN_SESSIONS) return;

    // Listener para Chrome/Edge
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
      track({ event: 'pwa_prompt_shown', properties: { platform: 'chrome_edge', sessions } });
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Safari iOS: no hay evento, mostramos el card igual con boton de instrucciones
    if (isIOS()) {
      setShow(true);
      track({ event: 'pwa_prompt_shown', properties: { platform: 'ios_safari', sessions } });
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        track({ event: 'pwa_prompt_decision', properties: { outcome: choice.outcome } });
        if (choice.outcome === 'accepted') {
          setShow(false);
        }
      } catch {
        /* noop */
      }
      setDeferredPrompt(null);
    } else if (isIOS()) {
      setShowIosSheet(true);
      track({ event: 'pwa_prompt_decision', properties: { outcome: 'ios_instructions' } });
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    } catch {
      /* noop */
    }
    track({ event: 'pwa_prompt_decision', properties: { outcome: 'dismissed' } });
    setShow(false);
    setShowIosSheet(false);
  };

  if (!show) return null;

  return (
    <>
      <Card className="border-purple-200/60 bg-gradient-to-br from-purple-50/70 to-white">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-100 shrink-0">
            <Smartphone className="h-5 w-5 text-purple-700" />
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            <h3 className="font-semibold text-sm">Instala Paw Friend en tu telefono</h3>
            <p className="text-xs text-muted-foreground">
              Abre mas rapido, recibe recordatorios y usa offline. No ocupa casi nada.
            </p>
            <div className="flex gap-2 pt-1 flex-wrap">
              <Button size="sm" onClick={handleInstall}>
                {isIOS() ? 'Ver como instalar' : 'Instalar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Ahora no
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={handleDismiss}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {showIosSheet && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Instalar en iPhone / iPad</h4>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setShowIosSheet(false)}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
              <li>
                Toca el boton <Share2 className="inline h-3.5 w-3.5 -mt-0.5" /> compartir en la
                barra inferior de Safari.
              </li>
              <li>
                Desplaza y elige <strong>Agregar a pantalla de inicio</strong>.
              </li>
              <li>
                Toca <strong>Agregar</strong> arriba a la derecha. Listo.
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </>
  );
}
