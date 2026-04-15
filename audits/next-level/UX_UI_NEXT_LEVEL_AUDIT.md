# UX_UI_NEXT_LEVEL_AUDIT.md — Auditoria UX/UI Next Level — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Resumen ejecutivo

La UI base es solida — shadcn/ui bien implementado, Tailwind consistente en la mayoria del proyecto, y los flujos criticos son funcionales. Los problemas restantes son de pulido: touch targets, accesibilidad de teclado, y algunas inconsistencias de copy que generan confusion.

---

## Estado por area — columna de estado actualizada

### Items SOLUCIONADOS en sesiones anteriores

| Item | Descripcion | Archivos |
|---|---|---|
| Copy "My Paws" -> "Mis Mascotas" | Corregido en 5 archivos | MyPets.tsx + 4 mas |
| Copy "Recordar" -> "Avisos" | Alineado con BottomTabBar | Reminders.tsx + componentes |
| dialog.tsx — boton cerrar | Ahora 44px de touch target | `src/components/ui/dialog.tsx` |

---

### Items PENDIENTES — con impacto en usuarios reales

#### UX-1 — PetClinicalRecord: PDF/OCR/IA sobre las tabs empuja contenido fuera de pantalla en mobile

**Severidad**: Alta — afecta la joya de la corona

**Descripcion**: En la pagina `/ficha/:petId`, los botones de PDF, OCR de carnet y Asistente IA estan ubicados ENCIMA de las tabs de navegacion. En pantallas moviles (<768px), esto empuja los tabs y el contenido de la tab activa debajo del fold, requiriendo scroll para ver cualquier informacion medica.

**Impacto**: El usuario ve los botones de accion pero no ve el contenido de la ficha sin hacer scroll, lo que parece una pantalla vacia.

**Solucion recomendada**:
- Opcion A: Mover PDF/OCR/AI a un menu de 3 puntos (overflow) en la esquina superior derecha
- Opcion B: Colocarlos dentro de cada tab que los usa (PDF solo en tab "Documentos", AI solo en tab "Historial")
- Opcion B es la mas intuitiva para el usuario

#### UX-2 — Home.tsx: doble empty state

**Severidad**: Media

**Descripcion**: Cuando el usuario no tiene mascotas registradas, se renderizan dos estados vacios simultaneamente: `HomeOnboardingHints` (componente de onboarding) y una Card purpura con CTA. El usuario ve dos llamadas a la accion diferentes y confusas.

**Solucion**: Usar un solo empty state condicional. Si `pets.length === 0`, mostrar solo `HomeOnboardingHints` con CTA a `/add-pet`. Eliminar la Card purpura duplicada.

#### UX-3 — DirectorioVets: filtro card demasiado alto en mobile

**Severidad**: Media

**Descripcion**: El card de filtros (por comuna, especialidad, rating) ocupa demasiado espacio vertical en pantallas <768px, requiriendo scroll significativo para llegar a los resultados.

**Solucion**: Convertir filtros a una fila horizontal colapsable con botones tipo chip. Mostrar filtros activos como badges. En mobile, filtros deben estar en un sheet/drawer.

#### UX-4 — Feed Badge: onClick sin accesibilidad de teclado

**Severidad**: Media — impacta accesibilidad

**Descripcion**: El componente `Badge` en el feed tiene un handler `onClick` pero el elemento no es un `<button>`. Los usuarios de teclado no pueden activarlo con Enter/Space.

**Solucion**:
```tsx
// ACTUAL
<Badge onClick={handleClick}>...</Badge>

// CORRECTO
<button onClick={handleClick} className="...">
  <Badge>...</Badge>
</button>
```

#### UX-5 — Touch targets menores a 44px en multiples archivos

**Severidad**: Media — impacto directo en usabilidad mobile

**Estado**: Solo 8 archivos cumplen con el minimo de 44px. El resto de botones e iconos interactivos son mas pequenos.

**Archivos con mayor incumplimiento**:
- BottomTabBar.tsx — tabs de navegacion principal
- Componentes de la ficha clinica (editar campo, eliminar entrada)
- Botones de accion en cards del feed

