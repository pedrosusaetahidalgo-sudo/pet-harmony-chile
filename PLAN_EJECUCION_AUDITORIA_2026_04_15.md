# Plan de Ejecucion — Auditoria Completa Next Level
## Paw Friend — 2026-04-15

> Resultado de 7 auditorias paralelas: TypeScript, Edge Functions/SQL, Rutas/Dead Code, Hooks/Queries/Premium, UX/A11y/Mobile, Seguridad, Performance.
> **67 hallazgos** categorizados en **6 fases** de ejecucion ordenadas por criticidad.

---

## Resumen Ejecutivo

| Area | Estado | Hallazgos |
|------|--------|-----------|
| TypeScript & Build | Verde | 0 errores TS, 0 `@ts-ignore`, 71 `as any` en 30 archivos |
| Rutas & Guards | Verde | 0 orphans, 0 dead code, todos los guards correctos |
| Premium Gating | Verde | Excelente: PremiumGate + usePlan + admin bypass |
| Console/Debug | Verde | Solo en `logger.ts`, produccion limpia |
| Edge Functions | Amarillo | 2 criticos (migracion rota, constraint), 4 warnings |
| Hooks & Queries | Amarillo | 11 hooks sin staleTime, 3 sin error state |
| UX & A11y | Amarillo | Safe-area excelente, aria-labels parciales (~80%) |
| Performance | Amarillo | Bundle splitting excelente, 30+ `select('*')`, imagenes sin optimizar |
| Seguridad | Rojo | .env expuesto en git, CORS wildcard, validacion forms incompleta |

---

## FASE 0 — EMERGENCIA DE SEGURIDAD (Hacer AHORA)
> **Tiempo estimado: 30 min** | **Bloquea todo lo demas**

### 0.1 [CRITICO] Rotar API keys expuestas en .env
- **Hallazgo**: `.env` committeado con Supabase JWT y Google Maps API key
- **Archivo**: `.env` (raiz del repo)
- **Accion**:
  1. Rotar Supabase anon key + service_role key en Supabase Dashboard > Settings > API
  2. Rotar Google Maps API key en Google Cloud Console
  3. Limpiar `.env` del historial git:
     ```bash
     git filter-branch --tree-filter 'rm -f .env' HEAD
     # o usar BFG Repo-Cleaner (mas rapido)
     ```
  4. Verificar `.gitignore` incluye `.env*` (ya lo tiene, pero el archivo ya esta trackeado)
  5. `git rm --cached .env` para dejar de trackear

### 0.2 [CRITICO] CORS wildcard en edge functions
- **Hallazgo**: `Access-Control-Allow-Origin: *` en funciones internas
- **Archivos**:
  - `supabase/functions/generate-sitemap/index.ts`
  - `supabase/functions/send-whatsapp-reminder/index.ts`
- **Accion**: Restringir a `https://pawfriend.cl` o eliminar CORS si son solo internas

### 0.3 [ALTO] Auth header faltante en error reporter
- **Hallazgo**: `useErrorReporter.ts` hace fetch sin Authorization header
- **Archivo**: `src/hooks/useErrorReporter.ts:18`
- **Accion**: Agregar Bearer token del session actual

---

## FASE 1 — INTEGRIDAD DE DATOS (Dia 1)
> **Tiempo estimado: 1-2 horas** | **Prerequisito para gamificacion funcional**

### 1.1 [CRITICO] Migracion con columnas incorrectas en paw_missions
- **Hallazgo**: `20260421000001_seed_quality_missions.sql` inserta con columnas que NO existen (`mission_type`, `target_action`, `target_count`, `points_reward`)
- **Columnas reales**: `id, title, description, category, icon, achievement_title, requirement_type, requirement_value, sort_order, is_active, created_at`
- **Impacto**: Misiones de calidad nunca se insertaron (falla silenciosamente con `ON CONFLICT DO NOTHING`)
- **Accion**: Crear nueva migracion `20260515100000_fix_seed_quality_missions.sql` con columnas correctas

### 1.2 [CRITICO] Constraint de requirement_type incompleto
- **Hallazgo**: La migracion `20260515000002_core_action_missions.sql` (seleccionada por el usuario) agrega tipos nuevos (`log_vaccine`, `leave_review`, `complete_checklist`) al constraint
- **Riesgo**: Si la migracion anterior (`20260504100000`) ya tiene un constraint diferente, el `DO $$ ... EXCEPTION` silencia el error
- **Accion**:
  1. Verificar en Supabase Dashboard que el constraint actual incluye TODOS los tipos necesarios
  2. Si no, crear migracion correctiva con el constraint completo unificado

