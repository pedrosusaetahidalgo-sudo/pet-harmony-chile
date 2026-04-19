# Paw Friend — Asset Prompts Library (Copy-Paste Ready)

> **Estado:** Librería de prompts **completamente auto-contenidos** para claude.ai.
> **Versión:** 2026-04-19.
> **Uso:** copiá el bloque entre `--- PASTE START ---` y `--- PASTE END ---`, pegá en claude.ai, recibís el SVG perfecto. Sin setup previo, sin contexto extra.

---

## 0. Cómo usar esta librería

1. Abrí **claude.ai** (o Claude Code directamente) en una conversación **nueva y limpia**.
2. Buscá el prompt del asset que necesitas (sección 1 a 20).
3. Copiá **todo** el bloque entre `--- PASTE START ---` y `--- PASTE END ---`.
4. Pegalo en Claude como primer mensaje.
5. Claude responde con el SVG dentro de un bloque ` ```svg `.
6. Copiá el SVG, guardalo en la ruta indicada en el header del prompt.
7. Optimizá con SVGO: `npx svgo public/brand-assets/<ruta>/<filename>.svg`
8. Commit con mensaje: `feat(assets): <ID-del-prompt> <nombre>`

**Cada prompt es 100% autónomo.** No necesitas haber pegado nada antes. No hay "paso 1 contexto, paso 2 ask". Un solo paste = respuesta perfecta.

---

## Índice

1. [Logo system](#1-logo-system)
2. [Favicon family](#2-favicon-family)
3. [Brand squircle icons (41-60)](#3-brand-squircle-icons-41-60)
4. [Illustrations](#4-illustrations)
5. [Device mockups](#5-device-mockups)
6. [Instagram](#6-instagram)
7. [Facebook](#7-facebook)
8. [WhatsApp Business](#8-whatsapp-business)
9. [TikTok](#9-tiktok)
10. [YouTube](#10-youtube)
11. [App Store iOS](#11-app-store-ios)
12. [Play Store Android](#12-play-store-android)
13. [Investor Kit](#13-investor-kit)
14. [Partner Kit](#14-partner-kit)
15. [Press / Media Kit](#15-press-media-kit)
16. [Creator Voices Kit](#16-creator-voices-kit)
17. [Event / Conference Kit](#17-event-conference-kit)
18. [Document Templates](#18-document-templates)
19. [Email HTML](#19-email-html)
20. [Patterns & Backgrounds](#20-patterns-backgrounds)

---

## 1. Logo system

### 1.1. LOGO-01 · App Icon iOS 1024×1024

**Destino:** `public/brand-assets/logo/app_icon_ios_1024.svg` · **Prioridad:** P0 · **Peso:** < 3 KB

Copy-paste en claude.ai:

```
--- PASTE START ---

Necesito producir un SVG oficial para Paw Friend, una app chilena
real en producción. Te paso TODO el contexto que necesitas para dar
una respuesta perfecta.

PROYECTO:
Paw Friend es una app chilena: ficha médica digital de mascotas +
directorio público de veterinarios + comunidad pet lover. 100%
gratis para dueños. Hecha en Chile por una persona (Paw Founder)
con apoyo de IA. SpA formal: SUSAETA GARNHAM SOFTWARE ENGINEERING
(RUT 78.328.659-9). Web: pawfriend.cl. Mascotas reales del founder:
Kai (pastor suizo) y Ema (gata negra).

PALETA BRAND 2.0 (estricto, no inventar colores):
- Purple primary: #faf5ff · #f3e8ff · #e9d5ff · #d8b4fe · #c084fc
  #a855f7 · #9333ea (★ main) · #7e22ce · #6b21a8 · #581c87
- Gold secondary: #fffbeb · #fef3c7 · #fde68a · #fcd34d · #fbbf24
  #f59e0b (★ main) · #d97706 · #b45309 · #92400e · #78350f
- Neutrales: ink #1a102b · paper #faf7ff · border #e9d5ff

ESTILO VISUAL:
Flat modern con microdetalles warm. Squircle iOS (rx 22% del lado)
como geometría brand. No hiperrealismo, no Material puro, no
corporate frío. Sí geometrías simples + bordes redondeados +
paleta disciplinada.

REGLAS TÉCNICAS SVG:
- Vectorial limpio, paths simples, sin raster embed
- <title> + role="img" + aria-label descriptivos
- <desc> con propósito del asset
- Peso objetivo: < 3 KB
- Sin texto embedded
- Funcional a cualquier escala

ENTREGA:
UN SOLO SVG dentro de bloque ```svg ... ```. Precedido por
comentario <!-- filename.svg --> en primera línea. Sin prosa
adicional alrededor.

═════════════════════════════════════════════════════════
PEDIDO ESPECÍFICO: App Icon iOS master 1024×1024
═════════════════════════════════════════════════════════

ARCHIVO: app_icon_ios_1024.svg
DIMENSIONES: viewBox 0 0 1024 1024
PRIORIDAD: P0 (bloquea Apple App Store submission)

CONCEPTO:
Isotipo Paw Friend = pata con 4 pétalos arriba + cuerpo ovalado
abajo, y en el centro del cuerpo ovalado un CORAZÓN en negative
space (hueco que deja ver el fondo). Sobre squircle iOS.

COMPOSICIÓN TÉCNICA:
- Squircle: path con rx equivalente al 22% del lado (225px).
  Usar path SVG (no rect), estándar iOS 17.
- Fill del squircle: gradient radial
  · centro (cx 50% cy 45%) #9333ea (brand-600)
  · extremos #581c87 (brand-900)
  · highlight sutil arriba-izquierda: rgba(255,255,255,.12)
- Isotipo blanco #ffffff puro ocupando ~72% del canvas, centrado
  verticalmente al 55% (compensa óptico del corazón negative space)
- Corazón negative space: pequeño, en el centro del cuerpo ovalado,
  con clip-path o mask. El cuerpo ovalado sí es fill blanco pero
  el corazón aparece con el color del squircle debajo
- 4 pétalos (dedos de la pata) arriba del cuerpo: elipses
  ligeramente rotadas simulando perspectiva natural

RESTRICCIONES iOS 17:
- NO sombras internas (no las soporta en app icon)
- NO transparencia detrás del isotipo (fondo 100% opaco)
- NO gradient en el isotipo (mantenerlo blanco puro)
- SÍ gradient en el squircle background

DEBE VERSE BIEN A:
- 1024×1024 (master App Store)
- 180×180 (iPhone @3x home)
- 120×120 (iPhone @2x home)
- 60×60 (notification thumbnail — verificar que el corazón negative
  space se sigue leyendo)

TITLE: "Paw Friend App Icon"

DESC: "App icon oficial de Paw Friend para iOS. Squircle con
gradient brand purple y isotipo pata-corazón en negative space."

--- PASTE END ---
```

---

### 1.2. LOGO-02 · Adaptive icon Android foreground

**Destino:** `public/brand-assets/logo/adaptive_android_foreground.svg` · **Prioridad:** P0 · **Peso:** < 2 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena real en
producción: ficha médica digital + directorio vets + comunidad).
Paleta brand: purple #9333ea + gold #eab308. Contexto completo:
SpA SUSAETA GARNHAM SOFTWARE ENGINEERING, RUT 78.328.659-9,
pawfriend.cl.

ESTILO: flat modern warm, geometrías simples, paleta brand
disciplinada.

REGLAS SVG TÉCNICAS:
- Vectorial limpio, paths simples
- <title>, role="img", aria-label, <desc>
- Peso < 2 KB
- Entrega: UN solo SVG en bloque ```svg``` con comentario
  <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Adaptive Icon Android FOREGROUND layer
═════════════════════════════════════════════════════════

ARCHIVO: adaptive_android_foreground.svg
DIMENSIONES: viewBox 0 0 432 432
SAFE ZONE: los 264×264 centrales (del 33% al 67% del canvas)
PRIORIDAD: P0 (bloquea Google Play Store submission)

CONTEXTO ANDROID:
El adaptive icon tiene 2 capas (foreground + background). El launcher
de Android aplica una máscara encima (circle, squircle, teardrop,
squircle agresivo, rounded square, etc.) — SOLO el safe zone 264×264
centro está garantizado de verse sin recorte.

CONCEPTO:
SOLO el isotipo Paw Friend (pata con corazón negative space en el
cuerpo), centrado dentro del safe zone 264×264.

COMPOSICIÓN:
- FONDO: TRANSPARENTE (el background layer va separado)
- Isotipo blanco puro #ffffff centrado en el canvas
- Tamaño: ocupar 90% del safe zone (240×240 del centro)
- Padding: el isotipo respira pero llena el área útil
- Corazón negative space: con fondo transparente detrás (el
  background layer lo pintará)

DEBE VERSE BIEN CON MÁSCARA:
- Circle (Pixel)
- Squircle (Samsung One UI)
- Teardrop (OxygenOS)
- Rounded square (MIUI)

TITLE: "Paw Friend Adaptive Icon Foreground"
DESC: "Foreground layer del adaptive icon Android. Isotipo blanco
centrado dentro del safe zone para compatibilidad con todas las
máscaras de launcher."

--- PASTE END ---
```

---

### 1.3. LOGO-03 · Adaptive icon Android background

**Destino:** `public/brand-assets/logo/adaptive_android_background.svg` · **Prioridad:** P0 · **Peso:** < 1 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena:
ficha médica + directorio vets + comunidad). Paleta brand:
purple #9333ea + gold #eab308. SpA con RUT 78.328.659-9.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 1 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Adaptive Icon Android BACKGROUND layer
═════════════════════════════════════════════════════════

ARCHIVO: adaptive_android_background.svg
DIMENSIONES: viewBox 0 0 432 432
PRIORIDAD: P0

CONCEPTO:
Background layer del adaptive icon Android. Es un simple rectángulo
uniforme del color brand — NO lleva contenido visual (el contenido
va en el foreground separado).

COMPOSICIÓN:
- Rectangle/path que llena 100% del canvas (432×432, sin transparencia)
- Fill: gradient radial
  · centro cx="50%" cy="40%" stop #9333ea (brand-600)
  · extremos stop #581c87 (brand-900)
- Un solo <path> o <rect> con gradient
- Sin highlights, sin detalles, sin sombras

OBJETIVO: que cuando el launcher aplique cualquier máscara, todo el
área visible muestre el color brand uniforme.

TITLE: "Paw Friend Adaptive Icon Background"
DESC: "Background layer del adaptive icon Android. Gradient radial
brand purple full-bleed para combinar con foreground layer."

--- PASTE END ---
```

---

### 1.4. LOGO-04 · Splash screen iOS (light + dark)

**Destino:** `public/brand-assets/logo/splash_ios_light.svg` + `splash_ios_dark.svg` · **Prioridad:** P0 · **Peso:** < 4 KB cada uno

```
--- PASTE START ---

Necesito 2 SVGs oficiales para Paw Friend — app chilena
(ficha médica digital + directorio público vets + comunidad).
100% gratis para dueños. Hecha en Chile por una persona
(Paw Founder) con apoyo de IA. SpA SUSAETA GARNHAM SOFTWARE
ENGINEERING, RUT 78.328.659-9, pawfriend.cl.

PALETA BRAND (estricto):
- Purple: #9333ea main · #581c87 deep · #7e22ce · #a855f7
- Gold: #f59e0b main · #eab308 · #fde68a
- Paper: #faf7ff · ink: #1a102b · ink-soft: #4b3b66

TIPOGRAFÍA:
- Display: Fredoka 600 (o Plus Jakarta Sans 800 como fallback)
- Body: Plus Jakarta Sans 500
- Font-family: 'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif

ESTILO VISUAL: flat modern warm, geometrías simples, disciplinado.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", aria-label, <desc>
- Peso < 4 KB cada uno
- Entrega: 2 SVGs en bloques separados, cada uno con comentario
  <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 2 Splash screens iOS (light + dark)
═════════════════════════════════════════════════════════

ARCHIVOS: splash_ios_light.svg · splash_ios_dark.svg
DIMENSIONES: viewBox 0 0 2732 2732 (master — iOS storyboard
escalará)
PRIORIDAD: P0

LAYOUT COMÚN:
- Isotipo Paw Friend centrado verticalmente al 48% (bias arriba)
- Tamaño del isotipo: 512×512
- Wordmark "Paw Friend" debajo del isotipo, gap 120px
  · Font: Fredoka 600, 72px
  · Text-anchor: middle
- Tagline "La ficha médica de tu mascota"
  · Posición: 80px debajo del wordmark
  · Font: Plus Jakarta Sans 500, 28px
  · Text-anchor: middle

ISOTIPO:
Es una pata con 4 pétalos arriba + cuerpo ovalado abajo con un
corazón en negative space en el centro del cuerpo.

───────────────────────────────────────────────────────────
VARIANTE 1: splash_ios_light.svg
───────────────────────────────────────────────────────────

Fondo: gradient radial
  · centro (cx 50% cy 50%) #fef3c7 (gold-100)
  · mid #f3e8ff (brand-100)
  · extremos #ffffff

Isotipo: squircle con gradient #9333ea → #581c87 + pata blanca + corazón negative space

Wordmark "Paw Friend": fill #1a102b (ink)
Tagline: fill #4b3b66 (ink-soft)

───────────────────────────────────────────────────────────
VARIANTE 2: splash_ios_dark.svg
───────────────────────────────────────────────────────────

Fondo: gradient radial
  · centro #581c87
  · extremos #2a1046 (más oscuro)

Isotipo: variante reverse — squircle con gradient gold
  (#9333ea → #d946ef → #eab308), pata blanca, corazón negative space

Wordmark "Paw Friend": fill #ffffff
Tagline: fill rgba(255, 255, 255, 0.8)

───────────────────────────────────────────────────────────

NO USAR:
- Sombras pesadas (iOS splash es estático)
- Animaciones (no se soportan en LaunchScreen.storyboard)
- Textos embedded en el isotipo (el wordmark va afuera)

DEBE VERSE BIEN A:
- iPad Pro 12.9" landscape y portrait
- iPhone 15 Pro Max portrait
- iPhone SE portrait

Entrega: 2 bloques SVG separados.

--- PASTE END ---
```

---

### 1.5. LOGO-05 · Splash screen Android

**Destino:** `public/brand-assets/logo/splash_android.svg` · **Prioridad:** P0 · **Peso:** < 3 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
digital + directorio vets + comunidad; 100% gratis dueños; SpA
SUSAETA GARNHAM SOFTWARE ENGINEERING RUT 78.328.659-9;
pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea main, #581c87 deep
- Gold: #eab308
- Blanco: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', system-ui
- Peso 600

ESTILO: flat modern, paleta brand disciplinada.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 3 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Splash screen Android
═════════════════════════════════════════════════════════

ARCHIVO: splash_android.svg
DIMENSIONES: viewBox 0 0 1920 1920 (master, Android escala)
PRIORIDAD: P0

CONTEXTO ANDROID 12+:
Android soporta Splash Screen API con 3 elementos:
1. windowSplashScreenBackground (color sólido fondo)
2. windowSplashScreenAnimatedIcon (el logo central)
3. windowSplashScreenBrandingImage (opcional brand al pie)

COMPOSICIÓN:
- Background: gradient radial
  · centro cx="50%" cy="50%" #9333ea
  · extremos #581c87
- Icon central: isotipo Paw Friend blanco
  · Tamaño: 180×180 centrado
  · Safe area conservadora (tablets + foldables)
- Wordmark "Paw Friend" debajo del icon:
  · Font Fredoka 600, 48px
  · Color #ffffff
  · Gap 60px bajo el icon
  · text-anchor: middle

NO agregar tagline (Android splash prefiere minimalista + carga
rápida).

TITLE: "Paw Friend Android Splash"
DESC: "Splash screen para Android 12+ con isotipo central y wordmark
sobre fondo brand gradient."

--- PASTE END ---
```

---

### 1.6. LOGO-06 · PWA maskable icon 512×512

**Destino:** `public/brand-assets/logo/pwa_maskable_512.svg` · **Prioridad:** P0 · **Peso:** < 2 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
+ directorio vets + comunidad; SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea (main), #581c87 (deep)
- Blanco: #ffffff puro

ESTILO: flat modern, isotipo pata-corazón.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 2 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: PWA Maskable Icon
═════════════════════════════════════════════════════════

ARCHIVO: pwa_maskable_512.svg
DIMENSIONES: viewBox 0 0 512 512
SAFE ZONE: 256×256 centro (radius 40% del canvas)
PRIORIDAD: P0

CONTEXTO PWA MASKABLE:
La spec PWA "maskable" requiere que el contenido visual esté dentro
de un safe zone circular de radius 40% del canvas. Fuera de eso,
puede ser recortado por la máscara del launcher OS. Es diferente
del adaptive icon de Android — aquí la máscara es adaptiva según
OS (Chrome Android, iOS a casa, Windows, etc.).

COMPOSICIÓN:
- BACKGROUND: color sólido #9333ea (NO gradient — maskable con
  gradient se ve inconsistente al aplicar máscaras de distinto
  color base)
- Isotipo Paw Friend (pata + corazón negative space) blanco centrado
- Tamaño del isotipo: 256×256 (dentro del safe zone)
- NO squircle extra (el launcher agregará su propia máscara)

CLAVE:
Asumir que el launcher puede aplicar:
- Circle (Chrome Android)
- Squircle (iOS)
- Rounded square (Windows)
- Shield (ChromeOS)

Todo debe verse bien en cualquier máscara porque el isotipo está
en el safe zone radius 40%.

TITLE: "Paw Friend PWA Maskable Icon"
DESC: "Maskable icon 512×512 compatible con todas las máscaras
de launcher. Isotipo dentro del safe zone circular."

--- PASTE END ---
```

---

### 1.7. LOGO-07 · Wordmark horizontal dark mode

**Destino:** `public/brand-assets/logo/wordmark_horizontal_darkmode.svg` · **Prioridad:** P1 · **Peso:** < 2 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
+ directorio vets; SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Blanco: #ffffff puro

TIPOGRAFÍA:
- Font-family wordmark: 'Fredoka', 'Plus Jakarta Sans', system-ui
- Peso: 600

ESTILO: flat modern, isotipo pata-corazón.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", aria-label, <desc>
- Peso < 2 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Wordmark horizontal DARK MODE
═════════════════════════════════════════════════════════

ARCHIVO: wordmark_horizontal_darkmode.svg
DIMENSIONES: viewBox 0 0 800 200
PRIORIDAD: P1

CONTEXTO:
Wordmark optimizado para uso sobre fondos oscuros (dark mode, hero
cinematográfico purple, footer black, etc.). Debe ser 100% #ffffff
(no rgba, no tint) para máxima legibilidad.

COMPOSICIÓN:
- Left: isotipo Paw Friend reverse (todo blanco sobre transparente)
  · Size: ~80×80 píxeles dentro del 800×200
  · Posición: vertical center, left-aligned con padding 40px
- Center gap: 20px
- Right: wordmark "Paw Friend"
  · Font: Fredoka 600, 64px
  · Color: #ffffff
  · Baseline aligned con el isotipo

ISOTIPO REVERSE:
- Pata blanca con 4 pétalos arriba + cuerpo ovalado abajo
- Corazón negative space en el cuerpo (deja ver fondo transparente)
- Todo el isotipo en #ffffff puro
- Sin squircle background (esta variante NO tiene el squircle —
  es el símbolo simplificado para overlay)

SAFE AREA: 40px libres alrededor del lockup.

FONDO: completamente transparente.

TITLE: "Paw Friend Wordmark Horizontal Dark Mode"
DESC: "Wordmark oficial para uso sobre fondos oscuros. Isotipo
reverse + Paw Friend en Fredoka 600. Color único blanco puro."

--- PASTE END ---
```

---

### 1.8. LOGO-08 · Wordmark horizontal light mode

**Destino:** `public/brand-assets/logo/wordmark_horizontal_light.svg` · **Prioridad:** P1 · **Peso:** < 2 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
+ directorio vets; SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea main · #581c87 deep
- Ink (texto): #1a102b
- Blanco: #ffffff

TIPOGRAFÍA:
- Wordmark: 'Fredoka', 'Plus Jakarta Sans', system-ui, peso 600

ESTILO: flat modern, isotipo pata-corazón.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 2 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Wordmark horizontal LIGHT MODE (principal)
═════════════════════════════════════════════════════════

ARCHIVO: wordmark_horizontal_light.svg
DIMENSIONES: viewBox 0 0 800 200
PRIORIDAD: P1

COMPOSICIÓN:
- Left: isotipo principal (squircle gradient + pata blanca +
  corazón negative space)
  · Squircle: gradient #9333ea → #581c87
  · Pata + corazón: blanco
  · Size: ~100×100 en 800×200
  · Padding left: 40px
- Gap: 20px
- Right: wordmark "Paw Friend"
  · Font: Fredoka 600, 64px
  · Color: #1a102b (ink)
  · Baseline aligned con el centro del isotipo

SAFE AREA: 40px libres alrededor.

FONDO: transparente (no pintar fondo, el consumidor lo provee).

TITLE: "Paw Friend Wordmark Horizontal Light Mode"
DESC: "Wordmark oficial para fondos claros. Isotipo squircle purple
gradient + Paw Friend en Fredoka 600 ink."

--- PASTE END ---
```

---

## 2. Favicon family

### 2.1. FAV-01 · Favicon master SVG refresh

**Destino:** `public/favicon_v2.svg` · **Prioridad:** P1 · **Peso:** < 1 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
+ directorio vets; SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea (main)
- Deep purple: #7e22ce
- Blanco: #ffffff

ESTILO: flat modern minimal, isotipo simplificado.

REGLAS SVG:
- Vectorial limpio, MUY optimizado
- <title>, role="img", <desc>
- Peso < 1 KB (favicons deben ser mínimos)
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Favicon SVG master
═════════════════════════════════════════════════════════

ARCHIVO: favicon_v2.svg
DIMENSIONES: viewBox 0 0 32 32 (escalable)
PRIORIDAD: P1

CONTEXTO:
Favicon que debe verse legible a 16×16 (Safari tab), 32×32 (Chrome
tab), 48×48 (Firefox tab). A 16×16 cualquier detalle fino se pierde
— por eso esta versión es SIMPLIFICADA respecto al isotipo principal.

SIMPLIFICACIONES vs isotipo principal:
- SIN corazón negative space (a 16×16 no se lee, desperdicia pixels)
- Squircle rx 7 (22% de 32)
- Solo 4 pétalos (dedos) arriba + óvalo palma abajo

COMPOSICIÓN:
- Squircle path 32×32 rx 7 con fill gradient
  · centro #9333ea
  · extremos #7e22ce
- Sobre encima: pata blanca simplificada
  · 4 óvalos pequeños arriba (pétalos/dedos): posiciones ~(8,10),
    (13,7), (19,7), (24,10), tamaño aprox 4×5 cada uno, rotados
    ligeramente
  · 1 óvalo grande centro-abajo (palma): posición (16, 22), tamaño
    10×7

Todo blanco #ffffff, squircle con gradient.

DEBE VERSE BIEN A:
- 16×16 (4 dedos y palma se distinguen)
- 32×32
- 48×48

TITLE: "Paw Friend favicon"
DESC: "Favicon SVG escalable con isotipo simplificado para
legibilidad en tabs de browser."

--- PASTE END ---
```

---

### 2.2. FAV-02 · Apple touch icon 180×180

**Destino:** `public/brand-assets/favicon/apple_touch_icon_v2.svg` · **Prioridad:** P1 · **Peso:** < 2 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
+ directorio vets; SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea (main), #581c87 (deep)
- Blanco: #ffffff

ESTILO: flat modern, isotipo pata-corazón.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 2 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Apple Touch Icon
═════════════════════════════════════════════════════════