**Solucion sistemica**: Agregar a `tailwind.config.ts`:
```javascript
extend: {
  minHeight: { 'touch': '44px' },
  minWidth: { 'touch': '44px' },
}
```
Luego aplicar `min-h-touch min-w-touch` a todos los elementos interactivos.

#### UX-6 — Mismatch de labels: "Recordatorios" vs "Avisos" para la misma ruta

**Severidad**: Baja-Media — confusion de marca

**Descripcion**: El Sidebar muestra "Recordatorios" para `/reminders`, pero el BottomTabBar muestra "Avisos" para la misma ruta. El usuario ve dos nombres para la misma seccion dependiendo de si esta en desktop o mobile.

**Solucion**: Estandarizar a "Avisos" en ambos (es el nombre mas reciente y mas corto para mobile). Actualizar `AppSidebar.tsx`.

#### UX-7 — PetClinicalRecord: PawPoints nudge no es accesible por teclado

**Severidad**: Media — nueva, encontrada en sesion 2026-04-14

**Descripcion**: El componente de nudge de PawPoints en la ficha clinica usa un `<div>` con `onClick` pero sin `role="button"`, `tabIndex={0}`, ni `aria-label`. Es completamente invisible para usuarios de teclado y lectores de pantalla.

**Solucion**:
```tsx
// ACTUAL
<div onClick={handlePawPoints}>Gana PawPoints...</div>

// CORRECTO
<button
  onClick={handlePawPoints}
  aria-label="Ganar PawPoints por actualizar la ficha"
  className="..."
>
  Gana PawPoints...
</button>
```

---

## Inconsistencias de design system

### Espaciado de secciones

El proyecto usa una mezcla de `py-4`, `py-6`, `py-8`, y `p-4` sin criterio claro. Esto genera ritmo visual inconsistente entre paginas.

**Recomendacion**: Definir en `tailwind.config.ts` o en un archivo de tokens:
```
section-padding-mobile: py-4 px-4
section-padding-desktop: py-8 px-6
card-padding: p-4 (mobile) / p-6 (desktop)
```

### Gradientes de texto — contraste

Varios textos con gradiente (titulo principal en Landing, secciones de gamificacion) tienen contraste insuficiente en modo claro, especialmente en pantallas con alto brillo. Los browsers mas antiguos tampoco renderizan `background-clip: text` correctamente.

**Recomendacion**: Verificar con herramienta de contraste. Si el ratio es menor a 4.5:1 (WCAG AA), cambiar a color solido o agregar `color` de fallback.

### Textos de 9px — 20 instancias en 13 archivos

El tamano minimo recomendado para legibilidad movil es 11-12px. Los textos de `text-[9px]` son ilegibles en pantallas pequenas o para usuarios con dificultades visuales.

**Solucion**: Reemplazar `text-[9px]` con `text-[10px]` como minimo, o usar `text-xs` (12px).

---

## Top 5 cambios por impacto en usuarios reales

| # | Cambio | Impacto esperado | Esfuerzo |
|---|---|---|---|
| 1 | Mover PDF/OCR/AI dentro de tabs en PetClinicalRecord | Ficha clinica accesible sin scroll en mobile | 2-3h |
| 2 | Crear useCurrentUserProfile (ver ARCHITECTURE_REFACTOR_PLAN) | Home y Header cargan mas rapido | 2-3h |
| 3 | Eliminar double empty state en Home.tsx | Onboarding mas claro para nuevos usuarios | 30min |
| 4 | Estandarizar label "Avisos" en Sidebar (eliminar "Recordatorios") | Elimina confusion de marca | 15min |
| 5 | Arreglar PawPoints nudge como button | Accesibilidad de teclado en ficha clinica | 15min |

---

## Checklist de UX para proxima release

- [ ] PetClinicalRecord — PDF/OCR/AI movidos dentro de tabs correspondientes
- [ ] Home.tsx — double empty state eliminado
- [ ] AppSidebar.tsx — "Recordatorios" cambiado a "Avisos"
- [ ] PawPoints nudge en PetClinicalRecord — convertido a button con aria-label
- [ ] Feed Badge con onClick — envuelto en button
- [ ] DirectorioVets — filtros a chips/drawer en mobile
- [ ] Touch targets >= 44px en BottomTabBar y controles de ficha clinica
- [ ] text-[9px] reemplazado por minimo text-[10px] en 13 archivos
