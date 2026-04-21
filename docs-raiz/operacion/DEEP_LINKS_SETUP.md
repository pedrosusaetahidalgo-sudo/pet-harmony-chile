# Universal Links (iOS) + App Links (Android) — Paw Friend

> **Épica D.3** (auditoría top-tier 2026-04-20). Setup para que links
> `https://pawfriend.cl/qr/*`, `/paw-card/*`, `/medical-share/*`, etc.
> abran directo en la app si el usuario la tiene instalada (tap en
> WhatsApp / Mail / Safari / Chrome abre la app, no el browser).

## Estado actual

| Componente | Estado | Archivo |
|---|---|---|
| AASA (iOS) | ✅ archivo en repo, **falta Team ID** | `public/.well-known/apple-app-site-association` |
| Android App Links | ✅ listo con SHA-256 del keystore actual | `public/.well-known/assetlinks.json` |
| `AndroidManifest.xml` | ✅ intent-filter `https://pawfriend.cl` con `autoVerify="true"` | `android/app/src/main/AndroidManifest.xml:57-62` |
| Info.plist | ✅ comentario; falta `App.entitlements` con Associated Domains | `ios/App/App/Info.plist:112-116` |
| Deep link handler JS | ✅ `App.addListener('appUrlOpen')` en App.tsx:153 | — |

## Paths que abren la app (AASA actual)

- `/qr/*` — landing QR de mascota
- `/paw-card/*` — Paw Card coleccionable
- `/medical-share/*` — ficha compartida 30 días
- `/veterinarios/*` — directorio y perfiles públicos
- `/refugios/*` — refugios
- `/paw-member` + `/paw-member/*`
- `/donaciones`, `/transparencia`
- `/paw-companys`, `/paw-voices`, `/paw-partners`
- `/aplicar`, `/resena/*`
- **NOT** `/admin*` — admin siempre en browser.

## Pendientes de Pedro (orden)

### 1. Obtener Team ID de Apple

1. [developer.apple.com/account](https://developer.apple.com/account) → Membership.
2. Copiar el **Team ID** de 10 caracteres alfanuméricos (ej. `ABCD1234EF`).
3. Reemplazar `__TEAM_ID__` en `public/.well-known/apple-app-site-association`:
   ```bash
   # Reemplazo masivo (verifica antes de commitear)
   sed -i 's/__TEAM_ID__/ABCD1234EF/g' public/.well-known/apple-app-site-association
   ```
4. Build + deploy. El archivo debe servirse bajo `https://pawfriend.cl/.well-known/apple-app-site-association` **sin extensión** y con Content-Type `application/json`. GitHub Pages lo sirve como `text/plain` — verificar.

### 2. Crear entitlements iOS

El Info.plist no alcanza para Associated Domains: iOS requiere un archivo
`*.entitlements` que debe ser referenciado desde Xcode.

1. En Xcode: `App target → Signing & Capabilities → + Capability → Associated Domains`.
2. Agregar:
   ```
   applinks:pawfriend.cl
   webcredentials:pawfriend.cl
   ```
3. Xcode crea `ios/App/App/App.entitlements` automáticamente.
4. Commit del archivo generado.

**Alternativa sin Xcode (CLI)** — crear manualmente `ios/App/App/App.entitlements`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:pawfriend.cl</string>
        <string>webcredentials:pawfriend.cl</string>
    </array>
</dict>
</plist>
```

Luego agregarlo al proyecto en `project.pbxproj` (`CODE_SIGN_ENTITLEMENTS = App/App.entitlements;`).

### 3. Validar

**AASA (iOS)**:
- https://branch.io/resources/aasa-validator/
- Ingresar `pawfriend.cl`, verifica:
  - HTTP 200
  - Content-Type: application/json
  - JSON parseado
  - appID format correcto

**assetlinks (Android)**:
```bash
curl "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://pawfriend.cl&relation=delegate_permission/common.handle_all_urls"
```
Debe devolver el statement configurado.

O desde terminal local:
```bash
curl https://pawfriend.cl/.well-known/assetlinks.json
```

**Smoke test end-to-end**:
1. Instalar app en dispositivo real (iOS y Android).
2. En otro dispositivo (o WhatsApp desde el mismo), abrir link
   `https://pawfriend.cl/qr/<algun-token>`.
3. Debe aparecer opción "Abrir en Paw Friend" / abrir directo.
4. Si abre browser, revisar:
   - iOS: Settings → [Tu App] → Associated Domains status
   - Android: `adb shell pm get-app-links cl.pawfriend.app`

## Cuando cambias el keystore Android

Si rotás el keystore de firma (p.ej. migrás a Google Play App Signing):

1. Sacá el nuevo SHA-256:
   ```bash
   keytool -list -v -keystore pawfriend-release-key.keystore -alias pawfriend
   ```
2. Reemplazá el hash en `public/.well-known/assetlinks.json`.
3. También podés tener **múltiples** entries: uno con tu key original +
   uno con la Play upload key (Google muestra ambos en Play Console).

## Cuando cambias el bundle ID iOS

Si Bundle ID cambia de `cl.pawfriend.app` a otra cosa:

1. Actualizar `capacitor.config.ts:3` (`appId`).
2. Actualizar AASA (`__TEAM_ID__.NUEVO_BUNDLE_ID`).
3. `npx cap sync ios`.
4. Rebuild.

## Qué hace el handler en la app

Cuando iOS/Android abre la app por un universal link, Capacitor dispara
`appUrlOpen` event. Lo manejamos en `src/App.tsx:153-158`:

```ts
CapApp.addListener('appUrlOpen', ({ url }) => {
  const slug = url.split('cl.pawfriend.app://').pop();
  if (slug) {
    window.location.href = '/' + slug;
  }
});
```

⚠️ **Bug latente**: este handler solo funciona para custom scheme
`cl.pawfriend.app://`. Para Universal Links (https://pawfriend.cl/...),
Capacitor entrega la URL completa. Hay que parsear ambos casos.

**Fix pendiente** (registrado aquí como seguimiento):

```ts
CapApp.addListener('appUrlOpen', ({ url }) => {
  // Custom scheme: cl.pawfriend.app://qr/abc
  if (url.startsWith('cl.pawfriend.app://')) {
    const slug = url.split('cl.pawfriend.app://').pop();
    if (slug) window.location.href = '/' + slug;
    return;
  }
  // Universal link: https://pawfriend.cl/qr/abc
  if (url.startsWith('https://pawfriend.cl/')) {
    const path = url.replace('https://pawfriend.cl', '');
    window.location.href = path || '/';
  }
});
```

## Orden de aplicación post-setup

Una vez que Pedro completó Team ID + entitlements:

1. `git push` (para que `/public/.well-known/*` se publique en pawfriend.cl).
2. Esperar ~5 min a que GitHub Pages redeploy.
3. Validar con los links de arriba.
4. `npx cap sync ios && npx cap sync android`.
5. Rebuild + submit a stores.

Apple tarda hasta 24h en re-verificar AASA; Android ~5 min tras autoVerify.
