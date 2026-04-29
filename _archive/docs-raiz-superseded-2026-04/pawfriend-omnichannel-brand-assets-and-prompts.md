# Paw Friend — Omnichannel Brand Assets & Prompts (SUPERSEDED)

> ⚠️ **SUPERSEDED 2026-04-29.** Consolidado en:
> - [docs-raiz/BRAND_SYSTEM_2026.md](../../docs-raiz/BRAND_SYSTEM_2026.md) (Brand System unificado app + 11 pitches)
> - [docs-raiz/ASSETS_GENERATION_PLAN.md](../../docs-raiz/ASSETS_GENERATION_PLAN.md) (master ejecutable de prompts por asset + IA recomendada)
>
> Se mantiene aqui como referencia historica.
>
> **Estado:** Guía maestra del asset system omnicanal.
> **Versión:** 2026-04-19.
> **Dueño:** Paw Founder.
> **Complemento de:** `docs-raiz/pawfriend-rebrand-rollout-masterplan.md`.
> **Propósito:** Catálogo ejecutable de todos los assets que Paw Friend debe tener para operar coherentemente en web, mobile, social, press, partner y investor channels — incluyendo los prompts Claude-ready para producirlos.
>
> Este documento NO produce los assets. Define **qué** crear, **cómo**, **para qué canal** y **en qué orden**. La producción se hace en lotes posteriores usando los prompts de §11.

---

## 1. Resumen ejecutivo

### Propósito del sistema de assets

Paw Friend 2.0 vive hoy en 8 superficies visibles (web, iOS, Android, landing, pitch, admin, provider, email) y necesita expandirse a 6 más (IG, FB, WhatsApp, TikTok, YouTube, press/partner/investor kits).

Sin un asset system omnicanal documentado, cada nueva aparición pública improvisa: un banner desalineado en Instagram, un logo mal escalado en un partner kit, un thumbnail de YouTube que no es reconocible como Paw Friend.

Este documento define la taxonomía, los formatos, los naming, los canales y los prompts reproducibles para que cualquier asset futuro se genere con consistencia automática.

### Por qué es crítico para el rebrand

- **Sin asset system, el rebrand 2.0 se queda en producto.** La marca vive 80% fuera del producto: redes, prensa, eventos, partnerships.
- **Sin prompts reproducibles, cada nueva pieza depende de memoria del fundador.** Con prompts, cualquier creador o agencia puede generar algo consistente.
- **Sin kits por canal, la distribución via Voices depende de creadores improvisando.** Con kits, los creadores reciben plantillas y solo rellenan.

### Cómo soportará crecimiento multicanal

- **Taxonomía unificada** (§3): sabes qué set buscar para cualquier caso.
- **Reglas por plataforma** (§10): IG ≠ TikTok ≠ WhatsApp, pero todos heredan del brand core.
- **Prompt library** (§11): producción de assets nuevos con consistencia garantizada.
- **Naming + organización** (§12): un asset se encuentra en < 30 segundos sin preguntar.

---

## 2. Por qué Paw Friend necesita una librería omnicanal

1. **Distribución via Voices** escala 10× si los creadores reciben templates vs tener que diseñar.
2. **Partnerships** cierran más rápido cuando el partner recibe un kit listo (badge, carta, barter card, banner).
3. **Investor meetings** pesan más con un data room visual coherente que con 3 PDFs genéricos.
4. **App Store optimization** requiere assets específicos por formato — sin plantilla, cada release se improvisa.
5. **PR y prensa** necesitan press kit profesional en < 1 hora, no 3 días.
6. **Eventos y conferencias** (CORFO demo day, Start-Up Chile, LatAm pitch events) requieren roll-ups, backdrops, laptop screens, lanyards.
7. **Viralidad social** depende de formatos nativos por plataforma — un post de IG no funciona en TikTok.
8. **Continuidad de marca** cuando haya un equipo: cada nuevo miembro encuentra el sistema, no adivina.

---

## 3. Taxonomía general del asset system

Assets de Paw Friend se organizan en **14 familias**, cada una con sub-carpetas por plataforma/formato.

```
brand/
├── logo-system/              # Todas las variantes del logo
├── app-icon-system/          # iOS, Android, adaptive, favicons
├── favicon-system/           # 16/32/48/96 + safari tab + manifest
├── typography/               # Fonts + specimens + fallback
├── icon-library/             # 30 brand SVG + 10 nuevos + lucide proxy
├── illustration-system/      # Mascotas, dueños, vets, partners, comunidad
├── photography/              # Imagery real (fotos licenciadas + mocks)
├── mockup-system/            # Device/dashboard/promo mockups
│
product-ui/                   # Assets dentro de la app
├── in-app-icons/             # Iconos especializados (health states, roles)
├── empty-states/             # Ilustraciones para vacíos
├── badges-seals/             # Paw Member, Paw Voice, Paw Company, Vet Verified
├── banners/                  # Paw Labs, upgrade nudge, promo, sponsored
│
marketing/                    # Para campaign + landing + social
├── social-templates/         # IG, FB, TikTok, YouTube, WhatsApp
├── promotional-banners/      # Campaign-specific
├── email-templates/          # Newsletter, outreach, transactional
│
presentations/                # Pitch + outreach
├── pitch-templates/          # Slide-types, covers, dividers
├── partnership-kit/          # Para Paw Companys + Partners
├── investor-kit/             # Deck cover, sample dashboard, data room
├── media-press-kit/          # Logo pack, founder photo, one-pager
├── creator-voices-kit/       # Badge SVG, código promo card, reel cover
├── onboarding-product-kit/   # Screenshots con frame, walkthrough
│
operations/                   # Internal + legal
├── document-templates/       # Letterhead, invoice, NDA, contracts
├── store-listings/           # Play Store + App Store assets
├── event-conference-kit/     # Roll-up, backdrop, lanyard, swag
```

---

## 4. Logo system completo

### 4.1. Inventario actual

| Variante | Archivo | Uso | Estado |
|---|---|---|---|
| Principal (púrpura sobre transparente) | `paw_friend_icon_principal.svg` | Default, light bg | ✓ existe |
| Reverse (blanco) | `paw_friend_icon_reverse.svg` | Dark bg, covers | ✓ existe |
| Dark (variante oscura) | `paw_friend_icon_dark.svg` | Dark mode specifics | ✓ existe |
| Mono (monocromo) | `paw_friend_icon_mono.svg` | Print, fax, un solo color | ✓ existe |
| Wordmark horizontal | `paw_friend_wordmark_horizontal.svg` | Headers, firmas | ✓ existe |

### 4.2. Variantes a crear (P1)

| Variante | Archivo sugerido | Uso |
|---|---|---|
| Isotipo cuadrado simplificado | `paw_friend_mark_square.svg` | App icon, favicons |
| Wordmark vertical (stacked) | `paw_friend_wordmark_vertical.svg` | Posters, eventos |
| Logo con tagline | `paw_friend_lockup_tagline.svg` | "La ficha médica de tu mascota" |
| Logo gold (celebración) | `paw_friend_icon_gold.svg` | Hero moments, Paw Member |
| Logo sticker (outline) | `paw_friend_sticker.svg` | Impresión, swag, stickers físicos |

### 4.3. Derivados

- Favicon (`favicon-16/32/48/96/.ico/.svg`) — ya existe.
- Apple touch icon 180×180 — ya existe.
- Android chrome 192×192, 512×512 — ya existe.
- PWA maskable 512×512 — ya existe.
- Manifest JSON — ya existe.

### 4.4. Usos correctos

- **Sobre fondo blanco/claro:** principal.
- **Sobre fondo púrpura/oscuro:** reverse.
- **Contexto celebración/premium:** gold variant (crear).
- **Print/B&W:** mono.
- **Header de app:** wordmark horizontal + icon, o solo icon.
- **Favicon:** isotipo cuadrado simplificado.

### 4.5. Usos incorrectos (evitar)

