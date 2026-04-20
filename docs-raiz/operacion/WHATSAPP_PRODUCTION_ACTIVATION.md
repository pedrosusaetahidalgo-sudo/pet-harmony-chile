# Activación WhatsApp Cloud API en producción

> Origen: Meta Business Verification **aceptada 2026-04-20**.
> Estado previo: código listo, opt-in pre-filtrado, cron 1x/día configurado. Solo faltaba verificación Meta.
> Impacto: diferenciador "WhatsApp con memoria" activo — pitch vet + recordatorios a dueños con alta apertura (~90% vs email ~20%).

---

## 1. Qué desbloquea esta verificación

- Envío de mensajes **utility** (recordatorios) desde número business oficial.
- Envío de mensajes **marketing** (promos Paw Member, Paw Companys) con opt-in explícito.
- Métricas de delivery + read receipts.
- Template messages (requieren aprobación de Meta por template).

Hasta la verificación, la cuenta estaba en modo sandbox (solo a números "testers" agregados manualmente). Ahora está en **producción** = puede mandar a cualquier número chileno con opt-in.

---

## 2. Pasos para activar (30 min, una sola vez)

### 2.1. Obtener credenciales permanentes

1. Ir a https://business.facebook.com/settings/system-users.
2. Crear un System User (si no existe) con rol **Admin**.
3. Generar token permanente con permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Guardar token (empieza con `EAA...`, longitud ~200 chars).

### 2.2. Identificar Phone Number ID

1. Meta Business → WhatsApp → API Setup.
2. Copiar **Phone Number ID** (es un número largo ~15 dígitos).
3. Copiar **WhatsApp Business Account ID** (WABA ID).

### 2.3. Configurar secrets en Supabase

Dashboard → Project Settings → Edge Functions → Secrets. Agregar/actualizar:

```
WHATSAPP_ACCESS_TOKEN=EAA...
WHATSAPP_PHONE_NUMBER_ID=<phone number id>
WHATSAPP_WABA_ID=<waba id>
WHATSAPP_API_VERSION=v21.0
```

### 2.4. Redeploy edge function

```bash
supabase functions deploy send-whatsapp-reminder
```

Opcional (si existe):

```bash
supabase functions deploy reminder-cron
```

### 2.5. Test manual (1 minuto)

Con tu celular personal configurado en perfil (+56 9 xxxx xxxx) + `whatsapp_opted_in=true`, crear un recordatorio con `due_date` cercano. En el próximo tick del cron (o manual call) debe llegar el mensaje.

Manual call:

```bash
curl -X POST \
  https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-whatsapp-reminder \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"reminder_id": "<uuid_de_un_reminder_tuyo>"}'
```

Respuesta esperada: `{ "ok": true, "message_id": "wamid.HBgL..." }`.

---

## 3. Templates oficiales a registrar

Meta requiere aprobar los templates antes de usarlos. Ir a **Meta Business → WhatsApp → Message Templates**.

### Template 1 — `reminder_vaccine_paw_friend`

- **Category**: Utility.
- **Language**: Spanish (Latin America).
- **Body**:
  ```
  Hola {{1}}, te recordamos que {{2}} tiene que recibir {{3}} el {{4}}. Marca como hecho en Paw Friend: https://pawfriend.cl/reminders
  ```
- **Variables**:
  - `{{1}}` = nombre dueño.
  - `{{2}}` = nombre mascota.
  - `{{3}}` = tipo de vacuna/antiparasitario.
  - `{{4}}` = fecha (ej: "el sábado 3 de mayo").

### Template 2 — `reminder_general_paw_friend`

- **Category**: Utility.
- **Body**:
  ```
  Hola {{1}}, pronto toca {{2}} para {{3}} ({{4}}). Agenda lista en Paw Friend.
  ```

### Template 3 — `vet_new_share_paw_friend`

- **Category**: Utility.
- **Body**:
  ```
  Dra/Dr {{1}}, {{2}} te compartió la ficha clínica de {{3}} en Paw Friend. Ábrela en tu panel: https://pawfriend.cl/provider/dashboard
  ```

Tiempos aprobación Meta: ~1 hora (utility) a 24 hrs (marketing).

---

## 4. Cron activo

El cron `reminder-cron` ya está configurado para correr **1x/día** a las **11:00 UTC** (8 AM Chile — ver memoria `project_session_2026_04_12_cost_optimization.md`).

