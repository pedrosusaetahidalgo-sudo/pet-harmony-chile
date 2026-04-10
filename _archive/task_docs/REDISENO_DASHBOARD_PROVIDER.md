# Rediseno completo: Dashboard + Perfil del Proveedor

> Documento de especificacion tecnica y funcional para rehacer el panel de proveedor de Paw Friend.
> Fecha: 2026-04-10 | Autor: Claude Code (auditoria con 6 agentes paralelos)

---

## 1. Diagnostico actual — Por que todo se ve en $0

### 1.1 Metricas financieras: queries contra tablas vacias

El dashboard actual (`src/components/provider/ProviderDashboard.tsx`) consulta:

| Tabla | Que busca | Problema |
|---|---|---|
| `provider_balances` | Balance disponible, pendiente, ganado, retirado | Tabla existe pero **nunca se pobla** — no hay trigger ni edge function que la llene |
| `order_items` + `orders` | Reservas completadas, ingresos brutos, comisiones | Sistema de orders/cart fue creado para un marketplace generico (Webpay). **El flujo real de reservas va por `vet_bookings`**, no por `orders` |
| `order_items.provider_id` | Vinculo al proveedor | Apunta a `auth.users(id)`, no a `service_providers(id)` — mismatch conceptual |

**Resultado**: Las 8 tarjetas financieras siempre muestran `$0` porque los datos reales estan en `vet_bookings` (reservas vet) y `service_reviews` (resenas), NO en el pipeline orders/cart/balance.

### 1.2 Metricas de engagement: datos reales pero mal presentados

| Metrica actual | Fuente | Estado |
|---|---|---|
| Visitas al perfil | `service_providers.directory_views` | Funciona (via `increment_provider_views` RPC) |
| Calificacion | `service_providers.avg_rating` | Funciona (via trigger en `service_reviews`) |
| Clientes unicos | Derivado de `orderNumber.split("-")[0]` | **Roto** — deberia contar mascotas unicas de `vet_clinical_notes` + `medical_share_tokens` |
| Fichas compartidas | Muestra `netPayouts/grossRevenue * 100` como "%" | **Completamente incorrecto** — la etiqueta dice "Fichas compartidas" pero calcula margen neto de comisiones. Siempre muestra "—" |

### 1.3 Perfil del proveedor: funcional pero incompleto

**Archivo**: `src/pages/ProviderProfileEdit.tsx` (423 lineas)

**Que funciona:**
- Upload de avatar (Supabase Storage bucket `avatars`)
- Formulario con 12 campos editables
- Upsert via `useUpsertProviderProfile` con `onConflict: 'user_id'`
- Score de completitud (0-100) con `calculateProfileCompleteness`
- Toggle de visibilidad publica (requiere 80%)
- Editor de precios por servicio (`MisPreciosEditor`)

**Que esta roto/faltante:**
1. **Voseo argentino** en lineas 112, 123: "Verificá", "Necesitás" — debe ser tuteo chileno
2. **No hay validacion de telefono** — acepta cualquier string
3. **No hay preview mobile** — el formulario es largo y no tiene wizard/steps en mobile
4. **Falta horario de atencion** — campo no existe en DB ni en form
5. **Falta direccion/ubicacion** — solo tiene `commune` pero no direccion especifica ni coordenadas
6. **Falta website/redes sociales** — Instagram, Facebook, website
7. **No hay seccion de credenciales/verificacion** — tabla `provider_verifications` existe pero no tiene UI
8. **`MisPreciosEditor`** se renderiza al final pero no tiene feedback de que precios ya estan publicados

---

## 2. Rediseno propuesto — Metricas que SI importan

### 2.1 Principio de diseno

> Un vet que acaba de registrarse necesita ver **accion**, no numeros vacios.
> Un vet activo necesita ver **impacto**, no vanity metrics.

Dividir el dashboard en 3 estados adaptativos:
- **Onboarding** (perfil < 80%): Wizard de completar perfil
- **Early traction** (perfil >= 80%, < 5 pacientes): Metricas de visibilidad + primeros pacientes
- **Active practice** (>= 5 pacientes): Metricas clinicas + financieras + reputacion

### 2.2 Nuevas metricas por categoria

