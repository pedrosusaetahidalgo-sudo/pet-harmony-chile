# Setup de Integraciones — WhatsApp + Google Calendar

> Guía paso a paso para conectar Paw Friend con Meta WhatsApp Cloud API y Google Calendar.
> Sesión 2026-04-09. El código ya está en el repo, solo falta crear cuentas y guardar secrets.

---

## Resumen de lo que ya está hecho ✅

### Migración de DB
- `supabase/migrations/20260416000000_whatsapp_and_google_calendar.sql`
  - `profiles.whatsapp_number` + `whatsapp_opted_in`
  - `whatsapp_message_log` (bitácora)
  - `google_calendar_tokens` (refresh tokens encriptados via service_role)
  - `external_calendar_events` (mapping pet_reminder/appointment ↔ Google event)

### Edge functions (5 nuevas)
- `send-whatsapp-reminder` — envía 1 mensaje via Meta Cloud API
- `reminder-cron` — escanea recordatorios próximos 24h y dispara WhatsApp
- `google-calendar-oauth-init` — devuelve URL OAuth de Google
- `google-calendar-callback` — recibe `code`, intercambia tokens, crea calendar
- `google-calendar-sync` — push de reminders + appointments al Google Calendar

### UI
- `src/components/settings/IntegrationsCard.tsx` — card en Settings con:
  - Switch WhatsApp + input de número (formato +569 1234 5678)
  - Botón "Conectar con Google" + "Sincronizar ahora"
  - Estado conectado/desconectado

---

## 🟠 Pendiente del dueño (Pedro) — paso a paso

### BLOQUE A — Meta WhatsApp Cloud API (~45 min)

#### A.1. Portfolio comercial ✅ (ya creado: "Pawfriend")

#### A.2. Crear app de desarrollador
1. Ir a https://developers.facebook.com/apps
2. Click **"Crear app"**
3. Tipo: **"Negocio"** → siguiente
4. Nombre: **"Paw Friend Notifications"**
5. Email de contacto: tu email
6. Asociar al portfolio: **Pawfriend**
7. Click **"Crear app"** (te puede pedir password)

#### A.3. Agregar producto WhatsApp
1. En el panel de la app, scroll hasta **"Agregar productos a tu app"**
2. Buscar **"WhatsApp"** → **"Configurar"**
3. Te lleva a **WhatsApp → Configuración de la API**

#### A.4. Conseguir IDs de prueba
En la pantalla de configuración vas a ver:
- **Phone Number ID** (número largo) ← este SÍ podés pegarme
- **WhatsApp Business Account ID** (otro número largo) ← este SÍ
- **Token de acceso temporal** (`EAAxxx...`) ← **NO me lo pegues**, dura 24h

Al lado del token aparece un número de teléfono de prueba que Meta te asignó.

#### A.5. Verificar tu propio número como destinatario de prueba
1. En la misma pantalla, sección **"Para"**
2. **"Administrar lista de números de teléfono"**
3. Agregar **tu número personal** (con +56 9...)
4. Te llega un código por WhatsApp → ingresálo

#### A.6. Generar token PERMANENTE (importante)
El token de 24h no sirve para producción. Hay que generar uno permanente con un System User:

1. Ir a https://business.facebook.com/settings/system-users
2. Asegurate de estar en el portfolio **Pawfriend** (dropdown arriba)
3. Click **"Agregar"** → System User
4. Nombre: **"Paw Friend API"**
5. Rol: **Admin** → Crear
6. Click en el system user creado → **"Asignar activos"** → seleccioná tu app **"Paw Friend Notifications"** → permisos completos
7. Click **"Generar token nuevo"**
8. Seleccionar la app **"Paw Friend Notifications"**
9. Permisos: marcar **`whatsapp_business_messaging`** y **`whatsapp_business_management`**
10. Expiración: **Sin caducidad**
11. Click **"Generar token"**
12. **COPIALO INMEDIATAMENTE** (solo se muestra una vez) → este es el **`META_WA_ACCESS_TOKEN`**
13. ⚠️ **NO me lo pegues**. Lo vas a guardar en Supabase secret en el paso A.8.

