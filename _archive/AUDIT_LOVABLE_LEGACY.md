# Auditoria codigo Lovable legacy

> Auditoria sobre los ~176 archivos fuente que vinieron del commit inicial `0f458c2` (2025-12-17), generado por Lovable con una IA mas debil. Foco: mejoras y optimizaciones sin romper lo funcional.
> Generado: 2026-04-11.

## Resumen ejecutivo

Se identificaron **10 categorias de hallazgos** en el codigo heredado de Lovable:

1. **`.single()` residuales en 10 ubicaciones**: riesgo de crashes con resultados inesperados. Fase 1: reemplazar con `.maybeSingle()` (riesgo cero, ~10 min).
2. **Duplicacion de componentes**: `MissionCard.tsx` existe en dos versiones (top-level y `pawgame/`) con logica divergente. El top-level esta muerto (~100 lineas).
3. **Tipado debil masivo**: 168 instancias de `any`, incluidas 4 casts `const sb = supabase as any` en hooks criticos de datos (consultation_templates, vet_clinical_notes, pending_reviews, VetFollowupsCard). Tech debt legitimo pero impacto funcional bajo.
4. **Antipatrones de datos**: `Home.tsx` usa `useEffect` + setState manual para cargar 6 queries en cascada (perfil, mascotas, citas, vacunas, completeness). Deberia usar `useQuery` x 3-4, ganancia: eliminar race conditions + retry/stale-while-revalidate automatico.
5. **Componentes gigantes (>400 lineas)**: 5 candidatos a split (`PawGame.tsx` 950L, `AddPet.tsx` 917L, `ServiceDirectory.tsx` 914L, `EnhancedBookingDialog.tsx` 662L, `ProviderDashboard.tsx` 534L). Impacto: testabilidad y legibilidad, no funcional.
6. **Inline callbacks en JSX**: `AddPet.tsx` y otros tienen `onClick={() => navigate(...)}` que rompen memoizacion potencial. Anti-patron pero bajo impacto hoy.
7. **Ausencia de `loading="lazy"`** en listas con imagenes (directorio vet, maps, feed). No critico pero impacta Core Web Vitals.
8. **A11y basica**: heredada razonablemente bien de shadcn/ui. Revisar `ServiceDirectory` y `PetCard` por icon-only buttons sin `aria-label`.
9. **Copy chileno**: OK. No se detecto voseo argentino ni peninsular en los archivos Lovable.
10. **Dead code historico**: `Checkout`, `HomeVets`, `Places`, `Gamification`, `PaymentFailed/Success` ya fueron borrados en pivots anteriores. No quedan fantasmas.

**Ganancia estimada**:
- Fase 1 (10 min) elimina potencial de crashes silenciosos.
- Fase 2 (1h) limpia dead code y tipos.
- Fase 3 (4-6h) refactor de `Home.tsx` reduce bugs de datos.
- Fase 4 (requiere autorizacion) split de componentes gigantes.

---

## 1. Dead code candidato a eliminar

| Archivo | Por que es candidato | Riesgo de remover | Evidencia |
|---|---|---|---|
| `src/components/MissionCard.tsx` | Duplicado de `src/components/pawgame/MissionCard.tsx` con interfaz distinta (`mission_type` vs `target_action`, `onComplete` vs `onNavigate`). El top-level no se importa en la app real. | **BAJO**: solo `pawgame/MissionCard` esta en uso. | `grep -r "MissionCard" src/` devuelve imports desde `pages/PawGame.tsx`, `hooks/useGamification.tsx`, `pages/Profile.tsx`, todos apuntando al de `pawgame/`. |
| (Historico, ya borrados) | Checkout.tsx, HomeVets.tsx, Places.tsx, Gamification.tsx, PaymentFailed.tsx, PaymentSuccess.tsx | Consolidados en pivots anteriores (pagos -> `/payment-result`, landing vets -> `/para-veterinarios`, gamification -> `/paw-game`). No existen en HEAD. |

**Accion**: eliminar solo `src/components/MissionCard.tsx`. Antes de borrar, verificar con `grep -r "from .*MissionCard\"" src/ | grep -v pawgame` que no hay imports restantes.

