# CLAUDE_AUDIT_MASTER.md — Tabla Maestra de Auditoria — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

Esta tabla es la fuente de verdad consolidada de todos los hallazgos de auditoria. Cada item tiene estado, prioridad, archivo, y accion recomendada.

---

## P0 — Bugs criticos que bloquean seguridad

| ID | Descripcion | Archivo | Estado | Accion |
|---|---|---|---|---|
| P0-1 | `//evil.com` open redirect bypass — regex solo bloqueaba `http://evil` pero no `//evil.com` que los browsers tratan como URL relativa al protocolo | `src/lib/` o edge fn de auth | FIX APLICADO en sesion 2026-04-14 — usar regex `/^\/[^\/]/` | Verificar en todos los flujos de redirect post-login |
| P0-2 | `log-error` auth check tiene flaw logico — `includes(supabaseAnonKey)` permite bypass pasando la anon key como parte de otro header | `supabase/functions/log-error/` | PENDIENTE | Reescribir auth check: verificar JWT con `verify_jwt` o comparar header completo con igualdad estricta |

---

## P1 — Mejoras importantes con impacto real en usuarios

| ID | Descripcion | Archivo | Estado | Accion |
|---|---|---|---|---|
| P1-1 | `Home.tsx` no usa React Query — todo con raw useState + useEffect | `src/pages/Home.tsx` | PENDIENTE | Etapa 3 del refactor plan: migrar a useQuery por seccion |
| P1-2 | No existe `useCurrentUserProfile` hook — el perfil del usuario se fetchea de forma independiente en Header, Home, AppSidebar y Profile | (sin archivo) | PENDIENTE | Crear hook centralizado con staleTime 5min, compartido via React Query cache |
| P1-3 | `supabase as any` en 4 archivos — tipos desactualizados | `ProviderPatients.tsx`, `QRLanding.tsx`, `Reportes.tsx`, `ServiceDirectory.tsx` | PENDIENTE | `npx supabase gen types typescript` y actualizar imports |
| P1-4 | `lastVetVisit` nunca conectado en Home.tsx — se define pero no se muestra | `src/pages/Home.tsx` | PENDIENTE | Wiring de la query al componente HomeStatCard correspondiente |
| P1-5 | `appointments` query en Home.tsx sin filtro explicito de `user_id` — depende 100% de RLS | `src/pages/Home.tsx` | PENDIENTE — VERIFICAR | Confirmar politica RLS en tabla appointments. Si RLS filtra por auth.uid(), es seguro; si no, agregar `.eq('user_id', user.id)` |

---

## P2 — Deuda tecnica y mejoras de calidad

| ID | Descripcion | Archivo | Estado | Accion |
|---|---|---|---|---|
| P2-1 | `MyPets.tsx` — backfill de `paw_card_id` usa for-of secuencial | `src/pages/MyPets.tsx` | PENDIENTE | Reemplazar con `Promise.all()` para requests en paralelo |
| P2-2 | `MyBookings.tsx` — waterfall anidado: primero busca providers, luego sus perfiles, todo dentro de queryFn | `src/pages/MyBookings.tsx` | PENDIENTE | Refactorizar con Promise.all o query separada con join |
| P2-3 | `MissionCard` duplicado — existe en raiz de components/ y en components/pawgame/ | Ambos archivos | PENDIENTE | Eliminar el de la raiz, usar solo `pawgame/MissionCard` |
| P2-4 | `useServiceProviders` aun hace `select *` | `src/hooks/useServiceProviders.ts` | PENDIENTE | Especificar columnas necesarias |
| P2-5 | `PetClinicalRecord/index.tsx` — acceso vet verificado via useEffect en lugar de React Query | `src/pages/PetClinicalRecord/index.tsx` | PENDIENTE | Migrar a useQuery con enabled condicional |
| P2-6 | `Header.tsx` — fetch de perfil de usuario fuera de React Query, sin cache | `src/components/Header.tsx` | PENDIENTE | Usar `useCurrentUserProfile` cuando se cree |

---

## SOLUCIONADO en sesiones anteriores — referencia historica

