# Paw Friend -- Indice de documentacion viva

> Todos estos documentos deben mantenerse actualizados con cada cambio relevante.
> Si modificas rutas, navegacion, flujos, planes o features: actualiza el documento correspondiente.
> Ultima revision: 2026-04-18.

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
| [audits/CONTEXTO_REVISION_COMPLETA.txt](audits/CONTEXTO_REVISION_COMPLETA.txt) | Snapshot tecnico completo (464 archivos, 28 fns, 156 mig, 67 rutas) | Cada sesion de auditoria mayor |
| [audits/AUDITORIA_UX_COMPLETA_2026_04_14.md](audits/AUDITORIA_UX_COMPLETA_2026_04_14.md) | Auditoria UX completa con severidad por item | Despues de cambios UX grandes |
| [audits/FEATURES_INCOMPLETAS_2026_04_14.md](audits/FEATURES_INCOMPLETAS_2026_04_14.md) | 28 features con gaps detectados | Cuando se completen features |
| [audits/OPTIMIZACION_COSTOS_2026_04_12.md](audits/OPTIMIZACION_COSTOS_2026_04_12.md) | Analisis de costos operativos + plan de eficiencia | Cuando cambien edge functions o infra de costos |
| [audits/FEEDBACK_VET_SOFIA_2026_04_13.md](audits/FEEDBACK_VET_SOFIA_2026_04_13.md) | Feedback de vet beta tester (Sofia) | Despues de cada sesion con Sofia |
| [audits/COMPETENCIA_2026_04_08.md](audits/COMPETENCIA_2026_04_08.md) | Analisis competitivo Chile | Cada 3-6 meses o cuando aparezca competidor nuevo |
| [audits/CROSS_PLATFORM_COMPATIBILITY.md](audits/CROSS_PLATFORM_COMPATIBILITY.md) | Compatibilidad multiplataforma (iOS, Android, Web, Chrome) | Cada cambio de CSS/JS moderno o API de browser |
| [docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md](docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md) | 49 sugerencias en 10 categorias (seguridad, perf, UX, DB, testing, etc.) | Cada sesion de auditoria |

---

## Specs de features (propuestas, pendientes de implementar)

| Documento | Que contiene | Prioridad |
|---|---|---|
| [docs-specs/CONSOLIDACION_FICHA_PDF_Y_DATOS_UNIFICADOS.md](docs-specs/CONSOLIDACION_FICHA_PDF_Y_DATOS_UNIFICADOS.md) | PDF profesional cronologico + deduplicacion mascotas + sync datos | **Alta** -- Toca joya de la corona + integridad de datos |
| [docs-specs/ADMIN_CONTROL_CENTER_V2.md](docs-specs/ADMIN_CONTROL_CENTER_V2.md) | Centro de control admin v2 | **Media** -- Admin expandido |
| [docs-specs/MEJORA_IMAGENES_AVATARES.md](docs-specs/MEJORA_IMAGENES_AVATARES.md) | Optimizacion de avatares e imagenes | **Media** -- Performance |
| [docs-specs/MICROCHIP_REGISTRO_NACIONAL.md](docs-specs/MICROCHIP_REGISTRO_NACIONAL.md) | Integracion registro nacional microchip | **Baja** -- Feature futuro |
| [docs-specs/BOOKING_SYSTEM_OVERHAUL_PLAN.md](docs-specs/BOOKING_SYSTEM_OVERHAUL_PLAN.md) | Plan maestro rediseno sistema reservas/citas (owner + vet + admin), 4 fases | **Alta** -- Cita es fuente de ficha clinica + motor B2B Premium |

**Specs ya ejecutadas (movidas a _archive/):**
- PLAN_DUAL_PROFILE — 100% ejecutado (ActiveRoleProvider + useActiveRole)
- COMPARTIR_FICHA_V2 — 100% implementado (pet-vet links + share)
- RUTINAS_Y_CALENDARIO_MASCOTA — 100% implementado (rutinas + calendario unificado)
- PAW_CARDS_COLLECTIBLE — 100% implementado (6 rarezas, flip, QR, holograficos)
- PAW_MISSIONS_ACHIEVEMENTS — 100% implementado (misiones + logros + paw points)
- FICHA_VET_VIEW_SPEC — 100% ejecutado (viewMode, VetActionsBar, VetFichaView, invitation handler)
- VET_PANEL_FICHA_REDESIGN — 100% ejecutado (PatientKPIBar, PatientCard, VetFichaView 2-col, VetVitalsCard)
- PROVIDER_LAYOUT_REDESIGN — 100% ejecutado (dashboard grid 2-col, MiniProfileCard, sidebar items, tabs perfil)

---

## Guias de diseno

