# Paw Friend — Pending (por ejecutar)

> **Propósito:** staging de MDs accionables que aún **no** se han ejecutado (total o parcialmente).
> **Qué NO vive aquí:** docs vivas ([CLAUDE.md](../CLAUDE.md), [INDEX.md](../INDEX.md), [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md), [AGENTS.md](../AGENTS.md), [diagrams/](../diagrams/)), materiales de venta ([sales/](../sales/)), obsoletos ([junk/](../junk/)) y archivos ([_archive/](../_archive/)).
> **Última actualización:** 2026-04-11

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
| 1 | [MASTER_UPGRADE_2026_04.md](MASTER_UPGRADE_2026_04.md) | Plan orquestador | 🔴 Alta | Parcial — FASE 0-6 cerradas en commit `44c0fb3`, quedan FASE 7+ | — |
| 2 | [bugs/BUG_GROOMERS_GRADIENT_CRASH.md](bugs/BUG_GROOMERS_GRADIENT_CRASH.md) | Bug fix | 🔴 Alta | Diagnosticado, no corregido — ruta `/services/groomers` rota | MASTER_UPGRADE fase bugs |
| 3 | [bugs/SEED_CONTAMINATION_REPORT_2026_04_09.md](bugs/SEED_CONTAMINATION_REPORT_2026_04_09.md) | Integridad datos | 🔴 Alta | PENDIENTE DE VALIDACIÓN MANUAL — queries SQL a correr en Supabase Dashboard para detectar si seed contaminó cuentas reales | — |
| 4 | [ROTAR_API_KEYS.md](ROTAR_API_KEYS.md) | Runbook seguridad | 🔴 Alta | Rotación programada para 2026-04-11 (Supabase + Google) — key fue bloqueada por GitHub Push Protection | — |
| 5 | [features/FEATURE_AI_WEB_SEARCH_UPGRADE.md](features/FEATURE_AI_WEB_SEARCH_UPGRADE.md) | Feature | 🟠 Media | Pendiente — upgrade IA con web search + prompts optimizados (~14h, 0 tablas nuevas) | MASTER_UPGRADE fase IA |
| 6 | [migrations/PLAN_GOOGLE_PLACES_MIGRATION.md](migrations/PLAN_GOOGLE_PLACES_MIGRATION.md) | Migración infra | 🟠 Media | Propuesta — migrar Leaflet/OSM → Google Maps + Places con control de costos (16+ archivos) | MASTER_UPGRADE fase maps |
| 7 | [landing-redesign-blueprint.md](landing-redesign-blueprint.md) | Blueprint diseño | 🟠 Media | Blueprint completo listo; implementación de `HeroV2.tsx` pendiente | — |
| 8 | [profile-redesign-blueprint.md](profile-redesign-blueprint.md) | Blueprint diseño | 🟠 Media | Blueprint completo listo; rediseño de Perfil en 6 fases, no iniciado. Toca `Profile.tsx`, `Settings.tsx`, `UserProfile.tsx` | — |
| 9 | [feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md](feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md) | Feedback → acciones | 🟡 Media | 8 puntos: 5 con implementación parcial/total, 3 features nuevas (localizador tiendas, comunidad por raza/condición, tercer item) | — |
| 10 | [tooling/](tooling/) | Plan producción | 🟡 Media-baja | 8 documentos numerados (00–07), plan de 4 fases × 2 semanas = 8 semanas. Ejecución no iniciada | Operación a escala |

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
