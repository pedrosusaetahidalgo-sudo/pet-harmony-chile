# Consolidado QA — Paw Friend 2026-04-15

> Fuentes: (1) Auditoría UX estática 2026-04-14, (2) Console log producción 15/04, (3) Feedback QA Pedro 15/04
> Estado: PARCIALMENTE EJECUTADO — bugs críticos frontend ya arreglados, pendientes backend/diseño

---

## Resumen ejecutivo

| Prioridad | Total | Arreglados hoy | Pendientes | Tipo principal |
|---|---|---|---|---|
| P0 — Blocker | 6 | 3 | 3 | Backend (migraciones/edge fns) |
| P1 — Alto | 12 | 0 | 12 | UX + backend |
| P2 — Medio | 18 | 0 | 18 | UX + diseño |
| P3 — Bajo | 15+ | 0 | 15+ | Pulido, dead code |

---

## P0 — BLOCKERS (roto en producción)

### P0-1. [ARREGLADO] Logout redirige a /auth en vez de landing
- **Fuente:** Feedback QA Pedro §13
- **Archivos:** `ProfileSettingsList.tsx:49`, `AppSidebar.tsx:171`
- **Fix aplicado:** `navigate('/')` en vez de `navigate(LINKS.auth())`

### P0-2. [ARREGLADO] `user_roles` query con user_id vacío → 400
- **Fuente:** Console log
- **Archivo:** `ProfessionalBadges.tsx:14-17`
- **Fix aplicado:** Guard `enabled: !!userId` + null check en queryFn

### P0-3. [ARREGLADO] Vacunas sin botón "agregar" en estado vacío
- **Fuente:** Feedback QA Pedro §3
- **Archivo:** `TabVacunas.tsx:75-83`, `shared.tsx:149` (EmptyState ahora acepta `action`)
- **Fix aplicado:** Botón "Registrar vacuna" en empty state + mismo pattern en TabHistorial

### P0-4. [PENDIENTE — BACKEND] `generate-medical-summary` edge function 500
- **Fuente:** Console log
- **Impacto:** JOYA DE LA CORONA — PDF de ficha clínica no se genera
- **Causa probable:** Error en la edge function (API key expirada, schema mismatch, o Deno runtime)
- **Acción:** Revisar logs en Supabase Dashboard > Edge Functions > generate-medical-summary

### P0-5. [PENDIENTE — BACKEND] `admin_access` query 500
- **Fuente:** Console log
- **Impacto:** Cada page load ejecuta este query → 500 en la consola
- **Causa probable:** RLS recursión infinita (la policy "Super admin full access" consulta la misma tabla)
- **Acción:** Revisar RLS policy en Supabase: simplificar a `auth.uid() = user_id` sin sub-select

### P0-6. [PENDIENTE — BACKEND] GitHub Pages SPA routing → 404 en refresh
- **Fuente:** Console log — `GET /auth 404`, `GET /home 404`
- **Impacto:** Google OAuth callback falla en el redirect → usuario ve 404 antes del fallback `/?/auth`
- **Causa:** GitHub Pages no soporta SPA routing nativo; el 404.html redirect agrega `?/` pero causa flash
- **Acción:** Verificar que `docs/404.html` tiene el redirect script correcto; considerar custom domain con Cloudflare

---

## P1 — ALTO (afecta flujos importantes)

### P1-1. [PENDIENTE — BACKEND] 8 queries Supabase retornando 400/404 en prod

Tablas/RPCs que fallan en producción:

| Endpoint | Error | Causa probable | Hook/Archivo |
|---|---|---|---|
| `posts` (con joins profiles/pets) | 400 | RLS policy o FK alias incorrecto | `useFeedPosts.ts:40` |
| `pet_stories` | 404 | Tabla no aplicada en prod | `usePetStories.ts:52` |
| `get_paw_card_ranking` RPC | 404 | RPC nunca creada en migraciones | `usePawCardRanking.ts:25` |
| `paw_missions` | 400 | RLS policy no aplicada | `useMissions.ts:40` |
| `award_points_atomic` RPC | 400 | Params o tabla auxiliar faltante | `points.ts:106` |
| `pet_vet_links` (con joins) | 400 | FK name mismatch en join | `usePetVetLinks.ts:52` |
| `vet_clinical_notes` (followup) | 400 | Join a service_providers incorrecto | `useVetClinicalNotes.ts:57` |
| `order_items` (con pets/orders) | 400 | `pets` relationship no existe (es `pet_ids UUID[]`) | `useUnifiedCalendar.ts:114` |

**Acción:** Crear migración con las tablas/RPCs faltantes + revisar RLS. Agregar fallbacks graceful en los hooks.

### P1-2. MedicalShare: Botón "Descargar PDF" apunta a ruta inexistente
- **Fuente:** Auditoría C1
- **Archivo:** `MedicalShare.tsx:349-358`
- **Impacto:** Ficha compartida no puede descargar PDF → joya de la corona rota para receptores
- **Acción:** Invocar `generate-medical-summary` edge function (cuando P0-4 esté arreglado)

