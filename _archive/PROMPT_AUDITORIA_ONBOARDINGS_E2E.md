# PROMPT — Auditoría E2E de todos los onboardings + ejecución launch-ready

> **Uso**: guardar este archivo en la raíz del repo `pet-harmony-chile` y ejecutar en Claude Code con:
> `claude "lee @PROMPT_AUDITORIA_ONBOARDINGS_E2E.md y ejecútalo paso a paso"`
>
> **Output final esperado**: app lista para lanzamiento, con TODOS los tipos de onboarding funcionando end-to-end sin pérdidas ni desincronizaciones.
>
> **Idioma**: TODO en español chileno con tuteo (tú/tienes/puedes). NUNCA voseo, NUNCA "peludito", NUNCA "che".
>
> **Autoridad de decisión**: Pedro (solo founder). Tú ejecutas; cuando haya decisiones de producto, negocio o riesgo fiscal/legal, paras y preguntas. No asumas.

---

## 1. Rol e identidad

Actúas como **QA lead + product engineer + auditor de integridad**. Tu misión es garantizar que el día del lanzamiento de Paw Friend, CUALQUIER tipo de usuario que entre a la app pueda completar su flujo de onboarding de principio a fin, ver lo que le corresponde, no ver lo que no le corresponde, y que todos los sistemas conectados (email, WhatsApp, Flow.cl, Google Calendar, Supabase, edge functions, RLS, roles) funcionen de manera sincronizada.

No eres un teórico. No escribes documentación bonita: auditas código real, pruebas flujos reales, detectas roturas reales y las arreglas. Si no puedes arreglar algo sin input de Pedro, te detienes y preguntas.

**Zero tolerance**: a día de lanzamiento NO se pierde ningún usuario por:
- Email que no llega
- Token que no valida
- RLS que bloquea
- Rol que no se asigna
- Redirect que apunta a 404
- Formulario que no guarda
- Pago que no confirma
- Copy que contradice el modelo de negocio
- Fallback que no existe

---

## 2. Contexto obligatorio — lee ANTES de tocar nada

### 2.1. Fuente de verdad
- `CLAUDE.md` — **lee completo, es corto y crítico**. Especial atención a:
  - §5 (modelo de negocio: 5 motores, 3 alianzas, 4 tipos de clientes, 4 tiers B2B)
  - §7 (rutas — lista completa de 67 paths)
  - §9 (reglas críticas: copy chileno, proteger usuarios, docs vivos, secrets)
  - §11.2 (modelo de roles: owner / provider / shelter / admin + dual-role)
- `INDEX.md`, `MAPA_FUNCIONAL_COMPLETO.md`
- `diagrams/FLUJO_COMPLETO.mmd` (fuente de verdad del flujo end-to-end)

### 2.2. Código base (samplear inteligentemente)
- `src/App.tsx` — TODAS las rutas reales
- `src/pages/` — foco en páginas de onboarding, auth, aplicar, registro
- `src/components/BecomeProviderDialog.tsx` y `BecomeShelterDialog.tsx`
- `src/components/RoleGuard.tsx`, `AdminRoute.tsx`, `ProtectedRoute.tsx`
- `src/hooks/useActiveRole.tsx`, `useAuth.tsx`, `usePlan.tsx`, `useShelter.ts`, `useIsAdmin.tsx`
- `src/hooks/useClaimPetInvitation`, `useAutoClaimByEmail`
- `src/lib/plans.ts`, `src/lib/routing.ts`, `src/lib/featureFlags.ts`
- `supabase/functions/send-pet-invitation/`, `notify-pitch-application/`, `flow-*`, `google-calendar-*`
- `supabase/functions/_shared/invitation-email.ts`
- `supabase/migrations/` — foco en:
  - `20260611000000_*` (paw_companys partnership_type)
  - `20260620000000_*` (adoption_centers, donations.beneficiary_*)
  - `20260625000000_*` y `20260625000001_*` (pitch_applications + rate limit)
  - Las últimas 5 migraciones (cambios recientes)
- `src/components/admin/AdminPitchApplications.tsx`, `AdminShelters.tsx`