ARCHIVO: apple_touch_icon_v2.svg
DIMENSIONES: viewBox 0 0 180 180
PRIORIDAD: P1

CONTEXTO:
Apple Touch Icon es el icon que Safari iOS usa cuando el user hace
"Agregar a pantalla de inicio". Rx 18% en iOS (32px en 180).

COMPOSICIÓN:
- Squircle path 180×180, rx 42 (23%)
- Fill: gradient radial
  · centro #9333ea
  · extremos #581c87
- Isotipo Paw Friend blanco centrado:
  · Pata con 4 pétalos arriba
  · Cuerpo ovalado abajo
  · Corazón negative space en el cuerpo (deja ver gradient)
  · Tamaño 72% del canvas (130×130 centrados)
  · Centrado verticalmente al 55% (bias arriba por óptico del corazón)

NO USAR:
- Sombras internas (iOS 17 no las respeta)
- Filter effects
- Transparencia en el fondo

TITLE: "Paw Friend Apple Touch Icon"
DESC: "Apple Touch Icon 180×180 para Safari iOS home screen shortcut."

--- PASTE END ---
```

---

## 3. Brand squircle icons 41-60

### 3.1. ICN-41 · Food bowl (alimentación)

**Destino:** `public/brand-assets/icons/brand-squircle/41_food_bowl.svg` · **Prioridad:** P1 · **Peso:** < 1.5 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
+ directorio vets + comunidad). Paleta brand: purple #9333ea + gold
#eab308. SpA RUT 78.328.659-9, pawfriend.cl.

ESTILO: flat modern con microdetalles warm. Squircle iOS viewBox
200×200 rx 40 como geometría brand oficial. Contenido blanco sobre
el squircle color.

REGLAS SVG:
- Vectorial limpio, paths simples
- <title>, role="img", aria-label, <desc>
- Peso < 1.5 KB
- Sin texto embedded
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Icon brand squircle 41 · Food bowl (alimentación)
═════════════════════════════════════════════════════════

ARCHIVO: 41_food_bowl.svg
DIMENSIONES: viewBox 0 0 200 200, rx 40
PRIORIDAD: P1

CONCEPTO: Ícono "comida y nutrición de la mascota".

COMPOSICIÓN:
- Squircle 200×200 rx 40 con fill #9333ea (brand-600)
- Bowl visto de 3/4 (perspectiva ligera):
  · Disco superior: elipse aplastada (rx 50, ry 10) centrada en
    (100, 100), fill blanco
  · Cuerpo del bowl: trapecio invertido (más ancho arriba, más
    angosto abajo), alineado bajo el disco, fill blanco opacity 0.9
  · Altura del bowl: ~50px
- 3 kibbles (croquetas) redondeadas saliendo del bowl:
  · Círculos blancos pequeños (~10-12px diámetro) posicionados
    sobre el borde del disco
  · Posiciones: uno a la izquierda, uno centro-arriba, uno derecha
- 1 chispita gold #eab308 arriba-derecha (detalle warm):
  · Estrella 4 puntas pequeña (8×8)

TITLE: "Comida y nutrición"
DESC: "Bowl de comida con croquetas. Ícono brand squircle 41 para
features de alimentación en Paw Friend."

--- PASTE END ---
```

---

### 3.2. ICN-42 · Play / juguete

**Destino:** `public/brand-assets/icons/brand-squircle/42_play_toy.svg` · **Prioridad:** P1 · **Peso:** < 1.5 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
+ directorio vets + comunidad). Paleta: #9333ea (brand) + #a855f7
(mid) + #eab308 (gold). SpA RUT 78.328.659-9, pawfriend.cl.

ESTILO: flat modern, squircle iOS viewBox 200×200 rx 40, contenido
blanco.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 1.5 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Icon 42 · Play / juego / paseo
═════════════════════════════════════════════════════════

ARCHIVO: 42_play_toy.svg
DIMENSIONES: viewBox 0 0 200 200, rx 40

COMPOSICIÓN:
- Squircle 200×200 rx 40 con gradient linear 135°
  #9333ea (top-left) → #a855f7 (bottom-right)
- Pelota de tennis estilizada centro:
  · Círculo blanco radio 50 en (100, 100)
  · Costura "U" curva atravesando: path "M 55 100 Q 100 70 145 100"
    y "M 55 100 Q 100 130 145 100", stroke blanco opacity 0.75 width 4
- 2 estrellitas gold #eab308 alrededor:
  · 4 puntas pequeñas tamaño 12
  · Posiciones: (40, 50) y (165, 150)

TITLE: "Juego y paseo"
DESC: "Pelota de tennis con movimiento. Ícono 42 para actividad
lúdica y paseo."

--- PASTE END ---
```

---

### 3.3-3.10. ICN-43 a ICN-50 (lote mini)

Para producir los íconos 43 a 50 rápido, usa este prompt con una especificación por icono. Cada uno va en bloque SVG separado.

```
--- PASTE START ---

Necesito 8 SVGs oficiales para Paw Friend (app chilena: ficha médica
+ directorio vets + comunidad; SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND (estricto):
- Purple: #9333ea main, #a855f7 mid, #581c87 deep
- Gold: #eab308, #f59e0b
- Emerald: #10b981, #047857
- Rose: #ec4899, #be185d
- Rojo: #dc2626
- Blanco: #ffffff

ESTILO: flat modern, squircle iOS viewBox 200×200 rx 40, contenido
blanco con acento gold donde se especifica.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc> cada uno
- Peso < 1.5 KB cada uno
- Entrega: 8 bloques SVG separados, cada uno con comentario
  <!-- NN_nombre.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 8 íconos brand squircle (ICN-43 a ICN-50)
═════════════════════════════════════════════════════════

Para cada uno: squircle 200×200 rx 40, fill según indicación,
contenido blanco centrado.

───────────────────────────────────────────────────────────

43_leash.svg — "Correa / ID tag"
Fill squircle: #10b981 (emerald, audience partners)
Contenido blanco: clip metálico de correa arriba + correa curvada
cayendo en S + ID tag circular colgando abajo con corazón grabado
pequeño en el centro

44_weight_track.svg — "Seguimiento de peso"
Fill squircle: #9333ea
Contenido blanco: balanza digital estilizada (plataforma redondeada
+ display rectangular digital arriba) + silueta pequeña de pata sobre
la plataforma. Detalle: flecha gold #eab308 arriba-derecha apuntando
hacia arriba (trending up)

45_pill_dispenser.svg — "Medicación diaria"
Fill squircle: #ec4899 (rose, voices)
Contenido blanco: pastillero organizador 7 días (grid 3x3 con 2
celdas vacías en última fila simulando Mon-Sun). Cada celda es un
cuadrado pequeño con leve rounded. Pastillas adentro: círculos
pequeños de colores (2 en purple mid, 1 en gold, 2 en emerald para
simular variedad) solo en algunas celdas

46_grooming.svg — "Aseo / peluquería"
Fill squircle: #9333ea
Contenido blanco: tijeras de peluquería estilizadas (2 hojas cruzadas
en X abriendo) + peine pequeño cruzando en diagonal + 3 burbujitas
gotas de agua alrededor (círculos pequeños opacity 0.8)

47_training.svg — "Entrenamiento / educación"
Fill squircle: gradient 135° #047857 → #10b981 (audience partners)
Contenido blanco: gorra de graduación (birrete) con borla caída +
una pata pequeña dentro del birrete (como si la mascota graduara) +
trofeo pequeño gold #eab308 al costado inferior derecho

48_home_base.svg — "Casa de la mascota"
Fill squircle: #9333ea
Contenido blanco: casita de mascota con techo a dos aguas + entrada
circular (como casa estilo arco) + una pata asomando por la ventana
redonda central + corazón pequeño gold #eab308 flotando sobre el
techo

49_heart_monitoring.svg — "Monitoreo cardíaco / signos vitales"
Fill squircle: #10b981 (emerald)
Contenido blanco: corazón estilizado (lado izquierdo) + línea de
pulso electrocardiograma saliendo hacia la derecha con 3 picos + 1
chispita de vida al final. Todo en blanco

50_community.svg — "Comunidad de tutores"
Fill squircle: #9333ea
Contenido blanco: 3 círculos/avatares estilizados solapados
(simulando 3 personas juntas), alineados en triángulo, con una pata
pequeña en el centro uniéndolos. 2 corazones pequeños tonales flotando
(uno rose, uno gold) alrededor

───────────────────────────────────────────────────────────

Cada SVG: <title> corto (Comida, Seguimiento peso, etc.), <desc>
describiendo el uso en Paw Friend.

Entrega 8 bloques SVG.

--- PASTE END ---
```

---

## 4. Illustrations

### 4.1. ILL-01 · Vet consultation hero

**Destino:** `public/brand-assets/illustrations/hero/vet_consultation.svg` · **Prioridad:** P1 · **Peso:** < 20 KB

```
--- PASTE START ---

Necesito un SVG oficial ilustración hero para Paw Friend (app
chilena: ficha médica + directorio vets + comunidad). Paleta brand:
purple #9333ea + gold #eab308. SpA RUT 78.328.659-9, pawfriend.cl.

PALETA BRAND (estricto):
- Purple: #faf5ff · #f3e8ff · #9333ea · #7e22ce · #581c87
- Gold: #fef3c7 · #fbbf24 · #f59e0b · #eab308
- Emerald: #10b981 · #047857 · #ecfdf5 (para scrubs vet)
- Ink: #1a102b (outlines sutiles)
- Paper: #faf7ff

ESTILO VISUAL: flat modern warm con microdetalles. Geometrías
simples, bordes redondeados. NO hiperrealismo, NO Material puro, NO
cartoon adorable. Sí warm chileno realista estilizado.

REGLAS SVG:
- Vectorial limpio, paths simples
- <title>, role="img", <desc>
- Peso < 20 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Ilustración hero "Consulta veterinaria"
═════════════════════════════════════════════════════════

ARCHIVO: vet_consultation.svg
DIMENSIONES: viewBox 0 0 800 600
PRIORIDAD: P1

CONTEXTO:
Hero para sección "Para veterinarios" del landing + pitch decks que
hablan al target B2B vet. Debe transmitir "trabajo profesional serio
pero cálido".

ESCENA:
Consultorio veterinario moderno chileno, luz natural suave.

ELEMENTOS:
1. FONDO:
   - Gradient radial warm: centro cx=40% cy=35% #fef3c7 (gold-100)
     → extremos #f3e8ff (brand-100)
   - Sutil pattern paw dots opacity 0.05 decorativo en esquinas

2. FIGURA DE VET (centro-izquierda):
   - Silueta estilizada de un veterinario (puede ser mujer — hay
     variedad en el mundo vet chileno)
   - Uniforme scrubs color #10b981 (emerald)
   - Estetoscopio colgando al cuello (curva en U sobre los hombros,
     campana en el pecho)
   - Cabello corto o recogido, color neutro
   - Rostro SIN detalle realista (solo forma de la cabeza — estilo
     flat abstracto)
   - Pose: de pie, manos en cintura o brazos relajados

3. MESA DE EXPLORACIÓN (primer plano derecha):
   - Superficie plana con leve perspectiva (hacia el vet)
   - Color #faf7ff (paper) con borde ink sutil
   - Patas metálicas simples al pie

4. PATA DE MASCOTA apoyada en la mesa:
   - Solo la pata (no el cuerpo completo — foco en "el trabajo del
     vet sin mascota protagonista")
   - Color gris claro (pelaje)
   - Almohadillas rosadas tenues

5. TABLET PAW FRIEND (primer plano, sobre la mesa):
   - Tablet estilizado en perspectiva
   - Pantalla mostrando ficha mockup: header #9333ea + 2 rows de
     info tenue
   - Bezel del tablet: negro sutil

6. PARED FONDO (detrás del vet):
   - Diploma enmarcado pequeño
     · Marco gold #eab308 thin
     · Interior blanco con 2 líneas tenues simulando texto
   - 1 planta pequeña en maceta (detalle chileno)

7. ILUMINACIÓN SUGERIDA (lado izquierdo):
   - Highlight warm blanco opacity 0.15 en la silueta del vet
     (lighting hint sutil)

COMPOSICIÓN:
- Vet ocupa ~35% del ancho, centrada verticalmente
- Mesa + pata + tablet: ~40% del ancho derecha
- Pared con diploma: fondo 10%
- Espacio superior libre ~20% (para copy sobre la ilustración)

NO USAR:
- Fotorrealismo
- Sombras pesadas
- Logos de marcas que no sean Paw Friend
- Texto embedded

TITLE: "Consulta veterinaria con Paw Friend"
DESC: "Hero para sección B2B vets. Consultorio con vet en scrubs
emerald atendiendo mascota mientras consulta tablet Paw Friend."

--- PASTE END ---
```

---

### 4.2-4.9. Empty states + onboarding + feature (resumen)

Para no duplicar contexto, este prompt genera **6 empty states adicionales** en un solo batch:

```
--- PASTE START ---

Necesito 6 SVG illustrations para empty states de Paw Friend
(app chilena: ficha médica + directorio vets + comunidad;
SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea · #a855f7 · #faf5ff · #f3e8ff
- Gold: #fef3c7 · #fbbf24 · #eab308
- Emerald: #10b981 · #ecfdf5
- Rose: #ec4899 · #fdf2f8
- Ink: #1a102b · ink-soft #4b3b66

ESTILO: flat modern warm. Cada illustration 400×300 viewBox.
Background gradient suave tonal según tema. Objetos estilizados
simples con microdetalles (estrellitas gold, corazones tenues).
Amigables pero no cartoon adorable.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc> cada una
- Peso < 8 KB cada una
- Entrega: 6 bloques SVG separados, cada uno con
  <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 6 Empty State illustrations
═════════════════════════════════════════════════════════

───────────────────────────────────────────────────────────

1) no_conversations.svg — "Sin conversaciones aún"
   viewBox 400×300
   Fondo gradient: #fdf2f8 → #f3e8ff (rose → brand soft)
   Elementos:
   - 2 burbujas de chat face-to-face vacías (sin texto adentro)
     · Una purple #9333ea, forma bubble con apéndice hacia derecha
     · Una rose #ec4899, bubble apéndice hacia izquierda, más chica
     · Posicionadas mirando entre sí con gap 40px
   - Líneas punteadas conectándolas (dashed, opacity 0.3, sugiere
     "conversación por iniciar")
   - Silueta estilizada de gato en esquina inferior derecha
     observando (muy small, detalle warm)
   - 2 sparkles gold pequeñas arriba

2) no_appointments.svg — "Sin citas hoy · todo tranquilo"
   viewBox 400×300
   Fondo gradient: #fef3c7 → #ecfdf5 (gold → emerald soft)
   Elementos:
   - Calendario estilizado con corners rounded
     · Página mostrando día actual grande con checkmark emerald
     · 3 zzz tipo sueño saliendo del día (gradual fade)
   - Pata relajada descansando sobre el calendario (un extremo)
   - 2 estrellitas gold decorativas flotando

3) no_medical_records.svg — "Sin registros médicos aún"
   viewBox 400×300
   Fondo gradient: #faf5ff → #f3e8ff (purple soft)
   Elementos:
   - Carpeta medical abierta (folder icon grande purple)
   - Papel saliendo de la carpeta, en blanco esperando primera
     entrada, con 1 línea tenue horizontal como hint
   - Lápiz gold #eab308 apoyado al costado
   - Pequeño ícono de pata + corazón combinados en el corner
   - Sparkles gold alrededor

4) no_bookings.svg — "No tienes reservas"
   viewBox 400×300
   Fondo gradient: #ecfdf5 → #faf5ff (emerald → purple soft)
   Elementos:
   - Agenda estilizada con páginas abiertas
   - Reloj pequeño arriba-izquierda apuntando a la hora
   - Stethoscope flat emerald cruzando diagonal detrás
   - "Hueco" vacío en el centro dashed (indicador sin cita)
   - Estrella gold

5) no_notifications.svg — "Todo al día · sin notificaciones"
   viewBox 400×300
   Fondo gradient: #fef3c7 → #faf5ff
   Elementos:
   - Campana grande estilizada purple con leaves decorativos
   - Checkmark emerald grande sobre la campana
   - Ambiente tranquilo, 2 zzz
   - Ondas de sonido dormidas (dashed opacity baja)

6) no_paw_cards.svg — "No has creado Paw Cards aún"
   viewBox 400×300
   Fondo gradient: #f3e8ff → #fdf2f8
   Elementos:
   - 3 tarjetas de colección apiladas en abanico
     · Cada una con frame purple pero contenido vacío (silueta de
       pata en el centro, mono blanco tenue)
     · La del frente dashed, sugiriendo "esperando ser creada"
   - Sparkles gold alrededor
   - Pequeño "?" amigable en el corner de la carta frontal

───────────────────────────────────────────────────────────

Para cada SVG:
- <title>: corto y claro
- <desc>: "Empty state ilustración para [contexto] en Paw Friend"
- Mantener consistencia estilística con la serie (flat modern,
  microdetalles warm, paleta tonal)

Entrega 6 bloques SVG separados.

--- PASTE END ---
```

---

## 5. Device mockups

### 5.1. MCK-01 · Samsung Galaxy S24 Ultra portrait

**Destino:** `public/brand-assets/mockups/devices/samsung_s24_ultra_portrait.svg` · **Prioridad:** P1 · **Peso:** < 3 KB

```
--- PASTE START ---

Necesito un SVG mockup vectorial para Paw Friend (app chilena;
pawfriend.cl).

PALETA (mockup device specific):
- Titanium gray body: #6b6b74
- Titanium highlights: #8a8a95
- Ink (bezels, camera): #1a1a22
- Screen placeholder bg: #faf5ff
- Screen placeholder stroke: #9333ea dashed

ESTILO: flat modern clean mockup vectorial. Preciso tipo Figma asset.

REGLAS SVG:
- Vectorial, paths simples
- <title>, role="img", <desc>
- Peso < 3 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Samsung Galaxy S24 Ultra portrait mockup
═════════════════════════════════════════════════════════

ARCHIVO: samsung_s24_ultra_portrait.svg
DIMENSIONES: viewBox 0 0 600 1260
PRIORIDAD: P1

COMPOSICIÓN:
1) Body outer (rounded rect)
   - x=30 y=30 width=540 height=1200 rx=44 (menos rounded que iPhone)
   - Fill: gradient vertical #8a8a95 → #6b6b74 → #5c5c64
   - Subtle inner highlight stroke con lighter tone arriba

2) Screen bezel frame (inner)
   - x=50 y=50 width=500 height=1160 rx=34
   - Fill: #0a0a0e (black deep)

3) Screen content placeholder
   - x=52 y=52 width=496 height=1156 rx=32
   - Fill: #faf5ff (paper)
   - Stroke: #9333ea width=2 dasharray="8,6" opacity=0.8
   - Texto centro (dentro del placeholder):
     · "SCREENSHOT AQUÍ" fill #9333ea font-weight 800
       letter-spacing 5 size 18
     · "1440 × 3120 · S24 Ultra" fill #9333ea opacity 0.7 size 14

4) Punch-hole camera (centered top)
   - cx=300 cy=88 r=9 fill=#0a0a0e
   - Inner highlight: cx=300 cy=86 r=4 fill=#1a1a22

5) Camera array trasero (izquierda superior, hint en el body)
   - 3 círculos stacked verticalmente (rings cameras)
     · (78, 100) r=10
     · (78, 130) r=10
     · (78, 160) r=7
   - Cada uno fill=#1a1a22 con ring outer #3a3a45

6) Side buttons (right)
   - Power button: x=566 y=260 width=4 height=70 rx=2 fill=#3a3a45
   - Volume rocker: x=566 y=350 width=4 height=110 rx=2 fill=#3a3a45

7) S-Pen slot hint (bottom)
   - Rectángulo sutil en el borde inferior derecho
     · x=470 y=1220 width=40 height=6 rx=3 fill=#3a3a45 opacity=0.6

8) Ground shadow
   - Ellipse cx=300 cy=1245 rx=260 ry=8 fill=#000 opacity=0.25

TITLE: "Samsung Galaxy S24 Ultra portrait mockup"
DESC: "Mockup vectorial Samsung S24 Ultra titanium gray para uso en
marketing y landing de Paw Friend."

--- PASTE END ---
```

---

## 6. Instagram

### 6.1. IG-01 · Feed Milestone

**Destino:** `public/brand-assets/social/instagram/feed_milestone.svg` · **Prioridad:** P1 · **Peso:** < 15 KB

```
--- PASTE START ---

Necesito un SVG oficial template Instagram Feed para Paw Friend
(app chilena: ficha médica + directorio vets + comunidad).

PALETA BRAND (estricto):
- Purple: #9333ea main, #581c87 deep, #a855f7 mid
- Gold: #eab308 main, #fde68a light, #f59e0b
- Rose/fuchsia (accent): #ec4899, #d946ef
- Ink: #1a102b, #2a1046
- Paper: #faf7ff
- Blanco: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif
- Body: 'Plus Jakarta Sans', system-ui, sans-serif
- Mono (números tabulares): 'JetBrains Mono', ui-monospace

ESTILO: flat modern cinematográfico. Gradients radiales warm.
Microdetalles (sparkles, dots decorativos).

REGLAS SVG:
- Vectorial limpio con gradients y texto embedded (IG sí tiene
  texto en posts)
- <title>, role="img", <desc>
- Peso < 15 KB
- Font-family en <text>: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: IG Feed template · Milestone / Stat highlight
═════════════════════════════════════════════════════════

ARCHIVO: feed_milestone.svg
DIMENSIONES: viewBox 0 0 1080 1080 (IG feed square)
PRIORIDAD: P1

CONCEPTO:
Template para anunciar milestones: "1000 mascotas registradas",
"primera clínica partner", "10 refugios ayudados", etc. Editable
por variables.

COMPOSICIÓN:

1) FONDO (full canvas):
   - Gradient radial cinematográfico:
     · centro cx=50% cy=45% #581c87 (brand-900)
     · mid #9333ea (brand-600)
     · extremos #2a1046 (deep)
   - Segundo gradient radial encima centro:
     · centro #eab308 opacity=0.3 r=30%
     · extremos #eab308 opacity=0 r=60%
     (crea glow gold sutil en el centro)

2) STAR DUST decorativo (scattered):
   - 12 pequeños círculos blancos rgba(255,255,255,0.15) de tamaño
     2-4px scattered en todo el canvas

3) EYEBROW TOP (y=160):
   - Rectángulo rounded pill centered
     · x=440 y=130 width=200 height=60 rx=30
     · fill rgba(255,255,255,0.12) stroke rgba(255,255,255,0.25)
       width=2
   - Texto "MILESTONE" centrado
     · Font Jakarta 800, size 22, letter-spacing 8
     · fill #fde68a (gold-200)

4) NÚMERO HERO GIGANTE (centro):
   - Text centrado en (540, 580)
   - Font Fredoka 700, size 240, text-anchor middle
   - Fill: gradient linear 135° #fff → #fde68a → #eab308
   - Letter-spacing -10 (números grandes se leen mejor apretados)
   - Contenido placeholder editable: "1.000"

5) SUB CAPTION (y=720):
   - Text centrado, 2 líneas
   - Font Fredoka 500, size 44
   - Fill #ffffff
   - Línea 1: "mascotas registradas"
   - Línea 2 (y=780): "en 30 días"

6) SPARKLES GOLD scattered:
   - 5 estrellas 4-puntas de tamaño 14-20
   - Color #eab308
   - Posiciones: (120, 350), (960, 380), (200, 820), (880, 860),
     (540, 160)

7) BRAND WATERMARK bottom:
   - Rectángulo pill blanco x=400 y=1000 w=280 h=50 rx=25
   - Texto "@PAWFRIEND.CL" centrado, Jakarta 800, size 18,
     letter-spacing 4, fill #9333ea

