# Plan Maestro de Instagram — @pawfriend.app

> **Documento**: Plan estratégico de implementación de Instagram desde cero
> **Marca**: Paw Friend (pawfriend.cl)
> **Handle objetivo**: @pawfriend.app
> **Estado actual**: cuenta vacía
> **Autor**: Senior Social Media Strategist + Brand Strategist + PMM
> **Fecha**: 2026-04-21
> **Fuente de verdad**: repo `pet-harmony-chile-main` (código, copy, assets, pitch)

---

## 1. Resumen ejecutivo

### 1.1 Qué es Paw Friend (según el repo)

Paw Friend es una plataforma chilena de pet-health que integra en una sola app:

1. **Ficha clínica digital** por mascota, con PDF descargable y link compartible 30 días (`/medical-share/:token`)
2. **Directorio público de veterinarios** con filtros por comuna/especialidad y **precios CLP transparentes** — único en Chile
3. **Gamificación** vinculada a salud real: Paw Points, misiones, badges y **Paw Cards coleccionables** con 9 patrones holográficos
4. **Comunidad pet lover**: feed social, grupos por raza, adopciones, memorial, banco de donantes de sangre
5. **Ecosistema de sostenibilidad sin paywalls al dueño**: Paw Member ($3.990/mes voluntario), Paw Companys (sponsors empresariales Bronze/Silver/Gold), Paw Voices (creadores), Paw Partners (barter), donaciones trazables
6. **Planes B2B para vets**: Básica gratis (5 pacientes) → Premium $9.900 → Clínica $19.900 → Pro Max $29.900

Todo construido por **una persona + Claude IA en 2 meses**, 100% en Chile, con copy emocional y tuteo chileno ("tu peludo"). El producto es **gratis para siempre para dueños**; la monetización no condiciona la experiencia.

### 1.2 Oportunidad real en Instagram

| Ventaja | Por qué importa |
|---|---|
| **Producto visualmente rico** | Paw Cards holográficas, reveal ceremonies, memorial emotivo, QR escaneable, muralla Paw Voices |
| **Narrativa emocional lista** | "¿Dónde está su historia médica a las 3 AM?", founder + Kai + Ema, donantes que salvan vidas |
| **Brand kit v2 completo** | Logos, icons (24 squircles), badges Bronze/Silver/Gold, plantillas IG/email/OG ya diseñadas |
| **Diferenciadores no-genéricos** | Hecho en Chile por 1 persona, sin VC, gratis para siempre, directorio con precios CLP (único) |
| **Comunidad real** | Paw Voices = creadores-partners que pueden amplificar orgánicamente |
| **B2B + B2C** | IG sirve tanto a dueños como a vets (2 públicos con mensajes distintos) |
| **Causa social** | Memorial + banco de sangre + adopciones + donaciones trazables = contenido de alto share |

### 1.3 Lo que **NO** debería hacer esta cuenta

- **No ser otra cuenta "de memes de perros"**. El producto es serio, emotivo y útil — no es humor genérico.
- **No inflar números ni usar testimonios ficticios** (regla del repo: solo ratings/willingness-to-pay reales).
- **No publicar sin producto detrás**. Cada post debe conectar con una feature real, un dolor real o una historia real.
- **No prometer features que no existen** (OCR sí, transcripción vet todavía no, etc.).
- **No perder el tono chileno**. Nada de "boludo" argentino, "vosotros" español ni inglés mezclado.
- **No ser solo "bonito"**. El objetivo final es que alguien cree una ficha, reserve un vet, adopte o done — no solo dar like.
- **No vender Paw Member como paywall**. Es voluntario, no desbloquea features. Confundir esto daña la marca.
- **No publicar fotos de stock genéricas** si tenemos Kai, Ema, dueños reales, Sofia (vet beta tester) y refugios beta.

---

## 2. Diagnóstico del producto desde marketing

### 2.1 Propuesta de valor actual (copy literal del landing)

**Headline principal** (`src/components/landing/content/copy.ts:16-28`):

> **"La salud de tu peludo, en un solo lugar. Y siempre gratis."**
>
> "Ficha clínica que cualquier vet puede leer. Veterinarios verificados cerca de ti. Recordatorios. Y una comunidad pet lover que empuja parejo."
>
> **CTA**: "Crear cuenta gratis" · "Sin tarjeta · Sin letra chica"

**Framing del problema** (`copy.ts:30-38`):

> **"Cuando tu peludo se enferma a las 3 AM, ¿dónde está su historia médica?"**

**Alma del proyecto** (`copy.ts:76-88`):

> **"Hecho por una persona, con amor, en Chile"**
> "Paw Friend lo construye una persona en Chile, apoyada por IA, con la convicción de que la salud de un peludo no debería ser un privilegio. Sin VC presionando, sin exit forzado, sin gates ocultos."

### 2.2 ICP / tipos de usuarios detectados

| # | Segmento | Pain principal | Feature detonante | Tono |
|---|---|---|---|---|
| 1 | **Dueño millennial/Z, 1ª mascota, zona metropolitana** | Ansiedad salud, olvida vacunas, no tiene vet de confianza | Ficha digital + directorio + recordatorios | Empático, tranquilizador |
| 2 | **Dueño pet-lover multi-mascota** | Historial desperdigado, quiere colección + comunidad | Paw Cards + feed + grupos por raza | Entretenido, colaborativo |
| 3 | **Dueño de mascota mayor / condición crónica** | Gestión compleja, cambio de vets, memorial futuro | Ficha compartible 30d + memorial + bereavement IA | Respetuoso, profundo |
| 4 | **Veterinario individual** | Clientes nuevos, WhatsApp como CRM, agenda en papel | Directorio SEO + booking + Sofia testimonio | Profesional, no paywall |
| 5 | **Clínica veterinaria (2-5 vets)** | Coordinación multi-vet, ficha compartida, bulk import | Plan Clínica + multi-seat | Eficiente, ROI |
| 6 | **Refugio/hogar de adopción** | Digitalizar mascotas, entregar ficha al adoptante | `/shelter/*` + bulk import + transfer | Solidario, operativo |
| 7 | **Creador pet-lover (Paw Voice)** | Monetización soft + causa | Badge + perfil destacado + código promo | Reconocimiento |
| 8 | **Empresa pet-friendly (Paw Company)** | RSE, visibilidad, impacto medible | Sponsor Bronze/Silver/Gold | Prestigio, data |

### 2.3 Fortalezas visuales y narrativas

