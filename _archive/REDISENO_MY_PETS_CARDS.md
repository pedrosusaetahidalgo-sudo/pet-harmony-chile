# Paw Friend — Rediseno "Mis Mascotas": Tarjetas Deslizables

> Blueprint para redisenar `/my-pets` con tarjetas compactas deslizables horizontalmente.
> Fecha: 2026-04-11
> Archivo principal: `src/pages/MyPets.tsx`

---

## 1. Diagnostico actual

### 1.1. Problema principal: las tarjetas son demasiado altas

Cada tarjeta de mascota ocupa aprox. **520-600px de alto** en mobile:

| Bloque | Alto estimado |
|---|---|
| Imagen (`h-48`) | 192px |
| CardHeader (nombre + badge) | ~56px |
| Datos (raza, edad, tamano, color, genero) | ~120px |
| Personality badges | ~40px |
| Bio (line-clamp-2) | ~40px |
| BreedTips (boton IA) | ~48px |
| Botones (Ficha + Editar/Eliminar) | ~88px |
| Padding acumulado | ~40px |
| **Total** | **~600px** |

En un iPhone 13 (844px de viewport util - navbar ~56px - bottom tab ~64px = **~724px utiles**), **una sola tarjeta ocupa el 83% de la pantalla**. El usuario no ve la segunda mascota sin hacer scroll largo.

### 1.2. Layout actual

```
Mobile (1 col):          Desktop (3 cols):
┌──────────────┐         ┌────────┐ ┌────────┐ ┌────────┐
│   Imagen     │         │ Imagen │ │ Imagen │ │ Imagen │
│   h-48       │         │        │ │        │ │        │
├──────────────┤         │ Datos  │ │ Datos  │ │ Datos  │
│ Nombre  gato │         │        │ │        │ │        │
├──────────────┤         │ Btns   │ │ Btns   │ │ Btns   │
│ Raza: ...    │         └────────┘ └────────┘ └────────┘
│ Edad: ...    │
│ Tamano: ...  │
│ Color: ...   │
│ Genero: ...  │
├──────────────┤
│ [Curioso]... │
├──────────────┤
│ Bio texto... │
├──────────────┤
│ Ver Consejos │
├──────────────┤
│ [Ficha Clin] │
│ [Edit][Elim] │
└──────────────┘
```

### 1.3. Problemas especificos

1. **En mobile solo se ve 1 mascota a la vez.** Hay que hacer scroll vertical extenso para ver las demas.
2. **Demasiada informacion visible.** Raza, edad, tamano, color, genero, personalidad, bio y tips de raza se muestran todos al mismo tiempo. Es un formulario, no una tarjeta.
3. **Grid vertical no permite descubrimiento rapido.** El usuario con 3+ mascotas necesita scrollear mucho para encontrar la correcta.
4. **El CTA principal (Ficha Clinica) esta al fondo.** La accion mas importante queda enterrada bajo toda la metadata.
5. **BreedTips agrega altura sin ser critico.** Es un nice-to-have que infla la tarjeta.
6. **En desktop las tarjetas tambien son altas.** El grid de 3 columnas ayuda pero cada card sigue siendo alta.

---

## 2. Propuesta: Tarjetas compactas deslizables (carrusel horizontal)

### 2.1. Concepto

Reemplazar el grid vertical de tarjetas grandes por un **carrusel horizontal deslizable** en mobile, donde cada tarjeta es compacta (~280px de alto) y el usuario desliza lateralmente para ver sus mascotas. En desktop, mantener un grid pero con tarjetas reducidas.

### 2.2. Inspiracion

- **Apple Wallet:** tarjetas apiladas que se deslizan.
- **Spotify playlists:** scroll horizontal de cards compactas.
- **Banking apps (Nubank, Revolut):** tarjetas de cuentas deslizables con info esencial + tap para detalle.

### 2.3. Nuevo layout mobile

