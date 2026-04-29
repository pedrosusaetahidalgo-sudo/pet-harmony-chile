# Consolidado 2026-04-18 — Paw Friend

> Snapshot de estado tecnico, docs vivos y plan ejecutable para **2026-04-19**.
> Generado tras correr tsc, eslint, vitest y build completos sobre `main`.

---

## 1. Estado tecnico (verificado hoy)

| Check | Comando | Resultado | Duracion |
|---|---|---|---|
| TypeScript | `npx tsc -b` | 0 errores (exit 0) | ~60s |
| Lint | `npm run lint` | 0 errores · 1 warning (AdminSalaInversion:2056 a11y, pre-existente, no introducido hoy) | ~20s |
| Tests | `npm run test:ci` | 334 tests passed (26 files) | 45.77s |
| Build prod | `npm run build` | OK, `docs/` regenerado | 1m 23s |

**Bundles destacados**:
- `Admin-*.js`: 739.57 kB / 203 kB gzip (Admin lazy chunk mas grande, esperado).
- `sentry-vendor`: 469.42 kB / 155 kB gzip.
- `recharts-vendor`: 432.31 kB / 114 kB gzip.
- Warning Vite: algunos chunks > 600 kB. No bloqueante; candidato a code-split futuro
  en admin (`AdminSalaInversion`, `AdminFeedback`).

**Aviso prod**: el build actual incluye las nuevas secciones en la Sala de Inversion,
pero `docs/` aun no se ha pusheado. Pedro decide si commit + push mañana.

---

## 2. Archivos regenerados hoy (post-ultimos commits)

Los 3 archivos fueron escritos ANTES de los commits de donaciones (`bdce9c48`, `e49a2a3b`).
Se regeneraron integrando el nuevo modelo de negocio y el signal de voluntad de pago.

### 2.1 [PITCH_DECK.md](PITCH_DECK.md)

- De 12 → 13 slides. Nuevo **Slide 13 — Impacto y transparencia**.
- **Portada** con tagline "Hecho en Chile, de pura mano, con IA de Claude".
- **Slide 2 — Problema**: agregado bloque refugios/callejeros.
- **Slide 3 — Solucion**: cuarto componente (Paw Voices + donaciones trazables).
- **Slide 6 — Producto**: agregado stack de admin (Sala Inversion, Pulso Diario,
  health score edge fns) y pagina `/donaciones`.
- **Slide 7 — Traccion**: 4 metricas nuevas (Donaciones total, Donantes unicos,
  Paw Companys activos, Rating app) + 1 signal unico (Would-pay yes/maybe/no).
  Actualizado "334 tests verdes 2026-04-18".
- **Slide 8 — Modelo de negocio**: tercer motor **Paw Companys (B2B2C)** con ticket
  $49.9K-$199.9K CLP/mes + seccion de donaciones voluntarias como proxy NPS.
- **Slide 9 — Competencia**: quinto moat ("Costos home-made / IA de Claude").
- **Slide 10 — Equipo**: seccion "Co-pilot" con Claude acreditado.
- **Slide 11 — Roadmap**: hitos de Paw Companys y donaciones en cada fase.
- **Slide 12 — Ask**: SDR ahora incluye "Paw Companys lead".
- **Slide 13 (nuevo)**: principio operativo, flujo trazabilidad, por que importa a VC.

### 2.2 [sales/PITCH_VET_CORTO.md](sales/PITCH_VET_CORTO.md)

- Posicionamiento "hecho en Chile con IA de Claude" en la solucion.
- Agregado **"Avales de comunidad (Paw Voices)"** como bullet de ventas.
- Nueva seccion **"Paw Companys — tu clinica con badge empresarial"** para cadenas que
  quieran patrocinar la causa ($49.9K+/mes).
- Nueva seccion **"Para quien armamos esto"**: proyecto chico, iteracion rapida,
  sin comerciales intermediarios.

### 2.3 [src/components/admin/AdminSalaInversion.tsx](src/components/admin/AdminSalaInversion.tsx)

Cambios estructurales (+269 lineas netas):

