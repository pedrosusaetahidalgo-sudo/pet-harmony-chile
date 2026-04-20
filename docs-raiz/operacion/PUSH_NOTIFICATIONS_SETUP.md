# Push Notifications — Setup FCM + APNs

> Origen: INIT-16 del [Plan de Éxito 90 días](../planes/PLAN_EXITO_90D_20260420.md).
> Estado: infra frontend lista (`App.tsx` persiste tokens en `device_tokens`). Edge fn `send-push-notification` creada.
> Falta: Pedro configura Firebase Cloud Messaging y, opcionalmente, APNs.

---

## 1. Contexto

Capacitor 7 ya está instalado con `@capacitor/push-notifications`. En `App.tsx`:

- Al pedir permisos y registrarse, el listener `'registration'` recibe un token.
- Ese token se **persiste en `device_tokens`** con user_id + platform (ios/android).
- El backend puede leer esa tabla y enviar push vía la edge fn `send-push-notification`.

Lo que falta:

1. Configurar **Firebase Cloud Messaging** (Android).
2. Configurar **APNs** (iOS) — si quieres push nativo puro. Alternativa: usar FCM también para iOS.
3. Guardar los secrets en Supabase.
4. Probar end-to-end con un test push.

---

## 2. Android — FCM (30 min)

### 2.1. Proyecto Firebase

Probablemente ya existe el proyecto Firebase de Paw Friend (usamos Firebase Analytics). Si no:

1. Ir a https://console.firebase.google.com.
2. **Add project** → nombre "Paw Friend" → Country Chile → enable Analytics.

### 2.2. Agregar Android app

1. Firebase Console → Project Settings (⚙️) → **Your apps** → Add app → **Android**.
2. Package name: **`cl.pawfriend.app`** (mismo que `capacitor.config.ts`).
3. App nickname: Paw Friend Android.
4. SHA-1: obtenerlo con:
   ```bash
   keytool -list -v -keystore android/pawfriend-release-key.keystore -alias pawfriend
   ```
   Copiar el SHA-1.
5. Download `google-services.json`.
6. Mover a `android/app/google-services.json` (sobrescribe el existente si hay).

### 2.3. Habilitar FCM en Firebase

1. Firebase Console → **Cloud Messaging** tab (sidebar).
2. Verificar que **Firebase Cloud Messaging API (V1)** esté enabled.
3. También habilitar **Legacy Cloud Messaging API** temporalmente (la edge fn lo usa por simplicidad).

### 2.4. Obtener FCM Server Key

1. Firebase Console → Project Settings → **Cloud Messaging** tab.
2. Buscar **Cloud Messaging API (Legacy)** → **Server key**.
3. Copiar (es una string larga estilo `AAAA...`).

### 2.5. Guardar en Supabase

Supabase Dashboard → Project Settings → Edge Functions → Secrets. Agregar:

```
FCM_SERVER_KEY=AAAA...
```

### 2.6. Deploy edge fn

```bash
supabase functions deploy send-push-notification
```

### 2.7. Build Android con google-services.json actualizado

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

### 2.8. Test

1. Instalar el APK en tu teléfono Android real (TestFlight equivalente: Google Play Internal Testing).
2. Login con tu cuenta.
3. Aceptar permiso de notificaciones.
4. Verificar en Supabase → Table Editor → `device_tokens` que apareció tu token.
5. Ejecutar test manual:
   ```bash
   curl -X POST \
     https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification \
     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
     -H "Content-Type: application/json" \
     -d '{
       "user_ids": ["<tu user_id>"],
       "title": "Test Paw Friend",
       "body": "Hola! Push funcional.",
       "data": { "route": "/home" }
     }'
   ```
6. Debería llegarte el push en 1-5 segundos.

---

## 3. iOS — APNs (opcional, ~45 min)

**Recomendación**: usar FCM también para iOS (más simple). Firebase iOS SDK traduce automáticamente los tokens APNs a tokens FCM y el envío desde el backend es igual.

### 3.1. Habilitar FCM iOS

1. Firebase Console → Add app → **iOS**.
2. Bundle ID: `cl.pawfriend.app`.
3. Download `GoogleService-Info.plist`.
4. Reemplazar `ios/App/App/GoogleService-Info.plist` (ya existe uno, sobrescribir).

### 3.2. Configurar APNs Key en Firebase

Firebase requiere una APNs Auth Key (P8) para enviar push a iOS.

1. Ir a https://developer.apple.com/account/resources/authkeys/list.
2. **+** → Name: "Paw Friend APNs" → check **Apple Push Notifications service (APNs)**.
3. Download el archivo `.p8`. **Guardarlo** (no se puede re-descargar).
4. Anotar el **Key ID** (ej: `ABCDE12345`).
5. Anotar tu **Team ID** (en Apple Developer → Membership).