| Documento | Que contiene |
|---|---|
| [docs-design/PAW_CARDS_TCG_DESIGN.md](docs-design/PAW_CARDS_TCG_DESIGN.md) | Guia de diseno visual Paw Cards TCG (rarezas, holograficos, anatomia de carta, animaciones) |
| [docs-raiz/marketing/PAWFRIEND_LANDING_IMMERSIVE_MASTERPLAN.md](docs-raiz/marketing/PAWFRIEND_LANDING_IMMERSIVE_MASTERPLAN.md) | Masterplan exhaustivo del rediseno landing v3 (24 secciones + apendices). Ejecutado 2026-04-18: nueva estructura `src/components/landing/`, video real en hero, copy alineado a modelo post-pivot, footer rico, `/faq` separado |

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
| 6 | [testing-virtual-user-blueprint.md](_pending/testing-virtual-user-blueprint.md) | Testing Playwright | Media |
| 7 | [FEATURE_AI_WEB_SEARCH_UPGRADE.md](_pending/features/FEATURE_AI_WEB_SEARCH_UPGRADE.md) | Feature | Media |
| 8 | [PLAN_ADOPCION_CENTROS_2026_04_20.md](_pending/PLAN_ADOPCION_CENTROS_2026_04_20.md) | Refugios como onboarding inicial (ejecutado 2026-04-20) | Completado |
| 9 | [auditoria-e2e/](_pending/auditoria-e2e/) | Auditoría E2E onboardings pre-launch 1 junio 2026 (30 ONBDs + plan de lotes A-I en ejecución) | Alta — en curso |

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
| [docs/EDGE_FUNCTIONS_MAP.md](docs/EDGE_FUNCTIONS_MAP.md) | Mapa de 28 edge functions + 6 helpers compartidos |
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

## Plan activo

| Documento | Que contiene | Estado |
|---|---|---|
| [docs-raiz/planes/PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md](docs-raiz/planes/PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md) | Plan maestro 2026-04-21: coherencia booking + preventive care + navegacion + adopciones + wiring + Beta Labs. 43 secciones + 15 apendices, evidencia linea por linea | Activo — Dia 1 ejecutado |
| [docs-raiz/planes/EJECUCION_COHERENCE_PLAN_DIA_1.md](docs-raiz/planes/EJECUCION_COHERENCE_PLAN_DIA_1.md) | Ejecucion Dia 1 del plan: Fase 0 hotfixes + Fase 1 navegacion + Fase 2 preventive care. 3 migraciones aplicadas + deploy 9 edge fns | Completado |
| [docs-raiz/planes/SMOKE_TEST_COHERENCE_DIA_1.sql](docs-raiz/planes/SMOKE_TEST_COHERENCE_DIA_1.sql) | Smoke test SQL (8 checks) para validar las 3 migraciones Dia 1 en prod | Activo |
| [docs-raiz/planes/EJECUCION_COHERENCE_PLAN_DIA_2.md](docs-raiz/planes/EJECUCION_COHERENCE_PLAN_DIA_2.md) | Ejecucion Dia 2: Fase 3 wiring notifs + Fase 4 optimistic updates booking + Fase 5 tab Prevenciones | Completado |
| [docs-raiz/planes/SMOKE_TEST_COHERENCE_DIA_2.sql](docs-raiz/planes/SMOKE_TEST_COHERENCE_DIA_2.sql) | Smoke test SQL (6 checks) para validar wiring notifs post re-deploy edge fns | Activo |
| [docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md](docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md) | 49 sugerencias en 10 categorias con plan de ejecucion de 4 semanas | Activo |
| [docs-raiz/operacion/PENDIENTES_MANUALES.md](docs-raiz/operacion/PENDIENTES_MANUALES.md) | Items que requieren trabajo manual (assets, stores, verificaciones) | Activo |

---

## Inversionistas y partners

> Set consolidado para data room, pitch y reuniones con fondos / CORFO / Start-Up Chile.
> **Folder dedicado**: [pitch-inversionistas/](pitch-inversionistas/) con presentacion HTML bonita + MDs por audiencia.
>
> **🔗 Enlaces publicos (enviar por email/WhatsApp/LinkedIn)** — deployed en `pawfriend.cl/pitch/`:
> - Landing con los 4 → https://pawfriend.cl/pitch/
> - Inversionistas → https://pawfriend.cl/pitch/inversionistas.html
> - Paw Companys (empresas sponsor) → https://pawfriend.cl/pitch/companys.html
> - Paw Partners (tiendas / barter) → https://pawfriend.cl/pitch/partners.html
> - Paw Voices (creadores) → https://pawfriend.cl/pitch/voices.html
>
> Fuente editable: [public/pitch/](public/pitch/) — **NO TOCAR manualmente sin autorizacion**, ver [public/pitch/README.md](public/pitch/README.md). Registrados en [docs-vivos/README.md](docs-vivos/README.md).
>
> **🎯 Outreach a prospectos reales**: carpeta [docs-raiz/marketing/outreach/](docs-raiz/marketing/outreach/) con estrategia "Paw Fundadores" + 3 propuestas personalizadas (ManpowerGroup, Gildemeister, 3 creators).
>
> **📊 Sample dashboard** (adjuntar a correos corporativos): https://pawfriend.cl/pitch/sample-dashboard.html