```
┌────────────────────────────────────┐
│ Mis Mascotas              [+ Add] │
│ Gestiona los perfiles...           │
├────────────────────────────────────┤
│                                    │
│  ┌──────────┐  ┌──────────┐       │
│  │  Foto    │  │  Foto    │  ···  │
│  │ circular │  │ circular │       │
│  │          │  │          │       │
│  │  Kai     │  │  Luna    │       │
│  │ P. Suizo │  │  Gato    │       │
│  │ 2 anos   │  │  1 ano   │       │
│  │          │  │          │       │
│  │[F.Clin]  │  │[F.Clin]  │       │
│  │[Ed][Del] │  │[Ed][Del] │       │
│  └──────────┘  └──────────┘       │
│         · ●  ·                     │  <-- dots de paginacion
│                                    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  En memoria (2)              ▼    │
└────────────────────────────────────┘
```

### 2.4. Anatomia de la tarjeta compacta

```
┌─────────────────────────┐
│                         │
│      ┌─────────┐        │
│      │  Foto   │        │
│      │ 96x96   │        │
│      │ rounded │        │
│      └─────────┘        │
│                         │
│      Kai        [gato]  │
│      Pastor Suizo       │
│      2 anos · Macho     │
│                         │
│   ┌─────────────────┐   │
│   │  Ficha Clinica  │   │
│   └─────────────────┘   │
│   [Editar]  [Eliminar]  │
│                         │
└─────────────────────────┘
```

**Altura estimada: ~260-280px** (vs ~600px actual = **reduccion del 55%**).

### 2.5. Que se muestra vs. que se oculta

| Dato | Visible en tarjeta | Donde se ve |
|---|---|---|
| Foto | Si (avatar 96px) | Tarjeta |
| Nombre | Si | Tarjeta |
| Especie (badge) | Si | Tarjeta |
| Raza | Si (1 linea) | Tarjeta |
| Edad | Si (inline con genero) | Tarjeta |
| Genero | Si (inline con edad) | Tarjeta |
| Tamano | No | Ficha clinica / Editar |
| Color | No | Ficha clinica / Editar |
| Personalidad | No | Ficha clinica / Editar |
| Bio | No | Ficha clinica / Editar |
| BreedTips | No | Ficha clinica |
| Peso | No | Ficha clinica / Editar |

**Regla:** la tarjeta solo muestra lo necesario para **identificar** a la mascota y acceder a la **ficha clinica**. Todo lo demas vive en la vista de detalle.

---

## 3. Especificaciones tecnicas

### 3.1. Carrusel mobile (< md)

```tsx
// Contenedor del carrusel
<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory
                pb-4 -mx-4 px-4 scrollbar-hide">
  {pets.map(pet => (
    <div key={pet.id}
         className="snap-center shrink-0 w-[75vw] max-w-[280px]">
      <PetCard pet={pet} />
    </div>
  ))}
</div>
```

**Propiedades clave:**
- `overflow-x-auto`: scroll horizontal nativo.
- `snap-x snap-mandatory`: snap a cada tarjeta al soltar.
- `snap-center`: la tarjeta activa se centra.
- `w-[75vw]`: cada tarjeta ocupa 75% del ancho, dejando ver un peek de la siguiente (incentiva deslizar).
- `max-w-[280px]`: limite para pantallas grandes.
- `scrollbar-hide`: ocultar scrollbar (CSS utility).
- `-mx-4 px-4`: sangria negativa para que el carrusel toque los bordes.

### 3.2. Grid desktop (>= md)

```tsx
// Desktop: mantener grid pero con tarjetas compactas
<div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {pets.map(pet => (
    <PetCard key={pet.id} pet={pet} />
  ))}
</div>
```

- Agregar `xl:grid-cols-4` porque las tarjetas ahora son mas pequenas.
- Reducir `gap-6` a `gap-4`.

### 3.3. Componente PetCard compacta

