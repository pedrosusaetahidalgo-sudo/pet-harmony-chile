# RESPONSIVE_ACCESSIBILITY_AUDIT.md — Auditoria de Responsive y Accesibilidad — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Resumen ejecutivo

La app es funcional en mobile y desktop. Los problemas identificados son de refinamiento: touch targets insuficientes (el mas extendido), ausencia de skip-to-content, y algunos controles interactivos que no son accesibles por teclado. Ninguno bloquea el uso, pero impactan la experiencia de usuarios con capacidades diferentes y en dispositivos variados.

---

## Estado por area

### Items SOLUCIONADOS

| Item | Descripcion | Archivo |
|---|---|---|
| dialog.tsx — boton cerrar | Ahora cumple 44px de touch target | `src/components/ui/dialog.tsx` |

---

## Responsive — Items PENDIENTES

### RESP-1 — PetClinicalRecord: 6 tabs desbordan en pantallas <375px

**Severidad**: Alta — afecta la joya de la corona en iPhones SE y dispositivos pequenos

**Descripcion**: La ficha clinica tiene 6 tabs horizontales: Salud, Vacunas, Medicamentos, Alergias, Documentos, Historial. En pantallas de 320-375px de ancho, los tabs no caben en una fila y el comportamiento de overflow no esta definido correctamente — algunas tabs quedan fuera de pantalla sin indicacion visual de que existen.

**Solucion recomendada**:
- Opcion A: ScrollArea horizontal en los tabs (agregar `overflow-x: auto; scroll-snap-type: x`) con indicador de scroll en el borde
- Opcion B: Convertir a dropdown en mobile (<480px) con el tab activo visible como label
- Opcion A es mas rapida de implementar

### RESP-2 — Carousel demasiado estrecho en <360px

**Severidad**: Baja

**Descripcion**: Los carousels de Paw Cards y misiones tienen un ancho minimo hardcodeado que no funciona en dispositivos <360px de ancho (algunos Android de gama baja).

**Solucion**: Usar `min-w-0` y `w-full` en lugar de anchos fijos.

### RESP-3 — Bottom padding inconsistente en iOS

**Severidad**: Media

**Descripcion**: En iOS con barra de navegacion inferior (iPhone X y mas recientes), el contenido de algunas paginas queda parcialmente cubierto por la barra del sistema. El safe-area-inset-bottom no se aplica consistentemente.

**Solucion**: En el contenedor principal de cada pagina con scroll:
```css
padding-bottom: env(safe-area-inset-bottom, 16px);
```
O via Tailwind con plugin `tailwindcss-safe-area`.

### RESP-4 — Gaps en breakpoint tablet (768px-1024px)

**Severidad**: Baja

**Descripcion**: El diseno esta optimizado para mobile (<768px) y desktop (>1024px). En tablets, algunos layouts colapsan al layout mobile cuando podrian aprovechar el espacio adicional (dos columnas, por ejemplo).

**Solucion**: Agregar clases `md:` en las secciones mas visitadas: Home, DirectorioVets, PetClinicalRecord.

### RESP-5 — 130 anchos hardcodeados en px

**Severidad**: Baja

**Descripcion**: En todo el proyecto hay aproximadamente 130 instancias de anchos en `px` hardcodeados (`w-[200px]`, `w-[320px]`, etc.) que no escalan bien en viewports no estandar.

**Solucion**: Revisar los mas criticos en flujos principales y convertir a unidades relativas (`%`, `rem`, o clases de Tailwind responsivas).

---

## Accesibilidad — Items PENDIENTES

### A11Y-1 — Sin skip-to-content link

**Severidad**: Media — WCAG 2.4.1 (Level A)

**Descripcion**: No existe un enlace "Saltar al contenido principal" al inicio de la pagina. Los usuarios de teclado deben tabular por toda la navegacion (Header, Sidebar, BottomTabBar) para llegar al contenido en cada cambio de ruta.

**Solucion** (15 minutos):
```tsx
// Agregar al inicio de App.tsx o del layout principal
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-foreground"
>
  Saltar al contenido principal
</a>

// En el contenedor principal de cada pagina:
<main id="main-content">
  {/* contenido */}
</main>
```

### A11Y-2 — outline-none sin compensacion en componentes UI

**Severidad**: Media — WCAG 2.4.7 (Level AA)

**Descripcion**: 24 archivos de `src/components/ui/` tienen `outline-none` o `focus:outline-none`. Algunos tienen `focus:ring-2` como compensacion (correcto), pero no todos. Especificamente:

- `dropdown-menu.tsx`: los items de menu solo tienen `focus:bg-accent` — el cambio de color de fondo no es suficiente como indicador de foco para usuarios que no distinguen colores (daltonia).
- Varios componentes tienen `outline-none` sin ningun `ring` ni indicador alternativo.

**Solucion**: Auditar cada uno de los 24 archivos. Para cada `outline-none`, verificar que exista `focus-visible:ring-2 focus-visible:ring-ring` como compensacion. Si no existe, agregarlo.

### A11Y-3 — Touch targets < 44px

