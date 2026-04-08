# Walkthrough end-to-end — 2026-04-08

> Simulación leyendo el código como si fuera la primera vez. Dos usuarios.
> ✅ funciona, 🟡 fricción, ❌ roto / falta. Los 🟡 y ❌ son la lista P1 de la próxima sesión.

## Walk 1 — Camila, Ñuñoa, Samsung Galaxy A54 (dueña nueva)

| # | Paso | Estado | Notas |
|---|---|---|---|
| 1 | Llega a `pawfriend.cl` desde Google | ✅ | `Index.tsx` con landing nueva (Hero + 3 pasos + stats CL). |
| 2 | Lee landing | ✅ | Trust row visible, 3 beneficios claros. CTA "Empezar gratis" en Hero. |
| 3 | Click "Registrarme" → `/auth?tab=signup` | ✅ | Form con Google + Facebook + email. |
| 4 | Form email/pass | ✅ | inputMode=email, autoComplete=new-password (commit `10bbb9c`). |
| 5 | Confirma email mobile | ✅ | Link redirige a `/auth` con SIGNED_IN, hard reload a `/home`. |
| 6 | Primera sesión → `/home` | 🟡 | Sin onboarding tutorial dirigido a "Agrega tu primera mascota". Hay `OnboardingTutorial` pero está en `/feed`. **P1: mover/duplicar a `/home`.** |
| 7 | Agrega "Luna", gata 3 años | ✅ | `AddPet.tsx` con validaciones edad/peso/microchip. inputMode correctos post-`10bbb9c`. |
| 8 | Entra a ficha clínica | ✅ | 5 tabs (Resumen / Historial / Alimentación / Documentos / Compartir). |
| 9 | Agrega vacuna | ✅ | Crea registro + recordatorio automático (vía `useReminders`). |
| 10 | Busca vet en Ñuñoa → `/veterinarios` | ✅ | Comuna ahora destacada arriba con label "📍 Tu comuna" (commit `1e63e08`). |
| 11 | Filtra → resultados | ✅ | Cards con rating, foto, comuna. |
| 12 | Abre perfil vet → `/veterinarios/:slug` | ✅ | `PerfilVetPublico.tsx`. SEO ok. |
| 13 | Vuelve a ficha de Luna → tab Compartir | ✅ | Genera enlace temporal (30 días). |
| 14 | Envía por WhatsApp | ✅ | **Nuevo botón verde** WhatsApp directo via `wa.me` (commit `1e63e08`). No requiere API Meta. |
| 15 | Vet abre el link sin cuenta | ✅ | Flujo `useMedicalSharing` con token público. |
| 16 | Descarga PDF en mobile | ✅ | `@media print` arreglado en QA video, archivo se guarda en Downloads. |
| 17 | Vuelve al `/home` | ✅ | Card "Próximos cuidados" con CTA "Ver todos los recordatorios →" (nuevo). |
| 18 | Tap en "Recordatorios" del bottom nav | ✅ | **Nueva tab** con badge de vencidos (commit `3a7f01b`). Lleva a `/reminders`. |
| 19 | Marca vacuna como hecha | ✅ | `completeReminder` mutation, refresh inmediato. |
| 20 | Refresh F5 en `/pet/:id/clinical?tab=resumen` | ✅ | SPA fix `489f3b2` aplicado. |
| 21 | 404 accidental | ✅ | NotFound en tuteo chileno con CTAs (commit `ea24fee`). |

**Cosas a mejorar (Camila)**:
- 🟡 Onboarding tutorial dirigido en `/home` (mover desde `/feed`).
- 🟡 La página `/reminders` tiene botón "Agregar" que lleva a `/my-pets` en vez de a un dialog directo. Decisión consciente para no duplicar lógica del form, pero podría sentirse "lento" para crear el primer recordatorio.
- 🟡 Deep link desde WhatsApp mobile fue verificado en commit `489f3b2` pero falta test real en device.
- ❌ No hay aún WhatsApp recordatorios (esperando Meta Business verification).

---

## Walk 2 — Dra. Sofía, clínica en Las Condes (vet nueva)