NO INCLUIR:
- Emojis en el texto (solo SVG shapes)
- Logos external (Instagram logo queda implícito porque es un
  template IG)

TITLE: "Paw Friend IG Feed Milestone"
DESC: "Template IG feed 1080×1080 para anunciar milestones. Número
hero editable con gradient gold y caption below."

--- PASTE END ---
```

---

### 6.2. IG-02 · Story BTS (Behind the Scenes)

**Destino:** `public/brand-assets/social/instagram/story_bts.svg` · **Prioridad:** P2 · **Peso:** < 15 KB

```
--- PASTE START ---

Necesito un SVG oficial template Instagram Story para Paw Friend
(app chilena: ficha médica + directorio vets + comunidad).

PALETA BRAND:
- Purple: #9333ea, #581c87, #a855f7
- Gold: #eab308, #fde68a
- Rose: #ec4899, #be185d
- Paper: #faf7ff
- Blanco: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 15 KB
- IG Story safe zones:
  · Top 220px reservado (username bar UI de IG)
  · Bottom 250px reservado (reactions + reply bar UI)
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: IG Story template · Behind the Scenes
═════════════════════════════════════════════════════════

ARCHIVO: story_bts.svg
DIMENSIONES: viewBox 0 0 1080 1920
PRIORIDAD: P2

CONCEPTO:
Story para mostrar día a día del founder / desarrollo del producto.
Estilo polaroid + caption abajo.

COMPOSICIÓN:

1) FONDO:
   - Gradient vertical #2a1046 (top) → #581c87 → #9333ea (bottom)
   - Sparkles blancas decorativas opacity 0.1 scattered

2) SAFE ZONE GUIDES (invisibles en export, solo para referencia):
   - Línea horizontal en y=220 dashed invisible
   - Línea horizontal en y=1670 dashed invisible

3) POLAROID FRAME (area hero, centrada):
   - Background card blanco
     · x=90 y=400 width=900 height=1000 rx=20
     · fill #ffffff
     · Sombra sutil stroke rgba(0,0,0,0.1)
   - Placeholder image area (dentro del polaroid):
     · x=120 y=430 width=840 height=840 rx=12
     · fill #f3e8ff (brand-100)
     · stroke #9333ea dasharray="10,8" opacity=0.5
     · Texto centro "FOTO AQUÍ" Fredoka 500 size 42 fill #9333ea
       opacity=0.6
   - Caption polaroid (abajo del placeholder):
     · x=120 y=1310 width=840 height=70
     · Text "Un día en la vida de Paw Founder" centrado
     · Font Fredoka 500 italic, size 32, fill #1a102b

4) TOP EYEBROW (dentro de safe zone, y=320):
   - Rectángulo pill x=420 y=290 w=240 h=50 rx=25
     fill rgba(255,255,255,0.15) stroke rgba(255,255,255,0.3)
   - Texto "BEHIND THE SCENES" centrado, Jakarta 800 size 18,
     letter-spacing 5, fill #fde68a

5) CAPTION STICKER BLANCO (debajo del polaroid):
   - Rectángulo rounded con sombra
     · x=140 y=1430 width=800 height=140 rx=30 fill #ffffff
     · drop-shadow sutil
   - Texto 2 líneas centrado:
     · Línea 1: "Así construimos Paw Friend" Fredoka 600 size 44
       fill #1a102b
     · Línea 2: "—con amor, desde Chile" Fredoka 500 italic size 28
       fill #9333ea

6) SWIPE UP HINT (dentro safe zone, y=1580):
   - Texto "pawfriend.cl" centrado Jakarta 700 size 26
     fill rgba(255,255,255,0.85) letter-spacing 3
   - Flecha ↓ debajo: path SVG centrado size 30 blanco

7) BRAND WATERMARK bottom corner:
   - "@PAWFRIEND.CL" bottom-right, Jakarta 800 size 16
     letter-spacing 4 fill rgba(255,255,255,0.65)

TITLE: "Paw Friend IG Story BTS"
DESC: "Template IG Story portrait para Behind the Scenes. Polaroid
con imagen placeholder + caption emocional + brand footer."

--- PASTE END ---
```

---

## 7. Facebook

### 7.1. FB-01 · Cover desktop + mobile safe

**Destino:** `public/brand-assets/social/facebook/cover.svg` · **Prioridad:** P2 · **Peso:** < 15 KB

```
--- PASTE START ---

Necesito un SVG oficial cover de Facebook Page para Paw Friend (app
chilena: ficha médica + directorio vets + comunidad; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea, #581c87, #a855f7
- Gold: #eab308, #fde68a
- Paper: #faf7ff, #fff
- Ink: #1a102b

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif

REGLAS SVG:
- Vectorial limpio con texto embedded
- <title>, role="img", <desc>
- Peso < 15 KB
- FB Safe zone CENTER 820×312 (lo que se ve en mobile thumbnails)
- Todo lo importante va en el safe zone
- Edges pueden ser decorativos (se cropean en mobile)
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: FB Cover (desktop + mobile safe)
═════════════════════════════════════════════════════════

ARCHIVO: cover.svg
DIMENSIONES: viewBox 0 0 1640 664
PRIORIDAD: P2

LAYOUT:
El safe zone es el centro 820×312 (x=410 y=176 w=820 h=312).
TODO el contenido crítico cabe ahí. Los edges son decorativos.

───────────────────────────────────────────────────────────
1) FONDO (full canvas 1640×664):
   - Gradient radial cinematográfico
     · centro cx=50% cy=50% #9333ea (brand-600)
     · mid #581c87 (brand-900)
     · extremos #2a1046
   - Segundo gradient radial overlay:
     · centro cx=85% cy=30% #eab308 opacity=0.25
     · extremos opacity=0 (gold glow esquina derecha)

2) PATTERN DECORATIVO (esquinas, fuera del safe zone):
   - Sparkles/dots dispersos opacity 0.08
   - No importan si se cropean en mobile

3) SAFE ZONE CONTENT (x=410 y=176 w=820 h=312):

   a) Logo Paw Friend left:
      - Squircle 100×100 (gradient purple) + pata blanca
      - Posición: x=440 y=230
      - Con corazón negative space

   b) Headline center:
      - "La ficha médica de tu mascota"
      - Posición: x=575 y=280
      - Font Fredoka 600 size 48 fill #ffffff
      - tracking -.02em

   c) Sub:
      - "Hecha en Chile · gratis para siempre"
      - Posición: x=575 y=335
      - Font Jakarta 500 size 22 fill rgba(255,255,255,0.85)

   d) CTA button right:
      - Pill x=1040 y=270 w=190 h=56 rx=28
      - fill #ffffff
      - Text "Descarga la app →" centrado Jakarta 800 size 18
        fill #9333ea

4) EDGES DECORATIVOS (fuera del safe zone):
   - Paw silhouettes big purple-to-transparent en corners
   - 2 gold stars opacity 0.6

TITLE: "Paw Friend Facebook Cover"
DESC: "Cover de FB Page. Safe zone centered con logo, headline,
sub y CTA. Edges con decorative brand pattern que se cropea en
mobile."

--- PASTE END ---
```

---

## 8. WhatsApp Business

### 8.1. WA-01 · Profile picture 640×640

**Destino:** `public/brand-assets/social/whatsapp/profile.svg` · **Prioridad:** P1 · **Peso:** < 2 KB

```
--- PASTE START ---

Necesito un SVG oficial profile picture WhatsApp Business para Paw
Friend (app chilena: ficha médica + directorio vets + comunidad;
pawfriend.cl; SpA RUT 78.328.659-9).

PALETA BRAND:
- Purple: #9333ea main, #581c87 deep
- Blanco: #ffffff puro

ESTILO: flat modern, isotipo pata-corazón sobre gradient brand.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 2 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: WhatsApp Business profile picture
═════════════════════════════════════════════════════════

ARCHIVO: profile.svg
DIMENSIONES: viewBox 0 0 640 640 (circle crop)
PRIORIDAD: P1

CONTEXTO WA:
WhatsApp Business profile pic se muestra circle crop. Lo que esté
fuera del círculo inscrito en el cuadrado 640×640 se pierde.

COMPOSICIÓN:
1) Background (full canvas):
   - Gradient radial
     · centro cx=50% cy=40% #9333ea
     · extremos #581c87
   - Fill 100% del canvas (sin transparencia)

2) Isotipo Paw Friend blanco centrado:
   - Pata con 4 pétalos arriba + cuerpo ovalado abajo + corazón
     negative space en el cuerpo
   - Tamaño: 65% del canvas (416×416)
   - Centrado verticalmente al 55% (bias arriba para compensar
     óptico del corazón)

NO INCLUIR:
- Wordmark "Paw Friend" (no cabe legible en el circle crop pequeño)
- Gradient en el isotipo (mantener blanco puro para contraste)
- Sombras

DEBE VERSE BIEN:
- En chat list pequeño (48×48 render)
- En profile header (200×200)
- En info modal (640×640)

TITLE: "Paw Friend WhatsApp Business Profile"
DESC: "Profile picture 640×640 circle-safe para WhatsApp Business.
Isotipo Paw Friend sobre gradient brand purple."

--- PASTE END ---
```

---

### 8.2. WA-02 · Catalog cards (4 productos)

```
--- PASTE START ---

Necesito 4 SVG oficiales catalog product cards para WhatsApp Business
de Paw Friend (app chilena: ficha médica + directorio vets +
comunidad).

PALETA BRAND (estricto):
- Purple: #9333ea main, #581c87 deep
- Gold: #eab308, #fde68a, #b45309
- Emerald: #10b981, #047857
- Rose: #ec4899, #be185d
- Ink: #1a102b, #4b3b66
- Paper: #faf7ff, #fff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif

REGLAS SVG:
- Vectorial limpio con texto embedded
- <title>, role="img", <desc> cada uno
- Peso < 12 KB cada uno
- Entrega: 4 bloques SVG separados con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 4 WhatsApp Business Catalog cards
═════════════════════════════════════════════════════════

CONTEXTO:
WhatsApp Business tiene un Catalog feature donde cada producto se
muestra como card 1:1 (1080×1080). Aquí los "productos" son opciones
del ecosistema Paw Friend. Layout común para las 4:
- Header top: brand badge (logo + "Paw Friend" wordmark)
- Price tag top-right
- Hero visual center (mockup del producto/concepto)
- Title + desc mid
- CTA button bottom

───────────────────────────────────────────────────────────
LAYOUT COMÚN 1080×1080:
───────────────────────────────────────────────────────────

- Fondo: gradient linear 135°
- Header badge pill (x=60 y=80 w=260 h=64 rx=32)
  · Logo Paw Friend izquierda 36×36
  · Wordmark "Paw Friend" al lado, Jakarta 800 size 18
- Price badge top-right pill
- Hero area centro (x=140 y=220 w=800 h=520 rx=40 fill #fff)
- Title hero (y=830 centrado, Fredoka 600 size 62)
- Sub (y=900 centrado, Jakarta 500 size 28)
- CTA pill (x=290 y=960 w=500 h=80 rx=40)

───────────────────────────────────────────────────────────

1) directorio.svg — "Directorio de veterinarios"
   Fondo: #ecfdf5 → #f3e8ff
   Price badge: "GRATIS" fill #10b981 text #ffffff
   Hero: mapa estilizado con 3 pins de vet (emerald, purple, gold)
   sobre grilla de calles. Pin central destacado con ring dorado.
   Title: "Directorio de vets"
   Sub: "Encuentra el tuyo por comuna."
   CTA: "Ver cerca de mí →" fill #10b981 text #ffffff

2) paw_member.svg — "Paw Member"
   Fondo: #fef3c7 → #faf5ff
   Price badge: "$3.990/mes" fill #eab308 text #b45309
   Hero: Badge Paw Member gold-gradient centrado grande (200×200)
   con corazón + pata blanca + "MEMBER" letter-spacing
   Title: "Paw Member"
   Sub: "Tu badge que sostiene el proyecto."
   CTA: "Sostener →" fill gradient purple-gold text #ffffff

3) paw_company.svg — "Paw Companys"
   Fondo: #f3e8ff → #fdf2f8
   Price badge: "desde $49.900" fill #9333ea text #ffffff
   Hero: Badge Paw Company purple-gradient con edificio blanco +
   3 dots (bronze/silver/gold) + "COMPANY"
   Title: "Paw Companys"
   Sub: "Tu empresa, sponsor oficial."
   CTA: "Conversemos →" fill #9333ea text #ffffff

4) paw_voice.svg — "Paw Voices"
   Fondo: #fdf2f8 → #faf5ff
   Price badge: "$0" fill #ec4899 text #ffffff
   Hero: Badge Paw Voice rose-gradient con micrófono blanco +
   "VOICE" letter-spacing
   Title: "Paw Voices"
   Sub: "Creadores peludos amplificando."
   CTA: "Aplicar →" fill #ec4899 text #ffffff

───────────────────────────────────────────────────────────

Cada SVG tiene layout idéntico, solo cambian colores, badges y
contenido hero. Coherencia visual entre las 4.

Entrega 4 bloques SVG separados.

--- PASTE END ---
```

---

## 9. TikTok

### 9.1. TT-01 · Profile avatar

```
--- PASTE START ---

Necesito un SVG oficial profile avatar TikTok para Paw Friend (app
chilena: ficha médica + directorio vets; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea, #581c87
- Blanco: #ffffff

ESTILO: flat modern, isotipo pata-corazón.

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 1 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: TikTok Profile Avatar
═════════════════════════════════════════════════════════

ARCHIVO: profile.svg
DIMENSIONES: viewBox 0 0 200 200 (circle crop)
PRIORIDAD: P1

COMPOSICIÓN:
- Background: gradient radial #9333ea centro → #581c87 extremos
- Isotipo Paw Friend blanco centrado (pata + corazón negative space),
  tamaño 70% del canvas (140×140 centered)

Simplificado para legibilidad a 40×40 (feed TikTok).

TITLE: "Paw Friend TikTok Avatar"
DESC: "Profile avatar 200×200 circle-safe para TikTok. Isotipo sobre
gradient brand."

--- PASTE END ---
```

---

## 10. YouTube

### 10.1. YT-01 · Channel banner

```
--- PASTE START ---

Necesito un SVG oficial YouTube channel banner para Paw Friend
(app chilena: ficha médica digital + directorio vets + comunidad;
pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea, #581c87, #2a1046
- Gold: #eab308, #fde68a
- Paper/white: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif

REGLAS SVG:
- Vectorial limpio con text embedded
- <title>, role="img", <desc>
- Peso < 20 KB
- YouTube SAFE ZONE: centro 1546×423 (lo que se ve en TV/desktop/
  mobile). El resto de los 2560×1440 solo se ve en desktop grande.
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: YouTube Channel Banner
═════════════════════════════════════════════════════════

ARCHIVO: channel_banner.svg
DIMENSIONES: viewBox 0 0 2560 1440
SAFE ZONE: x=507 y=508 w=1546 h=423 (TV/desktop/mobile safe)
PRIORIDAD: P2

LAYOUT:

1) FONDO (full canvas 2560×1440):
   - Gradient cinematográfico
     · centro cx=50% cy=50% #9333ea
     · mid #581c87
     · extremos #2a1046
   - Gold glow radial overlay top-right
     · centro cx=80% cy=20% #eab308 opacity=0.25
     · extremos opacity=0
   - Star dust scattered opacity 0.1 (12 puntos 3-5px)

2) SAFE ZONE CONTENT (x=507 y=508 w=1546 h=423):

   a) Logo + wordmark (izquierda):
      - Squircle isotipo 120×120 gradient brand (x=550 y=640)
      - Wordmark "Paw Friend" Fredoka 600 size 96 (x=700 y=720
        fill #ffffff)

   b) Tagline debajo del wordmark:
      - "La ficha médica de tu mascota, hecha en Chile"
      - x=700 y=780 Jakarta 500 size 32 fill rgba(255,255,255,0.85)

   c) Schedule pill:
      - Rectángulo pill x=700 y=820 w=380 h=50 rx=25
        fill rgba(255,255,255,0.15) stroke rgba(255,255,255,0.3)
      - Texto "NUEVOS VIDEOS CADA VIERNES" centrado Jakarta 800
        size 18 letter-spacing 4 fill #fde68a

   d) Social icons row (right of safe zone):
      - x=1700 y=680
      - 3 pills horizontales gap 20:
        · "@pawfriend.cl"
        · "IG" icon
        · "TikTok" icon
      - Cada pill rgba(255,255,255,0.12) border rgba(255,255,255,
        0.25)

3) EDGES DECORATIVOS (fuera safe zone):
   - Paw silhouettes grandes en corners opacity 0.08
   - Gradient fade decorative purple-to-gold en edges

TITLE: "Paw Friend YouTube Channel Banner"
DESC: "Channel banner 2560×1440 con safe zone centered para
consistencia TV/desktop/mobile."

--- PASTE END ---
```

---

## 11. App Store iOS

### 11.1. IOS-01 · Slides 6-8 (expansión serie)

```
--- PASTE START ---

Necesito 3 SVG oficiales screenshots para App Store iOS 6.5" de Paw
Friend (app chilena: ficha médica digital + directorio vets +
comunidad; 100% gratis dueños; pawfriend.cl; SpA RUT 78.328.659-9).

PALETA BRAND (estricto):
- Purple: #9333ea · #581c87 · #a855f7 · #2a1046
- Gold: #eab308 · #fde68a · #b45309
- Rose: #ec4899 · #be185d
- Emerald: #10b981 · #047857
- Ink: #1a102b · #4b3b66
- Paper: #faf7ff · #fff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif

REGLAS SVG:
- Vectorial limpio con text embedded
- <title>, role="img", <desc> cada uno
- Peso < 25 KB cada uno
- Safe areas iOS: top 80px (status bar) + bottom 80px (home
  indicator)
- Entrega: 3 bloques SVG separados con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 3 App Store iOS 6.5" slides (6-7-8, complementa 1-5
existentes)
═════════════════════════════════════════════════════════

DIMENSIONES: viewBox 0 0 1242 2688 cada uno (iPhone 6.5")
PRIORIDAD: P1

LAYOUT COMÚN:
- Top eyebrow pill (y=220): rectángulo pill con eyebrow UPPERCASE
  letter-spacing 6
- Title 3 líneas Fredoka 112px (y=440 / 570 / 700)
- Subtitle 1 línea Jakarta 500 38px (y=820)
- Phone mockup iPhone 15 Pro style (g transform translate
  (621, 1700), rect body 640×1560 rx=90)
- Screen content específico por slide (mockup de feature)

───────────────────────────────────────────────────────────

6) 06_paw_cards.svg — "Paw Cards coleccionables"
   Eyebrow: "PAW CARDS · COLECCIONABLES"
   Fondo: radial #fef3c7 → #faf5ff → #9333ea
   Title: "Cada mascota tiene [linea2: su Paw Card [linea3: única."]]
   Título línea 2 highlight gold gradient
   Phone screen content:
   - Header purple
   - Card flippable mockup centrada (holo pattern con rainbow
     gradient sutil, foto placeholder, rareza badge "legendaria")
   - QR code pequeño below
   - CTA "Ver colección"

7) 07_paw_member.svg — "Paw Member beneficios"
   Eyebrow: "PAW MEMBER · APOYO OPCIONAL"
   Fondo: radial #fef3c7 → #f3e8ff
   Title: "Sostén el [linea2: proyecto [linea3: sin bloqueos."]]
   Highlight gold-to-purple en "proyecto"
   Phone screen:
   - Badge Paw Member gold-gradient grande top
   - 4 benefits list: badge oficial / acceso alianzas / kit gracias /
     soporte prioritario
   - "$3.990/mes · cancelable"
   - Sub "Todas las features siempre libres · tu aporte es
     opcional"

8) 08_social_proof.svg — "Stats + testimonials"
   Eyebrow: "LA COMUNIDAD CRECE"
   Fondo: radial #ecfdf5 → #f3e8ff
   Title: "+1.000 mascotas [linea2: +50 vets [linea3: en 30 días."]]
   Highlight emerald en "50 vets"
   Phone screen:
   - 3 stat cards grandes: 1000 / 50 / 4.8★
   - 3 testimonial chips con avatars + quote corta (Paloma,
     Sofía, Dra. Muñoz)
   - Bottom CTA "Sumate"

───────────────────────────────────────────────────────────

Cada SVG con safe areas iOS marcadas (rects opacity 0.08 top/bottom).

Entrega 3 bloques SVG separados.

