# Paw Friend — Pending (por ejecutar)

> **Propósito:** staging de MDs accionables que aún **no** se han ejecutado (total o parcialmente).
> **Qué NO vive aquí:** docs vivas ([CLAUDE.md](../CLAUDE.md), [INDEX.md](../INDEX.md), [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md), [AGENTS.md](../AGENTS.md), [diagrams/](../diagrams/)), auditorías ([audits/](../audits/)), archivados ([_archive/](../_archive/)).
> **Última actualización:** 2026-04-24

---

## Refactor Maestro 2026-04-23 (en ejecución)

Plan multifase aprobado y en ejecución activa. Documentos vivos:

| Doc | Propósito |
|---|---|
| [docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md](../docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md) | Plan completo (2.438 líneas, 3 fases). FUENTE DE VERDAD. |
| [docs-raiz/planes/REFACTOR_ADOPCION_2026_04_24.md](../docs-raiz/planes/REFACTOR_ADOPCION_2026_04_24.md) | Sub-plan A+B+C+D+E flujo adopción (Bloques 1+2). |
| [MANUAL_ACTIONS_PENDING_FASE_0.md](MANUAL_ACTIONS_PENDING_FASE_0.md) | Checklist de Pedro: 4 SQLs nuevas, deploys, flips de flags. |
| [LEGACY_CLEANUP_AUDIT_2026_04_24.md](LEGACY_CLEANUP_AUDIT_2026_04_24.md) | Componentes legacy a eliminar tras 2-4 semanas con flags activos. Revisar 2026-05-15. |
| [HIDDEN_FEATURES_REVIEW_2026_11_23.md](HIDDEN_FEATURES_REVIEW_2026_11_23.md) | Features escondidas con flag, decisión eliminar/reactivar a +6 meses. |
| [NOSE_PRINT_UX_CAPTURE_IDEA.md](NOSE_PRINT_UX_CAPTURE_IDEA.md) | 3 ideas para mejorar la captura biométrica desde la app (Pilar 1). |
| [OUTREACH_REFUGIOS_NOSE_PRINT.md](OUTREACH_REFUGIOS_NOSE_PRINT.md) | Outreach a refugios para dataset cross-individuo. |

**Estado al 2026-04-24**: entregables Fase 0 §5.7 completos en código. Bloqueado en
acciones manuales de Pedro (aplicar 4 SQLs adopción, activar 2 flags `ADOPTION_*`,
deploy `send-adoption-status-email`). Ver checklist en `MANUAL_ACTIONS_PENDING_FASE_0.md`.

---

## Cómo usar esta carpeta

- **Priorizar:** usa la columna **Prioridad** + **Bloquea a** para decidir qué atacar primero.
- **Al ejecutar un plan completo:** moverlo a [_archive/](../_archive/) con un commit tipo `chore: archivar <nombre>.md (ejecutado)`.
- **Al ejecutar parcialmente:** actualizar columna "Estado" + encabezado del propio MD.
- **Regla de oro:** ningún MD debe entrar aquí si es obsoleto o si ya se ejecutó completo. Esta carpeta es *viva*.

---

## Índice de pendientes

