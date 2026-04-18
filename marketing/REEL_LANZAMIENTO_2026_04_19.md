# Reel de lanzamiento Paw Friend — guion ejecutable

> **Fecha de ejecucion**: sabado 2026-04-19 (1 dia full).
> **Objetivo**: 1 reel cinematografico de 20-30s para Instagram Reels + TikTok + YouTube Shorts. Eje narrativo: la **ficha clinica PDF** y el **directorio de vets** (joya de la corona).
> **Audiencia**: duenos de mascotas en Chile (Santiago + regiones), 25-45 anios, smartphones iPhone/Android.
> **CTA**: `pawfriend.cl` (link en bio + sticker).
> **Presupuesto target**: USD 50-90 (1 mes de herramientas, cancelable despues del lanzamiento).

---

## 0. Resumen ejecutivo (TL;DR)

1. Manana en la manana (08:00-10:00): contratar las 3 herramientas pagas (Kling AI, ElevenLabs, CapCut Pro) y preparar assets.
2. Mediodia (10:00-13:00): generar 6 clips IA (logo reveal + 5 escenas) en Kling AI.
3. Tarde (14:00-17:00): voiceover en ElevenLabs, musica en Suno, edicion en CapCut.
4. Noche (17:00-19:00): exportar 3 versiones (9:16 vertical, 1:1 cuadrado, captions ES-CL), publicar.
5. Toda la semana: medir y duplicar lo que funcione.

---

## 1. Pre-vuelo: cuentas y herramientas (USD 50-90, todo cancelable)

| Herramienta | Para que | Plan | Costo | Link |
|---|---|---|---|---|
| **Kling AI 2.0 Master** | Video AI cinematografico (5s clips, 1080p) | Standard 660 creditos | USD 10/mes | klingai.com |
| **ElevenLabs** | Voz en off espanol chileno (locutora natural) | Starter | USD 5/mes | elevenlabs.io |
| **Suno v4** | Musica original (sin copyright strikes) | Pro | USD 10/mes | suno.com |
| **CapCut Pro** | Edicion final, captions auto, efectos | Pro mensual | USD 7.99/mes | capcut.com |
| **Canva Pro** *(opcional)* | Logo reveal animado, thumbnails | Pro | USD 14.99/mes | canva.com |
| **Runway Gen-3** *(plan B si Kling falla)* | Alternativa video AI | Standard | USD 15/mes | runwayml.com |

**Total minimo**: USD 33/mes. **Total recomendado** (con Canva): USD 48/mes. **Plan B con Runway**: USD 63/mes.

> Tip: contrata todo HOY mismo (08:00) para tener creditos y poder regenerar si algo sale mal. Cancela en 7 dias si no vas a hacer mas reels.

---

## 2. Assets que YA tenemos (no hay que generar de cero)

Todos en `public/` o `src/assets/`:

| Asset | Path | Uso en reel |
|---|---|---|
| Logo principal SVG | `public/paw_friend_icon_principal.svg` | Logo reveal, intro |
| Wordmark horizontal | `public/paw_friend_wordmark_horizontal.svg` | Outro / lower third |
| Icono favicon | `public/favicon.svg` | Sticker en captions |
| OG image 1200x630 | `public/og-image.jpg` | Frame final con CTA |
| OG social | `public/social_og_image_1200x630.png` | Cuadrado 1:1 |
| Hero pets | `src/assets/hero-pets.jpg` | Background opcional |
| Foto perro real | `src/assets/dog-profile-1.jpg` | B-roll |
| Foto gato real | `src/assets/cat-profile-1.jpg` | B-roll |
| Pet friendly place | `src/assets/pet-friendly-place.jpg` | B-roll directorio |

**Falta generar**: 1 PDF de ficha clinica de ejemplo (con datos ficticios). Lo sacas mockeando con Kai en `pawfriend.cl/ficha/<petId>` y descargando el PDF — usa una sesion personal, no produccion.

---

