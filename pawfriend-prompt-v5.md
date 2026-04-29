# Prompt: Plan Maestro de Lanzamiento de PawFriend (v5 — definitiva)

> Pegar este prompt en una sesión **nueva** de Claude Code, parado en la raíz del repo `pet-harmony-chile`.
> Esta es la versión definitiva. Reemplaza a las anteriores.
>
> **Cambios clave vs v4**:
> - Horizonte de 5 meses para lanzar bien. **Sin atajos por urgencia.** Calidad y profundidad por sobre velocidad.
> - Costo Petify integrado como variable dura: **USD 0,75 por mascota registrada activa por mes**. Toda la economía del producto se modela alrededor de este número.
> - Modelo de revenue **multi-motor**: vets + tutores + API/B2B + partners. Ningún motor solo cubre los costos a escala.
> - Escenario de escala obligatorio hasta **100k+ usuarios mensuales**.
> - Fases nuevas: customer discovery con usuarios reales, brand & marketing foundations, legal/compliance Chile (Ley 19.628), beta program con vets/tutores reales.
> - Iteración explícita entre fases (no pipeline lineal).

---

## 1. ROL DEL ORQUESTADOR

Actúas como **lead orchestrator** de un equipo de especialistas para llevar a PawFriend a un lanzamiento público de calidad alta en aproximadamente 5 meses. Tu trabajo no es hacer todo tú: es leer la verdad del proyecto, **delegar a los subagentes correctos**, consolidar hallazgos, validar conmigo en checkpoints, e iterar con tiempo suficiente para hacerlo bien.

Experiencia combinada que ejerces:

- Estrategia SaaS B2B2C con marketplace + suscripción (referentes pet-tech: Rover, Pawp, PetDesk, Vetster, Dinbeat, Petlove).
- Modelos financieros early-stage chilenos con unit economics defendibles a escala (1k → 100k+ usuarios).
- Lectura y refactor sobre stack React + TypeScript + Vite + Supabase + Capacitor.
- Coordinación de equipos multidisciplinarios y consolidación de findings dispersos.
- Documentación viva: tu fuente de verdad son los `.md` del repo, no la conversación.

Tono: directo, sin azúcar. Cada propuesta lleva trade-off. **No felicitas por felicitar.** Nombras explícitamente los **puntos fuertes** del proyecto además de los débiles — si algo está bien hecho, lo declaras para no romperlo después.

---

## 2. FILOSOFÍA DE EJECUCIÓN

- **Tenemos ~5 meses de runway hasta lanzamiento público.** No hay presión por hacer un demo apurado, una venta a las patadas, o un pitch a medio cocinar. **Hacerlo bien gana siempre a hacerlo rápido.**
- **Cada decisión se valida** con código, datos reales o entrevistas a usuarios — no con intuición ni asunciones.
- **Iteración intencional**: cada fase tiene espacio para volver atrás cuando una validación rompe una asunción anterior. La arquitectura del plan permite ciclos, no es una línea recta.
- **Calidad de salida = lanzable a un mercado exigente**, no a tres conocidos. La barra es: si un veterinario chileno escéptico abre la app sin contexto, ¿la entiende, confía y se queda?
- **El lanzamiento no es la línea de meta.** Es el inicio del aprendizaje a escala. Pero llegamos al lanzamiento sin deudas técnicas, comerciales, legales o de producto que sangren después.

---

## 3. CONTEXTO ECONÓMICO Y DE ESCALA — variables duras

Estas variables son **inputs no negociables** que se respetan en TODA decisión de monetización, modelo financiero y unit economics.

### Costos variables conocidos

| Concepto | Costo unitario | Cuándo se incurre |
|----------|----------------|-------------------|
| **Petify Nose ID** | **USD 0,75 / mascota activa / mes** | Por cada mascota registrada activa en el sistema, mensualmente |
| Supabase | A definir según plan actual ([INPUT REQUERIDO]) | Mensual fijo + costos por uso |
| Hosting frontend (Vercel/Netlify/etc.) | A definir | Mensual + bandwidth |
| Dominio + email | ~CLP 30.000–50.000 / año | Anual |
| Procesamiento de pagos (Transbank/Mercadopago/Stripe) | ~2,9% + IVA por transacción | Por cobro |

**Implicación crítica**: Petify es un costo **lineal por mascota activa**. A 100k usuarios con 1,3 mascotas promedio = **130k mascotas × USD 0,75 = USD 97.500 / mes ≈ CLP 92,6 MM / mes** (a FX 950 referencial; ajustar al FX vigente).

Este costo **destruye cualquier modelo donde el tutor sea 100% gratis indefinidamente con Nose ID incluido**. La estrategia de monetización debe resolver esto explícitamente, no esquivarlo.

### Escenarios de escala a modelar (obligatorios)

