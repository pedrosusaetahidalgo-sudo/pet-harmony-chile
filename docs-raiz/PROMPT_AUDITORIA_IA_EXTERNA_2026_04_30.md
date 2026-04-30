# Prompt — Auditoría crítica Paw Friend para IA externa

> **Cómo usar**: pegar este bloque + el `CONTEXTO_IA_EXTERNA.md` en una sesión
> nueva de Perplexity / Claude.ai / ChatGPT / Gemini. La IA externa NO tiene
> acceso al repo ni al historial de decisiones. Este prompt le da el contexto
> + las preguntas críticas + las reglas de respuesta.
>
> **Objetivo**: sparring honesto sobre app, flujo, monetización, riesgos, y
> si existe mejor camino que el actualmente elegido (modelo v2.1 freemium
> 3 tiers + B2B Mapcity).
>
> **Versión**: 1.0 · **Fecha**: 2026-04-30 ·
> **Próximo update**: post primer pitch a Roberto Camhi con feedback aplicado.

---

## INSTRUCCIONES PARA LA IA EXTERNA

Vas a recibir contexto detallado de un proyecto pet-tech chileno (Paw Friend).
Tu trabajo es hacer **sparring estratégico crítico**, no validación.

### Reglas de respuesta

1. **Sé honesto, sin azúcar.** No felicites por felicitar. Si algo está bien,
   decirlo brevemente. Si algo está mal o subóptimo, decirlo y proponer
   alternativa concreta.
2. **Cuestiona asunciones explícitamente.** No asumas que el founder tiene
   razón solo porque construyó el producto.
3. **Trade-offs explícitos** en cada propuesta. No "podrías hacer X" sin
   "el costo de hacer X vs el camino actual es Y".
4. **Cita comparables reales** cuando aplique (apps pet-tech LatAm/US, casos
   Mapcity, modelos freemium consumer software). Si no conoces el comparable
   exacto, dilo.
5. **NO inventes datos**. Si necesitás un número específico (ej: ARPU pet-tech
   en LatAm) y no lo sabés con certeza, decí "no tengo dato confiable, mejor
   verificarlo con [fuente]".
6. **Distinguí entre tu opinión, evidencia, y especulación**. Tag explícito
   tipo `[opinión]`, `[evidencia: paper/empresa/dato]`, `[especulación]`.
7. **Tono español chileno** (tuteo: tú/tienes/puedes). NO voseo argentino.
8. **Si te falta info crítica**: pedila explícitamente antes de responder
   ("necesito ver X archivo o dato antes de opinar"). NO inventes.

### Output esperado por sección

Para cada pregunta que sigue:
- **Resumen de tu posición** (1-2 oraciones).
- **Razonamiento** (3-5 bullets con evidencia/lógica/comparables).
- **Riesgos del camino actual** (si los hay).
- **Alternativa concreta** (si propones cambio).
- **Trade-off** (qué se gana, qué se pierde).
- **Confianza** (alta / media / baja) en tu recomendación.

---

## CONTEXTO RÁPIDO (detalle completo en CONTEXTO_IA_EXTERNA.md)

### Quién soy
Pedro, founder solo + IA (Claude Code) construyendo Paw Friend. SpA chilena.
Track previo: 5+ años BI/data (SYNAP, Macrotel). Apalancamiento documentado:
8 meses de desarrollo = ~15× output equipo equivalente.

### Qué es Paw Friend
App pet-tech para dueños chilenos: ficha clínica longitudinal + directorio
vets + reservas + refugios + biometría opt-in (Petify) + memorial.

**One-liner**: "La ficha clínica longitudinal del 100% del mercado pet
chileno. Modelo Mapcity en pet-tech."

**Lanzamiento**: 1 junio 2026 (~1 mes desde hoy).

### Modelo de monetización elegido (v2.1)

**B2C freemium 3 tiers**:
- Free $0 (2 mascotas)
- Paw Member $3.990/mes (4 mascotas) — desbloquea Paw Shield, Paw Passport
  PDF, Insights Pro, Audio IA, Reportes históricos
- Manada $9.990/mes (5 mascotas + $2.000/mes a refugios via SpA)

**Conversión target**: 13% Paw Member + 1-2% Manada.

