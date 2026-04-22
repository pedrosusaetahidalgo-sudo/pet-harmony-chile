# Plan de ejecución — Adopción como onboarding + Centros de Adopción

> **Fecha**: 2026-04-20
> **Autor**: Pedro + Claude
> **Estado**: Propuesta para aprobación
> **Scope**: Grande (nuevo rol, nueva DB, nueva UI, nuevo deck)

---

## 1. Por qué (norte del cambio)

Hoy `/adoption` es una tab experimental (Paw Labs) donde cualquier dueño
puede publicar una mascota y hay un listado IA-generado de refugios.

**El problema**: los refugios/hogares de adopción **no tienen cuenta** en
Paw Friend. Son datos inertes en `adoption_shelters`. Cada mascota que
adoptan y entregan a un nuevo dueño **nace sin ficha médica** en la app:
el adoptante parte desde cero, sin historial de vacunas, desparasitación,
condiciones previas, etc.

**La oportunidad**: convertir a los centros de adopción en el **onboarding
inicial** del animal dentro de Paw Friend:

1. El refugio crea/carga la ficha de la mascota mientras la tiene a su
   cargo (vacunas, historial, fotos, temperamento).
2. Publica la mascota en adopción dentro de la app.
3. Cuando alguien adopta, se **transfiere la mascota completa** (ficha
   médica + Paw Card + timeline) al nuevo dueño, igual que el flujo
   vet→dueño ya existente (`pending_owner_email`).
4. El adoptante parte con una ficha real, no de cero.

**Para el refugio**, Paw Friend pasa de ser "otra plataforma donde subir
fotos" a **una herramienta operativa real** (gestión de mascotas,
historial, bulk import, fichas PDF descargables, QR de mascota).

**Para Paw Friend**, los refugios son un **canal de adquisición**:
cada mascota adoptada = 1 dueño nuevo que entra a la red con cuenta activa.

**Incentivos para refugios**:
- % de donaciones dirigidas a su causa (opt-in por donante).
- Visibilidad prioritaria en `/donaciones` y en la app.
- Cuenta gratis siempre (no se les cobra).
- Sponsorship explícito de Paw Companys y amplificación de Paw Voices.

---

## 2. Qué existe hoy (línea base — verificado en código)

| Capa | Qué hay | Ruta / archivo |
|---|---|---|
| Página adopción | Tab `/adoption` con 4 pestañas | `src/pages/Adoption.tsx` |
| Publicar mascota | Formulario user-facing | `src/components/CreateAdoptionPost.tsx` |
| Listar refugios | Lista IA (Leaflet + cards) | `src/components/AdoptionSheltersList.tsx` |
| Tabla refugios | `adoption_shelters` (sin user_id, lectura pública) | `20251201195938_*.sql` |
| Tabla posts | `adoption_posts`, `adoption_interests`, `adoption_messages` | `20251127162210_*.sql` |
| Edge fn | `generate-shelters` (Claude + web_search) | `supabase/functions/generate-shelters/` |
| Transferencia | vet→dueño vía `pending_owner_email` + `owner_invitation_token` | `20260422000001_pending_owner_pets.sql`, `supabase/functions/send-pet-invitation/` |
| Rol sistema | `owner` / `provider` | `src/hooks/useActiveRole.tsx` |
| Onboarding pro | `BecomeProviderDialog` (vet/groomer/walker/sitter/trainer) | `src/components/BecomeProviderDialog.tsx` |
| Donaciones | `/donaciones` + tabla `donations` + `paw_companys` | `src/pages/Donaciones.tsx`, `20260602010000_donations.sql`, `20260604010000_paw_companys.sql` |
| Pitch decks | 4 MDs audiencia + 4 HTMLs | `pitch-inversionistas/` |

**No existe**:
- Tipo de cuenta para refugios.
- Relación user_id ↔ refugio.
- Bulk import de mascotas (sólo mencionado en plan "Clínica").
- Donaciones dirigidas a un refugio.
- Pitch deck para refugios.

---

## 3. Decisiones de arquitectura

### 3.1. Modelo de cuenta "Shelter"

**Descartado**: agregar `'shelter'` a `primary_service_type` en
`service_providers`. Mezclaría dos modelos de negocio (profesional que
cobra servicios vs refugio sin ánimo de lucro) y rompería RLS/UI existente.

**Elegido**: **tabla dedicada `adoption_centers`** (nombre que distingue
de `adoption_shelters` — esta última sigue siendo el catálogo IA público).