### 2.3. Auditorías previas (para no repetir diagnóstico)
- `audits/AUDITORIA_UX_COMPLETA_2026_04_14.md`
- `audits/FEATURES_INCOMPLETAS_2026_04_14.md`
- `docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md`
- `docs/JOURNEYS_UX.md`

### 2.4. Estado técnico (para saber qué NO romper)
- `package.json`
- `docs/EDGE_FUNCTIONS_MAP.md`
- `docs/FEATURE_FLAGS.md`
- `docs/MOCKS_MAP.md`
- `docs/PERFORMANCE_BUDGET.md`

---

## 3. FASE 0 — Inventario exhaustivo de onboardings (zero miss)

Genera `_pending/auditoria-e2e/00-INVENTARIO_ONBOARDINGS.md` listando TODOS los tipos de entrada al sistema. Si descubres alguno que no está acá, agrégalo. Si alguno de acá no existe en código, márcalo como "faltante" o "parcial".

### 3.1. Onboardings esperados (mínimo este set)

**Dueños / usuarios finales**
1. Dueño nuevo registro propio → `/auth` → `/onboarding-mascota`
2. Dueño que recibe mascota de vet (claim por email/token) → `?invitation=TOKEN`
3. Dueño que recibe mascota de refugio (adopción) → `/shelter/transfer/:petId` → claim
4. Dueño que perdió el email → re-claim via `useAutoClaimByEmail` o `ClaimPetDialog`

**Profesionales (provider track)**
5. Vet individual — registro externo → `/registro-veterinario` → `/onboarding-vet`
6. Vet individual — inline desde header → `BecomeProviderDialog` (2 pasos)
7. Vet clínica (tier Clínica / Pro Max) — mismo registro, distinto plan
8. Servicios no-vet (walker, sitter, trainer, groomer) → `/servicios`, `/peluquero/perfil`
9. Dual-role switch owner ↔ provider → `useActiveRole` toggle

**Refugios / adopción**
10. Refugio nuevo → `BecomeShelterDialog` (wizard 3 pasos) → `/shelter/*`
11. Refugio que carga mascotas bulk → `/shelter/bulk-import` (CSV/Excel)
12. Refugio que transfiere mascota a adoptante → `/shelter/transfer/:petId`

**Alianzas (pitch applications)**
13. Paw Voices (creador/influencer) → `/aplicar?tipo=paw_voices`
14. Paw Companys (empresa sponsor con aporte) → `/aplicar?tipo=paw_companys`
15. Paw Partners (tienda/accesorios/restaurante/seguro) → `/aplicar?tipo=paw_partners`
16. Refugio via /aplicar → `/aplicar?tipo=refugio` (alternativo al BecomeShelterDialog)
17. Vet via /aplicar → `/aplicar?tipo=vet` (lead, no registro directo)

**Capital / fundraising (leads internos)**
18. CORFO → `/aplicar?tipo=corfo`
19. Start-Up Chile → `/aplicar?tipo=startup_chile`
20. Angels / VC → `/aplicar?tipo=angels_vc`
21. Otro → `/aplicar?tipo=otro`

**Admin y staff**
22. Admin (tabla `admin_access`) → `/admin`
23. Demo (admin-only) → `/demo`

**Flujos cruzados críticos**
24. Usuario autenticado que cambia de rol y ve sidebar/bottom tabs correctos
25. Mascota huérfana creada por vet → dueño reclama → vet queda asociado
26. Mascota huérfana creada por shelter → adoptante reclama → refugio libera
27. Dueño upgradea a Paw Member → Flow.cl → badge activo
28. Vet upgradea de Básica → Premium / Clínica / Pro Max → Flow.cl → features activas
29. Donación one-shot (con feature flag `SHELTER_DONATIONS` activo o inactivo)
30. Postulación pitch aprobada → RPC `approve_pitch_application` → crea row pública

### 3.2. Por cada onboarding del inventario, registra en la tabla:

| Campo | Descripción |
|---|---|
| ID | ONBD-XX |
| Nombre | Corto |
| Entry point | URL de entrada |
| Actor | Quién lo inicia |
| Estado en repo | Vivo / Parcial / Faltante / Solo landing |
| Archivos clave | Páginas, componentes, hooks, edge fns, migraciones |
| Tablas DB tocadas | Lista de tablas Supabase |
| Integraciones externas | Email, WA, Flow, Google Cal, OCR, etc. |
| RLS involucradas | Políticas relevantes |
| Exit point | A dónde llega el usuario cuando termina |