- Estirar horizontalmente o verticalmente.
- Cambiar colores del isotipo manualmente (usar variante correcta).
- Sombras o glows ad-hoc (ya tiene su propia presencia).
- Meterlo dentro de cajas redondeadas cuando ya tiene squircle.
- Combinar con otra mascota que no sea la pata Paw Friend.

### 4.6. Tamaños mínimos

- **Digital:** 24×24 para isotipo, 80×20 para wordmark.
- **Print:** 10mm para isotipo, 40mm × 10mm para wordmark.
- **App icon:** 512×512 master, Apple/Play Store reciben down-sampled por guidelines.

### 4.7. Safe area

- Alrededor del logo: mínimo `0.5 × altura del isotipo` libre (no texto, no gráficos, no borde).
- Alrededor del wordmark: mínimo `0.25 × altura del wordmark`.

---

## 5. Tipografía de marca

### 5.1. Stack oficial

```
Display  Fredoka                weight 500, 600, 700
Body     Plus Jakarta Sans      weight 400, 500, 600, 700, 800
Mono     JetBrains Mono         weight 500, 700
Emoji    Apple Color Emoji / Segoe UI Emoji / Noto Color Emoji   (solo gamification)
```

### 5.2. Uso por canal

| Canal | Display | Body | Fallback |
|---|---|---|---|
| Web/product | Fredoka (H1 principal) | Jakarta Sans | system-ui |
| Landing | Fredoka (hero + section H1) | Jakarta Sans | system-ui |
| Pitch HTML | Fredoka (cover + eyebrow) | Jakarta Sans | system-ui |
| iOS native UI | system SF Rounded | SF Pro | — |
| Android native UI | Roboto Slab alt | Roboto | — |
| Instagram/FB posts | Fredoka (headline) | Jakarta (body) | Arial |
| TikTok overlays | Fredoka bold (sticker style) | Jakarta bold | — |
| YouTube thumbs | Fredoka 800 outline | Jakarta 800 | Arial |
| WhatsApp Business catalog | Jakarta | — | Arial |
| Email HTML | Arial/Helvetica (email-safe) | Arial/Helvetica | Georgia |
| Print media | Fredoka (titular) | Jakarta (cuerpo) | Helvetica |

### 5.3. Fallback rules

- Web: `'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif`
- Mobile nativo iOS: `SF Rounded` como approx de Fredoka.
- Mobile nativo Android: `Roboto Slab` o sistema.
- Email: Arial/Helvetica siempre (no web fonts reliable).

### 5.4. Export considerations

- **Embed fonts** en PDFs de press kit + investor kit.
- **Subset latin** cuando sea posible (reduce peso web ~60%).
- **Variable fonts** si disponible (Fredoka variable existe, Jakarta Sans también).
- **Social images** con texto → rasterizar (PNG/JPG) para evitar render inconsistente.

---

## 6. Librería de iconos

### 6.1. Estilo visual brand SVG

- **Squircle container** viewBox 200×200, rx 40 (alineado al app icon).
- **Color fondo**: brand hue (`#9333ea` default, variantes per-icon para semántica: rosa/esmeralda/dorado).
- **Contenido**: blanco (`#fff`), flat, sin sombras.
- **Estilo**: geometrías simples, bordes redondeados 6-12px, stroke-linecap="round" cuando hay líneas.
- **Peso**: sin fills internos de gradient (mantener plano).
- **Sin texto** embebido: el texto lo pone el HTML consumidor.

### 6.2. Estilo visual lineart (inline pitch/deck)

- ViewBox 24×24.
- Solo stroke (`currentColor`), no fills.
- stroke-width 1.8.
- stroke-linecap="round", stroke-linejoin="round".
- Geometría minimalista, reconocible a 16px.

### 6.3. Line weight

- Lineart inline: 1.5 (dense / small) o 1.8 (default) o 2 (hero).
- Brand squircle: N/A (color fill).

### 6.4. Geometría

- Prefiero formas orgánicas a angulares (Paw Friend es cálido).
- Curvas suaves antes que ángulos rectos.
- Balance simétrico sin obsesión (asimetría OK si da vida).

### 6.5. Categorías necesarias

| Categoría | Ejemplos existentes | Faltantes |
|---|---|---|
| **Salud** | 07_pulse, 08_syringe, 09_pill, 10_stethoscope, 11_thermometer, 12_first_aid, 13_medical_cross, 14_clinical_record | `33_ai_brain.svg` (IA vet) |
| **Mascotas** | 01_paw_print, 02_dog_face, 03_cat_face, 04_heart_paw, 05_bone, 06_pet_house, 11_pet_beloved | `41_rabbit.svg`, `42_bird.svg` (otras especies) |
| **Actividad** | 15_calendar, 16_clock, 18_tasks, 27_rocket | — |
| **Comunicación** | 20_chat, 21_notification | `43_qr_scan.svg`, `44_mic_podcast.svg` |
| **Navegación/localización** | 22_search, 23_cloud | `34_map_pin_paw.svg`, `45_compass_paw.svg` |
| **Comercial** | 24_partnership, 25_growth, 26_clinic | `36_handshake_paws.svg`, `37_invoice.svg` |
| **Reconocimiento** | 17_checkmark, 30_star, 29_target, 28_idea | `39_badge_member.svg`, `46_trophy_paw.svg` |
| **Mobile/PWA** | 19_mobile_app | `47_app_store.svg`, `48_play_store.svg` |
| **Donaciones/CSR** | — | `31_donation.svg`, `38_shelter.svg`, `49_trazability.svg` |
| **Privacidad/seguridad** | — | `32_shield_data.svg`, `50_lock_open.svg` |
| **PDF/docs** | — | `35_pdf_record.svg`, `51_zip_docs.svg` |

### 6.6. Iconos core del producto (lucide — ya usados)

Ver `src/lib/icons.ts` para lista completa (~200 íconos). No se cambia — se mantiene como capa de producto.

### 6.7. Reglas de naming

```
NN_descriptive_name.svg    NN = número secuencial de creación
                          (no es prioridad, es orden cronológico)

Ejemplos:
  14_clinical_record.svg   (ficha)
  31_donation.svg          (nuevo, siguiente libre)
  audience_investors.svg   (paletas por audiencia)
  mark_square.svg          (variantes brand)
```

### 6.8. Consistencia cross-platform

- **Web**: SVG inline o `<img src>` — nativo.
- **iOS**: export a PNG @1x @2x @3x para `UIImage` (o SF Symbols si aplica).
- **Android**: SVG vector drawable o PNG per-density (`mdpi/hdpi/xhdpi/xxhdpi`).
- **Print**: PDF vectorial con fonts embed.

---

## 7. Sistema de imagen e ilustración

### 7.1. Talento a representar

| Segmento | Representación |
|---|---|
| **Mascotas** | Perros y gatos chilenos (no solo razas premium; quiltros, mestizos incluidos). |
| **Dueños (tutores)** | Diversidad chilena realista: edades 25-65, varios tonos de piel, urbano + semi-urbano. |
| **Veterinarios** | Uniformados realistas (scrubs), edad 30-60, con estetoscopio o en escena de consulta. |
| **Partners (tiendas, restaurantes)** | Interior de negocio chileno, mascota presente. |
| **Comunidad** | Refugio, parque, encuentros, voluntariado. |
| **Lifestyle** | Paseo urbano, hogar cálido, vet de barrio, no clínicas corporate. |
| **Escenarios de producto** | Smartphone con la app abierta sobre mesa/escritorio/parque. |

### 7.2. Estilo fotográfico

- **Iluminación**: natural, warm, no flash duro.
- **Paleta**: warm + saturación media, nunca sobre-procesada.
- **Composición**: regla de tercios, espacio negativo usable para copy.
- **Momento**: acción cotidiana (no pose corporate).
- **Mascota primaria**: siempre presente o claramente contextualizada.

### 7.3. Estilo ilustrativo

- **Flat modern con microdetalles**: geometrías simples + 1-2 detalles cálidos (puntitos, líneas curvas suaves).
- **Paleta**: brand + gold + rose + emerald según contexto.
- **No**: hiperrealismo, no 3D cartoon, no anime, no Material Design puro.
- **Sí**: estilo Paw Friend — cálido, premium, reconocible.

