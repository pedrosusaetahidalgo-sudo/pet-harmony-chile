# Tareas Manuales — Paw Friend Store Launch

> Lista EXHAUSTIVA de todo lo que NO se puede automatizar y debes hacer tu.
> Ordenado por prioridad de ejecucion (hacer de arriba hacia abajo).

---

## BLOQUE 1: Cuentas de desarrollador (bloqueante)

### 1.1 Cuenta de Google Play Console
- **Que**: Crear cuenta de desarrollador en Google Play
- **Link**: https://play.google.com/console/signup
- **Costo**: USD 25 (pago unico)
- **Tiempo**: 15 min (puede tardar 24-48h en verificar identidad)
- **Bloqueante**: SI — sin esto no puedes subir la app
- **Notas**: Usa tu cuenta de Google personal o la de la empresa. Necesitas foto de cedula/pasaporte.

### 1.2 Cuenta de Apple Developer
- **Que**: Inscribirse en el Apple Developer Program
- **Link**: https://developer.apple.com/programs/enroll/
- **Costo**: USD 99/ano
- **Tiempo**: 15 min para aplicar, 24-48h para aprobacion (hasta 2 semanas si piden D-U-N-S)
- **Bloqueante**: SI — sin esto no puedes subir a App Store ni usar Sign in with Apple
- **Notas**: Si te inscribes como organizacion necesitas un D-U-N-S Number. Como individual es mas rapido.

---

## BLOQUE 2: Configuracion Google (bloqueante)

### 2.1 Proyecto en Google Cloud Console
- **Que**: Crear proyecto (o usar existente) y habilitar Google Sign-In OAuth
- **Link**: https://console.cloud.google.com/
- **Pasos**:
  1. Crear proyecto "Paw Friend" (si no existe)
  2. APIs & Services > OAuth consent screen > External > Completar info
  3. APIs & Services > Credentials > Create OAuth Client ID
  4. Crear 3 Client IDs:
     - **Web application**: redirect URI = `https://gwailbjlvevkhwcrovfd.supabase.co/auth/v1/callback`
     - **Android**: package name = `cl.pawfriend.app`, SHA-1 = (del keystore, ver paso 5.1)
     - **iOS**: Bundle ID = `cl.pawfriend.app`
  5. Copiar el **Web Client ID** y reemplazar `__REEMPLAZAR_GOOGLE_WEB_CLIENT_ID__` en:
     - `capacitor.config.ts` (serverClientId)
     - `android/app/src/main/res/values/strings.xml` (server_client_id)
     - `.env` (VITE_GOOGLE_CLIENT_ID_WEB)
- **Tiempo**: 30 min
- **Bloqueante**: SI — Google Sign-In no funciona sin esto

### 2.2 Verificacion de la pantalla OAuth de Google
- **Que**: Enviar la app a revision para eliminar el warning "App no verificada"
- **Link**: Google Cloud Console > OAuth consent screen > Publish
- **Tiempo**: 5 min para enviar, 1-6 semanas para aprobacion
- **Bloqueante**: NO (funciona con warning mientras tanto)
- **Notas**: Necesitas dominio verificado (pawfriend.cl), privacy policy, y TOS visibles

### 2.3 Proyecto Firebase
- **Que**: Crear proyecto Firebase para Analytics
- **Link**: https://console.firebase.google.com/
- **Pasos**:
  1. "Add project" > seleccionar el proyecto de Google Cloud existente (paso 2.1)
  2. Habilitar Google Analytics
  3. Registrar app Android: package `cl.pawfriend.app` > descargar `google-services.json` > colocar en `android/app/`
  4. Registrar app iOS: bundle ID `cl.pawfriend.app` > descargar `GoogleService-Info.plist` > colocar en `ios/App/App/`
  5. Registrar app Web > copiar el config y llenar las variables `VITE_FIREBASE_*` en `.env`
- **Tiempo**: 20 min
- **Bloqueante**: NO para auth, SI para analytics en mobile

---

## BLOQUE 3: Configuracion Meta / Facebook (bloqueante para Facebook Login)

### 3.1 App en Meta for Developers
- **Que**: Crear app y configurar Facebook Login
- **Link**: https://developers.facebook.com/apps/create/
- **Pasos**:
  1. Crear app tipo "Consumer" o "Business"
  2. Settings > Basic: copiar **App ID** y **Client Token**
  3. Reemplazar `__REEMPLAZAR_FACEBOOK_APP_ID__` en:
     - `android/app/src/main/res/values/strings.xml`
     - `ios/App/App/Info.plist` (FacebookAppID + fb scheme)
     - `.env` (VITE_FACEBOOK_APP_ID)
  4. Reemplazar `__REEMPLAZAR_FACEBOOK_CLIENT_TOKEN__` en:
     - `android/app/src/main/res/values/strings.xml`
     - `ios/App/App/Info.plist`
     - `.env` (VITE_FACEBOOK_CLIENT_TOKEN)
  5. Facebook Login > Settings:
     - Valid OAuth Redirect URIs: `https://gwailbjlvevkhwcrovfd.supabase.co/auth/v1/callback`
     - Client OAuth Login: ON
     - Web OAuth Login: ON
  6. Facebook Login > Quickstart > Android:
     - Package Name: `cl.pawfriend.app`
     - Key Hashes: generar con `keytool -exportcert -alias pawfriend -keystore pawfriend-release-key.keystore | openssl dgst -sha256 -binary | openssl base64`
  7. Facebook Login > Quickstart > iOS:
     - Bundle ID: `cl.pawfriend.app`
