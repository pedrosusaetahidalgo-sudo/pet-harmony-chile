# Variables de Entorno — Paw Friend

Todas las variables necesarias para el funcionamiento completo de la app.

## Variables actuales (.env)

| Variable | Donde se consigue | Ejemplo | Requerida |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard > Settings > API | `https://gwailbjlvevkhwcrovfd.supabase.co` | SI |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard > Settings > API > anon key | `eyJhbGci...` | SI |
| `VITE_GOOGLE_CLIENT_ID_WEB` | Google Cloud Console > APIs & Services > Credentials > Web Client ID | `123456-abc.apps.googleusercontent.com` | SI (para Google Sign-In) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console > APIs & Services > Credentials | `AIzaSy...` | SI (para mapas) |

## Variables nuevas (auth social)

| Variable | Donde se consigue | Ejemplo | Requerida |
|---|---|---|---|
| `VITE_FACEBOOK_APP_ID` | Meta for Developers > App Dashboard > Settings > Basic | `1234567890123456` | SI (para Facebook Login) |
| `VITE_FACEBOOK_CLIENT_TOKEN` | Meta for Developers > App Dashboard > Settings > Advanced > Client Token | `abcdef1234567890` | SI (para Facebook Login nativo) |

## Variables nuevas (analytics)

| Variable | Donde se consigue | Ejemplo | Requerida |
|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console > Project Settings > Web App | `AIzaSyB...` | NO (analytics opcional) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console > Project Settings > Web App | `pawfriend.firebaseapp.com` | NO |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console > Project Settings > Web App | `pawfriend-12345` | NO |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console > Project Settings > Web App | `pawfriend-12345.appspot.com` | NO |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console > Project Settings > Web App | `123456789` | NO |
| `VITE_FIREBASE_APP_ID` | Firebase Console > Project Settings > Web App | `1:123456:web:abc` | NO |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Console > Project Settings > Web App | `G-XXXXXXXXXX` | NO |
| `VITE_META_PIXEL_ID` | Meta Events Manager > Pixel > Settings | `1234567890` | NO (solo tracking web) |

## Variables opcionales

| Variable | Donde se consigue | Ejemplo | Requerida |
|---|---|---|---|
| `VITE_SENTRY_DSN` | Sentry.io > Project Settings > Client Keys | `https://abc@sentry.io/123` | NO |
| `VITE_POSTHOG_KEY` | PostHog > Project Settings > API Key | `phc_abc123` | NO |
| `VITE_POSTHOG_HOST` | PostHog | `https://us.i.posthog.com` | NO |

## Variables de CI/Build (NO van en .env, van en CI secrets)

| Variable | Donde se consigue | Uso |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 pawfriend-release-key.keystore` | CI Android signing |
| `ANDROID_KEYSTORE_PASSWORD` | Tu eliges al crear el keystore | CI Android signing |
| `ANDROID_KEY_ALIAS` | `pawfriend` | CI Android signing |
| `ANDROID_KEY_PASSWORD` | Tu eliges al crear el keystore | CI Android signing |

## Archivos de configuracion (NO son env vars, van en el proyecto)

| Archivo | Donde se consigue | Ubicacion en proyecto |
|---|---|---|
| `google-services.json` | Firebase Console > Project Settings > Android app | `android/app/google-services.json` |
| `GoogleService-Info.plist` | Firebase Console > Project Settings > iOS app | `ios/App/App/GoogleService-Info.plist` |
| `keystore.properties` | Lo creas tu (ver `android/keystore.properties.example`) | `android/keystore.properties` |
| Keystore (.keystore) | Lo generas con `keytool` (ver MANUAL_TASKS.md) | `android/pawfriend-release-key.keystore` |

> **IMPORTANTE**: Ningun archivo de esta seccion debe commitearse al repo. Todos estan en `.gitignore`.
