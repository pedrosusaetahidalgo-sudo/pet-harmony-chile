# Admin Powerhouse — Spec completa de rediseno

> Panel de Administracion all-in-one para 1 persona (Pedro), con capacidad de delegar a futuro.
> Fecha: 2026-04-14
> Ultima verificacion de estado: 2026-04-14 (commit 572bc11d)
>
> **Estado verificado del proyecto:**
> - Migracion `20260509000001` ya cambio DB default service_providers.status a 'pending'
> - PERO `useServiceProviders.tsx:229,273` sigue hardcodeando 'approved' (BUG, fix en Fase 1)
> - `useMissions.ts` progreso dinamico ya funciona (C2 de FEATURES_INCOMPLETAS cerrado)
> - `gamification.ts:72-81 awardPoints()` sigue placeholder
> - `featureFlags.ts USER_PREMIUM = false` (intencional, pivot medico)
> - `verify-vet-document` edge function NO existe aun (Fase 5)
> - Demo.tsx protegido con AdminRoute, OK

---

## 0. Resumen ejecutivo

El panel admin actual tiene 14 tabs y ~14 componentes, pero sufre de:

1. **Aprobaciones manuales innecesarias** — todo queda en cola esperando a un humano que no tiene tiempo
2. **Cero monitoreo financiero** — no hay visibilidad de pagos, suscripciones, ni revenue
3. **Cero monitoreo de salud del sistema** — edge functions, errores, cuotas IA sin visibilidad
4. **Metricas superficiales** — solo 6 KPIs basicos, sin tendencias ni graficos
5. **Tabs Legacy redundantes** — `AdminProviders` (legacy) duplica `AdminServiceProviders` (central)
6. **Sin audit trail** — no se registra que hizo el admin ni cuando
7. **Acceso no restringido** — cualquiera con rol `admin` en user_roles entra; no hay super-admin

Este spec transforma el panel en un **powerhouse de gestion para 1 persona** con automatizacion inteligente, monitoreo real y capacidad futura de delegacion.

---

## 1. Control de acceso — Super Admin + Delegacion futura

### 1.1 Problema actual

`useIsAdmin.tsx` verifica `has_role(user_id, 'admin')` en `user_roles`. Cualquier usuario con ese rol tiene acceso completo. No hay distincion de permisos.

### 1.2 Solucion: Tabla `admin_access`

```sql
-- Migracion: YYYYMMDDHHMMSS_admin_access_table.sql

CREATE TABLE IF NOT EXISTS public.admin_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'super_admin', -- super_admin | admin_operator
  permissions JSONB DEFAULT '{}',
  -- Permisos granulares: { "users": true, "providers": true, "payments": true, "settings": true, ... }
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- RLS: solo super_admin puede leer/escribir
ALTER TABLE admin_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access"
  ON admin_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_access aa
      WHERE aa.user_id = auth.uid()
        AND aa.role = 'super_admin'
        AND aa.is_active = true
    )
  );

-- Seed: Pedro como super_admin
INSERT INTO admin_access (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'pedro.susaeta.hidalgo@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
```

### 1.3 Cambio en `useIsAdmin.tsx`

```tsx
// Reemplazar RPC has_role por query directa a admin_access
const { data, error } = await supabase
  .from('admin_access')
  .select('role, permissions, is_active')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .maybeSingle();

return {
  isAdmin: !!data,
  isSuperAdmin: data?.role === 'super_admin',
  permissions: data?.permissions ?? {},
};
```

### 1.4 Flujo de delegacion futura

1. Pedro (super_admin) va a Settings > "Equipo Admin"
2. Ingresa email del nuevo operador
3. Selecciona permisos granulares (checkboxes por seccion)
4. Se crea registro en `admin_access` con `role: 'admin_operator'`
5. El operador ve solo las tabs para las que tiene permiso
6. Pedro puede revocar acceso en cualquier momento

### 1.5 Permisos granulares disponibles

