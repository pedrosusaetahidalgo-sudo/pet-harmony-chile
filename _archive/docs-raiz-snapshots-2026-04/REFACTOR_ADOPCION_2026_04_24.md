# Refactor Flujo Adopción — 2026-04-24

> Sub-fase del [REFACTOR_MAESTRO_2026_04_23.md](REFACTOR_MAESTRO_2026_04_23.md). Pertenece a Fase 0 (UX) + Fase 1 (estados+onboarding). Pedro pidió arreglar A+B+C+D+E.

---

## 0. Resumen ejecutivo

| # | Problema actual | Solución | Bloque |
|---|---|---|---|
| A | Doble flujo `/adoption` y `/refugios-hogares` confunde al adoptante | Embudo único en `/adoption` con tabs Mascotas/Refugios | 1 |
| B | Adoptante ve mascota en `/refugios/:slug` pero no puede expresar interés desde ahí | Botón "Me interesa" inline en perfil refugio | 1 |
| C | Adopción es one-way (link mágico → reclamo). Sin trazabilidad de interés/visita/aprobación | Tabla `adoption_processes` con kanban en dashboard refugio | 2 |
| D | `/refugios-hogares` sin filtros (comuna/tamaño/edad/urgente) | Filtros + score de match (reusar `lib/adoptionMatch.ts`) | 1 |
| E | `BecomeShelterDialog` 3 pasos sin validar; sin tour post-creación | Auditoría 3 pasos + paso 4 opcional (3 mascotas) + tour `/shelter/dashboard` primera vez | 2 |

Bloque 1 (~2-3 días): A+B+D — frontend pesado, 1 migración chica.
Bloque 2 (~3-4 días): C+E — backend pesado, tabla nueva + email automation.

---

## 1. Decisiones arquitectónicas

### 1.1. Por qué unificar `/adoption` + `/refugios-hogares` y no hacer feed paralelo

Hoy son 2 rutas con 2 fuentes:
- `/adoption` lee `adoption_posts` (posts de owners)
- `/refugios-hogares` lee `adoption_centers` (lista refugios)

El adoptante no entiende la diferencia y termina rebotando entre las dos. La unificación tiene 2 beneficios:
1. **Un solo embudo medible** (analytics): conversión adopción = `interest_created / pageview(/adoption)`
2. **Cards uniformes**: misma UI para "Firulais en adopción de Juan" y "Firulais en adopción del Refugio X". El adoptante no piensa "es de owner o de refugio", solo "es Firulais".

### 1.2. Por qué NO crear adoption_posts automáticos para cada mascota de refugio

Opción descartada: trigger SQL que cuando se inserta una mascota con `created_by_shelter_id IS NOT NULL AND owner_id IS NULL`, auto-crea row en `adoption_posts`.

Problemas:
- Duplica data (info en 2 tablas que pueden divergir)
- Trigger debe sincronizar updates (foto cambia en pet → debe actualizar post)
- RLS doble: refugio gestiona pets pero post lo crea trigger → quién es dueño del post?

**Decisión**: en el hook frontend (o RPC backend) hacemos UNION ALL `adoption_posts` + `pets WHERE created_by_shelter_id IS NOT NULL AND owner_id IS NULL`. Cards normalizadas en TS, no en SQL.

### 1.3. Por qué `adoption_interests` se extiende y no se reemplaza

Queremos que un mismo registro de interés sirva tanto para post-de-owner como para mascota-de-refugio. La tabla actual tiene `adoption_post_id NOT NULL`. Migración:

- `adoption_post_id` → DROP NOT NULL
- ADD COLUMN `pet_id` UUID NULLABLE REFERENCES pets(id)
- CHECK constraint: exactamente uno de los dos debe estar (XOR)
- Update RLS para cubrir el caso pet_id (refugio dueño = el shelter al que pertenece el pet)

Esto NO rompe queries existentes (las que filtran por `adoption_post_id` siguen andando), solo agrega capacidad nueva.

---

## 2. Bloque 1 — Frontend pesado (A + B + D)

### 2.1. Migración SQL

**Archivo**: `supabase/migrations/20260730000000_unify_adoption_feed.sql`

