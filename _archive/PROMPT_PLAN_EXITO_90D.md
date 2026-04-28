# PROMPT — Plan 90 días para el éxito de Paw Friend

> **Uso**: guardar este archivo en la raíz del repo `pet-harmony-chile` y ejecutarlo en Claude Code con:
> `claude "lee @PROMPT_PLAN_EXITO_90D.md y ejecútalo paso a paso"`
>
> **Output final esperado**: `docs-raiz/planes/PLAN_EXITO_90D_<YYYYMMDD>.md` + archivos de apoyo listados en §7.
>
> **Idioma**: TODO el output en español chileno con tuteo (tú/tienes/puedes). NUNCA voseo argentino, NUNCA "peludito", NUNCA "che".

---

## 1. Rol e identidad

Actúas como **director de estrategia + product lead + fundraising advisor** de Paw Friend. Tu misión es producir un plan integral a 90 días que maximice la probabilidad de éxito del proyecto en 6 dimensiones simultáneas: producto/UX, growth/marketing, modelo de negocio/monetización, técnico/arquitectura, capital/fundraising y operación/KPIs.

No eres un teórico. Eres un ejecutor. Cada propuesta debe ser **concreta, medible, priorizada y con owner/plazo**. Nada de genericidades tipo "mejorar la UX" sin decir qué, dónde, cómo y para qué.

---

## 2. Contexto obligatorio que debes leer ANTES de escribir nada

Lee y asimila los siguientes documentos del repo. No asumas, no inventes: si algo no está en el repo, márcalo como "hipótesis a validar con Pedro".

### 2.1. Fuente de verdad del producto
- `CLAUDE.md` — manual operativo completo (stack, rutas, modelo de negocio, reglas críticas)
- `INDEX.md` — índice maestro de documentación viva
- `MAPA_FUNCIONAL_COMPLETO.md` — mapa de módulos y flujos
- `diagrams/FLUJO_COMPLETO.mmd` — diagrama end-to-end

### 2.2. Estado del producto y auditorías
- `audits/AUDITORIA_UX_COMPLETA_2026_04_14.md`
- `audits/FEATURES_INCOMPLETAS_2026_04_14.md`
- `audits/OPTIMIZACION_COSTOS_2026_04_12.md`
- `audits/COMPETENCIA_2026_04_08.md`
- `audits/FEEDBACK_VET_SOFIA_2026_04_13.md`
- `audits/CROSS_PLATFORM_COMPATIBILITY.md`
- `docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md` (49 sugerencias en 10 categorías)

### 2.3. Operación y métricas actuales
- `docs/ROADMAP_90_DIAS.md` (roadmap previo — leer para NO repetir lo ya hecho)
- `docs/CHECKLIST_OPERACION_DIARIA.md`
- `docs/RITUAL_WEEKLY_OPS.md`
- `docs/PERFORMANCE_BUDGET.md`
- `docs/JOURNEYS_UX.md`
- `docs/FEATURE_FLAGS.md`
- `docs/MOCKS_MAP.md`

### 2.4. Código (muestreo inteligente, no leas todo)
- `src/App.tsx` — rutas reales
- `src/lib/plans.ts` — planes de monetización
- `src/lib/featureFlags.ts` — flags activos
- `supabase/functions/_shared/` — helpers de edge fns
- `supabase/migrations/` — últimas 10 migraciones (no todas las 156)
- `package.json` — stack real

### 2.5. Contexto externo (solo si el repo no es suficiente)
Si necesitas datos de mercado, bases abiertas de Corfo/Start-Up Chile, o benchmarks, puedes usar `WebSearch` del CLI de Claude Code. **Prioriza siempre el repo primero.**

---

## 3. Fase 1 — Diagnóstico (obligatorio, antes de proponer nada)

Produce primero un archivo intermedio `docs-raiz/planes/_DIAGNOSTICO_EXITO_<YYYYMMDD>.md` con:

### 3.1. Estado actual por dimensión (una tabla por dimensión)

| Dimensión | Qué está vivo | Qué está a medias | Qué falta | Fuente (archivo/línea) |
|---|---|---|---|---|
| Producto & UX | ... | ... | ... | ... |
| Growth & marketing | ... | ... | ... | ... |
| Modelo de negocio | ... | ... | ... | ... |
| Técnico & arquitectura | ... | ... | ... | ... |
| Capital & fundraising | ... | ... | ... | ... |
| Operación & KPIs | ... | ... | ... | ... |

### 3.2. Baseline de métricas
Lista las métricas que PawFriend **puede medir hoy** (tablas Supabase, edge fns de reporting, AdminDashboard KPIs). Si alguna métrica crítica no se está midiendo, márcala como "gap de instrumentación" en §4.

### 3.3. Riesgos críticos identificados
Enumera top 5 riesgos que pueden matar el proyecto en los próximos 90 días (ej: cuenta Flow a nombre personal, dependencia de 1 vet beta, Evolution API no oficial, concentración de riesgo por fundador solo, etc.). Cita línea del CLAUDE.md o archivo fuente.

### 3.4. Ventajas competitivas ya construidas
Qué cosas de PawFriend **no tiene la competencia** (cruzar `audits/COMPETENCIA_2026_04_08.md` con features vivas del repo). Esto alimenta el pitch de fundraising.

---

## 4. Fase 2 — Definición de éxito a 90 días

Antes de proponer iniciativas, define **qué significa éxito** para Paw Friend en 90 días, en 3 niveles:

### 4.1. North Star Metric (1 sola)
Propón la métrica única que refleja salud del negocio. Justifica por qué esa y no otra. Ejemplos candidatos (tú eliges con argumento):
- Mascotas activas con ≥1 evento clínico registrado en últimos 30 días
- Vets pagando (MRR B2B)
- Fichas clínicas PDF descargadas/mes

### 4.2. Objetivos por dimensión (1-2 por dimensión, con número y fecha)
Formato: "Al día 90, lograr X = N". Ejemplos:
- Producto: "Al día 90, onboarding dueño completo en ≤3 min p50"
- Growth: "Al día 90, 500 dueños activos (MAU)"
- B2B: "Al día 90, 5 vets pagando plan Premium + 1 clínica en Pro Max"
- Capital: "Al día 90, postulación Corfo SSAF-I enviada + 2 reuniones Start-Up Chile"

### 4.3. Criterios de éxito cualitativos
Qué historias queremos poder contar al cierre del Q (ej: "1 vet beta convertido en embajador público con video testimonial").

---

## 5. Fase 3 — Iniciativas priorizadas (el corazón del plan)

Genera **entre 20 y 30 iniciativas** cubriendo las 6 dimensiones. Cada iniciativa debe tener:

```
### INIT-XX — <Título corto y accionable>

- **Dimensión**: <Producto | Growth | Negocio | Técnico | Capital | Operación>
- **Problema que resuelve**: 1-2 líneas, cita fuente (archivo/auditoría).
- **Hipótesis de impacto**: "Si hacemos X, entonces Y, porque Z".
- **Descripción**: qué hay que hacer, concreto.
- **Entregables verificables**: 3-5 items tipo "rutas nuevas X,Y,Z", "tabla supabase A", "email template B".
- **Métrica de éxito**: qué número va a moverse y cuánto.
- **Esfuerzo**: XS (<2h) / S (medio día) / M (1-2 días) / L (3-5 días) / XL (>1 semana).
- **Impacto estimado**: Bajo / Medio / Alto / Crítico.
- **Dependencias**: otras INIT-XX o externas.
- **Riesgo si NO se hace**: 1 línea.
- **Owner sugerido**: Pedro | Vet partner | Externo (diseñador/legal/etc.).
- **Sprint sugerido**: S1 | S2 | S3 | S4 | S5 | S6 (2 sem c/u).
```

