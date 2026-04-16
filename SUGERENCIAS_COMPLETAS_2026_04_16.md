# Sugerencias Completas — Paw Friend

> Generado: 2026-04-16
> Fuente: Auditoria automatizada de 502+ archivos TS/TSX, 28 edge functions, 156 migraciones SQL
> Pipeline: tsc 0 errores, lint 0 errores (85 warnings a11y), 176 tests OK, build OK

---

## Resumen por categoria

| Categoria | Criticos | Altos | Medios | Bajos | Total |
|-----------|----------|-------|--------|-------|-------|
| Seguridad | 3 | 2 | 3 | 0 | 8 |
| Type Safety | 0 | 2 | 3 | 0 | 5 |
| Performance | 0 | 1 | 4 | 2 | 7 |
| Edge Functions | 0 | 2 | 4 | 0 | 6 |
| UX / Accesibilidad | 0 | 0 | 4 | 2 | 6 |
| Base de datos | 0 | 1 | 3 | 0 | 4 |
| Mobile / Capacitor | 0 | 0 | 2 | 1 | 3 |
| Testing | 0 | 2 | 1 | 0 | 3 |
| Bundle / Deploy | 0 | 0 | 2 | 2 | 4 |
| Documentacion | 0 | 0 | 1 | 2 | 3 |
| **Total** | **3** | **10** | **27** | **9** | **49** |

---

## 1. SEGURIDAD

### CRITICO

#### S1. URLs hardcodeadas de Supabase en codigo fuente
**Archivos**: `src/hooks/useErrorReporter.ts:5-6`, `src/components/admin/AdminVetVerifications.tsx:168`, `src/hooks/useAnalyticsTracker.ts`
**Problema**: URL de produccion `https://gwailbjlvevkhwcrovfd.supabase.co` hardcodeada como fallback. Cualquier usuario puede identificar el proyecto Supabase inspeccionando el bundle.
**Fix**: Eliminar fallbacks. Si falta env var, lanzar error:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL not configured');
```

#### S2. .env committeado en git con keys reales
**Archivo**: `.env` (en historial de git)
**Problema**: `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_GOOGLE_MAPS_API_KEY` estan en historial de git.
**Fix**: Rotar keys, usar `git filter-branch` o BFG para limpiar historial.

#### S3. Validacion de env vars inexistente en startup
**Archivo**: `src/main.tsx`
**Problema**: No se valida que las variables de entorno requeridas existan al iniciar la app.
**Fix**: Agregar validacion zod de env vars en `main.tsx` antes de `ReactDOM.render`.

### ALTO

#### S4. Rate limiting ausente en endpoints publicos
**Archivos**: `supabase/functions/google-calendar-oauth-init/index.ts`, `supabase/functions/flow-webhook/index.ts`
**Problema**: OAuth y webhook de pagos sin rate limiting.
**Fix**: Agregar `checkRateLimit()` de `_shared/rate-limit.ts`.

#### S5. RLS permisiva en `profiles`
**Problema**: Columna `phone` expuesta via `USING(true)` en SELECT.
**Fix**: Migrar a policy que solo muestre `phone` al propio usuario o a providers con booking activo.

### MEDIO

#### S6. Sanitizacion CSS debil en chart.tsx
**Archivo**: `src/components/ui/chart.tsx:10-15`
**Problema**: Regex para rgb/hsl permite contenido arbitrario dentro de parentesis.
**Fix**: Validar valores numericos estrictos dentro de rgb()/hsl().

#### S7. Race condition en rate limiting
**Archivo**: `supabase/functions/_shared/rate-limit.ts:80-110`
**Problema**: Check y update no son atomicos. Bajo concurrencia, multiples requests pueden pasar el limite.
**Fix**: Usar RPC con `FOR UPDATE` o transaccion atomica.

#### S8. Token extraction sin validacion
**Archivo**: `supabase/functions/google-calendar-oauth-init/index.ts:50-52`
**Problema**: `authHeader.replace("Bearer ", "")` sin validar estructura.
**Fix**: Validar formato antes de extraer token.

---

## 2. TYPE SAFETY

### ALTO

#### T1. `strictNullChecks: false` en tsconfig
**Archivo**: `tsconfig.json`
**Problema**: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`. Permite `any` implicito y null sin verificar.
**Fix**: Habilitar progresivamente. Empezar por `strictNullChecks: true` (el de mayor impacto).

