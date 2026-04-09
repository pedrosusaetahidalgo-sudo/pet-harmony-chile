# Reporte de contaminación de seed en cuentas reales

> Generado: 2026-04-09
> Estado: PENDIENTE DE VALIDACIÓN MANUAL

---

## Diagnóstico

Durante la sesión del 2026-04-08, scripts de seed demo potencialmente filtraron datos a cuentas reales. Este reporte documenta las queries de diagnóstico que Pedro debe ejecutar en Supabase Dashboard > SQL Editor para determinar el alcance exacto.

## Queries de diagnóstico (ejecutar manualmente)

### 1. Dueños reales con mascotas de nombres seed

```sql
SELECT p.id, p.owner_id, u.email, p.name, p.created_at
FROM pets p
JOIN auth.users u ON u.id = p.owner_id
WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
  AND p.name IN ('Pelusa','Bruno','Luli','Capitán','Coco','Chocolate','Bella','Cachorro Curioso')
  AND p.created_at >= '2026-04-07';
```

### 2. Dueños reales con recordatorios de seed

```sql
SELECT r.id, r.user_id, u.email, r.title, r.created_at
FROM pet_reminders r
JOIN auth.users u ON u.id = r.user_id
WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
  AND r.title ~* '(baño.*peluquería|revisar vacunas de kai)'
  AND r.created_at >= '2026-04-07';
```

### 3. Users reales con medical_records con strings basura

```sql
SELECT m.id, m.pet_id, u.email, m.title, m.notes
FROM medical_records m
JOIN pets p ON p.id = m.pet_id
JOIN auth.users u ON u.id = p.owner_id
WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
  AND (m.title IN ('JKKSNFKEUFJNNS L','SADSAD')
       OR m.notes IN ('SADSAD','test','asdf')
       OR m.notes ~* '^[a-z]{15,}$'
       OR m.title ~* '^[A-Z]{5,}$');
```

### 4. Vets reales con reviews/bookings sospechosos

```sql
SELECT v.id, sp.display_name, u.email, v.rating, v.comment
FROM vet_reviews v
JOIN service_providers sp ON sp.id = v.provider_id
JOIN auth.users u ON u.id = sp.user_id
WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
  AND v.created_at BETWEEN '2026-04-07' AND '2026-04-09';
```

### 5. Feed posts de users reales con patrones seed

```sql
SELECT fp.id, fp.user_id AS author_id, u.email, fp.content
FROM posts fp
JOIN auth.users u ON u.id = fp.user_id
WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
  AND fp.content ~* '(tuvo un paseo|tuvo una visita al vet|tuvo un baño|tuvo una vacuna)'
  AND fp.created_at >= '2026-04-07';
```

### 6. Microchips inválidos

```sql
SELECT p.id, u.email, p.name, p.microchip_number
FROM pets p
JOIN auth.users u ON u.id = p.owner_id
WHERE p.microchip_number ~ '^0+$'
   OR (p.microchip_number IS NOT NULL
       AND length(p.microchip_number) > 0
       AND length(p.microchip_number) < 15);
```

---

## Próximos pasos

1. Ejecutar queries arriba en Supabase Dashboard
2. Si hay resultados, aplicar migración `20260419000000_clean_seed_contamination.sql`
3. Luego aplicar `20260419000001_seed_contamination_guards.sql`
4. Verificar que `profiles.is_demo` ya existe (migración `99999999000000`)
5. Ejecutar `scripts/seed-demo.mjs --reset` para recargar demos limpios

## Migraciones relacionadas

| Archivo | Propósito |
|---|---|
| `20260419000000_clean_seed_contamination.sql` | Cleanup quirúrgico de contaminación |
| `20260419000001_seed_contamination_guards.sql` | Trigger que previene contaminación futura |
