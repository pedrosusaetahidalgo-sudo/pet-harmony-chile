# Acciones Manuales Pendientes — Fase 0 Refactor Maestro

> **Para Pedro**: lista ordenada de acciones que requieren tu intervención manual
> (Supabase Dashboard, terminal, decisiones). Están en orden de ejecución y son
> **idempotentes**.
>
> **Estado**: actualizado 2026-04-24 (sesión recuperación post-crash).

---

## ✅ Ya hecho (sesiones previas)

- [x] Backup Supabase completo descargado.
- [x] pgvector habilitado en Supabase Dashboard → Extensions.
- [x] Aplicadas las 4 migraciones Fase 0 iniciales (commit `24cc4446`):
  - `20260424000000_deprecate_orphan_tables.sql`
  - `20260525000000_pet_timeline_events.sql`
  - `20260530000000_pet_id_cards.sql`
  - `20260601000000_owner_audio_notes.sql`
- [x] Tipos Supabase regenerados post-migraciones Fase 0 iniciales.
- [x] Flags activados: `HOME_PET_FOCUS`, `BOTTOM_TAB_V2`, `SIDEBAR_COLLAPSED`,
  `ONBOARDING_V2_MINIMAL`, `FICHA_HISTORIA_TAB`, `PET_ID_CARD_V1`,
  `MEMORIAL_VIRAL`, `PAW_POINTS_CANONICAL`, `OWNER_AUDIO_NOTES`,
  `QUICK_ACTIONS_HUB`.

---

## 🔴 Pendientes — Bloque adopción 2026-04-24

Las 4 SQLs y los flags `ADOPTION_UNIFIED_FEED` y `ADOPTION_PROCESSES_V1`
quedan **EN FALSE** hasta que apliques esto. El código frontend ya está
mergeado pero gateado por flag, así que prod sigue intacto.

### 1. Migraciones SQL (orden estricto)

**Cómo aplicar**: Supabase Dashboard → SQL Editor → nueva query → pegar contenido
del archivo → Run. Una por una. Verificá que cada una termine sin error antes
de pasar a la siguiente. Cada una incluye smoke test al final (regla 9.2.1).

#### 1.5. Bloque 1 — Feed unificado de adopción

- **Archivo**: [supabase/migrations/20260730000000_unify_adoption_feed.sql](../supabase/migrations/20260730000000_unify_adoption_feed.sql)
- **Qué hace**: agrega `pet_id` a `adoption_interests` con CHECK XOR (uno
  de los dos targets, post o pet). RLS para que shelters vean intereses
  sobre sus pets. Permite el botón "Me interesa" en `/refugios/:slug`.
- **Verificación post-apply**:
  ```sql
  SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adoption_interests'
      AND column_name IN ('pet_id', 'adoption_post_id');
  -- Debe listar las 2 columnas
  ```

#### 1.6. Bloque 2.A — Tabla adoption_processes

- **Archivo**: [supabase/migrations/20260801000000_adoption_processes.sql](../supabase/migrations/20260801000000_adoption_processes.sql)
- **Qué hace**: crea tabla `adoption_processes` (7 estados kanban) +
  trigger `handle_adoption_transfer` que cuando status='transferred' setea
  `pets.pending_owner_email + token` (reusa flujo `send-pet-invitation`).
- **Verificación**:
  ```sql
  SELECT COUNT(*) FROM public.adoption_processes; -- debe retornar 0
  SELECT proname FROM pg_proc WHERE proname = 'handle_adoption_transfer';
  ```

#### 1.7. Bloque 2.B — Onboarding shelter

- **Archivo**: [supabase/migrations/20260801000001_shelter_onboarding.sql](../supabase/migrations/20260801000001_shelter_onboarding.sql)
- **Qué hace**: agrega columna `adoption_centers.onboarding_completed_at`
  para mostrar checklist solo la primera vez.
- **Verificación**:
  ```sql
  SELECT column_name FROM information_schema.columns
    WHERE table_name='adoption_centers' AND column_name='onboarding_completed_at';
  ```

#### 1.8. Bloque 2.C — Trigger interest → process

- **Archivo**: [supabase/migrations/20260802000000_adoption_interest_to_process_trigger.sql](../supabase/migrations/20260802000000_adoption_interest_to_process_trigger.sql)
- **Qué hace**: trigger `create_adoption_process_from_interest` que conecta
  `/refugios/:slug` "Me interesa" con el kanban `/shelter/adopciones`. Cuando
  un adopter inserta interest con pet_id, auto-crea row en
  `adoption_processes` con status='interested'. Idempotente (ON CONFLICT
  pet_id+adopter_user_id DO NOTHING).