## 3. Concepto y guion (20-25 segundos)

### Big idea
**"Tu perro no puede contarte que le duele. Pero su ficha si."**

Toca dolor real (perdiste el carnet de vacunas, llegas al vet sin info, urgencia veterinaria a las 3am). Resuelve con la ficha clinica PDF + directorio de vets.

### Estructura narrativa (formato hook-problema-solucion-CTA)

| Segundo | Escena | Audio | Texto en pantalla |
|---|---|---|---|
| 0.0-2.5 | **HOOK**: primer plano ojos de perro mirando a camara, lento zoom in | Latido de corazon + voz: *"Tu perro no puede decirte que le duele."* | (ninguno, full visual) |
| 2.5-5.0 | **PROBLEMA 1**: cajon abierto con carnets de vacunas viejos, manos buscando frustradas | Sound design: papeles, sirena lejana | *"¿Donde esta el carnet?"* |
| 5.0-7.5 | **PROBLEMA 2**: pantalla telefono buscando "veterinario urgencia" en Google a las 3am | Glitch UI, ringtone | *"Una urgencia. Sin info."* |
| 7.5-10.0 | **TRANSICION + LOGO**: logo Paw Friend aparece con efecto holo (gradiente cyan→magenta), fondo oscuro a luz | Whoosh + acorde brillante | *"Paw Friend"* |
| 10.0-14.0 | **SOLUCION 1**: mockup phone con app abierta, ficha clinica PDF generandose, swipe a pantalla "Compartir" | Beat sube | *"Ficha clinica completa. En PDF. En 3 segundos."* |
| 14.0-17.0 | **SOLUCION 2**: mapa con pins de vets verificados, zoom a perfil de vet con rating | Beat | *"+1.000 vets en Chile, verificados."* |
| 17.0-20.0 | **PRUEBA SOCIAL**: foto real de Kai (pastor suizo) corriendo feliz | Beat baja | *"Por Kai. Por todos."* |
| 20.0-24.0 | **CTA**: logo + URL + paw print animado | Outro suave | *"pawfriend.cl — gratis"* |

### Voice over (espanol chileno, NO neutro)
> "Tu perro no puede decirte que le duele. Pero su ficha clinica si. Paw Friend: la historia medica de tu mascota, en PDF, lista para compartir con cualquier veterinario en Chile. Descargala gratis en pawfriend.cl."

**Tono**: calido, cercano, no comercial. Tutea ("descargala", no "descarguela"). Pausa entre frases.

---

## 4. Flujo de produccion paso a paso (sabado 2026-04-19)

### BLOQUE A — 08:00-10:00: setup y assets

1. **Contratar herramientas** (10 min): Kling, ElevenLabs, Suno, CapCut. Anota passwords en gestor.
2. **Descargar assets del repo** (10 min): copiar los 9 archivos de la tabla seccion 2 a una carpeta `~/Desktop/reel_paw_friend/assets/`.
3. **Generar PDF de ejemplo** (15 min):
   - Logueate en `pawfriend.cl` con tu cuenta.
   - Entra a la ficha de Kai → "Descargar PDF".
   - Guarda como `ficha_demo.pdf` en la carpeta.
4. **Capturar pantallas de la app** (45 min): grabar pantalla del iPhone/Android navegando:
   - Home con Kai.
   - Ficha clinica abierta (mostrar vacunas, antiparasitarios, peso).
   - Boton "Generar PDF" → animacion → PDF abierto.
   - Pantalla "Compartir" con link `medical-share/...`.
   - Mapa de `/veterinarios` con pins.
   - Perfil de vet con rating + boton "Reservar".
   - **Tip**: usa modo no molestar, oculta barra de notificaciones, cargador al 100%.
5. **Tomar 1 foto fresca de Kai** (20 min): luz natural, primer plano cara, fondo desenfocado. Lo usaremos en el frame "Por Kai".

### BLOQUE B — 10:00-13:00: generacion AI con Kling