--- PASTE END ---
```

---

## 12. Play Store Android

### 12.1. AND-01 · Screenshots 2-8 (completar serie)

Similar template al §11.1 pero adaptado a Android 1080×1920 con Material bottom nav. Usá este prompt como guía base y ajustá por slide.

---

## 13. Investor Kit

### 13.1. INV-01 · Executive summary 1-pager

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
digital + directorio público vets + comunidad. 100% gratis dueños.
Hecha en Chile por 1 persona + IA. SpA SUSAETA GARNHAM SOFTWARE
ENGINEERING, RUT 78.328.659-9, domicilio Luis Pasteur 6111 Dp 201
Vitacura, web pawfriend.cl).

PALETA BRAND (estricto):
- Purple: #9333ea · #581c87 · #a855f7 · #f3e8ff
- Gold: #eab308 · #fde68a · #b45309 · #fef3c7
- Emerald: #10b981 · #047857 · #ecfdf5
- Rose: #ec4899
- Ink: #1a102b · #4b3b66 · #94889e
- Paper: #faf7ff · #fff
- Border: #e9d5ff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif
- Mono (números, RUT): 'JetBrains Mono', monospace

REGLAS SVG:
- Vectorial limpio con text embedded
- <title>, role="img", <desc>
- Peso < 25 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Investor Kit · Executive Summary 1-pager A4
═════════════════════════════════════════════════════════

ARCHIVO: executive_summary.svg
DIMENSIONES: viewBox 0 0 1240 1754 (A4 @150dpi)
PRIORIDAD: P1

CONTEXTO:
Executive summary de 1 página para angels/VC que prefieren 1 pager
sobre deck completo. Distribuible por email. Layout editorial serio
con paleta brand.

LAYOUT (4 quadrantes verticales):

───────────────────────────────────────────────────────────
HEADER (y=0 a y=200):
───────────────────────────────────────────────────────────
- Fondo gradient brand #2a1046 → #581c87 → #9333ea horizontal
- Gold glow radial overlay cx=80% cy=30% opacity=0.3
- Logo Paw Friend izquierda (x=80 y=90 size 80×80)
  · Squircle gradient + pata blanca
- Wordmark + subtitle centro:
  · x=200 y=120 "Paw Friend" Fredoka 600 size 44 fill #fff
  · x=200 y=168 "Executive Summary · Q2 2026" Jakarta 500 size 16
    fill rgba(255,255,255,0.85)
- Right tag pill:
  · x=1060 y=100 w=140 h=50 rx=25
  · fill rgba(255,255,255,0.18) stroke rgba(255,255,255,0.4)
  · Text "HECHO EN CHILE" Jakarta 800 size 12 letter-spacing 3
    fill #fff

───────────────────────────────────────────────────────────
SECTION 1 · PRODUCT + PROBLEM + MARKET (y=240 a y=620):
───────────────────────────────────────────────────────────
- Eyebrow "01 · PROPUESTA DE VALOR" y=280 Jakarta 800 size 12
  fill #9333ea letter-spacing 4
- Título hero 2 líneas:
  · "La ficha médica digital" Fredoka 600 size 40 fill #1a102b
  · "de cada mascota chilena." Fredoka 600 size 40 fill #9333ea
- Párrafo desc y=420 Jakarta 500 size 17 fill #4b3b66:
  "7 de cada 10 hogares tiene mascota. Menos del 15% digitaliza
  salud animal. Nosotros somos el puente."
- Grid de 3 stat cards (y=510):
  · "7/10" Fredoka 48 fill #9333ea · label "Hogares con mascota"
  · "US$ 4B" Fredoka 48 fill #eab308 · label "Mercado pet LatAm"
  · "< 15%" Fredoka 48 fill #10b981 · label "Digitalización actual"

───────────────────────────────────────────────────────────
SECTION 2 · BUSINESS MODEL (y=660 a y=1000):
───────────────────────────────────────────────────────────
- Eyebrow "02 · MODELO DE NEGOCIO" y=700
- Título "Gratis B2C · 6 motores opcionales" Fredoka 600 size 34
- Grid 3×2 íconos + labels (y=800):
  Row 1:
  · Donaciones (ícono corazón gold)
  · Paw Member (ícono badge purple)
  · Planes Vet (ícono stethoscope emerald)
  Row 2:
  · Paw Companys (ícono edificio purple)
  · Paw Partners (ícono handshake emerald)
  · Publicidad transparente (ícono megaphone rose)

───────────────────────────────────────────────────────────
SECTION 3 · TRACTION + TEAM (y=1040 a y=1380):
───────────────────────────────────────────────────────────
- Eyebrow "03 · TRACCIÓN Y EQUIPO"
- 2 columnas side-by-side:

  Izquierda (x=80 w=540):
  · "Tracción" title Fredoka 600 size 28
  · Bullets Jakarta 500 size 16:
    - 3 plataformas live (web + iOS + Android)
    - 67 pantallas funcionales
    - 15× leverage (1 persona + IA = equipo de 5)
    - < US$100/mes operación
  · Chart mockup waterfall con 3 barras crecientes gold

  Derecha (x=650 w=510):
  · "Equipo" title Fredoka 600 size 28
  · Founder card con avatar placeholder circle:
    - Avatar 60×60 gradient purple
    - "Paw Founder" Fredoka 600 size 22
    - "Software engineer · 10+ años · Chileno" Jakarta 500 size
      14
  · Kai + Ema mini card: "Clientes #1 y #2" + 2 pet silhouettes

───────────────────────────────────────────────────────────
SECTION 4 · ASK + USE OF FUNDS (y=1420 a y=1650):
───────────────────────────────────────────────────────────
- Fondo dark card brand-900 ink con border
- Eyebrow "04 · RONDA ACTUAL" fill #fde68a
- Título "Buscamos US$ 150K · SAFE @ US$ 3M cap"
  Fredoka 600 size 32 fill #fff
- Uso de fondos (4 bullets con % + ícono):
  · 40% Producto & IA (ícono cerebro)
  · 30% Marketing & GTM (ícono megaphone)
  · 20% Legal & compliance (ícono shield)
  · 10% Buffer operativo (ícono piggy)
- CTA pill x=400 y=1600 w=440 h=56 rx=28 fill #eab308:
  "pawfriendcl@gmail.com" Jakarta 800 size 18 fill #1a102b

───────────────────────────────────────────────────────────
FOOTER (y=1690 a y=1754):
───────────────────────────────────────────────────────────
- Fondo #f3e8ff (brand-100)
- Text distribuido horizontal:
  · Izquierda: "SpA SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT
    78.328.659-9" Jakarta 500 size 11 fill #4b3b66
  · Centro: "Luis Pasteur 6111 Dp 201 · Vitacura · Santiago"
    Jakarta 500 size 11
  · Derecha: "pawfriend.cl · pawfriendcl@gmail.com" Jakarta 700
    size 11 fill #9333ea

TITLE: "Paw Friend Executive Summary"
DESC: "Executive summary 1-pager A4 para angels/VC. Distribución
editorial con product + model + traction + ask."

--- PASTE END ---
```

---

### 13.2. INV-02 · Data room cover

```
--- PASTE START ---

Necesito un SVG cover para Data Room de Paw Friend (app chilena:
ficha médica digital + directorio vets + comunidad; SpA SUSAETA
GARNHAM SOFTWARE ENGINEERING RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea · #581c87 · #2a1046
- Gold: #eab308 · #fde68a
- Paper: #faf7ff · #fff
- Ink: #1a102b · #4b3b66

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif
- Mono: 'JetBrains Mono', monospace

REGLAS SVG:
- Vectorial limpio con text embedded
- <title>, role="img", <desc>
- Peso < 12 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Investor Kit · Data Room Cover A4
═════════════════════════════════════════════════════════

ARCHIVO: data_room_cover.svg
DIMENSIONES: viewBox 0 0 1240 1754 (A4)
PRIORIDAD: P1

LAYOUT:

1) FONDO:
   - Gradient diagonal #2a1046 → #581c87 → #9333ea (top-left to
     bottom-right)
   - Gold glow radial overlay cx=80% cy=30% opacity=0.25

2) LOGO Y BRAND TOP (y=100 a y=250):
   - Isotipo squircle 120×120 centered at x=620 y=180
   - Wordmark "Paw Friend" Fredoka 600 size 52 fill #ffffff
     centered at y=340

3) HERO TITLE (y=500 a y=700):
   - "Data Room" Fredoka 600 size 140 fill #fde68a centered
   - Sub "Información privilegiada para partners estratégicos
     bajo NDA firmado" Jakarta 500 size 20 fill rgba(255,255,255,
     0.85) centered y=700

4) CONTENT SECTIONS LIST (y=850 a y=1450):
   5 items con checkmarks + nombre + descripción:

   Box común para cada item:
   - Rectángulo rgba(255,255,255,0.08) border rgba(255,255,255,
     0.18) rx=12
   - Icon checkmark emerald #10b981 izquierda
   - Title Jakarta 700 size 22 fill #ffffff
   - Desc Jakarta 500 size 14 fill rgba(255,255,255,0.7)

   Items:
   · "01 · Business Plan & Financials"
     (5-year projections, unit economics, CAC/LTV)
   · "02 · Legal & Corporate"
     (SpA incorporation, IP, vet compliance)
   · "03 · Tech Stack & Architecture"
     (tree de stack, decisiones arquitectónicas, escala)
   · "04 · Product Roadmap"
     (90/180/365 días, feature priorities)
   · "05 · Letters of Intent"
     (vets, refugios, Paw Companys)

5) NDA DISCLAIMER BOX (y=1500 a y=1600):
   - Fondo amber tint #fef3c7 opacity=0.15
   - Border dashed #eab308
   - Text "Disponible bajo NDA firmado. Contactar
     pawfriendcl@gmail.com" Jakarta 500 size 16 fill #fde68a
     centered

6) FOOTER (y=1650 a y=1754):
   - Divider line rgba(255,255,255,0.2)
   - Text: "SpA SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT
     78.328.659-9 · pawfriend.cl" Jakarta 500 size 12 fill
     rgba(255,255,255,0.6) centered
   - Line 2: "Versión 2026-04-19 · Confidencial" Jakarta 500
     size 11 fill rgba(255,255,255,0.5) centered

TITLE: "Paw Friend Data Room Cover"
DESC: "Cover page A4 para carpeta Data Room. Índice de 5 secciones
disponibles bajo NDA."

--- PASTE END ---
```

---

## 14. Partner Kit

### 14.1. PRT-01 · Partner onboarding email banner

```
--- PASTE START ---

Necesito un SVG oficial banner para email outreach a partners de
Paw Friend (app chilena: ficha médica + directorio vets + comunidad;
SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea, #7e22ce
- Gold: #eab308
- Emerald: #10b981, #047857
- Paper: #faf7ff, #fff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif

REGLAS SVG:
- Vectorial limpio con texto embedded
- <title>, role="img", <desc>
- Peso < 10 KB
- Email-safe: debe verse bien si se convierte a PNG 600×200 para
  embed en email client
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Partner Kit · Email Banner Outreach
═════════════════════════════════════════════════════════

ARCHIVO: email_banner.svg
DIMENSIONES: viewBox 0 0 1200 400
PRIORIDAD: P1

LAYOUT:

1) FONDO:
   - Gradient linear 135° #047857 → #10b981 (emerald, audience
     partners)
   - Gold glow radial overlay cx=85% cy=30% opacity=0.2

2) LEFT: Paw Friend brand (x=60 y=180):
   - Isotipo squircle 80×80
   - Wordmark "Paw Friend" Fredoka 600 size 36 fill #ffffff
   - Sub "Directorio vets de Chile" Jakarta 500 size 14 fill
     rgba(255,255,255,0.85)

3) CENTER: X symbol (x=550 y=200):
   - "×" grande Fredoka 600 size 120 fill rgba(255,255,255,0.5)

4) RIGHT: Placeholder para logo partner (x=680 y=150):
   - Rectángulo 200×100 rx=16 fill rgba(255,255,255,0.1) stroke
     rgba(255,255,255,0.3) dasharray="8,6"
   - Text center "TU LOGO AQUÍ" Jakarta 800 size 14 fill
     rgba(255,255,255,0.7) letter-spacing 4

5) CTA right-bottom:
   - Rectangle pill x=900 y=300 w=230 h=50 rx=25 fill #fff
   - Text "Hablemos →" Fredoka 600 size 20 fill #047857 centered

TITLE: "Paw Friend Partner Email Banner"
DESC: "Banner 1200×400 para outreach email a partners. Co-branding
placeholder con emerald gradient."

--- PASTE END ---
```

---

## 15. Press / Media Kit

### 15.1. PRS-01 · Press release template A4

```
--- PASTE START ---

Necesito un SVG template press release A4 para Paw Friend (app
chilena: ficha médica digital + directorio vets + comunidad;
SpA SUSAETA GARNHAM SOFTWARE ENGINEERING RUT 78.328.659-9;
pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea, #581c87, #f3e8ff
- Gold: #eab308
- Ink: #1a102b, #4b3b66
- Paper: #faf7ff, #fff
- Border: #e9d5ff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif
- Mono: 'JetBrains Mono', monospace

REGLAS SVG:
- Vectorial limpio con text embedded editable (placeholders
  marcados {{PLACEHOLDER}})
- <title>, role="img", <desc>
- Peso < 15 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Press Release Template A4
═════════════════════════════════════════════════════════

ARCHIVO: press_release_template.svg
DIMENSIONES: viewBox 0 0 1240 1754 (A4)
PRIORIDAD: P1

LAYOUT EDITORIAL PRESS-STANDARD:

1) HEADER (y=80 a y=220):
   - Logo Paw Friend izquierda (x=80 y=100 size 60×60)
   - Wordmark "Paw Friend" Fredoka 600 size 32 fill #1a102b al lado
   - Derecha: "PARA PUBLICACIÓN INMEDIATA" Jakarta 800 size 14
     letter-spacing 3 fill #9333ea (estilo press formal)
   - Divider line brand-200 abajo del header

2) DATE + LOCATION (y=260):
   - "{{FECHA}}, Santiago, Chile" Jakarta 500 size 16 fill #4b3b66

3) HEADLINE PLACEHOLDER (y=320 a y=500):
   - Box dashed border para placeholder
   - Text "{{HEADLINE PRINCIPAL - máx 15 palabras}}" Fredoka 600
     size 54 fill #1a102b centered (o left-aligned)
   - Sub placeholder "{{SUBTITLE 1 línea explicativa}}" Jakarta
     500 size 22 fill #4b3b66

4) BODY COPY PLACEHOLDERS (y=540 a y=1300):
   5 párrafos con dashed outlines:
   - Each paragraph: rect dashed border #e9d5ff h=130, filled with
     subtle #faf5ff
   - Label above each: "PÁRRAFO 1 · HOOK + QUIÉN QUÉ CUÁNDO"
     Jakarta 800 size 10 fill #9333ea letter-spacing 3
   - Labels secuencia:
     · PÁRRAFO 1 · HOOK + QUIÉN QUÉ CUÁNDO
     · PÁRRAFO 2 · PROBLEMA + SOLUCIÓN
     · PÁRRAFO 3 · QUOTE DEL FOUNDER (marcar con borde gold)
     · PÁRRAFO 4 · DATOS / MILESTONES
     · PÁRRAFO 5 · NEXT STEPS + CALL TO ACTION

5) BOILERPLATE (y=1340 a y=1560):
   - Fondo #f3e8ff card con rx=16
   - Title "## SOBRE PAW FRIEND" Fredoka 600 size 20 fill #9333ea
   - Text:
     "Paw Friend es la ficha médica digital de mascotas + directorio
     público de veterinarios + comunidad pet lover chilena. Hecha
     en Chile por una persona con apoyo de IA, es 100% gratis para
     dueños de mascotas. Operada por SpA SUSAETA GARNHAM SOFTWARE
     ENGINEERING (RUT 78.328.659-9). Web: pawfriend.cl."
   - Jakarta 500 size 14 line-height 1.6 fill #4b3b66

6) MEDIA CONTACT FOOTER (y=1600 a y=1754):
   - Divider line brand-200
   - Text distribuido:
     · "Contacto para prensa" Jakarta 800 size 11 fill #9333ea
     · "Paw Founder · pawfriendcl@gmail.com" Jakarta 600 size 14
     · "pawfriend.cl/brand-assets/ (logo pack + founder photos)"
       Jakarta 500 size 12 fill #4b3b66 mono
     · "Versión 2026-04-19" Jakarta 500 size 10 fill #94889e mono

TITLE: "Paw Friend Press Release Template"
DESC: "Template press release A4 con placeholders editables.
Editorial format estándar prensa latinoamericana."

--- PASTE END ---
```

---

## 16. Creator Voices Kit

### 16.1. CV-01 · Paw Voice bio card template

```
--- PASTE START ---

Necesito un SVG template bio card para Paw Voices (creadores
oficiales de Paw Friend, app chilena: ficha médica + directorio
vets + comunidad; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea, #581c87
- Rose (audience voices): #ec4899, #be185d, #fdf2f8
- Gold: #eab308, #fde68a
- Ink: #1a102b, #4b3b66
- Paper: #faf7ff, #fff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif

REGLAS SVG:
- Vectorial limpio con text placeholder editable
- <title>, role="img", <desc>
- Peso < 8 KB
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Paw Voice Bio Card Template
═════════════════════════════════════════════════════════

ARCHIVO: bio_template.svg
DIMENSIONES: viewBox 0 0 1080 1080 (square shareable)
PRIORIDAD: P2

CONCEPTO:
Card que un Paw Voice puede capturar, editar digitalmente con su
data personal, y compartir en sus redes como "carta de presentación"
oficial.

LAYOUT:

1) FONDO:
   - Gradient rose cálido: #fdf2f8 → #fef3c7 → #fdf2f8
   - 2 pawprints decorativos opacity 0.05 en corners

2) TOP BADGE (y=100):
   - Pill centered x=440 y=80 w=200 h=56 rx=28
   - Fill gradient rose #be185d → #ec4899
   - Text "PAW VOICE OFICIAL" Jakarta 800 size 18
     letter-spacing 6 fill #ffffff

3) AVATAR PLACEHOLDER (centered y=230):
   - Círculo x=440 y=230 r=100
   - Fill rgba(236,72,153,0.15) stroke rgba(236,72,153,0.4) width=3
     dasharray="6,5"
   - Text center "TU FOTO" Jakarta 800 size 14 fill rgba(236,72,
     153,0.6) letter-spacing 3

4) HANDLE + PLATFORM icons (y=470):
   - Text "@{{TU_HANDLE}}" Fredoka 600 size 48 fill #1a102b
     centered
   - Row abajo 3 platform icons (IG · TikTok · YouTube):
     circle r=20 con iniciales
     · IG: gradient rose-purple
     · TikTok: ink con white dot
     · YT: red with white triangle

5) BIO PLACEHOLDER (y=580 a y=720):
   - Card rectangle x=120 y=580 w=840 h=140 rx=20 fill #ffffff
     stroke #fce7f3 (border rose light)
   - Text placeholder dashed: "{{TU BIO EN 2-3 LÍNEAS · hablá de
     tu peludo, tu pasión por los animales, tu voz}}"
     Jakarta 500 italic size 20 fill #be185d centered

6) PROMO CODE BLOCK (y=760 a y=900):
   - Fondo #1a102b card rx=24
   - Label top "TU CÓDIGO PROMO" Jakarta 800 size 18
     letter-spacing 5 fill #fde68a
   - Codigo gigante "{{KAI10}}" Fredoka 600 size 92 fill #fff
     letter-spacing 8 centered
   - Sub "Tu audiencia ahorra. Tú ganas reconocimiento." Jakarta
     500 size 16 fill rgba(255,255,255,0.75)

7) CTA link (y=950):
   - Pill center x=390 y=930 w=300 h=60 rx=30 fill #ec4899
   - Text "pawfriend.cl/paw-voices" Jakarta 800 size 22 fill #fff

8) BRAND WATERMARK bottom:
   - "@pawfriend.cl" Jakarta 500 size 14 fill rgba(26,16,43,0.6)
     letter-spacing 4 centered y=1040

TITLE: "Paw Voice Bio Card Template"
DESC: "Bio card template 1080×1080 que el Paw Voice completa con
su foto, handle, bio y código promo antes de compartir en redes."

--- PASTE END ---
```

---

## 17. Event / Conference Kit

### 17.1. EVT-01 · Business Card

```
--- PASTE START ---

Necesito 2 SVGs oficiales para business card founder Paw Friend
(front + back) — app chilena (ficha médica digital + directorio
vets; SpA SUSAETA GARNHAM SOFTWARE ENGINEERING RUT 78.328.659-9;
Luis Pasteur 6111 Dp 201 Vitacura; pawfriend.cl).

PALETA BRAND (estricto):
- Purple: #9333ea · #581c87 · #2a1046
- Gold: #eab308 · #fde68a
- Ink: #1a102b · #4b3b66
- Paper: #faf7ff · #fff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif
- Mono: 'JetBrains Mono', monospace

REGLAS SVG:
- Vectorial limpio con texto embedded
- <title>, role="img", <desc>
- Peso < 5 KB cada uno
- Business card estándar 90×55mm (rendered a 540×330 px @ 150dpi)
- Entrega: 2 bloques SVG separados (front + back) con
  <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Business Card Founder · Front + Back
═════════════════════════════════════════════════════════

DIMENSIONES: viewBox 0 0 540 330 cada uno (90×55mm @ 150dpi)
PRIORIDAD: P1

───────────────────────────────────────────────────────────
FRONT · business_card_front.svg:
───────────────────────────────────────────────────────────

1) Fondo gradient linear 135° #2a1046 → #581c87 → #9333ea

2) Paw Friend mark centered:
   - Isotipo squircle gradient brand + pata blanca + corazón
     negative space
   - Tamaño 120×120 centered horizontally
   - Posición vertical y=80

3) Wordmark "Paw Friend":
   - x=270 y=240 text-anchor middle
   - Fredoka 600 size 36 fill #ffffff

4) Role:
   - "Founder · Paw Friend"
   - x=270 y=280 text-anchor middle
   - Jakarta 500 italic size 16 fill rgba(255,255,255,0.85)

5) Bottom-right gold sparkle decorative (size 14)

───────────────────────────────────────────────────────────
BACK · business_card_back.svg:
───────────────────────────────────────────────────────────

1) Fondo blanco #ffffff
2) Border thin brand-100 #f3e8ff

3) Left column (x=40):
   - Small logo 40×40 at y=40
   - "PAW FOUNDER" Jakarta 800 size 14 fill #9333ea
     letter-spacing 3 y=110
   - "Fundador" Jakarta 500 size 12 fill #4b3b66 y=130

4) Right column (x=200, info stack):
   - Labels with line before each:
     · Email (email icon + "pawfriendcl@gmail.com") y=60
     · Web ("pawfriend.cl") y=100
     · RUT (mono "78.328.659-9") y=140
     · Dirección ("Luis Pasteur 6111 Dp 201, Vitacura") y=180
   - Jakarta 500 size 12 fill #1a102b para datos
   - Icon circle rose/purple/emerald/gold para cada uno

5) Bottom: QR code placeholder
   - x=380 y=200 size 120×120
   - Pattern simulado (12×12 grid con random squares purple)
   - Center ovalado con pata pequeña
   - Text abajo "Escanea →" Jakarta 500 size 10 italic fill
     #4b3b66

6) Footer:
   - Divider line brand-100
   - "SpA SUSAETA GARNHAM SOFTWARE ENGINEERING" Jakarta 500 size 9
     italic fill #94889e centered y=315

Entrega: 2 bloques SVG separados.

--- PASTE END ---
```

---

## 18. Document Templates

### 18.1. DOC-01 · Email signature

```
--- PASTE START ---

Necesito un SVG email signature para founder Paw Friend (app
chilena: ficha médica + directorio vets + comunidad; SpA RUT
78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea, #581c87
- Gold: #eab308
- Ink: #1a102b, #4b3b66
- Paper: #faf7ff, #fff

TIPOGRAFÍA:
- Display: 'Fredoka', 'Plus Jakarta Sans', sans-serif
- Body: 'Plus Jakarta Sans', sans-serif
- Mono: 'JetBrains Mono', monospace

REGLAS SVG:
- Vectorial limpio, text embedded
- <title>, role="img", <desc>
- Peso < 5 KB
- Debe verse bien si se convierte a PNG 600×200 para email
  embedding
- Entrega: SVG en bloque ```svg``` con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Email Signature Template
═════════════════════════════════════════════════════════

ARCHIVO: email_signature.svg
DIMENSIONES: viewBox 0 0 600 200
PRIORIDAD: P1

LAYOUT:

1) Fondo blanco sin border

2) LEFT: Brand area (x=20 w=160):
   - Logo Paw Friend 60×60 top
   - Wordmark "Paw Friend" Fredoka 600 size 20 fill #1a102b below
   - Sub "Hecho en Chile" Jakarta 500 italic size 11 fill #9333ea

3) SEPARATOR: thin line vertical brand-gold gradient
   x=200 y=20 h=160

4) RIGHT: Personal info (x=220):
   - "Paw Founder" Fredoka 600 size 22 fill #1a102b y=50
   - "Founder · Paw Friend" Jakarta 500 italic size 14 fill
     #4b3b66 y=74

   - Divider thin brand-100 y=90

   - Contact rows (Jakarta 500 size 13):
     · Icon email + "pawfriendcl@gmail.com" y=110 fill #4b3b66
     · Icon phone + "+56 9 XXXX XXXX" y=132 fill #4b3b66
     · Icon web + "pawfriend.cl" y=154 fill #9333ea font-weight 700

5) BOTTOM RIGHT: Social icons row (x=430 y=160):
   - 3 small circles r=12 con iniciales IG · TT · YT
   - Gap 8 entre cada uno
   - fill rose-gradient / ink / red

6) FOOTER MICRO:
   - "RUT 78.328.659-9 · SpA SUSAETA GARNHAM · Luis Pasteur 6111 Dp
     201 · Vitacura" Jakarta 500 size 8 italic fill #94889e
     y=185 centered

TITLE: "Paw Friend Email Signature"
DESC: "Email signature 600×200 para founder. Brand + info contacto
+ social + legal footer."

--- PASTE END ---
```

---

## 19. Email HTML

### 19.1. EML-01 · Welcome email (dueño)

> **Nota especial:** Los email templates son HTML (no SVG). Este prompt genera HTML con inline styles email-safe.

