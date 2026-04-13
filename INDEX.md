# Paw Friend — Indice de documentacion viva

> Todos estos documentos deben mantenerse actualizados con cada cambio relevante.
> Si modificas rutas, navegacion, flujos, planes o features: actualiza el documento correspondiente.

---

## Documentos vivos (SIEMPRE mantener actualizados)

| Documento | Que contiene | Cuando actualizar |
|---|---|---|
| [CLAUDE.md](CLAUDE.md) | Manual operativo — fuente de verdad principal | Nuevas rutas, features, convenciones, edge functions |
| [MAPA_FUNCIONAL_COMPLETO.md](MAPA_FUNCIONAL_COMPLETO.md) | Mapa de cada modulo, archivos, flujo y oportunidades | Nuevas paginas, hooks, componentes, cambios de arquitectura |
| [AGENTS.md](AGENTS.md) | Config para agentes IA (Cursor, Copilot, etc.) | Cambios en stack, convenciones, estructura |
| [diagrams/FLUJO_COMPLETO.mmd](diagrams/FLUJO_COMPLETO.mmd) | Diagrama Mermaid end-to-end | Cambios en navegacion, tabs, sidebar, auth, rutas |
| [diagrams/FLUJOS_MERMAID.md](diagrams/FLUJOS_MERMAID.md) | Diagramas individuales por modulo | Cambios en un flujo especifico (pagos, ficha, reservas, etc.) |

## Documentos de referencia (snapshots, actualizar cuando cambie el contexto)

| Documento | Que contiene | Cuando actualizar |
|---|---|---|
| [audits/REPORTE_CONSOLIDADO_2026_04_11.md](audits/REPORTE_CONSOLIDADO_2026_04_11.md) | Fuente de verdad del estado tecnico al 2026-04-11 | Despues de cada sesion de auditoria mayor |
| [audits/COMPETENCIA_2026_04_08.md](audits/COMPETENCIA_2026_04_08.md) | Analisis competitivo Chile | Cada 3-6 meses o cuando aparezca competidor nuevo |
| [audits/CROSS_PLATFORM_COMPATIBILITY.md](audits/CROSS_PLATFORM_COMPATIBILITY.md) | Compatibilidad multiplataforma (iOS, Android, Web, Chrome) | Cada cambio de CSS/JS moderno o API de browser |

## Specs de features (propuestas, pendientes de implementar)

| Documento | Que contiene | Prioridad |
|---|---|---|
| [PLAN_DUAL_PROFILE.md](PLAN_DUAL_PROFILE.md) | Sistema de perfil dual dueno/veterinario — toggle, guards, onboarding | **Alta** — Aprobado, listo para implementar |
| [docs-specs/COMPARTIR_FICHA_V2.md](docs-specs/COMPARTIR_FICHA_V2.md) | Vinculacion directa vet-mascota con aceptar/rechazar. Reemplaza tokens temporales | **Alta** — Toca la joya de la corona (ficha clinica) |
| [docs-specs/ANALISIS_PREMIUM_VS_FREE.md](docs-specs/ANALISIS_PREMIUM_VS_FREE.md) | Analisis de que features deben ser free vs premium + plan de ejecucion | **Alta** — Define monetizacion |
| [docs-specs/AUDIO_CONSULTA_VET.md](docs-specs/AUDIO_CONSULTA_VET.md) | Transcripcion IA en vivo de consultas veterinarias | **Media** — Diferenciador B2B, requiere infra IA |
| [docs-specs/RUTINAS_Y_CALENDARIO_MASCOTA.md](docs-specs/RUTINAS_Y_CALENDARIO_MASCOTA.md) | Rutinas semanales recurrentes + calendario unificado por mascota | **Media** — Mejora retention, no bloquea nada |

## Archivos clave en codigo

| Archivo | Que contiene |
|---|---|
| `src/lib/plans.ts` | Pricing B2C y B2B, features por plan, comisiones |
| `src/lib/links.ts` | Centralizacion de rutas internas |
| `src/hooks/useVetPriceEstimator.ts` | Tipos de servicio y labels del estimador de precios |
| `src/components/BottomTabBar.tsx` | Tabs de navegacion mobile (5 tabs) |
| `src/components/AppSidebar.tsx` | Sidebar desktop (3 grupos) |
| `src/App.tsx` | Todas las rutas de la app |

---

## Regla de oro

> Si cambias algo que afecta como el usuario navega, paga, o interactua con la app:
> **actualiza el documento correspondiente en el mismo commit**.