Genera 6 clips de 5 segundos cada uno. **Orden de prompts** (copia-pega en Kling):

#### Clip 1 — Hook ojos de perro
```
Cinematic close-up shot of a Swiss Shepherd dog's eyes looking directly into camera, soft golden hour lighting, shallow depth of field, slow zoom in, emotional, melancholic mood, 4K hyperrealistic, film grain, vertical 9:16
```
Duracion: 5s. Modo: Master. Si el perro no se ve confiable, sube tu foto de Kai como referencia (Kling permite image-to-video).

#### Clip 2 — Cajon con papeles
```
Top-down shot of hands frantically searching through a messy drawer full of old vet vaccination cards, papers scattered, anxiety-inducing, dim lighting, vertical 9:16, cinematic
```

#### Clip 3 — Pantalla telefono urgencia
```
Close-up of smartphone screen at night, person's hand searching "veterinario urgencia santiago" on Google, screen glow on face, blurred bedroom background, 3am vibe, vertical 9:16
```

#### Clip 4 — Logo reveal
**MEJOR opcion**: hazlo en **Canva Pro** o **CapCut** con el SVG. Razones:
- Mas control sobre fidelidad de marca.
- Kling no respeta logos custom bien.

Receta CapCut:
1. Importa `paw_friend_icon_principal.svg`.
2. Aplica efecto **"Holo Glow"** (en CapCut Pro store, gratis).
3. Anade **"Particle reveal"** detras.
4. Color overlay: gradiente cyan `#06b6d4` → magenta `#d946ef` (paleta Paw Friend).
5. Duracion 2.5s. Termina con wordmark `paw_friend_wordmark_horizontal.svg` apareciendo abajo.

#### Clip 5 — Mockup app generando PDF
Usa la grabacion de pantalla del Bloque A. Mejorala con CapCut:
- Acelera 1.5x.
- Anade **"Phone mockup"** frame de CapCut.
- Sound effect "swoosh" cuando aparece el PDF.

#### Clip 6 — Mapa con pins
Tambien grabacion real, no AI. Acelera 2x el zoom hacia un pin.

#### Clip 7 — Foto Kai feliz
Foto que sacaste + en CapCut anade **"Ken Burns"** (zoom suave).

### BLOQUE C — 13:00-14:00: pausa, almuerzo, revisar clips

Mira los 7 clips en bruto. Si alguno no convence, regenera AHORA (Kling permite reintentos con creditos).

### BLOQUE D — 14:00-15:30: voz y musica

1. **ElevenLabs** (30 min):
   - Voz: prueba "Sofia" (espanol latino) o clona la tuya con 1 min de muestra.
   - Pega el script de la seccion 3.
   - Ajusta: stability 50%, similarity 75%, style 30%.
   - Genera, escucha, regenera si suena robotico.
   - Descarga MP3.

2. **Suno** (30 min):
   - Prompt: `cinematic emotional pet commercial music, soft piano intro, building strings and warm synth, hopeful uplifting ending, 25 seconds, no vocals, latin warmth`
   - Genera 4 versiones (Suno te da 2 por intento, haz 2 intentos).
   - Elige la mejor. Descarga WAV.

3. **Sound effects** (15 min): bajalos gratis de **Pixabay Sounds** o **Freesound**:
   - `heartbeat-soft.mp3`
   - `paper-rustle.mp3`
   - `notification-glitch.mp3`
   - `whoosh-cinematic.mp3`
   - `magic-chime-bright.mp3`

4. **Plan B**: si no quieres pagar Suno, usa **Epidemic Sound** trial gratis 7 dias o **YouTube Audio Library** (royalty-free).

### BLOQUE E — 15:30-17:30: edicion en CapCut

Plantilla de timeline:

```
Track 1 (video):  [Clip1 ojos][Clip2 cajon][Clip3 phone][Clip4 logo][Clip5 PDF][Clip6 mapa][Clip7 Kai][outro logo]
Track 2 (texto):                                                                                       captions ES-CL
Track 3 (sfx):    heartbeat   paper       glitch       whoosh      swoosh    -           -            chime
Track 4 (musica): -------------------- musica Suno fade in -> peak en logo -> sostiene -> fade out --------
Track 5 (voz):    --- voz en off ElevenLabs alineada con segundos del guion ---
```

**Detalles criticos**:
- **Captions**: usa "Auto captions" de CapCut → idioma espanol → revisa palabra por palabra (suele inventarse). Tipografia: **Montserrat Bold** o **Poppins Black**, color blanco con sombra negra. Tamano 50-60pt. Posicion: tercio inferior, NO sobre la cara.
- **Color grade**: aplica preset "Cinematic Warm" en CapCut. Sube saturacion +10, contraste +15.
- **Transiciones**: solo "Cut" duro o "Whip pan" entre clips. NUNCA dissolve (se ve aficionado).
- **Beat drop**: alinea la aparicion del logo con el primer "drop" musical.
- **Watermark**: NO anadir watermark de CapCut. Pago Pro lo quita.

### BLOQUE F — 17:30-19:00: export + publicacion

1. **Export 1 — Reels/TikTok 9:16**:
   - 1080x1920, 30fps, H.264, bitrate 12 Mbps, MP4.
   - Guardar como `paw_friend_reel_v1_vertical.mp4`.

2. **Export 2 — Feed Instagram 1:1**:
   - 1080x1080, mismo bitrate.
   - Recortar pero conservar caras y captions.
   - Guardar como `paw_friend_reel_v1_square.mp4`.

3. **Export 3 — YouTube Shorts**:
   - Mismo 9:16 que Reels (sirve sin cambios).

4. **Subir** (en este orden):
   - **Instagram Reels** primero (mejor algoritmo en Chile).
   - **TikTok** 30 min despues.
   - **YouTube Shorts** 1h despues.
   - **Stories Instagram + Facebook** con sticker "ver mas" → link `pawfriend.cl`.

---

## 5. Copy para descripcion (igual en las 3 plataformas)

```
Tu perro no puede decirte que le duele. Pero su ficha clinica si 🐾

Paw Friend te permite tener TODO el historial medico de tu mascota en un PDF que puedes compartir con cualquier vet en Chile. Vacunas, alergias, medicamentos, peso, todo.

Es 100% gratis. Hecho en Chile, por duenos para duenos.

👉 pawfriend.cl

#mascotaschile #perroschile #gatoschile #veterinariochile #santiagochile #petlovers #fichaclinica #pawfriend #amopalasmascotas
```