**B2B Mapcity** (donde está el grueso a escala):
1. Pharma (Centrovet, Virbac, Zoetis) — USD 50-200k/brand/año
2. Seguros (Sura, BCI, Mapfre) — USD 200-500k/año
3. Retail (Master Dog, Falabella, Puppis) — USD 250-500k/año
4. Paw Companys (empresas pet-friendly) — USD 600-1.800/mes/corporate (vivo)
5. Gobierno municipal (Ley 21.020) — USD 10-50k/municipio
6. Banca + Edificios — long-tail
7. Academia + data deals — long-tail

**B2B Vets como canal de adquisición, NO revenue center**:
- Básica $0 (público) · Premium $9.900 (público) · Clínica $19.900 / Pro Max
  $29.900 (escondidos como "Empresarial")

### ARR proyectado (FX 905)
- 1k MAU = USD 9k/año (EBITDA $2k, 22%)
- 10k MAU = USD 175k/año (EBITDA $120k, 69%)
- 50k MAU = USD 1.37M/año (EBITDA $1.25M, 91%)
- 100k MAU = USD 3.07M/año (EBITDA $2.84M, 92%)

### Capital ask
USD 150k pre-seed = CORFO $28k + Start-Up Chile $15k + Angel SAFE $107k
(cap USD 1.2M post-money, discount 20%).

### Stack y estado
React + TS + Vite + Supabase + Capacitor 7 + Flow.cl pagos. Petify (PetNow)
para biometría — proveedor opt-in, no competidor. 587 tests Vitest verde, 0
errores tsc, ~78 rutas, ~42 edge fns, ~199 migraciones SQL. Compliance Ley
21.719 + 19.628 + ARCO.

---

## PREGUNTAS PARA SPARRING

### A. App / UX

#### A.1 — Producto invisible vs engagement

Decisión actual: el "dueño flojo" abre la app **4 veces al año** según
hipótesis interna. Diseñé el producto para que esas 4 veces sean perfectas,
NO para maximizar engagement diario. La gamificación (Paw Cards, Misiones,
Paw Game) está en `/explorar` opt-in, no en el home.

**Cuestionar**:
- ¿Es correcto el supuesto de 4 veces/año? ¿Hay data de apps pet similares
  en LatAm/US sobre frecuencia real?
- Si fuera 12 visitas/año o más, ¿debería pivotear a un home más social/
  gamificado?
- ¿Estoy dejando dinero/retención en la mesa por NO empujar engagement?
- Apps pet exitosas (Pawp, Rover, PetDesk, Petify) — ¿qué hacen ellas con
  engagement?

#### A.2 — Onboarding 4 campos

Decisión actual: signup pide nombre + especie + edad + foto (opcional). Paso
2 propone subir carnet de vacunas con OCR.

**Cuestionar**:
- ¿4 campos es el mínimo correcto o debería ser aún más reducido (2 campos +
  upgrade gradual)?
- ¿OCR carnet es bloqueante para activación o es nice-to-have?
- ¿Hay onboardings pet-tech con conversión >70% a "primera mascota completa"
  que pueda copiar?

#### A.3 — Ficha clínica 4 tabs

Decisión actual: tabs Historia / Cuidados / Identidad / Más (refactor de 9
tabs legacy).

**Cuestionar**:
- ¿4 tabs es óptimo o debería ser 3 / 5?
- "Más" es catch-all (memorial, compartir, etc.). ¿Está bien o debería
  desaparecer si los items son secundarios?
- ¿Apps médicas humanas (MyChart, Apple Health) tienen patterns mejores que
  pueda copiar?

---

### B. Monetización B2C — Freemium 3 tiers

#### B.1 — Pricing $3.990 vs $9.990

Decisión actual: Paw Member $3.990 (4 mascotas) y Manada $9.990 (5 mascotas
+ $2k a refugios). Gap precio 2.5×.

**Cuestionar**:
- ¿Gap precio razonable o muy abrupto? ¿Tier intermedio $5.990-6.990 (3
  mascotas) capturaría usuarios que están entre los dos?
- ¿$3.990 es "psicológico chileno" correcto vs $4.990 o $2.990? Comparables:
  Spotify Familia $7.990, Netflix Premium $12.900, Disney+ $5.500.
