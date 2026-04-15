# PERFORMANCE_EDGE_DB_AUDIT.md — Auditoria de Performance, Edge Functions y DB — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Resumen

Performance general: BUENA. Build pasa en ~1min, bundle index 334kB/100kB gzip. Los problemas identificados son mejoras de eficiencia, no cuellos de botella criticos que bloqueen a usuarios actuales.

---

## Bundle analysis — estado actual

| Chunk | Tamano raw | Gzip | Estado |
|---|---|---|---|
| index (app principal) | ~334 kB | ~100 kB | Dentro del budget |
| recharts-vendor | ~432 kB | ~114 kB | Chunk independiente — carga lazy |
| react-vendor | — | — | Split |
| query-vendor | — | — | Split |
| ui-vendor | — | — | Split |
| icons-vendor | — | — | Split |
| date-vendor | — | — | Split |
| supabase-vendor | — | — | Split |

**Recharts**: Ahora en chunk separado gracias a `manualChunks` en Vite config. Solo se carga cuando el usuario accede a paginas con graficos (ProDashboard, Reportes, AnalyticsDashboard).

---

## Items SOLUCIONADOS — referencia

| Item | Descripcion | Impacto obtenido |
|---|---|---|
| Recharts manualChunks | Chunk independiente — lazy load | ~114 kB de gzip no se cargan en home |
| Promise.all en useFollows | Requests en paralelo | Tiempo carga feed reducido |
| select columnas en Home.tsx | Solo columnas necesarias | Payload reducido en queries de home |
| staleTime en useServiceProviders | Cache 5min | Eliminados re-fetches en navegacion |

---

## Items PENDIENTES — ordenados por impacto

### PERF-1 — Home.tsx waterfall con useEffect — ALTA PRIORIDAD

**Archivo**: `src/pages/Home.tsx`
**Problema**: La pagina Home usa una cascada de useEffect con await secuencial. Cada query espera la anterior para ejecutarse:

```
fetch perfil -> await -> fetch mascotas -> await -> fetch peso de cada mascota (loop) -> ...
```

**Impacto medible**: En una conexion de 100ms RTT con 3 mascotas:
- Actual: ~500ms+ (5 rondas de red secuenciales)
- Con React Query + Promise.all: ~150ms (1-2 rondas paralelas)

**Solucion**: Ver ARCHITECTURE_REFACTOR_PLAN.md Etapa 3.

### PERF-2 — Header.tsx fetch sin cache

**Archivo**: `src/components/Header.tsx`
**Problema**: El Header hace un fetch del perfil del usuario con raw fetch/supabase.from() sin pasar por React Query. Cada navegacion entre rutas que reutiliza el Header puede re-fetchear el perfil.

**Solucion**: Usar `useCurrentUserProfile()` (pendiente de crear) con staleTime 5min.

### PERF-3 — No existe useCurrentUserProfile — 4 fetches duplicados

**Problema**: El perfil del usuario se fetchea de forma independiente en Header, Home, AppSidebar, y Profile. Con React Query compartido, seria 1 fetch con 4 suscriptores.

**Solucion**: Ver ARCHITECTURE_REFACTOR_PLAN.md Etapa 2.

### PERF-4 — MyPets backfill secuencial

**Archivo**: `src/pages/MyPets.tsx`
**Problema**: for-of secuencial para backfill de paw_card_id.
**Solucion**: Promise.all paralelo (ver ARCHITECTURE_REFACTOR_PLAN.md Etapa 1a).

### PERF-5 — MyBookings waterfall dentro de queryFn

**Archivo**: `src/pages/MyBookings.tsx`
**Problema**: Dos rondas de red secuenciales dentro del queryFn.
**Solucion**: Promise.all o join de Supabase (ver ARCHITECTURE_REFACTOR_PLAN.md Etapa 1b).

### PERF-6 — useServiceProviders select *

**Archivo**: `src/hooks/useServiceProviders.ts`
**Problema**: La query trae todos los campos de service_providers.
**Solucion**: Especificar columnas necesarias para los componentes consumidores.

### PERF-7 (NUEVO) — appointments query sin user_id explicito

