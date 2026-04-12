# Paw Friend — Landing Redesign Blueprint

> Blueprint maestro para rediseñar la landing de Paw Friend (pawfriend.cl) con estándar de Principal Landing Page Designer + Art Director + UX Strategist.
> Autor: Claude Code · Fecha: 2026-04-11
> Archivos auditados: [src/pages/Index.tsx](src/pages/Index.tsx) · [src/components/Hero.tsx](src/components/Hero.tsx) · [src/components/PublicHeader.tsx](src/components/PublicHeader.tsx) · [src/components/LegalFooter.tsx](src/components/LegalFooter.tsx)

---

## 0. Contexto rápido

- **Producto:** Paw Friend, app pet-friendly chilena. Joya de la corona: ficha clínica PDF + directorio público de veterinarios.
- **Estado actual:** la landing transmite valor pero se siente "text-heavy" en ambos viewports. El hero entrega copy antes que producto. El primer impacto no es memorable ni premium.
- **Objetivo del rediseño:** pasar de una landing que *explica* a una landing que *demuestra*, manteniendo tono cálido pet-friendly chileno y estándar top-tier de conversión.
- **No negociables:** tuteo chileno, terminología estandarizada (comuna, ficha clínica, Paw Friend), mobile-first, sin look SaaS plantilla.

---

## 1. Diagnóstico de la landing actual

### 1.1. Por qué el hero se percibe "solo texto"

La auditoría del componente [src/components/Hero.tsx](src/components/Hero.tsx) revela 7 causas raíz acumulativas:

1. **Layout apilado idéntico en desktop y mobile.** Todo el hero está envuelto en `max-w-md` centrado. En desktop, el contenedor ocupa menos de un tercio del viewport horizontal y deja el texto flotando sobre grandes zonas vacías. El hero no aprovecha el ancho del desktop en absoluto.
2. **El visual llega al final.** El bloque de imagen/video está al final del flujo vertical, *después* de badge + H1 + subtítulo + trust row + 2 CTAs + fine print + 3er CTA. En mobile, el visual aparece bajo el fold. El usuario ve una pared de texto antes de ver nada del producto.
3. **3 CTAs compitiendo en el primer viewport.** "Crear cuenta gratis" + "Ya tengo cuenta" + "Soy veterinario · Crear perfil". Un hero con 3 CTAs no tiene hero primario; tiene una encrucijada. Conversión cae porque el usuario duda.
4. **Dos audiencias (B2C y B2B) en la misma pantalla.** El botón de veterinario mezcla la propuesta para dueños de mascotas con la propuesta para clínicas. Rompe la narrativa emocional.
5. **Headline demasiado largo y sin ritmo.** "Cuida la salud de tu mascota con **veterinarios verificados**" son 8 palabras, con el gradiente cayendo al final de la frase, que es la zona de menor atención. Además el mensaje confunde: ¿es una app de ficha médica o un directorio de vets?
6. **Trust elements en forma de lista textual.** Las 3 chips de confianza ("Reseñas verificadas", "Datos seguros", "Sin tarjeta") son texto con íconos pequeños. No dan sensación de prueba; dan sensación de checklist legal.
7. **Imagen hero genérica.** Un stock de Unsplash de un perro jugando. No es producto. No es marca. No demuestra la ficha clínica ni los vets verificados ni los recordatorios. Pierde el momento de oro para *demostrar* el valor.

### 1.2. Errores específicos en desktop

- El hero usa `min-h-[calc(100dvh-4rem)] flex flex-col items-center`, forzando un viewport completo centrado verticalmente con contenido estrecho (`max-w-md`). En una pantalla de 1440×900 esto deja ~800px horizontales desperdiciados.
- No existe un `md:grid-cols-2` ni ningún breakpoint que reorganice a split layout. El desktop es una versión inflada del mobile, no una composición propia.
- Los blobs decorativos están bien pero no sustituyen un visual real de producto.
- La jerarquía de tamaños es razonable (`text-4xl md:text-6xl` en H1) pero se siente apretada por falta de aire lateral.

### 1.3. Errores específicos en mobile

- El orden vertical prioriza texto: badge → H1 → subtítulo → trust row → 2 CTAs → fine print → 3er CTA → imagen. En un iPhone 13 (844px de alto útil) el usuario ve ~600px de texto antes de llegar al visual.
- El 3er CTA "Soy veterinario" con su badge "¿Eres vet?" añade ruido visual justo donde el usuario debería decidir "Crear cuenta gratis".
- Las 3 chips de trust row colapsan en 2 líneas en pantallas estrechas y desordenan el ritmo.
- El fine print ("Desde $3.990/mes · Cancela cuando quieras · Sin tarjeta") duplica información que ya está en el badge y en el CTA.

### 1.4. Qué debilita el primer impacto

- **Ausencia de un elemento visual "ícono".** No hay una sola imagen que el usuario pueda recordar 10 segundos después de salir.
- **Todo compite por el mismo peso.** Badge, H1, subtítulo, trust row, CTAs y fine print tienen tamaños relativamente parecidos, sin jerarquía dramática.
- **Paleta correcta pero sin punto focal.** Los gradientes warm están bien pero no hay un color que "ancle" la mirada en un punto específico.
- **Falta prueba social con cara.** No hay rostros, avatares, logos de clínicas ni testimonios en el hero.
- **El fondo es plano.** Dos blobs blur + color sólido. Se percibe como plantilla shadcn estándar, no como una marca con dirección de arte propia.

### 1.5. Problemas más allá del hero

