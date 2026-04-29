# Paw Friend · Brand System 2026 (consolidado)

> **Fuente unica de verdad** del brand system. Cubre app web + mobile + 11 pitch decks
> + redes sociales + email + press + investor + partner kits + store listings + eventos.
>
> Reemplaza y consolida:
> - `docs-raiz/pawfriend-omnichannel-brand-assets-and-prompts.md` (marcado superseded)
> - `pitch-inversionistas/BRAND_KIT_PITCHES.md` (marcado superseded)
>
> **Version:** 2026-04-29.
> **Dueno:** Paw Founder.
> **Companion ejecutable:** [ASSETS_GENERATION_PLAN.md](ASSETS_GENERATION_PLAN.md) (prompts + IA recomendada por asset).

---

## 1. Filosofia de marca

### 1.1 Quien somos

Paw Friend es la **infraestructura digital de la mascota chilena**. El dueno
nunca paga: ficha clinica, recordatorios, comunidad y biometria son gratis.
La monetizacion es B2B: pharma + seguros + retail + gobierno + banca + edificios
+ refugios + paw partners + long-tail. Modelo Mapcity.

### 1.2 Tono visual

- **Calido + premium + chileno + tecnologico-amable.**
- **No corporate frio, no startup hyperactivo, no infantil.**
- Las mascotas son protagonistas reales (no caricaturas). Los duenos son chilenos
  reales (no actores stock). Los vets usan scrubs de verdad.
- Cuando sumamos audiencia B2B (pharma/banca/etc), el tono **no cambia**:
  cambia el **dialecto** (la paleta y los datos), pero la marca madre se siente
  igual de calida.

### 1.3 Tono verbal

- Espanol chileno (tu, tienes, puedes — **NO** voseo argentino).
- Terminos canonicos: **comuna · ficha clinica · recordatorio · Paw Friend**.
- Frases cortas, micro-pausas, sin guiones largos en copy emocional.
- Eyebrow → headline → subhead → CTA. Sin parrafos eternos.

---

## 2. Tipografia oficial

| Rol | Fuente | Pesos | Uso |
|---|---|---|---|
| Display | **Fredoka** | 500 / 600 / 700 | Headlines, eyebrows, hero |
| Body | **Plus Jakarta Sans** | 400 / 500 / 600 / 700 / 800 / 900 | UI, cuerpo, navegacion |
| Mono | **JetBrains Mono** | 400 / 500 / 700 | Codigo, IDs, valores numericos en mocks |
| Native iOS fallback | SF Rounded + SF Pro | — | UI nativa en iOS |
| Native Android fallback | Roboto Slab + Roboto | — | UI nativa en Android |
| Email-safe | Arial / Helvetica | — | Templates HTML email |

**Fallback stack web:** `'Fredoka', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`.

**Variable fonts:** ambas Fredoka y Plus Jakarta Sans tienen variantes variables. Preferir cuando se pueda.

**Embed en PDFs:** siempre embed fonts (press kit, investor kit, partner kit).

---

## 3. Paleta canonica del producto (app + landing)

Estos son los tokens base. Toda la app web + mobile + pitch master los usa.

| Token | Hex | Uso primario |
|---|---|---|
| `--brand-50` | `#faf5ff` | Backgrounds light |
| `--brand-100` | `#f3e8ff` | Soft surfaces |
| `--brand-200` | `#e9d5ff` | Borders light |
| `--brand-500` | `#a855f7` | Accent secundario |
| `--brand-600` | `#9333ea` | **Primario brand** |
| `--brand-700` | `#7e22ce` | Hover/pressed |
| `--brand-800` | `#6b21a8` | Dark surfaces |
| `--brand-900` | `#581c87` | Backgrounds deep dark |
| `--gold` | `#eab308` | Accent dorado · Paw Member · celebraciones |
| `--gold-light` | `#fde047` | Highlight gradient |
| `--gold-soft` | `#fef9c3` | Backgrounds dorados suaves |
| `--medical` / `--emerald` | `#10b981` | Estado saludable, partners, exito |
| `--emerald-light` | `#34d399` | Highlight verde |
| `--rose` / `--pharma` | `#ec4899` | Paw Voices · acentos pharma |
| `--sky` | `#0ea5e9` | Info, links secundarios |
| `--alert` | `#ef4444` | Error, critico |
| `--ink` | `#1a102b` (hsl 270 15% 10%) | Texto sobre claro |
| `--paper` | `hsl(270 20% 98%)` | Background light por defecto |
| `--ink-deeper` | `#020617` | Backgrounds dark deep |

