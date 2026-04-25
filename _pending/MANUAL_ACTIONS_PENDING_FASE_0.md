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
- [x] Aplicadas las 4 migraciones Fase 0 adopción 2026-04-24 (commit `dc8c733b`):
  - `20260730000000_unify_adoption_feed.sql`
  - `20260801000000_adoption_processes.sql`
  - `20260801000001_shelter_onboarding.sql`
  - `20260802000000_adoption_interest_to_process_trigger.sql`
- [x] Flags activados: `HOME_PET_FOCUS`, `BOTTOM_TAB_V2`, `SIDEBAR_COLLAPSED`,
  `ONBOARDING_V2_MINIMAL`, `FICHA_HISTORIA_TAB`, `PET_ID_CARD_V1`,
  `MEMORIAL_VIRAL`, `PAW_POINTS_CANONICAL`, `OWNER_AUDIO_NOTES`,
  `QUICK_ACTIONS_HUB`, `ADOPTION_UNIFIED_FEED`, `ADOPTION_PROCESSES_V1`.

---

## 🔴 Pendientes — Fase 1 Pilar 1 (Nose Print) — 2026-04-24

Nuevo bloque: arrancamos Fase 1 con el sistema biométrico de huella nasal.
Código mergeado en commit del 2026-04-24 (PM). Bloqueado en 4 cosas que
solo Pedro puede hacer:

### F1.1. Aplicar migración `20260815000000_nose_print_system.sql`

- **Archivo**: [supabase/migrations/20260815000000_nose_print_system.sql](../supabase/migrations/20260815000000_nose_print_system.sql)
- **Qué hace**:
  - Crea `CREATE EXTENSION IF NOT EXISTS vector` (pgvector ya estaba habilitado).
  - Tabla `nose_prints` con `VECTOR(768)` + index HNSW + provider abstraction
    (huggingface/replicate/local/petnow).
  - Columnas `pets.lost_at`, `lost_message`, `lost_location` para el flujo
    de "mascota perdida" (consent gating en `/nose-scan`).
  - RPC `match_nose_print` con SECURITY DEFINER (cosine similarity).
  - RPC `set_nose_print_primary` (transaccional, atomic).
  - RLS: owner gestiona sus pets, vet con link puede leer.
  - Smoke test al final.
- **Verificación post-apply**:
  ```sql
  SELECT extname FROM pg_extension WHERE extname='vector';
  SELECT count(*) FROM public.nose_prints; -- 0
  SELECT proname FROM pg_proc WHERE proname IN ('match_nose_print', 'set_nose_print_primary');
  ```

### F1.2. Crear secret `HUGGINGFACE_API_KEY` en Supabase

Vamos con HuggingFace Inference API + SigLIP2-base como provider default
(0.923 mean en test empírico, 768 dims). Plan B si no discrimina hermanos:
fine-tune DINOv2-large con triplet loss (notebook `de1a4e27` ya commiteado).

1. Crear cuenta gratis en https://huggingface.co/ si no tenés.
2. Settings → Access Tokens → New token → "read" role → guardar.
   (Free tier: 30k requests/mes, suficiente para validación.)
3. Configurar como secret de Supabase:
   ```bash
   npx supabase secrets set HUGGINGFACE_API_KEY=hf_xxxxx
   ```

### F1.3. Deploy de las 2 edge functions

```bash
npx supabase functions deploy nose-print-embed
npx supabase functions deploy nose-print-match
```

### F1.4. Test cross-pet con tus 4 mascotas reales

Este es el **gate técnico** antes de activar los flags `NOSE_PRINT_*`:

1. Tomar 5 fotos de la nariz de cada mascota:
   - 3 pastores suizos hermanos blancos (Kai + 2 hermanos)
   - 1 gato (Ema)
2. Probar localmente:
   - Activar `NOSE_PRINT_ENABLED=true` solo en local (`.env.local`)
   - Crear las 4 mascotas en tu cuenta de test
   - Capturar la nariz de cada una con `NosePrintCapture`
   - Después: foto extra de Kai → `/nose-scan` debe devolverlo con
     similarity >0.95 y NO confundirlo con sus hermanos.
3. Reportar resultado:
   - **Si distingue hermanos** (sim Kai-vs-Kai >0.95, Kai-vs-hermanos <0.85)
     → activamos en prod gradualmente. ✅
   - **Si no distingue** → fine-tunear DINOv2-large con el notebook
     `scripts/finetune_dinov2_nose_v2.ipynb` + dataset que estamos juntando
     vía outreach refugios. Plan B con timeline 2-4 semanas.

### F1.5. Activar flags Fase 1 (después de F1.4)

Cuando F1.4 esté ✅, editar [src/lib/featureFlags.ts](../src/lib/featureFlags.ts):

```ts
NOSE_PRINT_ENABLED: true,         // captura desde /onboarding-mascota + ficha
NOSE_PRINT_ONBOARDING: true,      // mostrar paso opcional en wizard 3 pasos
NOSE_PRINT_PUBLIC_SCAN: true,     // habilitar /nose-scan publico
```

---

## ✅ Bloque adopción 2026-04-24 — APLICADO

Pedro aplicó las 4 SQLs en Supabase Dashboard SQL Editor (2026-04-24 PM).
Tipos regenerados + flags `ADOPTION_UNIFIED_FEED` y `ADOPTION_PROCESSES_V1`
activados (commit `dc8c733b`).

**Pendiente operacional**: deploy de la edge fn de email para que los cambios
de status del kanban refugio disparen notificación al adopter:

```bash
npx supabase functions deploy send-adoption-status-email
npx supabase secrets set RESEND_API_KEY=re_xxxxx
```

Sin esto, el flujo principal del kanban funciona — solo no se envían emails
automáticos a los adopters al cambiar status.

---

## 🟡 Pendientes — Nose print biométrico (validación dataset crowdsourcing)

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
| 2026-04-24 (PM+1) | Pedro aplicó las 4 SQLs adopción + activé flags `ADOPTION_*` (commit `dc8c733b`). Arrancamos Fase 1 con nose print: migración pgvector + 2 edge fns + componente captura + ruta /nose-scan. Flags `NOSE_PRINT_*` en false hasta F1.4 (test 4 mascotas). |
