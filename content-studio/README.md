# content-studio

Pipeline programatico para generar assets de Instagram, TikTok, Reels y
LinkedIn sin tool manual (Canva-style). Usa Satori (estaticos) y Remotion
(video) con Claude generando copy y guiones.

Aislado del resto del repo: deps propias, no afecta el bundle de la app.

## Stack

- **Satori** (open source, Vercel) — SVG/PNG desde React elements
- **@resvg/resvg-js** — SVG a PNG en Node
- **Remotion** 4.x — React a MP4 con Chrome headless
- **Twemoji** via CDN — emojis con cache local en `assets/.emoji-cache/`
- **Inter** (@fontsource/inter) — tipografia del brand

Coste infra: **$0/mes**.

## Cadencia

2 piezas por semana (1 tema, 2 formatos):

1. **Post estatico** (carrusel 5 slides 1080x1350 + hero LinkedIn 1200x627)
2. **Reel vertical** (1080x1920, 15-30s, MP4 H264)

Alterno pilares A (Kai/Ema, emocional/humor) y C (tips vet, educativo).

Primer mes: 4 temas, ver [campaigns/](campaigns/).

## Estructura

```
content-studio/
├── package.json            # Deps aisladas
├── remotion.config.js      # Config Remotion (entry, codec)
├── campaigns/              # JSON por semana con copy + guion
│   ├── semana-01-ema-ofendida.json
│   ├── semana-02-pulgas.json
│   ├── semana-03-vet-3-segundos.json
│   └── semana-04-urgencia-vs-esperar.json
├── src/
│   ├── brand.js            # Colores, formatos, fuentes
│   ├── emoji-loader.js     # Twemoji + cache local
│   └── layouts/
│       ├── h.js            # React.createElement helper
│       ├── carousel.js     # Slide de carrusel IG (cover/body/cta)
│       └── linkedin.js     # Hero 1200x627
├── remotion/
│   ├── index.jsx           # Entry point
│   ├── Root.jsx            # Registro de composiciones
│   ├── VerticalReel.jsx    # Composicion reusable (hook/context/punch/cta)
│   └── defaultProps.js     # Props para preview en studio
├── scripts/
│   ├── render-static.mjs   # Satori -> PNG
│   ├── render-video.mjs    # Remotion -> MP4
│   └── render-all.mjs      # Atajo: estaticos + video
├── assets/                 # Videos/imagenes de Kai, Ema, etc.
│   ├── .emoji-cache/       # Twemoji SVGs cacheados (ignorado)
│   └── raw/                # Material bruto sin procesar (ignorado)
└── output/                 # PNGs y MP4s generados (ignorado)
    └── semana-XX-slug/
        ├── ig-1-cover.png
        ├── ig-2-body.png
        ├── ...
        ├── ig-5-cta.png
        ├── linkedin-hero.png
        └── reel-1080x1920.mp4
```

## Setup (una sola vez)

```bash
cd content-studio
npm install
```

Esto trae Satori + Remotion + Chrome headless (~110 MB).

## Comandos

```bash
# Renderizar todo (estaticos + video, SIN voz) de todas las campañas
npm run render:all

# Una campaña especifica
npm run render:all -- semana-01

# Incluir voz IA (ElevenLabs). Requiere .env configurado.
npm run render:all -- semana-01 --voices

# Solo estaticos
node scripts/render-static.mjs semana-01

# Solo video
node scripts/render-video.mjs semana-01

# Solo voces (genera MP3 y actualiza JSON con voicePath por escena)
npm run voices -- semana-01

# Preview interactivo en Remotion Studio (hot reload)
npm run studio
```

## Integracion de voz IA (ElevenLabs)

### Setup (una vez)

1. Creá un archivo [content-studio/.env](.env) con este contenido:
   ```
   ELEVEN_LABS_API_KEY=tu_key_de_elevenlabs
   ELEVENLABS_VOICE_ID=id_de_la_voz_elegida
   ELEVENLABS_MODEL=eleven_multilingual_v2
   ```

2. El key se saca en [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys).

3. El Voice ID podes usar uno pre-made:
   - `EXAVITQu4vr4xnSDxMaL` — Sarah (femenina clara)
   - `XB0fDUnXU5powFXDhCwa` — Charlotte (femenina joven, TikTok-friendly)
   - `pqHfZKP75CvOlQylNhV4` — Bill (masculino medio)
   - `nPczCjzI2devNBz1zQrb` — Brian (masculino grave)

   O elegís una chilena en [elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library) → filtro Spanish + Latin American → click en la voz → "Add to VoiceLab" → copiar ID.

### Flujo

Cada escena de `reel.scenes[]` en `campaigns/*.json` puede tener:

- `voiceText` (opcional): texto explicito a narrar. Si no existe, se
  usa `headline + ". " + sub`. Usalo cuando el headline tiene numeros
  o siglas que no suenan bien leidos literal (ej: "#2" → "número dos").

Al correr `npm run voices -- semana-01`:

1. Por cada escena con `voiceText` (o headline+sub), se llama a
   ElevenLabs y se guarda el MP3 en `assets/voice/<slug>/<n>-<hash>.mp3`.
2. Se cachea por hash (voice+model+texto): si el texto no cambio, no
   se vuelve a llamar. Ahorrás creditos.
3. Se actualiza el JSON de la campaña agregando `voicePath` a cada
   escena.
4. `render-video.mjs` lee el JSON, pasa `voicePath` al Remotion, y la
   composicion lo embebe con `<Audio src>`.

### Limites del plan Creator ElevenLabs ($5/mes)

- 30.000 caracteres/mes (~3.000 segundos de voz).
- Cada reel de 15-30s = ~200-400 caracteres → 75-150 reels/mes.
- Para 2 reels/semana = 30/mes, te sobra ampliamente.
- Si pasaste el limite, los llamados fallan con 401/403. El script
  lo reporta pero no crashea: los MP3 ya generados siguen ahí.

### Sin voz (puramente tipografico)

Si no corriste `--voices`, las escenas no tienen `voicePath` y el reel
se renderiza sin audio. Util para primera iteracion rapida.

## Flujo de trabajo (operacional)

Cada semana:

1. **Crear JSON de campaña** en `campaigns/semana-XX-slug.json` con:
   - `slug`, `pilar` ('A' o 'C'), `publishDate`, `title`
   - `caption` por plataforma (IG, TikTok, LinkedIn)
   - `hashtags` por plataforma
   - `staticAssets[]` (6 por defecto: 5 slides IG + 1 hero LinkedIn)
   - `reel.scenes[]` (4-5 escenas con duracion + headline + sub)

2. **Renderizar**: `npm run render:all -- semana-XX`

3. **Revisar** `output/semana-XX-slug/` en explorador.

4. **Subir a plataformas**:
   - **Instagram**: IG Feed 4:5 (carrusel) + reel desde la app
   - **TikTok**: reel subido desde la app (para usar musica trending)
   - **LinkedIn**: hero como post image + el mismo reel sin musica
   - **LinkedIn carousel** (opcional): reutilizar los 5 slides IG

5. **Copy**: pegar desde `caption` por plataforma. Hashtags al final.

## Agregar video real (Kai, Ema, etc.)

Por defecto los reels son puramente tipograficos. Para meter video real:

1. Poner clip en `assets/clips/<nombre>.mp4` (vertical 9:16 ideal).
2. En el JSON de la campaña, agregar a la escena correspondiente:
   ```json
   {
     "durationInSeconds": 4,
     "kind": "context",
     "headline": "Kai tiene ficha medica.",
     "sub": "Todo.",
     "mediaPath": "clips/kai-corriendo.mp4",
     "mediaKind": "video"
   }
   ```
3. Re-render: `node scripts/render-video.mjs semana-XX`.

Remotion usa `staticFile('clips/kai-corriendo.mp4')` internamente.

## Stack pagado (opcional, $20 USD/mes)

Para escalar calidad cuando la cadencia esta validada:

- **[ElevenLabs](https://elevenlabs.io/) Creator** ($5/mes) — voz IA
  chilena para narracion. Integracion: generar audio fuera, dropear en
  `assets/voice/<slug>.mp3`, referenciarlo en Remotion con `<Audio src=...>`.
- **[Descript](https://www.descript.com/) Creator** ($15/mes) — edicion
  de video real como texto, captions automaticas, quita silencios. Uso
  independiente (no integrado al pipeline); genera MP4 final que puede
  reemplazar output/<slug>/reel.mp4.

Ambos cancelables cualquier mes. Regla: no pagar antes de haber publicado
consistente 4 semanas.

## Troubleshooting

### Error "Expected <div> to have explicit display:flex"

Satori es estricto: todo div con >1 hijo debe ser `display:flex` o
`display:none`. Siempre usar el helper `h()` en `src/layouts/h.js` y
meter `display:flex` en cada nodo que tenga hijos.

### Emoji se renderiza como rectangulo vacio

Inter no tiene glyphs de emoji. El `emoji-loader.js` los carga de Twemoji
(cache local en `assets/.emoji-cache/`). Requiere conexion solo la
primera vez por emoji.

### Primer render de video tarda mucho

Remotion descarga Chrome Headless Shell (~110 MB) la primera vez. Siguiente
run va directo. Queda cacheado en `~/.cache/remotion/`.

### Quiero ver el reel en vivo antes de renderizar

```bash
npm run studio
```

Abre Remotion Studio en `localhost:3000` con hot reload. Ajustas el
`defaultProps.js` para previsualizar una escena diferente.

## Copy y tono

- **Tuteo chileno**: tu, tienes, puedes. Nunca "vos/podes/tenes".
- **Marca**: siempre "Paw Friend" (dos palabras, mayusculas).
- **URL**: `pawfriend.cl` (sin www, sin https).
- **Handle**: `@pawfriend.cl`.
- **Terminos fijos**: "ficha clinica" (no "historial"), "vet" o
  "veterinario" (no "doctor"), "mascota" (no "engreido"/"engreida").