- **Tiempo**: 30 min
- **Bloqueante**: SI para Facebook Login

### 3.2 Meta Pixel
- **Que**: Crear un Pixel de Meta para tracking web
- **Link**: https://business.facebook.com/events_manager/
- **Pasos**:
  1. Events Manager > Connect Data Sources > Web > Meta Pixel
  2. Copiar el Pixel ID
  3. Pegar en `.env` como `VITE_META_PIXEL_ID`
- **Tiempo**: 10 min
- **Bloqueante**: NO (solo para tracking web)

---

## BLOQUE 4: Configuracion Apple (bloqueante para App Store)

### 4.1 Sign in with Apple
- **Que**: Configurar Service ID para Sign in with Apple
- **Link**: https://developer.apple.com/account/resources/identifiers/list
- **Pasos**:
  1. Certificates, Identifiers & Profiles > Identifiers
  2. Registrar App ID: `cl.pawfriend.app` con capability "Sign in with Apple"
  3. Crear Service ID para web: asociar dominio `pawfriend.cl` y redirect `https://gwailbjlvevkhwcrovfd.supabase.co/auth/v1/callback`
  4. Crear Key para Apple Sign-In (para Supabase)
- **Tiempo**: 20 min
- **Bloqueante**: SI — Apple RECHAZA apps que tienen Google/Facebook login sin Apple login

---

## BLOQUE 5: Supabase Auth Providers

### 5.1 Habilitar providers en Supabase Dashboard
- **Que**: Configurar Google, Facebook y Apple como auth providers
- **Link**: https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/auth/providers
- **Pasos**:
  1. **Google**: Enabled = ON, Client ID = Web Client ID (paso 2.1), Client Secret = del mismo lugar
  2. **Facebook**: Enabled = ON, App ID = (paso 3.1), App Secret = (paso 3.1)
  3. **Apple**: Enabled = ON, Service ID, Key ID, Team ID, Private Key (paso 4.1)
- **Tiempo**: 15 min
- **Bloqueante**: SI — los botones de login social no funcionan sin esto

---

## BLOQUE 6: Signing y Build (bloqueante para subir a stores)

### 6.1 Generar Keystore de Android
- **Que**: Crear keystore para firmar la app de Android
- **Comando**:
  ```
  keytool -genkey -v -keystore pawfriend-release-key.keystore -alias pawfriend -keyalg RSA -keysize 2048 -validity 10000
  ```
- **Luego**: Copiar el keystore a `android/` (NO commitear), llenar `android/keystore.properties`
- **Tiempo**: 5 min
- **Bloqueante**: SI

### 6.2 Obtener SHA-1 del keystore
- **Que**: Necesario para Google Sign-In y Facebook Login en Android
- **Comando**:
  ```
  keytool -list -v -keystore pawfriend-release-key.keystore -alias pawfriend
  ```
- **Usar SHA-1 en**: Google Cloud Console (Android Client ID) y Meta for Developers (Key Hashes)
- **Tiempo**: 2 min
- **Bloqueante**: SI para auth nativo en Android

### 6.3 Deep Links — assetlinks.json y apple-app-site-association
- **Que**: Archivos de verificacion de dominio para App Links (Android) y Universal Links (iOS)
- **Donde**: Subir a `https://pawfriend.cl/.well-known/`
- **Pasos**:
  1. Crear `docs/.well-known/assetlinks.json`:
     ```json
     [{
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "cl.pawfriend.app",
         "sha256_cert_fingerprints": ["__SHA256_DEL_KEYSTORE__"]
       }
     }]
     ```
  2. Crear `docs/.well-known/apple-app-site-association`:
     ```json
     {
       "applinks": {
         "apps": [],
         "details": [{
           "appID": "__TEAM_ID__.cl.pawfriend.app",
           "paths": ["*"]
         }]
       },
       "webcredentials": {
         "apps": ["__TEAM_ID__.cl.pawfriend.app"]
       }
     }
     ```
- **Tiempo**: 15 min
- **Bloqueante**: NO para launch, SI para deep links

---

## BLOQUE 7: Assets de Store (bloqueante para publicacion)

