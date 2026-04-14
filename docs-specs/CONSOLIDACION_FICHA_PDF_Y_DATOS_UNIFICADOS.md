# Consolidación: PDF Profesional + Datos Unificados + Poda de Features

> Spec para ejecución posterior. Estado actual auditado el 2026-04-14.
> Objetivo: que toda la data de la mascota "converse" entre sí, el PDF sea profesional y cronológico, no existan duplicados, y se eliminen features que no aportan valor.

---

## 1. PDF Ficha Clínica — Rediseño Profesional Cronológico

### 1.1 Estado actual

- **Edge function**: `generate-medical-summary/index.ts` usa `pdf-lib`
- **RPC**: `get_medical_summary_data` retorna pet + owner + medical_records (ordenados DESC por fecha)
- **Estructura actual**: Identificación → Responsable → Alertas → Historial (agrupado por tipo: vacunas, consultas, procedimientos, tratamientos, preventivo, otro) → Alimentación → Footer
- **Problema**: agrupa por *tipo* de registro, no por *cronología*. Un dueño o vet que lee el PDF no puede seguir la línea de tiempo de la mascota. Si el animal tuvo una consulta el 1 de marzo y una vacuna el 5 de marzo, aparecen en secciones separadas.

### 1.2 Nuevo diseño — Línea de tiempo cronológica

**Secciones del PDF (orden):**

1. **ENCABEZADO** (sin cambios)
   - Logo Paw Friend, "Ficha Clínica Veterinaria", fecha generación

2. **IDENTIFICACIÓN DE LA MASCOTA** (mejorar)
   - Agregar: edad calculada en años y meses (ya existe), raza con especie entre paréntesis
   - Agregar: foto del animal como thumbnail si `photo_url` existe (descargar como JPEG, incrustar con `pdf-lib`)
   - Formato: tabla de 2 columnas con bordes suaves para datos clave
   - Campos: Nombre, Especie/Raza, Edad, Peso, Sexo, Esterilizado/a (+ fecha), Microchip, Grupo sanguíneo, Paw Card ID

3. **RESPONSABLE Y CONTACTO DE EMERGENCIA**
   - Nombre dueño, email, teléfono emergencia, vet emergencia, clínica preferida, seguro

4. **ALERTAS CLÍNICAS** (solo si hay datos)
   - Alergias (alimento, medicamento, ambiental) — badge rojo
   - Condiciones crónicas (con fecha diagnóstico y severidad) — badge naranja
   - Medicamentos actuales (nombre, dosis, frecuencia) — badge azul

5. **HISTORIAL CLÍNICO CRONOLÓGICO** (cambio principal)
   - **Ordenar por fecha ASC** (más antiguo primero → más reciente al final)
   - **NO agrupar por tipo**. Mostrar como timeline continua
   - Cada entrada muestra:
     - Fecha (columna izquierda, bold)
     - Badge de tipo con color (🟢 Vacuna, 🔵 Consulta, 🟣 Procedimiento, 🟠 Tratamiento, 🟤 Preventivo)
     - Título / Razón de consulta
     - Veterinario · Clínica (gris, menor)
     - Diagnóstico (si aplica)
     - Tratamiento (si aplica)
     - Notas (si aplica, humanizadas)
     - Próxima fecha (si aplica, verde)
   - **Incluir notas clínicas del vet** (`vet_clinical_notes`) intercaladas en la misma timeline, marcadas con badge "Nota Vet" y nombre del profesional
   - **Separador visual por año** (ej: "── 2025 ──", "── 2026 ──") para facilitar lectura
   - Alternancia de fondo (gris claro / blanco) por entrada

6. **RESUMEN DE VACUNACIÓN** (nueva sección)
   - Tabla compacta: Vacuna | Fecha aplicación | Lote/Serie | Próximo refuerzo
   - Solo vacunas, extraídas del historial, ordenadas cronológicamente
   - Estado: "Al día" / "Pendiente refuerzo" / "Sin registros"

7. **ALIMENTACIÓN Y ESTILO DE VIDA** (sin cambios grandes)
   - Dieta, marca, frecuencia, nivel actividad, ambiente, notas comportamiento

8. **PESO HISTÓRICO** (nueva sección, si hay datos)
   - Si `weight_history` tiene más de 1 entrada, mostrar mini-tabla con fecha y peso
   - Indicar tendencia: ↑ subiendo / ↓ bajando / → estable

