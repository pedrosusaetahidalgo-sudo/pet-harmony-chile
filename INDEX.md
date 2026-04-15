# Paw Friend -- Indice de documentacion viva

> Todos estos documentos deben mantenerse actualizados con cada cambio relevante.
> Si modificas rutas, navegacion, flujos, planes o features: actualiza el documento correspondiente.
> Ultima revision: 2026-04-14.

---

## Documentos vivos (SIEMPRE mantener actualizados)

| Documento | Que contiene | Cuando actualizar |
|---|---|---|
| [CLAUDE.md](CLAUDE.md) | Manual operativo -- fuente de verdad principal | Nuevas rutas, features, convenciones, edge functions |
| [MAPA_FUNCIONAL_COMPLETO.md](MAPA_FUNCIONAL_COMPLETO.md) | Mapa de cada modulo, archivos, flujo y oportunidades | Nuevas paginas, hooks, componentes, cambios de arquitectura |
| [AGENTS.md](AGENTS.md) | Config para agentes IA (Cursor, Copilot, etc.) | Cambios en stack, convenciones, estructura |
| [diagrams/FLUJO_COMPLETO.mmd](diagrams/FLUJO_COMPLETO.mmd) | Diagrama Mermaid end-to-end (fuente de verdad unica) | Cambios en navegacion, tabs, sidebar, auth, rutas |
| [diagrams/FLUJOS_MERMAID.md](diagrams/FLUJOS_MERMAID.md) | Diagramas individuales por modulo | Cambios en un flujo especifico (pagos, ficha, reservas, etc.) |
| [README.md](README.md) | Presentacion del proyecto + stack + setup | Cambios en stack, comandos, estructura |

---

## Auditorias y reportes

| Documento | Que contiene | Cuando actualizar |
|---|---|---|
| [audits/CONTEXTO_REVISION_COMPLETA.txt](audits/CONTEXTO_REVISION_COMPLETA.txt) | Snapshot tecnico completo (432 archivos, 26 fns, 139 mig, 65 rutas) | Cada sesion de auditoria mayor |
| [audits/AUDITORIA_UX_COMPLETA_2026_04_14.md](audits/AUDITORIA_UX_COMPLETA_2026_04_14.md) | Auditoria UX completa con severidad por item | Despues de cambios UX grandes |
| [audits/FEATURES_INCOMPLETAS_2026_04_14.md](audits/FEATURES_INCOMPLETAS_2026_04_14.md) | 28 features con gaps detectados | Cuando se completen features |
| [audits/OPTIMIZACION_COSTOS_2026_04_12.md](audits/OPTIMIZACION_COSTOS_2026_04_12.md) | Analisis de costos operativos + plan de eficiencia | Cuando cambien edge functions o infra de costos |
| [audits/FEEDBACK_VET_SOFIA_2026_04_13.md](audits/FEEDBACK_VET_SOFIA_2026_04_13.md) | Feedback de vet beta tester (Sofia) | Despues de cada sesion con Sofia |
| [audits/COMPETENCIA_2026_04_08.md](audits/COMPETENCIA_2026_04_08.md) | Analisis competitivo Chile | Cada 3-6 meses o cuando aparezca competidor nuevo |
| [audits/CROSS_PLATFORM_COMPATIBILITY.md](audits/CROSS_PLATFORM_COMPATIBILITY.md) | Compatibilidad multiplataforma (iOS, Android, Web, Chrome) | Cada cambio de CSS/JS moderno o API de browser |
| [audits/CONSOLIDADO_QA_2026_04_15.md](audits/CONSOLIDADO_QA_2026_04_15.md) | Consolidado UX audit + console errors + QA Pedro (P0-P3 priorizado) | Despues de cada sesion QA |

---

## Specs de features (propuestas, pendientes de implementar)

