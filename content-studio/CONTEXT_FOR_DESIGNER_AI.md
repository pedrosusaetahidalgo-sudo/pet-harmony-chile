# Brief para IA externa (Claude.ai / ChatGPT / Gemini) — Paw Friend Content Studio

Copiá este archivo completo al chat de una IA y hacele la pregunta al final.
Está pensado para que la IA entienda el stack sin pedirte más contexto.

---

## 1. Qué es Paw Friend

Paw Friend (pawfriend.cl) es una app chilena de ficha médica digital para
mascotas. 100% gratis para dueños (modelo B2C). Hecho por un solo
fundador desde Santiago. Competencia: Rover, Wag, apps de veterinarios
propietarios. Diferencial: brand cercano, chileno, no paywall.

Mascotas reales del fundador: **Kai** (pastor suizo) y **Ema** (gata).
Ambas aparecen como protagonistas en el contenido.

## 2. Objetivo del pipeline "content-studio"

Generar 2 piezas por semana (estático + reel) para Instagram, TikTok,
Reels y LinkedIn, **100% programático**, sin tools manuales tipo Canva.
Cadencia: 2/semana, presupuesto infra $5/mes (solo ElevenLabs).

## 3. Stack técnico actual

| Capa | Tool | Costo |
|---|---|---|
| Render estáticos | [Satori](https://github.com/vercel/satori) + [@resvg/resvg-js](https://github.com/yisibl/resvg-js) | $0 |
| Render video | [Remotion](https://www.remotion.dev/) 4.x | $0 |
| Voz IA | [ElevenLabs](https://elevenlabs.io/) v2 multilingual, voice id de Cristian Cornejo (masculino chileno) | $5/mes |
| B-roll | [Pexels Videos API](https://www.pexels.com/api/) | $0 |
| Captions | [whisper.cpp](https://github.com/ggerganov/whisper.cpp) local (modelo `small` español) + [@remotion/captions](https://www.remotion.dev/captions) | $0 |
| Tipografía | Inter (Google Fonts) | $0 |
| Emojis | [Twemoji](https://github.com/twitter/twemoji) via CDN | $0 |

## 4. Brand kit (`public/paw-friend-assets-v2/`)

- **Primary**: `#9333EA` (violeta 700)
- **Primary dark**: `#6B21A8`
- **Accent**: `#F59E0B` (ámbar)
- **Ink**: `#0F172A`
- **Bg**: `#FAF5FF`
- **Logo principal**: squircle morado con pata+corazón en negative space
- **Wordmark**: "paw friend" en Fredoka

## 5. Tono de voz (no negociable)

- **Español chileno con tuteo** (tú / tienes / puedes)
- **PROHIBIDO voseo argentino**: no "vos / tenés / podés / mirá / hacele / entrá / escuchame"
- **Términos fijos**: "ficha clínica" (no "historial"), "vet" o "veterinario" (no "doctor"), "mascota" (no "engreído")
- **URL**: `pawfriend.cl` (sin www, sin https)
- **Handle**: `@pawfriend.cl`

## 6. Formato de outputs

| Formato | Dimensiones | Duración |
|---|---|---|
| Carrusel IG/Reels cover | 1080×1350 (4:5) | — |
| Reel / TikTok | 1080×1920 (9:16) | 16s |
| LinkedIn hero | 1200×627 | — |

Reel compuesto por **4-5 escenas** con `kind` ∈ {hook, context, punch, cta}.
Cada escena tiene: headline (pantalla grande), sub (pantalla chico),
voiceText (narración ElevenLabs), stockSearch (keyword Pexels opcional).

## 7. Estructura de campaña (`campaigns/*.json`)

```json
{
  "slug": "semana-01-ema-ofendida",
  "pilar": "A",
  "publishDate": "2026-05-04",
  "platforms": ["instagram", "tiktok", "reels", "linkedin"],
  "caption": {
    "instagram": "...",
    "tiktok": "...",
    "linkedin": "..."
  },
  "hashtags": { "instagram": "...", "tiktok": "...", "linkedin": "..." },
  "staticAssets": [
    { "id": "ig-1-cover", "layout": "carousel-cover", "data": {...} },
    ...
  ],
  "reel": {
    "scenes": [
      {
        "durationInSeconds": 2.5,
        "kind": "hook",
        "headline": "Ema está ofendida.",
        "sub": "Y tiene razón.",
        "voiceText": "Ema está ofendida. Y tiene razón.",
        "stockSearch": "grumpy cat close up"
      },
      ...
    ]
  }
}
```

## 8. Pilares de contenido (rotan)

- **A — Kai/Ema (emocional/humor)**: público masivo, TikTok-friendly
- **C — Tips vet útiles**: educativo con autoridad, shareable

Semana a semana alternan A y C (4 campañas de ejemplo: Ema ofendida,
3 señales de pulgas, cambio de vet en 3s, urgencia vet vs esperar).

## 9. Estado actual y limitaciones conocidas

✅ **Funciona**:
- 4 campañas escritas con tuteo chileno + sub sincronizado con voiceText
- Voz IA con Cristian Cornejo, settings `stability 0.32 / style 0.60`
- Logo real integrado en estáticos y reel
- Pipeline: `npm run render:all -- semana-01 --voices --stock --captions`

⚠️ **Puntos débiles identificados por el fundador**:
- Los estáticos se ven "planos" (demasiado minimal/Notion-style)
- El reel podría ser "más llamativo"
- Whisper a veces sesga "Ema" → "Emma"
- Los slides no tienen ilustraciones ni fotos, solo tipografía
- Sin música ni efectos de sonido en el reel

## 10. Lo que NO queremos

- Voseo argentino (regla dura)
- Emojis exagerados (🔥💯🚀)
- Tono motivacional vacío
- Copiar clichés de competencia (Rover-style corporate)
- Dependencia de tools GUI (Canva, Adobe) — todo debe ser programático
- Stack pagado > $20/mes

## 11. Pregunta concreta para la IA

**Pegá una de estas preguntas al final del brief, o redactá la tuya:**

- "Dame 5 ideas concretas para que los slides estáticos dejen de verse planos sin romper la paleta ni agregar dependencias pagas."
- "Sugerí 3 transiciones entre escenas del reel que aumenten retención TikTok, implementables en Remotion."
- "Propone 4 guiones de 16s para el pilar A (Kai/Ema humor), respetando tuteo chileno y estructura hook/context/punch/cta."
- "Dame un sistema visual para diferenciar pilar A (humor) vs pilar C (tips vet) en los carruseles, usando los colores del brand."
- "Escribí un prompt sistemático que pueda reutilizar semana tras semana para que vos (la IA) generes el JSON de una campaña nueva desde cero."

---

**Fin del brief.** La IA ahora tiene todo el contexto para responder
sin hacer preguntas preliminares.