### 5.1. Reglas de priorización (RICE adaptado)

Calcula un score por iniciativa:
```
Score = (Impacto × Confianza × Alcance) / Esfuerzo
```
- **Impacto**: 1 (bajo) a 5 (crítico para North Star)
- **Confianza**: 0.5 (hipótesis) / 0.8 (evidencia parcial) / 1.0 (dato duro)
- **Alcance**: % de usuarios o vets que toca (0-1)
- **Esfuerzo**: 1 (XS) a 5 (XL)

Ordena la lista final por Score descendente y markea top 10 como **"must-ship Q1"**.

### 5.2. Cobertura obligatoria por dimensión

Asegúrate de cubrir al menos lo siguiente (si falta evidencia en el repo, marcarlo como "hipótesis"):

#### Producto & UX
- Reducción de fricción en onboarding dueño y vet
- Viralidad de la ficha clínica PDF (quién la comparte, dónde, cómo)
- Retención D1/D7/D30 y qué feature la mueve
- Mobile-first polish (Capacitor Android, ya que iOS es solo simulator)

#### Growth & marketing
- SEO del directorio público de vets (`/veterinarios/*`) — es el canal orgánico más barato
- Canal de adquisición por vet-led growth (cada vet trae dueños)
- Content marketing / Paw Voices como motor de referidos
- Loop de invitaciones vet→dueño (ya existe edge fn `send-pet-invitation`)
- Presencia en comunidades (IG, TikTok, subreddits chilenos de mascotas)

#### Modelo de negocio & monetización
- Validación empírica del pricing B2B (¿$9.900 es el número? ¿hay evidencia?)
- Cómo probar disposición a pagar de Paw Member B2C sin condicionar la UX
- Mix de ingresos proyectado a 12 meses por motor (donaciones, Paw Member, B2B ind, B2B clínica, Paw Companys, publicidad)
- Migración cuenta Flow a SpA (riesgo fiscal CRÍTICO del CLAUDE.md)

#### Técnico & arquitectura
- Migración WhatsApp Evolution API → Meta Cloud API oficial (riesgo de ban)
- Reducción de bundle (Sentry 458kB es el chunk más grande)
- Cobertura de tests en flujos críticos (ficha clínica, pagos, share)
- Observabilidad: error rate, latencia edge fns, métricas de producto en AdminDashboard
- Seguridad: rotación de secrets, auditoría RLS, rate limits

#### Capital & fundraising
- Postulación Corfo SSAF-I o Semilla Inicia (deadlines reales, cita URL oficial si webseacheaste)
- Postulación Start-Up Chile Ignite (ventanas)
- Pitch deck v1 listo para enviar (10-12 slides)
- One-pager para angels
- Datos que un inversor pediría el día 1 (cohortes, LTV, CAC proxy, margen)

#### Operación & KPIs
- Ritual semanal de revisión (ya existe `RITUAL_WEEKLY_OPS.md`, ¿se ejecuta?)
- Dashboard admin con North Star + top 5 métricas
- Proceso de feedback de vets beta (Sofía + 2-3 más)
- Automatización de reportes semanales (ya existe edge fn, validar que corre)
- Respuesta a incidentes (runbook de producción)

---

## 6. Fase 4 — Roadmap por sprints

Genera un calendario de **6 sprints de 2 semanas** asignando las iniciativas del top 10 + must-haves. Formato:

```
### Sprint 1 (días 1-14) — <Tema del sprint>
**Objetivo**: <1 oración>
**Iniciativas**: INIT-01, INIT-05, INIT-12
**Hito medible al día 14**: <qué queremos ver en el dashboard>
**Riesgos del sprint**: ...
```

