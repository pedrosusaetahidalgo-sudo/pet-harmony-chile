# Guia de Deploy a Stores — Paw Friend

## Prerequisitos

- Node.js 18+ instalado
- Android Studio instalado (para Android)
- Xcode 15+ en macOS (para iOS)
- Cuenta de Google Play Console (USD 25 unica vez)
- Cuenta de Apple Developer (USD 99/ano)

---

## 1. Generar Keystore de Android

```bash
# Generar keystore (GUARDAR LA CONTRASENA EN LUGAR SEGURO)
keytool -genkey -v \
  -keystore pawfriend-release-key.keystore \
  -alias pawfriend \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Mover a la carpeta android/
mv pawfriend-release-key.keystore android/
```

PowerShell:
```powershell
keytool -genkey -v -keystore pawfriend-release-key.keystore -alias pawfriend -keyalg RSA -keysize 2048 -validity 10000
Move-Item pawfriend-release-key.keystore android/
```

Luego copiar `android/keystore.properties.example` a `android/keystore.properties` y llenar:
```properties
storeFile=../pawfriend-release-key.keystore
storePassword=TU_PASSWORD
keyAlias=pawfriend
keyPassword=TU_PASSWORD
```

**IMPORTANTE**: Guardar el keystore y las passwords en un lugar seguro (1Password, Google Drive privado, etc.). Si pierdes el keystore, NO puedes actualizar la app en Play Store.

---

## 2. Obtener SHA-1 y SHA-256 del Keystore

```bash
keytool -list -v -keystore android/pawfriend-release-key.keystore -alias pawfriend
```

Necesitas:
- **SHA-1**: para Google Cloud Console (Android OAuth Client ID)
- **SHA-256**: para `assetlinks.json` (deep links)
- **Key Hash (base64)**: para Facebook Login en Android

Para generar el hash de Facebook:
```bash
keytool -exportcert -alias pawfriend -keystore android/pawfriend-release-key.keystore | openssl dgst -sha256 -binary | openssl base64
```

---

## 3. Build Android (Play Store)

### Usando el script:

PowerShell:
```powershell
.\scripts\build-android-release.ps1
```

Bash/macOS:
```bash
chmod +x scripts/build-android-release.sh
./scripts/build-android-release.sh
```

### Manual:
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

El AAB queda en: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. Subir a Google Play Console

1. Ir a https://play.google.com/console/
2. **Crear app**:
   - Nombre: Paw Friend
   - Idioma: Espanol (Chile)
   - Tipo: App (no juego)
   - Gratis
3. **Dashboard > Start testing > Internal testing** (recomendado primero):
   - Create new release > Upload AAB
   - Agregar testers (tu email + amigos/beta testers)
   - Review and start rollout
4. Una vez validado en testing interno:
   - **Closed testing** (beta) > Create track > Upload AAB > Invitar testers
5. Cuando estes listo:
   - **Production** > Create new release > Upload AAB
   - Completar todo el contenido del store (ver abajo)
   - Submit for review

### Contenido requerido para Play Store:
- Titulo (30 chars max): `Paw Friend`
- Descripcion corta (80 chars): `Gestiona la salud de tu mascota con veterinarios verificados`
- Descripcion larga (4000 chars): [redactar]
- Icono de alta resolucion: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: minimo 2, hasta 8 por dispositivo
- Categoria: Medical o Health & Fitness
- Content rating: completar cuestionario IARC
- Data safety: ver `STORE_DATA_SAFETY.md`
- Privacy policy URL: `https://pawfriend.cl/privacy`
- Pais: Chile (puedes agregar mas despues)

### Tiempos de revision:
- Internal testing: sin revision, instantaneo
- Closed testing: 1-3 dias
- Production (primera vez): 3-7 dias
- Updates posteriores: 1-3 dias

---

## 5. Build iOS (App Store)

### Prerequisitos:
- macOS con Xcode 15+
- Cuenta Apple Developer activa
- `GoogleService-Info.plist` en `ios/App/App/`

### Build:
```bash
npm run build
npx cap sync ios
npx cap open ios
```

En Xcode:
1. Seleccionar **"Any iOS Device (arm64)"** como target
2. Ir a **Signing & Capabilities**:
   - Team: tu cuenta de Apple Developer
   - Bundle Identifier: `cl.pawfriend.app`
   - Agregar capability: **Sign in with Apple**
   - Agregar capability: **Push Notifications**
   - Agregar capability: **Associated Domains** (`applinks:pawfriend.cl`)
3. **Product > Archive**
4. **Window > Organizer > Distribute App > App Store Connect**
5. Seguir el wizard de upload

---

## 6. Subir a App Store Connect

1. Ir a https://appstoreconnect.apple.com/
2. **My Apps > "+" > New App**:
   - Name: Paw Friend
   - Primary Language: Spanish (Chile)
   - Bundle ID: cl.pawfriend.app
   - SKU: pawfriend
3. Completar:
   - Description, keywords, screenshots
   - Privacy policy URL: `https://pawfriend.cl/privacy`
   - Support URL: `https://pawfriend.cl`
   - Age Rating: 4+
   - Price: Free
   - Availability: Chile (puedes agregar mas despues)
   - App Privacy: ver `STORE_PRIVACY_LABELS.md`
4. Seleccionar el build subido desde Xcode
5. Submit for Review

---

## 7. TestFlight (beta testing iOS)

1. Despues de subir un build a App Store Connect, aparece en TestFlight
2. **Internal testers**: tu equipo (hasta 100 personas, sin revision de Apple)
3. **External testers**: necesita revision de Apple (1-2 dias), hasta 10,000 personas
4. Los testers instalan la app "TestFlight" de la App Store y acceden al build

---

## 8. Post-Launch Checklist

- [ ] Verificar que Google Sign-In funciona en produccion (web + mobile)
- [ ] Verificar que Facebook Login funciona en produccion
- [ ] Verificar que Apple Sign-In funciona en produccion
- [ ] Verificar Firebase Analytics recibe eventos
- [ ] Verificar Meta Pixel trackea en web
- [ ] Monitorear Sentry por crashes
- [ ] Responder reviews en las stores (mejora ranking)
- [ ] Configurar Google Search Console para pawfriend.cl
- [ ] Subir `assetlinks.json` y `apple-app-site-association` a produccion