**Gradientes brand canonicos:**

```css
--gradient-hero:    linear-gradient(135deg, #581c87 0%, #9333ea 50%, #ec4899 100%);
--gradient-gold:    linear-gradient(135deg, #9333ea 0%, #eab308 100%);
--gradient-success: linear-gradient(135deg, #047857 0%, #10b981 100%);
--gradient-mesh:    radial-gradient(circle at 20% 30%, rgba(168,85,247,0.4), transparent 40%),
                    radial-gradient(circle at 80% 70%, rgba(234,179,8,0.3), transparent 40%);
```

---

## 4. Paletas dialectos por audiencia (pitches B2B)

Cada pitch B2B usa la marca madre Paw Friend pero **proyectada en un color
ancla** para que el sponsor sienta que el deck esta hecho para el. La estructura,
tipografia y geometria se mantienen identicas — solo cambia la paleta.

| Pitch | Audiencia | Primario | Acento | Dark | Gradient hero |
|---|---|---|---|---|---|
| **MASTER LIVE** | Cualquier inversionista | `#9333ea` | `#fde047` | `#0a0612` | `#581c87 → #9333ea → #ec4899` |
| **FONDOS** | CORFO + Start-Up Chile + Angels/VC | `#9333ea` | `#eab308` | `#0a0612` | `#581c87 → #9333ea → #eab308` |
| **PHARMA** | Centrovet · Virbac · Zoetis · MSD | `#ec4899` (magenta) | `#eab308` | `#0a0612 → #831843` | `#831843 → #ec4899 → #fbcfe8` |
| **ASEGURADORAS** | Sura · BCI · Mapfre · Consorcio | `#0369a1` (azul confianza) | `#38bdf8` cyan | `#050b14 → #0c4a6e` | `#1e3a8a → #0369a1 → #38bdf8` |
| **RETAIL** | Master Dog · Falabella · Puppis | `#ea580c` (naranja) | `#fb7185` coral | `#1c0701 → #7c2d12` | `#9a3412 → #ea580c → #fb7185` |
| **GOBIERNO** | Municipios · SAG · Subdere | `#1e3a8a` (azul estado) | `#15803d` verde | `#050816 → #1e3a8a` | `#0a1330 → #1e40af → #15803d` |
| **BANCOS** | BCI · Santander · Itau · BancoEstado | `#0f172a` (navy) | `#facc15` dorado | `#020617 → #1e293b` | `#0f172a → #ca8a04 → #facc15` |
| **EDIFICIOS** | Inmobiliarias · admins · HOAs | `#475569` (pizarra) | `#84cc16` lima | `#020617 → #334155` | `#1e293b → #475569 → #84cc16` |
| **LONGTAIL** | Aerolineas · academia · hardware | `#7c3aed` (violeta) | `#14b8a6` teal | `#0a0612 → #4c1d95` | `#4c1d95 → #7c3aed → #14b8a6` |
| **REFUGIOS_PARTNERS** | Refugios + Paw Partners | `#0d9488` (teal calido) | `#f59e0b` ambar | `#042f2e → #115e59` | `#115e59 → #0d9488 → #f59e0b` |

**Regla de aplicacion:** la marca madre Paw Friend (logo + isotipo + wordmark)
nunca cambia de color. Los acentos del deck si cambian.

---

## 5. Logo system

