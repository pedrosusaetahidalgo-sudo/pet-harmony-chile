# Custom Assets — Voice Cloning + Midjourney

Con los planes pagos (ElevenLabs Pro + Midjourney Basic) podés reemplazar
la voz genérica y las fotos de Pexels por assets custom del brand.

---

## 1. Voice Cloning en ElevenLabs Pro (15 min)

Resultado: el pipeline narra con **tu propia voz clonada**. Diferenciador
gigante vs cualquier app pet que usa actores.

### Paso 1: preparar script de lectura

Grabá leyendo este texto (1 min aprox). Natural, sin actuar, con pausas
naturales. En un cuarto silencioso.

```
Hola, soy Pedro. Creé Paw Friend porque mi gata Ema y mi perro Kai
merecían algo mejor que una carpeta de papeles. Con Paw Friend
puedes llevar la ficha clínica digital de tus mascotas. Vacunas,
peso, visitas al veterinario, recordatorios, todo en un solo lugar.
Gratis. Para siempre. Porque tu mascota es parte de tu familia, y
su salud no debería depender de un paywall. Si tienes más de una
mascota, vas a entenderlo enseguida. Cuando una tiene todo ordenado
y la otra no, la diferencia se nota. Y cuando algo pasa, te
complicas. Dos minutos en Paw Friend punto cl, y tus mascotas
quedan cubiertas.
```

Tips de grabación:
- **Micrófono**: cualquiera serve. AirPods / headphones del celular / notebook.
- **Ambiente**: lo más silencioso posible. Sin aire acondicionado, sin TV, sin eco.
- **Tono**: conversacional. Como si le hablaras a un amigo. No leas actuado.
- **Formato**: MP3 o WAV, mono, mínimo 22kHz.

### Paso 2: subir a ElevenLabs