**Archivo**: `src/pages/Home.tsx`
**Descripcion**: La query de citas proximas en Home.tsx no tiene `.eq('user_id', user.id)`. Depende exclusivamente de la politica RLS de Supabase.

**Riesgo**: Si la RLS es incorrecta o permisiva, el usuario podria ver citas de otros usuarios. En terminos de performance, sin el filtro explicito la query puede ser menos optima si el planner de Postgres no puede aprovechar el indice de user_id.

**Accion**: Verificar la politica RLS en la tabla `appointments`. Agregar `.eq('user_id', user.id)` como filtro defensivo aunque RLS ya lo cubra.

---

## Edge Functions — performance

### Funciones criticas y sus caracteristicas de performance

| Funcion | Latencia tipica | Cache | Optimizacion aplicada |
|---|---|---|---|
| generate-medical-summary | 3-8 segundos | No | Genera PDF — inherentemente lento |
| pet-assistant / breed-tips / medical-suggestions | 1-3 segundos | No | Haiku — modelo mas rapido disponible |
| flow-create-subscription | <500ms | No | Pago — latencia Flow.cl |
| reminder-cron | — | — | 1 ejecucion/dia (optimizado) |
| ocr-vaccination-card | 2-5 segundos | No | Vision IA — inherentemente lento |

**Funciones con IA (Haiku)**: Ya estan usando el modelo mas economico y rapido de Anthropic. La latencia de 1-3 segundos es inherente a la generacion de texto.

**Nota sobre prompt cache**: La optimizacion de cost_optimization de sesion 2026-04-12 incluyo habilitacion de prompt cache en las edge functions de IA. Esto reduce costos pero no necesariamente latencia de primera llamada.

### rate-limit.ts — fail-open

**Descripcion**: El rate limiter esta configurado en modo fail-open: si la verificacion del rate limit falla (timeout, error de DB), la solicitud pasa de todas formas.

**Implicacion de performance**: En condiciones normales, no hay impacto. En escenarios de alta carga donde la DB de rate-limit esta saturada, los limites de tasa dejan de aplicarse temporalmente.

**Recomendacion**: Documentar esta decision como intencional o evaluar fail-closed dependiendo del nivel de riesgo de abuso.

---

## DB — analisis de indices en migraciones nuevas

### vet_quick_notes (20260515_vet_quick_notes.sql)

**Indice**: Indice compuesto en `(vet_id, pet_id)` — BIEN.
**Razon**: Las queries de quick notes siempre filtran por vet Y por mascota. El indice compuesto es correcto.

### feedback_in_app (20260515_feedback_in_app.sql)

**Indices**: 2 indices apropiados — BIEN.
**Razon**: Cubre los patrones de query: por usuario y por tipo de feedback.

### core_action_missions

**Tipo**: Data-only — sin tabla nueva, sin indices nuevos.
**Razon**: Inserta misiones predefinidas en la tabla `missions` existente. Sin impacto de esquema.

---

## Recomendaciones de DB a largo plazo

| Recomendacion | Prioridad | Esfuerzo |
|---|---|---|
| Verificar RLS de tabla appointments | Alta | 15min — solo revisar |
| Indice en medical_records(pet_id, created_at) si no existe | Media | 1 migracion |
| Revisar tablas sin indice en columnas de FK | Media | Auditoria con `pg_indexes` |
| VACUUM/ANALYZE scheduled en tablas grandes | Baja | Configuracion de Supabase |

---

## Web Vitals targets (de PERFORMANCE_BUDGET.md)

| Metrica | Target | Estado estimado |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | En riesgo en Home.tsx (waterfall) |
| FID/INP | < 200ms | OK |
| CLS | < 0.1 | OK (layouts estaticos) |
| Bundle inicial | < 150kB gzip | OK (100kB) |
| Chunk max | < 200kB gzip | EN RIESGO (recharts 114kB pero es lazy) |

**Nota**: El LCP de Home.tsx mejorara significativamente al migrar a React Query (Etapa 3 del refactor plan). Con el waterfall actual, el contenido principal del dashboard no aparece hasta que todas las queries secuenciales terminan.
