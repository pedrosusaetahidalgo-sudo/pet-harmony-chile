# Paw Friend -- Indice de documentacion viva

> Todos estos documentos deben mantenerse actualizados con cada cambio relevante.
> Si modificas rutas, navegacion, flujos, planes o features: actualiza el documento correspondiente.
> Ultima revision: 2026-04-30.

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
| [_archive/docs-raiz-snapshots-2026-04/SUGERENCIAS_COMPLETAS_2026_04_16.md](_archive/docs-raiz-snapshots-2026-04/SUGERENCIAS_COMPLETAS_2026_04_16.md) | (archivado 2026-04-28) Snapshot de 49 sugerencias 04-16, superado por AUDITORIA_PAWFRIEND_2026-04-27 | Histórico |

---

## Specs de features (propuestas, pendientes de implementar)

| Documento | Que contiene | Prioridad |
|---|---|---|
| [docs-specs/MICROCHIP_REGISTRO_NACIONAL.md](docs-specs/MICROCHIP_REGISTRO_NACIONAL.md) | Integracion registro nacional microchip | **Baja** -- Feature futuro |

**Specs ya ejecutadas (movidas a _archive/):**
- PLAN_DUAL_PROFILE — 100% ejecutado (ActiveRoleProvider + useActiveRole)
- COMPARTIR_FICHA_V2 — 100% implementado (pet-vet links + share)
- RUTINAS_Y_CALENDARIO_MASCOTA — 100% implementado (rutinas + calendario unificado)
- PAW_CARDS_COLLECTIBLE — 100% implementado (6 rarezas, flip, QR, holograficos)
- PAW_MISSIONS_ACHIEVEMENTS — 100% implementado (misiones + logros + paw points)
- FICHA_VET_VIEW_SPEC — 100% ejecutado (viewMode, VetActionsBar, VetFichaView, invitation handler)
- VET_PANEL_FICHA_REDESIGN — 100% ejecutado (PatientKPIBar, PatientCard, VetFichaView 2-col, VetVitalsCard)
- PROVIDER_LAYOUT_REDESIGN — 100% ejecutado (dashboard grid 2-col, MiniProfileCard, sidebar items, tabs perfil)
- VACUNAS_ANTIPARASITARIOS_SOFIA — 100% ejecutado (TabVacunas + TabAntiparasitarios + trigger auto-reminder)
- MEJORA_IMAGENES_AVATARES — 100% ejecutado (imageUtils con compressImage + upload propio + crop)
- CONSOLIDACION_FICHA_PDF_Y_DATOS_UNIFICADOS — 100% ejecutado (PDF v3 cronologico + ZIP v2)
- ADMIN_CONTROL_CENTER_V2 — 100% ejecutado (error_logs + telemetria + Admin Powerhouse + Pulso Diario)
- BOOKING_SYSTEM_OVERHAUL_PLAN — superseded por [docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md](docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md) (2026-04-21)

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
| 8 | [auditoria-e2e/](_pending/auditoria-e2e/) | Auditoría E2E onboardings pre-launch 1 junio 2026 (30 ONBDs + plan de lotes A-I en ejecución) | Alta — en curso |

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
| [docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md](docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md) | Plan maestro 2026-04-23: 3 fases (Fase 0 unificar eje 0-30d / Fase 1 nose print + paw passport 30-90d / Fase 2 monetización seguros+pharma+retail). 2.438 lineas. **FUENTE DE VERDAD** del refactor en curso | **Fase 0 ✅, Fase 1 §6 ✅, Fase 2 scaffolding ✅, Fase 3 §2.9 ✅, §14.bis acciones ✅ (al 2026-04-27)**. 14 migraciones aplicadas, 35+ edge fns, 6 admin paneles nuevos (Fase 1 KPIs, B2B keys, Correlations, Master KPIs, Project Health, Risk Monitor). Pendiente Pedro: rotar APIs + Vault + 7 crones pg_cron + test 4 mascotas DINOv2 nose-print. Ver [_pending/MANUAL_ACTIONS_PENDING_FASE_0.md](_pending/MANUAL_ACTIONS_PENDING_FASE_0.md) |
| [_pending/AUDITORIA_FEATURES_2026_04_27.md](_pending/AUDITORIA_FEATURES_2026_04_27.md) | Ejecucion §2.10 matriz de evaluacion: 9 pilares activos / 5 refactorizadas / 12 escondidas / 7 Fase 2 dormidas. 6 acciones derivadas | Activo — 1 accion (PRO_ANALYTICS gate) ya ejecutada 2026-04-27 |
| [docs-raiz/B2B_API_V1.md](docs-raiz/B2B_API_V1.md) | Documentacion del API B2B v1 (auth via X-Pawfriend-Api-Key + 4 endpoints + 3 tiers) | Listo, esperando primer deal. Onboarding flow `/aplicar?tipo=b2b_api` + `/b2b` portal + email automatico (commit d86f0af6) |
| [docs-raiz/PAW_SHIELD_DATA_ARCHIVE.md](docs-raiz/PAW_SHIELD_DATA_ARCHIVE.md) | Spec archivado de imagenes Paw Shield para entrenar modelo propio (consent ARCO + cron lifecycle 30d) | **Implementada 2026-04-29 (commit f180e5fe)** — falta Pedro aplicar mig 20260911 + deploy edge fn cleanup |
| [docs-raiz/PAW_SHIELD_PLAYBOOK.md](docs-raiz/PAW_SHIELD_PLAYBOOK.md) | Playbook estrategia Paw Shield · control costos Petify · features owner/vet/refugio | Activo. Pricing actualizado 3 tiers (Basic $0.50/Pro $0.75/Enterprise contact) |
| [docs-raiz/PAW_SHIELD_IDEAS_BANK.md](docs-raiz/PAW_SHIELD_IDEAS_BANK.md) | Banco de 24 ideas RICE-priorizadas para explotar biometria + breed_profile + pet_food_preferences | Activo, lista para implementar mañana |
| [docs-raiz/REVENUE_MASTER_PLAN_2026.md](docs-raiz/REVENUE_MASTER_PLAN_2026.md) | Plan revenue master 2026: 7 motores B2B + ARR Y1/Y3 conservador/optimista | **Codigo end-to-end de los 7 motores listo** (commit c19608b6 al 2026-04-30) — solo activacion comercial pendiente |
| [docs-raiz/BRAND_SYSTEM_2026.md](docs-raiz/BRAND_SYSTEM_2026.md) | Brand System 2026 consolidado: paletas (app + 11 pitches) + tipografia + logos + iconos + numeros canonicos compartidos | **NUEVO 2026-04-29** · Reemplaza `pawfriend-omnichannel-brand-assets-and-prompts.md` (archivado) y `BRAND_KIT_PITCHES.md` (marcado superseded) |
| [docs-raiz/ASSETS_GENERATION_PLAN.md](docs-raiz/ASSETS_GENERATION_PLAN.md) | Master ejecutable: prompts ready-to-paste por asset + IA recomendada + status de wire-up (sec 14) | **NUEVO 2026-04-29** · Companion ejecutable de BRAND_SYSTEM. La mayoria del backlog ya esta en `public/brand-assets/` (commit 700d8e70) |
| [_archive/docs-raiz-snapshots-2026-04/REFACTOR_ADOPCION_2026_04_24.md](_archive/docs-raiz-snapshots-2026-04/REFACTOR_ADOPCION_2026_04_24.md) | (archivado 2026-04-28) Sub-plan A+B+C+D+E flujo adopción ya 100% ejecutado | Histórico — ver flags `ADOPTION_UNIFIED_FEED` y `ADOPTION_PROCESSES_V1` |
| [docs-raiz/planes/PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md](docs-raiz/planes/PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md) | Plan maestro 2026-04-21: coherencia booking + preventive care + navegacion + adopciones + wiring + Beta Labs. 43 secciones + 15 apendices, evidencia linea por linea | Ejecutado 100% (Dia 1 + Dia 2 + Fase Final + Fase 6 archivados en `_archive/`) |
| [docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md](docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md) | Plan maestro booking 2026-04-21: 16 brechas. P0 (B2, B3, B8) ejecutados. B5-B16 (P1/P2) pendientes | Activo — P0 ejecutados, P1/P2 pendientes |
| [docs-raiz/planes/DOCUMENTS_AND_EMAILS_REDESIGN_MASTER_PLAN.md](docs-raiz/planes/DOCUMENTS_AND_EMAILS_REDESIGN_MASTER_PLAN.md) | Rediseno documental y emails: Fase 1 ejecutada (fundacion + 5 templates). Fases 2-4 pendientes | Activo — Fase 1 completa |
| [docs-raiz/planes/HUGGINGFACE_INTEGRATIONS_PLAN.md](docs-raiz/planes/HUGGINGFACE_INTEGRATIONS_PLAN.md) | Plan 4 fases integracion HF para bajar costos IA (Whisper, Donut, RMBG, bge-m3, Llama 3.2) | Activo — sin iniciar |
| [docs-raiz/planes/INSTAGRAM_IMPLEMENTATION_PLAN_PAWFRIEND.md](docs-raiz/planes/INSTAGRAM_IMPLEMENTATION_PLAN_PAWFRIEND.md) | Plan maestro Instagram @pawfriend.app (operacional, no codigo) | Activo — sin iniciar |
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
| [_archive/INVENTARIO_APP_2026_04_17.md](_archive/INVENTARIO_APP_2026_04_17.md) | Inventario de features funcionales (snapshot pre-Sprint 0/1, ver AUDITORIA_PAWFRIEND_2026-04-27.md sec 1) | Scope producto histórico |
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