---

## 2. Antipatrones de datos (useEffect + supabase -> useQuery)

Cinco archivos principales con desventajas funcionales reales:

### `src/pages/Home.tsx:106-193` (CRITICO)

```ts
useEffect(() => {
  if (user) {
    void loadData();
    checkOnboarding();
  }
}, [user]);

// loadData() hace queries en cascada:
// 1. fetch profile  -> supabase.from("profiles")...maybeSingle()
// 2. fetch pets     -> supabase.from("pets").select()
// 3. compute completeness (loop)
// 4. fetch appointments
// 5. fetch pet_reminders (vacunas)
```

**Impacto**: si el user desmonta rapido (cambio de ruta), el setState se dispara sobre un componente muerto. Sin retry automatico, sin stale-while-revalidate, sin cancelacion limpia.

**Solucion**: 3-4 `useQuery` independientes, o `useQueries` para paralelizar. Ganancia: retry gratis, cache compartida, cancelacion automatica.

### `src/pages/MedicalShare.tsx:65-158`

`useEffect` + setState para cargar token + pet + records + owner en cascada. Ademas linea 115 y 149 usan `.single()` (ver seccion 3).

### `src/pages/AddPet.tsx:99-193` (INCONSISTENCIA)

Carga de mascota en modo edicion con `useEffect` + setState, pero el `handleSubmit` si usa async/await. Inconsistencia interna: una parte sigue el patron viejo y otra el nuevo.

### `src/hooks/useGamification.tsx` y `src/hooks/useReminders` (sospecha)

Usados por `Home`, `Profile` y `PawGame`. Si siguen haciendo fetch con `useEffect`, el problema se amplifica porque son hooks compartidos. Revisar y migrar a `useQuery` en la misma fase que `Home`.

**Resumen**:
- `Home.tsx`: 4 issues criticos (cascada, sin retry, sin cancelacion, estado flotante).
- `MedicalShare.tsx`: 2 issues moderados (`.single()` + cascada).
- `AddPet.tsx`: 1 issue menor (inconsistencia edit vs create).

---

## 3. `.single()` residuales

| Archivo | Linea | Contexto | Riesgo | Propuesta |
|---|---|---|---|---|
| `src/pages/AddPet.tsx` | 335 | `.insert(payload).select("id").single()` (CREATE) | BAJO (insert garantiza 1 fila) | `.maybeSingle()` + throw si null |
| `src/hooks/useConsultationTemplates.ts` | 94 | `.insert(...).select().single()` | BAJO | idem |
| `src/pages/MedicalShare.tsx` | 115 | `.eq("id", tokenData.pet_id).single()` | MEDIO (datos publicos, si schema diverge -> crash publico) | `.maybeSingle()` + pantalla "no encontrado" |
| `src/pages/MedicalShare.tsx` | 149 | `.eq("id", tokenData.owner_id).single()` | BAJO (profile 1:1, pero owner borrado -> null) | `.maybeSingle()` |
| `src/hooks/useVetClinicalNotes.ts` | 122 | `.eq('id', ...).single()` | BAJO (borrado logico posible) | `.maybeSingle()` |
| `src/hooks/useGroomerProfile.tsx` | 114 | `.upsert(...).select().single()` | BAJO | `.maybeSingle()` |
| `src/hooks/useProviderProfile.tsx` | 81 | `.upsert(...).select().single()` | BAJO | `.maybeSingle()` |
| `src/hooks/useReviewInvitations.tsx` | 75 | `.select().single()` | BAJO | `.maybeSingle()` |
| `src/components/AddMedicalRecord.tsx` | 157 | `.insert(...).select().single()` | BAJO | `.maybeSingle()` |
| `src/pages/RegistroVeterinario.tsx` | 145 | `.select().single()` | BAJO (verificar contexto) | `.maybeSingle()` |

**Accion**: reemplazar los 10 con `.maybeSingle()` + null check. Riesgo cero, ganancia defensiva. El caso mas importante es el de `MedicalShare.tsx` porque ese flujo es publico y un crash alli lo ve cualquiera con el link.

---

## 4. Tipado debil (`any` / `as any`)

