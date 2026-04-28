# 🔍 AUDITORÍA INTEGRAL PAWFRIEND — Prompt Maestro Ejecutable

> **Cómo usar este archivo**
> 1. Abre Claude Code en la raíz del repo `PawFriend.cl`
> 2. Pega TODO este archivo como primer mensaje (o referéncialo con `@EJECUTAR_AUDITORIA_PAWFRIEND.md`)
> 3. Claude Code leerá el repo completo y generará `AUDITORIA_PAWFRIEND_<YYYY-MM-DD>.md` en la raíz
> 4. **NO pidas confirmación. Empieza por Fase 0 inmediatamente.**

---

## 🎭 TU ROL

Asume el rol de un **panel de especialistas senior** auditando PawFriend.cl como tu cliente más importante:

- **Tech Lead Senior** (15+ años, React/TypeScript/Supabase, arquitectura escalable)
- **Product Manager Senior** (vet-tech y B2B2C SaaS LATAM, ha trabajado con founders solos)
- **UX/UI Designer Senior** (mobile-first, conversión, mercado chileno)
- **Growth/Monetización Senior** (freemium, Webpay, retención Chile)
- **AI/LLM Engineer Senior** (Anthropic API, prompt engineering, cost optimization)
- **Security & Compliance Officer** (RLS Supabase, Ley 19.628 Chile, datos sensibles)
- **DevOps/SRE** (Capacitor iOS/Android, CI/CD, observabilidad)
- **Advisor pre-seed LATAM** (CORFO SSAF-I, Start-Up Chile, Platanus Ventures)

Conoces el ecosistema: Mapcity, Petlove, Pawp, Fuzzy, Barkibu, QVET, Petsy, Petify.

Tu misión: **auditar cada línea relevante del repositorio** y generar un documento maestro con hallazgos específicos, rutas de archivo, líneas de código y soluciones implementables. **Cero genérico. Cero relleno. Honestidad brutal pero constructiva.**

---

## ⛔ REGLAS NO NEGOCIABLES (no puedes contradecirlas en tus recomendaciones)

1. **El dueño de mascota NUNCA paga.** Modelo Mapcity (B2B paga por acceso a la ficha). Si propones algo que rompa esto, debe ser un cambio explícito de modelo, no una concesión silenciosa.
2. **Producto invisible.** El dueño promedio abre la app 4×/año. Si una recomendación solo sirve a power users, márcala como "para Paw Labs opt-in", no como core.
3. **Contraposicionamiento Petify.** Petify cobra USD $0,50/mascota/mes. Cualquier copy o mensaje competitivo debe usar ese contraste explícitamente. Modelo extractivo vs modelo Mapcity.
4. **Vets son canal de adquisición, no revenue center.** No subir prioridad a SaaS clínico vet.
5. **Founder solo + Claude Code.** Cualquier recomendación que requiera contratar 5 ingenieros de inmediato no es realista; sugiere alternativas.
6. **Costos variables hoy < USD $100/mes.** Si propones infraestructura nueva, estima el delta de costos.
7. **Datos reales en producción.** No proponer migraciones que borren datos sin migración explícita + smoke test.
8. **SpA constituida pero cuenta Flow aún a nombre personal.** Riesgo fiscal en curso de migrar. No empujar features que asuman compliance fiscal completo todavía.
9. **Localización CRÍTICA:** Español de Chile con **tuteo**. PROHIBIDO: voseo argentino, "peludito", "che", regionalismos no chilenos. Cualquier hallazgo de voseo es P0.
10. **Filosofía:** "menos features, mejor resueltas, no abrumar". Si detectas feature creep, márcalo.

Cuando una recomendación choque con estas reglas, márcalo explícitamente y propón cómo respetar la regla cumpliendo la intención.

---

## 📋 CONTEXTO DEL PRODUCTO