Este inventario es la base de las siguientes fases. **Si está incompleto, todo lo que sigue se cae.**

---

## 4. FASE 1 — Matriz de flujos E2E (paso a paso, granular)

Genera `_pending/auditoria-e2e/01-FLUJOS_E2E.md` con un flujo detallado por cada ONBD-XX. Formato estricto:

```
### ONBD-XX — <Nombre>

**Actor**: <rol>
**Pre-condiciones**: <qué debe existir antes>
**Trigger**: <cómo inicia>

**Pasos (happy path)**:
1. [Frontend] Usuario hace X en /ruta → componente Y → evento Z
2. [API] Llama edge fn / RPC → payload esperado
3. [DB] Inserta/actualiza tabla T con RLS P
4. [Side effect] Envía email/WA/webhook (cuál, desde dónde, con qué template)
5. [Frontend] Redirect/toast/estado UI
6. ...
N. [Done] Usuario queda en /ruta-final con <estado específico verificable>

**Variantes / unhappy paths**:
- Email duplicado
- Token expirado
- Rate limit alcanzado
- RLS deniega
- Integración externa caída
- Usuario cierra modal a mitad
- Doble submit
- Conexión intermitente mobile

**Puntos de sincronización críticos**:
- <qué tiene que cuadrar con qué>
- <ej: si vet crea paciente, el dueño reclama, y el vet debe ver "paciente activo" en su dashboard en el mismo momento>

**Mensajes al usuario**:
- Copy de confirmación (¿existe? ¿es chileno? ¿es claro?)
- Copy de error (¿existe para cada variante?)
- Copy en email (¿consistente con la app?)
```

Cada flujo debe poder ser "caminado" mentalmente por alguien que no conoce el repo. Si te falta info para escribirlo, **es que hay un gap de documentación** — regístralo en Fase 4.

---

## 5. FASE 2 — Auditoría por flujo (el corazón)

Por cada ONBD-XX del inventario, ejecuta esta checklist y registra hallazgos en `_pending/auditoria-e2e/02-HALLAZGOS/ONBD-XX.md`.

### 5.1. Checklist de consistencia (30 puntos)

**Rutas y navegación**
1. La ruta existe en `src/App.tsx` y resuelve.
2. Si hay `/aplicar?tipo=xxx`, el tipo está soportado en `Aplicar.tsx`.
3. Redirects legacy están vivos (ej: `/calendar`→`/mis-reservas`).
4. Los links internos que apuntan a esta ruta están actualizados (grep del repo).

**Guards y permisos**
5. `RoleGuard` está en las rutas que corresponden al rol correcto.
6. `AdminRoute` protege rutas admin-only.
7. `ProtectedRoute` envuelve lo que requiere auth.
8. Menús (Sidebar, BottomTabBar, Header) muestran solo lo del rol activo (sin leakage).

**Formularios**
9. Todos los inputs requeridos tienen validación zod.
10. Los mensajes de validación están en español chileno con tuteo.
11. El submit está protegido contra doble-click (disabled durante loading).
12. Hay toast de éxito y de error con copy claro.
13. Hay empty state / loading state explícito.

**Backend**
14. El endpoint (edge fn o RPC) existe y el frontend llama el nombre correcto.
15. El payload del frontend coincide con lo que el backend espera.
16. Hay validación server-side (no solo client-side).
17. Hay rate limit o protección anti-abuso donde corresponde (ej: pitch_applications ya tiene trigger).
18. Los errores del backend se propagan con mensaje útil al frontend.

**Base de datos y RLS**
19. Las tablas usadas existen (revisar en migraciones).
20. Las columnas nuevas tienen `DEFAULT` o `UPDATE` previo (CLAUDE.md §9.8).
21. RLS permite lo que el flujo necesita sin abrir más de lo debido.
22. Los índices necesarios para queries del flujo existen.
23. Triggers/RPCs relevantes están aplicados (`approve_pitch_application`, etc.).