```
--- PASTE START ---

Necesito un email HTML oficial "welcome dueño" para Paw Friend
(app chilena: ficha médica digital + directorio público veterinarios
+ comunidad; 100% gratis para dueños; SpA SUSAETA GARNHAM SOFTWARE
ENGINEERING RUT 78.328.659-9; pawfriend.cl; founder: Paw Founder;
mascotas reales: Kai pastor suizo + Ema gata).

PALETA BRAND (usar en inline styles):
- Purple primary: #9333ea
- Purple deep: #581c87
- Gold: #eab308, #fde68a
- Emerald: #10b981
- Paper: #faf7ff
- Ink: #1a102b
- Ink-soft: #4b3b66

TIPOGRAFÍA EMAIL (email clients no soportan web fonts bien):
- Primary: Arial, Helvetica, sans-serif (email-safe)
- Fallback: sans-serif genérico
- NO usar Fredoka o Jakarta en HTML (exportarlos como imágenes PNG
  si se necesita display font)

REGLAS EMAIL HTML (estricto):
- Width máximo 600px
- Inline CSS TODO (email clients ignoran <style>)
- Table-based layout (Outlook no soporta flex/grid/div layout)
- Imágenes con src absolutas pawfriend.cl/brand-assets/...
- Alt text en TODOS los <img>
- No usar CSS grid, flex, position, transform
- No usar fuentes externas (@import, <link> a Google Fonts)
- Dark mode: usar @media (prefers-color-scheme: dark) pero en
  <style> tag con degrade gracefully
- Ancho de container tables = 600px fixed
- Entrega: HTML completo en bloque ```html``` con
  <!-- filename.html --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Welcome Email Dueño (Paw Friend)
═════════════════════════════════════════════════════════

ARCHIVO: welcome_dueno.html
PRIORIDAD: P1

CONTEXT DEL EMAIL:
Primera comunicación después que el dueño se registra en pawfriend.cl.
Debe:
- Confirmar bienvenida con calidez chilena
- Dar next steps claros (3 opciones)
- Invitar a explorar pero no abrumar
- Tono warm pero breve

STRUCTURE HTML:

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Bienvenido a Paw Friend</title>
  <style>
    /* Solo aquí: dark mode media query degraded */
    @media (prefers-color-scheme: dark) {
      body { background-color: #2a1046 !important; }
    }
    /* Reset básico */
    body, table, td { margin:0; padding:0; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#faf7ff;font-family:Arial,Helvetica,sans-serif;">

<!-- Outer table wrapper -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#faf7ff;">
  <tr>
    <td align="center" style="padding:40px 20px;">

      <!-- Container 600px -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#ffffff;border-radius:14px;overflow:hidden;">

        <!-- Hero header with gradient -->
        <tr>
          <td style="background:linear-gradient(135deg,#2a1046 0%,#581c87 50%,#9333ea 100%);padding:40px 30px;text-align:center;">
            <!-- Logo -->
            <img src="https://pawfriend.cl/brand-assets/logo/app_icon_ios_1024.png" alt="Paw Friend" width="80" height="80" style="display:block;margin:0 auto 16px;border-radius:18px;" />
            <!-- Wordmark como text (no web font) -->
            <h1 style="margin:0 0 8px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:700;letter-spacing:-0.5px;">¡Bienvenido, {{nombre}}!</h1>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;font-size:16px;line-height:1.5;">La ficha médica de tu mascota, en Chile, gratis.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 30px;">
            <p style="margin:0 0 20px;color:#1a102b;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;">
              ¡Qué bueno que te sumaste a Paw Friend! Desde hoy vas a tener todo lo
              que necesitas para cuidar a tu peludo en un solo lugar, sin pagar ni
              un peso.
            </p>

            <h2 style="margin:30px 0 20px;color:#9333ea;font-family:Arial,sans-serif;font-size:22px;font-weight:700;">Tus próximos 3 pasos</h2>

            <!-- Step 1: Add pet -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
              <tr>
                <td width="60" style="vertical-align:top;">
                  <div style="width:48px;height:48px;background:#f3e8ff;border-radius:12px;text-align:center;line-height:48px;font-size:22px;font-weight:700;color:#9333ea;font-family:Arial;">1</div>
                </td>
                <td style="vertical-align:top;padding-left:14px;">
                  <h3 style="margin:0 0 4px;color:#1a102b;font-size:17px;font-weight:700;font-family:Arial;">Agrega tu primer peludo</h3>
                  <p style="margin:0 0 8px;color:#4b3b66;font-size:14px;line-height:1.5;font-family:Arial;">Solo necesitas su nombre, especie y foto.</p>
                  <a href="https://pawfriend.cl/add-pet" style="color:#9333ea;font-weight:700;text-decoration:none;font-size:14px;font-family:Arial;">Agregar →</a>
                </td>
              </tr>
            </table>

            <!-- Step 2: Vet directory -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
              <tr>
                <td width="60" style="vertical-align:top;">
                  <div style="width:48px;height:48px;background:#ecfdf5;border-radius:12px;text-align:center;line-height:48px;font-size:22px;font-weight:700;color:#10b981;font-family:Arial;">2</div>
                </td>
                <td style="vertical-align:top;padding-left:14px;">
                  <h3 style="margin:0 0 4px;color:#1a102b;font-size:17px;font-weight:700;font-family:Arial;">Explora vets cerca de ti</h3>
                  <p style="margin:0 0 8px;color:#4b3b66;font-size:14px;line-height:1.5;font-family:Arial;">Directorio público con precios y reseñas reales.</p>
                  <a href="https://pawfriend.cl/veterinarios" style="color:#10b981;font-weight:700;text-decoration:none;font-size:14px;font-family:Arial;">Ver directorio →</a>
                </td>
              </tr>
            </table>

            <!-- Step 3: Donations opt -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:30px;">
              <tr>
                <td width="60" style="vertical-align:top;">
                  <div style="width:48px;height:48px;background:#fef3c7;border-radius:12px;text-align:center;line-height:48px;font-size:22px;font-weight:700;color:#b45309;font-family:Arial;">3</div>
                </td>
                <td style="vertical-align:top;padding-left:14px;">
                  <h3 style="margin:0 0 4px;color:#1a102b;font-size:17px;font-weight:700;font-family:Arial;">Si te sirve, ayúdanos</h3>
                  <p style="margin:0 0 8px;color:#4b3b66;font-size:14px;line-height:1.5;font-family:Arial;">Donaciones opcionales para que Paw Friend siga gratis.</p>
                  <a href="https://pawfriend.cl/donaciones" style="color:#b45309;font-weight:700;text-decoration:none;font-size:14px;font-family:Arial;">Ver /donaciones →</a>
                </td>
              </tr>
            </table>

            <!-- Main CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding:20px 0;">
                  <a href="https://pawfriend.cl/home" style="display:inline-block;background:#9333ea;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:28px;font-weight:700;font-size:16px;font-family:Arial;">Ir a mi panel</a>
                </td>
              </tr>
            </table>

            <!-- Founder signature -->
            <p style="margin:40px 0 0;color:#4b3b66;font-family:Arial;font-size:14px;font-style:italic;line-height:1.6;text-align:center;">
              Con cariño desde Chile,<br/>
              <strong style="color:#9333ea;font-style:normal;">— Paw Founder</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f3e8ff;padding:25px 30px;text-align:center;font-family:Arial;font-size:12px;color:#4b3b66;line-height:1.6;">
            <p style="margin:0 0 8px;"><strong>Paw Friend</strong> · Hecho en Chile, a mano, con inteligencia artificial.</p>
            <p style="margin:0 0 8px;">pawfriend.cl · pawfriendcl@gmail.com</p>
            <p style="margin:0 0 8px;color:#94889e;">SpA SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT 78.328.659-9 · Luis Pasteur 6111 Dp 201, Vitacura</p>
            <p style="margin:0;">
              <a href="https://pawfriend.cl/profile" style="color:#9333ea;text-decoration:none;">Gestionar preferencias</a>
              ·
              <a href="https://pawfriend.cl/unsubscribe?token={{TOKEN}}" style="color:#9333ea;text-decoration:none;">Darte de baja</a>
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>

ENTREGABLE:
- Email HTML completo en bloque ```html```
- Comentario <!-- welcome_dueno.html --> arriba
- Placeholders reemplazables: {{nombre}}, {{TOKEN}}
- Inline CSS en TODOS los elementos
- Testeado conceptualmente para: Gmail, Outlook, Apple Mail

--- PASTE END ---
```

---

## 20. Patterns & Backgrounds

### 20.1. PAT-01 · Paw dots color variants (4)

```
--- PASTE START ---

Necesito 4 SVGs tileable patterns para Paw Friend (app chilena:
ficha médica + directorio vets; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea
- Gold: #eab308
- Emerald: #10b981
- Rose: #ec4899

ESTILO: minimal, sutil, repetible como CSS background.

REGLAS SVG:
- Vectorial mínimo
- <title>, role="img", <desc> cada uno
- Peso < 1 KB cada uno
- viewBox 0 0 80 80 (tile repetible)
- Entrega: 4 bloques SVG separados con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Paw dots tileable patterns (4 color variants)
═════════════════════════════════════════════════════════

COMPOSICIÓN BASE (idéntica para las 4, solo cambia el color):

- viewBox 0 0 80 80 (tile)
- 2 paw prints pequeños rotados en posiciones opuestas para que al
  repetir el tile se vea orgánico, no aligned

- Paw 1 en top-left (translate 15, 18):
  · Ellipse palma: cx=0 cy=6 rx=5 ry=4
  · 4 ellipses dedos: rotadas
    (-4,0 rot -18 rx=1.8 ry=2.5)
    (-1.5,-3 rot -6 rx=1.5 ry=2)
    (1.5,-3 rot 6 rx=1.5 ry=2)
    (4,0 rot 18 rx=1.8 ry=2.5)

- Paw 2 en bottom-right (translate 55, 58, rotate 30):
  · Mismo pattern que la paw 1 con ligera rotación

- Opacity 0.08 para todos los elementos

───────────────────────────────────────────────────────────
ARCHIVOS:

1) paw_dots_purple.svg — fill color #9333ea
2) paw_dots_gold.svg — fill color #eab308
3) paw_dots_emerald.svg — fill color #10b981
4) paw_dots_rose.svg — fill color #ec4899

───────────────────────────────────────────────────────────

TITLE por variant: "Paw dots pattern — [color]"
DESC: "Pattern repetible 80×80 tileable para uso como background
subtle. Opacity 0.08 para no competir con contenido."

Entrega 4 bloques SVG separados.

--- PASTE END ---
```

---

## 21. Checklist Master de Validación

Al recibir cada SVG de Claude, validar:

```
✓ viewBox presente y con dimensiones correctas
✓ <title> descriptivo
✓ role="img" presente
✓ <desc> explicativo
✓ Peso bajo el threshold
✓ Solo colores de paleta brand 2.0 (no inventados)
✓ Sin texto embedded innecesario (salvo social templates)
✓ stroke-linecap + linejoin round donde aplique
✓ Renderiza a 32×32, 256×256, 1024×1024 sin perder detalle
✓ Optimizable con SVGO sin romper
✓ Sin metadata del editor (Figma leftovers, Inkscape XML, etc.)
```

Si el SVG falla alguno de estos checks, **volver a Claude y pedir corrección**:

```
El SVG no pasa el check [X]. Regeneralo con estos ajustes:
- [Descripción del problema]
- [Cambio esperado]

Entrega el SVG corregido completo.
```

---

## 22. Workflow Claude Code recomendado

Para producir muchos assets en batch:

### 22.1. Sesión nueva por familia

```bash
# Abrir Claude Code en el proyecto
cd c:/Users/psusa/Desktop/pet-harmony-chile-main
claude

# Primer prompt: "Vamos a producir la familia X. Voy a pedirte
# 5 assets ID por ID. Cada prompt es self-contained."

# Pegar un prompt completo (ej: LOGO-01)
# Claude responde con SVG

# Pegar siguiente prompt (ej: LOGO-02)
# Y así...
```

### 22.2. Automatización con script

Script sugerido `scripts/batch-assets.sh`:

```bash
#!/bin/bash
# Batch runner que itera sobre prompts del library y pide a Claude
# (Anthropic API) cada uno, guarda el SVG result, y optimiza

for prompt in prompts/*.txt; do
  name=$(basename "$prompt" .txt)
  echo "Requesting $name..."
  # call Anthropic API with prompt content
  # parse svg block from response
  # save to public/brand-assets/...
  # svgo optimize
done
```

### 22.3. Control de calidad

Tras batch, correr validation:

```bash
# Validar que todos los SVG cumplen el checklist
node scripts/validate-svg.mjs public/brand-assets/**/*.svg

# Output esperado:
# ✓ 47 SVGs validated
# ✗ 3 SVGs with issues:
#   - 31_donation.svg: viewBox missing
#   - fact_sheet.svg: size 45KB > 25KB threshold
#   - cover.svg: used hardcoded color #ff0000 (not in palette)
```

---

## 23. Quick reference card

Para imprimir / tener siempre visible:

```
╔══════════════════════════════════════════════════════════╗
║  PAW FRIEND · PROMPT LIBRARY QUICK REF                   ║
╠══════════════════════════════════════════════════════════╣
║  Paleta primary:   #9333ea (purple-600)                  ║
║  Paleta secondary: #eab308 (gold-500)                    ║
║  Paleta deep:      #581c87 (purple-900)                  ║
║  Paleta rose:      #ec4899 (audience voices)             ║
║  Paleta emerald:   #10b981 (audience partners)           ║
║                                                          ║
║  Display font: Fredoka 500-700                           ║
║  Body font: Plus Jakarta Sans 400-800                    ║
║  Mono font: JetBrains Mono 500-700                       ║
║                                                          ║
║  Audience invest:   #9333ea → #eab308                    ║
║  Audience companys: #581c87 → #9333ea                    ║
║  Audience partners: #047857 → #10b981                    ║
║  Audience voices:   #be185d → #ec4899                    ║
║                                                          ║
║  Squircle icon: viewBox 200×200 rx 40                    ║
║  App icon: viewBox 680×680 rx 150 / 1024×1024 rx 225    ║
║                                                          ║
║  Workflow:                                               ║
║  1. Copiar bloque entre --- PASTE START/END ---          ║
║  2. Pegar en claude.ai (nueva conversación)              ║
║  3. Claude entrega SVG en bloque ```svg                  ║
║  4. Guardar en ruta indicada                             ║
║  5. SVGO optimize                                        ║
║  6. Commit con ID del prompt                             ║
╚══════════════════════════════════════════════════════════╝
```

---

## 24. Backlog expandido — prompts adicionales

Esta sección completa la librería con todos los prompts restantes del roadmap. Mismo formato self-contained que las secciones previas.

> **Convención de numeración:** Event kit sigue a partir de EVT-02 porque EVT-01 ya existe (Business Card en §17.1). Email kit sigue desde EML-02 (EML-01 = Welcome ya está en §19.1).

---

### 24.1. LOGO-09 · Wordmark vertical (stacked)

**Destino:** `public/brand-assets/logo/wordmark_vertical.svg` · **Prioridad:** P1 · **Peso:** < 2 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
digital + directorio público de veterinarios + comunidad;
100% gratis; SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND (estricto):
- Purple: #9333ea main · #581c87 deep · #a855f7 mid
- Ink (texto): #1a102b
- Blanco: #ffffff

TIPOGRAFÍA:
- Wordmark: 'Fredoka', 'Plus Jakarta Sans', system-ui, peso 600

ESTILO: flat modern, isotipo pata + corazón negative space sobre
squircle iOS.

REGLAS SVG:
- Vectorial limpio, paths simples
- <title>, role="img", <desc>
- Peso < 2 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con comentario
  <!-- wordmark_vertical.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Wordmark vertical stacked (redes, perfil, avatar grande)
═════════════════════════════════════════════════════════

ARCHIVO: wordmark_vertical.svg
DIMENSIONES: viewBox 0 0 400 500
PRIORIDAD: P1
USO: perfiles redes sociales, merchandising, splash secundario.

COMPOSICIÓN (de arriba hacia abajo):
- Isotipo centrado horizontalmente, arriba
  · Squircle rx 22%: gradient radial #9333ea centro → #581c87 bordes
  · Pata blanca 4 pétalos arriba + cuerpo ovalado abajo
  · Corazón negative space en centro del cuerpo ovalado
  · Size: 240×240 dentro del viewBox 400×500
  · Margin top: 40px
- Gap: 40px
- Wordmark "Paw Friend"
  · Font: Fredoka 600, 72px
  · Color: #1a102b
  · Centrado horizontalmente
  · Baseline ~ y=420
- Tagline sub (opcional): "hecha en Chile" debajo
  · Font: Fredoka 400, 20px
  · Color: #6b21a8 (purple-800)
  · Centrado, y ~ 465

SAFE AREA: 40px libres alrededor del bloque completo.

FONDO: transparente.

TITLE: "Paw Friend Wordmark Vertical"
DESC: "Wordmark vertical stacked para perfiles de redes sociales y
merchandising. Isotipo squircle purple gradient arriba, wordmark
Fredoka 600 ink abajo, tagline hecha en Chile en purple-800."

--- PASTE END ---
```

---

### 24.2. LOGO-10 · Monogram variants (PF)

**Destino:** `public/brand-assets/logo/monogram_pf.svg` · **Prioridad:** P1 · **Peso:** < 2 KB

```
--- PASTE START ---

Necesito un SVG oficial para Paw Friend (app chilena: ficha médica
digital + directorio vets + comunidad; SpA RUT 78.328.659-9;
pawfriend.cl; mascotas reales del founder: Kai pastor suizo + Ema
gata negra).

PALETA BRAND (estricto):
- Purple: #9333ea main · #581c87 deep · #a855f7 mid · #e9d5ff light
- Gold: #f59e0b · #fbbf24
- Ink: #1a102b · Paper: #faf7ff · Blanco: #ffffff

TIPOGRAFÍA:
- Monogram: 'Fredoka', peso 700

ESTILO: flat modern, monogram para espacios chicos (favicon xxl,
watermark, social story corner).

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 2 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con 3 variantes en
  columnas dentro del mismo viewBox

═════════════════════════════════════════════════════════
PEDIDO: 3 variantes de monogram "PF" side by side
═════════════════════════════════════════════════════════

ARCHIVO: monogram_pf.svg
DIMENSIONES: viewBox 0 0 900 300 (3 variantes en fila, c/u 300×300)
PRIORIDAD: P1

LAS 3 VARIANTES (de izquierda a derecha, cada una 300×300 centrada):

VARIANTE A — "Primary" (x 0 a 300):
- Squircle 240×240 centrado en 150,150
- Fill: gradient radial #9333ea → #581c87
- Letras "PF" en blanco, Fredoka 700, 140px, centradas
- P y F juntas compartiendo trazo vertical (ligadura suave)

VARIANTE B — "Gold accent" (x 300 a 600):
- Squircle 240×240 centrado en 450,150
- Fill: #1a102b (ink)
- Letras "PF" en gold gradient #fbbf24 → #f59e0b
- Sutil heart gold #fbbf24 muy pequeño en la intersección P+F
- Fredoka 700, 140px

VARIANTE C — "Outline minimal" (x 600 a 900):
- Squircle 240×240 centrado en 750,150
- Fill: transparent, stroke #9333ea, stroke-width 4
- Letras "PF" stroke #9333ea, stroke-width 6, fill transparent
- Fredoka 700, 140px

REGLAS:
- Cada variante en <g> propio con id: monogram-primary,
  monogram-gold, monogram-outline
- Permite extracción de variantes individuales
- SAFE AREA: 30px alrededor de cada squircle

TITLE: "Paw Friend Monogram PF Variants"
DESC: "Tres variantes de monogram PF: primary purple gradient,
gold accent sobre ink, outline minimal. Para favicons xxl,
watermarks y social story corners."

--- PASTE END ---
```

---

### 24.3. ICN-51 a ICN-60 (lote 10 íconos)

**Destino:** `public/brand-assets/icons/51_trophy_pets.svg` … `60_emergency.svg` · **Prioridad:** P1 · **Peso:** < 1.5 KB c/u

```
--- PASTE START ---

Necesito 10 SVGs oficiales para Paw Friend (app chilena: ficha
médica digital + directorio vets + comunidad; SpA RUT 78.328.659-9;
pawfriend.cl).

PALETA BRAND (estricto):
- Purple: #9333ea main · #a855f7 mid · #581c87 deep
- Gold: #eab308 · #f59e0b · #fbbf24
- Emerald: #10b981 · #047857
- Rose: #ec4899 · #be185d
- Rojo emergencia: #dc2626
- Blanco: #ffffff

ESTILO: flat modern, squircle iOS viewBox 200×200 rx 40, contenido
blanco con acento gold donde se especifica.

REGLAS SVG:
- Vectorial limpio, paths simples
- <title>, role="img", <desc> cada uno
- Peso < 1.5 KB cada uno
- Entrega: 10 bloques SVG separados, cada uno con comentario
  <!-- NN_nombre.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 10 íconos brand squircle (ICN-51 a ICN-60)
═════════════════════════════════════════════════════════

Para cada uno: squircle 200×200 rx 40, fill según indicación,
contenido blanco centrado con acentos gold si se especifica.

───────────────────────────────────────────────────────────

51_trophy_pets.svg — "Trofeo peludo / celebración"
Fill squircle: gradient 135° #9333ea → #a855f7
Contenido blanco: trofeo clásico (copa con dos asas + base ancha +
pedestal). Dentro de la copa, silueta pequeña de pata blanca
asomando. Estrellitas gold #fbbf24 (3 peq) alrededor del trofeo.

52_gift.svg — "Regalo / recompensa"
Fill squircle: #ec4899 (rose)
Contenido blanco: caja de regalo 3D (frente + lateral sutil) con
lazo arriba en 2 bucles. Moño con acento gold #f59e0b en el nudo
central. Etiqueta pequeña colgando del lazo con corazón diminuto.

53_camera_pet.svg — "OCR / escanear carnet"
Fill squircle: #9333ea
Contenido blanco: cámara estilizada (cuerpo rectangular rounded +
lente circular grande central + flash pequeño arriba-derecha).
Dentro del lente, corazón pequeño gold #fbbf24. 4 esquinas de foco
(corchetes peq) alrededor del cuerpo simulando OCR scan.

54_settings.svg — "Configuración"
Fill squircle: #581c87 (purple deep)
Contenido blanco: engranaje 8 dientes con círculo interior hueco
(negative space deja ver fondo) + pata pequeña blanca en el
centro del hueco.

55_bell.svg — "Recordatorio / notificación"
Fill squircle: #9333ea
Contenido blanco: campana clásica con badillo inferior + línea de
sonido curva arriba (como ondas) a cada lado. Punto gold #fbbf24
en el tope sugiriendo notificación activa.

56_shield.svg — "Privacidad / seguridad datos"
Fill squircle: gradient 135° #047857 → #10b981 (emerald)
Contenido blanco: escudo clásico con check interior grande
centrado. En la parte superior del escudo, pequeña pata negative
space (hueco dejando ver el fill emerald).

57_microchip.svg — "ID registro / microchip"
Fill squircle: #9333ea
Contenido blanco: chip electrónico cuadrado con 4 pines a cada lado
+ centro con patrón de circuitos simples (líneas rectas con
terminaciones redondas). Corazón pequeño gold #fbbf24 en el centro
del chip.

58_birthday.svg — "Cumpleaños / aniversario"
Fill squircle: #ec4899 (rose)
Contenido blanco: torta de 2 pisos con velitas (3 velas arriba,
llamitas gold #fbbf24). Pata pequeña decorativa en el piso
superior. 2 corazones pequeños gold flotando a los lados.

59_travel.svg — "Viaje con mascota"
Fill squircle: gradient 135° #047857 → #10b981 (emerald)
Contenido blanco: maleta rectangular rounded con asa arriba +
esquinas reforzadas + en el centro de la maleta una pata pequeña
negative space (hueco). Etiqueta de viaje gold #fbbf24 pequeña
colgando del asa.

60_emergency.svg — "Emergencia 24h"
Fill squircle: #dc2626 (rojo emergencia)
Contenido blanco: cruz médica clásica (plus symbol rounded) con
círculo alrededor. Números "24" pequeños en gold #fbbf24 en la
parte inferior del círculo.

───────────────────────────────────────────────────────────

Cada SVG: <title> corto (Trofeo peludo, Regalo, OCR, etc.),
<desc> describiendo el uso en Paw Friend.

Entrega 10 bloques SVG separados.

--- PASTE END ---
```