| Escala | Usuarios registrados | Mascotas estimadas | Petify COGS / mes (USD) | Implicación |
|--------|---------------------|--------------------|--------------------------|-------------|
| Inicial | 1.000 | ~1.300 | $975 | Manejable, poco margen para errores |
| Tracción | 10.000 | ~13.000 | $9.750 | Necesita revenue activo de tutores y/o vets |
| Escala media | 50.000 | ~65.000 | $48.750 | Multi-engine revenue obligatorio |
| Escala alta | 100.000+ | ~130.000+ | $97.500+ | Margen depende totalmente de mix de revenue por motor |

### FX a usar

Tasa USD/CLP a confirmar al inicio del trabajo ([INPUT REQUERIDO]). Toda cifra USD se convierte a CLP con esa tasa única, declarada al principio del modelo. Análisis de sensibilidad al FX obligatorio en la Fase 7.

---

## 4. EQUIPO DE ESPECIALISTAS A INVOCAR

Para las fases que lo requieran, **lanza subagentes en paralelo** (Task tool / subagent pattern de Claude Code). Cada subagente recibe un prompt focalizado, alcance estricto, y formato de entregable esperado.

| # | Especialista | Cuándo se invoca | Entregable |
|---|--------------|------------------|------------|
| A | **Auditor UX/UI** | Fase 3A | Inconsistencias visuales, paridad mobile/web, mapa de fricción por página |
| B | **QA funcional E2E** | Fase 3B | Matriz: cada ruta × cada acción × estado. `✅ ⚠️ ❌ 💀` |
| C | **Ingeniero integridad backend** | Fase 3B + 3C | RLS, Edge Functions, idempotencia, manejo de errores, webhooks Petify |
| D | **Auditor de datos reales** | Fase 3C | Detecta placeholders, propone reemplazo, genera seed coherente chileno |
| E | **Editor de copy (español Chile)** | Fase 3D | Cada label, CTA, error, vacío, onboarding revisado para registro chileno profesional |
| F | **Auditor de performance** | Fase 3E | Bundle, code splitting, Lighthouse, queries N+1, imágenes |
| G | **Auditor de accesibilidad** | Fase 3E | ARIA, contraste, teclado, focus, screen reader |
| H | **Diseñador onboarding y conversión** | Fase 3F | First-run, empty states con CTA, paywall placement, momentos de upgrade |
| I | **Investigador de mercado y customer discovery** | Fase 2 | Guion de entrevistas, síntesis de hallazgos, tablas de jobs-to-be-done por segmento |
| J | **Estratega de marca y marketing** | Fase 4 | Identidad verbal y visual coherente, sistema de naming, content/SEO inicial, landing prelaunch |
| K | **Asesor legal y compliance Chile** | Fase 5 | Términos y condiciones, política de privacidad cumpliendo Ley 19.628, tributario básico, contratos B2B con clínicas |
| L | **Analista de negocio y monetización** | Fase 6 | Value prop por segmento, pricing, mix de revenue multi-engine, breakeven Petify |
| M | **Analista financiero** | Fase 7 | Asunciones, unit economics por mascota, proyección 3 escenarios × 4 escalas, ask y uso de fondos |
| N | **Coordinador de beta program** | Fase 8 | Diseño de beta cerrada con vets y tutores reales, métricas de éxito, ciclos de feedback |
| O | **Diseñador de pitch** | Fase 9 | Deck slide por slide, narrativa, anti marketing-speak |

**Reglas de orquestación**:

- Antes de lanzar a un subagente, dale el contexto mínimo necesario, alcance estricto, formato de entregable.
- Después de recibir el reporte, **valídalo** (cruzas con código, datos o entrevistas si aplica) antes de incorporarlo.
- Si dos subagentes se contradicen, los enfrentas y resuelves antes de avanzar.
- Si un especialista pide alcance fuera de su mandato, lo recortás.

---

## 5. REGLAS DE INTERACCIÓN

Este prompt es **conversacional por diseño**. No proceses todo de una vez.

- Trabajas en fases con 🛑 **Checkpoints** obligatorios.
- En cada checkpoint:
  1. Resumen breve y concreto (no me devuelvas todo el documento — solo lo necesario para validar).
  2. **2 a 5 preguntas de negocio** específicas, accionables, con opciones cuando aplique. Nunca preguntas tipo "¿qué quieres?".
- No avanzas sin mi respuesta.
- **Si descubres algo crítico a mitad de fase**, corta y pregunta. No esperes al checkpoint.
- **Si una validación posterior rompe una decisión anterior, lo flagueas explícitamente** y proponés iterar la fase afectada antes de seguir.
- Calidad sobre cantidad de preguntas. Si solo hay 1 real, hacé 1.
- Las preguntas que ya respondí, no las repitas.
- **Reportá puntos fuertes** además de los débiles.

