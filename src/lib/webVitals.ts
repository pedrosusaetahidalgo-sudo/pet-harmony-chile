/**
 * Sprint 1 P1 PERF (2026-04-28): Web Vitals nativos.
 *
 * Sentry `browserTracingIntegration({ enableInp: true })` ya captura LCP/INP/CLS
 * para Sentry US. Esto los reenvía a PostHog (donde Pedro mide funnels y
 * cohorts) para correlacionar performance con conversión sin pagar tier paid
 * de Sentry.
 *
 * NO usa el package `web-vitals`. Implementación con `PerformanceObserver`
 * nativo (Web API, ~50 LoC). Cubre Core Web Vitals que importan para SEO/UX:
 *   - LCP (Largest Contentful Paint): cuándo el contenido principal pinta.
 *   - CLS (Cumulative Layout Shift): cuánto se mueve el layout post-load.
 *   - INP (Interaction to Next Paint): latencia del primer click/tap.
 *   - TTFB (Time To First Byte): cuánto tarda la respuesta del server.
 *
 * Métricas se mandan al `track()` con `event: 'web_vital'`. Filtra por nombre
 * en PostHog Dashboard → Insights → "web_vital where name = LCP".
 *
 * Llamar `initWebVitals()` 1 vez en `main.tsx` post-render.
 */
import { track } from '@/lib/analytics';

interface WebVitalSample {
  name: 'LCP' | 'CLS' | 'INP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  /** Path actual al disparar la métrica (sin tokens — analytics ya scrubea). */
  path: string;
}

// Thresholds oficiales web.dev/vitals. Lo que define un LCP "bueno" es <2.5s.
function rate(name: WebVitalSample['name'], value: number): WebVitalSample['rating'] {
  switch (name) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
  }
}

function emit(name: WebVitalSample['name'], value: number) {
  if (!Number.isFinite(value)) return;
  const sample: WebVitalSample = {
    name,
    value: Math.round(value * 1000) / 1000,
    rating: rate(name, value),
    path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
  };
  try {
    track({
      event: 'web_vital',
      properties: sample as unknown as Record<string, unknown>,
    });
  } catch {
    // Silent: si analytics no está cargado todavía, perdemos esta métrica.
    // No vale la pena un queue interno por esto.
  }
}

let initialized = false;

export function initWebVitals(): void {
  if (initialized || typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }
  initialized = true;

  // ── LCP ──────────────────────────────────────────────
  // Reportar el último LCP cuando la pagina se vuelva hidden o al unmount.
  let lastLCP = 0;
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) lastLCP = last.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && lastLCP > 0) {
        emit('LCP', lastLCP);
        lastLCP = 0; // evitar duplicados
      }
    });
  } catch {
    // Browser sin soporte LCP — Safari < 14, etc.
  }

  // ── CLS ──────────────────────────────────────────────
  // Suma acumulada de layout shifts no causados por user input.
  let clsValue = 0;
  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as unknown as { hadRecentInput: boolean; value: number };
        if (!e.hadRecentInput) clsValue += e.value;
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        emit('CLS', clsValue);
      }
    });
  } catch {
    // Browser sin soporte layout-shift.
  }

  // ── INP ──────────────────────────────────────────────
  // Latencia worst-case de cada interacción (click/tap/key).
  let worstINP = 0;
  try {
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as unknown as { duration: number; interactionId?: number };
        if (e.interactionId && e.duration > worstINP) {
          worstINP = e.duration;
        }
      }
    });
    // durationThreshold no está en PerformanceObserverInit official; browsers
    // con event timing lo aceptan vía cast.
    inpObserver.observe({
      type: 'event',
      buffered: true,
      durationThreshold: 40,
    } as PerformanceObserverInit);
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && worstINP > 0) {
        emit('INP', worstINP);
        worstINP = 0;
      }
    });
  } catch {
    // Browser sin soporte event timing.
  }

  // ── TTFB ─────────────────────────────────────────────
  // Solo se reporta 1 vez al inicio (es métrica de navegación inicial).
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navEntry && navEntry.responseStart > 0) {
      // TTFB = responseStart - requestStart (cuando hay request real).
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      if (ttfb > 0) emit('TTFB', ttfb);
    }
  } catch {
    // Best-effort.
  }
}
