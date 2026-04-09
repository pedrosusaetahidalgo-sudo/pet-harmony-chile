# 🐾 Paw Friend — Brand Assets Package v1.0

Paquete completo de assets visuales de Paw Friend con la paleta **Lavanda Cálida** (`#9333EA`).

**Generado**: abril 2026
**Versión**: 1.0
**Total de archivos**: 68 assets organizados

---

## 📦 Contenido del paquete

```
paw-friend-brand-assets/
│
├── 📄 README.md                          ← Estás aquí
├── 📄 docs/
│   └── PAW_FRIEND_DESIGN_SYSTEM.md      ← Sistema de diseño completo + plan de migración
│
├── 📁 svg/                               ← Master files editables
│   ├── paw_friend_icon_principal.svg    ← SVG editable principal
│   ├── paw_friend_icon_dark.svg         ← SVG dark mode
│   ├── paw_friend_icon_mono.svg         ← SVG monocromático
│   ├── paw_friend_icon_reverse.svg      ← SVG blanco para fondos oscuros
│   ├── paw_friend_wordmark_horizontal.svg ← Wordmark con icono + texto
│   ├── master_icon_1024.png             ← Master con squircle iOS (1024x1024)
│   ├── master_icon_1024_square.png      ← Master sin squircle (Android)
│   ├── master_icon_1024_dark.png        ← Master dark mode
│   ├── master_icon_1024_mono.png        ← Master negro
│   └── master_icon_1024_reverse.png     ← Master blanco transparente
│
├── 📁 ios/                               ← App icons para Xcode (18 archivos)
│   ├── iphone_notification_20pt_2x.png  ← 40x40
│   ├── iphone_notification_20pt_3x.png  ← 60x60
│   ├── iphone_settings_29pt_2x.png      ← 58x58
│   ├── iphone_settings_29pt_3x.png      ← 87x87
│   ├── iphone_spotlight_40pt_2x.png     ← 80x80
│   ├── iphone_spotlight_40pt_3x.png     ← 120x120
│   ├── iphone_app_60pt_2x.png           ← 120x120
│   ├── iphone_app_60pt_3x.png           ← 180x180 (icon principal iPhone)
│   ├── ipad_notifications_*.png         ← 20-40px
│   ├── ipad_settings_*.png              ← 29-58px
│   ├── ipad_spotlight_*.png             ← 40-80px
│   ├── ipad_app_76pt_*.png              ← 76-152px
│   ├── ipad_pro_app_83.5pt_2x.png       ← 167x167
│   └── app_store_1024.png               ← 1024x1024 para App Store Connect
│
├── 📁 android/                           ← App icons para Android Studio
│   ├── mipmap-mdpi/                     ← 48x48 (1x)
│   ├── mipmap-hdpi/                     ← 72x72 (1.5x)
│   ├── mipmap-xhdpi/                    ← 96x96 (2x)
│   ├── mipmap-xxhdpi/                   ← 144x144 (3x)
│   ├── mipmap-xxxhdpi/                  ← 192x192 (4x)
│   ├── adaptive/                        ← Adaptive icon Android 8+
│   │   ├── ic_launcher_foreground.png
│   │   └── ic_launcher_background.png
│   └── play_store_512.png               ← 512x512 para Google Play Console
│
├── 📁 web/                               ← Favicons y PWA
│   ├── favicon.ico                      ← Multi-size ICO (16/32/48)
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-48x48.png
│   ├── favicon-96x96.png
│   ├── apple-touch-icon-180x180.png     ← Para iOS Safari
│   ├── android-chrome-192x192.png       ← Para Chrome Android
│   ├── android-chrome-512x512.png
│   ├── pwa-icon-192.png                 ← PWA estándar
│   ├── pwa-icon-512.png
│   ├── pwa-icon-maskable-512.png        ← PWA maskable (con safe zone)
│   └── mstile-150x150.png               ← Microsoft Tile
│
└── 📁 marketing/                         ← Splash screens y redes sociales
    ├── splash_iphone_*.png              ← Splash para iPhone (5 tamaños)
    ├── splash_ipad_*.png                ← Splash para iPad (3 tamaños)
    ├── splash_2732x2732.png             ← Splash universal Capacitor
    ├── social_facebook_cover_1640x624.png
    ├── social_twitter_header_1500x500.png
    ├── social_linkedin_banner_1584x396.png
    ├── social_instagram_post_1080x1080.png
    ├── social_instagram_story_1080x1920.png
    └── social_og_image_1200x630.png     ← Open Graph para link previews
```

---

## 🚀 Inicio rápido

