# Acciones Manuales Pendientes — Fase 0 Refactor Maestro

> **Para Pedro**: esta es la lista ordenada de acciones que requieren tu intervención manual (Supabase Dashboard, terminal, decisiones). Están en orden de ejecución y son **idempotentes**.
>
> Claude va escribiendo código + docs en el repo sin pausa. Esta lista acumula lo que tú tienes que aplicar. Al final revisamos todo junto.
>
> **Estado**: en construcción (Claude va agregando a medida que redacta).
>
> **Ruta**: ejecuta en orden. Si algo falla, pausa y revisamos juntos.

---

## 0. Pre-flight (ya hecho ✅)

- [x] Backup Supabase completo descargado
- [x] pgvector habilitado en Supabase Dashboard → Extensions
- [x] Fotos de 5 mascotas (3 perros + 2 gatos) — Pedro está tomando

---

## 1. Migraciones SQL a aplicar (orden estricto)

**Cómo aplicar**: Supabase Dashboard → SQL Editor → nueva query → pegar contenido del archivo → Run.

Una por una. Verificá que cada una termine sin error antes de pasar a la siguiente.

### 1.1. Rename tablas huérfanas a `_deprecated` (bajo riesgo)

- **Archivo**: `supabase/migrations/20260424000000_deprecate_orphan_tables.sql`
- **Qué hace**: renombra 4 tablas que están en DB pero no se usan en código (`comprehensive_medical_records`, `vet_pet_relationships`, `points_history`, `virtual_routes`). No pierde data.
- **Reversible**: sí, con un `ALTER TABLE ... RENAME TO` inverso.
- **Verificación post-apply**:
  ```sql
  SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%_deprecated_%';
  -- Debe listar las 4 tablas renombradas
  ```

### 1.2. Tabla `pet_timeline_events` con 10 categorías canónicas

- **Archivo**: `supabase/migrations/20260525000000_pet_timeline_events.sql`
- **Qué hace**: crea tabla unificada del timeline de vida de mascotas + enum de 10 categorías + índices.
- **No toca tablas existentes**. Es 100% aditivo.
- **Verificación post-apply**:
  ```sql
  SELECT COUNT(*) FROM pet_timeline_events; -- debe retornar 0
  SELECT pg_type.typname FROM pg_type WHERE typname = 'timeline_category';
  ```

### 1.3. Tabla `pet_id_cards` + función RPC `resolve_pet_identity`

- **Archivo**: `supabase/migrations/20260530000000_pet_id_cards.sql`
- **Qué hace**: crea tabla pet_id_cards + RPC que resuelve pet_id por cualquiera de los 3 identificadores (card_number, microchip, nose_print hash).
- **Verificación**:
  ```sql
  SELECT * FROM pg_proc WHERE proname = 'resolve_pet_identity';
  ```

### 1.4. Tabla `owner_audio_notes`

- **Archivo**: `supabase/migrations/20260601000000_owner_audio_notes.sql`
- **Qué hace**: permite que el dueño grabe audio de consulta/observación → IA estructura → evento en timeline.
- **Verificación**:
  ```sql
  SELECT COUNT(*) FROM owner_audio_notes;
  ```

---

## 2. Regenerar tipos TypeScript post-migraciones

Después de aplicar las 4 migraciones SQL, correr en tu terminal desde el repo:

```bash
npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
```

Luego commit del archivo actualizado:

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate Supabase types post Fase 0 migrations"
git push
```

---

## 3. Validación nose print (cuando tengas las fotos)

Instrucciones detalladas en `scripts/nose_print_validation_README.md`. Resumen:

1. Crear carpeta `_pending/nose_print_test_photos/` (ignorada por git)
2. Adentro, subcarpetas por mascota: `kai/`, `ema/`, `otto/`, `luna/`, `coco/` (nombres reales)
3. Cada subcarpeta con 3–5 fotos de la nariz (no commitear — son fotos privadas)
4. Instalar Python 3.10+ si no tienes: `python --version`
5. Correr: `pip install -r scripts/requirements_nose_print.txt`
6. Correr: `python scripts/nose_print_validation.py`
7. Reportar resultado a Claude para decisión Go/No-Go de H2

---

## 4. Activación progresiva de feature flags

Los flags Fase 0 están agregados a `src/lib/featureFlags.ts` en estado inicial seguro (la mayoría en `false`). Cuando los componentes estén listos, los activamos uno por uno.

**Orden sugerido de activación**:

1. `BOTTOM_TAB_V2: true` — después de testear el BottomTab nuevo
2. `SIDEBAR_COLLAPSED: true` — después de validar nav
3. `HOME_PET_FOCUS: true` — después de UX review del Home
4. `FICHA_HISTORIA_TAB: true` — después de aplicar migraciones (1.2)
5. `PET_ID_CARD_V1: true` — después de aplicar migraciones (1.3)
6. `OWNER_AUDIO_NOTES: true` — después de aplicar migraciones (1.4) + edge fn
7. `QUICK_ACTIONS_HUB: true` — al final, cuando los widgets estén listos

Cada activación = 1 commit pequeño en `src/lib/featureFlags.ts` que Claude hace cuando el componente subyacente está completo.

---

## 5. Post-Fase 0 (cuando esté listo)

- [ ] Conversación con aseguradora (iki / Mapfre / Sura) — Pedro
- [ ] Migrar cuenta Flow a SpA — Pedro
- [ ] Decisión formal de iniciar Fase 1 basada en resultado validación H2 + H3

---

## Historial

| Fecha | Evento |
|---|---|
| 2026-04-23 | Archivo creado al arrancar Fase 0 refactor |
| — | Pedro va ticando cada acción cuando la ejecuta |
