# Prompts para generar sets de assets por audiencia en Claude AI

> **Objetivo**: tener un set coherente de SVGs por cada una de las 4 audiencias de pitch (Inversionistas, Paw Companys, Paw Partners, Paw Voices) + una paleta "Pitch" neutra para elementos compartidos. Cada set se diseña para que el receptor del deck **sienta que fue hecho para él**, no que es el mismo material genérico.
>
> **Creado**: 2026-04-19 · **Fuente**: pivot monetización 2026-04-19 + landing v3 + masterplans pitch.
>
> **Cómo usar**: pega uno de los prompts de abajo en un chat nuevo de [claude.ai](https://claude.ai) (mismo chat donde creaste el logo original, o uno nuevo). Claude devolverá SVG code. Guárdalo en `public/paw-friend-assets/audiences/<audiencia>/<nombre>.svg` y referéncialo en el HTML del deck correspondiente.

---

## 0. Contexto general (copiar esto ANTES de cada prompt)

```
Estoy diseñando assets SVG para Paw Friend, una app chilena que es una
ficha médica digital + directorio de veterinarios + comunidad pet,
100% gratis para dueños. El proyecto fue hecho por una persona en Chile
con apoyo de IA. El corazón es el amor a los peludos.

Tengo un sistema de pitch decks dividido en 4 audiencias, cada una con
su paleta y personalidad. Los SVG deben:

- Ser vectoriales limpios (viewBox, paths simples, sin raster embebido).
- Usar solo los colores de la paleta indicada.
- Tener estilo "flat modern con microdetalles" (no hiperrealista, no
  Material puro, no corporativo serio — cálido y premium).
- Funcionar a 64×64, 128×128 y 512×512 sin perder detalle.
- Usar bordes redondeados (radius ~12-18% del ancho del elemento).
- Incluir `stroke-linecap="round"` y `stroke-linejoin="round"` donde
  aplique.
- Ser accesibles: incluir `<title>` y `role="img"`.
- Sin texto embebido (el texto lo pone el HTML).

Entrega: el SVG completo dentro de un bloque ```svg ... ``` y nada más.
Si te pido varios assets, entrega cada uno en un bloque separado con
un comentario `<!-- filename.svg -->` arriba.
```

---

## 1. Paleta · Inversionistas (purple + gold)

- **Primary**: `#9333ea` (brand purple)
- **Accent**: `#eab308` (gold)
- **Dark**: `#581c87` (deep purple)
- **Light bg**: `#faf5ff`
- **Personalidad**: valor, métrica, confianza, ambición realista.
- **Ubicación destino**: `public/paw-friend-assets/audiences/investors/`

### 1.1. Logo del deck Inversionistas (main badge)

**Archivo destino**: `investors_badge.svg`

```
Contexto: [pegar contexto general de sección 0]

Necesito el LOGO/BADGE principal para el deck de inversionistas de Paw
Friend.

Concepto: una huella de pata + un gráfico ascendente (flecha, línea de
crecimiento, o monedas apilándose) fusionados en una sola forma
compacta. Transmite "mascotas + crecimiento", no "mascotas" suelto.

Paleta obligatoria:
- Primary: #9333ea
- Accent: #eab308
- Dark: #581c87

Formato: SVG cuadrado 512×512 con fondo transparente. Estilo flat
moderno con un gradiente lineal 135° de purple → gold en el elemento
principal. Borde sutil o sombra interna opcional.

Composición: la pata en el centro-inferior, el indicador de crecimiento
atravesándola por detrás o saliendo desde ella hacia el cuadrante
superior derecho.

Incluye <title>Paw Friend · Inversionistas</title>.
```

### 1.2. Hero illustration Inversionistas (cover banner)

**Archivo destino**: `investors_hero.svg`

```
Contexto: [pegar contexto general]

Necesito una ilustración horizontal (1200×630, formato OG) para la
portada del deck de inversionistas de Paw Friend.

Escena: una mascota estilizada (perro o gato en silueta flat) sentada
sobre una curva ascendente que representa crecimiento (usa la curva
como "piso" de la mascota, no gráfico aparte). En el fondo, tres
"burbujas de valor" flotantes con mini-iconos adentro: una huella, un
estetoscopio, una casa. Al lado de la mascota, una estrella pequeña
con un signo "+" dentro (representa funcionalidad creciente).

Paleta obligatoria:
- Fondo: gradient radial de #faf5ff al centro a blanco en los bordes
- Curva ascendente: gradient lineal #9333ea → #eab308
- Mascota: #581c87 con acentos en #eab308
- Burbujas: #f3e8ff con borde #d8b4fe

Sin texto. Sin personas. Solo la mascota + curva + burbujas.
```

### 1.3. Icon set Inversionistas (3 iconos temáticos)

**Archivos destino**: `investors_moat.svg`, `investors_market.svg`, `investors_traction.svg`

```
Contexto: [pegar contexto general]

Necesito TRES iconos temáticos para el deck de inversionistas de Paw
Friend. Cada uno en un bloque SVG separado con comentario del filename
arriba. Tamaño: 64×64 cada uno. Stroke 2.5px estilo flat.

Los tres iconos:

1. <!-- investors_moat.svg --> — "Moat técnico". Un escudo con una
   huella de pata dentro. Gradient #9333ea → #581c87.

2. <!-- investors_market.svg --> — "Mercado". Un gráfico de barras
   simple (3 barras crecientes) con una huella chica arriba de la
   barra más alta. Color principal #eab308, barra más alta en
   gradient #9333ea → #eab308.

3. <!-- investors_traction.svg --> — "Tracción". Una línea de curva
   ascendente con tres puntos (nodos) marcados con círculos pequeños,
   el último nodo con una huella superpuesta. Línea en gradient
   #9333ea → #eab308.

Todos con borde redondeado, fondo transparente.
```

---

## 2. Paleta · Paw Companys (deep purple + silver)

- **Primary**: `#9333ea` (brand purple)
- **Deep**: `#581c87` (deep purple)
- **Accent warm**: `#eab308` (gold) para el tier Gold
- **Tier Silver**: `#94a3b8`
- **Tier Bronze**: `#b45309`
- **Personalidad**: corporativo cálido, institucional pero con alma,
  responsabilidad social (no CSR aburrido).
- **Ubicación destino**: `public/paw-friend-assets/audiences/companys/`

### 2.1. Logo Paw Companys (main badge)

**Archivo destino**: `companys_badge.svg`

```
Contexto: [pegar contexto general]

Necesito el LOGO principal del deck de Paw Companys (empresas sponsor
de Paw Friend).

Concepto: una huella de pata dentro de un edificio/torre estilizado
muy simple (2-3 rectángulos verticales formando la silueta de un
building), o una huella con dos anillos concéntricos alrededor
(simbolizando "empresa + impacto extendido"). El concepto debe
transmitir "empresa + comunidad mascota" sin ser cursi.

Paleta obligatoria:
- Primary: #9333ea
- Deep: #581c87
- Accent: #eab308 (usar solo como chispa/estrella en una esquina)

Formato: SVG 512×512 con fondo transparente. Gradient lineal 135°
#581c87 → #9333ea en la figura central. Estrella dorada pequeña en la
esquina superior derecha como "sello institucional".

<title>Paw Friend · Paw Companys</title>
```

### 2.2. Badges de 3 tiers (Bronze / Silver / Gold)

**Archivos destino**: `companys_tier_bronze.svg`, `companys_tier_silver.svg`, `companys_tier_gold.svg`

```
Contexto: [pegar contexto general]

Necesito 3 badges de tier para Paw Companys: Bronze, Silver, Gold.

Cada uno: SVG 256×256, forma de escudo redondeado o medalla circular
con cinta colgante. Dentro del badge: una huella de pata y una etiqueta
con el nivel (solo como forma visual, no texto — el texto lo pone el
HTML). Numeración visual: 1 huella chica para Bronze, 2 para Silver,
3 para Gold.

Paletas:
- Bronze: gradient #92400e → #b45309 → #f59e0b (metal cobrizo)
- Silver: gradient #475569 → #94a3b8 → #e2e8f0 (metal plateado)
- Gold: gradient #a16207 → #eab308 → #fde68a (metal dorado)

Borde sutil más oscuro que el color principal. Pequeña viñeta de
brillo blanco semitransparente en la esquina superior izquierda para
dar efecto 3D flat.

Entregar los 3 en bloques separados con comentarios de filename.
```

### 2.3. Hero institucional (cover banner)

**Archivo destino**: `companys_hero.svg`

```
Contexto: [pegar contexto general]

Necesito una ilustración horizontal 1200×630 para el deck Paw Companys.

Escena: 3 siluetas de edificios de distintos tamaños (el del medio más
alto), cada uno con una huella de pata estilizada como "logo" en la
fachada (proyectada como luz/letrero). Al frente, una fila de 3-4
mascotas diversas en silueta (perro, gato, conejo, ave) mirando los
edificios. Cielo con líneas suaves que sugieren red/conexión.

Paleta:
- Cielo: gradient #1a102b → #581c87 → #9333ea
- Edificios: gradient #f3e8ff → #e9d5ff (claros, se destacan del fondo)
- Huellas en fachadas: #eab308 (dorado, brillan)
- Mascotas siluetas: #581c87
- Líneas de conexión en cielo: #c084fc con opacity 40%

Sin texto. Efecto calmo, aspiracional, no frenético.
```

---

## 3. Paleta · Paw Partners (emerald + warm)

- **Primary**: `#10b981` (emerald)
- **Deep**: `#047857` (emerald dark)
- **Accent**: `#f59e0b` (amber, para el toque comercial cálido)
- **Personalidad**: intercambio, barter, win-win, comercio local cálido.
- **Ubicación destino**: `public/paw-friend-assets/audiences/partners/`

### 3.1. Logo Paw Partners (main badge)

**Archivo destino**: `partners_badge.svg`

```
Contexto: [pegar contexto general]

Necesito el LOGO principal del deck Paw Partners (tiendas,
restaurantes, servicios pet que hacen barter con Paw Friend).

Concepto: dos huellas de pata entrelazadas en un abrazo/intercambio,
formando una figura tipo yin-yang pero con patas. O alternativamente
dos flechas curvas formando un círculo (intercambio) con una huella
pequeña en el centro. El mensaje visual es "dos partes dan y reciben".

Paleta:
- Primary: #10b981
- Deep: #047857
- Accent: #f59e0b (solo en el centro/punto de unión)

Formato: SVG 512×512 transparente. Gradient #047857 → #10b981 en las
dos huellas/flechas. Punto central en #f59e0b con un pequeño halo.

<title>Paw Friend · Paw Partners</title>
```

### 3.2. Icon set Partners (6 iconos de verticales)

**Archivos destino**: `partners_vertical_shop.svg`, `..._food.svg`, `..._service.svg`, `..._insurance.svg`, `..._grooming.svg`, `..._training.svg`

```
Contexto: [pegar contexto general]

Necesito 6 iconos de "vertical comercial" para el deck Paw Partners.
Cada uno representa un tipo de negocio. SVG 80×80, cada uno en bloque
separado con su filename.

1. <!-- partners_vertical_shop.svg --> — tienda: bolsa de compras con
   una huella pequeña encima como logo.

2. <!-- partners_vertical_food.svg --> — restaurante/café pet-friendly:
   taza de café con una huella en el vapor.

3. <!-- partners_vertical_service.svg --> — servicio (walker/sitter):
   correa de perro en forma de corazón.

4. <!-- partners_vertical_insurance.svg --> — seguro pet: escudo con
   una huella y una cruz pequeña.

5. <!-- partners_vertical_grooming.svg --> — peluquería: tijeras con
   una huella como bisagra.

6. <!-- partners_vertical_training.svg --> — entrenador: pelota de
   tenis con una huella y un silbato al lado.

Paleta para los 6:
- Fondo circular detrás del icono: #d1fae5 (emerald light)
- Borde del círculo: #10b981
- Icono principal: gradient #047857 → #10b981
- Detalle amber (huella, chispa): #f59e0b

Stroke 2.5px, estilo flat moderno.
```

### 3.3. Visual "barter" (intercambio)

**Archivo destino**: `partners_barter_visual.svg`

```
Contexto: [pegar contexto general]

Necesito una ilustración HORIZONTAL (800×300) que visualice el
intercambio Paw Partners: izquierda "Tú das", derecha "Recibes", con
una flecha doble (↔) conectándolos.

Izquierda: una silueta de persona/negocio con un cupón de descuento en
la mano (cupón con huella + "%").
Derecha: una app/smartphone con una estrella de visibilidad emergiendo.
Centro: doble flecha curvada (tipo ↔) en gradient emerald → amber.

Paleta:
- Fondo: transparente (o #f0fdf4 muy sutil)
- Izquierda: #047857 a #10b981
- Derecha: #065f46 a #34d399
- Flecha central: gradient #10b981 → #f59e0b → #10b981

Sin texto dentro del SVG. Los labels los pone el HTML.
```

---

## 4. Paleta · Paw Voices (pink + rose)

- **Primary**: `#ec4899` (pink)
- **Deep**: `#be185d` (rose dark)
- **Accent**: `#f59e0b` (amber, calidez)
- **Light bg**: `#fce7f3`
- **Personalidad**: creadores, autenticidad, calidez, comunidad orgánica,
  cero feeling corporativo.
- **Ubicación destino**: `public/paw-friend-assets/audiences/voices/`

### 4.1. Logo Paw Voices (main badge)

**Archivo destino**: `voices_badge.svg`

```
Contexto: [pegar contexto general]

Necesito el LOGO principal del deck Paw Voices (creadores e
influencers peludos aliados a Paw Friend).

Concepto: un micrófono con una huella de pata en el bulbo/cabeza del
mic, o una burbuja de chat con forma de huella. El asset debe sentir
"voz humana auténtica + mascota", NO "influencer corporativo".

Paleta:
- Primary: #ec4899
- Deep: #be185d
- Accent: #f59e0b (pequeño corazón/chispa)

Formato: SVG 512×512 transparente. Gradient 135° #be185d → #ec4899 en
el micrófono/burbuja. Pequeño corazón #f59e0b en esquina inferior
derecha como firma cálida.

<title>Paw Friend · Paw Voices</title>
```

### 4.2. Icon set Voices (4 iconos de plataformas + estilo)

**Archivos destino**: `voices_platform_insta.svg`, `voices_platform_tiktok.svg`, `voices_platform_yt.svg`, `voices_community.svg`

```
Contexto: [pegar contexto general]

Necesito 4 iconos para el deck Paw Voices. SVG 80×80 cada uno. No uses
los logos OFICIALES de las plataformas (copyright), usa REPRESENTACIONES
genéricas del tipo de contenido.

1. <!-- voices_platform_insta.svg --> — "photo/story": cuadro con una
   huella en vez de sol/foto.

2. <!-- voices_platform_tiktok.svg --> — "short video": play triangle
   con una huella dentro del triángulo.

3. <!-- voices_platform_yt.svg --> — "long video": rectángulo
   horizontal (tipo 16:9) con play button formado por una huella.

4. <!-- voices_community.svg --> — "comunidad": 3 burbujas de chat
   superpuestas, cada una con huella pequeña adentro.

Paleta para los 4:
- Fondo circular suave: #fce7f3
- Borde: #ec4899
- Icono principal: gradient #be185d → #ec4899
- Detalle amber (huella, chispa): #f59e0b

Estilo cálido, no tech-corporativo.
```

### 4.3. Hero emocional Voices (cover)

**Archivo destino**: `voices_hero.svg`

```
Contexto: [pegar contexto general]

Necesito una ilustración horizontal 1200×630 para la portada del deck
Paw Voices.

Escena: una mascota (gato o perro indistinguible, silueta cute) frente
a un micrófono con una pata apoyada en él, como si estuviera "contando
una historia". Alrededor, 5-6 burbujas de chat flotando, cada una con
una huella o corazón pequeño adentro. En el fondo, pinceladas suaves
tipo acuarela con las personalidades de colores cálidos.

Paleta:
- Fondo: gradient radial #fce7f3 centro a blanco bordes
- Mascota: #be185d con acentos #ec4899
- Micrófono: gradient #be185d → #ec4899
- Burbujas de chat: #fde68a (amber light), borde #f59e0b
- Pinceladas de fondo: #f9a8d4 opacity 30%

Sin texto. Mood: cálido, auténtico, acogedor. NO frío, NO corporativo.
```

---

## 5. Paleta · Pitch (neutra, uso compartido)

- **Primary**: `#9333ea`
- **Accent**: `#eab308`
- **Mix con las 4 audiencias**: usar cuando algo aparece en el hub
  `/pitch/` o en CTAs compartidos.
- **Ubicación destino**: `public/paw-friend-assets/pitch/`

### 5.1. Logo del hub Pitch (landing con las 4 cards)

**Archivo destino**: `pitch_hub_logo.svg`

```
Contexto: [pegar contexto general]

Necesito el LOGO del HUB del pitch (pawfriend.cl/pitch/), que contiene
las 4 audiencias.

Concepto: una huella de pata en el centro, rodeada de 4 formas
geométricas pequeñas (un círculo, un cuadrado, un triángulo, una
estrella) que representan las 4 audiencias. Las 4 formas en órbita
alrededor de la huella como un mini-sistema solar.

Paleta:
- Huella central: gradient #581c87 → #9333ea
- Forma 1 (inversionistas): #eab308
- Forma 2 (companys): #9333ea
- Forma 3 (partners): #10b981
- Forma 4 (voices): #ec4899

Formato: SVG 512×512 transparente. Las 4 formas del mismo tamaño,
equidistantes, a ~70% del radio desde el centro.

<title>Paw Friend · Pitch Hub</title>
```

### 5.2. OG image para el hub `/pitch/`

**Archivo destino**: `pitch_og_1200x630.svg` (convertir a PNG/JPG después para og:image)

```
Contexto: [pegar contexto general]

Necesito la IMAGEN OG (1200×630) que aparece cuando alguien pega
https://pawfriend.cl/pitch/ en WhatsApp, LinkedIn o email.

Composición:
- Lado izquierdo (50%): el logo de Paw Friend (wordmark horizontal) en
  grande, blanco sobre gradient #1a102b → #581c87 → #9333ea.
- Lado derecho (50%): una cuadrícula 2×2 con las 4 formas/iconos de
  las audiencias (usa el logo del hub como inspiración: círculo
  dorado, cuadrado púrpura, triángulo verde, estrella rosa).
- En la parte inferior centrada: una tira dorada con la tagline "4
  audiencias · 1 link · Hecho en Chile" (puede ir como texto en el
  SVG, usando tu mejor criterio tipográfico; usa una fuente web-safe
  como "Inter" o "system-ui" si no puedes embeber).

Paleta:
- Fondo izquierdo: gradient #1a102b → #581c87 → #9333ea
- Fondo derecho: #faf7ff
- Formas derecha: los 4 colores acento (gold/purple/emerald/rose)
- Tira tagline: gradient #eab308 → #f59e0b

Formato: SVG 1200×630. Si el texto queda raro, déjalo sin texto y
aviso que lo agregaremos en CSS después.
```

### 5.3. Footer signature compartido

**Archivo destino**: `pitch_footer_signature.svg`

```
Contexto: [pegar contexto general]

Necesito una firma visual pequeña (400×80) para usar en el pie de los
4 decks como "versión 2026-04-19 · Hecho en Chile con amor".

Composición: el texto "Paw Friend" en wordmark (puedes reciclar el
wordmark horizontal ya existente en /paw-friend-assets/svg/), con un
corazón 🩷 pequeño al final y una banderita de Chile 🇨🇱 al lado.
Todo en gradient purple → gold.

Formato: SVG 400×80 horizontal. Fondo transparente. Texto
multi-color si es posible, o stroke con gradient.
```

---

## 6. Cómo organizar los archivos después de generarlos

```
public/
└── paw-friend-assets/
    ├── audiences/
    │   ├── investors/
    │   │   ├── investors_badge.svg
    │   │   ├── investors_hero.svg
    │   │   ├── investors_moat.svg
    │   │   ├── investors_market.svg
    │   │   └── investors_traction.svg
    │   ├── companys/
    │   │   ├── companys_badge.svg
    │   │   ├── companys_hero.svg
    │   │   ├── companys_tier_bronze.svg
    │   │   ├── companys_tier_silver.svg
    │   │   └── companys_tier_gold.svg
    │   ├── partners/
    │   │   ├── partners_badge.svg
    │   │   ├── partners_barter_visual.svg
    │   │   └── partners_vertical_*.svg  (6 iconos)
    │   └── voices/
    │       ├── voices_badge.svg
    │       ├── voices_hero.svg
    │       ├── voices_platform_*.svg  (3 iconos)
    │       └── voices_community.svg
    └── pitch/
        ├── pitch_hub_logo.svg
        ├── pitch_og_1200x630.svg  (convertir a JPG/PNG después)
        └── pitch_footer_signature.svg
```

---

## 7. Cómo integrar cada SVG al HTML del deck correspondiente

Una vez generados y guardados en `public/paw-friend-assets/audiences/<audience>/`:

1. **Badge principal**: reemplazar el emoji actual del banner (ej. 💼, 🏢, 🤝, 🎙️) en `public/pitch/index.html` por `<img src="/paw-friend-assets/audiences/<audience>/<audience>_badge.svg" alt="" />`.
2. **Hero**: agregar como background del slide 1 (cover) de cada deck `inversionistas.html` / `companys.html` / `partners.html` / `voices.html`.
3. **Icon set**: reemplazar las referencias a `/paw-friend-assets/Icons%20logos/XX_*.svg` por los nuevos iconos de la audiencia.
4. **Tier badges (solo Companys)**: usar en el slide 4 (tiers Bronze/Silver/Gold) reemplazando los iconos genéricos.

Después de reemplazar:
```bash
npm run build
git add public/paw-friend-assets/audiences/ docs/paw-friend-assets/ public/pitch/ docs/pitch/
git commit -m "feat(pitch): sets de assets por audiencia"
git push
```

---

## 8. Verificación visual rápida antes de integrar

Antes de subir cualquier SVG generado por Claude AI a producción:

1. **Abrir en navegador**: arrastrar el `.svg` a Chrome, verificar que renderiza.
2. **Escalas**: probarlo inline en HTML a 64×64, 128×128, 256×256.
3. **Viewbox**: verificar que el SVG tenga `viewBox="0 0 512 512"` (o el tamaño correcto) y NO tenga `width`/`height` hardcodeados que rompan escalado.
4. **Paleta**: verificar que solo usa los colores de la paleta asignada (abrir con editor de texto, buscar `fill=` y `stroke=`).
5. **Accesibilidad**: confirmar que incluye `<title>` y `role="img"` para screen readers.
6. **Peso**: un SVG de logo típico pesa <4KB. Si pesa >15KB, Claude puede estar devolviendo rutas redundantes; pedirle que lo simplifique.

---

## 9. Plan de generación recomendado (orden de prioridad)

Si no vas a generar los 15+ assets de una sola vez, este es el orden de
mayor a menor impacto visual:

| Prioridad | Asset | Impacto | Tiempo |
|---|---|---|---|
| 1 | `investors_badge.svg` + `companys_badge.svg` + `partners_badge.svg` + `voices_badge.svg` | **Alto** — reemplazan los emoji genéricos del banner de cada card en el hub `/pitch/` | 4 prompts (~10 min) |
| 2 | `pitch_hub_logo.svg` + `pitch_og_1200x630.svg` | **Alto** — preview rico cuando alguien pega `pawfriend.cl/pitch/` en WhatsApp | 2 prompts (~6 min) |
| 3 | `companys_tier_bronze/silver/gold.svg` | **Medio** — mejora el slide 4 de Companys | 1 prompt (3 en un chat) |
| 4 | Heroes de cada audiencia (4 ilustraciones) | **Medio** — mejora los slides de portada de cada deck | 4 prompts (~15 min) |
| 5 | Icon sets temáticos (3+6+3+4 iconos) | **Bajo-medio** — reemplaza los iconos genéricos ya existentes | 4 prompts (~12 min) |
| 6 | `pitch_footer_signature.svg` | **Bajo** — detalle cálido pero no crítico | 1 prompt |

**Total estimado si haces todo**: ~16 prompts, ~60-90 min de trabajo (incluyendo revisión y regeneración de los que salgan mal en el primer intento).

---

## 10. Checklist de control de calidad post-generación

- [ ] Cada badge renderiza bien a 48×48 en un fondo blanco (tamaño del deck-banner-icon actual).
- [ ] Los heroes renderizan bien a 1200×400 en un slide full-width.
- [ ] Los tier badges (Companys) muestran diferencia visual clara entre Bronze / Silver / Gold.
- [ ] Los icon sets son distinguibles entre sí incluso en grayscale (no depender solo del color para diferenciarlos).
- [ ] La OG image `pitch_og_1200x630` cumple ratio 1.91:1 y pesa menos de 300KB (si es PNG/JPG).
- [ ] Ningún SVG tiene texto hardcoded en fuentes custom (solo system-ui, Inter o nada).
- [ ] Todos los SVGs tienen `<title>` para accesibilidad.
- [ ] Paleta respetada: ningún color fuera de la spec de su audiencia.

---

**Contacto**: `pedrosusaeta@pawfriend.cl`
**Versión**: 2026-04-19
**Hecho en Chile con 💜 y mucho amor a los peludos.**
