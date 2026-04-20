# Spec — Sección dedicada Vacunas + Antiparasitarios (INIT-07)

> Origen: [Feedback vet Sofia 2026-04-13](../audits/FEEDBACK_VET_SOFIA_2026_04_13.md) §1-3.
> Iniciativa: INIT-07 del [Plan de Éxito 90 días](../docs-raiz/planes/PLAN_EXITO_90D_20260420.md).
> Sprint sugerido: S2 (2026-05-11 → 2026-05-24).
> Prioridad: ALTA — desbloquea conversión de Sofia en embajadora pública y arranque de testimoniales.
> Estado: **Spec redactada, NO ejecutada**. Pedro autoriza explícitamente antes de tocar `PetClinicalRecord/` (joya de la corona, CLAUDE.md §9.6).

---

## 1. Problema

Según Sofia Rosi (primera vet beta real), hoy las vacunas aparecen mezcladas con consultas, cirugías y exámenes en `TabHistorial` (`src/pages/PetClinicalRecord/tabs/TabHistorial.tsx`). Para un veterinario es fricción constante:

1. **Vacunas**: necesita revisar cuál toca, cuándo se aplicó, **lote/serie** (trazabilidad de brote), próxima dosis. Hoy sólo existe `record_type='vacuna'` con texto libre.
2. **Antiparasitarios**: Sofia cita explícitamente: *"eso sí que se les olvida, sería bacán que les lleguen recordatorio de la próxima fecha"*. Hoy no hay auto-recordatorio post-aplicación, tampoco manejo del caso Bravecto (cada 3 meses vs 1 mes estándar).

Gap UX: aunque existen `vaccination_protocols` (mig `20260423000001`), no linkea con registros reales ni genera recordatorios automáticos.

---

## 2. Alcance (qué SÍ entra y qué NO)

### SÍ entra
- Tab "Vacunas" dedicada dentro de `PetClinicalRecord` (sub-tab adicional).
- Tab "Antiparasitarios" dedicada.
- Tabla resumen en cada sub-tab con columnas: tipo | fecha | lote/serie | producto | próxima dosis | estado (al día / atrasada).
- Formulario de alta estructurado (campos dedicados en vez de texto libre).
- Auto-creación de recordatorio post-aplicación según frecuencia.
- Caso especial Bravecto: detectar producto y usar frecuencia 3 meses.
- Mantener retrocompatibilidad: los `medical_records` existentes con `record_type='vacuna'` y `record_type IN ('desparasitacion','antipulgas')` siguen apareciendo en `TabHistorial` (el mixto cronológico) y ahora también en las sub-tabs dedicadas.

### NO entra
- Cambios al PDF de la ficha (lo incluye automáticamente porque el generador lee `medical_records`).
- Integración con registro nacional de vacunas (está en `docs-specs/MICROCHIP_REGISTRO_NACIONAL.md`, scope separado).
- Cambios al directorio público de vets ni a la ficha compartida externa.

---

## 3. Modelo de datos

### Decisión: tabla nueva vs columnas extra

**Opción A (recomendada)**: columnas estructuradas en `medical_records` + vista específica para Vacunas/Antiparasitarios.

```sql
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS vaccine_type TEXT,                -- octuple, antirrabica, kc, triple_felina, leucemia_felina
  ADD COLUMN IF NOT EXISTS vaccine_brand TEXT,               -- nombre comercial
  ADD COLUMN IF NOT EXISTS vaccine_batch TEXT,               -- lote / serie (trazabilidad)
  ADD COLUMN IF NOT EXISTS parasite_kind TEXT,               -- internal | external
  ADD COLUMN IF NOT EXISTS parasite_brand TEXT,              -- producto (ej: Bravecto, Nexgard)
  ADD COLUMN IF NOT EXISTS next_dose_date DATE;              -- calculada o manual
```

**Ventajas**: No rompe nada. `TabHistorial` sigue funcionando. `medical-records` hook sigue siendo único. PDF de ficha sigue leyendo de la misma tabla.

**Opción B (descartada)**: tablas `vaccinations` y `parasite_preventions` separadas. Beneficio: modelo más limpio. Costo: duplicación de RLS, dual-write en el frontend, migración de datos existentes más compleja. Violaría indirectamente §9.6 "joya de la corona" al requerir refactor grande.

### Regla para datos existentes (§9.8)

- Las columnas nuevas son NULLABLE; registros existentes quedan con `NULL` y aparecen como "Lote no registrado" en la UI.
- Backfill opcional: un script que intenta extraer lote desde `description` via regex `/lote[:\s]+([A-Z0-9-]+)/i`. Se deja como paso manual opcional en el PR.