- **Sección "beneficios" es un grid de 3 cards con ícono arriba.** Exactamente el layout genérico SaaS que queremos evitar.
- **Sección "3 pasos"** es visualmente linda (círculos con números y línea conectora) pero muy larga verticalmente en mobile.
- **Stats del mercado chileno** son buen contenido pero están envueltos en otro bloque de ¨card + card + card¨ idéntico al anterior. Todo rima visualmente con todo.
- **CTA para veterinarios** es un card gris simple que pasa desapercibido.
- **FAQ** está bien pero sin divisor visual fuerte de la sección anterior.

---

## 2. Nueva dirección de arte

### 2.1. Personalidad visual

**"Cálido clínico."** La intersección entre la seriedad confiable de un producto de salud (líneas limpias, datos claros, tipografía sólida) y la calidez de la relación con una mascota (tonos duraznos, ámbar suave, fotografía emocional de mascotas chilenas). Es "Apple Health se encontró con un veterinario de barrio".

### 2.2. Mood

- **Orden sin frialdad.** Cada elemento tiene su sitio, pero respira.
- **Emoción sin cursilería.** Fotos de mascotas reales, no ilustraciones infantiles.
- **Premium sin corporativo.** Tipografía grande, mucho blanco, pero con detalles hechos a mano (un stroke, un sticker, una tarjeta rotada).
- **Chileno sin folclor.** Tomas en cocinas, living rooms, parques urbanos reconocibles (Santiago, Viña, Concepción). No huasos, no mascotas disfrazadas.

### 2.3. Referencias estéticas

| Referencia | Qué tomamos |
|---|---|
| **Linear / Arc / Raycast** | Device frames premium, shadows suaves, microcopy preciso |
| **Airbnb landings 2023+** | Fotografía editorial cálida, tipografía grande, mucho aire |
| **Notion / Superhuman** | Tarjetas flotantes demostrando producto encima de backgrounds suaves |
| **Kinfolk / Cereal Magazine** | Ritmo editorial, blancos amplios, imágenes que respiran |
| **Apple Health / Fitness+** | Mezcla de seriedad médica y emoción humana |
| **Oatly / Liquid Death** | Personalidad marcada, detalles hechos a mano, no genérico |

**No queremos:** Framer templates, ilustraciones Lottie genéricas, isométricos 3D estilo fintech 2021, fondos con grids de puntos, gradientes eléctricos tipo Vercel.

### 2.4. Primeros 3 segundos

Cuando un usuario aterriza, debe sentir (en este orden):

1. **"Esto es bonito y está hecho con cuidado."** (estética)
2. **"Es para cuidar la salud de mi mascota."** (claridad)
3. **"Parece fácil y real."** (confianza)

Todo lo demás (features, planes, vets, stats) puede esperar al scroll.

### 2.5. Balance emoción/producto/confianza

- **40% emoción** — fotografía de la mascota y el dueño, calidez del lenguaje.
- **40% producto** — el device frame mostrando la ficha clínica real.
- **20% confianza** — prueba social compacta, badge "Hecho en Chile", testimonios más abajo.

Ninguno al 100%. La landing actual está ~80% producto textual / 20% emoción falsa (la foto stock).

---

## 3. Estrategia del hero section

### 3.1. Objetivo

**Convertir una visita fría en un clic de "Crear cuenta gratis" en menos de 10 segundos**, dejándole al usuario una imagen mental de qué es Paw Friend (no qué hace, qué *es*).

### 3.2. 3 conceptos creativos evaluados

#### Concepto A — "Ficha viva" (device frame + tarjetas flotantes) ⭐ **RECOMENDADO**

Split layout 55/45 en desktop. Izquierda copy compacto, derecha un **device frame** (phone) mostrando la ficha clínica real de una mascota ("Firulais · Beagle · 4 años"), con 2–3 tarjetas flotantes que salen del device:

- Card "Próxima vacuna en 6 días"
- Card "Vet verificado a 1.2 km"
- Card "Recordatorio enviado ✓"

Fondo suave con blobs cálidos (duraznos + amber). Una foto recortada de un perro real asoma por detrás del device para romper el rectángulo y añadir emoción.

**Fortalezas:** muestra producto real en 2 segundos, mantiene calidez con la mascota, las tarjetas flotantes sirven como prueba social y demostración simultáneas.
**Debilidades:** requiere mockups de calidad y foto con recorte limpio.

#### Concepto B — "Retrato editorial cálido"

Full-bleed: fotografía editorial de un dueño chileno en su casa con su mascota (golden retriever, o mestizo chileno auténtico). Tratamiento cálido tipo Kinfolk/Airbnb. Overlay degradado suave en la esquina superior izquierda para soportar el copy. Un único chip flotante abajo a la derecha con una mini-card ("Próxima vacuna en 6 días ✓").

**Fortalezas:** máximo impacto emocional, memorable, muy distintivo.
**Debilidades:** sacrifica claridad de producto; riesgo de parecer landing de fundación de adopción o marca de comida para perros.

#### Concepto C — "La tarjeta como héroe"

El visual dominante es la propia tarjeta de ficha clínica Paw Friend, aislada, tamaño XL, con tilt 3D suave, glow cálido y microdetalles (sello "verificado", próxima vacuna, stats de salud). Copy compacto a la izquierda. Estética Linear/Arc.

**Fortalezas:** muestra producto de forma icónica, máximo look premium, muy "tech company".
**Debilidades:** pierde calidez pet-friendly; se siente más cercano a un SaaS B2B que a una app emocional.

### 3.3. Recomendación principal: **Concepto A**

**Justificación:** es el único concepto que resuelve los 4 problemas del hero actual simultáneamente:

1. Muestra **producto real** en los primeros 2 segundos (hoy la landing no lo hace).
2. Mantiene **calidez pet-friendly** gracias a la foto del perro.
3. Entrega **prueba social dentro del visual** vía las tarjetas flotantes.
4. Justifica **CTAs simples** porque el valor ya quedó demostrado visualmente.