- **TARGETS_90D extendido** con `donations_clp`, `paw_companys`, `willingness_yes_pct`, `rating_avg`.
- **Nueva query `community`**: lee `donations` + `feedback_in_app` (ultimos 90 dias) y calcula
  total donado, mes, donantes unicos, ticket promedio, mails pendientes, rating promedio,
  yes/maybe/no distribution del widget.
- **Nueva seccion UI "Comunidad: donaciones + voluntad de pago"** con:
  - 4 KPI cards: Donaciones total, Este mes, Rating app, Would pay (yes %).
  - 3 MetaRow: Donaciones acumuladas, Rating promedio, Would pay (yes %).
  - Alerta amber si hay mails de gracias pendientes.
  - Links directos a `/admin?section=content&sub=feedback`.
- **CSV export ampliado** con "Comunidad (donaciones + voluntad de pago)".
- **Data room checklist**: 5 items nuevos — donations live (done), Paw Voices publica,
  primeros 3 Paw Companys (critico), dashboard transparencia, convenio refugio.
- **Financing route nueva**: "Paw Companys (sponsors empresariales)" no-dilutivo con
  ticket $49.9K-$199.9K CLP/mes.
- **A11y**: boton de status en financing table ahora tiene `aria-label`.
- **Tier thresholds** (ANGEL_READY / SEED_READY) sin cambios — sigue reflejando el plan
  `project_vc_plan_2026_04_18.md`.

---

## 3. Auditoria rapida del proyecto al 2026-04-18

**Estado del flujo completo (diagrams/FLUJO_COMPLETO.mmd)**: actualizado hoy,
incluye subgraph DONACIONES (4 referencias a "donacion/DONACIONES").

**Ultimos 5 commits** (`main`):

| SHA | Titulo |
|---|---|
| e49a2a3b | feat(donations+sidebar): KPI ingresos donaciones en admin y reorden sidebar |
| ae32fbd7 | feat(landing): atribucion "Con IA de Claude" en footers publicos |
| 80dc73aa | chore(audit): filter invalid_grant noise + normalize legacy breed/comuna data |
| bdce9c48 | feat(feedback+donations): rating, voluntad de pago y flujo de donaciones via Flow |
| 73878b3a | feat(admin+docs): redesign Sala Inversion + pitch deck esqueleto |

**Modelo de datos verificado**:
- `donations` (tabla) — via migration `20260602010000_donations.sql`.
- `feedback_in_app.app_rating` + `feedback_in_app.would_pay` — migration `20260602000000`.
- Edge fns: `flow-create-donation`, `send-donation-thanks`, `flow-webhook` (extendido).
- Sidebar: ya expone `/donaciones` bajo "Causas" (commit `e49a2a3b`).

**Gaps detectados hoy** (priorizados):

1. **ALTO** — Muralla Paw Voices publica aun no esta en `/donaciones`. El formulario guarda
   `is_public`, pero no hay componente que muestre los mensajes publicos. Sin esto, el
   signal emocional del pitch es mas debil.
2. **ALTO** — Paw Companys: aun no hay UI de onboarding ni tabla `paw_companys` dedicada.
   Slide 8 del deck lo promete pero el producto no lo entrega.
3. **MEDIO** — Dashboard de transparencia publico (total recaudado / destinado / aliados)
   no existe. Es el cierre de la historia "home-made".
4. **MEDIO** — Convenio con refugio aliado no esta firmado. Sin contraparte, la historia
   de trazabilidad es vaporware.
5. **BAJO** — Warning a11y pre-existente en AdminSalaInversion:2056 (td en financing
   table). No bloquea nada.
6. **BAJO** — RESEND_API_KEY en memoria indica que falta verificar que los mails de
   gracias esten saliendo en prod (ver `project_session_2026_04_18_donations.md`).

**Memoria apuntando a esto**: `project_monetization_donations_vision.md`,
`project_home_made_chile.md`, `project_session_2026_04_18_donations.md`.

---

## 4. Plan ejecutable para 2026-04-19 (manana)

Ordenado por impacto. Cada item tiene costo estimado en tiempo + archivo(s) a tocar.

