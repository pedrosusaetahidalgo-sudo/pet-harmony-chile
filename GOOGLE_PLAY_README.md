# Paw Friend - Guía Completa para Google Play Store

## 📱 Información de la App

| Campo | Valor |
|-------|-------|
| **Nombre de la App** | Paw Friend |
| **Package Name / Application ID** | `cl.pawfriend.app` |
| **Versión** | 1.0.0 |
| **Version Code** | 1 |
| **Target SDK** | 35 (Android 15) |
| **Min SDK** | 24 (Android 7.0 Nougat) |

---

## ⚠️ IMPORTANTE: Ejecutar Comandos desde la Carpeta del Proyecto

**Los comandos `npm`, `npx` y otros comandos de Node.js deben ejecutarse SIEMPRE desde la carpeta raíz del proyecto** (donde está el archivo `package.json`), NO desde `C:\Users\...` ni desde cualquier otra ubicación.

### Ejemplo en Windows (PowerShell o CMD):

```powershell
# 1. PRIMERO: Navegar a la carpeta del proyecto
cd C:\ruta\a\tu\proyecto\pawfriend

# 2. Verificar que estás en la carpeta correcta (debe mostrar package.json)
dir package.json

# 3. AHORA sí ejecutar los comandos de npm/npx:
npm install
npx cap add android
npx cap sync android
```

### Ejemplo completo paso a paso:

```powershell
# Si tu proyecto está en: C:\Proyectos\pawfriend

# Paso 1: Abrir PowerShell o CMD

# Paso 2: Navegar al proyecto
cd C:\Proyectos\pawfriend

# Paso 3: Instalar dependencias (solo la primera vez o si cambian)
npm install

# Paso 4: Agregar plataforma Android (solo la primera vez)
npx cap add android

# Paso 5: Sincronizar código web con Android
npx cap sync android
```

### ❌ Error común:
```powershell
PS C:\Users\TuUsuario> npm install
# ERROR: No encuentra package.json porque estás en la carpeta equivocada
```

### ✅ Forma correcta:
```powershell
PS C:\Users\TuUsuario> cd C:\Proyectos\pawfriend
PS C:\Proyectos\pawfriend> npm install
# ÉXITO: Encuentra package.json y ejecuta correctamente
```

---

## 🚀 Pasos para Generar el .aab de Producción

### Paso 1: Preparar el Entorno

```bash
# Requisitos previos:
# - Node.js 18+ instalado (descargar de https://nodejs.org)
# - Android Studio instalado (con SDK Android 35)
# - Java 17+ instalado

# 1. Clonar o descargar el proyecto desde GitHub
git clone <tu-repositorio>

# 2. IMPORTANTE: Entrar a la carpeta del proyecto
cd pawfriend

# 3. Instalar dependencias (desde la carpeta del proyecto)
npm install
```

### Paso 2: Configurar Capacitor para Producción

**IMPORTANTE**: Antes de generar el build de producción, edita `capacitor.config.ts`:

```typescript
// capacitor.config.ts - VERSIÓN DE PRODUCCIÓN
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.pawfriend.app',
  appName: 'Paw Friend',
  webDir: 'dist',
  // COMENTAR O ELIMINAR la sección "server" para producción:
  // server: {
  //   url: 'https://...',
  //   cleartext: true
  // },
  android: {
    buildOptions: {
      keystorePath: 'pawfriend-release-key.keystore',
      keystoreAlias: 'pawfriend',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#8B5CF6',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
```

### Paso 3: Agregar la Plataforma Android

```bash
# Agregar Android (si no existe la carpeta android/)
npx cap add android

# Si ya existe, solo sincronizar
npx cap sync android
```

### Paso 4: Construir el Proyecto Web

```bash
# Construir la app web optimizada para producción
npm run build

# Sincronizar los archivos con Android
npx cap sync android
```

### Paso 5: Generar el Keystore de Producción

```bash
# EJECUTAR SOLO UNA VEZ - Guardar el keystore de forma segura

keytool -genkey -v \
  -keystore pawfriend-release-key.keystore \
  -alias pawfriend \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass TU_PASSWORD_SEGURO \
  -keypass TU_PASSWORD_SEGURO \
  -dname "CN=Paw Friend, OU=Development, O=Paw Friend Chile, L=Santiago, ST=RM, C=CL"

# Mover el keystore a la carpeta android/
mv pawfriend-release-key.keystore android/
```

⚠️ **IMPORTANTE**: 
- Guarda el keystore en un lugar seguro (NO en el repositorio)
- Anota las contraseñas - las necesitarás para cada release
- Perder el keystore = no poder actualizar la app en Play Store

### Paso 6: Abrir en Android Studio

```bash
# Abrir el proyecto en Android Studio
npx cap open android
```

### Paso 7: Generar el App Bundle (.aab)

En Android Studio:

1. **Build > Generate Signed Bundle / APK...**
2. Seleccionar **"Android App Bundle"** → Next
3. Configurar el keystore:
   - **Key store path**: Selecciona `android/pawfriend-release-key.keystore`
   - **Key store password**: Tu contraseña
   - **Key alias**: `pawfriend`
   - **Key password**: Tu contraseña
4. Click **Next**
5. Seleccionar **"release"** como Build Variant
6. Marcar las casillas:
   - ✅ V1 (Jar Signature)
   - ✅ V2 (Full APK Signature)
7. Click **Create**

### Ubicación del .aab generado:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🔐 Permisos Utilizados