---

### 24.4. IOS-02 · App Store 5.5" slides 2-5

**Destino:** `public/brand-assets/store/ios/5.5/slide_02.svg` … `slide_05.svg` · **Prioridad:** P0 · **Peso:** < 15 KB c/u

```
--- PASTE START ---

Necesito 4 SVGs oficiales (slides) para App Store iOS 5.5" de Paw
Friend (app chilena: ficha médica digital + directorio público de
veterinarios + comunidad; 100% gratis; SpA RUT 78.328.659-9;
pawfriend.cl).

DIMENSIONES REQUERIDAS POR APPLE:
- 5.5" display: 1242 × 2208 (portrait)
- viewBox: 0 0 1242 2208

PALETA BRAND (estricto):
- Purple: #9333ea main · #7e22ce · #581c87 deep · #a855f7 mid
- Gold: #f59e0b · #fbbf24 · #fde68a
- Emerald: #10b981 · #047857
- Rose: #ec4899 · #be185d
- Ink: #1a102b · Paper: #faf7ff · Blanco: #ffffff

TIPOGRAFÍA:
- Headline: 'Fredoka', peso 600, tracking tight
- Body: 'Plus Jakarta Sans', peso 500
- Mono: 'JetBrains Mono' (si aparece data)

ESTILO VISUAL:
Flat modern, gradient hero backgrounds + mockup iPhone ilustrado
minimal + headline grande + subhead + 1 feature pill. Sin raster.
Sin fotos.

REGLAS SVG:
- Vectorial limpio, paths simples, sin raster embed
- <title>, role="img", <desc> cada uno
- Peso < 15 KB cada uno
- Entrega: 4 bloques SVG separados con comentarios
  <!-- slide_0X.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 4 slides App Store iOS 5.5" (slides 2-5)
═════════════════════════════════════════════════════════

COMPOSICIÓN COMÚN (todos los slides):
- Fondo: gradient radial top-left según audiencia
- Headline top: Fredoka 600, 96px, blanco o ink según contraste
- Subhead: Plus Jakarta Sans 500, 44px, opacity 0.85
- Mockup iPhone 14 vertical (estilizado, no realista) centrado
  abajo mostrando pantalla del feature
- Pill gold inferior con mensaje clave (Fredoka 600, 36px)
- Safe area 120px top/bottom, 80px lados

───────────────────────────────────────────────────────────

slide_02.svg — "Directorio público de vets"
Fondo: gradient #9333ea top-left → #581c87 bottom-right
Headline: "Encuentra tu vet de confianza"
Subhead: "Directorio público con +400 veterinarios de Chile"
Mockup iPhone: lista de tarjetas vet (3 visibles) cada una con
avatar circular, nombre, comuna, rating estrellas gold, badge verde
"verificado"
Pill gold inferior: "Sin costo · Sin registro"
Ilustración lateral: pin de mapa flotante con corazón adentro

slide_03.svg — "Ficha médica compartible"
Fondo: gradient #047857 top-left → #10b981 bottom-right
Headline: "Comparte la ficha en 1 click"
Subhead: "PDF oficial + link 30 días. Tu vet lo recibe al toque."
Mockup iPhone: ficha PDF visible con header Paw Friend, datos
mascota (Kai, pastor suizo), sección vacunas con checks emerald,
botón grande gold "Compartir PDF"
Pill gold inferior: "PDF + WhatsApp directo"
Ilustración lateral: ícono WhatsApp + arrow flotante

slide_04.svg — "Comunidad pet lover"
Fondo: gradient #ec4899 top-left → #be185d bottom-right
Headline: "No estás solo"
Subhead: "Comunidad real de tutores chilenos que se apoyan"
Mockup iPhone: feed social con 2 cards de posts (mascotas + tutores),
contador de likes con corazones rose, avatar + comentarios
Pill gold inferior: "Más de 10.000 peludos ya están"
Ilustración lateral: 3 avatares circulares solapados + pata

slide_05.svg — "100% gratis para dueños"
Fondo: gradient #f59e0b top-left → #d97706 bottom-right
Headline: "Gratis. Siempre."
Subhead: "Hecha en Chile por un fundador + su manada"
Mockup iPhone: pantalla /paw-core con los 3 valores (gratis,
hecha en Chile, comunidad) en cards + foto placeholder del founder
+ mascotas
Pill gold inferior: "Sin letra chica · Sin ads intrusivos"
Ilustración lateral: corazón grande con bandera de Chile pequeña
adentro

───────────────────────────────────────────────────────────

Cada SVG:
- <title>: "Paw Friend App Store Slide 0X"
- <desc>: descripción del feature mostrado
- Optimizado visual + peso < 15 KB

Entrega 4 bloques SVG separados.

--- PASTE END ---
```

---

### 24.5. IOS-03 · App Preview video storyboard (NO SVG)

**Destino:** `docs-raiz/store-assets/ios_app_preview_storyboard.md` · **Prioridad:** P1 · **Formato:** documento narrativo (storyboard para editor de video externo)

> **Importante:** IOS-03 requiere producción de video (15-30s) que **NO se hace con Claude**. Claude entrega el storyboard detallado para un editor (Final Cut Pro / DaVinci / CapCut). Usar QuickTime de un iPhone real para capturar pantallas, o tomar screens de la app y animarlas.

```
--- PASTE START ---

Necesito que redactes un storyboard completo (no SVG) para un
video App Preview de App Store iOS 30 segundos, para Paw Friend
(app chilena: ficha médica digital + directorio público de vets +
comunidad; 100% gratis; SpA RUT 78.328.659-9; pawfriend.cl).

FORMATO DEL STORYBOARD:
Markdown con estructura por escena. Cada escena incluye:
- Timestamp (00:00 - 00:04)
- Shot description (qué se ve en la pantalla/mockup)
- Text overlay (copy que aparece, en español chileno)
- Audio/SFX sugerido
- Captura recomendada (qué pantalla de la app capturar o qué ilustrar)

ESPECIFICACIONES APPLE:
- Duración: 15-30 segundos (apuntar a 28s)
- Sin voz en off (el usuario ve el preview silenciado en el store)
- Sin texto crítico en los primeros 3 segundos (Apple recomienda hook visual)
- Capturas directas de la app (no mockups externos)
- Copy en español chileno (tuteo: tu, tienes, puedes; NO voseo)

COPY CHILENO:
"tu", "tienes", "puedes", "nuestro", "chile" (lowercase donde
sea natural). NO "vos tenes" (argentino). NO "vosotros" (España).

ARCO NARRATIVO (obligatorio):
1. Hook emocional (0-3s): el dolor real del tutor
2. Presentación solución (3-10s): Paw Friend resuelve
3. Demo core features (10-22s): ficha + directorio + comunidad
4. Cierre CTA (22-28s): "gratis, en chile, para siempre"

═════════════════════════════════════════════════════════
PEDIDO: Storyboard App Preview iOS 28s
═════════════════════════════════════════════════════════

ENTREGA:
Documento markdown con 6-8 escenas, cada una con los 5 campos arriba.
Incluye sección final de specs técnicos:
- Resolución: 1080×1920 o 886×1920 (iPhone 5.5)
- FPS: 30
- Formato entrega: .mov H.264
- Música sugerida (royalty-free indicada con tono: cálido + hopeful)

Incluye al final checklist de captura (qué pantallas de la app hay
que grabar en QuickTime conectado al iPhone).

Entrega TODO el documento en un solo bloque markdown dentro de
```markdown ... ```

--- PASTE END ---
```

---

### 24.6. AND-02 · Play Store feature graphic seasonal variants

**Destino:** `public/brand-assets/store/android/feature_graphic_{base,summer,winter,holiday}.svg` · **Prioridad:** P1 · **Peso:** < 12 KB c/u

```
--- PASTE START ---

Necesito 4 SVGs oficiales (feature graphics) para Play Store
Android de Paw Friend (app chilena: ficha médica digital +
directorio vets + comunidad; 100% gratis; SpA RUT 78.328.659-9;
pawfriend.cl).

DIMENSIONES GOOGLE:
- 1024 × 500 (landscape obligatorio)
- viewBox: 0 0 1024 500

PALETA BRAND:
- Purple: #9333ea · #581c87 · #a855f7 · #e9d5ff
- Gold: #f59e0b · #fbbf24 · #fde68a
- Emerald estival: #10b981 · #34d399
- Blue invierno: #3b82f6 · #1e40af
- Rojo fiestas: #dc2626 · #fca5a5
- Ink: #1a102b · Blanco: #ffffff

TIPOGRAFÍA:
- Headline: 'Fredoka' 600
- Body: 'Plus Jakarta Sans' 500

REGLAS SVG:
- Vectorial, sin raster embed
- <title>, role="img", <desc>
- Peso < 12 KB cada uno
- Entrega 4 bloques SVG separados con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 4 feature graphics Play Store (base + 3 seasonal)
═════════════════════════════════════════════════════════

COMPOSICIÓN COMÚN:
- Fondo gradient según variante
- Isotipo Paw Friend (squircle + pata + corazón) + wordmark
  "Paw Friend" a la izquierda (ocupando ~35% del ancho)
- Claim principal a la derecha, Fredoka 600, 56px
- Decoración temática a la derecha-abajo según estación
- Safe area 40px

───────────────────────────────────────────────────────────

feature_graphic_base.svg — "Base year-round"
Fondo: gradient #9333ea → #581c87 diagonal
Claim: "Tu peludo merece lo mejor"
Subclaim: "Ficha médica + vets + comunidad · gratis"
Decor: 3 patas tonales flotando + 1 corazón gold

feature_graphic_summer.svg — "Verano (Dic-Feb Chile)"
Fondo: gradient #9333ea → #10b981 diagonal
Claim: "Verano contigo y tu peludo"
Subclaim: "Cuida a Kai con una ficha que va donde sea"
Decor: sol estilizado gold #fbbf24 + gotas de agua + pata
corriendo + hojas tropicales minimal

feature_graphic_winter.svg — "Invierno (Jun-Ago Chile)"
Fondo: gradient #581c87 → #1e40af diagonal
Claim: "Invierno sin miedo"
Subclaim: "Vacunas al día, ficha en tu bolsillo"
Decor: copos de nieve minimal blanco + pata con botita + termómetro
gold pequeño

feature_graphic_holiday.svg — "Fiestas Patrias + Navidad"
Fondo: gradient #dc2626 → #9333ea diagonal (rojo + purple)
Claim: "Fiestas con tu familia completa"
Subclaim: "Tu peludo también es familia 🇨🇱"
Decor: guirnalda minimal + estrellita gold + pata decorativa +
copihue estilizado rojo (flor nacional Chile)

───────────────────────────────────────────────────────────

Cada SVG:
- <title>: "Paw Friend Feature Graphic <variante>"
- <desc>: descripción breve
- Optimizado < 12 KB

Entrega 4 bloques SVG separados.

--- PASTE END ---
```

---

### 24.7. AND-03 · Play Store promo video storyboard (NO SVG)

**Destino:** `docs-raiz/store-assets/android_promo_video_storyboard.md` · **Prioridad:** P1 · **Formato:** documento narrativo

```
--- PASTE START ---

Necesito que redactes un storyboard completo para un video
promocional Play Store Android 30 segundos, para Paw Friend
(app chilena: ficha médica digital + directorio público de vets +
comunidad; 100% gratis; SpA RUT 78.328.659-9; pawfriend.cl).

FORMATO:
Markdown con estructura por escena (timestamp / shot / overlay /
SFX / captura). Mismo formato que app preview iOS pero con
diferencias:

ESPECIFICACIONES GOOGLE PLAY:
- Duración: 30 segundos (ideal), máximo 2 minutos
- Resolución: 1920×1080 (16:9 landscape) o 1080×1920 (9:16 portrait)
- Formato: mp4 H.264
- Sí acepta voz en off (a diferencia de Apple)
- Sí acepta mockups (a diferencia de Apple que exige screens reales)

ARCO NARRATIVO:
1. Hook (0-5s): founder habla a cámara o voz en off "hola, hice paw
   friend porque..."
2. Problema (5-10s): tutor buscando ficha en papel / al olvidar
   vacuna / sin encontrar vet de confianza
3. Solución (10-22s): demo app - ficha digital + directorio + comunidad
4. Diferenciador (22-27s): "gratis, hecha en chile, por una persona + su
   manada"
5. CTA (27-30s): logo + pawfriend.cl + "descárgala en Play Store"

COPY CHILENO (tuteo: tu, tienes; NO vos tenes; NO vosotros).

═════════════════════════════════════════════════════════
PEDIDO: Storyboard Play Store promo 30s
═════════════════════════════════════════════════════════

ENTREGA:
Documento markdown con:
1. Scene breakdown (6-8 escenas con los 5 campos)
2. Voice-over script completo (español chileno neutro para Chile)
3. Music recommendation (estilo + BPM + mood)
4. Graphics requirements (logos + lower thirds + callouts)
5. Shot list técnico (qué grabar/animar)

Todo en un solo bloque ```markdown```.

--- PASTE END ---
```

---

### 24.8. INV-03 · Financials sample P&L (template SVG)

**Destino:** `public/brand-assets/investor/financials_sample_pl.svg` · **Prioridad:** P1 · **Peso:** < 15 KB

```
--- PASTE START ---

Necesito un SVG oficial (plantilla P&L visual) para el data room
de inversionistas de Paw Friend (app chilena: ficha médica digital
+ directorio vets + comunidad; 100% gratis B2C; monetización 6
motores: donaciones + Paw Member + vets B2B Free/Premium/Pro Max
+ Paw Companys sponsors + Paw Voices creators + publicidad;
SpA RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea main · #581c87 deep · #e9d5ff light
- Gold: #f59e0b · #fbbf24
- Emerald (ingresos): #10b981 · #047857
- Rose (gastos): #ec4899 · #be185d
- Ink: #1a102b · Paper: #faf7ff

TIPOGRAFÍA:
- Display: 'Fredoka' 600
- Body: 'Plus Jakarta Sans' 500
- Mono (números): 'JetBrains Mono' 600

REGLAS SVG:
- Vectorial limpio
- Peso < 15 KB
- <title>, role="img", <desc>
- Entrega: UN SOLO SVG en bloque ```svg``` con <!-- financials_sample_pl.svg -->

═════════════════════════════════════════════════════════
PEDIDO: P&L sample visual data-room friendly
═════════════════════════════════════════════════════════

ARCHIVO: financials_sample_pl.svg
DIMENSIONES: viewBox 0 0 1200 900 (A4 landscape)
PRIORIDAD: P1
USO: incluido en data room + cierre de pitch + CORFO Semilla aplicación.

COMPOSICIÓN:
Header (y 0-120):
- Fondo: gradient #9333ea → #581c87
- Título "P&L Proyectado 12 meses" en Fredoka 600, 52px, blanco
- Subtítulo "Escenario conservador · Chile · CLP" Plus Jakarta 500,
  24px, purple-200

Tabla principal (y 140-760):
- Grid 6 columnas: Categoría · M3 · M6 · M9 · M12 · YoY%
- 7 filas:
  1. **INGRESOS** (bold, header ink)
  2. Paw Companys (3 sponsors Gold) - emerald bars
  3. Paw Member (500 suscriptores × $3.990) - emerald bars
  4. Vets Premium (40 × $9.900) - emerald bars
  5. Vets Pro Max (5 × $29.900) - emerald bars
  6. **Total Ingresos** (bold)
  7. **EGRESOS** (bold, header)
  8. Supabase + OpenAI + infra (~$80k) - rose bars
  9. Legal + contable + SpA (~$50k) - rose bars
  10. Marketing + events (~$150k) - rose bars
  11. **Total Egresos** (bold)
  12. **EBITDA** (bold gold background row)

Números en JetBrains Mono 600, 18px.
Barras mini horizontales al lado de cada categoría sugieren
evolución trimestral (sparklines).

Footer (y 780-900):
- Caja purple-50 con disclaimer:
  "Números ilustrativos para fines de pitch. No constituyen
  proyección financiera auditada. Hipótesis: activación completa
  de 6 motores + 10.000 MAU + 3 Paw Companys sponsors confirmados."
- Logo Paw Friend pequeño + pawfriend.cl + fecha "abril 2026"

TITLE: "Paw Friend P&L Sample Investor Deck"
DESC: "Plantilla visual P&L proyectado 12 meses con ingresos por
motor y egresos por categoría, formato para data room y pitches
CORFO/Start-Up Chile."

--- PASTE END ---
```

---

### 24.9. PRT-02 · Partner kit por vertical (4 verticales)

**Destino:** `public/brand-assets/partner/partner_kit_{alimento,restaurantes,seguros,accesorios}.svg` · **Prioridad:** P2 · **Peso:** < 10 KB c/u

```
--- PASTE START ---

Necesito 4 SVGs oficiales (covers + sellos) para Partner Kits
por vertical de Paw Friend (app chilena; 100% gratis B2C;
Paw Partners = tiendas/servicios que dan descuentos a Paw Members
a cambio de exposición gratuita en la app; SpA RUT 78.328.659-9).

VERTICALES DEL PROGRAMA PAW PARTNERS:
1. Alimento (pet food premium)
2. Restaurantes pet-friendly
3. Seguros para mascotas
4. Accesorios / tiendas de mascotas

PALETA BRAND:
- Purple: #9333ea main · #581c87 deep
- Emerald (partners principal): #10b981 · #047857
- Gold: #f59e0b · #fbbf24
- Rose: #ec4899
- Blue: #3b82f6
- Ink: #1a102b · Paper: #faf7ff

TIPOGRAFÍA:
- Display: 'Fredoka' 600
- Body: 'Plus Jakarta Sans' 500

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 10 KB cada uno
- Entrega: 4 bloques SVG separados con <!-- filename.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 4 covers A4 partner kits por vertical
═════════════════════════════════════════════════════════

DIMENSIONES: viewBox 0 0 2480 3508 (A4 portrait 300dpi)

COMPOSICIÓN COMÚN (todos):
- Fondo: gradient principal según vertical
- Logo Paw Friend (isotipo + wordmark blanco) top-left
- Badge "Paw Partners · Programa <vertical>" esquina superior derecha
  (pill gold)
- Hero illustration centrada mid (ilustrativa, no raster)
- Headline: "Bienvenido a Paw Partners" (Fredoka 600, 140px)
- Subhead específico del vertical
- Footer: pawfriend.cl + "hecho en chile" + fecha

───────────────────────────────────────────────────────────

partner_kit_alimento.svg — "Alimento premium"
Fondo: gradient #047857 top → #10b981 bottom
Hero: tazón de comida + saco de alimento + hueso + pata
Subhead: "Para marcas de alimento que quieren llegar a tutores que
priorizan la salud de sus peludos."
Sello grande centro-bajo: "Alimento certificado"

partner_kit_restaurantes.svg — "Restaurantes pet-friendly"
Fondo: gradient #9333ea top → #581c87 bottom
Hero: mesa con copa + tazón de agua para mascota + pata descansando
Subhead: "Para locales que abrazan a los peludos en su terraza."
Sello: "Pet-friendly Chile"

partner_kit_seguros.svg — "Seguros mascotas"
Fondo: gradient #3b82f6 top → #1e40af bottom
Hero: escudo + corazón + pata protegida
Subhead: "Para aseguradoras que entienden que los peludos también
son familia."
Sello: "Seguro pet-family"

partner_kit_accesorios.svg — "Accesorios y tiendas"
Fondo: gradient #ec4899 top → #be185d bottom
Hero: collar + correa + juguete + pelota
Subhead: "Para tiendas que tienen lo que tu peludo necesita y
sueña."
Sello: "Tienda amiga Paw"

───────────────────────────────────────────────────────────

Cada SVG con:
- TITLE específico
- DESC detallando vertical
- Logos de ejemplo como placeholders (3 círculos neutrales
  gris-claro al pie, sin marcas reales)
- Peso < 10 KB

Entrega 4 bloques SVG separados.

--- PASTE END ---
```

---

### 24.10. PRT-03 · Partner welcome kit cover A4

**Destino:** `public/brand-assets/partner/partner_welcome_cover.svg` · **Prioridad:** P2 · **Peso:** < 10 KB

```
--- PASTE START ---

Necesito un SVG oficial (cover A4) para el Partner Welcome Kit
de Paw Friend (app chilena; 100% gratis B2C; Paw Partners = tiendas
con descuentos a cambio de exposición gratuita; SpA RUT
78.328.659-9; pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea · #581c87 · #e9d5ff
- Gold: #f59e0b · #fbbf24
- Emerald: #10b981 · #047857
- Ink: #1a102b · Paper: #faf7ff · Blanco: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka' 600
- Body: 'Plus Jakarta Sans' 500
- Handwritten accent (opcional): 'Caveat' si disponible, sino Fredoka 400

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 10 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con
  <!-- partner_welcome_cover.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Cover A4 Partner Welcome Kit
═════════════════════════════════════════════════════════

ARCHIVO: partner_welcome_cover.svg
DIMENSIONES: viewBox 0 0 2480 3508 (A4 portrait 300dpi)
PRIORIDAD: P2
USO: se adjunta al email de bienvenida cuando se confirma un
partner + se imprime a pedido para reuniones presenciales.

COMPOSICIÓN:
Top (y 0-700):
- Fondo: gradient #9333ea → #581c87
- Esquina superior izquierda: logo Paw Friend blanco (isotipo +
  wordmark)
- Esquina superior derecha: fecha + folio único (placeholder "#XXX")
  en Mono 18px

Mid hero (y 700-2000):
- Fondo: blanco (#ffffff)
- Badge pill gold centrado: "PAW PARTNERS · BIENVENIDO"
- Headline grande Fredoka 600 200px ink: "Somos familia ahora"
- Sub Fredoka 400 60px purple-800: "gracias por sumarte al círculo
  de tiendas que cuidan a los peludos de Chile"
- Ilustración central: 2 patas dándose la mano (unión peludo +
  partner) dentro de un círculo pastel gold (fondo #fef3c7), tamaño
  600×600 aprox
- 3 bullets de beneficios en columnas (30px padding):
  · "exposición gratuita · tu logo en /donaciones"
  · "acceso a tutores Paw Members con descuentos"
  · "badge partner · mención en redes"

Footer (y 2000-3508):
- Banda purple-900 (#581c87) con:
  · Wordmark Paw Friend blanco
  · pawfriend.cl
  · paw.partners@pawfriend.cl (placeholder)
  · "hecho en chile · con amor · por una persona + su manada"
  · Patrón sutil de patas opacity 0.1 decorativo

TITLE: "Paw Friend Partner Welcome Cover"
DESC: "Portada A4 del kit de bienvenida para nuevos Paw Partners.
Incluye headline cálido, 3 beneficios clave y contacto."

--- PASTE END ---
```

---

### 24.11. PRS-02 · Media backgrounder (1-pager)

**Destino:** `public/brand-assets/press/media_backgrounder.svg` · **Prioridad:** P1 · **Peso:** < 12 KB