9. **AVISO DE CONFIDENCIALIDAD + FOOTER** (sin cambios)

### 1.3 Cambios técnicos requeridos

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-medical-summary/index.ts` | Reescribir `PdfBuilder` para timeline cronológica ASC, incluir vet_clinical_notes, agregar sección vacunas, peso histórico, foto mascota |
| `supabase/migrations/XXXXXX_update_medical_summary_rpc_v3.sql` | Actualizar RPC `get_medical_summary_data` para incluir `vet_clinical_notes` del pet + `weight_history` |
| `src/components/medical/MedicalSummaryButton.tsx` | Sin cambios (solo dispara la edge function) |

### 1.4 Criterios de aceptación PDF

- [ ] Timeline cronológica ASC (antiguo → reciente)
- [ ] Notas del vet intercaladas en la timeline con badge distinguible
- [ ] Separadores visuales por año
- [ ] Tabla resumen de vacunación con lote/serie
- [ ] Foto de la mascota en encabezado (si existe)
- [ ] Peso histórico si hay más de 1 registro
- [ ] Verificación code + QR de Paw Friend en footer
- [ ] Máximo 300 chars por campo (ya existe, mantener)
- [ ] Renderiza correctamente con 0 registros, 1 registro, y 50+ registros

---

## 2. Deduplicación de Mascotas

### 2.1 Problema actual

No existe NINGUNA protección contra mascotas duplicadas:
- Un dueño puede crear "Luna" (gato) dos veces → 2 registros distintos
- Un vet puede crear "Luna" para `owner@email.com` y el dueño ya tiene "Luna" → 2 registros
- `microchip_number` no tiene constraint UNIQUE → mismos chips pueden existir en N registros
- No hay validación en frontend ni backend

### 2.2 Solución propuesta

#### A. Constraint de microchip único (DB)

```sql
-- Migración: agregar UNIQUE a microchip cuando no es NULL
CREATE UNIQUE INDEX idx_pets_microchip_unique
  ON public.pets (microchip_number)
  WHERE microchip_number IS NOT NULL AND microchip_number != '';
```

#### B. Detección de duplicados en flujo de creación (Frontend)

**En `AddPet.tsx` (dueño crea mascota):**
- Antes de INSERT, consultar: `SELECT id, name, species FROM pets WHERE owner_id = auth.uid() AND lower(name) = lower(input.name) AND species = input.species`
- Si hay match → mostrar dialog: "Ya tienes una mascota llamada {name} ({species}). ¿Quieres editarla o crear una nueva?"
- Si `microchip_number` ingresado → verificar unicidad: `SELECT id, name FROM pets WHERE microchip_number = input.microchip`
- Si hay match → mostrar alerta: "Este microchip ya está registrado para {name}. Verifica el número."

**En `NewPatientForm.tsx` (vet crea paciente):**
- Antes de INSERT, consultar: `SELECT id, name, owner_id FROM pets WHERE lower(name) = lower(input.name) AND species = input.species AND (pending_owner_email = lower(input.owner_email) OR owner_id IN (SELECT id FROM profiles WHERE email = lower(input.owner_email)))`
- Si hay match con `owner_id` ya asignado → "Esta mascota ya existe en el sistema. ¿Quieres solicitar acceso en vez de crear un nuevo registro?" → redirigir a flujo de `pet_vet_links`
- Si hay match pendiente (otro vet la creó) → "Otro profesional ya registró esta mascota. Puedes solicitar acceso cuando el dueño la reclame."

#### C. Flujo de merge (futuro, no en esta iteración)

Para mascotas que ya están duplicadas en producción, se podría crear un admin tool para fusionar registros. **No implementar ahora** — priorizar prevención sobre corrección.

### 2.3 Cambios técnicos

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/XXXXXX_unique_microchip.sql` | Unique index parcial en `microchip_number` |
| `src/pages/AddPet.tsx` | Query de detección antes de submit, dialog de confirmación |
| `src/components/provider/NewPatientForm.tsx` | Query de detección + opción de solicitar acceso en vez de crear |

---

## 3. Flujo Unificado: Vet crea animal ↔ Dueño crea animal

### 3.1 Estado actual