### 1.3 [MEDIO] DROP TABLE peligroso en migracion de missions
- **Archivo**: `supabase/migrations/20260504100000_paw_missions_achievements.sql:5-6`
- **Hallazgo**: `DROP TABLE IF EXISTS paw_missions CASCADE` borra data de produccion
- **Accion**: Documentar que esta migracion es solo para setup inicial, no re-ejecutable en prod con data real

### 1.4 [MEDIO] Regenerar tipos Supabase
- **Hallazgo**: 71 `as any` en 30 archivos, mayoria por tipos desactualizados de Supabase
- **Accion**:
  ```bash
  supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
  ```
- **Impacto**: Elimina ~40% de los `as any` automaticamente
- **Archivos mas afectados** (top 5):
  - `src/components/settings/IntegrationsCard.tsx` (8 `as any`)
  - `src/components/admin/AdminAnalytics.tsx` (8 `as any`)
  - `src/hooks/useUnifiedCalendar.ts` (5 `as any`)
  - `src/pages/ProviderPatients.tsx` (5 `as any`)
  - `src/components/admin/AdminErrorLog.tsx` (4 `as any`)

---

## FASE 2 — VALIDACION Y SEGURIDAD DE FORMULARIOS (Dia 1-2)
> **Tiempo estimado: 2-3 horas** | **Protege contra XSS, spam, y data corrupta**

### 2.1 [ALTO] Agregar validacion zod a formularios criticos
- **Hallazgo**: Solo 2 de 15+ forms usan zod; el resto no tiene schema validation
- **Accion**: Crear `src/lib/schemas.ts` con schemas compartidos y aplicar a:

| Formulario | Archivo | Prioridad |
|-----------|---------|-----------|
| Login/Registro | `src/pages/Auth.tsx` | Alta |
| Agregar mascota | `src/pages/AddPet.tsx` | Alta |
| Dejar resena | `src/pages/DejarResena.tsx` | Alta |
| Comentarios feed | `src/components/feed/FeedCommentInput.tsx:29` | Alta |
| Registro veterinario | `src/pages/RegistroVeterinario.tsx` | Media |
| Onboarding vet | `src/pages/OnboardingVetMinimal.tsx` | Media |
| Reportar mascota perdida | `src/components/maps/ReportLostPetForm.tsx` | Media |
| Nuevo paciente vet | `src/pages/NewPatientForm.tsx` | Media |

### 2.2 [ALTO] Sanitizacion de contenido generado por usuarios
- **Hallazgo**: Comentarios y resenas solo usan `.trim()`, sin sanitizacion
- **Archivos**:
  - `src/components/feed/FeedCommentInput.tsx:29` — solo trim
  - `src/pages/DejarResena.tsx:26-28` — sin schema
  - `src/components/reviews/ReviewCard.tsx:41-42` — display sin sanitizar
- **Accion**:
  1. Agregar `dompurify` como dependencia (o validar via zod con max length)
  2. Sanitizar en display para reviews y comentarios
  3. Agregar limites de caracteres en UI (500 chars comments, 1000 chars reviews)

### 2.3 [MEDIO] Proteccion double-submit en mutaciones
- **Hallazgo**: Algunas mutaciones carecen de proteccion contra submit doble
- **Accion**: Usar `isPending` de React Query en lugar de state manual
- **Archivos**: `src/hooks/useFeedActions.ts`, flujo de pagos Flow

### 2.4 [MEDIO] XSS potencial en chart.tsx
- **Hallazgo**: `dangerouslySetInnerHTML` en `src/components/ui/chart.tsx:69-87` genera CSS desde config
- **Riesgo**: Si ChartConfig acepta valores de usuario, CSS injection posible
- **Accion**: Validar formato de colores con regex `/^#[0-9A-Fa-f]{3,8}$|^hsl/` antes de inyectar

---

## FASE 3 — PERFORMANCE DE QUERIES Y CACHE (Dia 2-3)
> **Tiempo estimado: 2-3 horas** | **Reduce carga en Supabase, mejora UX**

### 3.1 [ALTO] Agregar staleTime a 11 hooks sin cache
- **Hallazgo**: 11 hooks con `staleTime: 0` (default) golpean Supabase en cada render/focus
- **Accion**: Agregar staleTime segun tipo de data:

| Hook | staleTime recomendado | Razon |
|------|----------------------|-------|
| `useFollows.tsx` | 5 min | Status social, baja frecuencia |
| `useActiveRole.tsx` | 10 min | Rol no cambia frecuentemente |
| `useNotifications.tsx` | 2 min | Necesita relativa frescura |
| `useIsBlocked.tsx` | 10 min | Raro que cambie |
| `useServiceProviders.tsx` | 30 min | Data publica, casi estatica |
| `useMissions.ts` | 5 min | Misiones no cambian en runtime |
| `useAchievements.ts` | 5 min | Logros no cambian frecuentemente |
| `usePawCollection.ts` | 5 min | Coleccion del usuario |
| `usePartners.ts` | 30 min | Data de partners, casi estatica |
| `useAdoptionShelters.tsx` | 30 min | Refugios no cambian seguido |
| `useReviewInvitations.tsx` | 5 min | Invitaciones pendientes |