```tsx
// Estructura simplificada
<Card className="overflow-hidden">
  {/* Foto centrada */}
  <div className="pt-6 pb-3 flex justify-center">
    <Avatar className="h-24 w-24 ring-2 ring-purple-100">
      <AvatarImage src={pet.photo_url} alt={pet.name} />
      <AvatarFallback className="bg-purple-50 text-purple-300">
        <Heart className="h-10 w-10" />
      </AvatarFallback>
    </Avatar>
  </div>

  {/* Info esencial */}
  <CardContent className="text-center space-y-1 pb-4">
    <div className="flex items-center justify-center gap-2">
      <h3 className="font-semibold text-lg">{pet.name}</h3>
      <Badge variant="secondary" className="text-xs">{pet.species}</Badge>
    </div>
    {pet.breed && (
      <p className="text-sm text-muted-foreground">{pet.breed}</p>
    )}
    <p className="text-xs text-muted-foreground">
      {age}{gender ? ` · ${gender}` : ""}
    </p>

    {/* Acciones */}
    <div className="flex flex-col gap-2 pt-3">
      <Button size="sm" className="w-full" onClick={goToClinical}>
        <FileText className="mr-2 h-4 w-4" />
        Ficha Clinica
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={goToEdit}>
          <Edit className="mr-1.5 h-3.5 w-3.5" />
          Editar
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-destructive"
                onClick={confirmDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Eliminar
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

### 3.4. CSS adicional necesario

```css
/* En index.css o como utility de Tailwind */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

### 3.5. Dots de paginacion (opcional, recomendado)

Indicador visual de cuantas tarjetas hay y cual esta activa:

```tsx
// Detectar tarjeta activa via IntersectionObserver o scroll position
<div className="flex justify-center gap-1.5 mt-3 md:hidden">
  {pets.map((_, i) => (
    <div key={i}
         className={`h-1.5 rounded-full transition-all ${
           i === activeIndex ? "w-6 bg-purple-500" : "w-1.5 bg-muted-foreground/30"
         }`} />
  ))}
</div>
```

---

## 4. Comparacion antes / despues

### 4.1. Metricas de viewport mobile (iPhone 13)

| Metrica | Antes | Despues |
|---|---|---|
| Alto de 1 tarjeta | ~600px | ~270px |
| Mascotas visibles sin scroll | 1 (parcial) | 1 completa + peek de otra |
| Orientacion de descubrimiento | Vertical (scroll) | Horizontal (swipe) |
| Tiempo para ver 3ra mascota | ~2 scrolls | 2 swipes |
| CTA "Ficha Clinica" visible | No (al fondo) | Si (siempre visible) |

### 4.2. Que se gana

- **Descubrimiento rapido.** El swipe horizontal es mas natural en mobile para navegar entre items del mismo tipo.
- **Ficha Clinica siempre accesible.** Al reducir la tarjeta, el boton principal queda siempre visible.
- **Menos sobrecarga cognitiva.** Solo datos de identificacion, no un formulario completo.
- **Mas espacio para el memorial.** La seccion memorial queda visible sin scrollear tanto.

### 4.3. Que se pierde (y donde se recupera)

- **Metadata completa (tamano, color, personalidad, bio).** Se ve al entrar a Ficha Clinica o Editar.
- **BreedTips en la tarjeta.** Se puede mover a la vista de ficha clinica.
- **Imagen hero grande (h-48).** Se reemplaza por avatar circular que es mas compacto pero igualmente identificable.

---

## 5. Responsive breakpoints

| Viewport | Layout | Tarjeta |
|---|---|---|
| **< 640px (mobile)** | Carrusel horizontal, snap, 75vw por tarjeta | Compacta con avatar centrado |
| **640-767px (sm)** | Carrusel horizontal, 60vw por tarjeta | Igual |
| **768-1023px (md)** | Grid 2 columnas | Compacta |
| **1024-1279px (lg)** | Grid 3 columnas | Compacta |
| **>= 1280px (xl)** | Grid 4 columnas | Compacta |

---

## 6. Variante alternativa: tarjetas horizontales apiladas

Si el carrusel horizontal no convence, una alternativa valida es **tarjetas horizontales compactas apiladas verticalmente**:

```
┌─────────────────────────────────┐
│ ┌──────┐  Kai                   │
│ │ Foto │  Pastor Suizo · 2 anos │
│ │64x64 │  [Ficha] [Edit] [Del] │
│ └──────┘                        │
├─────────────────────────────────┤
│ ┌──────┐  Luna                  │
│ │ Foto │  Gato criollo · 1 ano  │
│ │64x64 │  [Ficha] [Edit] [Del] │
│ └──────┘                        │
└─────────────────────────────────┘
```