- ¿Pet-tech LatAm cobra cuánto típicamente al consumidor?
- Manada como "tier nicho con corazón refugio" — ¿drives suficiente volumen
  o es vanity?

#### B.2 — Conversión 13% target Paw Member

Decisión actual: target 13% MAU paga Paw Member.

**Cuestionar**:
- ¿13% es realista para pet-tech freemium en LatAm? Benchmarks:
  - Spotify Free → Premium: ~46% global, ~30% LatAm
  - Pet apps consumer: ¿hay data?
  - Apps "vertical hobby" (Strava Premium, Headspace, Calm): 5-15%
- ¿13% es ambicioso o conservador?
- Si es 5% real, ¿el modelo se rompe o B2B compensa?

#### B.3 — $2.000 a refugios en Manada

Decisión actual: del cobro $9.990 Manada, $2.000 va a Fondo Paw Friend
Refugios (donado por SpA, no user, evita Ley 19.885).

**Cuestionar**:
- ¿Es lift de conversión real o "marketing-positive solo"?
- ¿Hay precedente de modelo similar (Patagonia 1% for the Planet, etc) en
  pet-tech?
- ¿Debería ser opcional ("agregar $2k a refugio") o mandatory como ahora?
- Trade-off: marketing fuerte vs $2k que no llegan a Paw Friend (CLP 24k/año
  por user).

#### B.4 — Features detrás del paywall

Decisión actual: Paw Shield, Paw Passport, Insights Pro, Audio IA, Reportes
>30d, max_pets son premium. OCR limitado a 5/mes en free, AI assistant 10/mes.

**Cuestionar**:
- ¿Qué feature **debería estar gratis** que hoy está paywall? (capturar más
  funnel)
- ¿Qué feature **debería ser premium** que hoy está gratis? (subir
  conversión)
- ¿Paw Shield biométrico (USD 0.75/pet/mes COGS Petify) detrás de paywall
  está bien o debería ser totalmente gratis para diferenciarse?
- Apps pet con paywall: ¿qué dejan free vs premium?

---

### C. Monetización B2B Mapcity

#### C.1 — 7 motores B2B — ¿priorización correcta?

Decisión actual: secuencia Pharma (mes 4-6) → Seguros (mes 6-9) → Retail
(mes 8-12). Otros 4 motores (Paw Companys, Gobierno, Banca/Edificios,
Long-tail) son oportunistas.

**Cuestionar**:
- ¿Pharma es el primer motor correcto o estoy siendo optimista? Pharma
  tarda meses/años en firmar pilotos.
- ¿Seguros (afiliado 10-20% sobre prima) tiene mejor unit economics que
  pharma para empezar?
- ¿Retail (Master Dog, Falabella) ya tiene plataformas similares que me
  dejan fuera?
- ¿Gobierno municipal (Ley 21.020) sería más rápido firmar que pharma —
  vale la pena adelantarlo?
- ¿Algún motor es trampa que parece atractivo pero falla a escala?

#### C.2 — Pharma sin tracción usuarios

Pregunta central: ¿pharma firma piloto USD 50-200k con 5-10k MAU, o exigen
50k+ MAU antes de hablar?

**Cuestionar**:
- Centrovet (Agrosuper), Virbac, Zoetis — ¿qué umbral de tracción exigen
  típicamente?
- ¿Existe el "lighthouse customer" pharma chileno conocido por tomar riesgo
  con startups?
- ¿Una alternativa es Paw Friend partners con DTC pet brand (Master Dog,
  Petlux) y ahí venderle a la marca grande?

#### C.3 — Vets como canal vs revenue

Decisión actual: vets no pagan por software (Plan Básica $0). Tesis Mapcity:
"el vet construye la ficha, quien paga es quien quiere acceder".

**Cuestionar**:
- ¿Es correcto NO cobrar vets cuando PetDesk/Vetster cobran USD 100-300/mes?
- ¿Pierdo revenue B2B fácil por dogma del modelo Mapcity?
- ¿Hay un híbrido: vets básico free + Premium $9.900 con valor REAL para
  vets (no solo "destacado")?

---

### D. Petify dependency

#### D.1 — Costo lineal USD 0.75/pet/mes