```sql
-- Permitir que adoption_interests apunte directamente a una mascota de refugio
-- (no solo a un adoption_post). Hoy adoption_post_id es NOT NULL.
BEGIN;

ALTER TABLE public.adoption_interests
  ALTER COLUMN adoption_post_id DROP NOT NULL,
  ADD COLUMN pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE;

-- XOR: exactamente uno debe estar
ALTER TABLE public.adoption_interests
  ADD CONSTRAINT adoption_interests_target_check
  CHECK (
    (adoption_post_id IS NOT NULL AND pet_id IS NULL)
    OR (adoption_post_id IS NULL AND pet_id IS NOT NULL)
  );

-- Index para queries de "intereses en mi mascota de refugio"
CREATE INDEX IF NOT EXISTS idx_adoption_interests_pet_id
  ON public.adoption_interests(pet_id) WHERE pet_id IS NOT NULL;

-- Unique: un usuario solo puede expresar interés 1 vez por mascota
CREATE UNIQUE INDEX IF NOT EXISTS uniq_adoption_interest_pet_user
  ON public.adoption_interests(pet_id, interested_user_id)
  WHERE pet_id IS NOT NULL;

-- RLS: refugio dueño puede ver intereses sobre sus pets
DROP POLICY IF EXISTS "Shelters can view interests on their pets"
  ON public.adoption_interests;
CREATE POLICY "Shelters can view interests on their pets"
  ON public.adoption_interests FOR SELECT
  USING (
    pet_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.pets p
      JOIN public.adoption_centers ac ON ac.id = p.created_by_shelter_id
      WHERE p.id = adoption_interests.pet_id
        AND ac.user_id = auth.uid()
    )
  );

-- INSERT: cualquier usuario logueado puede expresar interés en una mascota disponible
DROP POLICY IF EXISTS "Anyone can express interest in pet" ON public.adoption_interests;
CREATE POLICY "Anyone can express interest in pet"
  ON public.adoption_interests FOR INSERT
  WITH CHECK (
    pet_id IS NOT NULL
    AND interested_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pets
      WHERE id = adoption_interests.pet_id
        AND owner_id IS NULL
        AND created_by_shelter_id IS NOT NULL
    )
  );

COMMIT;

-- Smoke test (regla 9.2.1: triggers/policies con RLS deben validarse)
DO $$
DECLARE
  v_pet_id UUID;
  v_user_id UUID := '00000000-0000-0000-0000-000000000000';
  v_interest_id UUID;
BEGIN
  -- Crear pet de refugio dummy
  INSERT INTO public.pets (id, name, species, created_by_shelter_id, owner_id)
  VALUES (gen_random_uuid(), 'TEST_DELETE_ME', 'perro', NULL, NULL)
  RETURNING id INTO v_pet_id;

  -- Insertar interés con pet_id (debe pasar)
  INSERT INTO public.adoption_interests (pet_id, interested_user_id, message)
  VALUES (v_pet_id, v_user_id, 'smoke test')
  RETURNING id INTO v_interest_id;

  -- Cleanup
  DELETE FROM public.adoption_interests WHERE id = v_interest_id;
  DELETE FROM public.pets WHERE id = v_pet_id;

  RAISE NOTICE 'Smoke test OK';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Smoke test FAILED: %', SQLERRM;
END $$;
```

### 2.2. Feature flag

**Archivo**: `src/lib/featureFlags.ts`

```ts
/**
 * Refactor flujo adopción 2026-04-24.
 * Cuando true:
 *   - /adoption tiene 2 tabs (Mascotas / Refugios)
 *   - Feed mezcla adoption_posts + pets de refugio
 *   - /refugios-hogares redirige a /adoption?tab=refugios
 *   - /refugios/:slug muestra botón "Me interesa" por mascota
 *   - Filtros activos en feed
 * Cuando false: experiencia actual sin cambios.
 */
ADOPTION_UNIFIED_FEED: false,
```

### 2.3. Hook nuevo

**Archivo**: `src/hooks/useAdoptionFeed.ts`

