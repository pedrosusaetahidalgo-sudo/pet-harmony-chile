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
| [audits/AUDITORIA_TOTAL_APP.md](audits/AUDITORIA_TOTAL_APP.md) | Auditoria multi-dominio (arq, DB, seguridad, UX, perf) | Despues de cada sesion de auditoria |
| [audits/AUDIT_2026_04_08.md](audits/AUDIT_2026_04_08.md) | Audit pre-hardening: rutas, nav, mobile, auth | Snapshot — crear nuevo si se re-audita |
| [audits/WALKTHROUGH_2026_04_08.md](audits/WALKTHROUGH_2026_04_08.md) | Walkthrough funcional: 2 personas (dueno + vet) | Snapshot — crear nuevo si se re-audita |
| [audits/RECOMENDACIONES_2026_04_08.md](audits/RECOMENDACIONES_2026_04_08.md) | Recomendaciones estrategicas 30/60/90 dias | Revisar cuando se complete un milestone |
| [audits/COMPETENCIA_2026_04_08.md](audits/COMPETENCIA_2026_04_08.md) | Analisis competitivo Chile | Cada 3-6 meses o cuando aparezca competidor nuevo |

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