### 3.3. Subir a Firebase

1. Firebase Console → Project Settings → **Cloud Messaging** → **Apple app configuration**.
2. **Upload** → subir el `.p8`.
3. Ingresar Key ID + Team ID.

### 3.4. Capabilities en Xcode

1. `npx cap open ios`.
2. Target App → Signing & Capabilities → verificar:
   - **Push Notifications** ✅.
   - **Background Modes** → activar **Remote notifications**.
3. Re-Archive + upload a TestFlight.

### 3.5. Test iOS

Igual que Android: instalar TestFlight build, login, aceptar permisos, verificar device_tokens, ejecutar curl.

---

## 4. Casos de uso — cuándo dispararía push

Hoy la edge fn `send-push-notification` está deployable pero no hay ningún caller. Candidatos:

| Evento | Trigger | Push body |
|---|---|---|
| Recordatorio de vacuna 24h antes | `reminder-cron` | "Mañana toca {{vaccine}} para {{pet}}" |
| Nueva ficha compartida recibida (vet) | trigger SQL post-INSERT share token | "{{owner}} te compartió la ficha de {{pet}}" |
| Booking confirmada | trigger SQL | "Tu cita con {{vet}} está confirmada para {{date}}" |
| Booking cancelada | trigger SQL | "El vet canceló tu cita de {{date}}. Reagenda." |
| Review solicitado | trigger SQL | "¿Cómo fue tu consulta con {{vet}}? Deja tu reseña." |

Implementar gradualmente. Empezar por recordatorios de vacuna (alto valor, bajo riesgo de spam).

---

## 5. Testing manual

### Desde curl

```bash
curl -X POST \
  https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["00000000-0000-0000-0000-000000000001"],
    "title": "Recordatorio Paw Friend",
    "body": "Mañana toca vacuna antirrábica de Kai",
    "data": { "route": "/reminders", "pet_id": "abc-123" }
  }'
```

### Response esperada

```json
{
  "ok": 1,
  "failed": 0,
  "breakdown": {
    "android": { "ok": 1, "failed": 0 },
    "ios": { "ok": 0, "failed": 0 }
  },
  "total_tokens": 1
}
```

---

## 6. Monitoreo

### Device tokens activos

```sql
SELECT platform, COUNT(*) AS tokens
FROM public.device_tokens
WHERE enabled = true AND last_seen_at > NOW() - INTERVAL '30 days'
GROUP BY platform;
```

### Tokens zombie (no vistos hace mucho)

```sql
SELECT platform, COUNT(*)
FROM public.device_tokens
WHERE last_seen_at < NOW() - INTERVAL '90 days';
```

Limpiar periódicamente:

```sql
UPDATE public.device_tokens SET enabled = false
WHERE last_seen_at < NOW() - INTERVAL '180 days';
```

---

## 7. Si FCM devuelve tokens inválidos

Cuando un token ya no es válido (user desinstaló, cambió de celular), FCM retorna `InvalidRegistration` o `NotRegistered`. El edge fn actual no los propaga — para futuro:

1. Parsear el response de FCM (campo `results[]`).
2. Si un token falla con esos códigos, `UPDATE device_tokens SET enabled=false WHERE token=<ese>`.

Por ahora: el limpiado manual con `last_seen_at` cubre el 95% del caso.

---

## 8. Checklist final

- [ ] Android: `google-services.json` actualizado en `android/app/`.
- [ ] Android: FCM Server Key en Supabase secrets.
- [ ] Edge fn `send-push-notification` deployada.
- [ ] Build Android en Play Store Internal Testing.
- [ ] Token aparece en `device_tokens` al login + permiso.
- [ ] Test manual curl → push llega.
- [ ] (Opcional iOS) `GoogleService-Info.plist` actualizado.
- [ ] (Opcional iOS) APNs P8 subida a Firebase.
- [ ] (Opcional iOS) TestFlight build con Background Modes.
- [ ] Primer trigger real conectado (ej: recordatorio de vacuna 24h antes).

---

## 9. Costo esperado

- Firebase Cloud Messaging: **gratis ilimitado**.
- APNs: gratis (incluido en Apple Developer $99/año).
- Supabase edge fn invocations: dentro del plan Pro (2M/mes incluidas).

**Costo marginal de push: $0** hasta escala muy grande. Es uno de los pocos canales de retención que escala gratis.

---

## 10. Cuando ejecutar

Pedro: en el Sprint 4 del plan 90d (día 43-56). Orden sugerido:

1. **Día 43**: setup FCM Android + deploy edge fn.
2. **Día 45**: primer caller real (recordatorios vacuna 24h antes desde `reminder-cron`).
3. **Día 50**: setup iOS si TestFlight iOS ya está aprobada.
4. **Día 56**: reporte retention 7d desde activación de push (esperado +15%).
