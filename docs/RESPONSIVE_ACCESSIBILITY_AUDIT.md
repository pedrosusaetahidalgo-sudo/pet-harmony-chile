# Responsive & Accessibility Audit — Paw Friend

> Generado: 2026-04-14 | Auditor: Claude Code (Next Level Master Plan, Fase 9)

---

## Resumen ejecutivo

La app tiene buen soporte responsive básico (Tailwind breakpoints, BottomTabBar en mobile, sidebar en desktop). Los problemas principales son: **touch targets bajo 44px en la mayoría de botones**, **focus rings eliminados globalmente por Radix configs**, **sin skip-to-content navigation**, y **`user-select: none` global que bloquea copy-paste de datos médicos**. 130 instancias de widths hardcodeados en px podrían causar overflow en mobile.

---

## Issues de Responsive

| Viewport / Pantalla | Problema | Severidad | Solución sugerida |
|---|---|---|---|
| **Mobile < 360px** | Pet cards en MyPets carousel: `w-[75vw] max-w-[280px]` — a 360px son 270px, dejando solo 45px de peek del siguiente card. Bajo 320px desaparece | **Alta** | Cambiar a `w-[80vw] sm:w-[75vw]`; agregar gradient fade-right overlay al carousel |
| **Mobile < 480px** | Landing "3 pasos": mockup cards con `max-w-sm = 384px` expanden a full width en mobile. Shadow `shadow-[0_30px_60px...]` se clipea por overflow | Media | Agregar `overflow-hidden` al mockup card wrapper; reducir shadow spread en mobile |
| **Mobile (todos)** | `BottomTabBar` es `h-14` (56px). Pages con su propio bottom padding (Home `pb-4`, Feed sin padding) pueden clipear último card detrás del tab bar | **Alta** | Crear CSS custom prop `--bottom-nav-height: 3.5rem`; auditar todas las páginas para bottom padding consistente |
| **Mobile (todos)** | PetClinicalRecord tabs: `TabsList` con 6 tabs + `overflow-x-auto snap-x` — sin indicador visual de scroll. Active indicator puede lagear en swipe rápido | Media | Agregar gradient fade-right o dots; considerar reducir a 5 tabs en mobile (merge Alimentación en Resumen) |
| **Tablet 768-1024px** | Home dashboard: `grid-cols-2 lg:grid-cols-4` salta sin `md:` — a 768px 2 columnas forzadas para 4 status cards. Sidebar `defaultOpen={true}` puede flashear en iPad portrait | Media | Agregar `md:grid-cols-4`; testear sidebar state en iPad portrait |
| **Tablet 768-1024px** | DirectorioVets filtro grid: `sm:grid-cols-2` — rating queda solo en su fila a tablet | Baja | Cambiar a `sm:grid-cols-3` |
| **Wide > 1280px** | Feed usa `max-w-2xl mx-auto` pero `PageHeader` no — header stretches full width, asimetría | Baja | Wrappear PageHeader en `max-w-2xl mx-auto` en Feed |
| **Fixed widths** | Header role-toggle usa `w-[calc(50%-2px)]` con positioning absoluto — frágil en ≤320px | Media | Usar flex-based approach con `flex-1` |
| **Hardcoded px** | 130 matches de `w-[Npx]` / `min-w-[Npx]` en 66 archivos — Analytics/ProDashboard con 10-13 matches cada uno | Media | Auditar y reemplazar con % o `w-full`; agregar `overflow-x-hidden` a root layout |
| **Overflow** | `AppLayout` tiene `overflow-x-hidden` en outer div pero `main` solo `overflow-y-auto` — contenido fijo ancho puede clipearse | Media | Verificar propagación de `overflow-x-hidden`; agregar `max-w-full` a hijos directos de `main` |

---

## Issues de Accesibilidad

### Críticos (fix antes de next release)

| Área | Problema | Severidad | Solución |
|---|---|---|---|
| **Skip Navigation** | Sin link skip-to-main-content. Usuarios de teclado deben tabear por sidebar completa (26+ items) y Header (5+ elements) antes de llegar al contenido | **Alta** | Agregar `<a href="#main-content" className="sr-only focus:not-sr-only">Ir al contenido</a>` como primer hijo de AppLayout |
| **Focus Rings** | `outline-none` / `focus:outline-none` en 53 archivos incluyendo `ui/tabs.tsx`, `ui/select.tsx`, `ui/dropdown-menu.tsx` — Radix primitives sin focus ring visible | **Alta** | Agregar `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1` a todos los CVA configs de triggers interactivos |
| **Touch Targets** | `min-h-[44px] min-w-[44px]` solo en 11 archivos. Mayoría de elementos interactivos usan `h-7`/`h-8`/`h-9` (28-36px) — bajo mínimo WCAG 44px | **Alta** | Aumentar interactivos a mínimo `h-10` (40px) o `h-11` (44px). Agregar `touch-manipulation` a `<button>` |
| **Interactive non-buttons** | `<Badge onClick>` filter chips en Feed.tsx — sin `role`, `tabIndex`, `onKeyDown`. Click-only, inaccesible por teclado/screen reader | **Alta** | Reemplazar con `<button>` styled como badges, o agregar `role="button" tabIndex={0} onKeyDown` |

