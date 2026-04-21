# Runbook — Activar WhatsApp Cloud API (Lote G auditoría pre-launch)

**Contexto**: Meta Business Verification ACEPTADA 2026-04-20. Ya podemos enviar mensajes vía API oficial en producción (no sólo a números de prueba).

La edge fn `send-whatsapp-reminder` está ya en el repo (`supabase/functions/send-whatsapp-reminder/index.ts`) y solo requiere credenciales + deploy.

---

## Pasos (5-10 min)

### 1. Obtener credenciales en Meta Developers

1. Entrar a <https://developers.facebook.com/apps>
2. Abrir la app `Paw Friend` (la que Meta verificó el 2026-04-20).
3. Sidebar izquierdo → **WhatsApp → API Setup**
4. Copiar dos valores:
   - **Phone number ID** (está arriba, bajo "From")
   - **Temporary access token** (válido 24h) o mejor aún:
     - Crear un **System User** en `Business Settings > Users > System Users`
     - Darle rol `Admin` sobre la app y sobre el número WhatsApp
     - Generar un **permanent access token** con permisos `whatsapp_business_messaging + whatsapp_business_management`
     - Copiar ese token (es el único que verás, no se puede recuperar)

### 2. Configurar secrets en Supabase

En PowerShell, desde la raíz del proyecto:

```powershell
npx supabase secrets set META_WA_ACCESS_TOKEN=<tu_token_permanente>
npx supabase secrets set META_WA_PHONE_NUMBER_ID=<tu_phone_number_id>
```

Verificar que quedaron:

```powershell
npx supabase secrets list
```

### 3. Deploy de la edge function

```powershell
npx supabase functions deploy send-whatsapp-reminder
```

### 4. Crear la plantilla aprobada `pet_reminder` en Meta

La edge fn usa la plantilla `pet_reminder` (categoría Utility). **Debe estar aprobada por Meta antes de poder enviar mensajes con ella**.

1. Meta Developers → WhatsApp → **Message Templates** → **Create Template**
2. Categoría: **Utility**
3. Idioma: **Spanish (Chile) (es_CL)** o **Spanish (es)**
4. Nombre: `pet_reminder`
5. Body template (4 variables `{{1}}` `{{2}}` `{{3}}` `{{4}}`):

   ```
   Hola {{1}} 👋 Te recordamos que {{3}} tiene {{2}} el {{4}}.

   Abre Paw Friend para confirmar o reprogramar.

   — Equipo Paw Friend
   ```

6. Ejemplos de valores (los pide Meta):
   - {{1}}: `Pedro`
   - {{2}}: `vacuna antirrábica`
   - {{3}}: `Kai`
   - {{4}}: `23 de abril`

7. Enviar a revisión. Aprobación: 15 min a 24h.

### 5. Smoke test (después de aprobada la plantilla)

Usa el Supabase Dashboard → Edge Functions → `send-whatsapp-reminder` → Invoke:

Body:
```json
{
  "user_id": "<tu_user_id>",
  "pet_name": "Kai",
  "reminder_type": "vacuna antirrábica",
  "due_date": "2026-04-25"
}
```

**Pre-requisito**: tu `profiles.whatsapp_number` debe existir (`+56912345678`) y `profiles.whatsapp_opted_in = true`.

Si funciona, recibes el mensaje en tu WhatsApp.

---

## Post-activación

Una vez que la plantilla esté aprobada y el smoke test pase, se puede extender el sistema para disparar WhatsApp automáticamente desde:

- **Reminders cron** (`supabase/functions/reminder-cron/`) — reemplazar envío de email por WhatsApp cuando `profile.whatsapp_opted_in = true`.
- **Booking confirmations** — trigger post-insert en `vet_bookings` que llama `send-whatsapp-reminder`.
- **Vet onboarding** — mensaje de bienvenida al vet.

Estos disparadores están pendientes — es trabajo post-launch, no bloqueante.

---

## Fallback si no llegan los mensajes

- La fn NO lanza error si el user no dio consent (`whatsapp_opted_in=false`). Devuelve `{ skipped: 'not_opted_in' }`.
- Si Meta rechaza la plantilla, el error queda en `whatsapp_message_log` con `status='failed'` + `error_message`.
- Ver logs: Supabase Dashboard → Edge Functions → `send-whatsapp-reminder` → Logs.

## Límites de Meta (tier inicial)

Meta arranca en tier **250 conversaciones únicas por 24h** (tier 1). Sube automático a 1.000, luego 10.000, luego 100.000 según calidad. No bloqueante para lanzamiento 1 junio.

---

## Resumen ejecutivo

- ✅ Código listo (`send-whatsapp-reminder`)
- ⏳ Pedro: configurar secrets + deploy + crear plantilla `pet_reminder` en Meta
- ⏳ Pedro: smoke test después de aprobación Meta
- 🔲 Post-launch: wire disparadores (reminder-cron, booking triggers)