**Integraciones externas**
24. Email: Resend está configurado, el template existe, el remitente es correcto, incluye link con dominio `pawfriend.cl`.
25. WhatsApp: si se usa, es vía `wa.me` URL (oficial-seguro) o está claramente marcado como "pendiente migración Meta Cloud API".
26. Flow.cl: el endpoint de create-subscription pasa los params correctos (plan_id, user_id, return_url).
27. Google Calendar: OAuth callback procesa el estado correctamente y no deja al usuario en limbo.
28. Storage: si sube archivos (CSV refugio, OCR vacunas, fotos), el bucket existe y las policies permiten.

**Docs vivos (CLAUDE.md §9.7)**
29. Si este flujo cambió rutas/DB/features, está reflejado en `diagrams/FLUJO_COMPLETO.mmd` y `MAPA_FUNCIONAL_COMPLETO.md`.
30. Si hay diagrama individual en `FLUJOS_MERMAID.md`, es consistente con el `.mmd` maestro.

### 5.2. Por cada punto, registra:

- ✅ OK
- ⚠️ Parcial (qué falta, gravedad)
- ❌ Roto (qué pasa, reproducible cómo)
- ⛔ No aplica (justificar)

### 5.3. Severidad de hallazgos

- **P0 — Blocker de lanzamiento**: pierde usuarios, bloquea pago, expone datos, rompe auth.
- **P1 — Grave**: degrada UX seriamente, causa confusión, friction alto.
- **P2 — Importante**: inconsistencia, copy malo, redirect raro.
- **P3 — Cosmético**: mejoras menores, tech debt.

---

## 6. FASE 3 — Mapa de integraciones cruzadas

Genera `_pending/auditoria-e2e/03-INTEGRACIONES_CRUZADAS.md` con una matriz:

### 6.1. Matriz `flujo × integración`

| Integración | ONBD-01 | ONBD-02 | ... | ONBD-30 |
|---|---|---|---|---|
| Email (Resend) | | | | |
| WhatsApp (wa.me) | | | | |
| WhatsApp (Evolution/Meta) | | | | |
| Flow.cl | | | | |
| Google Calendar OAuth | | | | |
| Supabase Auth | | | | |
| Supabase Storage | | | | |
| RLS policies críticas | | | | |
| Pet invitation tokens | | | | |
| Paw Card generation | | | | |
| OCR vaccination | | | | |
| QR codes | | | | |
| Sentry logging | | | | |
| Sitemap SEO | | | | |
| Rate limiters | | | | |

Cada celda: ✅ / ⚠️ / ❌ / n/a con nota corta.

### 6.2. Riesgos de integración (top 10 cruzados)

Para cada riesgo identificado, indica:
- Qué flujos afecta (múltiples ONBD-XX)
- Qué pasa si cae (impacto usuario)
- Plan de contingencia (fallback, retry, cola, manual)

Ejemplos a cubrir obligatoriamente:
- Cuenta Flow a nombre personal (riesgo fiscal — CLAUDE.md §5)
- Evolution API no oficial para WhatsApp (riesgo de ban)
- Resend rate limit o deliverability
- Tokens de invitación que expiran mientras el dueño no los abre
- Google Calendar OAuth disconnect bug (ver historial de bugs en context de Pedro)
- RLS que se rompe al introducir shelter sin migrar dueños existentes

---

## 7. FASE 4 — Catálogo priorizado de gaps y fixes

Genera `_pending/auditoria-e2e/04-CATALOGO_GAPS.md` consolidando todos los hallazgos de Fases 2 y 3 en un único catálogo ordenado.

Formato por gap:

```
### GAP-XX — <Título accionable>

- **Flujos afectados**: ONBD-03, ONBD-11, ONBD-26
- **Severidad**: P0 | P1 | P2 | P3
- **Tipo**: Bug | Missing feature | UX | Copy | DB/RLS | Integración | Docs vivos | Seguridad
- **Descripción**: qué está mal (1-3 líneas).
- **Evidencia**: archivo:línea, captura mental del flujo, output del test.
- **Propuesta de fix**: qué hacer (técnico, concreto).
- **Esfuerzo**: XS (<1h) / S (medio día) / M (1-2 días) / L (3-5 días).
- **Requiere decisión de Pedro?**: Sí / No (si sí, qué pregunta).
- **Dependencias**: otros GAP-XX.
- **Riesgo si NO se arregla para el lanzamiento**: 1 línea.
```

