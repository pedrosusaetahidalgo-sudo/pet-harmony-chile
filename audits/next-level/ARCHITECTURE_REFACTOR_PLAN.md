# ARCHITECTURE_REFACTOR_PLAN.md — Plan de Refactor de Arquitectura — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Estado general

El proyecto tiene una arquitectura React Query bien establecida en la mayoria de los modulos. Los problemas restantes estan concentrados en paginas antiguas que no fueron migradas. La estrategia es migrar incrementalmente — no hay necesidad de refactors grandes.

---

## Resumen de estado por area

| Area | Estado | Deuda restante |
|---|---|---|
| React Query — hooks en 60+ paginas | Bien | Home.tsx (raw useState) y Header.tsx (raw fetch) |
| Queries paralelas | Bien (useFollows) | MyPets backfill, MyBookings waterfall |
| Column selection | Parcial | Home.tsx mejorado — useServiceProviders sigue con select * |
| Cache (staleTime) | Parcial | useServiceProviders OK — falta useCurrentUserProfile |
| Bundle splitting | Bien — Recharts en chunk separado | — |
| Tipado Supabase | Parcial | supabase as any en 4 archivos |

---

## Items SOLUCIONADOS — referencia

| Item | Descripcion | Sesion |
|---|---|---|
| Promise.all en useFollows | Requests de follows en paralelo | 2026-04-14 |
| select columnas en Home.tsx | Reduccion de trafico en queries principales | 2026-04-14 |
| Recharts en manualChunks | Chunk independiente 432kB/114kB gzip | 2026-04-14 |
| staleTime en useServiceProviders | Cache 5min para lista de proveedores | 2026-04-14 |

---

## Items PENDIENTES — ordenados por impacto

### Etapa 1 — Quick wins (1-2 horas cada uno)

#### 1.1 Promise.all en MyPets backfill

**Archivo**: `src/pages/MyPets.tsx`
**Problema**: El backfill de `paw_card_id` usa un loop for-of secuencial que genera N requests uno tras otro.

```typescript
// ACTUAL — secuencial
for (const pet of petsWithoutCards) {
  await supabase.from('paw_cards').insert({ pet_id: pet.id })
}

// RECOMENDADO — paralelo
await Promise.all(
  petsWithoutCards.map(pet =>
    supabase.from('paw_cards').insert({ pet_id: pet.id })
  )
)
```

**Impacto**: Reduccion de latencia proporcional al numero de mascotas sin Paw Card.

#### 1.2 Promise.all en MyBookings queryFn

**Archivo**: `src/pages/MyBookings.tsx`
**Problema**: Dentro del queryFn hay un waterfall: primero busca todos los providers de las reservas, luego busca los perfiles de esos providers. Dos rondas de red secuenciales.

```typescript
// RECOMENDADO — ambas queries en paralelo cuando sea posible
const [bookingsResult, providersResult] = await Promise.all([
  supabase.from('bookings').select('*, provider_id').eq('user_id', userId),
  supabase.from('service_providers').select('id, name, avatar_url')
])
```

**Impacto**: Reduccion de ~50% en tiempo de carga de la pagina de reservas.

#### 1.3 Columnas especificas en useServiceProviders

**Archivo**: `src/hooks/useServiceProviders.ts`
**Problema**: La query hace `select *` trayendo todos los campos del proveedor.

**Accion**: Identificar los campos realmente usados en el componente consumidor y especificarlos en el select.

**Impacto**: Reduccion de payload en listados del directorio.

---

### Etapa 2 — useCurrentUserProfile hook (2-3 horas)

**Problema**: El perfil del usuario autenticado se fetchea de forma independiente en al menos 4 lugares:
1. `Header.tsx` — raw fetch sin cache
2. `Home.tsx` — dentro del bloque de useEffect
3. `AppSidebar.tsx` — fetch propio
4. `Profile.tsx` — query propia

Esto genera 4+ requests al mismo endpoint por sesion, y cada cambio de navegacion puede re-fetchear el perfil.

**Solucion**: Crear `src/hooks/useCurrentUserProfile.ts`:

```typescript
export function useCurrentUserProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, is_premium, plan_id')
        .eq('id', user.id)
        .single()
      return data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
```

**Impacto**: De 4+ requests a 1 request cacheado por sesion. Consistencia de datos en toda la app.

