# Pendientes manuales — Booking System Overhaul

> **Fecha**: 2026-04-18.
> **Contexto**: Fase 2+3 del plan maestro archivado ([_archive/BOOKING_SYSTEM_OVERHAUL_PLAN.md](../../_archive/BOOKING_SYSTEM_OVERHAUL_PLAN.md)). Sucesor: [docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md](../planes/BOOKING_SYSTEM_MASTER_PLAN.md).
> **Quién aplica**: Pedro.
> **Por qué manual**: las migraciones SQL toca aplicarlas desde Supabase Dashboard (regla CLAUDE.md §9.2), y los deploys de edge functions requieren CLI.

---

## 1. Migraciones SQL — aplicar EN ORDEN

> Supabase Dashboard → SQL Editor → pegar contenido del archivo → Run.
> Todas son **idempotentes y zero-downtime** (agregan columnas nullable o tablas nuevas).

### 1.1 `20260612000000_booking_medical_link_and_notes.sql`
**Qué hace**:
- Agrega `vet_bookings.private_notes` (TEXT), `started_at` (TIMESTAMPTZ), `follow_up_booking_id` (UUID FK).
- Agrega `medical_records.booking_id` + `booking_type` (si la tabla existe).
- Crea trigger `set_vet_booking_started_at()` que auto-setea `started_at` cuando status pasa a `en_curso`.

**Riesgo**: bajo. Columnas nullable con default NULL. Trigger solo actúa en UPDATE.

**Validación post-aplicar**:
```sql
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_name = 'vet_bookings' AND column_name IN ('private_notes', 'started_at', 'follow_up_booking_id');
-- Debe retornar 3 filas.
```

### 1.2 `20260612000001_notification_attempts.sql`
**Qué hace**: Crea tabla `notification_attempts` + 4 índices + 3 RLS policies.

**Riesgo**: cero. Tabla nueva.

**Validación post-aplicar**:
```sql
SELECT COUNT(*) FROM notification_attempts; -- debe retornar 0
SELECT policyname FROM pg_policies WHERE tablename = 'notification_attempts';
-- debe retornar: service_all, recipient_read, admin_read
```

### 1.3 `20260612000002_device_tokens.sql`
**Qué hace**: Crea tabla `device_tokens` para push nativo. Multi-device, con RLS owner-only.

**Riesgo**: cero. Tabla nueva.

**Validación**:
```sql
SELECT COUNT(*) FROM device_tokens; -- debe retornar 0
```

### 1.4 `20260612000003_booking_rpcs.sql`
**Qué hace**:
- Crea RPC `public.transition_booking(booking_type, booking_id, new_status, metadata)` — valida state machine + actor role, actualiza status con timestamps derivados, loguea en `booking_events`.
- Crea RPC `public.get_available_slots(provider_id, target_date, service_type)` — computa slots server-side.

**Riesgo**: bajo. Funciones nuevas, no reemplazan código cliente todavía. El frontend sigue usando hooks directos; estas RPCs son la base para migración gradual en Fase 3.

**Validación**:
```sql
-- Debe encontrar ambas funciones
SELECT proname FROM pg_proc
 WHERE proname IN ('transition_booking', 'get_available_slots');

-- Prueba rapida (no destructiva, busca slots en una fecha vacia)
SELECT * FROM public.get_available_slots(
  (SELECT id FROM service_providers LIMIT 1),
  CURRENT_DATE + 30,
  'consulta_general'
);
```

---

## 2. Edge Functions — deploy

> Desde la CLI de Supabase (`supabase functions deploy <nombre>`) o desde el Dashboard.

### 2.1 `sync-payment-to-booking` (NUEVA)
```bash
supabase functions deploy sync-payment-to-booking --project-ref gwailbjlvevkhwcrovfd
```
**Qué hace**: recibe POST `{ booking_id, booking_type, payment_status, payment_reference, metadata }` y actualiza el booking + loguea `payment_received`/`payment_refunded` en `booking_events`. Se usa desde flow-webhook (cuando se integre pago de bookings) y desde admin panel para correcciones manuales.

**Validación post-deploy**:
```bash
curl -X POST "https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/sync-payment-to-booking" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"booking_id":"00000000-0000-0000-0000-000000000000","booking_type":"vet","payment_status":"pendiente"}'
```
Debe retornar `{"error":"booking_not_found"}` (404). Si retorna 500 o no responde, hay un problema.

### 2.2 `booking-reminders-cron` (ACTUALIZADA)
```bash
supabase functions deploy booking-reminders-cron --project-ref gwailbjlvevkhwcrovfd
```
**Qué cambió**: ahora envía WhatsApp al owner si `whatsapp_opted_in=true` (antes solo in-app). Registra cada intento en `notification_attempts` para observabilidad.

**Dependencia**: requiere la migración `20260612000001_notification_attempts.sql` aplicada. Si no está, los `logAttempt` fallan silenciosos y el cron sigue funcionando para in-app.

---

## 3. Cron schedule (si no está configurado)

Supabase Dashboard → Database → Cron Jobs (pg_cron).

| Job | Schedule | Command |
|---|---|---|
| `booking-reminders-30min` | `*/30 * * * *` | `SELECT net.http_post(url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/booking-reminders-cron', headers := jsonb_build_object('Authorization', 'Bearer ' \|\| current_setting('app.service_role_key')));` |
| `reminder-cron-daily` | `0 11 * * *` | (mismo patrón, fn `reminder-cron`) |