| Documento | Que contiene | Prioridad |
|---|---|---|
| [docs-specs/CONSOLIDACION_FICHA_PDF_Y_DATOS_UNIFICADOS.md](docs-specs/CONSOLIDACION_FICHA_PDF_Y_DATOS_UNIFICADOS.md) | PDF profesional cronologico + deduplicacion mascotas + sync datos | **Alta** -- Toca joya de la corona + integridad de datos |
| [docs-specs/ANALISIS_PREMIUM_VS_FREE.md](docs-specs/ANALISIS_PREMIUM_VS_FREE.md) | Analisis de que features deben ser free vs premium + plan de ejecucion | **Alta** -- Define monetizacion |
| [docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md](docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md) | Roadmap de features nuevas: breeding, banco de sangre, mapa pet friendly, seguros | **Alta** -- Documento maestro de roadmap |
| [docs-specs/FICHA_VET_VIEW_SPEC.md](docs-specs/FICHA_VET_VIEW_SPEC.md) | Vista ficha clinica desde perspectiva vet | **Alta** -- UX veterinario |
| [docs-specs/ADMIN_CONTROL_CENTER_V2.md](docs-specs/ADMIN_CONTROL_CENTER_V2.md) | Centro de control admin v2 | **Media** -- Admin expandido |
| [docs-specs/AUDIO_CONSULTA_VET.md](docs-specs/AUDIO_CONSULTA_VET.md) | Transcripcion IA en vivo de consultas veterinarias | **Media** -- Diferenciador B2B, requiere infra IA |
| [docs-specs/PROPUESTA_SIDEBAR_PROVIDER.md](docs-specs/PROPUESTA_SIDEBAR_PROVIDER.md) | Propuesta sidebar proveedor | **Media** -- UX provider |
| [docs-specs/UPGRADE_TOGGLE_ROLE.md](docs-specs/UPGRADE_TOGGLE_ROLE.md) | Toggle de rol dueno/vet | **Media** -- UX dual-role |

**Specs ya ejecutadas (movidas a _archive/):**
- PLAN_DUAL_PROFILE — 100% ejecutado (ActiveRoleProvider + useActiveRole)
- COMPARTIR_FICHA_V2 — 100% implementado (pet-vet links + share)
- RUTINAS_Y_CALENDARIO_MASCOTA — 100% implementado (rutinas + calendario unificado)
- PAW_CARDS_COLLECTIBLE — 100% implementado (6 rarezas, flip, QR, holograficos)
- PAW_MISSIONS_ACHIEVEMENTS — 100% implementado (misiones + logros + paw points)

---

## Guias de diseno

| Documento | Que contiene |
|---|---|
| [docs-design/PAW_CARDS_TCG_DESIGN.md](docs-design/PAW_CARDS_TCG_DESIGN.md) | Guia de diseno visual Paw Cards TCG (rarezas, holograficos, anatomia de carta, animaciones) |

---

## Pendientes por ejecutar (_pending/)

> Ver [_pending/README.md](_pending/README.md) para el indice completo con estados y prioridades.

Resumen de items activos:

| # | Documento | Tipo | Prioridad |
|---|---|---|---|
| 1 | [ROTAR_API_KEYS.md](_pending/ROTAR_API_KEYS.md) | Runbook seguridad | Alta |
| 2 | [CONSOLIDACION_MOBILE.md](_pending/CONSOLIDACION_MOBILE.md) | Mobile Capacitor | Alta |
| 3 | [INTEGRACIONES_SETUP.md](_pending/INTEGRACIONES_SETUP.md) | WhatsApp/Google setup | Alta |
| 4 | [map-redesign-blueprint.md](_pending/map-redesign-blueprint.md) | Blueprint | Media |
| 5 | [BASE_DATOS_PARTNERS_CHILE.md](_pending/BASE_DATOS_PARTNERS_CHILE.md) | Data | Media |
| 6 | [PARTNERS_ONBOARDING.md](_pending/PARTNERS_ONBOARDING.md) | Onboarding partners | Media |
| 7 | [testing-virtual-user-blueprint.md](_pending/testing-virtual-user-blueprint.md) | Testing Playwright | Media |
| 8 | [FEATURE_AI_WEB_SEARCH_UPGRADE.md](_pending/features/FEATURE_AI_WEB_SEARCH_UPGRADE.md) | Feature | Media |

