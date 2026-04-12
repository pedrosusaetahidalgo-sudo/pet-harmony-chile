# Paw Friend — Pending (por ejecutar)

> **Propósito:** staging de MDs accionables que aún **no** se han ejecutado (total o parcialmente).
> **Qué NO vive aquí:** docs vivas ([CLAUDE.md](../CLAUDE.md), [INDEX.md](../INDEX.md), [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md), [AGENTS.md](../AGENTS.md), [diagrams/](../diagrams/)), auditorías ([audits/](../audits/)), archivados ([_archive/](../_archive/)).
> **Última actualización:** 2026-04-29

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
| 2 | [bugs/REDISENO_DASHBOARD_PROVIDER.md](bugs/REDISENO_DASHBOARD_PROVIDER.md) | Mejora UX | 🟠 Media | Parcial — diagnóstico $0 ya corregido, quedan fases 2-6 (sparklines, tabs actividad, perfil expandido, Colmevet) |
| ~~3~~ | ~~BUG_GROOMERS_GRADIENT_CRASH.md~~ | ~~Bug fix~~ | — | ✅ Archivado — fix confirmado en ServiceDirectory + ProviderProfileCard |
| 4 | [dual-role-toggle-blueprint.md](dual-role-toggle-blueprint.md) | Blueprint | 🟠 Media | Parcial — infraestructura `useActiveRole` existe, falta navegación adaptativa |
| 5 | [feed-redesign-blueprint.md](feed-redesign-blueprint.md) | Blueprint | 🟠 Media | Parcial — 14 componentes + 6 hooks + migración SQL listos. Faltan stories, moderación, explore avanzado |
| 6 | [profile-redesign-blueprint.md](profile-redesign-blueprint.md) | Blueprint | 🟠 Media | Parcial — sub-componentes existen, falta reorganizar a layout 6 bloques + merge Settings |
| 7 | [REVISION_PROVIDER_PROFILE_EDIT.md](REVISION_PROVIDER_PROFILE_EDIT.md) | Audit + fix | 🟠 Media | Pendiente — auditoría de ProviderProfileEdit.tsx con action items abiertos |
| 8 | [AUDIT_DATOS_PARAMETRIZADOS.md](AUDIT_DATOS_PARAMETRIZADOS.md) | Audit | 🟠 Media | Pendiente — parametrizar todos los selects/dropdowns |
| 9 | [AUDIT_SIDEBAR_PANELS.md](AUDIT_SIDEBAR_PANELS.md) | Audit | 🟠 Media | Pendiente — reorganizar navegación sidebar |
| 10 | [REDISENO_MY_PETS_CARDS.md](REDISENO_MY_PETS_CARDS.md) | Blueprint | 🟡 Media-baja | Pendiente — cards horizontales swipeables para /my-pets |
| 11 | [features/FEATURE_AI_WEB_SEARCH_UPGRADE.md](features/FEATURE_AI_WEB_SEARCH_UPGRADE.md) | Feature | 🟠 Media | Pendiente — requiere decisión del dueño (scope ~14h + tokens) |
| 12 | [features/FEATURE_MEDICAL_PDF_UPGRADE.md](features/FEATURE_MEDICAL_PDF_UPGRADE.md) | Feature | 🟠 Media | Pendiente — polish UX del PDF de ficha clínica |
| 13 | [migrations/PLAN_GOOGLE_PLACES_MIGRATION.md](migrations/PLAN_GOOGLE_PLACES_MIGRATION.md) | Migración | 🟡 Media-baja | Cost-gated — requiere decisión sobre costos Google Places |
| 14 | [INTEGRACIONES_SETUP.md](INTEGRACIONES_SETUP.md) | Runbook | 🟡 Media-baja | Pendiente — setup WhatsApp + Google Calendar (código en repo, faltan cuentas/secrets) |
| 15 | [CONSOLIDACION_MOBILE.md](CONSOLIDACION_MOBILE.md) | Plan mobile | 🟡 Media-baja | Pendiente — Capacitor iOS/Android consolidation |
| 16 | [testing-virtual-user-blueprint.md](testing-virtual-user-blueprint.md) | Blueprint QA | 🟡 Media-baja | Pendiente — Playwright virtual user agent |
| 17 | [feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md](feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md) | Feedback | 🟡 Media-baja | Parcial — 5/8 done, 3 features nuevas opcionales |
| 18 | [tooling/](tooling/) | Plan producción | 🟡 Baja | Plan 8 semanas — entra cuando producto esté estable |

---

## Leyenda de prioridades

- 🔴 **Alta** — bloquea flujos críticos o rompe features visibles.
- 🟠 **Media** — mejora UX/producto relevante, feature nuevo con ROI claro.
- 🟡 **Media-baja / Baja** — nice-to-have, infra que todavía no duele.

---

## Archivados recientemente

| Documento | Razón |
|---|---|
| `MASTER_UPGRADE_2026_04.md` → `_archive/` | 100% ejecutado (fases 0-8 cerradas) |
| `bugs/BUG_FICHA_CLINICA_PDF_URL.md` → `_archive/` | Ejecutado 2026-04-13 |
| `bugs/SEED_CONTAMINATION_QUERIES.sql` → `_archive/` | Investigación cerrada como FP |
| `landing-redesign-blueprint.md` → `_archive/` | Ejecutado en commit fc48e94 |
| `bugs/BUG_GROOMERS_GRADIENT_CRASH.md` → `_archive/` | Fix confirmado — gradient definido en ServiceDirectory + ProviderProfileCard |

---

## Reglas de mantenimiento

1. **Al completar un MD:** moverlo a `_archive/` y borrar su fila de la tabla.
2. **Al completar parcialmente:** actualizar columna "Estado" + encabezado del propio MD.
3. **Nuevos MDs:** crearlos aquí bajo subcarpeta correspondiente (`bugs/`, `features/`, `migrations/`, `feedback/`, `tooling/`).
4. **No duplicar:** si un item cabe dentro de un plan existente, añadirlo como sección dentro.