| Aspecto | Dueño (`AddPet.tsx`) | Vet (`NewPatientForm.tsx`) |
|---------|----------------------|---------------------------|
| `owner_id` | `auth.uid()` | `NULL` (pendiente) |
| `created_by_vet_id` | `NULL` | `auth.uid()` |
| Campos clínicos | Muchos (peso, microchip, blood_type, alergias, dieta, etc.) | Mínimos (nombre, especie, raza, peso, color) |
| Auto-reminders | Sí (checkup 90d, grooming 30d) | **NO** |
| Paw Card | Sí | Sí |
| `pet_vet_links` | No (no hay vet asociado) | Sí (auto-link si dueño ya registrado) |

### 3.2 Brechas a cerrar

1. **Vet no crea reminders automáticos** → Cuando el dueño reclama la mascota (claim flow en `useClaimPetInvitation.ts`), crear los reminders default igual que en `AddPet.tsx`
2. **Vet no puede agregar campos clínicos iniciales** → Ampliar `NewPatientForm.tsx` con campos opcionales: microchip, blood_type, alergias conocidas, condiciones crónicas. Son datos que el vet tiene en la primera consulta.
3. **Claim flow no sincroniza** → Cuando dueño acepta invitación:
   - Crear `pet_reminders` default (checkup, grooming)
   - Si el vet llenó campos clínicos → no sobrescribir cuando dueño edita después
   - Notificar al dueño con toast: "Tu vet ya agregó datos clínicos. Revisa la ficha."

### 3.3 Cambios técnicos

| Archivo | Cambio |
|---------|--------|
| `src/components/provider/NewPatientForm.tsx` | Agregar campos opcionales: microchip, blood_type, allergies, chronic_conditions |
| `src/hooks/useClaimPetInvitation.ts` | Post-claim: crear pet_reminders default, toast informativo |
| `supabase/migrations/XXXXXX_auto_reminders_on_claim.sql` | Trigger o RPC que cree reminders cuando `owner_id` pasa de NULL a un valor |

---

## 4. Sincronización Total de Datos de la Mascota

### 4.1 Brechas de sincronización detectadas

| Escenario | Comportamiento actual | Comportamiento esperado |
|-----------|----------------------|------------------------|
| Crear registro de vacuna con `next_date` | NO crea reminder | Auto-crear `pet_reminder` tipo 'vaccine' con `due_date = next_date` |
| Reservar cita veterinaria | NO crea reminder | Auto-crear `pet_reminder` tipo 'checkup' con fecha de la cita |
| Vet marca followup en nota clínica | SÍ crea reminder ✓ | (ya funciona, mantener) |
| Completar reminder recurrente | SÍ crea el siguiente ✓ | (ya funciona, mantener) |
| Nuevo pet creado por dueño | SÍ crea reminders default ✓ | (ya funciona, mantener) |
| Nuevo pet creado por vet | NO crea reminders | Crear al momento del claim (ver sección 3) |
| Actualizar peso en ficha | NO actualiza `weight_history` | Append al array `weight_history` con fecha |
| Cambiar `next_date` en registro médico | Reminder viejo queda huérfano | Actualizar reminder existente o crear nuevo |

### 4.2 Triggers a implementar (migraciones SQL)

#### A. Auto-reminder en vacuna con next_date

```sql
-- Trigger: cuando se inserta medical_record tipo 'vacuna' con next_date
-- → crear pet_reminder tipo 'vaccine' automáticamente
CREATE OR REPLACE FUNCTION create_vaccine_reminder()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.record_type = 'vacuna' AND NEW.next_date IS NOT NULL THEN
    INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
    VALUES (
      NEW.pet_id,
      NEW.owner_id,
      'vaccine',
      'Refuerzo: ' || COALESCE(NEW.title, 'Vacuna'),
      NEW.next_date
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### B. Auto-reminder en booking

```sql
-- Trigger: cuando se crea booking con pet_id y fecha futura
-- → crear pet_reminder tipo 'checkup'
CREATE OR REPLACE FUNCTION create_booking_reminder()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pet_id IS NOT NULL THEN
    INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
    SELECT
      NEW.pet_id,
      NEW.user_id,
      'checkup',
      'Cita: ' || COALESCE(NEW.service_type, 'Servicio'),
      NEW.slot_date  -- o la fecha relevante del booking
    WHERE NEW.slot_date > now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### C. Weight history append

