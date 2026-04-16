# Features inspiradas en VetCheck — Plan ejecutable

> **Origen**: Análisis competitivo de vetcheck.cl (2026-04-16)
> **Objetivo**: Cerrar gaps competitivos B2B sin perder la identidad B2C de Paw Friend
> **Estado**: ✅ Ejecutado — 4 fases implementadas (2026-04-16)
> **Regla**: cada fase es independiente y deployable por separado

---

## Contexto competitivo

VetCheck es un ERP clínico B2B puro: le vende a la clínica, el dueño es usuario pasivo gratis.
Paw Friend es B2C-first con herramientas pro. Competimos por el **vet que busca herramienta digital**.

**Nuestras ventajas defensibles** (NO tocar, solo fortalecer):
- Directorio público con SEO orgánico
- IA integrada (OCR, asistente, breed tips, triage)
- Dual-role en una sola app
- Self-service + precios transparentes
- Gamificación para retención de dueños
- Ficha PDF descargable

**Gaps que este plan cierra**:
- Copropiedad de mascotas
- Reportes de negocio para vets (ingresos, margen, rentabilidad)
- Importación masiva de pacientes
- Cobros/recordatorios de pago por WhatsApp
- Agenda por sala/recurso

---

## Fase 1 — Copropiedad de mascotas 🔴 Alta

> **Por qué**: VetCheck lo tiene. Caso real en Chile: parejas separadas, abuelo con nieto,
> mascota con cuidador. Hoy `pets.owner_id` es singular y no hay forma de compartir.
> **Esfuerzo**: ~6-8h | **Impacto**: Alto (diferenciador B2C + B2B)

### 1.1 Migración SQL

Archivo: `supabase/migrations/YYYYMMDDHHMMSS_pet_co_owners.sql`

```sql
-- Tabla de co-propietarios
CREATE TABLE IF NOT EXISTS pet_co_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'co_owner'
    CHECK (role IN ('co_owner', 'caretaker', 'trainer', 'family_member')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked')),
  UNIQUE(pet_id, user_id)
);

-- RLS: el owner principal y co-owners aceptados pueden ver
ALTER TABLE pet_co_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner puede gestionar co-owners"
  ON pet_co_owners FOR ALL
  USING (
    pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Índices
CREATE INDEX idx_pet_co_owners_pet ON pet_co_owners(pet_id);
CREATE INDEX idx_pet_co_owners_user ON pet_co_owners(user_id);

-- Vista consolidada: mascotas propias + co-owned
CREATE OR REPLACE VIEW my_pets_with_shared AS
SELECT p.*, 'owner' AS relationship
FROM pets p WHERE p.owner_id = auth.uid()
UNION ALL
SELECT p.*, pco.role AS relationship
FROM pets p
JOIN pet_co_owners pco ON pco.pet_id = p.id
WHERE pco.user_id = auth.uid() AND pco.status = 'accepted';
```

### 1.2 Frontend — Invitar co-owner

**Archivos a crear/modificar:**

| Archivo | Cambio |
|---|---|
| `src/hooks/useCoOwners.tsx` | CRUD co-owners + invitaciones (nuevo) |
| `src/hooks/useMyPets.tsx` | Incluir mascotas co-owned en la query |
| `src/components/medical/SharePetAccessModal.tsx` | Modal: email + rol + enviar invitación (nuevo) |
| `src/pages/MyPets.tsx` | Badge "Compartida" en mascotas co-owned, botón "Compartir acceso" |
| `src/pages/PetClinicalRecord/` | Co-owners ven ficha completa (read-only o editable según rol) |

**Flujo UX:**
1. Dueño va a ficha de mascota → botón "Compartir acceso"
2. Modal: ingresa email + selecciona rol (co-dueño / cuidador / familiar / entrenador)
3. Si el email tiene cuenta → notificación in-app + email
4. Si no tiene cuenta → email con link de invitación (reutilizar patrón `send-pet-invitation`)
5. Invitado acepta → mascota aparece en su `/my-pets` con badge de relación
6. Dueño principal puede revocar acceso en cualquier momento