Reglas del roadmap:
- **Sprint 1-2**: quick wins + bases operacionales (instrumentación, dashboard, riesgos fiscales)
- **Sprint 3-4**: producto y growth (onboarding, SEO, vet-led growth)
- **Sprint 5-6**: fundraising y escala (Corfo, Start-Up Chile, pitch, primeros B2B pagando)
- Cada sprint debe tener **máximo 4 iniciativas activas** para Pedro (solo founder).
- Si el plan supera la capacidad de 1 persona, márcalo explícito y sugiere qué delegar.

---

## 7. Artefactos a entregar

Claude Code debe generar, en este orden:

1. `docs-raiz/planes/_DIAGNOSTICO_EXITO_<YYYYMMDD>.md` — salida de Fase 1
2. `docs-raiz/planes/PLAN_EXITO_90D_<YYYYMMDD>.md` — documento principal (Fases 2, 3, 4)
3. `docs-raiz/planes/PLAN_EXITO_90D_INICIATIVAS.csv` — una fila por iniciativa con todos los campos de §5 (para importar a Notion/Sheets/GitHub Projects)
4. `docs-raiz/planes/PLAN_EXITO_90D_KPIS.md` — KPIs, fórmulas, de dónde sacarlos (tabla Supabase o edge fn), frecuencia de revisión
5. `docs-raiz/planes/PLAN_EXITO_90D_FUNDRAISING.md` — deadlines reales de Corfo/SUP (search si hace falta), outline de pitch deck, lista de angels chilenos, one-pager draft
6. Opcional si aporta claridad: `diagrams/PLAN_EXITO_90D.mmd` con un Gantt Mermaid de los 6 sprints

**No edites código de la app en esta ejecución.** Es un plan, no una implementación. Si encuentras bugs críticos mientras lees, regístralos como INIT-XX en el plan y nada más.

---

## 8. Estructura del documento principal `PLAN_EXITO_90D_<YYYYMMDD>.md`

```markdown
# Plan de Éxito 90 Días — Paw Friend
> Generado: <fecha>
> Autor: Claude Code (bajo dirección de Pedro Susaeta)
> Horizonte: día 1 a día 90

## 1. TL;DR (1 página)
- Definición de éxito
- North Star Metric
- Top 3 bets del trimestre
- Top 3 riesgos
- Presupuesto estimado de tiempo de Pedro (horas/semana)

## 2. Diagnóstico
<link al archivo _DIAGNOSTICO>

## 3. Definición de éxito (Fase 2)

## 4. Iniciativas priorizadas (Fase 3)
### 4.1. Top 10 must-ship (tabla resumen)
### 4.2. Catálogo completo (una sección por iniciativa)

## 5. Roadmap por sprints (Fase 4)

## 6. KPIs y tracking
<link a PLAN_EXITO_90D_KPIS.md>

## 7. Fundraising track
<link a PLAN_EXITO_90D_FUNDRAISING.md>

## 8. Riesgos y planes de contingencia

## 9. Supuestos e hipótesis a validar con Pedro

## 10. Próximos pasos inmediatos (semana 1)
```

---

## 9. Restricciones y reglas de estilo

1. **Chilean Spanish con tuteo**. Tú, tienes, puedes, quieres. Nada de vos/vosotros. Nunca "peludito", nunca "che".
2. **Sin marketing-speak vacío**. Nada de "sinergia", "disrupción", "game-changer". Lenguaje directo y concreto.
3. **Cita siempre la fuente** cuando afirmes algo del estado actual: `CLAUDE.md §5`, `audits/AUDITORIA_UX_COMPLETA_2026_04_14.md`, `src/lib/plans.ts:42`, etc.
4. **Si no sabes, dilo**. Marca "hipótesis a validar con Pedro" en vez de inventar.
5. **Números o rangos, no adjetivos**. En vez de "mucho tráfico" escribe "500-1000 MAU".
6. **No propongas refactors grandes**. El CLAUDE.md §9.6 lo prohíbe. La ficha clínica PDF y el directorio son la joya de la corona: solo fixes puntuales.
7. **Respeta el modelo de negocio**. B2C es y será gratis. No propongas paywall de features B2C. Monetización B2C es 100% opcional (Paw Member + donaciones).
8. **Consistencia con docs vivos**. Si propones algo que cambia rutas o flujos, agrega una INIT-XX para actualizar `diagrams/FLUJO_COMPLETO.mmd` y `MAPA_FUNCIONAL_COMPLETO.md` en el mismo sprint.
9. **Proteger usuarios en producción**. CLAUDE.md §9.8: cualquier propuesta que toque esquema DB debe incluir migración de datos existentes.
10. **Pedro es solo founder**. No propongas planes que requieran un equipo full-time que no existe. Si algo requiere delegar, márcalo explícito con rol y costo estimado.

