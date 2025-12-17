# Configuración de Google Sign-In para Paw Friend

Esta guía explica cómo configurar Google Sign-In para la aplicación web y las apps móviles (Android/iOS) con Capacitor.

## Índice
1. [Requisitos previos](#requisitos-previos)
2. [Configuración en Google Cloud Console](#configuración-en-google-cloud-console)
3. [Configuración en Lovable Cloud](#configuración-en-lovable-cloud)
4. [Configuración para Android (Capacitor)](#configuración-para-android)
5. [Configuración para iOS (Capacitor)](#configuración-para-ios)
6. [Variables de entorno](#variables-de-entorno)
7. [Solución de problemas](#solución-de-problemas)

---

## Requisitos previos

- Cuenta de Google Cloud Platform
- Proyecto en Lovable Cloud (Supabase)
- Para móvil: Xcode (iOS) o Android Studio (Android)

---

## Configuración en Google Cloud Console

### 1. Crear proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID**

### 2. Habilitar APIs necesarias

1. Ve a **APIs & Services > Library**
2. Busca y habilita:
   - **Google+ API** (o People API)
   - **Google Identity Toolkit API**

### 3. Configurar pantalla de consentimiento OAuth

1. Ve a **APIs & Services > OAuth consent screen**
2. Selecciona **External** (o Internal si es para organización)
3. Completa la información:
   - **App name**: Paw Friend
   - **User support email**: tu email
   - **Developer contact information**: tu email
4. En **Scopes**, agrega:
   - `email`
   - `profile`
   - `openid`
5. En **Authorized domains**, agrega:
   - `supabase.co`
   - Tu dominio personalizado (si tienes)

### 4. Crear credenciales OAuth 2.0

#### A) Cliente Web (Obligatorio)

1. Ve a **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Selecciona **Web application**
4. Nombre: `Paw Friend Web`
5. **Authorized JavaScript origins**:
   ```
   https://tu-proyecto.lovableproject.com
   https://tu-dominio-personalizado.com (si aplica)
   http://localhost:5173 (desarrollo)
   http://localhost:8100 (Capacitor dev)
   ```
6. **Authorized redirect URIs**:
   ```
   https://oexonzohpigriynmrbdr.supabase.co/auth/v1/callback
   https://tu-proyecto.lovableproject.com/auth
   https://tu-proyecto.lovableproject.com/home
   http://localhost:5173/auth
   http://localhost:5173/home
   ```
7. Guarda el **Client ID** y **Client Secret**

#### B) Cliente Android (Para app móvil)

1. Click **Create Credentials > OAuth client ID**
2. Selecciona **Android**
3. Nombre: `Paw Friend Android`
4. **Package name**: `cl.pawfriend.app`
5. **SHA-1 certificate fingerprint**: 
   
   Para desarrollo (debug):
   ```bash
   cd android
   ./gradlew signingReport
   ```
   
   Para producción (release):
   ```bash
   keytool -list -v -keystore pawfriend-release-key.keystore -alias pawfriend
   ```
   
6. Guarda el **Client ID** (no hay secret para Android)

#### C) Cliente iOS (Para app móvil)

1. Click **Create Credentials > OAuth client ID**
2. Selecciona **iOS**
3. Nombre: `Paw Friend iOS`
4. **Bundle ID**: `cl.pawfriend.app`
5. **App Store ID**: (dejar vacío inicialmente)
6. Guarda el **Client ID** (no hay secret para iOS)

---

## Configuración en Lovable Cloud

1. Abre tu proyecto en Lovable
2. Click en el botón **View Backend** o ve a Cloud settings
3. Navega a **Users → Auth Settings → Google Settings**
4. Habilita Google como proveedor
5. Ingresa:
   - **Client ID**: El Client ID Web que creaste
   - **Client Secret**: El Client Secret Web
6. Verifica que **Site URL** esté configurado:
   - `https://tu-proyecto.lovableproject.com`
7. Verifica **Redirect URLs**:
   - `https://tu-proyecto.lovableproject.com/**`
   - `https://tu-dominio-personalizado.com/**` (si aplica)

---

## Configuración para Android

### 1. Agregar el plugin de Google Auth

Ya está instalado: `@codetrix-studio/capacitor-google-auth`

### 2. Configurar capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.pawfriend.app',
  appName: 'Paw Friend',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
```

### 3. Configurar android/app/src/main/res/values/strings.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Paw Friend</string>
    <string name="title_activity_main">Paw Friend</string>
    <string name="package_name">cl.pawfriend.app</string>
    <string name="custom_url_scheme">cl.pawfriend.app</string>
    <string name="server_client_id">TU_WEB_CLIENT_ID.apps.googleusercontent.com</string>
</resources>
```

### 4. Sincronizar y probar

```bash
npm run build
npx cap sync android
npx cap run android
```

---

## Configuración para iOS

### 1. Configurar Info.plist

Agregar en `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>cl.pawfriend.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.TU_IOS_CLIENT_ID</string>
        </array>
    </dict>
</array>
<key>GIDClientID</key>
<string>TU_IOS_CLIENT_ID.apps.googleusercontent.com</string>
<key>GIDServerClientID</key>
<string>TU_WEB_CLIENT_ID.apps.googleusercontent.com</string>
```

### 2. Sincronizar y probar

```bash
npm run build
npx cap sync ios
npx cap run ios
```

---

## Variables de entorno

Para desarrollo local, crea un archivo `.env.local`:

```env
# Google OAuth (opcional, solo si quieres usar ID token flow en web)
VITE_GOOGLE_CLIENT_ID_WEB=tu-web-client-id.apps.googleusercontent.com
```

**Nota**: El Client Secret NUNCA debe estar en el frontend. Solo se configura en Lovable Cloud/Supabase.

---

## Solución de problemas

### Error: "provider is not enabled"
- Verifica que Google esté habilitado en Lovable Cloud > Auth Settings
- Verifica que el Client ID y Secret estén correctamente configurados

### Error: "redirect_uri_mismatch"
- Verifica que la URL de redirect esté en la lista de Google Cloud Console
- La URL debe coincidir exactamente (incluyendo trailing slash)

### Error: "popup_closed_by_user"
- El usuario cerró la ventana de Google
- No es un error real, solo una cancelación

### Error en Android: "DEVELOPER_ERROR" o "12500"
- El SHA-1 fingerprint no coincide
- Verifica con `./gradlew signingReport`
- Asegúrate de usar el mismo keystore para debug y release

### Error en iOS: "Invalid bundle ID"
- El Bundle ID en Google Cloud debe coincidir exactamente con el de Xcode
- Verifica en Xcode > Target > General > Bundle Identifier

### La sesión no persiste después del login
- Verifica que `localStorage` esté disponible
- En Capacitor, asegúrate de usar el mismo `webDir` configurado

---

## Flujo de autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                      Usuario                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   Click "Continuar con Google"                              │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌─────────────────────┐       ┌─────────────────────┐
│    Web (Browser)    │       │   Native (Android/  │
│                     │       │      iOS)           │
└─────────────────────┘       └─────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────┐       ┌─────────────────────┐
│ Supabase OAuth      │       │ Google Native SDK   │
│ (redirect flow)     │       │ (ID token flow)     │
└─────────────────────┘       └─────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────┐       ┌─────────────────────┐
│ Google Sign-In      │       │ Returns ID Token    │
│ Page                │       │                     │
└─────────────────────┘       └─────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────┐       ┌─────────────────────┐
│ Redirect back with  │       │ supabase.auth       │
│ auth code           │       │ .signInWithIdToken  │
└─────────────────────┘       └─────────────────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase Session Created                    │
│              (JWT stored in localStorage)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Usuario autenticado                      │
│                   Redirect a /home                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Contacto y soporte

Si tienes problemas con la configuración, revisa:
1. Los logs de la consola del navegador
2. Los logs de Supabase en el dashboard
3. La documentación de [Supabase Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
