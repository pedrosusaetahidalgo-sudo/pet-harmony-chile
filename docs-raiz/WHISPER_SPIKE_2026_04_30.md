# Whisper Fase 1 Spike — 2026-04-30

> Spike de evaluación: ¿reemplazar Web Speech API (browser) por Whisper
> server-side (HuggingFace Inference API u OpenAI Audio API) para
> transcribir audio de consultas vet + observaciones owner?
>
> **Audiencia**: Pedro decide si invertir Fase 1 (4-8h dev) en migrar.

---

## 1. Estado actual

**Stack**: `useAudioRecorder.ts` usa `SpeechRecognition` API del browser
(Web Speech). Captura mic continuo, transcript live, no envía audio
server-side. La edge fn `process-consultation-transcript` recibe ya el
texto plano y lo procesa con Claude Haiku 4.5.

### Pros del modelo actual
- **Costo $0**: la transcripción la hace el browser nativo.
- **Latencia 0**: live transcript visible mientras el vet habla.
- **Privacy**: el audio nunca sale del device.
- **Storage 0**: no hay archivo de audio que guardar/borrar.

### Contras del modelo actual
- **Safari iOS**: soporte parcial — funciona pero con bugs conocidos
  (cortes inesperados, idioma a veces no respetado).
- **Chrome Android**: requiere mic permission cada sesión.
- **Calidad**: ~85% acurracy en español neutro, baja a ~70% en chileno
  con ruido (consulta vet con perro ladrando, conversación cruzada).
- **Sin diarización**: no separa "vet" vs "dueño" (afecta calidad del
  resumen Claude downstream).
- **Sin terminología vet**: no entiende "leishmaniasis", "ehrlichia",
  "carprofeno" — los transcribe fonéticamente.
- **Sin offline**: requiere conexión activa (red mobile en consulta domicilio falla).

---

## 2. Opciones evaluadas

### A) HuggingFace Inference API + Whisper-v3-large

**Endpoint**: `POST https://api-inference.huggingface.co/models/openai/whisper-large-v3`
**Pricing**: PRO plan $9/mes da 20k requests gratis + $0.0001/sec audio
después. Free tier: 1k req/mes pero con cold starts de 20s.

| Métrica | Valor |
|---|---|
| Calidad esp neutro | ~95% (clínicamente útil) |
| Calidad esp chileno | ~92% |
| Terminología vet | ~88% (Whisper v3 tiene buen vocab medical) |
| Latencia | 1-3s para audio <2 min, 5-15s para >5 min |
| Storage | Audio en Supabase storage temporal (delete después) |
| Costo a 100 vets/mes (~5min audio/consulta x 4 consultas/día x 22 días) | 100 × 5 × 4 × 22 × 60 = 2.6M segs / 1000 = 2.6k unidades = ~$0.26/mes (PRO) |

**Pros**:
- Mucho mejor calidad para español chileno
- Modelo fine-tuneable (futuro Fase 2: fine-tune con dataset de
  consultas reales para dominar términos farmacológicos vet)
- Hay diarización experimental con `pyannote/speaker-diarization` paralelo

**Contras**:
- Cold starts del HF Inference API (20s primer hit)
- Audio sale del device (fricción privacy)
- Requiere upload de archivo (Supabase storage o stream directo)

### B) OpenAI Audio API (whisper-1)

**Endpoint**: `POST https://api.openai.com/v1/audio/transcriptions`
**Pricing**: $0.006/min ($0.36/hora) — sin tier gratis.

| Métrica | Valor |
|---|---|
| Calidad esp chileno | ~93% |
| Latencia | 0.5-2s siempre (sin cold starts) |
| Costo a 100 vets/mes (mismo cálculo) | 5min × 88 consultas = 440min/vet × 100 = 44k min = **$264/mes** |

**Pros**:
- Más confiable y rápido que HF
- API estable, latencia predecible
- Idioma autodetectable o forzable a `es`

**Contras**:
- Caro a escala (10x más que HF)
- Modelo cerrado, no hay fine-tune posible

### C) Hybrid: Web Speech para preview + Whisper para resultado final

Mantener el live transcript actual (Web Speech) para UX inmediato, pero
**al guardar la nota**, mandar el audio completo a Whisper server-side
y reemplazar el transcript con el resultado mejorado.

**Pros**:
- Mejor UX (live transcript) + mejor calidad (final)
- Si Whisper falla, fallback al transcript Web Speech ya capturado
- Costo bajo: solo se transcribe lo que se guarda (no descarte)

**Contras**:
- Doble pipeline (más complejo)
- Audio se mantiene 30-60s en device antes de upload (privacy)

### D) Transformers.js (Whisper en el browser)

**Lib**: `@xenova/transformers` con whisper-tiny/base/small en WASM/WebGPU.
**Bundle size**: 30-150 MB (whisper-tiny vs small).

| Métrica | Valor |
|---|---|
| Calidad esp chileno | ~85% (whisper-small) — similar a Web Speech |
| Latencia primer load | 30-60s (descarga modelo) |
| Latencia post-load | 1.5-3s para 30s audio |
| Costo runtime | $0 (todo en device) |
| Costo bandwidth | 30-150MB primer load |