Decisión actual: Petify Pro tier USD 0.75 por mascota con Paw Shield activado.
A 100k MAU con 30% opt-in = ~5.900 mascotas × $0.75 = USD 4.4k/mes COGS.

**Cuestionar**:
- ¿Negociar tier custom Volume con Petify desde mes 12 cuando lleguemos a
  10k+ Shield activos?
- ¿Hay competidores Petify (Animo UK, Pip Identity US, otros) con pricing
  mejor?
- ¿La dependencia de un proveedor extranjero (Petify es coreano) es riesgo
  estratégico aceptable?

#### D.2 — Construir modelo propio

Decisión actual: intentamos DINOv2-large fine-tune (gap 0.445, falló).
Pausado. Outreach a 13 refugios chilenos para captar más data.

**Cuestionar**:
- ¿Vale la pena seguir invirtiendo en modelo propio o aceptar Petify para
  siempre (~ USD 0.75 × N pets eternamente)?
- ¿El modelo propio compite con Petify (que tiene años de data) o solo
  iguala lo justo?
- Alternativa: ¿partnership con SAG (Servicio Agrícola y Ganadero Chile)
  para microchip oficial + biometría secundaria gratis?

#### D.3 — Plan B si Petify cae / cambia ToS

**Cuestionar**:
- ¿Cuál es Plan B realista si Petify decide no servir LatAm o sube precio
  3×?
- ¿Hay riesgo de que Petify lance app B2C directa en Chile y compita?

---

### E. Caminos alternativos (si tuvieras que rediseñar desde cero)

#### E.1 — 100% B2B sin freemium B2C

¿Qué pasaría si Paw Friend fuera **solo herramienta para vets/clínicas**
(SaaS B2B clásico, $99-299/mes/clínica) sin app dueño?

- Pros: pricing simple, sales B2B medible, sin dependencia Petify
- Contras: pierde moat de data agregada (sin user data, no hay ARR Mapcity)
- ¿Vale más una salida $5M con B2B SaaS que Series A con freemium consumer?

#### E.2 — Marketplace puro (no SaaS)

¿Y si Paw Friend fuera solo **marketplace booking vets + retail pet**, cobrando
comisión 10-15% sobre transacción?

- Pros: revenue inmediato, modelo entendido
- Contras: competencia directa con Rappi, MercadoLibre, marketplace fatiga
- ¿Hay espacio para marketplace pet vertical en Chile?

#### E.3 — Pet insurance directo (no afiliado)

¿Y si Paw Friend lanzara **su propio seguro pet** (insurtech) en lugar de
ser afiliado de Sura/BCI?

- Pros: ARPU mucho mayor, control total, valuación insurtech (5-10× SaaS)
- Contras: regulación CMF, capital requerido USD 1M+, expertise actuarial,
  bloqueante 1 año mínimo
- ¿Demasiado ambicioso para pre-seed o el camino correcto a Series A?

#### E.4 — Vertical más estrecho

¿Y si Paw Friend fuera **solo refugios** (RescueOps), o **solo gatos**
(CatHealth), o **solo razas grandes** (BigDogCare)?

- Pros: TAM más chico pero brand dominante, expansion gradual
- Contras: TAM techo bajo, Series A más difícil
- ¿Cuál sería el vertical más rentable en LatAm específicamente?

#### E.5 — Modelo data-broker puro

¿Y si fuera **solo plataforma de data agregada** (SAG + pharma + academia)
sin producto B2C? Vendes data anonymized opt-in.

- Pros: márgenes extremos (90%+), bajo OPEX
- Contras: necesitas masa crítica usuarios PRIMERO, regulación datos compleja
- ¿Es viable post-Ley 21.719 sin consent universal?

---

### F. Riesgos no contemplados

Lista mis riesgos identificados:
1. Conversión Paw Member < 5% (peor caso)
2. Petify x2 precio o cambio ToS
3. FX > CLP 1.100
4. Pharma no firma a tiempo
5. Founder single point of failure
6. Competidor entra Chile

**Cuestionar**:
- ¿Qué riesgo NO ESTOY VIENDO?
- ¿Apple/Google App Store rechaza biometría animal por privacy concerns?
- ¿Asociación de Veterinarios de Chile podría atacar legalmente
  (Colegio Médico Veterinario)?