### 7.4. Cuándo usar foto / mockup / screenshot / illustration / icon

| Situación | Asset |
|---|---|
| Landing hero | Foto lifestyle real + mockup dispositivo |
| Feature showcase | Screenshot producto + frame device |
| Testimonial | Foto real de la persona (con permiso) |
| Empty state | Illustration brand flat |
| Feature pitch | Mockup + illustration |
| Pitch cover deck | Illustration hero / mark brand |
| Press article | Foto real con créditos |
| Social post regular | Illustration + copy |
| Social post storytelling | Foto real + overlay |
| Ad banner | Mockup dispositivo + benefit headline |

### 7.5. Fuentes de imagen

- **Propias**: fotos del founder + mascotas reales (Kai, Ema) — priorizar.
- **Licenciadas**: Unsplash/Pexels (Creative Commons con crédito), siempre verificar licencia comercial.
- **Generadas con IA**: OK para ilustración flat brand-aligned; NO para "fotos realistas" que simulen testimoniales.
- **Partner-provided**: cuando un partner/vet acepta compartir material suyo.

---

## 8. Mockup system

### 8.1. Device mockups

- **iPhone 15 Pro** en púrpura/negro, con screenshot real de la app.
- **iPad Pro** en silver, landscape + portrait.
- **Android phone** (Pixel 8) en light.
- **MacBook Pro** para pantalla grande.
- **Multi-device scene**: iPhone + laptop + tablet juntos.

### 8.2. App mockups

- **Home dashboard** con Kai como mascota hero.
- **Ficha clínica** con timeline, vacunas al día (estado good).
- **Calendario** con próxima cita visible.
- **Directorio vets** con mapa + lista + filtros.
- **PDF preview** de ficha médica.
- **Paw Card coleccionable** con holo.
- **Feed social** con posts orgánicos.

### 8.3. Dashboard mockups

- **Sample report Paw Companys** (ya existe, `/pitch/sample-dashboard.html`).
- **Admin panel overview** — KPIs + feed + finance tiles.
- **Provider dashboard** — pacientes + agenda + ingresos.
- **Sala de inversión** — pulso diario + metas + alerts.

### 8.4. Promo visuals

- **Paw Member card** animada (holo/gold/gradient).
- **Paw Voice badge** (sticker/shareable).
- **Paw Company logo mount** (cómo se ve en /donaciones grid).
- **Paw Partner barter card** (tu descuento ↔ nuestra visibilidad).

### 8.5. Partner visuals

- **Barter infographic** (qué recibes / qué das).
- **Badge mockup** en el escaparate/menú del partner.
- **Tile mockup** en el grid público.

### 8.6. Investor visuals

- **Deck cover hero** (Paw Friend × fondo).
- **Sample dashboard** (ya live).
- **Tracción chart mockup** (MRR + usuarios + Paw Members).
- **15× leverage graphic** (persona + IA vs equipo tradicional).
- **Mapa LatAm expansion** (Chile → Perú → Colombia → México).

### 8.7. Product hero visuals

- **Hero landing**: iPhone con Home de la app + peludo real + cielo warm.
- **Hero Donaciones**: mural de voces + gradient rose/gold.
- **Hero Pitch**: Paw Friend mark flotando + gradiente cinematográfico.

### 8.8. Before/after

- **Antes**: carnet vacunas papel en guantera + WhatsApp caótico.
- **Después**: Paw Friend ficha PDF + recordatorios sincronizados.

### 8.9. Feature showcase

- **Escaneo OCR carnet**: cámara → extrae vacunas → ficha actualizada.
- **Compartir ficha**: link QR → vet abre → historial completo.
- **Reserva online**: disponibilidad → confirm → Google Calendar.

---

## 9. Asset sets omnicanal recomendados

23 kits que Paw Friend debe tener, cada uno con piezas definidas y prioridad.

### A. Core brand set

**Objetivo:** Identidad base reutilizable en cualquier pieza.
**Piezas:**
- Logo system completo (5 variantes) — ✓ parcialmente existe
- Wordmark horizontal + vertical
- Color palette cheatsheet (PDF)
- Type specimen Fredoka + Jakarta
- Brand principles 1-pager
**Prioridad:** P0.
**Owner:** Founder.
**Uso:** Referencia interna, onboarding agencias futuras.

### B. Product app set

**Objetivo:** Screenshots + frames listos para usar en cualquier surface.
**Piezas:**
- 10 screenshots principales de la app (Home, Ficha PDF, Calendario, Feed, Maps, Directorio, Paw Card, Admin, Provider, Onboarding).
- Frame device mockups (iPhone 15 Pro, iPad, Pixel 8, MacBook).
- Empty state illustrations (6 escenarios).
- Badges: Paw Member gold / Paw Voice rose / Paw Company purple / Vet Verified emerald.
**Prioridad:** P0.
**Owner:** Founder.
**Uso:** Pitches, landing, redes.

### C. Landing/marketing set

**Objetivo:** Landing v3 + campañas.
**Piezas:**
- Hero photography (iPhone + peludo + cielo warm).
- 4 pilares illustration (salud, comunidad, emergencias, memoria).
- 6 caminos community icon.
- 1 OG image por rol (inversor, dueño, vet, creator, empresa).
**Prioridad:** P1.
**Owner:** Founder.
**Uso:** Landing + preview social.

### D. Social launch set

**Objetivo:** Anuncio oficial del lanzamiento (Semana 1 de mayo).
**Piezas:**
- Teaser reel 15-30s (Instagram, TikTok, YouTube Shorts).
- Post carousel 10 slides (qué es Paw Friend, por qué, features).
- Story template daily con Kai/Ema como mascotas.
- WhatsApp Business catalog 5 tarjetas (ficha, directorio, donaciones, member, companys).
**Prioridad:** P0.
**Owner:** Founder + Creator voluntario.
**Uso:** Día 1 de mayo 2026 launch.

### E. Instagram set

**Objetivo:** Presencia continua IG.
**Piezas:**
- Feed template square 1080×1080 (6 variantes: feature, testimonial, tip, paw labs, data, behind-the-scenes).
- Story template 1080×1920 (portrait, with zonas safe).
- Reel cover template 1080×1920 (3 layouts).
- Carousel 10 slides template.
- Highlights covers 3 (Salud, Comunidad, Tras bambalinas).
- Bio + link-in-bio landing.
**Prioridad:** P1.
**Uso:** Presencia continua.

### F. Facebook set

**Objetivo:** Paridad FB con IG.
**Piezas:**
- Cover 1640×664.
- Post square 1200×1200.
- Event cover 1920×1005.
- Story vertical (comparte nativo).
**Prioridad:** P2.
**Uso:** Audiencia FB +45, grupos pet.

### G. WhatsApp Business set

**Objetivo:** Canal oficial via WhatsApp.
**Piezas:**
- Business profile picture 640×640.
- Status visual templates 1080×1920 (4 variantes semanales).
- Catalog product cards 1:1 (Paw Member, Paw Voice, Paw Company, Ficha PDF, Directorio).
- Broadcast message card landscape 1200×628.
- Auto-reply message copy (founder-authored, emocional).
**Prioridad:** P1.
**Uso:** Outreach directo + broadcast community.

### H. TikTok set

**Objetivo:** Formato vertical nativo de crecimiento.
**Piezas:**
- Cover vertical 1080×1920 (3 estilos: caption hook, sticker overlay, mascot POV).
- Caption-safe zones illustration (top 200px + bottom 300px libres).
- End-card 3 segundos cierre con CTA pawfriend.cl.
**Prioridad:** P1.
**Uso:** Paw Voices distribution, crecimiento gen-Z.

### I. YouTube set

**Objetivo:** Presencia YouTube (tutoriales, testimoniales, features).
**Piezas:**
- Thumbnail template 1280×720 (3 layouts).
- Channel banner 2560×1440 (safe area 1546×423).
- End screen 16:9.
- Lower third overlay PNG transparent.
- Watermark branding corner.
**Prioridad:** P2.
**Uso:** Long-form content, tutoriales técnicos.