#### T2. Supabase client tipado con `<any>`
**Archivo**: `src/integrations/supabase/client.ts:15`
**Problema**: `createClient<any>` pierde todo type-safety de la API.
**Fix**: Generar tipos con `supabase gen types typescript` y usar `createClient<Database>`.

### MEDIO

#### T3. 65+ usos de `as any` en hooks
**Archivos**: Multiples hooks en `src/hooks/`
**Problema**: Bypass de type safety en queries de Supabase. Dificulta detectar errores de schema.
**Fix**: Usar tipos generados de Supabase + type narrowing.

#### T4. ESLint `no-unused-vars` desactivado globalmente
**Archivo**: `eslint.config.js:29`
**Problema**: Variables muertas no detectadas.
**Fix**: Cambiar a `["warn", { argsIgnorePattern: "^_" }]`.

#### T5. JSON.parse/stringify sin try-catch
**Archivos**: `src/components/ai/SymptomTriage.tsx:80`, multiples componentes
**Problema**: Puede crashear si hay refs circulares o JSON malformado.
**Fix**: Wrappear en try-catch.

---

## 3. PERFORMANCE

### ALTO

#### P1. Falta de memoizacion generalizada
**Problema**: Solo 5 `useCallback` y 2 `useMemo` en 502+ archivos. Funciones de filter/sort se recrean en cada render.
**Archivos ejemplo**: `src/pages/RegistroVeterinario.tsx:86-89`, `src/components/Header.tsx:72-74`
**Fix**: Agregar `useCallback` a handlers y `useMemo` a computed values en componentes de alto render.

### MEDIO

#### P2. Tablas admin sin paginacion
**Archivos**: `AdminUsers.tsx`, `AdminProviders.tsx`, `AdminVetVerifications.tsx`
**Problema**: Fetch de TODAS las filas sin limit/offset. Con 10k+ usuarios, sera lento.
**Fix**: Implementar paginacion cursor-based o virtual scrolling.

#### P3. Sentry vendor chunk de 458 KB
**Archivo**: `docs/assets/sentry-vendor-*.js`
**Problema**: Sentry es el chunk mas grande (458 KB / 151 KB gzip), mas que Recharts.
**Fix**: Evaluar si `@sentry/react` se puede reemplazar por `@sentry/browser` (mas liviano) o lazy-load mas agresivo.

#### P4. Recharts importado en multiples paginas
**Problema**: Recharts (432 KB) chunkeado correctamente, pero importado desde Provider Dashboard, Analytics, Home, etc.
**Fix**: Evaluar Tremor o chart.js como alternativas mas livianas para graficos simples.

#### P5. react-icons vs lucide-react duplicacion
**Problema**: Ambas librerias de iconos en uso. `react-icons` no tree-shakea bien en v5.
**Fix**: Migrar completamente a `lucide-react` (ya mayoritario) y eliminar `react-icons`.

### BAJO

#### P6. CSS global de PawCards
**Problema**: 2700+ lineas de CSS de PawCards en `index.css` global.
**Fix**: Extraer a modulo CSS o Tailwind plugin.

#### P7. Sin virtualizacion en listas largas
**Archivos**: Feed, Comunidad, Directorio
**Problema**: Listas potencialmente infinitas renderizan todos los items.
**Fix**: Agregar `@tanstack/react-virtual` para listas largas.

---

## 4. EDGE FUNCTIONS

### ALTO

#### E1. Error handling insuficiente en flow-webhook
**Archivo**: `supabase/functions/flow-webhook/index.ts:73`
**Problema**: `resp.json()` se llama ANTES de verificar `resp.ok`. Si respuesta no es JSON, crashea.
**Fix**: Verificar `resp.ok` primero, luego parsear.

#### E2. Sin timeout en llamadas externas
**Archivos**: `google-calendar-callback/index.ts`, `google-calendar-sync/index.ts`
**Problema**: Fetch sin AbortController = pueden colgar indefinidamente.
**Fix**: Agregar `AbortController` con timeout de 15s a todos los fetch externos.