Une `adoption_posts` (owners) + `pets WHERE created_by_shelter_id IS NOT NULL AND owner_id IS NULL` en un array de `AdoptableItem`:

```ts
type AdoptableItem = {
  id: string;
  source: 'owner_post' | 'shelter_pet';
  pet_id: string;
  name: string;
  species: 'perro' | 'gato' | 'otro';
  age_months: number | null;
  size: 'chico' | 'mediano' | 'grande' | null;
  comuna: string | null;
  photo_url: string | null;
  description: string | null;
  is_urgent: boolean;
  shelter_id: string | null;
  shelter_name: string | null;
  owner_user_id: string | null;
  created_at: string;
};

useAdoptionFeed({ filters }): { data: AdoptableItem[], ... }
```

### 2.4. Refactor `/adoption`

**Archivo**: `src/pages/Adoption.tsx`

Cuando `ADOPTION_UNIFIED_FEED=true`:

```
[Header: "Encontrá a tu próxima mascota"]
[Tabs: Mascotas | Refugios]

  Tab Mascotas:
    [Filtros: Comuna ▼ Especie ▼ Tamaño ▼ Edad ▼ ☐ Urgente]
    [Cards uniformes con badge "Refugio X" si aplica, score de match si hay prefs]

  Tab Refugios:
    [Filtros: Comuna ▼ Tipo ▼]
    [Cards de refugios con N mascotas disponibles]
```

### 2.5. Botón "Me interesa" en `/refugios/:slug`

**Archivo**: `src/pages/RefugioPublico.tsx`

Cada `<PetCard>` del refugio renderiza CTA "Me interesa":
- Sin login → redirect a `/auth?next=/refugios/:slug&action=interest&pet_id=:petId`
- Con login → mutation `INSERT INTO adoption_interests (pet_id, interested_user_id, message)` con dialog de mensaje opcional
- Optimistic update + toast "Listo, [nombre del refugio] te va a contactar"

### 2.6. Redirect

**Archivo**: `src/App.tsx`

```tsx
{flags.ADOPTION_UNIFIED_FEED && (
  <Route path="/refugios-hogares" element={<Navigate to="/adoption?tab=refugios" replace />} />
)}
{!flags.ADOPTION_UNIFIED_FEED && (
  <Route path="/refugios-hogares" element={<RefugiosHogares />} />
)}
```

### 2.7. KPIs Bloque 1

| KPI | Baseline | Meta |
|---|---|---|
| Pageviews `/adoption` | ? | +30% (absorbe `/refugios-hogares`) |
| Intereses creados / pageview | ? | >2% |
| % adoptantes que entran a `/refugios/:slug` y vuelven a app | ? | >40% |

---

## 3. Bloque 2 — Backend pesado (C + E)

### 3.1. Migración SQL: tabla `adoption_processes`

**Archivo**: `supabase/migrations/20260801000000_adoption_processes.sql`

```sql
CREATE TABLE public.adoption_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  adopter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES public.adoption_centers(id) ON DELETE CASCADE,
  source_interest_id UUID REFERENCES public.adoption_interests(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN (
    'interested',     -- inicial, viene de adoption_interests
    'contacted',      -- refugio respondió
    'visit_scheduled', -- visita agendada
    'visit_done',     -- visita hecha
    'approved',       -- refugio aprobó
    'rejected',       -- refugio rechazó (con motivo)
    'transferred'     -- se firmó transferencia → invitación enviada
  )),
  notes_shelter TEXT,
  notes_adopter TEXT,
  visit_date TIMESTAMPTZ,
  rejected_reason TEXT,
  approved_at TIMESTAMPTZ,
  transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pet_id, adopter_user_id)
);

CREATE INDEX idx_adoption_processes_shelter ON public.adoption_processes(shelter_id);
CREATE INDEX idx_adoption_processes_adopter ON public.adoption_processes(adopter_user_id);
CREATE INDEX idx_adoption_processes_status ON public.adoption_processes(status);

-- RLS: shelter ve los suyos, adopter ve los suyos
ALTER TABLE public.adoption_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shelter dueño ve sus procesos" ON public.adoption_processes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.adoption_centers WHERE id = shelter_id AND user_id = auth.uid()
  ));

CREATE POLICY "Adopter ve sus procesos" ON public.adoption_processes FOR SELECT
  USING (adopter_user_id = auth.uid());

-- UPDATE: solo shelter puede mover entre estados (excepto el adopter cancela)
CREATE POLICY "Shelter actualiza estados" ON public.adoption_processes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.adoption_centers WHERE id = shelter_id AND user_id = auth.uid()
  ));
```