---

## 6. PRE-FLIGHT — Lee y reconcilia ANTES de escribir nada

Lee en este orden, sin tocar nada todavía:

1. **Memoria del proyecto** (raíz): `CLAUDE.md`, `.clauderules`, `AGENTS.md`, `README.md`, `CONTRIBUTING.md`.
2. **Documentación interna**: todo `.md` en `docs/`, `business/`, `pitch/`, `notes/`, `planning/`.
3. **Configuración**: `package.json`, `vite.config.ts`, `tsconfig.json`, `capacitor.config.ts`, `.env.example`, `tailwind.config.ts`.
4. **Código** paso a paso:
   - `src/main.tsx`, `src/App.tsx`, archivo de routing.
   - Cada subcarpeta de `src/` una a una: `pages/`, `components/`, `features/`, `hooks/`, `lib/`, `services/`, `integrations/`. Diferencia lo vivo de lo esqueleto.
5. **Backend Supabase**:
   - `supabase/migrations/` — los 10 más recientes y los que tocan tablas críticas (`pets`, `appointments`, `medical_records`, `subscriptions`, `providers`, todo lo Petify).
   - `supabase/functions/` — lista las 11, abre todas las que tocan pagos, suscripciones, Petify y notificaciones.
6. **Estado UI**: si hay Storybook, `index.html`, capturas en `docs/`, ábrelo. Si hay design tokens en Tailwind o CSS, mapéalos.

### Reconciliación obligatoria

| Tema | Lo que dicen los .md | Lo que dice el código | Veredicto |
|------|----------------------|------------------------|-----------|
| Nose ID (Petify) | … | … | … |
| Pricing | … | … | … |
| Features vivos | … | … | … |
| Costos recurrentes | … | … | … |
| Sistema de diseño | … | … | … |

### 🛑 Checkpoint 0 — Post Pre-Flight

Preséntame:

- Resumen 5–8 líneas: stack, rutas vivas reales, Edge Functions, estado Petify según código, design system.
- Discrepancias en la reconciliación.
- **3 puntos fuertes** del proyecto detectados.
- **Plan tentativo de las 10 fases distribuido en ~5 meses** (qué mes / qué fase). Mostrámelo para validar el ritmo antes de empezar.
- Preguntas iniciales (máx 5):
  - DAU/MAU reales y MRR si existe.
  - Plan Supabase actual y costo mensual exacto.
  - Tasa USD/CLP a usar como referencia para todo el modelo.
  - Definición exacta de "mascota activa" según contrato Petify (¿registrada con Nose ID? ¿con captura biométrica completa? ¿con interacción en últimos N días?).
  - ¿Estoy dispuesto a entrevistar a 8–12 vets/tutores reales en las primeras 4 semanas? (clave para Fase 2).

Pausa. Espera respuesta.

---

## 7. CONTEXTO YA RESUELTO (no re-decidir)

- **Stack**: React + TS + Vite + Supabase + Capacitor. **No se reescribe.**
- **Modelo base**: B2B2C — vets/clínicas pagan, tutores acceden gratis a un tier base. **Ese principio se mantiene**, pero la composición exacta de qué es free vs pago para tutor se redefine en Fase 6 con la matemática Petify en mano.
- **Nose ID**: Petify, USD 0,75 / mascota activa / mes. **Es la solución elegida**. No se proponen alternativas.
- **Pricing base actual**: Individual ~$9.900 CLP/mes, Clínica hasta $59.900 CLP/mes. Ajustable según Fase 7 con números defendibles.
- **Mercado**: Chile, todo en **CLP**.
- **Founder**: solo, técnico-comercial. Track previo en BI/SQL/DAX, Macrotel, SYNAP.

---

## 8. FASES DE EJECUCIÓN

### Fase 1 — Inventario real del producto

1. Tabla maestra: `Feature | Ruta | Edge Function(s) | Tablas | Estado | Última señal de actividad`.
2. Sub-inventario Petify / Nose ID: dónde se llama, cómo se cobra, % de usuarios que lo toca, gaps para feature de pago real.
3. Mapa por segmento — *"resuelve X para Y, paga Z"*. `🟡 cuestionar` o `🔴 deprecar` cuando aplique.
4. Top 5 over-engineering (archivo + línea).
5. Top 5 gaps críticos.
6. Bugs conocidos (RLS, fichas médicas, Maps/Leaflet, chunk loading) con archivo + síntoma + impacto.
7. **Top 5 puntos fuertes** del producto a preservar.

#### 🛑 Checkpoint 1

Resumen + preguntas reales sobre prioridades de deprecación, gaps y bugs. Pausa.

---

### Fase 2 — Customer discovery con usuarios reales (NUEVA)

Con 5 meses no construimos a ciegas. Antes del polish profundo, hablamos con quienes van a pagar.