### MEDIO

#### E3. CORS origins hardcodeadas
**Archivo**: `supabase/functions/_shared/ai-base.ts:3-7`
**Problema**: Origins fijos, sin soporte para staging.
**Fix**: Mover a variables de entorno.

#### E4. Sin validacion de input en create-patient
**Archivo**: `supabase/functions/create-patient/index.ts`
**Problema**: Body del request asumido sin validar schema.
**Fix**: Agregar validacion zod antes de procesar.

#### E5. AI functions fail-open
**Problema**: Si la DB esta caida, `checkAiQuota` permite requests sin limite.
**Fix**: Fail-closed o retornar error 503.

#### E6. Logging inconsistente
**Problema**: Mezcla de `console.log`, `console.error`, y logger custom.
**Fix**: Unificar en `_shared/logger.ts`.

---

## 5. UX / ACCESIBILIDAD

### MEDIO

#### U1. 85 warnings de a11y pendientes
**Fuente**: `npm run lint` — jsx-a11y
**Archivos principales**: `AddPet.tsx`, `PawCollection.tsx`, `PetClinicalRecord/`, `TabAlimentacion.tsx`
**Detalle**: Labels no asociados a controles, click handlers sin keyboard listeners, autoFocus.
**Fix**: Agregar `htmlFor`, `aria-label`, `onKeyDown` handlers.

#### U2. ErrorBoundary usa window.location.href
**Archivo**: `src/components/ErrorBoundary.tsx:47`
**Problema**: Reload completo en vez de React Router navigation.
**Fix**: Usar `useNavigate()` o `<Link>`.

#### U3. window.confirm() en 5 lugares
**Problema**: Dialogo nativo del browser, no estilizable, mala UX mobile.
**Fix**: Reemplazar con `AlertDialog` de shadcn/ui.

#### U4. Touch targets bajo 44px
**Problema**: Algunos botones e iconos tienen area clickeable menor a 44x44px (minimo iOS).
**Fix**: Agregar `min-h-[44px] min-w-[44px]` en Tailwind.

### BAJO

#### U5. Sin skeleton loaders en varias paginas
**Problema**: Paginas muestran blank durante carga.
**Fix**: Agregar `<Skeleton>` de shadcn/ui en estados loading.

#### U6. Toasts sin accion de deshacer
**Problema**: Acciones destructivas (eliminar mascota, cancelar reserva) no tienen "undo".
**Fix**: Agregar accion de undo en toast de sonner.

---

## 6. BASE DE DATOS

### ALTO

#### D1. Cascading deletes sin audit trail
**Problema**: `ON DELETE CASCADE` elimina silenciosamente pets, records, bookings cuando se borra un usuario.
**Fix**: Implementar soft-delete (`deleted_at` column) + trigger de audit log.

### MEDIO

#### D2. Indexes faltantes en tablas de alto trafico
**Problema**: Queries frecuentes por `pet_id`, `provider_id`, `scheduled_date` sin indexes dedicados en algunas tablas.
**Fix**: Analizar con `EXPLAIN ANALYZE` y crear indexes compuestos.

#### D3. Migraciones con timestamps duplicados
**Problema**: 3 pares de migraciones con mismo timestamp. Idempotentes y documentadas, pero confuso.
**Fix**: No renombrar (ya aplicadas en prod), pero evitar en futuras migraciones.

#### D4. Sin backup automatizado
**Problema**: Supabase tiene backups diarios, pero no hay backup externo ni export programado.
**Fix**: Configurar `pg_dump` semanal a storage externo.

---

## 7. MOBILE / CAPACITOR

### MEDIO

#### M1. localStorage accedido sin guard de plataforma
**Archivos**: `src/hooks/useAnalyticsTracker.ts:8`, `src/integrations/supabase/client.ts:17`
**Problema**: `localStorage` y `sessionStorage` usados directamente. En Capacitor nativo, deberian usar `@capacitor/preferences`.
**Fix**: Crear wrapper `storage.ts` que detecte plataforma.

