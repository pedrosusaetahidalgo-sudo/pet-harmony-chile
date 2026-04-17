# Propuesta de reordenamiento — Paw Friend

**Fecha**: 2026-04-17
**Estado**: **v3 — dos perspectivas (dueño y vet) + layouts/botones/CTAs, no solo rutas**
**Base**: [INVENTARIO_APP_2026_04_17.md](INVENTARIO_APP_2026_04_17.md) + dos auditorías de código (UX dueño y UX vet)

---

## Cambios vs v2

Ampliación de alcance tras confirmación de Pedro: puedo tocar layouts, botones, CTAs y jerarquía visual (no solo redirects y BottomTabBar). Además, agrego un bloque VET con la misma profundidad que DUEÑO.

Mejoras nuevas incorporadas tras segunda auditoría:

- **Plomería previa obligatoria**: crear `LINKS.remindersTab()`, `LINKS.bookingsTab()`, `LINKS.routinesTab()` en [src/lib/links.ts](src/lib/links.ts) y reemplazar hardcodes de `/reminders`, `/mis-reservas`, `/rutinas` en Home, UnifiedCalendar y dialogs. Sin esto, cualquier cambio en entry point obliga a tocar ~10 archivos.
- **UnifiedCalendar**: hoy usa Badges clickeables (no keyboard-navegables). Refactor a shadcn `<Tabs>` da a11y gratis y estructura para las 4 vistas (Hoy/Recordatorios/Rutinas/Reservas).
- **Tests E2E** a actualizar: `owner-clinical-lifecycle.spec.ts` y `smoke-protected.spec.ts` navegan a `/reminders`, `/mis-reservas`, `/services/vets`, `/maps`.
- **Perspectiva vet** revelada:
  - Hay **doble CTA** en la ficha vet: `VetActionsHeader` (top) y `VetActionsBar` (sticky bottom) con botones duplicados → confusión clínica.
  - El diferenciador "Ver cómo me ven los dueños" vive en `ProviderProfileEdit` solamente. No está en `ProviderDashboard` → desperdicio.
  - Solicitudes de vinculación pendientes están en un collapsible amber pequeño → se pierden.
  - `NewPatientForm` tiene 1 solo modo (perfil completo) → fricción para crear paciente rápido en consulta.
  - Copy con tono infantil en contexto clínico ("Nota rápida", "Mascotas pendientes de reclamar", "Resumen IA").

---

## Principios guía

1. **Una fuente por feature**, redirects legacy no agresivos.
2. **Joya de la corona visible**: ficha clínica + PDF en 1-2 clicks desde cualquier pantalla owner.
3. **Premium visible aunque bloqueado**: nunca ocultar, enseñar valor.
4. **BottomTabBar es real estate sagrado**: 5 slots, cada uno = intención.
5. **Labs accesibles en móvil**: drawer con "Explorar".
6. **Respetar "pivot médico"** declarado en BottomTabBar.
7. **(NUEVO) Copy profesional en vet, juguetón en dueño**. Dos tonos, no uno solo.
8. **(NUEVO) Una sola barra de acciones por pantalla**. Nada de CTAs duplicados en header + bottom bar.
9. **(NUEVO) Plomería antes que rediseño**: LINKS helpers + tabs a11y antes de tocar navegación.

---

# Bloque A — DUEÑO (owner)

## A.1. Fase plomería-owner (prerequisito)

### A.1.1. LINKS helpers para tabs de calendario
**Por qué**: hoy hay hardcodes de `/reminders`, `/mis-reservas`, `/rutinas` en [Home.tsx:638, 740](src/pages/Home.tsx) y [UnifiedCalendar.tsx](src/pages/UnifiedCalendar.tsx). Sin abstracción, cambiar el entry point obliga a tocar 10+ archivos.

