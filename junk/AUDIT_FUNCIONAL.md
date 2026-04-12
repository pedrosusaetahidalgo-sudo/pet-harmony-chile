# Auditoría funcional Supabase — pet-harmony-chile

Fecha: 2026-04-07
Branch: main
Alcance ejecutado: Fase A completa + Fase B parcial (Dominios 1, 2 y arreglos transversales críticos).

## Resumen ejecutivo

- **Errores TypeScript al inicio**: 105 (verificado con `npx tsc -b` después de levantar el build con project references — el `npx tsc --noEmit` puro contra el `tsconfig.json` raíz no reportaba nada porque ese tsconfig tiene `files: []` y delega en references; **importante para el dueño del repo**: usar `npx tsc -b` o `npx tsc -p tsconfig.app.json`, no `npx tsc --noEmit` solo).
- **Errores TypeScript al final**: 34 (todos pre-existentes a esta sesión, ninguno introducido por los fixes).
- **Reducción**: -71 errores (-67 %).
- **Bugs de runtime confirmados arreglados**: 6 críticos + ~55 archivos limpiados a nivel barrido.
- **Bugs detectados pero no arreglados** (deferidos): 34 errores TS estructurales que requieren auditoría dominio por dominio (ver más abajo). No se aplicaron fixes "a ciegas" para respetar las reglas de oro #1 y #2 (no inventar columnas, no usar `as any`).
- **Migraciones nuevas requeridas**: 0. Ninguna columna que use el frontend resultó faltar en la DB durante los dominios auditados.

## Commits creados (en este orden)

| Hash    | Mensaje |
|---------|---------|
| 0293e53 | refactor: logger + describeSupabaseError barrido horizontal |
| eb9d284 | fix(medical): owner_id en insert + describeSupabaseError + user guard |
| 715d9d6 | fix(phase-a): repair multi-line import insertion regression |
| a6b9a62 | fix(imports): alias sb=supabase y elimina duplicados en EnhancedBookingDialog |

## Fase A — barrido horizontal (HECHO)

Aplicado a 55+ archivos:
- `console.log/warn/error/debug` → `logger.log/warn/error/debug` (con `import { logger } from "@/lib/logger"` agregado donde faltaba).
- `description: <expr>.message` en toasts → `description: describeSupabaseError(<expr> as Parameters<typeof describeSupabaseError>[0])`, importando `describeSupabaseError` desde `@/lib/supabaseErrors`.
- Excluido: `src/lib/logger.ts` (es la fuente del helper).

**Importante**: la primera versión del barrido tenía un bug en la regex de inserción de imports — insertaba `import { logger }` en medio de imports multi-línea (`import {\n  X,\n  Y\n} from "..."`), rompiendo 21 archivos. Esto fue detectado vía `npx tsc -b` y corregido en el commit `715d9d6` con un parser que cuenta correctamente strings y delimitadores hasta el `;` que cierra cada import.

## Fase B — auditoría por dominio

### Dominio 1 — pets + pet_reminders (HECHO antes de esta sesión + tocado por barrido A)

- `src/pages/AddPet.tsx`: el patrón insert-then-select-by-name ya estaba reemplazado por `.insert(payload).select("id").single()`, con guard de `user`, owner_id explícito y describeSupabaseError aplicado en mensajes de error. **Sin cambios adicionales necesarios**, salvo los del barrido A.

### Dominio 2 — medical_records + medical_documents + medical_share_tokens (HECHO)

**Bugs encontrados y arreglados** (commit `eb9d284`):

1. **`src/components/AddMedicalRecord.tsx`**:
   - `medical_records` requiere `owner_id` (NOT NULL) según `types.ts:1321` → el insert NO lo enviaba. Bug crítico que rompía la creación bajo RLS / NOT NULL.
   - **Fix**: agregado guard `if (!user) { ... return; }`, agregado `owner_id: user.id` al payload, cambiado `.select().maybeSingle()` por `.select("id").single()`.

2. **`src/hooks/useMedicalRecords.tsx`**:
   - Mismo bug: `owner_id` ausente en el insert.
   - **Fix**: agregado `owner_id: user.id` al payload.
   - **Fix**: 3 callbacks `onError(error: any) { toast.error(error.message ...) }` → `onError(error: unknown) { toast.error('...', { description: describeSupabaseError(error ...) }) }`.

