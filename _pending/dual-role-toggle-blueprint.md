# Paw Friend — Dual-Role Toggle Blueprint

> Blueprint para hacer funcional el toggle Dueno/Profesional en el header.
> Autor: Claude Code · Fecha: 2026-04-11 | **Ultima revision**: 2026-04-29
> **Estado:** PARCIALMENTE IMPLEMENTADO — infraestructura existe, falta navegacion adaptativa.
>
> ### Que ya existe (no recrear)
> - `useActiveRole.tsx` exporta `ActiveRoleProvider` + hook `useActiveRole` desde el mismo archivo (NO en `src/contexts/`)
> - Persiste en `localStorage`, consulta `service_providers` via `useQuery`
> - Tipo `ActiveRole = "owner" | "provider"`, expone `role`, `isProvider`, `toggle()`, `setRole()`
>
> ### Que queda pendiente
> - Hacer que Sidebar y BottomTabBar reaccionen al rol activo (navegacion diferenciada)
> - Route guards para rutas exclusivas de cada rol
> - CTA "Conviertete en profesional" para usuarios sin registro en `service_providers`
> - Visual feedback (icono/color del toggle, transicion animada)

---

## 0. TL;DR

El toggle Dueno/Profesional existe en el header ([Header.tsx:143-162](src/components/Header.tsx#L143-L162)) y el contexto `useActiveRole` ([useActiveRole.tsx](src/hooks/useActiveRole.tsx)) funciona, pero **no produce ningun cambio visible**: la pagina no cambia, la navegacion no se adapta, el contenido no reacciona al rol activo. Este blueprint define que debe ver cada rol, como transicionar entre ellos, y como manejar usuarios que NO son profesionales.

---

## 1. Estado actual

### 1.1. Lo que existe y funciona

| Componente | Estado | Archivo |
|---|---|---|
| `ActiveRoleProvider` | Funcional, wrappea toda la app en `App.tsx:189` | `src/hooks/useActiveRole.tsx` |
| `useActiveRole()` hook | Expone `role`, `isProvider`, `toggle()`, `setRole()` | mismo archivo |
| Toggle UI en Header | Visible solo si `isProvider === true`, hidden en mobile | `src/components/Header.tsx:143-162` |
| Persistencia en localStorage | Key `pf_active_role`, sobrevive reloads | `useActiveRole.tsx:44-45` |
| Guard de seguridad | Si `isProvider === false` y rol es `provider`, fuerza reset a `owner` | `useActiveRole.tsx:52-56` |
| Deteccion de proveedor | Query a `service_providers` por `user_id` | `useActiveRole.tsx:29-41` |

### 1.2. Lo que NO funciona (el problema)

1. **Ningun componente reacciona al cambio de rol** — `role` se actualiza en contexto pero nadie lo consume para cambiar contenido.
2. **La navegacion no cambia** — Sidebar, BottomTabBar y Header muestran los mismos items sin importar el rol.
3. **No hay redirect al cambiar rol** — el usuario queda en la misma pagina, que puede no tener sentido en el nuevo contexto.
4. **El toggle no existe en mobile** — clase `hidden sm:flex` lo oculta en pantallas < 640px, donde vive el 70%+ del trafico.

---

## 2. Logica de negocio del dual-role

### 2.1. Quien puede ser profesional

Un usuario es profesional (`isProvider === true`) si y solo si tiene un registro en la tabla `service_providers` con su `user_id`. Esto se crea cuando:

- Se registra via `/registro-veterinario` (o `/registro-proveedor`)
- Completa el `VetOnboardingWizard` desde `/provider/profile-edit`
- Un admin lo crea manualmente

**Regla clave**: si el usuario NO tiene registro en `service_providers`, el toggle **no aparece** y siempre esta en modo dueno. No puede "activar" la vista profesional sin antes crear su perfil profesional.

### 2.2. Un usuario, dos contextos

El modelo no es "dos cuentas" sino **un usuario con dos sombreros**:

```
                    ┌─────────────────────┐
                    │     profiles        │  ← siempre existe (auth)
                    │  display_name       │
                    │  avatar_url         │
                    │  is_premium         │
                    └────────┬────────────┘
                             │
                    ┌────────┴────────────┐
                    │  service_providers  │  ← solo si es profesional
                    │  display_name (pro) │
                    │  specialties[]      │
                    │  commune            │
                    │  slug               │
                    └─────────────────────┘
```

- **Modo dueno**: ve sus mascotas, ficha clinica, recordatorios, feed, comunidad.
- **Modo profesional**: ve su dashboard de metricas, pacientes, reservas, resenas, perfil publico.

Los datos no cambian — cambia la **vista** y la **navegacion**.

### 2.3. Reglas de transicion

| Accion | Resultado |
|---|---|
| Toggle de dueno → profesional | Navegar a `/provider/dashboard` |
| Toggle de profesional → dueno | Navegar a `/home` |
| Usuario sin `service_providers` intenta toggle | No puede — toggle no se muestra |
| Usuario en ruta `/provider/*` y cambia a dueno | Redirect a `/home` |
| Usuario en ruta `/my-pets` y cambia a profesional | Redirect a `/provider/dashboard` |
| Reload de pagina | Mantiene ultimo rol (localStorage) |

---

## 3. Que ve cada rol

### 3.1. Navegacion — Sidebar (desktop)

**Modo Dueno** (lo que existe hoy, sin cambios):

```
SALUD
  Inicio            /home
  Mis Mascotas      /my-pets
  Recordatorios     /reminders
  Buscar Vet        /veterinarios

DESCUBRIR
  Feed              /feed
  Comunidad         /comunidad
  Adopcion          /adoption
  Servicios         /servicios

─────────────────────────
footer: Mi perfil, Cerrar sesion
```

**Modo Profesional** (reemplaza las secciones):

```
MI CONSULTORIO
  Dashboard         /provider/dashboard
  Mis Pacientes     /provider/dashboard (tab pacientes)
  Mis Reservas      /mis-reservas
  Mis Resenas       /provider/dashboard (tab resenas)

MI NEGOCIO
  Mi Perfil Pro     /provider/profile-edit
  Mis Precios       /provider/profile-edit (seccion precios)
  Ver como me ven   /veterinarios/{slug}
  Panel Pro         /panel-pro

─────────────────────────
footer: Cambiar a modo dueno, Cerrar sesion
```

### 3.2. Navegacion — BottomTabBar (mobile)

**Modo Dueno** (sin cambios, las 5 tabs actuales):

```
Inicio | Mascotas | Vets | Recordatorios | Perfil
```

**Modo Profesional** (5 tabs adaptadas):

```
Dashboard | Pacientes | Reservas | Resenas | Perfil Pro
```

| Tab Pro | Ruta | Icono |
|---|---|---|
| Dashboard | `/provider/dashboard` | `LayoutDashboard` |
| Pacientes | `/provider/dashboard` (scroll a pacientes) | `Users` |
| Reservas | `/mis-reservas` | `Calendar` |
| Resenas | `/provider/dashboard` (scroll a resenas) | `Star` |
| Perfil Pro | `/provider/profile-edit` | `UserCog` |

### 3.3. Header

El toggle ya existe. Cambios necesarios:

1. **Mostrar en mobile** — quitar `hidden sm:flex`, hacerlo visible en todas las pantallas.
2. **Indicador visual claro** — el toggle actual es un boton `ghost` poco visible. Reemplazar con un pill/switch que muestre el rol activo con color:
   - Dueno: fondo `purple-100`, texto `purple-700`, icono `PawPrint`
   - Profesional: fondo `teal-100`, texto `teal-700`, icono `Briefcase` o `Stethoscope`
3. **Animacion de transicion** — fade + slide sutil al cambiar rol (200ms).

### 3.4. Pagina de perfil (`/profile`)

**Modo dueno**: sin cambios respecto a lo actual (o al profile-redesign-blueprint si se implementa primero).

**Modo profesional**: redirigir a `/provider/profile-edit` automaticamente. El "perfil" del profesional ES su perfil profesional, no su perfil personal.

---

## 4. Implementacion paso a paso

### Fase 1: Toggle visible y funcional con redirect (prioridad alta)

**Archivos a modificar:**

#### 4.1. `src/hooks/useActiveRole.tsx`

Agregar `navigate` al toggle para redirigir:

```tsx
// Agregar al contexto:
interface ActiveRoleCtx {
  role: ActiveRole;
  isProvider: boolean;
  toggle: () => void;
  setRole: (r: ActiveRole) => void;
  // NUEVO: permite al consumer saber si deberia redirigir
  shouldRedirect: boolean;
}
```

No meter `useNavigate` dentro del provider (esta fuera de Router). En cambio, el toggle solo actualiza el estado. La redireccion la maneja cada consumer.

#### 4.2. `src/components/Header.tsx` — Toggle mejorado

Reemplazar el boton ghost por un switch visual y quitar `hidden sm:flex`:

```tsx
{isProvider && (
  <button
    onClick={() => {
      toggle();
      // Redirigir segun nuevo rol
      const nextRole = role === "owner" ? "provider" : "owner";
      navigate(nextRole === "provider" ? "/provider/dashboard" : "/home");
    }}
    className={cn(
      "flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors",
      role === "owner"
        ? "bg-purple-100 text-purple-700"
        : "bg-teal-100 text-teal-700"
    )}
  >
    {role === "owner" ? (
      <>
        <PawPrint className="h-3.5 w-3.5" />
        <span>Dueno</span>
      </>
    ) : (
      <>
        <Stethoscope className="h-3.5 w-3.5" />
        <span>Profesional</span>
      </>
    )}
  </button>
)}
```

#### 4.3. `src/components/BottomTabBar.tsx` — Tabs por rol

Consumir `useActiveRole()` y definir dos sets de tabs:

```tsx
const { role, isProvider } = useActiveRole();

const OWNER_TABS: Tab[] = [
  // ... las 5 tabs actuales sin cambios
];

const PROVIDER_TABS: Tab[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/provider/dashboard", ... },
  { label: "Reservas", icon: Calendar, href: "/mis-reservas", ... },
  { label: "Resenas", icon: Star, href: "/provider/dashboard", ... },
  { label: "Perfil Pro", icon: UserCog, href: "/provider/profile-edit", ... },
];

const TABS = (role === "provider" && isProvider) ? PROVIDER_TABS : OWNER_TABS;
```

#### 4.4. `src/components/AppSidebar.tsx` — Sidebar por rol

Actualmente la seccion "Profesional" se muestra como un bloque extra. Cambiar para que **reemplace** las secciones de salud/descubrir cuando `role === "provider"`:

```tsx
const { role, isProvider } = useActiveRole();

{role === "owner" || !isProvider ? (
  <>
    {/* Secciones Salud y Descubrir actuales */}
  </>
) : (
  <>
    {/* Secciones Mi Consultorio y Mi Negocio */}
  </>
)}
```

### Fase 2: CTA para convertirse en profesional (prioridad media)

Para usuarios que NO son profesionales, mostrar un CTA sutil en:

1. **Perfil** — card "Eres veterinario o profesional de mascotas?" con link a `/registro-veterinario`
2. **Sidebar** — item discreto al final: "Registrarme como profesional"

**NO mostrar el toggle** a usuarios sin `service_providers`. El CTA es un link, no un toggle.

#### 4.5. Nuevo componente: `src/components/BecomeProviderCTA.tsx`

```tsx
// Card compacta, no intrusiva
// Condicion: solo se muestra si !isProvider
// Link a /registro-veterinario
// Texto: "Eres veterinario o profesional? Registra tu perfil y aparece en el directorio"
// Boton: "Registrarme" (variant outline, teal)
```

### Fase 3: Guards de ruta (prioridad media)

Proteger rutas profesionales cuando el rol activo es `owner` y viceversa:

#### 4.6. Nuevo componente: `src/components/RoleGuard.tsx`

```tsx
interface RoleGuardProps {
  requiredRole: ActiveRole;
  children: ReactNode;
  fallback?: string; // ruta a redirigir
}

// Si el rol activo no coincide:
// - Si requiredRole === "provider" y !isProvider → redirect a /home
// - Si requiredRole === "provider" y isProvider pero role === "owner" → cambiar rol y continuar
// - Si requiredRole === "owner" y role === "provider" → cambiar rol y continuar
```

Usar en `App.tsx`:

```tsx
<Route path="/provider/dashboard" element={
  <ProtectedRoute>
    <RoleGuard requiredRole="provider">
      <AppLayout><ProviderDashboard /></AppLayout>
    </RoleGuard>
  </ProtectedRoute>
} />
```

**Importante**: el guard NO bloquea — si el usuario navega a `/provider/dashboard` estando en modo dueno, **auto-cambia al modo profesional** y muestra la pagina. Solo bloquea si `!isProvider`.

### Fase 4: Feedback visual de contexto (prioridad baja)

Para que el usuario siempre sepa en que modo esta:

1. **Borde de color en AppLayout** — linea fina en el top: `purple-500` para dueno, `teal-500` para profesional.
2. **Badge en el avatar del sidebar footer** — ring del color del rol activo.
3. **Toast al cambiar** — "Cambiaste a modo profesional" / "Cambiaste a modo dueno" (usar sonner).

---

## 5. Casos edge

### 5.1. Usuario crea perfil profesional por primera vez

1. Usuario (solo dueno) va a `/registro-veterinario` o click en CTA "Registrarme como profesional"
2. Completa el `VetOnboardingWizard`
3. Se crea registro en `service_providers`
4. `useActiveRole` detecta `isProvider === true` (react-query refetch)
5. Toggle aparece en header
6. Auto-switch a modo profesional + redirect a `/provider/dashboard`
7. Toast: "Tu perfil profesional fue creado. Completa tu perfil para aparecer en el directorio."

### 5.2. Usuario elimina su perfil profesional

1. Admin o usuario elimina registro de `service_providers`
2. `useActiveRole` detecta `isProvider === false`
3. Guard fuerza `role = "owner"` (ya existe en linea 52-56)
4. Si estaba en ruta `/provider/*`, redirect a `/home`
5. Toggle desaparece del header

### 5.3. Deep link a ruta profesional sin ser profesional

Ejemplo: alguien comparte `pawfriend.cl/provider/dashboard`.

1. `ProtectedRoute` verifica auth — si no logueado, redirect a `/auth`
2. `RoleGuard` verifica `isProvider` — si `false`, redirect a `/home` con toast "No tienes un perfil profesional"
3. Si `isProvider === true` pero `role === "owner"`, auto-switch a profesional

### 5.4. Mobile: primer uso del toggle

El toggle no existe en mobile actualmente. Al hacerlo visible:

1. Ubicarlo en el header, visible en todas las pantallas
2. Al tocar, la BottomTabBar cambia sus 5 tabs inmediatamente (animacion fade 150ms)
3. Se navega a la pagina principal del nuevo rol

### 5.5. SSR / Hidratacion (no aplica)

La app es SPA pura con Vite, no hay SSR. No hay riesgo de mismatch de hidratacion con localStorage.

---

## 6. Archivos a crear / modificar

| Archivo | Accion | Fase |
|---|---|---|
| `src/hooks/useActiveRole.tsx` | Modificar — sin cambios de API, la redireccion va en los consumers | 1 |
| `src/components/Header.tsx` | Modificar — toggle visible en mobile, redirect al cambiar, mejor UI | 1 |
| `src/components/BottomTabBar.tsx` | Modificar — dos sets de tabs segun rol | 1 |
| `src/components/AppSidebar.tsx` | Modificar — secciones condicionales por rol | 1 |
| `src/components/BecomeProviderCTA.tsx` | Crear — CTA para no-profesionales | 2 |
| `src/components/RoleGuard.tsx` | Crear — guard de rutas por rol | 3 |
| `src/App.tsx` | Modificar — envolver rutas `/provider/*` con `RoleGuard` | 3 |
| `src/pages/Profile.tsx` | Modificar — redirect a `/provider/profile-edit` si rol es profesional | 1 |

---

## 7. Lo que NO cambia

- **`useActiveRole.tsx`** mantiene su API publica (`role`, `isProvider`, `toggle`, `setRole`). No se agrega `navigate` al provider.
- **Tabla `profiles`** no necesita cambios — el rol se infiere de `service_providers`.
- **Tabla `service_providers`** no necesita cambios — ya tiene toda la data necesaria.
- **Rutas en `App.tsx`** no cambian (no se agregan ni eliminan rutas). Solo se envuelven con `RoleGuard`.
- **ProviderDashboard y ProviderProfileEdit** no cambian — ya son las paginas correctas para modo profesional.
- **Edge functions** no se tocan.
- **Migraciones SQL** no se necesitan.

---

## 8. Criterios de aceptacion

- [ ] Toggle visible en mobile y desktop
- [ ] Al cambiar a profesional, navega a `/provider/dashboard` y la BottomTabBar muestra tabs profesionales
- [ ] Al cambiar a dueno, navega a `/home` y la BottomTabBar muestra tabs de dueno
- [ ] Sidebar cambia sus secciones segun el rol activo
- [ ] Usuario sin `service_providers` NO ve el toggle
- [ ] Usuario sin `service_providers` ve CTA "Registrarme como profesional" en perfil
- [ ] Navegar a `/provider/*` sin ser profesional redirige a `/home`
- [ ] Navegar a `/provider/*` siendo profesional en modo dueno auto-cambia al modo profesional
- [ ] El rol persiste al recargar la pagina (localStorage)
- [ ] Toast de confirmacion al cambiar de rol
- [ ] El color del header/toggle indica claramente el rol activo

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigacion |
|---|---|
| BottomTabBar con tabs diferentes puede confundir al usuario | Animacion de transicion + toast explicativo |
| Query duplicada a `service_providers` (useActiveRole + AppSidebar) | AppSidebar ya la hace — migrar AppSidebar a usar `useActiveRole().isProvider` en vez de query propia |
| Toggle accidental cambia toda la navegacion | Agregar confirmacion en mobile (dialog "Cambiar a modo profesional?") si el usuario lo toca por primera vez |
| Performance: re-render de Sidebar + BottomTabBar al cambiar rol | Ambos son componentes livianos, no hay riesgo real |
| Usuario en medio de un flujo (ej: editando mascota) cambia de rol | Solo permitir toggle desde paginas "raiz" (home, dashboard, profile) — o aceptar el redirect y confiar en que el draft se guarda |

---

## 10. Orden de ejecucion recomendado

1. **Header toggle** — hacerlo visible en mobile + agregar redirect + mejorar UI visual (30 min)
2. **BottomTabBar** — tabs condicionales por rol (20 min)
3. **AppSidebar** — secciones condicionales + eliminar query duplicada (20 min)
4. **Profile redirect** — si modo profesional, redirect a profile-edit (5 min)
5. **RoleGuard** — proteger rutas `/provider/*` (15 min)
6. **BecomeProviderCTA** — card para no-profesionales (15 min)
7. **Testing manual** — flujo completo en ambos roles, mobile y desktop
8. **Build + deploy** — `npm run build`, verificar en docs/
