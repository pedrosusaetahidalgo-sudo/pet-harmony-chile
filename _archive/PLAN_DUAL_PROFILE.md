# Plan: Sistema de Perfil Dual (Dueno / Veterinario)

> Fecha: 2026-04-12
> Estado: APROBADO POR PEDRO — listo para implementar
> Ultima revision: 2026-04-12

---

## 0. Decisiones confirmadas

| Pregunta | Respuesta |
|---|---|
| Groomers/walkers/sitters/trainers = profesional? | **No.** Son marketplace, no perfil core. Se dejan intactos. |
| Vets separados del resto? | **Si.** `service_providers` = vets/clinicas = core. El toggle solo aplica aca. |
| Usuario nuevo debe elegir perfil antes de `/home`? | **No.** Puede ver `/home` y rutas universales. No accede a features sin perfil. |
| Toggle en mobile? | **Si.** Toggle visible en Header en todos los breakpoints. |
| Modificar onboardings? | **No.** Se reutilizan tal cual. Solo se agrega el flag `has_owner_profile`. |

---

## 1. Objetivo

Que cada usuario pueda tener **dos perfiles independientes**: dueno de mascota y veterinario/clinica. El toggle en el header permite cambiar entre ambos. Si el usuario no tiene el perfil destino, el toggle lo lleva al onboarding correspondiente. Las rutas de cada tipo redirigen al onboarding si falta el perfil. El usuario navega `/home` y rutas universales sin restriccion.

---

## 2. Arquitectura: core vs marketplace

### Core veterinario = `service_providers`
- `provider_type`: `'individual'` | `'home_visit'` | `'clinic'`
- Onboarding vet, dashboard, planes B2B, verificacion, directorio publico, pagos Flow
- **El toggle "Veterinario" apunta EXCLUSIVAMENTE a esta tabla.**

### Marketplace = tablas separadas (NO se tocan)
| Tabla | Ruta |
|---|---|
| `vet_profiles` | `/services/vets` (legacy domicilio) |
| `dog_walker_profiles` | `/services/walkers` |
| `dogsitter_profiles` | `/services/sitters` |
| `trainer_profiles` | `/services/trainers` |
| `groomer_profiles` | `/services/groomers` |

Cualquier usuario puede crear listings en el marketplace sin importar su perfil dual.

---

## 3. Estado actual

| Aspecto | Hoy | Archivo:linea |
|---|---|---|
| Determinacion de rol | Query a `service_providers`. Si hay fila -> `isProvider = true` | `useActiveRole.tsx:29-41` |
| Toggle | Solo visible si `isProvider`. Solo desktop (`hidden sm:flex`). Cambia localStorage. | `Header.tsx:166-184` |
| Proteccion de rutas | `ProtectedRoute` solo valida auth. Rutas provider accesibles por URL para cualquiera. | `ProtectedRoute.tsx:1-61` |
| Sidebar: isProvider | **Query duplicada** — AppSidebar hace su propia query a `service_providers`, independiente de `useActiveRole`. | `AppSidebar.tsx:119-133` |
| Sidebar: isGroomer | Query separada a `groomer_profiles`. | `AppSidebar.tsx:135-150` |
| Sidebar: hasPets | Query a `pets` para saber si tiene mascotas. | `AppSidebar.tsx:107-116` |
| BottomTabBar | Sin distincion de rol. 5 tabs fijos para todos. No usa `useActiveRole`. | `BottomTabBar.tsx:47-84` |
| Onboarding dueno | Crea fila en `pets` + actualiza `profiles.location`. Navega a `/home`. | `OnboardingDuenoMinimal.tsx:113-143` |
| Onboarding vet | Crea fila en `service_providers`. Navega a `/provider/dashboard`. | `OnboardingVetMinimal.tsx:118-129` |
| Forzar modo owner | useEffect: si `isProvider === false && role === "provider"` -> fuerza `"owner"` silenciosamente. | `useActiveRole.tsx:52-56` |
| Consumidores de useActiveRole | Header, ProfileSettingsList, App.tsx (provider del contexto) | 4 archivos |

---

## 4. Diseno

### 4.1. Migracion: `has_owner_profile` en `profiles`

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_owner_profile boolean NOT NULL DEFAULT false;

-- Backfill: usuarios que ya tienen mascotas
UPDATE profiles SET has_owner_profile = true
WHERE id IN (SELECT DISTINCT owner_id FROM pets);

