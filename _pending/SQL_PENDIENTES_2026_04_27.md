# SQLs y crones — estado al 2026-04-27

> Snapshot del estado real al cierre del pivot v2. Para validar definitivamente
> qué está aplicado en prod, correr [BACKEND_AUDIT_SQL_2026_04_27.sql](BACKEND_AUDIT_SQL_2026_04_27.sql)
> en Supabase Dashboard > SQL Editor (especialmente bloques 2, 3, 4, 5, 6, 7).

---

## ✅ SQLs aplicadas según logs de Pedro (sesión 2026-04-27)

Pedro confirmó "todas las migraciones y funciones ok aplicado" + "11 MIGRACIONES OK FUNCIONES OK" durante la sesión maratónica del 2026-04-27. Las 24 SQLs siguientes se consideran aplicadas:

### Fase 1 §6 (5 SQLs aplicadas 2026-04-25):
- `20260825100000_pet_id_cards_storage.sql` — bucket pet-id-cards
- `20260901000000_public_insights.sql` — insights v1
- `20260901100000_shelter_rescue_followup.sql` — refugios followup 30/90d
- `20260901200000_public_insights_more_slugs.sql` — insights v2 (3 tipos slugs)
- `20260815000000_nose_print_system.sql` — pgvector + nose_prints

### Fase 2 + Fase 3 scaffolding (19 SQLs aplicadas 2026-04-27):
- `20260902000000_research_consent.sql` — `profiles.anonymous_data_research_consent`
- `20260902100000_pet_risk_score.sql` — RPC `calculate_pet_risk_score`
- `20260902200000_pet_health_alerts.sql` — tabla + trigger weight_loss_30d
- `20260902300000_b2b_api_keys.sql` — tablas + 4 RPCs (con hotfix index IMMUTABLE)
- `20260902400000_vaccine_overdue_cascade.sql` — RPC `detect_vaccine_overdue_alerts`
- `20260902500000_health_alerts_email_sent.sql` — column `email_sent_at`
- `20260902600000_inactivity_birthday_cascades.sql` — 2 RPCs (no_activity_7d + birthday)
- `20260902700000_correlation_insights.sql` — tablas + 6 seeds + RPC threshold k≥50
- `20260902800000_b2b_correlation_scopes.sql` — scopes default
- `20260902900000_master_kpis_view.sql` — vista materializada + RPC refresh
- `20260903000000_correlation_compute_rpcs.sql` — 2 compute RPCs
- `20260903100000_risk_monitor.sql` — RPC `compute_risk_signals`
- `20260903200000_pet_bootstrap_complete_kpi.sql` — trigger welcome + RPC `count_pets_complete_ficha`
- `20260903300000_antiparasitic_overdue_cascade.sql` — 5to tipo cascada
- `20260903400000_pet_bootstrap_enrichment.sql` — extiende trigger a 4 eventos
- `20260903500000_memorial_anniversary.sql` — 6to tipo cascada (extends CHECK)
- `20260903600000_ficha_complete_milestone.sql` — RPC `claim_ficha_complete_milestone`
- `20260903700000_partner_integrations.sql` — tablas + RPC `record_partner_event`
- `20260903800000_timeline_auto_sync_triggers.sql` — **CRÍTICO** 4 triggers auto-sync
- `20260903900000_rename_orphan_tables.sql` — 4 tablas → `_deprecated_20260427`
- `20260904000000_table_audit_rpc.sql` — RPC `audit_table_health()`

**Total**: ~312 migraciones en repo, todas las recientes consideradas aplicadas.

---

## ⚠️ Edge functions deployed según logs

### Aplicadas Fase 1:
- `nose-print-embed`, `nose-print-match`
- `generate-pet-id-card`, `generate-paw-passport`
- `send-adoption-followups`

### Aplicadas Fase 2/3:
- `b2b-api`, `notify-health-alerts`
- `run-all-cascades` (pipeline unificado 5 RPCs + notify-health-alerts)
- `partner-discount-validate` (POS validation Paw Member)
- `insurance-prefill-quote` (cotización con risk score)

> **Para verificar**: ir a Supabase Dashboard > Edge Functions y confirmar que aparecen las 10 listadas.

---

## 🔴 PENDIENTE — solo Pedro puede ejecutar