### Distribucion

- **Total**: ~168 instancias de `any` o `as any` en los archivos Lovable legacy.
- **Por archivo**: `Home.tsx` (1), `Auth.tsx` (4), `MyPets.tsx` (2), `ServiceDirectory.tsx` (11), `PawGame.tsx` (10) y hotspots en hooks de datos.

### Casos mas impactantes

| Archivo | Linea aprox | Patron | Contexto | Impacto |
|---|---|---|---|---|
| `src/hooks/useConsultationTemplates.ts` | 33 | `const sb = supabase as any` | Tabla nueva, tipos no regenerados | MODERADO: pierde type-check en queries |
| `src/hooks/useVetClinicalNotes.ts` | 45 | `const sb = supabase as any` | Idem | MODERADO |
| `src/hooks/usePendingReviews.ts` | 32 | `const sb = supabase as any` (inline) | Idem | MODERADO |
| `src/components/provider/VetFollowupsCard.tsx` | 11 | `const sb = supabase as any` | Idem | MODERADO |
| `src/pages/ServiceDirectory.tsx` | multiples | `Record<string, any>` en filtros y resultados | Configs dinamicos | BAJO |
| `src/pages/MedicalShare.tsx` | 31, 133 | `current_medications: any`, `(r: any) =>` | Medicamentos sin tipar | BAJO (UI sanitize antes de render) |

**Solucion de riesgo cero**:

```bash
npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.gen.ts
```

Luego reemplazar los 4 `const sb = supabase as any` con el cliente tipado real. El resto (`Record<string, any>`, etc.) puede quedar para una segunda pasada.

---

## 5. Duplicacion de codigo

### Componentes duplicados

**`src/components/MissionCard.tsx` vs `src/components/pawgame/MissionCard.tsx`**

| Aspecto | Top-level | `pawgame/` |
|---|---|---|
| Interface | `mission_type: "daily" \| "weekly" \| "special"` + `progress?: number` | `mission_type: string` + `category` + `target_action` + `required_level` |
| Props | `{ mission, onComplete? }` | `{ mission, userLevel, onNavigate, isStory?, currentProgress? }` |
| Iconos | Static (Clock, CheckCircle2) | Dinamico (`getActionIcon` map) |
| Rutas | Ninguna | `getActionPath()` para redirigir |
| Usado en | Nadie real | `pages/PawGame.tsx`, `pages/Profile.tsx` |

Conclusion: el top-level es **codigo muerto**. Solo vive el de `pawgame/`.

### Helpers duplicados (sospecha)

- `src/lib/format.ts` ya centraliza `formatPrice`, `smartCapitalize`, `toTitleCase`, `getGreeting`. Bien.
- Revisar si `src/components/social/ActivityFeed.tsx` o widgets del Home reimplementan `formatDistanceToNow` inline. Si aparecen, centralizar en `lib/format.ts`.

---

## 6. Archivos gigantes candidatos a split

| Archivo | Lineas | Responsabilidades mezcladas | Sugerencia de split |
|---|---|---|---|
| `src/pages/PawGame.tsx` | 950 | Turnos/misiones, render board, modal tienda, dialogs rewards, logica paw points | `PawGame` (orquestador) + `pawgame/GameBoard.tsx` + `pawgame/MissionModal.tsx` + `pawgame/ShopModal.tsx` |
| `src/pages/AddPet.tsx` | 917 | Form schema, upload foto, OCR vacunas, paywall premium, validation, create vs edit | `AddPet` (form) + `onboarding/PhotoUploadField.tsx` + `PaywallCard.tsx` |
| `src/pages/ServiceDirectory.tsx` | 914 | Listings search, filtros avanzados, map view, rating widgets, booking modal, filter state | `ServiceDirectory` (orquestador) + `service/ServiceFilters.tsx` + `ServiceListings.tsx` + `ServiceMapView.tsx` |
| `src/components/EnhancedBookingDialog.tsx` | 662 | Dialog wrapper, availability calendar, confirmation summary, slot selection, payment submit | `EnhancedBookingDialog` + `CalendarStep` + `ConfirmationStep` + `PaymentStep` |
| `src/components/provider/ProviderDashboard.tsx` | 534 | Stats card, upcoming bookings, reviews list, profile preview button, mini charts | `ProviderDashboard` (grid) + `StatsCard` + `UpcomingBookingsWidget` + `ReviewsWidget` |