### Si usas Capacitor (recomendado, lo más fácil)

```bash
# 1. Instalar capacitor-assets
npm install -D @capacitor/assets

# 2. Crear carpeta resources
mkdir -p resources

# 3. Copiar el master icon
cp svg/master_icon_1024_square.png resources/icon.png
cp marketing/splash_2732x2732.png resources/splash.png

# 4. Generar todo automáticamente
npx capacitor-assets generate \
  --iconBackgroundColor "#9333EA" \
  --iconBackgroundColorDark "#0F172A" \
  --splashBackgroundColor "#9333EA" \
  --splashBackgroundColorDark "#0F172A"

# 5. Sincronizar con plataformas nativas
npx cap sync
```

Esto reemplaza automáticamente todos los iconos en `ios/` y `android/`.

### Si quieres instalar manualmente

Lee `docs/PAW_FRIEND_DESIGN_SYSTEM.md` secciones:
- **Instalación en iOS** (paso a paso para Xcode)
- **Instalación en Android** (paso a paso para Android Studio)
- **Instalación en web** (favicons + manifest)

---

## 🎨 Paleta principal

- **Brand Primary**: `#9333EA` (purple-600)
- **Brand Hover**: `#7E22CE` (purple-700)
- **Wordmark "paw"**: `#6B21A8` (purple-800)
- **Wordmark "friend"**: `#9333EA` (purple-600)
- **Tipografía**: Fredoka (Google Fonts)

Paleta completa y tokens Tailwind en `docs/PAW_FRIEND_DESIGN_SYSTEM.md`.

---

## 📖 Documentación

El archivo `docs/PAW_FRIEND_DESIGN_SYSTEM.md` contiene:

1. Filosofía visual completa
2. Paleta extendida (brand, neutros, semánticos, health states)
3. Tipografía y escala
4. Tokens listos para `tailwind.config.ts`
5. Variables CSS para shadcn/ui o vanilla
6. **Plan de migración paso a paso desde tu paleta actual**
7. Tabla de mapeo "color viejo → token nuevo"
8. Comandos de reemplazo automático con `sed`
9. Guía de instalación en iOS, Android y web
10. Ejemplos de componentes con la nueva paleta

---

## 🐾 Sobre el logo

**Concepto**: Una huella de mascota con un corazón sutil recortado del pad principal en negative space. Una sola forma, dos lecturas: cuidado y amor por la mascota.

**Características técnicas**:
- Squircle iOS-correct (fórmula superellipse)
- Padding interno respetando safe zone de Apple (~10%)
- Toe beans en arco anatómico (rotaciones radiales)
- Pad redondo dominante con corazón sutil
- Renderizado a 4x para máximo antialiasing
- Funciona desde 16x16 (favicon) hasta 1024x1024 (App Store)
- Versiones light, dark, mono y reverse incluidas

**Por qué funciona**:
- Símbolo único memorable (no composición)
- Contraste alto blanco sobre purple
- Lectura inmediata como "huella" a cualquier tamaño
- El corazón aparece en segunda lectura, no compite
- Atemporal (no envejece como gradientes o efectos 3D)

---

## ⚠️ Notas importantes

1. **Antes de aplicar a tu app actual**, lee la sección "Plan de migración" del MD del design system. Hace commit de tu trabajo pendiente antes.

2. **Para subir a App Store**, usa `app_store_1024.png`. Apple aplica el squircle automáticamente, pero el archivo ya viene con squircle correcto por consistencia.

3. **Para subir a Google Play**, usa `play_store_512.png` para la ficha de la tienda.

4. **Open Graph**: el archivo `marketing/social_og_image_1200x630.png` debe servirse desde `https://pawfriend.cl/social_og_image_1200x630.png` y referenciarse en el `<head>` de tu landing.

5. **Tipografía**: Fredoka es gratis y open source. No necesitas licencia.

6. **Si modificas el SVG**: edítalo en Figma o Illustrator. Las coordenadas están documentadas en el código generador.

---

## 🔄 Versionado

- **v1.0** (abril 2026) — Release inicial. Paleta lavanda cálida, símbolo pata-corazón con negative space, set completo iOS/Android/web/marketing.

---

## 📞 Soporte

Si necesitas:
- Variantes adicionales del logo
- Iconos secundarios (4 documentos médicos, badges, achievements)
- Mockups de la app aplicando este sistema
- Animaciones del logo (lottie, after effects)
- Adaptaciones para impresión (CMYK, grandes formatos)

Genera nuevos assets siguiendo el mismo lenguaje visual definido en el design system.

---

🐾 **Paw Friend** — Cuidamos lo que más quieres