#### A. Actividad clinica (fuente real: `vet_clinical_notes` + `medical_share_tokens`)

| Metrica | Query | Por que importa |
|---|---|---|
| **Pacientes atendidos (mes)** | `COUNT(DISTINCT pet_id) FROM vet_clinical_notes WHERE provider_id = X AND created_at >= inicio_mes` | KPI principal — cuantas mascotas unicas atendiste |
| **Notas clinicas escritas (mes)** | `COUNT(*) FROM vet_clinical_notes WHERE provider_id = X AND created_at >= inicio_mes` | Productividad clinica |
| **Fichas compartidas (semana)** | `COUNT(*) FROM medical_share_tokens WHERE target_provider_id = X AND created_at >= 7d` | Cuantos duenos confiaron en compartir la ficha |
| **Seguimientos pendientes** | `COUNT(*) FROM vet_clinical_notes WHERE provider_id = X AND followup_required = true AND followup_date BETWEEN now() AND now()+7d` | Ya existe en VetFollowupsCard, promover a metrica top-level |
| **Tasa de seguimiento** | Ratio de followups completados vs agendados | Indicador de calidad de atencion |

#### B. Reputacion (fuente: `service_reviews` + `review_invitations`)

| Metrica | Query | Por que importa |
|---|---|---|
| **Rating promedio** | `service_providers.avg_rating` | Ya funciona, mantener |
| **Total resenas** | `service_providers.total_reviews` | Ya funciona, mantener |
| **Resenas este mes** | `COUNT(*) FROM service_reviews WHERE provider_id = X AND created_at >= inicio_mes` | Momentum — estan llegando resenas? |
| **Tasa de respuesta** | `COUNT(WHERE provider_reply IS NOT NULL) / total_reviews` | Requiere agregar campo `provider_reply` a `service_reviews` (migracion) |
| **Invitaciones enviadas / usadas** | `review_invitations WHERE provider_id = X` — ratio `is_used = true / total` | Conversion de invitaciones a resenas reales |

#### C. Visibilidad y conversion (fuente: `service_providers` + `vet_bookings`)

| Metrica | Query | Por que importa |
|---|---|---|
| **Vistas al perfil (mes)** | Requiere nueva tabla `provider_view_logs` con timestamp para ver tendencia. Hoy solo hay `directory_views` acumulativo | Tendencia, no solo total historico |
| **Conversion perfil → contacto** | Requiere registrar clicks en telefono/email/WhatsApp como eventos | El vet necesita saber si su perfil genera accion |
| **Reservas recibidas (mes)** | `COUNT(*) FROM vet_bookings WHERE service_provider_id = X AND created_at >= inicio_mes` | Reservas reales, no el pipeline fantasma de orders |
| **Tasa de confirmacion** | `COUNT(status='confirmado'+'completado') / total FROM vet_bookings` | Que % de solicitudes acepta |
| **Posicion en directorio** | Ranking del vet en su comuna por rating + completitud | Motivador para mejorar perfil |

#### D. Financiero (SIMPLIFICADO — sin el sistema orders)

| Metrica | Logica | Por que importa |
|---|---|---|
| **Ingresos estimados (mes)** | `SUM(total_price) FROM vet_bookings WHERE service_provider_id = X AND status = 'completado' AND scheduled_date >= inicio_mes` | Ingreso real por reservas completadas |
| **Comision plataforma** | `ingresos_estimados * tasa_comision_del_plan` | Transparencia |
| **Ingreso neto estimado** | `ingresos - comision` | Lo que se lleva el vet |

> **Nota critica**: El sistema `orders/order_items/provider_balances/balance_transactions` fue disenado para un marketplace generico pero **nunca se conecto al flujo real de reservas vet**. Las metricas financieras deben basarse en `vet_bookings` hasta que se implemente un flujo de pago end-to-end.

---

## 3. Rediseno del layout

