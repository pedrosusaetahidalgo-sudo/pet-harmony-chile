# Paw Friend — Pending (por ejecutar)

> **Propósito:** staging de MDs accionables que aún **no** se han ejecutado (total o parcialmente).
> **Qué NO vive aquí:** docs vivas ([CLAUDE.md](../CLAUDE.md), [INDEX.md](../INDEX.md), [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md), [AGENTS.md](../AGENTS.md), [diagrams/](../diagrams/)), materiales de venta ([sales/](../sales/)), obsoletos ([junk/](../junk/)) y archivos ([_archive/](../_archive/)).
> **Última actualización:** 2026-04-11 (auditoría automática — sync con commits `490b29b`, `44c0fb3`)

---

## Cómo usar esta carpeta

- **Priorizar:** usa la columna **Prioridad** + **Bloquea a** para decidir qué atacar primero.
- **Al ejecutar un plan completo:** cuando todas las tareas de un MD estén cerradas, muévelo a [junk/](../junk/) con un commit tipo `chore: archivar <nombre>.md (ejecutado)`.
- **Al ejecutar parcialmente:** marca el estado en la tabla de abajo y en el encabezado del propio MD (`Estado: parcial — FASE X completada`).
- **Regla de oro:** ningún MD debe entrar aquí si es obsoleto o si ya se ejecutó completo. Esta carpeta es *viva*; si crece sin moverse nada afuera, algo está mal.

---

## Índice de pendientes

| # | Documento | Tipo | Prioridad | Estado | Bloquea a |
|---|---|---|---|---|---|
| 1 | [MASTER_UPGRADE_2026_04.md](MASTER_UPGRADE_2026_04.md) | Plan orquestador | 🔴 Alta | Parcial — FASE 0-6 cerradas (commits `44c0fb3`, `490b29b`), FASE 7.1 cerrada (migración `20260427000004`). Quedan: FASE 0.2 (Google OAuth branding), 0.3 (HTTPS GH Pages), 0.4 (aviso legal vets seed), FASE 7.2 (queries savadas en Studio), FASE 8 (docs vivas) | — |
| 2 | ~~bugs/BUG_GROOMERS_GRADIENT_CRASH.md~~ | Bug fix | — | ✅ **CERRADO** — fix ya aplicado en `src/components/ProviderProfileCard.tsx:50,90-97,115,124` por commit `44c0fb3`. Doc archivado en `junk/` el 2026-04-11 | — |
| 3 | ~~bugs/SEED_CONTAMINATION_REPORT_2026_04_09.md~~ + [bugs/SEED_CONTAMINATION_QUERIES.sql](bugs/SEED_CONTAMINATION_QUERIES.sql) | Integridad datos | — | ✅ **CERRADO 2026-04-11** — diagnóstico corrido contra prod: 5 de 6 checks `OK`; el check #2 (reminders) dio 7 filas REVIEW pero drill-down confirmó FALSO POSITIVO (datos legítimos de beta testers + mascota Kai del dueño). Reporte archivado a `junk/`. SQL se conserva en `_pending/bugs/` como diagnóstico reusable con warning sobre check #2. | — |
| 4 | [ROTAR_API_KEYS.md](ROTAR_API_KEYS.md) | Runbook seguridad | 🔴 Alta | **REQUIERE DASHBOARDS EXTERNOS** — Claude Code no puede rotar keys (Supabase Dashboard + Anthropic Console + Flow.cl + Google Cloud Console). Runbook listo para Pedro ejecutar | — |
| 5 | [features/FEATURE_AI_WEB_SEARCH_UPGRADE.md](features/FEATURE_AI_WEB_SEARCH_UPGRADE.md) | Feature | 🟠 Media | Pendiente — requiere decisión del dueño: scope ~14h + gasto de tokens. No iniciar sin luz verde | MASTER_UPGRADE fase IA |
| 6 | [migrations/PLAN_GOOGLE_PLACES_MIGRATION.md](migrations/PLAN_GOOGLE_PLACES_MIGRATION.md) | Migración infra | 🟠 Media | **COST-GATED** — propuesta, requiere decisión del dueño sobre costos Google Places + config API key antes de ejecutar (16+ archivos tocados) | MASTER_UPGRADE fase maps |
| 7 | [landing-redesign-blueprint.md](landing-redesign-blueprint.md) | Blueprint diseño | 🟠 Media | **REQUIERE AUTORIZACIÓN** — blueprint completo listo pero implementación es refactor grande. CLAUDE.md §9.6 obliga luz verde explícita antes de arrancar | — |
| 8 | [profile-redesign-blueprint.md](profile-redesign-blueprint.md) | Blueprint diseño | 🟠 Media | **REQUIERE AUTORIZACIÓN** — rediseño en 6 fases, toca `Profile.tsx`, `Settings.tsx`, `UserProfile.tsx`. No iniciar sin luz verde | — |
| 9 | [feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md](feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md) | Feedback → acciones | 🟡 Media | 8 puntos: 5 ya existen, 3 features nuevas (localizador tiendas, eventos grupales, comunidad por condición) requieren decisión de roadmap | — |
| 10 | [tooling/](tooling/) | Plan producción | 🟡 Media-baja | Plan de 8 semanas — fuera de scope de sesión única. Entra cuando producto esté estable | Operación a escala |