**Permisos por rol:**

| Rol | Ver ficha | Agregar registros | Editar mascota | Compartir con otros | Eliminar mascota |
|---|---|---|---|---|---|
| owner (principal) | ✓ | ✓ | ✓ | ✓ | ✓ |
| co_owner | ✓ | ✓ | ✓ | ✗ | ✗ |
| caretaker | ✓ | ✓ (solo notas) | ✗ | ✗ | ✗ |
| family_member | ✓ | ✗ | ✗ | ✗ | ✗ |
| trainer | ✓ (parcial) | ✓ (solo rutinas) | ✗ | ✗ | ✗ |

### 1.3 Verificación

- [ ] Un usuario puede invitar a otro por email
- [ ] El invitado ve la mascota en `/my-pets` con badge
- [ ] El invitado puede ver la ficha clínica
- [ ] El dueño principal puede revocar acceso
- [ ] Mascota aparece en ambos calendarios de recordatorios
- [ ] PDF de ficha incluye nota "Co-propietarios: X, Y"
- [ ] RLS impide que un co-owner elimine la mascota
- [ ] Si el co-owner ya tenía cuenta, funciona. Si no, el link de invitación funciona.

---

## Fase 2 — Reportes de negocio para vets 🟠 Media

> **Por qué**: VetCheck vende "cuánto vendes, qué servicio es más rentable, cuál es tu margen".
> Nuestro Panel Pro tiene analytics de salud pero no de negocio. Los vets necesitan justificar el gasto.
> **Esfuerzo**: ~4-6h | **Impacto**: Alto para retención B2B

### 2.1 Datos necesarios

Ya existen en el schema:
- `bookings` → citas con `total_price`, `status`, `service_type`
- `service_provider_services` → servicios con `price`
- `reviews` → rating por proveedor

**No existe** (agregar):
```sql
-- Agregar campo de costo/ingreso real a bookings si no existe
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS revenue_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cost_notes TEXT;

-- Vista de métricas de negocio por provider
CREATE OR REPLACE VIEW provider_business_metrics AS
SELECT
  sp.id AS provider_id,
  date_trunc('month', b.booking_date) AS month,
  COUNT(b.id) AS total_bookings,
  COUNT(b.id) FILTER (WHERE b.status = 'completed') AS completed,
  COUNT(b.id) FILTER (WHERE b.status = 'cancelled') AS cancelled,
  SUM(b.total_price) FILTER (WHERE b.status = 'completed') AS gross_revenue,
  AVG(b.total_price) FILTER (WHERE b.status = 'completed') AS avg_ticket,
  COUNT(DISTINCT b.pet_id) AS unique_patients,
  COUNT(DISTINCT b.owner_id) AS unique_clients
FROM service_providers sp
LEFT JOIN bookings b ON b.provider_id = sp.id
GROUP BY sp.id, date_trunc('month', b.booking_date);
```

### 2.2 Frontend — Dashboard de negocio

**Archivo**: `src/components/provider/ProviderBusinessMetrics.tsx` (nuevo)

**Métricas a mostrar** (tarjetas KPI + gráficos Recharts):

| Métrica | Visualización | Fuente |
|---|---|---|
| Ingresos del mes | KPI card + línea mensual | `provider_business_metrics.gross_revenue` |
| Ticket promedio | KPI card | `provider_business_metrics.avg_ticket` |
| Pacientes únicos | KPI card + tendencia | `provider_business_metrics.unique_patients` |
| Tasa de cancelación | KPI card (% rojo si >15%) | `cancelled / total_bookings` |
| Servicio más consultado | Bar chart horizontal | Agrupar bookings por `service_type` |
| Tasa de retorno | KPI card | Pacientes con >1 visita / total |
| Rating promedio | KPI card con estrellas | `reviews` |