Para confirmar que está activo:

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE '%reminder%';
```

Debe retornar 1 fila `active=true`.

Para ver las últimas corridas:

```sql
SELECT jobid, runid, start_time, status, return_message
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'reminder-cron')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 5. Costo esperado

Pricing WhatsApp Cloud Chile (2026-04):

- **Utility (recordatorios)**: ~USD $0.027 por mensaje.
- **Marketing**: ~USD $0.062 por mensaje.
- **Service (respuesta a user-initiated 24h)**: gratis primeras 1000/mes.

Con 1000 users activos × 5 recordatorios/mes (promedio) + 50% opt-in = ~2500 utility = ~**USD $67/mes** máximo.

El cron ya pre-filtra por `whatsapp_opted_in=true` antes de llamar a `send-whatsapp-reminder` (evita waste). Ver memoria `project_session_2026_04_12_cost_optimization.md` § 4.3.

Si se dispara el costo: bajar frecuencia a lunes/miércoles/viernes (50% reducción).

---

## 6. Opt-in flow en la app

Hoy el toggle está en `/profile` → Notificaciones. Cuando user marca "Recordatorios por WhatsApp", se setea `profiles.whatsapp_opted_in = true` + se valida `profiles.phone` no vacío.

**Mejora pendiente** (no bloquea activación):
- Badge visible en primer recordatorio: "Activar recordatorios por WhatsApp (te llegan con 90% más de probabilidad)".
- CTA en onboarding paso 3.

Estos son opcionales, no bloquean la activación.

---

## 7. Monitoreo post-activación

Primera semana:

- [ ] Día 1 (hoy): verificar que al menos 5 mensajes de prueba llegaron.
- [ ] Día 3: revisar `notification_attempts` en Supabase para ver delivery rate.
- [ ] Día 7: comparar recordatorios enviados vs completados en BD. Si delta <20%, todo OK. Si delta >50%, algo anda mal.
- [ ] Día 14: primer reporte de costo en Meta Business Manager.

Dashboard admin (si el widget existe, si no: query directo):

```sql
-- Delivery rate últimos 7 días
SELECT
  COUNT(*) FILTER (WHERE status = 'sent') AS sent,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / NULLIF(COUNT(*), 0), 1) AS delivery_pct
FROM whatsapp_message_log
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## 8. Si Meta revoca o suspende la cuenta

Causas comunes:
- Alta tasa de mensajes reportados como spam.
- Envío a números sin opt-in claro.
- Uso de templates sin aprobar.

Mitigación:
- **Opt-in estricto**: solo enviar si `whatsapp_opted_in=true`. Código ya lo respeta.
- **Tasa spam <5%**: monitorear Meta Business Manager → Insights → Quality Rating. Si baja a "Medium", investigar inmediatamente.
- **Solo utility con templates aprobados**: nada de marketing al principio.

Si pasa algo: pausar el cron temporalmente + contactar Meta Business Support.

```sql
-- Pausar cron sin eliminarlo
UPDATE cron.job SET active = false WHERE jobname = 'reminder-cron';
```

---

## 9. Comunicación a usuarios

Después de activar:

1. Email blast opcional a base actual: "Ya puedes recibir recordatorios por WhatsApp — activa en /profile".
2. Banner in-app por 1 semana.
3. Post LinkedIn Pedro: "Paw Friend ahora manda recordatorios por WhatsApp oficial".
4. Actualizar landing `/para-veterinarios`: quitar disclaimer "pendiente Meta" del feature card.

---

## 10. Checklist final

- [ ] Credenciales configuradas en Supabase secrets.
- [ ] Edge fn `send-whatsapp-reminder` redeployada.
- [ ] Test manual exitoso (WA llegó a tu celular).
- [ ] 2-3 templates registrados en Meta Business (pedir aprobación).
- [ ] Cron `reminder-cron` activo y con `active=true`.
- [ ] Monitoreo de delivery en primera semana.
- [ ] Landing `/para-veterinarios` actualizado.

---

## 11. Dónde actualizar memoria / docs vivos

Cuando esté 100% funcionando:

- Actualizar `CLAUDE.md` §6 removiendo "pendiente verificación Meta".
- Actualizar `docs-raiz/operacion/PENDIENTES_MANUALES.md` marcando Meta ✅.
- Agregar memoria `project_whatsapp_live_2026_04_XX.md` con fecha exacta de activación.
