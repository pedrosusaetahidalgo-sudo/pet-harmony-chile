# Bundle Snapshot — 2026-04-30 (post 7 motores Revenue Master Plan)

> Snapshot del bundle de producción tras construir los 7 motores B2B
> + AdminRevenueDashboard + 5 ideas RICE Paw Shield. Comparado contra
> baseline del Sprint 0+1 cierre auditoría (2026-04-28).

**Build time**: 1m 31s
**Total assets**: 326 archivos / 7.2 MB
**Comando**: `npm run build` (Vite 5 + plugin react-swc)

---

## 1. Top 15 chunks más pesados (raw / gzip)

| # | Chunk | Raw | Gzip | Notas |
|---|---|---|---|---|
| 1 | `sentry-vendor` | 469 kB | 155 kB | @sentry/react 10 — esperable, ya está chunkeado |
| 2 | `recharts-vendor` | 432 kB | 114 kB | Recharts 2 (dashboards admin + analytics) |
| 3 | `xlsx` | 429 kB | 143 kB | xlsx (bulk import refugio) — **lazy chunk OK** |
| 4 | `index-Bja8P4Fa` | 375 kB | 110 kB | Main vendor pool (a investigar) |
| 5 | `index-DQmBvzjY` | 280 kB | 90 kB | Main app entry |
| 6 | `ui-vendor` | 279 kB | 87 kB | shadcn/ui + Radix primitives |
| 7 | `supabase-vendor` | 196 kB | 52 kB | @supabase/supabase-js |
| 8 | `module-guJU7qq1` | 186 kB | 62 kB | Vendor secundario |
| 9 | `Admin` | 173 kB | 48 kB | Panel admin (era 149kB pre-motores: **+24kB** por AdminRevenueDashboard + AdminFase1Widget + AdminCorrelations + 4 widgets nuevos) |
| 10 | `leaflet-vendor` | 155 kB | 45 kB | Leaflet + react-leaflet |
| 11 | `index-B5ruI2kJ` | 94 kB | 25 kB | Sub-vendor |
| 12 | `icons-vendor` | 88 kB | 17 kB | lucide-react + react-icons |
| 13 | `ServiceDirectory` | 75 kB | 19 kB | Directorio de servicios |
| 14 | `ProviderDashboard` | 64 kB | 17 kB | Dashboard vet (mismo que pre-motores) |
| 15 | `Profile` | 63 kB | 18 kB | Perfil owner |

**CSS**: `index-C4i3Os16.css` 319 kB (Tailwind compilado — esperable).

---

## 2. Comparación pre/post motores

| Chunk | Pre-motores (2026-04-28) | Post-motores (2026-04-30) | Δ |
|---|---|---|---|
| **Admin** | 149 kB | 173 kB | **+24 kB** (+16%) |
| **ProviderDashboard** | 63 kB | 64 kB | +1 kB (~) |
| **Home** | 55 kB | 55 kB | — |
| **HomePetFocusV2** | 43 kB | 44 kB | +1 kB |
| **xlsx** (lazy) | 429 kB | 429 kB | — |

**Veredicto**: Admin creció +24 kB raw (+7 kB gzip) por los 4 widgets
nuevos (Revenue Dashboard + Fase 1 KPIs + Correlations + Master KPIs).
El resto de la app no se afectó porque los nuevos motores B2B son rutas
lazy-cargadas (`/b2b`, `/cotizar-seguro`, `/tienda`, `/aplicar`).

**Aceptable**: el aumento está en `/admin`, ruta de bajo tráfico
(solo Pedro). Bundle inicial de owner (Home + AppLayout) no cambió.

---

## 3. Web Vitals targets (sin medición real aún)

> No hay medición real Web Vitals post-motores en este snapshot —
> requiere PostHog query con datos de prod. Targets de referencia:

| Métrica | Target good | Target needs improve | Hoy (estimado) |
|---|---|---|---|
| LCP | <2.5s | <4.0s | ~2.0s (Home con Vite SSR-lite) |
| FID/INP | <100ms / <200ms | <300ms / <500ms | ~150ms INP (medido en sesión 04-25) |
| CLS | <0.1 | <0.25 | ~0.05 (estable post Refactor Fase 0) |
| FCP | <1.8s | <3.0s | ~1.4s (medido) |
| TTFB | <800ms | <1.8s | ~600ms (Supabase + GitHub Pages) |

**Acción 2026-05-XX**: cuando llegue el primer partner B2B real,
medir LCP/INP en `/b2b` y `/cotizar-seguro/:petId` con datos reales
desde PostHog → Web Vitals query.

---

## 4. Code-split coverage

Rutas lazy-loaded confirmadas (revisión `src/App.tsx`):
- `/b2b` → `B2BPortal` lazy ✅
- `/cotizar-seguro/:petId` → `InsuranceQuotes` lazy ✅
- `/tienda/:petId/:partnerSlug` → `RetailStore` lazy ✅
- `/aplicar` → `Aplicar` lazy ✅

Rutas críticas owner que **NO** se afectan por motores:
- `/home` → `Home` (55 kB unchanged)
- `/my-pets` → `MyPets` (22 kB unchanged)
- `/ficha/:petId` → `PetClinicalRecord` lazy ✅

---

## 5. Quick wins identificados (postponer hasta gap real)

| Quick win | Estimado | Justificación |
|---|---|---|
| Reemplazar `recharts` por `chart.js` o `nivo` lite | -200 kB raw | Solo si admin se vuelve crítico — hoy admin es Pedro-only |
| Lazy-load `sentry` (cargar post-DOMContentLoaded) | -300 kB blocking | Solo si LCP >2.5s en prod — hoy ~2.0s |
| Investigar `index-Bja8P4Fa.js` (375 kB) | ? | Probablemente vendor pool. Auditar con `vite-bundle-visualizer` |
| Tree-shake `lucide-react` icons | -30 kB | Bajo impacto, alto effort |

**Decisión 2026-04-30**: ningún quick win urgente. Bundle está dentro
de presupuesto (`docs/PERFORMANCE_BUDGET.md`). Re-medir post-launch
real con datos PostHog.

---

## 6. Sin regresiones detectadas

- TypeScript build: ✅ 0 errores
- Vite build: ✅ 1m 31s (similar a sessions previas)
- Pre-render SPA routes: ✅ 20 rutas físicas generadas
- **Nota**: `correlation_definitions HTTP 401` es esperado en build
  local (no hay anon key con permisos) — no afecta prod build.

---

## 7. Acción de seguimiento

1. **Cuando primer partner B2B firme**: correr `npm run build -- --report`
   con `vite-bundle-visualizer` para identificar exactamente qué hay en
   `index-Bja8P4Fa.js` (375 kB).
2. **Cuando Admin tenga >5 usuarios admin** (hoy solo Pedro): considerar
   split del Admin chunk en sub-rutas (Revenue / KPIs / Correlations /
   System Health) cada una lazy.
3. **Cuando lancen iOS app store**: validar que `xlsx` lazy chunk no se
   precarga en mobile (Capacitor WebView).

---

**Estado**: bundle saludable, sin regresiones críticas. Audit-ready.