| Permiso | Descripcion | Tabs que habilita |
|---------|-------------|-------------------|
| `dashboard` | Ver metricas y KPIs | Dashboard |
| `providers` | Gestionar proveedores | Proveedores |
| `users` | Gestionar usuarios | Usuarios |
| `payments` | Ver pagos y suscripciones | Finanzas |
| `content` | Moderar contenido | Moderacion, Feed |
| `rewards` | Gestionar rewards y misiones | Rewards, Misiones |
| `ads` | Gestionar anuncios | Anuncios |
| `partners` | Gestionar partners | Partners |
| `settings` | Configuracion de plataforma | Config |
| `safety` | Logs de seguridad | Seguridad |
| `system` | Health del sistema, edge fns | Sistema |

`super_admin` tiene todos los permisos implicitamente.

---

## 2. Automatizacion de aprobaciones — Menos cola, mas inteligencia

### 2.1 Servicios no-vet: Auto-aprobacion inteligente

**Regla**: Paseadores, cuidadores, entrenadores y groomers se aprueban automaticamente SI tienen datos completos.

**Criterios de completitud**:

```
REQUIERE TODO:
- display_name no vacio
- city y commune no vacios
- bio con al menos 20 caracteres
- Al menos 1 service_offering activo en provider_service_offerings
- Al menos 1 foto en photos[]

OPCIONAL PERO BONUS:
- certifications no vacio → badge "Certificado"
- experience_years >= 2 → badge "Experimentado"
```

**Implementacion**: Trigger en Postgres o logica en el hook `useServiceProviders.tsx` al momento de crear/actualizar el provider.

```sql
-- Migracion: auto_approve_non_vet_providers.sql

CREATE OR REPLACE FUNCTION public.auto_approve_provider()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_offering BOOLEAN;
  is_vet BOOLEAN;
BEGIN
  -- Verificar si es vet (NO auto-aprobar vets)
  SELECT EXISTS (
    SELECT 1 FROM provider_service_offerings
    WHERE provider_id = NEW.id AND service_type = 'vet'
  ) INTO is_vet;

  IF is_vet THEN
    RETURN NEW; -- Los vets pasan por verificacion manual/IA
  END IF;

  -- Verificar completitud de datos
  SELECT EXISTS (
    SELECT 1 FROM provider_service_offerings
    WHERE provider_id = NEW.id AND is_active = true
  ) INTO has_offering;

  IF NEW.display_name IS NOT NULL
    AND NEW.display_name != ''
    AND NEW.city IS NOT NULL
    AND NEW.commune IS NOT NULL
    AND NEW.bio IS NOT NULL
    AND char_length(NEW.bio) >= 20
    AND has_offering
  THEN
    NEW.status := 'approved';
  ELSE
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_approve_provider
  BEFORE INSERT OR UPDATE ON service_providers
  FOR EACH ROW
  WHEN (NEW.status = 'pending' OR OLD.status = 'pending')
  EXECUTE FUNCTION auto_approve_provider();
```

**En el admin panel**: mostrar badge "Auto-aprobado" vs "Aprobado manualmente" para distinguir.

### 2.2 Veterinarios: Verificacion asistida por IA

**Flujo actual**: Admin revisa manualmente numero Colmevet en colegioveterinario.cl.

**Flujo nuevo**:

1. Vet sube documento de verificacion (titulo, carnet Colmevet, certificado)
2. Edge function `verify-vet-document` analiza con IA:
   - OCR del documento
   - Extrae nombre completo y numero de colegiado
   - Compara nombre del documento vs `display_name` del provider
   - Compara numero vs `license_number` ingresado
   - Asigna score de confianza: 0-100
3. Resultado:
   - **Score >= 80**: Auto-aprobado con badge "Verificado por IA"
   - **Score 50-79**: Marcado para revision rapida (admin solo confirma)
   - **Score < 50**: Requiere revision manual completa
4. Admin ve en la cola solo los casos < 80, con el analisis IA pre-cargado

**Edge function nueva**: `verify-vet-document/index.ts`