### J. Desktop/web set

**Objetivo:** Landing + pitch + producto.
**Piezas:**
- Favicon family (ya existe).
- OG image 1200×630 (1 por surface importante: home, ficha, donaciones, paw-core).
- Hero illustrations landing (ya existe v3).
**Prioridad:** P0 (casi completo).

### K. iOS set

**Objetivo:** App Store + in-app.
**Piezas:**
- App icon 1024×1024 master (existe).
- Adaptive icon iOS 17 (masked + rounded).
- Splash screens per device size.
- App Store screenshots 6.5" + 5.5" (6 slides).
- App Store preview video 15-30s.
- Promotional text + description + keywords.
**Prioridad:** P0.
**Uso:** Launch iOS (pendiente Apple Dev account).

### L. Android set

**Objetivo:** Play Store + in-app.
**Piezas:**
- Adaptive icon 432×432 foreground + background layers.
- Feature graphic 1024×500.
- Screenshots 1080×1920 (8 slides).
- Play Store promo video.
- Short description + full description.
**Prioridad:** P0.
**Uso:** Launch Android (pendiente Play Console).

### M. App Store / Play Store listing set

**Objetivo:** ASO optimization.
**Piezas:**
- Screenshot templates con copy overlay ("La ficha médica que siempre llevas contigo").
- A/B variants (2-3) para testing.
- Localized copy ES-CL + ES-AR + ES-MX (futuro).
**Prioridad:** P1 (post-launch).
**Uso:** Conversion optimization en stores.

### N. Partnership outreach set

**Objetivo:** Cerrar Paw Partners (tiendas, seguros, restaurantes).
**Piezas:**
- One-pager partnership PDF (2 páginas: qué ofrecemos / qué pedimos / ejemplos).
- Barter card visual (ilustración del intercambio).
- Email template outreach partner (copy + banner 600×200).
- WhatsApp message template.
- Slack-ready Paw Partner badge SVG.
**Prioridad:** P1.
**Uso:** Outreach semanal.

### O. Investor outreach set

**Objetivo:** Cerrar ronda pre-seed.
**Piezas:**
- Deck (ya existe — `/pitch/inversionistas.html`).
- Sample dashboard (ya existe).
- Data room index + carpeta con docs (financials, tech stack, milestones).
- Founder photo pro.
- 1-pager executive summary PDF.
- Intro email template CORFO / Start-Up Chile / angels.
**Prioridad:** P0.
**Uso:** Ronda abril-junio 2026.

### P. Press/media set

**Objetivo:** Cobertura periodística.
**Piezas:**
- Press kit ZIP (logos pack + founder photos + product screenshots + 1-pager).
- Fact sheet 1-pager (RUT, fundador, fecha, stack, URL, contacto).
- Quotes bank (5 frases listas para usar, founder-authored).
- Press release template (para lanzamiento + milestones).
**Prioridad:** P2.
**Uso:** Cuando haya hook periodístico.

### Q. Creator / voices set

**Objetivo:** Armar a los Paw Voices para amplificar.
**Piezas:**
- Paw Voice badge SVG (gold/rose) para perfil.
- Código promo card template (para compartir con audiencia).
- Reel template 3 variantes (review, tip, testimonial).
- Bio copy sugerida ("Paw Voice oficial @pawfriend_cl").
- Lineamientos tonales ("tuteo chileno", "sin guiones", "honesto").
**Prioridad:** P1.
**Uso:** Onboarding de nuevos voices.

### R. Event/conference kit

**Objetivo:** CORFO demo day, Start-Up Chile, LatAm pitch events.
**Piezas:**
- Roll-up 85×200cm pulverizable.
- Backdrop modular 2×2m / 3×2m.
- Lanyard design.
- Nametag template.
- Laptop stickers branded.
- Tote bag design (swag).
- Business card founder.
**Prioridad:** P2.
**Uso:** Eventos físicos selectivos.

### S. Documentation/help center kit

**Objetivo:** Eventual help center para usuarios.
**Piezas:**
- Article template header 1200×300.
- Category illustration set (6 categorías: ficha, donaciones, vets, social, billing, privacidad).
- FAQ layout con brand CSS.
**Prioridad:** P2.
**Uso:** Cuando el volumen de soporte lo pida.

### T. Onboarding/in-product kit

**Objetivo:** First-time experience + walkthroughs.
**Piezas:**
- 5 ilustraciones de welcome (bienvenida, agregar mascota, primera ficha, vet directory, paw member opcional).
- Empty state ilustraciones contextuales (mapa vacío, feed vacío, sin mascotas, sin recordatorios).
- Tooltip/callout templates.
**Prioridad:** P1.
**Uso:** First run + dead-ends conversions.

### U. Premium/subscription kit

**Objetivo:** Paw Member activation.
**Piezas:**
- Paw Member badge animated SVG (gold glow).
- Paw Member welcome email HTML.
- Paw Member card holo (tipo Paw Card) mockup.
- Paw Member portal header art.
- Upgrade nudge banner variants (3 tonos).
**Prioridad:** P1.
**Uso:** Conversión voluntaria.

### V. Referral/campaign kit

**Objetivo:** Crecimiento orgánico referido.
**Piezas:**
- Share card social (OG dynamic con username).
- Código promo card shareable.
- Achievement unlock illustration (cuando tu amigo se registra).
- Campaign landing page template.
**Prioridad:** P2.
**Uso:** Campañas de crecimiento Fase 3.

### W. Vet / partner vertical kits

**Objetivo:** Kits específicos por vertical.
**Piezas vet:**
- "Pack vet onboarding" (guía PDF + screenshots provider + testimonial Sofia).
- Banner vet directory 1200×400.
- Badge Vet Verified SVG.
**Piezas partner:**
- Por vertical: tienda, alimento, seguros, restaurante — cada uno con caso de uso específico.
**Prioridad:** P1 (vets), P2 (partners per vertical).

---

## 10. Requisitos por plataforma

### 10.1. Instagram

**Tipos de assets necesarios:**
- Feed post (1080×1080 o 1080×1350 portrait).
- Story (1080×1920 + safe zones top 220px / bottom 250px).
- Reel cover (1080×1920).
- Carousel (1080×1080 × 10 slides).
- Highlights covers (1080×1080).

**Formatos recomendados:**
- PNG (quality) o JPG (weight-optimized).
- Video MP4 H.264, max 4GB.

**Tono visual esperado:**
- Warm + premium + peludo protagonista.
- Copy short, emoji-light (uno máximo).
- Consistency: mismo filter/palette cross-posts.

**Adaptación del branding:**
- Logo isotipo en corner + wordmark en stories.
- Paleta brand + gold para accents.
- Fredoka para hooks, Jakarta para detail.

**Riesgos comunes:**
- Texto en zonas no-safe en stories.
- Contraste bajo con fondos gradient.
- Logo pequeño en thumbs.

**Assets obligatorios:**
- 10 posts template.
- 5 stories template.
- 3 reel covers.

### 10.2. Facebook

**Tipos:**
- Cover 1640×664.
- Post 1200×1200.
- Event 1920×1005.
- Video 16:9.

**Formatos:** JPG + MP4 H.264.

**Tono:** más informativo, audiencia 35-55. Copy longer OK.

**Adaptación:** reusar templates IG con ajuste aspect-ratio.

**Obligatorios:** cover + 5 posts + 1 event banner.

### 10.3. WhatsApp Business

**Tipos:**
- Profile pic 640×640.
- Status 1080×1920.
- Catalog product 1:1 (1080×1080).
- Broadcast link preview 1200×628.

**Formatos:** JPG/PNG + video MP4 max 30s para Status.

**Tono:** directo, tuteo, emocional pero breve.

**Adaptación:** marca visible + CTA claro (link pawfriend.cl).

**Obligatorios:** profile + 5 catalog + 4 status templates.

### 10.4. TikTok

**Tipos:**
- Video vertical 1080×1920.
- Cover 1080×1920.
- Profile 200×200.

**Formatos:** MP4 H.264, 3-60s+.