**Cambio**: agregar en [src/lib/links.ts](src/lib/links.ts):
```
LINKS.remindersTab() → '/calendario?tab=recordatorios'
LINKS.routinesTab() → '/calendario?tab=rutinas'
LINKS.bookingsTab() → '/calendario?tab=reservas'
LINKS.calendarToday() → '/calendario?tab=hoy'
```
Mientras `/calendario` todavía no tiene tabs (Fase A.3), estos helpers apuntan a las rutas viejas. Cuando la Fase A.3 aterriza, se cambia la implementación interna de los helpers y todos los callers se actualizan solos.

**Archivos**: `src/lib/links.ts`, `src/pages/Home.tsx`, `src/pages/UnifiedCalendar.tsx`, dialogs que correspondan.
**Riesgo**: muy bajo.
**Validación**: grep `/reminders` y `/mis-reservas` fuera de `src/lib/links.ts` y tests E2E debe bajar a <3 matches.

### A.1.2. Actualizar tests E2E afectados
- [smoke-protected.spec.ts:23](e2e/smoke-protected.spec.ts): `/services/vets` pasa a pública (redirect a `/veterinarios`) → sacar del array protegido o mover a smoke-public.
- [owner-clinical-lifecycle.spec.ts:71](e2e/owner-clinical-lifecycle.spec.ts): "Reminders page loads" — actualizar para que funcione con `/reminders` legacy (sigue vivo) Y con `/calendario?tab=recordatorios` (post-fase A.3).

**Riesgo**: bajo.
**Validación**: playwright verde.

---

## A.2. Premium visible con candado en Home

**Por qué**: `/panel-pro` y `/reportes` no se ven en Home si sos Free → parecen rotos.

**Cambio**: en Home, cards de "Panel Pro" y "Reporte semanal" se muestran siempre, envueltas en `<PremiumGate feature="panel-pro" />` / `<PremiumGate feature="weekly-report" />` cuando Free. Ya existe el componente en [src/components/PremiumGate.tsx](src/components/PremiumGate.tsx) con CTA a `/upgrade?feature=X`.

**Archivos**: `src/pages/Home.tsx`.
**Riesgo**: bajo.

---

## A.3. `/calendario` como matriz con 4 tabs a11y

**Por qué**: `/calendario` es powerful (unifica todo) pero invisible. Además hoy usa Badges clickeables sin keyboard nav.

**Cambio**:
- Refactor a shadcn `<Tabs>` (Radix): **Hoy** (default) · **Recordatorios** · **Rutinas** · **Reservas**.
- Cada tab reutiliza los componentes existentes de `/reminders`, `/rutinas`, `/mis-reservas`.
- Tab "Hoy" = día actual con mix de los 3 tipos + follow-ups.
- Rutas `/reminders`, `/rutinas`, `/mis-reservas` permanecen vivas (no redirects agresivos), pero se marcan como "legacy" y todos los links internos usan `LINKS.*Tab()`.
- Dialogs (`AddReminderDialog`, `EnhancedBookingDialog`) siguen funcionando dentro del tab.

**Archivos**: `src/pages/UnifiedCalendar.tsx`, `src/components/ui/tabs.tsx` (si falta algún estilo), dialogs.
**Riesgo**: medio — es refactor visual del calendario.
**Validación**: keyboard nav entre tabs funciona, crear recordatorio desde tab Recordatorios abre dialog y guarda.

---

## A.4. Hub `/servicios` con toggle lista/mapa

**Por qué**: `/servicios`, `/services/:type`, `/veterinarios`, `/maps` son 4 caminos a un proveedor.

**Cambio**:
- `/servicios` sigue como hub (grid de 6 categorías: Vets destacada, Paseadores, Cuidadores, Entrenadores, Peluqueros, Adopción).
- Cada listado (`/veterinarios`, `/services/walkers`, etc.) gana toggle **Lista ↔ Mapa** embebido (control propio, no nueva ruta).
- `/services/vets` → redirect a `/veterinarios` (era fantasma).
- `/maps` → redirect a `/servicios` con query `?view=maps` (legacy, no se promociona).

**Archivos**: `src/pages/Services.tsx`, `src/pages/ServicesByType.tsx`, `src/pages/VetDirectory.tsx`, `src/pages/Maps.tsx`, `src/App.tsx`.
**Riesgo**: medio.

---