### 5.1 Variantes existentes (en `paw-friend-assets-v2/logo/`)

| Variante | Archivo | Uso |
|---|---|---|
| Principal (purpura) | `paw_friend_icon_principal.svg` | Default, light bg |
| Reverse (blanco) | `paw_friend_icon_reverse.svg` | Dark bg, covers |
| Dark (oscuro) | `paw_friend_icon_dark.svg` | Dark mode |
| Mono (monocromo) | `paw_friend_icon_mono.svg` | Print, fax |
| Wordmark horizontal | `paw_friend_wordmark_horizontal.svg` | Headers, firmas |

### 5.2 Variantes a crear (P0)

| Variante | Archivo | Uso |
|---|---|---|
| Isotipo cuadrado | `paw_friend_mark_square.svg` | App icon, favicons |
| Wordmark vertical | `paw_friend_wordmark_vertical.svg` | Posters, eventos |
| Logo + tagline | `paw_friend_lockup_tagline.svg` | "La ficha medica de tu mascota" |
| Logo gold | `paw_friend_icon_gold.svg` | Hero moments, Paw Member |
| Logo sticker outline | `paw_friend_sticker.svg` | Print, swag |

### 5.3 Reglas de uso

**Si:**
- Sobre fondo blanco/claro → principal.
- Sobre fondo purpura/oscuro → reverse.
- Contexto celebracion/Paw Member → gold variant.
- Print/B&W → mono.
- Favicon/app icon → isotipo cuadrado.

**No:**
- Estirar horizontal/vertical.
- Cambiar colores del isotipo manualmente.
- Sombras o glows ad-hoc.
- Meterlo dentro de cajas redondeadas extra (ya tiene squircle).
- Combinar con otra mascota que no sea la pata Paw Friend.

### 5.4 Tamanos minimos + safe area

- **Digital:** 24×24 isotipo · 80×20 wordmark.
- **Print:** 10mm isotipo · 40×10mm wordmark.
- **App icon master:** 1024×1024.
- **Safe area:** 0.5× altura del isotipo libre alrededor (no texto, no graficos).

---

## 6. Sistema de iconos

### 6.1 Iconos brand squircle (app + landing + pitches)

- **ViewBox:** 200×200 · `rx 40` (alineado app icon).
- **Background:** color brand del contexto (default `#9333ea`).
- **Contenido:** blanco `#fff`, flat, sin sombras.
- **Stroke:** `linecap="round"` · `linejoin="round"` cuando aplique.
- **Sin texto embedded.** El texto lo pone el HTML consumidor.
- **Peso objetivo:** < 2 KB por SVG.
- **Funcionar a:** 24×24, 96×96, 512×512 sin perder detalle.

### 6.2 Iconos lineart (inline pitch + tablas)

- **ViewBox:** 24×24.
- **Solo stroke** (`currentColor`), no fills.
- **Stroke-width:** 1.8 default · 1.5 dense · 2 hero.
- **Reconocible a 16×16.**

### 6.3 Iconos categoria audiencia (en `paw-friend-assets-v2/icons/categories/`)

Existen: voice · partner · company · shelter · investor · vet (componente
`CategoryIcon` los renderiza con fallback Lucide). Si se agrega tipo nuevo,
seguir el mismo formato.

### 6.4 Iconos lucide (capa producto)

`src/lib/icons.ts` cura ~200 iconos Lucide para UI producto. **No se cambia.**
La capa brand (squircle + lineart) se monta sobre Lucide cuando aplica.

### 6.5 Inventario de iconos brand actuales

Ya creados (en `paw-friend-assets-v2/icons/v1-legacy/`):

```
01_paw_print · 02_dog_face · 03_cat_face · 04_heart_paw · 05_bone
06_pet_house · 07_pulse · 08_syringe · 09_pill · 10_stethoscope
11_thermometer / 11_pet_beloved · 12_first_aid · 13_medical_cross
14_clinical_record · 15_calendar · 16_clock · 17_checkmark · 18_tasks
19_mobile_app · 20_chat · 21_notification · 22_search · 23_cloud
24_partnership · 25_growth · 26_clinic · 27_rocket · 28_idea
29_target · 30_star
```

