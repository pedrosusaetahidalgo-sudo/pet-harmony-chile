# Prompts para Kling AI — Paw Friend

> Generá los videos en https://klingai.com con estos prompts. **NO necesitas API key**, lo hacés desde la web/app y descargás los MP4. Es la opción más segura y barata.
>
> **Antes de generar**: en Kling Settings → Billing, verificá que NO tienes auto-recharge activado. Que solo gaste los créditos prepagados del mes.

---

## Video 1 — Hero del landing (PRIORIDAD ALTA)

**Destino**: `public/videos/hero-pet.mp4` del repo. Reemplaza la foto estática actual del Hero.

**Specs técnicas**:
- Duración: 5 segundos
- Aspect ratio: 16:10 o 16:9 (horizontal, NO vertical)
- Resolución: 1280x720 o similar
- Loop friendly: el primer y último frame deben ser parecidos
- Tamaño objetivo final: <2 MB (comprimís con HandBrake o ffmpeg después)

**Prompt**:
```
A young Latin American woman in her late 20s sitting on a sunny park bench in Santiago Chile, gently petting and smiling at her medium-sized golden retriever dog. The dog looks up at her with happy expression. Soft natural sunlight, warm golden hour lighting, shallow depth of field with bokeh background of green park trees. Cinematic, peaceful, joyful mood. Slow gentle camera movement, slight push-in. Photorealistic, high quality, 16:9 horizontal.
```

**Variantes para probar (genera 2-3 y elegí la mejor)**:

Variante B — gato:
```
A relaxed Latin American man in his 30s sitting on a modern living room couch with natural light, gently stroking a fluffy gray cat curled up next to him. The cat purrs and slowly blinks. Warm afternoon light through a window, cozy home atmosphere, plants in the background. Cinematic close-up shot, slow gentle camera drift. Photorealistic, peaceful mood, 16:9 horizontal, 5 seconds.
```

Variante C — múltiples mascotas:
```
A Chilean family of three (mom, dad, young child) playing on the living room floor with a small mixed-breed dog and a cat watching nearby. Warm natural light, white walls, modern minimal home, joyful authentic moment, no posed expressions. Cinematic medium shot, slight handheld feel, soft focus background. Photorealistic, joyful mood, 16:9 horizontal, 5 seconds.
```

**Cuál elegir**: la variante A (perro) es la más segura porque conecta con el target principal (dueños de perros = mayoría). Si te gusta más visualmente la B o C, usalas.

---

## Video 2 — Clip "Ficha médica digital" (para reuniones con vets)

**Specs**: 5 seg, 16:9 horizontal, ~1 MB.

**Prompt**:
```
Close-up shot of a tablet screen showing a clean medical pet record interface in Spanish, with sections for vaccines, allergies, and medical history. Hands of a veterinarian in white coat scrolling through the digital record with a stethoscope visible on the side. Modern veterinary clinic background slightly out of focus. Professional, clean, trustworthy mood. Soft clinical lighting. Photorealistic, 16:9 horizontal, 5 seconds.
```

---

## Video 3 — Clip "Recordatorio en el celular" (para reuniones con vets)

**Specs**: 5 seg, 9:16 vertical (es del celular), ~800 KB.

**Prompt**:
```
Close-up vertical shot of a smartphone screen on a wooden table receiving a friendly notification: a vaccine reminder for a pet. The notification appears with a soft animation. A small dog blurred in the background of the frame. Warm home lighting, peaceful morning mood. Photorealistic, vertical 9:16, 5 seconds.
```

---

## Video 4 — Clip "Veterinaria atendiendo" (para reuniones con vets)

**Specs**: 5 seg, 16:9 horizontal, ~1 MB.

**Prompt**:
```
A friendly Latin American female veterinarian in her 30s wearing a white coat, gently examining a small dog on a clean clinical examination table. The dog wags its tail. Soft modern veterinary clinic, warm professional lighting, plants and certificates on the wall behind. The vet smiles and checks the dog's ears with care. Photorealistic, professional yet warm mood, 16:9 horizontal, 5 seconds.
```

---

## Cómo usar los videos después de descargarlos

### Para el Hero (Video 1)
1. Descargá el MP4 de Kling
2. Comprimilo si pesa más de 2 MB. Opciones:
   - **Online fácil**: https://www.freeconvert.com/video-compressor → bajar a 720p, bitrate 1500 kbps
   - **HandBrake (gratis)**: preset "Web → Vimeo YouTube HD 720p30"
   - **ffmpeg**: `ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -movflags +faststart hero-pet.mp4`
3. Renombralo a `hero-pet.mp4`
4. Copialo a `c:\Users\psusa\Desktop\pet-harmony-chile-main\public\videos\hero-pet.mp4`
5. Crear la carpeta `public/videos/` si no existe (en tu explorador o con `mkdir public/videos`)
6. `npm run build && git add public/videos/hero-pet.mp4 docs/ && git commit -m "feat(landing): video hero" && git push`

El componente [Hero.tsx](src/components/Hero.tsx) ya está preparado para servirlo. Si el archivo no está, automáticamente cae al fallback de imagen (no se rompe nada).

### Para los videos del pitch B2B (2, 3, 4)
1. Descargalos como MP4
2. Subilos a CapCut (mobile o desktop, gratis)
3. Importá también el audio que generaste con ElevenLabs siguiendo [GUION_PITCH_VETS_60S.md](GUION_PITCH_VETS_60S.md)
4. Armá un timeline de 60 seg combinando los clips con el audio encima
5. Exportá como MP4 vertical o horizontal según donde lo vas a mostrar (iPad en reunión = horizontal, WhatsApp/Insta = vertical)
6. **NO subas el video editado al repo** — guardalo en tu Drive o Dropbox personal y compartilo por link cuando sea necesario.

---

## Tips para que los prompts salgan bien en Kling

1. **Prompts en inglés** funcionan mejor que en español, incluso aunque la escena sea chilena
2. **Especificá "Latin American"** para que las personas no salgan con cara muy europea o asiática
3. **Evitá "cute"** — Kling tiende a hacerlo cartoon. Usá "joyful", "peaceful", "natural"
4. **Movimientos de cámara lentos** ("slow gentle drift", "slight push-in") porque los movimientos rápidos salen choppy en 5 seg
5. **Si la primera generación sale rara**, no insistas con el mismo prompt. Cambiá una palabra clave (ej. "golden retriever" → "labrador" → "mixed breed dog") porque a veces algunos animales funcionan mejor que otros
6. **Costo**: cada generación en Kling consume créditos. Empezá generando solo 1-2 antes de pedir 4 distintas. Si te gusta cómo viene, generás el resto.

---

## Estimación de costos

- **Kling Standard**: ~$10 USD/mes con ~100 créditos. Cada video de 5 seg en calidad standard usa ~10 créditos. Te alcanza para ~10 generaciones.
- **Kling Pro**: ~$30 USD/mes con más créditos y mejor calidad.
- **Para esta sesión**: con el plan Standard te alcanza de sobra (4 videos = 40 créditos). Si te quedan créditos, podés probar variantes.

**Importante**: NO actives auto-recharge. Si Kling te ofrece "pay as you go" o "post-paid", rechazalo. Solo prepago.
