# Paw Friend — Rebrand Rollout Masterplan 2.0

> **Estado:** Documento maestro ejecutable.
> **Versión:** 2026-04-19.
> **Dueño:** Paw Founder.
> **Alcance:** Toda la superficie visual y de producto de Paw Friend.
> **Propósito:** Plan accionable para migrar de un sistema de marca disperso a una identidad 2.0 coherente, escalable y premium.
>
> Este documento NO implementa el rebrand. Define **qué** cambiar, **por qué** y **en qué orden**. La implementación se hace en PRs posteriores referenciando las secciones 11–14.

---

## 1. Resumen ejecutivo

### Por qué hace falta este rebrand

Paw Friend creció orgánicamente en dos meses de una sola persona + IA. El resultado es un producto real en tres plataformas con un branding que funciona, pero que está **disperso en capas no separadas**:

- El púrpura de marca vive en `tailwind.config.ts` como `brand.*`, pero el dorado —segunda columna visual en toda la línea de pitch y marketing— **no existe como token**: aparece hardcodeado en HTMLs y gradientes de landing.
- La tipografía display (Fredoka) rige la voz en pitch/HTML pero **no llega al producto**, que usa Plus Jakarta Sans en todos los roles.
- Cada pitch deck inventó su propia paleta por audiencia (emerald, rose, gold) y esas paletas **no son ciudadanas de primera clase** del sistema.
- La iconografía coexiste en tres islas: lucide-react (producto), 30 SVG squircles custom (landing), 12 SVG bitmap-embedded (pitch) + emojis esparcidos.
- El asset library **no existe para canales omnicanal**: no hay plantillas de Instagram, TikTok, YouTube, WhatsApp, FB; no hay press kit, partner kit, investor kit formales fuera de los HTMLs.

Esto funciona hoy, pero **no escala**. Cualquier nueva superficie (una campaña en redes, un one-pager para un nuevo partner, un splash de iOS actualizado) inventa desde cero.

### Qué resuelve este rebrand

- **Consolida 2 columnas cromáticas:** púrpura + dorado como la firma visual de Paw Friend.
- **Ensancha el brand system:** de una paleta hidden en `:root` a un sistema público de tokens con familias brand / product / state / gamification / premium claramente separadas.
- **Unifica la voz tipográfica:** Fredoka deja de ser "la fuente de los pitches" y se vuelve la fuente display oficial también en producto, con reglas claras de cuándo.
- **Formaliza las 4 paletas por audiencia** (investors, companys, partners, voices) como colores de marca reconocidos.
- **Establece una librería omnicanal:** una taxonomía completa de assets para las 14 superficies y canales donde Paw Friend debe vivir.
- **Define un protocolo de iconografía híbrido** con reglas explícitas: lucide → producto utilitario, SVG brand → marketing/marca, emojis → gamificación intencional únicamente.

### Qué cambiará concretamente

| Capa | Hoy | Brand 2.0 |
|---|---|---|
| **Paleta brand** | púrpura + dorado implícito | **Purple + Gold** como dos tokens paralelos, cada uno con scale 50-900 |
| **Paletas de audiencia** | en HTMLs sueltos | 4 paletas semánticas (invest/companys/partners/voices) en tailwind |
| **Display font** | solo pitch | Fredoka como display oficial en app (H1/hero/gran número) |
| **Iconografía** | 3 islas + emojis | Protocolo: lucide (UI) · brand SVG (marketing) · emoji solo gamification |
| **Shadows** | 5+ sistemas | 4 elevaciones (flat/soft/md/lg) + 2 especiales (brand-glow/premium-glow) |
| **Motion** | cada surface decide | 3 curvas + 4 duraciones fijas |
| **Dark mode** | parity incompleta | parity full como requisito de aceptación |
| **Omnichannel** | 0 | 14 kits dedicados |

### Impacto esperado

- **Percepción:** un producto serio, escalable, reconocible desde cualquier canal.
- **Equipo/fundador:** decisiones visuales 10× más rápidas — el sistema responde por defecto.
- **Crecimiento:** cada nuevo partner/inversionista/creator recibe un kit coherente sin reinventar.
- **Mobile app stores:** assets listos para Play Store + App Store sin regeneración caso a caso.
- **Performance:** una librería SVG central reemplaza emojis rasterizados inconsistentes.

---

## 2. Hallazgos del estado actual

### 2.1. Branding actual

Paw Friend transmite hoy:
- **Calidez chilena "home-made"** — tono cercano, tuteo, copy emocional.
- **Ambición técnica real** — 67 rutas, 28 edge functions, 3 plataformas, Capacitor, Flow.cl integrado.
- **Transparencia radical** — SpA visible, RUT, trazabilidad de donaciones, "hecho con IA" acreditado.
- **Ethos púrpura + luz dorada** — en marketing/pitch claro, en producto apagado.

**Solidez: 6/10.** La marca tiene alma y claridad conceptual. Le falta sistema.

**Contradicciones observadas:**
- La app nunca muestra Fredoka — el usuario que viene de un pitch al producto siente un salto.
- El dorado brilla en HTMLs pero en el panel Admin desaparece — otra discontinuidad.
- Paw Labs (banner beta en 6 páginas) rompe la continuidad visual con un tono diferente — funcional, pero fragmenta.

### 2.2. UI actual

- **Consistencia de color:** media-alta en primary, baja en acento/dorado.
- **Consistencia tipográfica:** alta en producto, media cross-surface.
- **Consistencia de componentes:** alta (shadcn + design-tokens.ts), pero abundan overrides inline que son tokens en vías de extracción.
- **Coherencia producto ↔ marketing:** media — saltos visibles entre `/home` y `/` (landing).
- **Calidad UX/UI:** alta en producto, premium en pitch — **la discrepancia entre ambos es el síntoma clave**.

### 2.3. Superficies inconsistentes

| Surface A | Surface B | Tipo de inconsistencia |
|---|---|---|
| `/` landing v3 | `/home` | Fredoka vs solo Jakarta + diferente intensidad de púrpura |
| `/pitch/*` | Admin panel | Gold present vs ausente, dashboards narrativos vs utilitarios |
| Sample dashboard | Admin real dashboard | Mockup premium vs panel con Recharts default |
| PawCore (público) | PerfilVetPublico | Strategic page rico vs listing minimalista |
| Email edge fns HTML | Producto web | Inline styles ad-hoc vs sistema tokenizado |

### 2.4. Deuda visual y sistémica

