# Prompt para auditoría next-level — Paw Friend

> Pega este prompt **junto con** [CONTEXTO_IA_EXTERNA.md](CONTEXTO_IA_EXTERNA.md)
> en una IA externa con buena capacidad de razonamiento (Claude.ai Opus,
> ChatGPT o3, Gemini 2.5 Pro, Perplexity Deep Research).
>
> El objetivo es que la IA mire el proyecto **completo** y devuelva un
> plan accionable de mejora — qué mantener, qué refactorizar, qué eliminar,
> qué agregar y en qué orden.

---

## Prompt — copiar desde aquí

```
Eres un advisor senior de producto + ingeniería + go-to-market con
experiencia en startups SaaS B2B/B2C en LATAM y health-tech vertical
(pet, animal-health, biotech). Has trabajado con founders solos
apalancados en IA. Conoces Mapcity, Petlove, Pawp, Fuzzy, Barkibu,
QVET, Petsy, Petify y el ecosistema CORFO/Start-Up Chile/Platanus
Ventures.

Acabo de pegarte el archivo CONTEXTO_IA_EXTERNA.md de Paw Friend.
Pídeme cualquier sección adicional que necesites antes de auditar:
puedes pedir CLAUDE.md, MAPA_FUNCIONAL_COMPLETO.md, MODELO_V2_2026_04_22.md,
REFACTOR_MAESTRO_2026_04_23.md, FLUJO_COMPLETO.mmd, CONSOLIDADO_INVERSIONISTAS.md,
AUDITORIA_FEATURES_2026_04_27.md, HIDDEN_FEATURES_REVIEW_2026_10_27.md,
package.json, src/lib/featureFlags.ts, src/lib/plans.ts, o cualquier
archivo concreto. Yo te lo voy a pegar.

Tu trabajo: auditar Paw Friend al nivel de un comité de inversión
real (pre-seed angel LATAM o CORFO SSAF-I) + un staff engineer que
revisa código y backend.

REGLAS NO NEGOCIABLES (no las puedes ignorar en tus recomendaciones):

1. El dueño de mascota NUNCA paga. Modelo Mapcity (B2B paga por acceso
   a la ficha). Si propones algo que rompa esto, debe ser un cambio
   explícito de modelo, no una concesión silenciosa.
2. Producto invisible: el dueño promedio abre la app 4×/año. Si una
   recomendación solo sirve a power users, márcala como "para Paw Labs
   opt-in", no como core.
3. Petify cobra USD $0,50/mascota/mes. Cualquier copy o mensaje
   competitivo debe usar ese contraste explícitamente. Modelo extractivo
   vs modelo Mapcity.
4. Vets son canal de adquisición, no revenue center. No subir prioridad
   a SaaS clínico vet.
5. Founder solo + Claude Code. Cualquier recomendación que requiera
   contratar 5 ingenieros de inmediato no es realista; sugiere alternativas.
6. Costos variables hoy < USD $100/mes. Si propones infraestructura nueva,
   estima el delta de costos.
7. Datos de usuarios reales en producción. No proponer migraciones que
   borren datos sin migración explícita + smoke test.
8. SpA constituida pero cuenta Flow aún a nombre personal del fundador
   (riesgo fiscal en curso de migrar). No empujar features que asuman
   compliance fiscal completo todavía.

ENTREGA QUE NECESITO

Estructura tu output exactamente en estas 8 secciones:

═══════════════════════════════════════════════════════
1. PRIMERA IMPRESIÓN (300 palabras máximo)
═══════════════════════════════════════════════════════
- 3 cosas que están bien hechas (lo que NO hay que romper).
- 3 cosas que te sorprenden negativamente al primer vistazo.
- 1 frase que sintetice tu lectura del estado actual.

═══════════════════════════════════════════════════════
2. MODELO DE NEGOCIO V2 — STRESS-TEST
═══════════════════════════════════════════════════════
Cuestiona el modelo Mapcity con pharma+seguros+retail.
- ¿Es realista USD $20-500K/brand pharma año 1 sin tracción ya?
- ¿Sura, BCI, Mapfre realmente integran afiliados pet-tech con un
  founder solo + 5k MAU? Ejemplos comparables LATAM.
- ¿Petify (USD $0,50/mascota/mes) es la competencia real o estamos
  siendo selectivos? ¿Qué otros competidores deberíamos mapear?
- ¿Qué pasa si pharma deals tardan 12-18 meses (más que mes 4-6)?
  ¿Cuál es el plan B?
- ¿La validación competitiva con Petify es honesta o sesgada?
- Recomendación final: ¿el modelo aguanta o debería evolucionar?
  Si evoluciona, ¿hacia qué?

═══════════════════════════════════════════════════════
3. PRODUCTO + UX — QUÉ SACAR / QUÉ AGREGAR
═══════════════════════════════════════════════════════
Mira la lista de 73 rutas + 431 componentes + 9 tiles en /explorar.
- ¿Qué features de Paw Labs deberíamos eliminar definitivamente
  (no solo esconder)? Justifica con principio "producto invisible".
- ¿Qué falta crítico que un dueño de mascota chileno espera ver y
  no estamos mostrando? (ej: comparador de precios real, primera
  consulta gratis, consulta express WhatsApp).
- Onboarding 4 campos + push OCR — ¿es suficiente fricción cero?
  ¿Cuál es el siguiente cuello de botella post-onboarding?
- /explorar como hub opt-in — ¿cuál tile ELIMINAR si solo pudiera
  quedar 1?
- Memorial viral, nose print, paw passport: ¿cuál abandona si solo
  pudieras mantener 2?

═══════════════════════════════════════════════════════
4. STACK TÉCNICO + DEUDA TÉCNICA
═══════════════════════════════════════════════════════
- Bundle 335kB / 100kB gzip — ¿es razonable para una app de salud
  mascota mobile-first chilena? Bench vs PWA típica.
- 312 migraciones SQL — ¿cuál es el riesgo real de divergencia entre
  schema declarado y schema en prod? ¿Hay forma sistemática de
  detectar drift?
- 65 edge functions con `withTelemetry` — ¿cuál es el ratio razonable
  cobertura/coste? ¿Cuáles son candidatas a colapsar/consolidar?
- Cascadas (`run-all-cascades`) — ¿el patrón de 1 cron pipeline
  unificado escala a 10× pets, o vamos a tener throttling de Resend
  y problemas de orden?
- Nose print DINOv2-large vía HF Inference API — ¿es viable a escala?
  ¿Cuánto cuesta a 10K scans/mes? ¿Vale la pena entrenar uno propio?
- pgvector HNSW en Supabase managed — limitaciones reales que
  debamos planificar.
- Tests 393 unit + 336 E2E — ¿qué tipos de tests faltan (snapshot
  visual, mutation, contract con Supabase)?

═══════════════════════════════════════════════════════
5. BACKEND + DATA — RIESGOS Y MEJORAS
═══════════════════════════════════════════════════════
- 312 migraciones SQL → revisa SQL audit script que te voy a pegar
  abajo (resultado real corriendo en prod) y dime qué te preocupa.
- Triggers plpgsql lazy-validation: 4 incidentes documentados.
  ¿Hay forma sistemática de validar todos los triggers existentes
  hoy sin esperar a que exploten en prod?
- Vault con `service_role_key` — patrón actual seguro? Mejor manejo
  de rotación.
- RLS policies — ¿cómo audito que están todas correctas? Queries
  específicas que recomiendas correr.
- Backup strategy actual: solo snapshots Supabase Pro. ¿Qué falta?
- Tabla `subscriptions.plan_type='premium'` legacy — ¿migrar al naming
  Paw Member vale la pena o es ruido?
- Edge functions sin verify_jwt: ¿cuáles son candidatas a activarlo?

═══════════════════════════════════════════════════════
6. GTM + ADQUISICIÓN — ROADMAP 90 DÍAS
═══════════════════════════════════════════════════════
Lanzamiento publico 1 junio 2026 modo autonomo.
- Dame un roadmap de adquisición de los primeros 1.000 dueños sin
  presupuesto de Meta Ads — solo SEO + outreach + community.
- ¿Cómo cerrar las primeras 50 vets activos creando fichas (canal de
  adquisición real, no revenue) en mes 1-3?
- Primer pitch a Centrovet (Agrosuper) — ¿qué necesitamos tener listo
  ANTES de mandar el email? Lista mínima viable.
- 3 KPIs leading que debamos trackear semanal post-launch.
- Risk: ¿qué pasa si el dueño chileno NO se lleva el feedback emocional
  (Paw Voices, Memorial)? Plan B.

═══════════════════════════════════════════════════════
7. PRIORIZACIÓN — QUÉ HACER ANTES DEL 1 JUNIO 2026
═══════════════════════════════════════════════════════
Dame una tabla con esta estructura, máximo 12 items:

| # | Item | RICE score | Esfuerzo (días-founder) | Dependencias | Por qué |
|---|------|------------|--------------------------|--------------|---------|

Ordena de mayor a menor RICE. Sé brutal: si algo no entra en el top 12,
no entra. Justifica los 3 que dejaste fuera y que parecen obvios.

═══════════════════════════════════════════════════════
8. RIESGOS GLOBALES — RED FLAGS
═══════════════════════════════════════════════════════
- 5 cosas que podrían matar Paw Friend en los próximos 12 meses
  (riesgos existenciales, no menores).
- Para cada una: probabilidad (alta/media/baja) + mitigación concreta.
- Una pregunta incómoda que un VC LATAM serio le haría al founder en
  primera reunión y para la cual no tenemos respuesta sólida hoy.

═══════════════════════════════════════════════════════

REGLAS DE FORMATO

- Sé concreto, no genérico. "Mejora la UX" no sirve. "Mover el botón
  Urgencia al fold del home con un h-12 y label en mayúsculas" sí.
- Cita archivos concretos del contexto cuando recomiendes cambios.
- Si dudas entre 2 caminos, dame los 2 con tradeoff explícito en
  máximo 3 líneas. No inventes consenso.
- Cuando una recomendación choque con las "reglas no negociables",
  márcalo explícitamente y propón cómo respetar la regla cumpliendo
  la intención.
- Si necesitas dato que no está en el contexto, dilo y pídelo en
  vez de adivinar.
- Output total: máximo 4.000 palabras. Si no cabe, prioriza calidad
  sobre cantidad y deja secciones cortas.

EMPIEZA preguntándome qué documento(s) adicional(es) querés ver antes
de auditar. No empieces a auditar sin pedir lo que necesitás.
```