| # | Documento | Tipo | Prioridad | Estado |
|---|---|---|---|---|
| 1 | [ROTAR_API_KEYS.md](ROTAR_API_KEYS.md) | Runbook seguridad | 🔴 Alta | Requiere dashboards externos — Pedro debe ejecutar manualmente |
| 2 | ~~PARTNERS_ONBOARDING.md~~ | Plan partners | — | ✅ Ejecutado 2026-04-13. Archivado como `_archive/PARTNERS_ONBOARDING_COMPLETE_2026_04_13.md`. Aprobación manual via admin panel es el flujo correcto (evita spam). |
| 3 | [BASE_DATOS_PARTNERS_CHILE.md](BASE_DATOS_PARTNERS_CHILE.md) | Data | 🟠 Media | Parcial — migración schema + seed refugios OK, falta poblar partners con data real |
| 4 | [map-redesign-blueprint.md](map-redesign-blueprint.md) | Blueprint | 🟠 Media | Parcial — tab Partners + deep linking implementados, bottom sheet/clustering/FAB radial pendientes |
| 5 | [features/FEATURE_AI_WEB_SEARCH_UPGRADE.md](features/FEATURE_AI_WEB_SEARCH_UPGRADE.md) | Feature | 🟠 Media | Pendiente — requiere decisión del dueño (scope ~14h + tokens) |
| 6 | [PROPUESTAS_FUNCIONALIDADES.md](PROPUESTAS_FUNCIONALIDADES.md) | Menú features | 🟡 Media-baja | Documento vivo — menú de propuestas validadas para elegir |
| 7 | [INTEGRACIONES_SETUP.md](INTEGRACIONES_SETUP.md) | Runbook | 🟡 Media-baja | Pendiente — setup WhatsApp + Google Calendar (código en repo, faltan cuentas/secrets) |
| 8 | [CONSOLIDACION_MOBILE.md](CONSOLIDACION_MOBILE.md) | Plan mobile | 🟡 Media-baja | Pendiente — Capacitor iOS/Android consolidation |
| 9 | [testing-virtual-user-blueprint.md](testing-virtual-user-blueprint.md) | Blueprint QA | 🟡 Media-baja | Pendiente — Playwright virtual user agent |
| 10 | [migrations/PLAN_GOOGLE_PLACES_MIGRATION.md](migrations/PLAN_GOOGLE_PLACES_MIGRATION.md) | Migración | 🟡 Media-baja | Cost-gated — requiere decisión sobre costos Google Places |
| 11 | [feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md](feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md) | Feedback | 🟡 Media-baja | 8/9 done — solo pendiente: localizador tiendas (P4 futuro) + grupos comunidad MVP (P1 scope grande) |
| 12 | [tooling/](tooling/) | Plan producción | 🟡 Baja | Plan 8 semanas — entra cuando producto esté estable |
| 13 | [auditoria-e2e/05-PLAN_EJECUCION.md](auditoria-e2e/05-PLAN_EJECUCION.md) | Plan QA E2E | 🟡 Media-baja | Pendiente — plan de ejecución derivado de auditoría E2E de onboardings |

---

## Leyenda de prioridades

- 🔴 **Alta** — bloquea flujos críticos o rompe features visibles.
- 🟠 **Media** — mejora UX/producto relevante, feature nuevo con ROI claro.
- 🟡 **Media-baja / Baja** — nice-to-have, infra que todavía no duele.

---

## Archivados recientemente