1. **Estilos mezclados**: Tailwind utilities + CSS variables + inline styles en HTMLs de pitch + `design-tokens.ts` con strings pre-compuestos — 4 formas de expresar lo mismo.
2. **Tokens inexistentes o débiles**: no hay tokens formales para `gold`, `audience-investors`, `audience-voices`, etc.
3. **Iconografía inconsistente**: 179 emojis detectados en 58 archivos .tsx, de los cuales ~60% decorativos (no semánticos).
4. **Branding no consolidado**: el concepto "Paw Friend" existe como marca pero no como sistema exportable.
5. **Ausencia de librería visual central**: `/public/paw-friend-assets/` tiene logos + 30 SVG squircles + 12 bitmap numbered; no hay `brand/`, `social/`, `press/`, `investor/`, `partner/` subfolders.
6. **Falta de assets por canal**: 0 templates Instagram, TikTok, WhatsApp, YouTube.
7. **Motion language undefined**: cada animación inventa su curva y duración.
8. **Dark mode regresión silente**: no existe QA pass sistemático.

### 2.5. Riesgos del estado actual si no se rebrandea

- **Escalamiento doloroso**: cada nueva superficie (nueva comunidad, nuevo canal) duplica el trabajo.
- **Percepción heterogénea**: un inversionista que llega del pitch al admin real puede leer el producto como "menos premium" que el deck.
- **Adopción social débil**: sin templates de Instagram/TikTok/YouTube, la distribución vía Voices depende de creadores improvisando.
- **Fricción en partnerships**: cada Paw Company recibe un deck personalizado por ausencia de un partner kit.
- **Regresiones visuales silentes**: sin QA de dark mode, cada PR arriesga romper la paridad.

---

## 3. Objetivo del brand 2.0

Paw Friend 2.0 debe sentirse como **una marca chilena premium** que ama a los peludos, construida con ambición técnica real. Una voz que habla a dueños, vets, inversionistas, creadores y empresas — cada uno desde su ángulo, pero siempre reconocible.

### Cómo debe sentirse Paw Friend

- **Cálido** — púrpura lavanda con pulso dorado, nunca frío.
- **Serio** — sin caer en "corporate": tipografía display con carácter (Fredoka), disciplina en tokens.
- **Chileno** — orgulloso, no folklórico. La idea de "hecho acá" vive en el copy y en los mapas, no en estética rural.
- **Transparente** — sistema visible, tokens documentados, no hay "magia".
- **Emocionalmente honesto** — cuando hay corazón (Donaciones, Memorial), se muestra. Cuando hay números (Sala de Inversión, Admin), son legibles.
- **Escalable** — cada surface nueva (una region en Latam, un nuevo canal) hereda el sistema sin rediseño.

### Qué percepción debe instalar

> "Paw Friend es la marca chilena que decidió cuidar a todas las mascotas y sus dueños en serio, sin ponerle precio. Se ve cuidada en cada detalle, y se reconoce al primer vistazo."

### Cómo unir marca + producto + ambición

- **Marca** aporta el mundo visual: púrpura + dorado, Fredoka + Jakarta, ilustración warm-flat.
- **Producto** aporta la utilidad pura: salud de la mascota, ficha PDF, directorio, agenda.
- **Ambición** aporta la señal de serio: SpA, tokens, tests, trazabilidad, a11y, mobile nativo.

Los tres convergen en una regla:
> **Nada que se vea, se diga o se use en Paw Friend puede contradecir "cuidamos a los peludos con seriedad, y lo demostramos".**

---

## 4. Principios del nuevo sistema de marca

### 4.1. Atributos de marca

| Atributo | Cómo se manifiesta |
|---|---|
| **Cálido** | púrpura lavanda, dorado pulsante, copy tuteo chileno |
| **Claro** | jerarquía tipográfica fuerte, 1 idea por pantalla, tokens sobre overrides |
| **Confiable** | tokens públicos, factura electrónica afecta IVA, trazabilidad donaciones |
| **Emocional** | Fredoka en H1, quote de usuaria real, ilustración pet-first |
| **Escalable** | sistema tokenizado, assets por canal, prompts reproducibles |
| **Chileno** | comuna, ficha clínica (no historial), tuteo, SpA visible |

### 4.2. Personalidad

Paw Friend es:
- **Un amigo peludo experto**, no un software vendor.
- **Un fundador chileno** que construye con IA, no un equipo SV.
- **Un aliado serio** para el vet de barrio, no una plataforma corporate.

### 4.3. Tono

- **Verbal:** tuteo chileno (tú, tienes, puedes). Nunca voseo rioplatense, nunca vosotros ibérico.
- **Visual:** cálido + disciplinado. Emociona pero no satura.
- **Interaccional:** directo, sin jargon, sin jerarquías falsas (no hay "panel de control" — hay "tu panel").

### 4.4. Visión estética

- **Púrpura lavanda tibio** como base emocional.
- **Dorado solar** como el pulso de "vida" y valor.
- **Neutros suaves** (slate) como papel que no grita.
- **Acentos tonales** (emerald/rose/cyan) reservados para audiencias y estados.
- **Gradient radial** como firma cuando se necesita "presencia".
- **Cards-first** con sombras suaves como principio de contención.

### 4.5. Keywords

Cálido · chileno · cuidado · transparente · escalable · premium · peludo · serio · honesto · inteligencia artificial · comunidad · ficha médica · gratis

### 4.6. Anti-patrones (lo que Paw Friend NO es)

- No es una marca corporate (NO IBM blue, NO Arial, NO gradientes fríos).
- No es una marca "pet-cute" genérica (NO Comic Sans, NO emojis por defecto, NO paletas chillonas).
- No es un SaaS B2B seco (NO "dashboards" utilitarios vacíos, NO copy en inglés tecnológico).
- No es una ONG triste (NO fotos de perros abandonados como hero; la emoción se cuenta, no se explota).
- No es una marca "latam cliché" (NO sombreros de lana, NO patrones indigenistas sin contexto, NO mezcla caótica).

---

## 5. Nueva paleta de colores 2.0

### 5.1. Brand colors principales

**Paw Friend 2.0 es bicromática en brand:** Purple + Gold.

```
Purple Scale (brand-*)   |   Gold Scale (gold-*)
─────────────────────────┼────────────────────────
50   #faf5ff             |   50   #fffbeb
100  #f3e8ff             |   100  #fef3c7
200  #e9d5ff             |   200  #fde68a
300  #d8b4fe             |   300  #fcd34d
400  #c084fc             |   400  #fbbf24
500  #a855f7             |   500  #f59e0b
600  #9333ea  ← brand    |   600  #d97706
700  #7e22ce             |   700  #b45309  ← premium-hero
800  #6b21a8             |   800  #92400e
900  #581c87             |   900  #78350f
```