1. Login en [elevenlabs.io](https://elevenlabs.io/app/voice-lab)
2. **Voice Lab** → **"Add a new voice"**
3. Elegí **"Instant Voice Cloning"** (rápido, 1 min audio) o **"Professional Voice Cloning"** (30 min audio, mejor calidad — solo Pro+)
4. Subí el MP3
5. Nombrá la voz: `Pedro Paw Friend`
6. Agregá description: "Spanish Chilean male founder voice, conversational tone"
7. Guardar

Para PVC (mejor calidad): grabá 30 min leyendo capítulos variados de un libro.

### Paso 3: copiar el Voice ID

1. En Voice Lab → click en tu voz nueva
2. Arriba verás un ID tipo `x8ABC123def...`
3. Click en el icono **Copy ID** (⎘)

### Paso 4: pegar en .env

Abrí [content-studio/.env](.env) y reemplazá:

```
ELEVENLABS_VOICE_ID=TU_NUEVO_VOICE_ID_AQUI
ELEVENLABS_MODEL=eleven_v3
```

`eleven_v3` es el modelo premium disponible en Pro. Mejor calidad en español
que `eleven_multilingual_v2`.

### Paso 5: regenerar las voces

```bash
cd content-studio
rm -rf assets/voice/semana-01-ema-ofendida-v4
npm run render:all -- semana-01-ema-ofendida-v4 --voices --captions
```

Vas a escuchar el reel narrado con tu voz.

---

## 2. Midjourney — Ilustraciones custom del brand (30 min total)

Resultado: ilustraciones que matchean con el tono emocional exacto de cada
escena y el brand de Paw Friend. No depende de fotos stock genéricas.

### Paso 1: entrar a Midjourney

1. Entrá a [discord.gg/midjourney](https://discord.gg/midjourney)
2. Unite a tu canal privado (viene con Basic)
3. O usá el Midjourney Web en [midjourney.com](https://www.midjourney.com/)

### Paso 2: generar las 5 ilustraciones clave

Pegá estos prompts uno por uno en `/imagine`. Al terminar, **upscalea la mejor**
de cada 4 (U1, U2, U3 o U4) y descargala como PNG.

#### Cover — Escena 1 Hook (perro + gato con dueño)

```
cinematic illustration, couple sitting cozy on living room couch at
golden hour, medium-sized brown dog and tabby cat sitting side by side
on floor looking directly at camera with soulful expressive eyes, warm
afternoon light through window, subtle purple ambient glow accents,
modern vector art style, clean lines, shallow depth of field, emotional
heartwarming mood, pet lifestyle vibe, vertical composition --ar 9:16 --v 6
```

Guardar como: `content-studio/assets/custom/scene-01-hook.jpg`

#### Body 1 — Escena 2 Context (perro en vet, ordenado)

```
illustration, veterinarian examining happy dog in clinic consultation
room, stethoscope around neck, medical records on desk with clipboard
and small tablet showing pet profile, warm professional lighting,
purple and amber brand accents, modern vector art clean style, sense
of care and organization, vertical composition --ar 9:16 --v 6
```

Guardar como: `content-studio/assets/custom/scene-02-context.jpg`

#### Body 2 — Escena 3 Punch (gato solo)

```
cinematic illustration, solitary tabby cat sitting on windowsill staring
contemplative into middle distance, soft natural rim light from window
behind, muted tones with subtle purple tint in shadows, modern vector
art minimalist style, emotional quiet loneliness mood, vertical
composition --ar 9:16 --v 6
```

Guardar como: `content-studio/assets/custom/scene-03-punch.jpg`

#### Body 3 — Escena 4 Punch (dueño estresado)

```
illustration, worried pet owner sitting on couch looking anxiously at
smartphone while messy stack of medical papers and pet vaccination
cards spill over lap, concerned facial expression, blurred out-of-focus
dog in foreground looking up, dim warm home lighting, subtle purple
ambient mood, modern vector art minimalist, storytelling crisis moment,
vertical composition --ar 9:16 --v 6
```

Guardar como: `content-studio/assets/custom/scene-04-crisis.jpg`

#### CTA — Escena 5 (persona con mascotas felices usando app)

```
bright cheerful illustration, smiling young person on couch at home
holding smartphone with pet health app visible on screen, happy medium
dog and tabby cat both sitting next to them interacting, warm sunny
home lighting, purple and amber brand accents, modern vector art clean
style, sense of peace and control, vertical composition --ar 9:16 --v 6
```

Guardar como: `content-studio/assets/custom/scene-05-cta.jpg`

### Paso 3: conectar al pipeline

Editá [campaigns/semana-01-ema-ofendida-v4.json](campaigns/semana-01-ema-ofendida-v4.json).

Para cada escena que quieras reemplazar con la ilustración custom, **borrá
`stockSearch`** y agregá `mediaPath` + `mediaKind: "image"`:

```diff
 {
   "durationInSeconds": 3.2,
   "kind": "hook",
   "headline": "Tienes un favorito",
   "sub": "Y tu mascota lo sabe",
   "voiceText": "...",
-  "stockSearch": "dog cat together owner pet couple home",
-  "mediaPath": "stock/semana-01-ema-ofendida-v4-01-24e029b10f.mp4",
-  "mediaKind": "video"
+  "mediaPath": "custom/scene-01-hook.jpg",
+  "mediaKind": "image"
 }
```

Igual para staticAssets:

```diff
 {
   "id": "ig-1-cover",
   "layout": "carousel-cover",
   "data": {
     "headline": "Tienes un favorito",
     "sub": "Y tu mascota lo sabe",
-    "imageSearch": "dog cat together owner home couple pets",
-    "imagePath": "stock/semana-01-ema-ofendida-v4-ig-1-cover-1dfd6f183e.jpg"
+    "imagePath": "custom/scene-01-hook.jpg"
   }
 }
```

### Paso 4: re-render (sin tocar stock ni voces)

```bash
npm run render:video -- semana-01-ema-ofendida-v4
npm run render:static -- semana-01-ema-ofendida-v4
```

El pipeline detecta que los assets ya están locales (no tienen `stockSearch`
ni `imageSearch`) y no llama a Pexels. Render limpio.

---

## 3. Variantes extra para generar con Midjourney (opcional)

### Wordmark con glow (para animaciones brand)

```
text logo "Paw Friend" typography in soft rounded modern sans serif font,
soft cloud glow effect around letters, vibrant purple gradient #9333EA
to #6B21A8 fill with subtle amber #F59E0B halo, transparent background,
high contrast, isolated clean logo, marketing asset quality --ar 3:1 --v 6
```

Guardar como: `content-studio/assets/custom/wordmark-glow.png`

### Huellas stylizadas (5 variantes de color)

```
minimalist modern paw print icon, rounded geometric style with 4 toe
pads and main heart-shaped pad below, clean vector SVG look, solid
fill #9333EA purple, transparent background, centered, isolated icon,
high contrast, 1024x1024 --ar 1:1 --v 6
```

Repetí cambiando `#9333EA` por `#6B21A8`, `#F59E0B`, `#FFFFFF`, `stroke only`.

---

## 4. Workflow recomendado semanal

1. **Lunes**: generar las 5 ilustraciones Midjourney (1 hora)
2. **Martes**: editar JSON de campaña + `npm run render:all -- semana-XX --voices`
3. **Miércoles**: subir a Postiz/plataformas, programar horarios
4. **Jueves-Domingo**: publicación automática

Al final del mes, tenés 20 imágenes custom + 4 reels con tu voz. Biblioteca
reusable para futuras campañas.

---

## Tips de Midjourney

- `--v 6` usa la versión actual más realista. Cambiá a `--niji 6` para estilo anime.
- `--ar 9:16` vertical (TikTok/Reels). `--ar 4:5` IG feed. `--ar 1:1` post square.
- Si una imagen te gusta casi, usá **Vary (Subtle)** o **Vary (Strong)** para variaciones.
- **Upscale** (U1-U4) después de elegir la mejor de las 4.
- Guarda siempre como PNG o JPG sin compresión agresiva para que el pipeline no vea artifacts.

## Troubleshooting

### "ElevenLabs dice quota_exceeded con Pro"

Revisá [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
y verificá que la API key tenga cuota "Unlimited" o un límite alto.

### "Midjourney me hace imagen con texto inventado"

Midjourney es malo con texto dentro de imágenes. Para el wordmark es mejor
que usemos el SVG oficial + Satori como hoy, no Midjourney.

### "La voz clonada no me convence"

Probá Professional Voice Cloning (PVC) — 30 min audio clean. Calidad mucho mejor.
En ElevenLabs Voice Lab → "Professional Voice Clone".