---

## 10. Done criteria (cuándo el plan está terminado)

El plan está listo cuando:

- [ ] Los 6 archivos de §7 existen, están llenos y no tienen placeholders tipo "TODO" o "...".
- [ ] El diagnóstico cita al menos 10 archivos del repo como fuente.
- [ ] Hay entre 20 y 30 iniciativas, todas con score RICE calculado.
- [ ] El top 10 está marcado y justificado.
- [ ] Los 6 sprints tienen objetivo, iniciativas y hito medible.
- [ ] Las 6 dimensiones están cubiertas (grep el doc por los 6 nombres).
- [ ] La sección 9 del doc principal lista las hipótesis que necesitan validación con Pedro (deberían ser 5-15, no 0 ni 50).
- [ ] El CSV de iniciativas se abre limpio en LibreOffice/Google Sheets (encoding UTF-8, separador coma, comillas escapadas).
- [ ] El `git status` muestra solo archivos nuevos en `docs-raiz/planes/` y opcionalmente `diagrams/`. NADA tocado en `src/`, `supabase/`, `docs/`.
- [ ] `npx tsc -b` sigue pasando (aunque no hayas tocado código, confirmar que no rompiste nada por accidente).

---

## 11. Orden de ejecución sugerido para Claude Code

1. Leer §2.1, §2.2, §2.3 — bases del proyecto.
2. Samplear §2.4 — solo lo necesario.
3. Generar `_DIAGNOSTICO_EXITO_<fecha>.md` (Fase 1).
4. Pausar mentalmente y verificar: ¿tengo datos suficientes o hace falta un `WebSearch` para deadlines Corfo/SUP? Si sí, hacerlo aquí.
5. Generar `PLAN_EXITO_90D_<fecha>.md` secciones 1-3.
6. Generar iniciativas (Fase 3) + calcular RICE + ordenar + top 10.
7. Generar roadmap por sprints (Fase 4).
8. Generar `PLAN_EXITO_90D_INICIATIVAS.csv`.
9. Generar `PLAN_EXITO_90D_KPIS.md` con fórmulas y fuentes reales.
10. Generar `PLAN_EXITO_90D_FUNDRAISING.md` con deadlines verificados.
11. (Opcional) Gantt Mermaid.
12. Correr `npx tsc -b` y `git status` para verificar done criteria.
13. Resumir en chat: qué archivos se crearon, top 3 bets, top 3 riesgos, y las 3 preguntas más críticas para Pedro antes de ejecutar.

---

## 12. Última regla: escepticismo honesto

Si al leer el repo detectas que **alguna premisa fundamental del proyecto no se sostiene** (ej: modelo de negocio no cierra números, feature joya no tiene uso real, competidor dominante ya resuelve mejor el problema), **dilo en la sección 9 del plan como hipótesis a validar**, con datos. Mejor que Pedro lo sepa ahora que dentro de 3 meses.

Esto no es pesimismo. Es honestidad intelectual. Un buen plan a veces dice "antes de invertir 90 días en X, validemos Y con 5 entrevistas en 1 semana".

---

**Fin del prompt. Ejecuta.**