### 5.2. Secondary audience palettes (elevadas a brand)

Los 4 HTMLs de pitch probaron estas paletas en producción. Se elevan a brand oficial:

```
invest (gold-led)   : linear-gradient(135deg, #9333ea, #eab308)
companys (deep)     : linear-gradient(135deg, #581c87, #9333ea)
partners (emerald)  : linear-gradient(135deg, #047857, #10b981)
voices (rose)       : linear-gradient(135deg, #be185d, #ec4899)
```

Cada paleta hereda el mismo shape (scale 50–900) pero con su hue específico.

### 5.3. Neutrales (slate)

```
slate-50  → page bg calm
slate-100 → subtle divider
slate-300 → border soft
slate-500 → muted text
slate-700 → body text
slate-900 → h1 / strong emphasis
```

### 5.4. Acentos (tonales, NO brand)

Solo para estados, microinteracciones y contextos específicos:

```
emerald-500 #10b981  → success / positive state / partners
amber-500   #f59e0b  → warning / attention
rose-500    #ec4899  → voices / alert humanized
red-600     #dc2626  → destructive / urgent health
sky-500     #0ea5e9  → info / neutral icon
```

### 5.5. Dark/Light strategy

**Light mode** (default): fondo `slate-50` → `brand-50` en áreas brand. Cards blancas con borde `brand-100`.
**Dark mode**: fondo `slate-900` + blob `brand-900/30`. Cards `slate-800` con borde `slate-700`.

**Regla:** cualquier componente se diseña light-first y se valida dark antes de merge. Los gradients se invierten manualmente, no por filter.

### 5.6. Colores funcionales de UI (product layer)

```
--success-500  #16a34a  (health: good, vacunas al día)
--warning-500  #d97706  (health: attention, próxima a vencer)
--danger-500   #dc2626  (health: urgent, emergencia)
--info-500     #2563eb  (info / default tooltip)
--unknown-500  #64748b  (estado desconocido, empty)
```

**Sinergia health ↔ brand**: cuando el contexto es gamificación, los tokens se matizan con dorado (éxito con chispa). Cuando es médico serio, los tokens son planos.

### 5.7. Reglas de uso

- **Primary action**: `brand-600` fondo, `white` texto.
- **Secondary action**: `brand-100` fondo, `brand-700` texto.
- **Tertiary/ghost**: transparente, `slate-700` texto, borde `slate-300`.
- **Destructive**: `red-600` fondo, `white` texto. **Nunca** amarillo/rosa.
- **Gold**: reservado para "valor/premium/celebración/hero-mark". **No** usar gold como primary action común (dilución).

### 5.8. Proporción de uso

Regla 60/30/10:
- **60%** neutrales (page bg, cards, text)
- **30%** brand purple (primary actions, badges, links, headers)
- **10%** gold + audiencia + estados (hero-accents, pulse, celebration)

### 5.9. Naming recomendado de tokens (CSS vars + Tailwind)

```
Tailwind class            CSS var           Semantic role
───────────────────────────────────────────────────────
bg-brand-600              --brand-600       primary action
bg-gold-500               --gold-500        premium accent
bg-audience-invest        --audience-invest investors pitch
bg-audience-companys      --audience-companys  companys pitch
text-ink                  --ink             body text
bg-paper                  --paper           page bg
bg-surface                --surface         card bg
shadow-brand              --shadow-brand    primary hover
shadow-gold-glow          --shadow-gold-glow premium hero
```

### 5.10. Qué pertenece a branding vs producto

| Capa | Ejemplos |
|---|---|
| **Brand** | Purple scale · Gold scale · 4 audience palettes · hero-grad · warm-grad · Fredoka display · Jakarta sans body |
| **Product UI** | success/warning/danger tokens · health states · premium gold burst · focus ring · border · input · muted · slate scale · shadow-soft |
| **Gamification** | Paw Points emoji icons (intencionales) · misión badges · level colors derivados de gold |
| **Médico** | health-good/attention/urgent scale (plano, no dorado) |

---

## 6. Sistema tipográfico

### 6.1. Tipografías recomendadas

**Fredoka** (display) — peso 500, 600, 700
- Uso: H1 de landing, H1 de pitch, hero numbers (28.450, 377, 15×), gran figura cinematográfica.
- Personalidad: redondeada, cálida, con carácter. Refleja "peludo serio".

**Plus Jakarta Sans** (body + headings menores) — peso 400, 500, 600, 700, 800
- Uso: H2, H3, body, caption, labels, buttons, tablas.
- Personalidad: geométrica contemporánea, legible, escalable.

**JetBrains Mono** (tabular/numeric) — peso 500, 700
- Uso: números tabulares (amounts CLP, percentages, kbd), code fragments, timestamps.
- Personalidad: precisa sin ser fría.

### 6.2. Usos por contexto

| Contexto | Display (Fredoka) | Body (Jakarta) | Mono (JetBrains) |
|---|---|---|---|
| Landing hero | H1 ✓ | resto | — |
| Landing body | — | todo | — |
| App page title | H1 large screens ✓ | mobile | — |
| App component titles | — | H2/H3 ✓ | — |
| App body | — | ✓ | — |
| Pitch cover | H1 cinema ✓ | — | — |
| Pitch body | — | ✓ | valores $ |
| Sample dashboard | KPI values ✓ | labels | mono sparkline values |
| Admin panel | — | ✓ | numbers tabulares |
| Provider panel | — | ✓ | calendario hours |
| Email HTML | fallback web-safe | fallback Arial | — |

### 6.3. Fallback strategy

```css
font-family: 'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif;
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
font-family: 'JetBrains Mono', ui-monospace, 'Courier New', monospace;
```

Emails: siempre `Arial, Helvetica, sans-serif` con web font opcional via `@import` solo en clientes que soporten.

### 6.4. Lineamientos de jerarquía

```
Hero H1 (cinema)    clamp(44px, 6.4vw, 88px) Fredoka 600   (landing, pitch cover)
Page H1             clamp(28px, 4vw, 44px)   Fredoka 600   (internal pages)
Section H2          clamp(22px, 3vw, 32px)   Jakarta 800
Component H3        18-20px                  Jakarta 700
Eyebrow             11px uppercase           Jakarta 800   letter-spacing .14em
Body lead           17-21px                  Jakarta 400   line-height 1.55
Body                15-16px                  Jakarta 400   line-height 1.5
Caption             12-13px                  Jakarta 500   color muted
Label               10-11px uppercase        Jakarta 800   letter-spacing .12em
Monospace value     13-16px                  JBMono 700    tabular-nums
```