```sql
-- Trigger: cuando se actualiza pets.weight y el valor cambió
-- → append a weight_history
CREATE OR REPLACE FUNCTION append_weight_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight IS DISTINCT FROM OLD.weight AND NEW.weight IS NOT NULL THEN
    UPDATE public.pets
    SET weight_history = COALESCE(weight_history, '[]'::jsonb) ||
      jsonb_build_object('date', now()::date, 'weight', NEW.weight)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.3 Cambios técnicos

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/XXXXXX_auto_vaccine_reminder.sql` | Trigger `create_vaccine_reminder` en `medical_records` |
| `supabase/migrations/XXXXXX_auto_booking_reminder.sql` | Trigger `create_booking_reminder` en `bookings` |
| `supabase/migrations/XXXXXX_weight_history_append.sql` | Trigger `append_weight_history` en `pets` |
| `src/hooks/useReminders.tsx` | Ningún cambio (los triggers DB crean los records, el hook ya los lee) |

---

## 5. Poda de Features — Eliminar lo que no aporta valor

### 5.1 Criterios de evaluación

- **Valor médico**: ¿Ayuda a cuidar la salud de la mascota?
- **Valor para el vet**: ¿Hace más eficiente su práctica?
- **Complejidad de mantenimiento**: ¿Cuántos archivos/componentes requiere?
- **Estado de implementación**: ¿Está completo o es placeholder?

### 5.2 Features a ELIMINAR (dueños)

| Feature | Archivos | Razón | Acción |
|---------|----------|-------|--------|
| **Paw Game** | `PawGame.tsx` + 5 componentes (`pawgame/`) | Cero valor médico, 1000+ líneas, gamificación que distrae del objetivo | Eliminar página, componentes, y entrada en sidebar |
| **Misiones** | `Missions.tsx` | Achievements artificiales sin valor real, confunde UX | Eliminar página y entrada en sidebar |
| **Paw Collection** | `PawCollection.tsx` + 8 componentes (`paw-cards/`) | TCG elaborado (holos, transfers, rarezas) sin propósito médico, 1500+ líneas | Eliminar página, componentes, y entrada en sidebar. Mantener `paw_card_id` en DB (útil para QR) |
| **Paw Card Landing** | `PawCardLanding.tsx` | Landing pública de coleccionable, animación de 4s sin valor | Eliminar o simplificar a redirect al QR landing |
| **Actividad** | `Actividad.tsx` | Duplica Feed, legacy stream | Redirect `/actividad` → `/feed`, eliminar página |
| **Community (grupos)** | `Community.tsx` | Muestra "disponibles pronto", placeholder incompleto | Eliminar página y entrada en sidebar |
| **Adopción** | `Adoption.tsx` + componentes | Nicho, mejor derivar a Adopta.cl u otra plataforma especializada | Eliminar o reducir a link externo |
| **Demo** | `Demo.tsx` | Herramienta interna de ventas, 5 perfiles hardcoded | Mover a ruta admin-only o eliminar |
| **Reportes** | `Reportes.tsx` | Placeholder sin backend real de generación | Eliminar hasta que se implemente |
| **Maps** | `Maps.tsx` | Duplica búsqueda del directorio, Leaflet pesado en bundle | Evaluar: si tráfico < 1% → eliminar. Si hay uso → mantener pero sacar de nav principal |

### 5.3 Features a ELIMINAR (veterinarios)

| Feature | Archivos | Razón | Acción |
|---------|----------|-------|--------|
| **Feed social** (en sidebar vet) | Entrada en sidebar | Vets no necesitan feed social, distrae | Ocultar del sidebar vet |
| **Paw Game / Colección** (en sidebar vet) | Entrada en sidebar | Irrelevante para práctica veterinaria | No mostrar en modo vet |

### 5.4 Features a MANTENER pero simplificar

| Feature | Cambio |
|---------|--------|
| **En Memoria** | Mantener pero hacer opt-in (botón discreto en perfil mascota, no sección prominente) |
| **Blood Donors** | Mantener pero mover a submenú "Más" en sidebar, no al nivel de "Servicios" |
| **Servicios landing** | Simplificar: eliminar página intermedia, que sidebar lleve directo a `/services/:type` |
| **Settings.tsx** | Eliminar (ya redirige a `/profile`) |
| **UserProfile.tsx** | Evaluar uso. Si < 1% tráfico → eliminar perfil público de dueños |