- **Producto:** PawFriend.cl — plataforma B2B2C vet-tech para gestión de salud de mascotas
- **Stack:** React + TypeScript + Vite + Supabase + Capacitor + n8n (admin/automation)
- **AI:** Anthropic API (Claude) integrado en múltiples features
- **Auth:** Email magic link
- **Pagos:** Webpay Plus (MVP), Webpay Oneclick Mall (medio plazo)
- **Modelo B2C dueños:** 1 mascota free / hasta 5 en Paw Member ~$3.990 CLP/mes
- **Modelo B2B vets:** Individual ~$9.900 CLP/mes / Clinic plans $29.900–$59.900 CLP/mes
- **Comisión booking:** 12%
- **Anchor B2B:** Clínica Cafati (vía Claudio Cafati)
- **Personas:** María Constanza (dueña) y Dr. Matías Reyes (vet)
- **Lanzamiento público:** 1 junio 2026, modo autónomo
- **Métricas técnicas conocidas:** Bundle ~335kB / 100kB gzip · 312 migraciones SQL · 65 edge functions con `withTelemetry` · 393 tests unit + 336 E2E · 73 rutas · 431 componentes · 9 tiles en `/explorar`

---

## 🗺️ FASE 0 — RECONOCIMIENTO DEL REPO (OBLIGATORIO)

**Antes de emitir cualquier juicio**, completa este reconocimiento y resume hallazgos en la primera sección del informe:

### 0.1 Estructura general
Lee y resume:
- `package.json` (deps, scripts, versiones)
- `tsconfig.json` (strict mode, paths)
- `vite.config.ts`
- `capacitor.config.ts`
- `supabase/config.toml`
- Estructura de carpetas (`src/`, `supabase/`, `public/`, `scripts/`)

### 0.2 Documentación canónica (léelos en este orden)
1. `CLAUDE.md` (manual operativo, fuente de verdad)
2. `MAPA_FUNCIONAL_COMPLETO.md`
3. `docs-raiz/pitch/MODELO_V2_2026_04_22.md`
4. `docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md`
5. `pitch-inversionistas/CONSOLIDADO_INVERSIONISTAS.md`
6. `_pending/AUDITORIA_FEATURES_2026_04_27.md`
7. `_pending/HIDDEN_FEATURES_REVIEW_2026_10_27.md`
8. `src/lib/featureFlags.ts`
9. `src/lib/plans.ts`
10. `src/App.tsx`

### 0.3 Inventarios (genera tabla por cada uno)
- **Páginas/rutas:** TODAS las rutas en `src/pages/` o equivalente (lista las 73)
- **Componentes principales:** los top 50 más usados/grandes
- **Hooks custom:** todos
- **Services/API clients:** todos
- **Tablas Supabase:** todas con conteo de columnas y RLS sí/no
- **RLS policies:** todas
- **Edge functions:** las 65, con flag `verify_jwt` sí/no y propósito
- **Triggers SQL:** todos
- **Storage buckets:** todos con policies
- **Migraciones:** rango de las 312 + detección de últimas 20
- **Llamadas a Anthropic API:** TODAS (busca `anthropic`, `claude`, `messages.create`, `system:`)
- **Archivos `.md`:** todos en raíz + `docs-raiz/` + `_pending/`

### 0.4 Dependencias
Identifica:
- Librerías obsoletas (>2 versiones major atrás)
- Duplicadas (lodash + lodash-es, etc.)
- Con vulnerabilidades conocidas (`npm audit` mental)
- Pesos sospechosos (>50kB gzip que no se usen)

**No avances a Fase 1 sin completar Fase 0.**

---

## 🔬 FASE 1 — AUDITORÍA POR DOMINIO (15 dominios obligatorios)

Para cada dominio, ejecuta el bloque completo. Si un dominio no aplica, justifícalo. Cita siempre `path/to/file.tsx:42`.

### 1. Arquitectura & Calidad de Código
- Separación de capas (UI / lógica / data). ¿Lógica de negocio en componentes?
- `tsconfig.strict: true`? Cuántos `any`, `as unknown`, `@ts-ignore`. Listar archivos.
- Top 10 violaciones DRY más graves
- Manejo de estado consistente (Context, Zustand, React Query)
- Bundle size y code splitting (rutas pesadas sin lazy)
- Errores comunes React: `useEffect` mal usado, deps faltantes, re-renders innecesarios
- Convenciones de naming, estructura escalable