### 6.5. Reglas

- **Nunca** 4+ niveles tipográficos en una misma pantalla.
- **Nunca** `font-weight: 300` (legibilidad frágil en mobile).
- **Siempre** `line-height: 1.5+` en body, `1.1–1.2` en display.
- **Siempre** `letter-spacing: -.02em` en headings grandes (Fredoka ya viene tighter).

---

## 7. Sistema iconográfico

### 7.1. Protocolo de 3 capas

| Capa | Librería | Uso | Peso visual |
|---|---|---|---|
| **Product UI** | lucide-react | toolbars, botones, estados, navegación, tablas | 16-24px, stroke 1.5-2 |
| **Brand hero/marketing** | `paw-friend-assets/Icons logos/*.svg` (30 squircles) | landing pillars, pitch cards, features | 48-72px, full-color squircle |
| **Inline pitch/deck** | SVG inline lineart | deck banners, CTA badges, microcopy visual | 14-28px, stroke 1.8, currentColor |
| **Gamificación** | emoji (intencional) | Paw Cards, misiones, niveles, levels.ts | texto flow |

### 7.2. Cuándo usar cada uno (regla clara)

- **Si es UI funcional** (botón, tab, estado, input decor) → **lucide**.
- **Si es hero/card/feature con personalidad** → **brand SVG squircle** (30 disponibles + crear faltantes).
- **Si es un bullet en un pitch HTML donde no hay runtime React** → **SVG inline lineart** con `currentColor`.
- **Si es gamificación explícita** (puntos, niveles, misiones) → **emoji intencional** preservado.

### 7.3. Iconos no permitidos

- **Emojis decorativos** en superficies profesionales (admin, provider, ficha clínica, pitch, emails formales). Reemplazar por lucide o brand SVG.
- **Icon fonts genéricos** (FontAwesome, Material Icons) — rompen tree-shaking y no están en el sistema.
- **PNG rasterizado** cuando se necesita un icono nuevo. Siempre SVG.

### 7.4. Consistencia entre producto y branding

- **Stroke width** en lineart: 1.5 (dense) o 2 (coarse). Nunca mezclar.
- **Radius**: iconos custom con squircle viewBox 200x200 rx 40 (alineado al app icon principal).
- **Color**: siempre `currentColor` en lineart; full-color solo en brand squircles.

### 7.5. Librería core a mantener/crear

**Existentes (30):** 01_paw_print, 02_dog_face, 03_cat_face, 04_heart_paw, 05_bone, 06_pet_house, 07_pulse, 08_syringe, 09_pill, 10_stethoscope, 11_thermometer/pet_beloved, 12_first_aid/clinical_record, 13_health_monitored/medical_cross, 14_clinical_record, 15_calendar, 16_clock, 17_checkmark, 18_tasks, 19_mobile_app, 20_chat, 21_notification, 22_search, 23_cloud, 24_partnership, 25_growth, 26_clinic, 27_rocket, 28_idea, 29_target, 30_star.

**A crear (prioridad):**
1. `31_donation.svg` — huella + corazón, gold squircle
2. `32_shield_data.svg` — privacidad
3. `33_ai_brain.svg` — IA, asistente médico
4. `34_map_pin_paw.svg` — directorio público
5. `35_pdf_record.svg` — ficha PDF (actualmente uses 14_clinical_record, pero no transmite PDF)
6. `36_handshake_paws.svg` — partnership con peludo
7. `37_invoice.svg` — SpA, factura, compliance
8. `38_shelter.svg` — refugios
9. `39_badge_member.svg` — Paw Member badge
10. `40_qr_code_paw.svg` — QR de mascota

Prompts para producción están en `docs/pawfriend-omnichannel-brand-assets-and-prompts.md` §11.

---

## 8. Sistema visual de producto

### 8.1. Buttons

- **Primary:** `bg-brand-600 text-white shadow-brand hover:bg-brand-700` · radius 999 · altura 44 (mobile touch).
- **Secondary:** `bg-brand-100 text-brand-700 hover:bg-brand-200` · radius 999.
- **Tertiary/ghost:** `bg-transparent text-slate-700 hover:bg-slate-100 border-slate-300`.
- **Destructive:** `bg-red-600 text-white` · **nunca** gold/purple.
- **Premium (hero):** `bg-gradient-gold-purple text-white shadow-gold-glow` · raro, solo para "unlock" visual.

### 8.2. Cards

- Radius: `lg` (14px) para cards estándar, `xl` (20px) para hero, `2xl` (28px) para gateway/spotlight.
- Sombra: `shadow-soft` default, `shadow-md` elevated, `shadow-brand` on hover.
- Border: `border-brand-100` subtle, `border-brand-300` on hover.
- Padding: `p-4 md:p-6` (mobile/desktop).

### 8.3. Formularios

- Inputs: altura 44, radius 10, border `slate-300`, focus ring `brand-500`.
- Label: `11px uppercase letter-spacing .12em`.
- Helper text: `12px text-slate-500`.
- Error: border `red-500`, icon `AlertCircle`, text `red-600`.
- Toggle/Switch: brand-600 when on, slate-300 off.

### 8.4. Inputs/Selects/Pickers

- Mobile: `font-size: 16px !important` (iOS no zoom).
- Desktop: `font-size: 14px` OK.

### 8.5. Tabs

- Active: `border-b-2 border-brand-600 text-brand-700 font-700`.
- Inactive: `text-slate-500 hover:text-slate-700`.
- Gap: 24px entre tabs.

### 8.6. Badges

- Small pill: `rounded-full px-2.5 py-0.5 text-xs font-700`.
- Tone brand: `bg-brand-100 text-brand-700`.
- Tone success: `bg-emerald-100 text-emerald-700`.
- Tone Paw Member: `bg-gradient-gold text-white`.
- Tone Paw Voice: `bg-gradient-rose text-white`.

### 8.7. Estados

**Health states tokens:**
- `good`: emerald-500 / bg-emerald-50
- `attention`: amber-500 / bg-amber-50
- `urgent`: red-500 / bg-red-50
- `unknown`: slate-500 / bg-slate-50

Nunca mezclar: si es "vacunas al día", es `good`. Si es "próxima dosis en 7 días", es `attention`. Si venció, `urgent`.

### 8.8. Navigation