- **Design system maduro**: purple-gold gradient signature (#9333EA + #f59e0b), Fredoka headline, Plus Jakarta Sans body
- **Paw Cards holográficas** con 9 patrones (none/paws/stars/hearts/diamonds/waves/fire/galaxy/rainbow) y 6 rarezas (common → mythic) — material TCG-grade para Reels
- **Reveal ceremony** de 8 segundos con particle burst (content native para IG)
- **Memorial + bereavement chat IA** — narrativa emocional única
- **Founder real** con mascotas reales (Kai = pastor suizo, Ema = gata)
- **Sofia Rosi** (vet beta tester primera) — testimonio auténtico
- **Muralla Paw Voices** ya diseñada (grid de quotes públicos)
- **Health state tokens** (green/amber/red) = visual instantáneo de salud

### 2.4 Debilidades para comunicar

- **Cuenta vacía = sospecha**: nadie confía en app sin feed.
- **Foto del founder con Kai+Ema pendiente** (`AlmaSection.tsx:127-143` tiene placeholder).
- **No hay video/reel demo actual** de Paw Cards reveal grabado.
- **Sin UGC** hoy: dueños reales en la app, pero no estructurado para amplificar.
- **Claim "4.9 comunidad pet lover"** aparece en hero sin social proof visual acompañándolo.
- **B2B mensaje mezclado**: un feed sirve dueños y vets simultáneamente — riesgo de diluir.
- **Marca sin manifesto visible de 1 línea**: hay "alma", pero falta un tagline ultra-corto memorizable.

### 2.5 Assets ya reutilizables (inventario)

**Inmediatamente pegables en IG** (`public/paw-friend-assets-v2/`):

| Asset | Ruta | Uso IG directo |
|---|---|---|
| Logo principal squircle | `logo/paw_friend_icon_principal.svg` | Foto de perfil |
| Wordmark horizontal | `logo/paw_friend_wordmark_horizontal.svg` | Highlight covers |
| Icons brand-squircle (24) | `icons/brand-squircle/31-60.svg` | Iconos post/story (donación, QR, shield-data, ai-brain, shelter, etc.) |
| Badges Paw Companys Bronze/Silver/Gold | `paw_companys_ig_*.svg` (3) | Posts sponsors |
| Paw Voices plantilla IG | `paw_voices_instagram_post.svg` | Anuncio nuevo creator |
| Paw Voices creator spotlight | `paw_voices_creator_spotlight.svg` | Reels intro |
| Paw Partners new partner IG | `paw_partners_ig_newpartner.svg` | Anuncio partner |
| Paw Vets Instagram control | `paw_vets_ig_control.svg` | Post vet |
| Hero banners (4 audiencias) | `paw_*_hero.svg` | Cover posts |
| OG cards | `paw_*_og_card.svg` | Compartir link story |
| Empty states ilustraciones | `illustrations/empty-states/` | Carousels educativos |

**Contenido verbal listo**:
- Copy de landing (`copy.ts`) → 30+ líneas reutilizables
- FAQ (`src/pages/FAQ.tsx`) → base para carousels educativos
- Pitch inversionistas (`pitch-inversionistas/*`) → claims, métricas, storytelling

**Screenshots capturables hoy** (pendiente de capturar, pero el producto está en prod):
- Home dashboard con pet switcher + Paw Score rarity glow
- Paw Cards grid + reveal ceremony
- Ficha clínica PDF (portada + timeline)
- QR público de mascota
- Directorio vets con filtros
- Estimador precios por comuna
- Muralla Paw Voices
- Grid Paw Companys Bronze/Silver/Gold
- Memorial + bereavement chat
- Banco donantes sangre

### 2.6 Huecos que habría que crear

| Hueco | Criticidad | Acción |
|---|---|---|
| Foto real del founder con Kai+Ema | Alta | Pedir a Pedro sesión foto (natural, no stock) |
| Video demo de Paw Cards reveal (8-10s) | Alta | Screen-record de la reveal ceremony en prod |
| Video tutorial ficha clínica (30s) | Alta | Screen-record flujo: crear → PDF → compartir 30d |
| Testimonio video Sofia (vet beta) | Media | Grabar con Sofia: 30s en su clínica |
| 6-10 dueños reales con mascota (UGC seed) | Media | Contactar beta testers (Palo, otros) para 1 post cada uno |
| Foto refugio real (mascota pre/post adopción) | Media | Coordinar con refugio partner |
| Plantilla "Tip de raza" reutilizable | Media | Diseñar 1 plantilla Figma con variantes |
| Plantilla "Antes de correr a la urgencia 3 AM" | Alta | Checklist carousel reutilizable |
| Manifesto de 1 línea memorizable | Alta | Propuesta abajo sección 3 |

---

## 3. Posicionamiento de Instagram

### 3.1 Rol dentro del ecosistema Paw Friend

Instagram **no es un canal de ventas directas**; es un **activo de marca y confianza** que:

1. Convierte desconocidos en **dueños que crean ficha** (top-of-funnel gratuito)
2. Da **credibilidad SEO-complementaria** a vets y refugios del directorio
3. Es el **escenario público** donde Paw Voices amplifican y donde Paw Companys reciben visibilidad (cumpliendo contrapartida)
4. Recoge **señal de mercado** para validar features antes de construirlas (stories Q&A)
5. Sostiene la narrativa "made in Chile + gratis para siempre" en un formato que inversores, CORFO y Start-Up Chile revisan al evaluar

**Jerarquía web vs IG**:

```
Landing (pawfriend.cl)   = prueba de producto  → conversión
Instagram (@pawfriend.app) = prueba de marca   → confianza
App                      = prueba de valor    → retención
```

### 3.2 Objetivos

**Objetivo principal (Norte)**:
Construir en 90 días una cuenta con **1.500-3.000 seguidores chilenos** altamente cualificados (dueños pet-lover urbanos + vets + refugios), que reconozcan Paw Friend como la app gratis de salud de mascotas hecha en Chile.

**Objetivos secundarios**:
- Generar **10 saves/post promedio** (señal IG de valor útil, no solo estético)
- Conseguir **500+ visitas/mes a pawfriend.cl desde IG** (link en bio + stories)
- Activar **10 Paw Voices orgánicos** en 90 días
- Visibilizar **3 Paw Companys sponsors** antes del 31 julio
- Captar **50+ leads veterinarios** via DM/stories hacia `/para-veterinarios`

### 3.3 Mensaje central

> **"La salud de tu peludo, en tu bolsillo. Gratis. Hecha en Chile, con amor."**

(Versión completa para bio/about: *"Ficha clínica digital + directorio de vets con precios reales + comunidad pet lover. 100% gratis para dueños, siempre."*)

### 3.4 Pilares de marca (5 pilares)

| # | Pilar | Mensaje raíz | Formato natural |
|---|---|---|---|
| 1 | **🩺 Salud sin fricción** | "Tu peludo tiene una historia. Guárdala bien." | Carousel educativo + tutoriales + PDF showcase |
| 2 | **🤝 Comunidad pet lover** | "No estás solo. Somos miles cuidando a nuestros peludos." | UGC + feed + Paw Voices + adopciones |
| 3 | **🚨 Emergencias y cuidado crítico** | "Cuando importa más, Paw Friend responde." | Stories educativas + red de sangre + vets 24h |
| 4 | **💛 Alma y memoria** | "Honrar, recordar, despedir con dignidad." | Memorial, historias post-adopción, tributes |
| 5 | **🛠️ Hecho en Chile, a mano** | "Construido por un dueño para otros dueños." | Behind the scenes + founder + Kai/Ema + roadmap |

### 3.5 Tono de voz

| Atributo | Sí | No |
|---|---|---|
| **Cercano chileno** | "tú, tienes, puedes, peludo, vacuna, vet" | "vosotros, boludo, mascota, doggy" |
| **Empático, no lastimero** | "A las 3 AM, importa tener su historia a mano" | "Pobrecito tu perrito te necesita" |
| **Claro, no técnico** | "Ficha clínica en PDF" | "Medical health record blockchain" |
| **Honesto** | "Nuestro objetivo es que sea gratis para siempre. Lo sostenemos con X." | "La mejor app del mundo" |
| **Orgullo chileno, no chauvinismo** | "Hecho en Chile, escalando a Latam" | "La única y mejor de Chile" |
| **Humor respetuoso** | "Tu gato ignora el recordatorio. Nosotros no." | Memes genéricos sin alma |

### 3.6 Personalidad de marca (arquetipo)

Mezcla **Cuidador + Aliado + Artesano**:
- Cuidador: prioriza bienestar de la mascota sobre todo
- Aliado: acompaña al dueño, no lo juzga
- Artesano: hecho a mano, con orgullo, transparente sobre el proceso

**Personificación**: Paw Friend es *"un amigo vet que también es dueño apasionado, que te cuida a ti y a tu peludo sin cobrarte por lo básico"*.

### 3.7 Guidelines de estilo visual

**Paleta primaria** (de `src/index.css`):
- Brand Purple `#9333EA` (CTA, destacados)
- Gold `#f59e0b` (secundario, premium feel)
- Gradient signature: `linear-gradient(135deg, #9333ea 0%, #eab308 100%)`

**Paletas de audiencia** (reutilizar en posts por tema):
- Inversores: Purple + Gold
- Companys: Deep Purple
- Partners: Emerald
- Voices: Rose/Pink

**Health state tokens** (semántica):
- Good: `#16a34a` (verde) — vacunas al día, éxitos
- Attention: `#d97706` (ámbar) — próximo vencimiento, cuidado
- Urgent: `#dc2626` (rojo) — emergencia, vencido

**Tipografía**:
- Headlines/covers: **Fredoka** (redondeado, amigable)
- Body: **Plus Jakarta Sans** (clean)
- Data/numbers: **JetBrains Mono** con tabular-nums

**Elementos visuales característicos**:
- Bordes redondeados suaves (`rounded-2xl` = 28px, `rounded-3xl` = 36px)
- Gradient text purple→gold para headlines hero
- Holo-shimmer en Paw Cards
- Blobs blurreados (`blur-3xl`) para fondos
- Glassmorphism (`backdrop-blur + bg-white/80`)

**Estilo fotográfico recomendado**:
- Luz natural, nunca flash directo a mascotas
- Mascotas reales (Kai, Ema, beta testers) por sobre stock
- Planos emocionales (ojos, patas, abrazos dueño-mascota)
- Ambientes chilenos (living con sillón café, patio RM, plaza de barrio)
- No sobre-editar — auténtico > perfecto

**Reglas duras**:
- Siempre en **español chileno** (tuteo)
- Siempre un **CTA claro** en caption o stiker
- Logo discreto o watermark (no invasivo)
- Paw Cards siempre con su patrón holográfico visible

---

## 4. Optimización del perfil

### 4.1 Nombre del perfil (display name)

**Recomendado**: `Paw Friend 🐾 Chile`
- Chile es palabra clave de búsqueda
- 🐾 es un anchor visual coherente con el squircle icon
- Evita cargar caracteres (queda 14/30)

Alternativas:
- `Paw Friend · Mascotas Chile`
- `Paw Friend | Salud Pet Gratis`

### 4.2 Handle

**Mantener**: `@pawfriend.app`
- Refuerza que es app/plataforma, no cuenta hobby
- Es memorable, corto y único
- Si Instagram libera `@pawfriend` sin sufijo, migrar cuando se pueda (bajo prioridad)

### 4.3 Bio — 10 versiones

Elegir 1 principal y rotar las otras en hitos (lanzamiento, campañas, Paw Voices, etc.). Emojis mínimos y relevantes.

> **1. Versión base (recomendada para lanzamiento)**
> La salud de tu peludo, en tu bolsillo 🐾
> Ficha clínica + vets con precios reales + comunidad
> Gratis para siempre · Hecho en Chile 🇨🇱
> 👇 Crea la ficha de tu peludo

> **2. Versión "alma"**
> Hecha por una persona, con amor, en Chile
> Para que la salud de tu peludo no sea un privilegio 💛
> Ficha clínica + vets + comunidad
> 👇 Crea tu cuenta gratis

> **3. Versión emergencia**
> A las 3 AM, su historia médica en un toque 🩺
> Ficha clínica + vets verificados + red de donantes
> Gratis para siempre · Made in Chile
> 👇 Descarga la app

> **4. Versión vets**
> La app que dueños y vets comparten en Chile 🇨🇱
> Ficha digital + directorio + agenda online
> Plan vet gratis disponible
> 👇 Registra tu clínica

> **5. Versión comunidad**
> 🐾 Comunidad pet lover chilena
> Cuidamos, recordamos, adoptamos, donamos
> App gratis para dueños, para siempre
> 👇 Sumate

> **6. Versión minimal**
> 🐾 Paw Friend · Chile
> Salud de mascotas, gratis para siempre
> 👇 pawfriend.cl

> **7. Versión emoji-driven**
> 🩺 Ficha clínica · 📍 Vets verificados
> 🔥 Recordatorios · 💛 Comunidad
> 100% gratis · Hecho en Chile
> 👇 Crea tu cuenta

> **8. Versión founder voice**
> "Quiero que esto siga gratis para siempre, para los peludos de toda Latam"
> — Paw Founder 🐾
> 👇 Descarga la app

> **9. Versión impact-driven**
> Cada ficha creada = un dueño tranquilo
> Cada reseña = un vet mejor elegido
> Cada donación = un refugio apoyado
> 👇 Empieza gratis

> **10. Versión campaña Paw Voice**
> 🎙️ Paw Voices · creadores que aman a los peludos
> ¿Queres ser parte? DM 💌
> App gratis · ficha clínica · vets
> 👇 pawfriend.cl/paw-voices

### 4.4 CTA principal de bio

**Recomendado**: `👇 Crea la ficha gratis de tu peludo`

Rota según fase:
- Lanzamiento: "Crea tu cuenta gratis"
- Campañas vets: "Registra tu clínica"
- Campañas Paw Voice: "Postúlate acá"
- Urgencias: "Buscá vet cerca tuyo"

### 4.5 Link strategy

**Recomendado: link directo a landing con UTM**, no link-in-bio tipo Linktree (agrega fricción).

Configuración:
- Link principal: `https://pawfriend.cl/?utm_source=instagram&utm_medium=bio`
- Rotar por campaña: `/para-veterinarios`, `/paw-voices`, `/donaciones`, `/refugios-hogares`
- Para stories con "swipe up" (link sticker): mandar directo a landing de feature promocionada

**Si se decide usar agregador** (Milkshake / Beacons / propio):
- Construir `/link-in-bio` como ruta pública en el repo (1 día de trabajo) con los 5-6 CTAs principales
- Así todo el tracking queda en el mismo dominio

### 4.6 Categorías

En configuración de Instagram Business:
- Primary: **App Page** (o "Mobile App")
- Secondary: **Pet Service**
- Ubicación: **Chile** (país) + Santiago (ciudad principal si aplica)

### 4.7 Foto de perfil

**Usar**: `public/paw-friend-assets-v2/logo/paw_friend_icon_principal.svg` (renderizado a PNG 320x320).

Reglas:
- Fondo sólido o gradient sutil (no transparente)
- Visible en círculo (el icon principal es squircle, pero centrado funciona)
- **No usar wordmark** (se pierde a tamaño chico)

### 4.8 Highlights recomendados (8 iniciales)

Orden y propósito:

| # | Highlight | Cover | Contenido inicial | Propósito |
|---|---|---|---|---|
| 1 | **Start aquí** | Icon 31_donation/33_ai_brain reformateado | Tutorial 3 stories: qué es, cómo crear cuenta, primer paso | Onboarding nuevos seguidores |
| 2 | **Ficha clínica** | Icon 35_pdf_record | Demo crear ficha, PDF, compartir 30d, OCR carnet | Feature principal |
| 3 | **Vets** | Icon brand vet o 36_handshake_paws | Directorio, filtros, precios reales, Sofia testimonio | Confianza B2B + dueños |
| 4 | **Paw Cards** | Icon squircle con paw | Reveal ceremony, rarezas, cómo conseguirlas | FOMO + gamificación |
| 5 | **Comunidad** | Icon 52_gift o paw voices | Paw Voices, Paw Companys, Paw Partners, donaciones | Social proof + alianzas |
| 6 | **Emergencias** | Icon 60_emergency | Red de sangre, vets 24h, ficha 3 AM, checklist | Valor en crisis |
| 7 | **Alma Paw Friend** | Logo squircle | Founder, Kai, Ema, made in Chile, sin VC, roadmap | Diferenciador |
| 8 | **Preguntas** | Icon 54_settings o ? custom | FAQ de Instagram (DMs frecuentes respondidas) | Dudas comunes |

Highlights **propuestos** (agregar después del mes 2):
9. **Paw Voices** (creadores featured)
10. **Refugios** (mascotas en adopción)
11. **Memorial** (con mucho cuidado tonal)
12. **Behind the Scenes**

### 4.9 Estructura primeros highlights (guión)

**Highlight "Start aquí"** (4 stories iniciales):
1. Cover: "Bienvenida/o a Paw Friend 🐾" + icon squircle sobre purple gradient
2. "¿Qué somos?" — carousel 3 cards (ficha + vets + comunidad)
3. "¿Cuánto cuesta?" — "Gratis para siempre · Sin tarjeta · Sin letra chica"
4. CTA: "Crea la ficha de tu peludo → pawfriend.cl" (sticker link)

**Highlight "Ficha clínica"** (5 stories iniciales):
1. Cover: "Ficha clínica digital"
2. Screen recording creando mascota
3. Screen del PDF exportado (portada con Kai)
4. "Comparte 30 días con un link único" — demo del modal ShareWithVetModal
5. "OCR del carnet con IA: de carnet a digital en 1 minuto" + poll sticker "¿Te pasó olvidar una vacuna?"

---

## 5. Pilares de contenido

### Pilar 1: 🩺 Salud sin fricción

**Objetivo**: Educar y convertir. Mostrar que gestionar salud de mascota es fácil con Paw Friend.

**Audiencia**: Dueños con pain de organización. 1ª mascota, multi-mascota, condiciones crónicas.

**Por qué conecta con el producto**: Es la feature core (ficha clínica + recordatorios + OCR). Todo el landing gira en torno a esto.

**Formatos ideales**:
- Carousel educativo 6-8 slides ("Checklist antes de urgencia 3 AM")
- Reel demo de 15-30s (crear ficha + compartir PDF)
- Story polls ("¿Sabes la fecha exacta de la última vacuna?")
- Post estático tip + CTA

**Ejemplos concretos**:
- "Estas 5 vacunas no pueden faltar en tu ficha" (carousel)
- "Cómo compartir la ficha con tu nuevo vet en 3 toques" (reel)
- "De carnet en papel a digital con 1 foto: OCR IA" (reel demo)
- "El microchip importa. Acá te explicamos por qué" (carousel)
- "3 AM, hospital veterinario: qué debes tener a mano" (checklist)
- "¿Le cambias de alimento a tu peludo? Guarda la transición en su ficha" (tip)

**Frecuencia**: 2 posts/semana (el pilar más frecuente).

**CTA sugeridos**:
- "Crea la ficha de tu peludo gratis → pawfriend.cl"
- "Sube tu carnet con el OCR → link en bio"
- "Guarda este post para cuando lo necesites"

---

### Pilar 2: 🤝 Comunidad pet lover

**Objetivo**: Social proof + pertenencia + UGC.

**Audiencia**: Pet-lovers activos en redes, buscadores de tribu.

**Por qué conecta con el producto**: Feed social, grupos por raza, Paw Voices, comunidad de donantes. El producto es social por diseño.

**Formatos ideales**:
- Reel featuring Paw Voice (creador con mascota)
- Carousel "Peludos de la comunidad esta semana" (UGC)
- Post colaborativo con Paw Voice (cocreación)
- Story spotlight (24h un creador)

**Ejemplos concretos**:
- "Conoce a @[paw_voice_1] y su perrita adoptada" (reel)
- "8 razas que tienen grupo en Paw Friend" (carousel)
- "Esta semana en la comunidad" (roundup UGC)
- "Paw Voices del mes" (destacar 3 creadores)
- "Primer encuentro presencial Paw Friend en [parque]" (evento futuro)

**Frecuencia**: 1 post/semana + 2-3 stories/semana de UGC.

**CTA sugeridos**:
- "Etiqueta a tu peludo con #PawFriendChile y salimos"
- "Postúlate a Paw Voices → link en bio"
- "Comenta con el 🐾 si tu peludo tiene tribu"

---

### Pilar 3: 🚨 Emergencias y cuidado crítico

**Objetivo**: Demostrar valor en momento de máxima necesidad (= memoria emocional y recomendación boca a boca).

**Audiencia**: Dueños preocupados, vets, dueños con mascotas mayores o con condiciones.

**Por qué conecta con el producto**: Red de donantes de sangre (`/donantes-sangre`), ficha compartible 30d para vets nuevos, QR escaneable.

**Formatos ideales**:
- Carousel checklist salvavidas
- Historia real (con permiso) de rescate/urgencia resuelta
- Infografía de emergencia (qué hacer en X situación)
- Reel demo QR mascota

**Ejemplos concretos**:
- "Tu peludo necesita sangre: qué hacer" (carousel)
- "7 señales de que debes ir al vet hoy" (checklist)
- "Kit básico de botiquín para mascotas" (carousel)
- "QR en el collar: 1 toque desde un desconocido y ves su ficha" (reel)
- "Golpe de calor: qué NO hacer" (carousel)
- Historia real: "Luna necesitó transfusión. Encontramos donante en 40 minutos." (caso comunidad)

**Frecuencia**: 1 post/semana (alto share + save ratio).

**CTA sugeridos**:
- "Guarda este post, puede salvar vidas"
- "Imprime el QR de tu peludo → link en bio"
- "¿Tu peludo puede ser donante? Revisa acá"

---

### Pilar 4: 💛 Alma, memoria y causa

**Objetivo**: Diferenciación emocional profunda. Conectar con dueños que ya perdieron o tienen mascota mayor.

**Audiencia**: Dueños con mascota mayor, en duelo, adoptantes, donadores.

**Por qué conecta con el producto**: Memorial (`/en-memoria`), bereavement chat IA, Paw Cards memorial, donaciones, adopciones.

**Formatos ideales**:
- Post estático tribute (con permiso)
- Reel 15-30s con música suave (adopción exitosa, memorial)
- Carousel historia de adopción pre/post
- Stories con question stickers ("Dejame un mensaje para [nombre]")

**⚠️ Regla ética**: jamás usar tragedia para venta. Memorial solo con consentimiento explícito del dueño. Fecha/año/aniversario respetado.

**Ejemplos concretos**:
- "Rocky, 14 años. Gracias por tanto." (tribute con Paw Card memorial)
- "Adoptada con 3 patas. Hoy corre más que todos." (historia con permiso)
- "¿Cómo se siente despedirse? IA empática para acompañarte." (sobre bereavement-assistant, sin promo agresiva)
- "Estas mascotas buscan familia esta semana" (refugios partner)
- "Transparencia: así se usaron las donaciones en marzo" (dashboard público)

**Frecuencia**: 1 post/semana (post pesado que permanece).

**CTA sugeridos**:
- "Honrá a tu peludo en Paw Friend → /en-memoria"
- "Conocé refugios que buscan hogar → /refugios-hogares"
- "Suma tu apoyo → /donaciones"

---

### Pilar 5: 🛠️ Hecho en Chile, a mano

**Objetivo**: Diferenciador único. Humanizar la app, construir afinidad marca-founder.

**Audiencia**: Early adopters, orgullo chileno, inversionistas potenciales que ven la cuenta, periodistas.

**Por qué conecta con el producto**: Alma Section del landing, `/paw-core`, pitch inversionistas, sin VC, transparencia radical.

**Formatos ideales**:
- Behind the scenes (reel/story): founder trabajando con Kai o Ema
- Carousel "Cómo se construyó Paw Friend en 2 meses con IA"
- Updates transparentes (cuántos usuarios, cuánto cuesta el servidor, etc.)
- Reel "Mi día construyendo Paw Friend"

**Ejemplos concretos**:
- "Paw Friend lo construye 1 persona + IA. Así funciona la fábrica." (reel)
- "Hoy se pagó el servidor con 2 Paw Member. Gracias." (post transparencia)
- "Ema revisando el PR del día" (behind scenes)
- "Roadmap abierto: lo que viene en mayo" (post data)
- "De pitch en Start-Up Chile a tu pantalla" (storytelling)
- "Antes: carnet en guantera. Después: ficha en bolsillo." (before/after visual)

**Frecuencia**: 1 post/semana + 2-3 stories casuales/semana.

**CTA sugeridos**:
- "Conocé el alma del proyecto → /paw-core"
- "Sé Paw Member voluntario → /paw-member"
- "Empresa que ama a los peludos → /paw-companys"

---

### Distribución semanal de pilares

| Día | Pilar | Formato | Notas |
|---|---|---|---|
| Lunes | Salud sin fricción | Carousel educativo | High save |
| Martes | Alma / behind scenes | Story + reel | Humanización |
| Miércoles | Emergencias | Carousel checklist | Alto share |
| Jueves | Comunidad | UGC / Paw Voice | Alto engagement |
| Viernes | Salud sin fricción | Reel demo feature | Antes de fin de semana |
| Sábado | Alma / memorial (pesado) | Post estático | Tono reflexivo |
| Domingo | Recap semana / question | Story interactivo | Poll + question |

---

## 6. Sistema de contenido

### 6.1 Frecuencia semanal ideal

**Fase lanzamiento (semanas 1-4)**: 4 posts + 1-2 reels + 5 stories/semana.
**Fase crecimiento (semanas 5-12)**: 5 posts + 2-3 reels + daily stories.
**Fase consolidación (posterior)**: sostener o ajustar según data.

### 6.2 Mezcla de formatos (baseline mensual)

| Formato | % del mix | Frecuencia | Ejemplo uso |
|---|---|---|---|
| **Reels** | 30% | 2-3/semana | Paw Cards reveal, tutoriales, testimonios |
| **Carousels** | 35% | 2-3/semana | Educación, checklists, pilares |
| **Posts estáticos** | 20% | 1-2/semana | Tributes, announcements, quotes |
| **Stories diarias** | (constante) | 3-7/día | Polls, Q&A, UGC, behind scenes |
| **Lives** | Ad-hoc | 1/mes | Q&A con vets, founder, Paw Voice |

### 6.3 Porcentaje por tipo (matriz content mix)

| Tipo | Objetivo | % del mes |
|---|---|---|
| **Educativo** | Saves + autoridad | 30% |
| **Emocional** | Share + memoria de marca | 20% |
| **Producto/feature** | Conversión | 20% |
| **Comunidad/UGC** | Engagement + social proof | 15% |
| **Behind scenes/alma** | Diferenciación | 10% |
| **Social proof numérico** | Trust | 5% |

### 6.4 Workflow sostenible (1 persona + IA)

Diseñado para Pedro (founder) sin community manager:

**Lunes (batching day, 2h)**:
- Revisar analytics semana anterior
- Planificar 7 posts (pilar asignado, formato, CTA)
- Escribir captions con apoyo Claude (prompt template: "caption IG 180 palabras tono Paw Friend sobre X")
- Capturar screenshots faltantes del producto

**Martes (producción reels, 2h)**:
- Grabar 2-3 reels (screen recordings + b-roll con Kai/Ema)
- Editar con CapCut/InShot usando plantilla marca
- Subtítulos siempre (accesibilidad + watch sin audio)

**Miércoles-domingo (30 min/día)**:
- Publicar post del día (programado en Meta Business Suite)
- Stories ad-hoc (5-10 min)
- Responder DMs + comentarios (15 min)

**Automatización posible**:
- Meta Business Suite programación semanal
- Buffer/Later si se crece (no necesario en lanzamiento)
- Canva/Figma plantillas reutilizables (diseñar 10 plantillas al inicio)

**Tiempo total estimado**: 6-8h/semana sostenibles.

### 6.5 Reutilización de assets del repo

**Proceso estructurado**:

1. **Screenshot farm**: capturar pantallas clave de la app en 2 sesiones (mobile + desktop). Guardar en `/instagram-assets/screenshots/` (crear carpeta fuera de `docs/`).
2. **Plantillas Figma** (10 iniciales):
   - Carousel educativo (cover + 5 content slides + CTA slide)
   - Reel cover (9:16)
   - Quote card
   - Tip card
   - Checklist
   - Announcement
   - Paw Voice spotlight
   - Paw Company spotlight
   - Before/After
   - Behind scenes

3. **Biblioteca de icons**: los 24 squircles de `paw-friend-assets-v2/icons/brand-squircle/` pueden usarse como moños decorativos en todos los posts.

4. **Copy bank**: un doc vivo `/instagram-assets/copy-bank.md` con:
   - Hooks probados
   - CTAs probados
   - Frases signature ("Sin tarjeta, sin letra chica")

### 6.6 Convertir features en contenido

**Template reusable** para cada feature:

| Paso | Pregunta | Output |
|---|---|---|
| 1 | ¿Qué dolor resuelve? | Hook emocional |
| 2 | ¿Cómo se ve en la app? | Screenshot/screen-recording |
| 3 | ¿Quién ya lo usa? | Testimonio (si existe) |
| 4 | ¿Qué pasa si no lo usas? | Escenario negativo |
| 5 | ¿Cuál es el primer paso? | CTA claro |

**Ejemplo aplicado a "compartir ficha 30 días"**:
1. Dolor: cambiar de vet y que no sepa nada de tu mascota
2. Cómo: screen del modal ShareWithVetModal + copy del link
3. Testimonio: Sofia dice "recibí un link y entendí todo en 2 min"
4. Sin: imprimir 20 páginas y que igual falte algo
5. CTA: "Crea su ficha en pawfriend.cl y compartí el link a tu vet"

---

## 7. Lanzamiento de la cuenta vacía

### 7.1 Objetivo del lanzamiento

En **7-10 días** la cuenta debe:
- Tener 15 posts publicados (mix de pilares)
- 8 highlights organizados
- Bio optimizada con link activo
- 300-500 seguidores iniciales (semilla: contactos, beta testers, Paw Voices, Sofia, Palo, refugios)
- 1 reel featured (Paw Cards reveal ceremony) como pinned

### 7.2 Orden de publicación de primeras 15 piezas

Ordenadas por **impacto emocional + claridad de producto**. Publicar en 4 tandas (3-4 al día durante 4 días):

| # | Día | Post | Pilar | Formato | Objetivo |
|---|---|---|---|---|---|
| 1 | D1 | **Manifiesto**: "La salud de tu peludo, en tu bolsillo. Gratis. Hecha en Chile." | Alma | Carousel 5 slides | Foundation post |
| 2 | D1 | **Problema 3 AM**: "Cuando tu peludo se enferma a las 3 AM, ¿dónde está su historia?" | Salud | Reel 15s texto + b-roll | Emocional |
| 3 | D1 | **Demo ficha**: crear mascota + PDF + compartir 30d | Salud | Reel screen-recording 30s | Producto core |
| 4 | D2 | **Paw Cards reveal**: ceremony completa | Comunidad | Reel 10s loop | Gancho FOMO |
| 5 | D2 | **Directorio vets**: "Aquí están los vets de tu comuna con precios reales" | Salud | Carousel 6 slides | Diferenciador |
| 6 | D2 | **Founder + Kai + Ema**: "Hola, soy [Paw Founder]. Así nació Paw Friend." | Alma | Carousel 5 slides + foto real | Humanización |
| 7 | D3 | **Checklist 3 AM urgencia**: qué tener listo | Emergencias | Carousel 8 slides | Alto save |
| 8 | D3 | **OCR carnet demo**: foto → vacunas digitales | Salud | Reel 20s | Feature wow |
| 9 | D3 | **Red donantes sangre**: "Tu peludo puede salvar una vida" | Emergencias | Carousel 5 slides | Causa social |
| 10 | D4 | **Sofia testimonio** (vet beta tester): "Primera vet en Chile usando Paw Friend" | Comunidad | Reel 30s | Trust B2B |
| 11 | D4 | **Paw Voices invitación**: ¿sos creador pet? | Comunidad | Post estático | Reclutamiento |
| 12 | D4 | **Transparencia modelo**: "Así se sostiene Paw Friend sin cobrarte" (5 motores) | Alma | Carousel 7 slides | Confianza |
| 13 | D5 | **Adopción exitosa** (con permiso de refugio) | Alma | Reel 20s + carousel | Emoción |
| 14 | D5 | **Paw Member**: "$3.990 voluntario, mismas features, badge honor" | Alma | Post estático | Monetización clara |
| 15 | D5 | **Gracias primera semana** + invitación a tag | Comunidad | Carousel stats | Community kickoff |

### 7.3 Primera semana — día a día

**Día -3 (pre-lanzamiento)**:
- Configurar cuenta Business, bio, foto perfil, highlights covers (vacíos)
- Preparar posts 1-6 en Figma/Canva
- Grabar reel Paw Cards reveal
- Sesión foto founder + Kai + Ema

**Día 1 (lanzamiento soft)**:
- Publicar post 1 (manifiesto)
- 1h después: publicar post 2 (problema 3 AM, reel)
- 3h después: publicar post 3 (demo ficha, reel pinned)
- Stories: "Acabamos de lanzar Instagram 🐾" + "¿Conocés Paw Friend?" poll
- Notificar beta testers, Paw Voices, Sofia por DM/WhatsApp
- Compartir en LinkedIn del founder

**Día 2**: Posts 4-6. Stories con UGC primeros followers.
**Día 3**: Posts 7-9. Stories Q&A ("pregúntame lo que quieras sobre Paw Friend").
**Día 4**: Posts 10-12. Lanzar highlights completos con contenido.
**Día 5**: Posts 13-15. Post gratitud + invitación a taggear.
**Día 6-7**: Descansar ritmo (1 post/día), empezar cadencia normal.

### 7.4 Primeras 4 semanas — estructura

| Semana | Tema macro | Objetivo métrico |
|---|---|---|
| 1 | **Fundación** | 15 posts, 300 seguidores, 5 Paw Voices contactados |
| 2 | **Profundidad ficha + vets** | 800 seguidores, 3 vets responden interesados, 1 Paw Voice activo |
| 3 | **Comunidad + UGC** | 1.200 seguidores, 10 #PawFriendChile orgánicos, 2 colabs confirmadas |
| 4 | **Causa + alianzas** | 1.500-2.000 seguidores, 1 Paw Company sponsor, 1 refugio partner featured |

### 7.5 Estrategia de stories inicial

**Diario desde día 1** (5-10 minutos):

- **Mañana (10-12h)**: 1-2 stories teaser del post del día
- **Tarde (17-20h)**: 2-3 stories interactivas:
  - Poll ("¿Tu peludo ya tiene su ficha?")
  - Question ("¿Qué es lo que más te estresa de cuidar a tu peludo?")
  - Slider ("¿Qué tan al día tienes las vacunas?")
  - Quiz ("¿A qué edad es la 1ª antirrábica?")
- **Noche (21-22h)**: repost UGC si hay, o recap del día

**Weekly rituals en stories**:
- Lunes: "Esta semana en Paw Friend" (preview)
- Miércoles: Q&A abierta
- Viernes: Featured Paw Voice
- Domingo: Highlight emocional (memorial o adopción)

### 7.6 Cómo evitar que se vea vacío/improvisado

**Reglas duras**:
1. **Grid de 9 posts siempre**: diseñar los 9 primeros posts para que los covers se vean consistentes (alternar colores + formatos).
2. **Pinned posts estratégicos**: pin los 3 mejores (manifiesto, Paw Cards reveal, demo ficha).
3. **Highlights llenos desde día 1**: no publicar hasta tener 8 highlights con 3+ stories cada uno.
4. **Responder TODO comentario y DM las primeras 2 semanas** en <2h. Algoritmo premia.
5. **No borrar posts** que no performan (sólo archivar si son errores evidentes).
6. **Tag ubicación** (Santiago/Chile) en todos los posts para discovery local.
7. **Cross-posting**: compartir cada post en stories + WhatsApp estados + LinkedIn founder.

---

## 8. Primeros 30 contenidos

| # | Título | Objetivo | Formato | Hook | Resumen | CTA | Asset necesario | Dependencia producto | Prioridad |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Manifiesto Paw Friend | Posicionamiento | Carousel 5 | "Hecha en Chile, con amor, para que la salud no sea privilegio" | Historia origen + misión + modelo | Seguir + web | Fotos founder + Kai/Ema + logo | Existe | Alta |
| 2 | Pregunta 3 AM | Dolor emocional | Reel 15s | "Cuando se enferma a las 3 AM, ¿dónde está su historia?" | Texto animado + b-roll hogar oscuro | Link bio | Stock o grabación nocturna | Existe | Alta |
| 3 | Demo ficha en 30s | Producto core | Reel screen 30s | "Crea la ficha de tu peludo en 2 minutos" | Screen recording flujo completo | "Pruébalo gratis" | Screen recording mobile | Ficha clínica live | Alta |
| 4 | Paw Cards reveal | Gancho viral | Reel 10s | "Así se revela tu Paw Card" | Ceremony animation completa | "Crea la tuya" | Screen recording reveal | Paw Cards live | Alta |
| 5 | Vets con precios reales | Diferenciador | Carousel 6 | "El único directorio en Chile con precios CLP" | Screens directorio + precios + filtros | "Busca tu vet" | Screens directorio | Directorio live | Alta |
| 6 | Soy el founder | Humanización | Carousel 5 | "Hola, construí Paw Friend para mis peludos" | Foto + quote + por qué gratis | Link /paw-core | Foto real founder + Kai + Ema | Pendiente foto | Alta |
| 7 | Checklist urgencia 3 AM | Autoridad + save | Carousel 8 | "Lo que debes tener listo antes de una urgencia" | Ficha, microchip, vet 24h, seguro, botiquín | "Guarda este post" | Plantilla + icons | Existe | Alta |
| 8 | OCR carnet demo | Wow feature | Reel 20s | "De carnet en papel a digital con 1 foto" | Screen recording OCR | "Sube tu carnet" | Screen recording + carnet real | OCR live | Alta |
| 9 | Red donantes sangre | Causa + diferenciador | Carousel 5 | "Tu peludo puede salvar una vida" | Requisitos + flujo + historia real | "Registra a tu peludo" | Screens BloodDonors + icon | Existe | Alta |
| 10 | Sofia primera vet | Trust + B2B | Reel 30s | "La primera vet en Chile usando Paw Friend" | Entrevista 30s | "Para vets → link" | Video Sofia | Sofia confirmó | Alta |
| 11 | Paw Voices call | Reclutamiento | Post + reel 15s | "¿Eres creador pet? Sé Paw Voice" | Qué es + qué recibes | "Postúlate" | Badge Paw Voice | Paw Voices live | Media |
| 12 | 5 motores de sostenibilidad | Transparencia | Carousel 7 | "Así se sostiene Paw Friend sin cobrarte" | 5 motores explicados | /paw-core | Infografía + icons | Existe | Media |
| 13 | Adopción exitosa | Emoción + refugios | Reel 20s | "De 3 patas a correr más que todos" | Antes/después con música | "Adoptá → /refugios-hogares" | Foto + permiso refugio | Adopciones live | Media |
| 14 | Paw Member explicado | Monetización honesta | Post estático | "$3.990 voluntario. Mismas features. Badge de honor." | Qué sí / qué no | /paw-member | Badge + gradient card | Paw Member live | Media |
| 15 | Gracias primera semana | Comunidad kickoff | Carousel stats | "En 5 días ya somos X" | Números + nombres + thanks | "Tag tu peludo con #PawFriendChile" | Gráfico stats | Existe | Media |
| 16 | QR en el collar | Feature util | Reel 20s | "1 QR en el collar = vida en un toque" | Screen recording QR + escaneo real | "Imprime el QR" | QR impreso + perro real | QR live | Alta |
| 17 | Vacunas que no pueden faltar | Educativo | Carousel 6 | "5 vacunas imprescindibles" | Cada slide 1 vacuna + cuándo | "Guardalas en la ficha" | Plantilla + icons medical | Ficha | Alta |
| 18 | ¿Premium para dueños? NO | Clarificación | Carousel 4 | "No existe Premium para dueños. Es gratis para siempre." | Explicación modelo | /paw-core | Quote card | Existe | Alta |
| 19 | Tu vet en 1,2 km | Directorio local | Reel 15s | "Tu vet ideal a 1,2 km" | Map zoom + filtros comuna | "Busca por comuna" | Screen recording map | Maps live | Media |
| 20 | Memorial de Rocky | Emoción profunda | Post + carousel | "Rocky, 14 años, gracias por tanto" | Con permiso de dueño | "Honrá a tu peludo → /en-memoria" | Foto + permiso | Memorial live | Media |
| 21 | Paw Game missions | Gamificación | Reel 20s | "Cuida a tu peludo y juega al mismo tiempo" | Screen misiones + puntos + badges | "Abrir Paw Game" | Screen recording | PawGame live | Media |
| 22 | Primer Paw Company | Social proof B2B | Post estático | "[Empresa] es nuestro primer Paw Company Bronze" | Logo + impacto esperado | "Sé Paw Company" | Badge + logo empresa | Paw Companys live | Media |
| 23 | Antes y después Paw Friend | Comparativa | Carousel 4 | "Antes: carnet en guantera. Después: bolsillo." | Before/after visual | Link bio | Mockup + foto real | Existe | Media |
| 24 | Cómo compartir 30 días | Feature útil | Reel 15s | "Compartí la ficha con tu vet en 3 toques" | Screen recording | "Crea la ficha" | Screen recording | Medical share live | Alta |
| 25 | Tip de raza (ej. Golden) | Long-tail SEO | Carousel 5 | "3 cosas que debes saber si tenés Golden Retriever" | Salud, cuidado, frecuencia vet | "Guardá" | Plantilla reutilizable | Breed tips IA backed | Media |
| 26 | Behind scenes: Ema revisa PR | Humanización | Reel 15s | "Ema revisando el PR del día" | Gata sobre laptop | "/paw-core" | Video real Ema + laptop | Pendiente grabación | Media |
| 27 | Grupos por raza | Comunidad | Carousel 5 | "Tu raza tiene comunidad acá" | Screens grupos + ejemplos | "Unite al grupo" | Screens feed grupos | Comunidad live | Media |
| 28 | Transparencia mensual | Trust radical | Carousel 6 | "Así se usaron las donaciones en [mes]" | Breakdown real | /transparencia | Gráfico + números | Existe | Media |
| 29 | Golpe de calor — qué hacer | Salud crítica | Carousel 8 | "Golpe de calor: 5 señales y qué NO hacer" | Síntomas + acción inmediata | "Guardá este post" | Plantilla + icons | Genérico | Alta |
| 30 | Paw Partner descuentos | Alianzas | Reel 20s | "Beneficios reales por ser Paw Member" | Ejemplos partners reales | /paw-partners | Logos partners reales | Paw Partners live | Media |

---

## 9. Reels — 20 ideas, hooks, series

### 9.1 Reels ideas (mezcla emocional + útil + producto)

| # | Idea | Hook (primeros 3s) | Estilo |
|---|---|---|---|
| 1 | Paw Card reveal ceremony full | "Espera al segundo 5..." | Screen recording + partícula |
| 2 | Ficha clínica en 30 segundos | "¿En cuánto crees que se crea?" | Screen recording rápido |
| 3 | OCR carnet: de papel a digital | "1 foto → historial completo" | Screen recording + antes/después |
| 4 | QR en collar escaneado por un extraño | "Un desconocido encontró a tu peludo..." | B-roll actuación |
| 5 | 3 AM dolor | "03:47 AM. Tu peludo vomita sangre." | Texto animado + ambient |
| 6 | Founder + Kai + Ema day in the life | "Un día construyendo Paw Friend" | Vlog 30s |
| 7 | Before/after carnet guantera → app | "Antes estaba acá. Ahora acá." | Cut rápido |
| 8 | Ema revisa el PR (behind scenes) | "Mi PM favorita" | Real gata sobre laptop |
| 9 | Sofia vet testimony | "Primera vet en Chile usando Paw Friend" | Talking head |
| 10 | Adopción exitosa transición | "Hace 3 meses estaba en la calle" | Música emotiva |
| 11 | Tip de raza (formato repetible) | "Si tenés [raza] escuchá esto" | Talking + bullets |
| 12 | Vacunas checklist animado | "5 vacunas que no pueden faltar" | Motion graphics |
| 13 | Memorial tribute (con permiso) | "Rocky, 14 años" | Fotos + música suave |
| 14 | Paw Voice spotlight | "Ella es @[voice] y cuida a..." | Entrevista 30s |
| 15 | Paw Companys Bronze unveil | "Bienvenidos [empresa] al club" | Badge reveal + gradient |
| 16 | Busca tu vet en tu comuna | "¿Vivís en Providencia? Mirá esto" | Screen recording map |
| 17 | Donación trazable dashboard | "Así se usaron tus $5.000" | Screen recording /transparencia |
| 18 | "¿Es gratis? Sí. Es en serio." | "No es trial. Es gratis para siempre." | Texto + punto final visual |
| 19 | Red donantes sangre Chile | "Tu peludo puede salvar una vida" | Collage de perros candidatos |
| 20 | Estadística viral: 80% sin ficha | "8 de cada 10 mascotas en Chile no tienen su salud al día" | Número grande + dato Vetivery |

### 9.2 Hooks cortos para reels (30)

1. "Si tu peludo se perdiera ahora..."
2. "A las 3 AM, no tenés tiempo de buscar el carnet"
3. "Esta app la hizo 1 persona en Chile"
4. "Es gratis. Sí, en serio. Para siempre."
5. "De carnet en papel a digital con 1 foto"
6. "El único directorio con precios reales de vet en Chile"
7. "Tu peludo puede salvar una vida"
8. "Mi gata revisa el código antes que yo"
9. "Espera hasta el segundo 8"
10. "Nadie te dijo esto de las vacunas"
11. "¿Por qué tu veterinario te cobra eso?"
12. "Esta Paw Card es 1 en 1.000"
13. "Si tenés [raza], tenés que escuchar esto"
14. "Cambié de vet y fue así de fácil"
15. "Acá está el historial de Kai"
16. "Testimonio real de la primera vet beta"
17. "Antes tiraba el carnet. Ahora lo escaneo."
18. "3 cosas que todo dueño debería saber"
19. "Mi peludo tuvo urgencia. Esto me salvó."
20. "No es Premium. Es gratis siempre."
21. "¿Vivís en Providencia? Mirá esto"
22. "Construida con amor + IA"
23. "Así se sostiene sin cobrarte"
24. "Adoptada con 3 patas, hoy corre más que todos"
25. "Empezó con 2 mascotas. Hoy somos miles."
26. "Paw Cards coleccionables: cómo funcionan"
27. "Qué hacer si tu peludo necesita sangre"
28. "Esto pasa cuando no tenés su historial"
29. "La pregunta que nadie le hace a su vet"
30. "Rocky, 14 años, gracias por tanto"

### 9.3 Series semanales repetibles

| Serie | Día | Formato | Ejemplo |
|---|---|---|---|
| **#TipDeRaza** | Lunes | Carousel 5 | "3 cosas si tenés Golden" |
| **#3AMChecklist** | Miércoles | Carousel 6 | Protocolo urgencia semanal |
| **#VozPaw** | Jueves | Reel 30s | Creator spotlight |
| **#DetrasDePawFriend** | Viernes | Story+reel | Founder day in life |
| **#EnMemoriaDomingo** | Domingo (ocasional) | Post estático | Tribute con permiso |

### 9.4 Ideas mezcla emocional + útil + producto

- Reel: perrito mira al celular con ficha de él → hook emocional + feature
- Reel: founder escribe codigo de noche + Kai dormido + overlay de landing "Hecha en Chile a las 2 AM" → humano + producto
- Reel: Sofia explica "antes usaba cuaderno, ahora uso Paw Friend" → testimonio + producto
- Reel: refugio recibe alerta de adopción → causa + producto

### 9.5 Ideas UGC

- Concurso: "Sube a tu peludo con #PawFriendChile y aparece en nuestro feed"
- Template story: "Así hice la ficha de mi peludo" (template descargable)
- Reel tribute: "Cuéntanos tu historia de adopción" (reposts con crédito)
- #PrimerDiaPawFriend: dueño muestra onboarding

### 9.6 Ideas participación de la comunidad

- "Adivina la raza por la silueta" (stories sequence)
- "Vota el próximo tip de salud" (poll stories)
- "Pregúntale al asistente IA" (envía consulta, respondemos)
- "Tu peludo en la muralla Paw Voices" (invitación a donar con mensaje)
- "Sumá a tu vet al directorio" (call-to-submit)

---

## 10. Stories y engagement

### 10.1 Tipos de stories diarias

| Categoría | Frecuencia | Ejemplos |
|---|---|---|
| **Teaser posts** | 1/día | Recordatorio del post del día |
| **Polls** | 3-4/semana | "¿Ya tenés ficha digital?" |
| **Q&A** | 1-2/semana | "Pregúntame lo que quieras" |
| **Sliders** | 2/semana | "¿Qué tan al día las vacunas?" |
| **Quizzes** | 1/semana | "¿A qué edad la antirrábica?" |
| **Behind scenes** | 2-3/semana | Kai, Ema, código |
| **UGC repost** | 2-3/semana | Con crédito + gracias |
| **Highlights feeders** | diario | Contenido para highlights |
| **Link stickers** | 1-2/día | CTA hacia landing |
| **Countdowns** | campañas | Lanzamientos |

### 10.2 Prompts de participación listos

**Polls**:
- "¿Tu peludo ya tiene su ficha digital? Sí / No"
- "¿Usás recordatorios de vacunas? Sí / ¡Las olvido!"
- "¿Sabés el tipo de sangre de tu mascota? Sí / No"
- "¿Comparás precios de vet antes de ir? Sí / No ni sabía que podía"

**Questions**:
- "¿Qué es lo que más te estresa de cuidar a tu peludo?"
- "¿Qué feature te gustaría ver en Paw Friend?"
- "¿Con qué vet sí te quedás?"
- "Cuéntame la historia de adopción de tu mascota"

**Sliders**:
- "¿Qué tan tranquilo/a te sentís con la salud de tu peludo?"
- "¿Qué tan al día están sus vacunas?"

**Quizzes**:
- "¿A qué edad la 1ª antirrábica? 3 meses / 4 meses / 6 meses"
- "¿Cuál es la temperatura normal de un perro? 38-39°C / 36-37°C / 40-41°C"
- "¿Qué raza necesita más ejercicio? Border / Bulldog / Chihuahua"

### 10.3 Highlights futuros (mes 2-3)

- **Paw Voices** (perfiles creadores)
- **Paw Companys** (sponsors)
- **Refugios** (adopciones disponibles)
- **Memorial** (tributes, con máximo respeto)
- **Behind scenes** (founder + IA + día a día)
- **Preguntas frecuentes** (DMs recopilados)
- **Press** (apariciones en medios, si ocurren)

### 10.4 Stories para investigación de usuario

Stories como validación pre-feature:

- "¿Qué usarías más: agenda online con vet / feed de tu raza / paw game?" → prioridad roadmap
- "¿Pagarías $3.990 voluntario? ¿O donarías una vez?" → willingness-to-pay real
- "¿Estás buscando vet hoy o buscando adoptar?" → segmentación

Guardar estadísticas screenshoteadas en Airtable/Notion para pitch.

---

## 11. Integración con el producto

### 11.1 Conexión Instagram ↔ web/app

**Landing**:
- Añadir `utm_source=instagram` a todos los links IG para trackear conversión
- Crear `/ig` → redirect a `/?utm_source=instagram&utm_medium=bio` (1 día de trabajo)
- En landing, sección "Síguenos" con preview de grid IG (ya existe RichFooter)
- Pixel Meta instalado en landing (si ya no está — validar con Pedro)

**App**:
- En onboarding: "Síguenos en IG @pawfriend.app" como paso opcional
- En settings: botón "Síguenos en redes"
- En Paw Cards: botón "Compartir en IG Stories" (nativo con share API)
- En medical-share: botón "Contar mi experiencia en IG"

**Waitlist / registro**:
- Tras crear cuenta: "Querés ser Paw Voice? Seguinos en IG y DM"

### 11.2 Futuras descargas mobile

- Cuando se publique en App Store / Play Store: campaña dedicada con reels de instalación
- Badge "Descárgala en App Store / Play Store" en bio
- Stories: "Ya está en Play Store 🎉" + QR

### 11.3 Campañas futuras (paid)

**Fase 1 (mes 3+)**: Meta Ads con públicos:
- Lookalike de seguidores IG
- Interés: mascotas, adopción, veterinaria
- Remarketing a visitantes de pawfriend.cl
- Geo: Santiago primero, luego regiones

**Objetivos**:
- Awareness: reach CPM bajo con reels
- Conversión: tráfico a `/` o `/para-veterinarios`
- Lead gen: formulario IG (Paw Voices applications)

Budget recomendado inicial: CLP $100K-$200K/mes para validar creatives antes de escalar.

### 11.4 Features sociales del producto → IG

| Feature producto | Amplificación IG |
|---|---|
| Feed social app | Repost mejores posts en IG (con permiso) |
| Muralla Paw Voices | Compartir quotes en IG como cards |
| Grupos por raza | Crear highlight por raza |
| Adopciones | Cross-post adopciones urgentes |
| Paw Cards | Compartir reveal en stories |
| Memorial | Tributes reposteados solo con permiso |
| Donaciones | Dashboard transparencia mensual en IG |

### 11.5 Testimonios, perfiles mascotas, vets

- **Testimonios mascotas**: serie "Peludos de la semana" con foto + historia
- **Testimonios vets**: serie "Vets que nos recomiendan" con Sofia como piloto
- **Perfiles destacados**: Paw Voices mensual + Paw Companys trimestral
- **Refugios aliados**: 1 reel al mes destacando refugio + mascotas en adopción

---

## 12. Backlog de implementación

### 12.1 Quick wins 1 día

- [ ] Configurar cuenta Business + categoría "Mobile App"
- [ ] Foto de perfil con logo squircle principal
- [ ] Bio versión 1 (base)
- [ ] 8 highlights creados (vacíos pero con covers)
- [ ] Link bio con UTM
- [ ] Conectar con Facebook page (si existe) para Meta Business Suite
- [ ] Crear `/ig` redirect en el repo
- [ ] Habilitar compartir en IG desde Paw Cards (share API)

### 12.2 Quick wins 1 semana

- [ ] Sesión foto founder + Kai + Ema
- [ ] Grabar 4 reels base (paw cards, demo ficha, OCR, Sofia)
- [ ] Diseñar 10 plantillas Figma/Canva
- [ ] Publicar 15 posts lanzamiento
- [ ] 300+ seguidores (contactos + beta + Paw Voices)
- [ ] Contactar 5 Paw Voices potenciales por DM
- [ ] Contactar 3 refugios para colabs
- [ ] Habilitar "Síguenos en IG" en onboarding app
- [ ] Pixel Meta en landing + eventos key

### 12.3 Backlog 30 días

- [ ] 30 posts publicados (1/día promedio)
- [ ] 8-10 reels con retención >30%
- [ ] 1.500-2.000 seguidores cualificados
- [ ] 3 Paw Voices activos con badge
- [ ] 1 Paw Company sponsor Bronze publicado
- [ ] 2 colabs confirmadas con creadores chilenos
- [ ] 5-10 testimonios UGC organicos (#PawFriendChile)
- [ ] Evaluar primer flight de Meta Ads low-budget
- [ ] 500+ clicks a pawfriend.cl desde IG

### 12.4 Backlog 90 días

- [ ] 3.000-5.000 seguidores
- [ ] 1 reel con 100K+ views
- [ ] 10 Paw Voices activos
- [ ] 3 Paw Companys sponsors visibles
- [ ] Serie "Tip de raza" con 10 razas cubiertas
- [ ] 1 live mensual ya establecido
- [ ] Dashboard analítico IG → web → app en 1 vista
- [ ] Meta Ads optimizado (si se decidió activar)
- [ ] Primera campaña coordinada con refugio (ej. "mes de la adopción")
- [ ] Caso de éxito + prensa (si se presta)

---

## 13. Necesidades creativas

### 13.1 Inventario de lo que falta producir

| Asset | Estado | Quién produce | Prioridad |
|---|---|---|---|
| **Foto real founder + Kai + Ema** | Pendiente | Founder | Crítica |
| **10 plantillas Figma/Canva** | Pendiente | Founder o diseñador freelance | Alta |
| **Screenshots farm del producto (mobile + desktop)** | Pendiente | Founder | Alta |
| **Video reveal Paw Cards** (8-10s screen recording) | Pendiente | Founder | Alta |
| **Video demo ficha clínica** (30s) | Pendiente | Founder | Alta |
| **Video OCR carnet** (20s) | Pendiente | Founder | Alta |
| **Testimonio video Sofia** (30s) | Pendiente, Sofia aceptó | Sofia + founder | Alta |
| **6-8 fotos mascotas beta testers** (Palo, otros) | Pendiente | Beta testers | Media |
| **Motion pieces (intros/outros reels)** | Pendiente | Diseñador freelance | Media |
| **Highlights covers (8 iconos estilizados)** | Parcial (tenemos icons SVG) | Adaptar existentes | Alta |
| **Plantilla "Tip de raza" reutilizable** | Pendiente | Canva/Figma | Alta |
| **Plantilla "3 AM Checklist"** | Pendiente | Canva/Figma | Alta |
| **Plantilla "Paw Voice spotlight"** | Pendiente | Canva/Figma | Media |
| **Plantilla "Paw Company unveil"** | Parcial (SVG existe) | Adaptar a 1080×1080 | Media |
| **Jingle/música de marca** | Pendiente (opcional) | Musicians en Epidemic Sound | Baja |
| **Ilustraciones custom empty-states** | Existe en brand kit v2 | Ya disponible | — |
| **Stickers IG custom** (PawFriendSays, etc.) | Pendiente | Diseñador | Baja |
| **Fotos refugios partner** | Pendiente coordinación | Refugios + founder | Media |
| **Guidelines visuales 1-pager** | Pendiente | Founder o freelance | Alta |
| **Calendario editorial 90d** | Pendiente | Este plan lo inicia | Alta |

### 13.2 Fotos reales a conseguir

- Founder escribiendo código con Kai durmiendo al lado (auténtico > stock)
- Ema sobre laptop
- Founder en ambiente casero (kitchen/living chileno)
- Carnet real de vacunación siendo escaneado
- QR real en collar siendo escaneado
- Visita real al vet con mascota
- Adopción real (pre/post con permiso)

### 13.3 UGC sistemático

Crear **kit UGC** entregable a beta testers, refugios y Paw Voices:
- Plantillas stories con pegar foto
- 5 prompts guía ("Mi primer día con Paw Friend", "Así encuentro vet", etc.)
- Hashtag único #PawFriendChile
- Incentivo: feature en grid + stories con crédito

### 13.4 Guidelines visuales

Crear `GUIDELINES_INSTAGRAM_PAWFRIEND.md` (futuro) con:
- Paleta exacta (hex + contextos)
- Tipografías (weight + uso)
- Reglas logo (no distorsionar, espacios mínimos)
- Grid de ejemplo (9 posts alternados)
- Ejemplos do/don't
- Checklist pre-publicación

---

## 14. Métricas y analytics

### 14.1 Métricas mes 1 (primeros 30 días)

**Objetivo**: fundación + tracción inicial.

| KPI | Target | Herramienta |
|---|---|---|
| Seguidores | 1.500-2.000 | IG insights |
| Posts publicados | 30 | IG insights |
| Reels publicados | 8-10 | IG insights |
| Alcance mensual | 50.000+ | IG insights |
| Engagement rate | 5-8% | IG insights |
| Saves por post | 10+ promedio | IG insights |
| Shares por reel | 5+ promedio | IG insights |
| Click a link bio | 500+ | UTM + GA |
| DMs recibidos | 50+ | IG insights |
| #PawFriendChile usos | 10+ orgánicos | Buscar hashtag |
| Paw Voices activos | 3 | Admin panel |
| Leads vet desde IG | 5-10 | UTM `/para-veterinarios` |

### 14.2 Métricas mes 2-3 (consolidación)

| KPI | Target mes 3 | Señal |
|---|---|---|
| Seguidores | 3.000-5.000 | Crecimiento orgánico sostenido |
| Reels 10K+ views | 3 | Viralidad puntual |
| Saves por post | 20+ promedio | Contenido útil |
| Engagement rate | 6-9% | Comunidad activa |
| Click-to-install / click-to-signup ratio | >3% | Funnel saludable |
| Paw Voices activos | 10 | Reclutamiento exitoso |
| Paw Companys | 3 sponsors | Monetización |
| Colabs confirmadas | 5 | Ecosistema |

### 14.3 KPIs por tipo de contenido

| Tipo | KPI primario | Señal de éxito |
|---|---|---|
| **Carousel educativo** | Saves | >20 saves → replicar tema |
| **Reel viral** | Shares + watch time | >10K views, 40%+ retention |
| **Reel producto** | Perfil clicks + link clicks | 5%+ de viewers click |
| **Post testimonio** | Comments + saves | >10 comments |
| **Post tributo/memorial** | Sentiment comments | Respuestas emocionales genuinas |
| **Story poll** | Participación rate | >20% de viewers votan |
| **Story Q&A** | DMs derivadas | 10+ preguntas/sesión |

### 14.4 Señales de contenido "duplicable"

Un post merece ser replicado (nueva versión o serie) si cumple 2+ de:
- Save rate >3% del alcance
- Share rate >1% del alcance
- Retention en reel >45%
- Engagement rate >10%
- Comentarios cualitativos >10
- Conversión (link click) medible

### 14.5 Detección de pilar ganador

Tracking mensual por pilar:

| Pilar | Posts | Engagement promedio | Saves promedio | Conversión |
|---|---|---|---|---|
| Salud | X | X% | X | X% |
| Comunidad | X | X% | X | X% |
| Emergencias | X | X% | X | X% |
| Alma | X | X% | X | X% |
| Hecho en Chile | X | X% | X | X% |

**Regla de reasignación**: si un pilar supera en 50%+ el promedio durante 2 meses consecutivos → subir su share en el mix mensual +10%.

### 14.6 Stack de analytics

**Gratis (suficiente para mes 1-3)**:
- Instagram Insights nativo
- Meta Business Suite
- Google Analytics 4 (con UTMs)
- PostHog (ya integrado en el repo) — tracking eventos desde IG link
- UTM builder: campañas por post → trackeo individual

**Pago (si se crece)**:
- Iconosquare / Hootsuite Analytics
- Supermetrics para pulls automatizados a Sheets

---

## 15. Riesgos y errores a evitar

### 15.1 Errores típicos cuentas nuevas

- Publicar 2 posts/día los primeros días y luego desaparecer 2 semanas
- Usar solo stock o fotos genéricas (pierde autenticidad)
- Seguir 500 cuentas al día esperando follow-back (penalización algoritmo)
- Comprar seguidores (destruye engagement rate)
- Hashtag spam (30 hashtags no relacionados)
- No responder DMs ni comentarios (algoritmo penaliza)

### 15.2 Errores marcas pet-friendly

- Contenido "cute" sin sustancia (saturación)
- Humor irrespetuoso con mascotas (memes crueles)
- Ignorar temas sensibles (muerte, abandono) — oportunidad de autoridad perdida
- Solo perros / solo gatos (excluir segmentos)
- No educar sobre adopción responsable
- Promocionar razas extremas / crías irresponsables
- Imágenes de mascotas en situaciones riesgosas (aguas altas, alturas, alimentos tóxicos)

### 15.3 Errores de estrategia genérica

- "Feliz día del [cualquier cosa]" sin valor
- Tips generados por IA sin curación humana
- Copy-paste de cuentas gringas traducido
- No diferenciar tono dueño vs vet
- Mezclar español neutral/argentino/español de España
- Usar emojis en exceso (diluyen el mensaje)

### 15.4 Errores desconexión producto

- Hablar de features que no existen (OCR sí, transcripción vet todavía no)
- Prometer Premium B2C features que no hay (Premium B2C está descontinuado — todo es gratis)
- Usar nombre "Paw Rewards QR" (es feature futura, no actual)
- Mencionar precios obsoletos
- Dirigir a URLs rotas (`/upgrade` ya redirige a `/paw-member`)
- Usar copy del pitch inversores sin adaptar (tono B2B ≠ tono B2C)

### 15.5 Riesgos legales / éticos

- Usar foto de mascota sin permiso del dueño → siempre consentimiento por escrito
- Memorial sin consentimiento del dueño → no
- Claim de ser "la mejor app" sin data → evitar superlativos
- Testimonios ficticios → prohibido (regla del repo)
- Comparativas negativas con competencia nombrada → riesgo legal
- Antes/después de enfermedad sin disclaimer → consultar vet

### 15.6 Riesgo operacional

- **Burnout del founder**: 6-8h/semana sostenibles. No prometer 3 posts/día que no se pueden sostener.
- **Mezcla B2B y B2C en un solo feed**: usar highlights para segmentar + evaluar si @pawfriend_vets tiene sentido en mes 6+
- **Hate comments o crisis de reputación**: tener protocolo ("gracias, DM para resolver" + no alimentar)
- **Dependencia de algoritmo**: construir lista de email/WhatsApp en paralelo (newsletter mensual)

---

## 16. Plan final accionable

### 16.1 Top 10 acciones en orden exacto

1. **Foto founder + Kai + Ema** (sesión de 1h casera, no estudio)
2. **Configurar cuenta Business + bio v1 + 8 highlights vacíos**
3. **Grabar 4 reels base**: Paw Cards reveal, demo ficha, OCR, Sofia testimonio
4. **Diseñar 10 plantillas reutilizables** en Canva/Figma
5. **Preparar 15 primeros posts** en Meta Business Suite
6. **Publicar día 1-5** siguiendo orden sección 7.2
7. **Llenar highlights** desde día 3 con contenido ya publicado
8. **Contactar 5 Paw Voices + Sofia + 3 refugios** por DM/WhatsApp
9. **Instalar pixel Meta y UTMs** en landing
10. **Revisar analytics semana 1 y ajustar mix**

### 16.2 Si sólo hay 3 horas hoy

1. Configurar cuenta Business, foto perfil, bio versión 1 (**30 min**)
2. Crear 8 highlights covers con icons del brand kit (**45 min**)
3. Preparar post 1 (manifiesto carousel 5 slides) en Canva (**1h**)
4. Capturar 5 screenshots clave del producto (**30 min**)
5. Publicar post 1 + 2 stories + enviar DM a 5 contactos clave (**15 min**)

**Output**: cuenta viva con 1 post, 2 stories, bio + highlights listos. Ya es diferente a "vacío".

### 16.3 Si hay 7 días

**Día 1** (3h): setup cuenta + highlights + post 1 (manifiesto) + sesión foto founder.
**Día 2** (3h): grabar 4 reels + editar 2 + publicar post 2 (problema 3 AM reel).
**Día 3** (3h): diseñar 5 plantillas + publicar posts 3-4 (demo ficha, Paw Cards reveal).
**Día 4** (3h): publicar posts 5-6 (directorio vets, founder) + llenar highlights.
**Día 5** (3h): posts 7-9 (checklist 3 AM, OCR, donantes sangre) + contactar Paw Voices.
**Día 6** (3h): posts 10-12 (Sofia, Paw Voices call, 5 motores) + stories Q&A primera vez.
**Día 7** (2h): posts 13-15 (adopción, Paw Member, gracias) + revisar analytics + plan semana 2.

**Output esperado**: 15 posts, 8 highlights activos, 300-500 seguidores, 3 colabs confirmadas.

### 16.4 Secuencia de ejecución realista (90 días)

**Mes 1 — Fundación** (capacidad 15-20h/sem):
- Semana 1: lanzamiento + 15 posts
- Semana 2: cadencia normal + primer Paw Voice activo + UGC primeros
- Semana 3: primer reel con tracción + 2 colabs + 1 live piloto
- Semana 4: cierre mes con transparencia de datos + celebración

**Mes 2 — Profundidad** (capacidad 10h/sem):
- Foco: series repetibles, tip de raza, UGC sistemático
- Primer Paw Company unveil
- Evaluar Meta Ads low-budget

**Mes 3 — Escala y consolidación**:
- Foco: refinar pilares ganadores, escalar los que funcionan
- Primera campaña coordinada con refugio
- Dashboard analítico completo IG → web → app
- Retrospectiva 90d y plan 90d siguiente

---

## 17. Apéndice

### 17.1 Veinte bios adicionales

> **11.** La salud de tu peludo, en 2 toques 🐾 Ficha clínica gratis · Vets verificados · Comunidad pet 🇨🇱 Made in Chile 👇 pawfriend.cl

> **12.** Donde tu peludo tiene memoria digital 🩺 Ficha + vets + red de donantes + comunidad 100% gratis · hecha en Chile 👇 Crear cuenta gratis

> **13.** 🐾 Paw Friend Un dueño. IA. Chile. Una app gratis para siempre 👇 Tu peludo te lo va a agradecer

> **14.** Tu peludo no tiene bolsillos. Pero tú sí. 📱 Su ficha, su vet, su tribu. 🐾 Gratis · Chile 👇 Crea la ficha

> **15.** Amamos a los peludos. Lo hacemos gratis. Necesitamos tu ayuda 💛 🐾 Paw Friend · Chile 👇 Sé parte

> **16.** El único directorio con precios CLP de vet en Chile 🇨🇱 + ficha clínica digital + comunidad 100% gratis · siempre 👇 pawfriend.cl

> **17.** 🩺 Ficha clínica · 📍 Tu vet ideal · 🔥 Recordatorios · 💛 Memoria Gratis · Chile · Hecho a mano 👇 Empezá

> **18.** No es una app de mascotas. Es un acto de amor 🐾 Gratis para dueños · siempre Made in Chile 👇 pawfriend.cl

> **19.** 🎙️ Paw Voices abiertos · postúlate 🏥 Vets: plan gratis 💛 Dueños: 100% gratis 👇 Sumate

> **20.** La salud de tu peludo merece más que la guantera del auto 🚗🐾 Ficha clínica digital gratis 👇 Crear ficha

> **21.** Hecha por una persona + Claude IA. En 2 meses. En Chile. Para los peludos de Latam 💛 👇 Conoce el alma

> **22.** A las 3 AM, su historia médica importa. Paw Friend está para eso. Gratis · Chile 👇 pawfriend.cl

> **23.** Ficha clínica + directorio de vets + comunidad pet lover 100% gratis · para siempre · Chile 🇨🇱 👇 Crear cuenta

> **24.** Kai (perro) + Ema (gata) + Claude IA construyeron esto. Para tu peludo. Gratis 👇 Conoce Paw Friend

> **25.** 🐾 La app de salud de mascotas hecha en Chile Gratis · sin VC · sin paywalls 👇 Sumate a la causa

> **26.** Si amás a los peludos, acá tenés casa 🏡 🐾 Ficha + vets + comunidad Gratis · Chile 👇 pawfriend.cl

> **27.** Transparentes desde el día 1. Gratis desde el día 1. Para siempre 💛 👇 Paw Friend · Chile

> **28.** 1 ficha + 1 directorio + 1 comunidad = 1 bolsillo 🐾 100% gratis · Chile 👇 Crear cuenta

> **29.** Tu peludo tiene historia. Guardala bien 📖 🐾 Paw Friend · Chile 👇 pawfriend.cl

> **30.** El primer directorio de vets con precios CLP REALES en Chile + ficha digital gratis 👇 Buscá tu vet

### 17.2 Veinte captions iniciales

> **1. Manifiesto** — La salud de tu peludo no debería ser un privilegio. Ni un gasto que te pille de sorpresa. Ni algo que olvidás entre reuniones. Por eso construimos Paw Friend. Ficha clínica en tu bolsillo. Directorio de vets con precios reales. Comunidad que empuja parejo. 100% gratis para dueños. Para siempre. Hecha en Chile 🇨🇱 con amor. 👉 pawfriend.cl #PawFriendChile

> **2. 3 AM pregunta** — Son las 3 AM. Tu peludo vomita sangre. Agarras el auto. En la urgencia te preguntan: "¿Qué vacunas tiene? ¿Alergias? ¿Medicamentos?" Y tu carnet está en la guantera. O perdido. O en el otro auto. Paw Friend existe para que esa pregunta no te tome desprevenida/o. Ficha clínica en 2 toques. Siempre contigo. Gratis. 🐾 👉 Crea la ficha de tu peludo en pawfriend.cl

> **3. Demo ficha** — 2 minutos. Eso es lo que tomó crear la ficha de Kai. Nombre, raza, microchip, última antirrábica. Listo. PDF descargable. Link compartible 30 días. Cuando cambiás de vet, llega antes que vos. 🩺 Probalo gratis: pawfriend.cl

> **4. Paw Cards reveal** — Cada peludo tiene su Paw Card. Con patrón holográfico. Con rareza. Con QR único. Coleccionables. Algunas son 1 en 1.000. La de abajo es de Ema 💛 Hacé la tuya en pawfriend.cl 🐾 #PawCards #PawFriendChile

> **5. Vets precios reales** — ¿Sabés cuánto cuesta esterilizar a tu peludo en tu comuna? ¿Una consulta? ¿Una antirrábica? En Paw Friend los vets publican precios. Mediana real. Sin cotización larga. Sin sorpresa en la caja. Somos el único directorio así en Chile 🇨🇱 Encontrá tu vet en pawfriend.cl

> **6. Founder + Kai + Ema** — Hola. Soy [Paw Founder]. Este es Kai (pastor suizo) y Ema (gata). Ellos son la razón por la que construí Paw Friend. Porque la salud de un peludo no debería depender de si recordás cuándo fue la última vacuna. La hicimos una persona + Claude IA, en 2 meses, en Chile. Sin VC presionando. Gratis para dueños. Para siempre. 💛 Conoce el alma del proyecto: pawfriend.cl/paw-core

> **7. Checklist 3 AM** — Antes de salir a la urgencia a las 3 AM, tené esto listo: 1. Ficha clínica accesible 2. Microchip anotado 3. Vet 24h más cerca 4. Teléfono de backup 5. Último peso 6. Alergias conocidas 7. Medicaciones actuales 8. Contacto emergencia familiar Guardá este post. Crea la ficha en pawfriend.cl 🐾🚑

> **8. OCR carnet** — Tenés el carnet de papel de tu peludo. 1 foto → vacunas digitales. Gracias al OCR con IA, Paw Friend lee y guarda todo en la ficha. De 30 minutos de transcripción a 1 minuto. Gratis. En Chile. 🐾 Probalo: pawfriend.cl

> **9. Donantes sangre** — Tu peludo puede salvar una vida. Si es perro de 1-8 años, >25kg, sano → puede ser donante. Gato de 1-8 años, >4kg → también. Registralo en Paw Friend y conectamos cuando alguien necesita. Red activa en Chile. Gratis. 💉🐾 👉 pawfriend.cl/donantes-sangre

> **10. Sofia testimonio** — "Antes usaba cuaderno y WhatsApp. Ahora la ficha de mis pacientes está en Paw Friend. Mis dueños la tienen en 2 toques. Eso me libera tiempo y a ellos les da tranquilidad." — Sofia Rosi, primera vet beta tester 🩺🇨🇱 ¿Sos vet? Plan básico gratis: pawfriend.cl/para-veterinarios

> **11. Paw Voices call** — 🎙️ PAW VOICES abiertos ¿Sos creador/a pet lover en Instagram o TikTok? ¿Querés amplificar una app gratis hecha en Chile? Te damos: ✅ Badge oficial ✅ Perfil destacado ✅ Código promo único ✅ Beta access Postúlate en pawfriend.cl/paw-voices 🐾

> **12. 5 motores** — Te explicamos cómo se sostiene Paw Friend sin cobrarte: 1. Donaciones voluntarias 2. Paw Member ($3.990 opcional, badge solamente) 3. Plan vet (B2B) 4. Paw Companys (sponsors empresas) 5. Paw Voices (creadores amplifican) Ningún motor condiciona lo que vos usás. Es gratis. Siempre. 💛 Transparencia: pawfriend.cl/paw-core

> **13. Adopción Rocky** — Hace 3 meses, Rocky estaba en la calle. 3 patas. Desnutrido. Hoy corre más que todos. Lo adoptó @[familia], que conoció su ficha médica completa en Paw Friend antes de firmar. Esa ficha hizo que supieran exactamente qué esperar y cómo cuidarlo. 🐾💛 Adoptá con toda la info: pawfriend.cl/refugios-hogares

> **14. Paw Member explicado** — ¿Qué es Paw Member? 💛 $3.990 CLP/mes voluntario. Ni un peso más. ¿Qué te da? ✅ Badge de honor en tu perfil ✅ Descuentos con Paw Partners aliados ✅ Sostener un proyecto made in Chile ¿Qué NO te da? ❌ Features que no tenés gratis (todo es gratis) ❌ Acceso prioritario a nada básico Es literalmente voluntario. Como una propina a un emprendimiento chileno. 👉 pawfriend.cl/paw-member

> **15. Gracias semana 1** — 🐾 5 días. 15 posts. [X] seguidores. [Y] fichas creadas. [Z] vets interesados. Gracias. En serio. Esto se construye con ustedes. Si amás esto, tagueá tu peludo con #PawFriendChile y salimos en el grid 💛

> **16. QR collar** — Un desconocido encuentra a tu peludo en la plaza. Escanea el QR del collar. Ve: nombre, edad, tipo de sangre, vacunas al día, contacto de emergencia. Sin login. Sin app. 1 toque = vida reencontrada. Imprimí el QR de tu peludo en pawfriend.cl 🔖🐾

> **17. Vacunas que no pueden faltar** — 5 vacunas core que todo perro necesita en Chile: 1. Antirrábica (obligatoria) 2. Séxtuple (múltiples virus) 3. Bordetella (tos de las perreras) 4. Leptospirosis (según zona) 5. Giardia (según vet) Guardalas en la ficha de tu peludo para no perder el track. 🩺 Crea su ficha en pawfriend.cl

> **18. No hay Premium dueños** — Acá no existe "Premium" para dueños. Es la confusión más común. Todo lo que hace falta para cuidar a tu peludo está en el plan gratis. Para siempre. Sin trial. Sin letra chica. Sin "desbloquea más funciones". Punto. 💛🇨🇱 👉 pawfriend.cl

> **19. Vet a 1,2 km** — Abrís la app. Tocás "buscar vet". Filtrás por tu comuna. Lo tenés a 1,2 km. Con reseñas. Con precios. Con agenda online. Eso no existía en Chile. Ahora sí. Gratis. 📍🐾 pawfriend.cl/veterinarios

> **20. Memorial Rocky** — Rocky. 14 años. Gracias por tanto 🌈 Con permiso de @[familia], hoy honramos a Rocky en Paw Friend. Su Paw Card memorial queda para siempre. Sus fotos. Su historia. Y una Bereavement Chat IA que acompaña cuando el silencio pesa. En Paw Friend no olvidamos. 💛 /en-memoria

### 17.3 Treinta hooks cortos

1. "Antes de ir a la urgencia a las 3 AM, mirá esto"
2. "La app que nadie te dijo que era gratis"
3. "Tu peludo ya tiene su ficha digital. ¿Y la tuya?"
4. "El directorio de vets con precios CLP no existía en Chile"
5. "1 foto → carnet digital en 1 minuto"
6. "Esta Paw Card es 1 en 1.000. Y es de Kai."
7. "Así se ve la ficha clínica de mi gato Ema"
8. "Primera vez que una vet chilena usa esto"
9. "¿Adoptarías a un peludo con ficha médica completa? Acá están"
10. "Si tenés Golden Retriever, tenés que escuchar esto"
11. "Mi peludo tuvo urgencia. Esto me salvó."
12. "No es Premium. Es gratis para siempre."
13. "¿Sabés el tipo de sangre de tu mascota?"
14. "Ema revisa el código antes que yo"
15. "Paw Friend explicado en 15 segundos"
16. "Si vivís en Providencia, mirá este mapa"
17. "Hecho por 1 persona + IA en 2 meses"
18. "Antes tiraba el carnet. Ahora lo escaneo."
19. "¿Por qué este vet te cobra más?"
20. "Mi peludo puede salvar una vida"
21. "Quién dijo que las apps chilenas no eran globales"
22. "Abro 10 Paw Cards y muestro qué salió"
23. "Así es un día construyendo Paw Friend"
24. "La regla de oro antes de cambiar de vet"
25. "3 cosas que te ocultan en los planes premium"
26. "Mi gata es mi PM favorita"
27. "Pregúntale al asistente IA"
28. "Rocky, 14 años, gracias por tanto"
29. "De 3 patas a correr más que todos"
30. "El único lugar en Chile donde vets publican precios"

### 17.4 Quince ideas highlights covers

Todas en formato 1080×1920 (o 1080×1080 cuadrado para cover), fondo gradient brand (purple→gold) con icono del brand-squircle centrado + texto mínimo.

1. **Start aquí** — Icon `33_ai_brain` + texto "Empezá"
2. **Ficha** — Icon `35_pdf_record` + texto "Ficha"
3. **Vets** — Icon `36_handshake_paws` + texto "Vets"
4. **Paw Cards** — Icon custom con paw + sparkle + texto "Cards"
5. **Comunidad** — Icon `52_gift` o paw voices badge + texto "Comunidad"
6. **Emergencias** — Icon `60_emergency` + texto "Urgencia"
7. **Alma** — Logo squircle principal + texto "Alma"
8. **FAQs** — `54_settings` o ? estilizado + texto "Dudas"
9. **Paw Voices** — Badge Paw Voices + texto "Voices"
10. **Paw Companys** — Badge Bronze/Silver/Gold + texto "Sponsors"
11. **Refugios** — `38_shelter` + texto "Adopción"
12. **Memorial** — Corazón + paw suave + texto "Memoria"
13. **Behind scenes** — Icon laptop + Kai + texto "Detrás"
14. **Tips raza** — Paw stylizada + texto "Razas"
15. **Donaciones** — `31_donation` + texto "Donar"

Guardar en `instagram-assets/highlight-covers/` como PNG 1080×1080.

### 17.5 Diez campañas colaborativas potenciales

1. **#AdopciónDelMes con 3 refugios chilenos** — 1 mascota destacada/semana + feature en grid + ficha completa precargada.
2. **Mes de la salud felina con 3 vets especialistas en gatos** — lives + Q&A + tips específicos.
3. **Paw Voices x 5 creadores pet** — 1 mes de rotación, cada uno un pilar temático.
4. **Alianza con pet shop chileno (Paw Partner)** — concurso "Ficha creada = cupón descuento".
5. **Día nacional de las mascotas** (colaboración con medio chileno) — takeover stories + reel mega.
6. **Serie "Vets chilenas" con Colegio Médico Veterinario de Chile** — testimonios, especialidades, educación.
7. **Campaña con seguro para mascotas (Paw Partner)** — "la ficha + el seguro = tranquilidad completa".
8. **Refugio + Paw Company Gold** — sponsor paga 1 mes de alimento + Paw Friend amplifica.
9. **Día mundial de la esterilización** — partner con ONGs locales + directorio filtrado.
10. **Concurso "Mostrá tu Paw Card más rara"** — UGC masivo + engagement alto.

### 17.6 Diez ideas de contenido con veterinarios

1. **Sofia explica "cómo leo una ficha de Paw Friend en 30 segundos"** (reel 30s).
2. **"Una semana en mi clínica con Paw Friend"** — vlog vet (60-90s).
3. **Q&A live con vet invitado/a** (mensual).
4. **"Los 5 mitos más comunes sobre vacunas"** — carousel con vet como autoridad.
5. **Tour clínica de vet featured** — reel 30s mostrando cómo integra ficha digital.
6. **Testimonios cortos en video** (15s cada vet, serie de 5-10).
7. **"Antes de tu próxima consulta, llevá esto anotado"** — tip vet.
8. **Comparativa visual "ficha papel vs digital"** — vet habla.
9. **Live "emergencias comunes en Santiago"** con vet 24h.
10. **"Cómo elijo un vet" — escrito por vet** (metacontenido honesto que construye trust).

### 17.7 Diez ideas de contenido con dueños y mascotas reales

1. **Primer día en Paw Friend** — dueño muestra onboarding (screen recording mobile).
2. **"Así comparto la ficha con mi nuevo vet"** — demo UGC.
3. **"Día en la vida de [mascota]"** — dueño hace vlog y Paw Friend es parte natural (app aparece en manos).
4. **Adopción reciente + ficha precargada** — "llegó con su historia completa".
5. **Comparación antes/después** — dueño con carnet de papel vs ficha digital.
6. **Historia de urgencia resuelta** — dueño cuenta cómo la ficha le salvó el día.
7. **Mascota senior y memorial futuro** — historia pesada con permiso.
8. **"3 cosas que cambié después de Paw Friend"** — dueño confiesa.
9. **Paw Cards unboxing** — dueño abre la suya y reacciona.
10. **"Mi gato ignora el recordatorio. Yo no."** — humor cotidiano + feature.

---

## Cierre

Este plan conecta cada acción de Instagram con una feature real del producto, respeta el tono y las reglas del repo (`CLAUDE.md`, tuteo chileno, no prometer futuros, etc.), y está dimensionado para un founder que puede dedicar 6-10 horas semanales sostenidas.

El activo fundamental que Paw Friend tiene para Instagram no es un catálogo de features — es una **narrativa única**: hecho en Chile, por una persona, con IA, para que la salud de los peludos no sea un privilegio. Esa historia, contada con honestidad y consistencia durante 90 días, vale más que cualquier creativo pagado.

**Próximo paso concreto recomendado**: agendar sesión foto founder + Kai + Ema esta semana. Ese asset desbloquea los primeros 15 posts.

🐾

---

*Documento vivo. Actualizar trimestralmente con aprendizajes y nuevos pilares si emergen.*