### 2. UX/UI por Página (loop por cada ruta crítica)
Mínimo audita: Home, Onboarding, Ficha mascota, Paw Game, /explorar, Memorial, Paywall, QR sync vet, Booking. Para cada una:
- Propósito claro en 3 segundos
- Jerarquía visual y CTA primario
- Estados: loading, empty, error, success, skeletons
- Mobile-first: touch targets ≥44px, scroll horizontal, safe areas iOS
- Friction points: taps hasta acción principal
- **Copy chileno:** tuteo correcto, cero voseo, cero "peludito", cero "che"
- Accesibilidad: contrastes, `alt`, navegación teclado, ARIA
- Microcopy: errores útiles, tono cálido pero profesional

### 3. Componentes & Design System
- ¿Design system real o componentes ad-hoc?
- Tokens (color, spacing, typography) consistentes
- Variantes duplicadas del mismo componente (3 botones distintos)
- Componibilidad, accesibilidad, testeabilidad
- Iconografía y assets (SVG vs PNG, lazy)

### 4. Supabase — Schema, RLS, Functions
- **Schema:** naming, FKs, constraints, indexes en columnas filtradas
- **RLS (CRÍTICO):** auditar policy por policy. Tablas sin RLS, policies con `USING (true)`, cross-tenant leaks (clínica A viendo data de B)
- **Edge Functions:** validación input, manejo errores, logs estructurados, secrets
- **Triggers/Functions SQL:** idempotencia, performance, lazy-validation plpgsql (4 incidentes documentados — proponer validación sistemática)
- **Storage:** buckets con policies correctas, imágenes optimizadas
- **Migraciones:** reversibles, numeradas, drift entre schema declarado y schema en prod
- **Vault con `service_role_key`:** rotación

Queries específicas que debe correr el auditor:
```sql
-- Tablas sin RLS
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename NOT IN (
  SELECT tablename FROM pg_policies WHERE schemaname = 'public'
);

-- Policies con USING(true)
SELECT * FROM pg_policies
WHERE schemaname = 'public' AND qual::text ILIKE '%true%';

-- Edge functions sin verify_jwt activado (revisar config.toml)
```

### 5. Autenticación & Seguridad
- Magic link: redirect URLs whitelisted, token refresh, session persistence
- Endpoints/queries que asumen auth pero no validan
- Secrets en cliente: buscar `VITE_*` y confirmar que NADA sensible esté ahí
- PII (RUT, email, dirección, datos mascotas) cifrada/protegida
- **Ley 19.628 Chile:** aviso privacidad, consentimiento explícito, derechos ARCO
- CORS, rate limiting en endpoints sensibles

### 6. Integración Anthropic API ⚠️ AUDITORÍA OBLIGATORIA
Para CADA llamada a Anthropic encontrada, llena esta **tabla maestra**:

| Archivo:línea | Función | Modelo | Propósito | System prompt (1-10) | Problemas | Mejora propuesta | Costo estimado/mes |
|---|---|---|---|---|---|---|---|

Para cada una evalúa:
- **Modelo correcto:** Haiku para clasificación, Sonnet para razonamiento, Opus solo si crítico
- **System prompt:** claridad, ejemplos, restricciones, output format, edge cases. **Pegar el prompt completo en el informe.**
- **Token usage:** `max_tokens` razonable, prompt caching aplicable
- **Cost optimization:** llamadas cacheables, batcheables, evitables
- **Error handling:** retry con backoff, fallback si API falla
- **Streaming:** ¿se usa donde mejora UX?
- **Validación output:** JSON schema, sanitización antes de mostrar
- **Localización:** ¿el prompt fuerza español de Chile con tuteo?
- **Inyección de prompt:** ¿input usuario aislado del system prompt?

Output adicional: ranking de los 5 prompts peor escritos con reescritura sugerida.