El Concepto B es más bonito como foto pero pierde el "demuestra qué hace"; el Concepto C es más premium pero pierde alma. A es el punto dulce premium + conversión + pet-friendly.

### 3.4. Estructura de copy del hero (constrainada)

Exactamente estos elementos, en este orden, sin añadidos:

| Elemento | Contenido propuesto | Reglas |
|---|---|---|
| **Badge** | `🐾 Hecho en Chile` | Máx 3 palabras + emoji opcional |
| **Headline (H1)** | `La salud de tu mascota, en un solo lugar.` | Máx 7 palabras, 1 línea en desktop, máx 2 en mobile |
| **Subheadline** | `Ficha clínica digital, recordatorios automáticos y veterinarios verificados cerca de ti.` | Máx 16 palabras, 1 oración, sin **bold** intrusivo |
| **CTA primaria** | `Crear cuenta gratis` | Solid, color primary, ícono opcional a la derecha |
| **CTA secundaria** | `Ver cómo funciona` | Ghost/link, scroll suave a sección 3-pasos, **no** navega |
| **Visual dominante** | Device frame con ficha clínica + 2 tarjetas flotantes + foto recortada de mascota asomándose | Ocupa mínimo 40% del viewport horizontal en desktop, 45% de la altura en mobile |
| **Bloque de confianza** | 4 avatares apilados + `4.9 ⭐ · +1.200 dueños en Chile` | Compacto, una sola línea |

**Lo que NO debe existir en el hero:**
- CTA para veterinarios (va en sección dedicada más abajo).
- Fine print de precios ("desde $3.990/mes...").
- Chips de "Datos seguros", "Sin tarjeta", "Reseñas verificadas" como texto separado.
- Lista de features.
- Segunda variante del headline.
- Un segundo visual decorativo compitiendo con el principal.

### 3.5. Layout del hero — Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar (64px, sticky, fondo translúcido)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [55% ancho]                  [45% ancho]                  │
│                                                             │
│   Badge                        ┌──────────────┐             │
│                                │              │             │
│   H1 (grande)                  │   Device     │  ← card     │
│   H1 (segunda línea si)        │   Frame      │    flotante │
│                                │              │             │
│   Subhead                      │   Ficha      │  ← card     │
│                                │   clínica    │    flotante │
│   [CTA primary] [CTA ghost]    │              │             │
│                                └──────────────┘             │
│   • • • • 4.9 ⭐ +1.200           🐕 ← foto recortada       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Grid: `grid md:grid-cols-[1.15fr_0.85fr] gap-12 items-center`
- Padding vertical: `py-20 md:py-28`
- Max width contenedor: `max-w-6xl`
- El visual asoma ligeramente por el borde derecho para sensación editorial.

### 3.6. Layout del hero — Mobile (375–414px)

```
┌────────────────────┐
│ Navbar compacto    │
├────────────────────┤
│                    │
│      Badge         │
│                    │
│     H1 grande      │
│     (máx 2 líneas) │
│                    │
│    Subheadline     │
│    (máx 2 líneas)  │
│                    │
│  ┌──────────────┐  │
│  │              │  │
│  │ Device frame │  │
│  │ + 1 card     │  │
│  │ flotante     │  │
│  │              │  │
│  └──────────────┘  │
│                    │
│  [CTA primary]     │  ← full-width
│  [CTA ghost]       │  ← más pequeño
│                    │
│ • • • 4.9 ⭐ +1.200 │
│                    │
│        ↓           │
└────────────────────┘
```

- El **visual va entre el subtítulo y los CTAs**, no al final. Este es el fix #1 del rediseño.
- Solo 1 tarjeta flotante en mobile (no 2 o 3).
- Foto de mascota puede integrarse al interior del device frame o eliminarse por completo en mobile para no sobrecargar.
- CTA ghost tiene menor altura que la primaria para jerarquía inmediata.

### 3.7. Proporción ideal texto/visual

- **Desktop:** 45% texto / 55% visual. El visual gana.
- **Mobile:** 55% texto / 45% visual. El texto gana solo por milímetros porque el visual no puede achicarse más sin perder legibilidad.

### 3.8. Qué NO debe pasar en el hero

- Que haya más de **1 botón principal**.
- Que el visual sea una foto stock sin contexto de producto.
- Que el usuario vea una pared de texto antes del visual en mobile.
- Que se mezclen B2C y B2B.
- Que el fine print de precios viva en el hero.
- Que el hero ocupe menos de 85vh en desktop o más de 100dvh en mobile.
- Que el fondo sea un color plano sin textura/blobs/gradiente sutil.

---

## 4. Arquitectura completa de la landing

Orden de secciones después del rediseño:

### Sección 1 · Hero "Ficha viva"
- **Propósito:** impacto visual + promesa + CTA primaria.
- **Contenido:** ver Sección 3 de este documento.
- **Formato visual:** split layout desktop, stack mobile, device frame + foto + tarjetas.
- **Prioridad UX:** crítica.
- **Notas mobile:** visual entre subtítulo y CTAs, 1 sola card flotante.
- **Errores a evitar:** ya listados en 3.8.

### Sección 2 · Logos / prueba social pasiva (banda delgada)
- **Propósito:** validación instantánea antes de la explicación.
- **Contenido:** "Veterinarios que ya usan Paw Friend" + 4–6 logos de clínicas reales en grayscale, más un "+40 clínicas" al final.
- **Formato:** banda horizontal a ancho completo, fondo neutro (`bg-muted/30`), padding `py-8`.
- **Prioridad UX:** alta (refuerza confianza antes de vender).
- **Notas mobile:** scroll horizontal con fade en los bordes; no grid apilado.
- **Errores a evitar:** logos a color (rompen armonía), logos inventados (legal y confianza).

