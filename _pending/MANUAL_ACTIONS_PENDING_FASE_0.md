# Acciones Manuales Pendientes — Fase 0 Refactor Maestro

> **Para Pedro**: lista ordenada de acciones que requieren tu intervención manual
> (Supabase Dashboard, terminal, decisiones). Están en orden de ejecución y son
> **idempotentes**.
>
> **Estado**: actualizado 2026-04-24 (sesión recuperación post-crash).

---

## 🟢 Estado al 2026-04-25 (cierre día)

**Fase 1 §6 completa en código y desplegada en Supabase.** Pedro confirmó:
- ✅ 4 SQLs hoy aplicadas: `20260825100000` (bucket pet-id-cards),
  `20260901000000` (insights v1), `20260901100000` (refugios followup),
  `20260901200000` (insights v2)
- ✅ 4 edge fns deployed: `nose-print-match`, `generate-pet-id-card`,
  `generate-paw-passport`, `send-adoption-followups`

**Pendiente mañana 2026-04-26**:
0. **Aplicar 5 migs de Fase 2 scaffolding (2026-04-27)** — ver Supabase Dashboard → SQL Editor:
   - [supabase/migrations/20260902000000_research_consent.sql](../supabase/migrations/20260902000000_research_consent.sql) — agrega `profiles.anonymous_data_research_consent` + `research_consent_at`. Bloqueante para vender data a Pharma. ✅ Aplicada.
   - [supabase/migrations/20260902100000_pet_risk_score.sql](../supabase/migrations/20260902100000_pet_risk_score.sql) — RPC `calculate_pet_risk_score(pet_id)` para deal con aseguradoras (§7.5). ✅ Aplicada.
   - [supabase/migrations/20260902200000_pet_health_alerts.sql](../supabase/migrations/20260902200000_pet_health_alerts.sql) — tabla `pet_health_alerts` + trigger weight loss 10%+ en 30d. ✅ Aplicada.
   - [supabase/migrations/20260902300000_b2b_api_keys.sql](../supabase/migrations/20260902300000_b2b_api_keys.sql) — tablas `b2b_api_keys` + `b2b_api_usage` + 4 RPCs. ✅ Aplicada.
   - [supabase/migrations/20260902400000_vaccine_overdue_cascade.sql](../supabase/migrations/20260902400000_vaccine_overdue_cascade.sql) — RPC `detect_vaccine_overdue_alerts()`. Programar cron diario:
     ```sql
     SELECT cron.schedule(
       'detect-vaccine-overdue-daily',
       '0 14 * * *',  -- 10am Chile
       $$ SELECT public.detect_vaccine_overdue_alerts(); $$
     );
     ```

   - [supabase/migrations/20260902500000_health_alerts_email_sent.sql](../supabase/migrations/20260902500000_health_alerts_email_sent.sql) — agrega `email_sent_at` a pet_health_alerts + indice partial para acelerar el cron de notify.
   - [supabase/migrations/20260902600000_inactivity_birthday_cascades.sql](../supabase/migrations/20260902600000_inactivity_birthday_cascades.sql) — RPCs `detect_inactive_user_alerts` (no_activity_7d, ventana 7-30d sin login) + `detect_birthday_window_alerts` (cumple ±7d).
   - [supabase/migrations/20260902700000_correlation_insights.sql](../supabase/migrations/20260902700000_correlation_insights.sql) — Fase 3 §2.9. Tablas `correlation_definitions` + `correlation_observations` + RPC `get_correlation_insights` con threshold k-anonymity >=50. Seed con 6 correlaciones del plan §2.9.1 en estado 'draft'. El moat de data — esperando volumen.

   Y **deploy 2 edge functions nuevas**:
   ```bash
   npx supabase functions deploy b2b-api
   npx supabase functions deploy notify-health-alerts
   ```
   No requieren secrets adicionales — usan `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (ya existentes). `notify-health-alerts` usa `RESEND_API_KEY` (ya configurado para otros emails).

   Y programar **4 crones nuevos** (con Vault + service_role_key):
   ```sql
   -- Cascada vaccine_overdue (RPC, 9am Chile)
   SELECT cron.schedule(
     'detect-vaccine-overdue-daily',
     '0 13 * * *',
     $$ SELECT public.detect_vaccine_overdue_alerts(); $$
   );

   -- Cascada inactividad 7d (RPC, 10am Chile)
   SELECT cron.schedule(
     'detect-inactive-users-daily',
     '0 14 * * *',
     $$ SELECT public.detect_inactive_user_alerts(); $$
   );

   -- Cascada cumpleanos (RPC, 10am Chile)
   SELECT cron.schedule(
     'detect-birthday-window-daily',
     '0 14 * * *',
     $$ SELECT public.detect_birthday_window_alerts(); $$
   );

   -- Email severity=high (edge fn, 9am Chile despues del cron de scan)
   SELECT cron.schedule(
     'notify-health-alerts-daily',
     '15 13 * * *',  -- 15 min despues del scan
     $$ SELECT net.http_post(
       url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/notify-health-alerts',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
         'Content-Type', 'application/json'
       )
     ); $$
   );
   ```

   Para gestionar las API keys B2B desde la app: **Admin → Sistema → API B2B**.

   **Auditoria features existentes 2026-04-27**: ver
   [_pending/AUDITORIA_FEATURES_2026_04_27.md](AUDITORIA_FEATURES_2026_04_27.md)
   con matriz §2.10 ejecutada (9 pilares activos, 5 refactorizadas, 12
   escondidas correctamente, 7 Fase 2 dormidas). 6 acciones derivadas
   pendientes (la mas urgente: revisar `PRO_ANALYTICS` flag).
1. **Rotar APIs** (incluido `service_role` que se expuso por error en chat).
2. **Vault: actualizar el secret** con el JWT nuevo:
   ```sql
   DELETE FROM vault.secrets WHERE name = 'service_role_key';
   SELECT vault.create_secret('NUEVO_JWT', 'service_role_key', 'Cron auth');
   ```
3. **Schedule cron pg_cron** (después del Vault):
   ```sql
   SELECT cron.schedule(
     'send-adoption-followups-daily',
     '0 13 * * *',  -- 9am Chile
     $$ SELECT net.http_post(
       url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-adoption-followups',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
         'Content-Type', 'application/json'
       )
     ); $$
   );
   ```
4. **Test 4 mascotas reales** con nose print desde la app.
   Si DINOv2-large discrimina hermanos en condiciones reales →
   activar `NOSE_PRINT_PUBLIC_SCAN=true`.

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

### F1.X. 🆕 Cambio de modelo SigLIP2 → DINOv2-large 2026-04-25

Tras comparativa entre 3 modelos open-source con tu dataset:

| Modelo | dim | intra | inter | gap |
|---|---|---|---|---|
| **DINOv2-large** | **1024** | 0.6040 | 0.2641 | **0.3400** 🏆 |
| DINOv2-base | 768 | 0.6001 | 0.3104 | 0.2897 |
| SigLIP2-base | 768 | 0.8783 | 0.8050 | 0.0733 |

DINOv2-large es **4.6x mejor** que SigLIP2 en gap. Decisión: cambiar provider.

**Pasos manuales (F1.X.1 a F1.X.3):**

#### F1.X.1. Aplicar migración 20260825000000_nose_print_dinov2_large.sql

[supabase/migrations/20260825000000_nose_print_dinov2_large.sql](../supabase/migrations/20260825000000_nose_print_dinov2_large.sql)

DROP+CREATE de la tabla `nose_prints` para cambiar `VECTOR(768)` → `VECTOR(1024)`.
La migración tiene un safety check: si la tabla NO está vacía, falla. Si Pedro
ya capturó alguna huella desde la app, hay que decidir migrar manualmente. Por
ahora la mig fresca no debería tener filas.

#### F1.X.2. Actualizar secrets de Supabase

```bash
npx supabase secrets set NOSE_PRINT_MODEL_ID=facebook/dinov2-large
npx supabase secrets set NOSE_PRINT_EMBEDDING_DIM=1024
npx supabase secrets set NOSE_PRINT_THRESHOLD=0.55
```

(El `HUGGINGFACE_API_KEY` existente sigue válido — funciona con cualquier
modelo de HF.)

#### F1.X.3. Re-deploy edge fns

Las edge fns ya están actualizadas en código para soportar ambos providers
(handling de response shape de DINOv2 vs SigLIP2). Solo redeploy:

```bash
npx supabase functions deploy nose-print-embed
npx supabase functions deploy nose-print-match
```

---

### F1.4. ✅ Test cross-pet ejecutado 2026-04-24 — resultado 🟡 GO-WITH-FINETUNE

Corrido con 8 mascotas (3 border collie + 3 pastor suizo + mi_gato +
terrier_chileno), 89 fotos. Reporte completo en
[_pending/nose_print_siglip2_report_20260424_2358.md](nose_print_siglip2_report_20260424_2358.md).

**Resumen**:

| Métrica | Valor | Objetivo | Status |
|---|---|---|---|
| Intra-pet mean | **0.8783** | ≥0.90 | 🟡 |
| Inter-pet mean | **0.8050** | ≤0.85 | 🟡 |
| Gap (intra - inter) | **0.0733** | ≥0.10 | 🟡 |
| Inter-pet **max** (peor caso) | **0.9208** | <intra_min | 🔴 |

**Diagnóstico**:
- SigLIP2-base capta más la **raza** que la **individualidad** (los 3 pastores
  suizos blancos juntos suben a 0.87, casi tanto como intra-pet).
- Casos críticos:
  - `pastor_suizo_1` vs `pastor_suizo_2`: 0.8674 ⚠️ (hermanos confundibles)
  - `border_collie_1` vs `pastor_suizo_1`: 0.8520 ⚠️ (cross-raza falsa señal)
- Inter-max 0.9208 supera incluso el intra-mean 0.88 → riesgo claro de
  falso positivo en `/nose-scan` público.

**Decisión**:
- ✅ `NOSE_PRINT_ENABLED=true` y `NOSE_PRINT_ONBOARDING=true` se mantienen
  activos. La captura sigue siendo útil: cada embedding queda guardado
  con `provider`+`model_id`, y cuando el modelo mejore, los embeddings
  viejos se re-procesan o conviven con los nuevos.
- 🔴 `NOSE_PRINT_PUBLIC_SCAN` queda en **false** hasta fine-tunear. Sin
  esto, un extraño escaneando una mascota cualquiera podría obtener el
  teléfono del dueño equivocado.

### F1.5. Plan B activo: fine-tune DINOv2-large con triplet loss

Notebook ya commiteado en [scripts/finetune_dinov2_nose_v2.ipynb](../scripts/finetune_dinov2_nose_v2.ipynb).

**Próximos pasos** (timeline ~2-4 semanas):

1. **Más dataset cross-individuo**: outreach refugios sigue activo
   ([_pending/OUTREACH_REFUGIOS_NOSE_PRINT.md](OUTREACH_REFUGIOS_NOSE_PRINT.md)).
   Meta: 30-50 mascotas distintas con 5+ fotos cada una.
2. **Setup Colab**: subir el notebook + el dataset (`_pending/nose_print_test_photos/`
   + lo que llegue del outreach) a Google Drive. Colab GPU gratis es
   suficiente para DINOv2-large + triplet loss.
3. **Re-correr validación** con el nuevo modelo. Si gap ≥0.15 e intra ≥0.92,
   activamos `NOSE_PRINT_PUBLIC_SCAN`.
4. **Subir modelo a HuggingFace** (privado o público) con el nombre que
   reemplaza `NOSE_PRINT_MODEL_ID` en los secrets de Supabase. La edge fn
   nose-print-embed lo recoge sin redeploy.

### F1.6. Mientras tanto

- Dueños pueden capturar huellas desde la app — la data se acumula y
  sirve para el fine-tune.
- El sistema match interno (vet con `pet_vet_links`) sigue funcionando.
- Mantener flag `NOSE_PRINT_PUBLIC_SCAN=false` hasta el fine-tune.
- Si querés activar PUBLIC_SCAN en pre-producción para testing interno,
  setea threshold alto (`p_threshold = 0.92`) en el llamado al RPC en
  [supabase/functions/nose-print-match/index.ts](../supabase/functions/nose-print-match/index.ts).

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
| 2026-04-25 | **Cierre Fase 1 + extras** (9 commits, hasta `c3df7e13`). Refactor 4 tabs ficha, 6 refactors UX, brand v2 polish, Paw Passport PDF + componente, Memorial share card, Refugios rescue_story + followup 30/90d, SEO insights v2 con 3 tipos slugs, /mis-postulaciones, banner cumpleaños Home. Pedro aplicó 4 SQLs + deployó 4 edge fns. Pendiente: rotar APIs + Vault + cron pg_cron + test 4 mascotas mañana. Pedro pegó service_role JWT en chat por error → rotar mañana. |
