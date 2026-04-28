# Legacy Cleanup Audit — 2026-04-24

> **Cuándo ejecutar**: cuando los flags del Refactor Maestro lleven **2-4 semanas en producción
> activa sin regresiones** + métricas PostHog confirmen >70% de usuarios usando la versión nueva.
>
> **Por qué no ahora**: regla de oro §1.4 "esconder, no borrar". Si aparece un bug post-deploy
> queremos poder hacer rollback bajando el flag a `false`, lo cual requiere código legacy intacto.

---

## Componentes legacy candidatos a eliminar

### 1. `HomeLegacyDashboard` (Home.tsx legacy)

- **Archivo**: [src/pages/Home.tsx](../src/pages/Home.tsx) — función `HomeLegacyDashboard` (~750 líneas)
- **Reemplazo**: `HomePetFocusV2`
- **Flag relacionado**: `HOME_PET_FOCUS`
- **Cómo limpiar**:
  - Eliminar la función `HomeLegacyDashboard` completa
  - Simplificar el componente `Home` a solo `return <HomePetFocusV2 />`
  - Eliminar imports que solo usaba el legacy (PawPoints widgets, FeedbackWidget, NextBookingCard, etc.)
- **Impacto estimado bundle**: -50 a -80 kB gzip

### 2. `AddPetLegacy` en AddPet.tsx

- **Archivo**: [src/pages/AddPet.tsx](../src/pages/AddPet.tsx)
- **Reemplazo**: `OnboardingQuickFlow`
- **Flag**: `ONBOARDING_V2_MINIMAL`
- **Cómo limpiar**:
  - Eliminar `AddPetLegacy` completa
  - Simplificar `AddPet` a redirect directo a `OnboardingQuickFlow` (cuando no es edit) o componente edit-only

### 3. `RefugiosHogaresLegacy` en RefugiosHogares.tsx

- **Archivo**: [src/pages/RefugiosHogares.tsx](../src/pages/RefugiosHogares.tsx)
- **Reemplazo**: redirect a `/adoption?tab=refugios` en `AdoptionUnifiedView`
- **Flag**: `ADOPTION_UNIFIED_FEED`
- **Cómo limpiar**:
  - Eliminar `RefugiosHogaresLegacy` completa
  - Convertir `RefugiosHogares` en `<Navigate to="/adoption?tab=refugios" replace />` permanente
  - Considerar si la ruta `/refugios-hogares` se mantiene (para SEO) o se redirige a `/adoption`

### 4. Owner Tabs V1 (5 tabs) en BottomTabBar.tsx

- **Archivo**: [src/components/BottomTabBar.tsx](../src/components/BottomTabBar.tsx) líneas 62-106
- **Reemplazo**: `OWNER_TABS_V2` (4 tabs)
- **Flag**: `BOTTOM_TAB_V2`
- **Cómo limpiar**:
  - Eliminar el array `OWNER_TABS_V1`
  - Eliminar la línea `const OWNER_TABS = isFeatureEnabled('BOTTOM_TAB_V2') ? OWNER_TABS_V2 : OWNER_TABS_V1`
  - Renombrar `OWNER_TABS_V2` → `OWNER_TABS`

### 5. Tab "Hogares IA" + "Mis Posts" + "Me Interesa" en Adoption.tsx

- **Archivo**: [src/pages/Adoption.tsx](../src/pages/Adoption.tsx)
- **Reemplazo**: tabs unificados Mascotas/Refugios en `AdoptionUnifiedView`
- **Flag**: `ADOPTION_UNIFIED_FEED`
- **Cómo limpiar**:
  - Eliminar `AdoptionLegacy` (función completa)
  - Simplificar `Adoption` a `return <AdoptionUnifiedView />`
  - Eliminar `AdoptionSheltersList` si no se usa en otro lado (verificar grep)
  - Eliminar `CreateAdoptionPost` si los posts de owner se eliminan o se mueven a otro lugar

### 6. Acciones legacy en `points.ts`