### 4.1 Muralla Paw Voices publica en `/donaciones` [ALTO, 2-3h]

**Por que**: el signal emocional del pitch. Una muralla con 20-50 mensajes reales vale
mas que cualquier slide.

**Que hacer**:
- Crear componente `PawVoicesWall.tsx` que lea `donations` con `is_public=true AND message IS NOT NULL`.
- Mostrar donor_name (o "Anonimo"), message truncado, amount en CLP compacto, fecha relativa.
- Render en Grid 2-3 columnas en `src/pages/Donaciones.tsx` bajo el CTA de aporte.
- Mig SQL: crear indice parcial en `donations(is_public, paid_at DESC) WHERE is_public = true AND status = 'paid'`.
- Hook `usePublicDonations` con `useQuery` + staleTime 5min.

**Criterio exito**: al abrir `/donaciones` sin login, se ven los mensajes publicos mas recientes.

### 4.2 Seed de Paw Voices para Pedro [ALTO, 30min]

**Por que**: sin mensajes, la muralla se ve vacia. Pedro necesita tener 5-10 mensajes
para capturas de pantalla del pitch.

**Que hacer**:
- Pedro inserta 5-10 donaciones reales propias ($1000-$5000 CLP cada una) con mensajes
  genuinos, marcando `is_public = true`.
- **NO** hacer seeds falsos. Estas son donaciones reales del fundador.

**Criterio exito**: screenshots del slide 13 del deck muestran mensajes reales.

### 4.3 Paw Companys MVP [ALTO, 3-4h]

**Por que**: motor de revenue del slide 8 que aun no existe en el producto.

**Que hacer**:
- Migracion SQL: crear tabla `paw_companys (id, name, logo_url, website, tier, monthly_clp,
  started_at, status, featured, slug, description)`.
- Crear `src/components/PawCompanysGrid.tsx` que lea los `paw_companys` activos y los
  muestre en `/donaciones` con badge (Bronze / Silver / Gold segun `tier`).
- Panel admin nuevo en `src/components/admin/AdminPawCompanys.tsx` (CRUD simple:
  agregar, editar, desactivar; no requiere pagos automatizados todavia).
- Link a este panel desde Admin > Contenido.
- **No** integrar Flow recurrent billing aun — los primeros 3 sponsors se cobran por
  transferencia manual.

**Criterio exito**: Pedro puede cargar 1 sponsor de prueba y verlo renderizado en
`/donaciones` publico.

### 4.4 Dashboard publico de transparencia (mini) [MEDIO, 1-2h]

**Por que**: cierra la promesa del slide 13 con data real.

**Que hacer**:
- Ampliar pagina `/donaciones` con una tarjeta "Transparencia" al final:
  - Total recaudado (suma `amount_clp` de `donations` status=paid).
  - Donaciones este mes.
  - Costos operacionales estimados (constante por ahora: ~USD $80/mes).
  - "Excedente destinado a refugio": placeholder "Proximamente" o nombre del primer aliado.
- Query publica (RLS permitida): usar agregado simple, no exponer donor_id.

**Criterio exito**: numero visible en `/donaciones` sin login, alineado con el KPI de
`/admin?section=finance` > donaciones.

### 4.5 Verificar envio de mails de gracias (Resend) [MEDIO, 30min]

**Por que**: si el mail no sale, los primeros donantes perciben falta de reciprocidad.

**Que hacer**:
- Ejecutar query en SQL Editor: `SELECT COUNT(*) FROM donations WHERE status='paid' AND thanked_at IS NULL`.
- Si > 0: revisar logs de edge fn `send-donation-thanks` en Supabase.
- Verificar que `RESEND_API_KEY` este en secrets de Supabase (no en codigo).
- Smoke test: donar $500 con cuenta propia, confirmar mail llega a inbox.

**Criterio exito**: thanks_pending en `/admin?section=finance` queda en 0.

### 4.6 Commit + push del trabajo de hoy [CRITICO, 5min]

**Por que**: el diff local incluye documentos + AdminSalaInversion ampliado. Sin push,
se pierde si Pedro cambia de branch.