**Impacto**: testabilidad y legibilidad. No impacto funcional si los imports publicos se mantienen estables. Estos splits **requieren autorizacion del dueno** antes de ejecutarse.

---

## 7. Performance low-hanging

1. **`src/pages/Home.tsx:307-359`** Pet switcher loop con `key={pet.id}` correcto. Sin `memo()` en el boton, impacto bajo si <10 mascotas.
2. **`src/pages/ServiceDirectory.tsx`**: lista de proveedores grande. Agregar `loading="lazy"` a `<img>` de fotos. Alto ROI en Core Web Vitals.
3. **`src/components/TopRatedProviders.tsx`**: si renderiza >20 cards, evaluar virtualization (react-window) a futuro. No urgente.
4. **`src/pages/Maps.tsx`**: markers Leaflet creados inline en render sin memoizacion. En zoom/pan puede laggear. Envolver en `useMemo`.
5. **Inline callbacks en JSX**:
   - `src/pages/AddPet.tsx:459` `onClick={() => navigate(...)}`
   - `src/pages/AddPet.tsx:719` `onClick={() => togglePersonality(trait)}`
   - Anti-patron puro. Bajo impacto si `AddPet` no esta memoizado.

---

## 8. A11y basica

1. **Icon-only buttons sin `aria-label`**:
   - `Home.tsx:314` pet switcher -> tiene `aria-label` OK.
   - `PetCard.tsx`: probable icon button sin label. Revisar.
2. **Imagenes sin `alt`**:
   - `Home.tsx:324` `<AvatarImage alt={pet.name}>` OK.
   - `AddPet.tsx:521` `<img alt="Preview">` OK.
   - `ServiceDirectory.tsx`: probable fotos de vet sin `alt`. Revisar.
3. **Inputs con labels asociadas**:
   - `AddPet.tsx` usa `<Label htmlFor="name">` + `<Input id="name">` OK.

Conclusion: a11y razonablemente bien por herencia de shadcn/ui. Prioridad baja vs otras fases.

---

## 9. Copy fuera de chileno

Busqueda `grep -r "vos tenes\|vos podes\|vosotros\|cogeis" src/` -> sin coincidencias.

Resultado: copy en tuteo chileno estandar. No hay trabajo pendiente aqui.

---

## 10. Zonas protegidas (joyas de la corona)

Segun `CLAUDE.md`, las zonas protegidas son: ficha medica PDF, directorio publico de vets, pagos Flow, y auth. Solo aplican micro-mejoras seguras.

### `src/pages/MedicalRecords.tsx` + `src/components/medical/**`

Estado: ya usa `useQuery`, PDFs via edge function `generate-medical-summary`, compartir via token. OK.

Micro-mejoras seguras:
1. En `MedicalShare.tsx:115` y `:149` cambiar `.single()` -> `.maybeSingle()` + null check. Esto es el punto mas publico de la app y un crash ahi lo ve cualquier visitante con el link.
2. Tipar `current_medications: any` en `MedicalShare.tsx:31` con una interfaz `MedicationRecord { name: string; dosage?: string; frequency?: string; }`.

### `src/pages/DirectorioVets*`

Estado: ya usa `useQuery`, filtros por URL params, perfil publico via slug. OK.

Micro-mejoras seguras:
1. Agregar `loading="lazy"` a las fotos de vet en listado si no esta.
2. Verificar que ya usa `ServiceProviderRow` de `@/types/vetDirectory` (parece que si).

### `src/components/flow*` + `src/pages/Premium.tsx` + `/upgrade` + `/payment-result`

Estado: flujo Flow.cl vivo con idempotencia. OK.

Micro-mejoras seguras:
1. Verificar que cualquier `window.location.href = returnTo` valida/sanitiza `returnTo` para evitar open redirect.

### `src/hooks/useAuth.tsx` + `src/pages/Auth.tsx`

