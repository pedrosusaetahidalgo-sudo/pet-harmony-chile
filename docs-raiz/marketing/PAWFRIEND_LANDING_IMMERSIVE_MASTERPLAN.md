# 🐾 Paw Friend — Immersive Landing Masterplan

> **Blueprint maestro** para rehacer [src/pages/Index.tsx](../../src/pages/Index.tsx) y convertirlo en una experiencia inmersiva, premium y fiel al producto real.
>
> **Generado**: 2026-04-18 · **Audiencia**: equipo (Pedro + IA) · **Estado**: estratégico, no implementación todavía.
>
> Este documento es la fuente de verdad para la próxima generación del landing. Toda decisión de copy, diseño, secciones, assets o arquitectura del nuevo landing debe pasar por acá antes de tocar código.

---

## 1. Resumen ejecutivo

### 1.1. Por qué el landing actual ya no basta

El landing actual ([src/pages/Index.tsx](../../src/pages/Index.tsx) — 668 líneas, 10 secciones) **funciona técnicamente** pero **no representa al producto real de 2026-04**. Tiene 4 problemas estructurales:

1. **Mockups 100% CSS, cero producto real**. El hero ([src/components/HeroV2.tsx](../../src/components/HeroV2.tsx)) y el showcase de PDF ([src/components/MedicalPDFShowcase.tsx](../../src/components/MedicalPDFShowcase.tsx)) usan device frames simulados con divs y gradientes Tailwind. Existen [public/videos/hero-pet.mp4](../../public/videos/hero-pet.mp4) y [src/assets/hero-pets.jpg](../../src/assets/hero-pets.jpg) sin usar.
2. **Pruebas sociales falsas**. [src/components/LogosBand.tsx](../../src/components/LogosBand.tsx) lista clínicas inventadas ("VetCentro Providencia", "VetPlus Santiago"). [src/components/Testimonials.tsx](../../src/components/Testimonials.tsx) lista dueños ficticios (Catalina Muñoz, Sebastián Rojas, Francisca López). **Riesgo de credibilidad**.
3. **Modelo de negocio desactualizado**. La FAQ del landing ([src/pages/Index.tsx:73-87](../../src/pages/Index.tsx#L73-L87)) sigue diciendo "Premium parte desde $3.990 al mes" cuando el modelo pivotó el 2026-04-19 a **Paw Member voluntario** (mismas features que gratis, solo badge). Desincroniza con [src/pages/PawCore.tsx](../../src/pages/PawCore.tsx) y [CLAUDE.md §5](../../CLAUDE.md).
4. **No comunica el alma del proyecto**. El landing dice "Hecho en Chile" como badge decorativo. PawFriend es **home-made por una persona**, **100% gratis para dueños**, con **5 motores opcionales** y **visión Latam**. Esto no aparece como pilar narrativo, solo como cards al final.

### 1.2. Objetivo del rediseño

Transformar el landing de **"correcto y bonito"** a **"emocionalmente memorable, técnicamente premium y estratégicamente alineado"**. Que el visitante en los primeros 8 segundos entienda:

1. **Qué es** (ecosistema gratis para cuidar la salud de tu mascota).
2. **Por quién** (una persona en Chile + comunidad pet lover).
3. **Por qué le conviene** (ficha clínica que cualquier vet puede leer + directorio de vets verificados + recordatorios + IA).
4. **Qué hacer** (CTA único y obvio: "Crear cuenta gratis" o "Soy veterinario").

### 1.3. Impacto esperado

| Dimensión | Hoy | Objetivo |
|---|---|---|
| **Claridad del mensaje** | Genérica, parece app más | Diferenciada: home-made + gratis + ecosistema |
| **Percepción de marca** | "Linda app chilena" | "Producto premium con alma chilena" |
| **Deseo emocional** | Funcional | Genera ganas de probar y compartir |
| **Conversión a registro** | Sin baseline | +50% relativo (hipótesis) |
| **Autoridad médica** | Mockups fake debilitan | Screenshots reales + vet beta tester real |
| **Pet lover signal** | Cards al final | Pilar narrativo central |

### 1.4. Qué significa "éxito" para este landing

- **Test del primo de Pedro**: alguien que nunca oyó de PawFriend entiende qué hace y siente ganas de registrarse en menos de 30 segundos en mobile.
- **Test del veterinario**: una vet (como Sofía Rosi) entiende en 1 minuto que esto le conviene profesionalmente y entra a `/para-veterinarios` sin fricción.
- **Test del inversionista (CORFO/angel)**: un evaluador entiende la visión, el modelo y la tracción en 2 minutos sin tener que leer el pitch deck.
- **Test del sponsor (Paw Companys)**: una empresa entiende que aliarse con PawFriend es asociarse con un proyecto que importa.

---

## 2. Qué es Paw Friend hoy

> Basado en evidencia: [CLAUDE.md](../../CLAUDE.md), [src/App.tsx](../../src/App.tsx) (67 rutas), [src/pages/PawCore.tsx](../../src/pages/PawCore.tsx), [docs-raiz/pitch/](../pitch/), MEMORY.md.

### 2.1. Propuesta de valor real

**PawFriend es el primer ecosistema digital chileno hecho por una persona, gratis para dueños, donde la salud, comunidad y vida de tu mascota viven en un solo lugar.**

No es solo:
- ❌ Una app de fichas (eso es solo el inicio).
- ❌ Un directorio de vets (eso es solo el descubrimiento).
- ❌ Un SaaS B2B (eso es solo cómo nos sostenemos).

Sino:
- ✅ Un **ecosistema** que cubre **salud + comunidad + emergencias + memoria + descubrimiento**.
- ✅ **Home-made**: una persona detrás (con apoyo de IA), no un equipo de 30 ni un VC presionando.
- ✅ **Gratis para siempre del lado dueño**, sostenido por 5 motores opcionales (Paw Member voluntario + B2B vets + Paw Companys + Paw Voices + publicidad futura).

### 2.2. Usuarios principales (4 audiencias declaradas)

Según [CLAUDE.md §5](../../CLAUDE.md):

| Audiencia | Qué busca | Qué encuentra |
|---|---|---|
| **Dueños de mascotas** | Salud, recordatorios, encontrar vet, comunidad | Todo gratis. Ficha PDF, directorio, IA, gamificación, donantes de sangre, memorial |
| **Veterinarios individuales** | Pacientes, ficha digital compartida, agenda | Plan Básica gratis (5 pacientes), Premium $9.900 |
| **Clínicas veterinarias** | Multi-seat, bulk import, agenda compartida | Plan Clínica $19.900, Pro Max $29.900 |
| **Profesionales no-vet** (walkers, sitters, trainers, groomers) | Vitrina pública | `/servicios` con perfil + reservas |

Más alianzas no-cliente: **Paw Voices** (creators), **Paw Companys** (sponsors), **Paw Partners** (descuentos).

### 2.3. Núcleo del negocio (joya de la corona)

Según [CLAUDE.md §9.6](../../CLAUDE.md):
1. **Ficha clínica PDF descargable** ([src/pages/PetClinicalRecord.tsx](../../src/pages/PetClinicalRecord.tsx) + edge function `generate-medical-summary`).
2. **Directorio público de veterinarios verificados** ([src/pages/DirectorioVets.tsx](../../src/pages/DirectorioVets.tsx) + perfiles SEO-friendly por comuna y especialidad).

Todo lo demás escala desde estos dos pilares.

### 2.4. Pilares funcionales del producto (con evidencia)

**Pilar 1 — Ficha clínica viva**
- `PetClinicalRecord` con vacunas, alergias, condiciones, peso, microchip, lote/serie de vacunas (feedback de Sofía vet).
- PDF descargable + ZIP con documentos.
- Compartir ficha 30 días con vet externo (`MedicalShare` + token).
- OCR de carnet de vacunación con IA (`ocr-vaccination-card` edge fn).
- Feline Grimace Scale.

**Pilar 2 — Directorio público + Booking V2**
- Filtro por comuna y especialidad.
- Perfiles públicos SEO (`PerfilVetPublico`).
- Booking V2 con availability rules, exceptions, audit trail.
- Reseñas verificadas (solo si reservaste).
- Estimador de precios por comuna (`PreciosVeterinarios`).
- Verificación Colmevet documentada.

**Pilar 3 — Recordatorios y rutinas**
- `Reminders` + `PetRoutines` + `UnifiedCalendar`.
- Cron de recordatorios (edge fn `reminder-cron`).
- Sync Google Calendar (3 edge fns OAuth).
- Push notifications nativas (Capacitor).

**Pilar 4 — Comunidad y vida cotidiana**
- Feed social + grupos por raza/condición (`Community`).
- `EnMemoria` (memorial mascotas fallecidas).
- `BloodDonors` (red donantes de sangre).
- Adopción.
- Chat 1-a-1 (feature flag).

**Pilar 5 — IA y eficiencia**
- `pet-assistant` (asistente IA básico).
- `breed-tips` (consejos por raza).
- `bereavement-assistant` (memorial empático).
- `process-consultation-transcript` (transcripción audio vet).
- `medical-suggestions` (sugerencias médicas básicas).
- `generate-weekly-owner-reports` + `generate-weekly-vet-reports` (reportes automáticos).

**Pilar 6 — Gamificación con propósito**
- `PawCollection` (Paw Cards coleccionables tipo TCG).
- `PawGame`, `Missions`.
- Score holo de salud real (no decorativo, refleja vacunas/peso/etc).
- Badge "💛 Paw Member" para usuarios que aportan.

**Pilar 7 — B2B vets profesional**
- Dashboard vet, ficha compartida, panel de pacientes.
- Bulk import CSV/Excel (Clínica/Pro Max).
- Reportes semanales automáticos.
- Reseñas verificadas, perfil público SEO.
- "Ver como me ven los dueños" (preview público en 1 click — diferenciador único, [src/components/provider/ProviderProfileEdit.tsx:166](../../src/components/provider/ProviderProfileEdit.tsx#L166)).
- Multi-branch (Pro Max).

### 2.5. Evolución reciente (último mes)

| Fecha | Hito |
|---|---|
| 2026-04-08 | Pivot médico (eliminación de SharedWalks/LostPets/Premium B2C inicial) |
| 2026-04-12 | Optimización costos: Haiku 8 fns + prompt cache + verify_jwt |
| 2026-04-13 | Landing redesign HeroV2 + MedicalPDFShowcase (este landing) |
| 2026-04-14 | Admin Powerhouse, auditoría backend (30 hallazgos resueltos) |
| 2026-04-15 | Cross-platform hardening (Android 70% Play Store) |
| 2026-04-16 | Quick wins Fase 1 (12 mejoras), feedback Palo beta tester |
| 2026-04-17 | Reordenamiento UX v3, telemetría en 29 edge fns, sistema auto-pilotado |
| 2026-04-18 | Donaciones + Paw Voices/Companys, sidebar reorganizada |
| **2026-04-19** | **Pivot monetización: Paw Member voluntario, modelo híbrido 6 motores, lanzamiento 1 mayo** |

El landing **no refleja** este pivot del 19. Por eso urge rehacerlo antes del lanzamiento.

### 2.6. Capacidades reales que hoy NO se ven en el landing

| Capacidad real | Visibilidad en landing actual |
|---|---|
| OCR de carnet de vacunación con IA | ❌ No mencionada |
| Compartir ficha 30 días con token | ❌ No mencionada |
| Red de donantes de sangre | ❌ No mencionada |
| Memorial de mascotas fallecidas | ❌ No mencionada |
| Paw Cards coleccionables (gamificación con propósito) | ❌ No mencionada |
| IA breed-tips por raza | ❌ No mencionada |
| Booking V2 con availability rules | ⚠️ Mencionado como "agenda" |
| Estimador de precios por comuna | ❌ No mencionada |
| Reportes semanales automáticos | ⚠️ Solo en sección B2B |
| Visión Latam | ❌ No mencionada |
| Home-made (una persona + IA) | ⚠️ "Hecho en Chile" como badge |
| Modelo de donaciones voluntarias | ⚠️ Solo card al final |

---

## 3. Diagnóstico del landing actual

### 3.1. Inventario de secciones (estado real)

| # | Sección | Componente | Estado | Diagnóstico |
|---|---|---|---|---|
| 1 | Hero "Ficha viva" | [HeroV2.tsx](../../src/components/HeroV2.tsx) | 🟡 | Headline OK, mockup CSS-only se siente "fake premium" |
| 2 | Logos clínicas | [LogosBand.tsx](../../src/components/LogosBand.tsx) | 🔴 | **Logos inventados**, riesgo de credibilidad |
| 3 | 3 pasos zig-zag | inline en Index.tsx | 🟡 | Mockups simulados con líneas grises, no se ve la app |
| 4 | PDF showcase | [MedicalPDFShowcase.tsx](../../src/components/MedicalPDFShowcase.tsx) | 🟢 | Sólido pero podría usar PDF real generado |
| 5 | Directorio vets | inline | 🟡 | Mapa simulado con grid de líneas, sin Leaflet real |
| 6 | Stats mercado chileno | inline | 🟢 | Buenos pero sin fuente clickeable, usar también para Latam |
| 7 | Testimonios | [Testimonials.tsx](../../src/components/Testimonials.tsx) | 🔴 | **Testimonios ficticios**, riesgo legal y credibilidad |
| 8 | B2B Vets dark band | inline | 🟢 | Buena dirección, copy efectivo, mockup decente |
| 8b | CTA Partners | inline | 🟡 | Pegado entre B2B y FAQ, rompe flujo narrativo |
| 9 | FAQ | inline | 🔴 | **Pricing desactualizado** ($3.990 Premium) |
| 9.5 | 6 roles cards | inline | 🟡 | Buena info pero satura: 6 audiencias en 1 vista |
| 10 | CTA final | inline | 🟢 | Funcional |
| Footer | Legal | [LegalFooter.tsx](../../src/components/LegalFooter.tsx) | 🟢 | Mínimo pero correcto |

Leyenda: 🟢 OK · 🟡 mejorable · 🔴 problema crítico.

### 3.2. Fortalezas

1. **Estructura sólida**: 10 secciones cubren todos los bloques esperados (problema, solución, prueba, B2B, FAQ, CTA).
2. **Hero con diferenciación local**: badge "Hecho en Chile" + headline en 2 líneas con gradiente warm.
3. **Mobile-first real**: visual del hero se reordena (badge → H1 → sub → visual → CTA).
4. **Showcase PDF cuidado**: sección 4 es la única que muestra "el resultado tangible" con sheet rotado y badge flotante.
5. **Tono cálido sin ser infantil**: "Empieza en 3 pasos", "Encuentra al veterinario ideal en tu comuna".
6. **Performance probable**: solo SVG/Tailwind, no imágenes pesadas.
7. **Accesibilidad básica**: usa `aria-labelledby`, `aria-label`, `aria-hidden`.
8. **SEO básico**: `<Helmet>` con title, description, canonical.

### 3.3. Debilidades críticas

1. **🔴 Testimonios ficticios**. Pueden parecer reales pero son inventados ("Catalina Muñoz", "Sebastián Rojas"). Si Sofía Rosi (vet beta tester real) o Palo (usuaria iPhone real) firmaran un testimonio real, sería oro.
2. **🔴 Logos clínicas inventados**. "VetCentro Providencia", "VetPlus Santiago" no existen. Riesgo legal y de confianza.
3. **🔴 Pricing desactualizado**. FAQ dice "$3.990/mes" cuando el modelo cambió a Paw Member voluntario.
4. **🔴 Mockups CSS-only en lugar de producto real**. Tenemos un producto vivo en producción y el landing no lo muestra. La gente quiere ver la app antes de registrarse.
5. **🟡 No comunica los pilares 4-7** (comunidad, donantes sangre, memorial, IA, gamificación). El landing solo vende ficha + directorio + recordatorios + B2B.
6. **🟡 Sección "6 roles" satura**. Mostrar 6 audiencias en una sola pantalla diluye el mensaje. Debería ser un menú de "elige tu camino".
7. **🟡 No hay storytelling**. Es un landing de features (qué hace) y no un landing de transformación (cómo cambia tu vida con tu peludo).
8. **🟡 Doble CTA Partners + FAQ + 6 roles** rompe el ritmo narrativo entre testimonios y CTA final.
9. **🟡 Footer minimalista**. Falta contacto, redes, link al pitch, /paw-core, /donaciones, /paw-voices.
10. **🟡 Cero motion** (más allá de hover scale). Se siente estático para 2026.

### 3.4. Secciones desactualizadas o subrepresentadas

| Bloque | Estado |
|---|---|
| Modelo monetización híbrido (5 motores) | Solo cards al final, no como pilar narrativo |
| Visión Latam | Inexistente |
| "Una persona detrás" (alma home-made) | Inexistente |
| Donaciones voluntarias como motor #1 | Solo CTA |
| Paw Voices, Paw Companys, Paw Partners | 6 cards apretadas |
| Apalancamiento founder + IA | Inexistente (oro para inversionistas) |
| Tracking real (audit dashboard, telemetría) | Inexistente |

### 3.5. Problemas visuales

1. **Gradientes warm muy similares en cada sección** (amber + rose + purple) → cansa visualmente.
2. **Cards rotadas** (PDF, badges flotantes) se ven "tipo pinterest 2018".
3. **Sin profundidad real** (ni glass, ni layered glassmorphism, ni motion progresivo).
4. **Mockups planos** (no se ven como la app real, parecen placeholders).
5. **Sin video** (siendo que existe `hero-pet.mp4`).
6. **Iconos genéricos lucide** (siendo que tenemos 30+ iconos custom en `paw-friend-assets/Icons logos/`).

### 3.6. Problemas UX/UI

1. **3 CTAs primarios diferentes** ("Crear cuenta gratis", "Ver cómo funciona", "Explorar directorio", "Ver planes para vets", "Registrar mi clínica", "Registrar mi negocio gratis", "Crear ficha de mi mascota"). Caos de prioridades.
2. **No hay path de "Soy veterinario"** desde el hero (solo aparece scroll abajo).
3. **No hay path de "Soy sponsor / pet lover"** desde el hero.
4. **Header sin navegación profunda**: solo `Veterinarios` y `Iniciar sesión`. Falta link a `/paw-core`, `/donaciones`, `/precios-veterinarios`, `/para-veterinarios`.
5. **Mobile**: el banner B2B con dark band + amarillo se ve agresivo en celular.

### 3.7. Gaps de conversión

1. **No hay prueba social cuantificada arriba del fold** (solo "+1.200 dueños en Chile" en bloque pequeño).
2. **No hay urgencia ni stakes claros** (la stat "80% sin salud al día" está abajo).
3. **No hay friction-free demo** ("ver demo sin registrarme" no existe).
4. **No hay gancho de Paw Card o gamificación** que invite a curiosear.

### 3.8. Desconexiones entre landing y producto real

| Promesa del landing | Realidad del producto |
|---|---|
| "Premium parte desde $3.990/mes" | Premium B2C eliminado, ahora Paw Member voluntario |
| "Hasta 2 mascotas gratis" | Mascotas ilimitadas son gratis (sin gate) |
| "Compartir ficha clínica por link (Premium)" | Compartir ficha es gratis (MedicalShare 30 días) |
| Testimonios firmados por X persona real | Testimonios inventados |
| "+40 clínicas" implícito en LogosBand | Cifra no verificada en landing |

---

## 4. Problema estratégico actual del landing

### 4.1. Por qué hoy el landing no representa bien a PawFriend

El landing fue construido en 2026-04-13 cuando PawFriend tenía un modelo Premium B2C clásico ("$3.990/mes para features extra"). En las 2 semanas siguientes, el producto pivotó a algo radicalmente distinto: **gratis para todos, con donaciones voluntarias y B2B vets como motor de sostenibilidad**. El landing quedó congelado en el modelo viejo.

Además, fue construido con la restricción "no tenemos screenshots reales aún" → todo se simuló en CSS. Esa restricción ya no aplica: la app está en producción, hay usuarios reales, hay vets reales (Sofía Rosi), hay un dashboard admin operativo, hay un audit cron que reporta métricas reales. Hay material para mostrar producto real.

### 4.2. Qué percepción errónea puede generar

| Percepción que se forma | Realidad |
|---|---|
| "Es una app freemium más" | Es un proyecto gratis con espíritu de bien común |
| "Lo hace una empresa con equipo" | Lo hace una persona en Chile (con apoyo de IA) |
| "Es solo ficha + directorio" | Es un ecosistema (ficha + comunidad + emergencias + memorial + descubrimiento) |
| "Es solo para Chile" | Visión Latam declarada en PawCore |
| "Cobran si quieres más mascotas" | Mascotas ilimitadas gratis |
| "Los testimonios suenan a stock photos" | Hay vets y dueños reales que firmarían |

### 4.3. Qué valor está dejando sin capturar

1. **Diferenciador home-made**: en un mundo de SaaS impersonales, "una persona en Chile + IA" es una historia única. Pet lovers conectan emocionalmente con esto.
2. **Diferenciador gratis-para-siempre**: en Chile no existe otra app de mascotas que prometa esto con honestidad.
3. **Diferenciador ecosistema**: competidores tienen 1-2 features. PawFriend tiene 7 pilares.
4. **Apalancamiento founder + IA**: 320 hrs vs 4.800 hrs equipo = 15x tiempo, 32-65x costo (ver [APALANCAMIENTO_FUNDADOR_IA.md](../pitch/APALANCAMIENTO_FUNDADOR_IA.md)). Esto es oro para inversionistas y para la narrativa "lo imposible se puede".
5. **Comunidad pet lover**: "si amas a los animales, hay un lugar" es un mensaje fuerte que se diluye al ser una sección entre muchas.

### 4.4. Impacto en adquisición, confianza y marca

- **Adquisición**: probablemente conversión < 5% (sin baseline). Mensaje genérico no diferencia.
- **Confianza**: testimonios y logos falsos pueden generar push-back si alguien hace fact-check.
- **Marca**: la app se percibe como "buena, una más" en lugar de "única, con alma".
- **Inversionistas**: la primera impresión digital no comunica la visión Latam ni el apalancamiento founder+IA.
- **Sponsors**: una empresa que evalúa Paw Companys ve el landing y no entiende por qué aliarse acá específicamente.

---

## 5. Objetivo del nuevo landing

### 5.1. Qué debe hacer sentir

| Audiencia | Sensación objetivo |
|---|---|
| **Dueño peludo** | "Por fin alguien hizo esto bien y gratis. Quiero probarlo ya con mi mascota." |
| **Veterinario individual** | "Esto me ahorra trabajo y me trae pacientes. Quiero registrarme." |
| **Clínica veterinaria** | "Esto es una herramienta clínica seria, no un toy app." |
| **Sponsor (Paw Company)** | "Aliarse acá es asociarse con un proyecto que importa y crece." |
| **Inversionista (CORFO/angel)** | "Hay tracción, hay visión, hay apalancamiento, hay equipo (founder + IA)." |
| **Pet lover en general** | "Quiero ser parte de esto, hasta sin tener mascota." |

### 5.2. Qué debe hacer entender

En menos de 30 segundos en mobile:

1. **Qué es**: PawFriend = ecosistema gratis para cuidar a tu mascota.
2. **Para quién**: dueños, vets, profesionales pet, sponsors, comunidad pet lover.
3. **Por qué importa**: 80% de mascotas chilenas sin salud al día, todos perdemos al vet de toda la vida en algún momento, viajar con tu peludo da angustia.
4. **Por qué nosotros**: home-made, gratis, ecosistema completo, hecho con amor en Chile, escalable a Latam.
5. **Qué hacer**: 1 CTA primario por audiencia (Dueño / Vet / Otro).

### 5.3. Qué acción principal debe provocar

**CTA primario único por path** (no más 5 botones competiendo):

- **Path Dueño** (default): "Crear cuenta gratis" → `/auth?role=owner`
- **Path Vet**: "Soy veterinario, ver planes" → `/para-veterinarios`
- **Path Sponsor / Voice**: "Quiero apoyar" → `/paw-companys` o `/paw-voices`
- **Path Curioso**: "Ver demo sin registro" → modal con video real

### 5.4. Qué percepción debe instalar sobre PawFriend

| Eje | Percepción objetivo |
|---|---|
| **Cariño** | "Lo hicieron porque les importa, no para vender" |
| **Calidad** | "Se ve premium, no parece hecho por una persona sola" |
| **Confianza médica** | "Vets reales lo usan, hay PDF descargable, hay verificación" |
| **Transparencia** | "Sin letra chica, sin trampa, sin gates ocultos" |
| **Comunidad** | "No es una app, es un movimiento" |
| **Momentum** | "Está creciendo, vale la pena subirse ahora" |

### 5.5. Qué lo haría verse verdaderamente premium y memorable

- **Producto real visible** (screenshots, video, demo interactiva).
- **Storytelling cinematográfico** en el hero (video con peludo real, no mockup CSS).
- **Motion progresivo en scroll** (parallax suave, fade-in por sección, pero sin marear).
- **Tipografía con peso** (Plus Jakarta Sans 700/800 bien usada en headlines).
- **Una sola idea fuerte por sección** (no 6 cards apretadas).
- **Microcopy con voz humana chilena** ("nos importa", "los peludos", no "engagement").
- **Pruebas reales** (vet beta tester real con foto, métrica real del audit).
- **Footer rico** (no solo Términos y Privacidad: también /paw-core, /donaciones, /paw-voices, /paw-companys, link a [pitch-inversionistas/](../../pitch-inversionistas/)).
- **Sin humo**: cero claims sin respaldo.

---

## 6. Estrategia de mensaje y posicionamiento

### 6.1. Mensaje principal (headline)

**Opciones priorizadas** (a testear en orden):

1. **"La salud de tu peludo, en un solo lugar. Y siempre gratis."**
   - Razón: junta la promesa funcional (salud + un solo lugar) con la promesa filosófica (gratis siempre).
2. **"Una sola app para la vida de tu peludo. Hecha con amor en Chile."**
   - Razón: amplía de salud a "vida" + ancla home-made.
3. **"Todo lo que tu peludo necesita. Cero plata, cero letra chica."**
   - Razón: emocional + diferenciador anti-freemium.

**Recomendación**: opción 1 para hero, opción 2 para meta description, opción 3 para social.

### 6.2. Mensaje secundario (subhead)

**Opción recomendada**:
> "Ficha clínica que cualquier vet puede leer, directorio de veterinarios verificados cerca de ti, recordatorios y una comunidad pet lover que empuja parejo. Hecho por una persona en Chile, gratis para siempre."

**Variantes más cortas para mobile**:
- "Ficha clínica, vets verificados, recordatorios. Gratis para siempre."
- "Salud, comunidad, emergencias y memoria. Todo en un lugar, gratis."

### 6.3. Promesa central (3 líneas para sticky de footer o below-the-fold)

> **Para tu peludo**: una ficha clínica que viaja contigo y un vet ideal cerca.
> **Para tu vet**: pacientes nuevos, ficha digital y agenda en una sola herramienta.
> **Para todos**: gratis para siempre, hecho en Chile, escalando a Latam.

### 6.4. Diferenciadores (hard truths que solo PawFriend puede decir)

| Diferenciador | Evidencia |
|---|---|
| **100% gratis para dueños, sin gates** | [PawCore.tsx](../../src/pages/PawCore.tsx), CLAUDE.md §5 |
| **Home-made por una persona + IA** | [APALANCAMIENTO_FUNDADOR_IA.md](../pitch/APALANCAMIENTO_FUNDADOR_IA.md) |
| **Ecosistema (no app puntual)** | 7 pilares funcionales |
| **PDF universal que cualquier vet lee** | edge fn `generate-medical-summary` |
| **Verificación Colmevet** | [ParaVeterinarios.tsx](../../src/pages/ParaVeterinarios.tsx) |
| **Reseñas verificadas (solo si reservaste)** | Booking V2 + reviews |
| **OCR de carnet de vacunación** | edge fn `ocr-vaccination-card` |
| **Red de donantes de sangre** | [BloodDonors.tsx](../../src/pages/BloodDonors.tsx) |
| **Memorial de mascotas fallecidas** | [EnMemoria.tsx](../../src/pages/EnMemoria.tsx) |
| **Visión Latam declarada** | PawCore valores |

### 6.5. Tono de voz

| Atributo | Definición | Ejemplo OK | Ejemplo NO |
|---|---|---|---|
| **Cercano chileno** | Tuteo chileno (tú, tienes, puedes) | "Lleva la ficha de tu peludo en el bolsillo" | "Llevad la ficha de vuestro animal" |
| **Cálido pero pro** | Cariño sin caer en infantilismo | "Tu vet ideal a 1,2 km" | "Wuf wuf wuf encuentra tu vet 🐾🐾🐾" |
| **Honesto sin humo** | Decir lo que es, sin marketing inflado | "Gratis. Sin letra chica. Sin trampa." | "La revolución del cuidado animal IA-powered Web3" |
| **Confiado sin arrogancia** | Mostrar el trabajo, no presumir | "Hecho en Chile por una persona + IA" | "El #1 de Latam" (sin pruebas) |
| **Emocional en lo emocional, técnico en lo técnico** | Voz cambia según pilar | Hero: emocional. B2B: pro. FAQ: directo. | Hero técnico, B2B emocional |

### 6.6. Emociones a transmitir

| Emoción | Cuándo | Cómo |
|---|---|---|
| **Tranquilidad** | Hero, ficha clínica | Imagen de peludo dormido + ficha al día |
| **Confianza** | Directorio, B2B, prueba social | Vets verificados, badges, reseñas reales |
| **Pertenencia** | Comunidad, paw lover roles | "Hay un lugar para ti" |
| **Urgencia suave** | Stats mercado, recordatorios | "80% sin salud al día" sin culpar |
| **Orgullo (chileno)** | Footer, paw core | "Hecho en Chile, escalando a Latam" |
| **Esperanza** | Donaciones, memorial | "Tu peludo importa siempre" |

### 6.7. Claims que sí podemos hacer (con evidencia)

- ✅ "Gratis para dueños, ahora y siempre" (decisión declarada en PawCore).
- ✅ "Tu ficha clínica en PDF, lista para cualquier vet" (edge fn existe).
- ✅ "Directorio de veterinarios verificados por comuna y especialidad".
- ✅ "Recordatorios automáticos que funcionan en web y mobile".
- ✅ "Hecho en Chile por una persona + IA".
- ✅ "Modelo voluntario: si las donaciones alcanzan, seguimos gratis".
- ✅ "Verificación Colmevet para vets".
- ✅ "Sync con Google Calendar".
- ✅ "Red de donantes de sangre".
- ✅ "Memorial para tu peludo".

### 6.8. Claims que debemos EVITAR (no respaldados)

- ❌ "+1.200 dueños en Chile" (ojo: revisar si existe métrica real, si no, sacar).
- ❌ "+40 clínicas" (verificar dato real antes de mostrarlo).
- ❌ Testimonios firmados por personas inventadas.
- ❌ "Líder en Chile", "#1", "El más usado" (sin pruebas).
- ❌ "Más de X usuarios" (sin source verificable y actualizable).
- ❌ "IA avanzada de diagnóstico" (no existe, hay sugerencias básicas).
- ❌ "Recomendado por veterinarios" (genérico, sin nombres reales).

---

## 7. Arquitectura narrativa ideal

### 7.1. Estructura propuesta (10 bloques con propósito narrativo claro)

Diseñada como un **viaje emocional** de visitante curioso → dueño convencido. Cada bloque conecta con el siguiente.

| # | Bloque | Propósito narrativo | Mensaje principal | Prioridad | Visual sugerido | CTA |
|---|---|---|---|---|---|---|
| **0** | **Sticky header** | Permanente: navegación + CTA siempre visible | Logo + nav + "Crear cuenta" | Must | Logo SVG + Plus Jakarta Sans | Crear cuenta gratis |
| **1** | **Hero cinematográfico** | Detener scroll en 2 segundos. Generar deseo. | "La salud de tu peludo, en un solo lugar. Y siempre gratis." | Must | Video real (`hero-pet.mp4`) o foto + UI overlay flotante | Crear cuenta gratis · Ver demo |
| **2** | **Prueba social inmediata** (above the fold extendido) | Validar la promesa con números reales | "+X dueños · Y vets verificados · Z comunas" | Must | Counter animado + logos clínicas reales | (sin CTA, es validación) |
| **3** | **El problema (urgencia suave)** | Generar la necesidad emocional | "Cuando tu peludo se enferma a las 3 AM, ¿dónde está su historia médica?" | Must | Foto noche + WhatsApp con vet conversando | (sin CTA) |
| **4** | **El ecosistema (1 sola pantalla, 4 pilares)** | Mostrar que es más que ficha | Salud · Comunidad · Emergencias · Memoria | Must | 4 cards con screenshot real de cada feature | Explorar ecosistema |
| **5** | **Joya: Ficha clínica que cualquier vet puede leer** | Profundizar el pilar #1 (joya de la corona) | "Una ficha PDF que viaja contigo. Limpia, completa, lista." | Must | PDF real generado con peludo demo + animación de "compartir por WhatsApp" | Crear ficha de mi peludo |
| **6** | **Joya: Vets verificados cerca de ti** | Profundizar el pilar #2 (joya de la corona) | "Filtra por comuna, lee reseñas reales, reserva sin intermediarios." | Must | Mapa Leaflet real con pines reales + perfil vet real (Sofía Rosi si autoriza) | Explorar directorio |
| **7** | **El alma del proyecto (home-made)** | Diferenciador emocional único | "Lo hace una persona, en Chile, con amor y con IA. Hecho para que siga gratis." | Must | Foto del founder o ilustración del proyecto + métrica de apalancamiento | Conoce nuestra historia |
| **8** | **Para los vets (banda dedicada)** | Convertir vets sin que dueños se distraigan | "Más pacientes. Ficha compartida. Agenda online. Plan Básica gratis." | Must | Dashboard real de vet (sanitizado) + Sofía Rosi testimonio real | Ver planes para vets |
| **9** | **La comunidad pet lover (los 5 caminos)** | Activar pertenencia + caminos secundarios | "Si amas a los animales, hay un rol para ti." | Should | 5 cards (Voices, Companys, Partners, Donantes sangre, Voluntarios) | Aplicar / Donar / Explorar |
| **10** | **CTA final emocional** | Cerrar con corazón | "Tu peludo merece esto. Empieza gratis hoy." | Must | Foto de peludo cálida + 1 CTA único | Crear cuenta gratis |
| **Footer** | **Footer rico** | Confianza + navegación + transparencia | Links + transparencia + Built in Chile | Must | Logo + 4 columnas + Built with Claude | (links múltiples) |

**FAQ se mueve a página dedicada `/faq`** (o accordion plegado al final del footer). Hoy ocupa demasiado real estate sin convertir.

### 7.2. Transiciones narrativas (cómo cada bloque lleva al siguiente)

- **Hero → Prueba social**: "¿Es de verdad? Mira los números."
- **Prueba social → Problema**: "Estos números importan porque…"
- **Problema → Ecosistema**: "Por eso hicimos esto: 4 pilares en una app."
- **Ecosistema → Joya 1 (Ficha)**: "Empezamos por lo más importante: la ficha."
- **Joya 1 → Joya 2 (Vets)**: "Tu ficha sirve cuando hay vet que la lea. Por eso construimos el directorio."
- **Joya 2 → Alma**: "¿Cómo es que esto es gratis? Te contamos."
- **Alma → Vets B2B**: "Y si eres vet, esto también es para ti."
- **Vets → Comunidad**: "No solo dueños y vets. Hay más roles."
- **Comunidad → CTA final**: "Sea tu rol cual sea, empieza acá."

---

## 8. Hero section de nivel top-tier

### 8.1. Headline ideal

> **"La salud de tu peludo, en un solo lugar.**
> **Y siempre gratis."**

- 12 palabras. Lectura ≤ 2 segundos.
- Linea 1 = promesa funcional (qué).
- Linea 2 = promesa filosófica (cómo) — el diferenciador anti-freemium en 4 palabras.
- "Peludo" en lugar de "mascota": cariño chileno, también separa de competidores.

### 8.2. Subheadline ideal

> "Ficha clínica que cualquier vet puede leer. Directorio verificado. Recordatorios. Y una comunidad pet lover que empuja parejo. Hecho en Chile."

Versión mobile (más corta):
> "Ficha PDF, vets cerca, recordatorios. Hecho en Chile, gratis para siempre."

### 8.3. CTA primario

```
[ Crear cuenta gratis  → ]
   Sin tarjeta · Sin letra chica
```

- Botón único, grande, contraste alto.
- Microcopy debajo elimina objeción de pago.

### 8.4. CTA secundaria

```
[ Ver demo (1 min) ]   ← abre modal con video
```

O alternativa:
```
[ Soy veterinario ] → /para-veterinarios
```

**Recomendación**: A/B test. Para usuarios sin contexto, el modal demo convierte mejor que enviarlos a otra página.

### 8.5. Propuesta visual del hero

**Layout split 55/45** en desktop:
- Izquierda (55%): badge + headline + subhead + CTA + bloque de prueba social compacto.
- Derecha (45%): **video real loop silencioso** (`hero-pet.mp4`) en device frame premium + 2 cards flotantes con datos reales de la app.

**Mobile**: stack vertical con video como segundo bloque (después del headline).

### 8.6. Tipo de preview del producto (3 opciones priorizadas)

1. **Video real loopeando** (`hero-pet.mp4` ya existe). Plus: producto vivo, profundidad, cinematográfico. Recomendado.
2. **Screenshot + animación CSS sutil** (cards floating, números contando). Plan B si video no rinde.
3. **Mockup interactivo** (la persona puede tocar/hover y ver micro-animaciones). Plan C, más complejo.

### 8.7. Sensación que debe generar en 3-5 segundos

- 0-1s: "Esto es para mi peludo" (foto/video genera identificación).
- 1-2s: "La promesa es gratis" (headline subraya).
- 2-4s: "Es serio, hay producto real" (preview del producto + prueba social).
- 4-5s: "Quiero probarlo" (CTA limpio).

### 8.8. Errores que deben evitarse

- ❌ Mockup CSS que parece de Figma (rompe la magia).
- ❌ Stock photo de perro genérico (todos los competidores los usan).
- ❌ Headline de 4 líneas (mata el ritmo).
- ❌ Más de 2 CTAs primarios.
- ❌ Background con 5 gradientes mezclados.
- ❌ Video con audio (mata la UX en mobile).
- ❌ Animación que entra cuando llegas al hero (la app se siente lenta).
- ❌ Texto sobre imagen sin scrim (legibilidad mala).

### 8.9. Assets reales que podrían integrarse en el hero

| Asset | Path | Uso |
|---|---|---|
| **Video real** | [public/videos/hero-pet.mp4](../../public/videos/hero-pet.mp4) | Visual principal del hero |
| **Foto fallback** | [src/assets/hero-pets.jpg](../../src/assets/hero-pets.jpg) | Poster del video |
| **Logo principal SVG** | [public/paw_friend_icon_principal.svg](../../public/paw_friend_icon_principal.svg) | Header sticky |
| **Wordmark horizontal** | [public/paw_friend_wordmark_horizontal.svg](../../public/paw_friend_wordmark_horizontal.svg) | Footer y badge |
| **Iconos custom** | [paw-friend-assets/Icons logos/](../../paw-friend-assets/Icons%20logos/) (30+ SVG) | Cards de pilares (paw_print, dog_face, cat_face, heart_paw, syringe, stethoscope, clinical_record, calendar, mobile_app, etc.) |
| **OG image** | [public/social_og_image_1200x630.png](../../public/social_og_image_1200x630.png) | Meta og:image |

---

## 9. Wireframe narrativo por secciones

### 9.1. Sticky header (siempre visible)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo SVG] Paw Friend  │ Vets · Para Vets · Apoyar · /paw-core  │  [Iniciar sesión] [ Crear cuenta gratis → ]
└──────────────────────────────────────────────────────────────────┘
```

- Mobile: solo logo + hamburger + CTA contraído.
- Backdrop blur al hacer scroll.

### 9.2. Sección 1 — Hero cinematográfico

```
┌────────────────────────────────────────────────────────────────────┐
│  [💛 Hecho en Chile · Gratis para siempre]                        │  [VIDEO LOOP MUTE]
│                                                                    │  ┌─────────────┐
│  La salud de tu peludo,                                            │  │ [hero-pet]  │
│  en un solo lugar.                                                 │  │   .mp4      │
│  Y siempre gratis.                                                 │  │             │
│                                                                    │  │ + cards     │
│  Ficha PDF, vets verificados, recordatorios. Hecho en Chile.       │  │   reales    │
│                                                                    │  │   flotando  │
│  [ Crear cuenta gratis → ]    [ Ver demo (1min) ]                 │  └─────────────┘
│                                                                    │
│  ⭐ 4.9 · +X dueños reales · Y vets verificados                   │
└────────────────────────────────────────────────────────────────────┘
```

### 9.3. Sección 2 — Prueba social cuantificada

```
┌────────────────────────────────────────────────────────────────────┐
│         "Confían en Paw Friend"                                    │
│                                                                    │
│   [Logo Vet 1]  [Logo Vet 2]  [Logo Vet 3]  [Logo Vet 4]  [+más]  │
│                                                                    │
│   X mascotas con ficha · Y vets verificados · Z comunas activas    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**IMPORTANTE**: solo logos REALES. Si no hay aún, sustituir por **"Sumándose a la comunidad"** con CTA "Ser pioneer".

### 9.4. Sección 3 — El problema (urgencia suave)

```
┌────────────────────────────────────────────────────────────────────┐
│  [Foto cinematográfica: peludo dormido en sofá, hora 3:14 AM]     │
│                                                                    │
│  Cuando tu peludo se enferma a las 3 AM,                          │
│  ¿dónde está su historia médica?                                  │
│                                                                    │
│  El 80% de las mascotas en Chile no tiene su salud al día.         │
│  Y cuando uno la necesita, está en un cuaderno perdido.            │
│                                                                    │
│  [ Crear ficha gratis ahora → ]                                   │
└────────────────────────────────────────────────────────────────────┘
```

### 9.5. Sección 4 — El ecosistema (4 pilares)

```
┌────────────────────────────────────────────────────────────────────┐
│        Una app, 4 mundos para tu peludo                            │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 🩺       │  │ 🧡       │  │ 🚨       │  │ 🌸       │          │
│  │ SALUD    │  │COMUNIDAD │  │EMERGENCIA│  │ MEMORIA  │          │
│  │          │  │          │  │          │  │          │          │
│  │ Ficha PDF│  │ Feed     │  │ Donantes │  │ En       │          │
│  │ Recorda- │  │ pet      │  │ sangre   │  │ memoria  │          │
│  │ torios   │  │ lovers   │  │ Vets 24h │  │ Cápsulas │          │
│  │ Vacunas  │  │ Adopción │  │ Triage IA│  │ del alma │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                    │
│  [ Explorar ecosistema → ]                                         │
└────────────────────────────────────────────────────────────────────┘
```

### 9.6. Sección 5 — Joya 1: Ficha clínica universal

```
┌────────────────────────────────────────────────────────────────────┐
│                                       │  [PDF REAL renderizado]    │
│  Una ficha que cualquier              │  ┌────────────────────┐   │
│  vet puede leer.                      │  │ PAW FRIEND CHILE   │   │
│                                       │  │ Ficha clínica      │   │
│  Vacunas, alergias, condiciones      │  │                    │   │
│  crónicas. Todo en un PDF que viajas │  │ Mascota: Kai       │   │
│  contigo y compartes por WhatsApp en │  │ Pastor suizo · 4a  │   │
│  3 toques.                           │  │                    │   │
│                                       │  │ Vacunas al día ✓   │   │
│  ✓ Calendario de vacunas             │  │ ...                │   │
│  ✓ Alergias destacadas               │  └────────────────────┘   │
│  ✓ Compartir 30 días con un link     │                            │
│  ✓ OCR del carnet con IA             │  [Animación: WhatsApp      │
│                                       │   recibe el PDF]           │
│  [ Crear ficha de mi peludo → ]      │                            │
└────────────────────────────────────────────────────────────────────┘
```

### 9.7. Sección 6 — Joya 2: Directorio de vets verificados

```
┌────────────────────────────────────────────────────────────────────┐
│  [Mapa Leaflet real con pines reales]   │  Tu vet ideal,           │
│  ┌─────────────────────────────────┐   │  a 1,2 km.               │
│  │      [Map Santiago/Chile]       │   │                          │
│  │   📍   📍   📍 (vets reales)   │   │  Filtra por comuna y     │
│  │      📍                          │   │  especialidad. Lee       │
│  │  ┌──────────────────────────┐  │   │  reseñas verificadas     │
│  │  │ Dra. Sofía Rosi  ✓ Verif.│  │   │  (solo si reservaste).   │
│  │  │ Vitacura · 1,2 km        │  │   │                          │
│  │  │ ⭐ 4.9 (X reseñas)        │  │   │  ✓ Por comuna             │
│  │  └──────────────────────────┘  │   │  ✓ Por especialidad       │
│  └─────────────────────────────────┘   │  ✓ Reseñas verificadas    │
│                                         │  ✓ Verificación Colmevet  │
│                                         │                          │
│                                         │  [ Explorar directorio → ]│
└────────────────────────────────────────────────────────────────────┘
```

### 9.8. Sección 7 — El alma del proyecto (home-made)

```
┌────────────────────────────────────────────────────────────────────┐
│  [Foto del founder con Kai/Ema]  │  Hecho por una persona,         │
│  ┌──────────────────┐            │  con amor, en Chile.            │
│  │ [Foto founder]   │            │                                 │
│  │ + mascota        │            │  Paw Friend lo construye una    │
│  └──────────────────┘            │  persona en Chile, apoyada      │
│                                  │  por IA, con la convicción      │
│  "Lo hago porque las mascotas    │  de que la salud de un peludo  │
│  me cambiaron la vida. Quiero    │  no debería ser un privilegio. │
│  que esto siga gratis para       │                                 │
│  siempre."                       │  Sin VC presionando, sin exit   │
│                                  │  forzado. Sostenido por:        │
│  — Paw Founder                   │                                 │
│                                  │  💛 Donaciones voluntarias      │
│                                  │  🩺 Planes para vets            │
│                                  │  🏢 Empresas Paw Companys       │
│                                  │  📣 Creators Paw Voices         │
│                                  │                                 │
│                                  │  [ Conoce nuestra historia → ]  │
└────────────────────────────────────────────────────────────────────┘
```

### 9.9. Sección 8 — Para vets (banda B2B dedicada)

```
┌────────────────────────────────────────────────────────────────────┐
│  [Fondo dark slate-900 + acento ámbar]                             │
│                                                                    │
│  🩺 PARA VETERINARIOS                                              │
│                                                                    │
│  ¿Tienes una clínica veterinaria?                                  │
│                                                                    │
│  Aparece en el directorio más usado por dueños en Chile.           │
│  Plan Básica gratis. Premium desde $9.900/mes.                     │
│                                                                    │
│  ✓ Más pacientes desde tu comuna                                   │
│  ✓ Ficha compartida con dueños                                     │
│  ✓ Agenda + Google Calendar                                        │
│  ✓ Reportes semanales automáticos                                  │
│  ✓ Verificación Colmevet                                           │
│                                                                    │
│  [Testimonio real: Sofía Rosi (vet beta tester real)]              │
│  "..." — Sofía Rosi, Vitacura                                      │
│                                                                    │
│  [ Ver planes ] [ Registrar mi clínica gratis ]                   │
└────────────────────────────────────────────────────────────────────┘
```

### 9.10. Sección 9 — La comunidad pet lover (5 caminos)

Reducido de 6 a 5 cards (eliminando duplicado "Profesionales no-vet" porque ya está en hero como path opcional). **Visual menos saturado**: 5 cards en row de 5 (desktop) / 1 col (mobile).

```
┌────────────────────────────────────────────────────────────────────┐
│  Si amas a los animales, hay un rol para ti                        │
│                                                                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│  │💛   │ │📣   │ │🏢   │ │🛍️   │ │🩸   │                          │
│  │Paw  │ │Paw  │ │Paw  │ │Paw  │ │Donar│                          │
│  │Memb-│ │Voi- │ │Comp-│ │Part-│ │sang-│                          │
│  │er   │ │ces  │ │anys │ │ners │ │re   │                          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                          │
│                                                                    │
│  Sin exclusividad, sin letra chica. Solo amor por los peludos.    │
└────────────────────────────────────────────────────────────────────┘
```

### 9.11. Sección 10 — CTA final emocional

```
┌────────────────────────────────────────────────────────────────────┐
│  [Foto cálida de peludo + dueño feliz]                             │
│                                                                    │
│  Tu peludo merece esto.                                            │
│  Empieza gratis hoy.                                               │
│                                                                    │
│  [ Crear cuenta gratis → ]                                         │
│                                                                    │
│  Sin tarjeta · Sin letra chica · Sin gates                         │
└────────────────────────────────────────────────────────────────────┘
```

### 9.12. Footer rico

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo + tagline]                                                  │
│                                                                    │
│  Producto    │ Comunidad    │ Para vets   │ Sobre Paw Friend       │
│  ─────────   │ ─────────    │ ─────────   │ ─────────              │
│  Ficha PDF   │ Donaciones   │ Planes      │ Paw Core               │
│  Directorio  │ Paw Voices   │ Registrar   │ Apalancamiento+IA      │
│  Recordator. │ Paw Companys │ Pricing     │ Pitch deck             │
│  Mapa        │ Donantes ☉   │ FAQ vet     │ Contacto               │
│  Memorial    │ Adopción     │             │ Términos               │
│              │              │             │ Privacidad             │
│                                                                    │
│  © 2026 Paw Friend · Hecho en Chile · Pagos seguros con Flow       │
│  [Built with Claude badge]                                         │
└────────────────────────────────────────────────────────────────────┘
```

---

## 10. Secciones recomendadas y secciones a eliminar

### 10.1. Crear (nuevas)

| Sección | Razón |
|---|---|
| **Prueba social cuantificada con métricas reales** | Hoy solo "+1.200 dueños" en mini-bloque. Subir a sección dedicada con numbers reales del audit cron |
| **Problema cinematográfico** | Hoy no hay sección "drama". El stats genérico no genera urgencia emocional |
| **Ecosistema 4 pilares** | Hoy no se comunica que es ecosistema (solo ficha + dir + B2B) |
| **Alma del proyecto (home-made)** | Hoy "Hecho en Chile" es badge. Subir a pilar narrativo |
| **Footer rico con 4 columnas** | Hoy footer minimal pierde oportunidad de descubrimiento |

### 10.2. Refactorizar

| Sección actual | Cambio |
|---|---|
| **Hero V2** | Cambiar mockup CSS por video real + cards reales |
| **LogosBand** | Cambiar logos placeholder por logos reales o métricas tipo "+X clínicas se sumaron" |
| **3 pasos** | Convertir en "Empieza en 60 segundos" con screenshots reales del onboarding |
| **PDF showcase** | Mantener pero usar PDF real generado + animación de compartir por WhatsApp |
| **Directorio vets** | Cambiar mapa CSS-grid por Leaflet real (interactivo, con pines de vets verificados reales) |
| **Stats mercado** | Mantener pero agregar fuente clickeable + extender a Latam |
| **Testimonios** | Cambiar inventados por testimonios reales (Sofía Rosi vet, Palo dueña, etc.) |
| **Para vets banda** | Mantener estructura, agregar testimonio real Sofía Rosi |
| **6 roles** | Reducir a 5 cards menos saturadas, mover comunidad a paso narrativo dedicado |
| **CTA final** | Mantener concepto, mejorar foto y eliminar gradiente saturado |

### 10.3. Eliminar

| Sección a eliminar | Razón |
|---|---|
| **CTA Partners standalone** (8b) | Pegado entre B2B y FAQ. Mover a la sección "5 caminos comunidad" |
| **FAQ inline en landing** | Mover a `/faq` o a accordion compacto en footer. Hoy ocupa demasiado real estate |
| **Sección "Profesionales no-vet"** del bloque 6 roles | Redundante con `/registro-veterinario` (ya cubre walkers, sitters, trainers, groomers) |

### 10.4. Información a condensar

- Stats mercado: 3 stats máx (no más).
- Pasos: 3 pasos máx.
- Bullets en cada sección: 3-4 máx.
- Cards en sección comunidad: 5 máx (antes 6).
- CTAs primarios visibles a la vez: 1.

### 10.5. Partes del producto que necesitan demostración visual

| Feature | Demo visual recomendada |
|---|---|
| **Ficha PDF** | PDF real renderizado + animación de compartir |
| **Directorio vets** | Mapa Leaflet real con pines reales |
| **Recordatorios** | Notificación push mockup en device frame |
| **OCR vacunas** | Antes/después: foto carnet → ficha digital |
| **IA breed-tips** | Card con tip IA generado para una raza popular |
| **Panel vet** | Screenshot real del dashboard (sanitizado) |
| **Donantes sangre** | Mapa con pin de donante + alerta urgente |
| **Memorial** | Card de mascota memorial con cápsula del alma |

### 10.6. Partes que deben simplificarse

- 6 roles → 5 cards.
- Múltiples gradientes warm → 1 paleta consistente.
- 7 CTAs distintos → 2 paths principales (Dueño / Vet) + 1 secundario (Comunidad).
- Múltiples cards rotadas → cards rectas con hover sutil.

---

## 11. Uso de assets del proyecto

### 11.1. Inventario de assets reutilizables

**Brand assets v1.0** (en [paw-friend-assets/](../../paw-friend-assets/)):

| Asset | Path | Uso recomendado en landing |
|---|---|---|
| Logo principal SVG | `svg/paw_friend_icon_principal.svg` | Header sticky + favicon |
| Logo dark | `svg/paw_friend_icon_dark.svg` | Sección B2B fondo dark |
| Logo mono | `svg/paw_friend_icon_mono.svg` | Print friendly (PDF, materiales) |
| Logo reverse | `svg/paw_friend_icon_reverse.svg` | Sección dark, footer dark |
| Wordmark horizontal | `svg/paw_friend_wordmark_horizontal.svg` | Hero badge + footer |
| Master 1024 | `svg/master_icon_1024.png` | OG image fallback |

**Iconos custom 30+** (en [paw-friend-assets/Icons logos/](../../paw-friend-assets/Icons%20logos/)):

| Icono | Uso recomendado |
|---|---|
| `01_paw_print.svg` | Cards comunidad |
| `02_dog_face.svg` | Card "para perros" |
| `03_cat_face.svg` | Card "para gatos" |
| `04_heart_paw.svg` | Hero badge "hecho con amor" |
| `05_bone.svg` | Decoración secundaria |
| `06_pet_house.svg` | Card "ecosistema completo" |
| `07_pulse.svg` | Card "salud al día" |
| `08_syringe.svg` | Card "vacunas" |
| `09_pill.svg` | Card "tratamientos" |
| `10_stethoscope.svg` | Card "vets verificados" |
| `11_thermometer.svg` | Card "control" |
| `12_first_aid.svg` | Card "emergencias" |
| `13_medical_cross.svg` | Card "salud" |
| `14_clinical_record.svg` | **Joya: ficha clínica** |
| `15_calendar.svg` | Card "recordatorios" |
| `16_clock.svg` | Card "tiempo real" |
| `17_checkmark.svg` | Bullets de features |
| `18_tasks.svg` | Card "rutinas" |
| `19_mobile_app.svg` | Card "app móvil" |
| `20_chat.svg` | Card "comunidad" |
| `21_notification.svg` | Card "recordatorios push" |
| `22_search.svg` | Card "directorio" |
| `23_cloud.svg` | Card "tu data en la nube" |
| `24_partnership.svg` | Sección Paw Companys/Partners |
| `25_growth.svg` | Sección B2B |
| `26_clinic.svg` | Card "B2B clínicas" |
| `27_rocket.svg` | Sección lanzamiento |
| `28_idea.svg` | Sección "Cómo funciona" |
| `29_target.svg` | Sección "para qué" |
| `30_star.svg` | Reseñas |

**Marketing assets** (en [paw-friend-assets/marketing/](../../paw-friend-assets/marketing/)):

| Asset | Uso |
|---|---|
| `social_og_image_1200x630.png` | OG image (ya enlazado en [index.html:37](../../index.html#L37)) |
| `social_instagram_post_1080x1080.png` | Compartir en redes desde landing |
| `social_instagram_story_1080x1920.png` | Compartir en stories desde landing |
| `splash_2732x2732.png` | Splash universal |

**Media en [public/](../../public/)**:

| Asset | Path | Uso |
|---|---|---|
| **Video hero** | `videos/hero-pet.mp4` | **Visual principal del hero (URGENTE: hoy no se usa)** |
| Foto hero pets | `src/assets/hero-pets.jpg` | Poster/fallback del video |
| Foto perfil perro | `src/assets/dog-profile-1.jpg` | Demo dueño |
| Foto perfil gato | `src/assets/cat-profile-1.jpg` | Demo dueño (gato) |
| Foto pet-friendly | `src/assets/pet-friendly-place.jpg` | Sección "comunidad" |

### 11.2. Assets que faltan (oportunidad de crear)

| Asset faltante | Prioridad | Cómo crearlo |
|---|---|---|
| **Screenshots reales del producto** (ficha, directorio, panel vet, mapa) | Must | `npm run dev` + screenshots cliente con datos demo |
| **Demo video producto (1 min)** | Should | Loom/Capcut grabando flow real |
| **Foto del founder + Kai/Ema** | Should | Foto del founder con sus mascotas reales (alma del proyecto) |
| **Logo de clínicas reales** que ya usan PawFriend | Must | Pedir autorización a Sofía Rosi y otras |
| **Testimonios reales firmados** | Must | Pedir a Sofía Rosi, Palo, otros beta testers |
| **Ilustración custom hero** (alternativa a foto) | Nice | Encargar a ilustrador chileno o usar IA |
| **Animaciones Lottie** | Nice | LottieFiles para microinteracciones |
| **Mapa Latam con visión expansión** | Nice | SVG simple destacando Chile+países objetivo |

### 11.3. Re-jerarquía visual

**Hoy**: gradientes warm dominan, cards rotadas, sin foto/video real.

**Propuesta**:
1. **Hero** = video real + brand purple sutil + texto blanco/dark.
2. **Pruebas** = white background + logos reales en escala de grises.
3. **Problema** = foto real + scrim oscuro + texto blanco.
4. **Ecosistema** = white + 4 cards con iconos custom.
5. **Joya 1 PDF** = warm gradient sutil + PDF real renderizado.
6. **Joya 2 Vets** = white + mapa Leaflet real interactivo.
7. **Alma** = warm pastel + foto founder.
8. **B2B** = dark slate + acento ámbar (mantener).
9. **Comunidad** = pink/rose pastel + 5 cards limpias.
10. **CTA final** = brand purple sólido + foto real.

---

## 12. Dirección visual premium

### 12.1. Estilo general

**Concepto**: "Editorial premium con calidez chilena". Inspiración:
- Linear.app (densidad informativa + claridad).
- Stripe.com (motion sutil + trust signals).
- Notion.so (storytelling visual + secciones bien delimitadas).
- Apple.com (jerarquía tipográfica + producto real protagonista).

**Lo que NO**:
- ❌ Estilo "AI startup 2024" (gradientes neón, neon glow, glassmorphism extremo).
- ❌ Estilo "kids app" (bordes súper redondeados, emoji everywhere, fuentes infantiles).
- ❌ Estilo "corporate B2B" (azul corporate, fotos stock de gente sonriendo).

### 12.2. Color y paleta (consolidada con design system v1.0)

**Brand**:
- `#9333EA` (purple-600) — primary
- `#7E22CE` (purple-700) — primary hover
- `#6B21A8` (purple-800) — texto wordmark "paw"

**Accent warm** (usado con criterio, no en todas las secciones):
- `#FBBF24` (amber-400) — acento cálido
- `#FB7185` (rose-400) — acento emoción

**Neutros** (slate, no gray):
- `#F8FAFC` (slate-50) — bg general
- `#0F172A` (slate-900) — texto principal

**Health states** (uso interno):
- `#10B981` (success/green) — vacunas al día
- `#F59E0B` (warning/amber) — vacunas por vencer
- `#EF4444` (danger/red) — vacunas vencidas

**Regla de oro**: brand purple en CTAs y chrome (10-15% pantalla), neutros slate en superficies y texto (75-80%), warm/health solo como acento puntual (5-10%).

### 12.3. Tipografía

**Fuente**: Plus Jakarta Sans (ya cargada en [index.html:16-17](../../index.html#L16-L17)).

**Escala recomendada**:
- Hero H1: `text-5xl md:text-7xl` con `font-black` (800), `tracking-tight` (-0.02em), `leading-[1.05]`.
- Section H2: `text-3xl md:text-5xl` con `font-black`, `tracking-tight`.
- Card H3: `text-xl md:text-2xl` con `font-bold` (700).
- Body: `text-base md:text-lg` con `font-normal` (400), `leading-relaxed`.
- Micro: `text-xs uppercase tracking-[0.15em] font-semibold` (badges).

**Regla**: máximo 3 tamaños de texto por sección.

### 12.4. Ritmo visual

**Vertical rhythm**:
- Padding sección: `py-20 md:py-28` (consistente).
- Espacio entre H2 y body: `mt-4 md:mt-6`.
- Espacio entre body y CTA: `mt-7 md:mt-10`.

**Alternancia de fondos** (clave para que no se sienta plano):
1. Hero: bg-hero-gradient sutil.
2. Pruebas: white.
3. Problema: dark slate-900 con foto.
4. Ecosistema: white.
5. Joya 1: warm pastel sutil.
6. Joya 2: white.
7. Alma: warm pastel cálido.
8. B2B: dark slate-900 + acento ámbar.
9. Comunidad: pink/rose pastel.
10. CTA final: brand purple sólido.
11. Footer: dark slate-800.

### 12.5. Fondos

- ✅ Sólidos planos (slate-50, white, slate-900, brand purple).
- ✅ Pasteles muy sutiles (5-10% saturación).
- ✅ Foto real con scrim controlado (opacidad 30-50%).
- ❌ 3 gradientes mezclados.
- ❌ Patrones decorativos noisy.

### 12.6. Layout

- **Container**: `max-w-6xl` para secciones de 2 columnas, `max-w-3xl` para secciones de texto centrado.
- **Grid**: 12-col grid en desktop, stack vertical en mobile.
- **Spacing**: tailwind defaults consistentes (space-y-6, gap-8, etc.).

### 12.7. Densidad

- **Hero**: baja densidad (mucho aire, foco en headline + CTA).
- **Secciones core**: densidad media (1 idea + 1 visual + 3 bullets max).
- **Footer**: alta densidad (4 columnas con muchos links, OK).

### 12.8. Tipo de imágenes/mockups recomendadas

1. **Video real loop** (hero).
2. **Screenshots reales del producto** (en device frames sutiles, no exagerados).
3. **PDF real renderizado** (joya 1).
4. **Mapa Leaflet real** (joya 2).
5. **Fotos reales con peludos chilenos** (Kai del founder, mascotas de beta testers).
6. **Iconos custom SVG** (de paw-friend-assets/Icons logos/).
7. **Cero stock photos**.

### 12.9. Cards y contenedores

- `rounded-2xl` (16px) para cards.
- `border border-neutral-200/70` o `ring-1 ring-black/5`.
- Shadow sutil (`shadow-card` o `shadow-elevated`).
- Hover: `hover:shadow-lg hover:-translate-y-0.5 transition-all`.
- **Sin rotaciones** (eliminar las cards rotadas tipo "scrapbook").

### 12.10. Screenshots

- Device frames sutiles (no marcos pesados).
- Sombra abajo sutil.
- Cropeados al feature relevante (no toda la pantalla).
- Anotaciones con flechitas o highlights solo si suman.

### 12.11. Motion y transiciones

**Lo que sí**:
- Fade-in al entrar en viewport (`opacity-0 → opacity-100` con stagger).
- Parallax muy sutil en hero (translate-y de fondo a la mitad de scroll).
- Counter animado en métricas.
- Hover scale sutil (`hover:scale-[1.02]`).
- Micro-bounce en CTAs al hover.
- Loop muy lento del video hero (8s).

**Lo que NO**:
- ❌ Animaciones que entran después del LCP.
- ❌ Parallax agresivo (marea).
- ❌ Confetti, partículas, efectos noisy.
- ❌ Auto-play con sonido.

**Implementación recomendada**: usar `framer-motion` ya disponible vía Radix, o CSS `animation` puro para no agregar bundle.

### 12.12. Profundidad visual

- Layered shadows (sombra cerca + sombra lejana).
- `backdrop-blur` en sticky header.
- Cards flotantes sobre fondos cálidos (con shadow elevated).
- **Sin glassmorphism extremo** (envejece mal).

### 12.13. Cómo lograr inmersión sin perder claridad

1. **Una idea por scroll**: cada sección debe ser auto-contenida, no exigir que el usuario recuerde la anterior.
2. **CTA siempre visible**: sticky header con CTA "Crear cuenta gratis".
3. **Visual antes que texto**: el ojo va primero a la imagen, luego al H2, luego al body.
4. **Motion sirve, no decora**: cada animación debe reforzar la jerarquía, no distraer.
5. **Performance budget**: LCP < 2.5s, CLS < 0.1, INP < 200ms.

---

## 13. UX/UI del landing

### 13.1. Principios

| Principio | Aplicación |
|---|---|
| **Escaneabilidad** | H2 grande + body 2-3 líneas + 3 bullets max + 1 CTA |
| **Jerarquía** | 3 niveles de texto max por sección |
| **Legibilidad** | Min 16px en mobile, contraste AA |
| **Mobile-first** | Diseñar mobile primero, luego desktop |
| **Accesibilidad** | aria-labels, focus rings, semantic HTML, alt text en imágenes |
| **CTA placement** | 1 CTA en hero, 1 sticky header, 1 al final, 1 por sección clave |
| **Navegación** | Header con 4 links max + CTA |
| **Microinteracciones** | Solo donde sumen (hover scale en cards clickeables) |
| **Responsive** | 3 breakpoints: mobile (default) / md (768px) / lg (1024px) |
| **Sticky** | Header sticky (con backdrop blur al scroll) |
| **Performance** | Lazy load de video debajo del fold, código splitting |
| **Claridad > espectacular** | Si una decisión visual confunde, sacrificar la espectacularidad |

### 13.2. Patrones específicos

**Hero**:
- Video con `loading="eager"` + `poster`.
- CTA primario visible siempre.
- Mobile: reordenar (badge → H1 → sub → video → CTA).

**Secciones**:
- `aria-labelledby` apuntando al H2.
- IDs en H2 para anchor links (`#salud`, `#vets`, `#alma`).

**CTAs**:
- Botón primario: `bg-primary text-white shadow-brand`.
- Botón secundario: `variant="outline"` o `variant="ghost"`.
- Microcopy debajo: "Sin tarjeta · Sin letra chica".

**Mobile**:
- Tap targets ≥ 44x44px.
- Menú hamburger con sheet desde la derecha.
- Stack vertical, no carousels horizontales para contenido core.

### 13.3. Performance constraints

| Métrica | Objetivo | Estrategia |
|---|---|---|
| LCP | < 2.5s | Hero image/video preloaded + optimizado |
| CLS | < 0.1 | Aspect ratios definidos en imágenes/video |
| INP | < 200ms | Sin JS pesado en above the fold |
| Bundle landing | < 200kb | Code split + lazy load secciones below the fold |
| Imágenes | WebP/AVIF + responsive | `<picture>` con srcset |
| Fuentes | Preload + display=swap | Plus Jakarta Sans ya optimizado |
| Video | < 2MB hero | Comprimir hero-pet.mp4, WebM fallback |

### 13.4. Claridad sobre espectacularidad vacía

Si una decisión hace el landing más "wow" pero menos claro o más lento → preferir claro y rápido. Ejemplos concretos:

- ❌ Animación 3D en hero que tarda 1s en cargar → ✅ Video real que carga progresivamente.
- ❌ Carousel automático de testimonios → ✅ Grid estático con 3 testimonios.
- ❌ Parallax fuerte → ✅ Fade-in sutil en viewport.
- ❌ Cursor custom → ✅ Cursor default + hover states claros.

---

## 14. Estrategia de copy

### 14.1. Sistema de copy

| Atributo | Valor |
|---|---|
| **Tono general** | Cercano chileno, cálido, honesto |
| **Persona** | Tuteo (tú, tu, tienes, puedes) |
| **Voz** | Primera persona plural ("hicimos", "creemos", "hacemos") |
| **Estilo** | Frases cortas. Verbos activos. Cero corporate-speak |
| **Longitud** | Hero H1: ≤ 12 palabras. Subhead: ≤ 25 palabras. Body sección: ≤ 50 palabras |
| **Estructura por bloque** | H2 → 1 párrafo → 3 bullets → 1 CTA |

### 14.2. Cómo hablar de beneficios (no de features)

| Feature técnica | Beneficio para el usuario |
|---|---|
| "PDF generado por edge function" | "Una ficha que cualquier vet lee" |
| "Booking V2 con availability rules" | "Reserva con tu vet sin tener que llamar" |
| "OCR con IA" | "Toma una foto al carnet y listo, todo digitalizado" |
| "Verificación Colmevet" | "Solo vets reales, validados oficialmente" |
| "Edge functions Deno" | (no mencionar, técnico) |
| "Supabase Postgres" | (no mencionar, técnico) |

### 14.3. Cómo presentar features sin sonar técnico

- **NO**: "Implementamos un sistema de notifications cross-platform via Capacitor push API".
- **SÍ**: "Te avisamos antes que se te pase la próxima vacuna".

### 14.4. Cómo sonar humano, ambicioso y confiable

| Atributo | Frases que SÍ | Frases que NO |
|---|---|---|
| **Humano** | "Lo hicimos porque las mascotas nos cambian la vida" | "Nuestra solución integral resuelve" |
| **Ambicioso** | "Hecho en Chile. Yendo por Latam" | "Líder en el mercado" |
| **Confiable** | "Sin letra chica. Sin gates. Gratis para siempre" | "Sujeto a términos y condiciones" |

### 14.5. Palabras y clichés a EVITAR

- ❌ "Revolucionario", "disruptivo", "next-gen".
- ❌ "Solución integral", "experiencia 360°".
- ❌ "Empoderamos", "transformamos".
- ❌ "AI-powered", "IA avanzada", "Web3", "blockchain".
- ❌ "Ecosistema digital de última generación".
- ❌ "Tu mejor amigo merece lo mejor" (cliché agotado).
- ❌ "La app que estaba esperando" (cliché).
- ❌ Emojis en headlines (sí en cards puntuales).
- ❌ "Únete a la revolución".
- ❌ "Pet parent" (preferir "dueño peludo" o "tutor").

### 14.6. Palabras que SÍ funcionan en este contexto

- ✅ "Peludo", "tu peludo" (chileno cariñoso).
- ✅ "Pet lover" (apropiado para comunidad).
- ✅ "Cuidamos lo que más quieres".
- ✅ "Hecho en Chile" (con orgullo).
- ✅ "Sin letra chica", "sin trampa".
- ✅ "Para siempre", "siempre gratis".
- ✅ "Tu vet de confianza", "tu vet ideal".
- ✅ "Una sola app", "todo en un lugar".
- ✅ "Empuja parejo", "la comunidad empuja".

---

## 15. Copy sugerido por sección (borrador inicial)

### 15.1. Hero

**Badge**:
> 💛 Hecho en Chile · Gratis para siempre

**H1**:
> La salud de tu peludo, en un solo lugar.
> Y siempre gratis.

**Subhead**:
> Ficha clínica que cualquier vet puede leer. Veterinarios verificados cerca de ti. Recordatorios. Y una comunidad pet lover que empuja parejo.

**CTA primario**:
> Crear cuenta gratis →

**CTA secundario**:
> Ver demo (1 min)

**Microcopy**:
> Sin tarjeta · Sin letra chica

**Trust signal**:
> ⭐ 4.9 · +X dueños · Y vets verificados en Chile

---

### 15.2. Prueba social cuantificada

**H2** (si hay logos):
> Confían en Paw Friend

**Métricas**:
> X mascotas con ficha digital · Y veterinarios verificados · Z comunas activas

**Variante si aún no hay logos sólidos**:
> Sumándose cada día. Sé parte de la comunidad pionera.

---

### 15.3. El problema (urgencia suave)

**H2**:
> Cuando tu peludo se enferma a las 3 AM,
> ¿dónde está su historia médica?

**Body**:
> El 80% de las mascotas en Chile no tiene su salud al día. Y cuando uno la necesita —en una urgencia, en un viaje, al cambiar de vet— está en un cuaderno perdido o en la cabeza de un vet que ya no atiende.

**Sub-body**:
> Hicimos Paw Friend para que esa historia te acompañe siempre, en tu bolsillo.

**Fuente** (linkable):
> Datos: Vetivery, SUBDERE/UC · 2024

---

### 15.4. El ecosistema (4 pilares)

**H2**:
> Una app, 4 mundos para tu peludo

**Sub**:
> No es solo una ficha. Es todo lo que tu peludo y tú necesitan para vivir tranquilos.

**4 cards**:

🩺 **Salud**
Ficha clínica PDF, vacunas al día, recordatorios automáticos, OCR del carnet.

🧡 **Comunidad**
Feed pet lover, grupos por raza, adopciones, el lado humano de tener un peludo.

🚨 **Emergencias**
Red de donantes de sangre, vets de urgencia 24h, ficha compartida en 1 toque.

🌸 **Memoria**
Cápsulas del alma, memorial de los que se fueron, espacio para honrar.

**CTA**:
> Explorar ecosistema →

---

### 15.5. Joya 1 — Ficha clínica universal

**Badge**:
> 📄 Ficha clínica PDF

**H2**:
> Una ficha que cualquier vet puede leer.

**Body**:
> Vacunas, alergias, condiciones crónicas, peso, microchip. Todo en un PDF limpio que viaja contigo y compartes por WhatsApp en 3 toques. Cuando cambias de vet o viajas, llega antes que tú.

**Bullets**:
- ✓ Calendario de vacunas siempre al día
- ✓ Alergias y condiciones crónicas destacadas
- ✓ Compartir 30 días con un link único
- ✓ OCR del carnet de vacunación con IA

**CTA**:
> Crear ficha de mi peludo →

---

### 15.6. Joya 2 — Vets verificados cerca de ti

**Badge**:
> 📍 Directorio público

**H2**:
> Tu vet ideal, a 1,2 km.

**Body**:
> Filtra por comuna y especialidad. Lee reseñas verificadas (solo dueños que reservaron pueden dejarlas). Reserva sin intermediarios. Verificación Colmevet integrada.

**Bullets**:
- ✓ Filtro por comuna y especialidad
- ✓ Reseñas verificadas con reserva real
- ✓ Verificación Colmevet
- ✓ Sin intermediarios, sin comisiones ocultas

**CTA**:
> Explorar directorio →

---

### 15.7. El alma del proyecto

**Badge**:
> 💜 Paw Core

**H2**:
> Hecho por una persona, con amor, en Chile.

**Body**:
> Paw Friend lo construye una persona en Chile, apoyada por IA, con la convicción de que la salud de un peludo no debería ser un privilegio. Sin VC presionando, sin exit forzado, sin gates ocultos.

**Cómo nos sostenemos**:
> 5 motores opcionales: donaciones voluntarias, Paw Member ($3.990/mes badge-only), planes para vets, Paw Companys (sponsors empresas), Paw Voices (creators). Ninguno bloquea features para dueños.

**Quote**:
> "Lo hago porque mis peludos me cambiaron la vida. Quiero que esto siga gratis para siempre, para los peludos de toda Latinoamérica."
> — Paw Founder

**CTA**:
> Conoce nuestra historia →

---

### 15.8. Para vets (B2B)

**Badge**:
> 🩺 Para veterinarios

**H2**:
> ¿Tienes una clínica veterinaria?

**Body**:
> Aparece en el directorio más usado por dueños en Chile. Recibe pacientes nuevos, gestiona ficha digital compartida, organiza tu agenda. Plan Básica gratis (5 pacientes). Premium desde $9.900/mes.

**Bullets**:
- ✓ Más pacientes desde tu comuna
- ✓ Ficha clínica compartida con dueños
- ✓ Agenda + sync Google Calendar
- ✓ Reportes semanales automáticos
- ✓ Verificación Colmevet integrada
- ✓ "Ver como me ven los dueños" en 1 click

**Testimonio real** (si Sofía Rosi autoriza):
> "PawFriend me cambió la forma de gestionar mis pacientes. Tener la ficha digital siempre conmigo, recibir reservas online, y el directorio público — todo en una sola herramienta."
> — Dra. Sofía Rosi, Vitacura

**CTAs**:
> [ Ver planes ] [ Registrar mi clínica gratis ]

---

### 15.9. La comunidad pet lover

**Badge**:
> 💛 Comunidad pet lover

**H2**:
> Si amas a los animales, hay un rol para ti.

**Sub**:
> Paw Friend lo hacemos porque queremos. Para que siga gratis, necesitamos comunidad.

**5 cards**:

💛 **Paw Member**
Aporta $3.990/mes voluntario. Mismas features, badge de honor.
[ Aplicar → ]

📣 **Paw Voices**
¿Creador en redes? Amplifica la misión con tu voz auténtica.
[ Aplicar → ]

🏢 **Paw Companys**
¿Tu empresa ama a los peludos? Sponsor mensual con logo + menciones.
[ Aplicar → ]

🛍️ **Paw Partners**
Tiendas, comida, restaurantes, seguros. Descuentos a Paw Members.
[ Escríbenos → ]

🩸 **Donante de sangre**
Si tu peludo califica, salva la vida de otro peludo en urgencia.
[ Inscribirme → ]

**Cierre**:
> Sin exclusividad, sin letra chica. Solo amor por los peludos.

---

### 15.10. CTA final

**H2**:
> Tu peludo merece esto. Empieza gratis hoy.

**Body**:
> Crea su ficha en 2 minutos. Encuentra tu vet ideal. Olvídate de la próxima vacuna olvidada.

**CTA**:
> [ Crear cuenta gratis → ]

**Microcopy**:
> Sin tarjeta · Sin letra chica · Sin gates

---

## 16. Experiencias inmersivas recomendadas

### 16.1. Lista priorizada con tradeoffs

| Experiencia | Propósito | Impacto | Costo | ¿Vale? |
|---|---|---|---|---|
| **Video real loop en hero** | Reemplazar mockup CSS por producto vivo | 🔥🔥🔥 | Bajo (asset existe) | ✅ Must |
| **Animación de PDF generándose y compartiéndose por WhatsApp** | Demostrar la joya en acción | 🔥🔥🔥 | Medio | ✅ Must |
| **Mapa Leaflet interactivo en directorio** | Producto real en lugar de mockup | 🔥🔥 | Medio | ✅ Should |
| **Counter animado de métricas reales** | Trust signal dinámico | 🔥🔥 | Bajo | ✅ Should |
| **Fade-in en scroll con stagger** | Inmersión narrativa progresiva | 🔥 | Bajo | ✅ Should |
| **Modal demo video de 60s** | Convertir curiosos sin registro | 🔥🔥🔥 | Medio | ✅ Must |
| **Storytelling cinematográfico en sección Problema** | Generar emoción + urgencia | 🔥🔥🔥 | Medio (foto+copy) | ✅ Must |
| **Parallax sutil en hero** | Profundidad sin marear | 🔥 | Bajo | ✅ Nice |
| **Carrusel de Paw Cards en sección comunidad** | Mostrar gamificación con propósito | 🔥 | Medio | ⚠️ Nice |
| **Cursor custom con paw print** | Memorable | 🔥 | Bajo | ❌ Skip (gimmick) |
| **3D del PDF flotando** | Wow | 🔥 | Alto | ❌ Skip (overkill) |
| **Asistente IA chat en landing** | Convertir visitas con IA | 🔥🔥 | Alto | ❌ Skip (después) |

### 16.2. Detalle por experiencia recomendada

**Video real loop en hero** (Must):
- Asset: [public/videos/hero-pet.mp4](../../public/videos/hero-pet.mp4) ya existe.
- Implementación: `<video autoPlay loop muted playsInline poster="hero-pets.jpg">` con compresión < 2MB.
- Fallback: imagen estática si `prefers-reduced-motion`.

**Animación de PDF compartiéndose por WhatsApp** (Must):
- Concepto: PDF aparece, se "dobla" como mensaje, llega a un mockup de chat de WhatsApp.
- Implementación: Framer Motion + 3 keyframes.
- Duración: 3 segundos, loop al entrar en viewport.

**Mapa Leaflet real interactivo** (Should):
- Reemplaza el mockup CSS-grid de la sección directorio.
- Mostrar Santiago zoom medio + 4-5 pines reales.
- Click en pin → tooltip con nombre vet + comuna + rating.
- Cargar dinámicamente solo cuando entra en viewport (intersection observer).

**Counter animado de métricas** (Should):
- Hook custom con `requestAnimationFrame` para count de 0 → N.
- Trigger: intersection observer.
- Métricas reales pulleadas del audit cron.

**Modal demo video de 60s** (Must):
- Botón "Ver demo" en hero abre modal con video grabado del flow real.
- Opciones: video pregrabado o video de YouTube embedded.

**Storytelling sección Problema** (Must):
- Foto cinematográfica (peludo durmiendo en sofá, hora 3:14 AM en reloj de fondo).
- Texto con scrim sutil.
- Sin CTA en esta sección (deja que la emoción decante).

---

## 17. Benchmarks y referencias conceptuales

> **Aclaración**: usar como inspiración de dirección, NO copiar.

### 17.1. Estructura narrativa

- **Linear.app** — orden narrativo claro, una idea por sección, motion sutil.
- **Stripe.com** — pruebas sociales con logos reales, tono honesto, código real visible.
- **Notion.so** — storytelling visual con screenshots reales de la app.

### 17.2. Tono y voz

- **Basecamp** — honesto, anti-corporate, "we don't do BS".
- **DuckDuckGo** — privacidad como valor central, anti-Big Tech.
- **Buffer** (clima 2018-2020) — transparencia radical, "open salaries, open everything".

### 17.3. Visualidad y motion

- **Apple.com (página de iPhone)** — producto real protagonista, motion premium.
- **Vercel.com** — dark + acento sutil, código real, profundidad sin glassmorphism.
- **Loom.com** — video real en hero, demo modal accesible.

### 17.4. Premium feel

- **Arc.net** (browser) — tipografía con peso, foto cinematográfica, motion lento.
- **Cron.app** — calendar premium, animaciones sutiles, tone profesional pero cálido.
- **Things.com** (todo app) — minimalismo cálido, sin gradientes saturados.

### 17.5. Pet/health específicos para validar dirección (no copiar)

- **Wisdom Panel** — DNA test pet, science-backed pero accesible.
- **Petfinder** — directorio adopción, simple y útil.
- **MyChart** (health humano) — ficha médica digital, trust + claridad.
- **One Medical** — clínica humana premium, tono cálido pero pro.

### 17.6. Lo que NO referenciar

- ❌ Apps tipo "TikTok for pets" (Petworld, etc.) — tono inadecuado.
- ❌ ERP de clínicas veterinarias (VetTabber, etc.) — demasiado B2B frío.
- ❌ Marketplaces de pet (Chewy.com) — modelo distinto.
- ❌ Apps de citas para mascotas — tono opuesto al nuestro.

---

## 18. Arquitectura técnica sugerida

### 18.1. Estructura de archivos en el proyecto actual

**Mantener filosofía actual**: landing es `src/pages/Index.tsx` + componentes en `src/components/landing/` (carpeta nueva, hoy los componentes del landing están sueltos en `src/components/`).

```
src/
  pages/
    Index.tsx                    # Landing principal (orquestador)
  components/
    landing/                     # NUEVO: carpeta dedicada
      Hero.tsx                   # Hero v3 con video real
      SocialProofBand.tsx        # Pruebas sociales reales
      ProblemSection.tsx         # Storytelling problema
      EcosystemSection.tsx       # 4 pilares
      MedicalRecordShowcase.tsx  # Joya 1: PDF
      VetDirectoryShowcase.tsx   # Joya 2: Mapa
      AlmaSection.tsx            # Home-made
      ForVetsSection.tsx         # B2B
      CommunitySection.tsx       # 5 cards
      FinalCTA.tsx               # CTA emocional
      RichFooter.tsx             # Footer con 4 columnas
      LandingHeader.tsx          # Header sticky con nav
    layouts/
      PublicLayout.tsx           # Existente
  hooks/
    useCountUp.ts                # NUEVO: counter animado
    useIntersectionObserver.ts   # NUEVO: trigger animaciones
public/
  videos/
    hero-pet.mp4                 # Existente, comprimir a < 2MB
    hero-pet.webm                # NUEVO: fallback WebM
  landing/
    pdf-real-demo.png            # NUEVO: PDF real renderizado
    panel-vet-real.png           # NUEVO: dashboard vet sanitizado
    founder-with-kai.jpg         # NUEVO: foto founder
    night-pet.jpg                # NUEVO: foto sección Problema
```

### 18.2. Componentes recomendados

**Crear nuevos**:
- `<HeroVideo>` — video player con poster, lazy load, fallback.
- `<CountUp>` — counter animado desde 0 a N en intersection.
- `<RevealSection>` — wrapper con fade-in al entrar viewport.
- `<DemoModal>` — modal con video demo del flow real.
- `<RealMetricsCard>` — métricas reales pulleadas del audit.

**Reutilizar de shadcn/ui**:
- `Button`, `Card`, `Accordion`, `Badge`, `Dialog`.

**Reutilizar de proyecto**:
- `LegalFooter` (refactorizar a `RichFooter`).
- `PublicHeader` (refactorizar a `LandingHeader`).

### 18.3. Estrategia de assets

**Imágenes**:
- Servir desde `/public/landing/` con WebP + fallback JPG.
- `<picture>` con `<source srcset="..webp">` y `<img src="..jpg">`.
- Lazy load todo lo que está debajo del fold (`loading="lazy"`).
- Responsive con `srcset` y `sizes`.

**Video**:
- WebM + MP4 fallback.
- Comprimir hero-pet.mp4 con HandBrake/ffmpeg a < 2MB.
- `preload="metadata"`.
- Poster como JPG comprimido.

**SVG**:
- Iconos custom de `paw-friend-assets/Icons logos/` movidos a `public/icons/landing/` o importados como componentes React.

**Fuentes**:
- Plus Jakarta Sans ya optimizado en index.html.

### 18.4. Performance

| Estrategia | Implementación |
|---|---|
| Code splitting | `React.lazy` para componentes below the fold |
| Tree shaking | Importar solo iconos usados de `@/lib/icons` |
| Image optim | WebP + AVIF + responsive `srcset` |
| Video lazy | `preload="metadata"` + intersection observer para play |
| Critical CSS | Tailwind purge + critical path inline |
| Prefetch | `<link rel="prefetch">` para `/auth` y `/para-veterinarios` |
| Defer JS | Scripts no críticos con `defer` |

### 18.5. SEO técnico

| Elemento | Implementación |
|---|---|
| Title | `Paw Friend — La salud de tu peludo, en un solo lugar. Y siempre gratis.` |
| Description | "Ficha clínica digital, veterinarios verificados por comuna y recordatorios. Hecho en Chile, gratis para siempre." |
| Canonical | `https://pawfriend.cl/` |
| OG image | `/social_og_image_1200x630.png` (existe) |
| Twitter card | `summary_large_image` (existe) |
| JSON-LD | Schema.org `Organization` + `WebSite` + `LocalBusiness` |
| Sitemap | `generate-sitemap` edge fn (existe) |
| Robots.txt | Permitir indexación, declarar sitemap |
| `hreflang` | `es-CL` ahora, prep para `es-AR`, `es-MX` futuro |

### 18.6. Accesibilidad

| Estándar | Implementación |
|---|---|
| Semántica | `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>` |
| Headings | H1 único en hero, H2 por sección |
| ARIA | `aria-label` en botones icon-only, `aria-labelledby` en sections |
| Focus visible | `focus-visible:ring-2` en interactivos |
| Contraste | AA mínimo (4.5:1 body, 3:1 UI elementos grandes) |
| Alt text | Todas las imágenes con alt descriptivo |
| Video | Captions opcionales (sin audio en hero, OK) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` desactiva animaciones |
| Keyboard | Todo navegable con Tab |

### 18.7. Organización para mantenibilidad

- **1 componente por sección** (no monolítico Index.tsx).
- **Datos de contenido en archivos separados** (`src/components/landing/content/copy.ts`).
- **Imágenes y assets en `/public/landing/`** (no mezclados con favicons).
- **Tokens de animación en `tailwind.config.ts`** (no inline).

---

## 19. Plan de implementación por fases

### Fase 1 — Auditoría alineada + copy strategy (3 días)

**Objetivo**: dejar los inputs base listos antes de tocar diseño.

**Entregables**:
- ✅ Este documento (masterplan).
- 🔲 Copy borrador validado por Pedro (sección 15 de este doc).
- 🔲 Lista de testimoniales reales conseguidos (Sofía Rosi + Palo + 1-2 más).
- 🔲 Lista de logos clínicas reales (con autorización por escrito).
- 🔲 Métricas reales del audit cron (counter base).
- 🔲 Foto del founder + Kai/Ema (o ilustración).
- 🔲 Decisión: ¿incluir testimonial real con nombre/foto o solo iniciales?

**Dependencias**: contacto con Sofía Rosi y otros beta testers.
**Riesgo**: que beta testers no autoricen → plan B con citas anónimas tipo "una vet de Vitacura".

### Fase 2 — Arquitectura y secciones (5 días)

**Objetivo**: estructurar el código nuevo sin perder lo bueno actual.

**Entregables**:
- 🔲 Crear `src/components/landing/` con 11 componentes nuevos.
- 🔲 Refactor de `src/pages/Index.tsx` como orquestador.
- 🔲 Migrar copy de Sección 15 a archivos `content/`.
- 🔲 Implementar todas las secciones con contenido real (sin mockups CSS-only).
- 🔲 Implementar `LandingHeader` con nav extendida.
- 🔲 Implementar `RichFooter` con 4 columnas.
- 🔲 Mover FAQ a `/faq` o accordion en footer.

**Dependencias**: Fase 1 completa.
**Impacto**: alto (cambio total del landing).
**Complejidad**: media.

### Fase 3 — Visual premium e inmersión (5 días)

**Objetivo**: subir el bar visual sin sacrificar performance.

**Entregables**:
- 🔲 Video hero comprimido y lazy-loaded.
- 🔲 PDF real renderizado en showcase.
- 🔲 Mapa Leaflet real en directorio.
- 🔲 Counter animado en métricas.
- 🔲 Fade-in con stagger en cada sección.
- 🔲 Modal demo con video grabado.
- 🔲 Iconos custom de `paw-friend-assets/Icons logos/` integrados.
- 🔲 Tipografía optimizada (preload, display=swap).

**Dependencias**: Fase 2 completa + assets reales (video producto, screenshots).
**Impacto**: alto (transforma percepción).
**Complejidad**: alta.
**Riesgo**: que el video pese > 2MB y degrade LCP.

### Fase 4 — Integración de assets reales y demos (3 días)

**Objetivo**: reemplazar todo placeholder por contenido real.

**Entregables**:
- 🔲 Logos clínicas reales en SocialProofBand.
- 🔲 Testimonios reales en sección Vets B2B.
- 🔲 Screenshots reales del producto en cada showcase.
- 🔲 Video demo grabado de 60s.
- 🔲 Foto founder + mascotas.
- 🔲 Métricas reales del audit cron en counters.
- 🔲 Quitar TODOS los testimonios y logos ficticios.

**Dependencias**: assets reales conseguidos en Fase 1.
**Impacto**: crítico para credibilidad.

### Fase 5 — Polish, mobile, performance y QA (3 días)

**Objetivo**: rematar para que el landing pase los tests de calidad.

**Entregables**:
- 🔲 Lighthouse score: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 100.
- 🔲 Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms.
- 🔲 Test mobile real en iOS + Android Chrome.
- 🔲 Test en Safari iOS (problemas conocidos con video autoPlay).
- 🔲 Test en navegadores modernos (Chrome, Edge, Firefox, Safari).
- 🔲 Test cross-platform (cross-platform-validator agent).
- 🔲 Test prefers-reduced-motion.
- 🔲 Test prefers-color-scheme dark (decidir si soportar dark mode).
- 🔲 QA de copy (revisar tuteo chileno, sin claims sin respaldo).
- 🔲 Deploy preview + revisión Pedro.
- 🔲 Merge + deploy producción.

**Dependencias**: Fases 1-4 completas.

### 19.1. Timeline total estimado

| Fase | Días |
|---|---|
| 1. Copy + auditoría | 3 |
| 2. Arquitectura + secciones | 5 |
| 3. Visual premium | 5 |
| 4. Assets reales | 3 |
| 5. Polish + QA | 3 |
| **Total** | **19 días hábiles** (~4 semanas) |

Con apalancamiento founder + IA realista: **2 semanas**.

---

## 20. Priorización

### Must have (lanzamiento 1 mayo)

1. ✅ Headline alineado con modelo actual ("gratis para siempre").
2. ✅ Eliminación de testimonios y logos ficticios.
3. ✅ FAQ con pricing actualizado o movido a /faq.
4. ✅ Video real en hero (`hero-pet.mp4` lazy-loaded).
5. ✅ Showcase PDF con PDF real renderizado.
6. ✅ Sección "Alma del proyecto" (home-made).
7. ✅ Sección "Ecosistema 4 pilares".
8. ✅ Footer rico con links a /paw-core, /donaciones, /paw-voices, /paw-companys.
9. ✅ CTA primario único y claro por path.
10. ✅ Mobile-first impecable.

### Should have (post-lanzamiento, mes 1)

11. 🔲 Mapa Leaflet real interactivo en directorio.
12. 🔲 Modal demo con video de 60s.
13. 🔲 Métricas reales animadas (counter).
14. 🔲 Testimonio real Sofía Rosi en B2B.
15. 🔲 Logos reales de 3-5 clínicas que ya usan.
16. 🔲 Storytelling cinematográfico sección Problema.
17. 🔲 Animación PDF compartiéndose por WhatsApp.
18. 🔲 SEO técnico avanzado (JSON-LD, hreflang).

### Nice to have (mes 2+)

19. 🔲 Versión inglés para Latam.
20. 🔲 Versión "Paw Founder" público con video del founder.
21. 🔲 Asistente IA chat embebido en landing.
22. 🔲 Dark mode opcional.
23. 🔲 Animaciones Lottie en pilares.
24. 🔲 Versión print/PDF del landing para presentaciones.

---

## 21. Riesgos y anti-patrones

### 21.1. Anti-patrones a evitar a toda costa

| Anti-patrón | Por qué evitarlo |
|---|---|
| **Landing genérico tipo template** | Nos posiciona como "uno más". Perdemos diferenciación |
| **Claims vacíos sin respaldo** | "Líder en Chile", "+10.000 usuarios" sin pruebas → riesgo legal y de credibilidad |
| **Exceso de motion** | Marea, mata performance, se siente cheap |
| **Desalineación con la app** | Promesas que no cumple → churn al primer uso |
| **CTAs confusas** | 7 botones primarios → análisis-parálisis |
| **Exceso de texto** | Headers de 4 líneas, párrafos de 8 líneas → nadie lee |
| **Exceso de gradientes** | Cansa la vista, envejece mal, se ve "AI startup 2024" |
| **Screenshots pobres o mockups CSS** | Cuando hay producto real, mostrar mockups CSS se ve flojo |
| **Branding inconsistente** | Logo, color, tono distintos en cada sección → no recordable |
| **Espectacular pero poco claro** | Si la animación 3D distrae del CTA, está mal usada |
| **Testimonios falsos** | Riesgo legal en Chile (Ley del Consumidor) y de credibilidad |
| **Logos placeholder en LogosBand** | Mejor decir "pioneros sumándose" que mentir |
| **FAQ con pricing desactualizado** | Confianza zero. Verificar TODO contra producto real |
| **CTA "Solicitar demo"** | Si la app es self-service, no pidas demo → fricción innecesaria |
| **Cookies banner intrusivo** | OK que exista pero que no tape el hero |

### 21.2. Riesgos del proyecto

| Riesgo | Mitigación |
|---|---|
| Sofía Rosi y otros beta testers no autorizan testimonio | Plan B: citas anónimas o usar feedback agregado ("una vet de Vitacura nos dijo...") |
| Video hero pesado (> 2MB) degrada LCP | Comprimir agresivamente + WebM fallback + poster JPG |
| Cambios futuros de modelo de negocio rompen copy | Mantener copy en archivos separados (`content/copy.ts`) para edits rápidos |
| Métricas reales del audit cron son bajas (e.g., 50 dueños) | Mostrar con honestidad ("comunidad pioneer en formación") en lugar de inflar |
| Mapa Leaflet en hero impacta performance | Solo cargar al entrar en viewport |
| Test mobile iOS Safari con autoPlay video | Usar `playsInline` + `muted` (autoplay funciona solo con muted) |
| Dark mode genera bugs visuales | Decisión: NO incluir dark mode en v1 del nuevo landing |
| Contenido en español-cl no escala a Latam | Diseñar copy con palabras universales ("peludo" funciona en toda Latam) |

---

## 22. Lista de archivos o zonas del repo probablemente afectadas

### 22.1. Archivos a editar/crear directamente

**Crear**:
- `src/components/landing/Hero.tsx` (nuevo, basado en HeroV2)
- `src/components/landing/SocialProofBand.tsx` (nuevo)
- `src/components/landing/ProblemSection.tsx` (nuevo)
- `src/components/landing/EcosystemSection.tsx` (nuevo)
- `src/components/landing/MedicalRecordShowcase.tsx` (nuevo, basado en MedicalPDFShowcase)
- `src/components/landing/VetDirectoryShowcase.tsx` (nuevo)
- `src/components/landing/AlmaSection.tsx` (nuevo)
- `src/components/landing/ForVetsSection.tsx` (nuevo)
- `src/components/landing/CommunitySection.tsx` (nuevo)
- `src/components/landing/FinalCTA.tsx` (nuevo)
- `src/components/landing/RichFooter.tsx` (nuevo)
- `src/components/landing/LandingHeader.tsx` (nuevo)
- `src/components/landing/HeroVideo.tsx` (nuevo)
- `src/components/landing/CountUp.tsx` (nuevo)
- `src/components/landing/RevealSection.tsx` (nuevo)
- `src/components/landing/DemoModal.tsx` (nuevo)
- `src/components/landing/content/copy.ts` (nuevo)
- `src/components/landing/content/testimonials.ts` (nuevo)
- `src/components/landing/content/pillars.ts` (nuevo)
- `src/hooks/useCountUp.ts` (nuevo)
- `src/hooks/useIntersectionObserver.ts` (nuevo, si no existe)

**Reescribir**:
- [src/pages/Index.tsx](../../src/pages/Index.tsx) (orquestador limpio que importa los nuevos componentes)

**Refactorizar**:
- [src/components/HeroV2.tsx](../../src/components/HeroV2.tsx) → mover lógica a `landing/Hero.tsx` y deprecar
- [src/components/MedicalPDFShowcase.tsx](../../src/components/MedicalPDFShowcase.tsx) → mover a `landing/MedicalRecordShowcase.tsx` y deprecar
- [src/components/Testimonials.tsx](../../src/components/Testimonials.tsx) → mover a `landing/Testimonials.tsx` con datos reales
- [src/components/LogosBand.tsx](../../src/components/LogosBand.tsx) → mover a `landing/SocialProofBand.tsx` con logos reales
- [src/components/PublicHeader.tsx](../../src/components/PublicHeader.tsx) → ampliar nav o reemplazar por `LandingHeader.tsx`
- [src/components/LegalFooter.tsx](../../src/components/LegalFooter.tsx) → reemplazar por `RichFooter.tsx`

**Crear nueva ruta** (opcional):
- `src/pages/FAQ.tsx` (nuevo, si decidimos sacar FAQ del landing)
- `src/App.tsx` agregar `<Route path="/faq" element={<FAQ />} />`

### 22.2. Assets a agregar/optimizar en `/public/`

**Crear `/public/landing/`** con:
- `hero-pet-poster.jpg` (poster del video)
- `hero-pet.webm` (fallback WebM)
- `hero-pet.mp4` (existe, comprimir < 2MB)
- `pdf-real-demo.png` (PDF real renderizado)
- `panel-vet-real.png` (dashboard vet sanitizado)
- `founder-with-kai.jpg` (foto founder + mascotas)
- `night-pet.jpg` (foto sección Problema, peludo durmiendo)
- `clinics/` (subcarpeta con logos de clínicas reales que autorizan)

**Mover desde `paw-friend-assets/Icons logos/`** a `public/icons/landing/`:
- Los 30+ SVG que usemos (paw_print, dog_face, cat_face, heart_paw, syringe, stethoscope, clinical_record, calendar, mobile_app, etc.)

### 22.3. Estilos compartidos a revisar

- [src/index.css](../../src/index.css) — verificar tokens warm-gradient, hero-gradient siguen vigentes; quizás simplificar para reducir gradientes.
- [tailwind.config.ts](../../tailwind.config.ts) — verificar que `font-sans` use Plus Jakarta Sans (sí, ya).

### 22.4. Rutas o módulos asociados

- [src/lib/links.ts](../../src/lib/links.ts) — verificar que `LINKS.home()`, `LINKS.auth()`, `LINKS.vets()`, `LINKS.paraVeterinarios()`, `LINKS.registroVeterinario()` existen y funcionan.
- [src/lib/icons.ts](../../src/lib/icons.ts) — agregar imports de iconos custom si decidimos usar SVG inline en lugar de lucide.

### 22.5. Documentos vivos a actualizar (regla 9.7 de CLAUDE.md)

- [INDEX.md](../../INDEX.md) — agregar referencia a este masterplan.
- [MAPA_FUNCIONAL_COMPLETO.md](../../MAPA_FUNCIONAL_COMPLETO.md) — actualizar sección de landing.
- [diagrams/FLUJO_COMPLETO.mmd](../../diagrams/FLUJO_COMPLETO.mmd) — sin cambios (rutas no cambian).
- Crear referencia desde [docs-raiz/README.md](../README.md).

---

## 23. Backlog accionable

### 23.1. Estrategia

| # | Tarea | Owner | Prioridad |
|---|---|---|---|
| E1 | Validar copy borrador (sección 15) con Pedro | Pedro | Must |
| E2 | Decidir nombre/identidad pública del founder ("Paw Founder" o nombre real) | Pedro | Must |
| E3 | Conseguir autorización testimonial Sofía Rosi | Pedro | Must |
| E4 | Conseguir autorización testimonial Palo | Pedro | Should |
| E5 | Conseguir autorización 3-5 logos clínicas reales | Pedro | Must |
| E6 | Definir métricas reales a mostrar (audit cron snapshot) | Pedro + IA | Must |
| E7 | Decidir si mantener FAQ inline o mover a /faq | Pedro | Should |
| E8 | Decidir si soportar dark mode en v1 (recomiendo NO) | Pedro | Should |
| E9 | Decidir hosting de video demo (self-hosted vs YouTube) | Pedro | Should |

### 23.2. Copy

| # | Tarea | Prioridad |
|---|---|---|
| C1 | Escribir copy final por sección (basado en sección 15 + feedback Pedro) | Must |
| C2 | Crear `src/components/landing/content/copy.ts` con strings centralizadas | Must |
| C3 | Revisar tuteo chileno en TODO el copy (sin voseo, sin vosotros) | Must |
| C4 | Eliminar todos los claims sin respaldo (ver sección 6.8) | Must |
| C5 | Crear copy para CTA secundario "Soy veterinario" en hero | Should |
| C6 | Escribir copy del modal demo (60s) | Should |
| C7 | Escribir copy del footer rich con 4 columnas | Must |
| C8 | Microcopy CTAs ("Sin tarjeta", "Sin letra chica") | Must |

### 23.3. UX/UI

| # | Tarea | Prioridad |
|---|---|---|
| U1 | Diseñar wireframes detallados de cada sección (Figma o sketch) | Should |
| U2 | Definir paleta de cada sección (alternancia de fondos) | Must |
| U3 | Definir tipografía precisa (escala, peso, tracking) | Must |
| U4 | Diseñar mobile primero, luego desktop | Must |
| U5 | Definir microinteracciones (hover, focus, animaciones de entrada) | Should |
| U6 | Test de accesibilidad (contraste, focus, ARIA) | Must |
| U7 | Definir favicons y OG images por sección (si compartible) | Should |

### 23.4. Frontend

| # | Tarea | Prioridad |
|---|---|---|
| F1 | Crear estructura `src/components/landing/` | Must |
| F2 | Implementar `<HeroVideo>` con lazy load | Must |
| F3 | Implementar `<CountUp>` para métricas reales | Should |
| F4 | Implementar `<RevealSection>` para fade-in | Should |
| F5 | Implementar `<DemoModal>` para video demo | Should |
| F6 | Implementar `<LandingHeader>` con nav extendida + sticky | Must |
| F7 | Implementar `<RichFooter>` con 4 columnas | Must |
| F8 | Refactor `Index.tsx` como orquestador limpio | Must |
| F9 | Implementar 11 secciones nuevas | Must |
| F10 | Migrar (o eliminar) `Testimonials.tsx` y `LogosBand.tsx` | Must |
| F11 | Integrar Leaflet real en sección directorio | Should |
| F12 | Migrar iconos custom de paw-friend-assets a /public/icons/landing/ | Should |
| F13 | Implementar prefers-reduced-motion fallback | Should |
| F14 | Crear página `/faq` (si decidimos mover) | Nice |

### 23.5. Assets / media

| # | Tarea | Prioridad |
|---|---|---|
| A1 | Comprimir `hero-pet.mp4` a < 2MB | Must |
| A2 | Generar versión WebM de `hero-pet.mp4` | Should |
| A3 | Generar poster JPG comprimido del hero video | Must |
| A4 | Generar PDF real demo con datos sanitizados | Must |
| A5 | Capturar screenshots reales del producto (ficha, directorio, panel vet) | Must |
| A6 | Grabar video demo de 60s del flow completo | Should |
| A7 | Conseguir foto del founder + Kai/Ema (o ilustración) | Must |
| A8 | Conseguir foto cinematográfica para sección Problema | Should |
| A9 | Optimizar todas las imágenes a WebP + JPG fallback | Must |
| A10 | Mover iconos relevantes de `paw-friend-assets/Icons logos/` a `public/icons/landing/` | Should |
| A11 | Conseguir logos reales de 3-5 clínicas (con autorización) | Must |

### 23.6. Performance

| # | Tarea | Prioridad |
|---|---|---|
| P1 | Lighthouse audit baseline antes de cambios | Must |
| P2 | Code splitting con React.lazy para componentes below the fold | Should |
| P3 | Preload de video hero | Must |
| P4 | Lazy load de imágenes below the fold | Must |
| P5 | Critical CSS inline | Should |
| P6 | Minificar y comprimir todas las imágenes | Must |
| P7 | Lighthouse audit final (Performance ≥ 90) | Must |
| P8 | Web Vitals monitoring post-deploy | Should |

### 23.7. SEO

| # | Tarea | Prioridad |
|---|---|---|
| S1 | Actualizar `<title>` y `<meta description>` en index.html | Must |
| S2 | Verificar canonical correcto | Must |
| S3 | Verificar OG image actualizada | Must |
| S4 | Implementar JSON-LD `Organization` + `WebSite` | Should |
| S5 | Implementar JSON-LD `LocalBusiness` con datos chile | Should |
| S6 | Verificar sitemap actualizado | Must |
| S7 | Implementar `hreflang` (es-CL, prep es-AR/MX) | Nice |
| S8 | Tracking Core Web Vitals con PostHog | Should |

### 23.8. QA

| # | Tarea | Prioridad |
|---|---|---|
| Q1 | Test mobile iOS Safari (autoplay video) | Must |
| Q2 | Test mobile Android Chrome | Must |
| Q3 | Test desktop Chrome, Firefox, Safari, Edge | Must |
| Q4 | Test cross-platform-validator agent | Must |
| Q5 | Test prefers-reduced-motion | Should |
| Q6 | Test screen reader (VoiceOver / TalkBack) | Should |
| Q7 | Test navegación con teclado (Tab) | Should |
| Q8 | QA de copy (sin testimonios falsos, sin pricing viejo) | Must |
| Q9 | QA visual en 5 viewports (320, 375, 768, 1024, 1440) | Must |
| Q10 | Smoke tests Playwright (npm run smoke) | Must |
| Q11 | Pedro review final antes de deploy producción | Must |

---

## 24. Recomendación final

### 24.1. Enfoque recomendado

**No hacer un landing "linda" — hacer un landing "vivo".**

PawFriend tiene algo único: un alma. Es un proyecto home-made en Chile, hecho por una persona que ama a las mascotas, sostenido por una comunidad pet lover que empuja parejo. **Esa es la magia.** Un landing genérico tipo "SaaS con gradientes" no captura esto. Un landing "vivo" sí: muestra producto real, comunica la filosofía gratis-para-siempre, hace sentir que detrás hay una persona y no un equipo de marketing.

La estrategia es:
1. **Reemplazar mockups CSS por producto real** (video, screenshots, PDF real, mapa Leaflet real).
2. **Comunicar el alma del proyecto** como pilar narrativo (sección 7), no como badge decorativo.
3. **Eliminar lo falso** (testimonios y logos inventados, FAQ desactualizada).
4. **Reducir secciones, profundizar cada una** (de 11 secciones apretadas a 10 con ritmo).
5. **Una idea fuerte por sección**, una sola CTA dominante.
6. **Mobile-first impecable** (porque la mayoría llega ahí).
7. **Performance no negociable** (LCP < 2.5s siempre).
8. **Footer rico** que sea puerta de descubrimiento, no solo legal.

### 24.2. Orden ideal de ejecución

1. **Semana 1**: cerrar copy + conseguir assets reales (testimonios, logos, fotos).
2. **Semana 2**: implementar arquitectura nueva con contenido placeholder.
3. **Semana 3**: integrar assets reales + visual premium + motion.
4. **Semana 4**: polish + QA + deploy.

Con apalancamiento founder + IA: **2 semanas reales**.

### 24.3. Qué haría que este landing se sienta verdaderamente sobresaliente

Cinco cosas que, si las clavamos, el landing se siente top-tier:

1. **Video hero con peludo real** + UI overlay del producto flotando = inmersión instantánea.
2. **Sección "Alma del proyecto"** con foto del founder y quote real = diferenciación emocional única.
3. **PDF real renderizado** que se anima compartiéndose por WhatsApp = hace tangible la joya.
4. **Mapa Leaflet real** con vets reales = prueba operacional inmediata.
5. **Footer rico + Built with Claude badge** + transparencia total = trust signal de cierre.

Si TODO el resto fuera mediocre pero estas 5 cosas estuvieran clavadas, el landing pasaría de "correcto" a "wow".

### 24.4. Qué NO sacrificar bajo ninguna circunstancia

| Línea roja | Razón |
|---|---|
| **Honestidad de claims** | Cero testimonios falsos, cero logos placeholder, cero métricas infladas. Mejor decir poco y verdadero que mucho y dudoso |
| **Performance mobile** | LCP < 2.5s no negociable. Si una animación 3D requiere 3s extra, va fuera |
| **Accesibilidad AA** | Contraste, focus, ARIA, semántica. PawFriend es para todos |
| **Tuteo chileno** | Sin voseo, sin vosotros, sin "pet parent". Voz consistente |
| **Producto real visible** | Cero mockups CSS para cosas que existen en producción |
| **Promesa "gratis para siempre"** | Es la columna vertebral del proyecto. No diluir |
| **Una persona detrás (home-made)** | Es el diferenciador único. No esconderlo |
| **Mobile-first** | 70%+ del tráfico es mobile. Diseñar mobile primero, no adaptar después |
| **Sin dark patterns** | Sin "Solicitar demo" si la app es self-service. Sin pop-ups de captura agresivos. Sin upsells confusos |

---

## Apéndice A — Glosario rápido

| Término | Significado en el contexto Paw Friend |
|---|---|
| **Joya de la corona** | Ficha clínica PDF + directorio público de vets. Las 2 features más valiosas del producto |
| **Paw Member** | Membresía voluntaria $3.990/mes (o $39.900/año). NO da features extra, solo badge 💛 |
| **Paw Voices** | Creadores/influencers que amplifican la misión (sin pago, alianza) |
| **Paw Companys** | Empresas sponsor con aporte mensual ($49.9k/$99.9k/$199.9k CLP) → logo + menciones |
| **Paw Partners** | Tiendas/restaurantes/seguros que dan descuentos a Paw Members → publicidad gratis en la app |
| **Paw Labs** | Features beta (PawGame, PawCollection, Missions, Comunidad, Adopción, Donantes sangre). Banner "beta" |
| **Paw Core** | Identidad del proyecto (visión, misión, valores, 5 motores) — página `/paw-core` |
| **Paw Founder** | Alias público del founder (no usar nombre real en materiales públicos) |
| **Owner / Provider** | Roles dual del producto. Owner = dueño peludo, Provider = vet/profesional |
| **Mascota huérfana** | Pet creada por vet sin owner_id. Reclamada por dueño con token o auto-claim por email |
| **Pivot médico** | 2026-04: eliminación de SharedWalks/LostPets, foco en salud + B2B vets |
| **Pivot monetización 2026-04-19** | Premium B2C eliminado, pasó a Paw Member voluntario |

## Apéndice B — Checklist de coherencia con CLAUDE.md

Verificar que cualquier copy/visual/decisión del nuevo landing cumpla con CLAUDE.md:

- [ ] Tuteo chileno (sección 9.5)
- [ ] Términos estandarizados ("comuna", "ficha clínica", "recordatorio", "Paw Friend")
- [ ] No tocar joya de la corona (PDF + directorio) sin autorización (sección 9.6)
- [ ] Modelo de monetización vigente (sección 5: 5 motores, gratis siempre B2C)
- [ ] No mencionar features no implementadas (sección 11: Paw Rewards QR completo, IA triage avanzado)
- [ ] Documentación viva actualizada en mismo commit (sección 9.7)
- [ ] Diagramas Mermaid actualizados si cambian rutas (sección 9.7.1)
- [ ] Proteger datos de usuarios existentes (sección 9.8)

---

**Fin del masterplan.**

> Este documento es living. Actualizar cuando el producto evolucione o cuando aprendamos qué funciona del nuevo landing post-launch (data PostHog, feedback usuarios, conversión real).
>
> **Próximo paso recomendado**: Pedro valida copy de sección 15 → conseguimos assets reales (testimonios + logos + foto founder) → arrancamos Fase 2 con código.