### 7. Features Core de Producto
Para cada feature evalúa: completitud, calidad, conversión, retención.
- **Onboarding dueño:** time-to-value, ¿cuándo agrega primera mascota? (memoria: 4 campos + push OCR)
- **Onboarding vet/clínica:** setup multi-veterinario, importación pacientes
- **Gestión mascotas:** ficha clínica, vacunas, recordatorios
- **Paw Game:** mecánica recompensas, ranking mensual, balance engagement vs "no abrumar"
- **QR sync vet→dueño:** flujo, fricción, errores
- **PMH (PawFriend Marketing Hub):** calidad generación, segmentación, métricas
- **Audit Export System:** cobertura, formato, utilidad para clínicas
- **Booking + comisión 12%:** flujo pago, split, cancelaciones/reembolsos
- **Memorial viral · nose print · paw passport:** ¿cuál abandonar si solo pudieras quedarte con 2?

### 8. Monetización & Negocio
- Paywall: posicionamiento, valor antes de pedir pago
- Webpay Plus: callback, idempotencia, confirmación SII si aplica
- Suscripciones: vencimientos, downgrades, churn, grace period
- Upsell vet→clínica: flujo Individual → Clinic
- Tracking conversión: funnels instrumentados, activation events
- Pricing display: claridad fiscal (IVA), comparación planes intuitiva

### 9. Mobile (Capacitor)
- Plugins nativos (camera, push, biometrics, share)
- Push: token registry, segmentación, deep links
- Splash + app icons listos para stores
- Permisos con justificación (iOS Info.plist, Android manifest)
- Build pipeline iOS/Android documentado
- Capacitor sync en CI
- Offline / mala conexión (típico Chile fuera RM)

### 10. Performance
- Web Vitals: LCP, INP, CLS. Imágenes sin dimensiones, fonts bloqueantes
- Bundle: `import * as`, deps pesadas innecesarias
- Queries Supabase: N+1, `select('*')` innecesarios, realtime mal usado
- Images: webp/avif, srcset responsive, lazy
- React Query: staleTime, gcTime
- **Cascadas (`run-all-cascades`):** ¿escala a 10× pets? Throttling Resend, problemas orden
- **Nose print DINOv2-large vía HF Inference API:** viable a escala, costo a 10K scans/mes, ¿entrenar uno propio?
- **pgvector HNSW Supabase managed:** limitaciones reales

### 11. Testing
- 393 unit + 336 E2E: coverage real, gaps en flujos críticos
- E2E: signup → add pet → paywall → pago
- Tests RLS (intentar acceder data de otra clínica)
- Tests edge functions críticas
- Faltantes: snapshot visual, mutation testing, contract con Supabase

### 12. DevOps & Observabilidad
- CI/CD: lint, typecheck, build, tests en PR
- Error tracking (Sentry o equivalente)
- Analytics (PostHog, GA4, Mixpanel)
- Logs estructurados en edge functions
- `.env.example` documentado
- **Backup strategy:** hoy solo snapshots Supabase Pro — ¿qué falta?

### 13. Documentación
- README: setup en <10 min para dev nuevo
- ADRs (Architectural Decision Records)
- Schema y RLS documentados
- Runbook para incidentes

### 14. Localización Chilena (revisión transversal — P0 si encuentras voseo)
Busca en TODO el repo (copys, system prompts, mensajes error, emails, edge functions):

**Voseo prohibido:** `tenés`, `querés`, `podés`, `sabés`, `sos`, `vos`, conjugaciones `-ás/-és/-ís`
**Términos prohibidos:** `peludito`, `che`, `boludo`, `pibe`, `laburar`
**Términos no chilenos:** `coger` (vulgar en Chile, usar "tomar"), `chévere`, `genial` (ok pero chequear)
**Términos veterinarios:** "vacuna séxtuple/polivalente", "antiparasitario externo/interno"
**Formatos:** fechas DD-MM-YYYY, montos `$1.000` (punto miles), RUT con guión `12.345.678-9`

Lista TODOS los hallazgos con `archivo:línea`. Cada uno es P0.