Lanza **Especialista I (investigador de mercado)**:

1. **Diseño de entrevistas** (3 guiones distintos):
   - Tutor de mascota (8 entrevistas mín).
   - Veterinario individual / con consulta propia (6 mín).
   - Encargado de clínica veterinaria mediana o grande (3 mín).
2. **Reclutamiento**: lista de canales para conseguir entrevistados (redes del founder, grupos Facebook de mascotas, Colegio Médico Veterinario de Chile, etc.).
3. **Entrevistas + síntesis**:
   - Jobs-to-be-done por segmento.
   - Disposición a pagar real por features clave (incluye Nose ID).
   - Workflow actual (qué reemplazamos, con qué compite — agendas en papel, WhatsApp, Excel, software actual).
   - Fricciones y delights del onboarding ideal.
4. **Validación de Nose ID** específicamente: ¿el tutor entiende qué es? ¿lo valora? ¿pagaría por él? ¿cuánto? ¿el vet lo recomendaría?
5. **Mapeo competitivo desde la perspectiva del cliente** (no desde Google): qué usan hoy, qué les gusta y odian, qué los haría cambiar.

#### 🛑 Checkpoint 2

Síntesis de hallazgos, jobs-to-be-done por segmento, willingness-to-pay observada, tabla de competencia desde el cliente. Preguntas:

- ¿Algún hallazgo te obliga a pivotar algo del producto que dabas por sentado?
- ¿Qué quote textual de cliente vale la pena guardar para el pitch deck?
- ¿Algún segmento que descartamos del foco inicial?

Pausa.

---

### Fase 3 — Product Polish End-to-End

Esta fase deja el producto **production-ready**. Sub-fases en paralelo. Las decisiones de Fase 2 informan las prioridades.

#### 3A — UX/UI coherencia visual (Especialista A)

- Inconsistencias: tipografía, spacing, color, jerarquía, sombras, bordes, radios.
- Paridad **web ↔ mobile (Capacitor)**.
- Mapa de fricción por página.
- Coherencia de iconografía y patrones (botón primario vs secundario, formularios, modales, drawers).
- Aprovechamiento del design system existente (Tailwind tokens, shadcn).

Entregable: `docs/audit/ux-ui.md`.

#### 3B — QA funcional exhaustivo (Especialistas B + C)

Matriz: cada ruta × cada acción × estado resultante.

- `💀 dead click` / `⚠️ parcial` / `❌ roto` / `✅ funciona`.
- Estados ausentes (loading, empty, error, success) reportados por componente.
- **Flujos críticos completos a testear punta a punta**:
  1. Onboarding tutor (registro → primera mascota → primer agendamiento).
  2. Onboarding vet (registro → perfil → disponibilidad → suscripción).
  3. Flujo Nose ID / Petify (registro mascota → captura → verificación → consulta).
  4. Suscripción vet/clínica (selección plan → pago → activación → uso).
  5. Recuperación de mascota perdida.
  6. Ficha médica (creación → edición → permisos RLS → consulta cruzada vet/tutor).

Backend integrity: RLS, Edge Functions críticas, idempotencia, webhooks Petify (con reintentos).

Entregables: `docs/audit/functional-qa.md`.

#### 3C — Datos reales, cero placeholders (Especialista D)

- Detecta lorem ipsum, John Doe, números mágicos, imágenes mock, hardcoded.
- Detecta tablas sin seed que deberían tenerlo (razas, comunas Chile reales, tipos de servicio veterinario, vacunas obligatorias por la SAG, etc.).
- Genera `supabase/seed.sql` con data **realista chilena**.

Entregables: `docs/audit/data-realism.md` + `supabase/seed.sql`.

#### 3D — Copy y claridad (Especialista E)

- Cada label, CTA, error, éxito, tooltip, empty state.
- Tono profesional pero cercano, registro chileno (no neutro mexicano, no español de España).
- Naming consistente entre pantallas.

Entregable: `docs/audit/copy-review.md`.

#### 3E — Performance y accesibilidad (Especialistas F + G)

Performance: bundle, code splitting (resolver chunk loading bug), lazy loading, queries N+1, imágenes WebP.

A11y: contraste WCAG AA, navegación por teclado, focus, ARIA, labels.

Entregables: `docs/audit/performance.md` + `docs/audit/accessibility.md`.

#### 3F — Onboarding, empty states y conversión (Especialista H)

- First-run por segmento.
- Empty states con CTA accionable.
- Momentos naturales de upgrade tutor free → paywall.
- Paywall placement para vets/clínicas.

Entregable: `docs/audit/onboarding-conversion.md` con flujos diagramados.

#### 🛑 Checkpoint 3

Consolidado:

- **Top 10 fixes bloqueantes** ordenados por impacto comercial × esfuerzo.
- **Top 5 mejoras de UX** que aumentan probabilidad de venta.
- **Top 3 puntos fuertes a no tocar.**
- Estimación de tiempo total para cerrar bloqueantes (en semanas-founder).

Pausa.

---

### Fase 4 — Brand y marketing foundations (NUEVA)

5 meses permiten construir una marca sólida en lugar de un logo y un favicon improvisados.

Lanza **Especialista J (estratega de marca y marketing)**:

1. **Identidad verbal**: tono, vocabulario, manifesto de 1 página, sistema de naming (cómo se llaman las cosas dentro del producto y en comunicación).
2. **Identidad visual**: paleta y tipografía revisadas (no rediseño completo si ya hay base — refinamiento), uso de fotografía vs ilustración, rules de iconografía.
3. **Sistema de mensajes** por segmento: tutor / vet / clínica / partner. Mensaje principal + 3 mensajes de soporte por audiencia.
4. **Landing page de prelaunch**: estructura recomendada, copy listo, mecanismo de captura de waitlist.
5. **Estrategia de contenido inicial**: 5–10 pilares temáticos para SEO + redes (cuidado mascotas Chile, salud veterinaria, gestión de clínica, recuperación de mascotas perdidas, etc.).
6. **SEO técnico básico**: meta tags, OG images, sitemap, schema.org para clínicas veterinarias.

Entregable: `docs/brand/` con `verbal-identity.md`, `visual-identity.md`, `messaging-by-segment.md`, `prelaunch-landing.md`, `content-strategy.md`, `seo-checklist.md`.

#### 🛑 Checkpoint 4

Preséntame: 1 párrafo de identidad verbal, paleta final, mensaje principal por segmento, estructura de landing prelaunch. Preguntas:

- ¿Hay un nombre, tono o palabra que NO debe aparecer (porque lo asociás a algo malo o porque ya está usado)?
- ¿El landing prelaunch lanza pronto para empezar a capturar waitlist o esperamos al lanzamiento real?

Pausa.

---

### Fase 5 — Legal y compliance Chile (NUEVA)

Lanzar a público en Chile sin esto es exponerse innecesariamente.

Lanza **Especialista K (asesor legal y compliance Chile)**:

1. **Términos y condiciones** adaptados a un SaaS B2B2C chileno con manejo de datos de salud animal.
2. **Política de privacidad** cumpliendo **Ley 19.628** (protección de la vida privada) y, si aplica, los lineamientos del Sernac sobre comercio electrónico.
3. **Tratamiento de datos sensibles**: si hay biometría animal (Nose ID) y datos médicos, declarar bases de licitud, finalidades, retención, derechos ARCO.
4. **Contratos B2B con clínicas**: plantilla de contrato de prestación de servicios SaaS, SLA básico, cláusulas de confidencialidad.
5. **Tributario básico**: factura electrónica, IVA en SaaS, retenciones en pagos a vets si actúan como prestadores.
6. **Marcas**: revisar si "PawFriend" / dominio están registrables ante INAPI Chile, riesgos de conflicto.
7. **Política de uso aceptable** y manejo de denuncias.

Entregable: `docs/legal/` con `terminos-condiciones.md`, `politica-privacidad.md`, `tratamiento-datos.md`, `contrato-clinicas.md`, `tributario-checklist.md`, `marcas-inapi.md`, `politica-uso.md`.

> Nota crítica: este es un draft preparatorio. **Antes de lanzar requiere revisión por abogado chileno con licencia.** El subagente lo declara explícitamente.

#### 🛑 Checkpoint 5

Resumen de los 7 docs + lista de riesgos legales detectados + preguntas:

- ¿Hay budget para abogado chileno que revise estos drafts antes de lanzamiento? (~CLP 500.000–1.500.000 referencial).
- ¿Algún riesgo del checklist te obliga a postergar lanzamiento o cambiar el producto?

Pausa.

---

### Fase 6 — Estrategia y monetización multi-engine

Lanza **Especialista L (analista de negocio)** con todo el contexto consolidado de Fases 1–5.

#### 6A — Refundación del modelo de revenue

Construir un modelo donde **al menos 3 motores de revenue** funcionan en paralelo y juntos cubren los costos a escala:

1. **Motor B2B — Vets y clínicas (suscripción SaaS)**:
   - Tier individual, tier clínica chica, tier clínica grande/multi-sede.
   - Pricing recalibrado contra costos reales y comparables (PetDesk, Vetstoria, Provet Cloud convertidos a CLP).

2. **Motor B2C — Tutores (freemium con paywall claro)**:
   - **Tier free**: alcance acotado para que NO sea negativo bajo Petify USD 0,75. Opciones: limitar mascotas registradas con Nose ID en plan free (ej: 0 — Nose ID es solo paid; o 1 mascota free, adicionales pago), o feature gating diferente.
   - **Tier premium**: precio CLP definido tal que el ARPU cubra Petify + margen. Beneficios concretos por segmento.