Pendientes (P0 para launch · 10 iconos): ver §6 de [ASSETS_GENERATION_PLAN.md](ASSETS_GENERATION_PLAN.md).

---

## 7. Imagen, ilustracion y mockups

### 7.1 Talento a representar

- **Mascotas:** perros y gatos chilenos (quiltros + mestizos + razas variadas).
- **Duenos:** diversidad chilena, edades 25-65, urbano + semi-urbano.
- **Vets:** scrubs reales, edad 30-60, escena de consulta o estetoscopio.
- **Partners:** interior de negocio chileno con mascota presente.
- **Comunidad:** refugio, parque, encuentros, voluntariado.

### 7.2 Estilo fotografico

- **Iluminacion:** natural, warm, no flash duro.
- **Paleta:** warm + saturacion media, nunca sobre-procesada.
- **Composicion:** regla de tercios, espacio negativo para copy.
- **Momento:** accion cotidiana (no pose corporate).

### 7.3 Estilo ilustrativo

- **Flat modern con microdetalles.**
- **Paleta:** brand + gold + rose + emerald segun contexto.
- **No:** hiperrealismo, 3D cartoon, anime, Material Design puro.
- **Si:** estilo Paw Friend — calido, premium, reconocible.

### 7.4 Cuando uso que asset

| Situacion | Asset |
|---|---|
| Landing hero | Foto lifestyle real + mockup dispositivo |
| Feature showcase | Screenshot producto + frame device |
| Testimonial | Foto real de la persona (con permiso) |
| Empty state | Illustration brand flat |
| Pitch cover deck | Illustration hero / mark brand |
| Press article | Foto real con creditos |
| Social post regular | Illustration + copy |
| Social post storytelling | Foto real + overlay |
| Ad banner | Mockup dispositivo + benefit headline |

### 7.5 Mockups disponibles

- **Carnet frente/reverso + Paw Passport:** `paw-friend-assets/IDS/*.svg` (P0 listo).
- **Sample dashboards:** `pitch-inversionistas/INSIGHTS_DASHBOARDS_MOCK.html` (P0 listo).
- **Device mockups (iPhone, iPad, Pixel, MacBook):** pendientes — ver assets plan.

### 7.6 Fuentes de imagen

- **Propias** (priorizar): fotos del founder + Kai + Ema.
- **Licenciadas:** Unsplash/Pexels con licencia comercial.
- **Generadas con IA:** OK para ilustracion flat brand-aligned. **NO** para "fotos realistas" que simulen testimoniales.
- **Partner-provided:** cuando un partner/vet acepta compartir material suyo.

---

## 8. Numeros canonicos compartidos

> **Critico:** todo material publico que mencione un numero debe usar **exactamente** estos valores.
> Cualquier divergencia es bug y se corrige en el mismo commit.