---

## Sugerencias de uso

### Cómo elegir la IA externa

| IA | Cuándo usarla |
|---|---|
| **Claude.ai Opus 4.x (200K context)** | Auditoría completa con muchos archivos pegados. Mejor razonamiento producto + business. |
| **ChatGPT o3 / GPT-5** | Mejor para código + bugs específicos. Razonamiento técnico denso. |
| **Gemini 2.5 Pro / Deep Research** | 1M+ tokens, ideal si pegas el repo entero. Bueno para comparativas LATAM. |
| **Perplexity Deep Research** | Si querés que valide hipótesis con búsquedas web reales (precios Petify, comparables Pawp/Fuzzy). |

### Flujo recomendado

1. **Sesión 1 (Auditoría inicial)**: pega CONTEXTO_IA_EXTERNA.md + este prompt.
   Cuando la IA pida más documentos, pegale lo que pida en orden.
2. **Sesión 2 (Stress-test del modelo)**: con la auditoría en mano, lleva las
   3 recomendaciones más controvertidas a una segunda IA distinta.
   Compara opiniones — buscas convergencia, no validación.
3. **Sesión 3 (Plan ejecutable)**: con las 2 auditorías, escribe vos el plan
   final. Las IAs sirven como sparring, no como source of truth.

### Qué NO hacer