| Documento | Que contiene | Uso |
|---|---|---|
| [pitch-inversionistas/PRESENTACION.html](pitch-inversionistas/PRESENTACION.html) | **Presentacion visual** autocontenida con paleta Paw Friend (morado brand + dorado + verde medical). Imprimible a PDF | Reunion en vivo o PDF para envio |
| [pitch-inversionistas/CONSOLIDADO_INVERSIONISTAS.md](pitch-inversionistas/CONSOLIDADO_INVERSIONISTAS.md) | Fuente de verdad unificada: narrativa emocional + datos + todas las secciones | Deep read + preparacion de pitch |
| [pitch-inversionistas/01_CORFO_SSAF-I.md](pitch-inversionistas/01_CORFO_SSAF-I.md) | Postulacion CORFO SSAF-I (USD $28K) con ejes de innovacion, impacto, exportacion | CORFO |
| [pitch-inversionistas/02_START_UP_CHILE.md](pitch-inversionistas/02_START_UP_CHILE.md) | Postulacion Start-Up Chile Ignite (USD $15K equity-free) con foco impacto CL | Start-Up Chile |
| [pitch-inversionistas/03_PAW_COMPANYS_EMPRESAS.md](pitch-inversionistas/03_PAW_COMPANYS_EMPRESAS.md) | Pitch B2B2C para empresas pet-friendly + carta de intro + lista prospects + FAQ | Outreach sponsors |
| [pitch-inversionistas/04_ANGELES_VC_LATAM.md](pitch-inversionistas/04_ANGELES_VC_LATAM.md) | Pitch pre-seed USD $150K SAFE + preguntas incomodas preparadas + lista angels Tier 1-3 | Platanus, Magma, Kaszek |
| [docs-raiz/pitch/PITCH_DECK.md](docs-raiz/pitch/PITCH_DECK.md) | 13 slides narrativos originales con notas fundador | Fuente narrativa original |
| [docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md](docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md) | Output 2 meses vs equipo expertos: 320 hrs = ~4.800 hrs = USD 720K-1,44M | Evidencia velocidad/eficiencia |
| [docs-raiz/pitch/CONSOLIDADO_2026_04_18.md](docs-raiz/pitch/CONSOLIDADO_2026_04_18.md) | Snapshot tecnico verificado (tsc, lint, tests, build) | Evidencia tecnica data room |
| [INVENTARIO_APP_2026_04_17.md](INVENTARIO_APP_2026_04_17.md) | Inventario de features funcionales | Scope producto |
| [sales/PITCH_VET_CORTO.md](sales/PITCH_VET_CORTO.md) | Pitch comercial 1-pager para clinicas | Outbound B2B vets |

---

## Planes ejecutados (hasta 2026-04-15)

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
| `PLAN_EJECUCION_AUDITORIA_2026_04_15.md` | Superado por PLAN_MEJORA_INTEGRAL (127 issues vs 67) |
| `PARTNERS_ONBOARDING_COMPLETE_2026_04_13.md` | 100% ejecutado (landing, emails, migracion, admin, FAQ) |
| `ROADMAP_IDEAS_FUTURE.md` | Ideas visionarias, no activas — conservado como referencia |
| `SPEC_AUDIO_CONSULTA_PENDING.md` | Requiere infra IA externa, no iniciado |
| `SIDEBAR_PROVIDER_IMPLEMENTED.md` | Sidebar ya implementado en codigo |
| `PLAN_MEJORA_INTEGRAL_2026_04_15.md` | 127 issues, superado por SUGERENCIAS_COMPLETAS_2026_04_16 |
| `PLAN_PROXIMO.md` | Plan proximo, superado por SUGERENCIAS_COMPLETAS_2026_04_16 |
| `ADMIN-DASHBOARD-SPEC.md` | Spec de admin dashboard, ejecutado |
| `AI-QUALITY-AUDIT.md` | Auditoria IA, superada por sugerencias consolidadas |
| `PLAN_RESERVAS.md` | Sistema reservas V2, ejecutado (booking system V2 en produccion) |
| `ANALISIS_PREMIUM_VS_FREE.md` | Premium/Free, ejecutado (pricing activo) |
| `UPGRADE_TOGGLE_ROLE.md` | Toggle role, ejecutado (ActiveRoleProvider) |
| `CONSOLIDADO_QA_2026_04_15.md` | QA consolidado, superado |
| `QA_MANUAL_2026_04_15.md` | QA manual, superado |

---

## Carpeta junk/ (eliminada del repo)

La carpeta `junk/` fue eliminada del tracking de git el 2026-04-14. Contenia 62 archivos legacy de la era Lovable/pre-Claude sin valor accionable. Esta en `.gitignore` para evitar re-commit accidental. Los archivos permanecen en el historial de git si se necesitan.

---

## Regla de oro

> Si cambias algo que afecta como el usuario navega, paga, o interactua con la app:
> **actualiza el documento correspondiente en el mismo commit**.