### Sección 3 · Demostración en 3 pasos (reemplazo de "cómo funciona")
- **Propósito:** mostrar el flujo real del producto, no describirlo.
- **Contenido:** 3 pasos, cada uno con un **screenshot grande** de la pantalla correspondiente en mobile frame, copy lateral de máximo 2 líneas:
  1. Crea el perfil de tu mascota.
  2. Encuentra tu veterinario cerca.
  3. Lleva la ficha clínica siempre contigo.
- **Formato visual:** alternado izquierda/derecha por paso (zig-zag), cada fila tiene screenshot + copy breve, con separación generosa entre filas.
- **Prioridad UX:** alta.
- **Notas mobile:** todo apilado, pero con screenshots grandes (no miniaturas). Separador visual sutil entre pasos.
- **Errores a evitar:** reemplazar screenshots por íconos (grid de 3 cards como ahora). Volver al look plantilla.

### Sección 4 · La joya — Ficha clínica PDF
- **Propósito:** destacar el feature diferenciador principal (la joya de la corona según [CLAUDE.md](CLAUDE.md)).
- **Contenido:** headline "Una ficha clínica que cualquier veterinario puede leer" + imagen del PDF real generado + 3 bullets con check (vacunas, alergias, historial) + CTA "Ver ejemplo".
- **Formato visual:** split horizontal con el PDF como mockup dominante (inclinado o con drop shadow), copy a un lado, bullets apilados.
- **Prioridad UX:** alta (es el valor único).
- **Notas mobile:** PDF mockup arriba, copy abajo, stack clásico.
- **Errores a evitar:** volver a explicarlo con texto. La imagen del PDF debe hacer todo el trabajo.

### Sección 5 · Directorio de veterinarios verificados
- **Propósito:** destacar la segunda joya.
- **Contenido:** headline "Encuentra al veterinario ideal en tu comuna" + mapa estilizado de Santiago con pines + 3 tarjetas de vets de muestra (nombre, estrellas, comuna) + CTA "Explorar directorio".
- **Formato visual:** mapa como background decorativo + tarjetas flotando sobre él.
- **Prioridad UX:** alta.
- **Notas mobile:** solo 1 tarjeta de vet visible más ghost de la siguiente, scroll horizontal opcional.
- **Errores a evitar:** mostrar el mapa Leaflet real (pesado). Es un mockup estático.

### Sección 6 · Stats del mercado chileno (compactada)
- **Propósito:** justificación emocional con datos.
- **Contenido:** mantener los 3 stats actuales (80%, 55%, 27%) pero **acortar copy** y cambiar la presentación.
- **Formato visual:** una sola tarjeta amplia con fondo cálido gradiente, 3 números grandes en una fila, copy mínimo debajo de cada uno, fuente al pie.
- **Prioridad UX:** media.
- **Notas mobile:** números apilados verticalmente, manteniendo tamaño grande.
- **Errores a evitar:** 3 cards separadas (redundante con otras secciones). Este bloque debe sentirse como un *manifesto*, no como un grid más.

### Sección 7 · Testimonios (nueva — crítica)
- **Propósito:** prueba social real con caras.
- **Contenido:** 2–3 testimonios de dueños reales con foto, nombre, comuna, mascota, quote breve. Opcionalmente 1 testimonio de veterinario.
- **Formato visual:** carrusel horizontal en desktop (2 visibles), stack vertical en mobile.
- **Prioridad UX:** alta.
- **Notas mobile:** swipe horizontal con dots de paginación.
- **Errores a evitar:** testimonios genéricos ("great app, 5 stars"). Deben tener especificidad chilena ("Mi gato Tomás vive en Ñuñoa y...").

### Sección 8 · Para veterinarios (CTA B2B dedicado)
- **Propósito:** reservar una sección específica para la audiencia B2B, **fuera** del hero.
- **Contenido:** headline "¿Tienes una clínica veterinaria?" + bullets breves (más pacientes, ficha compartida, agenda sincronizada) + CTA "Ver planes para vets" + mini-visual del dashboard.
- **Formato visual:** banda con fondo distinto (más oscuro o con textura) para separarla del flujo B2C.
- **Prioridad UX:** media.
- **Notas mobile:** stack simple, CTA full-width.
- **Errores a evitar:** meter esta sección arriba del fold o dentro del hero.

### Sección 9 · FAQ
- **Propósito:** resolver objeciones justo antes del CTA final.
- **Contenido:** mantener las 4 preguntas actuales, pulir copy.
- **Formato visual:** accordion estilizado, no el shadcn default. Spacing generoso.
- **Prioridad UX:** media.
- **Notas mobile:** misma estructura.
- **Errores a evitar:** más de 6 preguntas (dispersa atención).

### Sección 10 · CTA final + footer
- **Propósito:** último recordatorio con fuerza.
- **Contenido:** headline "Empieza a cuidar a tu mascota hoy" + 1 botón grande "Crear cuenta gratis" + "Sin tarjeta · Cancelas cuando quieras".
- **Formato visual:** banda a ancho completo con gradiente cálido, texto blanco, botón contrastante.
- **Prioridad UX:** crítica.
- **Notas mobile:** botón full-width.
- **Errores a evitar:** repetir los 3 beneficios otra vez.

---

## 5. Sistema de jerarquía visual

### 5.1. Escala tipográfica (Tailwind mapping)

