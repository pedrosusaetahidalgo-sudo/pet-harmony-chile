# TESTING_E2E_MATRIX.md — Matriz de Testing y E2E — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Infraestructura de testing actual

| Herramienta | Configuracion | Estado |
|---|---|---|
| Vitest | jsdom environment | Activo — 7 archivos de test |
| Playwright | 8 proyectos de browser (chromium, firefox, webkit, mobile chrome, mobile safari, edge, etc.) | Activo — 7 specs |
| @testing-library/react | Instalado | INSTALADO PERO NO USADO en ningun test actual |

**Brecha critica**: @testing-library/react esta disponible pero ninguno de los 7 tests lo usa. Los tests unitarios cubren solo utilidades puras (funciones sin componentes React).

---

## Tests unitarios existentes — 7 archivos

| Archivo | Que testea | Cobertura |
|---|---|---|
| `src/lib/plans.test.ts` | Logica de planes B2C y B2B — limites, precios, features | Buena |
| `src/lib/featureFlags.test.ts` | Feature flags y sus valores | Buena |
| `src/lib/gamification.test.ts` | Calculo de puntos, niveles, misiones | Buena |
| `src/lib/format.test.ts` | Formateo de fechas, moneda, distancias | Buena |
| `src/lib/vaccines.test.ts` | Logica de recordatorios de vacunas, vencimientos | Buena |
| `src/lib/distance.test.ts` | Calculo de distancia entre coordenadas | Buena |
| `src/lib/openingHours.test.ts` | Parseo de horarios de atencion | Buena |

**Observacion**: Todos los tests cubren funciones puras de utilidad. Ningun test cubre hooks de React, componentes, o flujos de usuario.

---

## Specs E2E existentes — 7 archivos Playwright

| Archivo | Que testea | Rutas cubiertas |
|---|---|---|
| `smoke-public.spec.ts` | Rutas publicas cargan sin error 500 | 9 rutas publicas |
| `smoke-protected.spec.ts` | Rutas protegidas redirigen a /auth sin login | 23 rutas |
| `smoke-navigation.spec.ts` | Navegacion entre rutas publicas principales | ~5 rutas |
| `add-pet.spec.ts` | Formulario de alta de mascota | /add-pet (con mock de auth) |
| `mobile-layout.spec.ts` | Layout responsive en viewports mobile | Home, Pet List |
| `owner-clinical-lifecycle.spec.ts` | Flujo de ficha clinica del dueno (NUEVO) | /ficha/:petId |
| `vet-daily-workflow.spec.ts` | Flujo diario del veterinario (NUEVO) | /provider/dashboard, /provider/pacientes |

---

## Matriz de cobertura de flujos criticos — 18 flujos

| # | Flujo | Tipo test | Estado | Bloqueante para release |
|---|---|---|---|---|
| 1 | Usuario se registra | E2E | SIN COVERAGE | Si |
| 2 | Usuario inicia sesion | E2E | SIN COVERAGE | Si |
| 3 | Cambio de rol dueno <-> vet | E2E | SIN COVERAGE | Si |
| 4 | Agregar mascota (add-pet) | E2E | PARCIAL (add-pet.spec.ts) | Si |
| 5 | Ver ficha clinica | E2E | PARCIAL (owner-clinical-lifecycle.spec.ts) | Si |
| 6 | Descargar PDF ficha clinica | E2E | SIN COVERAGE | Si — es la joya de la corona |
| 7 | OCR carnet vacunacion | E2E | SIN COVERAGE | No — Labs |
| 8 | Compartir ficha medica (30 dias) | E2E | SIN COVERAGE | Si |
| 9 | Buscar veterinario en directorio | E2E | SIN COVERAGE | Si |
| 10 | Ver perfil publico de vet | E2E | SIN COVERAGE | Si |
| 11 | Iniciar proceso de upgrade Premium | E2E | SIN COVERAGE | Si |
| 12 | Vet crea mascota nueva (NewPatientForm) | E2E | SIN COVERAGE | No |
| 13 | Dueno reclama mascota huerfana (ClaimPetDialog) | E2E | SIN COVERAGE | No |
| 14 | Agregar entrada en ficha clinica | E2E | SIN COVERAGE | Si |
| 15 | Crear recordatorio | E2E | SIN COVERAGE | No |
| 16 | Ver y usar calendario | E2E | SIN COVERAGE | No |
| 17 | Provider ve su dashboard | E2E | PARCIAL (vet-daily-workflow.spec.ts) | No |
| 18 | Admin accede al panel | E2E | SIN COVERAGE | No |

**Flujos sin coverage que bloquean release confiable**: 1, 2, 3, 5, 6, 8, 9, 10, 11, 14

---

## Areas fragiles identificadas — sin tests pero con logica compleja

