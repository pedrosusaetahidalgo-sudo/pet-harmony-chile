# Brand Kit · Pitches Paw Friend (SUPERSEDED · ver consolidado)

> ⚠️ **SUPERSEDED 2026-04-29.** Este doc se consolido en:
> - [docs-raiz/BRAND_SYSTEM_2026.md](../docs-raiz/BRAND_SYSTEM_2026.md) — Brand System unificado app + 11 pitches (paletas dialectos en seccion 4 + numeros canonicos en seccion 8)
> - [docs-raiz/ASSETS_GENERATION_PLAN.md](../docs-raiz/ASSETS_GENERATION_PLAN.md) — master ejecutable de prompts por asset + IA recomendada
>
> Se mantiene aqui como referencia rapida de paletas por pitch. La fuente de verdad es BRAND_SYSTEM_2026.md.

Guia de paletas, tipografia y assets a generar (Claude Web / Gamma / Figma) para
cada pitch del folder [pitch-inversionistas/](.). El objetivo es que cada
audiencia reconozca un dialecto visual propio dentro del mismo lenguaje Paw Friend.

---

## 0. Tipografia + sistema base (compartido)

| Elemento | Fuente | Pesos |
|---|---|---|
| Display / headlines | **Fredoka** | 500 / 600 / 700 |
| UI / body | **Plus Jakarta Sans** | 400 / 600 / 700 / 800 / 900 |
| Codigo / mono | **JetBrains Mono** | 400 / 500 / 700 |

Otros tokens compartidos:

- Bordes: 10-18px radius
- Sombras: `0 18px 40px rgba(0,0,0,0.18)` para cards en light, `0 30px 80px rgba(0,0,0,0.4)` para dark
- Hint UI: `←` `→` para navegar, `F` para fullscreen, `P` para imprimir
- Gradientes "grad" siempre con 3 stops (oscuro → marca → acento brillante)

---

## 1. Paletas dedicadas por pitch

### 1.1 PITCH_INVESTORS_LIVE (master genérico)
**Audiencia:** cualquier inversionista — multi-audiencia.
**Tono:** elevado, premium, neutro.

| Token | Hex |
|---|---|
| Primario | `#9333ea` (violeta brand) |
| Acento | `#fde047` (gold light) |
| Soft | `#f3e8ff` |
| Dark | `#0a0612` |
| Headline grad | `#fde047 → #ec4899 → #d8b4fe` |

**Assets:** logo Paw Friend horizontal en blanco · hero con foto Kai · timeline 3 capas (Capture · Identity · Monetize).

---

### 1.2 PITCH_FONDOS (CORFO + Start-Up Chile + Angels/VC)
**Audiencia:** capital de riesgo + estatal + aceleradora.
**Tono:** institucional, transparente, riesgos honestos.

| Token | Hex |
|---|---|
| Primario | `#9333ea` (violeta) |
| Acento | `#eab308` (gold) |
| Verde tracción | `#10b981` (emerald) |
| Dark | `#0a0612` |
| Light bg | `#faf5ff` |
| Headline grad | `#fde047 → #d8b4fe → white` |

**Assets a generar (Claude Web):**
- Icono "Capital semilla" (planta + monedas, paleta violeta+gold)
- Diagrama Sankey "uso de fondos" (sales 60% / producto 25% / sueldo 15%)
- Timeline visual hitos Y1 → Y3
- Foto founder profesional (Pedro · ya disponible) + logo SpA SUSAETA GARNHAM (existente)

---

### 1.3 PITCH_PHARMA
**Audiencia:** Centrovet · Virbac · Zoetis · MSD · Bayer.
**Tono:** RFP-style técnico, validado por evidencia, lenguaje pharma (cohort, accuracy, longitudinal).

| Token | Hex |
|---|---|
| Primario | `#ec4899` (magenta pharma) |
| Soft | `#fce7f3` |
| Dark | `#0a0612 → #831843` |
| Light bg | `#faf5ff` |
| Headline grad | `#fde047 → #ec4899 → #d8b4fe` |