| Item | Descripcion | Commit aprox. |
|---|---|---|
| /panel-pro RoleGuard eliminado | No correspondia — ProDashboard maneja ambos roles internamente | Sesion 2026-04-14 |
| 22 dead components eliminados | 16 + 6 nuevos: PageSkeleton, FeatureCard, TrustBadge, EnhancedReviewCard, CreateReviewForm, LostPetsMap + 16 anteriores | Sesion 2026-04-14 |
| EmptyState consolidado | Un solo componente en lugar de variantes duplicadas | Sesion 2026-04-14 |
| Copy "My Paws" -> "Mis Mascotas" | 5 archivos actualizados | Sesion 2026-04-14 |
| Copy "Recordar" -> "Avisos" | Alineado con BottomTabBar | Sesion 2026-04-14 |
| CORS wildcard bereavement-assistant | Fijado | Sesion anterior |
| CORS wildcard log-error | Fijado | Sesion anterior |
| log-error auth agregada | Auth check presente aunque con flaw | Sesion anterior |
| Open redirect basico | Fix aplicado | Sesion anterior |
| Recharts en manualChunks | Chunk independiente | Sesion 2026-04-14 |
| Promise.all en useFollows | Requests en paralelo | Sesion 2026-04-14 |
| select columnas en Home | Reducido trafico en queries principales | Sesion 2026-04-14 |
| staleTime en useServiceProviders | Cache de 5min para lista de proveedores | Sesion 2026-04-14 |

---

## Dead hooks — ninguno activo

Auditoria de 66 hooks: **todos activos**. No existen hooks muertos en el proyecto actualmente.

---

## Dead components eliminados en sesion 2026-04-14

Los siguientes 6 componentes fueron eliminados (ademas de los 16 anteriores):

1. `PageSkeleton` — reemplazado por skeleton inline
2. `FeatureCard` — sin uso
3. `TrustBadge` — sin uso
4. `EnhancedReviewCard` — sin uso
5. `CreateReviewForm` — sin uso
6. `LostPetsMap` — sin uso (feature no lanzada)

Total eliminados: 22 componentes muertos.

---

## Mock data — estado actual

| Ubicacion | Datos mock | Aceptable |
|---|---|---|
| `AnalyticsDashboard.tsx` | Si — datos ficticios de ejemplo | Si — es admin-only, standalone demo |
| Resto del proyecto | No — datos reales de Supabase | — |

---

## Paginas sobredimensionadas — mas de 600 lineas

| Archivo | Lineas aprox. | Problema principal |
|---|---|---|
| `AddPet.tsx` | ~1100 | Formulario monolitico |
| `RegistroPartner.tsx` | ~850 | Formulario monolitico |
| `ProDashboard.tsx` | ~820 | Sin separacion de concerns |
| `Home.tsx` | ~785 | raw useState + waterfall |
| `Auth.tsx` | ~650 | Logica de auth + UI mezcladas |
| `ProviderPatients.tsx` | ~600 | Listado + operaciones inline |
| `RegistroVeterinario.tsx` | ~600 | Formulario monolitico |

**Recomendacion**: Estas paginas no requieren refactor urgente, pero al tocarlas extraer sub-componentes y hooks propios.

---

## Discrepancias de pricing — CLAUDE.md vs codigo

| Campo | CLAUDE.md | `src/lib/plans.ts` — autoridad | Accion |
|---|---|---|---|
| provider_free max clientes | 20 | 15 | Actualizar CLAUDE.md |
| provider_individual comision | 12% | 10% | Actualizar CLAUDE.md |

---

## Feature flag inconsistencias

| Flag | Valor | Impacto |
|---|---|---|
| USER_PREMIUM=false | Las rutas /upgrade existen pero no hay gate real | Los usuarios pueden acceder a features premium sin pagar. Cambiar a true cuando la monetizacion este lista para activarse. |

---

## Nuevas features implementadas — sesion 2026-04-14

| Feature | Hook principal | Migracion | UI |
|---|---|---|---|
| vet_quick_notes | `useVetQuickNotes` | `20260515_vet_quick_notes.sql` | Integrado en ProviderPatients |
| feedback_in_app | `useFeedback` | `20260515_feedback_in_app.sql` | FeedbackDialog component |
| core_action_missions | `useMissions` actualizado | data-only (sin tabla nueva) | Missions.tsx actualizado |

Las 3 migraciones nuevas tienen RLS correcta (verificado por agente de seguridad).