## A.5. MyPets: CTA "Ver ficha" en reverso del flip

**Por qué**: el Paw Card es experiencia de marca (flip animation) pero no hay botón explícito a ficha desde ahí.

**Cambio**: en `PawCardBack` (reverso del flip), agregar botón "Ver ficha clínica" (style `variant=default` + ícono `FileText`) que navega a `/ficha/:petId`. El flip sigue funcionando igual; el botón vive adentro del card volteado.

**Archivos**: `src/components/paw-cards/PawCardBack.tsx` (o equivalente), `src/pages/MyPets.tsx`.
**Riesgo**: bajo.

---

## A.6. Drawer móvil "Explorar"

**Por qué**: Feed/Comunidad/Adopción/PawGame/Collection/Misiones/Donantes están en [AppSidebar.tsx:82-93](src/components/AppSidebar.tsx) y Home "Explorar", pero en móvil el sidebar puede no ser descubrible.

**Cambio**: asegurar botón hamburger visible en Header móvil que abre drawer con el mismo contenido del AppSidebar (Core + Explorar + Profesional dual-role + Footer). Si ya existe, validar que sea descubrible; si no, agregarlo.

**Archivos**: `src/components/Header.tsx`, `src/components/AppLayout.tsx`.
**Riesgo**: bajo-medio.

---

## A.7. Nuevo BottomTabBar owner

**Hoy**: Inicio · My Paws · Vets · Recordar · Perfil
**Propuesta**: **Inicio · My Paws · Servicios · Agenda · Perfil**

- **My Paws**: nombre marca, conservar. Match paths incluye `/my-pets`, `/pet/:id`, `/add-pet`, `/edit-pet/:id`, `/ficha/:id`.
- **Vets → Servicios** (ícono `Store`): va al hub `/servicios` (A.4).
- **Recordar → Agenda** (ícono `CalendarDays`): va a `LINKS.calendarToday()` con badge de recordatorios vencidos + 24h (ya existe el cálculo en [BottomTabBar.tsx:56-60](src/components/BottomTabBar.tsx)).
- **Inicio, Perfil**: sin cambios.

Banner dismissible por 7 días: "Los recordatorios ahora viven en Agenda".

**Archivos**: `src/components/BottomTabBar.tsx`, `src/lib/icons.ts` (import Store si falta).
**Riesgo**: medio.

---

## A.8. Home en 3 franjas con jerarquía visual

**Hoy**: 8+ cards en scroll largo, PawPoints escondidos (feedback Palo), Premium oculto si Free.

**Propuesta**: 3 franjas con títulos visuales claros, cards existentes reubicadas:

### Franja 1 — "Tu mascota hoy" (arriba)
- Pet switcher (holo, como hoy) + **chip de PawPoints** a la derecha del switcher
- Status 2x2 condensada: Próxima cita · Vacunas · Salud · CTA **"Abrir ficha"** (botón grande, variant=`default`, `size=lg`)
- Alerts médicas (si hay)

### Franja 2 — "Tu agenda"
- 3 próximos ítems del día (mix recordatorios + rutinas + reservas)
- Link "Ver toda la agenda →" a `LINKS.calendarToday()`
- Si no hay nada: estado vacío "Hoy no hay pendientes"

### Franja 3 — "Descubrí"
- Panel Pro (con candado si Free — A.2)
- Reporte semanal (idem)
- Seasonal tips + annual care checklist
- "Explorar" existente (Feed, Comunidad, PawGame, Misiones, etc.) — mantener tal cual

**Archivos**: `src/pages/Home.tsx`. Sub-componentes opcionales `HomeTodaySection`, `HomeAgendaSection`, `HomeDiscoverSection` (solo si ayudan legibilidad, sin abstracción innecesaria).
**Riesgo**: medio-alto (pantalla más vista).
**Validación**: Free ve candados, Premium ve todo activo, PawPoints visibles, CTA "Abrir ficha" presente.

---

## A.9. Legacy cleanup owner