```typescript
// Pseudocodigo
const result = await analyzeDocument(documentUrl);
const nameMatch = fuzzyMatch(result.extractedName, provider.display_name);
const licenseMatch = result.extractedLicense === provider.license_number;
const confidence = calculateConfidence(nameMatch, licenseMatch, result.documentQuality);

await supabase.from('vet_verification_results').upsert({
  provider_id,
  confidence_score: confidence,
  extracted_name: result.extractedName,
  extracted_license: result.extractedLicense,
  name_match_score: nameMatch,
  document_quality: result.documentQuality,
  auto_approved: confidence >= 80,
  reviewed_at: confidence >= 80 ? new Date() : null,
});

if (confidence >= 80) {
  await supabase.from('service_providers').update({
    is_verified: true,
    verified_at: new Date(),
    verified_by: 'ai-verification',
  }).eq('id', provider_id);
}
```

**Tabla nueva**: `vet_verification_results`

```sql
CREATE TABLE IF NOT EXISTS public.vet_verification_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  extracted_name TEXT,
  extracted_license TEXT,
  name_match_score FLOAT,
  document_quality TEXT, -- 'high' | 'medium' | 'low' | 'unreadable'
  auto_approved BOOLEAN DEFAULT false,
  admin_override BOOLEAN DEFAULT false,
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT, -- 'ai-verification' | admin user_id
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Verificaciones de rol: Auto-aprobar si ya son providers

**Problema**: Usuarios piden verificacion de rol (ej: "quiero ser Entrenador") y queda en cola. Pero muchos ya tienen un `service_providers` aprobado con ese tipo de servicio.

**Solucion**: Si el usuario ya tiene un provider aprobado con un `service_offering` del tipo solicitado → auto-aprobar y agregar rol.

```sql
CREATE OR REPLACE FUNCTION public.auto_resolve_verification_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matching_provider BOOLEAN;
BEGIN
  -- Buscar si ya tiene provider aprobado con el servicio correspondiente
  SELECT EXISTS (
    SELECT 1
    FROM service_providers sp
    JOIN provider_service_offerings pso ON pso.provider_id = sp.id
    WHERE sp.user_id = NEW.user_id
      AND sp.status = 'approved'
      AND (
        (NEW.requested_role = 'dog_walker' AND pso.service_type = 'walking')
        OR (NEW.requested_role = 'dogsitter' AND pso.service_type = 'sitting')
        OR (NEW.requested_role = 'trainer' AND pso.service_type = 'training')
        OR (NEW.requested_role = 'groomer' AND pso.service_type = 'grooming')
        OR (NEW.requested_role = 'vet' AND pso.service_type = 'vet' AND sp.is_verified = true)
      )
  ) INTO matching_provider;

  IF matching_provider THEN
    NEW.status := 'approved';
    NEW.notes := 'Auto-aprobado: provider ya verificado con servicio activo';
    NEW.reviewed_at := now();

    -- Agregar rol
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.requested_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
```

### 2.4 Promociones: Auto-aprobar con score IA

**Actual**: Promociones quedan en cola para revision manual.

**Nuevo**: Si `ai_moderation_score` >= 0.8 (ya existe el campo) → auto-aprobar. Solo las que fallen moderacion o tengan score bajo van a cola.

---

## 3. Rediseno de tabs — De 14 a 8 secciones enfocadas

### 3.1 Estructura nueva

El panel se reorganiza en **8 secciones** con navegacion lateral (sidebar) en desktop y tabs colapsables en mobile:

| # | Seccion | Icono | Contenido (merge de tabs actuales) |
|---|---------|-------|------------------------------------|
| 1 | **Dashboard** | BarChart3 | Metricas ampliadas + KPIs + graficos de tendencia |
| 2 | **Proveedores** | Briefcase | Central + Legacy + Vets Colmevet (unificado) |
| 3 | **Usuarios** | Users | Gestion usuarios + Verificaciones de rol |
| 4 | **Finanzas** | DollarSign | **NUEVO** — Suscripciones, pagos, revenue, comisiones |
| 5 | **Contenido** | FileText | Moderacion + Promociones + Feed stats |
| 6 | **Gamificacion** | Gamepad2 | Rewards + Misiones (unificado) |
| 7 | **Comercial** | Megaphone | Anuncios + Partners (unificado) |
| 8 | **Sistema** | Settings | Config + Seguridad + Health + Audit + Equipo Admin |

**Eliminados**:
- Tab "Legacy" → se fusiona en "Proveedores" con subtab
- Tab "Vets Colmevet" → subtab dentro de "Proveedores"
- Tab "Safety Logs" → subtab dentro de "Sistema > Seguridad"

### 3.2 Navegacion

```
Desktop: Sidebar fijo izquierdo con iconos + labels
Mobile: Bottom sheet o hamburger con las 8 secciones
Cada seccion: subtabs horizontales para sub-secciones
```

---

## 4. Dashboard (seccion 1) — Metricas reales

### 4.1 KPIs principales (fila superior, 4 cards)

| KPI | Query | Color |
|-----|-------|-------|
| **Usuarios activos (7d)** | profiles con last_sign_in >= 7d ago | Azul |
| **Revenue mensual (MRR)** | SUM(payment_amount_clp) de subscriptions activas | Verde |
| **Proveedores pendientes** | COUNT service_providers WHERE status='pending' | Naranja (alerta si > 0) |
| **Items por revisar** | SUM de: verification_requests pending + content_reports pending + promotions pending | Rojo (alerta si > 0) |

### 4.2 Graficos de tendencia (Recharts, ya esta en el stack)

| Grafico | Tipo | Datos |
|---------|------|-------|
| **Registros ultimos 30 dias** | Area chart | profiles.created_at agrupado por dia |
| **Revenue ultimos 30 dias** | Bar chart | orders.total_clp agrupado por dia (solo paid) |
| **Mascotas registradas** | Line chart | pets.created_at agrupado por semana |
| **Bookings por tipo** | Donut chart | walk/vet/sitter/training bookings del mes |

### 4.3 Feed de actividad reciente (timeline)

Lista cronologica de los ultimos 20 eventos relevantes:
- Nuevo usuario registrado
- Nuevo provider creado (con status)
- Pago completado
- Pago fallido (highlight rojo)
- Contenido reportado
- Verificacion solicitada
- Provider auto-aprobado

**Implementacion**: Vista SQL o query compuesta que une las tablas principales ordenadas por created_at DESC.

### 4.4 Alertas activas (banner superior)

Alertas que requieren atencion inmediata:
- Pagos fallidos en las ultimas 24h
- Providers pendientes > 48h sin revisar
- Content reports sin atender > 24h
- Edge functions con errores recientes
- Suscripciones por vencer en 7 dias sin auto-renew

---

## 5. Proveedores (seccion 2) — Unificado

### 5.1 Subtabs

| Subtab | Contenido |
|--------|-----------|
| **Todos** | Vista unificada service_providers con filtros (tipo servicio, status, verificado) |
| **Pendientes** | Solo status='pending', ordenados por antiguedad (SLA: < 48h) |
| **Vets Colmevet** | Verificacion de licencia con IA assist (score, docs, match) |
| **Legacy** | dog_walker_profiles + dogsitter_profiles + trainer_profiles (read-only, para migrar) |

### 5.2 Vista detalle de provider (drawer/modal)

Al hacer click en el ojo de un provider:

- **Header**: Avatar, nombre, ciudad/comuna, rating, fecha registro
- **Servicios**: Lista de offerings con precios
- **Documentos**: Fotos, certificaciones, documento de verificacion
- **Verificacion IA** (solo vets): Score, nombre extraido, licencia extraida, match %
- **Stats**: Bookings completados, revenue generado, reviews recibidas
- **Timeline**: Historial de cambios de status con fechas y quien lo hizo
- **Acciones**: Aprobar / Rechazar / Suspender / Verificar

### 5.3 Indicadores de SLA

- Badge verde: "Resuelto en < 24h"
- Badge amarillo: "Pendiente > 24h"
- Badge rojo: "Pendiente > 48h — requiere atencion"

---

## 6. Usuarios (seccion 3)

### 6.1 Mejoras sobre AdminUsers actual

**Actual**: Lista basica con nombre, roles, nivel, puntos, fecha.

**Nuevo**:

- **Busqueda avanzada**: Por nombre, email, rol, plan, fecha de registro, ultima actividad
- **Filtros rapidos**: Activos (7d), Inactivos (30d+), Premium, Free, Con mascotas, Sin mascotas
- **Detalle de usuario** (drawer):
  - Perfil completo (nombre, email, avatar, plan, fecha registro)
  - Mascotas asociadas (lista con species, breed, status)
  - Roles asignados
  - Suscripcion activa (plan, fecha inicio, vencimiento, auto-renew)
  - Actividad reciente (posts, bookings, reviews)
  - Paw Points y nivel guardian
  - Acciones: Asignar/quitar rol, Dar puntos, Enviar notificacion, Suspender

### 6.2 Verificaciones de rol (integrado como subtab)

Mueve `AdminVerificationRequests` como subtab "Verificaciones" dentro de Usuarios. Ya no es tab separada.

---

## 7. Finanzas (seccion 4) — COMPLETAMENTE NUEVO

### 7.1 KPIs financieros

| Metrica | Query |
|---------|-------|
| **MRR** | SUM(payment_amount_clp) de subscriptions WHERE status='active' |
| **Suscripciones activas** | COUNT subscriptions WHERE status='active' |
| **Churn rate (30d)** | subscriptions canceladas en 30d / total activas inicio mes |
| **Revenue total (mes)** | SUM orders.total_clp WHERE payment_status='completed' AND mes actual |
| **Comisiones cobradas (mes)** | SUM orders.platform_fee WHERE mes actual |
| **Pagos fallidos (7d)** | COUNT orders WHERE payment_status='failed' AND ultimos 7d |

### 7.2 Tabla de suscripciones

| Columna | Dato |
|---------|------|
| Usuario | Nombre + email |
| Plan | Premium B2C / Individual B2B / Clinica Basica / Clinica Pro |
| Estado | active / pending / cancelled / expired (badge de color) |
| Monto | $X.XXX CLP/mes |
| Inicio | Fecha |
| Vencimiento | Fecha + dias restantes |
| Auto-renew | Si/No toggle |

**Filtros**: Por plan, estado, fecha de vencimiento proxima.

### 7.3 Tabla de transacciones/ordenes

| Columna | Dato |
|---------|------|
| ID Orden | # |
| Usuario | Nombre |
| Proveedor | Nombre del service provider |
| Monto | total_clp |
| Fee plataforma | platform_fee |
| Estado pago | pending/completed/failed/refunded (badge) |
| Metodo | Flow.cl |
| Fecha | created_at |

### 7.4 Grafico revenue

- Line chart: Revenue diario ultimos 30 dias
- Bar chart: Revenue por tipo de servicio
- Pie chart: Distribucion por plan de suscripcion

### 7.5 Alertas financieras

- Pagos fallidos recientes (lista con boton de retry o contactar usuario)
- Suscripciones que vencen en 7 dias sin auto-renew (oportunidad de retencion)
- Providers con comisiones pendientes de liquidar

---

## 8. Contenido (seccion 5)

### 8.1 Subtabs

| Subtab | Contenido |
|--------|-----------|
| **Moderacion** | Reports pendientes (actual AdminModeration mejorado) |
| **Promociones** | Service promotions (actual AdminServicePromotions) |
| **Feed Stats** | **NUEVO** — Metricas del feed social |

### 8.2 Feed Stats (nuevo)

| Metrica | Query |
|---------|-------|
| Posts hoy | COUNT posts WHERE created_at = today |
| Posts esta semana | COUNT posts 7d |
| Posts con imagen | COUNT WHERE image_url IS NOT NULL |
| Engagement promedio | AVG(likes_count + comments_count) |
| Top posts (semana) | TOP 5 por engagement |
| Usuarios mas activos | TOP 5 por cantidad de posts |

### 8.3 Moderacion mejorada

- **Cola con prioridad**: Reports mas antiguos primero
- **SLA badge**: Verde (< 12h), Amarillo (12-24h), Rojo (> 24h)
- **Accion rapida**: Dismiss / Eliminar post / Suspender usuario (1 click)
- **Historial**: Ver reports resueltos con que accion se tomo

---

## 9. Gamificacion (seccion 6)

### 9.1 Merge Rewards + Misiones

Tab unica con 2 subtabs:
- **Paw Shop** (actual AdminRewards)
- **Misiones** (actual AdminMissions)

### 9.2 Stats de gamificacion (nuevo header)

| Metrica | Query |
|---------|-------|
| Puntos totales en circulacion | SUM user_guardian_progress.total_paw_points |
| Canjes este mes | COUNT paw_point_transactions WHERE type='redeem' AND mes |
| Misiones completadas hoy | COUNT de completions |
| Usuarios con puntos > 500 | COUNT |
| Reward mas canjeado | TOP 1 por canjes |

---

## 10. Comercial (seccion 7)

### 10.1 Merge Anuncios + Partners

Tab unica con 2 subtabs:
- **Anuncios** (actual AdManagement)
- **Partners** (actual AdminPartnerSubmissions)

### 10.2 Metricas comerciales (nuevo header)

| Metrica | Dato |
|---------|------|
| Anuncios activos | COUNT partners WHERE is_active=true |
| Impresiones totales (mes) | SUM impressions |
| Clicks totales (mes) | SUM clicks |
| CTR promedio | AVG(clicks/impressions) |
| Partners pendientes | COUNT submissions WHERE status='pendiente' |

---

## 11. Sistema (seccion 8) — NUEVO

### 11.1 Subtabs

| Subtab | Contenido |
|--------|-----------|
| **Config** | AdminSettings actual (comisiones, stats plataforma) |
| **Seguridad** | Safety logs (bereavement) + Login anomalies |
| **Health** | **NUEVO** — Monitoreo edge functions + IA usage |
| **Audit Log** | **NUEVO** — Registro de acciones admin |
| **Equipo** | **NUEVO** — Gestion de acceso admin (delegacion) |

### 11.2 Health del sistema

**Tabla `system_health_log`** (nueva):

```sql
CREATE TABLE IF NOT EXISTS public.system_health_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success' | 'error' | 'timeout'
  execution_time_ms INT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_system_health_created ON system_health_log(created_at DESC);