```sql
adoption_centers (
  id UUID PK,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  legal_name TEXT NOT NULL,          -- "Refugio Huellitas Felices"
  rut TEXT,                          -- opcional (personas jurídicas)
  type TEXT CHECK (type IN ('ong','fundacion','refugio','independiente','municipal')),
  mission TEXT,                      -- descripción de la causa
  commune TEXT NOT NULL,
  region TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  social_media JSONB,                -- {instagram, facebook, tiktok}
  animal_types TEXT[],               -- ['perros','gatos','otros']
  capacity INT,                      -- # animales que puede albergar
  logo_url TEXT,
  banner_url TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_doc_url TEXT,         -- comprobante legal opcional
  slug TEXT UNIQUE,                  -- para landing pública /refugios/{slug}
  accepts_donations BOOLEAN DEFAULT true,
  donation_percentage INT DEFAULT 0 CHECK (donation_percentage BETWEEN 0 AND 100),
  total_pets_adopted INT DEFAULT 0,  -- contador denormalizado
  total_donations_clp BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Reconciliación con `adoption_shelters`**:
- `adoption_shelters` queda como **catálogo público IA-scraped** (refugios
  que todavía no tienen cuenta en la app).
- Cuando un refugio crea cuenta vía `BecomeShelterDialog`, se intenta
  match por `name`+`commune` y si matchea se vincula con
  `adoption_shelters.claimed_by_adoption_center_id UUID NULL`.
- La UI muestra un badge "✓ Verificado en Paw Friend" cuando hay vínculo.

### 3.2. Rol `shelter` en el sistema

Extender `useActiveRole`:
```ts
type ActiveRole = 'owner' | 'provider' | 'shelter';
```

Un mismo usuario puede ser owner + shelter (una fundadora de refugio
también tiene sus propias mascotas). Queda por resolver vía toggle en el
Header (igual que hoy owner↔provider).

Nueva guard `<ShelterRoute>` para `/shelter/*`.

### 3.3. Extender tabla `pets`

```sql
ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS created_by_shelter_id UUID REFERENCES adoption_centers(id),
  ADD COLUMN IF NOT EXISTS shelter_intake_at TIMESTAMPTZ,       -- cuándo entró al refugio
  ADD COLUMN IF NOT EXISTS shelter_adopted_at TIMESTAMPTZ,      -- cuándo fue adoptada
  ADD COLUMN IF NOT EXISTS shelter_notes TEXT;                  -- historia del refugio
```

El flujo `pending_owner_email` + `owner_invitation_token` existente se
reutiliza tal cual (ya es genérico).

### 3.4. Donaciones dirigidas

```sql
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS beneficiary_type TEXT DEFAULT 'general'
    CHECK (beneficiary_type IN ('general','adoption_center','paw_friend')),
  ADD COLUMN IF NOT EXISTS beneficiary_adoption_center_id UUID REFERENCES adoption_centers(id);
```

UI en `/donaciones` añade selector opcional: "¿Quieres dirigir tu
donación a un refugio específico?" con lista filtrable.

### 3.5. Bulk import

Nueva tabla `adoption_bulk_imports` para audit trail:

```sql
adoption_bulk_imports (
  id UUID PK,
  adoption_center_id UUID NOT NULL REFERENCES adoption_centers(id),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT,
  total_rows INT,
  success_count INT,
  error_count INT,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Formato CSV template descargable. Columnas mínimas:
```
name, species, breed, sex, birth_year, birth_month, size, description,
health_status, temperament, photo_url_1, photo_url_2, photo_url_3,
sterilized, vaccinated, dewormed, microchip
```

Validación zod + preview antes de insertar. Máximo 500 filas por import
(límite de edge function timeout).

### 3.6. Transferencia mascota al adoptar

Flujo:
1. Refugio marca adoptante en `adoption_interests` como "elegido".
2. Al confirmar, edge fn `transfer-pet-to-adopter`:
   - Setea `pets.pending_owner_email` con email del adoptante.
   - Genera `owner_invitation_token`.
   - Setea `pets.shelter_adopted_at = now()`.
   - Envía email (reutiliza template de `send-pet-invitation`).
3. Adoptante abre link → auto-claim vía `useAutoClaimByEmail` existente
   (si ya tiene cuenta) o registro + claim.
4. Mascota queda en su `/my-pets` con toda la ficha intacta.
5. Incrementa `adoption_centers.total_pets_adopted`.

### 3.7. Pitch deck

Nuevo archivo `pitch-inversionistas/05_HOGARES_DE_ADOPCION.md` + nueva
slide en `PRESENTACION.html` + posiblemente
`PRESENTACION_HOGARES_ADOPCION.html` dedicado.

Mensajes clave:
- **Para el refugio**: gestión operativa gratis + PDF ficha médica + bulk
  import + QR por animal + donaciones dirigidas.
- **Para Paw Companys**: pueden patrocinar un refugio específico y
  aparecer con badge en su página.
- **Para Paw Voices**: historia de adopción real = contenido de alto engagement.
- **Para el adoptante**: la mascota llega a tu app con su historia ya
  cargada, no partes desde cero.

---

## 4. Fases de ejecución

Ordenadas por dependencia técnica y valor entregado temprano.

### Fase 1 — Migración SQL (DB foundations)
**Archivo**: `supabase/migrations/20260620000000_adoption_centers.sql`

Crea:
- Tabla `adoption_centers` + RLS + trigger updated_at
- Columnas nuevas en `pets` (created_by_shelter_id, shelter_intake_at, shelter_adopted_at, shelter_notes)
- Columnas nuevas en `donations` (beneficiary_type, beneficiary_adoption_center_id)
- Tabla `adoption_bulk_imports` + RLS
- Columna `claimed_by_adoption_center_id` en `adoption_shelters`
- Indices necesarios
- Seeds idempotentes (ninguno — queda vacía, se crean vía onboarding real)

**Pedro aplica** manualmente en Supabase SQL Editor (regla 9.2 CLAUDE.md).
**No break**: columnas nullable, sin DELETE, sin DROP. Protege datos existentes (regla 9.8).

**Tests**: Migración idempotente (IF NOT EXISTS en todo). RLS validado a mano.

### Fase 2 — Rol shelter en el sistema
- Extender `useActiveRole` → `'owner' | 'provider' | 'shelter'`.
- Nuevo hook `useIsShelter` (query `adoption_centers.user_id`).
- `RoleGuard` soporta `requiredRole="shelter"`.
- Nuevo `ShelterRoute` guard.
- Toggle en Header muestra opción shelter si `useIsShelter === true`.
- Helpers en `src/lib/routing.ts`: `isShelterRoute()`, constantes.

**Tests**: unit test de `useActiveRole` con 3 modos.

### Fase 3 — Onboarding refugio
- Nuevo `BecomeShelterDialog` (wizard 3 pasos):
  1. Tipo (ong/fundacion/refugio/independiente/municipal) + nombre legal.
  2. Ubicación (comuna + dirección opcional + Leaflet picker) + contacto.
  3. Misión + tipos de animales + capacidad + fotos (logo+banner) + aceptar donaciones (sí/no).
- Al submit: inserta en `adoption_centers` con `status='pending'`.
  Admin puede validar luego en panel (o auto-activar si no se quiere friction).
- Dialog accesible desde:
  - `/adoption` (banner "¿Eres un refugio? Regístrate gratis").
  - Header toggle de rol (opción "Soy un refugio").
  - Landing pública `/refugios-hogares` (nueva).
- Copy: tuteo chileno (regla 9.5).

**Tests**: form validación, happy path insert.

### Fase 4 — Dashboard `/shelter/dashboard`
Vista especial profesional tipo vet dashboard, adaptada a refugio:

Bloques:
- **Stats top**: total mascotas a cargo | total adoptadas | intereses activos | donaciones recibidas (si opt-in).
- **Lista mascotas** (`pets` where `created_by_shelter_id = currentShelter.id`):
  - Filtro por status (disponible/adoptada/en proceso).
  - Acción rápida: marcar adoptada, editar ficha, generar PDF, ver QR.
- **Intereses entrantes** (`adoption_interests` de posts del refugio).
- **Botón "Cargar mascotas masivamente"** → `/shelter/bulk-import`.
- **Botón "Compartir página pública"** → `/refugios/{slug}`.
- **Si `accepts_donations`**: widget donaciones recibidas + link al feed público.

**Sin gamificación** (Paw Game, PawCards, misiones). Refugio es
profesional, igual que vet.

**Navegación**: sidebar dedicado con links a Dashboard, Mascotas, Bulk Import,
Perfil público, Donaciones, Configuración.

### Fase 5 — Bulk import CSV/Excel
Ruta: `/shelter/bulk-import`.

UI:
1. **Template descargable** (CSV + Excel) con headers exactos y 3 filas de ejemplo.
2. **Upload** drag & drop (react-dropzone existente o input file).
3. **Parse** con `papaparse` (para CSV) o `xlsx` (para Excel — ya está en deps de shadcn? verificar).
4. **Validación** zod row-by-row. Muestra tabla preview con errores destacados.
5. **Corregir inline** o re-subir archivo.
6. **Confirmar** → edge function `bulk-import-pets` (Deno) inserta en lote.
7. **Audit trail** en `adoption_bulk_imports`.

Reglas:
- Máx 500 filas por import (timeout edge fn 60s).
- Fotos por URL (no se sube ZIP). Si no hay URL → pet queda sin foto con placeholder.
- Rate limit: 5 imports por refugio por día.
- `species` y `breed` se normalizan contra listas conocidas (log warning si no matchea).

**Alternativa simple (MVP rápido)**: si el usuario prefiere, primera
versión puede hacer el insert directo desde cliente con `supabase.from('pets').insert([...])`
y saltarse la edge function. La edge function se agrega después para
escalar.

### Fase 6 — Transferencia mascota refugio → adoptante
Edge function `transfer-pet-to-adopter`:
- Recibe: `{ pet_id, adopter_email, adoption_interest_id }`.
- Valida: caller es shelter, pet es del shelter, interest matchea.
- Setea `pending_owner_email`, genera token, envía email.
- Incrementa `adoption_centers.total_pets_adopted`.

UI en refugio: botón "Entregar mascota a adoptante" en mascota + interest.
Modal confirma email, muestra preview del email que se envía.

Reutiliza 100% del auto-claim existente (`useAutoClaimByEmail`).

Flow:
```
refugio → marca interest como elegido
       → click "Entregar mascota"
       → edge fn envía email con link
       → adoptante abre link
       → si tiene cuenta: pet aparece en /my-pets (auto-claim)
       → si no: registro → pet aparece
       → ficha médica COMPLETA se transfiere
```

### Fase 7 — Donaciones dirigidas a refugios
En `/donaciones`:
- Nuevo radio: "Dona a Paw Friend" / "Dona a un refugio específico".
- Si segundo: select de refugios activos (filtro comuna).
- Badge del refugio en la donación registrada.

En dashboard refugio:
- Widget "Donaciones recibidas" con wall público.
- Monto acumulado.

En `/donaciones` muro transparencia:
- Tag "Donación dirigida a Refugio X" si aplica.

**Legal**: Paw Friend actúa como intermediario. Disclaimer visible: "Las
donaciones dirigidas se transfieren al refugio cada X días, menos una
comisión operativa de Y% para cubrir costos de pasarela".
Valores X, Y por definir con Pedro.

### Fase 8 — Pitch deck hogares
Nuevos archivos:
- `pitch-inversionistas/05_HOGARES_DE_ADOPCION.md` (para enviar a refugios).
- Slide extra en `PRESENTACION.html` (valor propuesta general).
- Opcional: `PRESENTACION_HOGARES_ADOPCION.html` dedicado (si el deck va a ser muy diferente).

Mensaje core:
> "Convertí tu refugio en un sistema de gestión completo: ficha médica
> PDF, bulk import, QR por mascota, transferencia al adoptante, y acceso
> a donaciones de la red Paw Friend. Gratis para siempre."

### Fase 9 — Documentación viva
- `diagrams/FLUJO_COMPLETO.mmd` — agregar nodos shelter, flujo adopción con transfer.
- `MAPA_FUNCIONAL_COMPLETO.md` — nueva sección "Adopción y Centros".
- `INDEX.md` — referenciar este MD en Planes ejecutados.
- `CLAUDE.md` sección 11.2 — agregar rol `shelter`.
- `AGENTS.md` — mencionar el nuevo flujo.

---

## 5. Rutas nuevas

| Ruta | Público? | Descripción |
|---|---|---|
| `/refugios-hogares` | Sí | Landing pública (explica qué es, CTA registrar) |
| `/refugios/:slug` | Sí | Perfil público de un refugio |
| `/onboarding-shelter` | Auth | Wizard `BecomeShelterDialog` standalone |
| `/shelter/dashboard` | Shelter | Panel principal |
| `/shelter/pets` | Shelter | Lista de mascotas a cargo |
| `/shelter/bulk-import` | Shelter | Carga masiva |
| `/shelter/donations` | Shelter | Donaciones recibidas |
| `/shelter/profile` | Shelter | Editar perfil público |
| `/shelter/transfer/:petId` | Shelter | Flujo de transferencia |

**Redirect sugerido**: `/adopcion` mantiene funcionalidad actual, pero
agrega CTA arriba "¿Eres un refugio? Regístrate →".

---

## 6. Checklist de impacto en docs vivos

- [ ] `src/App.tsx` — 9 rutas nuevas
- [ ] `diagrams/FLUJO_COMPLETO.mmd` — nodos + flujo adopción
- [ ] `MAPA_FUNCIONAL_COMPLETO.md` — sección Adopción
- [ ] `CLAUDE.md` — rol shelter en sección 11.2
- [ ] `AGENTS.md`
- [ ] `INDEX.md`
- [ ] `pitch-inversionistas/README.md` — referenciar deck 05

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Refugios cargan datos falsos o duplican mascotas | Validación email dueño + verificación admin antes de `status='active'` |
| Bulk import rompe por edge fn timeout | Límite 500 filas, batch insert, audit trail |
| Transferencia pet pierde ficha | Tests E2E, no se tocan datos existentes, solo se setea owner_id |
| Donaciones dirigidas: problemas fiscales | Disclaimer + contabilidad separada (fuera de scope técnico, Pedro define flow operativo) |
| Confusión entre `adoption_shelters` (IA) y `adoption_centers` (cuentas reales) | Badge "Verificado" en UI, docs claros |
| Refugio municipal con procesos burocráticos | `type='municipal'` y verificación manual admin |

---

## 8. Tests mínimos

### Unit
- `useActiveRole` con 3 modos
- `useIsShelter` hook
- `BecomeShelterDialog` form validation
- CSV parser + zod validator
- Edge fn `transfer-pet-to-adopter` (mock Supabase)

### E2E (Playwright)
- Onboarding refugio end-to-end
- Bulk import 3 mascotas
- Transfer pet → adoptante receives ficha completa

### Manual QA
- Refugio puede ver mascotas, no puede ver mascotas de otros refugios (RLS)
- Admin puede ver todos
- Donación dirigida aparece en dashboard refugio
- PDF ficha médica se genera idéntico antes y después de transfer

---

## 9. Definición de "hecho"

- [ ] Migración aplicada en prod (Pedro)
- [ ] `npx tsc -b` → 0 errores
- [ ] `npm run lint` → 0 errores
- [ ] `npm run test:ci` → todo verde
- [ ] `npm run build` → pasa
- [ ] 1 refugio seed creado para QA visual
- [ ] Pitch deck 05 + slide en HTML principal
- [ ] Docs vivos actualizados en el mismo commit/PR

---

## 10. Copy chileno (muestras, para alinear tono)

- "Carga tus mascotas" (no "Sube", no "Registrá")
- "Cuando alguien adopte, le vamos a entregar la ficha completa"
- "Gratis para siempre. Paw Friend nunca cobra a los refugios"
- "Tu refugio puede recibir donaciones directas de la comunidad"
- "¿Eres un hogar de adopción? Regístrate y gestioná — digo, **gestiona** — a tus animales en un solo lugar"

---

## 11. Preguntas abiertas para Pedro

1. **Verificación refugio**: ¿auto-activar status=active al crear, o exigir validación admin?
2. **Donaciones dirigidas**: ¿qué % comisión operativa? ¿cada cuánto se transfieren al refugio? ¿cuenta Flow aún es personal → afecta esto?
3. **Capacidad bulk import**: ¿500 filas es suficiente o refugios grandes tienen más?
4. **Landing pública**: ¿prioritaria ahora o en fase 2?
5. **Paw Companys sponsor de refugio específico**: ¿incluir ya o fase posterior?
6. **Cuenta municipal**: ¿tratamiento especial (ej. whitelabel) o igual que ONG?

---

## 12. Orden sugerido de ejecución

Propuesta para ejecutar **en este orden** (cada fila = un commit/push):

1. Fase 1 (migración SQL) — Pedro aplica manualmente.
2. Fase 2 (rol shelter) + hooks + guards.
3. Fase 3 (BecomeShelterDialog + onboarding).
4. Fase 4 (dashboard `/shelter/*`).
5. Fase 6 (transferencia pet) — la UI refugio depende de esto.
6. Fase 5 (bulk import) — lo más pedido operativamente pero requiere Fase 4 primero.
7. Fase 7 (donaciones dirigidas).
8. Fase 8 (pitch deck).
9. Fase 9 (docs vivos) — en el mismo commit de cada fase.

Cada fase cierra con:
- `npx tsc -b` ok
- Commit con mensaje `feat(adoption): ...`
- Push a main
- Docs vivos actualizados

---

**Esperamos tu aprobación para empezar por Fase 1.**