**Tono:** auténtico, POV real (Kai/Ema), hook en primer 2s.

**Adaptación:** logo subtle (watermark corner), branding ligero, copy overlay con Fredoka bold.

**Riesgos:** texto tapado por UI TikTok (hashtags, username, comments).

**Obligatorios:** cover template + end-card + 1 watermark layer PNG.

### 10.5. YouTube

**Tipos:**
- Thumbnail 1280×720.
- Channel banner 2560×1440 (safe 1546×423).
- Channel avatar 800×800.
- End screen 1920×1080.

**Formatos:** JPG/PNG + MP4.

**Tono:** informativo, tutorial-friendly o testimonial largo.

**Adaptación:** thumb con text OK pero máximo 6 palabras. Contrast alto.

**Obligatorios:** thumb template + banner + end screen.

### 10.6. Web/desktop

**Tipos:** hero landing, OG images, favicon family, in-app screenshots.

**Formatos:** SVG nativo + JPG lossy + PNG para UI + WebP para imagery.

**Tono:** alineado al producto.

**Adaptación:** ya cubierto por el producto React.

**Obligatorios:** OG 1200×630 × 5 surfaces importantes.

### 10.7. iOS

**Tipos:**
- App icon 1024×1024 master + export per-density.
- Splash screen per device size.
- App Store screenshots 6.5" (1242×2688) × 6 slides.
- App Store screenshots 5.5" (1242×2208) × 6 slides.
- App preview video 15-30s.

**Formatos:** PNG + MOV 30fps.

**Tono:** premium, iOS-native feel.

**Adaptación:** squircle radius matching iOS 17. Backdrop blur-friendly.

**Obligatorios:** completar App Store package.

### 10.8. Android

**Tipos:**
- Adaptive icon 432×432 foreground + background.
- Feature graphic 1024×500.
- Screenshots 1080×1920 × 8 slides.
- Promo video.

**Formatos:** PNG + WebP + MP4.

**Tono:** Material-friendly pero brand-first.

**Adaptación:** foreground con safe zone 264×264 (centro).

**Obligatorios:** completar Play Store package.

---

## 11. Prompts base para generación de assets

Todos los prompts asumen el contexto general. El "prompt base" se pega primero, luego cada prompt específico.

### 11.0. Prompt base de contexto (pegar al inicio de cada conversación)

```
Estoy diseñando assets para Paw Friend, una app chilena que es una
ficha médica digital + directorio de veterinarios + comunidad pet,
100% gratis para dueños. Proyecto hecho por una persona en Chile con
apoyo de IA. Alma: amor por los peludos + seriedad técnica + home-made
chileno + modelo sostenible por comunidad.

Paleta oficial del brand 2.0:
- Primary: #9333ea (brand purple)
- Primary deep: #581c87
- Accent: #eab308 (gold)
- Accent deep: #a16207
- Success/partners: #10b981 (emerald)
- Voices/rose: #ec4899
- Sky/info: #0ea5e9
- Ink body: hsl(270 15% 10%)
- Paper bg: hsl(270 20% 98%)

Tipografía oficial:
- Display: Fredoka (500/600/700)
- Body: Plus Jakarta Sans (400/500/600/700/800)
- Mono (para valores numéricos): JetBrains Mono

Estilo visual:
- Flat modern con microdetalles warm.
- Squircle como geometría brand (viewBox 200×200 rx 40).
- No: hiperrealismo, no Material puro, no corporate frío, no emoji
  decorativo.
- Sí: geometrías simples, bordes redondeados, paleta brand 2.0
  disciplinada.

Reglas técnicas de entrega SVG:
- Vectorial limpio, sin raster embedded.
- <title> + role="img" + aria-label.
- viewBox correcto, paths simples.
- stroke-linecap="round" + stroke-linejoin="round" donde aplique.
- Sin texto embedded (el texto lo pone el HTML consumidor).
- Peso objetivo: < 2 KB por SVG.
- Funcionar a 24×24, 96×96, 512×512 sin perder detalle.

Entrega: cada SVG dentro de un bloque ```svg ... ``` precedido por
comentario <!-- filename.svg --> arriba. Sin prosa adicional.
```

### 11.1. Logo variants pendientes

```
[pegar contexto base]

Necesito 5 variantes del logo Paw Friend (además de las existentes).

Para cada una, viewBox 680×680 (alineado al principal):

1. paw_friend_mark_square.svg — isotipo simplificado para app icon,
   squircle iOS 24% radius, mismo concepto que el principal pero
   optimizado para 16×16 favicon (sin detalles que se pierdan).

2. paw_friend_wordmark_vertical.svg — mark arriba + "Paw Friend"
   wordmark centrado abajo, viewBox 400×500.

3. paw_friend_lockup_tagline.svg — wordmark horizontal + tagline
   "La ficha médica de tu mascota" debajo en Jakarta 400, viewBox
   800×200.

4. paw_friend_icon_gold.svg — mismo isotipo principal pero con gold
   gradient (#9333ea → #eab308) en el squircle base. Para momentos
   celebración / Paw Member.

5. paw_friend_sticker.svg — isotipo outline only (no fill), stroke 4,
   para impresión stickers y swag monocroma.
```

### 11.2. 10 SVG del icon library pendientes (prioridad P1)

```
[pegar contexto base]

Necesito 10 íconos SVG brand squircle, viewBox 200×200, rx 40, fondo
color brand (default #9333ea salvo indicación), contenido blanco,
estilo flat modern con microdetalles. Naming y concepto:

1. 31_donation.svg — fondo gold gradient (#9333ea → #eab308), pata
   blanca abrazando corazón blanco, 1 ondita exterior.

2. 32_shield_data.svg — fondo brand purple, escudo blanco con
   candado en el centro, chispa arriba.

3. 33_ai_brain.svg — fondo brand purple, cerebro blanco
   estilizado con circuito minimalista, 1 estrella.

4. 34_map_pin_paw.svg — fondo emerald, pin de mapa blanco con
   huellita dentro del círculo del pin.

5. 35_pdf_record.svg — fondo brand purple, documento blanco con
   esquina doblada, etiqueta "PDF" (solo silueta sin texto),
   líneas de contenido simuladas.

6. 36_handshake_paws.svg — fondo emerald, 2 patas peludas
   estilizadas estrechándose en el centro.

7. 37_invoice.svg — fondo brand purple, recibo blanco con 3 líneas
   de contenido + sello circular en corner.

8. 38_shelter.svg — fondo emerald, casa chueca cálida blanca con
   chimenea + huella en la puerta.

9. 39_badge_member.svg — fondo gold gradient, escudo/medalla blanco
   con pata grabada en el centro + corona 3 puntas arriba.

10. 40_qr_code_paw.svg — fondo brand purple, cuadrado QR estilizado
    blanco con huellita en el centro en vez de logo genérico.
```

### 11.3. App icon iOS 1024×1024

```
[pegar contexto base]

Necesito el app icon principal iOS 1024×1024 PNG-ready (entregar como
SVG con viewBox 1024×1024 que yo exporto a PNG).

Concepto: el isotipo Paw Friend (pata + corazón negative space) sobre
squircle iOS con gradient radial brand:
- centro: #9333ea
- extremos: #581c87
- highlight arriba: rgba(255,255,255,.12)

Sin sombras internas (iOS 17 no las soporta en app icons).
Sin texto embedded.
Isotipo blanco puro #fff ocupando 72% del canvas, centrado.

Debe verse distintivo incluso en tamaño 57×57 (iPhone antiguo).
```

### 11.4. Favicon SVG (animado sutil)

```
[pegar contexto base]

Necesito favicon.svg 32×32 vectorial (el principal ya existe pero
quiero un refresh). Concepto: pata Paw Friend simplificada, background
squircle (rx 4) con gradient #9333ea → #7e22ce. Sin animación (favicons
no soportan animación en browsers fiables).

Debe ser legible a 16×16 también.
```

### 11.5. Hero landing illustration

