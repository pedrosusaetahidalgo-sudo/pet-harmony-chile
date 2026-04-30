# Paw Friend · Assets Generation Plan (master ejecutable)

> **🟢 Estado 2026-04-29 PM:** Pedro genero la mayoria de los assets de §3-7.
> Todos los SVGs estan en:
> - `public/brand-assets/` (servidos publicamente: badges, illustrations,
>   mockups dashboards, social IG/FB/TT/YT/WA, store-listings, presentations,
>   patterns, press-kit, email-templates)
> - `public/paw-friend-assets-v2/` (logos, iconos brand-squircle, categorias,
>   android adaptive, splash, favicon)
>
> Lista de status detallado en seccion 14 al final.
>
> **Que es esto:** master detallado para generar **todos** los assets pendientes
> de Paw Friend (app + 11 pitches + redes + stores + email + press + investor +
> partner kits). Cada asset tiene **IA recomendada** + **prompt ready-to-paste**
> + prioridad + output esperado.
>
> **Como usar:** abrir esta doc + abrir la IA recomendada al lado + copiar prompt
> + descargar output + guardar en path indicado. Si tarda, contratamos a un
> diseñador externo y le pasamos los mismos prompts como spec.
>
> **Companion:** [BRAND_SYSTEM_2026.md](BRAND_SYSTEM_2026.md) — la fuente de verdad de paleta + tipografia + reglas.
>
> **Version:** 2026-04-29.

---

## Indice

