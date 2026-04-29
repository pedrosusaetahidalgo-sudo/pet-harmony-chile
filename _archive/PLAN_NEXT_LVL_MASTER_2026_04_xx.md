# PLAN_NEXT_LEVEL_MASTER.md

> Objetivo:
> Ejecutar una revisión y mejora integral del proyecto para llevarlo al siguiente nivel en arquitectura,
> UX/UI, performance, testing, seguridad, analítica, responsive, documentación y preparación de release,
> usando Claude Code como agente principal de análisis, planificación y, cuando corresponda, implementación.

## Rol que debes asumir

Actúa como una combinación de:

- Principal Engineer
- Staff Product Engineer
- Security Architect
- Performance Engineer
- QA Lead
- Head of Product Design
- Release Manager
- Growth/Product Analytics Lead

Tu misión es operar sobre ESTE repositorio como si fueras el líder técnico integral del producto.

No quiero un análisis superficial.
Quiero una revisión real, profunda, accionable y orientada a mejoras concretas del proyecto.

---

## Modo de trabajo obligatorio

### Reglas generales

1. Primero explora el repositorio completo y construye un mapa mental real del sistema.
2. Usa **Plan Mode** para cambios grandes, ambiguos o multiarchivo.
3. Si un cambio toca 3 o más archivos, o afecta arquitectura, auth, data flow, edge functions o diseño sistémico, planifica antes de editar.
4. Antes de modificar algo importante, explícame:
   - qué detectaste,
   - por qué importa,
   - qué vas a cambiar,
   - qué riesgo tiene.
5. Evita cambios impulsivos o “creative drift”.
6. No inventes comportamientos del sistema; si algo no está claro, infiérelo con cautela y pregúntame si hace falta.
7. Prefiere cambios incrementales, verificables y reversibles.
8. Si encuentras deuda técnica importante, documéntala aunque no la resuelvas en esta pasada.
9. Si detectas algo frágil pero no estás 100 % seguro de tocarlo, propón primero y espera confirmación.
10. Mantén siempre foco en producto real, no en refactors cosméticos sin impacto.

---

## Contexto del producto

Completa esto usando el código real del repositorio y corrígelo si hace falta:

- Nombre del producto:
- Qué problema resuelve:
- Usuario principal:
- Usuario secundario:
- Stack principal:
- Frontend:
- Backend:
- Base de datos:
- Auth:
- Edge/serverless functions:
- Integraciones externas:
- Flujos críticos:
- Riesgos actuales:
- Estado de madurez del producto:

Guarda esto como:

- `docs/PROJECT_SNAPSHOT_CURRENT.md`

---

## Entregables obligatorios

Debes producir y/o actualizar estos archivos Markdown dentro del repo:

- `docs/PROJECT_SNAPSHOT_CURRENT.md`
- `docs/PROJECT_MAP.md`
- `docs/CLAUDE_AUDIT_MASTER.md`
- `docs/ARCHITECTURE_REFACTOR_PLAN.md`
- `docs/UX_UI_NEXT_LEVEL_AUDIT.md`
- `docs/PERFORMANCE_EDGE_DB_AUDIT.md`
- `docs/SECURITY_AUTH_AUDIT.md`
- `docs/TESTING_E2E_MATRIX.md`
- `docs/ANALYTICS_GROWTH_EVENTS.md`
- `docs/RESPONSIVE_ACCESSIBILITY_AUDIT.md`
- `docs/RELEASE_READINESS_REPORT.md`
- `docs/CHANGELOG_PROPOSED.md`

Si alguno ya existe, actualízalo inteligentemente en lugar de duplicarlo.

---

## Fase 1 — Mapa real del proyecto

Analiza el repo y crea un mapa técnico del sistema.

### Debes identificar:

- estructura de carpetas,
- dominios funcionales,
- componentes compartidos,
- hooks/utilidades,
- servicios,
- modelos de datos,
- tablas y relaciones,
- políticas/RLS si existen,
- edge functions,
- flujos frontend ↔ backend,
- integraciones externas,
- configuraciones sensibles,
- scripts relevantes de package.json,
- tests existentes,
- puntos de entrada principales.

### Entregable

Crear `docs/PROJECT_MAP.md` con:

- vista general del sistema,
- módulos principales,
- dependencias importantes,
- deuda visible,
- zonas delicadas,
- entrypoints y flujos críticos.

---

## Fase 2 — Auditoría maestra del producto y del código

Haz una auditoría global y arma una tabla de racionalización del proyecto.

### Quiero una tabla con columnas como:

| Área | Archivo / módulo / feature | Qué hace | Qué problema resuelve | Estado actual | Mantener / refactorizar / fusionar / eliminar | Riesgo | Prioridad | Comentarios |

### Debes detectar:

- features redundantes,
- componentes muertos,
- hooks innecesarios,
- abstracciones innecesarias,
- código duplicado,
- mocks o datos falsos,
- estructuras incompletas,
- rutas poco claras,
- deuda técnica relevante,
- inconsistencias entre UI y lógica real,
- funciones edge o servicios con propósito dudoso.

### Entregable

Guardar en:

- `docs/CLAUDE_AUDIT_MASTER.md`

---

## Fase 3 — Arquitectura y simplificación

Haz una revisión de arquitectura para simplificar sin romper funcionalidad.

### Busca:

- sobreingeniería,
- módulos con demasiadas responsabilidades,
- acoplamientos innecesarios,
- separación deficiente de responsabilidades,
- componentes demasiado grandes,
- lógica repetida en frontend,
- servicios/hook layers redundantes,
- flujos difíciles de mantener.

### Quiero:

1. diagnóstico,
2. propuesta de arquitectura objetivo,
3. roadmap de refactor por etapas,
4. identificación de quick wins,
5. lista de cambios de alto riesgo,
6. propuesta de orden de ejecución.

### Entregable

Guardar en:

- `docs/ARCHITECTURE_REFACTOR_PLAN.md`

### Implementación

Si encuentras quick wins seguros, puedes aplicarlos.
Si el cambio es grande, primero planifica y espera mi confirmación.

---

## Fase 4 — UX/UI next level

Haz una auditoría profunda de experiencia y diseño.

### Evalúa:

- jerarquía visual,
- claridad de CTA,
- densidad visual,
- consistencia entre pantallas,
- spacing,
- tipografía,
- alineación,
- navegación,
- fricción en formularios,
- estados vacíos,
- feedback visual,
- carga cognitiva,
- claridad de acciones primarias/secundarias,
- diseño mobile-first,
- sensación de producto premium / inmersivo / moderno.

### Quiero por pantalla o módulo:

| Pantalla / módulo | Problema UX | Problema UI | Impacto | Cambio sugerido | Dificultad |

### Además:

- detecta patrones de diseño inconsistentes,
- propone mejoras sistémicas del design system,
- identifica componentes que deberían estandarizarse,
- señala dónde la app se siente genérica, vieja o poco pulida,
- propone mejoras concretas sin romper flujos reales.

### Entregable

Guardar en:

- `docs/UX_UI_NEXT_LEVEL_AUDIT.md`

### Implementación

Puedes aplicar mejoras visuales/locales de bajo riesgo si son claramente positivas y no rompen lógica.
Para rediseños estructurales, primero propone el plan.

---

## Fase 5 — Performance, data fetching, DB y edge functions

Haz una auditoría orientada a performance real.

### Debes revisar:

- queries innecesarias,
- over-fetching,
- N+1 patterns,
- renders evitables,
- hooks que disparan más de la cuenta,
- estados mal gestionados,
- edge functions lentas o sobredimensionadas,
- validaciones duplicadas,
- llamadas repetidas,
- oportunidades de cache,
- paginación,
- índices potencialmente faltantes,
- cuellos de botella cliente/backend.

### Quiero una tabla:

| Área | Problema | Evidencia | Impacto | Solución sugerida | Riesgo |

### Entregable

Guardar en:

- `docs/PERFORMANCE_EDGE_DB_AUDIT.md`

### Implementación

Puedes aplicar optimizaciones seguras y de alto impacto si son claras y testeables.
Para cambios más delicados en queries, funciones o contratos, primero propón.

---

## Fase 6 — Seguridad, auth y privacidad

Haz una auditoría de seguridad seria.

### Revisa:

- auth flows,
- autorización,
- exposición de secretos,
- uso incorrecto de keys,
- service roles,
- políticas RLS,
- validaciones de input,
- edge functions inseguras,
- endpoints sensibles,
- acceso excesivo a datos,
- riesgo de escalación,
- datos privados expuestos en frontend,
- rutas/admin sin protección suficiente.

### Quiero un registro de riesgos:

| Área | Riesgo | Impacto | Probabilidad | Evidencia | Recomendación |

### Entregable

Guardar en:

- `docs/SECURITY_AUTH_AUDIT.md`

### Implementación

Si detectas correcciones muy evidentes y seguras, puedes proponerlas.
No hagas cambios destructivos en auth o policies sin explicarlos antes.

---

## Fase 7 — Testing, QA y E2E

Necesito que conviertas el proyecto en algo más robusto en pruebas.

### Debes mapear:

- flujos críticos,
- flujos frágiles,
- funcionalidades sin cobertura,
- componentes con alta probabilidad de regresión,
- necesidades de smoke tests,
- oportunidades de tests unitarios,
- oportunidades de integración,
- oportunidades de E2E.

### Quiero una matriz:

| Flujo | Tipo de test | Qué validar | Prioridad | Herramienta sugerida | Archivos |

### Incluye:

- propuesta de estructura de tests,
- orden recomendado para implementar cobertura,
- qué flujos deberían bloquear release si fallan.

### Entregable

Guardar en:

- `docs/TESTING_E2E_MATRIX.md`

### Implementación

Si ya existe setup de testing, expándelo.
Si no existe, propone el setup mínimo viable y pide confirmación antes de meter mucha infraestructura.

---

## Fase 8 — Analytics y growth instrumentation

Quiero que el producto sea medible.

### Debes proponer:

- north star metric,
- métricas secundarias,
- eventos por flujos críticos,
- propiedades útiles por evento,
- dónde instrumentarlos,
- qué eventos faltan,
- qué señales ayudarían a producto / growth / retención.

### Quiero una tabla:

| Event name | Cuándo dispara | Propiedades | Objetivo | Dónde implementarlo |

### Entregable

Guardar en:

- `docs/ANALYTICS_GROWTH_EVENTS.md`

### Implementación

Puedes instrumentar eventos clave si el stack de analytics ya existe.
Si no existe, plantea la capa mínima razonable.

---

## Fase 9 — Responsive, mobile y accessibility

Haz una auditoría específica de compatibilidad visual y usabilidad.

### Debes revisar:

- layouts rotos,
- overflow,
- dropdowns malos,
- botones corridos,
- targets pequeños,
- problemas de teclado móvil,
- safe areas,
- notch handling,
- inconsistencias entre desktop/tablet/mobile,
- focus states,
- labels,
- aria,
- contraste,
- navegación por teclado.

### Quiero una tabla:

| Viewport / pantalla | Problema | Severidad | Solución sugerida |

### Entregable

Guardar en:

- `docs/RESPONSIVE_ACCESSIBILITY_AUDIT.md`

### Implementación

Puedes arreglar problemas evidentes de clases/layout si el riesgo es bajo.
Si el cambio afecta muchos componentes, primero planifica.

---

## Fase 10 — Release readiness y sincronización documental

Quiero saber si el proyecto está realmente listo para su próxima versión importante.

### Debes revisar:

- estado general,
- deuda pendiente antes de release,
- documentación desalineada,
- scripts rotos,
- comandos desactualizados,
- changelog faltante,
- huecos de QA,
- huecos de seguridad,
- huecos de observabilidad,
- puntos que impedirían lanzar con confianza.

### Debes generar:

1. `docs/RELEASE_READINESS_REPORT.md`
2. `docs/CHANGELOG_PROPOSED.md`

### La checklist debe incluir:

- frontend,
- backend,
- db/migrations,
- edge functions,
- auth/security,
- analytics,
- testing,
- responsive/mobile,
- docs,
- deployment.

---

## Reglas de ejecución

### Importante

No quiero que mezcles todo caóticamente.

Quiero que trabajes así:

1. Explorar
2. Documentar
3. Priorizar
4. Proponer
5. Aplicar quick wins seguros
6. Separar cambios grandes en planes claros

### Cuando implementes

- haz cambios pequeños 