---

## Documentos operacionales (creados 2026-04-14)

| Documento | Que contiene |
|---|---|
| [docs/ROADMAP_90_DIAS.md](docs/ROADMAP_90_DIAS.md) | 18 items priorizados en 4 fases con North Star metrics |
| [docs/CHECKLIST_OPERACION_DIARIA.md](docs/CHECKLIST_OPERACION_DIARIA.md) | Checklist de 10-15 min para operacion diaria |
| [docs/RITUAL_WEEKLY_OPS.md](docs/RITUAL_WEEKLY_OPS.md) | Revision semanal de KPIs, errores y feedback |
| [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md) | Flujo de release, checklist y versionado |
| [docs/FEATURE_FLAGS.md](docs/FEATURE_FLAGS.md) | 9 feature flags documentados con reglas |
| [docs/MOCKS_MAP.md](docs/MOCKS_MAP.md) | Auditoria de datos ficticios (95%+ limpio) |
| [docs/PERFORMANCE_BUDGET.md](docs/PERFORMANCE_BUDGET.md) | Web Vitals targets y bundle limits |
| [docs/JOURNEYS_UX.md](docs/JOURNEYS_UX.md) | Journeys dueno, vet y admin con pantallas clave |
| [docs/EDGE_FUNCTIONS_MAP.md](docs/EDGE_FUNCTIONS_MAP.md) | Mapa de 26 edge functions + 6 helpers compartidos |
| [docs/ARQUITECTURA_RESUMEN.md](docs/ARQUITECTURA_RESUMEN.md) | Capas, entry points, modelo de datos, roles |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guia para colaboradores (setup, comandos, convenciones) |
| [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) | Checklist para PRs |

---

## Cross-platform y stores (creados 2026-04-15)

| Documento | Que contiene |
|---|---|
| [docs/PLAN_EJECUCION_CROSSPLATFORM_2026_04_15.md](docs/PLAN_EJECUCION_CROSSPLATFORM_2026_04_15.md) | Plan maestro de ejecucion: 9 fases priorizadas con dependencias |
| [docs/PLAN_CROSSPLATFORM_STORES_HARDENING_REPORT.md](docs/PLAN_CROSSPLATFORM_STORES_HARDENING_REPORT.md) | Reporte de auditoria con scorecard por area |
| [docs/MOBILE_LAYOUT_ISSUES_MATRIX.md](docs/MOBILE_LAYOUT_ISSUES_MATRIX.md) | 15 issues de layout mobile con severidad y viewport |
| [docs/CAPACITOR_COMPATIBILITY_AUDIT.md](docs/CAPACITOR_COMPATIBILITY_AUDIT.md) | Auditoria de plugins, permisos, config nativa |
| [docs/APP_STORE_CHECKLIST.md](docs/APP_STORE_CHECKLIST.md) | 33 criterios verde/amarillo/rojo para iOS |
| [docs/PLAY_STORE_CHECKLIST.md](docs/PLAY_STORE_CHECKLIST.md) | 44 criterios verde/amarillo/rojo para Android |
| [docs/MOBILE_QA_TEST_MATRIX.md](docs/MOBILE_QA_TEST_MATRIX.md) | 54 tests funcionales con instrucciones por plataforma |

---

## Planes ejecutados (2026-04-14)