| Ruta | Hoy | Propuesta |
|---|---|---|
| `/services/vets` | NotFound | redirect a `/veterinarios` |
| `/maps` | ruta propia | redirect a `/servicios?view=maps` |
| `/calendar` | redirect a `/mis-reservas` | cambiar a `/calendario` |
| `/mascota/:petId/timeline` | ruta propia | redirect a `/ficha/:petId?tab=historial` |
| `/mascota/:petId/rutinas` | ruta propia | redirect a `/calendario?tab=rutinas&pet=:petId` |
| `/reminders`, `/mis-reservas`, `/rutinas` | vivos | **mantener vivos** como aliases (deep links, pushes) |

---

# Bloque B — VET (provider)

## B.1. Plomería vet (prerequisito mínimo)

Ninguna. Toda la Fase B depende del código vet existente sin helpers nuevos. La Fase A.1 (LINKS helpers) no afecta el flujo vet.

---

## B.2. Consolidar CTAs en la ficha clínica

**Por qué**: hoy la ficha vet tiene **dos barras de acciones** con botones duplicados:
- [VetActionsHeader.tsx](src/components/provider/VetActionsHeader.tsx) — top
- [VetActionsBar.tsx](src/components/provider/VetActionsBar.tsx) — sticky bottom

Resultado: ¿cuál presiona el vet? Duplicación clínica.

**Cambio**:
- **Eliminar** `VetActionsBar` bottom.
- Consolidar en `VetActionsHeader` sticky top con 5 botones responsive: **Grabar consulta** (primario rojo) · **Nota clínica** · **Agendar** · **Resumen automático** · **PDF**.
- Mobile: primario + secundario visibles, resto en menú overflow (`MoreHorizontal`).
- "Documentos" sale de CTA y pasa a ser **tab propio** en la ficha (hoy está como acción, siendo que es navegación).

**Archivos**: `src/components/provider/VetFichaView.tsx`, `VetActionsHeader.tsx`, `VetActionsBar.tsx` (eliminar), `src/pages/PetClinicalRecord/index.tsx` (agregar tab Documentos).
**Riesgo**: medio — toca el flujo clínico core.
**Validación**: vet registra consulta en 2 clicks (abrir paciente → Grabar). No hay botones duplicados.

---

## B.3. Elevar diferenciador "Ver cómo me ven los dueños" al Dashboard

**Por qué**: el botón hoy vive solo en [ProviderProfileEdit.tsx:173-189](src/pages/ProviderProfileEdit.tsx). El vet no lo descubre sin entrar a editar perfil. Es el diferenciador único de Paw Friend vs competencia.

**Cambio**: agregar tarjeta en `ProviderDashboard` (sidebar derecho, al lado de `MiniProfileCard`):
```
┌─────────────────────────────────┐
│ 👁 Tu perfil público             │
│ Así te ven los dueños antes de  │
│ reservar                         │
│                                  │
│ [Ver mi perfil público →]        │
│ Último update: hace 3 días       │
└─────────────────────────────────┘
```
Abre `/veterinarios/:slug` en pestaña nueva. Si `slug` vacío: CTA "Generar slug" → lleva a `ProviderProfileEdit`.

**Archivos**: `src/components/provider/ProviderDashboard.tsx`, nuevo componente `PublicProfilePreviewCard.tsx`.
**Riesgo**: bajo.

---

## B.4. Solicitudes de vinculación: Alert rojo + KPI + bulk actions

**Por qué**: hoy las "solicitudes de vinculación pendientes" están en collapsible amber dentro de `ProviderPatients` → se pierden. El vet olvida aceptar.

**Cambio**:
- Promover el banner de amber-collapsible a `<Alert variant="destructive">` al tope de `ProviderPatients` (siempre visible si hay pendientes).
- Agregar **KPI** "Vinculaciones por confirmar" en `PatientKPIBar` (tarjeta roja clickeable que filtra).
- Agregar **bulk actions**: "Aceptar todas" · "Rechazar todas" con confirmación.
- Copy profesional: "Vinculaciones por confirmar" (no "Solicitudes pendientes").

**Archivos**: `src/pages/ProviderPatients.tsx`, `src/components/provider/PatientKPIBar.tsx`.
**Riesgo**: bajo-medio.