**Que hacer** (Pedro decide, no yo):
```bash
git add PITCH_DECK.md sales/PITCH_VET_CORTO.md src/components/admin/AdminSalaInversion.tsx CONSOLIDADO_2026_04_18.md
git commit -F <mensaje_multilinea.txt>   # recordar: PowerShell no soporta heredoc
git push origin main
```

**Mensaje sugerido**:
```
docs(pitch+admin): integrar donaciones y Paw Companys en deck + Sala Inversion

- PITCH_DECK.md pasa a 13 slides: donaciones, Paw Voices, Paw Companys,
  "home-made Chile con IA de Claude" como tagline y moat de costos.
- sales/PITCH_VET_CORTO.md: avales de comunidad + Paw Companys + posicionamiento
  "hecho en Chile, de pura mano".
- AdminSalaInversion: nueva seccion "Comunidad: donaciones + voluntad de pago"
  con KPIs (donaciones total, este mes, rating, would-pay %), MetaRow de
  metas 90d, alerta de mails pendientes, CSV export extendido. Data room
  suma 5 items y financing table incluye Paw Companys.
- CONSOLIDADO_2026_04_18.md: estado tecnico (tsc/lint/tests/build OK) y plan
  ejecutable para 2026-04-19.
```

### 4.7 Nice-to-have si queda tiempo [BAJO]

- Video de 45s para LinkedIn del slide 13 (ver `LINKEDIN_LAUNCH_POST.md` en root).
- Convocar a Sofia (vet beta) para grabar testimonio de 30s.
- Escribir DM templates para invitar primeros 3 Paw Companys (pet shop de comuna,
  alimento local, seguro mascota).

---

## 5. Tableros y links utiles para manana

- Sala Inversion viva: `/admin?section=sala-inversion`
- Monitoreo donaciones: `/admin?section=content&sub=feedback&tab=donaciones`
- Ratings + would-pay: `/admin?section=content&sub=feedback&tab=recepcion`
- Pulso Diario: `/admin?section=system&sub=pulso`
- Leads CRM vets: `/admin?section=leads-crm`
- Diagrama flujo: `diagrams/FLUJO_COMPLETO.mmd` (ya actualizado con donaciones)
- Memoria plan VC: `memory/project_vc_plan_2026_04_18.md`
- Memoria donaciones vision: `memory/project_monetization_donations_vision.md`

---

## 6. Reglas para manana (recordatorios)

1. **Nunca** pushear `docs/` sin regenerar con `npm run build` primero (CLAUDE.md §9.1).
2. **Nunca** aplicar migraciones SQL automaticamente — Pedro las corre desde Supabase Dashboard.
3. Cada cambio de rutas/flujos/pricing **obliga** a tocar `diagrams/FLUJO_COMPLETO.mmd`
   en el mismo commit (CLAUDE.md §9.7.1).
4. Paw Friend es proyecto chico. No sobre-ingeniar: MVP de Paw Companys es CRUD + grid publico,
   no un billing recurrente complejo.
5. **Regla de oro auto-fixes**: no alterar datos de usuarios existentes sin confirmacion;
   fallbacks para renames (`localStorage`, columnas). Ver `feedback_protect_existing_users`.
6. **Secretos**: si Pedro pega una API key en chat, advertir + recomendar rotacion.

---

## 7. Prioridad sugerida al despertar

Si Pedro tiene **2 horas**: 4.6 (push) + 4.1 (Paw Voices wall) + 4.2 (seed propio).
Si tiene **medio dia**: arriba + 4.3 (Paw Companys MVP).
Si tiene **el dia completo**: arriba + 4.4 (transparencia) + 4.5 (mails) + 4.7 (outreach).

La palanca con mayor multiplicador es 4.1 (Paw Voices) porque desbloquea el angulo
emocional del pitch y da material para redes sociales sin costo adicional.

---

**Snapshot generado**: 2026-04-18 por Claude Opus 4.7 (1M context) tras ejecutar
tsc, eslint, vitest, build y regenerar los 3 documentos especificados por Pedro.
Nada queda pendiente del requerimiento original de esta sesion.