| Plan | Estado |
|---|---|
| Perfeccionamiento clinico/premium | Aplicado |
| Roles y experiencias dueno vs proveedor | Aplicado |
| Mascota huerfana re-claim | Aplicado |
| Limpieza de mocks y datos falsos | Aplicado |
| Auditoria backend (Supabase + Edge Functions) | Aplicado |
| Operacion y crecimiento 90 dias | Aplicado |
| Optimizacion avanzada (performance, DX) | Aplicado |
| Plan Social (reviews, likes, chat) | Aplicado |
| Plan UX/UI Next Level | Aplicado |
| Plan Edge Functions Pro | Aplicado |
| Plan de Cierre y Hardening | Aplicado |

---

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

## Archivo (_archive/)

Documentos ya ejecutados o superados. Conservan valor historico pero no son accionables.

| Documento | Razon de archivo |
|---|---|
| `MASTER_UPGRADE_2026_04.md` | 100% ejecutado (fases 0-8 cerradas) |
| `PAW_FRIEND_V1_1_END_TO_END.md` | Superado por REPORTE_CONSOLIDADO |
| `CONTEXTO_2026_04_11.md` | Snapshot historico, superado por reporte consolidado |
| `ESTRATEGIA_MVP_2026.md` | Estrategia ejecutada, integrada en CLAUDE.md |
| `GUION_PITCH_VETS_60S.md` | Guion de ventas historico |
| `AUDITORIA_TOTAL_APP.md` | Superada por REPORTE_CONSOLIDADO_2026_04_11 |
| `AUDIT_2026_04_08.md` | Superada por REPORTE_CONSOLIDADO_2026_04_11 |
| `WALKTHROUGH_2026_04_08.md` | Superada por REPORTE_CONSOLIDADO_2026_04_11 |
| `RECOMENDACIONES_2026_04_08.md` | Ejecutadas parcialmente, integradas en _pending/ |
| `landing-redesign-blueprint.md` | Ejecutado en commit fc48e94 |
| `feed-redesign-blueprint.md` | 14 componentes + 6 hooks implementados |
| `REDISENO_DASHBOARD_PROVIDER.md` | Dashboard reescrito (commit 939576e) |
| `FEATURE_MEDICAL_PDF_UPGRADE.md` | Logo, verificacion, word-wrap implementados |
| `BUG_FICHA_CLINICA_PDF_URL.md` | Fix ejecutado |
| `BUG_GROOMERS_GRADIENT_CRASH.md` | Fix confirmado |
| `AUDIT_SIDEBAR_PANELS.md` | Sidebar reorganizado |
| `AUDIT_LOVABLE_LEGACY.md` | Limpieza legacy completada |
| `embedded-analytics-options.md` | Opciones evaluadas, decision tomada |
| `pro-analytics-monetization-plan.md` | Plan integrado en pricing actual |
| `PLAN_DUAL_PROFILE.md` | 100% ejecutado (ActiveRoleProvider + useActiveRole) |
| `COMPARTIR_FICHA_V2.md` | 100% implementado (pet-vet links + share) |
| `VISTAS_ROLES_Y_PLANES.md` | 100% implementado |
| `RUTINAS_Y_CALENDARIO_MASCOTA.md` | 100% implementado |
| `PAW_CARDS_COLLECTIBLE.md` | 100% implementado (6 rarezas, flip, QR) |
| `PAW_MISSIONS_ACHIEVEMENTS.md` | 100% implementado |
| `REDISENO_MY_PETS_CARDS.md` | Ejecutado |
| `REVISION_PROVIDER_PROFILE_EDIT.md` | Ejecutado |
| `REPORTE_CONSOLIDADO_2026_04_11.md` | Superado por auditorias 2026-04-14 |

---

## Carpeta junk/ (eliminada del repo)

La carpeta `junk/` fue eliminada del tracking de git el 2026-04-14. Contenia 62 archivos legacy de la era Lovable/pre-Claude sin valor accionable. Esta en `.gitignore` para evitar re-commit accidental. Los archivos permanecen en el historial de git si se necesitan.

---

## Regla de oro

> Si cambias algo que afecta como el usuario navega, paga, o interactua con la app:
> **actualiza el documento correspondiente en el mismo commit**.