### 3.1 Estructura propuesta del dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: "Mi consultorio" + [Editar perfil] [Ver perfil publico] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ ALERTA CONTEXTUAL (condicional) ──────────────────────────┐ │
│ │ - Si perfil < 80%: "Completa tu perfil para aparecer"      │ │
│ │ - Si hay followups hoy: "Tienes 3 seguimientos pendientes" │ │
│ │ - Si nueva ficha compartida: "Maria compartio ficha de..." │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ ROW 1: Metricas de impacto (4 cards) ─────────────────────┐ │
│ │ Pacientes    │ Notas        │ Rating      │ Vistas         │ │
│ │ este mes     │ este mes     │ ★ 4.8       │ este mes       │ │
│ │ 12 (+3)      │ 28           │ 15 resenas  │ 145 (+22%)     │ │
│ │ vs mes ant.  │              │             │ vs mes ant.    │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ ROW 2: Fichas + Seguimientos (2 cols) ────────────────────┐ │
│ │ Fichas compartidas     │ Seguimientos esta semana           │ │
│ │ contigo (ultimos 7d)   │ (ya existe VetFollowupsCard)      │ │
│ │ [lista con avatar]     │ [lista con fecha]                 │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ ROW 3: Actividad reciente (tab view) ─────────────────────┐ │
│ │ [Pacientes] [Reservas] [Resenas]                           │ │
│ │                                                             │ │
│ │ Tab Pacientes: VetPatientsList (ya existe)                 │ │
│ │ Tab Reservas: Lista de vet_bookings con status             │ │
│ │ Tab Resenas: Ultimas resenas con opcion de responder       │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ ROW 4: Tu perfil publico (card compacta) ─────────────────┐ │
│ │ ProviderDirectoryCard (ya existe, simplificada)             │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ ROW 5: Financiero (colapsable, solo si hay reservas) ─────┐ │
│ │ Ingresos estimados | Comision | Neto | Grafico mensual     │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Eliminar del dashboard actual

1. **Balance Disponible / Pendiente / Ganado / Retirado** — Las 4 cards de `provider_balances`. Tablas vacias, pipeline roto.
2. **Ingresos Brutos / Comisiones Pagadas / Pagos Netos** — Las 3 cards de revenue via `order_items`. Misma razon.
3. **"Fichas compartidas" card que muestra margen neto** — Bug: metrica mal etiquetada y con logica incorrecta.
4. **"Clientes unicos" derivado de orderNumber** — Reemplazar por count real de pacientes unicos.
5. **Reservas Recientes (tabla)** — Basada en `order_items`, no tiene datos. Reemplazar por lista de `vet_bookings`.

### 3.3 Mantener y mejorar

1. **VetFollowupsCard** — Excelente componente, mantener pero promover su conteo a las metricas top.
2. **SharedFichasCard** — Mantener, buen diseno con avatar y boton "Nota".
3. **VetPatientsList** — Mantener como tab en seccion de actividad.
4. **ProviderDirectoryCard** — Mantener, ya tiene share, invite, completitud.
5. **Onboarding card** — Mantener la logica de 3 pasos cuando no hay reservas.

---

## 4. Rediseno del perfil

### 4.1 Campos a agregar

| Campo | Tipo DB | UI | Prioridad |
|---|---|---|---|
| `address` | `text` | Input con placeholder "Av. Providencia 1234, Of. 5" | Alta |
| `latitude` / `longitude` | `numeric` | Picker de mapa (Leaflet) o autocompletado | Media |
| `opening_hours` | `jsonb` | Selector de horarios por dia (L-V, Sab, Dom) | Alta |
| `website` | `text` | Input URL | Media |
| `instagram_handle` | `text` | Input con prefijo @ | Media |
| `accepts_emergencies` | `boolean` | Switch "Atiende urgencias" | Alta |
| `languages` | `text[]` | Multi-select (Espanol, Ingles, Mapudungun) | Baja |
| `payment_methods` | `text[]` | Checkboxes (Efectivo, Transferencia, Tarjeta, Flow) | Media |

### 4.2 Mejoras UX del perfil

1. **Wizard mobile**: Dividir en 3 pasos en mobile (Info basica → Especialidades/zonas → Precios/visibilidad)
2. **Preview en vivo**: Split-screen en desktop mostrando como se ve el perfil publico
3. **Validacion de telefono chileno**: regex `/^\+56\s?9\s?\d{4}\s?\d{4}$/`
4. **Fix voseo**: Reemplazar "Verificá", "Necesitás" por "Verifica", "Necesitas"
5. **Seccion de verificacion Colmevet**: Subir imagen del carnet, estado (pendiente/verificado/rechazado)
6. **Seccion de horarios**: Grid visual L-D con franjas horarias
7. **Auto-save draft**: Guardar borrador en localStorage para no perder cambios