- **Verificación**:
  ```sql
  SELECT tgname FROM pg_trigger WHERE tgname='tg_adoption_interest_to_process';
  ```

### 2. Regenerar tipos TypeScript post-migraciones

Después de aplicar las 4 SQLs, correr en tu terminal:

```bash
npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
```

Luego:

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate Supabase types post adopcion 2026-04-24"
git push
```

### 3. Deploy edge function `send-adoption-status-email`

```bash
npx supabase functions deploy send-adoption-status-email
```

Verificar que tenga `RESEND_API_KEY` como secret. Si no:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxx
```

### 4. Activar los 2 flags pendientes

Una vez que las 4 SQLs estén aplicadas + types regenerados + edge fn deployada,
editar [src/lib/featureFlags.ts](../src/lib/featureFlags.ts):

```ts
ADOPTION_UNIFIED_FEED: true,   // línea ~213
ADOPTION_PROCESSES_V1: true,   // línea ~250
```

Commit + push:

```bash
git add src/lib/featureFlags.ts
git commit -m "feat(flags): activar ADOPTION_UNIFIED_FEED + ADOPTION_PROCESSES_V1 post SQLs"
git push
```

---

## 🟡 Pendientes — Nose print biométrico

### 5. Validación con fotos reales (cuando tengas las 4 mascotas)

Instrucciones detalladas en [scripts/nose_print_validation_README.md](../scripts/nose_print_validation_README.md).

1. Las fotos van en `_pending/nose_print_test_photos/` (ignorada por git).
2. 5 fotos × 4 mascotas (3 pastores suizos hermanos blancos + 1 gato).
3. Correr: `pip install -r scripts/requirements_nose_print.txt`
4. Correr: `python scripts/nose_print_validation.py`
5. Reportar resultado para decisión Go/No-Go de H2.

### 6. Outreach a refugios para dataset cross-individuo

Instrucciones en [_pending/OUTREACH_REFUGIOS_NOSE_PRINT.md](../_pending/OUTREACH_REFUGIOS_NOSE_PRINT.md).

1. Activar 2FA en `pawfriendcl@gmail.com`.
2. Crear app password en https://myaccount.google.com/apppasswords (16 chars).
3. Copiar `.env.example` → `.env.local` y rellenar `GMAIL_USER`,
   `GMAIL_APP_PASSWORD`, `GMAIL_FROM_NAME`. **Nunca** commitear `.env.local`.
4. Correr: `python scripts/send_outreach_refugios.py` (envía tanda inicial).
5. Para auto-scheduler: `scripts/run_outreach_scheduled.ps1` en Windows
   Task Scheduler.

### 7. Fine-tuning DINOv2-large (futuro, no urgente)

- Notebook v2: [scripts/finetune_dinov2_nose_v2.ipynb](../scripts/finetune_dinov2_nose_v2.ipynb)
- Se corre en Google Colab (GPU gratis). Solo cuando tengamos dataset
  suficiente del outreach (~50 mascotas distintas con 3+ fotos cada una).

---

## 🟢 Cuando los flags lleven 2-4 semanas activos en prod sin regresiones

Ver [_pending/LEGACY_CLEANUP_AUDIT_2026_04_24.md](LEGACY_CLEANUP_AUDIT_2026_04_24.md).
Eliminar los componentes legacy `HomeLegacyDashboard`, `AddPetLegacy`,
`RefugiosHogaresLegacy`, `OWNER_TABS_V1`, `AdoptionLegacy`, acciones legacy
de `points.ts`. Ahorro estimado: ~1.830 líneas + ~114 kB gzip.

**Cuándo revisar**: 2026-05-15.

---

## 📌 Decisiones de negocio aún pendientes

- [ ] Conversación con aseguradora (iki / Mapfre / Sura) — Pedro.
- [ ] Migrar cuenta Flow.cl a SpA SUSAETA GARNHAM SOFTWARE ENGINEERING
  (riesgo fiscal). Ver memoria `project_spa_meta_verif_2026_04_17.md`.
- [ ] Decisión formal de iniciar Fase 1 basada en resultado validación
  H2 (nose print) + H3 (pasaporte adoption funnel).

---

## Historial

| Fecha | Evento |
|---|---|
| 2026-04-23 | Archivo creado al arrancar Fase 0 refactor. |
| 2026-04-24 | Pedro aplicó 4 migraciones iniciales + activó 6 flags. |
| 2026-04-24 (PM) | Sesión recuperación post-crash: 8 commits con 4 SQLs adopción nuevas + Memorial viral + Paw Points canonical + Trinidad consolidada + nose print v2 outreach. Flags `ADOPTION_*` quedan en false hasta aplicar las 4 SQLs nuevas. |