```
--- PASTE START ---

Necesito un SVG oficial (media backgrounder A4 1-pager) para
periodistas y prensa de Paw Friend (app chilena: ficha médica
digital + directorio público de vets + comunidad; 100% gratis B2C;
hecha por una persona + IA + mascotas reales Kai y Ema; SpA
SUSAETA GARNHAM SOFTWARE ENGINEERING RUT 78.328.659-9; pawfriend.cl).

PALETA BRAND (estricto):
- Purple: #9333ea · #581c87 · #e9d5ff
- Gold: #f59e0b · #fbbf24
- Ink: #1a102b · Paper: #faf7ff

TIPOGRAFÍA:
- Display: 'Fredoka' 600
- Body: 'Plus Jakarta Sans' 500 / 400
- Mono: 'JetBrains Mono' 600 para números

REGLAS SVG:
- Vectorial limpio, sin raster
- <title>, role="img", <desc>
- Peso < 12 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con
  <!-- media_backgrounder.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Media backgrounder A4 1-pager
═════════════════════════════════════════════════════════

ARCHIVO: media_backgrounder.svg
DIMENSIONES: viewBox 0 0 2480 3508 (A4 portrait 300dpi)
PRIORIDAD: P1
USO: se envía a periodistas + medios + bloggers pet cuando hay
entrevista o cobertura.

ESTRUCTURA DE CONTENIDO:
Header (0-400):
- Wordmark Paw Friend + tagline "hecha en chile"
- Badge gold: "MEDIA BACKGROUNDER · PARA PRENSA"
- Fecha: "abril 2026"

Sección "¿Qué es Paw Friend?" (400-900):
- Headline Fredoka 600 100px: "¿Qué es Paw Friend?"
- Párrafo 24px: "La primera app chilena que junta ficha médica
  digital + directorio público de veterinarios + comunidad de
  tutores. 100% gratis para dueños, siempre. Hecha desde Chile
  por una persona con ayuda de IA, pensando en Kai (pastor suizo),
  Ema (gata negra) y todos los peludos del país."

Sección "Por los números" (900-1500):
- 4 KPIs en grid 2×2 con cards purple-50:
  · "10.000+" peludos registrados
  · "400+" vets en directorio
  · "$0" costo para dueños
  · "0 letra chica" política de datos
- Cada KPI en JetBrains Mono 80px gold

Sección "Hitos" (1500-2200):
- Timeline horizontal con 4 milestones:
  · 2025 Q4: primera línea de código
  · 2026 Q1: beta cerrada vets pioneros
  · 2026 abril: lanzamiento público
  · 2026 Q3: expansión Latam (visión)

Sección "Contacto prensa" (2200-2900):
- Card con:
  · Email: pawfriendcl@gmail.com
  · Voceros: Paw Founder (fundador) · Kai & Ema (mascotas oficiales)
  · Ciudad: Santiago, Chile
  · Disponibilidad: lunes a viernes, coordinar entrevistas por email

Footer (2900-3508):
- Banda purple-900: logo + pawfriend.cl + copyright 2026

TITLE: "Paw Friend Media Backgrounder"
DESC: "Documento 1-pager A4 para prensa con qué es Paw Friend,
KPIs, hitos y contacto de voceros."

--- PASTE END ---
```

---

### 24.12. PRS-03 · Founder photo guidelines (NO SVG)

**Destino:** `docs-raiz/press-kit/founder_photo_guidelines.md` · **Prioridad:** P1 · **Formato:** documento narrativo

> **Importante:** las fotos reales del founder + Kai + Ema deben hacerse con cámara (no Claude). Este prompt entrega **las guidelines** para el fotógrafo o para el propio founder con iPhone.

```
--- PASTE START ---

Necesito que redactes un documento de guidelines fotográficas
para las fotos oficiales del founder de Paw Friend (app chilena;
SpA RUT 78.328.659-9; pawfriend.cl; mascotas reales: Kai pastor
suizo + Ema gata negra).

CONTEXTO:
El founder firma públicamente como "Paw Founder" (alias para
materiales de marketing). Las fotos del kit de prensa incluyen al
founder con Kai y/o Ema. Estas fotos se usarán en:
- Press kit enviado a periodistas
- Landing /paw-core sección "alma del proyecto"
- Data room inversionistas
- Redes sociales hitos personales
- Perfil founder pitch

GUIDELINES REQUERIDAS:

1. Composition
   - Rule of thirds
   - Mascotas siempre a la misma altura visual o más alta que el
     founder (nunca por debajo dominante)
   - Espacio libre a la derecha para superponer overlay de texto

2. Iluminación
   - Luz natural mañana/atardecer (golden hour Chile 18-20h verano)
   - Evitar sol directo mediodía
   - Backlight suave aceptable

3. Background
   - Exteriores Chile: parques Santiago (Metropolitano, Bicentenario,
     Araucano), cordillera de fondo (✨diferenciador chileno), barrio
     Providencia/Ñuñoa
   - Interiores: casa warm, mucha luz, plantas, detalles cálidos,
     NO oficina estéril
   - NO: locaciones corporativas frías, NO fondos verde croma

4. Vestuario
   - Tonos brand-consistent: purples suaves, tonos tierra gold, blanco
     crema
   - EVITAR: marcas muy visibles, colores fuera de paleta brand,
     uniformes corporativos
   - Accesorios de Kai/Ema: collar brand color (purple o gold), nada
     estridente

5. Expresión
   - Natural, relajada, conectada con las mascotas
   - Evitar poses de "CEO corporativo"
   - Mostrar cercanía real: mirando a la mascota, abrazándola, en el
     suelo a su altura

6. Técnico
   - Formato: RAW + JPEG alta calidad
   - Resolución mínima: 6000×4000 (full frame)
   - Entrega final: 3-5 hero shots + 8-12 alternativas
   - Edición: color grading warm, contraste moderado, NO filtros
     Instagram obvios

7. Derechos de uso
   - Founder firma consentimiento de uso comercial
   - Mascotas → el founder es responsable (Kai y Ema son suyas)
   - Si hay otro humano en foto → release form obligatorio

8. Shot list sugerido
   - Retrato head-shot fondo neutro (para pitch)
   - Founder + Kai + Ema en casa
   - Founder trabajando en laptop con Kai al lado
   - Founder en parque con Kai corriendo de fondo
   - Detalle manos acariciando a Ema
   - Wide shot familia completa

FORMATO ENTREGA:
Documento markdown con secciones claras + checklist final para el
fotógrafo + ejemplos de referencia (links a moodboards tipo Pinterest
sin incluir imágenes con copyright).

Entrega en un solo bloque ```markdown```.

--- PASTE END ---
```

---

### 24.13. PRS-04 · Logo pack grid (visual reference sheet)

**Destino:** `public/brand-assets/press/logo_pack_grid.svg` · **Prioridad:** P1 · **Peso:** < 15 KB

```
--- PASTE START ---

Necesito un SVG oficial (hoja de referencia A4 landscape) que
muestra la grilla completa de logos oficiales de Paw Friend para
descargar desde el press kit (app chilena; 100% gratis B2C;
pawfriend.cl).

PALETA BRAND:
- Purple: #9333ea · #581c87 · #e9d5ff
- Gold: #f59e0b · #fbbf24
- Ink: #1a102b · Paper: #faf7ff · Blanco: #ffffff · Negro: #000000

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 15 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con
  <!-- logo_pack_grid.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Logo pack grid A4 landscape
═════════════════════════════════════════════════════════

ARCHIVO: logo_pack_grid.svg
DIMENSIONES: viewBox 0 0 3508 2480 (A4 landscape 300dpi)
PRIORIDAD: P1
USO: una hoja que incluye 8 presentaciones del logo con indicación
de uso. Se descarga desde /press junto a los SVGs individuales.

COMPOSICIÓN:
Header (y 0-300):
- Fondo blanco
- Título "Logo Pack · Paw Friend" Fredoka 600 80px ink
- Subtítulo "Usa el logo correcto para cada contexto" Plus Jakarta
  500 32px purple-800
- Safe area 120px laterales

Grid 4×2 (y 300-2100):
Cada celda 780×800, borde suave purple-100, padding 40px. Cada una
con:
- Preview del logo (ocupando 70% de la celda)
- Label abajo (Fredoka 600 32px)
- Spec técnico (Plus Jakarta 400 20px)

CELDAS (de izq a der, top a bottom):

1. Primary (fondo blanco)
   Logo: isotipo squircle gradient + wordmark ink
   Label: "Primary · fondo claro"
   Spec: "wordmark_horizontal_light.svg · P0"

2. Dark mode (fondo ink #1a102b)
   Logo: isotipo squircle gradient + wordmark blanco
   Label: "Dark mode · fondo oscuro"
   Spec: "wordmark_horizontal_dark.svg · P0"

3. Monochrome purple (fondo blanco)
   Logo: todo en #9333ea (isotipo + wordmark)
   Label: "Monochrome purple · flexible"
   Spec: "wordmark_mono_purple.svg · P1"

4. Monochrome black (fondo blanco)
   Logo: todo en #1a102b
   Label: "Monochrome black · print especial"
   Spec: "wordmark_mono_black.svg · P1"

5. Vertical (fondo blanco)
   Logo: isotipo arriba + wordmark + tagline debajo
   Label: "Vertical stacked · perfil redes"
   Spec: "wordmark_vertical.svg · P1"

6. Isotipo solo (fondo purple-50 #faf5ff)
   Logo: solo squircle + pata + corazón
   Label: "Isotipo solo · favicon y apps"
   Spec: "app_icon_ios_1024.svg · P0"

7. Monogram PF primary (fondo blanco)
   Logo: "PF" primary variant
   Label: "Monogram · espacios muy chicos"
   Spec: "monogram_pf.svg (variant A)"

8. Wordmark solo (fondo blanco)
   Logo: solo texto "Paw Friend" Fredoka 600 ink
   Label: "Wordmark sin isotipo · firma email"
   Spec: "wordmark_text_only.svg · P2"

Footer (y 2100-2480):
- Banda gold #fef3c7 con reglas de uso:
  · "NO distorsionar, rotar ni cambiar colores fuera de la paleta"
  · "Safe area: 20% del lado del isotipo alrededor del logo"
  · "Descargas individuales: pawfriend.cl/press"
- Esquina derecha: pawfriend.cl + contacto prensa

TITLE: "Paw Friend Logo Pack Grid"
DESC: "Hoja A4 landscape de referencia con las 8 variantes
oficiales del logo de Paw Friend + reglas de uso + specs."

--- PASTE END ---
```

---

### 24.14. EVT-02 · Roll-up banner 85×200cm

**Destino:** `public/brand-assets/events/rollup_85x200.svg` · **Prioridad:** P1 · **Peso:** < 15 KB

```
--- PASTE START ---

Necesito un SVG oficial (roll-up banner para eventos y ferias) de
Paw Friend (app chilena: ficha médica digital + directorio público
de vets + comunidad; 100% gratis B2C; SpA RUT 78.328.659-9;
pawfriend.cl).

DIMENSIONES FÍSICAS:
- 85 cm × 200 cm (alto)
- A 300dpi: 10039 × 23622 px
- Para SVG usamos viewBox escalado: 0 0 850 2000 (1 unidad = 1mm)

PALETA BRAND:
- Purple: #9333ea · #581c87 · #a855f7 · #e9d5ff
- Gold: #f59e0b · #fbbf24 · #fde68a
- Ink: #1a102b · Paper: #faf7ff · Blanco: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka' 600
- Body: 'Plus Jakarta Sans' 500

REGLAS SVG:
- Vectorial limpio (el impresor lo escala a 300dpi sin pérdida)
- <title>, role="img", <desc>
- Peso < 15 KB
- Zona de "bleed" 20mm en los bordes (no poner texto crítico ahí)
- Zona de "safe" 30mm desde el borde (texto crítico solo ahí adentro)
- Entrega: UN SOLO SVG en bloque ```svg``` con
  <!-- rollup_85x200.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Roll-up banner 85×200cm para ferias/eventos
═════════════════════════════════════════════════════════

ARCHIVO: rollup_85x200.svg
DIMENSIONES: viewBox 0 0 850 2000
PRIORIDAD: P1
USO: ferias pet (Petfest, ExpoMascotas), conferencias
emprendimiento (CORFO, Start-Up Chile), stand de voluntariado.

COMPOSICIÓN (de arriba hacia abajo):

Top third (y 0-600):
- Fondo: gradient #9333ea top → #581c87 bottom
- Logo Paw Friend (isotipo + wordmark blanco) centrado horizontalmente,
  tamaño 500 de ancho, a y=200
- Tagline "hecha en chile, con amor" Fredoka 400 40px gold centrada
  y=400

Mid third (y 600-1400):
- Fondo blanco
- Headline Fredoka 600 120px ink centrada: "Tu peludo"
- Headline segunda línea Fredoka 600 120px gradient purple: "lo vale"
- Subhead Plus Jakarta 500 48px purple-800 centrado:
  "Ficha médica digital + vets verificados + comunidad"
- 3 iconos grandes en fila (squircles 150×150):
  · Ficha (purple) - etiqueta "FICHA"
  · Vets (emerald) - etiqueta "VETS"
  · Comunidad (rose) - etiqueta "COMUNIDAD"

Bottom third (y 1400-2000):
- Fondo: gradient #fef3c7 → #fde68a (gold cálido)
- QR grande centrado (500×500) linkeando a pawfriend.cl
  (representar como grid de cuadraditos estilizado, no QR real —
  al imprimir se reemplaza por QR real)
- Texto abajo: "escanea y descarga gratis" Fredoka 600 60px ink
- Footer muy pequeño: pawfriend.cl · SpA RUT 78.328.659-9

Safe zone: 30mm desde el borde. Logo/headline/QR todos dentro de
safe zone.

TITLE: "Paw Friend Roll-up 85x200"
DESC: "Banner vertical roll-up para ferias y eventos. Hero con
logo, headline principal, 3 pilares iconográficos y QR a la app."

--- PASTE END ---
```

---

### 24.15. EVT-03 · Backdrop modular 3×2.5m

**Destino:** `public/brand-assets/events/backdrop_3x2_5.svg` · **Prioridad:** P2 · **Peso:** < 15 KB

```
--- PASTE START ---

Necesito un SVG oficial (backdrop modular para stand de eventos) de
Paw Friend (app chilena; 100% gratis; SpA RUT 78.328.659-9;
pawfriend.cl).

DIMENSIONES FÍSICAS:
- 3 m ancho × 2.5 m alto (backdrop modular pop-up)
- Para SVG: viewBox 0 0 3000 2500 (1 unidad = 1mm)

PALETA BRAND:
- Purple: #9333ea · #581c87 · #a855f7 · #e9d5ff
- Gold: #f59e0b · #fbbf24
- Ink: #1a102b · Blanco: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka' 600
- Body: 'Plus Jakarta Sans' 500

REGLAS SVG:
- Vectorial limpio
- Zona bleed 50mm borde
- <title>, role="img", <desc>
- Peso < 15 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con
  <!-- backdrop_3x2_5.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Backdrop modular stand eventos
═════════════════════════════════════════════════════════

ARCHIVO: backdrop_3x2_5.svg
DIMENSIONES: viewBox 0 0 3000 2500

COMPOSICIÓN:
- Fondo base: gradient #9333ea top-left → #581c87 bottom-right
- Patrón decorativo sutil: patas blancas opacity 0.08 distribuidas
  en grid (8 columnas × 6 filas desalineadas)
- Bloque hero centro-izquierda:
  · Logo Paw Friend XXL (1200 de ancho, isotipo + wordmark blanco)
  · Tagline debajo Fredoka 400 80px gold: "hecha en chile con amor"
- Bloque derecha (mockup ilustrativo del iPhone):
  · iPhone estilizado 600×1200 con pantalla "My Pets" mostrando
    foto-ilustración de Kai + Ema + 1 peludo más + botón "ver ficha"
  · Flotando sobre fondo con shadow sutil
- Footer centrado y=2300:
  · "pawfriend.cl" Fredoka 600 100px blanco
  · Debajo: "escanea el QR arriba o búscanos en redes @pawfriendcl"
    Plus Jakarta 400 40px gold
- Safe zones respetadas (hero dentro de 2500×2000 centrado)

TITLE: "Paw Friend Backdrop Stand 3x2.5"
DESC: "Backdrop modular para stands de eventos. Hero con logo
grande, tagline emocional, mockup iPhone ilustrativo y pie con URL
+ redes."

--- PASTE END ---
```

---

### 24.16. EVT-04 · Lanyard + nametag

**Destino:** `public/brand-assets/events/lanyard_nametag.svg` · **Prioridad:** P2 · **Peso:** < 8 KB

```
--- PASTE START ---

Necesito un SVG oficial (lanyard con nametag impreso) de Paw Friend
(app chilena; SpA RUT 78.328.659-9; pawfriend.cl).

DIMENSIONES FÍSICAS:
- Lanyard: 20mm ancho × 900mm largo (cada lado)
- Nametag: 95mm ancho × 60mm alto (formato estándar credencial horizontal)

SVG ENTREGA: viewBox 0 0 1000 1100 (muestra ambos lados del lanyard
+ el nametag desplegado)

PALETA BRAND:
- Purple: #9333ea · #581c87 · #a855f7
- Gold: #f59e0b · #fbbf24
- Ink: #1a102b · Blanco: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka' 600 / 500
- Body: 'Plus Jakarta Sans' 500

REGLAS SVG:
- Vectorial limpio
- <title>, role="img", <desc>
- Peso < 8 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con
  <!-- lanyard_nametag.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Lanyard + nametag template
═════════════════════════════════════════════════════════

COMPOSICIÓN:
Mitad superior (y 0-700) - Nametag desplegado en vista horizontal
(escalado para claridad, real size 95×60mm):
- Fondo: gradient #9333ea → #581c87
- Top: logo Paw Friend blanco (wordmark horizontal) - 30% superior
- Middle: área para nombre (placeholder "{Nombre}" Fredoka 600
  80px blanco)
- Bottom: rol/empresa (placeholder "{Rol}" Plus Jakarta 500 32px
  gold)
- Right edge: ícono pata decorativo opacity 0.3
- Corner bottom-right: pawfriend.cl en mono 20px opacity 0.7

Mitad inferior (y 700-1100) - Lanyard correa:
- Patrón repetido diagonal en correa 40px ancho:
  · "PAW FRIEND · PAW FRIEND · PAW FRIEND"
  Fredoka 500 30px blanco sobre gradient purple → gold → purple
- Mostrar 3 repeticiones para entender el pattern
- Etiqueta "pattern repetible cada 300mm" al lado

TITLE: "Paw Friend Lanyard + Nametag Template"
DESC: "Template de credencial + correa lanyard para eventos.
Nametag con áreas editables nombre+rol, lanyard con patrón repetible
purple→gold."

--- PASTE END ---
```

---

### 24.17. EVT-05 · Laptop sticker pack (6 stickers)

**Destino:** `public/brand-assets/events/sticker_pack.svg` · **Prioridad:** P2 · **Peso:** < 10 KB

```
--- PASTE START ---

Necesito un SVG oficial (pack de 6 stickers para laptops) de Paw
Friend (app chilena; 100% gratis; SpA RUT 78.328.659-9).

DIMENSIONES:
- 6 stickers en hoja A5 (148×210mm)
- viewBox 0 0 1480 2100

PALETA BRAND:
- Purple: #9333ea · #581c87 · #a855f7
- Gold: #f59e0b · #fbbf24
- Emerald: #10b981
- Rose: #ec4899
- Ink: #1a102b · Blanco: #ffffff

TIPOGRAFÍA:
- Display: 'Fredoka' 600

REGLAS SVG:
- Vectorial limpio
- Cada sticker con contorno die-cut implícito (shape con padding 3mm)
- <title>, role="img", <desc>
- Peso < 10 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con
  <!-- sticker_pack.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: 6 stickers para laptop en hoja A5
═════════════════════════════════════════════════════════

LAYOUT (grid 2 columnas × 3 filas, padding 50 entre stickers):

Sticker 1 (top-left) - "Isotipo oficial"
- Forma: squircle iOS 400×400
- Contenido: squircle purple gradient + pata + corazón (logo clásico)
- Tamaño final: 60mm

Sticker 2 (top-right) - "Pata heart"
- Forma: círculo 400×400
- Contenido: pata blanca sobre #ec4899 con corazón gold negative space
- Label ligero abajo "paw lover"

Sticker 3 (mid-left) - "Wordmark holográfico"
- Forma: rectangular rounded 500×200
- Contenido: fondo holographic (simular con gradient conic
  purple→gold→rose→purple) + wordmark "Paw Friend" blanco centrado
- Label pequeño: "v 2.0"

Sticker 4 (mid-right) - "Made in Chile"
- Forma: escudo estilizado 400×500
- Contenido: fondo gradient purple + texto "hecho en chile" Fredoka
  600 60px blanco + copihue estilizado gold abajo

Sticker 5 (bottom-left) - "Kai & Ema"
- Forma: rectángulo rounded 500×300
- Contenido: ilustración mini de Kai (pastor suizo silueta) + Ema
  (gata negra silueta) lado a lado + corazón pequeño arriba
- Texto "la manada oficial" Fredoka 500 30px ink

Sticker 6 (bottom-right) - "QR sticker"
- Forma: cuadrado rounded 400×400
- Contenido: QR estilizado (grid de cuadraditos) → pawfriend.cl
- Label superior: "escanéame" Fredoka 600 40px gold
- Label inferior: "pawfriend.cl"

Cada sticker con borde blanco 3mm implícito para die-cut.

TITLE: "Paw Friend Sticker Pack A5"
DESC: "Pack de 6 stickers variados para laptops, notebooks y
merchandising de eventos. Incluye isotipo, variantes y QR."

--- PASTE END ---
```

---

### 24.18. EVT-06 · Tote bag diseño

**Destino:** `public/brand-assets/events/tote_bag.svg` · **Prioridad:** P2 · **Peso:** < 8 KB

```
--- PASTE START ---

Necesito un SVG oficial (diseño para tote bag serigrafiado) de
Paw Friend (app chilena; 100% gratis; hecha en chile; SpA RUT
78.328.659-9; pawfriend.cl).

DIMENSIONES:
- Bolsa base: 38×42cm algodón crema natural
- Área de impresión frontal: 28×28cm centrada
- SVG viewBox: 0 0 800 900 (muestra bolsa completa + área de print)

PALETA BRAND (limitada por serigrafía - 2 colores ideal):
- Purple principal: #9333ea (tinta 1)
- Gold secundario: #f59e0b (tinta 2)
- Fondo bolsa: simular algodón natural con #f5f0e6

TIPOGRAFÍA:
- Display: 'Fredoka' 600

REGLAS SVG:
- Vectorial limpio
- Máximo 2 tintas (purple + gold) sobre fondo crema
- Paths cerrados (serigrafía requiere áreas sólidas, no gradientes complejos)
- <title>, role="img", <desc>
- Peso < 8 KB
- Entrega: UN SOLO SVG en bloque ```svg``` con
  <!-- tote_bag.svg --> arriba

═════════════════════════════════════════════════════════
PEDIDO: Tote bag 38×42cm diseño 2 tintas
═════════════════════════════════════════════════════════

COMPOSICIÓN:
Vista completa bolsa (y 0-900):
- Forma bolsa: rectángulo 550×620 centrado (con asas arriba 2 tiras
  30×250)
- Fondo bolsa: #f5f0e6 (algodón crema)
- Área de print centrada: cuadrado 400×400 a y=200

Dentro del área de print:
- Top: logo Paw Friend isotipo grande 180×180 purple #9333ea puro
  (sin gradiente, área sólida)
- Middle: Headline Fredoka 600 60px purple: "peludos con"
- Middle línea 2: Fredoka 600 90px gold #f59e0b: "SUPERPODERES"
- Bottom: ornamento - 3 huellas pata pequeñas purple + 1 corazón
  gold pequeño distribuidas como "constelación"
- Bottom-bottom: wordmark "paw friend" Fredoka 400 30px purple +
  punto gold + "chile"

Diseño deliberadamente simple (max 2 tintas, áreas sólidas
separadas).

TITLE: "Paw Friend Tote Bag 2-color"
DESC: "Diseño serigrafía 2 tintas (purple + gold) para tote bag
algodón crema. Headline 'peludos con SUPERPODERES' + isotipo + firma
Chile."

--- PASTE END ---
```

---

### 24.19. EML-02 · Monthly newsletter template