- **Archivo**: [src/lib/points.ts](../src/lib/points.ts) líneas 30-50
- **Flag**: `PAW_POINTS_CANONICAL`
- **Cómo limpiar (DESPUÉS de 6 meses sin queja en logs)**:
  - Eliminar `PointActionLegacy` type union
  - Eliminar valores legacy del `POINT_VALUES` record
  - Mantener `PointActionCanonical` como única fuente
  - Eliminar `DEPRECATED_ACTIONS` set y la lógica del flag
  - Eliminar callsites que llaman acciones legacy (grep en codebase)

### 7. PetClinicalRecord header sin flag

- **Archivo**: [src/pages/PetClinicalRecord/index.tsx](../src/pages/PetClinicalRecord/index.tsx) línea ~331
- **Cambio**: el header tiene un ternario `historiaTabEnabled && viewMode === 'owner' ? "La historia de" : "Ficha clinica de"`
- **Cómo limpiar**: dejar solo el "La historia de" cuando `FICHA_HISTORIA_TAB` esté en true permanentemente.

---

## Sidebar items que pueden colapsarse después

- Si `LABS_BLOOD_DONORS` queda en true sin tracción real (HIDDEN_FEATURES_REVIEW lo decide), eliminar el item.
- Si `LABS_COMMUNITY` no tiene grupos creados después de 6 meses, eliminar el item.

---

## Cómo medir antes de borrar

**Verificar en PostHog que el flag legacy ya no se usa**:

Eventos a chequear (todos prefijo `refactor.fase_0.`):
- `bottom_tab_v2.shown` = % usuarios con BOTTOM_TAB_V2 activo
- `home_pet_focus.viewed` = % usuarios con HOME_PET_FOCUS activo
- `adoption.feed.viewed` = % usuarios con ADOPTION_UNIFIED_FEED activo

**Si todos los eventos muestran >95% de usuarios en la versión nueva durante 14 días seguidos** → seguro borrar el legacy.

**Si <70%** → algo está mal con el deploy o con el flag, NO borrar todavía.

---

## Migraciones SQL relacionadas

Ninguna. Todas las tablas nuevas son aditivas, las viejas siguen existiendo y con uso real.

---

## Comando para ejecutar la limpieza (cuando llegue el momento)

```bash
# 1. Verificar que ningún archivo importa los componentes legacy directamente
grep -rn "HomeLegacyDashboard\|AddPetLegacy\|RefugiosHogaresLegacy\|AdoptionLegacy" src/

# 2. Si solo aparecen en sus propios archivos, proceder con la limpieza
# 3. Eliminar funciones / arrays / lógica del flag
# 4. Tipo-check
npx tsc --noEmit
# 5. Lint
npm run lint
# 6. Tests
npm run test:ci
# 7. Build
npm run build
# 8. Diff de bundle size (antes vs después)
```

---

## Resumen de impacto esperado

| Ítem | Líneas a eliminar | Bundle ahorro estimado |
|---|---|---|
| HomeLegacyDashboard | ~750 | -50 kB gzip |
| AddPetLegacy | ~400 | -25 kB gzip |
| RefugiosHogaresLegacy | ~250 | -15 kB gzip |
| OWNER_TABS_V1 | ~50 | -3 kB gzip |
| AdoptionLegacy | ~350 | -20 kB gzip |
| Acciones legacy points | ~30 | -1 kB gzip |
| **Total estimado** | **~1.830 líneas** | **~114 kB gzip** |

Con esto el bundle inicial de Home pasaría de ~80 kB / 22 kB gzip a ~30 kB / 8 kB gzip.

---

## Decisión

**Hoy 2026-04-24**: NO ejecutar.

**Cuando ejecutar**: revisar este doc el **2026-05-15** (3 semanas) si los flags ya están en
producción y métricas confirman adopción.

Pedro o el agente de turno: marcar este doc como completado moviéndolo a `_archive/` cuando se
ejecute.