### Frecuencias por default

```ts
const VACCINE_FREQUENCY_MONTHS: Record<string, number> = {
  octuple: 12,
  sextuple: 12,
  antirrabica: 12,  // excepción de 3 años por marca: manejar en caso especial
  kc: 12,
  triple_felina: 12,
  leucemia_felina: 12,
};

const PARASITE_FREQUENCY_MONTHS: Record<string, Record<string, number>> = {
  internal: { default: 3 },
  external: {
    default: 1,
    'bravecto': 3,  // caso especial citado por Sofia
  },
};
```

---

## 4. UI / UX

### 4.1. Ubicación en ficha clínica

Dentro de `PetClinicalRecord/index.tsx`, agregar 2 tabs nuevos entre "Historial" y "Documentos":

```
[Resumen] [Historial] → [Vacunas] [Antiparasitarios] ← [Alimentación] [Documentos] [Compartir]
```

Cada tab lleva a un componente nuevo:
- `PetClinicalRecord/tabs/TabVacunas.tsx`
- `PetClinicalRecord/tabs/TabAntiparasitarios.tsx`

### 4.2. TabVacunas

Estructura:
- **Header**: CTA "Registrar vacuna" + badge de estado global ("Al día" / "X atrasadas").
- **Tabla** ordenada por fecha desc:
  | Tipo | Producto | Lote | Fecha | Próxima | Estado |
  |---|---|---|---|---|---|
  | Óctuple | Canigen DHPPiL | AB1234 | 12 ene 2026 | 12 ene 2027 | Al día |
  | Antirrábica | Rabisin | — | 03 oct 2025 | 03 oct 2026 | Al día |
  | KC | Nobivac KC | XY789 | (sin registro) | — | Pendiente |
- **Empty state**: "Aún no hay vacunas registradas. Registra la primera o sube el carnet con OCR."

### 4.3. TabAntiparasitarios

Igual que TabVacunas pero con split visual:
- Sección "Interno" (desparasitación).
- Sección "Externo" (antipulgas / garrapatas).
- Cada sección muestra tabla similar.
- Badge caso especial: si producto="Bravecto", mostrar hint "Frecuencia cada 3 meses" en verde.

### 4.4. Formulario alta (mismo para ambos)

`VaccineForm.tsx` y `ParasitePreventionForm.tsx` (nuevos, en `src/components/medical/`):

Campos comunes:
- Tipo (select con opciones por especie, lee `src/lib/vaccines.ts` para vacunas).
- Producto / marca (text, autocomplete de productos comunes).
- Lote / serie (text, opcional pero sugerido).
- Fecha aplicación (date picker, default hoy).
- Vet que aplicó (text).
- Clínica (text).
- Notas (textarea).
- Toggle "Crear recordatorio automático para próxima dosis" (default true).

Al submit: INSERT `medical_records` con `record_type`, `vaccine_type`/`parasite_kind`, `vaccine_batch`/`parasite_brand`, etc. Si toggle está activo, trigger crea `pet_reminders` con `due_date = date + frequency_months`.

### 4.5. Auto-recordatorio

Implementación preferida: **trigger PL/pgSQL** en `AFTER INSERT` sobre `medical_records` que evalúa `record_type` + columnas nuevas y agrega entry en `pet_reminders` si aplica.

```sql
CREATE OR REPLACE FUNCTION public.schedule_vaccine_parasite_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_months INT;
  v_title TEXT;
BEGIN
  -- Solo para vacunas + antiparasitarios
  IF NEW.record_type = 'vacuna' AND NEW.vaccine_type IS NOT NULL THEN
    v_months := CASE NEW.vaccine_type
      WHEN 'octuple' THEN 12
      WHEN 'sextuple' THEN 12
      WHEN 'antirrabica' THEN 12
      WHEN 'kc' THEN 12
      WHEN 'triple_felina' THEN 12
      WHEN 'leucemia_felina' THEN 12
      ELSE 12
    END;
    v_title := 'Refuerzo ' || NEW.vaccine_type;
  ELSIF NEW.record_type IN ('desparasitacion', 'antipulgas') AND NEW.parasite_kind IS NOT NULL THEN
    IF LOWER(NEW.parasite_brand) LIKE '%bravecto%' THEN
      v_months := 3;
    ELSIF NEW.parasite_kind = 'internal' THEN
      v_months := 3;
    ELSE
      v_months := 1;
    END IF;
    v_title := 'Antiparasitario ' || NEW.parasite_kind;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.pet_reminders (pet_id, user_id, title, reminder_type, due_date, is_completed)
  SELECT NEW.pet_id, p.owner_id, v_title,
         CASE WHEN NEW.record_type = 'vacuna' THEN 'vaccine' ELSE 'deworming' END,
         NEW.date + (v_months || ' months')::INTERVAL,
         false
  FROM public.pets p WHERE p.id = NEW.pet_id AND p.owner_id IS NOT NULL
  ON CONFLICT DO NOTHING;  -- evitar duplicados

  RETURN NEW;
END;
$$;
```

