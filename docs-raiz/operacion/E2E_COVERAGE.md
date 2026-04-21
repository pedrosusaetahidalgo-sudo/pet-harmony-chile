# E2E Coverage — smoke tests por rol

> **Épica I.5** (auditoría top-tier 2026-04-20). Mapa del estado actual
> de la suite Playwright + gaps para el lanzamiento.

## Suite actual (15 specs)

Corre con `npm run test:e2e` (Desktop Chrome + Mobile Safari iPhone 13)
o `npm run test:e2e:full` (todos los browsers).

### Cobertura por rol

| Rol | Spec | Qué valida |
|---|---|---|
| **Anon / público** | `smoke-public.spec.ts` | Rutas sin auth (landing, directorio, perfiles públicos, legales) cargan sin crash |
| **Anon → redirect** | `smoke-redirects.spec.ts` | `/settings → /profile`, `/calendar → /mis-reservas`, `/pet/:id/clinical → /ficha/:id`, etc. |
| **Anon** | `smoke-navigation.spec.ts` | Navegación entre rutas públicas |
| **Anon** | `mobile-layout.spec.ts` | Safe area, bottom tab, viewport mobile |
| **Owner** | `owner-clinical-lifecycle.spec.ts` | Flujo completo: signup → add pet → ficha → PDF → compartir |
| **Owner** | `add-pet.spec.ts` | Validación add pet form + fotos |
| **Vet** | `vet-daily-workflow.spec.ts` | Login vet → dashboard → ver paciente → nota clínica |
| **Todos auth** | `smoke-protected.spec.ts` | 30+ rutas protegidas redirect a /auth sin sesión |
| **Anon** | `reorganization-v3.spec.ts` | Smoke del reorden UX v3 (BottomTabBar, /calendario tabs) |
| **Anon** | `pitch-applications.spec.ts` | `/aplicar?tipo=*` submit y validación |
| **Anon** | `payment-callbacks.spec.ts` | `/paw-member/success`, `/paw-member/cancel`, `/provider/upgrade/success`, `/provider/upgrade/cancel` |
| **Anon** | `booking-flow.spec.ts` | Flujo de reserva 3-step |
| (screenshots) | `landing-screenshots.spec.ts` | Snapshots visuales de landing |
| (screenshots) | `decks-screenshots.spec.ts` | Snapshots de los pitch decks |

### Cobertura por rol (matriz)

| Rol | Smoke (carga) | Golden path | Regresión específica |
|---|---|---|---|
| Anon | ✅ | ✅ | ✅ |
| Owner | ✅ | ✅ (clinical lifecycle) | ✅ (add-pet) |
| Vet | ✅ | ✅ (daily workflow) | ⚠️ sin spec específico de upgrade B2B |
| Shelter | ❌ ninguno | ❌ | ❌ |
| Admin | ❌ ninguno | ❌ | ❌ |

## Gaps identificados

### P0 — antes del lanzamiento

- ❌ **`shelter-flow.spec.ts`** — faltaría cubrir:
  - Registro vía `BecomeShelterDialog`
  - Creación de mascota como shelter
  - Bulk import CSV
  - Transferencia a adoptante
  - Perfil público `/refugios/:slug`
- ❌ **`admin-access.spec.ts`** — validar que user no-admin a `/admin`
  devuelve 403; que admin entra OK.
- ❌ **`onboarding-gate.spec.ts`** — regresión épica B.1:
  - Owner sin `onboarding_completed_at` → redirige a `/onboarding-mascota`
  - Owner completado → no redirige
  - Vet/shelter no disparan el gate
  - Rutas bypass (`/paw-member/success`, `/post-adoption/*`) no gatean
- ❌ **`dark-mode.spec.ts`** — validar toggle + persistencia
  `localStorage pf_theme`.

### P1 — post-lanzamiento

- `vet-upgrade-flow.spec.ts` — Flow sandbox no es trivial de mockear.
  Mejor mock de `flow-create-subscription` response.
- `accept-clinic-seat.spec.ts` — invitación vet a clínica.
- `paw-member-checkout.spec.ts` — checkout Paw Member B2C.
- `error-boundary.spec.ts` — ruta que crashea → `RouteScopedErrorBoundary`
  muestra fallback + navegar la recupera sin reload.

## Smoke manual pre-lanzamiento

Ver `_pending/auditoria-e2e/06-SMOKE_TEST_LAUNCH.md` — checklist de
~2-3h que cubre los casos E2E que no están automatizados.

## Ejecución

```bash
# Solo smoke (más rápido)
npm run smoke

# Suite completa (Desktop Chrome + Mobile Safari)
npm run test:e2e

# Con UI interactiva para debug
npm run test:e2e:ui

# Actualizar snapshots visuales (usar con cuidado)
npm run test:e2e:update
```

Los tests no deberían depender de data real. Si falla alguno por
timeout o flakiness, revisar `fixtures/` para setup de mocks.

## Criterio de go/no-go para lanzamiento

- Todos los specs actuales ✅ en CI antes de merge a main.
- Al menos uno de los gaps **P0** completado:
  - Mínimo recomendado: `onboarding-gate.spec.ts` (protege épica B.1
    contra regresiones).
- Smoke manual del `06-SMOKE_TEST_LAUNCH.md` completado con <3 ❌
  que no sean blockers.