**Assets a generar:**
- Hero: capsula molecular o ADN estilizado en magenta
- Mockup mobile: reminder sponsored "Tu perro Kai necesita Bravecto"
- Diagrama "encuesta vs longitudinal" (split tradicional vs Paw Friend)
- Iconos: cohort, geo-pin, longitudinal arrow

---

### 1.4 PITCH_ASEGURADORAS
**Audiencia:** Sura · BCI · Mapfre · Consorcio · Pet Compañía.
**Tono:** actuarial, financiero, anti-fraude.

| Token | Hex |
|---|---|
| Primario | `#0369a1` (azul confianza) |
| Cyan | `#38bdf8` |
| Dark | `#050b14 → #0c4a6e` |
| Light bg | `#f0f9ff` |
| Trust accent | `#1e40af` (azul institucional) |
| Headline grad | `#fde047 → #38bdf8 → white` |

**Assets a generar:**
- Hero: escudo + huella nasal estilizada en azul
- Mockup: "Tu poliza para Kai · validacion biometrica ✓"
- Diagrama loss ratio antes/después (72% → 58%)
- Iconos: shield, magnifier, contract check

---

### 1.5 PITCH_RETAIL
**Audiencia:** Master Dog · Falabella Pet · Puppis · Pet Star · Vitanimal.
**Tono:** comercial, conversion-driven, lenguaje retail (cart, AOV, suscripcion, CLV).

| Token | Hex |
|---|---|
| Primario | `#ea580c` (naranja retail) |
| Coral acento | `#fb7185` |
| Dark | `#1c0701 → #7c2d12` |
| Light bg | `#fff7ed` |
| Headline grad | `#fde047 → #fb7185 → #fdba74` |

**Assets a generar:**
- Hero: gondola con productos pet en perspectiva isometrica naranja/coral
- Mockup: shopping bag con foto de mascota + bundle automatico
- Diagrama auto-replenish (calendario con bowl que se vacia y rellena)
- Iconos: cart, refresh, bundle, location pin

---

### 1.6 PITCH_GOBIERNO
**Audiencia:** Municipios · SAG · Subdere · Ministerio Salud.
**Tono:** institucional, compliance-first, lenguaje publico (Ley 21.020, fiscalizacion, transparencia).

| Token | Hex |
|---|---|
| Primario | `#1e3a8a` (azul estado) |
| Verde institucional | `#15803d` |
| Acento | `#fbbf24` (gold suave) |
| Dark | `#050816 → #1e40af` |
| Light bg | `#eff6ff` |
| Headline grad | `#4ade80 → #93c5fd → white` |

**Assets a generar:**
- Hero: silueta de mapa Chile + huella nasal + escudo Republica
- Mockup: dashboard fiscalizacion con KPIs Ley 21.020
- Iconos: edificio publico, certificado, microchip, esterilizacion
- Sello "Cumple Ley 21.020" co-branded

---

### 1.7 PITCH_BANCOS
**Audiencia:** BCI · Santander · Itau · BancoEstado · Falabella · Banco Ripley.
**Tono:** loyalty + emocional + cross-sell. Lenguaje banca retail (cashback, CMR, vertical, NPS).

| Token | Hex |
|---|---|
| Primario | `#0f172a` (navy) |
| Acento dorado | `#facc15` |
| Emerald activo | `#10b981` |
| Dark | `#020617 → #1e293b` |
| Light bg | `#f8fafc` |
| Headline grad | `#fde047 → #34d399 → white` |

**Assets a generar:**
- Hero: tarjeta credit-card co-branded con foto de mascota (3D mockup)
- Mockup: app banca + Paw Friend lado a lado, credito vet activable
- Diagrama loyalty journey (registro → uso → cross-sell)
- Iconos: tarjeta, hospital cruz, escudo seguro, hueso dorado

---

### 1.8 PITCH_EDIFICIOS
**Audiencia:** Inmobiliarias (Manquehue, Almagro, Echeverria Izquierdo) · administradoras (EuroAmerica, Edipro, Citu) · HOAs.
**Tono:** operativo, ordenado, retencion del activo.