#### A.7. Crear plantilla de mensaje (HSM)
Meta exige plantillas pre-aprobadas para mandar notificaciones:
1. En el menú lateral: **WhatsApp → Administrador de plantillas**
2. **"Crear plantilla"**
3. Categoría: **"Utility"** (Utilidad)
4. Nombre: **`pet_reminder`** (exacto, así lo busca el código)
5. Idioma: **Español**
6. Cuerpo (copiá tal cual, las variables van con doble llave):
   ```
   🐾 Paw Friend te recuerda

   Hola {{1}}, mañana es la {{2}} de {{3}}.

   📅 Fecha: {{4}}

   Abrí la app para más detalles.
   ```
7. Sin botones, sin header, sin footer
8. **Enviar para revisión** → tarda 1-24h en aprobarse
9. Cuando esté aprobada, podés probar el envío

#### A.8. Guardar secrets en Supabase

⚠️ **Reemplazá los placeholders con los valores reales antes de ejecutar.**
**NO me pegues los comandos con los valores reales en el chat.**

```powershell
npx supabase secrets set META_WA_ACCESS_TOKEN=PEGAR_TOKEN_PERMANENTE --project-ref gwailbjlvevkhwcrovfd
npx supabase secrets set META_WA_PHONE_NUMBER_ID=PEGAR_PHONE_NUMBER_ID --project-ref gwailbjlvevkhwcrovfd
```

#### A.9. Lo que me vas a pasar cuando termines A
**Pegame en el chat solo estos datos públicos**:
- Phone Number ID (lo guardaste en secret pero también lo necesito para validar)
- WhatsApp Business Account ID
- App ID
- Confirmación de que la plantilla `pet_reminder` está **APROBADA** (puede tardar)

---

### BLOQUE B — Google Cloud Console (~30 min)

#### B.1. Crear proyecto en Google Cloud
1. https://console.cloud.google.com
2. Login con tu cuenta de Google
3. Dropdown de proyectos arriba a la izq → **"Nuevo proyecto"**
4. Nombre: **"Paw Friend Calendar Sync"**
5. Click **"Crear"** y seleccionarlo

#### B.2. Habilitar Google Calendar API
1. **"APIs y servicios"** → **"Biblioteca"**
2. Buscar **"Google Calendar API"**
3. Click → **"Habilitar"**

#### B.3. Configurar OAuth consent screen
1. **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**
2. Tipo de usuario: **"Externo"** → Crear
3. Nombre de la app: **"Paw Friend"**
4. Email de soporte: tu email
5. Logo: opcional (podés subirlo después)
6. Dominios autorizados: **`pawfriend.cl`**
7. Email del developer: tu email
8. **Guardar y continuar**
9. Pantalla **"Permisos"** → **"Agregar o quitar permisos"** → buscar y marcar:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
10. **Actualizar** → **Guardar y continuar**
11. Pantalla **"Usuarios de prueba"** → agregar tu email + 2-3 emails de testing
12. **Guardar y continuar**

#### B.4. Crear credenciales OAuth
1. **"APIs y servicios"** → **"Credenciales"**
2. **"Crear credenciales"** → **"ID de cliente de OAuth"**
3. Tipo: **"Aplicación web"**
4. Nombre: **"Paw Friend Web Client"**
5. **Orígenes de JavaScript autorizados**:
   - `https://pawfriend.cl`
   - `http://localhost:5173`
6. **URI de redireccionamiento autorizados** (importante: debe coincidir EXACTO):
   - `https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/google-calendar-callback`
7. Click **"Crear"**
8. Te aparece un modal con:
   - **Client ID** (`xxx.apps.googleusercontent.com`) ← este SÍ
   - **Client Secret** ← **NO me lo pegues**

#### B.5. Guardar secrets en Supabase

⚠️ Reemplazá los placeholders.

