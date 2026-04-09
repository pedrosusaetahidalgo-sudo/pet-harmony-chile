# 🎨 Paw Friend — Design System v1.0

> Sistema de diseño completo para Paw Friend, basado en la paleta **Lavanda Cálida** con `#9333EA` como color brand principal. Este documento es la fuente de verdad para todo el sistema visual de la app.

**Versión**: 1.0
**Última actualización**: abril 2026
**Aplica a**: app React + TypeScript + Tailwind + Capacitor (iOS/Android)

---

## 📋 Tabla de contenidos

1. [Filosofía visual](#filosofía-visual)
2. [Paleta completa](#paleta-completa)
3. [Tipografía](#tipografía)
4. [Tokens Tailwind](#tokens-tailwind)
5. [Variables CSS](#variables-css)
6. [Plan de migración desde la paleta actual](#plan-de-migración)
7. [Guía de uso de assets](#guía-de-uso-de-assets)
8. [Instalación de iconos en iOS](#instalación-en-ios)
9. [Instalación de iconos en Android](#instalación-en-android)
10. [Instalación de favicons en web](#instalación-en-web)
11. [Capacitor — generar todo automáticamente](#capacitor)
12. [Componentes y patrones recomendados](#componentes)

---

## Filosofía visual

Paw Friend es una app de cuidado de mascotas que sirve a dos perfiles: dueños y veterinarios. La identidad visual debe equilibrar:

- **Calidez emocional** para los dueños que confían el bienestar de su mascota.
- **Seriedad profesional** para los vets que esperan una herramienta clínica confiable.
- **Diferenciación clara** en stores chilenas dominadas por azules corporativos.

La paleta lavanda cálida resuelve estos tres requisitos: el morado `#9333EA` es lo suficientemente vibrante para ser memorable, lo suficientemente cálido para sentirse cariñoso, y lo suficientemente sobrio para inspirar confianza médica.

**Principios de aplicación:**

1. **Brand purple manda en chrome y CTAs principales** — header, botones primarios, links, fondos de hero.
2. **Neutros slate dominan superficies y texto** — el 70% de la pantalla es slate, no purple.
3. **Semánticos solo para feedback del sistema** — verde para éxito, ámbar para atención, rojo para urgencia.
4. **Health states son tokens dedicados** — específicos para indicadores de salud de mascota, no se mezclan con semánticos generales.
5. **Cero gradientes en el brand** — solo colores planos. Los gradientes envejecen mal y rompen en mobile.

---

## Paleta completa

### 🟣 Brand · Purple (Lavanda Cálida)

El color principal de Paw Friend. Usar `purple-600` como el color brand definitivo.

| Token | Hex | RGB | HSL | Uso recomendado |
|---|---|---|---|---|
| `purple-50`  | `#FAF5FF` | `250 245 255` | `270 100% 98%` | Background de páginas hero, secciones suaves |
| `purple-100` | `#F3E8FF` | `243 232 255` | `269 100% 95%` | Background de cards highlighted, hover states muy suaves |
| `purple-200` | `#E9D5FF` | `233 213 255` | `269 100% 92%` | Borders, dividers en zonas brand |
| `purple-300` | `#D8B4FE` | `216 180 254` | `269 97% 85%` | Badges suaves, chips informativos |
| `purple-400` | `#C084FC` | `192 132 252` | `270 95% 75%` | Acentos secundarios, dark mode primary |
| `purple-500` | `#A855F7` | `168 85 247`  | `271 91% 65%` | Botones secundarios, links, "friend" del wordmark |
| **`purple-600`** | **`#9333EA`** | **`147 51 234`**  | **`272 84% 56%`** | **⭐ BRAND PRIMARY — botones principales, fondo del icon, header** |
| `purple-700` | `#7E22CE` | `126 34 206`  | `273 72% 47%` | Hover de botones primarios, énfasis fuerte |
| `purple-800` | `#6B21A8` | `107 33 168`  | `273 67% 39%` | Texto del wordmark "paw", headings de marca |
| `purple-900` | `#581C87` | `88 28 135`   | `274 66% 32%` | Énfasis máximo, dark mode text on light bg |

### ⚪ Neutros · Slate

Slate (no gray puro) porque tiene un tinte ligeramente azulado que armoniza con purple. Usar gray neutro rompería la coherencia visual.

| Token | Hex | Uso |
|---|---|---|
| `slate-50`  | `#F8FAFC` | Background general de la app |
| `slate-100` | `#F1F5F9` | Background sutil de cards |
| `slate-200` | `#E2E8F0` | Borders default, dividers |
| `slate-300` | `#CBD5E1` | Borders hover |
| `slate-400` | `#94A3B8` | Texto terciario, placeholders, hints |
| `slate-500` | `#64748B` | Texto secundario, labels |
| `slate-700` | `#334155` | Texto secundario fuerte |
| `slate-900` | `#0F172A` | Texto principal, headings |

### ✅ Semánticos · Estados del sistema

Solo para feedback del sistema (toasts, banners, badges de estado, etc.). **No usar para estados de salud de mascota** — esos tienen sus propios tokens.

| Token | Hex | Uso |
|---|---|---|
| `success-50`  | `#ECFDF5` | Background de toast de éxito |
| `success-500` | `#10B981` | Iconos y texto de éxito |
| `success-700` | `#047857` | Texto en backgrounds claros de éxito |
| `warning-50`  | `#FFFBEB` | Background de toast de atención |
| `warning-500` | `#F59E0B` | Iconos y texto de warning |
| `warning-700` | `#B45309` | Texto en backgrounds claros de warning |
| `danger-50`   | `#FEF2F2` | Background de toast de error |
| `danger-500`  | `#EF4444` | Iconos y texto de error |
| `danger-700`  | `#B91C1C` | Texto en backgrounds claros de error |
| `info-50`     | `#FAF5FF` | Background de toast informativo (usa purple) |
| `info-500`    | `#A855F7` | Info usa el brand purple para coherencia |
| `info-700`    | `#7E22CE` | Texto en backgrounds claros de info |

### 🩺 Health States · Específicos Paw Friend

Tokens dedicados para indicadores de salud de mascota. Aunque algunos colores coinciden con semánticos, mantener separados permite que en el futuro puedas cambiar uno sin afectar al otro.

| Token | Hex | Uso |
|---|---|---|
| `health-good`      | `#10B981` | Mascota al día con vacunas, todo en orden |
| `health-good-bg`   | `#ECFDF5` | Background de card de mascota saludable |
| `health-attention` | `#F59E0B` | Vacuna por vencer en próximos 30 días |
| `health-attention-bg` | `#FFFBEB` | Background de card de mascota en atención |
| `health-urgent`    | `#EF4444` | Vacuna vencida, triage rojo de IA, urgencia |
| `health-urgent-bg` | `#FEF2F2` | Background de card de mascota urgente |
| `health-unknown`   | `#94A3B8` | Sin datos suficientes, ficha incompleta |
| `health-unknown-bg`| `#F1F5F9` | Background de card sin datos |

### 🌙 Dark Mode

En dark mode, el brand purple se aclara y el background pasa a slate-900.

| Token | Light | Dark | Notas |
|---|---|---|---|
| `bg-primary` | `#FFFFFF` | `#0F172A` | Background de cards |
| `bg-secondary` | `#F8FAFC` | `#1E293B` | Background general |
| `bg-tertiary` | `#F1F5F9` | `#334155` | Background de inputs |
| `text-primary` | `#0F172A` | `#F8FAFC` | Texto principal |
| `text-secondary` | `#64748B` | `#94A3B8` | Texto secundario |
| `brand-primary` | `#9333EA` | `#C084FC` | Brand color (más claro en dark) |
| `brand-hover` | `#7E22CE` | `#D8B4FE` | Brand hover (más claro en dark) |

---

## Tipografía

### Familia: **Fredoka**

Sans-serif redondeada de Google Fonts, gratis y open source. Tiene 5 pesos disponibles. Su carácter redondeado pero legible es perfecto para una app de cuidado de mascotas: cariñosa sin caer en infantil, profesional sin ser fría.

**Import en HTML** (en `index.html` antes del cierre de `</head>`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**Import en CSS** (alternativa, en `globals.css`):

```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap');
```

**Aplicación global** en `globals.css`:

```css
html {
  font-family: 'Fredoka', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Escala tipográfica

| Token | Tamaño | Peso | Line height | Uso |
|---|---|---|---|---|
| `text-xs`   | 12px | 400 | 1.5 | Captions, hints, metadata |
| `text-sm`   | 14px | 400 | 1.5 | Texto secundario, labels |
| `text-base` | 16px | 400 | 1.6 | Texto body por default |
| `text-lg`   | 18px | 500 | 1.5 | Texto destacado, intros |
| `text-xl`   | 20px | 500 | 1.4 | Subtítulos pequeños |
| `text-2xl`  | 24px | 600 | 1.3 | h3, títulos de cards |
| `text-3xl`  | 30px | 600 | 1.25 | h2, títulos de sección |
| `text-4xl`  | 36px | 700 | 1.2 | h1, títulos de página |
| `text-5xl`  | 48px | 700 | 1.1 | Hero, títulos heroicos |

### Pesos a usar

- **400 Regular**: body, párrafos largos
- **500 Medium**: labels, botones secundarios, énfasis suave
- **600 SemiBold**: títulos de cards, headings menores
- **700 Bold**: headings grandes, hero, "paw" del wordmark

**Evitar**: 300 Light (poco legible en mobile), 800 ExtraBold (innecesario, 700 ya es suficiente).

### Ajustes de letter-spacing

- Headings grandes (`text-3xl` y mayores): `letter-spacing: -0.02em` (tracking negativo, más moderno)
- Body: default (sin letter-spacing)
- Captions y labels en mayúsculas: `letter-spacing: 0.05em`

---

## Tokens Tailwind

Pegar esto en `tailwind.config.ts` reemplazando la sección de colores actual:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ============ BRAND PURPLE ============
        purple: {
          50:  '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',  // ⭐ BRAND PRIMARY
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },
        // ============ NEUTROS SLATE ============
        slate: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          700: '#334155',
          900: '#0F172A',
        },
        // ============ SEMÁNTICOS ============
        success: {
          50:  '#ECFDF5',
          500: '#10B981',
          700: '#047857',
        },
        warning: {
          50:  '#FFFBEB',
          500: '#F59E0B',
          700: '#B45309',
        },
        danger: {
          50:  '#FEF2F2',
          500: '#EF4444',
          700: '#B91C1C',
        },
        info: {
          50:  '#FAF5FF',
          500: '#A855F7',
          700: '#7E22CE',
        },
        // ============ HEALTH STATES ============
        health: {
          good: '#10B981',
          'good-bg': '#ECFDF5',
          attention: '#F59E0B',
          'attention-bg': '#FFFBEB',
          urgent: '#EF4444',
          'urgent-bg': '#FEF2F2',
          unknown: '#94A3B8',
          'unknown-bg': '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Fredoka', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
        '2xl': '28px',
        '3xl': '36px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(15, 23, 42, 0.04)',
        'card': '0 4px 16px rgba(15, 23, 42, 0.06)',
        'elevated': '0 8px 32px rgba(15, 23, 42, 0.10)',
        'brand': '0 8px 24px rgba(147, 51, 234, 0.20)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Variables CSS

Para componentes que no usan Tailwind o para librerías como shadcn/ui, agregar a `globals.css`:

```css
@layer base {
  :root {
    /* Brand */
    --color-brand-50:  #FAF5FF;
    --color-brand-100: #F3E8FF;
    --color-brand-200: #E9D5FF;
    --color-brand-300: #D8B4FE;
    --color-brand-400: #C084FC;
    --color-brand-500: #A855F7;
    --color-brand-600: #9333EA;
    --color-brand-700: #7E22CE;
    --color-brand-800: #6B21A8;
    --color-brand-900: #581C87;

    /* Backgrounds */
    --color-bg-primary:   #FFFFFF;
    --color-bg-secondary: #F8FAFC;
    --color-bg-tertiary:  #F1F5F9;

    /* Texto */
    --color-text-primary:   #0F172A;
    --color-text-secondary: #64748B;
    --color-text-tertiary:  #94A3B8;

    /* Borders */
    --color-border-default: #E2E8F0;
    --color-border-hover:   #CBD5E1;

    /* Semánticos */
    --color-success: #10B981;
    --color-warning: #F59E0B;
    --color-danger:  #EF4444;
    --color-info:    #A855F7;

    /* Health */
    --color-health-good:      #10B981;
    --color-health-attention: #F59E0B;
    --color-health-urgent:    #EF4444;
    --color-health-unknown:   #94A3B8;

    /* Tipografía */
    --font-sans: 'Fredoka', system-ui, sans-serif;

    /* Border radius */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 20px;
  }

  .dark {
    --color-bg-primary:   #0F172A;
    --color-bg-secondary: #1E293B;
    --color-bg-tertiary:  #334155;

    --color-text-primary:   #F8FAFC;
    --color-text-secondary: #94A3B8;
    --color-text-tertiary:  #64748B;

    --color-border-default: #334155;
    --color-border-hover:   #475569;

    --color-brand-600: #C084FC;  /* Más claro en dark */
    --color-brand-700: #D8B4FE;
  }
}
```

---

## Plan de migración

> Tu app actual usa `#A855F7` como morado principal y otras variantes. Este es el plan paso a paso para migrar al nuevo sistema sin romper nada.

### Fase 1 — Auditoría (1 hora, sin tocar código)

Ejecuta estos comandos en tu proyecto para detectar todos los usos del morado actual:

```bash
# Buscar todos los hex morados en uso
grep -rn "#[Aa]855[Ff]7\|#[Cc]084[Ff][Cc]\|#[Dd]946[Ee][Ff]" src/

# Buscar nombres de clases purple/violet
grep -rn "purple-\|violet-" src/

# Buscar variables CSS custom
grep -rn "\-\-color-purple\|\-\-color-brand" src/

# Buscar hex en archivos de configuración
grep -rn "#[A-Fa-f0-9]\{6\}" tailwind.config.ts tailwind.config.js src/styles/
```

Lista en un archivo `MIGRATION_LOG.md` todos los archivos que aparecen.

### Fase 2 — Tabla de mapeo

Estos son los reemplazos que probablemente necesitas hacer (ajusta según tu uso real):

| Color viejo | Token nuevo | Notas |
|---|---|---|
| `#A855F7` (morado principal actual) | `purple-600` (`#9333EA`) | Brand primary cambia a `#9333EA` |
| `#C084FC` (morado claro actual) | `purple-400` (`#C084FC`) | Sin cambio |
| `#D946EF` (fucsia si lo usabas) | `purple-500` (`#A855F7`) | Reemplaza fucsia por purple |
| `bg-purple-500` Tailwind | `bg-purple-600` | Subir de tono |
| `text-purple-600` Tailwind | `text-purple-700` | Subir de tono para mejor contraste |
| `border-purple-300` | `border-purple-200` | Bajar para borders más sutiles |
| `gray-XXX` neutros | `slate-XXX` | Migrar de gray a slate |

### Fase 3 — Reemplazo automático

**⚠️ Antes de ejecutar**: haz commit de todo lo que tengas pendiente. Los reemplazos son destructivos.

```bash
# Reemplazo de hex (en macOS usa 'sed -i ""' en vez de 'sed -i')
find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) -exec sed -i 's/#A855F7/#9333EA/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) -exec sed -i 's/#a855f7/#9333EA/g' {} +

# Reemplazo de clases Tailwind
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-violet-/bg-purple-/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/text-violet-/text-purple-/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/border-violet-/border-purple-/g' {} +

# Migrar gray neutros a slate
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-gray-/bg-slate-/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/text-gray-/text-slate-/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/border-gray-/border-slate-/g' {} +
```

### Fase 4 — Actualizar configuración

1. Reemplaza la sección `colors` de `tailwind.config.ts` con el bloque de la sección [Tokens Tailwind](#tokens-tailwind).
2. Agrega las variables CSS de la sección [Variables CSS](#variables-css) a `globals.css`.
3. Importa Fredoka en `index.html`.
4. Reemplaza la fuente actual en el `body` por Fredoka.

### Fase 5 — Reemplazar assets visuales

1. Borra todos los iconos viejos en `public/`, `assets/`, `ios/App/App/Assets.xcassets/AppIcon.appiconset/`, `android/app/src/main/res/mipmap-*/`.
2. Copia los nuevos assets desde el ZIP siguiendo la estructura de carpetas.
3. Si usas Capacitor, ejecuta `npx capacitor-assets generate --iconBackgroundColor "#9333EA"`.
4. Actualiza `manifest.webmanifest` y `index.html` con los nuevos favicons (ver sección [web](#instalación-en-web)).

### Fase 6 — Validación

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Recorre manualmente:
- Header y navegación
- Botones primarios y secundarios
- Cards de mascotas
- Estados de salud (verde / ámbar / rojo)
- Dark mode si lo tienes
- Splash screen en mobile
- Favicon en pestaña del browser
- App icon en home screen del simulador

### Fase 7 — Commit y deploy

```bash
git add .
git commit -m "feat(design-system): migra a paleta lavanda cálida v1.0

- Brand primary cambia a #9333EA (purple-600)
- Migra gray neutros a slate
- Actualiza tipografía a Fredoka
- Reemplaza todos los iconos para iOS, Android, web
- Agrega tokens semánticos y health states dedicados"
```

---

## Guía de uso de assets

El ZIP contiene 6 carpetas. Cada una tiene un propósito específico. Acá la guía de qué usar dónde.

### 📁 `svg/` — Master files editables

| Archivo | Cuándo usar |
|---|---|
| `paw_friend_icon_principal.svg` | Fuente vectorial editable para Figma, Illustrator, web |
| `paw_friend_icon_dark.svg` | Versión dark mode editable |
| `paw_friend_icon_mono.svg` | Versión negra para sellos, documentos, marca de agua |
| `paw_friend_icon_reverse.svg` | Versión blanca para fondos oscuros |
| `paw_friend_wordmark_horizontal.svg` | Wordmark con icono + texto, para web header |
| `master_icon_1024.png` | PNG maestro 1024x1024 con squircle iOS, base de todo |
| `master_icon_1024_square.png` | PNG maestro 1024x1024 sin squircle (para Android) |
| `master_icon_1024_dark.png` | Master en dark mode |
| `master_icon_1024_mono.png` | Master monocromático negro |
| `master_icon_1024_reverse.png` | Master reverse blanco con transparencia |

### 📁 `ios/` — App icons para Xcode

Todos los tamaños requeridos por App Store Connect. Copiar todo el contenido a `ios/App/App/Assets.xcassets/AppIcon.appiconset/` y actualizar `Contents.json`.

### 📁 `android/` — App icons para Android Studio

Estructura mipmap completa. Copiar:
- `mipmap-mdpi/` → `android/app/src/main/res/mipmap-mdpi/`
- `mipmap-hdpi/` → `android/app/src/main/res/mipmap-hdpi/`
- `mipmap-xhdpi/` → `android/app/src/main/res/mipmap-xhdpi/`
- `mipmap-xxhdpi/` → `android/app/src/main/res/mipmap-xxhdpi/`
- `mipmap-xxxhdpi/` → `android/app/src/main/res/mipmap-xxxhdpi/`
- `adaptive/` → `android/app/src/main/res/mipmap-anydpi-v26/`

Para Play Store: subir `play_store_512.png`.

### 📁 `web/` — Favicons y PWA

Copiar todo a `public/` de tu proyecto Vite/Next:

```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── favicon-48x48.png
├── favicon-96x96.png
├── apple-touch-icon-180x180.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
├── pwa-icon-192.png
├── pwa-icon-512.png
└── pwa-icon-maskable-512.png
```

Agregar al `<head>` de `index.html`:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">
<meta name="theme-color" content="#9333EA">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Paw Friend">
```

Y en `manifest.webmanifest`:

```json
{
  "name": "Paw Friend",
  "short_name": "Paw Friend",
  "description": "Cuida la salud de tu mascota con veterinarios verificados",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#9333EA",
  "lang": "es-CL",
  "icons": [
    {
      "src": "/pwa-icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 📁 `marketing/` — Splash screens y redes sociales

| Archivo | Uso |
|---|---|
| `splash_iphone_*.png` | Splash screens iOS, copiar a `ios/App/App/Assets.xcassets/Splash.imageset/` |
| `splash_ipad_*.png` | Splash screens iPad |
| `splash_2732x2732.png` | Splash universal Capacitor (`resources/splash.png`) |
| `social_facebook_cover_*` | Cover de página Facebook |
| `social_twitter_header_*` | Header de Twitter/X |
| `social_linkedin_banner_*` | Banner de LinkedIn |
| `social_instagram_post_*` | Post cuadrado para Instagram feed |
| `social_instagram_story_*` | Story vertical para Instagram |
| `social_og_image_*` | Open Graph para link previews (WhatsApp, Facebook, Twitter) |

Agregar al `<head>` para Open Graph:

```html
<meta property="og:title" content="Paw Friend - Cuida la salud de tu mascota">
<meta property="og:description" content="Encuentra veterinarios verificados, lleva la ficha médica de tu mascota y nunca olvides una vacuna.">
<meta property="og:image" content="https://pawfriend.cl/social_og_image_1200x630.png">
<meta property="og:url" content="https://pawfriend.cl">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CL">
<meta name="twitter:card" content="summary_large_image">
```

---

## Instalación en iOS

1. Abrir tu proyecto Capacitor en Xcode: `npx cap open ios`
2. En el navegador izquierdo, ir a `App > App > Assets.xcassets > AppIcon`
3. Borrar todas las imágenes existentes
4. Arrastrar cada PNG de la carpeta `ios/` al slot correspondiente:
   - `iphone_notification_20pt_2x.png` → iPhone Notification 20pt @2x
   - `iphone_notification_20pt_3x.png` → iPhone Notification 20pt @3x
   - `iphone_settings_29pt_2x.png` → iPhone Settings 29pt @2x
   - ...y así sucesivamente
5. Para el ícono del App Store: arrastrar `app_store_1024.png` al slot 1024pt @1x
6. Verificar que `Contents.json` tenga los slots correctos
7. Build & Run en simulador para verificar

**Splash screen iOS**:
1. En Xcode, ir a `App > App > Assets.xcassets > Splash`
2. Reemplazar las imágenes existentes con los `splash_iphone_*.png` y `splash_ipad_*.png` correspondientes
3. Verificar que `LaunchScreen.storyboard` apunte a la imagen correcta

---

## Instalación en Android

1. En tu proyecto, ir a `android/app/src/main/res/`
2. Para cada carpeta `mipmap-*`, copiar el contenido correspondiente desde `android/mipmap-*/`:
   ```bash
   cp -r android/mipmap-mdpi/* /tu-proyecto/android/app/src/main/res/mipmap-mdpi/
   cp -r android/mipmap-hdpi/* /tu-proyecto/android/app/src/main/res/mipmap-hdpi/
   cp -r android/mipmap-xhdpi/* /tu-proyecto/android/app/src/main/res/mipmap-xhdpi/
   cp -r android/mipmap-xxhdpi/* /tu-proyecto/android/app/src/main/res/mipmap-xxhdpi/
   cp -r android/mipmap-xxxhdpi/* /tu-proyecto/android/app/src/main/res/mipmap-xxxhdpi/
   ```

3. Para adaptive icon (Android 8+):
   - Copiar `android/adaptive/ic_launcher_background.png` a cada carpeta `mipmap-*` correspondiente, o crear `ic_launcher_background.xml` en `res/values/` con el color sólido:
     ```xml
     <?xml version="1.0" encoding="utf-8"?>
     <resources>
         <color name="ic_launcher_background">#9333EA</color>
     </resources>
     ```
   - Copiar `ic_launcher_foreground.png` a cada carpeta `mipmap-*`
   - Crear `mipmap-anydpi-v26/ic_launcher.xml`:
     ```xml
     <?xml version="1.0" encoding="utf-8"?>
     <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
         <background android:drawable="@color/ic_launcher_background" />
         <foreground android:drawable="@mipmap/ic_launcher_foreground" />
     </adaptive-icon>
     ```

4. Para Play Store: subir `play_store_512.png` en Google Play Console

5. Verificar `AndroidManifest.xml`:
   ```xml
   <application
       android:icon="@mipmap/ic_launcher"
       android:roundIcon="@mipmap/ic_launcher_round"
       android:theme="@style/AppTheme">
   ```

6. Build & Run: `npx cap run android`

---

## Instalación en web

Ver sección [`web/` en Guía de uso de assets](#-web--favicons-y-pwa).

---

## Capacitor

La forma más rápida de instalar todos los iconos automáticamente:

```bash
# Instalar capacitor-assets
npm install -D @capacitor/assets

# Crear carpeta resources/
mkdir -p resources

# Copiar el master icon como icon.png
cp svg/master_icon_1024_square.png resources/icon.png

# Crear splash screen base
cp marketing/splash_2732x2732.png resources/splash.png

# Generar todos los assets automáticamente
npx capacitor-assets generate \
  --iconBackgroundColor "#9333EA" \
  --iconBackgroundColorDark "#0F172A" \
  --splashBackgroundColor "#9333EA" \
  --splashBackgroundColorDark "#0F172A"

# Sincronizar
npx cap sync
```

Esto reemplaza automáticamente todos los iconos de iOS y Android en sus carpetas correctas. Después solo abres Xcode y Android Studio para verificar.

---

## Componentes

### Botón primario

```tsx
<button className="
  bg-purple-600 hover:bg-purple-700 active:bg-purple-800
  text-white font-medium
  px-6 py-3 rounded-xl
  shadow-brand hover:shadow-elevated
  transition-all duration-200
">
  Crear cuenta gratis
</button>
```

### Botón secundario

```tsx
<button className="
  bg-purple-50 hover:bg-purple-100 active:bg-purple-200
  text-purple-700 font-medium
  px-6 py-3 rounded-xl
  border border-purple-200
  transition-all duration-200
">
  Saber más
</button>
```

### Card de mascota con health state

```tsx
<div className="
  bg-white rounded-2xl p-6
  shadow-card hover:shadow-elevated
  border border-slate-200
  transition-all
">
  <div className="flex items-center gap-4">
    <img src={pet.photo} className="w-16 h-16 rounded-full" />
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-slate-900">{pet.name}</h3>
      <p className="text-sm text-slate-500">{pet.breed}</p>
    </div>
    <div className={`
      px-3 py-1 rounded-full text-xs font-medium
      ${pet.healthStatus === 'good' && 'bg-health-good-bg text-health-good'}
      ${pet.healthStatus === 'attention' && 'bg-health-attention-bg text-health-attention'}
      ${pet.healthStatus === 'urgent' && 'bg-health-urgent-bg text-health-urgent'}
    `}>
      {healthLabel}
    </div>
  </div>
</div>
```

### Header con wordmark

```tsx
<header className="
  bg-white border-b border-slate-200
  px-6 py-4 flex items-center justify-between
  sticky top-0 z-50
">
  <div className="flex items-center gap-3">
    <img src="/svg/paw_friend_icon_principal.svg" alt="Paw Friend" className="w-10 h-10" />
    <span className="text-2xl font-semibold">
      <span className="text-purple-800">paw</span>
      <span className="text-purple-600 ml-1">friend</span>
    </span>
  </div>
  {/* nav links */}
</header>
```

### Toast de éxito

```tsx
<div className="
  bg-success-50 border border-success-500
  text-success-700
  px-4 py-3 rounded-xl
  flex items-center gap-3
">
  <CheckIcon className="w-5 h-5" />
  <span className="font-medium">Vacuna registrada correctamente</span>
</div>
```

---

## Recursos adicionales

- **Fredoka en Google Fonts**: https://fonts.google.com/specimen/Fredoka
- **Tailwind CSS docs**: https://tailwindcss.com/docs
- **Capacitor Assets**: https://github.com/ionic-team/capacitor-assets
- **iOS Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines
- **Material Design**: https://m3.material.io/

---

**Última nota**: este design system es la fuente de verdad. Si en el futuro necesitas agregar colores nuevos, agrégalos a este documento primero, después al `tailwind.config.ts`, y finalmente al código. Nunca al revés.

🐾 Paw Friend Design System v1.0
