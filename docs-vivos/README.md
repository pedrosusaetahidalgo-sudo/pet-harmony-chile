# docs-vivos/ — Documentación que SIEMPRE refleja el código real

> **Creado**: 2026-04-17
> **Propósito**: centralizar los docs que deben mantenerse sincronizados con
> el código. Si un doc está listado acá, debe actualizarse **en el mismo
> commit** que cualquier cambio en su "dueño" (código fuente relevante).

No movemos los archivos — los mantenemos en su ubicación actual para no
romper links existentes en `CLAUDE.md`, `INDEX.md`, `AGENTS.md`. Este
README es el índice y el contrato de mantenimiento.

---

## Registro de docs vivos

| Doc | Ubicación | Dueño (código) | Cuándo actualizar |
|---|---|---|---|
| Flujo end-to-end Mermaid | [`diagrams/FLUJO_COMPLETO.mmd`](../diagrams/FLUJO_COMPLETO.mmd) | `src/App.tsx` (rutas), `BottomTabBar.tsx`, `AppSidebar.tsx`, `Header.tsx`, flujos de negocio | Cualquier cambio de navegación, ruta nueva/eliminada, BottomTabBar, onboarding, pricing, edge fn que cambie un flujo de usuario |
| Mapa funcional | [`MAPA_FUNCIONAL_COMPLETO.md`](../MAPA_FUNCIONAL_COMPLETO.md) | `src/pages/**`, `src/components/**`, `supabase/functions/**`, `supabase/migrations/**` | Módulo nuevo, feature que cambia comportamiento end-to-end, edge fn nueva/eliminada, migración con cambio de contrato |
| Inventario de app | [`INVENTARIO_APP_2026_04_17.md`](../INVENTARIO_APP_2026_04_17.md) | `src/App.tsx` rutas | Cuando se agrega/elimina/redirige una ruta, se cambia BottomTabBar, o se detectan duplicados nuevos |
| Propuesta reordenamiento v3 | [`PROPUESTA_REORDENAMIENTO_2026_04_17.md`](../docs-raiz/planes/PROPUESTA_REORDENAMIENTO_2026_04_17.md) | `src/` + `supabase/` | Sólo mientras el plan esté en ejecución. Una vez terminada la v3, mover a `_archive/` y generar la v4 cuando sea |
| Manual operativo para IA | [`CLAUDE.md`](../CLAUDE.md) | Meta-doc | Stack nuevo, convención nueva, regla nueva. Se actualiza por separado al código |
| Registro de feature flags | Secciones 11.1, 11.2 de `CLAUDE.md` | `src/lib/featureFlags.ts` | Cuando se agrega/quita/flipea un flag |
| Pitch decks públicos (4) | [`public/pitch/`](../public/pitch/) | `src/lib/plans.ts`, `CLAUDE.md §5`, `src/pages/PawCore.tsx`, `src/pages/PawVoices.tsx`, `src/pages/PawCompanys.tsx`, `marketing/PITCH_DECKS_MASTERPLANS.md` | Cambio de pricing, modelo de negocio, tiers Paw Companys, copy de beneficios Voices, o identidad Paw Core. Ver [public/pitch/README.md](../public/pitch/README.md) para reglas de edición |

## Dueños secundarios (si tocás estos, verificá docs)

- `src/lib/links.ts` — si cambiás un helper, revisá FLUJO_COMPLETO y MAPA_FUNCIONAL
- `src/lib/featureFlags.ts` — flag on/off cambia comportamiento visible; actualizá CLAUDE.md §11
- `supabase/functions/_shared/` — helpers compartidos, no es doc, pero si cambiás firma pueden romper múltiples fns

---

## Regla de commit (contrato)

**Cuando toques "Dueño (código)" en un commit, tu commit DEBE incluir
también el cambio correspondiente al doc vivo listado arriba.**

Excepciones:
- Fix trivial de tipografía en una variable de UI → no requiere actualizar docs.
- Refactor interno sin cambio de comportamiento ni interfaz → no requiere.

Si dudás: **actualizá el doc**. El costo de actualizar es bajo; el costo
de tener docs desactualizados (Claude/Cursor/tu-yo-futuro leyendo un
mapa incorrecto) es alto.

## Hook de recordatorio (PostToolUse)

En `.claude/settings.json` hay un hook `PostToolUse` que detecta cuándo
editás archivos "Dueño" listados arriba y muestra un recordatorio sobre
actualizar el doc correspondiente. El hook es **soft** (no bloquea el
commit) — existe para que Claude/tú recordéis actualizar los docs en la
misma iteración.

Si modificás los archivos dueños más de una vez seguida sin tocar docs,
el hook va a recordártelo varias veces. Eso es intencional.

## Cómo agregar un doc nuevo a este registro

1. Decidí el nombre y ubicación del archivo (fuera de `docs-vivos/` para no mover archivos existentes).
2. Agregá una fila a la tabla arriba con dueño claro.
3. Si el dueño es un path nuevo, agregalo al matcher del hook en `.claude/settings.json` (sección PostToolUse).
4. Commitá los 3 cambios juntos: doc, registro, hook.