Estado: `useAuth` centralizado, oauth callbacks + email/password, Supabase Auth. OK.

Micro-mejoras seguras:
1. Revisar parsing de `window.location.hash` / `window.location.search` en `Auth.tsx` — Supabase lo maneja, pero validar que no se loggea el token crudo en ningun `console.log` residual.

**Regla**: nada de refactor estructural en estas zonas sin autorizacion explicita.

---

## Roadmap sugerido (por riesgo creciente)

### Fase 1 — Riesgo CERO (~10 min)

Reemplazar 10 `.single()` con `.maybeSingle()` + null checks defensivos.

```ts
// antes
.single();

// despues
.maybeSingle();
if (!data) throw new Error("Recurso no encontrado");
```

Archivos: ver tabla en seccion 3.

Ganancia: cero crashes silenciosos si el schema diverge o si un recurso fue borrado.

### Fase 2 — Riesgo BAJO (~15 min)

Eliminar `src/components/MissionCard.tsx` (dead code).

```bash
# verificar primero
grep -rn "from .*components/MissionCard\"" src/ | grep -v pawgame
# si esta vacio, borrar
rm src/components/MissionCard.tsx
```

Ganancia: -~100 lineas, claridad.

### Fase 3 — Riesgo BAJO (~2-3h)

Regenerar tipos Supabase y matar los 4 `const sb = supabase as any`.

```bash
npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.gen.ts
```

Actualizar:
- `src/hooks/useConsultationTemplates.ts`
- `src/hooks/useVetClinicalNotes.ts`
- `src/hooks/usePendingReviews.ts`
- `src/components/provider/VetFollowupsCard.tsx`

Ganancia: type-safety, autocomplete, early error detection en `npx tsc -b`.

### Fase 4 — Riesgo MEDIO (~4-6h)

Refactor `src/pages/Home.tsx` de `useEffect` + setState a 3-4 `useQuery`.

```ts
const { data: profile } = useQuery({ queryKey: ["profile", user?.id], ... });
const { data: pets } = useQuery({ queryKey: ["pets", user?.id], ... });
const { data: appointments } = useQuery({ queryKey: ["appointments", user?.id], ... });
const { data: vaccineStatus } = useQuery({ queryKey: ["vaccine-status", user?.id], ... });
```

Tambien revisar `useGamification.tsx` y `useReminders` para aplicar el mismo patron si estan usando el antipatron.

Ganancia: eliminar race conditions, retry automatico, refresh on tab focus.

### Fase 5 — Riesgo MAYOR (requiere autorizacion explicita)

Split de componentes gigantes:
- `PawGame.tsx` (950L)
- `AddPet.tsx` (917L)
- `ServiceDirectory.tsx` (914L)
- `EnhancedBookingDialog.tsx` (662L)
- `ProviderDashboard.tsx` (534L)

**No ejecutar sin aprobacion del dueno**. `AddPet.tsx` es especialmente sensible porque es parte del flujo de onboarding.

---

## Resumen de impacto

| Categoria | Hallazgos | Impacto funcional | Esfuerzo |
|---|---|---|---|
| Dead code | 1 componente (MissionCard.tsx top-level) | Bajo (~100L) | 5 min |
| Crashes potenciales | 10 `.single()` sin `.maybeSingle()` | Bajo probabilidad, alto si ocurre | 10 min |
| Tipado debil | 168 `any`, 4 `as any` criticos | Bajo (tech debt) | 1-2 h |
| Antipatrones datos | `Home.tsx` cascada + 2-3 archivos mas | Moderado (race conditions) | 4-6 h |
| Duplicacion | MissionCard | Bajo | 15 min |
| Performance | 5 oportunidades (lazy img, memo markers) | Bajo (<100 items) | 1 h |
| A11y | `ServiceDirectory`, `PetCard` | Bajo (ya bueno por shadcn) | 30 min |
| Componentes gigantes | 5 candidatos a split | Bajo (refactor, no funcional) | 8-10 h |

**Prioridad recomendada**: Fase 1 -> Fase 2 -> Fase 3 -> Fase 4. Fase 5 solo si hay tiempo y autorizacion.