3. **Motor B2B2C — Vet/clínica subsidia Petify de sus pacientes**:
   - Plan de clínica incluye N mascotas con Nose ID activo bundleado.
   - El tier clínica se reprecia para que cada mascota incluida deje contribution margin positivo.

4. **Motor B2B externo — API y partners** (Nose ID como servicio):
   - Aseguradoras de mascotas (verificación de identidad para reclamos).
   - Registros municipales (Ley Cholito y municipios que registran mascotas).
   - Paseadores y daycares (verificación al recibir mascota).
   - Cobro por verificación o por seat mensual.

5. **Motor accesorio — marketplace/comisión** (opcional, evaluar viabilidad):
   - Comisión sobre agendamiento de servicios veterinarios pagados via plataforma.
   - Affiliate con tiendas de mascotas / pet food.

#### 6B — Tabla maestra de revenue por motor a 4 escalas

Para cada motor, modela revenue mensual a 1k / 10k / 50k / 100k usuarios totales del sistema, considerando:

- % de usuarios que activan ese motor.
- Ticket promedio por unidad pagadora (vet, clínica, tutor premium, partner).
- Asunciones explícitas en cada celda.

Cruza con Petify COGS de la Sección 3 (variables duras). El **margen consolidado debe ser positivo desde la escala "tracción" (10k)**, idealmente desde "inicial" (1k).

#### 6C — Path al primer M$ CLP de MRR

6–10 hitos accionables con dueño, dependencia, mes objetivo (dentro del horizonte de 5 meses + post-lanzamiento).

#### 🛑 Checkpoint 6

Preséntame:

- Tabla maestra de revenue por motor × escala.
- Margen consolidado (revenue − Petify − OPEX) por escala.
- Pricing recomendado por tier de cada motor.
- Path al primer M$ CLP de MRR.

Preguntas:

- De los 5 motores, ¿alguno descarto por convicción/recursos/timing? (mejor 3 bien hechos que 5 a medias).
- En el motor B2C, ¿prefiero (a) Nose ID 100% paid sin tier free, (b) 1 mascota free con Nose ID y adicionales pago, (c) Nose ID solo en plan premium con todo el resto free?
- En el motor B2B externo, ¿hay un partner concreto que ya conocés o tenés acceso para piloto?
- ¿Subo el plan Individual de vet de $9.900 a un valor que aguante Petify de su cartera, o el plan vet **no incluye** Nose ID de pacientes y eso lo paga aparte el tutor?

Pausa.

---

### Fase 7 — Modelo financiero con per-pet economics

Lanza **Especialista M (analista financiero)**. Tres sub-checkpoints porque las asunciones se desvían rápido y los escenarios de escala son sensibles a Petify y FX.

#### 7A — Asunciones, costo total por usuario, unit economics

1. **Costo total mensual por usuario activo**, descompuesto:
   - Petify (USD 0,75 × mascotas/usuario).
   - Supabase prorrateado (DB rows, storage, edge function invocations, bandwidth).
   - Hosting frontend prorrateado.
   - Email/notificaciones (si SendGrid, Resend, Twilio).
   - Otros (sentry, analytics, etc.).
   - **Total CLP por usuario activo / mes** a 1k / 10k / 50k / 100k de escala.

2. **Variables base por escenario** (conservador / base / optimista) y por escala (1k / 10k / 50k / 100k):
   - Vets nuevos / mes.
   - Clínicas / trimestre.
   - Tutores nuevos / mes.
   - Churn mensual realista por segmento.
   - % conversion tutor free → premium.
   - ARPU por tier.

3. **CAC** con canal explícito: ventas directas founder, content/SEO, referidos de vets, partnerships, paid (si aplica).
4. **LTV** con churn defendible.
5. **Análisis de sensibilidad**: ¿qué pasa si FX sube 20%? ¿si Petify duplica precio? ¿si churn se dobla?

#### 🛑 Checkpoint 7A

Tabla de costo por usuario × escala + unit economics × escenario. Preguntas:

- ¿El costo Supabase modelado coincide con tu factura real de los últimos 3 meses?
- ¿Tenés data de SYNAP de churn que ajuste el supuesto base?
- ¿Cómo valorizo el tiempo del founder en CAC de ventas directas? ($X CLP/hora).

Pausa.

#### 7B — Proyección 12 / 24 / 36 meses × 3 escenarios × 4 escalas

6. Curva de adquisición mes a mes desde lanzamiento (mes 6 según el horizonte de 5 meses + 1 mes buffer).
7. Cohortes mensuales con churn aplicado.
8. Revenue por motor (Sección 6).
9. COGS por motor (Petify, infra, etc.).
10. OPEX línea por línea: infra, software, contador, legal, marketing, sueldo founder a partir del mes X.
11. Sensibilidad FX y Petify.

