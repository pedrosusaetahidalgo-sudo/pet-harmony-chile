# Migraciones Consolidadas — Sesión 2026-04-23 + 2026-04-24

> **Para Pedro**: ejecutar en **Supabase Dashboard > SQL Editor**, **en este orden**.
> Cada bloque está pensado para copiar-pegar y correr. Son idempotentes — si
> algo ya está aplicado, no rompe nada.
>
> **Antes de empezar**: confirmar que tenés backup Supabase reciente (ya lo sacaste 2026-04-24 ✅).

---

## Orden de aplicación (respetar estrictamente)

| # | Archivo | Categoría | Riesgo | Dependencias |
|---|---|---|---|---|
| 1 | [20260725000012_harden_vaccine_schedule_and_check.sql](../supabase/migrations/20260725000012_harden_vaccine_schedule_and_check.sql) | Hotfix prod | Bajo | Ninguna |
| 2 | [20260424000000_deprecate_orphan_tables.sql](../supabase/migrations/20260424000000_deprecate_orphan_tables.sql) | Limpieza | Bajo | Ninguna |
| 3 | [20260525000000_pet_timeline_events.sql](../supabase/migrations/20260525000000_pet_timeline_events.sql) | Tabla nueva | Bajo | Ninguna |
| 4 | [20260530000000_pet_id_cards.sql](../supabase/migrations/20260530000000_pet_id_cards.sql) | Tabla nueva + RPC | Bajo | Ninguna |
| 5 | [20260601000000_owner_audio_notes.sql](../supabase/migrations/20260601000000_owner_audio_notes.sql) | Tabla nueva | Bajo | **Requiere #3** |
| 6 | [20260424100000_nose_print_test_sessions.sql](../supabase/migrations/20260424100000_nose_print_test_sessions.sql) | Tabla nueva | Bajo | Ninguna |

**Todas son aditivas (cero DROP TABLE, cero DELETE FROM masivo). Todas tienen smoke tests inline.**

---

## Acciones adicionales **no-SQL** (Pedro hace en Dashboard o terminal)

### A1. Crear bucket de Storage para la página pública de nose print

**Dashboard > Storage > New bucket**:
- **Nombre**: `nose-print-tests`
- **Public**: ✅ YES (la página pública sube sin auth)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`
- **RLS Policies** (pegar después de crear):

```sql
-- Permitir a anon INSERT (subir fotos desde /nose-print-test)
CREATE POLICY "Anon can upload nose test photos"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'nose-print-tests');

-- Permitir a anon SELECT (ver su propia subida)
CREATE POLICY "Anon can read nose test photos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'nose-print-tests');

-- Admins pueden DELETE
CREATE POLICY "Admins can delete nose test photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'nose-print-tests'
    AND EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );
```

### A2. Regenerar tipos TypeScript (terminal)

**Después de aplicar las 6 migraciones SQL**, en tu terminal desde el repo:

```bash
npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
npx tsc -b
```

Si `npx tsc -b` pasa sin errores → commit:

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate Supabase types post Fase 0 migrations"
git push
```

### A3. (Opcional ahora) Habilitar pgvector

Solo necesario cuando implementemos la tabla `nose_prints` (Fase 1, aún no
creada porque estamos validando el feature biométrico antes).

Pedro ya lo activó preemptivamente. Confirmar con:

```sql
SELECT * FROM pg_available_extensions WHERE name = 'vector';
-- columna installed_version debe tener algo como '0.8.0'
```

---

## Verificación global post-apply

Correr todo junto al final para confirmar que la DB quedó bien:

```sql
-- 1. Tablas nuevas existen
SELECT tablename FROM pg_tables WHERE schemaname='public'
  AND tablename IN (
    'pet_timeline_events',
    'pet_id_cards',
    'owner_audio_notes',
    'nose_print_test_sessions'
  )
ORDER BY tablename;
-- Debe retornar 4 filas

-- 2. Tablas huérfanas renombradas
SELECT tablename FROM pg_tables WHERE schemaname='public'
  AND tablename LIKE '%_deprecated_20260424'
ORDER BY tablename;
-- Debe listar: comprehensive_medical_records_deprecated_20260424,
--              points_history_deprecated_20260424,
--              vet_pet_relationships_deprecated_20260424,
--              virtual_routes_deprecated_20260424

-- 3. Enums creados
SELECT typname FROM pg_type
WHERE typname IN ('timeline_category', 'timeline_event_source', 'audio_note_processing_status')
ORDER BY typname;
-- Debe retornar 3 filas

-- 4. RPCs nuevas
SELECT proname FROM pg_proc
WHERE proname IN ('resolve_pet_identity', 'generate_pet_id_card_number', 'generate_full_vaccine_schedule')
ORDER BY proname;
-- Debe retornar 3 filas

-- 5. Trigger pet_reminders.type acepta los 9 tipos
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conname = 'pet_reminders_type_check';
-- Debe incluir: vaccine, checkup, medication, grooming, weight, custom, followup, deworming, antiparasitic

-- 6. Counts deberian ser 0 (tablas nuevas)
SELECT
  'pet_timeline_events' AS tabla, COUNT(*) AS filas FROM public.pet_timeline_events
UNION ALL
SELECT 'pet_id_cards', COUNT(*) FROM public.pet_id_cards
UNION ALL
SELECT 'owner_audio_notes', COUNT(*) FROM public.owner_audio_notes
UNION ALL
SELECT 'nose_print_test_sessions', COUNT(*) FROM public.nose_print_test_sessions;
-- Las 4 deben ser 0 recien creadas
```

---

## Contenido inline de las migraciones (copy-paste amigable)

Para que no tengas que abrir 6 archivos, pego aquí cada una en bloque
separado. **Copiá una, pegá en SQL Editor, Run, verificá que no haya
error rojo, seguí con la siguiente.**

### ═══════ Migración 1 — Hotfix trigger vacunas (si no se aplicó aún) ═══════

📂 Archivo: [20260725000012_harden_vaccine_schedule_and_check.sql](../supabase/migrations/20260725000012_harden_vaccine_schedule_and_check.sql)

**Propósito**: re-aplica CHECK `pet_reminders_type_check` con los 9 tipos
vigentes + blinda el trigger `generate_full_vaccine_schedule` con
`EXCEPTION WHEN OTHERS` para que un reminder fallido nunca más bloquee
crear mascota.

**Este fix ya evita que se repita el incidente 2026-04-23**. Si aplicaste
el snippet corto (solo CHECK), vale igual correr el archivo completo —
agrega el blindaje del trigger que es la protección real.

→ Abrí el archivo, copiá TODO el contenido, pegá en SQL Editor, Run.

### ═══════ Migración 2 — Rename tablas huérfanas ═══════

📂 Archivo: [20260424000000_deprecate_orphan_tables.sql](../supabase/migrations/20260424000000_deprecate_orphan_tables.sql)

**Propósito**: renombra 4 tablas que existen en DB pero el código NO usa
(eran intentos previos de modelar conceptos ya resueltos con otras
tablas). Las renombra con sufijo `_deprecated_20260424` para:
- Mantener data histórica
- Liberar nombres
- Permitir DROP definitivo en 6 meses (ver `HIDDEN_FEATURES_REVIEW_2026_11_23.md`)

→ Copiá el contenido completo, pegá en SQL Editor, Run.

**Verificación post-apply**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public'
  AND tablename LIKE '%_deprecated_20260424';
