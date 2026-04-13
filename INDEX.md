# Paw Friend -- Indice de documentacion viva

> Todos estos documentos deben mantenerse actualizados con cada cambio relevante.
> Si modificas rutas, navegacion, flujos, planes o features: actualiza el documento correspondiente.
> Ultima revision: 2026-04-12.

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
| [audits/REPORTE_CONSOLIDADO_2026_04_11.md](audits/REPORTE_CONSOLIDADO_2026_04_11.md) | Fuente de verdad del estado tecnico al 2026-04-11 | Despues de cada sesion de auditoria mayor |
| [audits/OPTIMIZACION_COSTOS_2026_04_12.md](audits/OPTIMIZACION_COSTOS_2026_04_12.md) | Analisis de costos operativos + plan de eficiencia (Anthropic, WhatsApp, Realtime) | Cuando cambien edge functions o infra de costos |
| [audits/COMPETENCIA_2026_04_08.md](audits/COMPETENCIA_2026_04_08.md) | Analisis competitivo Chile | Cada 3-6 meses o cuando aparezca competidor nuevo |
| [audits/CROSS_PLATFORM_COMPATIBILITY.md](audits/CROSS_PLATFORM_COMPATIBILITY.md) | Compatibilidad multiplataforma (iOS, Android, Web, Chrome) | Cada cambio de CSS/JS moderno o API de browser |

---

## Specs de features (propuestas, pendientes de implementar)

| Documento | Que contiene | Prioridad |
|---|---|---|
| [PLAN_DUAL_PROFILE.md](PLAN_DUAL_PROFILE.md) | Sistema de perfil dual dueno/veterinario -- toggle, guards, onboarding | **Alta** -- Aprobado, listo para implementar |
| [docs-specs/COMPARTIR_FICHA_V2.md](docs-specs/COMPARTIR_FICHA_V2.md) | Vinculacion directa vet-mascota con aceptar/rechazar. Reemplaza tokens temporales | **Alta** -- Toca la joya de la corona (ficha clinica) |
| [docs-specs/ANALISIS_PREMIUM_VS_FREE.md](docs-specs/ANALISIS_PREMIUM_VS_FREE.md) | Analisis de que features deben ser free vs premium + plan de ejecucion | **Alta** -- Define monetizacion |
| [docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md](docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md) | Roadmap de features nuevas: breeding, banco de sangre, mapa pet friendly, seguros, adopcion mejorada, revision monetizacion, onboarding mejorado | **Alta** -- Documento maestro de roadmap |
| [docs-specs/AUDIO_CONSULTA_VET.md](docs-specs/AUDIO_CONSULTA_VET.md) | Transcripcion IA en vivo de consultas veterinarias | **Media** -- Diferenciador B2B, requiere infra IA |
| [docs-specs/RUTINAS_Y_CALENDARIO_MASCOTA.md](docs-specs/RUTINAS_Y_CALENDARIO_MASCOTA.md) | Rutinas semanales recurrentes + calendario unificado por mascota | **Media** -- Mejora retention, no bloquea nada |

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
| 3 | [dual-role-toggle-blueprint.md](_pending/dual-role-toggle-blueprint.md) | Blueprint | Media |
| 4 | [profile-redesign-blueprint.md](_pending/profile-redesign-blueprint.md) | Blueprint | Media |
| 5 | [REVISION_PROVIDER_PROFILE_EDIT.md](_pending/REVISION_PROVIDER_PROFILE_EDIT.md) | Audit + fix | Media |
| 6 | [REDISENO_MY_PETS_CARDS.md](_pending/REDISENO_MY_PETS_CARDS.md) | Blueprint | Media |
| 7 | [map-redesign-blueprint.md](_pending/map-redesign-blueprint.md) | Blueprint | Media |
| 8 | [BASE_DATOS_PARTNERS_CHILE.md](_pending/BASE_DATOS_PARTNERS_CHILE.md) | Data | Media |
| 9 | [FEATURE_AI_WEB_SEARCH_UPGRADE.md](_pending/features/FEATURE_AI_WEB_SEARCH_UPGRADE.md) | Feature | Media |

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

---

## Carpeta junk/ (legacy)

Contiene 57 archivos legacy de la era Lovable/pre-Claude. **No tienen valor accionable.** Se conservan temporalmente como referencia historica. Incluyen: contextos viejos, auditorias previas, credenciales template, planes de refactor ejecutados, prompts obsoletos.

> Recomendacion: eliminar `junk/` completa cuando el proyecto pase a produccion estable.

---

## Regla de oro

> Si cambias algo que afecta como el usuario navega, paga, o interactua con la app:
> **actualiza el documento correspondiente en el mismo commit**.