CREATE INDEX IF NOT EXISTS idx_profiles_has_owner_profile
  ON profiles (has_owner_profile) WHERE has_owner_profile = true;
```

**Por que no un campo `role` enum?** Porque un usuario puede tener ambos perfiles. `service_providers` row = vet; `has_owner_profile = true` = dueno.

### 4.2. Cambios en `useActiveRole.tsx`

**Nuevo interface:**
```typescript
interface ActiveRoleCtx {
  role: ActiveRole;               // "owner" | "provider"
  isProvider: boolean;            // tiene service_providers row
  hasOwnerProfile: boolean;       // NUEVO: completo onboarding dueno
  hasBothProfiles: boolean;       // NUEVO: isProvider && hasOwnerProfile
  hasNoProfile: boolean;          // NUEVO: !isProvider && !hasOwnerProfile
  toggle: () => void;             // sin cambios — sigue siendo un setter simple
  setRole: (r: ActiveRole) => void;
}
```

**Cambios concretos:**

1. **Agregar query a `profiles.has_owner_profile`** (nueva query, junto a la de `service_providers`):
   ```typescript
   const { data: ownerProfile } = useQuery({
     queryKey: ["has-owner-profile", user?.id],
     queryFn: async () => {
       if (!user?.id) return false;
       const { data } = await supabase
         .from("profiles")
         .select("has_owner_profile")
         .eq("id", user.id)
         .single();
       return data?.has_owner_profile ?? false;
     },
     enabled: !!user?.id,
   });
   ```

2. **Modificar useEffect de forzado** (linea 52-56): hoy fuerza "owner" si no es provider. Nuevo comportamiento:
   ```typescript
   useEffect(() => {
     // Si no es provider y esta en modo provider -> forzar owner
     if (isProvider === false && role === "provider") {
       setRoleState("owner");
     }
     // Si no tiene perfil dueno y esta en modo owner -> forzar provider (si es provider)
     if (hasOwnerProfile === false && role === "owner" && isProvider === true) {
       setRoleState("provider");
     }
   }, [isProvider, hasOwnerProfile, role]);
   ```

3. **`toggle()` sigue simple** — solo cambia el estado. La logica de redirect la maneja el componente que llama (Header). Razon: separacion de responsabilidades. El contexto expone datos, la UI decide que hacer.

4. **Exponer** `hasOwnerProfile`, `hasBothProfiles`, `hasNoProfile` en el value del provider.

### 4.3. Comportamiento del toggle (en Header, NO en useActiveRole)

El boton toggle en Header.tsx maneja la logica de redirect:

```typescript
const handleToggle = () => {
  if (role === "owner") {
    // Quiere ir a veterinario
    if (isProvider) {
      toggle(); // cambiar normalmente
    } else {
      toast.info("Para acceder como veterinario, primero completa tu perfil.");
      navigate("/onboarding-vet");
    }
  } else {
    // Quiere ir a dueno
    if (hasOwnerProfile) {
      toggle(); // cambiar normalmente
    } else {
      toast.info("Para acceder como dueno, primero registra tu primera mascota.");
      navigate("/onboarding-mascota");
    }
  }
};
```

**Por que en Header y no en useActiveRole?** Porque `toggle()` es consumido por 4 archivos distintos. Si el contexto hace navigate, acopla la logica de navegacion al provider global. Mejor que cada consumidor decida que hacer con el cambio de rol.

### 4.4. Header.tsx: toggle siempre visible + mobile

**Cambio en `Header.tsx:166-184`:**

Antes:
```tsx
{isProvider && (
  <Button ... className="h-8 px-2 text-xs gap-1.5 hidden sm:flex" ...>
```

Despues:
```tsx
{user && (
  <Button
    variant="ghost"
    size="sm"
    onClick={handleToggle}
    className="h-8 px-2 text-xs gap-1.5 flex"
  >
    {role === 'owner' ? (
      <>
        <PawPrint className="h-3.5 w-3.5 text-purple-600" />
        <span className="text-muted-foreground">Dueno</span>
        {!isProvider && <ArrowRight className="h-3 w-3 opacity-40" />}
      </>
    ) : (
      <>
        <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
        <span className="text-muted-foreground">Veterinario</span>
        {!hasOwnerProfile && <ArrowRight className="h-3 w-3 opacity-40" />}
      </>
    )}
  </Button>
)}
```

Cambios respecto a hoy:
- `{isProvider &&` -> `{user &&` (siempre visible si logged in)
- `hidden sm:flex` -> `flex` (visible en mobile)
- `Heart` -> `Stethoscope` + label "Veterinario" (no "Profesional")
- `onClick={toggle}` -> `onClick={handleToggle}` (con logica de redirect)
- Agregar `ArrowRight` como hint visual cuando falta el perfil destino
- **Imports nuevos**: `Stethoscope`, `ArrowRight` (verificar que esten en `@/lib/icons`)

### 4.5. RoleProtectedRoute (archivo nuevo)

```typescript
// src/components/RoleProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useActiveRole } from "@/hooks/useActiveRole";

interface Props {
  requiredRole: "owner" | "provider";
  children: React.ReactNode;
}

export function RoleProtectedRoute({ requiredRole, children }: Props) {
  const { isProvider, hasOwnerProfile } = useActiveRole();
  const location = useLocation();
  const returnTo = encodeURIComponent(location.pathname + location.search);

  if (requiredRole === "provider" && !isProvider) {
    return <Navigate to={`/onboarding-vet?returnTo=${returnTo}`} replace />;
  }

  if (requiredRole === "owner" && !hasOwnerProfile) {
    return <Navigate to={`/onboarding-mascota?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
}
```

**Nota:** este componente se anida DENTRO de `ProtectedRoute` (que valida auth). Nunca se usa solo. El orden en App.tsx seria:
```tsx
<Route path="/my-pets" element={
  <ProtectedRoute>
    <RoleProtectedRoute requiredRole="owner">
      <AppLayout><MyPets /></AppLayout>
    </RoleProtectedRoute>
  </ProtectedRoute>
} />
```

### 4.6. Rutas protegidas

**`requiredRole="provider"` (core vet):**
| Ruta | Pagina |
|---|---|
| `/provider/dashboard` | ProviderDashboard |
| `/provider/profile-edit` | ProviderProfileEdit |
| `/panel-pro` | ProDashboard |
| `/reportes` | WeeklyReports (vista pro) |

**`requiredRole="owner"` (dueno):**
| Ruta | Pagina |
|---|---|
| `/my-pets` | MyPets |
| `/add-pet` | AddPet |
| `/edit-pet/:petId` | EditPet |
| `/ficha/:petId` | MedicalRecords |
| `/reminders` | Reminders |
| `/en-memoria` | EnMemoria |
| `/paw-collection` | PawCollection |

**Universales (sin restriccion):**
`/home`, `/feed`, `/comunidad`, `/chat`, `/profile`, `/settings`, `/adoption`, `/maps`, `/servicios`, `/veterinarios`, `/upgrade`, `/user/:userId`, `/services/:type`

**Marketplace (sin restriccion de perfil dual):**
`/peluquero/perfil`, `/services/*` — cualquier usuario puede acceder

### 4.7. Onboardings: marcar perfil + returnTo

**`OnboardingDuenoMinimal.tsx` (linea ~127-143):**
1. Despues de insertar en `pets` (linea 113), agregar:
   ```typescript
   await supabase.from('profiles').update({ has_owner_profile: true }).eq('id', user.id);
   ```
2. Cambiar `navigate('/home')` (linea 143) por:
   ```typescript
   const returnTo = new URLSearchParams(window.location.search).get('returnTo');
   navigate(returnTo || '/home');
   ```
3. Invalidar query cache: `queryClient.invalidateQueries({ queryKey: ['has-owner-profile'] })`

**`OnboardingVetMinimal.tsx` (linea ~118-129):**
1. Ya crea fila en `service_providers` -> `isProvider` se actualiza automaticamente via react-query
2. Cambiar `navigate('/provider/dashboard')` (linea 129) por:
   ```typescript
   const returnTo = new URLSearchParams(window.location.search).get('returnTo');
   navigate(returnTo || '/provider/dashboard');
   ```
3. Invalidar query cache: `queryClient.invalidateQueries({ queryKey: ['is-provider-role'] })`

### 4.8. AppSidebar.tsx: eliminar queries duplicadas

**Problema actual:** AppSidebar hace 3 queries propias (`service_providers`, `groomer_profiles`, `pets`) en lineas 107-150, duplicando la logica de `useActiveRole`.

**Cambios:**

1. **Reemplazar query propia de `service_providers`** (lineas 119-133) por `useActiveRole()`:
   ```typescript
   const { isProvider, hasOwnerProfile, hasNoProfile, role } = useActiveRole();
   ```
   Esto elimina 1 query duplicada. La query de `useActiveRole` ya tiene cache via react-query.

2. **Mantener query de `groomer_profiles`** (lineas 135-150) — sigue siendo necesaria para el link de `/peluquero/perfil`. No la toca el sistema dual.

3. **Reemplazar query de `pets`** (lineas 107-116) — `hasPets` se reemplaza por `hasOwnerProfile` del contexto para decidir si mostrar items de dueno.

4. **Seccion "Salud"** (items en lineas 53-57):
   - "Inicio" (`/home`) -> **siempre visible** (ruta universal)
   - "Mis mascotas" (`/my-pets`) -> visible solo si `hasOwnerProfile || role === 'owner'`
   - "Recordatorios" (`/reminders`) -> visible solo si `hasOwnerProfile || role === 'owner'`

5. **Seccion "Profesional"** (lineas 262-307):
   - Condicion actual: `isProvider || isGroomer` -> cambiar a `isProvider || isGroomer` (sin cambio, ambos siguen mostrando la seccion)
   - Agregar label diferenciado: "Veterinario" para isProvider, "Peluquero" para isGroomer

6. **CTAs nuevos** (al final del sidebar, antes del footer):
   - Si `!hasOwnerProfile`: mostrar item "Registrar mi mascota" -> `/onboarding-mascota`
   - Si `!isProvider`: mostrar item "Soy veterinario" -> `/onboarding-vet`

### 4.9. BottomTabBar.tsx: tabs dinamicos

**Cambio principal:** importar `useActiveRole`, cambiar tabs segun `role`.

```typescript
export function BottomTabBar() {
  const { role, hasOwnerProfile, isProvider, hasNoProfile } = useActiveRole();
  // ... existing code ...

  const OWNER_TABS: Tab[] = [
    { label: 'Inicio', icon: HomeIcon, href: '/home', matchPaths: (p) => p === '/home' },
    { label: 'Mascotas', icon: PawPrint, href: '/my-pets', matchPaths: (p) => p === '/my-pets' || p.startsWith('/pet/') || ... },
    { label: 'Vets', icon: Stethoscope, href: '/veterinarios', matchPaths: (p) => p.startsWith('/veterinarios') },
    { label: 'Recordatorios', icon: Bell, href: '/reminders', matchPaths: (p) => p === '/reminders', badge: reminderBadge },
    { label: 'Perfil', icon: User, href: '/profile', matchPaths: (p) => p === '/profile' || p === '/settings' },
  ];

  const PROVIDER_TABS: Tab[] = [
    { label: 'Inicio', icon: HomeIcon, href: '/home', matchPaths: (p) => p === '/home' },
    { label: 'Mi Panel', icon: LayoutDashboard, href: '/provider/dashboard', matchPaths: (p) => p.startsWith('/provider') },
    { label: 'Reservas', icon: Calendar, href: '/mis-reservas', matchPaths: (p) => p === '/mis-reservas' },
    { label: 'Mensajes', icon: MessageSquare, href: '/chat', matchPaths: (p) => p.startsWith('/chat') },
    { label: 'Perfil', icon: User, href: '/profile', matchPaths: (p) => p === '/profile' || p === '/settings' },
  ];

  const TABS = role === 'provider' && isProvider ? PROVIDER_TABS : OWNER_TABS;
  // ...
```

**Detalle importante:** `useReminders()` (linea 39) se llama incondicionalmente hoy. Cuando `role === 'provider'`, el badge de recordatorios no se muestra, pero el hook aun dispara la query. Aceptable — la query es ligera y el usuario puede tener ambos perfiles. No optimizar prematuramente.

**Imports nuevos en BottomTabBar:** `LayoutDashboard`, `MessageSquare`, `Calendar` desde `@/lib/icons`.

### 4.10. Banner de bienvenida en `/home`

Home.tsx ya importa `HomeOnboardingHints` (linea 8). En vez de crear un componente nuevo, **extender** `HomeOnboardingHints` o agregar un bloque condicional en Home.tsx:

```tsx
{hasNoProfile && (
  <Card className="border-purple-200 bg-purple-50/50">
    <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-6">
      <div className="flex-1 text-center sm:text-left">
        <h3 className="font-semibold text-lg">Bienvenido a Paw Friend</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Elige como quieres empezar
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => navigate('/onboarding-mascota')}>
          <PawPrint className="h-4 w-4 mr-2" /> Registrar mi mascota
        </Button>
        <Button variant="outline" onClick={() => navigate('/onboarding-vet')}>
          <Stethoscope className="h-4 w-4 mr-2" /> Soy veterinario
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

Home.tsx necesitara importar `useActiveRole` y extraer `hasNoProfile`.

### 4.11. ProfileSettingsList.tsx (cambio menor)

Hoy usa `isProvider` (linea 45) para mostrar/ocultar el item "Mi panel profesional". Con el nuevo contexto, tambien puede mostrar CTAs:
- Si `!isProvider`: mostrar item "Registrarme como veterinario"
- Si `!hasOwnerProfile`: mostrar item "Registrar mi mascota"

Impacto bajo, se puede hacer en la misma pasada.

### 4.12. Paw Collection en Header

El boton de Paw Collection (Header.tsx lineas 187-197) siempre es visible. `/paw-collection` requiere `requiredRole="owner"`. Si un usuario sin perfil dueno apreta el boton, `RoleProtectedRoute` lo redirige a onboarding. No hay que ocultar el boton — el redirect lo maneja.

---

## 5. Migracion SQL

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_dual_profile_has_owner.sql`

```sql
-- ============================================================
-- Sistema de perfil dual: has_owner_profile
-- NO aplicar automaticamente. Pedro aplica desde Supabase Dashboard > SQL Editor.
-- ============================================================

-- 1. Agregar columna
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_owner_profile boolean NOT NULL DEFAULT false;

-- 2. Backfill: usuarios con mascotas = duenos confirmados
UPDATE profiles SET has_owner_profile = true
WHERE id IN (SELECT DISTINCT owner_id FROM pets);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_profiles_has_owner_profile
  ON profiles (has_owner_profile) WHERE has_owner_profile = true;
```

**12 lineas. Sin merge de tablas. Sin cambios a service_providers ni groomer_profiles.**

---

## 6. Archivos a crear/modificar

### Crear (2 archivos)
| Archivo | Descripcion | Lineas est. |
|---|---|---|
| `src/components/RoleProtectedRoute.tsx` | Guard de rutas por tipo de perfil | ~30 |
| `supabase/migrations/YYYYMMDDHHMMSS_dual_profile_has_owner.sql` | Migracion BD | ~12 |

### Modificar (8 archivos)
| Archivo | Cambio | Lineas afectadas | Impacto |
|---|---|---|---|
| `src/hooks/useActiveRole.tsx` | Nueva query `has_owner_profile`, exponer 3 campos nuevos, modificar useEffect de forzado | 29-66 | **Alto** |
| `src/components/Header.tsx` | Toggle siempre visible, `handleToggle` con redirect, quitar `hidden sm:flex`, icon Stethoscope | 166-184 + imports | Medio |
| `src/App.tsx` | Wrappear ~12 rutas con `RoleProtectedRoute` | rutas en 300-500 | Medio |
| `src/components/AppSidebar.tsx` | Usar `useActiveRole()` en vez de query propia, condicionar items Salud, agregar CTAs | 107-150, 262-307 | Medio |
| `src/components/BottomTabBar.tsx` | Importar `useActiveRole`, tabs dinamicos owner/provider, imports nuevos | 35-84 | Medio |
| `src/pages/OnboardingDuenoMinimal.tsx` | `has_owner_profile = true` + soporte `returnTo` + invalidar cache | 127-143 | Bajo |
| `src/pages/OnboardingVetMinimal.tsx` | Soporte `returnTo` + invalidar cache | 129 | Bajo |
| `src/pages/Home.tsx` | Banner bienvenida si `hasNoProfile` | nuevo bloque | Bajo |
| `src/integrations/supabase/types.ts` | Agregar `has_owner_profile` al tipo `profiles` | tipo profiles | Bajo |

### Cambio menor opcional (1 archivo)
| Archivo | Cambio |
|---|---|
| `src/components/profile/ProfileSettingsList.tsx` | Agregar CTAs "Registrarme como vet" / "Registrar mascota" si falta perfil |

### NO se tocan
- `src/hooks/useGroomerProfile.tsx`
- `src/pages/GroomerProfileEdit.tsx`
- `src/pages/ServiceDirectory.tsx`
- Todas las tablas/queries de marketplace
- `src/components/ProtectedRoute.tsx` (sigue como auth-only)

### Documentacion (mismo commit)
| Archivo | Que actualizar |
|---|---|
| `diagrams/FLUJO_COMPLETO.mmd` | Nodo toggle dual + bifurcacion owner/vet + guards RoleProtectedRoute |
| `diagrams/FLUJOS_MERMAID.md` | Diagrama individual del flujo dual-profile |
| `MAPA_FUNCIONAL_COMPLETO.md` | RoleProtectedRoute + nuevo campo profiles + cambios sidebar/bottomtab |

---

## 7. Orden de implementacion

```
Fase 1 — BD + tipos
  |-- 1a. Crear migracion SQL (has_owner_profile + backfill)
  +-- 1b. Agregar has_owner_profile al tipo profiles en types.ts

Fase 2 — Contexto
  +-- 2a. useActiveRole.tsx: nueva query, 3 campos nuevos, useEffect actualizado

Fase 3 — Guard de rutas
  |-- 3a. Crear RoleProtectedRoute.tsx
  +-- 3b. App.tsx: wrappear ~12 rutas con RoleProtectedRoute

Fase 4 — UI
  |-- 4a. Header.tsx: toggle siempre visible + handleToggle + mobile + Stethoscope
  |-- 4b. BottomTabBar.tsx: tabs dinamicos owner/provider
  |-- 4c. AppSidebar.tsx: usar useActiveRole, condicionar items, CTAs
  +-- 4d. Home.tsx: banner bienvenida si hasNoProfile

Fase 5 — Onboardings
  |-- 5a. OnboardingDuenoMinimal: set has_owner_profile + returnTo + invalidar cache
  +-- 5b. OnboardingVetMinimal: returnTo + invalidar cache

Fase 6 — Documentacion (mismo commit)
  |-- 6a. FLUJO_COMPLETO.mmd
  |-- 6b. FLUJOS_MERMAID.md
  +-- 6c. MAPA_FUNCIONAL_COMPLETO.md
```

---

## 8. Edge cases

| Caso | Comportamiento |
|---|---|
| Usuario existente con mascotas pero `has_owner_profile = false` | Migracion SQL backfill lo corrige |
| Provider intenta toggle a dueno sin perfil | `handleToggle` en Header redirige a `/onboarding-mascota` + toast |
| URL directa a `/provider/dashboard` sin ser provider | `RoleProtectedRoute` -> `/onboarding-vet?returnTo=/provider/dashboard` |
| URL directa a `/my-pets` sin perfil dueno | `RoleProtectedRoute` -> `/onboarding-mascota?returnTo=/my-pets` |
| Usuario nuevo sin ningun perfil en `/home` | Ve banner "Bienvenido". Puede navegar rutas universales. |
| Groomer que no es vet | `isProvider = false`. Toggle a "Veterinario" lo lleva a `/onboarding-vet`. Su perfil groomer sigue intacto en marketplace. |
| Usuario es vet Y groomer | Ambos funcionan independientemente. Toggle cambia dueno/vet. Groomer es feature marketplace aparte. |
| Usuario borra todas sus mascotas | `has_owner_profile = true` persiste (ya completo onboarding) |
| localStorage tiene `pf_active_role = "provider"` pero user ya no es provider | useEffect en useActiveRole fuerza "owner" (logica existente, linea 52-56) |
| localStorage tiene `pf_active_role = "owner"` pero user solo es provider | Nuevo useEffect fuerza "provider" |
| Deep link mobile a ruta protegida | `RoleProtectedRoute` redirige con `returnTo` |
| Admin/tester (migracion 20260412231000) | Ya tienen `service_providers` row. Backfill les da `has_owner_profile = true` si tienen mascotas. |
| Paw Collection en Header (siempre visible) | Si user sin perfil dueno lo apreta, `RoleProtectedRoute` en `/paw-collection` lo redirige a onboarding |
| AppSidebar: query duplicada de isProvider | Se elimina — usa `useActiveRole()` (1 query menos, cache compartida) |

---

## 9. Riesgos

| Riesgo | Mitigacion |
|---|---|
| Usuarios existentes sin `has_owner_profile` | Backfill SQL (WHERE id IN pets.owner_id) |
| RoleProtectedRoute bloquea flujos existentes | Solo protege 12 rutas especificas. Universales intactas. |
| Toggle confuso | Flecha `->` hint + toast + label "Veterinario" (no generico) |
| BottomTabBar cambia visualmente | Tabs modo dueno = identicos a hoy. Solo cambian en modo provider. |
| Groomer piensa que "Veterinario" lo incluye | Label explicito "Veterinario" + icono Stethoscope. Si quiere ser vet, puede hacer onboarding vet por separado. |
| react-query cache stale despues de onboarding | Invalidar queries explicitas en onboardings (`is-provider-role`, `has-owner-profile`) |
| AppSidebar tenia queries con staleTime 5min | Al usar useActiveRole (sin staleTime custom), considerar agregar staleTime similar para evitar re-fetches |

---

## 10. Que NO incluye este plan

| Item | Razon |
|---|---|
| Merge de `groomer_profiles` en `service_providers` | Groomers son marketplace, no core. Refactor independiente futuro. |
| Merge de walkers/sitters/trainers | Misma razon. |
| Dashboard para groomers/walkers | Feature futura. Solo vets tienen dashboard. |
| Planes B2B para marketplace | Solo vets/clinicas usan Flow.cl. |
| Limpieza de `vet_profiles` (legacy) vs `service_providers` | Deuda tecnica aparte. |
| Pagina `/elegir-perfil` (onboarding forzado) | Pedro decidio que el usuario puede explorar `/home` sin perfil. |

---

## 11. Roadmap de specs pendientes (docs-specs/)

Specs escritas que aun no se implementan. Prioridad asignada segun impacto en core y monetizacion.

| # | Spec | Prioridad | Dependencia | Razon |
|---|---|---|---|---|
| 1 | **[Perfil Dual](PLAN_DUAL_PROFILE.md)** (este doc) | **Alta** | Ninguna | Base para separar experiencias dueno/vet. Habilita todo lo demas. |
| 2 | **[Compartir Ficha V2](docs-specs/COMPARTIR_FICHA_V2.md)** — vinculacion vet-mascota | **Alta** | Perfil Dual (el vet necesita ser `isProvider` para recibir solicitudes) | Toca la joya de la corona. Reemplaza tokens temporales por vinculacion permanente con aceptar/rechazar. Notificaciones reales. |
| 3 | **[Premium vs Free](docs-specs/ANALISIS_PREMIUM_VS_FREE.md)** — que es gratis y que no | **Alta** | Ninguna (analisis, no codigo) | Define monetizacion. Sin esto, no hay clarity sobre que bloquear y que liberar. |
| 4 | **[Audio Consulta Vet](docs-specs/AUDIO_CONSULTA_VET.md)** — transcripcion IA en vivo | **Media** | Compartir Ficha V2 (el vet necesita pacientes vinculados para grabar) | Diferenciador unico B2B Chile. Requiere infra de IA (Whisper/Deepgram). Alto valor pero mas complejo. |
| 5 | **[Rutinas y Calendario](docs-specs/RUTINAS_Y_CALENDARIO_MASCOTA.md)** — rutinas recurrentes + calendario unificado | **Media** | Perfil Dual (requiere `hasOwnerProfile` para acceder) | Mejora retention B2C. No bloquea nada critico. Se puede hacer en paralelo. |

### Orden sugerido de ejecucion

```
1. Perfil Dual (este plan)          ← habilita toggle + guards
2. Premium vs Free (analisis)       ← define que se bloquea (puede ir en paralelo con 1)
3. Compartir Ficha V2               ← la vinculacion vet-mascota necesita perfil dual
4. Rutinas y Calendario             ← independiente, puede empezar en paralelo con 3
5. Audio Consulta Vet               ← necesita vinculacion de pacientes (depende de 3)
```

### Interacciones entre specs

- **Perfil Dual + Compartir Ficha V2**: `RoleProtectedRoute` protege las rutas de vet. El `ShareWithVetModal` busca en `service_providers` (solo vets reales, no marketplace). La card `PendingVetLinksCard` vive en `/provider/dashboard` que requiere `requiredRole="provider"`.
- **Compartir Ficha V2 + Audio**: El boton "Grabar" se mueve de `SharedFichasCard` (tokens temporales) a `LinkedPatientsCard` (vinculaciones permanentes). El vet graba sobre pacientes vinculados, no sobre tokens de 7 dias.
- **Premium vs Free + Perfil Dual**: El analisis define si el toggle dual es feature gratuita o premium. Propuesta: toggle gratis, pero features avanzadas de vet (analytics, multi-vet) requieren plan B2B.