### 15. Compliance & Riesgo Legal Chile
- T&C y Política Privacidad presentes y vigentes
- Tratamiento datos salud animal (sensibilidad, retención)
- Boletas/facturas vía SII (recordar: Flow aún a nombre personal — riesgo)
- Consentimiento marketing separado del consentimiento de uso

---

## 📊 FASE 2 — ANÁLISIS ESTRATÉGICO

### 16. Product-Market Fit Signals
- ¿Las features priorizadas resuelven dolor real de María Constanza y Dr. Matías?
- ¿Qué feature parece "gold plating" y debería eliminarse (no esconderse)?
- ¿Qué falta crítico bloquea adopción Cafati y otras clínicas?

### 17. Competencia & Diferenciación
- Posicionamiento vs Petify (USD $0,50/mascota/mes — modelo extractivo)
- Posicionamiento vs WhatsApp + papelería + sistemas legacy clínicos
- ¿AI es diferenciador real o gimmick?
- ¿Qué moat se construye? (datos, network effects, switching costs)
- Comparables LATAM: ¿Sura, BCI, Mapfre realmente integran afiliados pet-tech con founder solo + 5k MAU? Ejemplos.

### 18. Growth Loops & GTM 90 días
- Loop viral: vet invita dueño → dueño trae mascota → dueño recomienda otro vet
- QR sync optimizado como growth lever
- Paw Game: retención real o novelty
- **Roadmap adquisición primeros 1.000 dueños sin Meta Ads:** SEO + outreach + community
- **50 vets activos creando fichas en mes 1-3:** canal real
- **Pitch a Centrovet (Agrosuper):** lista mínima viable ANTES de mandar email
- **3 KPIs leading semanales** post-launch
- Plan B si dueño chileno NO conecta con feedback emocional (Paw Voices, Memorial)

### 19. Stress-test del modelo de negocio
- ¿USD $20-500K/brand pharma año 1 sin tracción ya es realista?
- ¿Qué pasa si pharma deals tardan 12-18 meses (más que mes 4-6)? Plan B
- ¿La validación competitiva con Petify es honesta o sesgada?
- ¿Modelo aguanta o debe evolucionar? Si evoluciona, ¿hacia qué?

---

## 📦 FASE 3 — OUTPUT ESPERADO

Genera UN SOLO archivo: `AUDITORIA_PAWFRIEND_<YYYY-MM-DD>.md` en la raíz del repo, con esta estructura EXACTA:

```markdown
# Auditoría Integral PawFriend — <YYYY-MM-DD>

## 0. Resumen Ejecutivo (máx 1 página)
- Veredicto general (1 párrafo, brutal pero constructivo)
- Top 5 hallazgos críticos (P0)
- Top 5 quick wins (alto impacto, bajo esfuerzo)
- Riesgos que pueden matar el producto en 30 días

## 1. Mapa del Repositorio
[output de Fase 0 con todos los inventarios]

## 2. Hallazgos por Prioridad
### 🔴 P0 — Crítico (bloqueantes, seguridad, legal, voseo)
### 🟠 P1 — Alto (afectan conversión, retención, escalabilidad)
### 🟡 P2 — Medio (deuda técnica, UX subóptima)
### 🟢 P3 — Bajo (nice to have, polish)

Para CADA hallazgo:
- **ID:** P0-001, P0-002, etc.
- **Título:** descriptivo
- **Categoría:** [arquitectura|ux|seguridad|ai|negocio|localización|...]
- **Archivo(s):** `ruta:línea`
- **Problema:** qué está mal y por qué importa
- **Evidencia:** snippet de código o referencia concreta
- **Solución propuesta:** pasos accionables, idealmente con código de ejemplo
- **Esfuerzo:** S (≤4h) / M (1 día) / L (3 días) / XL (1 semana)
- **Impacto esperado:** qué métrica mueve
- **Choca con regla no negociable:** sí/no — si sí, cuál y cómo respetarla

## 3. Auditoría por Dominio (Fase 1 expandida)
[un subsection por cada uno de los 15 dominios + queries SQL ejecutadas]

## 4. Auditoría AI — Tabla Maestra Anthropic
[tabla del dominio 6 + ranking 5 prompts peores con reescritura]

## 5. Análisis Estratégico
[Fase 2 completa: PMF, competencia, growth loops, stress-test modelo]

## 6. Priorización RICE — Top 12 antes del 1 junio 2026

| # | Item | RICE | Esfuerzo (días-founder) | Dependencias | Por qué |
|---|------|------|--------------------------|--------------|---------|

Ordenado de mayor a menor RICE. Si algo no entra al top 12, no entra. Justifica los 3 que dejaste fuera y parecen obvios.

## 7. Roadmap Propuesto
- **Sprint 0 (esta semana):** P0s
- **Sprint 1-2 (mes 1):** P1s + quick wins
- **Sprint 3-6 (mes 2-3):** P2s + features estratégicas
- **Backlog:** P3s

## 8. Riesgos Globales — 5 Red Flags Existenciales

| Riesgo | Probabilidad | Mitigación concreta |
|---|---|---|

Más: 1 pregunta incómoda que un VC LATAM serio le haría al founder en primera reunión y para la cual no tenemos respuesta sólida hoy.

## 9. Métricas a Instrumentar YA
Lista de eventos/KPIs críticos que faltan medir + propuesta implementación (con código si aplica).

## 10. Apéndice
- Glosario términos
- Referencias a docs externas
- Queries SQL ejecutadas con resultados
```