**Pros**:
- $0 costo per-request
- Privacy total: audio nunca sale
- Funciona offline después del primer load

**Contras**:
- Bundle gigante (no aceptable para owner mobile)
- Calidad similar a Web Speech actual
- WebGPU no soportado en Safari iOS <17

---

## 3. Recomendación

### Fase 1 (corto plazo, antes de monetizar): **mantener Web Speech actual**.

Razones:
1. Costo $0 vs $264-26/mes — el #1 de los 7 motores B2B aún no genera
   revenue. Invertir en infra cara antes de eso es prematuro.
2. La calidad actual es **suficiente para Claude downstream** — el
   prompt de `process-consultation-transcript` ya tiene "ignora ruido"
   + "no inventes datos faltantes" como guardrails.
3. Sofia (vet beta) reportó que la transcripción funciona OK en Chrome
   desktop. Los problemas reportados son de UX (botón pequeño, no save)
   no de calidad.

### Fase 2 (cuando entre primer cliente B2B pagador): **migrar a Hybrid C**.

Razones:
1. Si vendemos Pharma B2B con datos de consultas reales, **calidad de
   transcripción afecta directamente la calidad del data product**.
2. HF PRO $9/mes + ~$0.30/mes runtime = $9.30/mes. Aún siendo escala
   100 vets, es despreciable vs los ~$5-10k MRR que entrarían con un
   solo deal pharma.
3. Mantenemos UX de live transcript actual (no regresión).

### Fase 3 (cuando tengamos 1k+ consultas reales): **fine-tune Whisper-v3**.

Dataset propio + fine-tune en HF crea un moat real:
- Whisper Paw Friend Vet entiende "ehrlichia canis", "cefalexina 25mg",
  comunas chilenas, marcas de farmacia chilenas.
- Esto es **diferenciador defendible** para acquisition (vet decide
  cambiar de competencia porque su transcripción funciona mejor).

---

## 4. Implementación Fase 2 (cuando se active)

```ts
// src/hooks/useAudioRecorder.ts (extension)
async function uploadAudioForTranscription(blob: Blob) {
  const path = `consultations/${userId}/${Date.now()}.webm`;
  await supabase.storage.from('audio-temp').upload(path, blob);

  // Edge fn nueva: transcribe-audio-whisper
  const { data } = await supabase.functions.invoke('transcribe-audio-whisper', {
    body: { audio_path: path, language: 'es', context: 'vet_consultation' }
  });

  // Auto-delete después de 1h (cron lifecycle ya existe para paw-shield)
  return data.transcript;
}
```

**Edge fn nueva**: `transcribe-audio-whisper/`
- Recibe `audio_path` (Supabase storage)
- Descarga blob, manda a HF Inference API
- Retorna transcript + confidence
- Borra el blob después

**Migrar gradualmente**:
- Feature flag `WHISPER_FALLBACK=false` → solo Web Speech
- `WHISPER_FALLBACK=true` → Hybrid (Web Speech UX + Whisper final)
- `WHISPER_PRIMARY=true` → Solo Whisper (Fase 3 después de fine-tune)

---

## 5. Decisión 2026-04-30

**Pedro decide**: postpone hasta **firmar primer deal B2B real** (Pharma
o Aseguradora). Mantener Web Speech actual. Mantener este doc como
playbook listo para activar Fase 2 cuando llegue el trigger.

**Trigger explícito de activación**:
- ✅ Primer contrato B2B firmado con MRR ≥ $2k USD/mes, OR
- ✅ Sofia (o vet beta) reporta que calidad de transcripción es
  bloqueante para uso diario, OR
- ✅ Vamos a presentar a CORFO/StartUp Chile y ellos exigen demo con
  diarización + términos farmacéuticos perfectos.

Hasta entonces, el dinero del HF PRO + dev time es mejor invertido en
**outreach comercial** (Task #8) que en transcripción mejor.

---

## 6. Costo de no hacerlo (deuda explícita)

- Si vendemos un deal pharma con datos basados en transcripciones de
  baja calidad → el partner detecta el ruido y baja confianza.
- Si Sofia recomienda Paw Friend a colegas → calidad de transcripción
  es uno de los selling points (vs PetSync). Hoy no es diferenciador.
- Si llegamos a 100 vets activos antes de migrar → migración masiva
  con data ya existente requiere reprocesar transcripciones viejas.

**Mitigación**: medir trimestralmente la queja sobre calidad transcript.
Si llega al top 3 de feedback en algún sprint → activar Fase 2 antes.

---

## 7. Referencias

- [HuggingFace Whisper-v3-large](https://huggingface.co/openai/whisper-large-v3)
- [OpenAI Audio API pricing](https://openai.com/api/pricing/)
- [Transformers.js whisper](https://huggingface.co/docs/transformers.js/api/pipelines#module_pipelines.AutomaticSpeechRecognitionPipeline)
- [pyannote diarization](https://huggingface.co/pyannote/speaker-diarization-3.1)
- Existing fn: `supabase/functions/process-consultation-transcript/index.ts`
- Existing hook: `src/hooks/useAudioRecorder.ts`

---

**Estado**: spike completado. No-op por ahora. Reactivar al trigger.