- Bottom tab bar mobile: height 56, 4-5 tabs, active icon filled, inactive outline.
- Sidebar desktop: width 240, sections con eyebrow uppercase.
- Header: sticky, backdrop-blur, altura 52-64.

### 8.9. Dashboards

Regla mnemotécnica: **KPI → Chart → Table → CTA**.

- KPI row: 4 tiles con value Fredoka 32px + label 11px uppercase + sparkline 52×18 SVG.
- Charts: Recharts con palette brand-* only. Gold solo en highlight series.
- Tables: `th` con eyebrow, `td` con tabular-nums para valores, zebra opcional con `hover:bg-brand-50`.
- CTA: siempre al pie, visible sin scroll horizontal.

### 8.10. Tablas

- Padding cell: 12px 16px.
- Border bottom: `border-slate-200`.
- Header bg: `bg-brand-50`, color `brand-800`, font-weight 700, uppercase 11px.
- Zebra: opcional `odd:bg-slate-50`.
- Hover row: `hover:bg-brand-50` cuando es clickeable.

### 8.11. Gráficos

- Palette: `brand-600` primary series, `gold-500` highlight, `emerald-500` success, `rose-500` alert.
- Background: transparente o `slate-50`.
- Grid lines: `slate-200` 1px dashed.
- Tooltip: fondo `slate-900` 92%, texto blanco, radius 10.

### 8.12. Empty states

- Ilustración brand SVG squircle centrada, size 96-120.
- H3: "Aún no hay X".
- Body: explicación corta, acción sugerida.
- CTA: primary button si hay acción clara.

### 8.13. Loaders

- Spinner: `Loader2` lucide con `animate-spin`, color `brand-600`.
- Skeleton: `bg-slate-200 rounded-md animate-pulse`.
- Nunca bloquear full-page: mostrar skeleton progresivo por sección.

### 8.14. Feedback / Toasts (sonner)

- Success: fondo `emerald-50` + border `emerald-500` + icon `CheckCircle2`.
- Error: fondo `red-50` + border `red-500` + icon `XCircle`.
- Info: fondo `brand-50` + border `brand-500` + icon `Info`.
- Warning: fondo `amber-50` + border `amber-500` + icon `AlertTriangle`.

### 8.15. Bordes, sombras, radios, densidad

**Borders:** `1px solid slate-200` default, `brand-200` on brand cards, `dashed slate-300` para placeholders.

**Shadows (4 escalas + 2 especiales):**
```
shadow-flat        → 0 0 0 1px rgba(0,0,0,.04)
shadow-soft        → 0 2px 10px -4px rgba(0,0,0,.08)
shadow-md          → 0 10px 30px -12px rgba(0,0,0,.12)
shadow-lg          → 0 24px 60px -16px rgba(0,0,0,.18)
shadow-brand       → 0 10px 30px -12px rgba(147,51,234,.35)  hover primary
shadow-gold-glow   → 0 10px 40px -10px rgba(234,179,8,.45)   premium/hero
```

**Radios:**
```
sm  6px   chips tight
md  10px  inputs, small badges
lg  14px  cards default
xl  20px  hero cards
2xl 28px  gateway block, brand hero
full 999px buttons, pills
```

**Densidad:**
- Mobile: pad 4 (16px), gap 3 (12px).
- Desktop: pad 6 (24px), gap 4 (16px).
- Tight (tables): pad 3 (12px).

### 8.16. Motion

**Curvas (3):**
```
ease-out-soft   cubic-bezier(.2,.8,.2,1)    default
ease-in-out     cubic-bezier(.42,0,.58,1)   transiciones lateral
ease-out-pop    cubic-bezier(.16,1,.3,1)    entrada confirmada
```

**Duraciones (4):**
```
fast    150ms   hover, focus
normal  250ms   expand, fade
slow    400ms   reveal on scroll
hero    700ms   grand entrances
```

**Reduced motion:** respetar `prefers-reduced-motion: reduce` desactivando reveal, float, pulse.

---

## 9. Homogeneización de superficies

Para cada superficie: estado actual → qué cambia → prioridad → impacto → complejidad.

### 9.1. Core app (`src/pages`, `src/components`)

- **Hoy:** Jakarta-only, brand-* usado, health tokens, lucide. Sin Fredoka display. Emojis decorativos en 58 archivos.
- **Cambia:** Fredoka en page H1 y hero numbers · emojis → lucide/brand SVG (excepto gamification) · añadir `audience-*` tokens si la page habla a una audience específica.
- **Prioridad:** Alta.
- **Impacto:** Visual cohesion interna.
- **Complejidad:** Media (58 archivos, ~179 emojis, refactor de algunos props `icon: string → ReactNode`).

### 9.2. Landing (`src/pages/Index.tsx` + `src/components/landing`)

- **Hoy:** landing v3 premium, Fredoka presente, gold en gradientes, 11 componentes hero/showcase.
- **Cambia:** consolidar tokens (el gold hardcodeado pasa a `--gold-*`) · unificar per-section palettes con audience-* · garantizar dark mode parity.
- **Prioridad:** Media-Alta.
- **Impacto:** Primera impresión.
- **Complejidad:** Media.

### 9.3. Dashboards internos (Admin, Provider)

- **Hoy:** Tabla + Recharts default, sin firma brand.
- **Cambia:** KPI row con Fredoka + sparkline SVG · tokens gold en highlights · sombras brand · header eyebrow consistente.
- **Prioridad:** Alta (la discrepancia sample-dashboard vs admin real es la mayor fricción con prospectos).
- **Impacto:** Credibilidad ante inversionistas.
- **Complejidad:** Media-Alta.

### 9.4. HTML especiales (`public/pitch/*`, 7 archivos)

- **Hoy:** Ya usan Fredoka + gold. Recién rediseñados (recorrido, sample-dashboard) + fixes de contraste.
- **Cambia:** extraer CSS compartido a `/pitch/assets/brand.css`, replicar tokens del app (proxy) para consistencia.
- **Prioridad:** Media (funcionan bien hoy, beneficio es mantenibilidad).
- **Impacto:** Escalabilidad de futuros decks.
- **Complejidad:** Baja-Media.

### 9.5. Pitch decks (mismo subset)

- **Hoy:** 4 decks por audience + 1 recorrido + 1 sample dashboard + 1 hub. SVG inline en banners, reveal on scroll, scroll-snap proximity, responsive fix aplicado.
- **Cambia:** template base común (hero, slide types, cover, CTA), per-audience theme file (`theme.investors.css`, etc.), sistema de "slide types" (cover, problem, solution, stats, table, quote, tier, CTA) parametrizables.
- **Prioridad:** Media.
- **Impacto:** Acelera creación de decks nuevos (region-specific, campaign-specific).
- **Complejidad:** Media.

