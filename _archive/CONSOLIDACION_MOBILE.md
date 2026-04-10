# Consolidacion Mobile Paw Friend — iOS & Android

> Prompt para Claude Code. Ejecutar en sesion limpia.
> Objetivo: dejar la app 100% funcional en iOS y Android via Capacitor 7.
> Basado en auditoria mobile del 2026-04-10.

---

## Contexto

Paw Friend es una app React + Vite + Capacitor 7. El build web funciona perfecto (`npx tsc -b` = 0 errores, `npm run build` = OK). El objetivo es que el mismo codigo funcione nativamente en Android e iOS sin romper la web.

**Estado actual:**
- Android: directorio `android/` existe, compilable
- iOS: `@capacitor/ios` esta en package.json pero **no existe directorio `ios/`**
- Plugins nativos instalados: solo `@codetrix-studio/capacitor-google-auth`
- OAuth Google: forzado a web flow (`FORCE_WEB_OAUTH = true` en `useGoogleAuth.tsx:51`)
- Descargas/PDF: usan `window.open()` que no funciona en nativo
- Links externos: usan `target="_blank"` que sale de la app en nativo

---

## Instrucciones generales

- **NO tocar** la ficha medica PDF ni el directorio de veterinarios mas alla de lo estrictamente necesario para mobile. Son la joya de la corona.
- **NO romper** la web. Todo cambio debe funcionar en web Y nativo.
- Usar `Capacitor.isNativePlatform()` para bifurcar comportamiento cuando sea necesario.
- Copy en espanol chileno (tuteo: tu, tienes, puedes).
- Correr `npx tsc -b` y `npm run build` al final de cada fase para verificar 0 errores.

---

## Fase 1: Instalar plugins Capacitor necesarios

### 1.1 Instalar dependencias

```bash
npm install @capacitor/app @capacitor/browser @capacitor/filesystem @capacitor/share @capacitor/device @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/haptics @capacitor/clipboard @capacitor/push-notifications
npx cap sync
```

### 1.2 Crear proyecto iOS

```bash
npx cap add ios
npx cap sync ios
```

### 1.3 Verificar que `capacitor.config.ts` tenga config para ambas plataformas

El archivo actual ya tiene config de Android, SplashScreen, StatusBar, Keyboard y GoogleAuth. Agregar:

```typescript
ios: {
  contentInset: 'automatic',
  backgroundColor: '#8B5CF6',
},
plugins: {
  // ... mantener lo existente y agregar:
  PushNotifications: {
    presentationOptions: ['badge', 'sound', 'alert'],
  },
}
```

### 1.4 Verificar build post-instalacion

```bash
npx tsc -b
npm run build
npx cap sync
```

---

## Fase 2: Crear helper de plataforma

### 2.1 Crear `src/lib/platform.ts`

Crear un utility centralizado para detectar plataforma y ejecutar acciones nativas vs web:

```typescript
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isWeb = () => Capacitor.getPlatform() === 'web';
```

### 2.2 Crear `src/lib/native-navigation.ts`

Helper para abrir URLs externas correctamente en cada plataforma:

```typescript
import { Browser } from '@capacitor/browser';
import { isNative } from './platform';

export async function openExternalUrl(url: string) {
  if (isNative()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export async function openInAppUrl(url: string) {
  if (isNative()) {
    await Browser.open({ url, presentationStyle: 'popover' });
  } else {
    window.open(url, '_blank');
  }
}
```

---

## Fase 3: Arreglar descargas de archivos (CRITICO)

### 3.1 Crear `src/lib/native-download.ts`

El problema: `window.open(url, '_blank')` no descarga archivos en nativo.

```typescript
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative } from './platform';
import { toast } from 'sonner';

export async function downloadFile(url: string, fileName: string) {
  if (!isNative()) {
    window.open(url, '_blank');
    return;
  }

  try {
    toast.info('Descargando archivo...');

    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    await Share.share({
      title: fileName,
      url: savedFile.uri,
    });

    toast.success('Archivo descargado');
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('No se pudo descargar el archivo');
  }
}
```

