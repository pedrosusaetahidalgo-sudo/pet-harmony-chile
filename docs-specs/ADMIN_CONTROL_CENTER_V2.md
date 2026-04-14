# Admin Control Center V2 — Centro de operaciones completo

> Un solo panel para monitorear, gestionar y operar todo Paw Friend.
> Optimizado para 1 persona. Nada se escapa.
> Fecha: 2026-04-14

---

## 1. Recopilacion de errores — Nada invisible

### 1.1 Tabla `error_logs` (nueva)

```sql
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('frontend', 'edge_function', 'database', 'external')),
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'critical')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  -- { url, component, user_id, browser, function_name, etc. }
  user_id UUID REFERENCES auth.users(id),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_unresolved ON error_logs(resolved, created_at DESC) WHERE resolved = false;
CREATE INDEX idx_error_logs_source ON error_logs(source, created_at DESC);
```

### 1.2 Fuentes de errores capturados

| Fuente | Como se captura | Que se guarda |
|--------|----------------|---------------|
| **Frontend JS** | ErrorBoundary + window.onerror + unhandledrejection → POST a edge fn `log-error` | Component stack, URL, user_id, browser |
| **Edge Functions** | Wrapper en `_shared/ai-base.ts` → INSERT a error_logs | Function name, error message, stack, execution_time |
| **Supabase queries** | Hook wrapper que detecta errores de queries → INSERT | Table, operation, error code, user_id |
| **Pagos Flow.cl** | Webhook errors → INSERT automatico | Transaction ID, amount, error type |
| **IA (Claude)** | Rate limits, timeouts, invalid responses → INSERT | Model, tokens, error type, skill |

### 1.3 Edge function `log-error` (nueva)

Endpoint publico (no requiere auth) para que el frontend envie errores:
- Valida estructura basica
- Rate limit por IP (max 10 errores/minuto)
- INSERT en error_logs con source='frontend'

### 1.4 AdminErrorLog component

Dashboard de errores con:
- **KPIs**: Errores hoy, esta semana, sin resolver, criticos
- **Tabla**: Lista de errores con filtros por source, severity, resolved
- **Accion**: Marcar como resuelto, ver detalle (stack trace, context)
- **Grafico**: Errores por dia ultimos 7 dias (BarChart)

---

## 2. Monitoreo completo — Que no falte nada

### 2.1 Dashboard expandido

| Metrica | Fuente | Tipo |
|---------|--------|------|
| **Usuarios activos (24h)** | profiles.updated_at | KPI card |
| **Nuevos usuarios (7d)** | profiles.created_at | KPI + trend |
| **Mascotas registradas** | pets count | KPI |
| **Revenue MRR** | subscriptions activas | KPI financiero |
| **Pagos fallidos (7d)** | orders.payment_status='failed' | Alerta roja |
| **Errores sin resolver** | error_logs.resolved=false | Alerta roja |
| **Providers pendientes** | service_providers.status='pending' | Alerta naranja |
| **Items por revisar** | verification_requests + content_reports + promotions pending | Alerta naranja |
| **Bookings (7d)** | bookings.created_at | KPI |
| **Posts (7d)** | posts.created_at | KPI |
| **Reviews (total)** | service_reviews count | KPI |
| **Conversiones signup→pet** | profiles con al menos 1 pet / total profiles | % |
| **Tasa onboarding completo** | profiles con onboarding_completed / total | % |
| **Edge functions health** | system_health_log errores 24h | Status indicator |
| **IA usage hoy** | ai_usage calls_today | Progress bar |
| **Storage usage** | Supabase storage (si disponible) | Info |

### 2.2 Alertas inteligentes (banner superior)

Alertas que aparecen automaticamente si hay problemas:
- Errores criticos sin resolver (rojo)
- Pagos fallidos recientes (rojo)
- Providers pendientes > 48h (naranja)
- Content reports sin atender > 24h (naranja)
- Edge functions con errores recientes (naranja)
- Suscripciones por vencer sin auto-renew (amarillo)
- IA quota > 80% consumida (amarillo)

---

## 3. UX/UI Profesional — Tema formal

### 3.1 Admin: tema oscuro/formal (slate)

El panel admin usa un tema visual diferente al resto de la app:

**Paleta admin:**
- Background: `bg-slate-950` (sidebar) + `bg-slate-900` (main)
- Cards: `bg-slate-800/50 border-slate-700`
- Text: `text-slate-100` (primary) + `text-slate-400` (muted)
- Accent: `text-emerald-400` (success) + `text-amber-400` (warning) + `text-red-400` (error)
- Primary actions: `bg-indigo-600 hover:bg-indigo-500`

**Tipografia admin:**
- Datos/numeros: `font-mono` (monospace para KPIs, IDs, scores)
- Headers: `font-semibold tracking-tight`
- Labels: `text-xs uppercase tracking-wider text-slate-500`

**Componentes admin:**
- Cards sin shadow, bordes sutiles `border-slate-700/50`
- Tables con `divide-slate-700` y row hover `hover:bg-slate-800/80`
- Badges flat sin background heavy
- Buttons: outlined por defecto, filled solo para acciones primarias

### 3.2 Vista veterinario/provider: profesional medico

Para `/provider/dashboard`, `/provider/profile-edit`, `/provider/pacientes`:

**Paleta provider:**
- Background: `bg-white` limpio (no gradientes playful)
- Cards: Bordes `border-slate-200`, sin purple tints
- Accent medico: `text-teal-700` (profesional, no purple)
- Headers: `text-slate-900 font-semibold`
- Stats: `font-mono text-2xl` para numeros

**Principios:**
- Menos decoracion, mas datos
- Tablas limpias con sorting
- Iconos funcionales, no decorativos
- Spacing consistente, no apretado

---

## 4. Implementacion

### Fase A — Error collection (infra)
1. Migracion tabla `error_logs`
2. Edge function `log-error`
3. Wrapper en `_shared/ai-base.ts` para loguear errores a DB
4. Hook `useErrorReporter` para frontend

### Fase B — Admin error dashboard
5. `AdminErrorLog.tsx` con tabla, filtros, KPIs, grafico
6. Integrar en Sistema > Errores (nueva subtab)

### Fase C — Visual redesign admin
7. CSS variables admin theme en index.css
8. Wrapper `AdminTheme` que aplica clases al entrar a /admin
9. Actualizar Admin.tsx sidebar + header

### Fase D — Visual redesign provider
10. Actualizar ProviderDashboard con tema profesional
11. Actualizar ProviderProfileEdit
12. Actualizar provider/pacientes
