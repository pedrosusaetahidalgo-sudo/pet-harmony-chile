# Runbook — Sistema de Reservas (Booking System)

> Guia operativa para diagnosticar y resolver incidentes del sistema de reservas.
> Referencia: [docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md](../planes/BOOKING_SYSTEM_MASTER_PLAN.md) (plan activo); spec archivada: [_archive/BOOKING_SYSTEM_OVERHAUL_PLAN.md](../../_archive/BOOKING_SYSTEM_OVERHAUL_PLAN.md).

---

## 1. Cita no llegó al vet o al dueño

### Síntomas
- Dueño reclama que reservó pero el vet no la ve en su inbox.
- Vet reporta que un cliente dice haber reservado pero no aparece.
- Reserva creada pero nunca cambió de estado.

### Diagnóstico (Supabase Dashboard > SQL Editor)

```sql
-- 1. Verificar que el booking existe
SELECT id, owner_id, service_provider_id, status, scheduled_date, start_time,
       confirmation_mode, confirmed_at, created_at
  FROM vet_bookings
 WHERE id = '<BOOKING_ID>';

-- 2. Ver timeline de eventos
SELECT event_type, actor_role, previous_status, new_status, metadata, created_at
  FROM booking_events
 WHERE booking_type = 'vet' AND booking_id = '<BOOKING_ID>'
 ORDER BY created_at;

-- 3. Ver intentos de notificacion (requiere migracion 20260612000001)
SELECT channel, reminder_type, status, error_message, attempted_at
  FROM notification_attempts
 WHERE booking_id = '<BOOKING_ID>'
 ORDER BY attempted_at DESC;
```

### Causas posibles y acciones

| Síntoma | Causa | Acción |
|---|---|---|
| `status='pendiente'` y `confirmation_mode='manual'` | Vet no confirmó | Avisar al vet. Admin puede confirmar: `SELECT public.transition_booking('vet', '<ID>', 'confirmado');` |
| Booking no existe en DB | Frontend no persistió | Revisar logs Sentry/Supabase para `INSERT INTO vet_bookings` en la ventana |
| Owner reserva no visible en `/mis-reservas` | `owner_id` no coincide con auth.uid | Verificar RLS: `SELECT auth.uid();` como ese usuario |
| Provider no ve en inbox | `service_provider_id` vacío o mal linkeado | Verificar en `service_providers` + hook `useCurrentProvider` |
| Estado imposible (`completado` sin `confirmed_at`) | Bug en mutation | Reportar bug + corregir manualmente |

### Escalación
Si no se resuelve en 15 min → contactar al dueño y al vet directamente (WhatsApp). Registrar incidente.

---

## 2. Google Calendar desconectado para un usuario

### Síntomas
- Dueño reclama que no recibe recordatorios en su Google.
- Banner "Google Calendar desconectado" aparece en UI.
- Columna `google_calendar_tokens.revoked_at` tiene valor para ese user.

### Diagnóstico

```sql
SELECT user_id, google_email, expires_at, revoked_at, updated_at
  FROM google_calendar_tokens
 WHERE user_id = '<USER_ID>';
```

Si `revoked_at IS NOT NULL` → tokens fueron revocados (por el user en su cuenta Google o por error de refresh).

### Acción

1. El dueño debe ir a `/profile` → sección "Integraciones" → "Reconectar Google Calendar".
2. Si falla, forzar reset:

```sql
DELETE FROM google_calendar_tokens WHERE user_id = '<USER_ID>';
```

Luego pedirle que haga OAuth de nuevo. Supabase edge function `google-calendar-oauth-init` genera el URL.

### Prevención
Monitorear en el widget admin "Pulso de reservas" si muchos users están en estado revoked. Si supera el 5% del total → investigar causa común (ej: cambio de scopes).

---

## 3. Cron de recordatorios no corrió o falló

### Síntomas
- Dueños no reciben recordatorio 24h antes.
- No hay `notification_attempts` nuevos en las ultimas 2h.
- Error en Supabase Dashboard > Edge Functions > Logs de `booking-reminders-cron`.

### Diagnóstico

```sql
-- Ver si el cron está ejecutando
SELECT * FROM cron.job WHERE jobname LIKE '%booking-reminders%';

-- Si existe, ver historial de runs
SELECT * FROM cron.job_run_details
 WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname LIKE '%booking-reminders%')
 ORDER BY start_time DESC LIMIT 5;

-- Ver si hay bookings pendientes de reminder
SELECT COUNT(*) AS pending_24h
  FROM vet_bookings
 WHERE status IN ('pendiente', 'confirmado')
   AND reminder_24h_sent = false
   AND scheduled_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours';
```

### Acción

1. Si `cron.job` no existe → reconfigurar el cron en Supabase Dashboard > Database > Cron Jobs.
   Schedule: `*/30 * * * *`
   Command: `SELECT net.http_post(url := 'https://<proj>.supabase.co/functions/v1/booking-reminders-cron', headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')));`

2. Si el cron corre pero la edge fn falla → revisar logs en Dashboard > Edge Functions > booking-reminders-cron.

3. Para disparar manualmente desde un navegador autenticado:

```bash
curl -X POST "https://<proj>.supabase.co/functions/v1/booking-reminders-cron" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

### Validación post-fix
Verificar que el contador `pending_24h` baja después del siguiente run.

---

## 4. Booking queda en estado imposible

### Síntomas
- `completado` sin `confirmed_at`.
- `cancelado` sin `canceled_at` ni `canceled_by`.
- Transición que no debería existir según state machine.

### Diagnóstico

```sql
-- Bookings huérfanos: completados sin confirmar
SELECT id, status, confirmed_at, completed_at
  FROM vet_bookings
 WHERE status = 'completado' AND confirmed_at IS NULL;

-- Cancelaciones sin actor
SELECT id, status, canceled_at, canceled_by, cancellation_reason
  FROM vet_bookings
 WHERE status = 'cancelado' AND canceled_by IS NULL;
```

### Acción

Corregir manualmente con trazabilidad en `booking_events`:

```sql
-- Usar RPC con actor_role='admin' para que quede auditado
SELECT public.transition_booking(
  'vet',
  '<BOOKING_ID>',
  '<NEW_STATUS>',
  jsonb_build_object('admin_fix', true, 'reason', 'Corrección manual ticket <#>')
);
```

### Prevención
El trigger `set_vet_booking_started_at()` y la RPC `transition_booking` (migracion 20260612000003) previenen estos casos en el futuro.

---

## 5. Colisión de slot (dos usuarios reservan al mismo tiempo)

### Síntomas
- Usuario recibe "Este horario se acaba de tomar" → SlotConflictDialog.
- Solo uno de los dos inserts logra persistir (error 23505 en el otro).

### Comportamiento esperado
1. El primer insert gana.
2. El segundo recibe `BookingConflictError`.
3. El frontend (`BookingFlow`) captura el error y muestra 3 slots alternativos cercanos.
4. Usuario elige uno y se reintenta.

### Verificación
El índice UNIQUE en `vet_bookings (service_provider_id, scheduled_date, start_time)` garantiza la exclusión. Si la colisión no se detecta, verificar que el índice existe:

```sql
SELECT indexname, indexdef
  FROM pg_indexes
 WHERE tablename = 'vet_bookings' AND indexdef LIKE '%UNIQUE%';
```

Si no existe, es un bug de la migración `20260520000000_booking_system_v2`. Recrear.

---

## 6. Tasa de no-show alta (> 15%)

### Síntomas
- Widget admin "Pulso de reservas" marca `no_show_rate_30d` en rojo.
- Múltiples vets reportan clientes que no llegan.

### Diagnóstico

```sql
-- Top 10 owners con más no-shows últimos 90 días
SELECT owner_id, COUNT(*) AS no_shows,
       (SELECT COUNT(*) FROM vet_bookings WHERE owner_id = vb.owner_id) AS total
  FROM vet_bookings vb
 WHERE status = 'no_show'
   AND created_at > NOW() - INTERVAL '90 days'
 GROUP BY owner_id
 ORDER BY no_shows DESC
 LIMIT 10;

-- Breakdown por provider
SELECT service_provider_id, COUNT(*) AS no_shows
  FROM vet_bookings
 WHERE status = 'no_show'
   AND created_at > NOW() - INTERVAL '90 days'
 GROUP BY service_provider_id
 ORDER BY no_shows DESC;
```

### Acción
- Owners recurrentes: considerar bloqueo temporal o requerir prepago.
- Providers con tasa alta: revisar calidad de recordatorios (WhatsApp está llegando?).
- Ajustar política: bajar ventana de cancelación gratuita a 4h en vez de 2h.

---

## 7. Problema con pagos (booking payment_status desincronizado)

### Síntomas
- Usuario pagó pero `payment_status='pendiente'`.
- Flow webhook confirmó pero `vet_bookings` no se actualizó.

### Diagnóstico

```sql
-- Buscar bookings con pago confirmado en Flow pero pendientes aquí
SELECT vb.id, vb.payment_status, vb.payment_reference, vb.created_at,
       (SELECT status FROM subscriptions WHERE payment_provider_id = vb.payment_reference) AS sub_status
  FROM vet_bookings vb
 WHERE vb.payment_status = 'pendiente'
   AND vb.payment_reference IS NOT NULL
   AND vb.created_at > NOW() - INTERVAL '7 days';
```

### Acción

Invocar manualmente `sync-payment-to-booking` (edge function nueva, migración 20260612):

```bash
curl -X POST "https://<proj>.supabase.co/functions/v1/sync-payment-to-booking" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "<BOOKING_ID>",
    "booking_type": "vet",
    "payment_status": "completed",
    "payment_reference": "<FLOW_TOKEN>",
    "metadata": { "manual_sync": true, "operator": "<tu nombre>" }
  }'
```

El booking quedará actualizado y se registrará `payment_received` en `booking_events`.

---

## 8. Dashboards y KPIs relevantes

- **Admin Dashboard** → Widget "Pulso de reservas": confirmación, cancelación, no-show, pendientes >24h.
- **Admin Dashboard** → "Pulso Diario": audit-cron-daily detecta anomalías generales.
- **Supabase Dashboard** → Edge Functions: logs de `booking-reminders-cron`, `reminder-cron`, `sync-payment-to-booking`, `flow-webhook`.
- **Sentry**: filtrar por `"booking"` para ver errores del flujo.

---

## 9. Contactos de emergencia

| Situación | Quién | Canal |
|---|---|---|
| Booking masivo en estado imposible | Pedro (fundador) | WhatsApp |
| Flow.cl caído | Flow support | soporte@flow.cl |
| Meta WhatsApp API caído | Ver Meta Business Dashboard | — |
| Supabase caído | status.supabase.com | — |

---

**Última actualización**: 2026-04-18.
