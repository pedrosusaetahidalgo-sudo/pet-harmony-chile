# Bug: Crash en /services/groomers — "Cannot read properties of undefined (reading 'gradient')"

**Fecha**: 2026-04-10  
**Severidad**: Alta — la ruta `/services/groomers` está completamente rota  
**Estado**: Diagnosticado, no corregido

---

## Síntoma

Al navegar a `/services/groomers`, la app muestra pantalla de error:

```
Cannot read properties of undefined (reading 'gradient')
```

---

## Causa raíz

El componente `ProviderProfileCard` ([src/components/ProviderProfileCard.tsx:56-89](src/components/ProviderProfileCard.tsx#L56-L89)) tiene un objeto `providerTypeConfig` con 4 tipos:

```ts
const providerTypeConfig = {
  dog_walker: { ... },
  dogsitter:  { ... },
  veterinarian: { ... },
  trainer:    { ... },
  // ❌ Falta "groomer"
};
```

Cuando `ServiceDirectory` ([src/pages/ServiceDirectory.tsx:806-809](src/pages/ServiceDirectory.tsx#L806-L809)) renderiza la lista de groomers, pasa `providerType="groomer"` al componente:

```tsx
<ProviderProfileCard
  providerType={config.providerType as ProviderType}  // "groomer"
  ...
/>
```

En la línea 99 de `ProviderProfileCard`:

```ts
const config = providerTypeConfig[providerType]; // undefined
```

Y en la línea 124:

```ts
<div className={`bg-gradient-to-r ${config.gradient} h-2`} />  // 💥 crash
```

`config` es `undefined` porque `"groomer"` no existe como key en `providerTypeConfig`.

---

## Archivos involucrados

| Archivo | Línea | Problema |
|---|---|---|
| [ProviderProfileCard.tsx](src/components/ProviderProfileCard.tsx#L56-L89) | 56-89 | `providerTypeConfig` no tiene entrada para `"groomer"` |
| [ProviderProfileCard.tsx](src/components/ProviderProfileCard.tsx#L49) | 49 | Tipo `providerType` no incluye `"groomer"` |
| [ProviderProfileCard.tsx](src/components/ProviderProfileCard.tsx#L99) | 99 | `config` queda `undefined` |
| [ProviderProfileCard.tsx](src/components/ProviderProfileCard.tsx#L101-L107) | 101-107 | `getPrice()` no maneja `groomer` (retorna 0) |
| [ProviderProfileCard.tsx](src/components/ProviderProfileCard.tsx#L109-L115) | 109-115 | `getTotalCount()` no maneja `groomer` (retorna 0) |
| [ServiceDirectory.tsx](src/pages/ServiceDirectory.tsx#L50-L52) | 50-52 | Comentario admite que `"groomer"` no está soportado, se castea con `as` |

---

## Fix requerido

### 1. Agregar `"groomer"` a `providerTypeConfig` en `ProviderProfileCard.tsx`

```ts
groomer: {
  title: "Peluquero",
  priceLabel: "servicio",
  totalLabel: "citas",
  gradient: "from-pink-600 to-rose-500",
  ringColor: "ring-pink-500/20",
  badgeColor: "bg-pink-500/10 text-pink-700"
},
```

### 2. Actualizar el tipo `providerType` en la interfaz `ProviderProfileCardProps`

```ts
providerType: "dog_walker" | "dogsitter" | "veterinarian" | "trainer" | "groomer";
```

### 3. Agregar caso `groomer` en `getPrice()` y `getTotalCount()`

```ts
// getPrice
if (providerType === 'groomer') return provider.base_price_clp;

// getTotalCount
if (providerType === 'groomer') return provider.total_bookings || 0;
```

### 4. Actualizar `ProviderType` en `ServiceDirectory.tsx`

```ts
type ProviderType = "dog_walker" | "dogsitter" | "veterinarian" | "trainer" | "groomer";
```

---

## Componentes secundarios a revisar

- **`MyBookingsHistory`**: no incluye `"groomer"` — las reservas de groomers no se mostrarán en el tab de reservas.
- **`EnhancedBookingDialog`**: no incluye `"groomer"` — el diálogo de reserva podría fallar o no funcionar para groomers.

---

## Notas

- El propio código de `ServiceDirectory.tsx` ya tiene un comentario en línea 50-51 reconociendo el problema:
  > `"groomer" aún no está soportado por esos componentes; se castea aquí para mantener type-safety.`
- El cast `as ProviderType` en la línea 809 silencia TypeScript pero no evita el crash en runtime.
- El campo de precio para groomers es `base_price_clp` (definido en `ServiceDirectory.tsx:179`), distinto al patrón de los otros tipos.