### 3.2 Actualizar `src/components/medical/MedicalDocumentsTab.tsx`

Reemplazar todos los `window.open(url, '_blank')` de descarga por `downloadFile(url, nombreArchivo)`:

- Linea ~94: descarga individual de documento
- Linea ~135: descarga de ZIP medico

Buscar en el componente cada instancia de `window.open` y reemplazar con el helper.

### 3.3 Buscar y reemplazar otros `window.open` de descarga en todo `src/`

Ejecutar busqueda global:
```bash
grep -rn "window\.open" src/ --include="*.tsx" --include="*.ts"
```

Para cada resultado evaluar:
- Si es descarga de archivo -> usar `downloadFile()`
- Si es link externo -> usar `openExternalUrl()`
- Si es navegacion interna -> dejar como esta o usar `navigate()`

---

## Fase 4: Arreglar generacion de PDF (CRITICO)

### 4.1 Modificar `src/pages/PetClinicalRecord/pdf.ts`

El archivo actual usa `window.open("", "_blank")` + `document.write(html)` + `window.print()`. Esto no funciona en nativo.

**Solucion**: En nativo, generar el HTML y compartirlo como archivo; en web, mantener el flujo actual.

```typescript
import { isNative } from '@/lib/platform';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function generatePDF(pet: PetData, records: any[]) {
  const html = buildPDFHtml(pet, records); // extraer el HTML builder actual

  if (isNative()) {
    try {
      const fileName = `ficha_${pet.name}_${Date.now()}.html`;
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: btoa(unescape(encodeURIComponent(html))),
        directory: Directory.Cache,
      });
      await Share.share({
        title: `Ficha clinica de ${pet.name}`,
        url: saved.uri,
      });
    } catch (error) {
      toast.error('No se pudo generar la ficha');
    }
  } else {
    // Mantener flujo web actual (window.open + print)
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }
}
```

**Nota**: Idealmente en el futuro migrar a generacion PDF server-side con la Edge Function `generate-medical-summary` que ya existe. Por ahora este approach funciona.

---

## Fase 5: Arreglar OAuth en nativo (CRITICO)

### 5.1 Google Auth — habilitar flujo nativo

**Archivo**: `src/hooks/useGoogleAuth.tsx`

1. Cambiar `FORCE_WEB_OAUTH = true` a `false` (linea ~51)
2. El hook ya tiene logica para flujo nativo con `@codetrix-studio/capacitor-google-auth` — solo esta deshabilitado
3. Para que funcione en Android: configurar SHA-1 fingerprint en Google Cloud Console
4. Para que funcione en iOS: configurar el URL scheme en Xcode

**Prerequisitos (manuales, no codigo):**

Para Android:
```bash
cd android
./gradlew signingReport
# Copiar el SHA-1 del debug keystore
# Ir a Google Cloud Console > Credentials > OAuth client > agregar SHA-1
```

Para iOS:
- Agregar URL scheme `com.googleusercontent.apps.707954104528-...` en Info.plist
- Configurar `REVERSED_CLIENT_ID` en Xcode

### 5.2 Facebook Auth — arreglar redirect

**Archivo**: `src/hooks/useFacebookAuth.tsx`

La linea ~55 usa `window.location.origin` para `redirectTo`. En nativo, `window.location.origin` devuelve `capacitor://localhost` (iOS) o `http://localhost` (Android).

**Fix**: usar deep link como redirect:
```typescript
import { isNative } from '@/lib/platform';

const redirectUrl = isNative()
  ? 'cl.pawfriend.app://auth/callback'
  : `${window.location.origin}/auth`;
```

### 5.3 Configurar deep links para OAuth callbacks

**Android** (`android/app/src/main/AndroidManifest.xml`):
Ya tiene intent-filter con scheme `cl.pawfriend.app` — verificar que este activo.

**iOS** (`ios/App/App/Info.plist`):
Agregar URL scheme:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>cl.pawfriend.app</string>
    </array>
  </dict>