**Ubicación**: Nueva tab "Negocio" en `/provider/dashboard` (junto a las tabs existentes)

**Gate**: Mostrar versión limitada (solo ingresos + pacientes) en plan Gratis, completo en plan Individual+.
Usar `PremiumNudge` para las métricas bloqueadas.

### 2.3 Verificación

- [ ] Dashboard muestra métricas reales (no mocks) desde bookings
- [ ] Gráfico de línea muestra tendencia últimos 6 meses
- [ ] Servicio más rentable se calcula correctamente
- [ ] Gate funciona: Gratis ve 2 métricas, pagado ve todo
- [ ] Export CSV funciona (reutilizar patrón de analytics)
- [ ] Responsive en mobile

---

## Fase 3 — Importación masiva de pacientes 🟠 Media

> **Por qué**: VetCheck ofrece "importa tus datos existentes". Hoy en Paw Friend el vet
> crea pacientes 1 por 1. Una clínica con 200 pacientes no va a migrar manualmente.
> **Esfuerzo**: ~5-7h | **Impacto**: Alto para onboarding de clínicas medianas

### 3.1 Flujo UX

1. Vet va a `/provider/pacientes` → botón "Importar pacientes"
2. Modal con 2 opciones:
   - **Subir CSV/Excel**: template descargable con columnas definidas
   - **Copiar y pegar**: textarea para pegar desde Excel (tab-separated)
3. Preview de datos parseados en tabla editable (corregir antes de importar)
4. Validación: duplicados por nombre+especie+dueño, emails inválidos marcados
5. Botón "Importar X pacientes" → bulk create
6. Resumen: X creados, Y con invitación enviada, Z errores

### 3.2 Template CSV

```csv
nombre_mascota,especie,raza,fecha_nacimiento,sexo,nombre_dueno,email_dueno,telefono_dueno,notas
Max,Perro,Golden Retriever,2023-05-15,Macho,María López,maria@email.com,+56912345678,Alérgico a pollo
Luna,Gato,Siamés,2022-01-10,Hembra,Carlos Ruiz,carlos@email.com,,
```

### 3.3 Backend

**Archivo**: `src/lib/importPatients.ts` (nuevo)

```typescript
interface ImportRow {
  nombre_mascota: string;
  especie: string;
  raza?: string;
  fecha_nacimiento?: string;
  sexo?: 'Macho' | 'Hembra';
  nombre_dueno: string;
  email_dueno?: string;
  telefono_dueno?: string;
  notas?: string;
}

// Lógica:
// 1. Parsear CSV/TSV
// 2. Validar con zod
// 3. Detectar duplicados (fuzzy match nombre + especie + email dueño)
// 4. Bulk insert pets con pending_owner_email
// 5. Disparar send-pet-invitation para cada email válido
// 6. Retornar resumen
```

### 3.4 Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/lib/importPatients.ts` | Parser CSV + validación + bulk insert (nuevo) |
| `src/components/provider/ImportPatientsModal.tsx` | Modal con upload/paste + preview + import (nuevo) |
| `src/components/provider/ImportPreviewTable.tsx` | Tabla editable de preview pre-import (nuevo) |
| `src/pages/provider/ProviderPatients.tsx` | Agregar botón "Importar pacientes" en header |

### 3.5 Verificación

- [ ] CSV con 50 filas se parsea correctamente
- [ ] Duplicados se detectan y marcan (no se bloquean, el vet decide)
- [ ] Mascotas se crean con `pending_owner_email` correcto
- [ ] Invitaciones se envían para emails válidos
- [ ] Errores de validación se muestran inline (fila por fila)
- [ ] Template CSV descargable funciona
- [ ] Copiar desde Excel (tab-separated) funciona

---

## Fase 4 — Cobros y agenda por recurso 🟡 Media-baja