| Permiso | Propósito |
|---------|-----------|
| `INTERNET` | Conexión a servidores |
| `ACCESS_NETWORK_STATE` | Verificar conectividad |
| `ACCESS_FINE_LOCATION` | Lugares pet-friendly, mascotas perdidas |
| `ACCESS_COARSE_LOCATION` | Ubicación aproximada |
| `CAMERA` | Fotos de mascotas |
| `READ_MEDIA_IMAGES` | Seleccionar fotos (Android 13+) |
| `POST_NOTIFICATIONS` | Notificaciones push |
| `VIBRATE` | Alertas |

---

## 📋 Pasos en Google Play Console

### 1. Crear la App
1. Ir a [Google Play Console](https://play.google.com/console)
2. **"Crear app"**
3. Nombre: `Paw Friend`
4. Idioma: Español (Chile)
5. Tipo: App (no juego)
6. Gratis

### 2. Configurar la Ficha de Play Store

#### Información Principal:
- **Descripción corta** (80 caracteres):
  ```
  Red social para mascotas. Conecta, cuida y comparte la vida de tu mascota 🐾
  ```

- **Descripción completa** (4000 caracteres):
  ```
  ¡Bienvenido a Paw Friend! La red social para mascotas de Chile.

  🐕 PERFILES DE MASCOTAS
  Crea perfiles detallados para todas tus mascotas con fotos, información de salud y personalidad.

  📸 PET SOCIAL
  Comparte fotos y momentos especiales. Conecta con otros dueños de mascotas.

  🏥 HISTORIAL MÉDICO
  Gestiona vacunas, tratamientos y citas veterinarias. Nunca olvides una fecha importante.

  📍 LUGARES PET-FRIENDLY
  Descubre parques, restaurantes, tiendas y más lugares que aceptan mascotas cerca de ti.

  🚶 SERVICIOS PROFESIONALES
  Encuentra paseadores, cuidadores, entrenadores y veterinarios verificados.

  🔔 MASCOTAS PERDIDAS
  Reporta y encuentra mascotas perdidas en tu zona con alertas en tiempo real.

  🎮 GAMIFICACIÓN
  Gana puntos y recompensas cuidando a tu mascota y participando en la comunidad.

  💬 MENSAJERÍA
  Comunícate directamente con otros usuarios y proveedores de servicios.

  💳 PAGOS SEGUROS
  Paga servicios de forma segura a través de Webpay.

  ¡Únete a la comunidad pet-friendly más grande de Chile!
  ```

#### Assets Necesarios:
- [ ] Ícono de app: 512x512 PNG
- [ ] Gráfico destacado: 1024x500 PNG
- [ ] Screenshots teléfono: mínimo 2, tamaño 1080x1920
- [ ] Screenshots tablet (opcional): 1200x1920

### 3. Completar Declaraciones

#### Política de Privacidad:
URL: `https://pawfriend.cl/privacy`

#### Clasificación de Contenido:
- Completar cuestionario IARC
- Resultado esperado: **Para todos (PEGI 3)**

#### Seguridad de Datos:
Responder cuestionario indicando:
- ✅ Recopila datos personales (email, nombre)
- ✅ Recopila ubicación
- ✅ Datos compartidos con terceros (proveedores de servicios)
- ✅ Datos cifrados en tránsito
- ✅ Usuarios pueden solicitar eliminación

### 4. Subir el App Bundle

1. **Pruebas > Prueba interna** (recomendado para testing)
2. O directamente a **Producción**
3. **"Crear versión"**
4. Subir el archivo `.aab`
5. Agregar notas de versión:
   ```
   Versión 1.0.0 - Lanzamiento inicial
   
   • Perfiles de mascotas con información detallada
   • Red social Pet Social para compartir momentos
   • Gestión de historial médico y vacunas
   • Mapa de lugares pet-friendly
   • Servicios profesionales (paseadores, cuidadores, veterinarios)
   • Sistema de alertas de mascotas perdidas
   • Gamificación con puntos y recompensas
   • Pagos seguros con Webpay
   ```

### 5. Revisión Final y Envío

1. Revisar todos los warnings
2. Click **"Revisar versión"**
3. Click **"Iniciar lanzamiento"**

La revisión de Google toma 1-3 días hábiles.

---

## ✅ Checklist Pre-Publicación

### Técnico
- [ ] `capacitor.config.ts` sin URL de desarrollo
- [ ] Build .aab generado sin errores
- [ ] Keystore guardado de forma segura
- [ ] targetSdkVersion = 35
- [ ] Todos los permisos con propósito declarado

### Contenido
- [ ] Sin texto lorem ipsum
- [ ] Todos los botones funcionan
- [ ] Precios en CLP correctos
- [ ] Ícono de producción

### Legal
- [ ] Política de Privacidad publicada
- [ ] Términos y Condiciones publicados
- [ ] Email soporte@pawfriend.cl funcional

### Google Play Console
- [ ] Cuenta de desarrollador ($25 USD)
- [ ] Declaración de privacidad completada
- [ ] Clasificación de contenido completada
- [ ] Assets gráficos subidos
- [ ] Descripciones en español

---

## 🔄 Actualizar la App

Para futuras versiones:

```bash
# 1. Actualizar versión en android/app/build.gradle
versionCode 2  # Incrementar en 1
versionName "1.1.0"

# 2. Construir y sincronizar
npm run build
npx cap sync android

# 3. Generar nuevo .aab en Android Studio
# Build > Generate Signed Bundle / APK...

# 4. Subir a Google Play Console
```

---

## 📞 Soporte

- **Email**: soporte@pawfriend.cl
- **Desarrollador**: Paw Friend Chile
- **País**: Chile 🇨🇱