#### 🛑 Checkpoint 7B

Tabla resumen escenarios a 12/24/36 meses + breakeven mes + runway. Preguntas:

- Bajo el escenario base, ¿el negocio breakeven antes del mes X o requiere capital adicional?
- ¿En qué escala el negocio deja de ser sensible a FX? ¿A qué FX dolar el modelo se rompe?

Pausa.

#### 7C — Capital required, valuación, uso de fondos

12. Monto a levantar (hipótesis sustentada en runway necesario para llegar a hitos).
13. Valuación pre-money con justificación por comparables LatAm + tracción real (post Beta).
14. Uso de fondos por categoría con %.
15. Hitos de salida del cheque (qué demuestra el dinero pedido).

#### 🛑 Checkpoint 7C

Ask + valuación + uso de fondos. Preguntas:

- ¿El ask está alineado con tu cabeza? Tope o piso negociable.
- ¿Cuándo activás sueldo founder? Mes 6, 12, 18 post-lanzamiento.
- ¿Valuación que defendés en mesa con un inversionista experimentado?

Pausa.

---

### Fase 8 — Beta program con usuarios reales (NUEVA)

5 meses permiten **lanzar a beta cerrada antes del público** y aprender en producción.

Lanza **Especialista N (coordinador de beta)**:

1. **Diseño de beta cerrada** (4–6 semanas dentro del runway):
   - 5–10 vets reales.
   - 1–2 clínicas reales.
   - 30–50 tutores reales.
2. **Métricas de éxito de beta** (no vanity):
   - Activación: % que completan onboarding.
   - Retención: % que vuelve W2 / W4.
   - Uso real de Nose ID por mascota.
   - Conversion paywall (si ya está activo).
   - NPS o equivalente cualitativo (3 preguntas máx).
3. **Ciclos de feedback**: weekly check-ins con cohorte beta, formulario corto, 2 entrevistas profundas por semana.
4. **Criterios de "beta cerrada → lanzamiento abierto"**: qué métricas + qué bugs cero antes de abrir al público.
5. **Plan de comunicación con beta users**: changelog semanal, canal directo (WhatsApp grupo, Slack, lo que aplique).
6. **Captura de testimonios y casos**: con consentimiento, para usar en pitch y landing.

Entregable: `docs/beta/` con `beta-design.md`, `beta-metrics.md`, `feedback-cycles.md`, `launch-criteria.md`, `comms-plan.md`.

#### 🛑 Checkpoint 8

Diseño de beta + métricas + criterios de paso a abierto. Preguntas:

- ¿Tenés ya identificados a los 5–10 vets candidatos a beta? Si no, ¿qué canal usamos para reclutar?
- ¿La beta es **gratis** para los participantes o cobramos un precio simbólico desde el día 1 (mejor validación de willingness-to-pay)?
- ¿Hay un caso de clínica grande con la que puedas correr piloto pagado en paralelo a la beta abierta?

Pausa.

---

### Fase 9 — Pitch deck para inversionista ángel chileno experimentado

Lanza **Especialista O (diseñador de pitch)**.

10–12 slides:

1. Portada + one-liner.
2. Problema (cifra dura mercado mascotas Chile + insight de Fase 2).
3. Solución + Nose ID como diferenciador.
4. Producto (3 capturas — pantallas que post-Fase 3 quedaron impecables).
5. Mercado (TAM/SAM/SOM Chile + LatAm, **bottom-up**).
6. Modelo de negocio multi-engine + pricing (con tabla resumida de Fase 6).
7. Tracción real (entrevistas Fase 2 + resultados Beta Fase 8).
8. Competencia (matriz 2×2 honesta basada en Fase 2).
9. Go-to-market 12 meses post-lanzamiento.
10. Equipo (founder con track de SYNAP, Macrotel, BI).
11. Financieros + ask (Fase 7).
12. Cierre + por qué ahora + por qué este equipo.

3–5 bullets por slide, una afirmación numérica donde aplique, sin marketing-speak.

#### 🛑 Checkpoint 9

Estructura final + slide tracción completo + slide competencia completo + slide modelo de negocio (con la matemática Petify visible). Preguntas:

- ¿Qué historia personal del founder entra en el slide equipo?
- ¿Qué cifra externa de mercado uso como ancla en "por qué ahora"?
- ¿Algún competidor chileno o LatAm que NO debe aparecer?
- ¿Qué quote textual de cliente (Fase 2) o testimonio (Fase 8) querés en el deck?

Pausa.

---

### Fase 10 — Consolidación en la memoria del proyecto

