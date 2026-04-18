# docs-raiz/ — Documentación viva

Docs activas del proyecto, consolidados desde la raíz.
Cada sub-carpeta tiene un propósito claro.

## Estructura

| Carpeta | Contenido | Cuándo editar |
|---|---|---|
| [pitch/](pitch/) | Pitch deck 13 slides, apalancamiento founder+IA, consolidado técnico | Antes de reuniones con inversionistas / cuando cambian datos clave |
| [stores/](stores/) | Guía de deploy a App Store y Play Store, data safety, privacy labels | Antes de cada release a tiendas |
| [operacion/](operacion/) | Tareas manuales pendientes, variables de entorno, checklists | A diario mientras hay items pendientes |
| [planes/](planes/) | Plan maestro, propuestas de reordenamiento, sugerencias priorizadas | Cada vez que se arma un plan de varias sesiones |
| [marketing/](../marketing/) | LinkedIn, reels, redes (folder raíz) | Antes de cada lanzamiento |

## Qué NO vive aquí

- **Docs de inversionistas completos**: ver [pitch-inversionistas/](../pitch-inversionistas/) — HTML + 4 MDs por audiencia
- **Auditorías con fecha**: ver [audits/](../audits/)
- **Especificaciones técnicas**: ver [docs-specs/](../docs-specs/)
- **Docs con contratos vivos** (flujo, mapa funcional): ver [docs-vivos/](../docs-vivos/)
- **Planes ejecutados / deprecados**: ver [_archive/](../_archive/)
- **Planes sin ejecutar**: ver [_pending/](../_pending/)

## Reglas

1. **Nada de snapshots históricos en activo.** Si un doc con fecha (ej: `CONSOLIDADO_2026_04_18.md`) queda obsoleto, se mueve a [_archive/](../_archive/).
2. **Nada de duplicados.** El índice maestro está en [../INDEX.md](../INDEX.md) — no repitas listados aquí.
3. **Links relativos desde la raíz.** Por ejemplo, un doc de `docs-raiz/pitch/` que enlaza a otro de la misma carpeta usa `./OTRO.md` o solo `OTRO.md`; si enlaza a la raíz del repo usa `../../INDEX.md`.