### 3.2 [ALTO] Reemplazar 30+ `select('*')` por columnas especificas
- **Hallazgo**: Overfetching masivo — trae todas las columnas cuando solo se usan 3-5
- **Archivos prioritarios** (paginas de alto trafico):

| Archivo | Linea | Tabla | Columnas necesarias |
|---------|-------|-------|-------------------|
| `src/pages/MyPets.tsx` | 155 | pets | `id, name, species, breed, photo_url, date_of_birth` |
| `src/pages/Maps.tsx` | 176 | lost_pets | `id, name, species, photo_url, location, lat, lng` |
| `src/pages/ServiceDirectory.tsx` | 654 | service_providers | `id, business_name, slug, specialties, rating, photo_url` |
| `src/pages/PetClinicalRecord/index.tsx` | 90, 117 | pets, medical | Columnas de ficha clinica |
| `src/pages/AddPet.tsx` | 115 | pets | Solo count para limite free |
| `src/hooks/useMissions.ts` | 38 | paw_missions | `id, title, description, icon, requirement_type, requirement_value` |
| `src/pages/MyBookings.tsx` | 98, 175 | vet_bookings | Columnas de reserva |

### 3.3 [MEDIO] Exponer error state en 3 hooks
- **Hallazgo**: `useFollows`, `useActiveRole`, `useNotifications` no retornan `error`
- **Accion**: Agregar `error` al return de cada hook para que los componentes puedan mostrar fallback UI

### 3.4 [MEDIO] Consolidar queries N+1 en AppSidebar
- **Archivo**: `src/components/AppSidebar.tsx:145,158,176`
- **Hallazgo**: 3 queries separadas (pets, groomer, provider slug) que podrian ser 1
- **Accion**: Combinar en una sola query o usar `Promise.all`

---

## FASE 4 — OPTIMIZACION DE IMAGENES Y WEB VITALS (Dia 3-4)
> **Tiempo estimado: 2-3 horas** | **Mejora Core Web Vitals (LCP, CLS)**

### 4.1 [ALTO] Optimizar imagenes hero
- **Hallazgo**: `hero-pets.jpg` (164KB) y `pet-friendly-place.jpg` (85KB) sin comprimir
- **Accion**:
  1. Convertir a WebP (reduccion ~40-50%)
  2. Crear versiones responsive (640w, 1024w, 1920w)
  3. Usar `<picture>` con `srcset` para carga adaptativa

### 4.2 [ALTO] Agregar width/height a 30+ img tags (CLS)
- **Hallazgo**: 30+ `<img>` sin dimensiones, causando Cumulative Layout Shift
- **Archivos prioritarios**:
  - `src/components/memorial/MemorialCard.tsx:30`
  - `src/components/feed/FeedStories.tsx:179`
  - `src/components/maps/MapPinPopup.tsx:192,285`
  - `src/pages/PawCardLanding.tsx:105`
  - Avatares de perfil en multiples componentes
- **Accion**: Agregar `width` + `height` o usar `aspect-ratio` CSS

### 4.3 [MEDIO] Lazy loading de imagenes no-criticas
- **Hallazgo**: 13 archivos ya tienen `loading="lazy"`, pero faltan avatares, feed images, adoption posts
- **Accion**: Agregar `loading="lazy"` a todas las imagenes below-the-fold

### 4.4 [MEDIO] Memoizar componentes pesados
- **Hallazgo**: Objetos/arrays creados en cada render sin memoizacion
- **Archivos**:
  - `src/pages/Maps.tsx:64` — `markerIcons` recreado cada render → `useMemo`
  - `src/components/Header.tsx:36` — `notificationIconMap` → `useMemo` o constante fuera del componente
  - `src/hooks/useMissions.ts:49-50` — achievement map en useQuery → memoizar resultado
- **Accion**: Aplicar `useMemo` donde el calculo es costoso o la referencia causa re-renders

### 4.5 [BAJO] Memoizar value del ActiveRoleProvider
- **Archivo**: `src/hooks/useActiveRole.tsx:68`
- **Hallazgo**: Value object creado en cada render → todos los consumidores re-renderizan
- **Accion**: Wrap en `useMemo` con deps `[role, isProvider, isProviderLoading]`

---

