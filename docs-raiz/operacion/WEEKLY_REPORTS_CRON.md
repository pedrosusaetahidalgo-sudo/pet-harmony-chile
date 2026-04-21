# Weekly Reports — cron activo verificación

> **Épica C.3** (auditoría top-tier 2026-04-20). Engagement loop D7.

## Estado

✅ **Código listo** en `supabase/migrations/20260630000000_weekly_reports_cron.sql`.
Si aún no lo aplicaste, correlo desde Supabase Dashboard > SQL Editor.

## Qué hace

Dos cron jobs en Postgres (pg_cron + pg_net):

| Job | Schedule | Edge fn invocada |
|---|---|---|
| `weekly-owner-reports` | Domingo 13:00 UTC (10:00 Chile) | `generate-weekly-owner-reports` |
| `weekly-vet-reports` | Domingo 13:05 UTC (10:05 Chile) | `generate-weekly-vet-reports` |

## Pre-requisito (una vez)

El SQL usa `current_setting('app.settings.service_role_key', true)`.
Esto requiere que hayas corrido **una vez**:

```sql
-- Desde SQL Editor con rol postgres (superuser):
ALTER DATABASE postgres SET app.settings.service_role_key = '<tu JWT service_role>';
```

El JWT lo encontrás en Supabase Dashboard > Settings > API > `service_role`
(nunca el anon).

## Validación

Correr después de aplicar la migración:

```sql
-- 1. Ambos jobs deben aparecer activos
SELECT jobid, jobname, schedule, active
  FROM cron.job
  WHERE jobname IN ('weekly-owner-reports', 'weekly-vet-reports');

-- 2. Después del próximo domingo, verificar ejecuciones
SELECT jobid, runid, start_time, status, return_message
  FROM cron.job_run_details
  WHERE jobid IN (
    SELECT jobid FROM cron.job
    WHERE jobname IN ('weekly-owner-reports', 'weekly-vet-reports')
  )
  ORDER BY start_time DESC
  LIMIT 10;
```

Status esperado: `succeeded`. Si aparece `failed`, revisar `return_message`
(suele ser JWT mal configurado o edge fn no deployada).

## Troubleshooting

### JWT mal configurado
Si `return_message` dice "Invalid JWT": el ALTER DATABASE no corrió o
rotaste el service_role y no lo actualizaste. Repetir el paso "Pre-requisito".

### Edge fn devuelve 500
Verificar en Supabase Dashboard > Edge Functions > Logs de
`generate-weekly-owner-reports` y `generate-weekly-vet-reports`. Error
común: `RESEND_API_KEY` no configurado.

```bash
npx supabase secrets list
npx supabase secrets set RESEND_API_KEY="re_xxx"
npx supabase functions deploy generate-weekly-owner-reports
```

### No llegan los emails a users
La edge fn respeta `user_notification_prefs.weekly_digest_email = true`
(o similar). Verificar:

```sql
SELECT count(*) FROM profiles WHERE id IN (
  SELECT user_id FROM user_notification_prefs
  WHERE weekly_digest_email = true
);
```

Si 0, la flag no está seteada para nadie — la edge fn itera sobre esa tabla.

## Deshabilitar temporalmente

```sql
UPDATE cron.job SET active = false
  WHERE jobname IN ('weekly-owner-reports', 'weekly-vet-reports');
```

Reactivar con `active = true`.

## Próximos pasos (no en esta épica)

- **D0 welcome drip** ya activo (`send-new-pet-drip`, ver
  `20260709020000_new_pet_drip.sql`).
- **D30 re-engagement** (`send-inactive-user-reminder`, mig
  `20260709010000_inactive_user_cron.sql`) — también activo.
- **Daily digest** (épica C.1) está pendiente — requiere edge fn nueva
  con near-due reminders + push notif en vez de email.