```powershell
npx supabase secrets set GOOGLE_OAUTH_CLIENT_ID=PEGAR_CLIENT_ID --project-ref gwailbjlvevkhwcrovfd
npx supabase secrets set GOOGLE_OAUTH_CLIENT_SECRET=PEGAR_CLIENT_SECRET --project-ref gwailbjlvevkhwcrovfd
npx supabase secrets set GOOGLE_OAUTH_REDIRECT_URI=https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/google-calendar-callback --project-ref gwailbjlvevkhwcrovfd
```

#### B.6. Lo que me vas a pasar
- Project ID
- Client ID (`xxx.apps.googleusercontent.com`)

---

### BLOQUE C — Aplicar migración + deployar functions

#### C.1. Aplicar migración SQL
1. Abrir https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/sql/new
2. Pegar el contenido de `supabase/migrations/20260416000000_whatsapp_and_google_calendar.sql`
3. Run
4. Marcar como aplicada en otra query:
   ```sql
   insert into supabase_migrations.schema_migrations (version, name)
   values ('20260416000000','whatsapp_and_google_calendar');
   ```

#### C.2. Deployar las 5 edge functions nuevas
```powershell
npx supabase functions deploy send-whatsapp-reminder --project-ref gwailbjlvevkhwcrovfd; npx supabase functions deploy reminder-cron --project-ref gwailbjlvevkhwcrovfd; npx supabase functions deploy google-calendar-oauth-init --project-ref gwailbjlvevkhwcrovfd; npx supabase functions deploy google-calendar-callback --project-ref gwailbjlvevkhwcrovfd; npx supabase functions deploy google-calendar-sync --project-ref gwailbjlvevkhwcrovfd
```

#### C.3. Programar el cron de WhatsApp
1. Dashboard → **Database** → **Cron Jobs**
2. **"Create new cron job"**
3. Nombre: `whatsapp-reminders-hourly`
4. Schedule: `0 * * * *` (cada hora en punto)
5. Tipo: **HTTP request**
6. URL: `https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/reminder-cron`
7. Method: POST
8. Header: `Authorization: Bearer <service_role_key>`
9. Save

#### C.4. Push del código
```powershell
git push origin main
```

---

### BLOQUE D — Probar end-to-end

#### D.1. Probar WhatsApp manual
1. Login en pawfriend.cl
2. Ir a Settings → Integraciones
3. Activar el switch de WhatsApp + ingresar tu número (el verificado en A.5)
4. Crear un recordatorio con `due_date` = mañana
5. Esperar a que corra el cron (próxima hora en punto) o invocar manual:
   ```powershell
   curl -X POST https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/reminder-cron -H "Authorization: Bearer <service_role>"
   ```
6. Deberías recibir el mensaje en WhatsApp

#### D.2. Probar Google Calendar
1. Settings → Integraciones → "Conectar con Google"
2. Te lleva a Google → autorizar
3. Vuelve a Settings con `?google=connected`
4. Click "Sincronizar ahora"
5. Verificar en tu Google Calendar que aparezca el calendario "Paw Friend" con eventos

---

## Limitaciones conocidas

- **WhatsApp**: solo el número verificado en A.5 puede recibir mensajes hasta que pongas la app en producción (Meta lo permite con free tier hasta 1.000 conversaciones/mes)
- **Google Calendar**: hasta que el OAuth consent salga de "Test" (solo 100 users), solo los emails de testing pueden conectar
- **Sync Google → Paw Friend**: NO está implementado (solo Paw Friend → Google). Si el user mueve un evento en Google, no se refleja de vuelta. Requiere watch channels + endpoint público.

---

## Costos esperados

| Servicio | Free tier | Costo aprox después |
|---|---|---|
| Meta WhatsApp Cloud API | 1.000 conversaciones/mes | $0.005-0.05 USD por mensaje según país |
| Google Calendar API | Gratis ilimitado | $0 |
| Supabase Edge Functions | 500K invocaciones/mes | $2/M después |

Para un MVP con 100 usuarios activos enviando 5 recordatorios/mes c/u = 500 mensajes/mes → **GRATIS**.