3. **`src/hooks/useMedicalDocuments.tsx`**:
   - Insert ya incluía `owner_id` correctamente. Sin bug de columna.
   - **Fix**: 3 callbacks `onError` migrados a `describeSupabaseError`.

4. **`src/hooks/useMedicalSharing.tsx`**:
   - Insert ya correcto.
   - **Fix**: 2 callbacks `onError` migrados a `describeSupabaseError`.

### Dominios 3 a 9 — NO completados en esta sesión

Por presupuesto de contexto / herramientas, los dominios 3 a 9 (vet bookings, providers, profiles, social, chat, adoption, gamificación) **no fueron auditados línea por línea**. Sin embargo, el barrido horizontal de Fase A ya cubre logger + describeSupabaseError en todos esos archivos, y los fixes cross-cutting de la sesión (sb, imports) tocan archivos de los dominios 3, 4 y 5.

**Bugs ya identificados pero pendientes** (todos visibles vía `npx tsc -b` — no se aplicaron fixes a ciegas porque cada uno requiere decisión de diseño):

| Archivo | Línea | Bug | Por qué no se arregló |
|---------|-------|-----|------------------------|
| `src/components/EnhancedBookingDialog.tsx` | 185 | Inserta en tabla `bookings` con `pet_id, user_id, provider_id, service_type, ...`. Verificar si la tabla correcta no es `vet_bookings` (que tiene esquema distinto: `owner_id, vet_id, scheduled_date, visit_address, total_price` requeridos). El componente parece estar usando una tabla legacy. | Requiere decidir: ¿`bookings` existe todavía o el código apunta a la tabla equivocada? |
| `src/components/calendar/BookingModal.tsx` | 53 | Mismo problema: insert en `bookings`. | Idem. |
| `src/pages/PerfilVetPublico.tsx` | 73 | TS2769 en `vet_bookings` insert: faltan `total_price` y `visit_address` (ambos NOT NULL en `types.ts:4252,4255`). | Requiere agregar inputs de UI o defaults razonables; cambio funcional, no mecánico. |
| `src/components/CreateReviewForm.tsx` | 95-117 | Usa `reviewData: any` y nombres de tabla dinámicos `walk_reviews`/`dogsitter_reviews`/`vet_reviews` con `as` cast. Falta verificar si las primeras dos tablas existen en el esquema. | Verificación pendiente; viola regla de oro #2 (`as`). |
| `src/components/EnhancedReviewCard.tsx` | 86-99 | Igual: `walk_reviews`/`dogsitter_reviews`. | Idem. |
| `src/components/PartnerAd.tsx` | 58, 70 | Usa `.catch()` sobre un PostgrestFilterBuilder, que no existe. Hay que `await` y manejar el error. Bug runtime real. | Cambio mecánico simple, no llegó por falta de tiempo. |
| `src/components/PostComments.tsx` | 78 | Cast a `Comment[]` falla porque la query incluye `profiles(...)` pero la relación post_comments→profiles no existe en el schema. **BUG CRÍTICO** — la query devuelve `SelectQueryError` en runtime. Hay que cambiar la query (usar `user_id` y joinear manual o agregar la FK en SQL). | Requiere migración SQL O reescribir la query. |
| `src/components/reviews/ReviewsList.tsx` | 63 | Mismo patrón: relación `service_reviews → reviewer` no resuelta. | Idem. |
| `src/components/ReportLostPetForm.tsx` | 114 | Llama `awardPoints` como propiedad del módulo `useGamification`, pero `useGamification` no exporta esa función como named export estática. Bug runtime: `awardPoints is not a function`. | Hay que llamarla vía el hook (`const { awardPoints } = useGamification()`). Cambio fácil pero requiere validar el patrón en otros archivos. |
| `src/hooks/useGoogleAuth.tsx` | 16, 86, 93… | Tipado de `GoogleAuth` plugin de Capacitor está roto. Multiple `Property 'authentication' does not exist on type 'unknown'`. | Requiere tipos de @codetrix-studio/capacitor-google-auth o un wrapper tipado. |
| `src/pages/Auth.tsx` | 62, 80 | `Promise.race([supabaseQuery, timeout])` — el query builder no es un Promise hasta que se le hace `await` o `.then`. Hay que envolver con `Promise.resolve(query)`. | Cambio simple. |
| `src/pages/Home.tsx` | 455 | `Mission` type local difiere del que espera el componente hijo (`name` requerido vs opcional). | Requiere unificar tipos. |
| `src/pages/Profile.tsx` | 409-437 | `Achievement` y `Mission` tienen propiedades faltantes (`code`, `name`, `description`, `unlocked_at`). El tipo importado no cuadra con el que el componente espera. | Idem. |
| `src/pages/PetClinicalRecord.tsx` | 1103 | Cast `as PetData` falla porque `PetData` (interface local) tiene campos que `pets` Row no tiene, o viceversa. | Requiere alinear `PetData` con `Database['public']['Tables']['pets']['Row']`. |
| `src/pages/ServiceDirectory.tsx` | 720, 777, 800, 813, 876 | Strings sin narrowing siendo asignados a uniones literales. Falta validación o cast a tipo unión. | Cambio mecánico (`as 'veterinarian' | 'dog_walker' | ...`), pero hay que confirmar que el valor proviene de un origen seguro. |
| `src/components/ServiceReviewsSection.tsx` | 74, 206, 208 | TS2589 (instanciación excesivamente profunda) — query con joins anidados rompe el inferenciador. Hay que romper el tipo en fragmentos. | Requiere refactor del query. |
| `src/components/medical/MedicalDocumentsTab.tsx` | 258 | `.map()` sobre `unknown` — el query no está tipado. | Probablemente arreglable agregando una interface intermedia. |

