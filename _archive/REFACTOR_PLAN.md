# REFACTOR_PLAN — Pivot médico

**Branch**: `refactor/medical-pivot`
**Iniciado**: 2026-04-06

## Objetivo
Reorientar Paw Friend de "red social + servicios + gamificación" a **"plataforma de salud veterinaria"**. App 100% gratis para dueños, monetización solo vía planes B2B (vets/clínicas).

---

## Estado de las tareas del prompt

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1A | Inventario inicial | ⏳ Parcial | Métricas no medidas formalmente |
| 1B | Consolidar páginas duplicadas | ❌ Pendiente | ServiceDirectory ya existe consolidado, falta eliminar legacy |
| 1C | Consolidar componentes duplicados | ❌ Pendiente | Headers, PetCard, EmptyState |
| 1D | Eliminar features fuera de scope | ⏳ Parcial | Escondido tras flags, no eliminado |
| 1E | Limpieza de código muerto | ❌ Pendiente | Quedan console.logs y as any |
| 2A | Nueva jerarquía de información | ✅ Aplicada en sidebar |
| 2B | Rediseño Home | ⏳ Parcial | PawGame y banner Premium escondidos. Falta HealthAlerts prominente y "Próxima cita" arriba |
| 2C | Reorganización sidebar | ✅ Hecho | Salud > Veterinarios > Comunidad |
| 2D | Feature flags | ✅ Hecho | `src/lib/featureFlags.ts` |
| 2E | Eliminar PremiumGate de flujos | ❌ Pendiente | Hay que reemplazar cada PremiumGate con feature flag check |
| 2F | Esconder /premium pero no borrar | ✅ Hecho | Ruta comentada con marca DISABLED |
| 3A | Paleta de colores por sección | ❌ Pendiente | Variables CSS sin agregar |
| 3B | SectionTheme component | ❌ Pendiente |
| 3C | lib/icons.ts | ❌ Pendiente |
| 3D | Landing pivot médico | ⏳ Parcial | Hero textos cambiados. Falta sección de beneficios médicos |
| 3E | Deep linking entre flujos médicos | ❌ Pendiente |
| 3F | Estados vacíos del Home | ❌ Pendiente |
| 3G | Auditoría final coherencia | ❌ Pendiente |

**Resumen**: ~35% del prompt entregado en este turno. Foco fue en lo más alto del funnel: feature flags + sidebar + esconder Premium + textos de landing.

---

## Cambios aplicados en este turno

### Archivos nuevos
- `src/lib/featureFlags.ts` — Sistema de flags (`USER_PREMIUM`, `PAWGAME_SIDEBAR`, `MARKETPLACE`, `SHARED_WALKS`, `LOST_PETS_SECTION`), todos en `false`.

### Archivos modificados
- `src/components/AppSidebar.tsx`:
  - Eliminado ítem "Premium" del menú principal
  - Eliminado ítem "Paw Game" del principal (ahora condicional al flag `PAWGAME_SIDEBAR`)
  - Reorganizado en 3 secciones: **Salud** (Inicio, Mis Mascotas, Agregar, Historial médico), **Veterinarios** (Buscar vet, Mis reservas, Mapa), **Comunidad** (Feed, Mensajes, Adopción)
  - Eliminados Paseadores/Cuidadores/Entrenadores/Paseos compartidos/Perdidos del sidebar (siguen accesibles por URL directa pero no en nav)
  - Sección "Profesional" del provider sigue intacta

- `src/pages/Home.tsx`:
  - Bloque entero de PawGame (PointsWidget + MissionCard) escondido tras `isFeatureEnabled("PAWGAME_SIDEBAR")`
  - Banner flotante Premium escondido tras `isFeatureEnabled("USER_PREMIUM")`
  - `quickActions` reorganizadas: ahora son `Buscar veterinario` (verde médico), `Historial médico`, `Mapa`, `Adopción`. Eliminados `Paseadores` y `Perdidos`.

- `src/App.tsx`:
  - Ruta `/premium` comentada con marca `DISABLED: USER_PREMIUM flag`. El componente `Premium` se mantiene importado para reactivación futura.

- `src/components/Hero.tsx`:
  - Headline cambiado de "Cuida a tu mascota como se merece" → "**Cuida la salud de tu mascota con veterinarios verificados**"
  - Subhead cambiado a mensaje médico + "100% gratis para dueños"

