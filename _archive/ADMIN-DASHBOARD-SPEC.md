# ADMIN-DASHBOARD-SPEC.md

## Especificacion de Rediseno — Admin Panel Paw Friend (Enterprise-grade)

> **Target**: Dashboard enterprise para app B2B2C de salud de mascotas (pawfriend.cl)
> **Stack**: React 18 / TypeScript 5.8 / Vite 5 / Supabase / TailwindCSS + shadcn/ui
> **Fecha**: 2026-04-15

---

## Indice

1. [Dashboard Principal](#1-dashboard-principal)
2. [Analytics](#2-analytics)
3. [Proveedores](#3-proveedores)
4. [Usuarios](#4-usuarios)
5. [Finanzas](#5-finanzas)
6. [Contenido](#6-contenido)
7. [Gamificacion](#7-gamificacion)
8. [Comercial](#8-comercial)
9. [Leads CRM Veterinarios](#9-leads-crm-veterinarios)
10. [Sistema](#10-sistema)
11. [Lineamientos de Diseno](#11-lineamientos-de-diseno)
12. [Plan de Implementacion](#12-plan-de-implementacion)

---

## 1. DASHBOARD PRINCIPAL

### 1.1 Estado actual (`AdminDashboard.tsx` — 522 lineas)

**Funcionalidad existente:**
- 12 KPI cards divididas en 3 filas (principales, secundarias, terciarias) con datos reales de Supabase
- KPIs: usuarios activos 7d, revenue total, proveedores pendientes, items por revisar, mascotas activas, fichas con registros, premium activos, mascotas pendientes, reservas 7d, proveedores aprobados, resenas totales, posts 7d
- Grafico de area: registros de usuarios ultimos 30 dias (Recharts)
- Grafico de barras: mascotas registradas ultimos 30 dias
- Feed de actividad reciente (15 items: usuarios, providers, bookings, reviews) con sort por fecha
- Alerta de pendientes (proveedores + items por revisar) como Card naranja
- Skeleton loaders durante carga, staleTime de 60s para KPIs y 120s para charts
- `KpiCard` component reutilizable con soporte de alert state

**Queries Supabase:**
- `profiles` (count, select created_at)
- `orders` (select total_clp, payment_status)
- `service_providers` (count pending, count approved)
- `verification_requests` + `content_reports` + `service_promotions` (count pending)
- `pets` (count active, select created_at, count huerfanas)
- `bookings` (count 7d)
- `medical_records` (select pet_id para unique count)
- `subscriptions` (count active)
- `service_reviews` (count + recent 3)
- `posts` (count 7d)

### 1.2 Gaps identificados

- **Sin sparklines de tendencia**: KPIs muestran numero absoluto sin delta % vs periodo anterior ni mini-chart
- **Sin color-coding por umbral**: no hay verde/amarillo/rojo basado en thresholds de salud
- **Revenue sin desglose temporal**: muestra total historico, no MRR ni trend mensual
- **Sin metricas de engagement**: no hay DAU/MAU, NPS, churn rate, tasa de verificacion
- **Actividad feed no real-time**: usa polling con staleTime 30s, no Supabase Realtime
- **Sin widget de salud del sistema**: no indica status de Supabase, Edge Functions, Storage
- **Sin alertas inteligentes**: solo cuenta pendientes, no detecta verificaciones >48h, pagos fallidos, providers con rating <3
- **Sin grafico de distribucion de planes**: falta dona free vs premium
- **Sin top servicios solicitados**: falta ranking de service_type en bookings

### 1.3 Spec del rediseno

#### Layout

```
+------------------------------------------------------------------+
|  [Header: Centro de Control | Paw Friend Admin]   [Busqueda global] |
|  [Tabs: Dashboard | Analytics | Proveedores | ... ]               |
+------------------------------------------------------------------+
|                                                                    |
|  [ALERTAS ACTIVAS] -- banda roja/naranja si hay items criticos     |
|  > Verificaciones pendientes >48h (3)                              |
|  > Pagos fallidos esta semana (2)                                  |
|  > Provider rating <3 (1)                                          |
|                                                                    |
|  +----------+ +----------+ +----------+ +----------+              |
|  | Usuarios | | Revenue  | | NPS      | | Churn    |              |
|  | activos  | | mensual  | | Score    | | Rate     |              |
|  |  342     | | $489k    | |   8.2    | |  2.1%    |              |
|  | +12% ^   | | +8% ^    | |  -0.3 v | | +0.2% v  |              |
|  | [spark]  | | [spark]  | | [spark]  | | [spark]  |              |
|  +----------+ +----------+ +----------+ +----------+              |
|                                                                    |
|  +----------+ +----------+ +----------+ +----------+              |
|  | Mascotas | | Premium  | | Vets     | | Tasa     |              |
|  | activas  | | activos  | | verif.   | | verific. |              |
|  |  1,204   | |    18    | |    12    | |  67%     |              |
|  +----------+ +----------+ +----------+ +----------+              |
|                                                                    |
|  +-----------------------------+  +----------------------------+   |
|  | REGISTROS 30 DIAS           |  | TOP 5 SERVICIOS            |   |
|  | [AreaChart: users+mascotas] |  | [BarChart horizontal]      |   |
|  +-----------------------------+  +----------------------------+   |
|                                                                    |
|  +-----------------------------+  +----------------------------+   |
|  | DISTRIBUCION PLANES         |  | ACTIVIDAD EN TIEMPO REAL   |   |
|  | [DonutChart: free/premium]  |  | [Feed con avatars + icons] |   |
|  +-----------------------------+  +----------------------------+   |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | SALUD DEL SISTEMA                                             | |
|  | Supabase DB: OK | Auth: OK | Storage: OK | Edge Fns: 26/26   | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

#### KPI Cards mejoradas

Cada KPI card incluye:
- Valor actual (grande, font-mono)
- Sparkline de tendencia ultimos 7 dias (mini AreaChart 60x20px)
- Delta % vs periodo anterior con flecha arriba/abajo y color (verde >0, rojo <0)
- Color-coding del borde: verde (saludable), amarillo (atencion), rojo (critico)
- Tooltip con valor exacto del periodo anterior

**KPIs fila 1 (Executive Summary):**
| KPI | Query | Umbral verde | Umbral amarillo | Umbral rojo |
|---|---|---|---|---|
| Usuarios activos 7d | profiles WHERE updated_at >= 7d ago | >50 | 20-50 | <20 |
| Revenue mensual (MRR) | subscriptions active SUM payment_amount_clp | >$100k | $50k-100k | <$50k |
| NPS Score | feedback WHERE app_rating IS NOT NULL, promedio | >8 | 6-8 | <6 |
| Churn Rate 30d | (cancelled_subs / (active + cancelled)) * 100 | <5% | 5-10% | >10% |

**KPIs fila 2 (Operacional):**
| KPI | Query | Umbral rojo |
|---|---|---|
| Mascotas activas | pets WHERE lifecycle_status=active | - |
| Premium activos | subscriptions WHERE status=active | - |
| Verificaciones pendientes | verification_requests + service_providers pending | >5 acumula >48h |
| Tasa de verificacion | (verified / total registered providers) * 100 | <50% |

#### Alertas inteligentes

Banner de alertas que aparece solo cuando hay items criticos:
- Verificaciones pendientes >48h: query `service_providers WHERE status=pending AND created_at < now() - interval '48h'`
- Errores criticos sin resolver: query `error_logs WHERE severity=critical AND resolved=false`
- Providers con rating <3: query `service_providers WHERE rating < 3 AND status=approved`
- Pagos fallidos ultimos 7d: query `orders WHERE payment_status=failed AND created_at >= 7d ago`
- Suscripciones por vencer: query `subscriptions WHERE end_date BETWEEN now() AND now() + interval '7d'`

#### Graficos

1. **Registros 30 dias (AreaChart combinado)**: dos areas superpuestas — usuarios (indigo) y mascotas (cyan) — con tooltip que muestra ambos valores
2. **Top 5 servicios (BarChart horizontal)**: query `bookings GROUP BY service_type ORDER BY count DESC LIMIT 5`
3. **Distribucion de planes (DonutChart)**: `subscriptions WHERE status=active GROUP BY plan_type` + count de usuarios free (total - active subs)
4. **Feed de actividad en tiempo real**: usar Supabase Realtime subscribe en `profiles`, `service_providers`, `bookings`, `orders` para push updates

#### Widget de salud del sistema

Barra horizontal con iconos de status:
- Supabase DB: ping con `supabase.from('profiles').select('id').limit(1)`, medir latencia
- Edge Functions: ultimo status de `system_health_log` para funciones criticas
- Storage: verificar acceso con `supabase.storage.from('avatars').list('', { limit: 1 })`
- Status general: verde si todo OK, amarillo si latencia >2s, rojo si error

### 1.4 Estados UI

- **Loading**: Skeleton loaders en grid identico al layout final (12 skeleton cards + 2 chart skeletons + feed skeleton)
- **Empty**: "Bienvenido al Centro de Control. Los datos aparecerán a medida que la plataforma tenga actividad." con ilustracion
- **Error**: Toast con retry button, KPI card individual muestra "Error" con icono
- **Partial data**: cada KPI se carga independientemente, si uno falla los demas siguen visibles

### 1.5 Prioridad

**P0** — Es la pantalla principal, primera impresion del admin

---

## 2. ANALYTICS

### 2.1 Estado actual (`AdminAnalytics.tsx` — 562 lineas)

**Funcionalidad existente:**
- 4 KPI cards: vistas hoy, vistas 7d, sesiones 7d, usuarios unicos 7d (desde `analytics_events`)
- AreaChart: trafico diario 7 dias (page_view events)
- PieChart: distribucion por dispositivo (desktop/mobile/tablet desde metadata.device)
- Funnel de conversion: Registro → Agrega mascota → Ficha medica → Descarga PDF (visualizacion de barras con %)
- Tabla top 15 paginas mas visitadas (7d)
- Tabla de dwell time promedio por pagina (page_leave events con duration_ms)
- BarChart horizontal: uso de features (feature_use events, top 10)
- Tabla de Edge Functions calls: nombre, calls, avgMs, errors (edge_function_call events)

**Queries Supabase:**
- `analytics_events` (filtrado por event_type: page_view, page_leave, session_start, feature_use, edge_function_call)
- `profiles` (count para funnel)
- `pets` (count para funnel)
- `medical_records` (count para funnel)

### 2.2 Gaps identificados

- **Sin filtros globales**: no hay date range picker, no se puede filtrar por region, tipo usuario, plan
- **Sin cohort analysis**: no hay retencion por cohorte de registro
- **Sin DAU/MAU ratio**: no se calcula engagement metric clave
- **Sin revenue analytics**: no hay MRR, ARPU, LTV proyectado
- **Sin correlacion engagement-conversion**: falta scatter plot
- **Sin export CSV**: no hay boton de exportar datos
- **Funnel incompleto**: falta paso "primera consulta" y "premium"
- **Sin metricas de sesion**: no calcula session duration promedio, bounce rate

### 2.3 Spec del rediseno

#### Layout

```
+------------------------------------------------------------------+
| FILTROS GLOBALES                                                   |
| [DateRange: 7d|30d|90d|Custom] [Region: Todas] [Plan: Todos]     |
| [Tipo usuario: Todos] [Exportar CSV]                              |
+------------------------------------------------------------------+
|                                                                    |
| +------+ +------+ +------+ +------+ +------+ +------+            |
| |DAU   | |MAU   | |DAU/  | |Bounce| |Avg   | |Pages/|            |
| |      | |      | |MAU   | |Rate  | |Session| |Session|           |
| +------+ +------+ +------+ +------+ +------+ +------+            |
|                                                                    |
| +--------------------------------------------------------------+  |
| | FUNNEL DE CONVERSION                                          |  |
| | Visitante → Registro → Onboarding → 1ra mascota → 1ra        |  |
| | consulta → Premium                                            |  |
| | [Horizontal funnel bars with % drop at each step]             |  |
| +--------------------------------------------------------------+  |
|                                                                    |
| +-------------------------------+ +-----------------------------+  |
| | COHORT RETENTION (heatmap)    | | REVENUE ANALYTICS           |  |
| | Mes registro vs mes actividad | | MRR trend + ARPU + LTV      |  |
| +-------------------------------+ +-----------------------------+  |
|                                                                    |
| +-------------------------------+ +-----------------------------+  |
| | ENGAGEMENT vs CONVERSION      | | FEATURE USAGE               |  |
| | [Scatter: sessions vs premium]| | [Horizontal bars]           |  |
| +-------------------------------+ +-----------------------------+  |
|                                                                    |
| +-------------------------------+ +-----------------------------+  |
| | TOP PAGES                     | | DWELL TIME                  |  |
| | [Table with sparklines]       | | [Table]                     |  |
| +-------------------------------+ +-----------------------------+  |
|                                                                    |
| +-------------------------------+ +-----------------------------+  |
| | DEVICE DISTRIBUTION           | | EDGE FUNCTION PERFORMANCE   |  |
| | [Donut]                       | | [Table with latency bars]   |  |
| +-------------------------------+ +-----------------------------+  |
```

#### Funnel de conversion extendido

```
Visitante (GA/analytics) → Registro (profiles count)
→ Onboarding completo (profiles con display_name + avatar)
→ Primera mascota (pets con owner_id en profiles)
→ Primera ficha medica (medical_records)
→ Primera consulta/reserva (bookings)
→ Premium (subscriptions active)
```

Query para cada paso con % de drop entre pasos consecutivos.

#### Cohort analysis

Tabla heatmap donde:
- Filas = cohorte de registro (mes YYYY-MM)
- Columnas = mes relativo (M0, M1, M2, ...)
- Celda = % de la cohorte que tuvo actividad en ese mes (profiles.updated_at)
- Color: gradient de verde oscuro (100%) a blanco (0%)

Query: `profiles GROUP BY date_trunc('month', created_at)` cruzado con actividad por mes.

#### Revenue analytics

- **MRR trend (AreaChart)**: `subscriptions WHERE status=active` agrupadas por mes, SUM(payment_amount_clp)
- **ARPU**: MRR / active subs
- **LTV proyectado**: ARPU * (1 / churn_rate) o ARPU * avg_subscription_months
- **Revenue por segmento (stacked bar)**: B2C (premium owners) vs B2B (vet plans)

#### Export CSV

Boton "Exportar" en cada seccion que genera CSV con los datos visibles. Implementar con `papaparse` o generacion manual de CSV string + `Blob` download.

### 2.4 Data model

Tablas involucradas:
- `analytics_events` (event_type, event_name, user_id, session_id, duration_ms, metadata, created_at)
- `profiles` (id, display_name, avatar_url, created_at, updated_at)
- `pets` (id, owner_id, created_at)
- `medical_records` (id, pet_id, created_at)
- `bookings` (id, user_id, created_at)
- `subscriptions` (id, user_id, plan_type, status, payment_amount_clp, start_date, end_date, cancelled_at, created_at)
- `orders` (id, user_id, total_clp, platform_fee, payment_status, created_at)

### 2.5 Estados UI

- Loading: skeleton grid + chart placeholders
- Empty: "Sin datos suficientes para analytics. Los datos se acumulan automaticamente."
- Error: toast + retry
- Partial: cada widget independiente

### 2.6 Prioridad

**P1** — Importante para decisiones de negocio pero no bloquea operaciones diarias

---

## 3. PROVEEDORES

### 3a. Central de Proveedores (`AdminServiceProviders.tsx` — 582 lineas)

#### 3a.1 Estado actual

**Funcionalidad existente:**
- 5 stat cards: total, aprobados, pendientes, rechazados, verificados
- Nota informativa sobre flujo de aprobacion inteligente (auto-aprobacion para no-vets)
- Tabla completa con columnas: proveedor (avatar+nombre+exp), servicios (badges), ubicacion, rating, estado, verificado, fecha, acciones
- Filtros: busqueda texto, estado (select), tipo servicio (select)
- Dialog de detalle con: info basica, servicios ofrecidos con precios, estadisticas (exp, servicios completados, radio cobertura), gestion de estado
- Acciones: aprobar, rechazar (con motivo obligatorio), suspender, verificar/quitar verificacion
- Usa hook `useAdminServiceProviders` + `useAdminAudit` para logging
- STATUS_CONFIG con 4 estados: approved, pending, rejected, suspended

**Queries:**
- Via hook `useAdminServiceProviders`: `service_providers` con `provider_services` join

#### 3a.2 Gaps identificados

- **Sin paginacion**: carga todos los providers de una vez
- **Sin sorting de columnas**: no se puede ordenar por rating, fecha, etc.
- **Sin acciones bulk**: no se pueden aprobar/suspender multiples a la vez
- **Sin historial de servicios del provider**: dialog no muestra bookings atendidos
- **Sin metricas por provider en detalle**: no muestra consultas atendidas, tiempo de respuesta, tasa de cancelacion
- **Sin badge system visual**: verificaciones no tienen badge visual tipo "Colmevet verificado"
- **Sin export**: no se puede exportar lista de providers

#### 3a.3 Spec del rediseno

- Migrar a TanStack Table con sorting, filtering, pagination, column visibility, row selection
- Agregar acciones bulk: seleccionar multiples → "Aprobar seleccionados", "Suspender seleccionados", "Enviar notificacion"
- En dialog de detalle agregar tabs: Perfil | Servicios | Reviews | Metricas | Historial
  - **Metricas**: consultas atendidas (bookings count), rating promedio, tiempo de respuesta promedio, tasa de cancelacion
  - **Reviews**: ultimas reviews con rating y texto
  - **Historial**: timeline de cambios de estado con quien y cuando
- Badge visual para certificaciones: shield icon verde "Colmevet Verificado" junto al nombre
- Pagination server-side: `service_providers` con `.range(from, to)` y count total

### 3b. Verificacion Veterinarios Colmevet (`AdminVetVerifications.tsx` — 481 lineas)

#### 3b.1 Estado actual

**Funcionalidad existente:**
- Cola de pendientes: vets con `is_verified=false AND license_number IS NOT NULL`
- Vista detalle por vet: avatar, nombre, N Colmevet, comuna, email, link a perfil publico
- Verificacion IA-assisted: subir imagen de documento → edge function `verify-vet-document` → score de confianza
- AI result display: confidence_score, extracted_name, extracted_license, document_quality, name_match_score
- Score thresholds: >=80 auto-aprobado, 50-79 revision rapida, <50 revision manual
- Acciones: aprobar, rechazar (con motivo visible al vet)
- Lista de verificados recientes (ultimos 20) con AI score badge
- Checklist de documentos: link a colegioveterinario.cl para verificacion manual
- Usa `useAdminAudit` para logging

**Queries:**
- `service_providers WHERE is_verified=false AND license_number IS NOT NULL`
- `service_providers WHERE is_verified=true AND license_number IS NOT NULL LIMIT 20`
- `vet_verification_results` (confidence_score, extracted data por provider_id)

#### 3b.2 Gaps identificados

- **Sin vista side-by-side**: datos ingresados vs documento no se ven lado a lado
- **Sin workflow formal**: no hay estados intermedios (recibido → en revision → aprobado/rechazado)
- **Sin prioridad por antiguedad**: no ordena por tiempo esperando
- **Sin checklist formal**: la verificacion manual es ad-hoc, sin tracking de pasos completados
- **Sin historial de decisiones**: no muestra quien rechazo previamente y por que

#### 3b.3 Spec del rediseno

- Vista side-by-side: izquierda datos del vet (nombre, RUT, matricula), derecha preview del documento subido
- Workflow con estados: `submitted` → `in_review` → `approved|rejected` → notificado
- Ordenar por antiguedad: badge "X dias esperando" con color rojo si >48h
- Checklist de verificacion (toggleable): [ ] RUT valido, [ ] Matricula Colmevet, [ ] Titulo universitario, [ ] Especialidad declarada
- Historial de decisiones por vet: timeline con audit entries filtradas

### 3c. Legacy Providers (`AdminProviders.tsx` — 328 lineas)

#### 3c.1 Estado actual

**Funcionalidad existente:**
- Tabs: Paseadores | Cuidadores | Veterinarios | Entrenadores
- Consulta tablas legacy separadas: `dog_walker_profiles`, `dogsitter_profiles`, `trainer_profiles`
- Tabla basica: nombre, rating, verificado, activo, acciones
- Dialog de detalle con: nombre, rating, experiencia, resenas, bio
- Acciones: verificar/quitar verificacion, activar/desactivar
- Tab veterinarios muestra placeholder "aun no implementada"
- Fetch pattern: primero tabla principal, luego profiles por user_ids, merge en cliente

**Queries:**
- `dog_walker_profiles` + `profiles` join manual
- `dogsitter_profiles` + `profiles` join manual
- `trainer_profiles` + `profiles` join manual

#### 3c.2 Gaps identificados

- **Tablas legacy**: estas tablas son del modelo anterior, deberian migrarse a `service_providers`
- **Tab vets vacia**: placeholder sin funcionalidad
- **Sin indicador de migracion**: no se sabe cuales ya estan en el nuevo modelo

#### 3c.3 Spec del rediseno

- Agregar columna "Migrado" con check/X indicando si el provider ya existe en `service_providers`
- Boton "Migrar al nuevo modelo" que crea registro en `service_providers` + `provider_services`
- Banner en la parte superior: "X de Y providers ya migrados. Meta: 100%"
- Eventualmente deprecar esta seccion cuando migracion este completa

### 3.4 Prioridad

- 3a Central: **P0** — critico para operaciones diarias
- 3b Vet Verification: **P0** — flujo B2B core
- 3c Legacy: **P2** — migracion eventual

---

## 4. USUARIOS

### 4a. Gestion de Usuarios (`AdminUsers.tsx` — 309 lineas)

#### 4a.1 Estado actual

**Funcionalidad existente:**
- Tabla con columnas: usuario (avatar+nombre), roles (badges), nivel, puntos, registro, acciones
- Busqueda por nombre o ID
- Dialog de detalle con: avatar, nombre, ubicacion, bio, roles actuales (con boton remover), agregar rol (select), estadisticas (nivel, puntos, mascotas, posts)
- Roles disponibles: admin, moderador, paseador, cuidador, vet, entrenador
- Carga ALL profiles de una vez (sin paginacion)
- Muestra datos de `user_stats` (level, total_points, pets_count, posts_count)

**Queries:**
- `profiles` (all, order by created_at desc)
- `user_roles` (all)
- `user_stats` (all)

#### 4a.2 Gaps identificados

- **Sin paginacion**: carga TODOS los usuarios, no escala
- **Sin filtros avanzados**: solo busqueda por nombre/ID, falta filtro por plan, estado, fecha, region
- **Sin vista 360**: no muestra mascotas asociadas, historial de actividad, pagos, engagement score
- **Sin indicador de churn risk**: no detecta usuarios inactivos >14d
- **Sin impersonacion**: no puede "ver app como el usuario"
- **Sin ultima actividad**: no muestra last_active
- **Sin email**: no se ve el email del usuario en la tabla

#### 4a.3 Spec del rediseno

- TanStack Table con server-side pagination: `profiles` con `.range()` + count
- Filtros: plan (free/premium), estado (activo/inactivo/baneado), fecha registro (date range), region (comuna)
- Columnas: avatar, nombre, email, plan, fecha registro, ultima actividad, mascotas, estado, acciones
- Dialog 360 con tabs: Datos | Mascotas | Actividad | Pagos | Engagement
  - **Mascotas**: lista de pets con link a ficha
  - **Actividad**: ultimos 20 analytics_events del user
  - **Pagos**: orders + subscriptions del user
  - **Engagement**: engagement score calculado (DAU status, features usadas, posts count)
- Indicador de churn risk: badge roja "Inactivo >14d" basado en `profiles.updated_at`
- Accion "Impersonar": abre nueva tab con `?impersonate=user_id` (requiere implementar en frontend)

### 4b. Verificaciones de Identidad (`AdminVerificationRequests.tsx` — 291 lineas)

#### 4b.1 Estado actual

**Funcionalidad existente:**
- Tabla con: usuario, rol solicitado, estado, fecha, acciones
- Badge de pendientes count
- Dialog de detalle con: info, notas del solicitante, documentos adjuntos (links), campo de rechazo
- Acciones: aprobar (agrega rol a user_roles), rechazar (con notas opcionales)
- Fetch con profiles join manual (2 queries)

#### 4b.2 Gaps identificados

- **Sin preview de documentos**: solo links, no inline preview
- **Sin notas obligatorias al rechazar**: campo dice "opcional"
- **Sin states intermedios**: no hay "revisando"
- **Sin workflow timeline**: no se ve historial de la solicitud

#### 4b.3 Spec del rediseno

- Preview inline de documentos (imagenes embebidas, PDFs en iframe)
- Notas obligatorias al rechazar (campo required)
- Estados: pending → reviewing → approved|rejected con timestamps
- Timeline de cambios de estado visible en dialog

### 4c. Mascotas Pendientes (`AdminPendingPets.tsx` — 157 lineas)

#### 4c.1 Estado actual

**Funcionalidad existente:**
- Lista de mascotas creadas por vet sin dueno (owner_id=null, created_by_vet_id != null, invitation not accepted)
- Card por mascota: nombre, especie, email pendiente, nombre pendiente, vet creador, antiguedad
- Badge "Email enviado" / "Sin enviar"
- Empty state con ilustracion
- Enriquecido con vet display names
- Limite 100

#### 4c.2 Gaps identificados

- **Sin acciones**: no se puede reenviar invitacion, eliminar mascota, o asignar manualmente
- **Sin filtros**: no hay filtro por especie, estado de email, vet
- **Sin metricas**: no muestra cuantas se reclamaron esta semana vs pendientes

#### 4c.3 Spec del rediseno

- Agregar acciones: "Reenviar invitacion" (llama edge fn `send-pet-invitation`), "Asignar a usuario" (buscar por email), "Eliminar"
- Filtros: especie, estado de invitacion, vet creador
- Metricas: cards con "Reclamadas esta semana", "Pendientes >7d", "Total pendientes"

### 4.4 Prioridad

- 4a Users: **P0** — necesita paginacion urgente
- 4b Verifications: **P1**
- 4c Pending Pets: **P1**

---

## 5. FINANZAS

### 5.1 Estado actual (`AdminFinance.tsx` — 435 lineas)

**Funcionalidad existente:**
- 3 KPI cards: MRR (con count subs activas), Revenue del mes (con comisiones), Churn rate 30d
- Alerta de pagos fallidos (ultimos 7d)
- BarChart: revenue diario ultimos 30 dias
- PieChart: suscripciones por plan (activas)
- Tabla de suscripciones recientes (20): usuario, plan, estado, monto, auto-renew, fecha
- Tabla de ordenes recientes (20): usuario, monto, fee, estado, fecha
- Enriquecido con user names via profiles join manual
- Formato CLP con toLocaleString

**Queries:**
- `subscriptions` (all: status, plan_type, payment_amount_clp, cancelled_at, created_at)
- `orders` (all: total_clp, platform_fee, payment_status, created_at)
- `profiles` (para nombres)

### 5.2 Gaps identificados

- **Sin resumen financiero completo**: falta gastos operativos, margen, proyeccion
- **Sin filtros de fecha**: hardcoded a 30 dias
- **Sin desglose por fuente**: no separa revenue de suscripciones vs servicios vs ads vs partners
- **Sin cashflow proyectado vs real**: falta grafico de linea comparativo
- **Sin retry/reembolso**: no hay acciones sobre pagos fallidos
- **Sin export**: no se puede exportar a Excel
- **Sin LTV ni ARPU**: metricas clave ausentes
- **Sin grafico historico de MRR**: solo muestra MRR actual

### 5.3 Spec del rediseno

#### Layout

```
+------------------------------------------------------------------+
| FILTROS: [Rango fechas] [Exportar Excel]                          |
+------------------------------------------------------------------+
| +--------+ +--------+ +--------+ +--------+ +--------+ +--------+|
| | MRR    | | ARR    | | Revenue| | ARPU   | | Churn  | | LTV    ||
| | $489k  | | $5.8M  | | mes    | | $27k   | | 2.1%   | | $1.3M  ||
| +--------+ +--------+ +--------+ +--------+ +--------+ +--------+|
|                                                                    |
| +-----------------------------+  +----------------------------+    |
| | MRR TREND (12 meses)        |  | REVENUE POR FUENTE         |   |
| | [LineChart]                  |  | [Stacked BarChart]         |   |
| +-----------------------------+  +----------------------------+    |
|                                                                    |
| +--------------------------------------------------------------+  |
| | SUSCRIPCIONES (TanStack Table, sortable, filterable)          |  |
| +--------------------------------------------------------------+  |
|                                                                    |
| +--------------------------------------------------------------+  |
| | ORDENES (TanStack Table, sortable, filterable)                |  |
| | Acciones: retry pago fallido, generar reembolso               |  |
| +--------------------------------------------------------------+  |
```

- **MRR Trend**: LineChart de MRR mensual ultimos 12 meses
- **Revenue por fuente**: Stacked bar desglosando suscripciones B2C, planes B2B, comisiones de servicio
- **ARPU**: MRR / active_subscriptions
- **LTV**: ARPU * (1/monthly_churn_rate)
- **Export Excel**: generar CSV con datos de la vista actual

### 5.4 Prioridad

**P1** — Importante para vision financiera pero no bloquea operaciones

---

## 6. CONTENIDO

### 6a. Feedback (`AdminFeedback.tsx` — 407 lineas)

#### 6a.1 Estado actual

**Funcionalidad existente:**
- Filtros por status: todos, nuevos, revisados, resueltos, descartados (buttons tipo tabs)
- Metricas header: total, destacados (liked), recompensados, rating promedio
- Cards de feedback con: tipo (bug/idea/experiencia) con icono, status badge, admin_liked star, paw_points badge, app_rating stars, user info, ruta, descripcion, respuesta admin
- Acciones: destacar (toggle like), responder (dialog con textarea), regalar puntos (dialog con presets 5/15/30/50 + custom), cambiar status (select inline)
- Dialog de respuesta: muestra feedback original + textarea
- Dialog de puntos: presets visuaes + input custom, muestra puntos ya otorgados
- Usa hooks dedicados: `useAdminFeedback`, `useUpdateFeedbackStatus`, `useRespondFeedback`, `useToggleFeedbackLike`, `useAwardFeedbackPoints`

#### 6a.2 Gaps identificados

- **Sin clasificacion por sentimiento**: no hay analisis automatico positivo/neutro/negativo
- **Sin word cloud**: no se visualizan categorias mas mencionadas
- **Sin Kanban board**: solo filtros de status, no vista kanban drag-and-drop
- **Sin NPS trend chart**: avg rating over time no se grafica
- **Sin busqueda de texto**: no se puede buscar dentro de feedback

#### 6a.3 Spec del rediseno

- Agregar busqueda de texto libre en descripciones
- Agregar NPS/rating trend chart (LineChart, ultimos 30 dias)
- Vista dual: Lista (actual) | Kanban (4 columnas: nuevo → revisado → en progreso → resuelto)
- Tags de sentimiento auto-generados: keywords positivas (genial, excelente, facil) → verde, negativas (error, bug, lento, falla) → rojo
- Metricas adicionales: CSAT score, response rate, avg response time

### 6b. Moderacion (`AdminModeration.tsx` — 133 lineas)

#### 6b.1 Estado actual

**Funcionalidad existente:**
- Lista de reportes de `content_reports` (ultimos 50)
- Card por reporte: tipo (publicacion/comentario), status badge, fecha, motivo, ID truncado
- Acciones para pendientes: descartar | eliminar (borra el post)
- Status colors: pending, reviewed, dismissed, action_taken
- Al eliminar contenido, borra el post directamente (`posts.delete`)

#### 6b.2 Gaps identificados

- **Sin preview del contenido**: solo muestra ID, no el contenido real del post/comentario
- **Sin contexto del reportero**: no muestra quien reporto
- **Sin confirmacion de eliminacion**: ejecuta delete directamente sin modal de confirmacion
- **Sin politicas configurables**: no hay reglas de auto-moderacion
- **Sin estadisticas de moderacion**: no muestra tendencias de reportes

#### 6b.3 Spec del rediseno

- Preview inline del contenido reportado: fetch post/comment y mostrar texto + imagenes
- Mostrar quien reporto con link a su perfil
- Modal de confirmacion para eliminacion con opciones: eliminar contenido, advertir al usuario, banear usuario
- Metricas: reportes por dia (chart), top motivos, top usuarios reportados
- Estado "en revision" intermedio

### 6c. Promociones de Servicios (`AdminServicePromotions.tsx` — 293 lineas)

#### 6c.1 Estado actual

**Funcionalidad existente:**
- Tabla con: titulo, usuario, tipo servicio, estado, fecha, acciones
- Badge de pendientes count
- Dialog de detalle con: titulo, usuario, tipo, estado, descripcion, imagenes (grid 3 cols con links), score AI, motivo de rechazo previo
- Acciones: aprobar, rechazar (con motivo opcional)
- Fetch con profiles join manual

#### 6c.2 Gaps identificados

- **Sin metricas por promocion**: no muestra impresiones, clicks, conversiones
- **Sin segmentacion**: no se configura a quien se muestra
- **Sin calendario de programacion**: no hay scheduling
- **Sin preview en contexto**: no se ve como se veria en la app

#### 6c.3 Spec del rediseno

- Agregar metricas inline: impresiones, clicks, CTR por promocion
- Preview visual: mockup de como se ve la promocion en el feed/home
- Calendario de promociones programadas (fecha inicio/fin visible)

### 6.4 Prioridad

- 6a Feedback: **P1**
- 6b Moderacion: **P1**
- 6c Promotions: **P2**

---

## 7. GAMIFICACION

### 7a. Paw Shop / Rewards (`AdminRewards.tsx` — 202 lineas)

#### 7a.1 Estado actual

**Funcionalidad existente:**
- Lista de rewards con: nombre, categoria badge, costo en puntos, stock (si aplica), descripcion
- Switch de activar/desactivar
- Botones: editar, eliminar
- Dialog de crear/editar: nombre, descripcion, puntos, categoria, stock, partner
- CRUD completo contra `paw_shop_rewards`

#### 7a.2 Gaps identificados

- **Sin historial de canjes**: no muestra cuantas veces se canjeo cada reward
- **Sin metricas**: falta PawCoins en circulacion, burn rate, rewards mas canjeados
- **Sin categorias visuales**: solo texto, sin iconos por categoria
- **Sin preview de como se ve en la app**

#### 7a.3 Spec del rediseno

- Metricas header: total PawCoins en circulacion, canjes esta semana, reward mas popular
- Historial de canjes por reward: tabla con user, fecha, puntos
- Sorting: por canjes, por puntos, por stock restante
- Vista grid visual con imagen/icono del reward

### 7b. Misiones (`AdminMissions.tsx` — 213 lineas)

#### 7b.1 Estado actual

**Funcionalidad existente:**
- Lista de misiones con: titulo, tipo (daily/weekly/story) badge, categoria badge, puntos reward, descripcion
- Switch de activar/desactivar
- Botones: editar, eliminar
- Dialog de crear/editar: titulo, descripcion, tipo, categoria, accion target, meta, puntos
- CRUD contra `paw_missions`

#### 7b.2 Gaps identificados

- **Sin metricas de completacion**: no muestra cuantos usuarios completaron cada mision
- **Sin tasa de engagement**: no se sabe si las misiones generan actividad
- **Sin editor visual de condiciones**: la accion target es texto libre
- **Sin preview de progreso tipico**

#### 7b.3 Spec del rediseno

- Metricas por mision: tasa de completacion, usuarios activos, engagement uplift
- Editor de condiciones con select de acciones conocidas (log_weight, add_vaccination, create_post, etc.)
- Progress bar mostrando % de completacion global

### 7.4 Prioridad

- 7a Rewards: **P2**
- 7b Missions: **P2**

---

## 8. COMERCIAL

### 8a. Gestion de Anuncios (`AdManagement.tsx` — 497 lineas)

#### 8a.1 Estado actual

**Funcionalidad existente:**
- Lista de anuncios (partners table) con: brand_name, badges (activo/inactivo, placement, category), ad_text, metricas (impresiones, clicks, CTR)
- Dialog de crear/editar: marca, prioridad, texto, imagen URL, enlace, ubicacion (home/services/map/content/feed), categoria (food/insurance/clinic/store/adoption/general), fecha inicio/fin, activo
- Acciones: editar, activar/desactivar, eliminar (con confirm nativo)
- CRUD completo contra `partners` table
- Calculo de CTR inline

**Queries:**
- `partners` (all, order by created_at desc)

#### 8a.2 Gaps identificados

- **Sin segmentacion por audiencia**: no se configura a que usuarios se muestra
- **Sin calendario visual**: no hay vista de campanas programadas
- **Sin preview**: no se ve como luce el anuncio en la app
- **Sin revenue por anuncio**: no trackea cuanto genera cada anuncio
- **Confirm nativo**: usa `confirm()` en vez de dialog de shadcn

#### 8a.3 Spec del rediseno

- Reemplazar `confirm()` con Dialog de confirmacion de shadcn
- Agregar preview visual del anuncio en diferentes placements
- Calendario de campanas con Gantt-like visualization
- Metricas expandidas: revenue estimado, engagement rate

### 8b. Partners (`AdminPartnerSubmissions.tsx` — 577 lineas)

#### 8b.1 Estado actual

**Funcionalidad existente:**
- Pipeline con contadores: pendientes, contactados, aprobados, total
- Tabla con: negocio, categoria, contacto (nombre+email), comuna, status, fecha, acciones
- Filtros: busqueda texto, status, categoria
- Dialog de detalle exhaustivo: todos los campos (categoria, contacto, email, telefono, website, instagram, direccion, comuna, ciudad, descripcion, servicios, horario)
- Controls admin: cambiar status (select), notas internas (textarea)
- Acciones rapidas: "Aprobar y crear en directorio" (para categorias directorio), "Copiar mensaje de invitacion" (para categorias que requieren cuenta)
- Logica de routing: categorias directorio van a tabla `partners`, categorias perfil necesitan cuenta de usuario
- CATEGORIA_LABELS con 12 categorias

**Queries:**
- `partner_submissions` (all, order by created_at desc)
- Mutation: update status + notas, insert en `partners` al aprobar

#### 8b.2 Gaps identificados

- **Sin pipeline visual Kanban**: solo tabla con filtros
- **Sin historial de interacciones**: no registra llamadas, emails enviados
- **Sin scoring automatico**: no hay priorizacion de partners
- **Sin revenue tracking por partner**: no se ve cuanto genera cada partner

#### 8b.3 Spec del rediseno

- Vista dual: Tabla (actual) | Kanban (pendiente → contactado → negociando → aprobado)
- Historial de interacciones por partner: llamada, email, reunion, con fecha y notas
- Tags personalizables

### 8.4 Prioridad

- 8a Ads: **P2**
- 8b Partners: **P1**

---

## 9. LEADS CRM VETERINARIOS

### 9.1 Estado actual (`AdminLeadsCRM.tsx` — 941 lineas)

**Funcionalidad existente — MUY COMPLETO:**
- 2 tabs: Domiciliarios (funcional) | Clinicas (placeholder)
- 6 stat cards: total leads, pendientes, contactados, interesados, convertidos, con contacto
- Filtros avanzados (collapsible): busqueda texto, estado (6 opciones), prioridad (alta/media/baja), fuente (Google Maps, Instagram, TikTok, CMV, Vetting.cl, DrPet), comuna
- Lista scrollable de leads con: checkbox seleccion, nombre, prioridad badge, estado badge, Instagram handle, comunas, fuente, intentos de contacto
- Canales de contacto inline: WhatsApp (wa.me link), Email (mailto), Instagram (link)
- Select all + select individual
- Boton "Contactar prioridad alta" (autoselecciona leads pendientes alta prioridad)
- Dialog de outreach masivo: canal (email/whatsapp), template selector (4 templates predefinidos + custom), preview con variables interpoladas ({nombre}, {comunas})
- 4 templates completos: invitacion email, invitacion WhatsApp, seguimiento email, seguimiento WhatsApp
- Dialog de detalle por lead: contacto completo (telefono, WhatsApp, email, Instagram, website, TikTok), info (comunas, fuente, score digital, clinica fisica, intentos contacto, ultimo contacto), notas, cambiar estado (6 botones), nota al cambiar estado
- Acciones rapidas por lead: invitar por WA (abre wa.me con mensaje), invitar por Email (abre mailto con subject+body), visitar IG
- Registra contacto automaticamente al usar acciones (via `useRegistrarContacto`)
- Usa hooks dedicados: `useLeadsVets`, `useLeadsStats`, `useUpdateLeadEstado`, `useRegistrarContacto`, `useEnviarOutreach`

**Queries:**
- Via hooks: RPCs de Supabase para leads_vets_domicilio con filtros server-side
- Stats via RPC

### 9.2 Gaps identificados

- **Tab Clinicas es placeholder**: no funcional
- **Sin pipeline visual Kanban**: solo lista, no vista kanban arrastrando leads entre columnas
- **Sin tareas/seguimientos con recordatorios**: no hay CRM-style task management
- **Sin scoring automatico de leads**: prioridad es manual
- **Sin forecast de revenue**: no proyecta ingresos del pipeline
- **Sin import/export CSV**: no se pueden cargar leads masivamente
- **Sin tags personalizables**: no hay etiquetas custom por lead
- **Sin metricas de conversion por etapa**: falta % drop entre etapas
- **Sin historial de interacciones guardado**: registra contacto pero no se ve timeline en UI

### 9.3 Spec del rediseno

#### Layout

```
+------------------------------------------------------------------+
| CRM LEADS VETERINARIOS                                            |
| [Tab: Domiciliarios | Clinicas | Pipeline | Metricas]             |
+------------------------------------------------------------------+
|                                                                    |
| +------+ +------+ +------+ +------+ +------+ +------+            |
| |Total | |Pend. | |Contact| |Inter.| |Convert| |Lost  |           |
| +------+ +------+ +------+ +------+ +------+ +------+            |
|                                                                    |
| FILTROS + [Import CSV] [Export CSV] [Outreach masivo]             |
|                                                                    |
| Vista: [Lista] [Kanban]                                           |
|                                                                    |
| KANBAN VIEW:                                                      |
| +-----------+ +-----------+ +-----------+ +-----------+           |
| |Pendiente  | |Contactado | |Interesado | |Convertido |           |
| |           | |           | |           | |           |           |
| | [lead]    | | [lead]    | | [lead]    | | [lead]    |           |
| | [lead]    | | [lead]    | |           | |           |           |
| | [lead]    | |           | |           | |           |           |
| +-----------+ +-----------+ +-----------+ +-----------+           |
|                                                                    |
| METRICAS:                                                         |
| [Funnel conversion by stage] [Avg time in pipeline]               |
| [Forecast revenue] [Conversion rate trend]                        |
+------------------------------------------------------------------+
```

- **Kanban view**: drag-and-drop entre columnas (usar `@dnd-kit/core` o similar)
- **Import CSV**: upload CSV de leads con mapping de columnas
- **Export CSV**: descargar leads filtrados
- **Tags**: chips editables por lead (ej: "Providencia", "cadena", "exoticos")
- **Tareas**: mini-task list por lead con fecha de seguimiento
- **Metricas pipeline**: funnel de conversion por etapa con % drop, tiempo promedio en cada etapa, forecast de revenue

### 9.4 Data model

Tablas:
- `leads_vets_domicilio` (nombre_completo, telefono, whatsapp, email, instagram, tiktok, sitio_web, comunas_cobertura, fuente_dato, presencia_digital_score, tiene_clinica_fisica, estado_validacion, prioridad_outreach, intentos_contacto, fecha_ultimo_contacto, notas)
- `leads_contacto_log` (lead_id, canal, notas, template_usado, created_at)

### 9.5 Prioridad

**P0** — Critico para modelo B2B, motor de crecimiento principal

---

## 10. SISTEMA

### 10a. Configuracion (`AdminSettings.tsx` — 193 lineas)

#### 10a.1 Estado actual

**Funcionalidad existente:**
- Stats de la plataforma: usuarios, mascotas, publicaciones, ordenes totales, ordenes pagadas, revenue total
- Configuracion de comisiones: porcentaje, minimo CLP, maximo CLP
- Lee/escribe `platform_config` table con config_key/config_value JSON

#### 10a.2 Gaps identificados

- **Sin feature flags**: no hay toggles para features
- **Sin configuracion de notificaciones**: no se configuran push/email
- **Sin maintenance mode**: no hay switch
- **Sin config de textos de la app**: no se pueden editar strings
- **Stats duplicadas**: estas stats ya estan en Dashboard

#### 10a.3 Spec del rediseno

- Remover stats duplicadas (ya estan en Dashboard)
- Agregar feature flags: toggle para cada feature Labs (PawGame, Missions, PawCollection, etc.)
- Maintenance mode toggle con banner de "volvemos pronto"
- Config de notificaciones: toggle email reminders, push notifications
- Config de limites: max pets por plan, max file size upload

### 10b. Error Log (`AdminErrorLog.tsx` — 373 lineas)

#### 10b.1 Estado actual

**Funcionalidad existente:**
- 4 KPIs: criticos sin resolver, sin resolver total, errores hoy, errores semana
- BarChart: errores por dia (7 dias)
- Filtros: busqueda en mensajes, fuente (frontend/edge_function/database/external), severidad (critical/error/warning)
- Lista expandible de errores: source icon, severity badge, source badge, resolved badge, mensaje, fecha
- Expandir muestra: stack trace (pre formateado), context (JSON), user_id
- Accion "Resolver" por error individual
- Lee de `error_logs` table

#### 10b.2 Gaps identificados

- **Sin agrupacion de errores similares**: errores repetidos se listan individualmente
- **Sin tendencia de resolucion**: no muestra MTTR (mean time to resolve)
- **Sin notificacion de errores criticos**: no alerta en real-time
- **Sin link a usuario afectado**: muestra user_id pero no link al perfil

#### 10b.3 Spec del rediseno

- Agrupacion de errores: agrupar por mensaje similar (primeros 100 chars) con conteo
- MTTR metric: tiempo promedio entre created_at y resolved_at
- Link a perfil de usuario afectado
- Badge con "primera vez" vs "recurrente" con count de ocurrencias

### 10c. System Health (`AdminSystemHealth.tsx` — 357 lineas)

#### 10c.1 Estado actual

**Funcionalidad existente:**
- 4 KPIs: edge functions count, errores 24h, IA skills invocaciones hoy, funciones OK count
- Tabla de 21+ edge functions: nombre, status icon (success/error/timeout/unknown), ultima ejecucion, latencia promedio, errores 24h
- Critical badge para funciones criticas (flow-create-subscription, flow-webhook, generate-medical-summary, reminder-cron)
- Ordenamiento: criticas primero, luego por errores, luego alfabetico
- Uso de IA hoy: skill name, used/limit con progress bar, % consumido con color coding (>90 rojo, >70 naranja)
- Lee de `system_health_log` y `ai_usage`

#### 10c.2 Gaps identificados

- **Sin uptime historico**: solo muestra ultimo status, no uptime %
- **Sin alertas de degradacion**: no detecta latencia alta como warning
- **Sin status de Supabase services**: DB, Auth, Storage no se verifican independientemente
- **Sin response time trend**: no hay grafico de latencia over time

#### 10c.3 Spec del rediseno

- Uptime badges: calcular % uptime ultimas 24h/7d/30d por funcion
- Alerta de degradacion: badge amarilla si avg latency > 2000ms
- Supabase services check: ping DB, Auth, Storage independientemente
- Sparkline de latencia por funcion (ultimas 24h)

### 10d. Safety/Seguridad (`AdminSafetyLogs.tsx` — 101 lineas)

#### 10d.1 Estado actual

**Funcionalidad existente:**
- Lista de logs de `bereavement_safety_logs`: flag_type (crisis/warning/info), frase detectada, user_id truncado, fecha, reviewed status
- Icono diferente para crisis vs warning
- Empty state con checkmark

#### 10d.2 Gaps identificados

- **Solo cubre bereavement**: no hay logs de seguridad general (login fallidos, cambios de permisos)
- **Sin acciones**: no se puede marcar como revisado, contactar usuario
- **Sin rate limiting status**: no muestra estado de rate limits
- **Sin login attempts log**: no registra intentos fallidos

#### 10d.3 Spec del rediseno

- Expandir a seguridad general: bereavement safety + auth security events
- Agregar accion "Marcar como revisado" con nota
- Si hay tabla de rate_limit_events, mostrar status
- Agregar seccion de login security: intentos fallidos por IP/usuario

### 10e. Audit Log (`AdminAuditLog.tsx` — 227 lineas)

#### 10e.1 Estado actual

**Funcionalidad existente:**
- Lista de acciones admin de `admin_audit_log`: accion (con label humanizado e icono), target_type badge, admin_name, fecha, details inline
- Filtro de busqueda (accion, admin, tipo)
- 20+ action types mapeados con iconos y colores
- Enriquecido con admin display names
- Limite 100 entries

#### 10e.2 Gaps identificados

- **Sin filtro por admin**: no hay select de admin especifico
- **Sin filtro por fecha**: no hay date range
- **Sin export**: no se puede exportar para compliance
- **Sin paginacion**: hardcoded a 100

#### 10e.3 Spec del rediseno

- Filtros: admin (select), tipo de accion (select), fecha (date range)
- Paginacion con load more
- Export CSV para compliance
- Timeline visual con agrupacion por dia

### 10f. Equipo Admin (`AdminTeam.tsx` — 308 lineas)

#### 10f.1 Estado actual

**Funcionalidad existente:**
- Lista de miembros admin: display_name, role badge (Super Admin/Operador), active status, email, permisos (chips), ultimo login, actions
- Invitar operador: email input + permisos toggleables (11 categorias) + boton invitar
- Busca user por email en profiles, crea en `admin_access` con role=admin_operator
- Acciones: toggle activo, eliminar acceso (solo para non-super_admin)
- Super Admin guard: solo super_admin ve esta seccion (via `useIsAdmin().isSuperAdmin`)
- 11 permisos: dashboard, providers, users, payments, content, rewards, ads, partners, settings, safety, system

#### 10f.2 Gaps identificados

- **Sin historial de actividad por admin**: no muestra que hizo cada admin
- **Sin roles mas granulares**: solo super_admin y admin_operator
- **Sin 2FA management**: no se puede requerir/gestionar 2FA
- **Sin sesiones activas**: no se ven sesiones abiertas

#### 10f.3 Spec del rediseno

- Agregar tab "Actividad" por admin: filtrar audit_log por admin_user_id
- Roles adicionales: moderador (solo content), finanzas (solo payments), comercial (solo ads+partners+leads)
- Mostrar sesiones activas si Supabase Auth lo permite

### 10.4 Prioridad

- 10a Settings: **P1**
- 10b Error Log: **P1** (ya bastante completo)
- 10c System Health: **P1** (ya bastante completo)
- 10d Safety: **P2**
- 10e Audit Log: **P1**
- 10f Team: **P2**

---

## 11. LINEAMIENTOS DE DISENO

### 11.1 Theme

- **Base**: `bg-slate-950` (dark mode obligatorio para admin, ya implementado)
- **Accent primario**: indigo-600 (ya en uso)
- **Accent secundario**: cyan-500 para metricas, emerald-500 para success, amber-500 para warnings, red-500 para errors
- **Tipografia**: font-mono para numeros/KPIs, default sans para texto

### 11.2 Tablas (TanStack Table v8)

Todas las tablas deben usar `@tanstack/react-table` con:
- Sorting: click en header para asc/desc/none
- Filtering: input debounced por columna (text, select, date range)
- Pagination: server-side cuando tabla >100 rows, client-side para <100
- Column visibility: dropdown para show/hide columnas
- Row selection: checkbox + bulk actions bar que aparece cuando hay seleccion
- Responsive: en mobile, columnas secundarias se colapsan

### 11.3 Componentes comunes

| Componente | Uso |
|---|---|
| `AdminKpiCard` | KPI con sparkline, delta, color-coding |
| `AdminDataTable` | Wrapper de TanStack Table con sorting/filtering/pagination |
| `AdminDialog` | Dialog con confirmacion para acciones destructivas |
| `AdminEmptyState` | Empty state con ilustracion y CTA |
| `AdminBreadcrumb` | Breadcrumb contextual por seccion |
| `AdminSearchGlobal` | Omni-search que busca en usuarios, providers, mascotas, transacciones |

### 11.4 Loading & Empty states

- **Loading**: Skeleton loaders que replican el layout final (nunca spinner centrado)
- **Empty**: Ilustracion + titulo + descripcion + CTA relevante
- **Error**: Toast con mensaje + boton retry inline

### 11.5 Real-time updates

Usar Supabase Realtime para:
- Dashboard KPIs (subscribe a `profiles`, `orders`, `service_providers`)
- Feed de actividad
- Colas de moderacion y verificacion
- Error log (nuevos errores)

### 11.6 Responsive

- Desktop (>1024px): layout completo como disenado
- Tablet (768-1024px): grids reducidos a 2 cols, tabs horizontales scroll
- Mobile (<768px): tabs como bottom nav o hamburger, tablas con horizontal scroll, KPIs en 1 columna

### 11.7 Keyboard shortcuts

- `Cmd/Ctrl+K`: abrir busqueda global
- `1-9`: navegar a seccion por numero (1=Dashboard, 2=Analytics, etc.)
- `Esc`: cerrar dialog/modal abierto
- `R`: refresh datos de la seccion actual

### 11.8 Accesibilidad

- Todas las tablas con aria-labels
- Focus visible en todos los elementos interactivos
- Color coding nunca como unica forma de comunicar informacion (siempre icono + texto)
- Contraste WCAG AA en dark theme

---

## 12. PLAN DE IMPLEMENTACION

### Fase 1 — Foundations (Semana 1-2)

| Item | Componentes | Complejidad | Dependencias |
|---|---|---|---|
| AdminKpiCard con sparkline | Nuevo componente | M | - |
| AdminDataTable (TanStack Table wrapper) | Nuevo componente | L | @tanstack/react-table |
| AdminSearchGlobal | Nuevo componente | M | - |
| Refactor Admin.tsx layout | Actualizar | S | - |

### Fase 2 — Core Operations (Semana 3-4)

| Item | Componentes | Complejidad | Dependencias |
|---|---|---|---|
| Dashboard rediseno (KPIs + alertas + sparklines) | AdminDashboard | L | Fase 1 |
| Users pagination + filtros | AdminUsers | L | AdminDataTable |
| Providers TanStack Table + bulk actions | AdminServiceProviders | L | AdminDataTable |
| Vet Verification side-by-side + workflow | AdminVetVerifications | M | - |

### Fase 3 — Business Intelligence (Semana 5-6)

| Item | Componentes | Complejidad | Dependencias |
|---|---|---|---|
| Analytics cohort + revenue + export | AdminAnalytics | XL | - |
| Finance MRR trend + export | AdminFinance | L | - |
| Leads CRM Kanban view | AdminLeadsCRM | XL | @dnd-kit/core |
| Leads import/export CSV | AdminLeadsCRM | M | papaparse |

### Fase 4 — Polish & Secondary (Semana 7-8)

| Item | Componentes | Complejidad | Dependencias |
|---|---|---|---|
| Feedback Kanban + NPS chart | AdminFeedback | M | - |
| Moderation content preview | AdminModeration | M | - |
| Settings feature flags | AdminSettings | M | - |
| Error Log agrupacion | AdminErrorLog | M | - |
| System Health sparklines | AdminSystemHealth | S | - |
| Audit Log export + filtros | AdminAuditLog | S | - |
| Partners pipeline mejorado | AdminPartnerSubmissions | M | - |
| Rewards + Missions metricas | AdminRewards, AdminMissions | S | - |

### Dependencias entre secciones

```
Fase 1 (Foundations) → Fase 2 (Core Ops) → Fase 3 (BI) → Fase 4 (Polish)
                                          ↗
AdminDataTable ──────────→ Users, Providers, Finance, Audit
AdminKpiCard ────────────→ Dashboard, Analytics, Finance
```

### Estimacion de complejidad

| Seccion | Complejidad | Justificacion |
|---|---|---|
| Dashboard | L | KPIs con sparklines, alertas inteligentes, real-time feed, widget salud |
| Analytics | XL | Cohort heatmap, revenue analytics, export, filtros globales complejos |
| Providers Central | L | TanStack Table + bulk actions + metricas por provider |
| Vet Verification | M | Side-by-side view + workflow states |
| Legacy Providers | S | Solo agregar indicador de migracion |
| Users | L | Paginacion server-side + vista 360 + churn risk |
| Verifications | M | Preview docs + workflow |
| Pending Pets | S | Agregar acciones + filtros |
| Finance | L | MRR trend + revenue desglose + export |
| Feedback | M | Kanban + NPS chart |
| Moderation | M | Content preview + confirmacion |
| Promotions | S | Metricas inline |
| Rewards | S | Metricas + historial canjes |
| Missions | S | Metricas completacion |
| Ads | S | Preview + confirm dialog |
| Partners | M | Pipeline mejorado |
| Leads CRM | XL | Kanban drag-drop + import/export + pipeline metricas |
| Settings | M | Feature flags + maintenance mode |
| Error Log | M | Agrupacion + MTTR |
| System Health | S | Sparklines + uptime |
| Safety | S | Acciones + seguridad general |
| Audit Log | S | Export + filtros avanzados |
| Team | S | Actividad por admin |

### Resumen total

- **S (Small)**: 9 secciones — ~1-2 dias cada una
- **M (Medium)**: 8 secciones — ~2-4 dias cada una
- **L (Large)**: 4 secciones — ~4-7 dias cada una
- **XL (Extra Large)**: 2 secciones — ~7-10 dias cada una

**Estimacion total**: ~8-10 semanas de desarrollo enfocado (1 dev senior)

---

> **Nota**: Este spec refleja el estado actual verificado del codigo al 2026-04-15. Cada componente fue leido y analizado directamente desde el source.