---

## Leyenda de prioridades

- 🔴 **Alta** — bloquea flujos críticos, ya tiene fases ejecutadas, o rompe joya de la corona.
- 🟠 **Media** — mejora UX/producto relevante, feature nuevo con ROI claro, o tech debt medible.
- 🟡 **Media-baja** — nice-to-have, optimización, infra que todavía no duele.

---

## Desglose por categoría

### 🔴 Alta prioridad (atacar primero)

1. **ROTAR_API_KEYS.md** — runbook de rotación con fecha programada 2026-04-11 (hoy). Ya hubo bloqueo por GitHub Push Protection. Es el primer item por riesgo/urgencia.
2. **bugs/SEED_CONTAMINATION_REPORT_2026_04_09.md** — queries SQL pendientes de correr en Supabase Dashboard para determinar si el seed demo contaminó cuentas reales. Integridad de datos en juego.
3. **MASTER_UPGRADE_2026_04.md** — orquestador que cruza referencias entre casi todos los otros MDs pendientes. Antes de atacar items individuales, revisar qué FASE del master upgrade los cubre para no duplicar trabajo.
4. **bugs/BUG_GROOMERS_GRADIENT_CRASH.md** — la ruta `/services/groomers` está completamente rota. Fix puntual con diagnóstico ya escrito, debería ser rápido.

### 🟠 Prioridad media (siguiente ronda)

5. **features/FEATURE_AI_WEB_SEARCH_UPGRADE.md** — upgrade de `pet-assistant`, `medical-suggestions`, `breed-tips`, `ocr-vaccination-card` con web search y prompts optimizados. Impacto directo en joya de la corona (ficha clínica IA).
6. **migrations/PLAN_GOOGLE_PLACES_MIGRATION.md** — afecta el directorio de vets. Requiere control estricto de costos por eso es media y no alta.
7. **landing-redesign-blueprint.md** — rediseño completo del hero y arquitectura de [src/pages/Index.tsx](../src/pages/Index.tsx). Ver recomendación de Concepto A "Ficha viva" en el propio blueprint §3.3.
8. **profile-redesign-blueprint.md** — rediseño de [src/pages/Profile.tsx](../src/pages/Profile.tsx) con fusión de [src/pages/Settings.tsx](../src/pages/Settings.tsx). Plan en 6 fases, arranca por componentes aislados (`PetIdentityCard`, `ProfileIdentityCard`, `ProfileCompletionCard`) sin tocar Profile.tsx todavía.

### 🟡 Prioridad media-baja