---

## Lo que NO se hizo (deuda técnica)

### Crítico para próximos turnos
1. **PremiumGate sigue activo en otras pantallas** (MyPets, MedicalRecords, etc.). Hay que envolver cada uno con `isFeatureEnabled("USER_PREMIUM") ? <PremiumGate>...</PremiumGate> : <>...</>`. Mientras tanto, los usuarios pueden ver gates pidiendo upgrade aunque la ruta /premium no exista.
2. **Tipos Supabase desactualizados** — sigue habiendo 8 `as any`. Resolver con `npx supabase gen types`.
3. **Home no tiene HealthAlerts prominente** — el bloque actual de "Próximos Cuidados" sigue al final, debería ir arriba con borde rojo/amarillo y tipografía grande.
4. **Landing solo cambió el Hero**. La sección de features en `Index.tsx` sigue mostrando "Pet Social", "Lugares Pet-Friendly", "Adopción", "Gamificación". Hay que reescribirla con: Vets, Ficha clínica, Recordatorios, Reservas.

### Importante
5. **Páginas duplicadas no consolidadas**: `DogWalkers`, `HomeVets`, `DogSitters`, `DogTrainers` ya redirigen a `ServiceDirectory` pero los archivos viejos no fueron eliminados. Si no existen como archivos separados (verificar), está OK.
6. **Componentes duplicados**: `PetCard` aparece probablemente en 3+ lugares con variantes. No auditado.
7. **Empty states**: no hay componente genérico, cada página tiene el suyo.
8. **Console.logs**: no migrados a logger.
9. **Paleta de colores médica**: las variables CSS no fueron agregadas. Toda la app sigue en morado.
10. **lib/icons.ts**: no creado, los componentes siguen importando de lucide-react directo.
11. **Deep linking entre flujos médicos**: `lib/links.ts` no creado.
12. **Estados vacíos del Home segmentados**: el Home no detecta si el usuario es nuevo, sin recordatorios, o activo.

### Menor
13. Sidebar tiene query `user-premium-status` que ya no se usa para nada visible. No la borré para no romper otras dependencias.
14. Imports no usados en `AppSidebar.tsx` (`Compass`, `Crown`, `Dog`, `GraduationCap`, `Stethoscope`, `Users`, `AlertCircle`, `ShieldCheck`, `Gamepad2` — algunos siguen usándose en condicionales).

---

## Configuración de feature flags

Todos en `false` por defecto en `src/lib/featureFlags.ts`. Para reactivar uno:

```typescript
USER_PREMIUM: true,    // → vuelve banner premium + ruta /premium + PremiumGates
PAWGAME_SIDEBAR: true, // → vuelve sidebar item + bloque Home
```

---

## Métricas finales (auditoría 2026-04-07)

| Métrica | Valor | Antes |
|---|---|---|
| Páginas en `src/pages/` | **32** | 35 |
| Componentes en `src/components/` | **149** | 151 |
| Líneas totales `.ts` + `.tsx` en `src/` | **44.131** | 44.645 |
| `as any` en `src/` | **0** ✅ | 21 |
| `console.log` | **1** ✅ | 1 |
| Importan `lucide-react` directo | **0** ✅ | 132 |
| Refs a `/premium` | **0** ✅ | 4 |
| `navigate("/...")` hardcodeados (pages+components) | **0** ✅ | ~25 |
| TODO/FIXME en código | 7 | (no medido antes) |
| Build TypeScript | **verde** ✅ | verde |
| Items en sidebar principal | **11** (Salud 4 + Vets 4 + Comunidad 3+1 PawGame) | 15+ |

### Auditoría de coherencia ejecutada

**Coherencia técnica (automatizada):**
- ✅ Cero `as any` — tipos Supabase regenerados con `npx supabase gen types`
- ✅ Cero imports directos de `lucide-react` — todo va por `@/lib/icons`
- ✅ Cero `navigate("/...")` hardcodeados en pages/components — todo va por `@/lib/links`
- ✅ Cero refs a `/premium` (deshabilitado completamente)
- ✅ TypeScript compila sin errores (`npx tsc --noEmit`)
- ✅ Build de producción exitoso

