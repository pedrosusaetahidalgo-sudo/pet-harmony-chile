# Partners Onboarding — Plan de ejecución

> Fecha: 2026-04-13
> Estado: EN EJECUCIÓN

---

## Objetivo

Construir el sistema completo de captación de partners para Paw Friend:

1. **Emails tipo** personalizados por categoría de partner (qué ganan ellos, qué ganamos nosotros)
2. **Formulario de ingreso** público (`/registro-partner`) — landing bonita con paleta de la app
3. **Almacenamiento** en tabla `partner_submissions` de Supabase — Pedro carga manualmente al directorio
4. **Alimentar el directorio de servicios** existente (`/servicios`, `/maps`, directorio vets)

---

## Categorías de partners

| Categoría | Código DB | Icono | Color | Tiene booking? |
|---|---|---|---|---|
| Veterinaria / Clínica | `veterinaria` | Stethoscope | emerald | Sí (ya existe flujo propio) |
| Tienda de mascotas | `tienda` | Store | blue | No (directorio) |
| Peluquería canina | `peluqueria` | Scissors | pink | Sí (groomers) |
| Paseador de perros | `paseador` | Dog | cyan | Sí (walkers) |
| Cuidador / Dogsitter | `cuidador` | ShieldCheck | purple | Sí (sitters) |
| Entrenador canino | `entrenador` | GraduationCap | orange | Sí (trainers) |
| Refugio / Fundación | `refugio` | Heart | rose | No (directorio) |
| Seguro de mascotas | `seguro` | Shield | indigo | No (directorio) |
| Crematorio / Memorial | `crematorio` | Flame | slate | No (directorio) |
| Transporte de mascotas | `transporte` | Truck | violet | No (directorio) |
| Alimentación / Marca | `alimento` | Package | amber | No (directorio) |
| Otro | `otro` | HelpCircle | gray | No |

---

## 1. Tabla `partner_submissions`

Migración: `supabase/migrations/20260413180000_partner_submissions.sql`

```sql
CREATE TABLE IF NOT EXISTS partner_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Categoría
  categoria TEXT NOT NULL,
  -- Datos de contacto
  nombre_negocio TEXT NOT NULL,
  nombre_contacto TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  website TEXT,
  instagram TEXT,
  -- Ubicación
  direccion TEXT,
  comuna TEXT,
  ciudad TEXT,
  -- Perfil
  descripcion TEXT,
  servicios_ofrecidos TEXT[], -- array de servicios que ofrecen
  horario TEXT,
  -- Estado interno
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente','contactado','aprobado','rechazado')),
  notas_admin TEXT,
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: insert público (anon), select/update solo admin
ALTER TABLE partner_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon puede enviar solicitud"
  ON partner_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin puede ver todo"
  ON partner_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin puede actualizar"
  ON partner_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

---

## 2. Landing `/registro-partner`

- **Ruta pública** (sin auth)
- **Diseño**: gradiente purple-50 → white, paleta brand
- **Flujo**: seleccionar categoría → completar formulario personalizado → enviar → toast de confirmación
- **Campos por categoría**: ver sección de campos dinámicos abajo
- **Componentes**: `PublicHeader` + `PublicFooter` reutilizados del directorio vets
- **Almacena** en `partner_submissions` vía Supabase anon insert

### Campos por categoría

| Campo | veterinaria | tienda | peluqueria | paseador | cuidador | entrenador | refugio | seguro | crematorio | transporte | alimento |
|---|---|---|---|---|---|---|---|---|---|---|---|
| nombre_negocio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| nombre_contacto | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| email | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| telefono | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| website | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| instagram | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| direccion | ✅ | ✅ | ✅ | — | — | — | ✅ | — | ✅ | — | — |
| comuna | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — |
| ciudad | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — |
| descripcion | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| servicios | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — |
| horario | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — |

---

## 3. Emails tipo por categoría

Documento: `_pending/EMAILS_PARTNERS.md`

Estructura de cada email:
- **Asunto** personalizado
- **Saludo** con nombre del negocio
- **Qué gana el partner** (3-4 bullets específicos por tipo)
- **Qué gana Paw Friend** (transparencia)
- **CTA** con enlace al formulario
- **Firma** Paw Friend

---

## 4. Conexión con directorio existente

La tabla `partner_submissions` es la **bandeja de entrada**. El flujo es:
1. Partner llena formulario → `partner_submissions` status=pendiente
2. Pedro revisa en admin panel → cambia status a aprobado/rechazado
3. Si aprobado, Pedro carga manualmente al sistema correspondiente:
   - Vets → `service_providers` (ya tiene flujo)
   - Groomers → `groomer_profiles`
   - Walkers → `dog_walker_profiles`
   - Sitters → `dogsitter_profiles`
   - Trainers → `trainer_profiles`
   - Tiendas/Seguros/Crematorios/Transporte → `partners` table (directorio mapa)

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `supabase/migrations/20260413180000_partner_submissions.sql` | Crear |
| `src/pages/RegistroPartner.tsx` | Crear |
| `src/App.tsx` | Agregar ruta `/registro-partner` |
| `_pending/EMAILS_PARTNERS.md` | Crear |
| `_pending/PARTNERS_ONBOARDING.md` | Este archivo |