### 4.3 Migracion SQL necesaria

```sql
-- 20260427000001_provider_profile_expansion.sql
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{}';
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS accepts_emergencies boolean DEFAULT false;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{Español}';
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT '{Efectivo,Transferencia}';

-- Vista/log de profile views para tendencia temporal
CREATE TABLE IF NOT EXISTS provider_view_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  viewer_id     uuid REFERENCES auth.users(id),
  source        text DEFAULT 'directory' CHECK (source IN ('directory','direct','search','share')),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_provider_view_logs_provider_date
  ON provider_view_logs(provider_id, created_at DESC);

ALTER TABLE provider_view_logs ENABLE ROW LEVEL SECURITY;

-- Provider puede ver sus propios logs
CREATE POLICY "Provider can view own view logs"
  ON provider_view_logs FOR SELECT
  USING (provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid()));

-- Cualquiera puede insertar (visit tracking)
CREATE POLICY "Anyone can log views"
  ON provider_view_logs FOR INSERT
  WITH CHECK (true);

-- Campo de respuesta del provider a resenas
ALTER TABLE service_reviews ADD COLUMN IF NOT EXISTS provider_reply text;
ALTER TABLE service_reviews ADD COLUMN IF NOT EXISTS provider_reply_at timestamptz;
```

---

## 5. Plan de implementacion

### Fase 1: Limpiar metricas rotas (1 commit)

**Archivos a modificar:**
- `src/components/provider/ProviderDashboard.tsx` — Eliminar las 7 cards rotas, reemplazar por metricas reales

**Nuevo hook:**
- `src/hooks/useProviderDashboardStats.ts` — Query centralizada que trae:
  - `vet_clinical_notes` (pacientes, notas del mes)
  - `medical_share_tokens` (fichas compartidas semana)
  - `vet_bookings` (reservas del mes via `service_provider_id`)
  - `service_reviews` (resenas del mes)
  - `service_providers` (views, rating, total_reviews)

**Estructura del hook:**
```typescript
interface ProviderDashboardStats {
  // Clinica
  patientsThisMonth: number;
  patientsDelta: number; // vs mes anterior
  notesThisMonth: number;
  followupsPending: number;
  sharedFichasThisWeek: number;
  
  // Reputacion
  avgRating: number | null;
  totalReviews: number;
  reviewsThisMonth: number;
  invitationsSent: number;
  invitationsConverted: number;
  
  // Visibilidad
  profileViews: number;
  profileViewsDelta: number;
  
  // Financiero (solo si hay vet_bookings completados)
  bookingsThisMonth: number;
  estimatedRevenue: number;
  confirmationRate: number;
}
```

### Fase 2: Metricas con tendencia (1 commit)

- Agregar delta vs mes anterior en pacientes y vistas
- Mini sparkline (Recharts `<Sparklines>`) en cada card de metrica
- Badge "↑ 12%" o "↓ 5%" en verde/rojo

### Fase 3: Tabs de actividad (1 commit)

- Reemplazar tabla de "Reservas Recientes" por tabs: Pacientes | Reservas | Resenas
- Tab Pacientes: `VetPatientsList` (ya existe)
- Tab Reservas: Nueva lista de `vet_bookings` con status badges
- Tab Resenas: Lista de `service_reviews` con boton "Responder" (requiere migracion de `provider_reply`)

### Fase 4: Perfil expandido (1 commit)

- Agregar campos nuevos al form + migracion SQL
- Fix voseo argentino → tuteo chileno
- Validacion telefono chileno
- Seccion de horarios (grid visual)

### Fase 5: Verificacion Colmevet (1 commit)

- UI para subir imagen de credencial
- Status badge (pendiente/verificado/rechazado)
- Integracion con tabla `provider_verifications`

### Fase 6: View tracking avanzado (1 commit)

- Migracion `provider_view_logs`
- Actualizar `increment_provider_views` para loguear ademas del counter
- Grafico de vistas por dia en el dashboard (Recharts AreaChart)

---

## 6. Archivos afectados