| Token | Hex |
|---|---|
| Primario | `#475569` (pizarra) |
| Acento | `#84cc16` (lima vibrante) |
| Soft | `#ecfccb` |
| Dark | `#020617 → #334155` |
| Light bg | `#f8fafc` |
| Headline grad | `#bef264 → white → #fde047` |

**Assets a generar:**
- Hero: plano isometrico edificio + mascotas con QR code
- Mockup: panel administrador con registro residentes
- Iconos: edificio, QR, reglamento, conserje
- Sello "Edificio pet-friendly certificado"

---

### 1.9 PITCH_LONGTAIL (B2B residual · 6 verticales)
**Audiencia:** aerolineas · hoteles · academia · hardware IoT · plataformas pet · cremacion.
**Tono:** estrategico, diversificacion, "lo que no entra en los grandes pero suma".

| Token | Hex |
|---|---|
| Primario | `#7c3aed` (violeta vibrante) |
| Teal acento | `#14b8a6` |
| Dark | `#0a0612 → #4c1d95` |
| Light bg | `#faf5ff` |
| Headline grad | `#5eead4 → #fde047 → #d8b4fe` |

**Assets a generar:**
- Hero: 6 iconos en grid (avion, hotel, libro, chip, manos, flor) en gradient violet+teal
- Diagrama "long-tail revenue" (curva con 6 picos pequeños)
- Iconos vertical-by-vertical

---

### 1.10 PITCH_REFUGIOS_PARTNERS
**Audiencia:** Coda Chile · Fundacion Tregua · refugios independientes · pet shops · cafes pet-friendly · paseadores.
**Tono:** comunidad, calidez, sin-fines-de-lucro, barter.

| Token | Hex |
|---|---|
| Primario | `#0d9488` (teal calido) |
| Acento warm | `#f59e0b` (ambar) |
| Soft | `#ccfbf1` / `#fef3c7` |
| Dark | `#042f2e → #115e59` |
| Light bg | `#f0fdfa` |
| Headline grad | `#5eead4 → #fbbf24 → white` |

**Assets a generar:**
- Hero: mascota rescatada + manos abiertas + tienda barrio (estilo ilustracion calida)
- Iconos: casa-corazon, vitrina tienda, badge comunidad
- Sello "Paw Partner" / "Paw Refugio aliado"

---

### 1.11 INSIGHTS_DASHBOARDS_MOCK (data room visual transversal)
**Audiencia:** apendice de cualquier pitch.
**Tono:** technical, premium, neutral.

| Token | Hex |
|---|---|
| Primario | `#0f172a` (ink) |
| Acentos por industria | (multi: pharma magenta, insure azul, retail naranja, gov verde, bank gold) |
| Dark | `#020617` |
| Light bg | `#f8fafc` |

**Assets a generar:** ya están integrados en producto via [paw-friend-assets/IDS/](../paw-friend-assets/IDS/). Embeded directamente en HTML.

---

## 2. Assets transversales · ya disponibles

Todos en [paw-friend-assets/](../paw-friend-assets/) y copia local en [assets/IDS/](assets/IDS/):

| Asset | Path | Uso |
|---|---|---|
| Carnet frente | `assets/IDS/carnet-mascota-frente.svg` | Slide "que recibe el dueno" |
| Carnet reverso | `assets/IDS/carnet-mascota-reverso.svg` | Mismo slide |
| Paw Passport | `assets/IDS/pasaporte-mascota.svg` | Showcase B2B premium |
| Preview combinado | `assets/IDS/preview_v2_carnet_pasaporte_mascota.svg` | Slide hero opcional |
| Logo Paw Friend horizontal | `paw-friend-assets-v2/logo/` | Headers de cada pitch |
| Iconos categoria (voice/partner/company/shelter/investor/vet) | `paw-friend-assets-v2/icons/categories/` | Pages de aplicacion |

---