-- Debe listar 4 tablas
```

### ═══════ Migración 3 — pet_timeline_events (10 categorías) ═══════

📂 Archivo: [20260525000000_pet_timeline_events.sql](../supabase/migrations/20260525000000_pet_timeline_events.sql)

**Propósito**: crea tabla unificada del timeline de vida de la mascota —
pilar 3 de la Trinidad del Corazón. 10 categorías canónicas: health,
weight, nutrition, hygiene, activity, social, purchases, home, milestone,
legal. Incluye enums, RLS, triggers de updated_at, smoke test inline.

→ Copiá el contenido completo, pegá en SQL Editor, Run.

**Verificación**:
```sql
SELECT COUNT(*) FROM public.pet_timeline_events;  -- 0
SELECT enum_range(NULL::timeline_category);        -- 10 valores
```

### ═══════ Migración 4 — pet_id_cards + resolve_pet_identity ═══════

📂 Archivo: [20260530000000_pet_id_cards.sql](../supabase/migrations/20260530000000_pet_id_cards.sql)

**Propósito**: tabla `pet_id_cards` (Trinidad pilar 1, cédula digital
estilo chileno) + función `generate_pet_id_card_number` (genera códigos
PF-YYYY-XXXXXXXX) + RPC `resolve_pet_identity` (resuelve pet_id por
card_number, microchip o nose_print hash, auto-detecta tipo).

→ Copiá contenido completo, pegá, Run. Smoke test inline valida todo.

**Verificación**:
```sql
SELECT generate_pet_id_card_number();
-- Debe retornar algo como PF-2026-A4F29X7B
```

### ═══════ Migración 5 — owner_audio_notes (REQUIERE #3 aplicada) ═══════

📂 Archivo: [20260601000000_owner_audio_notes.sql](../supabase/migrations/20260601000000_owner_audio_notes.sql)

**Propósito**: permite que el dueño grabe audio de consulta/observación
cuando el vet de cabecera no usa Paw Friend. Pipeline:
pending → transcribing → structuring → review → done.
FK a `pet_timeline_events.id` para linkear al evento creado.

⚠️ **Requiere que la migración #3 (pet_timeline_events) esté aplicada primero**
o el FK falla.

→ Copiá contenido completo, pegá, Run.

### ═══════ Migración 6 — nose_print_test_sessions (página pública) ═══════

📂 Archivo: [20260424100000_nose_print_test_sessions.sql](../supabase/migrations/20260424100000_nose_print_test_sessions.sql)

**Propósito**: tabla donde se registran las sesiones de captura desde la
página pública `/nose-print-test`. Permite INSERT anónimo (es la página
pública), solo admins pueden leer/actualizar. Para crowdsourcing del
dataset de validación del feature biométrico.

→ Copiá contenido completo, pegá, Run.

⚠️ **Después de esto, crear el bucket `nose-print-tests` en Storage (ver A1 arriba)**.

---

## Lista final de activación (cuando todo lo anterior esté aplicado)

En tu próximo momento sin presión, activar feature flags para empezar a
ver los cambios en la app:

```ts
// src/lib/featureFlags.ts — cambiar UNO A UNO y commitear
BOTTOM_TAB_V2: true,         // Primer cambio visible: BottomTab 4 tabs
SIDEBAR_COLLAPSED: true,     // Sidebar a 3 grupos
HOME_PET_FOCUS: true,        // Home "Mi mascota hoy"
FICHA_HISTORIA_TAB: true,    // Tab Historia en ficha (requiere mig #3)
PET_ID_CARD_V1: true,        // Pet ID Card visible (requiere mig #4)
TIMELINE_CATEGORIES: true,   // Usar pet_timeline_events como source
OWNER_AUDIO_NOTES: true,     // Botón audio en ficha (requiere mig #5 + edge fn)
```

Activar uno por commit permite rollback si algo rompe. Avísame y lo hacemos juntos.

---

## Cronología de migraciones

| Fecha | Evento |
|---|---|
| 2026-04-23 | Mig 20260725000012 creada durante hotfix crear-mascota |
| 2026-04-24 AM | Migs 2-5 creadas en sesión refactor Fase 0 |
| 2026-04-24 PM | Mig 6 creada para Track B nose print test |
| — | Pedro aplica el bloque completo en SQL Editor |