```
[pegar contexto base]

Necesito una ilustración SVG hero para la landing /, viewBox 800×600,
estilo flat modern warm brand.

Escena: smartphone en diagonal (centro) mostrando un mockup
simplificado de la ficha médica (card de color brand con íconos de
vacunas verdes). A la izquierda del phone, la silueta estilizada de
un perro chileno (mestizo, orejas paradas, pose sentada, sonrisa
sutil). A la derecha, la silueta de un gato tranquilo. Arriba un
gradient radial púrpura-dorado como cielo. Abajo, línea de suelo
simple.

Paleta: brand purple + gold + emerald (para los ticks de vacunas) +
warm white para siluetas mascotas.

Sin texto embedded. Composición centrada. Optimizada para hero 1920
desktop + 750 mobile.
```

### 11.6. Social cards Instagram

```
[pegar contexto base]

Necesito 6 templates SVG 1080×1080 para Instagram feed:

1. "Feature del día" — banner top brand con eyebrow Fredoka, H2 grande
   Fredoka 600, área central para screenshot producto, footer con
   logo wordmark + @pawfriend_cl.

2. "Testimonial" — fondo suave blob púrpura, quote block con tipografía
   Fredoka grande y cite Jakarta 600, área para foto circular de la
   persona (placeholder).

3. "Tip de salud peluda" — layout estilo tarjeta médica, ícono brand
   SVG grande, título Fredoka, 3 bullets Jakarta con tickmarks
   emerald.

4. "Paw Labs beta" — banner beta amarillo/gold top, concepto
   experimental, feature showcase.

5. "Behind the scenes" — fondo oscuro gradient con blob, founder
   quote/fact, mood warm + honesto.

6. "Data point / stat" — número grande Fredoka con gradient
   purple-gold, context 1 línea, brand en corner.

Entrega cada uno con safe zones IG marcadas (avoid top 100 + bottom
100 para que texto no se corte con username/actions).
```

### 11.7. Instagram Stories 1080×1920

```
[pegar contexto base]

Necesito 4 templates SVG 1080×1920 para IG Stories:

1. "Countdown" — cielo gradient purple-gold, Paw Friend mark centrado
   grande, área para sticker countdown IG.

2. "Link in bio" — layout mascota (silueta) + CTA sticker area, copy
   "Descarga tu ficha → link en bio", logo corner.

3. "Quote del día" — quote grande Fredoka centered, cite abajo,
   background blob suave.

4. "Daily tip" — panel lateral con ilustración brand + 3 pasos
   numbered Fredoka.

Safe zones: evitar top 220px (username bar IG) y bottom 250px
(reactions/actions).
```

### 11.8. TikTok vertical cover 1080×1920

```
[pegar contexto base]

Necesito 3 templates SVG 1080×1920 para TikTok covers:

1. "Hook caption" — 3 líneas grandes Fredoka bold con gradient
   purple-gold overlaid en foto placeholder o mockup phone.

2. "Sticker POV" — sticker estilo polaroid del peludo (frame white
   con paw prints), tilted -5°, fondo warm blur.

3. "Mascot spotlight" — silueta mascota grande centered (al modo
   ilustración flat), copy sticker bottom con CTA.

End-card (3s last frame): Paw Friend mark centered + "pawfriend.cl"
+ gold pulse around.
```

### 11.9. YouTube thumbnails 1280×720

```
[pegar contexto base]

Necesito 3 templates SVG 1280×720 para thumbs YouTube:

1. "Tutorial" — split 50/50: izquierda screenshot con zoom feature,
   derecha founder (placeholder face) + text overlay Fredoka bold 800
   con outline dorado. Ejemplo: "Así funciona la ficha PDF".

2. "Testimonial" — fondo warm blur, placeholder para video frame,
   text overlay "Sofía, vet de Santiago", Paw Friend mark corner.

3. "Data / milestone" — número grande Fredoka (+1000 Paw Members),
   context 1 línea, background split brand purple + gold.

Safe: mantener elementos clave fuera de bottom-right (timestamp
YouTube).
```

### 11.10. Partnership banner

```
[pegar contexto base]

Necesito 1 template SVG 1200×400 para banner partnership outreach
(email + WhatsApp):

Lado izquierdo: mark Paw Friend + wordmark. Centro: "X Paw Friend"
con X placeholder para logo partner (caja blanca). Derecha: CTA
"Hablemos →".

Paleta: brand purple 50% + gold highlights. Proporción generosa al
espacio negativo (para que se lea en preview small).
```

### 11.11. Investor deck cover

```
[pegar contexto base]

Necesito 1 SVG 1920×1080 para cover de deck investor (reemplazo del
actual por variante más elevada):

Concepto: gradient radial cinematográfico purple → gold → black en
esquinas, mark Paw Friend floating centered grande (filter drop-shadow
soft), eyebrow Fredoka 11px "Paw Friend · Hecho en Chile" arriba,
title Fredoka 600 big "La ficha médica de tu mascota", subtitle
Jakarta 400 con tagline "Deck para CORFO · Start-Up Chile · Angels
LATAM". Footer con fecha + pawfriend.cl.

Estilo: editorial premium, no corporate genérico, no startup cliché.
```

### 11.12. Sample dashboard variants (Bronze/Silver/Gold)

```
[pegar contexto base]

Necesito 3 variantes SVG mockup del "dashboard Paw Companys" por tier:

1. bronze.svg — 4 KPI tiles, 3 ubicaciones activas, 2 shelters
   trazabilidad, layout compacto.

2. silver.svg — 4 KPI tiles, 5 ubicaciones activas, 4 shelters,
   layout medium + card "featured badge" extra.

3. gold.svg — 4 KPI tiles, 7 ubicaciones activas, 6 shelters,
   exclusividad badge visible, layout premium + co-branding section.

ViewBox 1200×800. Estilo: alineado al sample-dashboard.html existente,
paleta brand + tiers.
```

### 11.13. Device mockups

```
[pegar contexto base]

Necesito 4 SVG device mockups para usar en landing/pitch:

1. iphone_15_pro_portrait.svg — viewBox 800×1600, device púrpura
   profundo con screenshot placeholder (rect dashed).

2. pixel_8_portrait.svg — viewBox 800×1600, device obsidian con
   screenshot placeholder.

3. ipad_pro_landscape.svg — viewBox 1600×1200, device silver, screenshot
   placeholder.

4. macbook_pro_landscape.svg — viewBox 1600×1000, laptop silver,
   screenshot placeholder.

Bezels sutiles, shadows realistas pero flat (no 3D gradient heavy).
Paw Friend-friendly warm.
```

### 11.14. App Store promo images (6 slides)

```
[pegar contexto base]

Necesito 6 templates SVG 1242×2688 (iPhone 6.5") para App Store:

1. Hero: "La ficha médica de tu mascota" + mark centrado + gradient warm.
2. Ficha PDF: screenshot mockup + copy "1 click, la llevas al vet".
3. Directorio vets: screenshot + copy "Encuentra tu vet de barrio".
4. Recordatorios: mockup calendar + copy "Vacunas al día sin pensar".
5. Comunidad: feed + copy "Donantes de sangre, refugios, memorial".
6. Cierre: "Gratis, siempre. Hecho en Chile." + CTA download.

Safe zones: top 80 + bottom 80 libres para status bar + home indicator.
```

### 11.15. Badges seals

```
[pegar contexto base]

Necesito 4 SVG badges 200×200 (squircle rx 36):

1. paw_member_badge.svg — gold gradient + pata blanca + "MEMBER"
   eyebrow.

2. paw_voice_badge.svg — rose/fuchsia gradient + micrófono blanco +
   "VOICE".

3. paw_company_badge.svg — purple gradient + building blanco +
   "COMPANY" + 3 tiers underline (bronze/silver/gold dots).

4. vet_verified_badge.svg — emerald gradient + stethoscope blanco +
   "VERIFIED" + checkmark corner.

Cada uno con wordmark "PAW FRIEND" grabado sutil en el edge del
squircle.
```

### 11.16. Empty states illustrations