9. **feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md** — 8 puntos de usuario real. Ya hay 5 con implementación parcial; los 3 restantes (localizador tiendas, comunidad por raza/condición) son features nuevas opcionales.
10. **tooling/** — plan de 8 semanas para llevar el tooling a producción profesional (backups, CI/CD, observabilidad, testing). Entra cuando el producto esté estable y no antes.

---

## Orden recomendado de ejecución

```
1. Rotar API keys (Supabase + Google)   (30 min — hoy, crítico)
2. Seed contamination queries SQL       (1h — correr en Supabase Dashboard)
3. Bug fix groomers                     (horas)
4. MASTER_UPGRADE fase pendiente        (días — revisar qué falta post FASE 6)
5. Landing redesign Concepto A          (días — empezar por HeroV2.tsx)
6. Profile redesign Fase 1              (días — componentes aislados sin tocar Profile.tsx)
7. Feature AI web search                (~14h)
8. Google Places migration              (revisar costos primero)
9. Feedback — 3 features nuevas         (evaluar ROI)
10. Tooling plan 8 semanas              (cuando producto esté en equilibrio)
```

---

## Reglas de mantenimiento

1. **Al completar un MD:** moverlo a [junk/](../junk/) y borrar su fila de la tabla de arriba.
2. **Al completar parcialmente:** actualizar columna "Estado" con la fase/commit que cerró parte del trabajo.
3. **Nuevos MDs pendientes:** crearlos directamente aquí bajo la subcarpeta correspondiente (`bugs/`, `features/`, `migrations/`, `feedback/`, o raíz de `_pending/` si es un plan orquestador).
4. **No duplicar:** si un item cabe dentro de un plan existente (ej. MASTER_UPGRADE), añadirlo como sección dentro del plan en vez de crear un MD suelto.
5. **No mezclar venta:** materiales de reunión B2B van en [sales/](../sales/), no aquí.

---

## Historial de movimientos

| Fecha | Acción |
|---|---|
| 2026-04-11 | Creación de `_pending/` y migración inicial de 7 items desde raíz, `audits/` y `Tooling/` |
| 2026-04-11 | Añadido `profile-redesign-blueprint.md` — blueprint de rediseño de Perfil (6 fases, no iniciado) |
| 2026-04-11 | Rescate desde `junk/` — 2 items pendientes reales: `bugs/SEED_CONTAMINATION_REPORT_2026_04_09.md` y `ROTAR_API_KEYS.md`. Además, 5 docs de referencia (`AUDITORIA_TOTAL_APP`, `AUDIT_2026_04_08`, `WALKTHROUGH_2026_04_08`, `COMPETENCIA_2026_04_08`, `RECOMENDACIONES_2026_04_08`) devueltos a `audits/` porque estaban listados en CLAUDE.md §8 e INDEX.md. `DEMO_GUIDE.md` rescatado a `sales/` porque `DEMO_SCRIPT_VETS.md` lo linkea. |
| 2026-04-11 | Auditoría automática de Claude Code — verificado que `BUG_GROOMERS_GRADIENT_CRASH` ya estaba cerrado en commit `44c0fb3` (ProviderProfileCard.tsx:50,90-97,115,124), archivado a `junk/`. Confirmado que FASE 7.1 de `MASTER_UPGRADE` ya está cerrada en migración `20260427000004_seed_vet_service_prices.sql`. Creado `bugs/SEED_CONTAMINATION_QUERIES.sql` como entregable ready-to-paste para Pedro. Typecheck + build verdes post-auditoría. |
| 2026-04-11 | Diagnóstico de seed contamination corrido contra prod — 5 de 6 checks `OK`, check #2 (reminders) dio 7 filas `REVIEW` pero drill-down confirmó **falso positivo**: eran datos legítimos de beta testers + mascota Kai del dueño. No se borró nada. `SEED_CONTAMINATION_REPORT_2026_04_09.md` archivado a `junk/` (investigación cerrada). Item 3 del índice marcado como ✅ CERRADO. `CLEANUP_REMINDERS_SEED_2026_04_11.sql` eliminado (nunca se aplicó). |