### 5.5 Impacto estimado de la poda

| Métrica | Antes | Después |
|---------|-------|---------|
| Páginas en `src/pages/` | ~52 | ~40 |
| Componentes eliminados | — | ~30+ (`pawgame/`, `paw-cards/`, social parcial) |
| Líneas eliminadas | — | ~5000+ |
| Entradas sidebar dueño | ~15 | ~10 |
| Bundle reducción estimada | — | ~15-20 kB gzip (Leaflet, animaciones TCG, gamificación) |

### 5.6 Actualización de navegación post-poda

**Sidebar dueño (después):**
- **Salud**: Inicio, Mis Mascotas, Recordatorios, Rutinas, Calendario
- **Descubrir**: Buscar Vet, Servicios, Banco de Sangre
- **Social**: Feed, Mensajes
- **Más**: En Memoria, Configuración

**Sidebar vet (sin cambios significativos):**
- **Consultorio**: Dashboard, Pacientes, Reservas, Calendario
- **Comunicación**: Mensajes
- **Negocio**: Perfil Público, Panel Pro [PREMIUM]

---

## 6. Orden de Ejecución Recomendado

### Fase 1: Deduplicación y unificación de flujos (prioridad alta)
1. Migración: UNIQUE index en `microchip_number`
2. `AddPet.tsx`: detección de duplicados antes de submit
3. `NewPatientForm.tsx`: detección de duplicados + opción solicitar acceso
4. `NewPatientForm.tsx`: agregar campos clínicos opcionales (microchip, blood_type, alergias)
5. `useClaimPetInvitation.ts`: crear reminders default post-claim

### Fase 2: Sincronización de datos (prioridad alta)
6. Migración: trigger auto-reminder en vacuna con `next_date`
7. Migración: trigger auto-reminder en booking
8. Migración: trigger weight_history append
9. Verificar que calendario unificado muestra los nuevos reminders automáticos

### Fase 3: PDF profesional cronológico (prioridad alta)
10. Migración: actualizar RPC `get_medical_summary_data` v3 (incluir vet_clinical_notes + weight_history)
11. Reescribir `PdfBuilder` en edge function para timeline cronológica ASC
12. Agregar sección resumen vacunación + peso histórico
13. Incrustar foto mascota en encabezado
14. Testing: generar PDFs con 0, 1, 10, 50+ registros

### Fase 4: Poda de features (prioridad media)
15. Eliminar Paw Game, Misiones, Paw Collection (páginas + componentes + sidebar)
16. Eliminar Actividad, Community grupos, Demo, Reportes, Settings.tsx
17. Simplificar Adopción → link externo
18. Reorganizar sidebar según nueva estructura
19. `npm run build` + verificar bundle reduction
20. Actualizar `diagrams/FLUJO_COMPLETO.mmd` con estructura post-poda

---

## 7. Archivos afectados (resumen completo)

### Migraciones nuevas (6)
- `XXXXXX_unique_microchip.sql`
- `XXXXXX_auto_reminders_on_claim.sql`
- `XXXXXX_auto_vaccine_reminder.sql`
- `XXXXXX_auto_booking_reminder.sql`
- `XXXXXX_weight_history_append.sql`
- `XXXXXX_update_medical_summary_rpc_v3.sql`

### Edge functions (1)
- `supabase/functions/generate-medical-summary/index.ts` — reescribir PdfBuilder

### Frontend — modificar (5)
- `src/pages/AddPet.tsx` — detección duplicados
- `src/components/provider/NewPatientForm.tsx` — detección duplicados + campos clínicos
- `src/hooks/useClaimPetInvitation.ts` — post-claim reminders
- `src/components/layout/AppSidebar.tsx` — reorganizar navegación
- `src/App.tsx` — eliminar rutas de features podadas

### Frontend — eliminar (~15 archivos de páginas + ~30 componentes)
- `src/pages/PawGame.tsx`
- `src/pages/Missions.tsx`
- `src/pages/PawCollection.tsx`
- `src/pages/PawCardLanding.tsx`
- `src/pages/Actividad.tsx`
- `src/pages/Community.tsx`
- `src/pages/Adoption.tsx` + componentes adopción
- `src/pages/Demo.tsx`
- `src/pages/Reportes.tsx`
- `src/pages/Settings.tsx`
- `src/components/pawgame/` (directorio completo)
- `src/components/paw-cards/` (directorio completo, excepto lógica de `paw_card_id` que vive en DB)