**Dependencia**: Header.tsx, Home.tsx, AppSidebar.tsx y Profile.tsx deben migrar a este hook. Hacerlo gradualmente.

---

### Etapa 3 — Home.tsx completo a React Query (4-6 horas)

**Archivo**: `src/pages/Home.tsx` (~785 lineas)
**Problema**: La pagina mas visitada del producto usa raw useState + useEffect para 5+ queries secuenciales. Sin cache, sin staleTime, sin loading states propios.

**Estado de las queries actuales en Home.tsx**:

| Query | Estado | Problema |
|---|---|---|
| Perfil de usuario | Sin React Query | Duplicado con Header, AppSidebar |
| Mascotas del usuario | Sin React Query | Trigger para queries siguientes |
| Ultimo peso de cada mascota | Sin React Query | Loop secuencial por mascota |
| Proximos recordatorios | Sin React Query | Sin cache |
| Proximas citas (appointments) | Sin React Query | Sin filtro user_id explicito — depende solo de RLS |
| lastVetVisit | Sin React Query | NO conectado al UI (P1-4) |

**Plan de migracion**:

```typescript
// 1. Extraer cada query a su propio hook
const { data: profile } = useCurrentUserProfile()
const { data: pets } = useUserPets()
const { data: reminders } = useUpcomingReminders(3)
const { data: appointments } = useUpcomingAppointments()

// 2. Eliminar el bloque de useState/useEffect en Home.tsx
// 3. Conectar lastVetVisit al componente HomeStatCard
```

**Impacto**: Home.tsx pasa de ~785 lineas a ~400 lineas. Carga mas rapida por cache React Query. Loading states independientes por seccion.

**Nota importante sobre appointments**: Antes de migrar, verificar la politica RLS en la tabla `appointments`. Si `auth.uid()` filtra correctamente, agregar `.eq('user_id', user.id)` es redundante pero no danino. Si la politica es permisiva, el filtro explicito es obligatorio por seguridad.

---

### Etapa 4 — MyBookings consolidacion (2-3 horas)

**Archivo**: `src/pages/MyBookings.tsx`
**Problema adicional al waterfall**: La logica de negocio (calcular estado de reserva, formatear fechas, filtrar por tipo) esta mezclada con el queryFn.

**Recomendacion**:
1. Extraer un hook `useMyBookings(filter?)` con el queryFn limpio
2. Usar join de Supabase en lugar de dos queries separadas: `bookings.select('*, service_providers(id, name, avatar_url)')`
3. Mover logica de formato a `src/lib/format.ts`

---

## Paginas con mas de 700 lineas — no requieren refactor urgente

| Pagina | Lineas | Cuando tocarla |
|---|---|---|
| `AddPet.tsx` | ~1100 | Al agregar nuevos campos — extraer secciones en steps |
| `RegistroPartner.tsx` | ~850 | Al modificar flujo de registro |
| `ProDashboard.tsx` | ~820 | Al agregar exportacion real (P2 del backlog) |
| `Home.tsx` | ~785 | **Etapa 3 — prioritario** |

---

## Prioridad recomendada de ejecucion

```
Etapa 1a (30 min): Promise.all en MyPets backfill
Etapa 1b (30 min): Promise.all en MyBookings waterfall
Etapa 1c (30 min): select columnas en useServiceProviders
Etapa 2  (2-3h):  Crear useCurrentUserProfile + migrar 4 consumidores
Etapa 3  (4-6h):  Migrar Home.tsx completo a React Query
Etapa 4  (2-3h):  Consolidar MyBookings con join
```

Las etapas 1a-1c son independent y pueden hacerse en cualquier orden. La Etapa 2 debe completarse antes de la Etapa 3 (Home.tsx la consumira).

---

## Deuda de tipos — supabase as any

Los 4 archivos con `supabase as any` indican que los tipos de Supabase no han sido regenerados despues de las migraciones mas recientes.

**Comando para regenerar**:
```bash
npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
```

**Archivos afectados**:
- `src/pages/ProviderPatients.tsx`
- `src/pages/QRLanding.tsx`
- `src/pages/Reportes.tsx`
- `src/pages/ServiceDirectory.tsx` (o `Servicios.tsx`)

Despues de regenerar los tipos, eliminar los casts `as any` y corregir los errores de tipos que emerjan.