### P1-3. MyBookings: Muestra todos los slots del sistema, no las reservas del usuario
- **Fuente:** Auditoría C2
- **Archivo:** `MyBookings.tsx:31-85`
- **Acción:** Agregar query a `bookings` filtrada por `user_id`

### P1-4. RoleGuard race condition: providers rebotados a /home al entrar
- **Fuente:** Auditoría H1
- **Archivos:** `RoleGuard.tsx:46`, `useActiveRole.tsx:29`
- **Acción:** Exponer `isProviderLoading` y agregar guard de carga

### P1-5. Auth: No existe UI para cambio de contraseña post-reset
- **Fuente:** Auditoría H2
- **Archivo:** `Auth.tsx:293`
- **Acción:** Detectar `type=recovery` en URL y mostrar form de nueva contraseña

### P1-6. Ficha sincronizada en toda la app
- **Fuente:** Feedback QA Pedro §1
- **Impacto:** Cambios en ficha médica deben reflejarse en rutinas, servicios, etc.
- **Acción:** Auditar query keys de react-query para invalidación cruzada

### P1-7. Doble versión PDF: médica pura + completa (rutinas + paseos)
- **Fuente:** Feedback QA Pedro §1
- **Impacto:** Usuarios quieren exportar todo, no solo lo médico
- **Acción:** Extender `generate-medical-summary` o crear segunda edge function

### P1-8. Cerrar sesión → bug flujo (ya arreglado, verificar en prod)
- **Fuente:** Feedback QA Pedro §13
- **Estado:** Fix aplicado localmente, pendiente build + deploy

### P1-9. Calendario: formato muy básico, sin CTA en estado vacío
- **Fuente:** Feedback QA Pedro §6
- **Archivo:** `UnifiedCalendar.tsx`
- **Acción:** Rediseñar vista calendario; agregar CTA "Agregar cita" en empty state; conectar con rutinas/servicios

### P1-10. Reportes redundantes para owner
- **Fuente:** Feedback QA Pedro §6
- **Acción:** Evaluar mover sección "Reportes" a vista vet-only o hacer toggle

### P1-11. Feed/Mensajes: tabs confusas para vet nuevo
- **Fuente:** Feedback QA Pedro §9
- **Acción:** Comprimir "Mensajes" y "Conversaciones" en una sola pestaña

### P1-12. Message requests para no-followers (estilo Instagram)
- **Fuente:** Feedback QA Pedro §9
- **Acción:** Implementar solicitud de mensaje con notificación al destinatario

---

## P2 — MEDIO (UX + diseño)

### P2-1. Rutinas: rediseño visual
- **Fuente:** Feedback QA Pedro §5
- **Cambios pedidos:**
  - Parecerse más a un calendario
  - Tipos de rutina en misma línea (vista compacta)
  - Formato de horas revisado
  - Categorías: diarias, semanales, mensuales, anuales

### P2-2. Misiones: sección aparte con gamificación agrupada
- **Fuente:** Feedback QA Pedro §11
- **Cambios pedidos:**
  - Sección en sidebar o popup: misiones + coleccionables + logros
  - Base grande de misiones diarias/semanales/mensuales/anuales
  - "Historia del Guardián" (logros del usuario)
  - Ranking visible para todos
  - ~12 tipos de insignias en perfil

### P2-3. Mis Mascotas: reorganización
- **Fuente:** Feedback QA Pedro §10
- **Cambios pedidos:**
  - Banco de sangre desplegable con todos los tipos
  - Memorial más visible (subir en la jerarquía)
  - Sacar bloque "Peludos" de esta vista
  - Parte médica: evaluar moverla

### P2-4. Hábitos: sección incompleta
- **Fuente:** Feedback QA Pedro §4
- **Estado:** No existe TabHabitos en PetClinicalRecord; la funcionalidad es limitada
- **Acción:** Diseñar e implementar sección de hábitos con add/share/recordatorio

### P2-5. Maps: coordenadas aleatorias para adopción
- **Fuente:** Auditoría C3
- **Archivo:** `Maps.tsx:358-361`
- **Acción:** Geocodificar dirección real o no mostrar adopción en mapa

### P2-6. Maps: lugares pet-friendly hardcodeados
- **Fuente:** Auditoría C4
- **Archivo:** `Maps.tsx:217-311`
- **Acción:** Migrar a tabla DB o mostrar badge "Datos preliminares"

### P2-7. PerfilVetPublico: reserva silenciosamente usa pets[0]
- **Fuente:** Auditoría H3
- **Acción:** Agregar selector de mascota en modal de reserva

### P2-8. PerfilVetPublico: Chat ?user= param ignorado
- **Fuente:** Auditoría H4
- **Acción:** Manejar `?user=` en Chat.tsx para auto-abrir conversación

### P2-9. UserProfile: seguidores/siguiendo siempre 0
- **Fuente:** Auditoría H5
- **Acción:** Agregar `followers_count, following_count` al select