| Concepto | Valor canonico | Etiqueta |
|---|---|---|
| Pets en plataforma | **50.000+** | PROYECCION Q3 2026 |
| Paw Shield accuracy | **100% top-1 con 3 fotos** (test interno con 8 mascotas reales) | REAL |
| Paw Shield 1 foto | **75% top-1** | REAL |
| Hogares Chile con mascota | **74%** | Estimado dominio publico |
| Mascotas totales Chile | **5M** (perros + gatos) | Estimado |
| Gasto medio anual / mascota | **~$1.2M CLP** | Estimado |
| Penetracion seguros pet Chile | **~3% (vs 25% UK)** | Estimado |
| Municipios obligados Ley 21.020 | **345** | Real |
| Edificios RM pet-friendly | **~8.000** | Estimado |
| Refugios chilenos activos | **~250** | Estimado |
| Empresa | **SUSAETA GARNHAM SOFTWARE ENGINEERING SpA** (RUT 78.328.659-9) | Real |
| Email contacto | **pawfriendcl@gmail.com** | Real |
| Web | **pawfriend.cl** | Real |
| Lanzamiento producto | **Junio 2026** | Real |
| Edge functions activas | **36+** | Real |
| Migraciones SQL | **189+** | Real |
| Tests verdes | **587/587** | Real |
| ARR Y1 conservador | **$120k USD** | PROYECCION |
| ARR Y1 optimista | **$420k USD** | PROYECCION |
| ARR Y3 base | **$1.82M USD** | PROYECCION |
| Ronda inicial seed | **USD $150k cap $1.2M USD SAFE** | Real (en busqueda) |
| Apalancamiento founder + IA | **320 hrs vs 4.800 hrs · 15x · 32-65x menor costo** | Real |
| Petify pricing (proveedor biometria) | **Basic $0.50 · Pro $0.75 · Premium contact-sales** USD/pet/mes | Real (verificado pricing page Petify) |
| Petify tier para Paw Shield | **Pro $0.75 USD/pet/mes** (necesario para lost pet recovery 1:N en `/nose-scan`) | Real |
| Paw Shield COGS proyectado Y1 (25% activacion · 50k pets) | **~$112k USD/ano** | PROYECCION |

**Etiquetado en mocks:**
- Tag verde `REAL` → existe en producto / DB / file system hoy.
- Tag amarillo `PROYECCION` → al cohort proyectado de Junio 2026.

---

## 9. Taxonomia de assets

### 9.1 Familias (14 carpetas raiz)

```
brand/
├── logo-system/              # Variantes logo
├── app-icon-system/          # iOS / Android / adaptive / favicon
├── favicon-system/           # 16/32/48/96 + safari + manifest
├── typography/               # Fonts + specimens + license
├── icon-library/             # Brand SVG + lineart + lucide ref
├── illustration-system/      # Mascotas / duenos / vets / comunidad
├── photography/              # Fotos reales + licenciadas + IA-flat
├── mockup-system/            # Devices / dashboards / promos
│
product-ui/
├── in-app-icons/             # Iconos especializados (health, roles)
├── empty-states/             # Ilustraciones para vacios
├── badges-seals/             # Member / Voice / Company / Verified
├── banners/                  # Paw Labs · upgrade · promo · sponsored
│
marketing/
├── social-templates/         # IG / FB / TikTok / YouTube / WhatsApp
├── promotional-banners/      # Campaign-specific
├── email-templates/          # Newsletter / outreach / transactional
│
presentations/
├── pitch-templates/          # Slide-types · covers · dividers
├── partnership-kit/          # Paw Companys + Partners
├── investor-kit/             # Deck cover · sample dashboard · data room
├── media-press-kit/          # Logo pack · founder photo · 1-pager
├── creator-voices-kit/       # Badge · codigo promo · reel cover
├── onboarding-product-kit/   # Screenshots con frame · walkthrough
│
operations/
├── document-templates/       # Letterhead · invoice · NDA · contracts
├── store-listings/           # Play Store + App Store assets
├── event-conference-kit/     # Roll-up · backdrop · lanyard · swag
```

### 9.2 Naming convention

```
<category>_<role>_<variant>.<ext>

logo_icon_principal.svg
logo_wordmark_horizontal.svg
icon_brand_31_donation.svg
icon_lineart_briefcase.svg
badge_paw_member.svg
social_ig_feed_testimonial.svg
social_tiktok_cover_hook.svg
mockup_iphone15_portrait.svg
empty_state_no_pets.svg
deck_cover_investors.svg
hero_landing_main.svg
```

**Reglas:**
- **Sin v1, v2, final, definitive** — git history es el versionado.
- **Master files SVG** (fuente de verdad) + **delivery PNG/JPG/WebP**.
- **Iteraciones internas** → folder `_scratch/` (gitignored).
- **Deprecados** → folder `_archive/` con fecha de archivado.