| Rol | Desktop | Mobile | Peso | Uso |
|---|---|---|---|---|
| **Display / H1** | `text-6xl md:text-7xl` | `text-4xl` | `font-bold` o `font-black` | Solo hero |
| **H2 sección** | `text-4xl md:text-5xl` | `text-3xl` | `font-bold` | Inicio de cada sección |
| **H3 subsección** | `text-2xl` | `text-xl` | `font-semibold` | Dentro de cards o steps |
| **Lead (subheadline)** | `text-lg md:text-xl` | `text-base` | `font-normal` | Un solo párrafo bajo H1/H2 |
| **Body** | `text-base` | `text-sm` | `font-normal` | Párrafos y descripciones |
| **Caption** | `text-xs` | `text-xs` | `font-medium` | Fine print, labels, badges |

**Regla fuerte:** entre H1 y el siguiente nivel debe haber al menos **2 pasos de diferencia de tamaño**, no 1. Eso es lo que da la jerarquía dramática premium.

### 5.2. Reglas de copy por bloque

| Bloque | Máx palabras | Máx líneas | Notas |
|---|---|---|---|
| Badge | 4 | 1 | Con o sin emoji |
| H1 hero | 7 | 1 desktop / 2 mobile | Sin adornos innecesarios |
| Subheadline hero | 16 | 1 oración | Sin bold dentro, sin puntos suspensivos |
| CTA primaria | 3 | 1 | Verbo de acción al inicio |
| CTA secundaria | 3 | 1 | Más suave |
| H2 sección | 8 | 1 | Declarativo, no pregunta |
| Descripción de feature | 18 | 2 | Enfocado en beneficio, no feature |
| Testimonio | 25 | 2–3 | Voz real, específica |
| FAQ pregunta | 10 | 1 | Directa |
| FAQ respuesta | 40 | 3–4 | Informativa sin ser manual |

**Lectura rápida:** si un bloque excede estos límites, sobra texto. No sobra diseño.

### 5.3. Spacing rhythm

Sistema vertical basado en múltiplos de 8:

- **Entre secciones:** `py-20 md:py-28` (80–112px).
- **Entre H2 y su lead:** `mb-4` (16px).
- **Entre lead y contenido:** `mb-10 md:mb-14` (40–56px).
- **Entre cards dentro de un grid:** `gap-6 md:gap-8`.
- **Padding interno de cards:** `p-6 md:p-8`.

**Regla crítica:** las secciones deben respirar más de lo que creen los desarrolladores. Si parece "demasiado aire", está en el punto correcto.

### 5.4. Densidad

- **Hero:** densidad muy baja. Mucho blanco, pocos elementos, cada uno grande.
- **Secciones 3–5:** densidad media. Grids visuales con componentes grandes.
- **Stats y testimonios:** densidad baja.
- **FAQ y footer:** densidad media-alta (ok para información operativa).

---

## 6. Sistema visual

### 6.1. Color

Basado en el palette existente (`bg-hero-gradient`, `bg-warm-gradient`, `primary` púrpura) pero refinado:

| Rol | Token | Uso |
|---|---|---|
| **Primary** | púrpura existente (`primary`) | CTAs principales, headings destacados |
| **Accent cálido** | ámbar `amber-500` / durazno | Highlights, hover states, gradientes |
| **Accent emocional** | rosa `rose-500` | Acentos pequeños, nunca bloques grandes |
| **Superficie base** | `background` (blanco hueso) | Fondo principal |
| **Superficie secundaria** | `muted/30` o `neutral-50` | Secciones alternadas |
| **Texto principal** | `foreground` | Headings |
| **Texto secundario** | `muted-foreground` | Body, captions |

**Regla:** ninguna sección puede usar los 3 acentos simultáneamente. Elegir 1 acento dominante por sección.

### 6.2. Contraste

- H1 y H2 a contraste máximo con el fondo.
- Body a contraste cómodo, no máximo (evitar fatiga visual).
- CTAs primarios a contraste máximo.
- Badges y captions pueden ser de contraste bajo.

### 6.3. Fondos y superficies

- **Hero:** gradiente suave tipo "sunrise cálido" (durazno → blanco → violeta claro) + 2 blobs blur + posible textura de ruido muy sutil (grain).
- **Secciones alternadas:** blanco puro → neutral-50 → blanco → warm-gradient → blanco → etc. Ritmo alterno para marcar separación sin líneas duras.
- **CTA final:** banda con gradiente warm potente a ancho completo.

### 6.4. Bordes

- Bordes de cards: `border border-neutral-200/60` (muy sutiles) o sin borde con solo sombra.
- Bordes de CTAs primarios: sin borde, solo color sólido.
- Bordes de CTAs secundarios: `border-2` con color primary semi-transparente.
- Radius estándar: `rounded-2xl` (16px) para cards y botones grandes, `rounded-full` para badges y pills.

### 6.5. Sombras

Sistema de 3 niveles:

- **Sutil:** `shadow-sm` — badges, chips.
- **Media:** `shadow-lg` — cards estándar, CTAs.
- **Dramática:** `shadow-2xl` o shadow custom cálida — device frame del hero, mockup de PDF.

Las sombras deben tener un **tinte cálido**, no gris neutro. Ej: `shadow: 0 25px 50px -12px rgba(251, 146, 60, 0.15)`.

### 6.6. Iconografía

- Mantener `lucide-react` como base.
- **Tamaño estándar:** 20px inline, 24px en bloques, 40px en círculos destacados.
- **Stroke:** `strokeWidth={1.75}` (más finos que el default de Lucide) para sensación premium.
- **Color:** heredar del contenedor, evitar colores hardcodeados.
- Evitar mezclar estilos (no meter `react-icons` decorativos junto a Lucide).

### 6.7. Ilustraciones

- **Mínimo uso.** Preferir fotografía real de mascotas.
- Si se usan, deben ser custom (no packs stock). Una línea estilística homogénea.
- Nunca Lottie animaciones genéricas.