---

## B.5. NewPatientForm: modo "Paciente rápido"

**Por qué**: hoy el form pide datos completos de mascota + dueño. En consulta el vet a veces necesita crear un paciente en 10 segundos y completar después.

**Cambio**: agregar tabs al dialog:
- **Paciente rápido** (default): solo nombre mascota + especie + nombre dueño + email dueño. Submit rápido.
- **Perfil completo**: igual que hoy (raza, fecha nac, sexo, peso, microchip, alergias, etc.).

Después de crear paciente rápido, banner en ficha: "Completar perfil clínico →".

También agregar entry point desde `VetActionsHeader` en la ficha de otro paciente (para cuando llega un nuevo caso sin salir).

**Archivos**: `src/components/provider/NewPatientForm.tsx`, `VetActionsHeader.tsx`.
**Riesgo**: bajo.

---

## B.6. Profesionalizar copy clínico

**Por qué**: el contexto vet necesita tonalidad profesional. Hoy tiene copy infantil.

**Cambios** (solo string replacements, sin lógica):
- "Nota rápida" → **"Registrar nota"**
- "Resumen IA" → **"Resumen automático"**
- "Mascotas pendientes de reclamar" → **"En espera de confirmación del propietario"**
- "Solicitudes pendientes" → **"Vinculaciones por confirmar"**
- "Grabar consulta" → se mantiene, es claro
- Otros copys juguetones en provider/ — revisar si aparecen y adaptar

**Archivos**: varios en `src/components/provider/`, `src/pages/ProviderPatients.tsx`.
**Riesgo**: muy bajo.

---

## B.7. Provider BottomTabBar

Sin cambios. Dashboard · Pacientes · Reservas · Mensajes (flag) · Perfil está bien.

---

# Bloque C — COMPARTIDO (infraestructura que afecta a ambos)

## C.1. Telemetría — mapear rutas viejas a tabs

**Por qué**: [src/lib/analytics.ts:194](src/lib/analytics.ts) trackea `url: window.location.pathname` en cada evento. Si `/reminders` se vuelve `/calendario?tab=recordatorios`, las métricas históricas se fragmentan.

**Cambio**: en el wrapper de `track()`, normalizar pathname:
```ts
// pseudocódigo
const normalizePath = (p) => {
  if (p === '/reminders') return '/calendario#recordatorios';
  if (p === '/mis-reservas') return '/calendario#reservas';
  if (p === '/rutinas') return '/calendario#rutinas';
  return p;
};
```
Así los eventos históricos y los nuevos quedan en el mismo bucket lógico.

**Archivos**: `src/lib/analytics.ts`.
**Riesgo**: bajo.

---

## C.2. Deep links en edge functions / emails

**Por qué**: algunos emails/pushes pueden tener `/reminders` o `/mis-reservas` hardcodeado. Si `/reminders` sigue vivo como alias (A.9), no se rompe. Si en el futuro se elimina, sí.

**Cambio**: grep en `supabase/functions/**/*.ts` buscando `/reminders`, `/mis-reservas`, `/rutinas`, `/mascota/`. Si hay, migrar a helpers equivalentes o a URLs absolutas a `/calendario?tab=X`.

**Archivos**: varias edge functions según resultados del grep.
**Riesgo**: bajo.

---

## C.3. Tests E2E owner + vet

- Actualizar navegación a rutas viejas (A.9 aliases siguen vivos, debería pasar).
- Agregar test nuevo: "BottomTabBar tiene 5 tabs correctos en owner" y "Agenda abre calendario con tab Hoy".
- Agregar test: "Ficha vet tiene 1 sola barra de acciones" (regresión de B.2).

**Archivos**: `e2e/*.spec.ts`.
**Riesgo**: bajo.

---

# Tabla priorizada cruzada (orden de ejecución)