## 3. Assets a generar (Claude Web · Gamma · Figma)

Lo que falta. Generar en Claude Web pidiendo SVG/PNG al estilo de cada paleta.

### 3.1 Hero ilustraciones por pitch (1280x720 PNG/SVG)

Para cada pitch, una ilustracion hero unica con la paleta correspondiente.
Prompt template para Claude Web:

```
Generame una ilustracion hero estilo flat moderno editorial 1280x720,
paleta exacta [<color1>, <color2>, <color3>], que represente
[<concepto del pitch>]. Sin texto. Composicion centrada con
elementos visuales reconocibles del rubro. Estilo: minimal,
geometrico, con un toque calido. Foto de mascota chilena
opcional como elemento ancla.
```

Conceptos por pitch:
- **PHARMA**: capsula molecular + huella + grafo
- **ASEGURADORAS**: escudo + huella + check verificacion
- **RETAIL**: gondola isometrica + bolsa + bundle
- **GOBIERNO**: silueta Chile + escudo + microchip
- **BANCOS**: tarjeta 3D + huella + monedas doradas
- **EDIFICIOS**: plano edificio isometrico + QR + mascotas
- **LONGTAIL**: 6 iconos en grid violeta-teal
- **FONDOS**: planta creciendo + monedas + grafico ascendente
- **REFUGIOS_PARTNERS**: rescate + barrio + ilustracion calida

### 3.2 Iconos categoria (24x24 SVG · linea + relleno)

Cada pitch usa 3-5 iconos custom. Generar en SVG con stroke 2px y paleta de la industria. Ejemplos:

- Pharma: `cohort.svg`, `geo-pin.svg`, `longitudinal-arrow.svg`, `consent.svg`
- Aseguradoras: `shield.svg`, `magnifier.svg`, `contract-check.svg`, `loss-ratio.svg`
- Retail: `cart.svg`, `refresh.svg`, `bundle.svg`, `location-pin.svg`
- Gobierno: `government-building.svg`, `certificate.svg`, `microchip.svg`, `sterilization.svg`
- Bancos: `credit-card.svg`, `medical-cross.svg`, `policy-shield.svg`, `gold-bone.svg`
- Edificios: `building-iso.svg`, `qr.svg`, `regulation.svg`, `concierge.svg`

### 3.3 Mockups producto (3-5 por pitch)

Para cada pitch, generar mockup de pantalla mobile + dashboard B2B con la
paleta correspondiente. Prompt template:

```
Generame un mockup de pantalla mobile [<que muestra>] estilo iOS
con paleta [<color1>, <color2>, <color3>]. UI elements: header con
logo Paw Friend + categoria, body con [<componente>], CTA boton
en color accent. Realista pero limpio. SVG o PNG 720x1280.
```

Mockups clave:
- PHARMA: reminder sponsored
- ASEGURADORAS: scan biometrico anti-fraude
- RETAIL: bundle alimento auto-replenish
- GOBIERNO: registro ciudadano + QR
- BANCOS: credito vet activable
- EDIFICIOS: registro residente con reglamento
- REFUGIOS: bulk import + transferencia ficha

### 3.4 Diagramas explicativos (1080x720 SVG)

- "Modelo Mapcity" (cliente final no paga, B2B paga por acceso)
- "Modelo de monetizacion B2B" (6 motores en grid con peso de revenue)
- "Apalancamiento founder + IA" (15x faster · 32-65x cheaper)
- "Roadmap Y1-Y3 ARR" (curva conservadora vs optimista)
- "Ley 21.020 compliance flow" (gobierno)
- "Loss ratio antes/después" (aseguradoras)

### 3.5 Sellos / badges co-brandeables

- "Paw Partner"
- "Paw Refugio aliado"
- "Edificio pet-friendly certificado"
- "Cumple Ley 21.020"
- "Co-branded con Paw Friend" (variantes per industria)

Formato: SVG circular ~120x120, color de la industria + acento gold.

---

## 4. Numeros canonicos compartidos