```
[pegar contexto base]

Necesito 6 ilustraciones SVG 400×300 para empty states producto:

1. no_pets_yet.svg — mascota cartoon waving, "Agrega tu primer peludo".
2. no_reminders.svg — calendar sonriente vacío con zzz arriba.
3. no_feed.svg — ícono chat con suspensivos, mood tranquilo.
4. no_vets_nearby.svg — pin mapa mirando alrededor.
5. no_donations.svg — corazón hueco outline + hint gold.
6. no_missions.svg — trofeo opaco waiting + hint gold.

Estilo: flat warm, palette brand + neutrals, 1 microdetalle por
illustration (zzz, hint, suspensivos).
```

### 11.17. WhatsApp Business catalog product cards

```
[pegar contexto base]

Necesito 5 templates SVG 1080×1080 para catalog WhatsApp Business:

1. ficha_pdf.svg — product: "Ficha médica PDF", screenshot mockup
   preview, price: "Gratis", CTA "Crear la mía".

2. directorio.svg — product: "Directorio de vets", mapa mockup, tag
   "+200 vets Chile", CTA "Ver cerca de mí".

3. paw_member.svg — product: "Paw Member", badge gold, price
   "$3.990/mes opcional", CTA "Sostener".

4. paw_company.svg — product: "Paw Company", badge purple, price
   "$49.900-199.900/mes", CTA "Conversemos".

5. paw_voice.svg — product: "Paw Voice", badge rose, price "0$",
   CTA "Aplicar".
```

### 11.18. Branded backgrounds / patterns

```
[pegar contexto base]

Necesito 3 patterns SVG tileable (repetibles):

1. paw_dots.svg — grid de huellitas 40×40px tile, opacity .06, sobre
   bg brand-50. Para subtle wallpaper.

2. brand_noise.svg — noise overlay sutil con puntos 1px cada 60px
   rgba(255,255,255,.05). Para hero bg.

3. gradient_mesh.svg — mesh gradient abstract purple + gold + rose
   blending. Para covers hero.
```

---

## 12. Naming system y organización de archivos

### 12.1. Convenciones de nombre

```
<category>_<role>_<variant>.<ext>

Ejemplos:
  logo_icon_principal.svg
  logo_wordmark_horizontal.svg
  icon_brand_01_paw_print.svg
  icon_brand_31_donation.svg
  icon_lineart_briefcase.svg
  badge_paw_member.svg
  social_ig_feed_testimonial.svg
  social_ig_story_tip.svg
  social_tiktok_cover_hook.svg
  social_yt_thumb_tutorial.svg
  mockup_iphone15_portrait.svg
  mockup_pixel8_portrait.svg
  empty_state_no_pets.svg
  pattern_paw_dots.svg
  deck_cover_investors.svg
  hero_landing_main.svg
```

### 12.2. Carpetas sugeridas

```
public/brand-assets/
├── logo/                          # logo_*.svg
├── icons/
│   ├── brand-squircle/            # 01_*.svg a NN_*.svg
│   ├── lineart/                   # pitch inline
│   └── lucide-reference.md        # lista lucide oficial
├── typography/
│   ├── fredoka/                   # font files + license
│   ├── jakarta/                   # font files + license
│   ├── jetbrains-mono/            # font files + license
│   └── specimens/                 # PDF specimens
├── illustrations/
│   ├── hero/                      # hero_*.svg
│   ├── empty-states/              # empty_state_*.svg
│   ├── onboarding/                # onboarding_*.svg
│   └── feature-showcase/          # feature_*.svg
├── badges/                        # badge_*.svg
├── mockups/
│   ├── devices/                   # mockup_*.svg
│   ├── dashboards/                # dashboard_*.svg
│   └── product-screens/           # product_*.png
├── social/
│   ├── instagram/                 # social_ig_*.svg
│   ├── facebook/                  # social_fb_*.svg
│   ├── whatsapp/                  # social_wa_*.svg
│   ├── tiktok/                    # social_tiktok_*.svg
│   ├── youtube/                   # social_yt_*.svg
│   └── general-og/                # og_*.jpg (already has og-image.jpg)
├── print/
│   ├── press-kit/
│   ├── partner-kit/
│   ├── investor-kit/
│   └── event-kit/
├── store-listings/
│   ├── app-store/
│   └── play-store/
└── patterns/                      # pattern_*.svg
```

### 12.3. Versionado

- **No usar v1, v2** en filenames (genera caos). Si un asset se reemplaza, actualizar el mismo archivo.
- **Git history** es el versionado real.
- Para **experimentos/iteraciones**: folder `_scratch/` (ignorado por git).
- Para **archived** (assets que ya no se usan pero se guardan como referencia): folder `_archive/` con fecha.

### 12.4. Master files vs delivery files

- **Master**: SVG (vectorial, editable, fuente de verdad).
- **Delivery derivatives**: PNG/JPG/WebP (exported desde master).
- **Nunca** perder el master. Regla: si no hay `.svg`, se considera deuda.

### 12.5. Formatos finales

| Uso | Formato | Razón |
|---|---|---|
| Web / in-app | SVG | Escalable, liviano, editable |
| OG / social post | JPG | Weight-optimized, compat social APIs |
| Photo content | WebP | Mejor compresión que JPG |
| Favicon | SVG + PNG 16/32/48/96 + ICO | Compat navegadores antiguos |
| App icon | PNG 1024×1024 master + per-density | iOS/Android guidelines |
| Print | PDF con fonts embed | Render consistente |
| Video social | MP4 H.264 | Compat universal |
| Animación web | SVG animado o Lottie JSON | Ligero vs video |

### 12.6. Organización por canal / tipo / campaña

- Campañas temporales: folder `campaigns/YYYY-MM-<name>/`.
- Assets compartidos: root de cada familia.
- Documentación por set: `README.md` dentro de cada carpeta importante.

---

## 13. Librerías, herramientas y formatos

### 13.1. Formatos recomendados

Ya cubierto en §12.5.

### 13.2. Herramientas sugeridas

- **SVG generation**: Claude (prompts library §11), Figma export, Illustrator.
- **Raster export**: Squoosh (web), ImageOptim (batch), macOS Preview.
- **Photo editing**: Photoshop, Affinity Photo, GIMP free.
- **Video**: DaVinci Resolve (free), CapCut (mobile).
- **Icon audit**: SVGO (optimize).
- **Font management**: Google Fonts (Fredoka, Jakarta, JetBrains Mono).

### 13.3. Export recommendations

- **SVG**: siempre pasar por SVGO con config `{removeViewBox: false, cleanupIDs: false}`.
- **PNG**: compresión lossless via `pngquant`.
- **JPG**: quality 80% para social, 90% para landing hero.
- **WebP**: quality 85%.
- **MP4**: H.264 CRF 23, audio AAC 128kbps.

### 13.4. Master workflow

1. **Concepto** → prompt a Claude / brief a diseñador.
2. **SVG master** entregado → revisión founder.
3. **Optimize** con SVGO → commit a `public/brand-assets/`.
4. **Export derivatives** (PNG/JPG/WebP) según canal → folder delivery.
5. **Uso** en código con path relativo + metadata alt text.
6. **Deprecation** si se reemplaza → mover a `_archive/` con fecha.

---

## 14. Prioridad de creación de assets

### Must have (P0) — Para launch 1 mayo

- App icon iOS 1024 finalizado.
- Adaptive icon Android finalizado.
- Splash screens iOS + Android per device.
- App Store screenshots 6.5" × 6.
- Play Store screenshots 1080×1920 × 8.
- Feature graphic Play Store 1024×500.
- Investor kit cover + 1-pager + data room index.
- Partner kit 1-pager + email template.
- 3 social launch posts (IG/FB/TikTok).
- 10 SVG nuevos del icon library (§7.5 del masterplan).
- Variants logo (5): mark_square, wordmark_vertical, lockup_tagline,
  icon_gold, sticker.

### Should have (P1) — Primer mes post-launch

- IG set completo (6 feed + 4 story + 3 reel cover).
- WhatsApp Business catalog 5 cards + profile + 4 status.
- TikTok cover templates 3 + end card.
- YouTube thumbnail templates 3 + banner.
- Device mockups 4.
- Empty state illustrations 6.
- Onboarding illustrations 5.
- Badge seals 4 (Member/Voice/Company/Verified).
- Sample dashboard variants (Bronze/Silver/Gold).
- Partner vertical kit (vets prioridad).

