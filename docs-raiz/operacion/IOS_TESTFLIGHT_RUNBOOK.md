# iOS TestFlight + App Store — Runbook ejecutable

> Origen: INIT-10 del [Plan de Éxito 90 días](../planes/PLAN_EXITO_90D_20260420.md).
> Estado Apple Developer: ✅ **activa** (2026-04-21, $100 anual).
> Target: App en TestFlight antes del día 14 + submit App Store día 35 + aprobada día 55.

---

## Prerrequisitos confirmados

- ✅ Apple Developer Program activo.
- ✅ Mac con Xcode 15+ (requisito para build iOS).
- ✅ `ios/App/App/GoogleService-Info.plist` ya commiteado.
- ✅ `capacitor.config.ts`: `appId = cl.pawfriend.app`, `appName = Paw Friend`.
- ✅ Splash screen config + `backgroundColor: '#8B5CF6'`.
- ✅ `android/` y `ios/` folders generados.

---

## Parte 1 — TestFlight interno (2-3 horas tu tiempo)

Ejecuta en orden. Cada bloque termina en un check ejecutable.

### 1.1. Setup en App Store Connect (15 min)

1. Entra a https://appstoreconnect.apple.com con tu Apple ID.
2. Acepta el Program License Agreement si aparece uno nuevo (banner amarillo).
3. **My Apps → "+" → New App**:
   - Platforms: **iOS**.
   - Name: `Paw Friend`
   - Primary Language: **Spanish (Chile)**
   - Bundle ID: **cl.pawfriend.app** (debe aparecer tras unos minutos de propagación desde Developer → Identifiers; si no, ir a https://developer.apple.com/account/resources/identifiers/list y crearlo con el Bundle ID exacto + capabilities: Push Notifications, Sign in with Apple, Associated Domains).
   - SKU: `pawfriend-ios`
   - User Access: Full Access.
4. **Check**: ves la app creada en el dashboard con estado "Prepare for Submission".

### 1.2. Capabilities + Signing en Xcode (20 min)

```bash
# En tu Mac, desde raíz del repo
npm run build
npx cap sync ios
npx cap open ios
```

En Xcode (se abre `ios/App/App.xcworkspace`):

1. Click en el proyecto **App** (root) → target **App**.
2. Tab **Signing & Capabilities**:
   - Automatically manage signing: ✅
   - Team: selecciona tu Apple Developer Team.
   - Bundle Identifier: `cl.pawfriend.app`.
   - Click **+ Capability** y agregar si no están:
     - **Push Notifications**.
     - **Sign in with Apple**.
     - **Associated Domains** → agregar: `applinks:pawfriend.cl`.
3. Tab **General**:
   - Display Name: `Paw Friend`.
   - Version: `1.0.0` (o subir si ya había).
   - Build: `1` (Xcode lo auto-incrementa cada Archive).
   - Deployment Info → iOS Target: `14.0` o superior.
   - Device Orientation: iPhone solo Portrait; iPad todas.
4. **Check**: Xcode no muestra errores rojos en Signing & Capabilities.

### 1.3. Info.plist (10 min)

Abre `ios/App/App/Info.plist` en Xcode o editor.

Verifica que estén estas keys (agrega si faltan):

| Key | Valor |
|---|---|
| `NSCameraUsageDescription` | "Paw Friend usa la cámara para que puedas tomar foto de la mascota, documentos médicos y código QR." |
| `NSPhotoLibraryUsageDescription` | "Paw Friend necesita acceso a tus fotos para subir la imagen de tu mascota." |
| `NSPhotoLibraryAddUsageDescription` | "Paw Friend guarda el PDF de la ficha clínica en tu galería cuando lo descargas." |
| `NSLocationWhenInUseUsageDescription` | "Paw Friend usa tu ubicación para mostrar veterinarios cercanos a ti." |
| `NSUserTrackingUsageDescription` | "Paw Friend usa datos para mejorar recomendaciones de salud y proveedores cercanos. Nunca vendemos tu información." |
| `NSContactsUsageDescription` (opcional) | "Puedes invitar a tu veterinario desde tu agenda." |

Si ya existen con copy distinto, no reescribirlo — solo asegurar que estén.

**Check**: Xcode > Product > Scheme > Edit Scheme > Run > sin errores.

### 1.4. App Icon (10 min)

En Xcode, `App/App/Assets.xcassets/AppIcon.appiconset`:

- iOS necesita **todos los tamaños**. Si el appiconset está vacío o incompleto:

```bash
# Desde raíz del repo, en tu Mac
npm run assets:generate
# (usa capacitor-assets contra public/paw-friend-assets-v2/icons/)
```

Si `npm run assets:generate` falla, generar manualmente desde https://www.appicon.co/ subiendo el logo 1024x1024 (en `public/paw-friend-assets-v2/logo/paw_friend_logo_main_1024.png` o similar).

**Check**: Xcode > AppIcon muestra todos los slots con imagen.

### 1.5. Build Archive (10 min)

1. En Xcode: **Device selector** (arriba) → **Any iOS Device (arm64)**.
2. **Product → Archive** (Cmd+B + Cmd+Shift+B si hace falta Clean primero).
3. Espera 2-5 min. Si falla por "No provisioning profile found":
   - Volver a Signing & Capabilities y toggle Automatically manage signing.
   - O en Apple Developer portal, crear provisioning profile iOS App Development explícito.
4. Cuando termina, se abre **Organizer**.
5. Seleccionar el archive recién creado.
6. Click **Distribute App** → **App Store Connect** → **Upload** → **Next** (dejar defaults: Include symbols, Manage signing automatically).
7. Espera 5-15 min. Al final: "Upload successful".

**Check**: en App Store Connect → TestFlight tab, ves el build con estado "Processing" (tarda 15-60 min en pasar a "Ready to Test").

### 1.6. TestFlight interno (5 min)

Cuando el build está "Ready to Test":

1. App Store Connect → tu app → tab **TestFlight**.
2. Click en el build → fila "Export Compliance" → **Encryption**: responder que NO usas criptografía no-exempt (HTTPS/TLS estándar sí es exempt).
3. Ve a **Internal Testing** (sidebar izquierdo).
4. Click **+ Internal Testing Group** → Name: "Paw Friend Team".
5. Add Build → seleccionar el que acabas de subir.
6. Add Testers → agregar 3 emails:
   - Tu email principal.
   - Pedro (tú, si acaso con otro).
   - 1 amigo/familia como sanity check.
7. Los testers reciben email de TestFlight → instalan app "TestFlight" de App Store → aceptan invite → pueden descargar el build.

**Check**: tú puedes instalar Paw Friend en tu iPhone vía TestFlight. Login con Google/Apple/email funciona. Vienes al home.

---

## Parte 2 — Preparación submit App Store (día 14-35)

### 2.1. Metadata App Store Connect

Usa plantillas de [APP_STORE_METADATA.md](./APP_STORE_METADATA.md) — copia y pega en cada campo.

### 2.2. Screenshots (requerimiento Apple)

Necesitas mínimo 3 screenshots por cada tamaño requerido:

- **iPhone 6.7"** (iPhone 15 Pro Max, 1290×2796): REQUERIDO.
- **iPhone 6.5"** (iPhone 11 Pro Max, 1242×2688): REQUERIDO.
- **iPhone 5.5"** (iPhone 8 Plus, 1242×2208): REQUERIDO si quieres cubrir dispositivos viejos.
- **iPad 12.9"** (Pro 3rd gen+, 2048×2732): opcional pero recomendado.

**Método rápido**: usar Xcode Simulator.

```bash
# En Xcode: Product → Destination → iPhone 15 Pro Max
# Correr la app: Cmd+R
# En simulator: Cmd+S captura screenshot a ~/Desktop
```

Escenas recomendadas (6 screenshots):
1. **Home** con mascota Kai + score holo + North Star de recordatorios.
2. **Ficha clínica** con timeline + botón PDF grande.
3. **Directorio veterinarios** con filtro de comuna.
4. **Compartir ficha** con QR + link WhatsApp.
5. **Agenda / Calendario** con eventos.
6. **Perfil proveedor público** (preview "vet view").

Guías de copy para screenshots (overlay):
- "Ficha clínica profesional en 1 tap"
- "Comparte con tu vet sin WhatsApp eternos"
- "Directorio SEO con 52 comunas"
- "Todos los servicios para tu mascota"

### 2.3. App Preview Video (opcional pero sube conversión ~15%)

Ver [public/paw-friend-assets-v2/storyboards/IOS-03_app_preview_video.md](../../public/paw-friend-assets-v2/storyboards/IOS-03_app_preview_video.md) para guion. Máximo 30 seg.

Exportar a 1920×1080 H.264 y subir en App Store Connect → App Previews.

### 2.4. Privacy Policy + Support

- Privacy Policy URL: `https://pawfriend.cl/privacy` (ya vive).
- Support URL: `https://pawfriend.cl`.
- Marketing URL: `https://pawfriend.cl` (opcional).

### 2.5. App Privacy (Nutrition Label)

Copia-pega desde [docs-raiz/stores/STORE_PRIVACY_LABELS.md](../stores/STORE_PRIVACY_LABELS.md). Categorías a declarar:

- **Contact Info**: Email (linked to user), Phone (optional).
- **Health & Fitness**: datos médicos mascota (linked to user).
- **Identifiers**: User ID (linked).
- **Usage Data**: Product Interaction (PostHog events).
- **Diagnostics**: Crash Data (Sentry).

Todo con propósito "App Functionality" + "Analytics".

### 2.6. Age Rating

- 4+.
- Cuestionario: sin violencia, sin contenido sexual, sin profanidad, sin gambling.

### 2.7. Pricing y Availability

- Pricing: **Free**.
- Availability: **Chile** inicialmente. Después agregar AR, MX, CO, PE cuando haya tracción.

---

## Parte 3 — Submit for Review (día 35)

1. App Store Connect → Paw Friend → tab **App Store** (no TestFlight).
2. Click **1.0 Prepare for Submission**.
3. Completar todos los campos (la plantilla metadata te dice qué va dónde).
4. Adjuntar build desde TestFlight (ya procesado).
5. Submit for Review.
6. Estado cambia a "Waiting for Review" → "In Review" → "Pending Developer Release" o "Ready for Sale".

Tiempo típico review: 1-3 días.

### Si Apple rechaza

Causas comunes con Paw Friend:
- **Demasiados permisos sin justificar**: revisar Info.plist y eliminar lo que no se usa activamente.
- **Login con Apple requerido si hay Google/Facebook**: **YA agregamos Sign in with Apple**, confirmar que funciona en el build.
- **Features no disponibles en review**: si algún feature está detrás de flag OFF (Chat, Feed, Donations recurrentes), Apple puede marcarlo como "incompleto". Respuesta: explicar en el review notes que son features en roadmap + flagged.
- **Cuentas test**: dar a Apple user/password test para que pueda probar login sin crear cuenta (se configura en App Review Information → Demo account).

Dar demo account: crea `apple-review@pawfriend.cl` con pass `ReviewDemo2026!` y agregar credenciales en App Review Information.

---

## Post-launch

- [ ] Responder review que deje Apple (si aprueban, igual dejan feedback).
- [ ] Monitorear crashes en Sentry primeras 48h.
- [ ] Compartir link App Store en redes + email onboarding.
- [ ] Actualizar [docs-raiz/operacion/BITACORA_RITUAL.md](./BITACORA_RITUAL.md) con fecha de lanzamiento.

---

## Comandos de referencia

```bash
# Build + sync
npm run build && npx cap sync ios

# Abrir Xcode
npx cap open ios

# Limpiar build cache si algo se rompe
rm -rf ios/App/Pods ios/App/Podfile.lock
cd ios/App && pod install
cd ../..

# Regenerar assets
npm run assets:generate
```

---

## Fechas objetivo (Plan 90d INIT-10)

| Hito | Día | Fecha aproximada |
|---|---|---|
| Apple Dev comprada | 1 | ✅ 2026-04-21 |
| Build TestFlight interno | 14 | 2026-05-04 |
| 3 testers activos | 21 | 2026-05-11 |
| Submit App Store | 35 | 2026-05-25 |
| App aprobada | 55 | 2026-06-14 |
| Screenshots + video | 45 | 2026-06-04 |

Si se atrasa >10 días respecto a estas fechas, registrar en bitácora + replantear.
