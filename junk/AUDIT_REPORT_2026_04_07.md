# Audit Report — Edge Functions pendientes (2026-04-07)

Sesión post-CONTEXTO_2026_04_07 sección 7.3 + 7.5. Auditadas las 4 edge functions que faltaban + cleanup backend.

## Resumen ejecutivo

| Function | Estado pre-audit | Bugs encontrados | Fixes aplicados | Pendiente |
|---|---|---|---|---|
| `generate-medical-summary` | deployada | 🔴 Sin ownership check, 🟡 PDF en inglés, 🟡 newPage no se usa al hacer overflow | ✅ Ownership check | PDF español + bug newPage (próx. sesión) |
| `generate-medical-zip` | deployada | 🔴 Sin ownership check, 🟡 No genera ZIP real (TODO en código) | ✅ Ownership check | ZIP real con JSZip (decisión scope) |
| `generate-sitemap` | NO deployada | Ninguno, código OK | — | Deploy manual |
| `webpay-confirm` | deployada | 🔴 Sin ownership check (cualquier user confirmaba órdenes ajenas), 🔴 No confirma con Transbank real (TODO) | ✅ Ownership check | Transbank real OBSOLETO si vamos a Flow |

## Detalle de fixes aplicados en esta sesión

### 1. `generate-medical-summary` — ownership check
Antes: cualquier user autenticado podía generar el PDF de cualquier mascota (porque la función usa `SUPABASE_SERVICE_ROLE_KEY` que bypassea RLS).
Fix: query previo a `pets.owner_id` y comparación con `userData.user.id`. Devuelve 403 si no coincide.

### 2. `generate-medical-zip` — ownership check
Mismo bug, mismo fix.

### 3. `webpay-confirm` — ownership check
Antes: cualquier user podía llamar a `webpay-confirm` con un `order_id` ajeno y marcar la orden como pagada.
Fix: comparación `order.user_id === userData.user.id`, devuelve 403 si no coincide.

## Bugs documentados pero NO fixeados (requieren decisión)

### `generate-medical-summary`
- **PDF en inglés**: literales hardcoded "Pet Medical Summary", "Pet Information", "Vaccination Overview", etc. Hay que traducir a español. Decisión: mantener bilingüe vs solo español. Recomendación: solo español, es la joya de la corona del producto chileno.
- **Bug `newPage` overflow**: cuando `yPosition < 50`, crea `newPage = pdfDoc.addPage(...)` pero el siguiente `page.drawText` sigue dibujando en la variable `page` original (la primera). Resultado: páginas extras vacías y contenido perdido fuera de la primera página. Fix: reasignar `page = newPage` y resetear `yPosition` correctamente.

### `generate-medical-zip`
- **No genera ZIP real**: el código devuelve un array de signed URLs sueltas con un `message` "ZIP generation not yet implemented". Si el frontend espera un blob ZIP, está roto funcionalmente. Decisión: agregar dependencia `https://esm.sh/jszip@3.10.1` y armar el ZIP en memoria, o cambiar el frontend para descargar archivos uno por uno. Recomendación: ZIP real porque el feature "descargar todo el historial médico" es parte del pitch a vets.

### `webpay-confirm`
- **No confirma con Transbank real**: marca `payment_status = 'completed'` sin llamar a la API de Transbank. Si se introduce el premium B2C (sección 7.1), esto era bloqueante.
- **Decisión del usuario en esta sesión**: pivotar de Webpay Plus a **Flow** (flow.cl) como pasarela. Implicancias:
  - `webpay-confirm` queda obsoleta o se mantiene solo para órdenes de servicios (no suscripciones).
  - Hay que crear `flow-create-payment` y `flow-confirm` (callback) edge functions nuevas.
  - Credenciales Flow ya generadas y rotadas. Cargar como secrets de Supabase, NUNCA en repo:
    ```bash
    npx supabase secrets set FLOW_API_KEY=xxx FLOW_SECRET_KEY=yyy --project-ref gwailbjlvevkhwcrovfd
    ```

## Cleanup backend aplicado (sección 7.5)

Migración nueva: `supabase/migrations/20260412000000_backend_cleanup.sql`

1. **`training_reviews` policies**: la tabla tenía RLS habilitado pero sin ninguna policy → inutilizable. Agregadas policies de SELECT (todos los autenticados), INSERT/UPDATE/DELETE (solo `auth.uid() = owner_id`).
2. **Buckets `walk-photos` y `verification-docs`**: tenían `file_size_limit = NULL`. Seteados a 5 MB.

**Cómo aplicar**: igual que las migraciones manuales previas (push automático ha fallado en este proyecto), copiar el SQL al SQL Editor del Dashboard:
https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/sql/new

Después marcar como aplicada:
```sql
insert into supabase_migrations.schema_migrations (version, name)
values ('20260412000000', 'backend_cleanup');
```

## Cleanup adicional aplicado

### Rename `ServiceCalendar` → `MyBookings` (item #9 de pendientes legacy)
- Archivo renombrado: `src/pages/ServiceCalendar.tsx` → `src/pages/MyBookings.tsx`
- Función exportada: `ServiceCalendar` → `MyBookings`
- Ruta nueva: `/mis-reservas`
- Ruta legacy: `/calendar` mantiene redirect 301 a `/mis-reservas` con `<Navigate replace />` (no rompe links viejos ni bookmarks)
- Updates en: `App.tsx` (import + 2 routes), `AppSidebar.tsx`, `lib/links.ts`

## Acciones manuales pendientes para el dueño

| # | Acción | Donde | Prioridad |
|---|---|---|---|
| 1 | Aplicar migración `20260412000000_backend_cleanup.sql` en SQL Editor | Supabase Dashboard | 🔴 Alta |
| 2 | Marcar migración como aplicada en `schema_migrations` | Supabase SQL Editor | 🔴 Alta |
| 3 | Redeploy `generate-medical-summary` con ownership fix | `npx supabase functions deploy generate-medical-summary --project-ref gwailbjlvevkhwcrovfd` | 🔴 Alta |
| 4 | Redeploy `generate-medical-zip` con ownership fix | idem | 🔴 Alta |
| 5 | Redeploy `webpay-confirm` con ownership fix | idem | 🟡 Media (obsoleta si vamos a Flow) |
| 6 | Deploy inicial `generate-sitemap` | idem | 🟢 Baja |
| 7 | Cargar secrets Flow rotadas en Supabase | `npx supabase secrets set FLOW_API_KEY=... FLOW_SECRET_KEY=...` | 🔴 Alta (prerrequisito para 7.1 Premium) |
| 8 | Spend cap Anthropic USD 10/mes | https://console.anthropic.com/settings/limits | 🔴 Alta (heredado del contexto) |

## Gates de calidad

- ✅ `npx tsc -b` → 0 errores
- ⏳ `npm run build` → pendiente de correr al final
- ✅ Sin `as any` agregados
- ✅ Sin `console.*` fuera de logger agregados
- ✅ Edge functions: error handling con mensaje genérico al cliente, detalle en log server
