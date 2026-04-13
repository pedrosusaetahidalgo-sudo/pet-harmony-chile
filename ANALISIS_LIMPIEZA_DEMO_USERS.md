# Analisis y Limpieza de Usuarios Demo — Paw Friend

> Documento operativo para ejecutar la limpieza de datos demo/falsos en produccion.
> Fecha: 2026-04-12

---

## 1. Resumen del problema

La base de datos de produccion tiene **~100 usuarios demo** creados por la migracion
`20260426000000_cleanup_and_reseed_all_demo.sql` y el script `scripts/seed-demo.mjs`.
Estos datos falsos contaminan metricas, el feed social, el directorio de veterinarios
y la experiencia de usuarios reales.

**Objetivo**: eliminar TODOS los usuarios demo **excepto 5 perfiles de vets demo**
que se conservan para reuniones de venta. Los usuarios reales NO deben ser tocados.

---

## 2. Como identificar datos demo vs reales

### 2.1 Criterios de deteccion de datos DEMO

| Criterio | Descripcion |
|---|---|
| `profiles.is_demo = true` | Flag principal, agregado por migracion `99999999000000` |
| `auth.users.email LIKE '%@demo.pawfriend.cl'` | Dominio de email demo |
| `auth.users.email LIKE '%@demo.cl'` | Dominio legacy (seed original de 8 users) |
| UUIDs hardcodeados `a1b2c3d4-{1111..8888}-4000-a000-000000000001..008` | Los 8 users originales del `seed.sql` |
| `service_providers.is_demo = true` | Flag de proveedores demo |
| `service_providers.license_number LIKE 'DEMO%'` | Los 5 vets demo nombrados (DEMO001..005) |
| `service_providers.license_number LIKE 'VET-%'` | Los ~15 vets generados automaticamente |

### 2.2 Criterios de USUARIO REAL (NO TOCAR)

| Criterio | Descripcion |
|---|---|
| `profiles.is_demo = false` o `is_demo IS NULL` | Usuario registrado de verdad |
| Email NO es `@demo.pawfriend.cl` ni `@demo.cl` | Dominio real |
| UUID NO esta en la lista de hardcodeados | No fue creado por seed |
| Datos de Pedro (dueno) y Kai (pastor suizo real) | Usuario admin real — NUNCA eliminar |

---

## 3. Inventario de datos demo en la DB

### 3.1 Usuarios demo (~100)

Creados por la migracion unificada. Cada uno tiene:
- 1 registro en `auth.users` (email `{i}@demo.pawfriend.cl`)
- 1 registro en `profiles` (`is_demo = true`)
- 1-3 mascotas en `pets`
- 3-7 registros medicos en `medical_records`
- 1-5 actividades en `pet_activities`
- Posts en `posts` (3-5 por usuario, ~400 total)
- Comentarios en `post_comments`
- Likes en `post_likes`
- Follows en `user_follows`
- Recordatorios en `pet_reminders`
- Puntos en `paw_point_transactions`
- Progreso de misiones en `user_mission_progress`
- Badges en `user_paw_badges`
- Stats en `user_stats`
- Progreso guardian en `user_guardian_progress`

### 3.2 Providers demo (~15)

- De los 100 users, ~15 son tambien service_providers (los que `i % 7 == 1`)
- Cada uno tiene `is_demo = true` en `service_providers`
- `license_number` formato `VET-XXXXX`
- Tienen `vet_service_prices` (10 tipos de servicio cada uno, `is_estimate = true`)
- Tienen `service_reviews` fabricadas
- Tienen bookings fabricados
- Pueden tener `groomer_profiles`, `dog_walker_profiles`, `trainer_profiles`, `dogsitter_profiles`

### 3.3 Los 5 vets demo nombrados (SE CONSERVAN)

Creados por `supabase/seeds/demo_profiles.sql`. Son los perfiles de referencia para demos de venta:

| # | display_name | license_number | provider_type | commune | plan |
|---|---|---|---|---|---|
| 1 | Dra. Javiera Munoz | DEMO001 | home_visit | Las Condes | provider_individual |
| 2 | Dr. Matias Fernandez | DEMO002 | individual | Nunoa | provider_individual |
| 3 | Clinica Veterinaria Patitas | DEMO003 | clinic | Nunoa | provider_clinic_basic |
| 4 | Clinica Veterinaria Altamira | DEMO004 | clinic | Providencia | provider_clinic_pro |
| 5 | Dr. Cristian Rojas | DEMO005 | home_visit | Providencia | provider_individual |

**Estos 5 se identifican por**: `license_number IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005')`

### 3.4 Datos de catalogo (compartidos)

Algunas tablas tienen datos de catalogo que fueron insertados por seeds pero son usados tanto por demo como por reales:
- `activities` — catalogo de tipos de actividad
- `guardian_levels` — niveles de guardian
- `paw_missions` — misiones disponibles
- `paw_badges` — badges disponibles
- `paw_shop_rewards` — recompensas de la tienda
- `consultation_templates` — plantillas de consulta

**Regla**: estos catalogos NO se borran si hay usuarios reales que los usan.

---

## 4. Tablas afectadas por la limpieza (orden de eliminacion)

La eliminacion debe respetar foreign keys. Orden seguro (de hoja a raiz):

```
 1. notifications
 2. vet_clinical_notes (via medical_share_tokens)
 3. medical_share_tokens
 4. service_promotions
 5. user_mission_progress
 6. user_paw_badges
 7. pet_activity_cheers
 8. pet_activities
 9. user_activities
10. messages (solo entre demo users)
11. conversations (solo entre demo users)
12. user_follows
13. post_likes
14. post_comments
15. posts
16. vet_service_prices (solo de providers demo, excluyendo DEMO001-005)
17. user_shop_redemptions
18. service_reviews (solo de providers demo, excluyendo DEMO001-005)
19. medical_records
20. pet_reminders
21. paw_point_transactions
22. user_guardian_progress
23. user_stats
24. adoption_interests
25. adoption_posts
26. lost_pets
27. bookings
28. service_slots
29. review_invitations
30. groomer_profiles
31. dog_walker_profiles
32. trainer_profiles
33. dogsitter_profiles
34. pets
35. service_providers (excluyendo los 5 DEMO001-005)
36. profiles (excluyendo los users vinculados a DEMO001-005)
37. auth.users (excluyendo los vinculados a DEMO001-005)
```

---

## 5. Verificacion de usuarios reales

Antes y despues de la limpieza, verificar que los usuarios reales tengan acceso a todas las tablas y funciones nuevas:

### 5.1 Query de verificacion pre-limpieza

```sql
-- Contar usuarios reales vs demo
SELECT
  COUNT(*) FILTER (WHERE is_demo = false OR is_demo IS NULL) AS usuarios_reales,
  COUNT(*) FILTER (WHERE is_demo = true) AS usuarios_demo,
  COUNT(*) AS total
FROM profiles;

-- Verificar que usuarios reales tienen columnas nuevas
SELECT id, display_name, is_demo, is_premium, is_grandfathered,
       plan_badge, sidebar_tutorial_progress, report_preferences,
       whatsapp_number, whatsapp_opted_in,
       level, points
FROM profiles
WHERE is_demo = false OR is_demo IS NULL;
```

### 5.2 Tablas/funciones nuevas que deben funcionar para usuarios reales

| Tabla/Funcion | Desde migracion | Verificar |
|---|---|---|
| `paw_cards` + `paw_card_id` auto-gen | `20260412180000` + `20260501200000` | Que los pets de usuarios reales tengan `paw_card_id` generado |
| `community_groups` + `community_group_members` | `20260427000003` | Que las tablas existan (no requieren datos previos) |
| `pets.species` expandido | `20260428000000` | Que species no tenga constraint viejo |
| `feed_triggers` | `20260429000000` | Que triggers de feed existan |
| `partner_locations` | `20260430000000` | Que la tabla exista |
| `medical_summary_rpc_v2` | `20260430000001` | Que la funcion RPC exista |
| `public_ranking_rls` | `20260501100000` | Que las politicas RLS existan |

### 5.3 Query de verificacion post-limpieza