### 9.3 Folder estructura final en repo

```
paw-friend-assets-v2/         # Brand kit raiz (existente)
├── logo/
├── icons/brand-squircle/
├── icons/categories/
├── icons/v1-legacy/
├── illustrations/empty-states/
├── email/
├── event/
├── social/
└── store/

paw-friend-assets/IDS/        # Carnet + Pasaporte (existente)
├── carnet-mascota-frente.svg
├── carnet-mascota-reverso.svg
└── pasaporte-mascota.svg

pitch-inversionistas/assets/  # Copia para autocontenido
└── IDS/                       (mirror de paw-friend-assets/IDS/)

public/brand-assets/          # P1 — generar para production
├── logo/
├── icons/brand-squircle/
├── icons/lineart/
├── illustrations/hero/
├── illustrations/empty-states/
├── badges/
├── mockups/devices/
├── social/instagram/
├── social/facebook/
├── social/whatsapp/
├── social/tiktok/
├── social/youtube/
├── store-listings/app-store/
├── store-listings/play-store/
└── patterns/
```

---

## 10. Reglas por canal

| Canal | Aspect | Tipos | Tono | Safe zones |
|---|---|---|---|---|
| **Instagram feed** | 1080×1080 / 1080×1350 | Post · carousel | Warm + premium · emoji light | top 100 · bottom 100 |
| **Instagram story** | 1080×1920 | Story · reel cover | Sticker style · CTA visible | top 220 · bottom 250 |
| **Facebook** | 1640×664 cover · 1200×1200 post | Cover · post · event | Mas informativo · audiencia 35-55 | — |
| **WhatsApp Business** | 640×640 profile · 1080×1920 status · 1080×1080 catalog | Profile · status · catalog · broadcast | Directo · tuteo · breve | — |
| **TikTok** | 1080×1920 vertical | Video · cover · end-card | Autentico · POV real · hook 2s | UI bottom + hashtags |
| **YouTube** | 1280×720 thumb · 2560×1440 banner | Thumb · banner · end-screen | Tutorial-friendly · contrast alto | safe 1546×423 banner · evitar bottom-right thumb |
| **Web/landing** | 1200×630 OG · responsive | Hero · OG image · screenshot | Alineado al producto | — |
| **iOS App Store** | 1024×1024 icon · 1242×2688 6.5" / 1242×2208 5.5" | Icon · screenshots · preview video | Premium iOS-native | top 80 · bottom 80 status/home |
| **Android Play Store** | 432×432 adaptive · 1024×500 feature · 1080×1920 screenshot | Adaptive icon · feature graphic · screenshots · video | Material-friendly · brand-first | safe 264×264 centro adaptive |
| **Email HTML** | 600px max-width | Header · CTA · footer | Email-safe Arial/Helvetica · plain HTML | — |
| **Print pitch / press kit** | A4 / Letter PDF | 1-pager · multipage | Editorial premium · fonts embed | margenes generosos |