Orden del catálogo: P0 primero, luego P1, luego P2, luego P3.

Genera también `_pending/auditoria-e2e/04-CATALOGO_GAPS.csv` con los mismos campos (para importar a Sheets/Notion/GitHub Issues).

---

## 8. 🚦 GATE 1 — Entregar catálogo a Pedro antes de ejecutar nada

**DETÉNTE AQUÍ.** No arregles nada todavía.

Presenta a Pedro en el chat:
1. Resumen ejecutivo: cuántos ONBD totales, cuántos ✅/⚠️/❌, cuántos gaps P0/P1/P2/P3.
2. Top 10 P0 (blockers de lanzamiento) con una línea cada uno.
3. Top 5 decisiones que requieren respuesta de Pedro antes de seguir. Ejemplos:
   - ¿WhatsApp: seguimos con `wa.me` puro hasta migrar, o activamos Meta Cloud API ya?
   - ¿Feature flag `SHELTER_DONATIONS`: prende al lanzamiento o queda off hasta SpA?
   - ¿Pricing B2B: mantenemos $9.900 / $19.900 / $29.900 tal cual o ajustamos?
   - ¿Qué tipos de alianza deben estar 100% activos al día 1 vs. beta cerrada?
   - ¿Qué hacemos con las rutas legacy que redirigen? ¿300s o 404s?
4. Lista todas las preguntas abiertas marcadas "requiere decisión de Pedro" en el catálogo.

**Espera respuesta.** No sigas hasta que Pedro apruebe el catálogo y responda las decisiones abiertas.

---

## 9. FASE 5 — Plan de ejecución por lotes

Una vez Pedro aprueba el catálogo, genera `_pending/auditoria-e2e/05-PLAN_EJECUCION.md` con lotes de fixes ordenados para minimizar riesgo.

### 9.1. Reglas de agrupación en lotes

Cada lote es un commit (o 2-3 commits relacionados) que:
- No mezcla migraciones SQL con cambios UI grandes (mig primero, UI después con tipos regenerados).
- No rompe el build intermedio (`npx tsc -b` debe pasar después de cada lote).
- Tiene tests unitarios actualizados si el fix toca `src/lib/` o hooks.
- Respeta CLAUDE.md §9 (nunca `docs/` manual, nunca aplicar migración automática, copy chileno).
- Actualiza `diagrams/FLUJO_COMPLETO.mmd` y `MAPA_FUNCIONAL_COMPLETO.md` **en el mismo lote** si el fix cambia flujos (§9.7).

### 9.2. Orden sugerido de lotes

1. **Lote A — Seguridad y RLS**: cualquier RLS que filtre datos entre roles, secrets rotación, rate limits faltantes.
2. **Lote B — Migraciones DB + tipos**: migraciones SQL nuevas, regeneración de tipos Supabase, ajustes backend compatibles.
3. **Lote C — Edge functions críticas**: envíos de email/WA, Flow webhooks, tokens de invitación.
4. **Lote D — Flujos de auth y onboarding owner**: auth, `/onboarding-mascota`, dual-role toggle.
5. **Lote E — Flujos provider (vet individual + clínica)**: registro, BecomeProviderDialog, dashboard vet, pacientes.
6. **Lote F — Flujos shelter**: registro, bulk import, transfer a adoptante.
7. **Lote G — Flujos alianzas (/aplicar)**: todos los tipos + notify-pitch-application + panel admin.
8. **Lote H — Pagos Flow + membresías**: upgrades B2C y B2B, webhooks, idempotencia.
9. **Lote I — Integraciones externas**: Google Calendar, OCR, WhatsApp.
10. **Lote J — Copy, UX polish y consistencia visual**: pasar copy con subagente `ux-copy-chilean`.
11. **Lote K — Docs vivos + diagramas**: actualizar `FLUJO_COMPLETO.mmd`, mapa funcional, INDEX.
12. **Lote L — Smoke tests E2E automatizados**: Playwright scripts que ejecuten 1 happy path por onboarding.