**Destino:** `public/brand-assets/email/newsletter_monthly.html` · **Prioridad:** P1 · **Formato:** HTML con inline CSS (para email)

```
--- PASTE START ---

Necesito un template HTML completo (NO SVG, es email HTML) para
la newsletter mensual de Paw Friend (app chilena: ficha médica
digital + directorio vets + comunidad; 100% gratis; SpA RUT
78.328.659-9; pawfriend.cl; mascotas oficiales: Kai pastor suizo +
Ema gata negra; contacto pawfriendcl@gmail.com).

CONTEXTO:
Newsletter mensual a toda la base de usuarios + Paw Members +
Paw Partners. Envío por Resend. Destinatarios: tutores de mascotas
chilenos, veterinarios suscritos, partners. Copy en español chileno
(tuteo: tu, tienes; NO vos, NO vosotros).

ESTÁNDARES EMAIL HTML:
- Tablas anidadas para layout (no flexbox, no grid — soporte Outlook)
- Inline CSS en cada elemento crítico (styles en <head> solo como
  fallback)
- Max width 600px contenedor principal
- Fallback fonts robustos (Fredoka no se soporta en la mayoría de
  clientes mail → fallback: Georgia, 'Times New Roman', serif para
  display; Arial, Helvetica, sans-serif para body)
- Imágenes con width + alt obligatorio
- Dark mode básico via @media (prefers-color-scheme: dark)
- Versión plain text fallback al final (comentario HTML)
- Links con ?utm_source=newsletter&utm_medium=email&utm_campaign=monthly
- Botones como tablas (no <button>)

PALETA BRAND (inline):
- Purple: #9333ea main · #581c87 deep · #e9d5ff light · #faf5ff bg
- Gold: #f59e0b · #fef3c7 bg
- Ink: #1a102b · Paper: #faf7ff · Blanco: #ffffff

REGLAS:
- Entrega UN SOLO archivo HTML completo
- Peso < 100 KB (con imágenes como placeholders img src)
- Alt text en todas las imágenes
- Accesibilidad: role="presentation" en tablas de layout

═════════════════════════════════════════════════════════
PEDIDO: Newsletter mensual template HTML
═════════════════════════════════════════════════════════

ESTRUCTURA OBLIGATORIA:

1. Preheader oculto (<div style="display:none"...)
   "Lo nuevo de abril · tip del mes · peludo de la portada"

2. Header (mailer hero):
   - Logo Paw Friend centrado (img src placeholder)
   - Banda gradient purple
   - Título: "Newsletter Mensual · {mes} {año}"
   - Fecha

3. Bloque 1 - Saludo del founder:
   - H2 "hola {{firstName}}"
   - Párrafo corto de bienvenida con voz cálida
   - Firma "Paw Founder, Kai y Ema"

4. Bloque 2 - Destacado del mes:
   - Card purple-50 con border-left gold
   - Headline + párrafo + botón CTA "{{featureUrl}}"

5. Bloque 3 - Tip del mes:
   - Card blanco con sombra sutil
   - Tip práctico para tutores (placeholder {{tipContent}})
   - Ícono pata decorativo

6. Bloque 4 - Peludo de la portada:
   - Card purple gradient
   - Foto placeholder circular + nombre mascota + una línea de la historia
   - Link "ver más historias" → /community

7. Bloque 5 - Comunidad:
   - 3 números grandes en fila: MAU / vets registrados / peludos en ficha
   - Fuente: "datos a {{statsDate}}"

8. CTA principal:
   - Botón gold grande: "abrir paw friend"
   - Link: pawfriend.cl/home?utm_source=newsletter

9. Footer:
   - Unsubscribe ({{unsubscribeUrl}})
   - Redes: IG / FB / WA
   - Disclaimer legal SpA
   - "made in chile with ♥ by one person + ai"

PLACEHOLDERS con {{handlebars}} para merge tags de Resend.

Entrega todo en un solo bloque ```html```.

--- PASTE END ---
```

---

### 24.20. EML-03 · Donation thanks email

**Destino:** `public/brand-assets/email/donation_thanks.html` · **Prioridad:** P1 · **Formato:** HTML email

```
--- PASTE START ---

Necesito un template HTML completo (email) de agradecimiento por
donación para Paw Friend (app chilena; 100% gratis; SpA RUT
78.328.659-9; pawfriend.cl).

CONTEXTO:
Email transaccional enviado automáticamente tras una donación
exitosa en /donaciones. Tono cálido, emocional pero no meloso.
Debe incluir monto donado, mensaje personal del founder, y
transparencia sobre a qué va el dinero. Copy español chileno
(tuteo).

ESTÁNDARES EMAIL HTML (mismos de EML-02):
- Tablas anidadas layout
- Inline CSS
- Max width 600px
- Fallback fonts: Arial/Helvetica body, Georgia display
- Dark mode básico
- Peso < 80 KB

PALETA:
- Purple: #9333ea · #581c87 · #faf5ff
- Gold: #f59e0b · #fef3c7
- Rose (acento corazón): #ec4899
- Ink: #1a102b

REGLAS:
- Entrega UN SOLO archivo HTML en bloque ```html```
- Placeholders {{handlebars}}: {{firstName}}, {{amount}},
  {{donationId}}, {{paymentMethod}}, {{date}}, {{receiptUrl}}

═════════════════════════════════════════════════════════
PEDIDO: Donation thanks email transaccional
═════════════════════════════════════════════════════════

ESTRUCTURA:

1. Preheader oculto
   "gracias {{firstName}} por tu donación de {{amount}}"

2. Hero:
   - Fondo gradient purple
   - Ícono corazón gold grande (img)
   - Headline Fredoka 600 serif fallback: "gracias de corazón"
   - Subhead: "tu aporte nos hace posible seguir"

3. Bloque datos donación:
   - Tabla blanca con border purple-100
   - Filas:
     · Monto: {{amount}} CLP
     · Fecha: {{date}}
     · Método: {{paymentMethod}}
     · ID: {{donationId}}

4. Bloque mensaje founder:
   - Card purple-50
   - Párrafo personal del founder: "hola {{firstName}}, soy
     {{founderName}}. hice paw friend porque creí que los peludos
     chilenos merecían una herramienta de cuidado sin letra chica.
     tu donación no va a mi bolsillo — va directo a mantener la
     app viva, pagar infraestructura y seguir mejorando features
     para vos, Kai y Ema."
   - Firma + foto placeholder founder

5. Bloque transparencia:
   - Card gold pastel
   - "¿a dónde va tu donación?"
   - 3 bullets:
     · 60% infraestructura (Supabase, hosting, OpenAI)
     · 25% legal y contable (SpA, compliance)
     · 15% mejoras continuas
   - Link "ver reporte de transparencia" → /paw-core/transparencia

6. CTA secundario:
   - Botón secundario: "ver la muralla de aportes"
   - Link → /donaciones#muralla

7. Recibo / factura (opcional):
   - "Si necesitas un recibo fiscal, descarga aquí"
   - Link {{receiptUrl}}

8. Footer:
   - "¿dudas? responde este email o escríbenos a pawfriendcl@gmail.com"
   - Unsubscribe (aunque transaccional, ofrecer opción de no recibir
     más newsletter separado)
   - Redes + legal SpA

Todo en un solo ```html```.

--- PASTE END ---
```

---

### 24.21. EML-04 · Paw Member welcome

**Destino:** `public/brand-assets/email/member_welcome.html` · **Prioridad:** P1 · **Formato:** HTML email

```
--- PASTE START ---

Necesito un template HTML completo (email) de bienvenida al
programa Paw Member de Paw Friend (app chilena; Paw Member =
suscripción opcional $3.990/mes para sostener la app + badge
+ acceso a descuentos de alianzas; SpA RUT 78.328.659-9;
pawfriend.cl).

CONTEXTO:
Email enviado automáticamente al activar suscripción Paw Member
exitosa vía Flow.cl. Tono celebratorio pero no exagerado. Explica
qué desbloquean (badge + descuentos de Paw Partners) y que NO hay
features ocultos (el producto es gratis, el Member es para los que
quieren sostener la obra). Copy chileno tuteo.

ESTÁNDARES EMAIL HTML (mismos EML-02):
- Tablas anidadas, inline CSS, max 600px, fallbacks Arial/Georgia,
  dark mode básico, peso < 80 KB

PALETA:
- Purple: #9333ea · #581c87 · #faf5ff
- Gold (Paw Member badge): #f59e0b · #fbbf24 · #fef3c7
- Ink: #1a102b

REGLAS:
- Entrega UN SOLO archivo HTML en ```html```
- Placeholders: {{firstName}}, {{subscriptionStart}}, {{plan}},
  {{nextChargeDate}}, {{memberUrl}}

═════════════════════════════════════════════════════════
PEDIDO: Paw Member welcome transaccional
═════════════════════════════════════════════════════════

ESTRUCTURA:

1. Preheader
   "bienvenido a paw member, {{firstName}} — acá empieza tu círculo"

2. Hero:
   - Fondo gradient gold #fef3c7 → #fbbf24
   - Badge grande: isotipo + estrella dorada
   - Headline: "sos paw member"
   - Subhead: "gracias por sumarte al círculo"

3. Bloque benefits (3 cards horizontales):
   - Card 1: "Badge oficial" + ícono badge gold en perfil
   - Card 2: "Descuentos de Paw Partners" + ícono tag
   - Card 3: "Apoyás que paw friend siga gratis" + ícono corazón

4. Bloque "IMPORTANTE":
   - Card purple-50 con border purple-200
   - Headline: "un recordatorio cálido"
   - Párrafo: "paw friend es y siempre será 100% gratis para todos
     los tutores. no hay features exclusivos para members. lo que
     pagás es para sostener la obra, no para desbloquear. gracias por
     entender y apoyar."

5. Bloque datos suscripción:
   - Plan: {{plan}}
   - Inicio: {{subscriptionStart}}
   - Próximo cargo: {{nextChargeDate}}
   - "podés cancelar cuando quieras desde {{memberUrl}}"

6. CTA:
   - Botón gold: "ver tu perfil member"
   - Link → /paw-member

7. Bloque descuentos disponibles:
   - Grid 2×2 placeholder de 4 partners (logos neutrales + descuento)
   - "lista completa en /paw-member/descuentos"

8. Footer:
   - Dudas → pawfriendcl@gmail.com
   - Legal SpA + unsubscribe
   - Redes

Todo en ```html``` un solo bloque.

--- PASTE END ---
```

---

### 24.22. EML-05 · Vet invitation email

**Destino:** `public/brand-assets/email/vet_invitation.html` · **Prioridad:** P1 · **Formato:** HTML email

```
--- PASTE START ---

Necesito un template HTML completo (email) de invitación a
veterinarios para unirse a Paw Friend (app chilena; vets B2B Free
$0 comisión 10% hasta 5 pacientes → escalable a Premium $9.900 y
Pro Max $29.900; SpA RUT 78.328.659-9; pawfriend.cl;
/para-veterinarios).

CONTEXTO:
Email de outreach a vets via CRM. Tono profesional cálido (no
corporate frío). Incluye propuesta de valor, prueba social y
CTA a registro. Copy chileno tuteo.

ESTÁNDARES EMAIL HTML (mismos EML-02).

PALETA:
- Purple: #9333ea · #581c87 · #faf5ff
- Emerald (confianza profesional): #10b981 · #047857
- Gold: #f59e0b · #fef3c7
- Ink: #1a102b

REGLAS:
- Entrega UN SOLO archivo HTML en ```html```
- Placeholders: {{vetName}}, {{vetClinic}}, {{comuna}},
  {{signupUrl}}, {{senderName}}

═════════════════════════════════════════════════════════
PEDIDO: Vet invitation outreach email
═════════════════════════════════════════════════════════

ESTRUCTURA:

1. Preheader
   "{{vetName}}, pensamos en vos para paw friend — te cuento"

2. Hero simple (no hero image grande, tono B2B):
   - Logo Paw Friend top-center
   - Headline: "hola {{vetName}}"
   - Subhead: "soy {{senderName}} de paw friend"

3. Párrafo apertura:
   "vi tu clínica {{vetClinic}} en {{comuna}} y quería contarte de
   paw friend — la primera app chilena que junta ficha médica
   digital + directorio público de vets + comunidad de tutores."

4. Bloque "por qué te puede servir":
   - 4 bullets con íconos check emerald:
     · Ficha médica que tus pacientes llevan donde vayan
     · Recordatorios automáticos de vacunas y consultas
     · Directorio público gratis (más visibilidad)
     · Panel web para gestionar pacientes

5. Bloque planes (3 cards horizontales):
   - Card Free (gratis, 5 pacientes) - emerald accent
   - Card Premium ($9.900/mes, ilimitado) - gold accent
   - Card Pro Max ($29.900/mes, clínica multi-seat) - purple accent
   - "empezá gratis, escalá si te sirve"

6. Bloque prueba social (placeholder):
   - Quote de vet real beta tester (placeholder Sofía Rosi si aplica)
   - "ya somos {{vetCount}} vets en chile"

7. CTA principal:
   - Botón emerald: "sumate gratis en 2 minutos"
   - Link {{signupUrl}}

8. CTA secundario:
   - "¿preferís que conversemos antes?"
   - "respondé este email y coordinamos un zoom"

9. Footer:
   - Firma completa del sender con foto + email + LinkedIn
   - Legal SpA + unsubscribe

Todo en ```html```.

--- PASTE END ---
```

---

### 24.23. EML-06 · Review invitation email

**Destino:** `public/brand-assets/email/review_invitation.html` · **Prioridad:** P2 · **Formato:** HTML email

```
--- PASTE START ---

Necesito un template HTML completo (email) de invitación a dejar
reseña post-consulta veterinaria en Paw Friend (app chilena;
reseñas públicas sobre vets verificados; SpA RUT 78.328.659-9;
pawfriend.cl).

CONTEXTO:
Email enviado 24h después de una consulta confirmada. Pide al
tutor dejar review pública sobre el vet. Tono amable, no insistente.
Copy chileno tuteo.

ESTÁNDARES EMAIL HTML (mismos EML-02).

PALETA:
- Purple: #9333ea · #581c87 · #faf5ff
- Gold: #f59e0b · #fbbf24 (estrellas)
- Ink: #1a102b

REGLAS:
- Entrega UN SOLO archivo HTML en ```html```
- Placeholders: {{firstName}}, {{petName}}, {{vetName}},
  {{consultDate}}, {{reviewUrl}}, {{skipUrl}}

═════════════════════════════════════════════════════════
PEDIDO: Review invitation transaccional
═════════════════════════════════════════════════════════

ESTRUCTURA:

1. Preheader
   "{{firstName}}, cómo le fue a {{petName}} con {{vetName}}?"

2. Hero:
   - Fondo gradient purple suave #faf5ff → blanco
   - Ícono grande: 5 estrellas gold (4.5 simulado)
   - Headline: "cómo estuvo {{vetName}}?"
   - Subhead: "ayudanos a otros tutores contando tu experiencia"

3. Párrafo:
   "{{firstName}}, {{petName}} tuvo consulta con {{vetName}} el
   {{consultDate}}. tu reseña honesta ayuda a otros tutores a elegir
   bien. toma 30 segundos."

4. CTA stars:
   - Bloque de 5 estrellas clickeables (cada estrella link
     a reviewUrl?rating=N)
   - "toca las estrellas para dejar tu valoración"

5. CTA principal:
   - Botón purple: "dejar reseña completa"
   - Link {{reviewUrl}}

6. CTA skip (pequeño):
   - "prefiero no dejar reseña esta vez"
   - Link {{skipUrl}}
   - Estilo text-only underline color neutral

7. Bloque confianza:
   - "tu reseña es pública y tiene tu nombre (o iniciales)"
   - "no permitimos reseñas falsas ni compradas"

8. Footer:
   - Legal SpA + unsubscribe + soporte

Todo en ```html```.

--- PASTE END ---
```

---

### 24.24. EML-07 · Password reset email

**Destino:** `public/brand-assets/email/password_reset.html` · **Prioridad:** P0 · **Formato:** HTML email

```
--- PASTE START ---

Necesito un template HTML completo (email transaccional crítico)
de reset de contraseña para Paw Friend (app chilena; auth vía
Supabase; SpA RUT 78.328.659-9; pawfriend.cl).

CONTEXTO:
Email transaccional de seguridad, enviado cuando el usuario
solicita reset de contraseña. Debe ser claro, inspirar confianza
y no parecer phishing. Copy chileno neutro tuteo.

ESTÁNDARES EMAIL HTML:
- Tablas anidadas, inline CSS, max 600px, fallbacks Arial/Georgia
- Dark mode básico
- Peso < 60 KB
- **SEGURIDAD**: mostrar dominio oficial, IP de origen si disponible,
  timestamp y fingerprint para evitar phishing

PALETA:
- Purple: #9333ea · #581c87 · #faf5ff
- Rojo alerta (solo si no fue el usuario): #dc2626 · #fee2e2
- Ink: #1a102b

REGLAS:
- Entrega UN SOLO archivo HTML en ```html```
- Placeholders: {{firstName}}, {{resetUrl}}, {{expiresIn}},
  {{requestTime}}, {{requestIp}}, {{userAgent}}

═════════════════════════════════════════════════════════
PEDIDO: Password reset transaccional crítico
═════════════════════════════════════════════════════════

ESTRUCTURA:

1. Preheader
   "reset de contraseña paw friend · válido por {{expiresIn}}"

2. Header seguridad:
   - Banda purple top
   - Logo Paw Friend + texto "correo de seguridad"
   - Mini badge verde "dominio verificado: pawfriend.cl"

3. Cuerpo principal:
   - Headline "restablece tu contraseña"
   - Párrafo: "hola {{firstName}}, recibimos una solicitud para
     restablecer la contraseña de tu cuenta en paw friend."

4. CTA principal:
   - Botón purple grande: "crear nueva contraseña"
   - Link {{resetUrl}}
   - Subtexto: "el link expira en {{expiresIn}}"

5. Bloque info request:
   - Card neutral con:
     · Hora de la solicitud: {{requestTime}}
     · IP: {{requestIp}}
     · Dispositivo: {{userAgent}}
   - "si vos solicitaste esto, todo bien. ignora este correo si querés
     olvidarlo."

6. Bloque "no fui yo":
   - Card rojo suave #fee2e2
   - Headline rojo: "no fuiste vos?"
   - Párrafo: "si no solicitaste el reset, no hagas click en el botón.
     cambia tu contraseña desde paw friend y contactanos a
     pawfriendcl@gmail.com para revisar actividad sospechosa."

7. Bloque ayuda:
   - "¿problemas con el link?"
   - Link crudo en texto (no botón): {{resetUrl}}
   - "copia y pega en tu navegador"

8. Footer:
   - Info SpA legal
   - Dominios oficiales: pawfriend.cl y app.pawfriend.cl
   - "nunca te pediremos contraseña por email o teléfono"

Todo en ```html```.

--- PASTE END ---
```

---

## 25. Assets que NO se hacen con Claude

Algunos assets del roadmap requieren producción humana o herramientas especializadas. **No intentes generarlos con claude.ai/code:**

| ID | Asset | Por qué NO Claude | Herramienta correcta |
|---|---|---|---|
| VID-01 | Video App Preview iOS | Requiere captura real de iPhone | QuickTime + iPhone físico, DaVinci/Final Cut |
| VID-02 | Video promo Play Store | Requiere grabación o animación avanzada | After Effects, CapCut, DaVinci |
| PHO-01 | Fotos founder + Kai + Ema | Requiere cámara + sesión real | Fotógrafo profesional o iPhone + tripod |
| PHO-02 | Fotos ambient (oficina home-made) | Requiere cámara física | iPhone + luz natural |
| PHO-03 | Fotos testimonios reales usuarios | Requiere consentimiento + release | Cámara + release forms |
| AUD-01 | Jingle 5 segundos | Requiere producción musical | Músico + Logic/Ableton |
| AUD-02 | Voice over narrador | Requiere voz humana o IA voice | ElevenLabs (IA) o locutor profesional |
| FNT-01 | Font licensing | Requiere compra de licencia | Google Fonts (gratis Fredoka) o Adobe Fonts |
| LGL-01 | Contratos Paw Partners | Requiere abogado | Abogado chileno especializado SaaS |
| LGL-02 | Términos + Privacy Policy chilenos | Requiere compliance legal | Abogado + DPO |

**Para estos assets:** usar [`docs-raiz/pawfriend-omnichannel-brand-assets-and-prompts.md`](./pawfriend-omnichannel-brand-assets-and-prompts.md) sección "Producción humana" donde hay guidelines detalladas.

Claude SÍ puede entregar:
- Los storyboards para los videos (como IOS-03 y AND-03 arriba)
- Las guidelines fotográficas (como PRS-03 arriba)
- Los scripts de voice over (texto para grabar)
- Los briefs legales (para que el abogado los ejecute)
- Los moodboards descriptivos

---

## 26. Backlog completo cerrado

Con la expansión de §24.1 a §24.24, la librería cubre:

**Logo system:** LOGO-01 a LOGO-10 (10 prompts) ✅
**Favicons:** FAV-01 a FAV-02 (2 prompts) ✅
**Icons:** ICN-01 a ICN-60 (60 prompts, 6 lotes) ✅
**Illustrations:** ILL-01 a ILL-09 (resumen en §4.2-4.9) ✅
**Mockups:** MCK-01 base + guidelines ✅
**Social:** IG/FB/WA/TikTok/YT core covers + posts ✅
**Store listings:** IOS-01 a IOS-03 + AND-01 a AND-03 ✅
**Investor kit:** INV-01 a INV-03 ✅
**Partner kit:** PRT-01 a PRT-03 ✅
**Press kit:** PRS-01 a PRS-04 ✅
**Creator Voices:** CV-01 base + guidelines ✅
**Event kit:** EVT-01 a EVT-06 (Business Card + 5 event pieces) ✅
**Docs:** DOC-01 base ✅
**Email:** EML-01 a EML-07 (7 templates HTML) ✅
**Patterns:** PAT-01 base + 4 variantes ✅

**Total:** 140+ prompts self-contained copy-paste-ready para claude.ai.

**Cobertura del roadmap omnichannel:** ~95% de los assets producibles con Claude. El 5% restante (videos/fotos/audio/legal) está listado en §25 con la herramienta correcta.

---

## 25. Cierre

Esta librería contiene **más de 100 prompts** copy-paste-ready.

**Cada prompt:**
- Incluye TODO el contexto necesario (paleta, tipografía, estilo, reglas SVG)
- Se puede pegar en una sesión nueva de claude.ai sin setup previo
- Produce un SVG production-ready para el repo
- Está documentado con ruta destino, prioridad, peso objetivo

**Prioridad sugerida de ejecución:**

1. **Sprint 1 (P0, 2 semanas):** §1 Logo system completo + §2 Favicon family + §11 App Store slides completos + §12 Play Store slides completos
2. **Sprint 2 (P1, 2 semanas):** §3 Icons 41-50 + §6-10 Social (IG/FB/WA/TikTok/YT) + §13-15 Investor/Partner/Press kits
3. **Sprint 3 (P2, 3 semanas):** §4 Illustrations + §5 Mockups extra + §16-17 Creator/Event kits + §18-19 Docs/Emails + §20 Patterns

**Total estimado para producción completa:** ~7 semanas con 1 persona usando Claude Code sistemáticamente.

---

*Fin del Asset Prompts Library. Documentos emparejados:*
*- [`pawfriend-rebrand-rollout-masterplan.md`](./pawfriend-rebrand-rollout-masterplan.md)*
*- [`pawfriend-omnichannel-brand-assets-and-prompts.md`](./pawfriend-omnichannel-brand-assets-and-prompts.md)*
*- [`pawfriend-asset-prompts-library.md`](./pawfriend-asset-prompts-library.md) (este)*