---

## ⚠️ REGLAS INVIOLABLES DEL AUDITOR

1. **Cero relleno.** Si una sección no tiene hallazgos reales, escribe "Sin hallazgos relevantes" y avanza.
2. **Cero genérico.** Cada hallazgo cita `archivo:línea`. Nada de "considera mejorar la UX".
3. **Tuteo chileno.** El informe se redacta en español de Chile con tuteo. Cero voseo. Cero "peludito".
4. **Honestidad brutal.** Si hay decisiones técnicas que están mal, dilo. No suavices para complacer.
5. **Accionable siempre.** Cada hallazgo termina con un paso concreto que el founder puede ejecutar mañana con Claude Code.
6. **Prioriza por ROI.** Esfuerzo vs impacto. Quick wins primero, refactors estratégicos después.
7. **Filosofía:** "menos features, mejor resueltas". Si detectas feature creep, dilo.
8. **No alucines.** Si no encontraste algo, dilo. Si una decisión parece intencional, da el beneficio de la duda y pregunta al final.
9. **Cita siempre.** Toda afirmación se respalda con `path/to/file.tsx:42`.
10. **Output como archivo MD.** No respondas en chat extenso, escribe `AUDITORIA_PAWFRIEND_<YYYY-MM-DD>.md` y entrega resumen ejecutivo (máx 300 palabras) en chat.
11. **Reglas no negociables son sagradas.** Si una recomendación las rompe, márcalo explícito y propón alternativa que respete la regla.
12. **Si dudas entre 2 caminos**, dame los 2 con tradeoff explícito en máx 3 líneas. No inventes consenso.
13. **Si necesitas dato que no está en el repo**, dilo y pídelo al final del informe en sección "Datos faltantes" — no adivines.

---

## 🚀 EMPEZAR

Si el repo es grande, divide en pasadas:
1. **Pasada 1:** Fase 0 + dominios 4-5 (Supabase + Auth/Seguridad) + dominio 14 (Localización)
2. **Pasada 2:** Dominio 6 (AI Anthropic) — auditoría completa con tabla maestra
3. **Pasada 3:** Dominios 1-3 (Arquitectura + UX + Componentes)
4. **Pasada 4:** Dominios 7-12 (Features + Monetización + Mobile + Performance + Testing + DevOps)
5. **Pasada 5:** Fase 2 (Estratégico) + Fase 3 (Consolidación informe final)

**No me preguntes "¿quieres que empiece?". Empieza por Fase 0 ahora. Si algún archivo no existe, regístralo como hallazgo y sigue.**

---

**Creado:** 2026-04-27 · **Versión:** 1.0 · **Próxima revisión:** post-launch 1 junio 2026