</array>
```

### 5.4 Registrar listener de deep links

En `src/main.tsx` o `src/App.tsx`, agregar listener para manejar callbacks OAuth:

```typescript
import { App as CapApp } from '@capacitor/app';
import { isNative } from '@/lib/platform';

if (isNative()) {
  CapApp.addListener('appUrlOpen', ({ url }) => {
    const slug = url.split('cl.pawfriend.app://').pop();
    if (slug) {
      // Navegar a la ruta correspondiente
      window.location.href = '/' + slug;
    }
  });
}
```

---

## Fase 6: Links externos con InAppBrowser

### 6.1 Buscar todos los `target="_blank"` en el proyecto

```bash
grep -rn 'target="_blank"' src/ --include="*.tsx"
```

### 6.2 Para cada instancia, evaluar y reemplazar

**Patron**: Reemplazar `<a href={url} target="_blank">` con un onClick que use `openExternalUrl()`:

```tsx
import { openExternalUrl } from '@/lib/native-navigation';

// Antes:
<a href={url} target="_blank" rel="noopener noreferrer">Ver</a>

// Despues:
<a href={url} onClick={(e) => { 
  if (isNative()) { 
    e.preventDefault(); 
    openExternalUrl(url); 
  }
}} target="_blank" rel="noopener noreferrer">Ver</a>
```

**Archivos conocidos a actualizar:**
- `src/components/admin/AdminVetVerifications.tsx` — link a colegioveterinario.cl
- `src/components/admin/AdminVerificationRequests.tsx` — links a documentos PDF
- `src/pages/TermsOfService.tsx` — links legales
- `src/pages/PrivacyPolicy.tsx` — links legales

---

## Fase 7: Manejo del teclado y scroll en formularios

### 7.1 Verificar que Keyboard plugin funcione

La config en `capacitor.config.ts` ya tiene `resize: 'body'`. Verificar que los formularios no queden ocultos bajo el teclado:

**Archivos con formularios criticos a testear:**
- `src/pages/Auth.tsx` — login/registro
- `src/pages/AddPet.tsx` — agregar mascota
- `src/pages/EditPet.tsx` — editar mascota
- `src/components/reviews/ReviewForm.tsx` — resena
- `src/components/medical/AddMedicalRecordForm.tsx` — registro medico
- `src/pages/RegistroVeterinario.tsx` — registro vet

### 7.2 Agregar scroll-into-view en inputs enfocados (si es necesario)

Si algun formulario queda oculto bajo el teclado en testing, agregar:

```typescript
import { Keyboard } from '@capacitor/keyboard';
import { isNative } from '@/lib/platform';