### 6.8. Mockups

- **Device frame:** estilo iPhone minimalista, sin notch visible si es posible, o con notch bien integrado.
- **PDF mockup:** página A4 con drop shadow suave, ligera rotación (-2° a -4°), con marcas de bordes redondeados.
- **Tarjetas flotantes:** fondo blanco puro, `rounded-2xl`, sombra sutil, ícono pequeño a la izquierda, texto corto a la derecha.

### 6.9. Fotografía

- **Sujetos:** mascotas reales chilenas (perros mestizos, gatos criollos, no exclusivamente razas exóticas).
- **Escenarios:** interiores cálidos (cocinas, living rooms), parques reconocibles.
- **Tratamiento de color:** cálido, tonos duraznos/ámbar, contraste suave, nunca desaturado a grayscale ni sobreexpuesto azul frío.
- **Encuadre:** un poco cinematográfico (16:9 o 4:5), no fotos cuadradas de stock.
- **Personas:** cuando aparezcan, rostros visibles, diversidad real chilena, nunca modelos con look norteamericano de archivo.

---

## 7. Estrategia mobile-first

### 7.1. Cómo debe cambiar el hero en mobile

- **Orden exacto:** Navbar → Badge → H1 → Subheadline → **Visual** → CTA primary → CTA ghost → Bloque de confianza.
- El visual **nunca** debe ir al final como hoy.
- Altura total del hero en mobile: **máximo 100dvh**, idealmente 95dvh dejando peek del siguiente bloque.

### 7.2. Elementos a colapsar

- Trust chips → 1 sola línea con avatares + rating.
- CTA veterinarios → se elimina del hero.
- Fine print de precios → se elimina del hero.
- Segundo visual (blobs decorativos) → máximo 1 blob visible, o ninguno.

### 7.3. Qué texto reducir

- H1: ya está corto si aplicamos la regla de 7 palabras.
- Subheadline: cortar "cerca de ti" si es necesario ganar 1 línea.
- Badge: reducir a 2 palabras si está muy apretado.

### 7.4. Qué visual priorizar

- Device frame con ficha clínica dentro.
- 1 sola tarjeta flotante (la más impactante: "Próxima vacuna en 6 días").
- Eliminar foto recortada de la mascota en mobile si genera problemas de composición.

### 7.5. Errores comunes de landing mobile a evitar

- **Hero con `min-h-screen` + contenido apilado vertical centrado.** Obliga al usuario a scroll para ver cualquier cosa tras el fold.
- **Botones de 36px de alto.** Mínimo 48px (tap target).
- **H1 con 4+ líneas.** Se come el viewport.
- **Imágenes hero que cargan lazy.** La hero image va con `loading="eager"` y `fetchPriority="high"`.
- **Fine print al lado de CTAs.** Distrae del tap.
- **Scroll horizontal accidental** por elementos que sobresalen.
- **Hover effects sin fallback tap.** En mobile el hover no existe.

---

## 8. Dirección para componentes clave

### 8.1. Navbar
- Altura: 64px desktop, 56px mobile.
- Fondo translúcido (`backdrop-blur`) con `bg-background/80`.
- Logo a la izquierda (wordmark + pawprint).
- Links centrales solo en desktop: "Cómo funciona", "Veterinarios", "Precios", "Para vets".
- CTA a la derecha: "Crear cuenta" solid + "Entrar" ghost.
- Mobile: hamburger → drawer desde la derecha con los mismos links apilados.
- Sin borde inferior duro; usar sombra muy sutil al hacer scroll.

### 8.2. Hero
- Ya detallado en Sección 3.

### 8.3. CTAs
- **Primario:** altura 52px desktop / 56px mobile, `rounded-2xl`, fondo primary, texto blanco, ícono opcional a la derecha, sombra media cálida.
- **Secundario:** mismo tamaño, fondo transparente, borde 2px primary/30, texto primary. O variante ghost sin borde para hero.
- **Terciario:** solo texto subrayado al hover, tamaño sm.
- **Estados:** hover eleva sombra y escala 1.02, active baja a 0.98. Focus ring accesible.

### 8.4. Social proof
- **Banda de logos:** grayscale 100% por defecto, color al hover en desktop (en mobile color directo).
- **Ratings agregados:** avatares apilados (4, con -space-x-2) + estrella + "4.9 · +1.200 dueños".
- **Testimonios:** card con foto circular 56px, nombre en bold, comuna + mascota en caption, quote en body, sin bordes pero con sombra sutil.

### 8.5. Feature cards
- **No grid de 3 con ícono arriba.** Eso es exactamente el antipatrón a evitar.
- En su lugar: filas alternadas con screenshot grande + copy lateral (zig-zag).
- Si hay que usar grid, mínimo 2 columnas (no 3), con cada card mostrando un mockup real + título + 1 bullet.

### 8.6. Testimonios
- Ver 8.4.
- En carrusel desktop (2 visibles), stack mobile con swipe.
- Nunca más de 3 visibles al mismo tiempo.

### 8.7. Bloques de beneficios
- Reemplazar el grid actual de 3 beneficios por **1 bloque con un mockup grande y 3 bullets de apoyo** a un lado. Menos repetición, más impacto.

### 8.8. FAQ
- Accordion con `rounded-2xl` en cada item, sin bordes, fondo `neutral-50` suave.
- Ícono chevron en vez de flecha.
- Solo 1 abierto a la vez, el primero abierto por defecto.
- Spacing generoso entre items (12px).

### 8.9. Footer
- Fondo más oscuro que el body (neutral-900 o similar).
- 3 columnas desktop: Producto / Empresa / Legal.
- Wordmark + tagline breve a la izquierda.
- Redes sociales como íconos pequeños.
- Copyright y línea legal al final.
- Mobile: accordion por columna o stack simple.