### 7.1 Icono de la app
- **Que**: Generar iconos en todos los tamanos
- **Herramienta**: `npx capacitor-assets generate` (ya configurado en `package.json`)
- **Necesitas**: PNG de 1024x1024 en `assets/icon.png`
- **Tiempo**: 10 min
- **Bloqueante**: SI

### 7.2 Screenshots para stores
- **Que**: Capturas de pantalla de la app en funcionamiento
- **Tamanos requeridos**:
  - **Play Store**: Celular (1080x1920), Tablet 7" (1200x1920), Tablet 10" (1600x2560)
  - **App Store**: iPhone 6.7" (1290x2796), iPhone 6.5" (1242x2688), iPad 12.9" (2048x2732)
- **Minimo**: 2 screenshots por dispositivo, maximo 8
- **Tiempo**: 1-2 horas (con herramienta como Figma/Canva)
- **Bloqueante**: SI

### 7.3 Feature Graphic de Play Store
- **Que**: Imagen de cabecera de 1024x500 px
- **Tiempo**: 15 min
- **Bloqueante**: SI para Play Store

---

## BLOQUE 8: Contenido de Store (bloqueante)

### 8.1 Descripcion de la app
- **Que**: Redactar titulo, descripcion corta (80 chars) y larga (4000 chars) en espanol
- **Sugerencia descripcion corta**: "Gestiona la salud de tu mascota con veterinarios verificados"
- **Tiempo**: 30 min
- **Bloqueante**: SI

### 8.2 Categoria y rating de contenido
- **Play Store**: Categoria = "Medical" o "Health & Fitness", Content Rating = rellenar cuestionario IARC
- **App Store**: Categoria = "Medical" o "Lifestyle", Age Rating = 4+
- **Tiempo**: 15 min
- **Bloqueante**: SI

### 8.3 Data Safety (Play Store)
- **Que**: Completar formulario de Data Safety declarando que datos recolecta la app
- **Link**: Google Play Console > App content > Data safety
- **Referencia**: Ver `STORE_DATA_SAFETY.md` para las respuestas exactas
- **Tiempo**: 20 min
- **Bloqueante**: SI

### 8.4 Privacy Labels (App Store)
- **Que**: Completar las etiquetas de privacidad de Apple
- **Link**: App Store Connect > App Privacy
- **Referencia**: Ver `STORE_PRIVACY_LABELS.md` para las respuestas exactas
- **Tiempo**: 20 min
- **Bloqueante**: SI

---

## BLOQUE 9: Subir a Stores

### 9.1 Subir a Google Play Console
- **Link**: https://play.google.com/console/
- **Pasos**:
  1. Crear app > nombre "Paw Friend" > categoria > declaraciones
  2. Production > Create new release > subir AAB (de `scripts/build-android-release.ps1`)
  3. Completar: listado de store, Data Safety, content rating, pricing (gratis), paises (Chile)
  4. Enviar a revision
- **Tiempo**: 1 hora
- **Revision**: 1-7 dias (primera vez puede tardar mas)

### 9.2 Subir a App Store Connect
- **Link**: https://appstoreconnect.apple.com/
- **Pasos**:
  1. Crear app > bundle ID `cl.pawfriend.app` > nombre "Paw Friend"
  2. Build via Xcode (Product > Archive > Distribute > App Store Connect)
  3. Completar: descripcion, screenshots, privacy labels, age rating, pricing (gratis), paises
  4. Enviar a revision
- **Tiempo**: 1-2 horas
- **Revision**: 1-3 dias (primera vez puede tardar una semana)
- **Requisito previo**: macOS con Xcode

### 9.3 TestFlight (recomendado antes de produccion)
- **Que**: Distribuir version beta a testers antes de publicar
- **Link**: App Store Connect > TestFlight
- **Pasos**: Subir build, invitar testers (email), ellos instalan la app TestFlight
- **Tiempo**: 15 min + tiempo de testing
- **Bloqueante**: NO (recomendado pero no obligatorio)

---

## Resumen de tiempos estimados

| Bloque | Tiempo estimado |
|---|---|
| 1. Cuentas de desarrollador | 30 min + espera verificacion |
| 2. Config Google | 50 min |
| 3. Config Meta | 40 min |
| 4. Config Apple | 20 min |
| 5. Supabase providers | 15 min |
| 6. Signing y build | 25 min |
| 7. Assets de store | 1.5-2.5 horas |
| 8. Contenido de store | 1-1.5 horas |
| 9. Subir a stores | 2-3 horas |
| **TOTAL** | **~6-9 horas de trabajo manual** |

> **Nota**: Los bloques 1-5 se pueden hacer en un dia. Los bloques 7-9 requieren tener todo lo anterior listo. El bloque que mas tiempo consume son los assets (screenshots, iconos, feature graphic).