**Alto por tarjeta: ~80-100px.** Se veran 6-7 mascotas sin scroll. Pero pierde el impacto visual del carrusel. Recomendado solo si el usuario tiene 10+ mascotas.

---

## 7. Caso especial: 1 sola mascota

Cuando el usuario tiene solo 1 mascota (caso mas comun en plan Gratis, limite de 2):

- **Mobile:** la tarjeta se centra sin carrusel. Se puede mostrar ligeramente mas grande (80vw).
- **Desktop:** la tarjeta se muestra centrada con max-w, no en grid.
- **Opcion:** mostrar un card fantasma "Agrega otra mascota" como segunda tarjeta deslizable para incentivar engagement.

```
┌──────────┐  ┌──────────┐
│          │  │   + Add   │
│   Kai    │  │  Agrega   │
│  P.Suizo │  │   otra    │
│  [Ficha] │  │  mascota  │
│          │  │           │
└──────────┘  └──────────┘
```

---

## 8. Plan de implementacion

### Fase 1 — Tarjeta compacta (1 commit)

1. Extraer `PetCardCompact` como componente en `src/components/PetCardCompact.tsx`.
2. Reducir contenido a: avatar + nombre + badge especie + raza + edad/genero + botones.
3. Mover BreedTips fuera de la tarjeta.
4. Reemplazar imagen `h-48` por avatar `h-24 w-24`.

### Fase 2 — Carrusel mobile (mismo commit o siguiente)

1. Agregar contenedor con `overflow-x-auto snap-x` en mobile.
2. Agregar clase `scrollbar-hide` a `index.css`.
3. Mantener grid en desktop con la nueva tarjeta compacta.
4. Agregar dots de paginacion.
5. Agregar card fantasma "Agregar mascota" al final del carrusel.

### Fase 3 — Pulido (siguiente commit)

1. Animacion de entrada (fade-in por tarjeta con delay escalonado).
2. Sombra suave calida en tarjeta activa.
3. Skeleton loading adaptado al nuevo layout.
4. Revisar memorial section con el nuevo espacio ganado.

---

## 9. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/MyPets.tsx` | Reemplazar grid por carrusel mobile + grid desktop, usar PetCardCompact |
| `src/components/PetCardCompact.tsx` | **Nuevo** — tarjeta compacta extraida |
| `src/index.css` | Agregar `.scrollbar-hide` utility |

**No se tocan:**
- Rutas (`App.tsx`)
- Componentes UI base (`ui/card.tsx`, `ui/button.tsx`)
- Logica de fetch/delete (se mantiene identica en MyPets.tsx)
- Seccion memorial (se mantiene, solo se beneficia del espacio ganado)

---

## 10. Checklist de validacion

**Mobile:**
- [ ] Tarjetas se deslizan horizontalmente con snap.
- [ ] Se ve un peek de la siguiente tarjeta (incentiva swipe).
- [ ] Boton "Ficha Clinica" visible sin scroll dentro de la tarjeta.
- [ ] Dots de paginacion reflejan la tarjeta activa.
- [ ] Sin scroll horizontal accidental fuera del carrusel.
- [ ] Card fantasma "Agregar mascota" aparece al final.
- [ ] Tap targets minimo 44x44px.
- [ ] Con 1 sola mascota se centra correctamente.

**Desktop:**
- [ ] Grid de 3-4 columnas con tarjetas compactas.
- [ ] Hover effects en tarjetas.
- [ ] Espaciado uniforme entre tarjetas.

**Funcional:**
- [ ] Editar navega a `/edit-pet/:id`.
- [ ] Ficha Clinica navega a `/pet/:id/clinical`.
- [ ] Eliminar abre el AlertDialog de confirmacion.
- [ ] Agregar Mascota respeta el limite del plan (useCanAddPet).
- [ ] Loading skeleton adaptado al nuevo layout.
- [ ] Empty state se mantiene identico.

---

**Fin del blueprint.**