| # | Fase | Cambio | Rol | Valor | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|
| 1 | A.1.1 | LINKS helpers + reemplazar hardcodes | Owner | Plomería | Muy bajo | 20 min |
| 2 | A.1.2 | Actualizar tests E2E afectados | Ambos | Plomería | Bajo | 15 min |
| 3 | A.9 | Legacy redirects (timeline, rutinas, services/vets) | Owner | Medio | Muy bajo | 15 min |
| 4 | B.6 | Profesionalizar copy clínico | Vet | Medio | Muy bajo | 15 min |
| 5 | A.2 | Premium visible con candado en Home | Owner | Alto | Bajo | 30 min |
| 6 | A.5 | CTA "Ver ficha" en PawCardBack | Owner | Medio | Bajo | 20 min |
| 7 | B.3 | "Ver cómo me ven" en ProviderDashboard | Vet | Alto | Bajo | 30 min |
| 8 | B.4 | Solicitudes vinculación como Alert + KPI + bulk | Vet | Alto | Bajo-medio | 45 min |
| 9 | A.3 | Refactor UnifiedCalendar a shadcn Tabs (4 vistas) | Owner | Muy alto | Medio | 2-3 h |
| 10 | A.4 | Hub `/servicios` + toggle lista/mapa | Owner | Alto | Medio | 2 h |
| 11 | B.5 | NewPatientForm modo rápido | Vet | Alto | Bajo | 45 min |
| 12 | B.2 | Consolidar CTAs ficha vet (sacar VetActionsBar) | Vet | Muy alto | Medio | 1 h |
| 13 | A.6 | Drawer móvil "Explorar" validado | Owner | Alto | Bajo-medio | 45 min |
| 14 | A.7 | Nuevo BottomTabBar owner (Servicios + Agenda) | Owner | Alto | Medio | 45 min |
| 15 | A.8 | Home en 3 franjas con jerarquía | Owner | Muy alto | Medio-alto | 3 h |
| 16 | C.1 | Telemetría normalizePath | Ambos | Bajo | Bajo | 15 min |
| 17 | C.2 | Deep links edge functions | Ambos | Bajo | Bajo | 20 min |
| 18 | C.3 | Tests E2E regresión (post-todo) | Ambos | Medio | Bajo | 30 min |

**Orden justificado**: plomería → quick wins → consolidaciones → rediseño visual. Los pasos 1-4 son bajísimo riesgo y destraban todo. Los 5-8 son wins visibles individuales. Los 9-15 son el core del rediseño. Los 16-18 cierran la caja.

---

## Lo que NO hago

- Ficha clínica internamente (solo barras de acciones B.2 y tab Documentos).
- Flow.cl, pricing, auth, onboarding, RoleGuard.
- Edge functions internas (solo grep para deep links).
- Migraciones SQL, Supabase.
- Admin panel.
- Features nuevas.
- Toco Paw Cards flip animation (solo agrego botón en reverso).

---

## Defaults que aplico si no respondés decisiones

| Decisión | Default |
|---|---|
| Tab name para Recordar | **"Agenda"** (icono CalendarDays, badge conserva cálculo actual) |
| `/maps` futuro | Redirect a `/servicios?view=maps`; toggle dentro de listados |
| Aliases legacy (`/reminders`, `/mis-reservas`, `/rutinas`) | **Mantener vivos** en paralelo |
| PawPoints en Home | **Chip** al lado del pet switcher |
| Admin | Fuera de scope |
| Orden de ejecución | **Según tabla** (18 pasos, commits separados) |
| Commits | **Uno por paso**, typecheck+lint+vitest+build+playwright entre cada uno |

---

## Plan de verificación (igual para cada commit)

1. `npx tsc -b` — 0 errores
2. `npm run lint` — sin errores nuevos
3. `npm run test:ci` — 334+ tests verdes
4. `npm run build` — pasa
5. `npx playwright test` — verde (ajustando tests afectados)
6. Smoke manual en `npm run dev` de la feature tocada

Si alguno falla, paro y consulto antes de seguir.

---

**Contestá "dale" y arranco por el paso 1 (A.1.1 LINKS helpers). Voy a hacer los 18 pasos en orden, con commit separado por cada uno, y corriendo la verificación entre cada commit. Si algo se complica, paro y te consulto.**