### 8.10. Empty spaces / separadores
- **No usar `<hr>` ni divisores duros.** Usar cambio de fondo entre secciones, spacing generoso, o wave/blob decorativo muy sutil.
- Entre sección y sección, **mínimo 80px de padding vertical**.
- Si una sección necesita un separador visual, preferir un gradiente fade o un blob decorativo.

---

## 9. Lista priorizada de cambios

### 9.1. Críticos (hacer primero — máximo salto de calidad)

1. **Rehacer el hero por completo** usando el Concepto A. Split layout en desktop, visual primero en mobile.
2. **Eliminar el 3er CTA de veterinarios del hero.** Trasladarlo a Sección 8 dedicada.
3. **Reemplazar la imagen stock por un device frame real con mockup de la ficha clínica** + 2 tarjetas flotantes.
4. **Acortar el headline a máximo 7 palabras.**
5. **Eliminar el fine print debajo de los CTAs del hero.**
6. **Arreglar el orden en mobile:** visual entre subtítulo y CTAs.
7. **Eliminar la trust row textual y reemplazar por bloque de confianza con avatares + rating.**

### 9.2. Importantes (segundo round)

8. **Reemplazar la sección "3 beneficios" por filas alternadas con screenshots grandes.**
9. **Añadir sección dedicada a la ficha clínica PDF** (joya de la corona hoy enterrada).
10. **Añadir sección de testimonios con caras reales.**
11. **Compactar stats del mercado a una sola card en vez de grid de 3.**
12. **Añadir banda de logos de clínicas** entre hero y contenido.
13. **Rehacer la sección "3 pasos"** con mockups reales en vez de círculos con íconos.
14. **Mover el CTA B2B a su propia sección con visual diferenciado.**

### 9.3. Pulido premium

15. **Shadows cálidas** con tinte durazno en vez de grises neutros.
16. **Tipografía display con `tracking-tight`** más agresivo en H1/H2.
17. **Blobs del hero con animación sutil** (parallax suave o drift).
18. **Microinteracciones en cards** (hover tilt ligero, tarjetas flotantes con float animation).
19. **Grain/noise texture muy sutil** en hero para sensación editorial.
20. **Revisar copy chileno** en cada sección (tú, tienes, puedes).
21. **Favicon y OG image** coherentes con la nueva dirección.
22. **Lazy-load de imágenes below-the-fold**, eager en hero.

---

## 10. Guía de implementación para Claude Code

### 10.1. Orden recomendado de refactor

1. **Preparar assets.**
   - Exportar 1 mockup del device frame con la ficha clínica real (screenshot de `/pet/:petId/clinical` en mobile con datos de ejemplo).
   - Crear las 2 tarjetas flotantes como SVG o divs con contenido real.
   - Seleccionar/recortar foto de mascota con background transparente.
   - Exportar screenshot del PDF de ficha clínica para Sección 4.
   - Recopilar o generar 4–6 logos de clínicas en grayscale.
   - Buscar o capturar 2–3 fotos de dueños chilenos con sus mascotas para testimonios.

2. **Crear nuevo componente `HeroV2.tsx`** en paralelo al Hero actual.
   - No borrar [src/components/Hero.tsx](src/components/Hero.tsx) hasta validar.
   - Crear como [src/components/HeroV2.tsx](src/components/HeroV2.tsx).
   - Importarlo condicionalmente en [src/pages/Index.tsx](src/pages/Index.tsx) detrás de un flag simple para A/B si se desea.

3. **Implementar el split layout desktop** con `md:grid-cols-[1.15fr_0.85fr]` y el stack mobile con el visual intermedio.

4. **Implementar el device frame** como un componente reutilizable `<DeviceFrame>` que reciba un `children` con el screenshot dentro. Añadir las 2 tarjetas flotantes como elementos absolutos.

5. **Reemplazar sección "3 beneficios"** por un solo bloque `<FeatureShowcase>` con mockup grande + bullets laterales.

6. **Añadir nueva sección `<MedicalPDFShowcase>`** entre "3 pasos" y "stats".

7. **Añadir sección `<LogosBand>`** justo después del hero.

8. **Añadir sección `<Testimonials>`** antes del FAQ.

9. **Reestructurar sección B2B** como banda dedicada con fondo distinto.

10. **Pulir FAQ y footer** con nuevo sistema visual.

11. **Hacer pasada de copy chileno** en todo el archivo.

12. **Build y deploy:** `npm run build` → commit de `docs/` → push.

### 10.2. Qué rehacer primero

- **Hero.** Es el cambio más crítico y más visible. Todo lo demás puede esperar.
- **Una vez aprobado el hero nuevo, pasar a Sección 3 (demo 3 pasos) y Sección 4 (ficha clínica).**
- Testimonios pueden ir en una PR separada una vez que se consigan las caras reales.

### 10.3. Qué NO romper

- **Rutas existentes.** La landing sigue siendo `/` con el componente `Index`.
- **SEO:** preservar el `<Helmet>` con title, description, canonical.
- **Accesibilidad:** mantener `alt` en todas las imágenes, roles correctos.
- **Performance del hero:** la imagen/mockup hero debe ir con `loading="eager"` y `fetchPriority="high"`.
- **Footer legal:** mantener [src/components/LegalFooter.tsx](src/components/LegalFooter.tsx) intacto o reemplazarlo por uno nuevo que preserve los links legales requeridos.
- **PublicHeader:** puede recibir refresh visual pero mantener la misma API.
- **Lazy loading de secciones pesadas below-the-fold.**

### 10.4. Qué validar en desktop