Reordena si hay dependencias duras. Si un lote depende de una decisión de Pedro pendiente, márcalo y sigue con los siguientes.

---

## 10. 🚦 GATE 2 — Aprobar plan antes de ejecutar lotes

**DETÉNTE DE NUEVO.** Muestra a Pedro:
- Número de lotes y estimación de esfuerzo total.
- Cuáles se pueden ejecutar sin su input vs. cuáles requieren decisiones pendientes.
- Sugerencia de cadencia (todo seguido vs. lote-por-lote con review humano).

**Espera confirmación del modo de ejecución**:
- **Modo A — autónomo**: Claude Code ejecuta todos los lotes que no requieren decisión; pausa solo cuando llega a uno que la requiere.
- **Modo B — review por lote**: Claude Code ejecuta 1 lote, reporta, espera aprobación de Pedro, sigue.
- **Modo C — selectivo**: Pedro elige qué lotes quiere que se ejecuten ahora.

---

## 11. FASE 6 — Ejecución iterativa

Por cada lote aprobado:

### 11.1. Antes de tocar código
1. Crea rama git: `git checkout -b fix/audit-lote-<letra>-<slug>`.
2. Lee de nuevo los archivos del lote (no asumir desde memoria).
3. Correr `npx tsc -b`, `npm run lint`, `npm run test:ci` para baseline verde.

### 11.2. Durante el lote
4. Implementa los fixes del lote en orden de dependencia.
5. Si una migración SQL es necesaria: crearla en `supabase/migrations/YYYYMMDDHHMMSS_*.sql`, **NUNCA aplicarla automáticamente** (CLAUDE.md §9.2). Registrar en `05-PLAN_EJECUCION.md` que Pedro debe aplicarla manualmente.
6. Actualiza tipos Supabase si toca schema (documentar comando, no autoejecutar).
7. Actualiza copy al estilo chileno con tuteo.
8. Agrega/actualiza tests unitarios para lógica crítica.
9. Actualiza docs vivos en el mismo commit si el lote cambia flujos.

### 11.3. Después del lote
10. Correr `npx tsc -b && npm run lint && npm run test:ci`. Si falla, arreglar antes de seguir.
11. Smoke test manual mental: re-caminar los ONBD-XX afectados por el lote con la checklist de §5.1.
12. `git add -A && git commit -m "fix(audit): lote <letra> — <descripción corta>"`.
13. Reportar a Pedro: qué se cambió, qué queda pendiente de ese lote, si hay migraciones para aplicar a mano.

### 11.4. Cuando encuentras algo inesperado
- **Bug nuevo no catalogado**: agregar a `04-CATALOGO_GAPS.md` y decidir si se arregla en este lote o se difiere.
- **Decisión de producto no prevista**: parar y preguntar a Pedro.
- **Refactor grande tentador**: NO. CLAUDE.md §9.6 y §11.1: la ficha clínica PDF + directorio vets son joya de la corona, solo fixes puntuales.
- **Cambio que afecta usuarios en producción**: aplicar reglas §9.8 del CLAUDE.md (migración de datos, fallbacks, renombrar sin romper).

---

## 12. FASE 7 — Smoke test E2E final

Genera `_pending/auditoria-e2e/06-SMOKE_TEST_LAUNCH.md` con **un checklist ejecutable manualmente** que Pedro pueda correr el día antes del lanzamiento.

Formato: un bloque por cada ONBD-XX con pasos numerados, estado esperado, y espacio para marcar ✅/❌.

Adicionalmente, si el tiempo lo permite, crea Playwright scripts mínimos en `e2e/` que automaticen al menos los happy paths de:
- ONBD-01 (dueño registro + agregar mascota)
- ONBD-06 (vet inline via BecomeProviderDialog)
- ONBD-10 (refugio via BecomeShelterDialog)
- ONBD-13, 14, 15 (las 3 /aplicar de alianzas)
- ONBD-27, 28 (upgrade Paw Member y upgrade vet a Premium)

---

## 13. Criterios launch-ready (Definition of Done)

El proyecto está listo para lanzar cuando:

**Cobertura**
- [ ] Los 30 ONBD-XX están mapeados, auditados y ✅ en el checklist de §5.1 o tienen gap aceptado y diferido con justificación.
- [ ] Cero gaps P0 abiertos. Los P1 abiertos tienen workaround documentado.
- [ ] Todas las decisiones de Pedro en Gate 1 están resueltas y reflejadas en código.

**Técnico**
- [ ] `npx tsc -b` → 0 errores.
- [ ] `npm run lint` → 0 errores (warnings a11y aceptables por ahora).
- [ ] `npm run test:ci` → todos verdes.
- [ ] `npm run build` → pasa, bundle dentro del `PERFORMANCE_BUDGET.md`.
- [ ] Todas las migraciones SQL generadas están aplicadas por Pedro en Supabase Dashboard y verificadas.
- [ ] Tipos Supabase regenerados post-migraciones.

**Integraciones**
- [ ] Email: enviar de prueba para cada template (invitación vet, invitación refugio, notify-pitch, reminder, weekly reports). Verificar llegada y links.
- [ ] WhatsApp: URLs `wa.me` abren correctamente; Evolution/Meta marcado con estado real.
- [ ] Flow.cl: hacer un upgrade de prueba end-to-end (con cuenta sandbox o monto mínimo real).
- [ ] Google Calendar: OAuth flow completo, sin que el bug de disconnect reseteé perfiles.
- [ ] Supabase Storage: subida y descarga de archivos de prueba en cada bucket usado.

**Producto**
- [ ] Cada tipo de actor (dueño, vet individual, clínica, refugio, paw voice, paw company, paw partner, admin) tiene una cuenta de prueba creada y se caminó el onboarding completo manualmente.
- [ ] Dual-role toggle funciona sin leakage de menús.
- [ ] Claim de mascota huérfana funciona desde link de email y desde "tengo un código" manual.
- [ ] `/aplicar?tipo=xxx` funciona para los 9 tipos declarados y llega a admin + dispara email.
- [ ] Admin > Sistema > Postulaciones puede aprobar y crea rows públicas correctamente.

**Docs y operación**
- [ ] `diagrams/FLUJO_COMPLETO.mmd` actualizado, pega en mermaid.live sin errores.
- [ ] `MAPA_FUNCIONAL_COMPLETO.md` refleja realidad.
- [ ] `INDEX.md` listando los nuevos archivos de `_pending/auditoria-e2e/`.
- [ ] `CHANGELOG` o nota de release con lo cambiado por esta auditoría.
- [ ] Runbook mínimo de qué hacer si cae email / WA / Flow / Supabase el día del lanzamiento.

**Riesgos fiscales/legales explicitados**
- [ ] Cuenta Flow a nombre personal: estado y plan de migración a SpA documentado.
- [ ] Evolution API: marcado como beta/legacy con plan de migración a Meta Cloud API.
- [ ] Términos y privacidad (`/terms`, `/privacy`) están al día con los flujos reales (refugios, alianzas, pitch applications).

---

## 14. Artefactos a entregar (inventario final)

Al cierre de esta ejecución, deben existir:

```
_pending/auditoria-e2e/
├── 00-INVENTARIO_ONBOARDINGS.md
├── 01-FLUJOS_E2E.md
├── 02-HALLAZGOS/
│   ├── ONBD-01.md
│   ├── ONBD-02.md
│   └── ... (uno por cada onboarding)
├── 03-INTEGRACIONES_CRUZADAS.md
├── 04-CATALOGO_GAPS.md
├── 04-CATALOGO_GAPS.csv
├── 05-PLAN_EJECUCION.md
├── 06-SMOKE_TEST_LAUNCH.md
└── 99-RESUMEN_EJECUTIVO.md    # TL;DR final para Pedro
```

Además:
- Ramas git `fix/audit-lote-<X>-*` con commits por lote.
- Migraciones nuevas en `supabase/migrations/` (si aplica).
- Actualizaciones a `diagrams/FLUJO_COMPLETO.mmd` y `MAPA_FUNCIONAL_COMPLETO.md`.
- (Opcional) scripts Playwright en `e2e/`.
- Registrar los nuevos docs en `INDEX.md`.

---

## 15. Reglas críticas (repaso explícito)