```sql
-- Verificar que NO se borro ningun usuario real
SELECT COUNT(*) AS usuarios_reales_post
FROM profiles
WHERE is_demo = false OR is_demo IS NULL;

-- Verificar que se conservaron los 5 vets demo
SELECT display_name, license_number, status
FROM service_providers
WHERE license_number IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005');

-- Verificar que NO quedan providers demo genericos
SELECT COUNT(*) AS providers_demo_restantes
FROM service_providers
WHERE is_demo = true
  AND license_number NOT IN ('DEMO001','DEMO002','DEMO003','DEMO004','DEMO005');

-- Verificar que pets de usuarios reales tienen paw_card_id
SELECT p.id, p.name, p.paw_card_id
FROM pets p
JOIN profiles pr ON p.owner_id = pr.id
WHERE pr.is_demo = false OR pr.is_demo IS NULL;

-- Verificar integridad del feed (posts solo de usuarios reales)
SELECT COUNT(*) AS posts_restantes,
       COUNT(*) FILTER (WHERE u.is_demo = true) AS posts_demo_huerfanos
FROM posts po
LEFT JOIN profiles u ON po.user_id = u.id;

-- Verificar que funciones/triggers criticos existen
SELECT proname FROM pg_proc WHERE proname IN (
  'apply_premium',
  'generate_provider_slug',
  'get_medical_summary_data',
  'generate_paw_card_id_on_insert'
);
-- Nota: generate-medical-summary es una Edge Function Deno, no SQL RPC.
-- Nota: el ranking publico es una policy RLS, no una funcion.
-- Nota: paw_card_id se genera via trigger generate_paw_card_id_on_insert.
```

---

## 6. Migracion SQL de limpieza

El archivo de migracion se encuentra en:
**`supabase/migrations/20260502000000_cleanup_demo_keep_5_vets.sql`**

### Instrucciones de ejecucion

1. **Hacer backup** de la base de datos desde Supabase Dashboard
2. **Ejecutar las queries de verificacion pre-limpieza** (seccion 5.1) y anotar los conteos
3. **Abrir** Supabase Dashboard > SQL Editor
4. **Copiar y pegar** el contenido completo de la migracion
5. **Ejecutar** y verificar los NOTICE en la consola
6. **Ejecutar las queries post-limpieza** (seccion 5.3) y comparar con pre-limpieza
7. **Verificar la app** en el navegador:
   - Login con usuario real funciona
   - Feed muestra solo posts de usuarios reales
   - Directorio de vets muestra los 5 demo + vets reales
   - Ficha clinica de mascotas reales funciona
   - Paw Cards de mascotas reales se generan

### Rollback

Si algo sale mal:
- Restaurar el backup desde Supabase Dashboard
- Los datos demo se pueden re-crear con: `node --env-file=.env.demo.local scripts/seed-demo.mjs`

---

## 7. Limpieza del codigo fuente

Despues de ejecutar la migracion, considerar:

1. **`src/hooks/useProviderProfile.tsx`**: los guards `DEMO_EMAILS`, `DEMO_PHONES`, `DEMO_COLMEVET` siguen siendo utiles para prevenir que vets reales guarden datos demo sin editar. **NO eliminar**.

2. **`scripts/seed-demo.mjs`**: mantener como herramienta para re-poblar demos cuando se necesite. **NO eliminar**.

3. **`supabase/seeds/demo_profiles.sql`**: mantener como referencia de los 5 vets demo. **NO eliminar**.

4. **Migraciones previas de seed**: ya aplicadas, no se pueden borrar del historial. **Dejar como estan**.

---

## 8. Resumen ejecutivo

| Accion | Cantidad estimada |
|---|---|
| Usuarios demo a eliminar | ~95 (100 - 5 vinculados a vets) |
| Providers demo a eliminar | ~10 (15 genericos - 5 nombrados) |
| Posts demo a eliminar | ~400 |
| Mascotas demo a eliminar | ~150 |
| Medical records a eliminar | ~500+ |
| Vets demo a CONSERVAR | 5 (DEMO001-DEMO005) |
| Usuarios reales afectados | 0 |

---

*Documento generado para revision del dueno antes de ejecutar.*