// En el componente del formulario:
useEffect(() => {
  if (!isNative()) return;
  
  const showListener = Keyboard.addListener('keyboardWillShow', () => {
    const focused = document.activeElement as HTMLElement;
    focused?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  return () => { showListener.then(l => l.remove()); };
}, []);
```

---

## Fase 8: StatusBar y SplashScreen nativos

### 8.1 Inicializar StatusBar en App.tsx

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNative } from '@/lib/platform';

// Dentro del componente App, en useEffect:
useEffect(() => {
  if (!isNative()) return;

  StatusBar.setBackgroundColor({ color: '#8B5CF6' });
  StatusBar.setStyle({ style: Style.Dark });
  SplashScreen.hide();
}, []);
```

### 8.2 Assets de SplashScreen y App Icon

**Android** (ya existe `android/app/src/main/res/`):
- Verificar que existan iconos en `mipmap-*` (hdpi, mdpi, xhdpi, xxhdpi, xxxhdpi)
- Verificar splash screen en `drawable/splash.png`

**iOS** (se generara con `npx cap add ios`):
- Agregar icons en `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Agregar splash en `ios/App/App/Assets.xcassets/Splash.imageset/`

**Herramienta recomendada para generar assets:**
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#8B5CF6' --splashBackgroundColor '#8B5CF6'
```

Requiere tener en la raiz:
- `assets/icon-only.png` (1024x1024, icono sin fondo)
- `assets/icon-foreground.png` (1024x1024, adaptive icon foreground)
- `assets/icon-background.png` (1024x1024, adaptive icon background)
- `assets/splash.png` (2732x2732, splash screen)
- `assets/splash-dark.png` (2732x2732, splash dark mode, opcional)

---

## Fase 9: Push Notifications (base)

### 9.1 Registrar push en App.tsx

```typescript
import { PushNotifications } from '@capacitor/push-notifications';
import { isNative } from '@/lib/platform';

async function initPushNotifications() {
  if (!isNative()) return;

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', (token) => {
    // Guardar token en Supabase: profiles.push_token
    console.log('Push registration token:', token.value);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    toast.info(notification.title || 'Nueva notificacion');
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    // Navegar segun data del push
    const route = action.notification.data?.route;
    if (route) window.location.href = route;
  });
}
```

### 9.2 Configurar Firebase (Android)

1. Crear proyecto en Firebase Console
2. Descargar `google-services.json` -> `android/app/google-services.json`
3. Verificar que `android/app/build.gradle` tenga `apply plugin: 'com.google.gms.google-services'`
4. Agregar classpath en `android/build.gradle`: `classpath 'com.google.gms:google-services:4.4.0'`

### 9.3 Configurar APNs (iOS)

1. Habilitar Push Notifications en Apple Developer Portal
2. Crear APNs key o certificado
3. Subir key a Firebase Console > Project Settings > Cloud Messaging > iOS
4. En Xcode: habilitar capability "Push Notifications"

---

## Fase 10: Manejo del boton Back nativo (Android)

### 10.1 Registrar listener de back button

```typescript
import { App as CapApp } from '@capacitor/app';
import { isNative } from '@/lib/platform';

// En App.tsx:
useEffect(() => {
  if (!isNative()) return;

  const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });

  return () => { listener.then(l => l.remove()); };
}, []);
```

---

## Fase 11: Optimizacion de bundle para mobile

### 11.1 Verificar lazy loading agresivo

Las 48 paginas ya estan lazy-loaded. Verificar que componentes pesados tambien lo esten:
- Recharts (458 kB) — ya es lazy via las paginas que lo usan
- Leaflet/react-leaflet — verificar que `Maps.tsx` sea lazy (deberia estar)

### 11.2 Preload de rutas criticas

Las rutas mas usadas en mobile deberian tener preload:

```typescript
// En App.tsx, despues de las lazy definitions:
const preloadHome = () => import('./pages/Home');
const preloadMyPets = () => import('./pages/MyPets');
const preloadMedical = () => import('./pages/MedicalRecords');

// Llamar despues del primer render:
useEffect(() => {
  requestIdleCallback(() => {
    preloadHome();
    preloadMyPets();
    preloadMedical();
  });
}, []);
```

### 11.3 Verificar tamano de imagenes

```bash
find src/assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -size +100k
```

Cualquier imagen >100kB deberia comprimirse o convertirse a WebP.

---

## Fase 12: Testing y verificacion final

### 12.1 Checklist de build

```bash
# 1. Types
npx tsc -b
# Esperado: 0 errores

# 2. Build
npm run build
# Esperado: sin errores, bundle <350kB main chunk

# 3. Sync nativo
npx cap sync
# Esperado: sin errores

# 4. Android
npx cap run android
# Testar en emulador o dispositivo

# 5. iOS (requiere macOS + Xcode)
npx cap run ios
# Testar en simulador o dispositivo
```

### 12.2 Checklist funcional en dispositivo nativo

Testear cada flujo en un dispositivo real o emulador:

| # | Flujo | Verificar |
|---|---|---|
| 1 | Login email/password | Formulario visible, teclado no oculta inputs, redirect post-login |
| 2 | Login Google | Flujo OAuth completo, retorno a la app |
| 3 | Home dashboard | Carga correcta, safe areas respetadas, bottom tab visible |
| 4 | Agregar mascota | Formulario completo, subida de foto, guardado |
| 5 | Ficha clinica | Ver ficha, generar PDF/share, descargar documentos |
| 6 | Directorio vets | Lista, filtros, perfil publico, reservar cita |
| 7 | Mapa servicios | Leaflet carga, geolocalizacion pide permiso, pins visibles |
| 8 | Chat | Enviar mensaje, recibir, scroll correcto con teclado |
| 9 | Notificaciones push | Recibir notificacion, tap navega correctamente |
| 10 | Upgrade Premium | Flujo Flow.cl abre correctamente en browser nativo |
| 11 | Back button (Android) | Navega atras, en home sale de la app |
| 12 | Orientacion | App se mantiene en portrait |
| 13 | Splash screen | Se muestra y desaparece correctamente |
| 14 | Status bar | Color correcto (#8B5CF6), texto blanco |
| 15 | Safe areas | Contenido no se oculta bajo notch/dynamic island |
| 16 | Scroll | Bounce deshabilitado, no hay over-scroll |
| 17 | Seleccion de texto | Botones no seleccionables, inputs si |
| 18 | Links externos | Abren en InAppBrowser, no salen de la app |

### 12.3 Checklist de store submission

**Android (Google Play):**
- [ ] Icono adaptativo configurado
- [ ] Splash screen con logo
- [ ] Release keystore generado y guardado de forma segura
- [ ] `android/app/build.gradle` signing config habilitado
- [ ] ProGuard/R8 habilitado para release
- [ ] Target SDK >= 34 (requerimiento Google Play 2026)
- [ ] Permisos justificados en Play Console

**iOS (App Store):**
- [ ] Bundle ID `cl.pawfriend.app` registrado en Apple Developer
- [ ] Provisioning profiles creados (development + distribution)
- [ ] App Icons en todos los tamanos requeridos
- [ ] Launch screen configurado
- [ ] Info.plist con descripciones de permisos (NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, etc.)
- [ ] Privacy manifest (requerido desde 2024)
- [ ] ATS (App Transport Security) configurado

---

## Fase 13: Scripts npm para mobile

Agregar a `package.json`:

```json
{
  "scripts": {
    "cap:sync": "npm run build && npx cap sync",
    "ios:run": "npx cap run ios",
    "ios:open": "npx cap open ios",
    "android:open": "npx cap open android",
    "android:build": "npm run build && npx cap sync android && cd android && ./gradlew assembleRelease",
    "assets:generate": "npx capacitor-assets generate --iconBackgroundColor '#8B5CF6' --splashBackgroundColor '#8B5CF6'"
  }
}
```

---

## Orden de ejecucion recomendado

| Prioridad | Fase | Descripcion | Impacto |
|---|---|---|---|
| CRITICA | 1 | Instalar plugins + crear iOS | Prerequisito de todo lo demas |
| CRITICA | 2 | Helper de plataforma | Base para bifurcaciones nativo/web |
| CRITICA | 3 | Arreglar descargas | Sin esto no funcionan documentos medicos |
| CRITICA | 4 | Arreglar PDF | Sin esto no funciona la joya de la corona |
| CRITICA | 5 | Arreglar OAuth | Sin esto no se puede hacer login nativo |
| ALTA | 6 | Links externos | UX rota sin esto |
| ALTA | 10 | Back button Android | UX basica Android |
| MEDIA | 7 | Teclado y formularios | Pulir UX |
| MEDIA | 8 | StatusBar y Splash | Apariencia nativa |
| MEDIA | 9 | Push notifications | Feature nueva |
| MEDIA | 11 | Bundle optimization | Performance |
| BAJA | 12 | Testing completo | QA |
| BAJA | 13 | Scripts npm | DX |

---

## Lo que NO se toca en este prompt

- Logica de negocio existente
- Esquema de base de datos
- Edge Functions
- Estilos/CSS (ya estan bien para mobile con safe areas)
- Rutas de la app (ya son consistentes)
- Copy (ya esta en chileno correcto)

---

*Generado para uso con Claude Code. Verificar contra el estado actual del repo antes de ejecutar.*