### 9.6. Sample dashboard

- **Hoy:** Rebuild reciente con mockup SVG del grid /donaciones, KPI sparklines, shelters con trazabilidad. Sobrio y profesional.
- **Cambia:** variante por tier (Bronze/Silver/Gold) usando mismo template con diferente volumen de placements.
- **Prioridad:** Baja.
- **Impacto:** Incremental.
- **Complejidad:** Baja.

### 9.7. Onboarding / Auth

- **Hoy:** OnboardingDuenoMinimal, OnboardingVetMinimal, Auth con diseño Jakarta minimal.
- **Cambia:** cover con Fredoka hero, Paw Friend mark animado, copy onboarding con tono warm.
- **Prioridad:** Media.
- **Impacto:** Primera impresión logueados.
- **Complejidad:** Media.

### 9.8. Partner/investor/company materials

- **Hoy:** viven como pitch HTML + 4 MDs en `pitch-inversionistas/`.
- **Cambia:** partner kit omnicanal (one-pager PDF, media kit, banner set), investor kit (deck cover + sample dashboard variants + data room index), company kit (barter card, badge SVG, grid asset).
- **Prioridad:** Alta (sin esto, cada nuevo outreach reinventa).
- **Impacto:** Comercial directo.
- **Complejidad:** Alta (nuevas piezas).

### 9.9. Social/marketing outputs

- **Hoy:** 0 templates dedicados. Sólo OG image genérica.
- **Cambia:** IG feed/story/reel, FB cover/post, TikTok vertical, YouTube thumbnail/banner. Template familiar + 6 variantes temáticas (launch, partnership, education, pawlabs, voices spotlight, company spotlight).
- **Prioridad:** Alta (distribución via Voices depende de esto).
- **Impacto:** Crecimiento.
- **Complejidad:** Alta (nuevo territorio).

---

## 10. Reglas UX/UI del rebrand

### 10.1. Claridad antes que belleza
Cada pantalla tiene **una** acción primaria. Si hay dos, una es secundaria visual explícita.

### 10.2. Consistencia antes que creatividad
Repetir un patrón familiar > inventar uno nuevo más bonito.

### 10.3. Escaneabilidad antes que densidad
Eyebrow + H2 + body corto + CTA. Un usuario debe entender la pantalla en 3 segundos sin leer todo.

### 10.4. Accesibilidad es no-negociable
- Contraste AA mínimo en body (4.5:1), AAA en headings.
- Focus ring visible en todos los interactivos (`ring-brand-500 ring-2`).
- Labels asociados a inputs, aria-label en iconos sin texto.
- Hit targets mobile ≥ 44×44 (iOS) / 48×48 (Android).

### 10.5. Mobile-first, siempre
Diseño base 375px. Escalado md: 768+ y lg: 1024+. Nada se mide primero en desktop.

### 10.6. Responsive behavior predecible
- Grid 1 col mobile → 2-3 col tablet → 3-4 col desktop.
- Sidebars se transforman en bottom tabs en mobile.
- Tablas hacen horizontal scroll con `scrollbar-hide` antes que truncar.

### 10.7. Jerarquía tipográfica firme
Máximo 3 niveles visibles en una misma pantalla (H1-H2-body o eyebrow-H2-body).

### 10.8. Feedback visual inmediato
- Hover 150ms, active 100ms.
- Loading > 300ms → skeleton.
- Operaciones asíncronas → toast con estado.

### 10.9. Motion disciplinada
Solo 3 curvas × 4 duraciones. `prefers-reduced-motion` siempre respetado.

### 10.10. Balance emoción + utilidad
- En superficies públicas (landing, Donaciones): emoción > utilidad.
- En superficies producto (Ficha, Calendario): utilidad > emoción.
- En superficies profesionales (Admin, Provider): sobriedad + claridad.

---

## 11. Design tokens y rollout técnico

### 11.1. Naming convention

```
<category>-<role>-<modifier?>

brand-600                primary purple
gold-500                 accent gold
audience-investors       deck tone invest
audience-companys        deck tone companys
audience-partners        deck tone partners
audience-voices          deck tone voices
health-good              estado salud bien
health-attention         estado salud atención
text-ink                 body text
text-ink-soft            muted text
text-ink-faint           caption
bg-paper                 page
bg-surface               card
radius-sm/md/lg/xl/2xl   border-radius
shadow-soft/md/lg        elevation
shadow-brand             primary glow
shadow-gold-glow         premium glow
motion-fast/normal/slow/hero   duration
motion-ease-out-soft     curve
```

### 11.2. Color scales a implementar

Ampliar `tailwind.config.ts` con:
- `gold.*` (50–900) como scale brand
- `audience.invest.*`, `audience.companys.*`, `audience.partners.*`, `audience.voices.*` (each: bg / accent / hero)
- `health.good`, `attention`, `urgent`, `unknown` (ya existen — solo documentar)

Y en `src/index.css` agregar las CSS vars correspondientes.

### 11.3. Spacing scale

Mantener Tailwind default (4px step). Reglas:
```
p-3  (12px) tables dense
p-4  (16px) cards mobile
p-5  (20px) card standard
p-6  (24px) cards desktop
p-8  (32px) section mobile
p-10 (40px) section desktop
p-16 (64px) hero
```

### 11.4. Radius tokens

Ya en Tailwind: sm 6, md 10, lg 14, xl 20, 2xl 28, 3xl 36. Mantener.

### 11.5. Typography tokens

Agregar a `tailwind.config.ts`:

```ts
fontFamily: {
  sans: ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
  display: ["'Fredoka'", "'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
  mono: ["'JetBrains Mono'", 'ui-monospace', 'monospace'],
}
```

Actualizar `src/index.css` para `@import` de Fredoka + JetBrains Mono.

### 11.6. Shadow tokens

Agregar a `tailwind.config.ts`:

```ts
boxShadow: {
  flat: '0 0 0 1px rgba(0,0,0,.04)',
  soft: '0 2px 10px -4px rgba(0,0,0,.08)',
  md: '0 10px 30px -12px rgba(0,0,0,.12)',
  lg: '0 24px 60px -16px rgba(0,0,0,.18)',
  brand: '0 10px 30px -12px rgba(147,51,234,.35)',
  'gold-glow': '0 10px 40px -10px rgba(234,179,8,.45)',
}
```