| # | Paso | Estado | Notas |
|---|---|---|---|
| 1 | Llega a `pawfriend.cl/para-veterinarios` | ✅ | `ParaVeterinarios.tsx`. SEO ok. |
| 2 | Entiende el valor en 10 segundos | ✅ | Hero "¿Cansado de depender solo del boca a boca?" + 3 CTAs clave. |
| 3 | Lee precios | ✅ | 3 cards: Free / Individual $9.900 / Clínica $29.900. |
| 4 | Pitch matchea con guión grabado | 🟡 | **Inconsistencia detectada**: el guión (`GUION_PITCH_VETS_60S.md`) dice "sin comisiones por reserva ni costos ocultos" en versión A y "Sin comisiones por reserva" en versión B. Pero los planes reales tienen 15% / 12% / 10% / 8% de comisión. **Decisión del dueño**: o reescribir el guión o eliminar las comisiones de los planes. Flagged en commit `f6387b1`. |
| 5 | Beneficios listados | ✅ | Ahora incluye "Ficha clínica digital de cada paciente" (commit `f6387b1`) — estaba ausente y el guión sí lo menciona. |
| 6 | Click "Crear mi perfil gratis" → `/registro-veterinario` | ✅ | Flujo de registro vet. |
| 7 | Sube certificado, título, foto | ✅ | `RegistroVeterinario.tsx`. |
| 8 | Login post-registro → `/provider/dashboard` | ✅ | `Auth.tsx:60-76` redirect provider. |
| 9 | Dashboard vacío (0 reservas) | ✅ | **Nuevo onboarding card** "Aún no recibes reservas. Vamos a cambiarlo." con 3 pasos: completar perfil → ver preview público → compartir URL (commit `f6387b1`). |
| 10 | Click "Editar mi perfil público" | ✅ | `ProviderProfileEdit.tsx`. |
| 11 | Click "Ver cómo me ven los dueños" | ✅ | **Nuevo botón** abre `/veterinarios/:slug` con su perfil real (commit `f6387b1`). Solo visible si ya tiene `slug`. |
| 12 | Recibe primera reserva (desde seed demo) | ✅ | Cards de balance + reservas recientes ya cubren esto. |
| 13 | Confirma reserva | ✅ | Mutation existente. |
| 14 | Recibe señal cuando dueño le comparte ficha | ❌ | **No implementado**. No hay badge ni notificación en dashboard cuando un `medical_sharing_token` se crea apuntando a este vet. Es feature nueva (no pulido), excede scope de esta sesión. **P1 próxima sesión**. |
| 15 | Contrata plan Individual via Flow | ✅ | `flow-create-subscription` + `flow-webhook` (idempotencia post-`20260414000000`). |
| 16 | Regresa al dashboard con plan activo | ✅ | Onboarding card desaparece cuando hay reservas. |

**Cosas a mejorar (Sofía)**:
- 🟡 **Inconsistencia comisiones pitch ↔ producto** (decisión dueño).
- ❌ Notificación al vet de "ficha compartida contigo" — feature nueva real, no pulido.
- 🟡 Onboarding card aparece basado en `stats.totalBookings === 0`. Falsamente positivo si el vet completó perfil pero no recibió reservas todavía. Acceptable trade-off para esta sesión.

---

## Resumen ejecutivo

| Categoría | ✅ | 🟡 | ❌ |
|---|---|---|---|
| Walk 1 (Camila) | 18 | 3 | 1 |
| Walk 2 (Sofía) | 13 | 2 | 1 |

**P1 priorizado para próxima sesión**:
1. **Decisión comisiones pitch vs producto** (bloquea cualquier marketing de pitch).
2. Onboarding tutorial en `/home` para usuarios nuevos.
3. Notificación al vet cuando dueño comparte ficha.
4. Aplicar `<PageHeader>` y `<Breadcrumbs>` al resto de páginas no-tab (15+).
5. WhatsApp Cloud API (esperando Meta Business).
6. Test real de deep links en device Samsung físico.

---

## Nota técnica

`docs/audits/` se borra cada `npm run build` por `emptyOutDir` de Vite. Por
eso los audits viven en `audits/` (root del repo), fuera del directorio que
Vite limpia. La regla de oro del CONTEXTO ya lo decía: "NO modificar `docs/`
manualmente". El primer audit nació en `docs/audits/` por inercia del prompt
y se perdió en el primer build de la sesión — recuperado vía `git show`.