Notas sobre el trigger:
- Respeta `§9.8` (no modifica datos existentes, sólo INSERT).
- `ON CONFLICT DO NOTHING` asume UNIQUE INDEX sobre `(pet_id, reminder_type, due_date)` que debe agregarse en la misma migración si no existe.
- Si la mascota no tiene `owner_id` (es huérfana de refugio), el recordatorio no se crea (correcto, no hay a quién notificar).

---

## 5. Paso a paso de ejecución

### S2 semana 1
1. Crear migración `supabase/migrations/20260628000000_vaccines_parasites_structured.sql`:
   - Columnas nuevas en `medical_records`.
   - Trigger `schedule_vaccine_parasite_reminder`.
   - UNIQUE INDEX para evitar duplicados de reminders.
2. Tipos regenerados con `supabase gen types typescript` (manual, Pedro).
3. Componentes nuevos: `VaccineForm.tsx`, `ParasitePreventionForm.tsx`.
4. Sub-tabs: `TabVacunas.tsx`, `TabAntiparasitarios.tsx`.
5. Registrar tabs en `PetClinicalRecord/index.tsx`.

### S2 semana 2
6. Testing manual con Sofia (WhatsApp): registrar 3 vacunas + 2 antiparasitarios (1 Bravecto).
7. Verificar que `pet_reminders` tiene entries correctas.
8. Fix de edge cases que Sofia reporte.
9. Preparar guion testimonial INIT-18 con Sofia (cierre S2).

---

## 6. Métricas de éxito

Desde Admin dashboard (posterior a INIT-02):
- Count de `medical_records` con `vaccine_batch IS NOT NULL` > 0 dentro de 14 días (target ≥10 de Sofia).
- Count de `pet_reminders` auto-creados por trigger > 0.
- Feedback explícito de Sofia en WhatsApp: "ya puedo llevar la ficha de vacunas como en mi sistema antiguo" o similar.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Migración rompe `TabHistorial` existente | Todas las columnas son NULLABLE; `TabHistorial` no cambia lógica |
| Trigger crea reminders duplicados | UNIQUE INDEX `(pet_id, reminder_type, due_date)` + `ON CONFLICT DO NOTHING` |
| Sofia pide más cambios al probar | Reservar 1-2 días en S2 para iteración |
| PDF de ficha muestra info duplicada | PDF ya lee `medical_records`; las columnas nuevas las ignora sin rompimiento |
| Vet sin JS bueno intenta editar en producción | Componentes nuevos son additive; los forms legacy siguen funcionando |

---

## 8. Autorización requerida

Pedro debe responder **sí explícito** antes de ejecutar:

- [ ] ¿Autorizás tocar `src/pages/PetClinicalRecord/` con esta spec (CLAUDE.md §9.6 requiere permiso explícito)?
- [ ] ¿Confirmás que Sofia está disponible para validar en S2 semana 2?
- [ ] ¿Preferís que la tabla sea columnas extra en `medical_records` (Opción A, recomendada) o tablas separadas (Opción B)?

Si las 3 respuestas son sí + Opción A, Claude Code ejecuta la migración + componentes + integración en un sprint.

---

## 9. Referencias

- [audits/FEEDBACK_VET_SOFIA_2026_04_13.md](../audits/FEEDBACK_VET_SOFIA_2026_04_13.md)
- [src/pages/PetClinicalRecord/](../src/pages/PetClinicalRecord/)
- [src/lib/vaccines.ts](../src/lib/vaccines.ts) — catálogo hardcodeado
- [supabase/migrations/20260423000001_auto_create_pet_reminders.sql](../supabase/migrations/20260423000001_auto_create_pet_reminders.sql)
- [CLAUDE.md §9.6](../CLAUDE.md) — joya de la corona
- [CLAUDE.md §9.8](../CLAUDE.md) — proteger datos existentes