### 1. Rotar `service_role` JWT (URGENTE — expuesto en chat 04-25)

```bash
# 1. Supabase Dashboard > Settings > API > Project API keys
# 2. Click "Reset service_role key" — guarda el nuevo JWT en lugar seguro
# 3. Actualizar Vault con el nuevo secret:
```

```sql
-- Borrar secret viejo
DELETE FROM vault.secrets WHERE name = 'service_role_key';

-- Crear con JWT nuevo
SELECT vault.create_secret('NUEVO_JWT', 'service_role_key', 'Cron auth para llamadas HTTP a edge fns');
```

### 2. Cron `run-all-cascades-daily` (reemplaza 6 crones individuales)

```sql
-- 9am Chile = UTC 13:00
SELECT cron.schedule(
  'run-all-cascades-daily',
  '0 13 * * *',
  $$ SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/run-all-cascades',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
      'Content-Type', 'application/json'
    )
  ); $$
);
```

> Si tenías programados antes los 6 individuales (`detect-vaccine-overdue-daily`, `detect-inactive-users-daily`, `detect-birthday-window-daily`, `detect-antiparasitic-overdue-daily`, `detect-memorial-anniversary-daily`, `notify-health-alerts-daily`), bórralos:
```sql
SELECT cron.unschedule('detect-vaccine-overdue-daily');
SELECT cron.unschedule('detect-inactive-users-daily');
SELECT cron.unschedule('detect-birthday-window-daily');
SELECT cron.unschedule('detect-antiparasitic-overdue-daily');
SELECT cron.unschedule('detect-memorial-anniversary-daily');
SELECT cron.unschedule('notify-health-alerts-daily');
```

### 3. Cron `send-adoption-followups-daily`

```sql
-- 9am Chile
SELECT cron.schedule(
  'send-adoption-followups-daily',
  '0 13 * * *',
  $$ SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-adoption-followups',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
      'Content-Type', 'application/json'
    )
  ); $$
);
```

### 4. Cron `refresh-master-kpis-daily`

```sql
-- 6am Chile = UTC 10:00 (antes que el dashboard se cargue durante el dia)
SELECT cron.schedule(
  'refresh-master-kpis-daily',
  '0 10 * * *',
  $$ REFRESH MATERIALIZED VIEW public.master_kpis_daily; $$
);
```

### 5. Test 4 mascotas DINOv2 desde la app

- Tomar foto nasal de Kai + Ema + 2 mascotas más (idealmente hermanos para validar discriminación).
- Verificar que `match_nose_print` devuelve la pet correcta con cosine > 0.55.
- Si discrimina hermanos → activar `NOSE_PRINT_PUBLIC_SCAN=true` en `featureFlags.ts`.
- Si NO discrimina → mantener pausado, esperar respuesta del proveedor.

---

## 🩺 Cómo validar que todo está aplicado

Correr [BACKEND_AUDIT_SQL_2026_04_27.sql](BACKEND_AUDIT_SQL_2026_04_27.sql) en Supabase
Dashboard > SQL Editor. Especialmente:

| Bloque | Qué valida |
|---|---|
| **2** | Lista las migraciones aplicadas según `supabase_migrations.schema_migrations` — comparar con la lista de `supabase/migrations/` |
| **3** | Tablas críticas existen (devuelve ❌ FALTA si no) |
| **4** | RPCs críticos existen |
| **5** | Triggers críticos existen (auto-sync timeline + bootstrap pet) |
| **6** | Crones programados (debería listar los 4 nuevos arriba) |
| **7** | Vault tiene `service_role_key` |
| **8** | RLS coverage por tabla |

Si algo falla, pegar el resultado del bloque al chat para diagnóstico.

---

## ❌ NO confundir con

- **`docs/`** — output de `npm run build` (Vite), NO migraciones.
- **Edge functions** — viven en Supabase Dashboard > Edge Functions, no en SQL.
- **Secrets** (RESEND_API_KEY, HUGGINGFACE_API_KEY, etc.) — Supabase Dashboard > Settings > Edge Functions secrets, no Vault.
- **Vault** — solo para `service_role_key` que usa `pg_cron` para llamar HTTP a edge fns.

---

**Última revisión**: 2026-04-27, post-cierre pivot modelo v2.
