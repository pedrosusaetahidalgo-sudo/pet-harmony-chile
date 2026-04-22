# Smoke manual — Coherence Plan end-to-end

> **Uso**: 15-20 min en prod (pawfriend.cl) con una cuenta real de prueba.
> Valida que los fixes de Día 1 + Día 2 funcionan con tráfico real de verdad.
>
> **Requisitos previos**:
> - Migraciones aplicadas (smokes SQL Día 1 y Día 2 en verde).
> - Edge functions re-deployadas.
> - Una cuenta owner con al menos 1 mascota activa.

---

## Escenario 1 · Bug adopciones ya no sale

**Fix validado**: [src/pages/Adoption.tsx:86-95](src/pages/Adoption.tsx#L86)

### Pasos

1. Abrir [pawfriend.cl/adoption](https://pawfriend.cl/adoption) (o en tu tailscale).
2. Click tab "**Hogares IA**" (el que ANTES rompía la publicación).
3. Click "**Publicar Mascota**" → rellenar form con datos de prueba + 1 foto → submit.
4. Observar que:
   - El dialog cierra con toast verde "Publicación creada exitosamente".
   - **La tab activa cambia automáticamente a "Mis Posts"**.
   - El post aparece **inmediatamente** en la lista sin refresh.
5. Cambiar a tab "Disponibles" → el mismo post aparece con `status='disponible'`.

### Qué NO debería pasar

- ❌ Dialog cierra pero tab queda en "Hogares IA" (bug original).
- ❌ "Mis Posts" dice "No tienes publicaciones" (bug original — post en DB pero no en UI).

### Verificación SQL post-smoke

```sql
SELECT id, pet_name, status, created_at
FROM public.adoption_posts
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 3;
```

Esperado: 1 row nueva con `status='disponible'`.

---

## Escenario 2 · Prevenciones sin duplicado

**Fix validado**: remoción del insert manual frontend + trigger SQL canónico ([src/components/AddMedicalRecord.tsx](src/components/AddMedicalRecord.tsx) + [20260521000040](supabase/migrations/20260521000040_unify_reminder_types_canonical.sql)).

### Pasos

1. Ir a [pawfriend.cl/my-pets](https://pawfriend.cl/my-pets) → elegir 1 mascota.
2. En la ficha clínica, agregar una **vacuna** de prueba:
   - Tipo: Vacuna
   - Título: "Test Antirrábica"
   - Fecha: hoy
   - Next date: dejar vacío (debería auto-calcular +12m)
3. Agregar 1 **antiparasitario** de prueba:
   - Tipo: Antiparasitario
   - Título: "Test Bravecto"
   - Fecha: hoy
   - Tipo: externo
   - Producto: Bravecto (debería auto-calcular +3m)
4. Ir a [pawfriend.cl/calendario?tab=recordatorios](https://pawfriend.cl/calendario?tab=recordatorios) o `/reminders`.
5. Observar:
   - **Aparece 1 reminder de vacuna** con due_date = hoy + 12 meses.
   - **Aparece 1 reminder de antiparasitario** con due_date = hoy + 3 meses.
   - **NO aparecen 2 reminders del mismo insert** (bug histórico).
6. Probar la nueva tab [pawfriend.cl/calendario?tab=prevenciones](https://pawfriend.cl/calendario?tab=prevenciones) → los 2 reminders aparecen filtrados correctamente.

### Verificación SQL post-smoke

```sql
SELECT pet_id, type, title, due_date, created_at
FROM public.pet_reminders
WHERE owner_id = auth.uid()
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

Esperado: exactamente **2 rows** (una `type='vaccine'`, una `type='flea'` para Bravecto externo). **NO debe haber 4 rows** (lo que habría habido con insert duplicado + trigger).

---

## Escenario 3 · Auto-reminder al confirmar booking

**Fix validado**: [20260521000050_auto_reminder_on_booking_confirm.sql](supabase/migrations/20260521000050_auto_reminder_on_booking_confirm.sql).

### Pasos

1. Ir a [pawfriend.cl/veterinarios](https://pawfriend.cl/veterinarios) → elegir 1 vet.
2. Click "Reservar" → wizard [BookingFlow](src/components/booking/BookingFlow.tsx):
   - Mascota: la que usaste en escenario 2
   - Slot: cualquiera **a más de 48h** (para que +24h no caiga en pasado)
   - Confirmar
3. Si el provider tiene `confirmation_mode='auto'` → el booking pasa a `confirmado` inmediatamente. Si es manual, confirmarlo desde otro browser con rol provider.
4. Ir a [pawfriend.cl/calendario?tab=recordatorios](https://pawfriend.cl/calendario?tab=recordatorios).
5. Observar:
   - Aparece un **nuevo reminder** tipo checkup con título "Cita con [Vet Name]" y due_date = día de la cita - 24h.

### Verificación SQL post-smoke

```sql
SELECT id, type, title, due_date, created_at
FROM public.pet_reminders
WHERE owner_id = auth.uid()
  AND type = 'checkup'
  AND title LIKE 'Cita con%'
ORDER BY created_at DESC
LIMIT 3;
```

Esperado: 1 row nueva con due_date = día del booking - 1.

---

## Escenario 4 · Sidebar consolidado (desktop + mobile)

**Fix validado**: [src/components/AppSidebar.tsx:66-73](src/components/AppSidebar.tsx#L66-L73) y [src/components/BottomTabBar.tsx:90-100](src/components/BottomTabBar.tsx#L90-L100).

### Pasos

1. **Desktop**: abrir sidebar → confirmar 5 items core: Inicio, Mis Mascotas, Agenda, Buscar vet, Servicios.
2. Click "Agenda" → abre [pawfriend.cl/calendario?tab=hoy](https://pawfriend.cl/calendario?tab=hoy).
3. Abrir "Explorar" → "Día a día" debe estar abierto por default con: Mis reservas, Recordatorios, Rutinas, Reportes.
4. Confirmar que "Social" ahora se llama **"Comunidad"**.
5. **Mobile**: bottom tab "Agenda" se activa al estar en `/calendario`, `/reminders`, `/rutinas`, `/mis-reservas`.
6. Abrir [pawfriend.cl/adoption](https://pawfriend.cl/adoption) → observar que el banner **NO** dice "Paw Labs — Beta" sino el `NewBadge` sutil con variante "Impacto" (título "Adopción", tono teal).

### Qué NO debería pasar

- ❌ Ver 3 items core apuntando a `/calendario?tab=X` (estructura vieja).
- ❌ Ver "Social" como nombre del subgrupo.
- ❌ Ver `PawLabsBanner` con tono lúdico en Adopción/Comunidad/Banco de sangre.

---

## Verificación global (correr 1 vez al final)

```sql
-- Resumen de los 3 cambios de datos en los últimos 30 minutos
-- para el user autenticado
SELECT
  'adoption_posts' AS source,
  COUNT(*) AS rows_creadas
FROM public.adoption_posts
WHERE user_id = auth.uid()
  AND created_at > NOW() - INTERVAL '30 minutes'
UNION ALL
SELECT
  'medical_records' AS source,
  COUNT(*) AS rows_creadas
FROM public.medical_records
WHERE created_at > NOW() - INTERVAL '30 minutes'
  AND pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid())
UNION ALL
SELECT
  'pet_reminders' AS source,
  COUNT(*) AS rows_creadas
FROM public.pet_reminders
WHERE owner_id = auth.uid()
  AND created_at > NOW() - INTERVAL '30 minutes'
UNION ALL
SELECT
  'vet_bookings' AS source,
  COUNT(*) AS rows_creadas
FROM public.vet_bookings
WHERE owner_id = auth.uid()
  AND created_at > NOW() - INTERVAL '30 minutes';
```

**Ratio esperado** (si hiciste los 4 escenarios):
- adoption_posts: ≥ 1
- medical_records: ≥ 2 (vacuna + antiparasitario)
- pet_reminders: ≥ 3 (1 vacuna + 1 antiparasitario + 1 booking reminder)
- vet_bookings: ≥ 1

---

## Si algo falla

1. Toma screenshot de la UI + el SQL de verificación correspondiente.
2. Check logs [Supabase Dashboard → Logs](https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/logs/explorer) filtrando por las últimas invocaciones.
3. Abrir issue o pegar en el chat con `[SMOKE FAIL: escenario X]` para diagnosticar.

## Si todo pasa

El **Coherence Plan está operativo** con usuarios reales. Siguiente track: Fase 6 hardening (activar `PROVIDER_PUSH=true` con 1 provider de prueba + escribir E2E Playwright para proteger estos flows de regresión).