- [ ] Hero ocupa entre 85% y 95% del viewport (no exactamente 100%).
- [ ] Split layout 55/45 con proporción visual correcta.
- [ ] H1 en 1 sola línea en viewports ≥1200px.
- [ ] Solo 2 CTAs en el hero (primario + secundario).
- [ ] Device frame con tarjetas flotantes posicionadas correctamente.
- [ ] Transición entre hero y siguiente sección sin quiebres.
- [ ] Logos grayscale se ven en una sola fila sin wrap.
- [ ] Testimonios en carrusel con 2 visibles.
- [ ] FAQ expande correctamente.
- [ ] Footer a 3 columnas.

### 10.5. Qué validar en mobile

- [ ] Orden del hero: badge → H1 → sub → visual → CTA → CTA ghost → confianza.
- [ ] H1 en máximo 2 líneas.
- [ ] Visual hero no excede 45% de la altura del viewport.
- [ ] CTAs full-width con 56px de alto mínimo.
- [ ] Sin scroll horizontal accidental.
- [ ] Tarjeta flotante del device frame se ve dentro del viewport.
- [ ] Logos band con scroll horizontal y fade en bordes.
- [ ] Mockups de screenshots en Sección 3 legibles (no miniatura).
- [ ] PDF mockup en Sección 4 visible completo.
- [ ] Testimonios apilados con swipe.
- [ ] FAQ accordion funcional con tap.
- [ ] Footer apilado correctamente.
- [ ] Tap targets mínimo 44×44px.

### 10.6. Checklist de QA visual

**Jerarquía:**
- [ ] H1 al menos 2 pasos más grande que H2.
- [ ] Ningún bloque de texto excede los límites de palabras de la tabla 5.2.
- [ ] Ningún CTA compite con otro CTA del mismo nivel.

**Color y contraste:**
- [ ] Contraste AA mínimo en todo el body text.
- [ ] Contraste AAA en CTAs primarios.
- [ ] Ningún acento secundario aparece más de 1 vez por sección.

**Spacing:**
- [ ] Entre secciones, mínimo `py-20` (80px) vertical.
- [ ] Padding interno de cards consistente `p-6 md:p-8`.
- [ ] Gaps entre cards uniformes `gap-6`.

**Imágenes:**
- [ ] Todas con `alt` descriptivo.
- [ ] Hero image `loading="eager"` + `fetchPriority="high"`.
- [ ] Below-the-fold con `loading="lazy"`.
- [ ] Aspect ratios consistentes (no cambios bruscos).
- [ ] No hay stock genérico visible.

**Interacción:**
- [ ] Hover states en desktop.
- [ ] Active states en mobile.
- [ ] Focus ring accesible en todos los interactivos.
- [ ] Scroll suave al CTA secundario "Ver cómo funciona".

**Copy chileno:**
- [ ] Tuteo chileno (tú, tienes, puedes) — nunca voseo.
- [ ] "Comuna" en vez de distrito/barrio.
- [ ] "Ficha clínica" en vez de historial médico.
- [ ] "Paw Friend" con mayúsculas correctas.
- [ ] Sin anglicismos innecesarios.

**Performance:**
- [ ] Lighthouse mobile ≥90 en Performance.
- [ ] Lighthouse desktop ≥95 en Performance.
- [ ] CLS <0.1 en hero.
- [ ] LCP <2.5s en mobile 4G.

---

## 11. Apéndice — Qué no hacer (antipatrones explícitos)

Basado en los errores de la landing actual y en los antipatrones típicos de landings SaaS:

- ❌ Grid de 3 cards con ícono arriba y texto abajo como sección principal.
- ❌ Hero centrado con `max-w-md` en desktop sin split layout.
- ❌ Más de 2 CTAs visibles en el primer viewport.
- ❌ Mezclar audiencias B2C y B2B en el mismo hero.
- ❌ Trust elements como lista de texto con íconos pequeños.
- ❌ Imagen hero genérica stock de Unsplash.
- ❌ Fine print bajo el CTA duplicando info del badge.
- ❌ `min-h-screen` en hero con contenido apilado sin visual intermedio en mobile.
- ❌ 3 secciones seguidas con el mismo layout de grid de 3 cards.
- ❌ Gradientes neón tipo fintech 2021.
- ❌ Ilustraciones Lottie genéricas o isométricos 3D.
- ❌ Copy con **bold** para intentar dar énfasis donde la jerarquía tipográfica debería hacerlo.
- ❌ Accordion con bordes duros y colores planos.
- ❌ Footer con lista densa de 6+ columnas.
- ❌ Hablar del producto en tercera persona ("Paw Friend te ayuda a...") cuando puedes hablar directo al usuario.
- ❌ Copy genérico tipo "la solución integral para cuidar a tu mascota".

---

## 12. Resumen ejecutivo en 10 líneas

1. El hero actual falla porque apila texto antes del visual, mezcla B2C con B2B y usa una foto stock.
2. Reemplazarlo por un split layout desktop con device frame + tarjetas flotantes + foto de mascota asomándose.
3. En mobile, poner el visual entre el subtítulo y los CTAs, no al final.
4. Reducir a 2 CTAs en el hero. El CTA de veterinarios va a su sección dedicada.
5. Headline máximo 7 palabras, subhead máximo 16, badge máximo 3.
6. Añadir banda de logos, sección dedicada al PDF, testimonios con cara y mockups reales.
7. Reemplazar el grid de 3 beneficios por filas alternadas con screenshots grandes.
8. Paleta cálida, sombras con tinte durazno, tipografía grande, mucho aire.
9. Mobile-first: validar orden, tap targets, lazy loading y sin scroll horizontal.
10. Implementar en este orden: hero → banda logos → ficha PDF → demo 3 pasos → testimonios → B2B → FAQ → footer.

---

**Fin del blueprint.**