- ¿SAG cambia reglas Ley 21.020 y obliga a un proveedor único?
- ¿Demanda data privacy de un dueño cuyo refugio publicó info de su
  ex-mascota?
- ¿Riesgo reputacional si una mascota muere por error en recordatorio
  vacuna que no llegó?

---

### G. Time to launch (1 mes restante)

Lanzamiento 1 junio 2026. Hoy 30 abril 2026.

**Pendientes críticos**:
- Aplicar 2 migs SQL Manada Fondo Refugios
- Re-deploy 5 edge fns
- API Petify PROD (TEST hoy)
- Migración Flow.cl → SpA
- Cohorte beta 30+ tutores reclutar
- Abogado externo review T&C
- 2FA admin + INAPI marca

**Cuestionar**:
- ¿1 mes es suficiente para todo eso o estoy siendo optimista?
- ¿Qué postergaría si tuviera que lanzar 1 junio sí o sí?
- ¿Vale la pena postergar a julio/agosto para llegar con más cohorte?
- ¿Lanzar primero "soft launch" solo Chile centro-Santiago, después
  Valparaíso/Concepción/etc?

---

### H. Pitch a Roberto Camhi (founder Mapcity, mentor)

Voy a presentar el deck `pawfriend.cl/pitch/inversionistas.html` (15 slides
v2.1). Roberto fue quien gatilló el pivot v2 → freemium con feedback
estratégico 22 abril.

**Cuestionar**:
- ¿Qué slide hay que reforzar SI O SÍ antes de la reunión?
- ¿Qué pregunta incómoda es más probable que haga (founder Mapcity)?
- ¿Qué número/dato Roberto buscaría en primer 30 segundos?
- ¿Cómo presentarle el cambio de v2 → v2.1 (freemium 3 tiers) sin que sienta
  que lo desautorizé al introducir el paywall que él inicialmente desaconsejó?

---

## ENTREGABLE FINAL

Después de responder las 8 secciones (A-H), dame al final:

1. **Top 3 cambios que harías AHORA** (ordenados por impacto/esfuerzo).
2. **Top 3 riesgos críticos** que considerás más probables y de mayor impacto.
3. **Una recomendación contraria** (devil's advocate): si tuvieras que
   defender el camino actual contra críticas, ¿cuál es el argumento más
   fuerte?
4. **Tu confianza global** en el plan v2.1 actual: alta / media / baja con
   reasoning.

---

## REFERENCIAS

Si querés profundizar en algún punto, citá estos archivos por path completo
(yo te puedo pegar el contenido en mensaje siguiente):

- `CLAUDE.md` — manual operativo
- `MAPA_FUNCIONAL_COMPLETO.md` — mapa modular
- `docs-raiz/MODELO_FINANCIERO_2026_04_29.md` — números canónicos FX 905
- `docs-raiz/CAP_TABLE_VALUACION_2026_04_29.md` — termsheet pre-seed
- `docs-raiz/PATH_MRR_2026_04_29.md` — 8 hitos M$ MRR
- `docs-raiz/MANIFESTO_PAW_FRIEND_2026_04_29.md` — identidad verbal
- `docs-raiz/PETIFY_COGS_CONTINGENCY_2026_04_29.md` — Plan A/B/C/D Petify
- `docs-raiz/OUTREACH_TEMPLATES_B2B_2026_04_29.md` — templates B2B
- `docs-raiz/BETA_CRITERIA_2026_04_29.md` — cohorte beta
- `docs-raiz/POLISH_QA_E2E_2026_04_29.md` — matriz QA flujos críticos
- `docs-raiz/LEGAL_REVIEW_2026_04_29.md` — Ley 21.719 + 19.628
- `docs-raiz/PITCH_DECK_V2_2026_04_29.md` — 12 slides definitivos
- `docs-raiz/pitch/MODELO_V2_2026_04_22.md` — pivot Roberto Camhi origen

---

**Empezá por la sección A.1 y avanzá secuencialmente. Si una sección requiere
contexto adicional, pedímelo explícitamente antes de responder.**

**Versión prompt**: 1.0 · 2026-04-30 · Pedro Susaeta