| Documento | Razón | Fecha |
|---|---|---|
| `dual-role-toggle-blueprint.md` → `_archive/` | 100% ejecutado: toggle header/mobile, BottomTabBar/Sidebar condicionales, RoleGuard, BecomeProviderCTA | 2026-04-13 |
| `profile-redesign-blueprint.md` → `_archive/` | 90%+ ejecutado: 6 bloques verticales, pets carousel, settings integrado, BecomeProviderCTA | 2026-04-13 |
| `REVISION_PROVIDER_PROFILE_EDIT.md` → `_archive/` | Ejecutado: renombrado a "Tu perfil en el directorio", preview card en vivo, MisPreciosEditor reordenado | 2026-04-13 |
| `AUDIT_DATOS_PARAMETRIZADOS.md` → `_archive/` | 100% ejecutado: SelectWithOther, ComboboxWithOther, breeds, colores, blood type, especies unificadas | 2026-04-13 |
| `REDISENO_MY_PETS_CARDS.md` → `_archive/` | Parcial archivado — PawCardFlippable TCG implementado, carrusel OK en Profile, user decidió no cambiar layout de MyPets | 2026-04-13 |
| `AUDIT_SIDEBAR_PANELS.md` → `_archive/` | Sidebar reorganizado, links redundantes removidos | 2026-04-12 |
| `feed-redesign-blueprint.md` → `_archive/` | 14 componentes + 6 hooks + migración SQL implementados | 2026-04-12 |
| `bugs/REDISENO_DASHBOARD_PROVIDER.md` → `_archive/` | Dashboard reescrito con métricas reales (commit 939576e) | 2026-04-12 |
| `features/FEATURE_MEDICAL_PDF_UPGRADE.md` → `_archive/` | Logo, verificación PF-XXXX, word-wrap, confidencialidad — todo implementado | 2026-04-12 |
| `MASTER_UPGRADE_2026_04.md` → `_archive/` | 100% ejecutado (fases 0-8 cerradas) | 2026-04-11 |
| `bugs/BUG_FICHA_CLINICA_PDF_URL.md` → `_archive/` | Ejecutado 2026-04-13 | 2026-04-13 |
| `bugs/SEED_CONTAMINATION_QUERIES.sql` → `_archive/` | Investigación cerrada como FP | 2026-04-11 |
| `landing-redesign-blueprint.md` → `_archive/` | Ejecutado en commit fc48e94 | 2026-04-13 |
| `bugs/BUG_GROOMERS_GRADIENT_CRASH.md` → `_archive/` | Fix confirmado — gradient definido | 2026-04-13 |
| `EMAILS_PARTNERS.md` → `_archive/` | 11 templates listos para usar — completo | 2026-04-14 |
| `../PLAN_DUAL_PROFILE.md` → `_archive/` | 100% ejecutado: dual-role switching + ActiveRoleProvider + useActiveRole | 2026-04-14 |
| `../PAW_CARDS_COLLECTIBLE.md` → `_archive/` | Implementado: TCG, raridades, holográfico, breeding | 2026-04-14 |
| `docs-specs/PAW_CARDS_VISUAL_OVERHAUL.md` → `_archive/` | 100% ejecutado: paletas especie, holo por raza, bordes rareza | 2026-04-13 |
| `docs-specs/PAW_MISSIONS_ACHIEVEMENTS.md` → `_archive/` | 100% ejecutado: paw_missions, user_achievements, página /misiones | 2026-04-13 |
| `docs-specs/RUTINAS_Y_CALENDARIO_MASCOTA.md` → `_archive/` | 100% ejecutado: pet_routines, calendario unificado, RoutineCard | 2026-04-13 |
| `docs-specs/VISTAS_ROLES_Y_PLANES.md` → `_archive/` | 100% ejecutado: RoleGuard, ActiveRoleProvider, sidebar condicional | 2026-04-13 |
| `docs-specs/COMPARTIR_FICHA_V2.md` → `_archive/` | 100% ejecutado: pet_vet_links, ShareWithVetModal, bidireccional | 2026-04-13 |
| `docs-specs/OPTIMIZACION_PROMPTS_AI.md` → `_archive/` | Parcial archivado: seguridad prompts OK, Haiku migration OK | 2026-04-13 |
| `ANALISIS_LIMPIEZA_DEMO_USERS.md` → `_archive/` | Ejecutado — limpieza de ~100 users demo completada | 2026-04-12 |
| `docs-specs/VACUNAS_ANTIPARASITARIOS_SOFIA.md` → `_archive/` | 100% ejecutado: TabVacunas/TabAntiparasitarios + migs 20260416210000 y 20260629000000 (trigger auto-reminder) | 2026-04-21 |
| `docs-specs/MEJORA_IMAGENES_AVATARES.md` → `_archive/` | 100% ejecutado: imageUtils.ts con compressImage, upload propio en EditProfileDrawer, presets avatar/pet/feed | 2026-04-21 |
| `PLAN_ADOPCION_CENTROS_2026_04_20.md` → `_archive/` | 100% ejecutado: rol shelter, adoption_centers, dashboard, bulk import, transferencia a adoptante | 2026-04-21 |
| `features/COMPETITIVE_VETCHECK_FEATURES.md` → `_archive/` | 100% ejecutado: pet_co_owners + CoOwnerInviteReceivedDialog + ImportPatientsModal + ShelterBulkImport | 2026-04-21 |
| `docs-specs/BOOKING_SYSTEM_OVERHAUL_PLAN.md` → `_archive/` | Superseded por [BOOKING_SYSTEM_MASTER_PLAN.md](../docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md) (2026-04-21) | 2026-04-21 |
| `docs-specs/CONSOLIDACION_FICHA_PDF_Y_DATOS_UNIFICADOS.md` → `_archive/` | 100% ejecutado: PDF v3 cronológico, ZIP v2, RPC get_medical_summary_data (sesión 2026-04-19) | 2026-04-21 |
| `docs-specs/ADMIN_CONTROL_CENTER_V2.md` → `_archive/` | 100% ejecutado: error_logs, edge fn log-error, telemetría, 8 secciones admin (admin-powerhouse + live + telemetry) | 2026-04-21 |
| `docs-raiz/planes/EJECUCION_COHERENCE_*` + `SMOKE_*` → `_archive/` | Plan maestro Coherence ejecutado 100% en scope (Día 1 + Día 2 + Fase Final + Fase 6) | 2026-04-21 |

---

## Reglas de mantenimiento

1. **Al completar un MD:** moverlo a `_archive/` y borrar su fila de la tabla.
2. **Al completar parcialmente:** actualizar columna "Estado" + encabezado del propio MD.
3. **Nuevos MDs:** crearlos aquí bajo subcarpeta correspondiente (`bugs/`, `features/`, `migrations/`, `feedback/`, `tooling/`).
4. **No duplicar:** si un item cabe dentro de un plan existente, añadirlo como sección dentro.