**Severidad**: Media — WCAG 2.5.5 (Level AAA) / guias de Apple HIG y Google Material

**Descripcion**: Solo 8 de los archivos de componentes cumplen con el minimo de 44x44px para areas de toque. Los mas criticos:

| Componente | Tamano actual | Impacto |
|---|---|---|
| BottomTabBar — tabs | ~36px | Navegacion principal |
| Botones de accion en ficha clinica | ~32px | Flujo critico |
| Iconos de editar/eliminar en listas | ~28-32px | Operaciones destructivas |
| Checkboxes en formularios | ~20px | Formularios en general |

**Solucion sistematica**:
```javascript
// tailwind.config.ts — agregar
extend: {
  minHeight: { touch: '44px' },
  minWidth: { touch: '44px' },
}
```
Aplicar `min-h-touch min-w-touch` o `h-11 w-11` (44px) a todos los elementos interactivos.

### A11Y-4 — Feed Badge con onClick — no es elemento nativo interactivo

**Severidad**: Media

**Descripcion**: Reportado tambien en UX_UI_NEXT_LEVEL_AUDIT.md. El Badge en el feed tiene onClick pero no es un `<button>` ni tiene `role="button"` + `tabIndex={0}`. Los usuarios de teclado y lectores de pantalla no pueden activarlo.

**Solucion**: Envolver en `<button>` nativo.

### A11Y-5 — user-select:none en body

**Severidad**: Baja

**Descripcion**: El CSS global aplica `user-select: none` al body, lo que impide que los usuarios seleccionen y copien texto de la app. Esto es un problema para usuarios con dificultades visuales que necesitan copiar texto para ampliarlo o leerlo en otros sistemas.

**Solucion**: Eliminar `user-select: none` del body. Aplicarlo solo donde sea estrictamente necesario (p.ej., en elementos de arrastrar-y-soltar).

### A11Y-6 — Role switcher sin aria-pressed

**Severidad**: Media

**Descripcion**: El toggle de cambio de rol en el Header no tiene `aria-pressed` para indicar el estado actual a lectores de pantalla. Un usuario con lector de pantalla no sabe en que rol esta actualmente.

**Solucion**:
```tsx
<button
  aria-pressed={activeRole === 'owner'}
  aria-label={activeRole === 'owner' ? 'Cambiar a modo veterinario' : 'Cambiar a modo dueno'}
  onClick={handleRoleSwitch}
>
  {activeRole === 'owner' ? 'Modo Dueno' : 'Modo Vet'}
</button>
```

### A11Y-7 (NUEVO) — PetClinicalRecord: PawPoints nudge es div con onClick

**Severidad**: Media

**Descripcion**: El componente de PawPoints nudge en la ficha clinica es un `<div>` con `onClick` sin `role`, `tabIndex`, ni `aria-label`. Inaceptable en el flujo mas importante del producto.

**Solucion**: Convertir a `<button>` nativo (ver UX_UI_NEXT_LEVEL_AUDIT.md UX-7).

### A11Y-8 — text-[9px] en 13 archivos — 20 instancias

**Severidad**: Media — WCAG 1.4.4 (Level AA)

**Descripcion**: 9px es ilegible en pantallas de alta densidad (Retina) y para usuarios con dificultades visuales. WCAG recomienda minimo 14px para texto normal, 12px para texto de apoyo.

**Archivos con mayor incidencia**: Componentes de Paw Cards, badges de gamificacion, labels de graficos.

**Solucion**: Reemplazar `text-[9px]` con `text-[10px]` como minimo, preferir `text-xs` (12px Tailwind).

### A11Y-9 — dropdown-menu.tsx: focus indicator es solo color

**Severidad**: Media

**Descripcion**: Los items del menu desplegable cambian a `bg-accent` en foco, pero el cambio de color es el unico indicador. Usuarios con daltonismo tipo deuteranopia pueden no distinguir el estado de foco del estado normal.

**Solucion**: Agregar `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1` a los items del dropdown.

---

## Checklist de accesibilidad para release

| Item | Esfuerzo | WCAG |
|---|---|---|
| Skip-to-content link | 15 min | 2.4.1 Level A |
| PawPoints nudge -> button con aria-label | 15 min | 4.1.2 Level A |
| Role switcher + aria-pressed | 15 min | 4.1.2 Level A |
| Feed Badge -> button nativo | 15 min | 4.1.2 Level A |
| dropdown-menu.tsx focus indicator con ring | 30 min | 2.4.7 Level AA |
| outline-none + ring en 24 componentes UI | 2-3h | 2.4.7 Level AA |
| Touch targets >= 44px en BottomTabBar | 1h | 2.5.5 Level AAA |
| text-[9px] -> minimo text-[10px] (20 instancias) | 1h | 1.4.4 Level AA |
| user-select:none eliminado de body | 5 min | Usabilidad |

**Items Level A (obligatorios)**: Skip-to-content, PawPoints nudge, role switcher, Feed Badge. Total: ~1h de trabajo.

**Items Level AA (objetivo WCAG 2.1 AA)**: Focus rings, touch targets, text sizes. Total: ~4-5h de trabajo.