### 11.7. State tokens

Reutilizar `success`, `warning`, `danger`, `info` existentes. Agregar `--unknown-500` y `unknown.light`.

### 11.8. Migration strategy

1. **Añadir tokens nuevos sin remover viejos** (backward compat).
2. **Introducir ESLint rule opcional** que warneé uso de hex hardcodeado en .tsx (ya existe regla similar para `color`).
3. **Migrar superficie por superficie** (ver §12).
4. **Remover tokens obsoletos** solo cuando 0 referencias.

### 11.9. Cómo evitar regresiones

- Baseline Playwright visual snapshots de 10 screens críticas (Home, Ficha, Calendario, Admin, Provider Dashboard, Landing hero, Pitch index, PawCore, Donaciones, Auth).
- QA dark mode por PR: checklist simple "¿pasó dark mode visualmente?".
- Tests Vitest existentes (377) son la red inferior.

---

## 12. Plan de implementación por fases

### Fase 1 — Foundation (Semana 1)

**Objetivo:** Tokens brand 2.0 en producción sin romper nada.

**Entregables:**
- `tailwind.config.ts` ampliado con `gold.*`, `audience.*`, `fontFamily.display/mono`, `boxShadow.brand/gold-glow`.
- `src/index.css` con nuevos CSS vars + imports fonts.
- `src/lib/design-tokens.ts` con nuevos grupos `GOLD`, `AUDIENCE`, `MOTION`.
- Documentación inline de cuándo usar cada token.

**Dependencias:** Ninguna.
**Prioridad:** P0.
**Riesgo:** Bajo (additive).
**Impacto:** Alto (habilita todo lo demás).

### Fase 2 — Core App Rollout (Semanas 2–3)

**Objetivo:** Aplicar el sistema 2.0 al producto (65 páginas, 272 componentes).

**Entregables:**
- Page H1 migrado a `font-display` (Fredoka) donde corresponde.
- Eyebrow + H2 + body pattern aplicado cross-app.
- 179 emojis decorativos revisados: gamification preserva, resto migra a lucide/brand SVG.
- Shadow scale homogénea.
- Dark mode parity validada en 20 screens críticas.

**Dependencias:** Fase 1.
**Prioridad:** P0 (principal).
**Riesgo:** Medio (regresiones visuales posibles).
**Impacto:** Muy alto.

### Fase 3 — Landing & Marketing Rollout (Semana 4)

**Objetivo:** Landing v3 + páginas públicas estratégicas consumen tokens en lugar de valores hardcodeados.

**Entregables:**
- Landing v3: gold hardcodeado → `text-gold-500`, `bg-gradient-gold-purple`.
- PawCore, Donaciones, PawVoices, PawCompanys: tokens aplicados, dark mode parity.
- `pillars.ts`: `emoji` deprecated, `iconSrc` como único source.

**Dependencias:** Fases 1–2.
**Prioridad:** P1.
**Riesgo:** Bajo.
**Impacto:** Alto (primera impresión).

### Fase 4 — HTML / Pitch Rollout (Semana 5)

**Objetivo:** Los 7 HTMLs de pitch consumen un CSS compartido + proxy de tokens de la app.

**Entregables:**
- `/public/pitch/assets/brand.css` con tokens espejo de `:root`.
- Cada HTML hace `@import` del brand.css.
- Variables per-audience en archivos separados (`theme.investors.css`, etc.).
- Documentación de cómo clonar un pitch nuevo (plantilla base + per-audience theme).

**Dependencias:** Fase 1.
**Prioridad:** P1.
**Riesgo:** Bajo.
**Impacto:** Medio (mantenibilidad futura).

### Fase 5 — Asset System Creation (Semanas 5–7, paralelo)

**Objetivo:** Ejecutar la librería omnicanal del segundo MD.

**Entregables:** Ver `pawfriend-omnichannel-brand-assets-and-prompts.md` § 14–15.

**Dependencias:** Fase 1 (tokens).
**Prioridad:** P1.
**Riesgo:** Medio (volumen).
**Impacto:** Alto (unlock social / partner / investor channels).

### Fase 6 — QA, polish, baseline (Semana 8)

**Objetivo:** Consolidar el rebrand con validación.

**Entregables:**
- Playwright visual baselines de 10 screens.
- Lighthouse >= 90 en mobile + desktop (landing + ficha + PawCore).
- A11y audit pass (axe) en 10 screens.
- Dark mode parity pass.
- Documentación final del rebrand 2.0 live.

**Dependencias:** Fases 1–5.
**Prioridad:** P0.
**Riesgo:** Bajo.
**Impacto:** Alto (confianza).

---

## 13. Priorización

### Must have (P0)

- Tokens brand 2.0 (`gold.*`, `audience.*`, `motion-*`).
- Fredoka + JetBrains Mono cargados en la app.
- Admin + Provider dashboards alineados con sample-dashboard.
- Emojis fuera de superficies profesionales.
- Dark mode parity validada.
- Partner kit + investor kit (sin estos no hay outreach escalable).

### Should have (P1)

- Landing homogenizada con tokens.
- HTML pitch con CSS compartido.
- IG + FB + WhatsApp kits.
- Sample dashboard variantes Bronze/Silver/Gold.
- Mockup system device + dashboard.
- 10 SVG nuevos de la lista §7.5.

### Nice to have (P2)

- TikTok + YouTube kits.
- Event/conference kit.
- Motion library oficial (Framer-like).
- Figma library pública.
- Automatizaciones de asset generation.

---

## 14. Riesgos y trade-offs

### 14.1. Técnicos

- **Regresiones visuales silentes**: mitigación → baselines Playwright.
- **Bundle bloat** por nuevas fonts (Fredoka + JBMono): mitigación → font-display swap + subset latin.
- **Cascadas CSS por nuevos tokens**: mitigación → namespace `--brand-*`, `--gold-*`, `--audience-*` claros.

### 14.2. Visuales

- **Discontinuidad con usuarios existentes**: algunos pueden preferir el look actual. Mitigación → rollout suave, comunicación en changelog, mantener purple como constante.

### 14.3. Consistencia

- **Superficies pitch + app pueden desalinearse de nuevo** si el HTML no consume tokens desde el app: mitigación → brand.css compartido con proxy.

### 14.4. Adopción

- **El equipo futuro (cuando haya equipo) puede ignorar tokens**: mitigación → ESLint rule de "no hex hardcoded", documentación visible, review de PRs.

### 14.5. Percepción de marca