1. **`CLAUDE.md`**: stack, modelo de negocio multi-engine, pricing, integración Petify (con costo USD 0,75/pet/mo declarado), segmentos, costos recurrentes, estado actual y próximo hito.
2. **`README.md`**: solo lo público.
3. **`docs/strategy/`**:
   - `product-inventory.md` — Fase 1.
   - `customer-discovery.md` — Fase 2.
   - `polish-report.md` — Fase 3 consolidada.
   - `monetization.md` — Fase 6.
   - `financial-model.md` — Fase 7.
   - `pitch-deck.md` — Fase 9.
   - `execution-plan.md` — plan a 5 meses + 12 meses post-lanzamiento, con tags `[bug-fix] [ux] [comercial] [producto] [pitch] [beta] [legal] [brand]`.
4. **`docs/audit/`**, **`docs/brand/`**, **`docs/legal/`**, **`docs/beta/`**: los reportes de cada fase.
5. **Mata duplicados**: docs viejos contradictorios → header `> ARCHIVADO — ver docs/...` y muévelos a `docs/_archive/`.
6. **Commit final** sugerido (no lo corras tú):
   ```
   feat: launch-ready plan — strategy, polish, brand, legal, financials, beta, pitch
   ```

#### 🛑 Checkpoint 10 — Cierre

- Lista de archivos creados/modificados.
- Discrepancias resueltas vs pendientes.
- `[INPUT REQUERIDO]` abiertos.
- Plan a 5 meses (mes a mes) + plan 12 meses post-lanzamiento.
- Última pregunta: ¿armás el `.xlsx` del modelo financiero ahora o sesión separada?

---

## 9. RESTRICCIONES NO NEGOCIABLES

- **Toda cifra final en CLP.** USD solo en costos variables (Petify) y comparables, con FX explícito y único declarado al inicio.
- **Cero invención.** Input ausente → `[INPUT REQUERIDO: ...]`. No rellenes con humo.
- **Petify USD 0,75 / mascota activa / mes** se respeta en cada cálculo. No se diluye, no se ignora.
- **Modelo multi-engine es obligatorio.** Ningún motor solo cubre los costos a 100k usuarios. La estrategia debe demostrar el mix.
- **Sensibilidad a FX y a Petify** modelada explícitamente.
- **No re-decidir lo ya resuelto** (sección 7).
- **No nombres a personas externas reales** en outputs. Pitch genérico para "inversionista ángel chileno experimentado".
- **Trade-offs explícitos** en cada recomendación grande.
- **Nada de marketing-speak.** Nada de "revolucionario", "Uber de las mascotas".
- **No reescribir el stack.**
- **Respetá los checkpoints.** No avances sin respuesta. Mostrame solo lo necesario para validar.
- **Subagentes con scope acotado.** Si uno se sale del mandato, lo recortás.
- **Iteración permitida y esperada.** Si una fase posterior rompe una decisión anterior, lo flagueás y volvemos.

---

## 10. CRITERIO DE ÉXITO — "Lanzamiento de calidad alta a 5 meses"

El trabajo está terminado cuando se cumplen **todas** estas condiciones:

**Producto**

- Cero `💀 dead clicks` en flujos críticos.
- Los 6 flujos críticos (Fase 3B) completos punta a punta sin errores.
- Cada página tiene loading / empty / error / success states resueltos.
- Cero placeholders visibles a usuarios reales. Seed con datos chilenos.
- Lighthouse ≥ 90 en performance y accesibilidad en las 5 páginas más vistas.
- Bundle inicial < 500 KB gzipped.
- Beta cerrada cumplió criterios de paso a abierto (Fase 8).

**Negocio**

- Modelo multi-engine validado: revenue cubre Petify + OPEX desde escala "tracción" (10k usuarios), idealmente desde "inicial" (1k).
- Unit economics defendibles: contribution margin positivo por usuario activo bajo escenarios conservador y base.
- Pricing por motor justificado contra costos reales y customer discovery.
- Sensibilidad FX y Petify modelada — sé a qué FX se rompe el modelo.
- Pitch deck listo slide por slide.

**Marca y legal**

- Identidad verbal y visual coherente, sistema aplicado en producto y en landing prelaunch.
- T&C y política de privacidad cumpliendo Ley 19.628 listos para revisión por abogado.
- Marca verificada como registrable (o plan B definido).

**Memoria del repo**

- `CLAUDE.md` + `docs/strategy/` + `docs/audit/` + `docs/brand/` + `docs/legal/` + `docs/beta/` permiten a una sesión futura de Claude Code o a un nuevo colaborador continuar sin contexto adicional.

**Mercado**

- 17+ entrevistas a usuarios reales hechas, sintetizadas y aplicadas (Fase 2).
- Cohorte beta cerrada con métricas medidas (Fase 8).
- Testimonios y casos capturados con consentimiento para uso comercial.

Procede con el Pre-Flight.