CREATE INDEX idx_system_health_status ON system_health_log(status);
```

**Dashboard de health**:

| Metrica | Detalle |
|---------|---------|
| Edge functions status | Lista de 21 functions con ultimo estado (verde/rojo/gris) |
| Errores ultimas 24h | COUNT WHERE status='error' agrupado por function |
| Latencia promedio | AVG execution_time_ms por function |
| IA Usage | Cuota consumida hoy por skill (de tabla ai_usage) |
| Storage | Espacio usado en Supabase Storage (fotos, docs) |

**Cada edge function loguea** al inicio y fin:
```typescript
// En _shared/health-logger.ts
export async function logHealth(functionName: string, status: string, executionTimeMs: number, error?: string) {
  await supabaseAdmin.from('system_health_log').insert({
    function_name: functionName,
    status,
    execution_time_ms: executionTimeMs,
    error_message: error,
  });
}
```

### 11.3 Audit Log

**Tabla `admin_audit_log`** (nueva):

```sql
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  -- Ejemplos: 'provider.approve', 'provider.reject', 'user.add_role',
  -- 'user.remove_role', 'reward.create', 'ad.deactivate', 'settings.update'
  target_type TEXT, -- 'provider' | 'user' | 'post' | 'reward' | 'ad' | 'settings'
  target_id TEXT,   -- ID del recurso afectado
  details JSONB DEFAULT '{}',
  -- { "old_status": "pending", "new_status": "approved", "reason": "..." }
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_admin ON admin_audit_log(admin_user_id);
```

**En el admin panel**: Timeline de acciones recientes con filtros por admin, tipo, fecha.

**Implementacion**: Hook `useAdminAudit()` que se invoca en cada mutacion admin:

```typescript
const logAction = async (action: string, targetType: string, targetId: string, details?: object) => {
  await supabase.from('admin_audit_log').insert({
    admin_user_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
};
```

### 11.4 Equipo Admin

Vista para gestionar `admin_access`:

- Lista de admins con nombre, email, rol, ultimo login, estado
- Boton "Invitar operador" (solo super_admin)
- Toggle de permisos por seccion
- Boton desactivar/reactivar
- Solo visible para `super_admin`

---

## 12. Componentes a crear / modificar

### 12.1 Archivos nuevos

| Archivo | Descripcion |
|---------|-------------|
| `src/components/admin/AdminDashboard.tsx` | Dashboard con KPIs, graficos, timeline, alertas |
| `src/components/admin/AdminFinance.tsx` | Seccion financiera completa |
| `src/components/admin/AdminFeedStats.tsx` | Metricas del feed social |
| `src/components/admin/AdminSystemHealth.tsx` | Monitoreo de edge functions y IA |
| `src/components/admin/AdminAuditLog.tsx` | Timeline de acciones admin |
| `src/components/admin/AdminTeam.tsx` | Gestion equipo admin |
| `src/components/admin/AdminActivityFeed.tsx` | Timeline de actividad reciente de la plataforma |
| `src/components/admin/AdminAlerts.tsx` | Alertas activas que requieren atencion |
| `src/hooks/useAdminAudit.ts` | Hook para loguear acciones admin |
| `src/hooks/useAdminAccess.ts` | Hook para verificar permisos granulares |
| `supabase/functions/verify-vet-document/index.ts` | Edge function verificacion IA de docs vet |

### 12.2 Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Admin.tsx` | Reestructurar de 14 tabs → 8 secciones con sidebar |
| `src/hooks/useIsAdmin.tsx` | Migrar de `has_role` RPC → query `admin_access` |
| `src/components/AdminRoute.tsx` | Usar nuevo `useAdminAccess` |
| `src/components/admin/AdminMetrics.tsx` | Reemplazar por `AdminDashboard` mas completo |
| `src/components/admin/AdminServiceProviders.tsx` | Integrar vet verification, quitar banner auto-aprobacion |
| `src/components/admin/AdminSettings.tsx` | Mover a subtab de Sistema |
| `src/components/admin/AdminSafetyLogs.tsx` | Mover a subtab de Sistema > Seguridad |
| `src/hooks/useServiceProviders.tsx` | Quitar hardcode `status: 'approved'`, respetar DB default |
| `supabase/functions/_shared/ai-base.ts` | Agregar logging a system_health_log |

### 12.3 Archivos a deprecar (no eliminar, solo dejar de importar)

| Archivo | Razon |
|---------|-------|
| `src/components/admin/AdminProviders.tsx` | Legacy, migrar data a service_providers y despues eliminar |

---

## 13. Migraciones SQL necesarias

| # | Nombre | Contenido |
|---|--------|-----------|
| 1 | `_admin_access_table.sql` | Tabla admin_access + RLS + seed Pedro |
| 2 | `_admin_audit_log.sql` | Tabla admin_audit_log + indices |
| 3 | `_system_health_log.sql` | Tabla system_health_log + indices |
| 4 | `_vet_verification_results.sql` | Tabla vet_verification_results |
| 5 | `_auto_approve_non_vet.sql` | Trigger auto_approve_provider + auto_resolve_verification |
| 6 | `_auto_approve_promotions.sql` | Trigger auto-aprobar promotions con score IA >= 0.8 |
| 7 | `_fix_provider_status_code.sql` | (no SQL, pero reminder de fix en useServiceProviders.tsx) |

---

## 14. Cosas que quedaban en cola de nadie (diagnostico)

| Item | Estado actual | Solucion |
|------|--------------|----------|
| Verification requests (rol) | Pendiente manual | Auto-aprobar si ya tiene provider aprobado con servicio matching |
| Service providers no-vet | status='pending' pero code forza 'approved' (inconsistencia) | Fix code + trigger auto-approve por completitud |
| Vets sin verificar | Solo manual via Colmevet web | IA-assisted: OCR + name match + score |
| Promotions | Pendiente manual | Auto-aprobar si ai_moderation_score >= 0.8 |
| Partner submissions | Pendiente manual | Notificacion al admin cuando hay nuevas (alert en dashboard) |
| Content reports | Solo visible si admin abre la tab | Badge/count en sidebar + alerta si > 24h sin resolver |
| Pagos fallidos | Invisible en admin | Nueva seccion Finanzas con alertas |
| Suscripciones por vencer | Invisible | Alert en dashboard + lista en Finanzas |
| Edge function errors | Solo en Supabase logs (externo) | system_health_log + dashboard interno |
| IA quota agotada | Solo tabla ai_usage sin UI | Visible en Sistema > Health |

---

## 15. Prioridad de implementacion

### Fase 1 — Fundacion (dia 1)
1. Tabla `admin_access` + migrar `useIsAdmin` → solo Pedro tiene acceso
2. Fix `useServiceProviders.tsx` → quitar hardcode `status: 'approved'`
3. Trigger `auto_approve_provider` para no-vets
4. Trigger `auto_resolve_verification_request`

### Fase 2 — Dashboard y Finanzas (dia 2)
5. `AdminDashboard.tsx` con KPIs mejorados + graficos Recharts
6. `AdminFinance.tsx` con suscripciones, ordenes, revenue
7. `AdminActivityFeed.tsx` timeline de actividad reciente
8. `AdminAlerts.tsx` con alertas activas

### Fase 3 — Reestructura (dia 3)
9. Refactor `Admin.tsx` de 14 tabs → 8 secciones con sidebar
10. Merge Rewards + Misiones en Gamificacion
11. Merge Anuncios + Partners en Comercial
12. Integrar Verificaciones dentro de Usuarios
13. Integrar Vets Colmevet dentro de Proveedores

### Fase 4 — Sistema y Auditoria (dia 4)
14. Tabla `admin_audit_log` + hook `useAdminAudit`
15. `AdminAuditLog.tsx`
16. Tabla `system_health_log` + logging en edge functions
17. `AdminSystemHealth.tsx`
18. `AdminTeam.tsx` para delegacion futura

### Fase 5 — IA Vet Verification (dia 5)
19. Tabla `vet_verification_results`
20. Edge function `verify-vet-document`
21. UI de verificacion asistida en Proveedores > Vets Colmevet

---

## 16. Mockup de layout final

```
+---------------------------------------------+
| Paw Friend Admin          pedro.s.. | Salir |
+--------+------------------------------------+
|        |                                    |
| [icon] Dashboard                            |
| [icon] Proveedores                          |
| [icon] Usuarios        CONTENIDO PRINCIPAL  |
| [icon] Finanzas        (cambia segun tab)   |
| [icon] Contenido                            |
| [icon] Gamificacion                         |
| [icon] Comercial                            |
| [icon] Sistema                              |
|        |                                    |
|        | [subtabs horizontales si aplica]    |
|        |                                    |
+--------+------------------------------------+
```

Dashboard default muestra:
```
+----+----+----+----+
| Usuarios | MRR  | Pendientes | Por revisar |
| activos  |      | proveedores| (total)     |
+----+----+----+----+

[ALERTAS ACTIVAS]  (banner rojo/naranja si hay items)

+-------------------+-------------------+
| Registros 30d     | Revenue 30d       |
| (area chart)      | (bar chart)       |
+-------------------+-------------------+

[ACTIVIDAD RECIENTE - timeline 20 items]
```

---

## 17. Notas tecnicas

- **Recharts** ya esta en el stack (package.json) — usar para todos los graficos
- **shadcn/ui** Card, Badge, Table, Dialog, Sheet ya disponibles
- **@tanstack/react-query** para todas las queries con staleTime apropiado (metricas: 60s, config: 5min)
- **Sonner** para toasts de acciones admin
- **NO agregar** librerias nuevas — todo se puede hacer con el stack existente
- Las migraciones SQL se aplican manualmente via Supabase Dashboard SQL Editor (regla 9.2)
- Edge function nueva sigue patron de `_shared/ai-base.ts` para IA