> **Por qué**: VetCheck tiene cobros por WhatsApp y agenda por sala. Son features de clínica
> mediana-grande. Implementar cuando tengamos tracción B2B real.
> **Esfuerzo**: ~8-10h total | **Impacto**: Medio (solo para clínicas, no para vets independientes)

### 4.1 Cobros/recordatorios de pago por WhatsApp

**Prerequisito**: Verificación Meta Business (pendiente en `INTEGRACIONES_SETUP.md`)

**Cuando Meta esté activo:**
1. Crear template de cobro en Meta Business: "Hola {{1}}, tienes un saldo pendiente de ${{2}} en {{3}}. Paga aquí: {{4}}"
2. Agregar botón "Enviar cobro" en detalle de booking con status `completed` y `payment_status != 'paid'`
3. Reutilizar edge function `send-whatsapp-reminder` con nuevo template type `payment_reminder`
4. Registro en tabla de auditoría (cuándo se envió, a quién, monto)

**Archivos a modificar:**
- `supabase/functions/send-whatsapp-reminder/index.ts` — agregar template `payment_reminder`
- `src/components/provider/BookingDetail.tsx` — botón "Enviar cobro por WhatsApp"

### 4.2 Agenda por sala/recurso

**Migración:**
```sql
-- Recursos de la clínica (salas, quirófanos, equipos)
CREATE TABLE IF NOT EXISTS provider_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'room'
    CHECK (type IN ('room', 'surgery', 'equipment', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vincular bookings a recursos
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES provider_resources(id);
```

**Frontend:**
- Agregar selector de sala en el flujo de booking (paso 2 del 3-step flow existente)
- Vista de agenda por recurso: columnas = salas, filas = horas (estilo Google Calendar)
- Solo visible para providers con plan Clínica Básica+

### 4.3 Verificación

- [ ] WhatsApp: cobro se envía con monto y link correctos
- [ ] WhatsApp: no se puede enviar doble cobro en menos de 24h
- [ ] Agenda: salas se crean/editan desde panel provider
- [ ] Agenda: booking se puede asignar a sala
- [ ] Agenda: vista por recurso muestra disponibilidad real
- [ ] Gate: solo plan Clínica Básica+ ve la gestión de salas

---

## Resumen de priorización

| Fase | Feature | Prioridad | Esfuerzo | Prerequisito |
|---|---|---|---|---|
| 1 | Copropiedad de mascotas | 🔴 Alta | ~6-8h | Ninguno |
| 2 | Reportes de negocio vet | 🟠 Media | ~4-6h | Bookings con datos reales |
| 3 | Importación masiva pacientes | 🟠 Media | ~5-7h | Ninguno |
| 4a | Cobros WhatsApp | 🟡 Media-baja | ~3h | Verificación Meta Business |
| 4b | Agenda por sala | 🟡 Media-baja | ~5-7h | Ninguno, pero gate a plan Clínica |

---

## Ideas descartadas (y por qué)

| Idea de VetCheck | Por qué NO implementar |
|---|---|
| **Control de stock/inventario** | Es un módulo ERP completo (productos, proveedores, compras, stock mínimo). Nos aleja del core. Requiere +40h y mantenimiento constante. Dejarlo para v2.0 o integrarse con un ERP existente. |
| **Historial multi-clínica** | Requiere efecto de red: muchas clínicas usando Paw Friend. Hoy no tenemos masa crítica. Cuando la tengamos, ya tenemos la base con `pet_vet_links`. |

---

## Notas de ejecución

- **Regla 9.8 aplica**: toda migración debe proteger datos existentes (defaults, no DROP)
- **Regla 9.6 aplica**: no tocar ficha PDF ni directorio vets (solo agregar co-owners al PDF como nota)
- **Copy en chileno**: toda UI nueva con tuteo chileno (regla 9.5)
- **Cada fase es un PR independiente** con su migración, frontend y tests
- **Diagramas**: si se agregan rutas nuevas, actualizar `FLUJO_COMPLETO.mmd` (regla 9.7.1)