### Altos (next sprint)

| Área | Problema | Severidad | Solución |
|---|---|---|---|
| **Contraste — texto pequeño** | `text-[9px]` en 72 archivos. A ese tamaño WCAG AA requiere 4.5:1. `text-muted-foreground` da ~4.3:1 contra blanco — justo bajo threshold | **Alta** | Aumentar mínimo a `text-xs` (12px) para texto legible; reservar 9-10px solo para decorativo |
| **Contraste — gradientes** | `bg-warm-gradient bg-clip-text text-transparent` — gradient text pierde garantías de contraste. Porciones claras amber/yellow contra blanco pueden fallar 3:1 | Media | Agregar `text-shadow: 0 0 1px rgba(0,0,0,0.1)` o asegurar extremos del gradient a 4.5:1 |
| **user-select disabled** | `index.css` deshabilita `user-select` en `body` globalmente. Re-habilita para `p, h1-h6, span, li` pero cualquier `div` con texto es no-seleccionable. **Bloquea copy-paste de datos médicos** (direcciones vet, nombres de medicamentos) | Media | Remover `user-select: none` global; aplicar solo a elementos UI control via `.no-select` utility |
| **ARIA badges** | Badge de notificación en Header (`h-5 w-5`) sin `aria-label` — screen readers anuncian número sin contexto | Media | Agregar `aria-label={${count} notificaciones sin leer}` |
| **Emojis sin ARIA** | Emojis en UI copy (`📍 Tu comuna`, `🐾 Paw Friend`, `🐕🐈🐾` avatares) sin `aria-label` ni `aria-hidden` | Media | Wrappear en `<span role="img" aria-label="...">` o marcar `aria-hidden="true"` |

### Medios

| Área | Problema | Severidad | Solución |
|---|---|---|---|
| **Form labels** | `<label>` en DirectorioVets (línea 195) no conectada a SelectTrigger via `htmlFor`/`id` | Media | Usar `<Label>` component con patrón `asChild` o wrapper `id` de Radix |
| **Image alt text** | Avatar fallback `<div>` sin accessible label en varios componentes (PawCardMemorial, etc.) | Media | Agregar `aria-label` al parent Avatar de AvatarFallback |
| **Role switcher a11y** | Toggle Dueño/Profesional en Header sin `aria-pressed` — estado activo solo indicado por color | Media | Agregar `aria-pressed={role === 'owner'}` y `aria-pressed={role === 'provider'}` |
| **Notification popover** | `ScrollArea` dentro de PopoverContent (max-h-320px) previene keyboard scrolling en algunos browsers | Baja | Usar `overflow-y-auto` nativo con `tabIndex={0}` en vez de Radix ScrollArea |
| **Dialog focus** | "Nueva publicación" Dialog — foco inicial podría no ir al textarea (Radix maneja auto pero verificar) | Baja | Verificar `autoFocus` en textarea de FeedCreatePost |

---

## Resumen de acciones priorizadas

### Hacer ahora (bloquean accesibilidad básica)
1. **Skip-to-content link** — 1 línea en AppLayout
2. **Focus rings en Radix components** — auditar CVA configs en `ui/tabs.tsx`, `ui/select.tsx`, `ui/dropdown-menu.tsx`, `ui/popover.tsx`
3. **Badge filter chips → buttons** en Feed.tsx
4. **Touch targets a 44px** en botones más usados

### Hacer pronto (mejoran experiencia significativamente)
5. **Remover `user-select: none` global** de index.css
6. **Fix contraste `text-[9px]`** — aumentar a `text-xs` mínimo
7. **Bottom padding consistente** en todas las páginas (custom prop `--bottom-nav-height`)
8. **Carousel fade hint** en MyPets para mobile

### Hacer después (polish)
9. **ARIA en badges, emojis, role switcher**
10. **Form label linkage** en DirectorioVets
11. **Reemplazar px hardcodeados** en admin/analytics components