Detalle por canal en [ASSETS_GENERATION_PLAN.md seccion 6](ASSETS_GENERATION_PLAN.md#6-prompts-por-canal).

---

## 11. Inventario de pitches y como se usan

| Deck HTML | Audiencia | Slides | Estado |
|---|---|---|---|
| [PITCH_INVESTORS_LIVE.html](../pitch-inversionistas/PITCH_INVESTORS_LIVE.html) | Master generico cualquier inversionista | 13 | ✅ Live |
| [PITCH_FONDOS.html](../pitch-inversionistas/PITCH_FONDOS.html) | CORFO + Start-Up Chile + Angels/VC (con tabs) | 9 | ✅ Live |
| [PITCH_PHARMA.html](../pitch-inversionistas/PITCH_PHARMA.html) | Pharma animal | 8 | ✅ Live |
| [PITCH_ASEGURADORAS.html](../pitch-inversionistas/PITCH_ASEGURADORAS.html) | Pet insurance | 8 | ✅ Live |
| [PITCH_RETAIL.html](../pitch-inversionistas/PITCH_RETAIL.html) | Retail pet | 8 | ✅ Live |
| [PITCH_GOBIERNO.html](../pitch-inversionistas/PITCH_GOBIERNO.html) | Municipios + SAG | 8 | ✅ Live |
| [PITCH_BANCOS.html](../pitch-inversionistas/PITCH_BANCOS.html) | Banca retail | 8 | ✅ Live |
| [PITCH_EDIFICIOS.html](../pitch-inversionistas/PITCH_EDIFICIOS.html) | Inmobiliarias + admins | 8 | ✅ Live |
| [PITCH_LONGTAIL.html](../pitch-inversionistas/PITCH_LONGTAIL.html) | 6 verticales B2B residual | 8 | ✅ Live |
| [PITCH_REFUGIOS_PARTNERS.html](../pitch-inversionistas/PITCH_REFUGIOS_PARTNERS.html) | Refugios + Paw Partners | 6 | ✅ Live |
| [INSIGHTS_DASHBOARDS_MOCK.html](../pitch-inversionistas/INSIGHTS_DASHBOARDS_MOCK.html) | Apendice transversal data room | 10 | ✅ Live |

**Cuando uso cada uno:** ver [pitch-inversionistas/README.md](../pitch-inversionistas/README.md).

---

## 12. Asset sets omnicanal (23 kits)

Tabla compacta. Detalle de piezas en [ASSETS_GENERATION_PLAN.md](ASSETS_GENERATION_PLAN.md).

| Kit | Prioridad | Status |
|---|---|---|
| A. Core brand set (logo + tipo + paleta) | P0 | Parcial |
| B. Product app set (10 screenshots + frames + empty states + badges) | P0 | Parcial |
| C. Landing/marketing set (hero + 4 pilares + 6 caminos + OG) | P1 | Parcial |
| D. Social launch set (teaser reel + carousel + story + WhatsApp catalog) | P0 | Pending |
| E. Instagram set (feed + story + reel + carousel + highlights) | P1 | Pending |
| F. Facebook set | P2 | Pending |
| G. WhatsApp Business set | P1 | Pending |
| H. TikTok set | P1 | Pending |
| I. YouTube set | P2 | Pending |
| J. Desktop/web set (favicon + OG + hero) | P0 | Casi completo |
| K. iOS set (App Store + in-app) | P0 | Pending |
| L. Android set (Play Store + in-app) | P0 | Pending |
| M. Store listing set (ASO + A/B variants) | P1 | Pending |
| N. Partnership outreach set | P1 | Parcial |
| O. Investor outreach set | P0 | Casi completo (gracias a 11 pitch decks) |
| P. Press/media set | P2 | Pending |
| Q. Creator/voices set | P1 | Pending |
| R. Event/conference kit | P2 | Pending |
| S. Documentation/help center kit | P2 | Pending |
| T. Onboarding/in-product kit | P1 | Parcial |
| U. Premium/subscription kit | P1 | Pending |
| V. Referral/campaign kit | P2 | Pending |
| W. Vet/partner vertical kits | P1 | Pending |

---

## 13. IA recomendada por familia

| Familia | IA recomendada | Costo | Por que |
|---|---|---|---|
| **SVG vectorial brand** (logos, iconos, illustrations flat) | **Claude Web** (Sonnet/Opus) | $20/mes Pro (Pedro ya tiene) | Genera SVG limpio inline, prompts del Brand System ya estan ready |
| **Fotos lifestyle realistas** (dueno + mascota, vets) | **Midjourney v6.1** | $10-30/mes (Pedro ya tiene Basic) | Mejor calidad foto realista en mercado |
| **Mockups dispositivo** (iPhone/iPad/Pixel/MacBook) | **Shots.so** (gratis) o **Mockuuups Studio** ($14/mes) | Gratis suficiente | UI prebuilt, drag-drop screenshot |
| **Ilustraciones flat brand** (alternativa Claude) | **Recraft V3** | $10/mes plan free generoso | Especializado en SVG editable + brand consistency |
| **Iconos pixelart consistentes** | **Claude Web + SVGO post-process** | Solo costo Claude | SVGO optimiza output |
| **Video reels / stories** | **Content Studio existente** (Remotion + Satori + ElevenLabs Pro + Midjourney) | Ya operativo | Pedro tiene pipeline `content-studio/` |
| **Editado video largo** | **DaVinci Resolve** (gratis) o **CapCut** (mobile) | Gratis | Profesional, sin marca de agua |
| **Ilustracion editorial premium** | **Recraft V3** o **Adobe Firefly** | $10-22/mes | Para hero landing + investor kit cover |
| **Sticker design** | **Claude** + Figma export | Solo Claude | Output SVG escalable |
| **Press release / copy** | **Claude Web** | Pro suscripcion | Ya genera copy chileno bien |
| **Email HTML templates** | **Claude Web + MJML** | Solo Claude + framework MJML gratis | MJML = HTML email-safe automatico |

**Stack minimo recomendado:** Claude Web Pro ($20/mes) + Midjourney Basic ($10/mes) + Shots.so (gratis) + content-studio existente. **Total $30/mes** para cubrir 90% del backlog.

**Si Pedro quiere reducir aun mas:** Claude Web Pro solo ($20/mes) + content-studio + Shots.so. Para fotos lifestyle se usa propias del founder + licenciadas Unsplash. **Total $20/mes**.

---

## 14. Mantenimiento

- **Cada asset nuevo:** debe pasar por taxonomia §9.1 + naming §9.2.
- **Cada PR que agrega asset:** actualiza CHANGELOG + README de la familia.
- **Numeros canonicos §8 cambian:** actualizar TODOS los pitches en el mismo commit.
- **Frecuencia revision:** cada release importante (cada 30-60 dias).
- **Auditoria trimestral:** snapshot visual + revision cross-surface.

---

## 15. Companion docs

| Doc | Para que |
|---|---|
| [ASSETS_GENERATION_PLAN.md](ASSETS_GENERATION_PLAN.md) | Master ejecutable: prompts ready-to-paste por asset |
| [pitch-inversionistas/README.md](../pitch-inversionistas/README.md) | Indice de los 11 decks B2B |
| [paw-friend-assets-v2/](../paw-friend-assets-v2/) | Brand kit fisico (logos + iconos + categorias) |
| [paw-friend-assets/IDS/](../paw-friend-assets/IDS/) | Carnet frente/reverso + Paw Passport |
| [PAW_SHIELD_DATA_ARCHIVE.md](PAW_SHIELD_DATA_ARCHIVE.md) | Spec para guardar imagenes Paw Shield para training propio |

---

## 16. Quick reference: cuando hago que cosa

| Si tengo que... | Voy a... |
|---|---|
| Hacer un nuevo pitch B2B | Leer §4 (paleta dialecto) + duplicar PITCH_PHARMA.html + ajustar |
| Crear un icono | §6 + prompts en ASSETS_GENERATION_PLAN.md §3 |
| Subir a stores (iOS/Android) | §10 + ASSETS_GENERATION_PLAN.md §5 (store listings) |
| Lanzar campana social | §10 + ASSETS_GENERATION_PLAN.md §6 (templates por canal) |
| Mandar press release | §1.3 + Press kit en §12 (P) |
| Onboardear un Paw Voice | Q. Creator/voices set + Reglas de uso §1.3 |
| Cambiar un numero | §8 + actualizar TODOS los pitches en el mismo commit |
| Reemplazar un asset | Mover al `_archive/` con fecha + crear nuevo con mismo path/nombre |

---

*Fin del Brand System 2026 consolidado. Para ejecutar la creacion de assets, ir a [ASSETS_GENERATION_PLAN.md](ASSETS_GENERATION_PLAN.md).*