#### M2. Push notifications sin error handling
**Archivo**: `src/App.tsx:100`
**Problema**: Si permiso denegado, no hay fallback ni UI informando al usuario.
**Fix**: Catch errors y mostrar banner explicando beneficios de notificaciones.

### BAJO

#### M3. Splash screen assets faltantes
**Problema**: Config de splash screen en `capacitor.config.ts` pero sin assets PNG/XML para Android ni storyboard para iOS.
**Fix**: Generar con `@capacitor/assets` desde el icon SVG.

---

## 8. TESTING

### ALTO

#### Q1. Flujos criticos sin E2E
**Problema**: No hay tests para: booking flow, payment/subscription, registro de vet, verificacion email.
**Fix**: Agregar Playwright tests para los 4 flujos revenue-critical.

#### Q2. Sin tests de integracion para RLS
**Problema**: Policies de RLS no testeadas automaticamente. User A podria acceder a data de User B.
**Fix**: Tests con tokens de distintos usuarios verificando acceso/denegacion.

### MEDIO

#### Q3. Solo 12 archivos de test para 502 archivos fuente
**Problema**: Coverage ~2.4%. Solo `src/lib/` tiene tests.
**Fix**: Priorizar tests para hooks criticos: `useAuth`, `useBookings`, `usePlan`, `usePets`.

---

## 9. BUNDLE / DEPLOY

### MEDIO

#### B1. docs/ tiene 60+ chunks sin CDN
**Problema**: GitHub Pages no tiene CDN global ni compresion Brotli.
**Fix**: Considerar Cloudflare Pages o Vercel para mejor performance global.

#### B2. Source maps en produccion
**Problema**: Si `sourcemap: true` en vite config, codigo fuente queda accesible.
**Fix**: Verificar que `build.sourcemap` este en `false` o `'hidden'`.

### BAJO

#### B3. console.log en 14 archivos de produccion
**Problema**: Logs visibles en browser console del usuario.
**Fix**: Agregar plugin `vite-plugin-remove-console` o usar logger centralizado.

#### B4. chunkSizeWarningLimit en 600 KB
**Archivo**: `vite.config.ts`
**Problema**: Limite alto, oculta chunks problematicos.
**Fix**: Bajar a 300-400 KB para detectar regresiones de bundle.

---

## 10. DOCUMENTACION

### MEDIO

#### DOC1. MAPA_FUNCIONAL_COMPLETO desactualizado
**Problema**: No refleja Booking System V2, nuevos hooks, ni edge functions recientes.
**Fix**: Regenerar con la estructura actual del proyecto.

### BAJO

#### DOC2. AGENTS.md parcialmente desactualizado
**Problema**: No refleja los 13 agentes actuales ni las rutas nuevas.
**Fix**: Sincronizar con CLAUDE.md seccion 14.

#### DOC3. Diagrams Mermaid desactualizados
**Problema**: `FLUJO_COMPLETO.mmd` no incluye booking system V2, nuevos estados de reserva.
**Fix**: Actualizar en el mismo commit que este cambio.

---

## Plan de ejecucion sugerido

### Semana 1 — Seguridad (S1-S5, E1-E2)
- Eliminar URLs hardcodeadas
- Rotar keys expuestas
- Rate limiting en endpoints publicos
- Fix error handling en webhooks

### Semana 2 — Type Safety + Testing (T1-T2, Q1-Q2)
- Habilitar `strictNullChecks`
- Generar tipos de Supabase
- E2E tests para booking y payment

### Semana 3 — Performance + UX (P1-P3, U1-U4)
- Memoizacion en componentes criticos
- Paginacion admin
- Corregir 85 warnings a11y

### Semana 4 — Edge Functions + Mobile (E3-E6, M1-M2)
- Validacion de input en todas las funciones
- Storage wrapper para Capacitor
- Timeout en llamadas externas

---

## Notas

- Los items CRITICOS (S1-S3) deben resolverse antes de escalar a mas usuarios.
- Este documento reemplaza y consolida los reportes anteriores archivados.
- Para cada fix, verificar con `npx tsc -b && npm run lint && npm run test:ci` antes de commitear.