**Hashtags**: usar 8-12, mezcla nicho (#fichaclinica) + amplios (#mascotaschile). NO usar #fyp ni #parati (penalizan en Chile).

---

## 6. Distribucion semana 1 (post-publicacion)

| Dia | Accion |
|---|---|
| Sab 19 | Publicar reel + responder TODOS los comentarios primeras 2h |
| Dom 20 | Re-postear en Stories, etiquetar 5 cuentas vet/mascotas chilenas |
| Lun 21 | Compartir reel en grupos Facebook ("Mascotas Chile", "Perdidos y encontrados Stgo") |
| Mar 22 | Si hay >500 views → boostear con USD 5-10 en Meta Ads (target Chile, 25-45, interes mascotas) |
| Mie 23 | Generar version corta 10s con hook diferente, A/B test |
| Jue 24 | Pedir a Sofia (vet beta) que lo comparta en sus stories |
| Vie 25 | Revisar metricas, decidir si hacemos reel #2 |

**KPI minimos para considerar exitoso**:
- Reels IG: 5.000 views, 50 saves, 20 comentarios.
- TikTok: 10.000 views, 100 likes.
- Conversion: 50 visitas nuevas a `pawfriend.cl` desde social.

---

## 7. Errores que NO podemos cometer

- ❌ **Voz neutra latino** (sueña a empresa argentina). Usar tuteo chileno: "descargala", "tu perro", "tienes".
- ❌ **Logos genericos AI**. Logo siempre desde el SVG real, nunca generado.
- ❌ **Mostrar UI desactualizada**. Si grabas pantalla, asegurate que esta en la ultima version desplegada.
- ❌ **Datos reales de usuarios**. El PDF de demo debe ser con Kai (datos tuyos), nunca con clientes.
- ❌ **Musica con copyright**. Solo Suno/Epidemic/YouTube Library.
- ❌ **Captions con typos**. Revisa palabra por palabra. CapCut auto-captions confunde "vet" con "ver".
- ❌ **Olvidar el CTA**. Cada plataforma necesita link en bio actualizado a `pawfriend.cl`.
- ❌ **Publicar sin testear sonido**. Mira el reel con audifonos Y sin audio (75% de Reels se ve sin sonido — captions deben contar la historia solos).

---

## 8. Plan B (si algo falla)

| Si falla... | Plan B |
|---|---|
| Kling no genera bien la cara del perro | Usa solo grabaciones reales + foto de Kai + Canva animations |
| ElevenLabs suena robotico | Grabate con el iPhone (modo avion + buen mic), edita en CapCut |
| Suno no convence | YouTube Audio Library: buscar "cinematic emotional acoustic" |
| CapCut crashea con muchos clips | Edita en **DaVinci Resolve** (gratis) o **Premiere Rush** (USD 10/mes) |
| Internet lento sabado | Renderiza overnight viernes, usa el sabado solo para edicion |

---

## 9. Checklist final antes de publicar

- [ ] Reel exportado en 9:16 1080x1920 30fps
- [ ] Captions revisados sin typos, en chileno
- [ ] Audio nivelado (voz -6dB, musica -18dB, sfx -12dB)
- [ ] Logo aparece minimo 2 veces (intro + outro)
- [ ] CTA `pawfriend.cl` visible los ultimos 4 segundos
- [ ] No hay datos de usuarios reales (solo Kai)
- [ ] Bio de Instagram actualizada con link `pawfriend.cl`
- [ ] Bio de TikTok actualizada
- [ ] Programado horario optimo: 19:00-21:00 hora Chile (peak engagement)
- [ ] Backup del proyecto CapCut guardado (puedes reusar para reel #2)

---

## 10. Costos totales

| Concepto | Costo USD | Costo CLP aprox |
|---|---|---|
| Kling AI 1 mes | 10 | 9.500 |
| ElevenLabs 1 mes | 5 | 4.700 |
| Suno 1 mes | 10 | 9.500 |
| CapCut Pro 1 mes | 8 | 7.500 |
| Canva Pro (opcional) | 15 | 14.000 |
| Meta Ads boost (opcional) | 10 | 9.500 |
| **Total recomendado** | **48** | **~45.000 CLP** |
| **Total minimo (sin Canva ni ads)** | **33** | **~31.000 CLP** |

> Despues del lanzamiento, cancela las suscripciones que no vayas a usar mas. Solo Kling + Suno + CapCut tiene sentido mantener si vas a hacer 2-4 reels al mes.

---

## 11. Que sigue despues del reel #1

Si funciona (>5K views), reproducir formula con:
1. **Reel #2**: testimonio real de un vet (Sofia?) hablando de la app. Mas simple, sin AI.
2. **Reel #3**: tutorial 30s "Como agregar tu mascota en 3 pasos".
3. **Reel #4**: dolor B2B "Vets, dejen de perder pacientes por agenda de papel".
4. **Carrusel IG**: mismas escenas pero como 10 slides estaticas (alimenta feed).

Documentar aprendizajes en `marketing/REEL_LEARNINGS_<fecha>.md` para iterar.

---

**Fin del plan.** Manana ejecutamos. Cualquier duda durante la produccion, abre conversacion nueva con Claude Code y referencia este archivo.