1. [Stack de IAs recomendado](#1-stack-de-ias-recomendado)
2. [Prompt base de contexto (pegar siempre primero)](#2-prompt-base-de-contexto)
3. [Logos y iconos brand (Claude Web)](#3-logos-y-iconos-brand)
4. [Ilustraciones y empty states (Claude Web + Recraft)](#4-ilustraciones-y-empty-states)
5. [Mobile stores (iOS + Android)](#5-mobile-stores)
6. [Prompts por canal social](#6-prompts-por-canal-social)
7. [Investor + Partner kits](#7-investor--partner-kits)
8. [Press kit](#8-press-kit)
9. [Email templates HTML](#9-email-templates-html)
10. [Patterns y backgrounds](#10-patterns-y-backgrounds)
11. [Cronograma sugerido](#11-cronograma-sugerido)
12. [Checklist final pre-launch](#12-checklist-final-pre-launch)

---

## 1. Stack de IAs recomendado

### Tier minimo ($20/mes)

- **Claude Web Pro** ($20/mes) — Pedro ya tiene. Cubre 80% del backlog: SVG, copy, HTML, prompts, MJML email.
- **content-studio existente** — gratis (ya operativo). Cubre video reels.
- **Shots.so** (gratis web) — mockups dispositivo.
- **Fotos propias** del founder (Kai + Ema + autoretratos profesionales).
- **Unsplash / Pexels** (gratis) — fotos lifestyle complementarias.

### Tier recomendado ($30/mes)

Sumar a tier minimo:
- **Midjourney Basic** ($10/mes) — Pedro ya tiene. Para fotos lifestyle realistas.

### Tier completo ($60-80/mes)

Sumar a tier recomendado:
- **Recraft V3** ($10/mes) — ilustraciones flat brand-consistent, mejor que Claude para volumenes altos.
- **Mockuuups Studio** ($14/mes) — mockups dispositivo premium.
- **Adobe Firefly** ($22/mes) — solo si se necesita garantia comercial-safe Adobe.

### Para skills especificos (one-shot)

- **Figma + AI plugins** (gratis con cuenta) — para mockups web/mobile + plugin AI generation.
- **DaVinci Resolve** (gratis) — edicion video pro sin marca de agua.
- **CapCut** (gratis mobile) — edicion rapida vertical para TikTok/Reel.
- **MJML** (open source) — framework para HTML email responsive.
- **SVGO** (open source CLI) — optimizar SVGs post-Claude.

### Recomendacion final

**Empezar con Tier minimo ($20/mes solo Claude).** Pedro genera 80% del backlog
solo con eso. Para fotos lifestyle, usar fotos propias + Unsplash + sus mascotas
reales (Kai, Ema). Si en mes 2 hay backlog real de ilustraciones, sumar Recraft
V3 ($10/mes). Midjourney solo si quiere fotos hyperreal de duenos y vets que
no encuentre en Unsplash.

---

## 2. Prompt base de contexto

> **CRITICO:** este prompt va siempre como mensaje 1 en cualquier conversacion
> de Claude/Recraft/etc para generar assets. Sin esto, los outputs no son brand-aligned.

```
Estoy diseñando assets para Paw Friend, una app chilena que es una
ficha medica digital + directorio de veterinarios + comunidad pet,
100% gratis para duenos. Hecha por una persona en Chile con apoyo de
IA. Alma: amor por los peludos + seriedad tecnica + home-made chileno
+ modelo sostenible por comunidad B2B.

PALETA OFICIAL:
- Primary: #9333ea (brand purple)
- Primary deep: #581c87
- Accent gold: #eab308
- Accent gold light: #fde047
- Success/partners: #10b981 (emerald)
- Voices/rose: #ec4899
- Sky/info: #0ea5e9
- Ink body: #1a102b
- Paper bg: #faf5ff

TIPOGRAFIA:
- Display: Fredoka (500/600/700)
- Body: Plus Jakarta Sans (400/500/600/700/800)
- Mono: JetBrains Mono

ESTILO VISUAL:
- Flat modern con microdetalles warm.
- Squircle como geometria brand (viewBox 200×200 rx 40).
- NO: hiperrealismo, Material puro, corporate frio, emoji decorativo, anime.
- SI: geometrias simples, bordes redondeados, paleta brand disciplinada.

REGLAS SVG:
- Vectorial limpio, sin raster embedded.
- <title> + role="img" + aria-label.
- viewBox correcto, paths simples.
- stroke-linecap="round" + stroke-linejoin="round" donde aplique.
- Sin texto embedded (el texto lo pone el HTML consumidor).
- Peso objetivo: < 2 KB por SVG.
- Funcionar a 24×24, 96×96, 512×512 sin perder detalle.

ENTREGA: cada SVG en bloque ```svg ... ``` precedido por comentario
<!-- filename.svg --> arriba. Sin prosa adicional entre archivos.
```

---

## 3. Logos y iconos brand

### 3.1 Logo variants P0 (5 variantes)

**IA:** Claude Web · **Tiempo estimado:** 30 min · **Output:** 5 SVGs · **Path:** `paw-friend-assets-v2/logo/`

```
[pegar contexto base §2]

Necesito 5 variantes del logo Paw Friend (las existentes son:
icon_principal, icon_reverse, icon_dark, icon_mono, wordmark_horizontal).

Para cada una, viewBox apropiado:

1. paw_friend_mark_square.svg (viewBox 680×680)
   Isotipo simplificado para app icon, squircle iOS 24% radius.
   Mismo concepto que el principal pero optimizado para 16×16 favicon
   (sin detalles que se pierdan).

2. paw_friend_wordmark_vertical.svg (viewBox 400×500)
   Mark arriba + "Paw Friend" wordmark centrado abajo.
   Para posters y eventos.

3. paw_friend_lockup_tagline.svg (viewBox 800×200)
   Wordmark horizontal + tagline "La ficha medica de tu mascota"
   debajo en Jakarta 400.

4. paw_friend_icon_gold.svg (viewBox 680×680)
   Mismo isotipo principal pero con gold gradient (#9333ea → #eab308)
   en el squircle base. Para Paw Member y celebraciones.

5. paw_friend_sticker.svg (viewBox 680×680)
   Isotipo outline only (no fill), stroke 4. Para impresion stickers
   y swag monocroma.
```

### 3.2 10 iconos brand squircle pendientes (P0)

**IA:** Claude Web · **Tiempo:** 45 min · **Output:** 10 SVGs · **Path:** `paw-friend-assets-v2/icons/brand-squircle/`

```
[pegar contexto base §2]

Necesito 10 iconos SVG brand squircle, viewBox 200×200, rx 40, fondo
color brand, contenido blanco, estilo flat modern con microdetalles.

1. 31_donation.svg — fondo gold gradient (#9333ea → #eab308),
   pata blanca abrazando corazon blanco, 1 ondita exterior.

2. 32_shield_data.svg — fondo brand purple, escudo blanco con
   candado en el centro, chispa arriba.

3. 33_ai_brain.svg — fondo brand purple, cerebro blanco
   estilizado con circuito minimalista, 1 estrella.

4. 34_map_pin_paw.svg — fondo emerald, pin de mapa blanco con
   huellita dentro del circulo del pin.

5. 35_pdf_record.svg — fondo brand purple, documento blanco con
   esquina doblada, etiqueta "PDF" (solo silueta sin texto), lineas
   de contenido simuladas.

6. 36_handshake_paws.svg — fondo emerald, 2 patas peludas
   estilizadas estrechandose en el centro.

7. 37_invoice.svg — fondo brand purple, recibo blanco con 3 lineas
   de contenido + sello circular en corner.

8. 38_shelter.svg — fondo emerald, casa chueca calida blanca con
   chimenea + huella en la puerta.

9. 39_badge_member.svg — fondo gold gradient, escudo/medalla blanco
   con pata grabada en el centro + corona 3 puntas arriba.

10. 40_qr_code_paw.svg — fondo brand purple, cuadrado QR estilizado
    blanco con huellita en el centro en vez de logo generico.
```

### 3.3 Iconos audiencia (categorias) faltantes

**IA:** Claude Web · **Tiempo:** 20 min · **Output:** 4 SVGs · **Path:** `paw-friend-assets-v2/icons/categories/`

Existen 6 (voice/partner/company/shelter/investor/vet). Si quieres agregar nuevos:

```
[pegar contexto base §2]

Necesito iconos categoria audiencia para Paw Friend.
Mismo estilo que los existentes en paw-friend-assets-v2/icons/categories/
(voice.svg, partner.svg, etc).

ViewBox 200×200, fondo gradient marca purpura.

1. icon_pharma.svg — capsula molecular minimalista en blanco con paw
   prints alrededor. Background magenta gradient (#831843 → #ec4899).

2. icon_insurance.svg — escudo abierto con paw print dentro.
   Background blue confianza (#0c4a6e → #0369a1).

3. icon_retail.svg — bolsa de compras con orejas de mascota.
   Background coral (#9a3412 → #ea580c).

4. icon_government.svg — silueta institucional + checkmark + huella.
   Background azul estado (#1e3a8a → #15803d gradient diagonal).
```

### 3.4 Favicon SVG refresh (P0)

**IA:** Claude Web · **Tiempo:** 10 min · **Path:** `public/favicon.svg`

```
[pegar contexto base §2]

Necesito favicon.svg 32×32 vectorial. Concepto: pata Paw Friend
simplificada, background squircle (rx 4) con gradient #9333ea → #7e22ce.
Sin animacion. Debe ser legible a 16×16 tambien.
```

---

## 4. Ilustraciones y empty states

### 4.1 Hero landing illustration (P1)

**IA:** Claude Web (alt: Recraft V3) · **Tiempo:** 30 min · **Path:** `public/brand-assets/illustrations/hero/hero_landing_main.svg`

```
[pegar contexto base §2]

Necesito ilustracion SVG hero landing /, viewBox 800×600, estilo flat
modern warm brand.

Escena: smartphone en diagonal (centro) mostrando mockup simplificado de
ficha medica (card brand con iconos vacunas verdes). A la izquierda del
phone, silueta estilizada de perro chileno (mestizo, orejas paradas,
sentado, sonrisa sutil). A la derecha, silueta de gato tranquilo. Arriba
gradient radial purpura-dorado como cielo. Abajo, linea de suelo simple.

Paleta: brand purple + gold + emerald (ticks vacunas) + warm white
para siluetas mascotas.

Sin texto embedded. Composicion centrada. Optimizada para hero 1920
desktop + 750 mobile.
```

### 4.2 Empty states (6 ilustraciones · P1)

**IA:** Claude Web · **Tiempo:** 45 min · **Output:** 6 SVGs · **Path:** `public/brand-assets/illustrations/empty-states/`

```
[pegar contexto base §2]

Necesito 6 ilustraciones SVG 400×300 para empty states del producto:

1. no_pets_yet.svg — mascota cartoon waving, espacio para "Agrega tu
   primer peludo" overlay.

2. no_reminders.svg — calendar sonriente vacio con zzz arriba.

3. no_feed.svg — icono chat con suspensivos, mood tranquilo.

4. no_vets_nearby.svg — pin mapa mirando alrededor.

5. no_donations.svg — corazon hueco outline + hint gold.

6. no_missions.svg — trofeo opaco waiting + hint gold.

Estilo: flat warm, palette brand + neutrals, 1 microdetalle por
ilustracion (zzz, hint, suspensivos).
```

### 4.3 Onboarding ilustraciones (5 · P1)

**IA:** Claude Web · **Tiempo:** 40 min · **Output:** 5 SVGs · **Path:** `public/brand-assets/illustrations/onboarding/`

```
[pegar contexto base §2]

Necesito 5 ilustraciones SVG 600×400 para onboarding first-time user:

1. welcome.svg — Paw Friend mark + mascota saludando + "Bienvenido"
   space.

2. add_pet.svg — circulo punteado con huella + "+" central.

3. first_record.svg — ficha clinica iconica + check.

4. vet_directory.svg — mapa con multiples pins + 1 pin Paw Friend
   destacado.

5. paw_member_optional.svg — badge gold + corazon + "Opcional, no
   gracias OK" hint.

Estilo: flat warm, brand palette, microdetalle calido.
```

### 4.4 Badges seals (4 · P1)

**IA:** Claude Web · **Tiempo:** 25 min · **Output:** 4 SVGs · **Path:** `public/brand-assets/badges/`

```
[pegar contexto base §2]

Necesito 4 SVG badges 200×200 (squircle rx 36):

1. badge_paw_member.svg — gold gradient + pata blanca + "MEMBER"
   eyebrow.

2. badge_paw_voice.svg — rose/fuchsia gradient + microfono blanco +
   "VOICE".

3. badge_paw_company.svg — purple gradient + building blanco +
   "COMPANY" + 3 tiers underline (bronze/silver/gold dots).

4. badge_vet_verified.svg — emerald gradient + stethoscope blanco +
   "VERIFIED" + checkmark corner.

Cada uno con wordmark "PAW FRIEND" grabado sutil en el edge del
squircle.
```

### 4.5 Sample dashboards Bronze/Silver/Gold (3 · P1)

**IA:** Claude Web · **Tiempo:** 60 min · **Output:** 3 SVGs · **Path:** `public/brand-assets/mockups/dashboards/`

```
[pegar contexto base §2]

Necesito 3 variantes SVG mockup "dashboard Paw Companys" por tier:

1. dashboard_bronze.svg (viewBox 1200×800) — 4 KPI tiles, 3 ubicaciones
   activas, 2 shelters trazabilidad, layout compacto.

2. dashboard_silver.svg (viewBox 1200×800) — 4 KPI tiles, 5 ubicaciones,
   4 shelters, layout medium + card "featured badge" extra.

3. dashboard_gold.svg (viewBox 1200×800) — 4 KPI tiles, 7 ubicaciones,
   6 shelters, exclusividad badge visible, layout premium + co-branding
   section.

Estilo alineado al [INSIGHTS_DASHBOARDS_MOCK.html](../pitch-inversionistas/INSIGHTS_DASHBOARDS_MOCK.html) existente. Paleta
brand + tier (bronze: cobre, silver: gris perlado, gold: dorado).
```

---

## 5. Mobile stores

### 5.1 App icon iOS 1024×1024 (P0 · BLOQUEA SUBMISSION)

**IA:** Claude Web → exportar a PNG · **Tiempo:** 20 min · **Path:** `public/brand-assets/store-listings/app-store/icon_1024.png`

```
[pegar contexto base §2]

Necesito el app icon principal iOS 1024×1024 PNG-ready (entregar como
SVG con viewBox 1024×1024 que yo exporto a PNG).

Concepto: el isotipo Paw Friend (pata + corazon negative space) sobre
squircle iOS con gradient radial brand:
- centro: #9333ea
- extremos: #581c87
- highlight arriba: rgba(255,255,255,.12)

Sin sombras internas (iOS 17 no las soporta en app icons).
Sin texto embedded.
Isotipo blanco puro #fff ocupando 72% del canvas, centrado.

Debe verse distintivo incluso en tamano 57×57 (iPhone antiguo).
```

### 5.2 Adaptive icon Android (P0 · BLOQUEA SUBMISSION)

**IA:** Claude Web → exportar 2 PNGs · **Tiempo:** 15 min · **Path:** `android/app/src/main/res/mipmap-*/`

```
[pegar contexto base §2]

Necesito adaptive icon Android para Play Store. Debe entregar 2 SVGs
separados (Android los compone con mascara propia):

1. adaptive_foreground.svg (viewBox 432×432, safe zone centro 264×264)
   El isotipo Paw Friend en blanco puro centrado, ocupando solo el
   safe zone. Resto del canvas transparente.

2. adaptive_background.svg (viewBox 432×432)
   Fondo solido gradient radial brand:
   - centro: #9333ea
   - extremos: #581c87
   No incluir el isotipo (eso esta en foreground).
```

### 5.3 Splash screens iOS + Android (P0)

**IA:** Claude Web · **Tiempo:** 30 min · **Output:** 6 SVGs · **Path:** `public/brand-assets/store-listings/splash/`

```
[pegar contexto base §2]

Necesito splash screens base. Misma composicion, diferentes aspect ratios:

1. splash_iphone_1290x2796.svg (iPhone 15 Pro Max)
2. splash_iphone_1170x2532.svg (iPhone 15)
3. splash_ipad_2048x2732.svg (iPad Pro)
4. splash_android_1080x1920.svg (default)
5. splash_android_1440x2560.svg (high density)
6. splash_tablet_1600x2560.svg (Android tablet)

Composicion: fondo gradient radial brand (centro #9333ea, extremos
#581c87). Isotipo Paw Friend mark blanco centrado, ocupando 25% del
ancho. Sutil "Paw Friend" wordmark debajo (Jakarta 600 blanco), 8% del
ancho. Sin loaders ni copy adicional.
```

### 5.4 App Store screenshots 6.5" (6 slides · P0)

**IA:** Claude Web (mockup) + Shots.so (composicion) · **Tiempo:** 90 min · **Path:** `public/brand-assets/store-listings/app-store/`

Pasos:
1. **Capturar 6 screenshots reales del producto** en simulator iOS 6.5" (iPhone 15 Pro Max).
2. **Para cada screenshot**, crear overlay con Claude:

```
[pegar contexto base §2]

Necesito template SVG 1242×2688 (iPhone 6.5") para App Store screenshot.
Diseno overlay del screenshot del producto.

Layout: top 80px reservado (status bar). Bottom 80px reservado (home
indicator). Centro 2528px disponible.

Composicion overlay:
- Top 1/3: gradient blob brand (purple-rose) con eyebrow Fredoka 11
  letra-spacing wide y headline Fredoka 600 grande (max 6 palabras).
  Headline: "[<copy especifico>]".
- Centro 1/3: placeholder donde se monta el screenshot real (rect dashed
  con caption "screenshot aqui").
- Bottom 1/3: subhead Jakarta 400 (1 frase) + boton CTA outline + logo
  Paw Friend wordmark + "pawfriend.cl".

Headlines por slide:
1. "La ficha medica que viaja con tu peludo"
2. "1 click, la llevas a cualquier vet"
3. "Recordatorios que nunca olvidan"
4. "Encuentra tu vet de barrio"
5. "Comunidad pet chilena"
6. "Gratis. Siempre. Hecho en Chile."
```

### 5.5 Play Store feature graphic (P0)

**IA:** Claude Web · **Tiempo:** 20 min · **Path:** `public/brand-assets/store-listings/play-store/feature_graphic_1024x500.svg`

```
[pegar contexto base §2]

Necesito feature graphic Play Store SVG 1024×500.

Composicion: lado izquierdo (40%) gradient brand purple → rose con
"Paw Friend · La ficha medica de tu mascota" en Fredoka 600 grande
blanco + "Gratis. Hecho en Chile." Jakarta 400 sutil.

Lado derecho (60%): mockup phone Pixel con screenshot de la ficha clinica.

Sutil motivo paw print pattern al fondo.
```

### 5.6 Play Store screenshots 1080×1920 (8 slides · P0)

Mismo proceso que iOS App Store §5.4 pero formato 1080×1920. Headlines:

1. "La ficha medica que viaja con tu peludo"
2. "1 click, la llevas a cualquier vet"
3. "Recordatorios que nunca olvidan"
4. "Encuentra tu vet de barrio"
5. "Comunidad pet chilena"
6. "Mapa de servicios en tu comuna"
7. "Memorial: en memoria"
8. "Gratis. Siempre. Hecho en Chile."

### 5.7 App preview videos (15-30s · P1)

**Stack:** content-studio existente + DaVinci Resolve / CapCut · **Tiempo:** 4-6 horas · **Output:** 2 MP4 (iOS + Android)

Storyboard:
- 0-2s: hook con Kai/Ema en pantalla iPhone.
- 3-7s: ficha medica scroll rapido.
- 8-12s: mapa de vets pinning.
- 13-18s: recordatorio push notification.
- 19-25s: comunidad/memorial momento emocional.
- 26-30s: cierre con logo + "pawfriend.cl" + call to download.

Audio: musica licenciada Epidemic Sound o YouTube Audio Library. Sin voz.

---

## 6. Prompts por canal social

### 6.1 Instagram feed (6 templates · 1080×1080 · P1)

**IA:** Claude Web · **Tiempo:** 60 min · **Path:** `public/brand-assets/social/instagram/feed/`

```
[pegar contexto base §2]

Necesito 6 templates SVG 1080×1080 para Instagram feed:

1. social_ig_feed_feature.svg — banner top brand con eyebrow Fredoka,
   H2 grande Fredoka 600, area central placeholder screenshot producto,
   footer logo wordmark + @pawfriend_cl.

2. social_ig_feed_testimonial.svg — fondo suave blob purpura, quote
   block con tipografia Fredoka grande y cite Jakarta 600, area para
   foto circular placeholder.

3. social_ig_feed_health_tip.svg — layout estilo tarjeta medica, icono
   brand SVG grande, titulo Fredoka, 3 bullets Jakarta con tickmarks
   emerald.

4. social_ig_feed_paw_labs.svg — banner beta amarillo/gold top, concepto
   experimental, feature showcase.

5. social_ig_feed_behind_scenes.svg — fondo oscuro gradient con blob,
   founder quote/fact, mood warm + honesto.

6. social_ig_feed_data_stat.svg — numero grande Fredoka con gradient
   purple-gold, context 1 linea, brand en corner.

Safe zones IG: avoid top 100 + bottom 100 (username/actions).
```

### 6.2 Instagram stories (4 templates · 1080×1920 · P1)

```
[pegar contexto base §2]

Necesito 4 templates SVG 1080×1920 para IG Stories:

1. social_ig_story_countdown.svg — cielo gradient purple-gold, Paw
   Friend mark centrado grande, area para sticker countdown IG.

2. social_ig_story_link_bio.svg — layout mascota silueta + CTA sticker
   area, copy "Descarga tu ficha → link en bio", logo corner.

3. social_ig_story_quote.svg — quote grande Fredoka centered, cite
   abajo, background blob suave.

4. social_ig_story_daily_tip.svg — panel lateral con ilustracion brand
   + 3 pasos numbered Fredoka.

Safe zones: evitar top 220px + bottom 250px.
```

### 6.3 TikTok covers (3 + end-card · 1080×1920 · P1)

```
[pegar contexto base §2]

Necesito 3 templates SVG 1080×1920 para TikTok covers + 1 end-card:

1. social_tiktok_cover_hook.svg — 3 lineas grandes Fredoka bold con
   gradient purple-gold overlaid en placeholder mockup phone.

2. social_tiktok_cover_pov.svg — sticker estilo polaroid del peludo
   (frame white con paw prints), tilted -5°, fondo warm blur.

3. social_tiktok_cover_mascot.svg — silueta mascota grande centered
   (al modo ilustracion flat), copy sticker bottom con CTA.

4. social_tiktok_endcard.svg — Paw Friend mark centered + "pawfriend.cl"
   + gold pulse around.
```

### 6.4 YouTube thumbnails (3 + banner · P2)

```
[pegar contexto base §2]

Necesito 3 templates SVG 1280×720 para thumbs YouTube + 1 banner:

1. social_yt_thumb_tutorial.svg — split 50/50: izquierda screenshot
   con zoom feature, derecha founder placeholder face + text overlay
   Fredoka bold 800 con outline dorado. Ej: "Asi funciona la ficha PDF".

2. social_yt_thumb_testimonial.svg — fondo warm blur, placeholder video
   frame, text overlay "Sofia, vet de Santiago", Paw Friend mark corner.

3. social_yt_thumb_milestone.svg — numero grande Fredoka (+1000 Paw
   Members), context 1 linea, background split brand purple + gold.

4. social_yt_banner.svg (viewBox 2560×1440 · safe 1546×423)
   — channel banner Paw Friend + wordmark + tagline + CTA.

Safe: mantener elementos clave fuera de bottom-right (timestamp YouTube).
```

### 6.5 WhatsApp Business catalog (5 cards + status · P1)

```
[pegar contexto base §2]

Necesito 5 templates SVG 1080×1080 para catalog WhatsApp Business:

1. social_wa_catalog_ficha.svg — product "Ficha medica PDF",
   mockup screenshot, price "Gratis", CTA "Crear la mia".

2. social_wa_catalog_directorio.svg — product "Directorio vets",
   mockup mapa, tag "+200 vets Chile", CTA "Ver cerca de mi".

3. social_wa_catalog_member.svg — product "Paw Member", badge gold,
   price "$3.990/mes opcional", CTA "Sostener".

4. social_wa_catalog_company.svg — product "Paw Company", badge purple,
   price "$49.900-199.900/mes", CTA "Conversemos".

5. social_wa_catalog_voice.svg — product "Paw Voice", badge rose,
   price "Gratis", CTA "Aplicar".

Mas 4 status templates 1080×1920:
- status_lanzamiento.svg
- status_feature_semana.svg
- status_paw_member.svg
- status_testimonial.svg
```

### 6.6 Facebook (P2)

Reutilizar templates IG con ajuste de aspect-ratio:
- `social_fb_cover.svg` (1640×664)
- `social_fb_post.svg` (1200×1200)
- `social_fb_event.svg` (1920×1005)

Mismo prompt que §6.1, ajustar viewBox.

---

## 7. Investor + Partner kits

### 7.1 Investor deck cover premium (P0)

**IA:** Claude Web · **Tiempo:** 30 min · **Path:** `public/brand-assets/presentations/investor-kit/deck_cover_investors.svg`

```
[pegar contexto base §2]

Necesito 1 SVG 1920×1080 para cover de deck investor master.

Concepto: gradient radial cinematografico purple → gold → black en
esquinas, mark Paw Friend floating centered grande (filter drop-shadow
soft), eyebrow Fredoka 11px "Paw Friend · Hecho en Chile" arriba, title
Fredoka 600 big "La ficha medica de tu mascota", subtitle Jakarta 400
con tagline "Deck para CORFO · Start-Up Chile · Angeles LATAM". Footer
con fecha + pawfriend.cl.

Estilo: editorial premium, no corporate generico, no startup cliche.
```

### 7.2 Investor 1-pager executive summary (P0)

**IA:** Claude Web (HTML/PDF) · **Tiempo:** 60 min · **Path:** `public/brand-assets/presentations/investor-kit/one_pager.pdf`

```
[pegar contexto base §2]

Genera HTML autocontenido (1 pagina A4 portrait, listo para imprimir
a PDF) con executive summary de Paw Friend para inversionistas.

Estructura:
1. Header con logo Paw Friend + tagline + fecha.
2. Problema (3 lineas).
3. Solucion (3 lineas + 3 capas: capture, identity, monetize).
4. Mercado: 5M mascotas Chile · 74% hogares · ~$1.2M CLP/ano gasto.
5. Modelo: dueno NUNCA paga · B2B 6 motores (pharma, seguros, retail,
   gobierno, banca, edificios).
6. Traccion (junio 2026): 0 ARR, producto end-to-end listo, beta vet
   Sofia, 13 refugios pipeline.
7. Equipo: 1 founder + IA = 320h vs 4.800h equipo · 15x speed · 32-65x
   cost.
8. Ask: USD $150k cap $1.2M USD SAFE · uso 60% sales / 25% producto / 15% sueldo.
9. Hitos Y1: ARR $120k conservador / $420k optimista · 50.000 pets · 3 contratos.
10. Footer: contacto pawfriendcl@gmail.com · pawfriend.cl · Junio 2026.

Estilo: Plus Jakarta Sans · Fredoka headers · paleta brand · denso pero
legible · imprimible.
```

### 7.3 Founder photo profesional (P0)

**Stack:** sesion fotografica propia (iPhone) o **Midjourney v6.1** · **Tiempo:** 1-2 horas

Requisitos:
- Pedro de medio cuerpo, fondo neutro warm.
- Iluminacion natural, no flash duro.
- Camisa o sudadera color brand purple opcional.
- Mascota presente en algunas tomas (Kai o Ema).
- Resolucion 3000×3000 minimo.
- Variants: serious looking · sonriendo · con mascota · landscape ambiente.

Si no es viable foto propia:

```
Midjourney prompt:
chilean tech founder portrait, mid-30s male, warm natural lighting,
neutral warm background with soft purple bokeh, professional but
approachable, holding a small mestizo dog, soft smile, fredoka brand
aesthetic, editorial premium, no corporate stock vibe, --ar 1:1 --v 6.1
```

(Pero IDEAL: foto real propia, no IA.)

### 7.4 Partner kit 1-pager (P1)

**IA:** Claude Web · **Tiempo:** 45 min · **Path:** `public/brand-assets/presentations/partnership-kit/one_pager.pdf`

```
[pegar contexto base §2]

Genera HTML 1 pagina A4 para partner outreach kit.

Estructura:
1. Header brand.
2. "Eres una tienda / cafe / paseador / vet pet-friendly?" hook.
3. Que ofrecemos: visibilidad (mapa + perfil + newsletter del barrio).
4. Que pedimos: descuento exclusivo a Paw Members 10-25%.
5. Caso de uso: barber tu visibilidad por descuento. Sin contrato, sin
   exclusividad, sin pago.
6. Como aplicar: pawfriend.cl/aplicar?tipo=paw_partners
7. CTA grande.
```

### 7.5 Partnership banner 1200×400 (P1)

```
[pegar contexto base §2]

Necesito SVG 1200×400 banner partnership para email + WhatsApp.

Lado izquierdo: mark Paw Friend + wordmark.
Centro: "X Paw Friend" con X placeholder para logo partner (caja blanca).
Derecha: CTA "Hablemos →".

Paleta brand purple 50% + gold highlights. Espacio negativo generoso
para preview small.
```

### 7.6 Paw Voice creator kit (P1)

```
[pegar contexto base §2]

Necesito 4 assets SVG para Paw Voice creator kit:

1. paw_voice_badge_gold.svg (200×200) — badge oficial Paw Voice gold
   gradient + microfono blanco. Para perfil creator.

2. paw_voice_badge_rose.svg (200×200) — variante rose/fuchsia.

3. promo_card_share.svg (1080×1350) — card shareable con codigo promo
   placeholder + foto creator placeholder + Paw Friend mark.

4. reel_template_review.svg (1080×1920) — overlay para reel review:
   eyebrow "Paw Voice oficial" + space para video + CTA bottom.
```

---

## 8. Press kit

### 8.1 Press kit ZIP (P2)

**Stack:** Claude Web (1-pager + fact sheet + quotes) + folder con assets

Componentes a generar:

1. `press_release_template.md` (Claude):

```
[pegar contexto base §2]

Genera template de press release en Markdown sobre el lanzamiento de
Paw Friend. Estructura AP style:
- Headline accionable.
- Lede 2-3 lineas (quien · que · cuando · donde · por que).
- 3 parrafos backgrounder.
- 1 quote founder.
- 1 quote beta tester (Sofia, vet).
- Boilerplate "About Paw Friend".
- Contact info.

Tono: factual, sin hype, espanol chileno, lista para que prensa edite.
```

2. `fact_sheet_one_pager.pdf` (Claude HTML):

```
[pegar contexto base §2]

Genera HTML 1 pagina A4 con fact sheet Paw Friend:
- Nombre legal: SUSAETA GARNHAM SOFTWARE ENGINEERING SpA (RUT 78.328.659-9)
- Founder: Paw Founder
- Fundada: 2026
- Sede: Vitacura, Santiago de Chile
- Stack tecnico: React + Supabase + Capacitor (mobile)
- URLs: pawfriend.cl
- Lanzamiento: Junio 2026
- Modelo: dueno gratis · B2B paga
- Capital seed: USD $150k cap $1.2M
- Numeros canonicos al lanzamiento.
```

3. `quotes_bank.md` (Claude):

```
Genera 5 quotes founder-authored listas para periodista. 2 frases cada
una, espanol chileno, naturales (no marketing copy):

1. Sobre por que el dueno no paga.
2. Sobre como un founder + IA lleva el producto a 15x speed.
3. Sobre Paw Shield biometria.
4. Sobre el moat del modelo B2B de acceso a la ficha.
5. Sobre Chile como mercado.
```

4. **Logos pack ZIP**: zip de `paw-friend-assets-v2/logo/` (todas las variantes).

5. **Founder photos**: 3-5 variantes de §7.3.

6. **Product screenshots**: 8 screenshots iOS + 8 Android.

---

## 9. Email templates HTML

**Stack recomendado:** **MJML** (open source) + Claude Web para copy.

MJML es un framework que compila a HTML email-safe. Resuelve incompatibilidades
de Outlook + Gmail + Apple Mail automatico.

### 9.1 Email transactional welcome (P0)

```
[pegar contexto base §2]

Genera template MJML para email welcome de Paw Friend, listo para
plug-in de variables {{name}}, {{pet_name}}.

Estructura:
- Header con logo Paw Friend brand (no full purple, suave).
- Greeting "Hola {{name}}, bienvenido a Paw Friend".
- Body 3 parrafos cortos: que es Paw Friend · proximo paso · soporte.
- CTA boton "Crear ficha de {{pet_name}}".
- Footer: pawfriendcl@gmail.com · pawfriend.cl · unsubscribe link.

Email-safe: Arial/Helvetica fallback, sin web fonts, max 600px wide.
```

### 9.2 Newsletter mensual template (P1)

```
[pegar contexto base §2]

Genera template MJML para newsletter mensual.

Estructura:
- Header brand.
- Editorial 1 parrafo founder.
- 3 secciones: producto · comunidad · partners.
- Cada seccion con imagen + 2 lineas + CTA.
- Footer.
```

### 9.3 Outreach pharma/aseguradoras/retail (P1)

3 emails B2B con tono ejecutivo. Generar con Claude:

```
Genera 3 emails B2B outreach de Paw Friend, espanol chileno profesional:

1. Pharma (a Centrovet/Virbac): asunto + 4 parrafos + CTA reunion.
2. Aseguradoras (a Sura/BCI): asunto + 4 parrafos + CTA reunion.
3. Retail (a Master Dog/Falabella): asunto + 4 parrafos + CTA reunion.

Cada uno con link al pitch HTML correspondiente.
```

---

## 10. Patterns y backgrounds

### 10.1 Patterns SVG (3 · P2)

```
[pegar contexto base §2]

Necesito 3 patterns SVG tileable:

1. pattern_paw_dots.svg — grid de huellitas 40×40px tile, opacity .06,
   sobre bg brand-50. Para subtle wallpaper.

2. pattern_brand_noise.svg — noise overlay sutil con puntos 1px cada
   60px rgba(255,255,255,.05). Para hero bg.

3. pattern_gradient_mesh.svg — mesh gradient abstract purple + gold +
   rose blending. Para covers hero.
```

---

## 11. Cronograma sugerido

### Sprint 1 (semana 1) — UNBLOCK MOBILE LAUNCH (P0 critico)

- [ ] §3.1 Logo variants 5
- [ ] §5.1 App icon iOS 1024
- [ ] §5.2 Adaptive icon Android
- [ ] §5.3 Splash screens (6)
- [ ] §5.5 Play Store feature graphic

### Sprint 2 (semana 2) — STORE LISTINGS

- [ ] §5.4 App Store screenshots 6.5" (6)
- [ ] §5.6 Play Store screenshots 1080×1920 (8)
- [ ] §3.4 Favicon refresh

### Sprint 3 (semana 3) — INVESTOR + PARTNER

- [ ] §7.1 Investor deck cover premium
- [ ] §7.2 Investor 1-pager
- [ ] §7.3 Founder photo profesional
- [ ] §7.4 Partner kit 1-pager
- [ ] §7.5 Partnership banner

### Sprint 4 (semana 4) — PRODUCT POLISH

- [ ] §3.2 10 iconos brand squircle
- [ ] §4.2 6 empty states
- [ ] §4.3 5 onboarding ilustraciones
- [ ] §4.4 4 badges seals

### Sprint 5 (mes 2) — SOCIAL LAUNCH

- [ ] §6.1 IG feed (6)
- [ ] §6.2 IG stories (4)
- [ ] §6.3 TikTok covers (3)
- [ ] §6.5 WhatsApp Business catalog (5)
- [ ] §5.7 App preview videos (2)

### Sprint 6 (mes 2-3) — POST-LAUNCH

- [ ] §4.5 Sample dashboards Bronze/Silver/Gold
- [ ] §6.4 YouTube thumbs (3)
- [ ] §6.6 Facebook (3)
- [ ] §7.6 Paw Voice creator kit
- [ ] §8 Press kit
- [ ] §9 Email templates
- [ ] §10 Patterns

---

## 12. Checklist final pre-launch (junio 2026)

```
BRAND
[ ] Logo variants 5 completas
[ ] Favicon SVG refresh
[ ] Brand guidelines 1-pager
[ ] 10 iconos brand squircle pendientes

PRODUCT MOBILE
[ ] App icon iOS 1024 master
[ ] Adaptive icon Android
[ ] Splash screens per device (6)
[ ] App Store screenshots 6.5" (6)
[ ] App Store screenshots 5.5" (6)
[ ] Play Store screenshots 1080×1920 (8)
[ ] Feature graphic Play Store
[ ] App preview video iOS
[ ] Play Store promo video

PRODUCT IN-APP
[ ] Empty states (6)
[ ] Onboarding illustrations (5)
[ ] Badges seals (4)
[ ] Sample dashboards (3)

INVESTOR
[ ] Deck cover premium
[ ] 1-pager executive summary
[ ] Founder photo pro
[ ] Data room index + carpeta
[ ] Intro email templates × 3
[ ] 11 pitch decks ✅ DONE

PARTNER
[ ] Partner kit 1-pager
[ ] Partnership banner 1200×400
[ ] Email outreach + banner
[ ] Paw Partner badge SVG

SOCIAL LAUNCH DAY 1
[ ] IG feed post teaser
[ ] IG story launch
[ ] IG reel 15s (content-studio)
[ ] FB cover + post
[ ] TikTok vertical launch
[ ] WhatsApp Business profile + status launch
[ ] YouTube thumb + banner (optional)

PRESS
[ ] Press kit ZIP
[ ] Fact sheet 1-pager
[ ] Quotes bank
[ ] Press release template

EMAIL
[ ] Welcome transactional
[ ] Newsletter mensual
[ ] B2B outreach × 3

PITCH HTML (estado actual)
[x] PITCH_INVESTORS_LIVE.html ✅
[x] PITCH_FONDOS.html ✅
[x] PITCH_PHARMA.html ✅
[x] PITCH_ASEGURADORAS.html ✅
[x] PITCH_RETAIL.html ✅
[x] PITCH_GOBIERNO.html ✅
[x] PITCH_BANCOS.html ✅
[x] PITCH_EDIFICIOS.html ✅
[x] PITCH_LONGTAIL.html ✅
[x] PITCH_REFUGIOS_PARTNERS.html ✅
[x] INSIGHTS_DASHBOARDS_MOCK.html ✅
```

---

## 13. Si Pedro tiene poco tiempo

**Opcion A — solo tier minimo Claude Pro ($20/mes), 4 horas/semana:**
- Sprint 1 + 2 (mobile stores P0): 1 semana — desbloquea launch
- Sprint 3 (investor + partner P0): 1 semana — desbloquea outreach
- Resto en mes 2-3 segun necesidad.

**Opcion B — contratar disenador externo:**
- Pedro pasa este MD como spec.
- Disenador entrega backlog en 2-3 semanas.
- Costo estimado: USD $800-1.500 freelance LATAM.

**Opcion C — IA + freelance hibrido:**
- Pedro genera SVGs simples con Claude (logos, iconos, badges).
- Disenador hace fotos + video + mockups premium.
- Costo: USD $400-700.

**Recomendacion personal:** Opcion A para launch. Pasa el MD a un disenador
solo si no cumples el cronograma.

---

## 14. Status de assets (snapshot 2026-04-29 PM)

### ✅ Generados y montados en repo (Pedro 2026-04-29)

**Logos** — `public/paw-friend-assets-v2/logo/`
- `paw_friend_mark_square.svg` · `paw_friend_wordmark_vertical.svg` ·
  `paw_friend_lockup_tagline.svg` · `paw_friend_icon_gold.svg` · `paw_friend_sticker.svg`

**Iconos brand squircle** — `public/paw-friend-assets-v2/icons/brand-squircle/`
- 31_donation · 32_shield_data · 33_ai_brain · 34_map_pin_paw · 35_pdf_record ·
  36_handshake_paws · 37_invoice · 38_shelter · 39_badge_member · 40_qr_code_paw
  + extras 43_leash · 46_grooming · 48_home_base · 49_heart_monitoring ·
  51_trophy_pets · 52_gift · 53_camera_pet · 54_settings · 55_bell · 56_shield

**Iconos categoria audiencia B2B** — `public/paw-friend-assets-v2/icons/categories/`
- icon_pharma · icon_insurance · icon_retail · icon_government

**Badges** — `public/brand-assets/badges/`
- badge_paw_member · badge_paw_voice · badge_paw_company · badge_vet_verified

**Illustrations empty states** — `public/brand-assets/illustrations/empty-states/`
- no_pets_yet · no_reminders · no_feed · no_vets_nearby · no_donations · no_missions

**Illustrations onboarding** — `public/brand-assets/illustrations/onboarding/`
- welcome · add_pet · first_record · vet_directory · paw_member_optional

**Hero landing** — `public/brand-assets/illustrations/hero/`
- hero_landing_main.svg

**Mockups dashboards** — `public/brand-assets/mockups/dashboards/`
- dashboard_bronze · dashboard_silver · dashboard_gold

**Patterns** — `public/brand-assets/patterns/`
- pattern_paw_dots · pattern_brand_noise · pattern_gradient_mesh

**Investor kit** — `public/brand-assets/presentations/investor-kit/`
- deck_cover_investors

**Partner kit** — `public/brand-assets/presentations/partner-kit/`
- partnership_banner

**Paw Voice creator kit** — `public/brand-assets/presentations/paw-voice-kit/`
- paw_voice_badge_gold · paw_voice_badge_rose · promo_card_share · reel_template_review

**Press kit** — `public/brand-assets/press-kit/`
- press_release_template.md · fact_sheet_one_pager.html · quotes_bank.md ·
  b2b_outreach_emails.md

**Email templates** — `public/brand-assets/email-templates/`
- welcome_transactional.html · newsletter_monthly.html

**Social media** — `public/brand-assets/social/`
- Instagram feed (6) · Instagram stories (4) · TikTok (3 cover + endcard) ·
  YouTube (3 thumbs + banner) · Facebook (cover + post + event) ·
  WhatsApp (5 catalog + 4 status)

**Store listings** — `public/brand-assets/store-listings/`
- App Store: icon_1024 + 6 screenshots
- Play Store: feature_graphic_1024x500 + 8 screenshots
- Splash: 6 variantes (iPhone/iPad/Android/tablet)

**Android adaptive** — `public/paw-friend-assets-v2/android/`
- adaptive-foreground · adaptive-background (SVG; Pedro convierte a XML
  Vector Drawable o PNG por densidad via Android Studio)

**Favicon refresh** — `public/favicon.svg` (actualizado)

### 📦 Wire-up en codigo (2026-04-29 PM)

- ✅ `EmptyStateIllustration` extendido con 6 kinds nuevos
  (donations / feed / missions / pets_yet / reminders / vets_nearby)
- ✅ `BrandBadge` componente nuevo · `kind=paw_member|paw_voice|paw_company|vet_verified`
- ✅ `PawMember.tsx` usa BrandBadge size="lg" en hero (reemplaza logo improvisado)
- ✅ `INSIGHTS_DASHBOARDS_MOCK.html` slide nuevo con dashboards Bronze/Silver/Gold

### ⏳ Pendiente — wire-up adicional (priorizar segun necesidad)

- App Store + Play Store screenshots ya existen en SVG; falta export a PNG
  + subir a App Store Connect / Play Console (Pedro manual).
- App preview video iOS + Play Store promo video (content-studio existente).
- Founder photo profesional (Pedro foto propia con Kai/Ema).
- B2B outreach email templates personalizados con datos finales (Pedro
  ajusta `b2b_outreach_emails.md` segun cuenta a contactar).

---

*Fin. Cualquier asset que no este aqui se discute antes de crear (regla de
oro de [BRAND_SYSTEM_2026.md §9.2](BRAND_SYSTEM_2026.md#92-naming-convention)).*