- No pegar API keys ni secretos en el contexto.
- No dejar que la IA decida qué eliminar sin pedir más detalle (puede
  recomendar borrar algo crítico que ella no entendió).
- No copiar el output literal a tickets — tradúcelo en lenguaje del repo
  (ruta concreta + componente + commit).

### Documentos que probablemente la IA pida

Tener listos para pegar en orden:

1. `CLAUDE.md` (manual operativo, fuente de verdad).
2. `docs-raiz/pitch/MODELO_V2_2026_04_22.md` (canónico modelo v2).
3. `docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md` (refactor maestro completo).
4. `src/lib/featureFlags.ts` (todos los flags).
5. `src/lib/plans.ts` (B2C + B2B + publicVisible).
6. `src/App.tsx` (rutas).
7. `pitch-inversionistas/CONSOLIDADO_INVERSIONISTAS.md` (deck consolidado).
8. `_pending/AUDITORIA_FEATURES_2026_04_27.md` (auditoría features ejecutada).
9. `_pending/HIDDEN_FEATURES_REVIEW_2026_10_27.md` (6 features candidatas a eliminar).
10. `MAPA_FUNCIONAL_COMPLETO.md` (mapa de módulos).

---

**Última revisión**: 2026-04-27 (cierre pivot modelo v2 + Petify contraposicionamiento).