- **Riesgo: si se exagera el dorado, se percibe "luxury falso"**: mitigación → regla 60/30/10 estricta, gold solo en hero/premium.
- **Riesgo: si se remueven todos los emojis, se pierde calidez**: mitigación → gamificación preserva emojis intencionales (PawGame, PawCards, Missions).

---

## 15. Criterios de éxito

- **Cohesión visual**: 0 hex hardcoded en .tsx (verificado via ESLint rule).
- **Consistencia cross-surface**: un usuario que navega Landing → Auth → Home → Ficha → Admin siente una única voz.
- **Reducción de deuda visual**: 179 emojis decorativos → < 30 (solo gamification).
- **Mejor percepción de marca**: baseline NPS de landing +5 puntos después de rollout.
- **Sistema reusable**: crear un nuevo pitch deck (nueva audience) toma < 4 horas (vs ~2 días hoy).
- **Sistema escalable**: agregar un nuevo kit social (Threads, p.ej.) toma < 1 día.

---

## 16. Backlog accionable

### 16.1. Branding

- [ ] Definir marca 2.0 en `docs/brand-system.md` (resumen de este masterplan).
- [ ] Publicar brand guidelines visibles internamente.
- [ ] Registrar marca (INAPI Chile) — fuera de scope técnico, pero sugerido.
- [ ] Generar 10 SVG nuevos (lista §7.5) con prompts de `pawfriend-omnichannel-brand-assets-and-prompts.md`.

### 16.2. Design system

- [ ] Ampliar `tailwind.config.ts` con gold + audience + motion tokens.
- [ ] Ampliar `src/index.css` con CSS vars nuevos + font imports.
- [ ] Ampliar `src/lib/design-tokens.ts` con nuevas familias.
- [ ] Documentar cuándo usar cada token (ejemplos visuales).

### 16.3. Frontend

- [ ] Migrar Page H1 a `font-display` donde aplica (30+ páginas).
- [ ] Reemplazar shadows ad-hoc por escala oficial.
- [ ] Emoji cleanup por fases (continuar el sprint iniciado).
- [ ] Dark mode QA por página (checklist).

### 16.4. UX/UI

- [ ] Aplicar eyebrow + H2 + body pattern en 20 superficies clave.
- [ ] Homologar hit targets mobile (44×44 audit).
- [ ] A11y audit axe en 10 screens.

### 16.5. Surfaces

- [ ] Admin panel: KPI row con Fredoka + sparklines.
- [ ] Provider dashboard: alineación con sample-dashboard.
- [ ] Onboarding: cover Fredoka hero.
- [ ] Email HTML: tokens proxy (Arial fallback, inline).

### 16.6. QA

- [ ] Playwright baselines de 10 screens.
- [ ] Lighthouse audits + fix regressions.
- [ ] axe reports.
- [ ] Dark mode parity QA.

### 16.7. Documentación

- [ ] `docs/brand-system.md` (condensado de este doc).
- [ ] `docs/design-tokens-ref.md` (tabla completa con ejemplos).
- [ ] `docs/iconography-guide.md` (cuándo usar cuál librería).
- [ ] `docs/dark-mode-guide.md` (checklist PR).

---

## 17. Recomendación final

### Orden ideal de ejecución

1. **Semana 1 — Foundation**: Tokens + fonts + CSS vars. Aditivo, sin riesgo.
2. **Semana 2 — Piloto**: Admin panel (1 surface profesional alta-visibilidad). Si pasa, escalar.
3. **Semana 3 — Core rollout**: resto de producto.
4. **Semana 4 — Landing/marketing**.
5. **Semana 5 — Pitch HTML + asset system en paralelo**.
6. **Semana 6 — Partner/investor kits**.
7. **Semana 7 — Social kits**.
8. **Semana 8 — QA + baselines + launch**.

### Superficie piloto recomendada: **Admin panel**

Razón: es profesional (donde más se nota la discrepancia con el sample-dashboard), tiene volumen de componentes para validar el sistema, bajo riesgo de romper UX de usuarios finales (solo Paw Founder + futuro admin accede), y aporta credibilidad directa al cerrar reuniones con inversionistas.

Si el piloto pasa en Admin → desbloqueo para escalar al resto.

### Plan de rollout sugerido

- **Semanalmente** publicar el progreso interno ("rebrand week 2 — admin panel migrated").
- **Gatekeepers en PR**: baseline Playwright, ESLint rule hex, dark mode checklist.
- **Feature flag** opcional `BRAND_2_0_ENABLED` por si hay regresión que requiera rollback parcial (default true).
- **Changelog visible** `CHANGELOG.md` con cada fase.

---

## Apéndice A — Tabla rápida de tokens brand 2.0

| Token | Valor | Uso principal |
|---|---|---|
| `--brand-600` | #9333ea | Primary action, brand link |
| `--brand-100` | #f3e8ff | Brand subtle bg |
| `--gold-500` | #f59e0b | Premium accent mid |
| `--gold-600` | #d97706 | Premium accent deep |
| `--audience-invest-grad` | linear-gradient(135deg,#9333ea,#eab308) | Investors pitch |
| `--audience-companys` | #9333ea | Companys pitch |
| `--audience-partners` | #10b981 | Partners pitch |
| `--audience-voices` | #ec4899 | Voices pitch |
| `--ink` | hsl(270 15% 10%) | Body text |
| `--ink-soft` | hsl(270 10% 38%) | Muted |
| `--paper` | hsl(270 20% 98%) | Page bg |
| `--shadow-brand` | … | Primary hover glow |
| `--shadow-gold-glow` | … | Premium hero glow |
| `--motion-ease-out-soft` | cubic-bezier(.2,.8,.2,1) | Default |
| `--motion-fast/normal/slow/hero` | 150/250/400/700 ms | Duration scale |

---

## Apéndice B — Glosario

- **Brand system**: la capa de marca (colores, tipografía, voz).
- **Product UI system**: la capa de componentes y tokens funcionales.
- **Omnichannel**: conjunto de canales donde la marca debe aparecer (web, iOS, Android, IG, FB, TikTok, YouTube, WhatsApp, email, press, partnership, investor, creator).
- **Paw Friend 2.0**: el sistema definido por este documento.
- **Gamification**: superficies donde los emojis son intencionales (PawGame, PawCards, Missions).
- **Audience palette**: paletas semánticas para pitches per-audience (investors/companys/partners/voices).

---

*Fin del Rebrand Rollout Masterplan. Documento emparejado: `docs/pawfriend-omnichannel-brand-assets-and-prompts.md`.*