Todo pitch que mencione estos numeros debe usar exactamente estos valores.
Cualquier divergencia es un bug y hay que corregir.

| Concepto | Valor canonico | Etiqueta |
|---|---|---|
| Pets en plataforma | **50.000+** | PROYECCION Q3 2026 |
| Paw Shield accuracy | **100% top-1 con 3 fotos** (test interno con 8 mascotas) | REAL |
| Paw Shield 1 foto | **75% top-1** | REAL |
| Hogares Chile con mascota | **74%** | Estimado dominio publico |
| Mascotas totales Chile | **5M** (perros + gatos) | Estimado dominio publico |
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

Cualquier numero adicional no listado aqui es solo para ese pitch (cohort
modeling especifico, ROI estimate de la industria, etc.) y no requiere
sincronizacion entre documentos.

---

## 5. Como aplicar el brand kit en Claude Web (instrucciones rapidas)

### Para generar un asset:

1. Abrir Claude Web (claude.ai).
2. Pegar el prompt template de seccion 3 con los valores especificos.
3. Pedir explicitamente "exporta como SVG inline" o "PNG con fondo transparente".
4. Descargar y guardar en `pitch-inversionistas/assets/<industria>/<asset>.svg`.

### Para generar un set completo (8 pitches):

Crear un proyecto en Claude Web (con conocimiento persistente) cargando este
archivo `BRAND_KIT_PITCHES.md` + el folder `pitch-inversionistas/assets/IDS/`.
Luego pedir:

> "Genera el set completo de hero ilustraciones para los 8 pitches segun
> seccion 3.1 de BRAND_KIT_PITCHES.md. Mantente fiel a las paletas exactas.
> Devuelve los 8 SVGs en mensajes separados con nombre de archivo."

### Para generar mockups de mobile:

Usar la cuenta de Gamma o Figma con el plugin AI. Pedir:

> "Estilo iOS · paleta [<color>] · [<que muestra>] · Plus Jakarta Sans tipo · gradient."

---

## 6. Hierarchy visual: cuando uso cada deck

| Escenario | Deck a usar |
|---|---|
| Reunion con inversionista no tipificado | `PITCH_INVESTORS_LIVE.html` |
| Reunion CORFO / Start-Up Chile / Angel | `PITCH_FONDOS.html` (+ MD especifico como brief) |
| Reunion Centrovet · Virbac · Zoetis · MSD | `PITCH_PHARMA.html` |
| Reunion Sura · BCI · Mapfre · Consorcio | `PITCH_ASEGURADORAS.html` |
| Reunion Master Dog · Puppis · Falabella | `PITCH_RETAIL.html` |
| Reunion Municipio · SAG · Subdere | `PITCH_GOBIERNO.html` |
| Reunion banco retail | `PITCH_BANCOS.html` |
| Reunion administradora · inmobiliaria | `PITCH_EDIFICIOS.html` |
| Reunion long-tail (aerolinea · academia · hardware) | `PITCH_LONGTAIL.html` |
| Reunion refugio · tienda · cafe pet-friendly | `PITCH_REFUGIOS_PARTNERS.html` |
| Apendice tecnico de cualquier pitch | `INSIGHTS_DASHBOARDS_MOCK.html` |

Antes de cualquier reunion B2B importante:
1. Tener abierto el pitch HTML respectivo.
2. Tener abierto `INSIGHTS_DASHBOARDS_MOCK.html` en otra pestana.
3. Tener abierto el producto live para hacer demo real.
4. Tener email + web visibles en las CTAs finales.

---

## 7. Mantenimiento

- **Cada vez que cambien numeros canonicos** (seccion 4), actualizar TODOS los pitches en el mismo commit.
- **Cuando se agregue un pitch nuevo**, agregar entrada en seccion 1 con paleta y assets.
- **Cuando se actualice un asset**, reemplazar en `paw-friend-assets/` + en `pitch-inversionistas/assets/`.
- **Frecuencia de revision**: cada release importante (cada 30-60 dias).

Ultima actualizacion: 2026-04-29.
