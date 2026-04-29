# Crons setup pendiente — pegar todos de una vez

> Lista completa de cron jobs del proyecto, listos para crear en
> Supabase Dashboard → Integrations → Cron. Pedro puede hacer todos
> de una sola sesión cuando vuelva, en lugar de uno por uno.
>
> Generado 2026-04-30.

## Pre-requisitos (una sola vez)

### 1. Habilitar extensiones (SQL Editor)

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

### 2. CRON_SECRET en Edge Functions Secrets

- Genera un valor random: `openssl rand -hex 32` en terminal
- Supabase → Edge Functions → Manage Secrets → Add secret:
  - Name: `CRON_SECRET`
  - Value: el string random

### 3. Setear el secret a nivel DB para que pg_cron lo lea (SQL Editor)

```sql
ALTER DATABASE postgres SET app.settings.cron_secret = 'PEGA-AQUI-EL-MISMO-CRON_SECRET';
```

---

## Cron jobs a crear

Para cada uno: Type **HTTP Request**, headers `Content-Type: application/json`
y `X-Cron-Secret: <tu valor>`, body `{}`. Schedule en formato cron expression.

| # | Name | Schedule (UTC) | URL endpoint | Razón |
|---|---|---|---|---|
| 1 | `audit-cron-daily` | `0 11 * * *` (8am Chile) | `/audit-cron-daily` | Audit + auto-fixers diario |
| 2 | `risk-signals-alert-daily` | `0 12 * * *` (9am Chile) | `/risk-signals-alert-cron` | Email a admin si critical |
| 3 | `paw-shield-archive-cleanup` | `0 4 * * *` (1am Chile) | `/paw-shield-archive-cleanup` | Borra imgs biométricas expiradas |
| 4 | `reminder-cron-daily` | `0 13 * * *` (10am Chile) | `/reminder-cron` | Recordatorios pet diarios |
| 5 | `booking-reminders-cron` | `0 14 * * *` (11am Chile) | `/booking-reminders-cron` | Recordatorios reservas |
| 6 | `flow-renewal-reminders` | `0 15 * * *` (12pm Chile) | `/flow-renewal-reminders-cron` | Renovaciones Flow.cl |
| 7 | `run-all-cascades` | `0 16 * * *` (1pm Chile) | `/run-all-cascades` | Cascadas salud (vaccine_overdue etc) |
| 8 | `send-adoption-followups` | `0 17 * * 1` (lunes 2pm Chile) | `/send-adoption-followups` | Follow-up 30/90d post-adopción |
| 9 | `post-adoption-checkin-cron` | `0 18 * * 1` (lunes 3pm Chile) | `/post-adoption-checkin-cron` | Check-in adoptante semanal |
| 10 | `send-pet-birthday-greeting` | `0 9 * * *` (6am Chile) | `/send-pet-birthday-greeting` | Saludos cumpleaños mascota |
| 11 | `send-new-pet-drip` | `0 19 * * *` (4pm Chile) | `/send-new-pet-drip` | Drip emails owners nuevos |
| 12 | `send-inactive-user-reminder` | `0 20 * * 3` (miércoles 5pm Chile) | `/send-inactive-user-reminder` | Reactivación inactivos |
| 13 | `weekly-owner-reports` | `0 21 * * 0` (domingo 6pm Chile) | `/generate-weekly-owner-reports` | Reportes semanales dueños |
| 14 | `weekly-vet-reports` | `0 22 * * 0` (domingo 7pm Chile) | `/generate-weekly-vet-reports` | Reportes semanales vets |
| 15 | `backup-weekly-snapshot` | `0 5 * * 0` (domingo 2am Chile) | `/backup-weekly-snapshot` | Snapshot semanal (si existe) |

**URL base**: `https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1`

Concatenar con cada endpoint del path. Ej:
`https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/audit-cron-daily`

---

## Alternativa SQL: crear todos de una vez (SQL Editor)

Si prefieres pegar un solo bloque SQL en lugar de usar la UI:

```sql
-- Habilitar extensiones (idempotente)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper: schedule + http_post wrapped
DO $$
DECLARE
  v_base TEXT := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/';
  v_jobs JSONB := '[
    ["audit-cron-daily",         "0 11 * * *", "audit-cron-daily"],
    ["risk-signals-alert-daily", "0 12 * * *", "risk-signals-alert-cron"],
    ["paw-shield-archive-cleanup","0 4 * * *", "paw-shield-archive-cleanup"],
    ["reminder-cron-daily",      "0 13 * * *", "reminder-cron"],
    ["booking-reminders-cron",   "0 14 * * *", "booking-reminders-cron"],
    ["flow-renewal-reminders",   "0 15 * * *", "flow-renewal-reminders-cron"],
    ["run-all-cascades",         "0 16 * * *", "run-all-cascades"],
    ["send-adoption-followups",  "0 17 * * 1", "send-adoption-followups"],
    ["post-adoption-checkin",    "0 18 * * 1", "post-adoption-checkin-cron"],
    ["send-pet-birthday-greeting","0 9 * * *", "send-pet-birthday-greeting"],
    ["send-new-pet-drip",        "0 19 * * *", "send-new-pet-drip"],
    ["send-inactive-user-reminder","0 20 * * 3","send-inactive-user-reminder"],
    ["weekly-owner-reports",     "0 21 * * 0", "generate-weekly-owner-reports"],
    ["weekly-vet-reports",       "0 22 * * 0", "generate-weekly-vet-reports"]
  ]'::JSONB;
  v_job JSONB;
  v_name TEXT;
  v_cron TEXT;
  v_endpoint TEXT;
BEGIN
  FOR v_job IN SELECT * FROM jsonb_array_elements(v_jobs)
  LOOP
    v_name := v_job->>0;
    v_cron := v_job->>1;
    v_endpoint := v_job->>2;

    -- Unschedule si ya existe (permite re-run idempotente)
    BEGIN
      PERFORM cron.unschedule(v_name);
    EXCEPTION WHEN OTHERS THEN
      -- No existia, OK
    END;

    -- Schedule nuevo
    PERFORM cron.schedule(
      v_name,
      v_cron,
      format(
        $f$ SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Cron-Secret', current_setting('app.settings.cron_secret')
          ),
          body := '{}'::jsonb
        ); $f$,
        v_base || v_endpoint
      )
    );

    RAISE NOTICE 'Cron % scheduled at %', v_name, v_cron;
  END LOOP;
END $$;

-- Verificar
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
```

⚠️ Antes de correr este bloque: verificar qué edge functions están **deployed** en producción. Si una no está deployed, el cron va a tirar 404 cada vez que dispare. La query `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;` muestra los últimos 50 runs con status.

---

## Cleanup de crons viejos

Si hay crons creados antes con nombres distintos o JWTs hardcodeados:

```sql
-- Listar todos los crons activos
SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid;

-- Eliminar uno especifico (cuando lo vas a recrear)
SELECT cron.unschedule('nombre-viejo-aqui');
```

---

## Verificación post-setup

```sql
-- Ver últimos runs de cada cron
SELECT
  j.jobname,
  d.status,
  d.start_time,
  d.return_message
FROM cron.job_run_details d
JOIN cron.job j ON d.jobid = j.jobid
WHERE d.start_time > NOW() - INTERVAL '24 hours'
ORDER BY d.start_time DESC;
```

Si todos muestran `status = 'succeeded'`, listo. Si alguno falla 401:
- Verifica que `app.settings.cron_secret` matchee `CRON_SECRET` en Edge Functions Secrets
- Verifica que el edge fn esté deployed (`npx supabase functions list`)