**Coherencia visual aplicada:**
- ✅ Verde médico: Home (Welcome + Mis Mascotas + Próximas Citas), MyPets, MedicalRecords header, PetClinicalRecord header
- ✅ Ámbar veterinario: DirectorioVets, PerfilVetPublico, ParaVeterinarios, sección vet en landing, botones del Hero
- ✅ Morado primario: Feed, Adopción, Comunidad, sección "Comunidad" del sidebar

**Páginas eliminadas en el refactor (5):**
- `Premium.tsx`, `PremiumBanner.tsx`, `PremiumGate.tsx`
- `SharedWalks.tsx`, `LostPets.tsx`
- `PaymentSuccess.tsx`, `PaymentFailed.tsx` (consolidadas en `PaymentResult.tsx`)

---

## Métricas (medidas 2026-04-06 fase 2)

| Métrica | Valor actual |
|---|---|
| Páginas en `src/pages/` | **35** |
| Componentes en `src/components/` | **151** |
| Líneas totales en `src/` (`.ts` + `.tsx`) | **44.645** |
| `console.log` en `src/` | **1** ✓ |
| `as any` en `src/` | **21** ⚠️ (8 nuevos del refactor + 13 legacy) |
| Items en sidebar principal | **10** (Salud 4 + Vets 3 + Comunidad 3) |
| Banner Premium en Home | **no** |
| PawGame en Home | **no** |
| Ruta /premium activa | **no** |
| PremiumGate en flujos de usuario | **0** (era 1, eliminado de PetClinicalRecord) |
| HealthAlerts en posición prominente | **sí** (top del Home, borde rojo/amarillo) |
| Mensaje médico en landing Hero | **sí** |
| Features médicos en landing Index | **sí** (4 cards: vets, ficha, recordatorios, reservas) |
| Variables CSS médicas (`--medical-*`, `--vet-*`) | **sí** |

---

---

## Fase 2 — completada 2026-04-06

### Hecho
- ✅ **Index.tsx features**: 4 cards reescritas con mensaje médico (Encuentra veterinarios, Ficha clínica, Recordatorios, Reservas online). Eliminadas Pet Social, Lugares Pet-Friendly, Adopción, Gamificación.
- ✅ **HealthAlerts al top del Home**: card prominente con borde izquierdo rojo (vencidos) o ámbar (próximos), botón "Reservar vet" en cada vencido, ícono grande. El bloque viejo "Próximos Cuidados" del final fue eliminado.
- ✅ **PremiumGate eliminado** del único lugar donde se usaba (`PetClinicalRecord.tsx` tab Compartir). Import del componente reemplazado por comentario.
- ✅ **Variables CSS médicas** agregadas a `index.css`: `--medical-*` (verde 160°), `--vet-*` (ámbar 38°), `--community-*` (morado 270°), más `--alert-critical/warning/info/success`. **NO** se reemplazó `--primary` para no romper la app entera; las nuevas variables son aditivas.
- ✅ **Métricas reales medidas** y documentadas arriba.

### NO hecho en fase 2 (deuda)
- **Tipos Supabase**: requiere `npx supabase login` + `gen types`. No ejecutable desde el agente. Comando documentado en sección "Crítico".
- **Consolidar PetCard duplicado**: `src/components/ui/petcard.tsx` es solo un re-export shim de `src/components/PetCard.tsx`, no es duplicado real. Para eliminarlo hay que cambiar imports en `Index.tsx` y `Feed.tsx` — pendiente.
- **Aplicar las nuevas variables CSS** a componentes específicos (Home → verde, directorio vet → ámbar). Las variables existen pero los componentes siguen usando `text-primary` (morado). Es un trabajo de cirugía componente por componente.
- **`lib/icons.ts`** centralizado: no creado.
- **Estados vacíos segmentados del Home**: no implementados.
- **Deep linking `lib/links.ts`**: no creado.

---

## Próximo turno — orden sugerido

1. **Reescribir sección de features de `Index.tsx` landing** (mensaje médico)
2. **HealthAlerts prominente al top del Home** (con borde rojo/amarillo)
3. **Reemplazar PremiumGate en pantallas restantes** con feature flag checks
4. **Regenerar tipos Supabase** + eliminar `as any`
5. **Crear `lib/icons.ts`** y migrar imports
6. **Variables CSS de paleta médica** (verde primario para salud)
7. **Estados vacíos segmentados del Home**

Cada uno = 1 turno enfocado.