### P2-10. OnboardingDuenoMinimal: intereses nunca se guardan
- **Fuente:** Auditoría H7
- **Acción:** Incluir `selectedInterests` en el insert

### P2-11. RegistroVeterinario: Badge "3 meses para empezar" falso
- **Fuente:** Auditoría H9
- **Acción:** Cambiar a "Plan Gratis" o reflejar plan real

### P2-12. BookingModal: Marca pagos como "paid" sin cobrar
- **Fuente:** Auditoría H10
- **Acción:** Cambiar a status "pending" hasta confirmación real

### P2-13. Feedback módulo: hacerlo completamente funcional
- **Fuente:** Feedback QA Pedro §12
- **Acción:** Que lleguen todos los tipos de feedback al admin, ampliar tipos

### P2-14. Landing: rediseñar gráficas con assets de marca
- **Fuente:** Feedback QA Pedro §13

### P2-15. Servicios: confirmar auto-aprobación
- **Fuente:** Feedback QA Pedro §8
- **Acción:** Verificar que solicitudes de paseadores se auto-aprueben correctamente

### P2-16. PreciosVeterinarios: doble header para logueados
- **Fuente:** Auditoría H13
- **Acción:** Condicionar `{!user && <PublicHeader />}`

### P2-17. Colección "me gusta" sincronizada con puntos
- **Fuente:** Feedback QA Pedro §9

### P2-18. Configuración: verificar todos los botones y redirecciones
- **Fuente:** Feedback QA Pedro §13
- **Acción:** QA manual de cada botón en settings

---

## P3 — BAJO (pulido, dead code, nice-to-have)

| # | Issue | Fuente |
|---|---|---|
| 1 | Auth: `redirectUser` 54 líneas de código muerto | Auditoría M1 |
| 2 | DirectorioVets: link a precios no pasa comuna | Auditoría M2 |
| 3 | PerfilVetPublico: card "Crear cuenta" visible para logueados | Auditoría M3 |
| 4 | ParaVeterinarios: WhatsApp listado como feature activa | Auditoría M4 |
| 5 | TermsOfService/PrivacyPolicy: fecha dinámica (siempre "hoy") | Auditoría M6 |
| 6 | PawCardLanding: rareza siempre base (`getRarity(0)`) | Auditoría M8 |
| 7 | PetClinicalRecord: dos botones PDF sin distinción visual | Auditoría M9 |
| 8 | Reportes: `markViewed` no refresca query | Auditoría M11 |
| 9 | ChatConversation: `onKeyPress` deprecated | Auditoría M13 |
| 10 | Reminders: "Agregar" navega a /my-pets | Auditoría M15 |
| 11 | EnMemoria: sin PageHeader/back navigation | Auditoría M17 |
| 12 | PawShopRewards: "Revisa tu email" sin enviar email | Auditoría M19 |
| 13 | ProviderProfileEdit: avatar obligatorio bloquea save | Auditoría M20 |
| 14 | NotFound: botón "My Paws" en inglés | Auditoría L6 |
| 15 | 20+ dead imports en varios archivos | Auditoría L1-L35 |

---

## Acciones inmediatas recomendadas

### Hoy (ya ejecutado)
- [x] Fix logout redirect → `/` (ProfileSettingsList + AppSidebar)
- [x] Fix ProfessionalBadges null check (`enabled: !!userId`)
- [x] Fix TabVacunas + TabHistorial empty state con botón acción
- [x] EmptyState component acepta `action` prop

### Esta semana — Backend (requiere Supabase Dashboard)
1. Revisar logs de `generate-medical-summary` edge function (P0-4)
2. Fix RLS policy de `admin_access` — eliminar recursión (P0-5)
3. Aplicar migraciones pendientes en prod: `pet_stories`, `paw_missions` RLS
4. Crear RPC `get_paw_card_ranking` (o confirmar que fallback es suficiente)
5. Fix joins rotos: `pet_vet_links`, `vet_clinical_notes`, `order_items`

### Sprint siguiente — UX/Diseño
1. Rediseño calendario (P1-9)
2. Rediseño rutinas tipo calendario (P2-1)
3. Sección gamificación agrupada (P2-2)
4. Doble PDF: médica + completa (P1-7)
5. Message requests (P1-12)
6. Reorganización Mis Mascotas (P2-3)

---

## Notas del QA de Pedro

### Lo que gusta y funciona bien
- Medicamentos + IA: "preguntar a la IA" funciona, diseño suficiente
- Rutinas (concepto): gusta la sección, solo necesita rediseño visual
- Buscar veterinario: funciona y gusta (100% para conectar con vets)
- Banco de sangre: gusta el concepto
- Misiones/Gamificación: gusta, solo necesita reorganización
- Configuración: se comprimió bien
- Landing: gusta

### Idioma
- Revisar textos, dejar todo en español (Chile) — alineado con CLAUDE.md §9.5

### Open questions del audio
- "¿Hay un evento específico para el dueño?" → pendiente clarificar
- "Misionéricos" → probablemente misiones del owner → generar base grande de misiones