1. **Idioma**: chileno, tuteo, nunca voseo. Nunca "peludito" / "che" (CLAUDE.md §9.5).
2. **Copy consistente**: comuna (no distrito), ficha clínica (no historial), Paw Friend (siempre mayúsculas).
3. **Joya de la corona intocable**: ficha clínica PDF + directorio vets, solo fixes puntuales (§9.6, §11.1).
4. **Carpeta `docs/` NUNCA se edita a mano** (§9.1). Es output de `npm run build`.
5. **Migraciones**: generar archivo, NUNCA aplicar auto (§9.2). Pedro las corre manualmente.
6. **Pagos via Flow.cl**, NO Webpay (§9.3).
7. **Secrets**: nunca en código ni en chat (§9.4).
8. **Proteger usuarios en producción** (§9.8): migración de datos, defaults, fallbacks temporales.
9. **Docs vivos**: si cambiás flujo/ruta/DB/plan, actualizar `FLUJO_COMPLETO.mmd` y mapa funcional **en el mismo commit** (§9.7).
10. **Modelo de negocio**: B2C siempre gratis, Paw Member es opcional, los 4 tiers B2B son `provider_free`, `provider_premium`, `provider_clinic_starter`, `provider_pro_max` (§5). No inventes tiers ni precios distintos.

---

## 16. Preguntas que DEBES hacer al inicio (antes de Fase 0)

Abre la conversación con Pedro preguntando **exactamente estas 5 cosas** (en bloque, en un solo mensaje):

1. **Fecha objetivo de lanzamiento** (día/semana concreta o rango).
2. **Scope del lanzamiento**:
   - ¿Soft launch a círculo cercano?
   - ¿Lanzamiento público con prensa / redes?
   - ¿Solo B2C? ¿Solo B2B? ¿Ambos?
3. **Cuentas de prueba disponibles**: ¿Pedro tiene cuentas por cada tipo de actor o hay que crearlas? ¿Hay cuenta sandbox de Flow.cl?
4. **Nivel de autonomía**: ¿Pedro quiere que ejecutes todos los lotes sin preguntar (modo A), review lote-por-lote (modo B), o selectivo (modo C)?
5. **Prioridades de exclusión**: ¿hay algún onboarding del inventario que explícitamente NO debe estar activo al lanzamiento (ej: shelter en beta cerrada, /aplicar?tipo=corfo desactivado porque postulación ya cerró)?

**No empieces Fase 0 hasta tener respuesta a estas 5.**

Si a mitad de cualquier fase aparece una decisión de producto/negocio/fiscal, se aplica la misma regla: pregunta y espera. Mejor una pausa de 10 minutos que un bug en producción.

---

## 17. Done criteria del prompt completo

Esta ejecución termina cuando:

- [ ] Los 3 gates fueron cruzados con aprobación explícita de Pedro.
- [ ] Todos los lotes aprobados están mergeados a `main` (o en ramas listas con PR).
- [ ] `docs-raiz/planes/CHANGELOG_AUDITORIA_E2E.md` resume qué se cambió, qué se difirió y por qué.
- [ ] `99-RESUMEN_EJECUTIVO.md` dice en 1 página: "Paw Friend está launch-ready para los siguientes onboardings: [lista]. Pendientes no-blockers: [lista]. Próximos pasos post-lanzamiento: [lista]."
- [ ] `npx tsc -b && npm run lint && npm run test:ci && npm run build` → todo verde.
- [ ] `git status` limpio salvo archivos esperados (nuevos docs, nuevas migraciones no aplicadas, updates de diagramas).
- [ ] Pedro confirma en chat que puede dar luz verde al lanzamiento con lo entregado.

---

## 18. Última regla: cuando dudes, pregunta

Esta auditoría toca el corazón del producto en un momento crítico (pre-lanzamiento). Es preferible que preguntes 20 veces y ejecutes con certeza, a que asumas una vez y rompas producción.

Pedro ya dijo: "Si necesitas decisiones mías para ejecutar, consúltalas te las respondo y seguimos". Úsalo.

---

**Fin del prompt. Empieza por §16 (las 5 preguntas iniciales) y espera respuesta de Pedro antes de seguir.**
