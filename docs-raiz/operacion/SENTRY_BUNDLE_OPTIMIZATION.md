# Optimización bundle Sentry — pasos para Pedro

> Origen: INIT-12 del [Plan de Éxito 90 días](../planes/PLAN_EXITO_90D_20260420.md).
> Estado actual: 458 kB chunk (151 kB gzip) — es el más grande de la app.
> Target: ≤150 kB uncompressed (≤50 kB gzip).

---

## Lo que ya está aplicado (sin romper nada)

1. **Idle-loading**: `src/lib/sentry.ts` pospone el import hasta `requestIdleCallback` (o 3s si el browser no soporta). El chunk de Sentry no compite con el TTI del first paint.
2. **`replaysOnErrorSampleRate` bajado de 0.5 → 0.1**: menos replays capturados por error. Reduce egress hacia Sentry + evita tier pago más rápido.

Estos dos cambios mejoran TTI mobile sin cambiar dependencias. El bundle sigue siendo 458 kB pero se descarga **después** del render inicial.

---

## Lo que falta (requiere `npm install` — Pedro lo hace)

Para bajar el chunk a ~150 kB real, reemplazar `@sentry/react` por `@sentry/browser`. Razón:

- `@sentry/react` incluye integración React (ErrorBoundary wrapper, Profiler, routing). Pero la app usa su propio `src/components/ErrorBoundary.tsx` que NO depende del de Sentry.
- `@sentry/browser` es el core sin las integraciones React ni el replay package. Ahorro: ~250-300 kB uncompressed.

### Pasos

1. Desinstalar `@sentry/react`:
   ```powershell
   npm uninstall @sentry/react
   ```
2. Instalar `@sentry/browser`:
   ```powershell
   npm install @sentry/browser@^10
   ```
3. Actualizar `src/lib/sentry.ts` cambiando el import:
   ```diff
   - import('@sentry/react').then((mod) => {
   + import('@sentry/browser').then((mod) => {
   ```
   La API de `init()`, `captureException()` y `flush()` es idéntica. No hace falta tocar nada más.
4. Si alguna vez se usó `Sentry.ErrorBoundary` (wrap React) o `Sentry.Profiler`, hay que quitarlos. Grepear:
   ```
   grep -r "Sentry.ErrorBoundary\|Sentry.Profiler" src/
   ```
   (a la fecha de 2026-04-20 no aparece ningún uso).
5. Correr `npm run build` y verificar en output el tamaño del chunk Sentry. Target: ≤150 kB.
6. Probar en producción que los errores siguen llegando a Sentry dashboard.

### Alternativa aún más agresiva (opcional)

Si el objetivo es absorber solo `captureException()` sin features extra:

```bash
npm uninstall @sentry/react
npm install @sentry/core @sentry/browser
```

Usar `@sentry/core` para el transporte mínimo. Esto baja a ~50-80 kB pero pierde breadcrumbs automáticos.

---

## Cómo verificar el ahorro

Después del reemplazo:

```powershell
npm run build
```

Buscar en el output de Vite una línea tipo:
```
docs/assets/sentry-vendor-XXXXXX.js    151 kB │ gzip: 50 kB
```

Antes debería decir `458 kB │ gzip: 151 kB`.

---

## Rollback si rompe

Si algo falla en prod después del cambio:

```powershell
npm uninstall @sentry/browser
npm install @sentry/react@^10
```

Y revertir el import en `src/lib/sentry.ts`. Commit de reversión y push.

---

## Cuando ejecutar

Pedro: hacerlo cuando tengas 15 min de margen (no antes de un deploy a prod ocupado). Idealmente en **Sprint 4** del plan 90d (día 43-56).
