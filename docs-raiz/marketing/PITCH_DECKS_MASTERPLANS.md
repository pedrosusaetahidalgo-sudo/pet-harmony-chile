# Paw Friend — Masterplans de los 3 nuevos pitch decks por audiencia

> **Acumulado para revisión Pedro 2026-04-19**.
>
> Este documento es el **manual de uso + decisiones de diseño + roadmap de iteración** de los 3 HTML nuevos creados en `pitch-inversionistas/` el 2026-04-18:
>
> - `PRESENTACION_COMPANYS.html` — empresas sponsor ($49.900-$199.900/mes)
> - `PRESENTACION_VOICES.html` — creadores e influencers peludos
> - `PRESENTACION_PARTNERS.html` — tiendas/restaurantes/seguros (barter sin plata)
>
> Más una sección final con notas sobre el `PRESENTACION.html` original (inversionistas) que **NO** fue refactorizado mayormente porque ya está alineado al modelo post-pivot.
>
> **Regla de oro confirmada por Pedro 2026-04-18**:
> > B2C tiene TODAS las funciones gratis. Premium = Paw Member voluntario (solo badge). Vets tienen restricciones. Donaciones son opcionales.

---

## 0. Índice

1. [Sistema de diseño común a los 4 HTML](#1-sistema-de-diseño-común)
2. [Masterplan PRESENTACION_COMPANYS.html](#2-companys)
3. [Masterplan PRESENTACION_VOICES.html](#3-voices)
4. [Masterplan PRESENTACION_PARTNERS.html](#4-partners)
5. [Notas sobre PRESENTACION.html (inversionistas)](#5-inversionistas)
6. [Bug fix ejecutado: copy desactualizado del Premium B2C viejo](#6-bug-fix-copy-obsoleto)
7. [Backlog para mañana](#7-backlog)

---

## 1. Sistema de diseño común

Los 4 HTML comparten:

| Elemento | Implementación |
|---|---|
| **Tipografía** | Plus Jakarta Sans (400-800) + Fredoka (cover h1) — Google Fonts |
| **Brand color** | Purple `#9333ea` (alineado con landing v3 + design system v1.0) |
| **Estructura** | Slides full-viewport con `scroll-snap-type: y mandatory` |
| **Navegación** | Topbar fijo + sidenav lateral (dots) + keyboard nav (↑↓ Esc) |
| **Progress bar** | Top fixed, gradient brand→acento por audiencia |
| **Self-contained** | Todo el CSS inline. Cada HTML se puede enviar por correo sin dependencias |
| **Print-friendly** | `@media print` desactiva chrome y hace page-break por slide |
| **Responsive** | Mobile-first con breakpoints 700/800/900/1100px |
| **Accesibilidad** | aria-labels en nav, h-jerarquía, focus visible |

### 1.1. Diferenciación de acento por audiencia

Cada presentación mantiene el brand purple como base pero usa un **acento secundario** para señalar de qué trata sin leer el título:

| HTML | Acento principal | Razón visual |
|---|---|---|
| `PRESENTACION.html` | Dorado `#eab308` | Inversionistas: dinero, valor, métricas |
| `PRESENTACION_COMPANYS.html` | Dorado `#eab308` + Bronze/Silver/Gold tiers | Marca corporativa CSR + tiers visuales |
| `PRESENTACION_VOICES.html` | Pink/Fuchsia/Rose `#ec4899` | Comunidad creativa, calidez, emotional |
| `PRESENTACION_PARTNERS.html` | Emerald/Teal `#10b981` | Comercio, intercambio, win-win |

### 1.2. Componentes reutilizables (presentes en los 4)

- `.cover` con logo flotante + tagline + meta chips
- `.eyebrow` (badge superior pequeño)
- `.lead` (párrafo intro grande bajo h2)
- `.grid-2 / .grid-3 / .grid-4` (cards adaptables)
- `.card` con `.ico` (cuadrado con icono custom)
- `.stats` (4 KPIs en row)
- `.bullets` (lista con check/heart/swap segun audiencia)
- `.quote` (cita con cite)
- `.spotlight` (callout destacado)
- `.founder-sig` (firma con avatar PF)
- `.cta-row` con `.btn-primary / .btn-ghost`
- `.tbl-wrap` (tabla styled)

### 1.3. Iconografía

Todos consumen `paw-friend-assets/Icons logos/` directamente (no `public/icons/landing/`) porque los HTML viven en `pitch-inversionistas/` y se sirven con paths relativos. Iconos más usados:

- `14_clinical_record.svg` (ficha)
- `22_search.svg` (directorio)
- `04_heart_paw.svg` (causa/comunidad)
- `30_star.svg` (reseñas)
- `27_rocket.svg` (lanzamiento)
- `26_clinic.svg` (clínicas)
- `24_partnership.svg` (alianzas)
- `25_growth.svg` (crecimiento)
- `20_chat.svg` (comunidad)
- `19_mobile_app.svg` (app)
- `12_first_aid.svg` (emergencia)
- `10_stethoscope.svg` (vets)
- `15_calendar.svg` (recordatorios)
- `21_notification.svg` (notif)
- `07_pulse.svg` (salud)

---

## 2. Companys

### 2.1. Contexto y audiencia

**Audiencia primaria**: empresas pet-friendly chilenas que pueden destinar presupuesto de RS/CSR/marketing a un sponsorship recurrente.
- Alimento (Royal Canin, Proplan, Master Dog, ACANA, Nutripro)
- Pet shops grandes (Petland, Pet Style, Mundo Mascotas)
- Seguros pet (MetLife Mascota, Falabella, Mapfre)
- Farmacias veterinarias (MSD, Bayer, Zoetis)
- Clínicas grandes con perfil institucional

**Ticket**: $49.900 (Bronze) / $99.900 (Silver) / $199.900 (Gold) CLP/mes.

**Documento base**: [pitch-inversionistas/03_PAW_COMPANYS_EMPRESAS.md](../../pitch-inversionistas/03_PAW_COMPANYS_EMPRESAS.md).

### 2.2. Estructura (10 slides)

| # | Slide | Mensaje principal | Visual clave |
|---|---|---|---|
| 1 | Cover | "Asocia tu marca con la salud de las mascotas chilenas" | Logo flotante + 3 chips meta |
| 2 | Quiénes somos | Ficha clínica + directorio + comunidad, hecho en Chile, SpA formal | 3 cards features + 4 stats credenciales |
| 3 | La causa | 7/10 hogares con mascota, 80% sin salud al día, refugios sin infra | 3 cards problema + spotlight |
| 4 | Qué es Paw Companys | Bronze/Silver/Gold cards con precios y features | Tier cards con badge "Más popular" en Gold |
| 5 | Por qué no es otro ad | CSR vs ad, dashboard público, aval social | 4 cards diferenciadores (csr gradient) |
| 6 | Qué gana tu empresa | Tabla beneficios x tier con check marks | Tabla matriz Bronze/Silver/Gold + quote |
| 7 | Compromisos | Sin letra chica, trazabilidad, exclusividad opcional | Bullets + spotlight "si no escalamos, refugios" |
| 8 | Activación | 3 pasos en 48 horas | 3 cards proceso + 4 stats KPIs |
| 9 | FAQ | 6 preguntas anticipadas | Grid 2x3 cards |
| 10 | CTA final | "Una de las primeras 5 Paw Companys de Chile" | Cover-style con 2 CTAs + founder sig |

### 2.3. Decisiones de diseño

1. **3 tier cards prominentes en slide 4** con badge "⭐ Más popular" en Gold — replicar éxito visual de SaaS pricing pages.
2. **Tabla en slide 6 con check marks por tier** — facilita decisión rápida (CMO escanea en 30 segundos).
3. **Slide 5 con clase `.csr` (gradient verde+morado)** para señalar visualmente que es CSR-first, no ad.
4. **Sin testimonios** porque aún no hay sponsors reales. Cuando los haya, agregar slot tipo "Quote de Director de Marketing".
5. **Email link directo** en CTA final con asunto pre-llenado.

### 2.4. Roadmap iteración

| Cuándo | Qué cambiar |
|---|---|
| Cuando aparezca primera Paw Company | Slide 6 → agregar logo + quote de Director |
| Cuando exista dashboard público de transparencia | Slide 5 → screenshot del dashboard real |
| Cuando aparezcan sponsors fundadores | Slide 7 → "agradecimiento perpetuo a los primeros 5" |
| Cuando haya métricas reales de NPS | Slide 6 → reemplazar "lo medimos" por "X% NPS asociado" |
| Cuando haya >100 Paw Members activos | Slide 5 → "X dueños con badge 💛 ven tu logo" |

### 2.5. Cómo enviarla

```
Asunto: [Nombre empresa] — Propuesta Paw Companys
Adjunto: PRESENTACION_COMPANYS.html
Body: ver Sección 1 carta de introducción de 03_PAW_COMPANYS_EMPRESAS.md
```

---

## 3. Voices

### 3.1. Contexto y audiencia

**Audiencia primaria**: creadores e influencers en redes sociales (Instagram, TikTok, YouTube, Twitch) que tienen mascotas y publican contenido sobre ellas.
- Pet creators chilenos con audiencias 1k-500k
- Cuentas de mascotas (gato/perro/exóticos)
- Veterinarios divulgadores (cuentas educativas)
- Adiestradores con presencia digital
- Pet bloggers / podcasters

**Modelo**: Sin pago directo. Beneficio = badge oficial + perfil destacado + código promo + beta access + prioridad en programas futuros.

**Documento base**: [src/pages/PawVoices.tsx](../../src/pages/PawVoices.tsx) + concepto del [PITCH_DECK.md](../pitch/PITCH_DECK.md).

### 3.2. Estructura (9 slides)

| # | Slide | Mensaje principal | Visual clave |
|---|---|---|---|
| 1 | Cover | "Si tus peludos te dieron audiencia, ayúdanos a darles algo de vuelta" | Logo flotante + meta chips |
| 2 | Quiénes somos | Paw Friend hecho en Chile + por una persona + 100% gratis | 3 cards features + 4 stats |
| 3 | Por qué tú | Buscamos voces auténticas, no contratos publicitarios | 4 cards "encajas si..." |
| 4 | Qué te damos | Badge + perfil + código promo + beta access | 4 cards (warm gradient) + spotlight escalamos juntos |
| 5 | Qué te pedimos | Link en bio + 1 reel/mes + voz propia | 3 step rows + quote founder |
| 6 | Cómo nos sostenemos | 5 motores transparentes, ninguno bloquea | Bullets de motores + spotlight "valor = confianza" |
| 7 | Cómo aplicar | 3 pasos, 7 días, sin contrato | 3 cards proceso + 4 stats |
| 8 | FAQ | 6 preguntas anticipadas | Grid 2x3 cards |
| 9 | CTA final | "Sumas tu voz? Hay un lugar para ti" | Cover-style con 2 CTAs |

### 3.3. Decisiones de diseño

1. **Acento pink/fuchsia/rose** en lugar del gold (Companys) → señala calidez, no comercial.
2. **Bullets con `♥` en lugar de `✓`** → microdetalle emocional alineado con audiencia creator.
3. **Slide 4 con clase `.warm`** (gradient rose+amber) → contrasta con el dark de Companys, se siente más "celebración" que "negociación".
4. **Step rows con número grande (1-2-3)** en slide 5 → comunica simpleza del compromiso.
5. **Quote del founder en slide 5** ("Lo que mejor convierte no es el ad perfecto, es la persona real") → refuerza autenticidad.
6. **FAQ slide 8 anticipa "¿me pagan?"** primero — la objeción más común del creator.

### 3.4. Roadmap iteración

| Cuándo | Qué cambiar |
|---|---|
| Cuando aparezca primera Paw Voice | Slide 3 → testimonio real con foto |
| Cuando se grabe primer reel oficial | Slide 5 → embed del reel como ejemplo |
| Cuando se cree primer programa pagado | Slide 4 → agregar tier "Paw Voice Pro" |
| Cuando haya stats de conversión por código | Slide 4 → reemplazar "métricas" por "+X% conversión" |
| Cuando se haga primer evento Paw Voices | Slide 4 → agregar foto del evento |

### 3.5. Cómo enviarla

```
Canal: DM en Instagram / TikTok directo al creator
Asunto: Hola [@handle] — te quería invitar a algo distinto de un ad
Adjunto: link a PRESENTACION_VOICES.html (deploy en pawfriend.cl/decks/voices)
Body: 3 frases personalizadas + invitación a llamada de 15min
```

---

## 4. Partners

### 4.1. Contexto y audiencia

**Audiencia primaria**: comercios y servicios cuyos clientes son (o pueden ser) dueños de mascotas. Modelo barter puro: 0 plata.
- Pet shops chicos/medianos
- Peluquerías y estética pet
- Restaurantes/cafés pet-friendly
- Seguros pet (productos específicos)
- Accesorios y marcas chicas
- Servicios (paseadores, sitters, daycare, hoteles caninos)
- Entrenadores
- Fotógrafos pet
- Cremación y memorial
- Farmacias veterinarias

**Modelo**: barter — partner ofrece beneficio real a Paw Members, Paw Friend ofrece visibilidad permanente en la app + redes + métricas.

**Documento base**: NO HAY MD previo (esta presentación inaugura el material formal de Partners). Se basa en:
- Filosofía de [CLAUDE.md §5](../../CLAUDE.md) (Paw Partners = barter, descuentos a Members ↔ publicidad gratis)
- Página `/registro-partner` ([src/pages/RegistroPartner.tsx](../../src/pages/RegistroPartner.tsx))

### 4.2. Estructura (9 slides)

| # | Slide | Mensaje principal | Visual clave |
|---|---|---|---|
| 1 | Cover | "Tú das un descuento a Paw Members. Nosotros te damos publicidad gratis" | Logo flotante + meta chips "sin pagar nada" |
| 2 | Quiénes somos | Paw Friend hecho en Chile + 100% gratis dueños | 3 cards features + 4 stats |
| 3 | El barter | Visual ⇄ con "Tú das" / "Recibes" lado a lado | Barter visual con 2 cards + arrow al medio |
| 4 | Para qué rubros | 12 verticales con emoji + ejemplo | Grid de "verticales" cards (pequeñas, escaneables) |
| 5 | Qué te damos | 6 beneficios concretos | 6 cards (perfil, /paw-partners, redes, métricas, aval, networking) |
| 6 | Qué ofreces | Tabla con ejemplos por rubro y beneficios aceptados | Tabla con validez mínima 6 meses |
| 7 | Activación | 4 pasos en 5 días | 4 step rows + 4 stats KPIs |
| 8 | FAQ | 8 preguntas anticipadas | Grid 2x4 cards |
| 9 | CTA final | "Sumas tu negocio?" + 20 fundadores con beneficios | Cover-style con 2 CTAs |

### 4.3. Decisiones de diseño

1. **Acento emerald/teal `#10b981`** → señala comercial, intercambio, dinero verde (sin ser corporativo).
2. **Slide 3 con visual ⇄ explícito** (`.barter-vis` con `.barter-arrow`) → comunica el core del modelo en 2 segundos.
3. **Slide 4 con 12 verticales emoji-first** → maximiza chances de "yo encajo!" en el lector.
4. **Bullets con `⇄` en lugar de check** → refuerza el barter en cada lista.
5. **Tabla en slide 6 muy concreta** → elimina ambigüedad sobre qué tipo de descuento es aceptable.
6. **Spotlight "Lo que NO aceptamos"** → previene partners de baja calidad ("5% solo el primer día del mes").
7. **Stats slide 7 incluyen `$0`** explícito como costo → quita objeción de pago al final.

### 4.4. Roadmap iteración

| Cuándo | Qué cambiar |
|---|---|
| Cuando aparezca primer partner | Slide 4 → agregar logos de los partners activos |
| Cuando haya dashboard de canjes | Slide 5 → screenshot real del reporte mensual |
| Cuando haya 20 partners fundadores | Slide 9 → cerrar oferta histórica + crear "wave 2" |
| Cuando se active geolocalización en directorio | Slide 5 → "tus clientes te encuentran por cercanía" |
| Cuando haya cross-promotion exitosa | Slide 5 → caso "X partner + Y partner colaboraron" |

### 4.5. Cómo enviarla

```
Canal A: DM Instagram al negocio
Canal B: Email a contacto comercial
Canal C: Imprimir y dejar en mostrador (es print-friendly)

Asunto: [Negocio] — barter sin plata con Paw Friend
Adjunto: PRESENTACION_PARTNERS.html
Body: 3 frases personalizadas + link a /registro-partner
```

---

## 5. Inversionistas (PRESENTACION.html)

### 5.1. Estado actual

[PRESENTACION.html](../../pitch-inversionistas/PRESENTACION.html) (943 líneas, 14 slides) está **alineado con el modelo post-pivot 2026-04-19**:

- ✅ Slide 7 ("Cómo ganamos plata") menciona los 5 motores correctos: donaciones, Paw Member voluntario $3.990 (con disclaimer "no bloquea features"), B2B vets free/$9.900/$29.900, clínicas $29.900, publicidad futura.
- ✅ Slide 8 ("Las 3 alianzas") describe Paw Voices, Paw Companys ($49.900-$199.900) y Paw Partners.
- ✅ Spotlight explícito: "El dueño de mascota = gratis para siempre, sin funciones bloqueadas".

**No requirió refactor mayor.** El sistema de diseño es coherente con los 3 nuevos HTML (mismas tokens, fuente, estructura).

### 5.2. Mejoras menores recomendadas (NO bloqueantes)

| # | Slide | Mejora opcional |
|---|---|---|
| 1 | Slide 14 (CTA final) | Agregar link a las 3 nuevas presentaciones (Companys/Voices/Partners) — para que el inversionista vea ecosistema completo |
| 2 | Slide 8 alianzas | Convertir cards en links a sus respectivos HTMLs nuevos |
| 3 | Slide 7 (monetización) | Agregar nota "ver pitch dedicado de cada motor en `pitch-inversionistas/`" |
| 4 | Topbar | Mantener consistencia visual con los 3 nuevos (mismo color counter por audiencia) |

Pedro, decide si quieres que aplique estas mejoras menores mañana o lo dejamos para una iteración posterior.

### 5.3. Documento base

[CONSOLIDADO_INVERSIONISTAS.md](../../pitch-inversionistas/CONSOLIDADO_INVERSIONISTAS.md) + 4 MDs por audiencia (CORFO, Start-Up Chile, Companys, Angels VC). El HTML es la versión visual.

---

## 6. Bug fix copy obsoleto

### 6.1. Problema reportado

Pedro reportó (2026-04-18) que en el FAQ del landing aparecía:
> "Es gratis para dueños con hasta 2 mascotas. Si tienes más o quieres funciones Premium (como compartir la ficha clínica por link), Premium parte desde $3.990 al mes."

Esto contradice el modelo post-pivot 2026-04-19 (B2C 100% gratis, Paw Member solo voluntario).

### 6.2. Causa raíz identificada

**El landing nuevo NO tiene el copy viejo** — la FAQ se movió a `/faq` con copy correcto. Pero quedaban 3 archivos con copy desactualizado:

1. **`src/pages/Upgrade.tsx`** — página completa con modelo Premium B2C viejo (mascotas: 2 vs ilimitadas, PDF: free=false, etc.). **Era código muerto** porque [src/App.tsx](../../src/App.tsx) ya redirige `/upgrade` → `/paw-member` desde el pivot, pero el archivo seguía físicamente en el repo.
2. **`src/components/ViewTutorial.tsx`** — 3 líneas con texto "Premium activo 14 días gratis", "compartir ilimitado solo Premium", "PDF requiere Premium".
3. **`marketing/LINKEDIN_LAUNCH_POST.md`** — 3 líneas con "gratis hasta 2 mascotas" + "Premium $3.990/mes si quieres PDF".

### 6.3. Acciones ejecutadas

- ✅ **Borrado**: `src/pages/Upgrade.tsx` (sin imports, código muerto post-pivot).
- ✅ **Editado**: `src/components/ViewTutorial.tsx` (3 líneas → modelo nuevo).
- ✅ **Editado**: `marketing/LINKEDIN_LAUNCH_POST.md` (3 menciones → modelo nuevo).
- ✅ **Verificado**: `npx tsc -b` pasa con 0 errores.

### 6.4. Pendientes para mañana (Pedro decide)

| # | Archivo | Riesgo | Acción sugerida |
|---|---|---|---|
| 1 | `src/lib/plans.ts:31` (`max_pets: 2` para free) | **Funcional** — puede haber lógica que bloquee añadir >2 mascotas | Revisar con `useCanAddPet` y subir `max_pets` a `Infinity` o eliminar el cap |
| 2 | `src/lib/__tests__/plans.test.ts` | Tests dependen del cap | Actualizar tests si se cambia plans.ts |
| 3 | Migraciones SQL `'7 días Premium'` `'1 mes Premium gratis'` (Paw Shop rewards) | **Datos** — son rewards canjeables con Paw Points para "obtener Premium" | Si Premium ya no existe, esos rewards no aplican. Decidir: borrar reward, o re-significar como "Donación a refugio en tu nombre" |
| 4 | `src/components/admin/AdminAnalytics.tsx:832` | Texto del funnel chart "→ Premium" | Cambiar a "→ Paw Member" o "→ Donación" |

### 6.5. Recomendación operacional

> **Hard refresh del browser** (Ctrl+Shift+R) y rebuild del deploy producción. El bundle viejo en `pawfriend.cl` aún tiene el copy desactualizado del Index.tsx old. El próximo `npm run build && git add docs/ && git push` resuelve el deploy.

---

## 7. Backlog para mañana

### 7.1. Prioridad alta (P0)

- [ ] Resolver `src/lib/plans.ts:31` (`max_pets: 2`) — verificar si bloquea funcionalmente, decidir si se elimina el cap.
- [ ] Build + deploy `npm run build && git add docs/ && git push` para que el landing nuevo + bug fix lleguen a producción.
- [ ] Hard refresh browser para confirmar que el FAQ desactualizado ya no aparece.

### 7.2. Prioridad media (P1)

- [ ] Migrar Paw Shop rewards "Premium" a "Donación a refugio en tu nombre" o equivalente honesto.
- [ ] Ajustar texto del funnel en AdminAnalytics.tsx.
- [ ] Decidir si aplicamos las 4 mejoras menores al PRESENTACION.html (Sección 5.2).
- [ ] Conseguir assets reales pendientes del landing v3 (foto founder, logos clínicas reales, testimonio Sofía Rosi) — ver [PAWFRIEND_LANDING_IMMERSIVE_MASTERPLAN.md §11.2](PAWFRIEND_LANDING_IMMERSIVE_MASTERPLAN.md#112-assets-que-faltan).

### 7.3. Prioridad baja (P2)

- [ ] Hostear los 3 HTML nuevos en rutas dedicadas (ej. `pawfriend.cl/decks/companys`, `/decks/voices`, `/decks/partners`) para envío fácil por link en lugar de adjunto.
- [ ] Generar versión PDF de cada HTML (usando print-to-PDF del browser, ya están preparados con `@media print`).
- [ ] Crear thumbnail PNG de cada presentación para link previews en redes.
- [ ] Versión en inglés para Latam (Argentina, México, Colombia) cuando sea momento.

### 7.4. Roadmap iteración (cuando haya tracción)

| Cuándo | Acción |
|---|---|
| Cuando aparezca primera Paw Company | Actualizar PRESENTACION_COMPANYS.html con logo + quote (ver §2.4) |
| Cuando aparezca primer Paw Voice | Actualizar PRESENTACION_VOICES.html (ver §3.4) |
| Cuando haya 5 Paw Partners | Actualizar PRESENTACION_PARTNERS.html con logos (ver §4.4) |
| Cuando haya métricas reales del audit cron | Actualizar stats de los 4 HTML con números actualizados |
| Cuando se cree dashboard público de transparencia | Embeds en Companys + Partners |

---

## Cierre

Los 4 HTML están **listos para enviar tal como están** desde mañana. El sistema de diseño es consistente, la copy está alineada al modelo post-pivot, y cada uno tiene su personalidad visual diferenciada por audiencia.

> **Recordatorio Pedro**: en materiales públicos usar siempre **"Paw Founder"** (no nombre real). Mascotas demo: **Kai** (perro pastor suizo) + **Ema** (gata).

— Documento generado el 2026-04-18 al cierre de la sesión.