**Si ya existen**, verificar:
```sql
SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE '%reminder%';
```

---

## 4. Verificación post-aplicación

### 4.1 Smoke test E2E
```bash
npm run test:e2e -- booking-flow.spec.ts
```
Debe pasar 11/11 tests (rutas publicas + deeplinks dummy + payment callbacks).

### 4.2 Widget admin "Pulso de reservas"
Entrar a `/admin` autenticado como admin → ver widget "Pulso de reservas" con 4 KPIs visibles.

### 4.3 Banner Google Calendar revocado
Si un user tiene `google_calendar_tokens.revoked_at` no nulo, verá banner amarillo en `/home`, `/mis-reservas`, `/calendario`, `/provider/dashboard`. Para testear sin usuario real, marcar un token como revoked:
```sql
UPDATE google_calendar_tokens SET revoked_at = NOW() WHERE user_id = '<TU_USER_ID>';
```
Luego loguear con ese user y navegar. Revertir con:
```sql
UPDATE google_calendar_tokens SET revoked_at = NULL WHERE user_id = '<TU_USER_ID>';
```

### 4.4 RPC transition_booking
Como admin, desde SQL Editor:
```sql
-- Crea un booking de prueba (si no tienes uno)
-- Luego:
SELECT public.transition_booking(
  'vet',
  '<BOOKING_ID>',
  'confirmado',
  jsonb_build_object('source', 'post_migration_test')
);
-- Debe retornar { ok: true, previous_status: ..., new_status: 'confirmado', ... }
```

Verificar que quedó el evento:
```sql
SELECT * FROM booking_events
 WHERE booking_id = '<BOOKING_ID>'
 ORDER BY created_at DESC LIMIT 3;
```

---

## 5. Rollback plan

### Si una migración falla a mitad
Ninguna migración tiene DROP destructivo. Si algo sale mal:

```sql
-- 20260612000000: quita las columnas agregadas
ALTER TABLE vet_bookings DROP COLUMN IF EXISTS private_notes;
ALTER TABLE vet_bookings DROP COLUMN IF EXISTS started_at;
ALTER TABLE vet_bookings DROP COLUMN IF EXISTS follow_up_booking_id;
DROP TRIGGER IF EXISTS trg_vet_booking_started_at ON vet_bookings;
DROP FUNCTION IF EXISTS public.set_vet_booking_started_at();
ALTER TABLE medical_records DROP COLUMN IF EXISTS booking_id;
ALTER TABLE medical_records DROP COLUMN IF EXISTS booking_type;

-- 20260612000001:
DROP TABLE IF EXISTS notification_attempts;

-- 20260612000002:
DROP TRIGGER IF EXISTS trg_device_tokens_last_seen ON device_tokens;
DROP FUNCTION IF EXISTS public.update_device_token_last_seen();
DROP TABLE IF EXISTS device_tokens;

-- 20260612000003:
DROP FUNCTION IF EXISTS public.transition_booking(TEXT, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_available_slots(UUID, DATE, TEXT);
```

### Si edge function falla después de deploy
```bash
# Re-deployar la version anterior desde git
git checkout HEAD~1 -- supabase/functions/booking-reminders-cron
supabase functions deploy booking-reminders-cron --project-ref gwailbjlvevkhwcrovfd
git checkout HEAD -- supabase/functions/booking-reminders-cron
```

---

## 6. Secrets de Supabase — verificar que están seteados

```bash
supabase secrets list --project-ref gwailbjlvevkhwcrovfd
```

Necesarios para las edge functions del booking system:
- `SUPABASE_URL` ✅ (default)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (default)
- `META_WHATSAPP_TOKEN` — si ya está en uso para otras fns, no toca.
- `META_WHATSAPP_PHONE_ID` — idem.

**Flow.cl secrets** (ya deben existir):
- `FLOW_API_KEY`
- `FLOW_SECRET_KEY`
- `FLOW_BASE_URL`

---

## 7. Riesgos identificados y mitigación

| Riesgo | Mitigación |
|---|---|
| `booking-reminders-cron` falla si `notification_attempts` no existe | Código hace `try/catch` silencioso en `logAttempt()`. Cron sigue funcionando sin tracking. |
| RPC `transition_booking` rechaza transiciones válidas por un bug | Validar con tests manuales antes de wirearla desde frontend. El frontend sigue usando hooks directos hasta validar. |
| Owner con booking antiguo no ve cambios UI | UI nueva lee nuevos campos con fallback (`booking.start_time ?? null` etc). Zero breaking. |
| Tokens Google Calendar revocados masivamente | Banner ya cubre UI. Monitor widget admin. |

---

## 8. Orden recomendado de ejecución

1. Migraciones SQL (1.1 → 1.2 → 1.3 → 1.4) — ~5 min total.
2. Validar cada una con query de verificación — ~2 min.
3. Deploy `sync-payment-to-booking` — ~1 min.
4. Deploy `booking-reminders-cron` — ~1 min.
5. Validar cron schedule.
6. Smoke test E2E.

**Tiempo total estimado**: ~15 minutos.

---

**Último actualizado**: 2026-04-18.