### 3.2. Trigger: cuando `status='transferred'` ejecutar lógica de invitación

```sql
CREATE OR REPLACE FUNCTION trigger_adoption_transfer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'transferred' AND OLD.status != 'transferred' THEN
    -- Marcar pet con email del adopter para que reclame
    UPDATE public.pets
    SET pending_owner_email = (SELECT email FROM auth.users WHERE id = NEW.adopter_user_id),
        owner_invitation_token = encode(gen_random_bytes(32), 'hex'),
        shelter_adopted_at = now()
    WHERE id = NEW.pet_id;
    -- Edge function send-pet-invitation se llama desde frontend después del UPDATE
    NEW.transferred_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_adoption_transfer
BEFORE UPDATE ON public.adoption_processes
FOR EACH ROW EXECUTE FUNCTION trigger_adoption_transfer();
```

### 3.3. Páginas nuevas

- `src/pages/MisAdopciones.tsx` (`/mis-adopciones`): adoptante ve sus procesos (timeline)
- `src/pages/shelter/ShelterAdoptionsKanban.tsx` (`/shelter/adopciones`): kanban con 7 columnas

### 3.4. Onboarding refugio (E)

- Auditoría a `BecomeShelterDialog.tsx` (3 pasos): validar zod, captar comuna, RUT, etc.
- Paso 4 opcional: subir 3 mascotas iniciales con foto + nombre + especie. Acelera primera vista.
- Tour post-creación en `/shelter/dashboard`: 4 tooltips (Sube mascotas / Comparte perfil / Recibe interés / Transfiere). Usar `react-joyride` o componente custom.
- Verificar que `send-shelter-welcome` edge fn se llama desde el flow.
- Migración: `adoption_centers.onboarding_completed_at TIMESTAMPTZ NULL` para mostrar tour solo la primera vez.

### 3.5. KPIs Bloque 2

| KPI | Meta |
|---|---|
| Refugios con onboarding completado | 100% |
| % de intereses que avanzan a "contacted" | >50% |
| Tiempo promedio interés → transferred | <14 días |
| Refugios con tour completado | >70% |

---

## 4. Plan de ejecución

| Día | Tarea | Estado |
|---|---|---|
| 1 (hoy) | Doc + flag + migración SQL Bloque 1 | en curso |
| 2 | Hook useAdoptionFeed + refactor /adoption | pending |
| 3 | Botón "Me interesa" + redirect /refugios-hogares | pending |
| 4 | QA Bloque 1 + activar flag | pending |
| 5 | Migración + dashboard kanban refugio | pending |
| 6 | /mis-adopciones + tour onboarding | pending |
| 7 | QA Bloque 2 + activar | pending |

---

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Romper feed `/adoption` actual | Todo behind feature flag `ADOPTION_UNIFIED_FEED=false`. Pedro activa cuando valide. |
| RLS de `adoption_interests` mal configurada deja a los refugios sin ver sus intereses | Smoke test SQL en migración (regla 9.2.1) |
| Adopters spam de intereses | Unique index `(pet_id, interested_user_id)` + rate limit por usuario (1 interés cada 24h) |
| Refugio rechaza pero el adopter no se entera | Email automático en cada cambio de status (trigger después o edge fn) |

---

## 6. Lo que NO se toca en este refactor

- Edge function `send-pet-invitation` (sigue siendo el último paso del flow, no cambia)
- Tabla `adoption_centers` (estructura sin cambios, solo agregamos `onboarding_completed_at`)
- `lib/adoptionMatch.ts` (se reusa tal cual para score)
- `/post-adoption-checkin/:token` (sigue como cron post-adopción)
