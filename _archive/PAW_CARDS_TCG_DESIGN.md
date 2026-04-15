# Paw Cards TCG — Guia de Diseno Visual

> Referencia de diseno para las Paw Cards coleccionables de Paw Friend.
> Inspirado en Pokemon TCG, Yu-Gi-Oh!, cartas holograficas premium y cartas deportivas de alta gama.
> Actualizado: 2026-04-12.

---

## 1. Filosofia de diseno

Las Paw Cards son la identidad visual unica de cada mascota en Paw Friend. Deben sentirse como una **carta coleccionable fisica premium** que el usuario quiere mostrar, compartir y coleccionar.

### Principios clave
- **Tactil**: la carta debe sentirse "real" — con peso visual, bordes metalicos, y respuesta al movimiento (tilt 3D, giroscopio)
- **Coleccionable**: cada carta es unica gracias a la combinacion de rareza + patron holografico + datos de la mascota
- **Sorpresa**: el reveal de patron holografico al crear una mascota genera emocion tipo "abrir un sobre de cartas"
- **Mobile-first**: optimizada para pantallas tactiles, swipe, y orientacion del dispositivo

---

## 2. Anatomia de la carta (Frente)

```
+--[BORDE METALICO ANIMADO (rareza)]-------+
|                                           |
|  +--[INNER CARD]------------------------+|
|  |                                       ||
|  |  [RARITY BADGE]        [PAW POINTS]   ||
|  |                                       ||
|  |  +--[FRAME DECORATIVO]-----------+    ||
|  |  |                               |    ||
|  |  |   +---[AVATAR RING]---+       |    ||
|  |  |   |                   |       |    ||
|  |  |   |    FOTO MASCOTA   |       |    ||
|  |  |   |                   |       |    ||
|  |  |   +-------------------+       |    ||
|  |  |                               |    ||
|  |  +-------------------------------+    ||
|  |                                       ||
|  |  [NOMBRE]  [ESPECIE BADGE]            ||
|  |  [RAZA]                               ||
|  |  [EDAD · GENERO]                      ||
|  |                                       ||
|  |  [=== FICHA CLINICA BTN ===]          ||
|  |  [EDITAR]  [ELIMINAR]                ||
|  |                                       ||
|  +--- HOLO OVERLAY + SHINE + SPARKLES ---+|
|                                           |
+-------------------------------------------+
```

### 2.1. Borde metalico (outer frame)

El borde es el indicador principal de rareza. Usa gradientes animados que simulan metal pulido:

| Rareza | Colores | Velocidad animacion | Grosor |
|---|---|---|---|
| Comun | Bronce (#cd7f32, #e8c07a, #b87333) | 10s | 5px |
| Poco Comun | Plata (#c0c0c0, #e8e8e8, #a8a8a8) | 7s | 5px |
| Raro | Oro (#ffd700, #ffa500, #ffec8b) | 5s | 5px |
| Epico | Prismatico (#00ced1, #7b68ee, #da70d6) | 4s | 5px |
| Legendario | Fuego (#ff4500, #ff6347, #ffd700) | 3s | 6px |
| Mitico | Aurora boreal (rainbow completo) | 2s | 6px |

### 2.2. Superficie interior (inner card)

Fondo con gradientes sutiles que dan profundidad:
- **Light mode**: Gradiente radial multi-capa con tonos lavanda, rosa palido y blanco. Un sutil patron de energia tipo Pokemon en los bordes.
- **Dark mode**: Tonos purpura oscuro con destellos.
- Las rarezas altas (epic+) agregan un brillo ambiental sutil al fondo que responde al cursor/giroscopio.

### 2.3. Frame decorativo del avatar

El avatar tiene un ring de color segun rareza, con sombra coherente:
- Comun: ring bronce
- Poco Comun: ring plata
- Raro: ring dorado
- Epico+: ring animado con glow

### 2.4. Capas de efecto (overlays)

Apiladas en orden z-index ascendente:
1. **Holo pattern** (z:1) — patron holografico segun sorteo (huellas, estrellas, corazones, etc.)
2. **Rainbow overlay** (z:2) — gradiente radial que sigue el cursor, simula refraccion de luz
3. **Sparkle texture** (z:1) — puntos de brillo que parpadean
4. **Shine sweep** (z:3) — barrido diagonal de luz en hover

---

## 3. Anatomia de la carta (Reverso)

```
+--[BORDE METALICO ANIMADO (misma rareza)]--+
|                                            |
|  +--[BACK SURFACE (purpura oscuro)]------+|
|  |                                        ||
|  |       [LOGO PAW FRIEND]               ||
|  |                                        ||
|  |  +--[QR FRAME]------------------+     ||
|  |  |                              |     ||
|  |  |        CODIGO QR             |     ||
|  |  |    (escanea y colecciona)    |     ||
|  |  |                              |     ||
|  |  +------------------------------+     ||
|  |                                        ||
|  |  "ESCANEA PARA COLECCIONAR"           ||
|  |  Paw Card #PAW-XXXX-XXXX             ||
|  |  [Nombre · Especie]                   ||
|  |  [HOLO TIER BADGE]                    ||
|  |                                        ||
|  |  [COMPARTIR]  [ID]                    ||
|  |                                        ||
|  +--- WATERMARK + HOLO MUTED + SHINE ---+|
|                                            |
+--------------------------------------------+
```

### 3.1. Superficie trasera

- Fondo: gradiente oscuro purpura profundo (#1a0533 → #2d1b4e)
- Watermark: patron de huellas repetido al 6% opacidad
- Shine: gradiente radial que sigue el cursor (screen blend mode)
- El **mismo borde de rareza** del frente debe ser visible

### 3.2. QR Code

- Color: purpura (#7C3AED) sobre fondo blanco
- Tamano: 120px con margen interno
- Icono de paw embebido en el centro
- Marco decorativo con glow sutil

---

## 4. Patrones holograficos

9 patrones con probabilidades de aparicion (sorteo al crear mascota):

| Patron | ID | Probabilidad | Tier | Efecto visual |
|---|---|---|---|---|
| Clasica | holo-none | 34% | Standard | Solo watermark sutil |
| Huellas Holo | holo-paws | 20% | Standard | Grid de huellas con drift horizontal |
| Starlight | holo-stars | 15% | Standard | Puntos de luz que parpadean |
| Heart Burst | holo-hearts | 10% | Standard | Corazones con pulso |
| Diamond Dust | holo-diamonds | 8% | Rare | Grid de diamantes cristalinos |
| Ocean Wave | holo-waves | 5% | Rare | Lineas ondulantes con drift |
| Phoenix Flame | holo-fire | 4% | Rare | Gradiente de llama desde abajo |
| Galaxy Swirl | holo-galaxy | 3% | Ultra-Rare | Espiral conica con multiples colores |
| Full Rainbow | holo-rainbow | 1% | Ultra-Rare | Arcoiris completo animado |

### Comportamiento de patrones
- **Hover**: Los patrones se hacen visibles (opacity 0 → 1)
- **Legendary/Mythic**: Patrones siempre visibles (no necesitan hover)
- **Ultra-Rare**: Efecto de brillo extra + saturacion aumentada en hover

---

## 5. Interaccion 3D

### 5.1. Desktop (mouse)
- **Tilt**: La carta rota hasta ±12° en ambos ejes siguiendo el cursor
- **Glow**: Un punto de luz sigue la posicion del cursor sobre la carta
- **Reset**: Al salir del area, vuelve suavemente a posicion neutral

### 5.2. Mobile (touch + giroscopio)
- **Giroscopio**: Lee DeviceOrientationEvent para inclinar la carta con el movimiento fisico del telefono
- **Normalizacion**: beta/gamma mapeados a rango -1..1, aplicados a CSS vars
- **Swipe**: Swipe horizontal (>60px) voltea la carta

### 5.3. Flip (voltear carta)
- **Click/tap**: Tocar cualquier parte de la carta la voltea (frente ↔ reverso)
- **Transicion**: rotateY(180deg) con cubic-bezier bounce (0.6s)
- **Perspectiva**: 800px para efecto 3D convincente
- **Backface**: Hidden en ambas caras para evitar transparencia

---

## 6. Reveal animation (abrir sobre)

Cuando el usuario crea una nueva mascota, se muestra una animacion de reveal:

1. **Fase 1 — Sobre**: Sobre purpura con logo Paw Friend (0-800ms)
2. **Fase 2 — Apertura**: La solapa del sobre se abre con rotateX 3D (800ms)
3. **Fase 3 — Emerge**: La carta sale del sobre con scale + translate (800-1600ms)
4. **Fase 4 — Flash**: Destello de luz segun tier (standard/rare/ultra-rare) (500ms)
5. **Fase 5 — Resultado**: Se muestra el patron obtenido con badge y probabilidad

- Ultra-rare: sparkles extras + flash dorado/rosa
- Se puede skipear tocando en cualquier parte

---

## 7. Paleta de colores

### Colores base
| Uso | Light | Dark |
|---|---|---|
| Card surface | #FFFFFF con gradientes lavanda | hsl(270 15% 10%) con gradientes purpura |
| Text primary | Gradiente purpura (#3B1A5E → #4A2065) | Gradiente lavanda (#C4B5FD → #D8B4FE) |
| Text secondary | muted-foreground | muted-foreground |
| Back surface | #1a0533 → #2d1b4e | (mismo) |
| QR | #7C3AED | (mismo) |

### Colores de rareza
| Rareza | Primario | Secundario | Sombra |
|---|---|---|---|
| Comun | #cd7f32 (bronce) | #e8c07a | rgba(205,127,50,0.3) |
| Poco Comun | #c0c0c0 (plata) | #e8e8e8 | rgba(192,192,192,0.35) |
| Raro | #ffd700 (oro) | #ffa500 | rgba(255,215,0,0.35) |
| Epico | #7b68ee (prisma) | #00ced1 | rgba(123,104,238,0.35) |
| Legendario | #ff4500 (fuego) | #ffd700 | rgba(255,69,0,0.4) |
| Mitico | #ff0080 (aurora) | multi-rainbow | rgba(139,92,246,0.4) |

### Colores de tier holografico
| Tier | Badge BG | Badge text | Badge border |
|---|---|---|---|
| Standard | purple 20% | lavanda | purple 30% |
| Rare | cyan 20% | cyan claro | cyan 30% |
| Ultra-Rare | gradient rosa→dorado | dorado | dorado 40% |

---

## 8. Tipografia en las cartas

| Elemento | Tamano | Peso | Estilo |
|---|---|---|---|
| Nombre mascota | 18px (text-lg) | Bold (700) | Gradient clip |
| Especie badge | 10px | Semibold (600) | Uppercase tracking-wider |
| Raza | 14px (text-sm) | Medium (500) | Normal |
| Edad/genero | 12px (text-xs) | Normal | Muted |
| Rarity badge | 9px | Bold (700) | Uppercase 0.1em tracking |
| Paw Points | 12px (text-xs) | Bold (700) | Tabular-nums |
| Card ID (back) | 10px | Mono | Muted purple |

---

## 9. Responsive y mobile

### Tamanos de carta
| Viewport | Ancho carta | Layout |
|---|---|---|
| Mobile (<640px) | ~280px | Carousel horizontal (snap) |
| Tablet (640-1024px) | ~300px | Grid 2 columnas |
| Desktop (>1024px) | ~320px | Grid 3+ columnas |

### Touch targets
- Toda la carta es area tactil para voltear (min 280x400px)
- Botones de accion: min 44px alto (WCAG touch target)
- Swipe horizontal: umbral 60px para voltear

### Performance
- Animaciones CSS puras (no JS intervals)
- `will-change: transform` solo en el wrapper principal
- `backface-visibility: hidden` para optimizar el flip 3D
- Giroscopio usa `requestAnimationFrame` para smooth 60fps

---

## 10. Accesibilidad

- `aria-label="Voltear carta"` en el area clickeable
- `role="button"` + `tabindex="0"` para navegacion por teclado
- `prefers-reduced-motion`: desactivar animaciones de float, shift y drift
- Contraste minimo 4.5:1 en texto sobre fondos de carta
- Focus visible con ring 2px en el card container

---

## 11. Referencia visual — Pokemon TCG

Elementos inspirados de Pokemon TCG adaptados a mascotas:

| Pokemon TCG | Paw Card | Adaptacion |
|---|---|---|
| Tipo de energia (fuego, agua, etc.) | Especie (perro, gato, etc.) | Badge de especie |
| HP | Paw Points | Score de bienestar 0-100 |
| Ilustracion | Foto de mascota | Avatar circular con ring |
| Rareza (circle, diamond, star) | Rareza (comun→mitico) | Badge + borde animado |
| Holo/Reverse holo | Patron holografico | 9 patrones con sorteo |
| Set symbol | Logo Paw Friend | Watermark + logo en reverso |
| Card number | Paw Card ID | PAW-XXXX-XXXX unico |

---

## 12. Futuro (ideas sin implementar)

- **Evolucion visual**: la carta cambia de aspecto al subir de rareza (new ring effects, particle systems)
- **Cartas shiny**: variante extra-rara con efecto mirror chrome
- **Cartas de edicion limitada**: eventos especiales (Navidad, Halloween) con frames unicos
- **Trading**: intercambio de cartas entre usuarios
- **Album fisico**: exportar cartas como PNG/PDF para imprimir
- **Sonido**: efecto de sonido al revelar patron holografico