| Componente/Hook | Complejidad | Riesgo de regresion |
|---|---|---|
| `usePlan` — logica de trial y limites por plan | Alta | Alta — afecta features disponibles para cada usuario |
| `useActiveRole` — persistencia en localStorage + redirect | Media | Alta — afecta toda la navegacion de roles |
| `useAutoClaimByEmail` — deteccion de mascotas huerfanas | Alta | Alta — si falla, duenos no ven sus mascotas |
| `useClaimPetInvitation` — reclamo por token | Alta | Alta — flujo critico para veterinarios |
| `MedicalSummaryButton` — trigger de PDF | Media | Alta — es la joya de la corona |
| `RoleGuard` — bloqueo de rutas por rol | Media | Alta — fallo = usuarios ven contenido incorrecto |
| `flow-webhook` — procesamiento de pagos | Alta | Critica — fallo = usuarios pagan pero no se activa Premium |

---

## Plan de implementacion de tests — 4 fases

### Fase 1 — Tests E2E de auth y navegacion (1 semana)

**Prioridad**: Bloqueante para release confiable.

```typescript
// auth.spec.ts — nuevo
test('usuario puede registrarse con email')
test('usuario puede iniciar sesion')
test('usuario no autenticado es redirigido a /auth')
test('usuario puede cerrar sesion')

// role-switching.spec.ts — nuevo
test('vet puede cambiar a modo dueno')
test('dueno puede cambiar a modo vet si tiene perfil de proveedor')
test('RoleGuard bloquea rutas incorrectas')
```

### Fase 2 — Tests E2E de la joya de la corona (1 semana)

**Prioridad**: Critica — ficha clinica + PDF son el diferenciador del producto.

```typescript
// clinical-record.spec.ts — expandir owner-clinical-lifecycle.spec.ts
test('dueno puede ver la ficha clinica de su mascota')
test('dueno puede agregar entrada en seccion Salud')
test('dueno puede agregar vacuna con fecha y nombre')
test('boton de descarga PDF esta visible para usuarios Premium')
test('PDF se descarga correctamente (response 200 de edge function)')
test('ficha compartida con token es accesible publicamente')
```

### Fase 3 — Tests unitarios de hooks criticos (1 semana)

**Prioridad**: Alta — prevenir regresiones en logica de negocio.

```typescript
// usePlan.test.ts — nuevo
test('usuario free tiene limite de 2 mascotas')
test('usuario premium no tiene limite de mascotas')
test('usuario en trial tiene acceso premium')

// useActiveRole.test.ts — nuevo
test('role persiste en localStorage')
test('role se recupera al recargar')
test('cambio de role hace redirect correcto')

// useAutoClaimByEmail.test.ts — nuevo
test('mascota huerfana con email verificado se auto-reclama')
test('mascota huerfana sin email verificado no se auto-reclama')
```

### Fase 4 — Tests de integracion de pagos (sprint dedicado)

**Prioridad**: Media — requiere ambiente de staging de Flow.cl.

```typescript
// upgrade-flow.spec.ts — nuevo
test('usuario puede iniciar flujo de upgrade')
test('Flow.cl redirige de vuelta a /payment-result')
test('webhook de Flow activa plan Premium (staging)')
test('usuario ve confirmation en /upgrade/success')
```

---

## Estructura de archivos de test recomendada

```
src/
  __tests__/
    hooks/
      usePlan.test.ts          # Logica de planes
      useActiveRole.test.ts    # Gestion de roles
      useAutoClaimByEmail.test.ts
      useClaimPetInvitation.test.ts
    components/
      RoleGuard.test.tsx       # Guard de rutas
      MedicalSummaryButton.test.tsx

e2e/
  auth.spec.ts                 # Registro, login, logout
  role-switching.spec.ts       # Cambio de rol
  clinical-record.spec.ts      # Ficha clinica completa
  pdf-download.spec.ts         # Descarga de PDF
  vet-directory.spec.ts        # Busqueda de vets
  upgrade-flow.spec.ts         # Flujo de pago (staging)
  (archivos existentes se mantienen)
```

---

## Comandos de testing

```bash
# Unit tests
npm run test           # Vitest watch mode
npm run test:ci        # Vitest sin watch (CI)

# E2E
npm run test:e2e       # Playwright todos los browsers
npx playwright test --project=chromium  # Solo chromium
npx playwright test clinical-record     # Solo ese spec
npx playwright test --headed            # Ver el browser
npx playwright show-report              # Ver reporte HTML
```

---

## Flujos release-blocking — criterio de go/no-go

Antes de cualquier release de produccion, los siguientes tests DEBEN pasar:

1. `npx tsc -b` — 0 errores
2. `npm run build` — build exitoso
3. Tests unitarios existentes — todos verdes
4. smoke-public.spec.ts — todas las rutas publicas cargan
5. smoke-protected.spec.ts — todas las rutas protegidas redirigen correctamente

Cuando se implementen los tests de Fase 1 y 2, agregar:

6. auth.spec.ts — registro y login funcionales
7. clinical-record.spec.ts — ficha clinica y PDF funcionales