## FASE 5 — ACCESIBILIDAD Y UX POLISH (Dia 4-5)
> **Tiempo estimado: 1-2 horas** | **Mejora a11y score y UX edge cases**

### 5.1 [MEDIO] Completar aria-labels faltantes (~20% de elementos interactivos)
- **Archivos**:
  - `src/pages/Feed.tsx:165-182` — Badge/chip filter buttons sin aria-label
  - `src/pages/Home.tsx:479-528` — Status card CTAs sin aria-label
  - Botones de navegacion en Feed sin contexto para screen readers
- **Accion**: Agregar `aria-label` descriptivo a cada elemento interactivo

### 5.2 [MEDIO] Error UI explicita en Feed y Medical Docs
- **Hallazgo**: Feed.tsx no muestra error state explicito (solo FeedEmptyState), MedicalDocumentsTab limitado
- **Accion**: Agregar fallback UI con toast o inline error message

### 5.3 [BAJO] Agregar unhandledrejection handler
- **Accion**: En `src/main.tsx`:
  ```typescript
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason);
  });
  ```

### 5.4 [BAJO] Selects de ficha clinica mas anchos en mobile
- **Archivo**: `src/pages/PetClinicalRecord/index.tsx:200`
- **Hallazgo**: Select con `w-[200px]` fijo, podria ser `w-full sm:w-[200px]`

---

## FASE 6 — EDGE FUNCTIONS HARDENING (Dia 5-6)
> **Tiempo estimado: 1-2 horas** | **Reduce superficie de ataque en backend**

### 6.1 [MEDIO] Agregar rate limiting a 3 edge functions expuestas
- **Hallazgo**: Funciones con auth pero sin rate limit que usuarios pueden abusar
- **Archivos**:
  - `supabase/functions/google-calendar-sync/index.ts`
  - `supabase/functions/generate-medical-summary/index.ts`
  - `supabase/functions/generate-medical-zip/index.ts`
- **Accion**: Importar `checkAiQuota` de `_shared/rate-limit.ts` o crear rate limit custom

### 6.2 [MEDIO] Unificar CORS en pet-assistant
- **Archivo**: `supabase/functions/pet-assistant/index.ts:5-15`
- **Hallazgo**: Implementa CORS inline en vez de usar `_shared/cors.ts`
- **Accion**: Refactorizar para usar el helper compartido

### 6.3 [BAJO] Auditar RLS en tablas restantes
- **Hallazgo**: Migracion `20260509000000` agrega RLS a notifications, reviews, verifications (reciente)
- **Riesgo**: Tablas creadas antes de esa fecha podrian carecer de RLS
- **Accion**: Ejecutar en Supabase SQL Editor:
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```
  Verificar que TODAS las tablas con data de usuario tengan `rowsecurity = true`

---

## Checklist de Validacion Post-Ejecucion

Despues de cada fase, verificar:

```bash
# Type-check limpio
npx tsc -b

# Build exitoso
npm run build

# Tests pasan
npm run test:ci

# Lint sin errores nuevos
npm run lint
```

---

## Resumen por Prioridad

| Prioridad | Items | Tiempo Est. | Fase |
|-----------|-------|-------------|------|
| CRITICO | 5 items | 1-2 hrs | 0, 1 |
| ALTO | 8 items | 4-5 hrs | 1, 2, 3, 4 |
| MEDIO | 14 items | 4-5 hrs | 2, 3, 4, 5, 6 |
| BAJO | 5 items | 1-2 hrs | 4, 5, 6 |
| **TOTAL** | **32 items** | **~10-14 hrs** | **6 fases** |

---

## Lo que esta BIEN (no tocar)

Estas areas pasaron la auditoria con nota verde — no requieren cambios:

- **Rutas y guards**: 0 orphans, 0 dead code, todos los RoleGuard/AdminRoute correctos
- **Premium gating**: Implementacion excelente (PremiumGate + usePlan + admin bypass + feature flags)
- **Bundle splitting**: Vendor chunks bien separados, todos los 62+ routes lazy-loaded
- **Console/debug**: Produccion limpia, solo logger.ts
- **Safe-area mobile**: Configuracion Capacitor excelente
- **Error boundaries**: App-wide con Sentry
- **Loading skeletons**: Implementados en todas las paginas clave
- **Empty states**: Cobertura completa en paginas principales
- **Form labels**: 100% de inputs con `<Label>` semantico
- **Keyboard navigation**: Elementos custom con `role="button"` + `tabIndex` + `onKeyDown`
- **config.toml**: Las 26 edge functions listadas correctamente

---

*Generado por auditoria de 7 agentes paralelos — 2026-04-15*
*Siguiente paso: ejecutar Fase 0 inmediatamente (seguridad)*