### Modificar

| Archivo | Cambio |
|---|---|
| `src/components/provider/ProviderDashboard.tsx` | Reescribir completo — nuevo layout, nuevas queries |
| `src/pages/ProviderProfileEdit.tsx` | Agregar campos, fix voseo, wizard mobile |
| `src/hooks/useProviderProfile.tsx` | Agregar nuevos campos al form + completeness |
| `src/components/provider/ProviderDirectoryCard.tsx` | Simplificar para no duplicar metricas del dashboard |

### Crear

| Archivo | Contenido |
|---|---|
| `src/hooks/useProviderDashboardStats.ts` | Hook centralizado de metricas con react-query |
| `src/components/provider/DashboardMetricCard.tsx` | Card reutilizable con icono, valor, delta, sparkline |
| `src/components/provider/RecentReviewsList.tsx` | Tab de resenas con respuesta |
| `src/components/provider/RecentBookingsList.tsx` | Tab de reservas de vet_bookings |
| `src/components/provider/OpeningHoursEditor.tsx` | Grid de horarios L-D |
| `src/components/provider/VerificationUpload.tsx` | UI para subir credencial Colmevet |
| `supabase/migrations/20260427000001_provider_profile_expansion.sql` | Nuevos campos + view logs |

### No tocar (joya de la corona)

- `src/components/medical/` — Ficha medica PDF
- `src/components/provider/VetNoteEditor.tsx` — Editor de notas clinicas
- `src/components/provider/SharedFichasCard.tsx` — Funciona bien
- `src/components/provider/VetFollowupsCard.tsx` — Funciona bien

---

## 7. Dependencias y riesgos

| Riesgo | Mitigacion |
|---|---|
| `vet_bookings` puede no tener `service_provider_id` poblado (legacy) | Query con `OR vet_id IN (SELECT user_id FROM service_providers WHERE id = X)` |
| `provider_view_logs` puede crecer rapido | Agregar cleanup cron (borrar > 90 dias) o partition por mes |
| Migracion con nuevos campos podria romper upsert | Campos nuevos son todos `DEFAULT` — safe |
| Sparklines requieren datos historicos que no existen aun | Mostrar "—" hasta acumular 2 meses de datos |
| `provider_reply` en `service_reviews` no tiene RLS para update | Agregar policy: provider puede UPDATE solo `provider_reply` y `provider_reply_at` |

---

## 8. Prioridad de ejecucion recomendada

```
[URGENTE]  Fase 1: Limpiar metricas rotas → Dashboard deja de mostrar $0 falsos
[ALTA]     Fase 4: Perfil expandido → Fix voseo + campos faltantes
[MEDIA]    Fase 3: Tabs de actividad → Mejor organizacion de info
[MEDIA]    Fase 2: Metricas con tendencia → Sparklines y deltas
[BAJA]     Fase 5: Verificacion Colmevet → Nice-to-have
[BAJA]     Fase 6: View tracking avanzado → Requiere migracion extra
```

---

## 9. Resumen ejecutivo

El dashboard actual esta **estructuralmente roto**: consulta tablas de un pipeline de marketplace (`orders`, `order_items`, `provider_balances`) que **nunca se conecto al flujo real de reservas veterinarias** (`vet_bookings`). Resultado: todo muestra `$0`.

El perfil funciona pero tiene voseo argentino, le faltan campos criticos (direccion, horarios, urgencias, redes sociales), y no tiene UI para la verificacion profesional que ya existe en la base de datos.

La solucion es:
1. **Reescribir las metricas** basandose en las tablas que SI tienen datos: `vet_clinical_notes`, `medical_share_tokens`, `vet_bookings`, `service_reviews`
2. **Reemplazar vanity metrics** (Balance Disponible en $0) por **metricas accionables** (Pacientes este mes, Notas escritas, Fichas compartidas, Seguimientos pendientes)
3. **Expandir el perfil** con campos que los duenos de mascotas realmente buscan: direccion, horarios, urgencias, metodos de pago
4. **Conectar la verificacion profesional** (tabla `provider_verifications`) con el formulario del perfil

Todo esto usando datos que **ya existen en la base de datos** — no requiere nueva infraestructura, solo mejores queries y un layout que refleje la realidad del producto.