### Documentación viva (actualizar en mismo commit de Fase 4)
- `diagrams/FLUJO_COMPLETO.mmd`
- `MAPA_FUNCIONAL_COMPLETO.md`
- `CLAUDE.md` (sección 7 rutas, sección 3 estructura)

---

## 8. Timeline Universal con Timestamps

### 8.1 Concepto

Todo evento que ocurra con la mascota debe tener un timestamp preciso (fecha + hora) para que la timeline cronologica funcione correctamente. Esto incluye:

| Evento | Tabla | Campo timestamp | Estado actual |
|--------|-------|-----------------|---------------|
| Registro medico (dueno) | `medical_records` | `visit_date` o `date` | Solo fecha (date), no hora |
| Nota clinica (vet) | `vet_clinical_notes` | `consultation_date` | Solo fecha (date), no hora |
| Documento subido | `medical_documents` | `created_at` | OK (timestamptz) |
| Reminder creado/completado | `pet_reminders` | `created_at`, `completed_at` | OK (timestamptz) |
| Rutina completada | `routine_completions` | `completed_at` | OK (timestamptz) |
| Booking creado | `bookings` | `created_at` | OK (timestamptz) |
| Peso cambiado | `pets.weight_history` | `date` en JSONB | Solo fecha — **cambiar a timestamp** |
| Mascota creada | `pets` | `created_at` | OK (timestamptz) |
| Mascota editada | `pets` | `updated_at` | OK (timestamptz) |

### 8.2 Cambios requeridos

1. **`medical_records`**: los campos `date` y `visit_date` son tipo `date` (sin hora). Para la timeline no es critico porque las consultas medicas se registran por dia, pero se podria agregar un campo `recorded_at timestamptz DEFAULT now()` que capture el momento exacto del registro.

2. **`vet_clinical_notes`**: `consultation_date` es tipo `date`. Igual que arriba, agregar `recorded_at timestamptz DEFAULT now()`.

3. **`pets.weight_history` JSONB**: el trigger actual guarda `CURRENT_DATE::text` — cambiar a `now()::text` para incluir la hora.

4. **`medical_documents`**: ya tiene `created_at timestamptz` — OK.

### 8.3 Migracion

```sql
-- Agregar recorded_at a medical_records y vet_clinical_notes
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS recorded_at timestamptz DEFAULT now();

ALTER TABLE public.vet_clinical_notes
  ADD COLUMN IF NOT EXISTS recorded_at timestamptz DEFAULT now();
```

### 8.4 Impacto en PDF

El PDF usa `date` (dia) para la timeline, lo cual es suficiente para la presentacion visual (separadores por ano, orden cronologico). Los timestamps exactos (`recorded_at`) sirven para:
- Desempatar registros del mismo dia (mostrar en orden correcto)
- Mostrar hora exacta en la ficha clinica web (no en el PDF, donde el dia es suficiente)
- Futuro: audit trail de quien registro que y cuando

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Microchip UNIQUE falla si ya hay duplicados en prod | Auditar antes: `SELECT microchip_number, count(*) FROM pets WHERE microchip_number IS NOT NULL GROUP BY microchip_number HAVING count(*) > 1`. Limpiar manualmente antes de aplicar constraint |
| PDF con 50+ registros excede límites de página | Ya existe paginación automática en PdfBuilder. Verificar con datos reales |
| Eliminar Paw Game afecta `paw_points` existentes | Los puntos viven en DB, no se borran. Solo se elimina la UI de canje/misiones. Si en el futuro se reactiva, los puntos siguen ahí |
| Triggers de auto-reminder crean duplicados | Usar `ON CONFLICT DO NOTHING` o verificar existencia antes de insertar |
| Dueños con mascotas duplicadas en prod | No resolver retroactivamente en esta iteración. Priorizar prevención. Admin merge tool como fase futura |
| Eliminar features rompe links compartidos | Mantener redirects en App.tsx: `/paw-collection` → `/my-pets`, `/paw-game` → `/home` |