### Nice to have (P2) — Mes 2-3

- FB set (cover + 5 posts).
- Event/conference kit (roll-up + backdrop + swag).
- Press/media kit (press release + fact sheet + quotes bank).
- Referral/campaign kit.
- Video reels 3 templates.
- Documentation/help center kit.
- Branded backgrounds/patterns 3.

---

## 15. Backlog accionable de asset creation

### 15.1. Core branding

- [ ] Logo variants: mark_square, wordmark_vertical, lockup_tagline, icon_gold, sticker.
- [ ] Favicon SVG refresh.
- [ ] Brand guidelines 1-pager PDF.

### 15.2. Product assets

- [ ] App icon iOS master 1024.
- [ ] Adaptive icon Android foreground + background.
- [ ] Splash screens per device.
- [ ] In-app illustrations empty state × 6.
- [ ] Onboarding illustrations × 5.
- [ ] Badge seals × 4.

### 15.3. Social assets

- [ ] IG feed templates × 6.
- [ ] IG story templates × 4.
- [ ] IG reel cover templates × 3.
- [ ] WhatsApp Business catalog × 5 + profile + status × 4.
- [ ] TikTok cover × 3 + end-card.
- [ ] YouTube thumb × 3 + banner + end screen.
- [ ] FB cover + posts × 5.

### 15.4. Mobile assets

- [ ] iOS App Store screenshots 6.5" × 6.
- [ ] iOS App Store screenshots 5.5" × 6.
- [ ] Android Play Store screenshots × 8.
- [ ] Feature graphic Play Store 1024×500.
- [ ] App preview video iOS 15-30s.
- [ ] Android promo video.

### 15.5. Store assets

- [ ] iOS screenshot overlays copy (6 variants).
- [ ] Android screenshot overlays copy (8 variants).
- [ ] Localized copy ES-CL (post-launch LatAm expansion).

### 15.6. Presentations

- [ ] Investor deck cover variant premium.
- [ ] Sample dashboard Bronze variant.
- [ ] Sample dashboard Silver variant.
- [ ] Sample dashboard Gold variant.
- [ ] Deck slide types library (cover/problem/solution/stats/table/quote/tier/CTA).
- [ ] Pitch HTML shared `/public/pitch/assets/brand.css`.

### 15.7. Partnerships

- [ ] Partner kit 1-pager PDF.
- [ ] Partnership banner 1200×400.
- [ ] Email outreach template + banner.
- [ ] Paw Partner badge SVG.
- [ ] Vertical-specific kits (vets, alimento, restaurantes, seguros).

### 15.8. Investor

- [ ] Data room index doc.
- [ ] Founder photo pro.
- [ ] 1-pager executive summary PDF.
- [ ] Intro email templates CORFO / SUP Chile / angels.
- [ ] Tracción chart master.

### 15.9. Media/press

- [ ] Press kit ZIP (logos + photos + screenshots + 1-pager).
- [ ] Fact sheet 1-pager.
- [ ] Quotes bank.
- [ ] Press release template.

### 15.10. Documentation

- [ ] Folder structure `public/brand-assets/` creada.
- [ ] README.md por familia de assets.
- [ ] Naming system guide.
- [ ] Changelog `assets-CHANGELOG.md`.

---

## 16. Recomendación final

### Qué crear primero (si solo puedes hacer 10 cosas)

1. **App icon iOS 1024** (P0, bloquea Apple submission).
2. **Adaptive icon Android + feature graphic** (P0, bloquea Play Store).
3. **Splash screens iOS + Android** (P0, bloquea mobile launch).
4. **Store listing screenshots × 14** (P0, obligatorio stores).
5. **10 SVG nuevos del icon library** (P0, desbloquea rebrand en producto).
6. **Logo variants 5** (P0, desbloquea outreach multi-canal).
7. **Investor kit 1-pager + data room index** (P0, desbloquea ronda).
8. **Partner kit 1-pager + badge + banner** (P0, desbloquea outreach comercial).
9. **3 social launch posts IG/FB/TikTok** (P0, launch 1 mayo).
10. **Sample dashboard variants Bronze/Silver/Gold** (P1, cierra objeción de tier).

### Qué no postergar

- **Store listings**. Sin estos, el mobile launch se bloquea. Alpha de tiempo muy concreta.
- **Investor deck cover + sample dashboard**. Ya existen, pero el refresh post-rebrand 2.0 es necesario antes de ronda.
- **Partner kit**. Cada partner sin kit es una llamada perdida (el founder no puede improvisar infinitamente).

### Cómo mantener consistencia futura

1. **Cada asset nuevo** pasa por el prompt library §11 (o al menos hereda la estética).
2. **Cada PR que agrega asset** actualiza `assets-CHANGELOG.md` + README de la familia.
3. **Review de founder** antes de merge de asset nuevo si es hero/social/pitch.
4. **ESLint rule** para `<img src>` que no estén en `public/brand-assets/` (future).
5. **Auditoría trimestral** de consistencia cross-surface (visual snapshot + revisión).

### Cómo evitar proliferación caótica

- **Única regla de oro**: un asset que no está en la taxonomía §3 se discute antes de crear.
- **Dry principle**: si 2 campañas necesitan "el mismo asset con texto distinto", el asset es un **template**, no 2 archivos.
- **Deprecation explícita**: cuando un asset se reemplaza, se mueve a `_archive/` con fecha — nunca se borra silentemente.
- **Sin "v2", "final", "definitive"** en filenames. Si hay cambios, git history los captura.

---

## Apéndice A — Checklist express de lanzamiento

Para chequear antes del 1 de mayo 2026:

```
BRAND
[ ] Logo variants 5 completas
[ ] Favicon SVG refresh
[ ] Brand guidelines 1-pager

PRODUCT MOBILE
[ ] App icon iOS 1024 master
[ ] Adaptive icon Android
[ ] Splash screens per device
[ ] App Store screenshots × 6 (6.5" + 5.5")
[ ] Play Store screenshots × 8
[ ] Feature graphic Play Store
[ ] App preview video iOS
[ ] Play Store promo video

INVESTOR
[ ] Deck cover premium
[ ] 1-pager executive summary
[ ] Data room index + carpeta
[ ] Founder photo pro
[ ] Intro email templates × 3

PARTNER
[ ] Partner kit 1-pager
[ ] Partnership banner 1200×400
[ ] Email outreach + banner
[ ] Paw Partner badge SVG

SOCIAL LAUNCH DAY 1
[ ] IG feed post teaser
[ ] IG story launch
[ ] IG reel 15s
[ ] FB cover + post
[ ] TikTok vertical launch
[ ] WhatsApp Business profile + status launch
[ ] YouTube thumb + banner (optional for day 1)

PITCH HTML
[ ] brand.css compartido
[ ] Sample dashboard variants (Bronze/Silver/Gold)
[ ] Responsive audit pass mobile/tablet/desktop
[ ] A11y axe pass
```

---

## Apéndice B — Glosario omnicanal

- **Omnichannel**: presencia consistente de marca en múltiples canales/plataformas.
- **Asset set**: conjunto nombrado y definido de piezas visuales con propósito específico.
- **Template**: asset editable para rellenar con contenido variable.
- **Master file**: archivo fuente editable (SVG).
- **Delivery file**: archivo exportado para uso específico (PNG/JPG/MP4).
- **Safe zone**: área segura donde el contenido no será tapado por UI de la plataforma (ej: top 220px en IG stories).
- **Squircle**: forma geométrica entre círculo y cuadrado; firma visual de Paw Friend.
- **Brand badge**: seal visual con meaning (Member, Voice, Company, Verified).
- **Kit**: agrupación completa para un caso de uso (partner kit, investor kit, creator kit).

---

*Fin del Omnichannel Brand Assets & Prompts. Documento emparejado: `docs-raiz/pawfriend-rebrand-rollout-masterplan.md`.*
