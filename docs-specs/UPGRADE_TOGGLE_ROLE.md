# Upgrade Toggle de Rol — Spec

> Estado: **Propuesta** · Prioridad: Media · Fecha: 2026-04-13

---

## 1. Problema actual

El toggle en el Header muestra **solo el rol activo** ("Dueño" o "Profesional") como una pill con icono. Esto tiene 2 problemas:

1. **No se ve la alternativa.** El usuario dual-role tiene que *saber* que el boton es un toggle. Un usuario nuevo con cuenta vet no descubre que puede cambiar de modo.
2. **En mobile solo se ve el icono** (PawPrint o Stethoscope), sin texto. Es críptico.

---

## 2. Labels

Se mantienen los nombres actuales:
- **Dueño** (rol owner)
- **Profesional** (rol provider)

Sin cambios de copy en labels del toggle.

---

## 3. Diseño visual: Toggle Segmentado (ambas opciones visibles)

### Estado actual (pill simple)
```
[ 🐾 Dueño ]          ← solo se ve el rol activo, el otro es invisible
```

### Propuesta: Segmented Control
```
┌──────────┬────────────────┐
│ 🐾 Dueño │ 🩺 Profesional │   ← ambos siempre visibles
└──────────┴────────────────┘
       ▲ activo (filled)    inactivo (ghost)
```

**Comportamiento:**
- Las 2 opciones siempre visibles, lado a lado
- El segmento activo tiene fondo de color + texto bold
- El segmento inactivo tiene texto muted + hover sutil
- Click en el inactivo → switch con transición suave (slide del fondo)
- Animación: el fondo "desliza" de un segmento al otro (~200ms ease)

### Colores

| Rol | Segmento activo | Segmento inactivo |
|---|---|---|
| Dueño | `bg-purple-100 text-purple-700 font-semibold` | `text-gray-400 hover:text-gray-600` |
| Profesional | `bg-teal-100 text-teal-700 font-semibold` | `text-gray-400 hover:text-gray-600` |

### Contenedor
```
bg-gray-100 rounded-full p-0.5 flex items-center
```

---

## 4. Responsive

### Desktop (>= sm / 640px)
```
┌──────────┬────────────────┐
│ 🐾 Dueño │ 🩺 Profesional │
└──────────┴────────────────┘
```
- Icono + texto en ambos segmentos
- Tamaño: `h-8 text-xs`

### Mobile (< sm / 640px)
```
┌────┬────┐
│ 🐾 │ 🩺 │
└────┴────┘
```
- Solo iconos para ahorrar espacio
- Tooltip al mantener presionado muestra "Dueño" / "Profesional"
- El segmento activo sigue teniendo fondo de color para diferenciarse

---

## 5. Micro-interacciones

1. **Slide del fondo:** El highlight se anima de un segmento al otro con `transform: translateX()` (~200ms ease-out)
2. **Toasts** (sin cambios en copy):
   - `"Cambiaste a modo dueño"`
   - `"Cambiaste a modo profesional"`
3. **Haptic feedback (mobile Capacitor):** `Haptics.impact({ style: ImpactStyle.Light })` al cambiar (futuro, requiere plugin)
4. **Primera vez:** Si el usuario nunca ha tocado el toggle, mostrar un micro-tooltip pulsante: `"Cambia de vista aquí"` que desaparece después del primer uso (guardar flag en localStorage `pf_toggle_onboarded`)

---

## 6. Para usuarios NO dual-role

Si `isProvider === false`, el toggle **no se muestra** (igual que hoy). Sin cambios.

---

## 7. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/Header.tsx:191-221` | Reemplazar pill simple por segmented control |
| `src/components/profile/ProfileSettingsList.tsx:79-84` | Cambiar label "Modo veterinario" → "Modo Profesional" (consistencia) |

### Componente nuevo (opcional)
`src/components/ui/segmented-toggle.tsx` — Componente reutilizable de segmented control que recibe opciones y maneja la animación del slide. Podría usarse en otros contextos (tabs de filtro, etc.).

---

## 8. Impacto esperado

- **Descubrimiento:** Usuarios dual-role ven ambas opciones → más engagement con el modo profesional
- **Onboarding:** Nuevo vet que se registra entiende inmediatamente que puede cambiar de vista
- **Claridad mobile:** Dos iconos con estado visual claro vs un solo icono ambiguo