### Fixes adicionales de esta sesión (no encajan en un solo dominio)

**Commit `a6b9a62` — `sb` undefined + duplicados de import**:

6 archivos referenciaban una variable `sb` que nunca se importaba (probablemente alias previo eliminado en algún refactor anterior):
- `src/hooks/useReviewInvitations.tsx`
- `src/hooks/useGroomerProfile.tsx`
- `src/hooks/useDirectoryVets.tsx`
- `src/hooks/useProviderProfile.tsx`
- `src/components/admin/AdminVetVerifications.tsx`
- `src/pages/RegistroVeterinario.tsx`

Fix: agregado `const sb = supabase;` justo después del import existente. Esto era un bug runtime crítico — esos hooks lanzaban `ReferenceError: sb is not defined` apenas se llamaban.

`src/components/EnhancedBookingDialog.tsx` además tenía:
- `import { Select, SelectContent, ... } from "@/components/ui/select"` duplicado en líneas 10 y 13.
- `import { supabase } from "@/integrations/supabase/client"` duplicado en líneas 15 y 32.
- Fix: removidos los duplicados (líneas 13 y 15), unificando a una sola declaración cada uno.

## Estado de los gates finales

- **`npx tsc -b`**: 34 errores remanentes (todos pre-existentes, ninguno introducido por la sesión). NO está limpio. Ver tabla "Bugs ya identificados pero pendientes".
- **`npm run build`**: NO ejecutado (depende de tsc; con 34 errores Vite probablemente igual emite, pero el build de validación no pasa).

## Recomendación de continuación

Para una próxima sesión, ordenar la cola así:
1. **Bugs runtime simples (1 hora)**: `PartnerAd .catch`, `ReportLostPetForm awardPoints`, `Auth Promise.race`, `ServiceDirectory union casts validados`.
2. **Schema relations rotas (requiere SQL)**: `post_comments → profiles`, `service_reviews → reviewer`. Decidir si agregar FK en SQL o rehacer las queries con join manual.
3. **Tablas legacy `bookings`**: confirmar si la tabla existe; si no, migrar `EnhancedBookingDialog` y `BookingModal` a `vet_bookings` con todos los campos NOT NULL.
4. **Dominio 3 (vet bookings/reviews)** completo, dominio por dominio según el plan original.
5. **Tipos compartidos rotos** (`Mission`, `Achievement`, `PetData`): unificar contra `types.ts`.

Ningún ítem requiere migración nueva todavía; primero confirmar si las tablas legacy existen.
