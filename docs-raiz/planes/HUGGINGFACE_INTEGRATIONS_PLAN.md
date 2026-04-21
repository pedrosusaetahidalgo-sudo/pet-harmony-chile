# PLAN DE INTEGRACION HUGGING FACE — PAW FRIEND

> Fecha: 2026-04-21
> Autor: Paw Founder + Claude Code
> Objetivo: Llevar Paw Friend al maximo nivel con modelos open source especializados, bajando costos de IA y agregando features diferenciadoras en Chile/LATAM.
> Usuarios activos en prod: sí (regla 9.7 aplica a todo este plan).

---

## 0. Resumen ejecutivo

Se integraran 12 modelos/sistemas Hugging Face distribuidos en 4 fases, cada una con criterios go/no-go y rollback claro. Todas las integraciones se comportan como **shadow mode** primero (corren en paralelo sin afectar usuarios), luego pasan a **canary** (5-10% usuarios) y recien despues a **GA**.

### Fases y duracion estimada

| Fase | Duracion | Riesgo | Impacto | Integraciones |
|---|---|---|---|---|
| F1 — Fundaciones | 3-5 dias | Bajo | Alto | Infra HF (proveedor, cache, telemetria) + 2 pilotos no criticos |
| F2 — Tier 1 (alto impacto) | 2-3 semanas | Medio | Muy alto | Whisper self-host, Donut OCR, RMBG Paw Cards, bge-m3 + pgvector |
| F3 — Tier 2 (diferenciadores) | 3-4 semanas | Medio-alto | Alto | Llama 3.2 routing, breed classifier, moderacion, NSFW |
| F4 — Tier 3 (experimentales) | 4-6 semanas | Alto | Medio | SAM2, FGS automatico, NLLB-200, SD LoRAs memorial |

### Regla maestra

**NINGUNA integracion remueve la ruta Anthropic/OpenAI existente.** El fallback al proveedor pago queda activo **minimo 2 releases** despues de GA. Si HF falla o degrada, el trafico vuelve al proveedor original sin tocar deploy.

---

## 1. Principios de seguridad (no negociables)

Derivados de lecciones aprendidas registradas en memoria:

1. **Regla 9.7 (proteger usuarios existentes)**: cualquier cambio que toque datos existentes (tipos, columnas, enums, JSON) lleva migracion defensiva con `UPDATE` o `DEFAULT`. Nunca asumir tabla vacia.
2. **Feature flags obligatorios**: toda integracion HF se gatilla via flag en [src/lib/featureFlags.ts](src/lib/featureFlags.ts) (cliente) o `FLAG_HF_<NOMBRE>` env var (servidor). Default OFF. Un solo switch permite rollback sin redeploy.
3. **No flip JWT en bloque** (feedback_no_global_jwt_flip.md): cada edge function nueva se activa una por una con smoke test real antes de la siguiente.
4. **Shadow mode primero**: las primeras 48h cada modelo HF corre en paralelo con el proveedor actual, se logran ambos resultados en `ai_shadow_comparisons`, se compara sin afectar usuario. Solo despues se activa canary.
5. **Nunca hardcodear tokens HF** (feedback_secrets_in_chat.md). Se guardan como secret de Supabase (`HF_API_TOKEN`) o en provider secrets de runtime alternativo (Groq, Together, Replicate).
6. **Rollback documentado por integracion**: cada una trae su procedimiento exacto de reversa. Se valida en staging antes de GA.
7. **Observabilidad primero**: cada llamada HF pasa por `withTelemetry` y loguea latencia + costo + tokens/bytes procesados. Sin esto no se pasa de shadow a canary.
8. **Smoke tests post-deploy**: despues de cada deploy de edge function HF, se corre un smoke SQL/TS que valida el golden path. Ya existe patron en [supabase/migrations/*_smoke_*.sql](supabase/migrations).

---

## 2. Infraestructura base (F1)

### 2.1. Decision: donde corre cada modelo

Tres opciones por modelo. Cada integracion documenta cual usa y por que.

| Modo | Proveedor | Cuando usar | Costo aprox |
|---|---|---|---|
| **API externa (pay-per-use)** | HF Inference API, Groq, Together.ai, Replicate | Modelos grandes (Llama 3.2, Whisper-v3), trafico bajo-medio, sin infra propia | $0.05-$0.50/1M tokens o $0.0005-$0.002/seg |
| **Supabase Edge Function con libreria ligera** | Deno + ONNX runtime web o transformers.js | Modelos pequenos (<100MB), inferencia rapida, sin GPU necesaria (embeddings chicos, moderacion) | Costo Supabase actual |
| **Self-host dedicado** | VPS (Hetzner, OVH) con GPU o CPU fuerte | Whisper large, Donut, modelos vision >500MB, alto volumen | $20-80/mes fijo |

**Default para esta primera iteracion**: API externa (Groq para LLM, HF Inference API o Replicate para vision). Menor carga operacional, permite medir ROI antes de invertir en self-host.

### 2.2. Tabla nueva: `ai_shadow_comparisons`

Guarda resultado del proveedor actual + HF para las primeras 48h de cada integracion.

**Archivo**: `supabase/migrations/YYYYMMDDHHMMSS_ai_shadow_comparisons.sql`

```sql
CREATE TABLE IF NOT EXISTS ai_shadow_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature TEXT NOT NULL,           -- 'pet-assistant', 'breed-tips', 'ocr', etc
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  input_hash TEXT NOT NULL,        -- sha256 del input para agrupar
  primary_provider TEXT NOT NULL,  -- 'anthropic', 'openai'
  primary_output JSONB,
  primary_latency_ms INTEGER,
  primary_cost_usd NUMERIC(10,6),
  shadow_provider TEXT NOT NULL,   -- 'hf-groq-llama-3.2', 'hf-donut', etc
  shadow_output JSONB,
  shadow_latency_ms INTEGER,
  shadow_cost_usd NUMERIC(10,6),
  divergence_score NUMERIC(5,4),   -- 0..1, se calcula offline
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_ai_shadow_feature_created ON ai_shadow_comparisons(feature, created_at DESC);

ALTER TABLE ai_shadow_comparisons ENABLE ROW LEVEL SECURITY;

-- Solo admin lee
CREATE POLICY "admin_select_ai_shadow" ON ai_shadow_comparisons
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ));

-- Solo service role escribe (desde edge fns)
-- insert policy no necesaria porque usamos service_role key
```

### 2.3. Helper `_shared/hf-client.ts`

Abstraccion unica para llamar HF. Centraliza auth, retries, telemetria.

**Archivo**: `supabase/functions/_shared/hf-client.ts`

```ts
import { logEdgeFunctionCall } from "./ai-base.ts";

type HFProvider = 'hf-inference' | 'groq' | 'together' | 'replicate';

interface HFCallOptions {
  provider: HFProvider;
  model: string;
  input: unknown;
  feature: string;
  userId?: string;
  timeoutMs?: number;
}

export async function callHF(opts: HFCallOptions): Promise<{
  output: unknown;
  latencyMs: number;
  costUsd: number;
  provider: string;
  model: string;
}> {
  const start = Date.now();
  const token = Deno.env.get(providerTokenKey(opts.provider));
  if (!token) throw new Error(`Missing token for ${opts.provider}`);

  const url = providerUrl(opts.provider, opts.model);
  const body = providerBody(opts.provider, opts.model, opts.input);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      throw new Error(`HF ${opts.provider} ${res.status}: ${await res.text()}`);
    }
    const output = await res.json();
    const latencyMs = Date.now() - start;
    const costUsd = estimateCost(opts.provider, opts.model, output);

    return { output, latencyMs, costUsd, provider: opts.provider, model: opts.model };
  } finally {
    clearTimeout(t);
  }
}

function providerTokenKey(p: HFProvider): string {
  switch (p) {
    case 'hf-inference': return 'HF_API_TOKEN';
    case 'groq': return 'GROQ_API_KEY';
    case 'together': return 'TOGETHER_API_KEY';
    case 'replicate': return 'REPLICATE_API_TOKEN';
  }
}

function providerUrl(p: HFProvider, model: string): string {
  switch (p) {
    case 'hf-inference': return `https://api-inference.huggingface.co/models/${model}`;
    case 'groq': return 'https://api.groq.com/openai/v1/chat/completions';
    case 'together': return 'https://api.together.xyz/v1/chat/completions';
    case 'replicate': return `https://api.replicate.com/v1/models/${model}/predictions`;
  }
}

function providerBody(p: HFProvider, model: string, input: unknown): unknown {
  if (p === 'groq' || p === 'together') {
    return { model, ...(input as object) };
  }
  return { inputs: input };
}

function estimateCost(p: HFProvider, model: string, output: unknown): number {
  // TODO(fase1): implementar por provider.model. Dejar 0 en shadow inicial.
  return 0;
}
```

### 2.4. Feature flags nuevos

**Archivo**: [src/lib/featureFlags.ts](src/lib/featureFlags.ts)

Agregar:

```ts
export const HF_FLAGS = {
  HF_PET_ASSISTANT_SHADOW: false,
  HF_PET_ASSISTANT_CANARY_PCT: 0,        // 0..100
  HF_BREED_TIPS_ROUTING: false,
  HF_OCR_DONUT: false,
  HF_WHISPER_SELFHOST: false,
  HF_RMBG_PAW_CARDS: false,
  HF_SEMANTIC_SEARCH: false,
  HF_BREED_CLASSIFIER: false,
  HF_NSFW_MODERATION: false,
  HF_TOXIC_MODERATION: false,
  HF_SAM2_SEGMENTATION: false,
  HF_FGS_AUTO_SCORE: false,
  HF_NLLB_TRANSLATION: false,
  HF_SD_MEMORIAL: false,
} as const;
```

Los flags del lado servidor se leen como `Deno.env.get('FLAG_HF_...')`.

### 2.5. Admin widget de monitoreo

Crear `src/components/admin/AIShadowMonitor.tsx` que muestra, por feature:

- Requests shadow / requests primarios (ultimas 24h)
- Latencia p50/p95 shadow vs primario
- Costo acumulado shadow vs primario
- Divergence score promedio
- Boton "Promote canary 5%" / "Rollback"

Insertar en [src/pages/Admin.tsx](src/pages/Admin.tsx) seccion Sistema > IA Shadow.

### 2.6. Checklist F1

- [ ] Migracion `ai_shadow_comparisons` aplicada en prod
- [ ] `_shared/hf-client.ts` commiteado y type-check pasa
- [ ] Secrets agregados en Supabase: `HF_API_TOKEN`, `GROQ_API_KEY` minimo
- [ ] Feature flags HF_* agregados (todos OFF)
- [ ] `AIShadowMonitor` renderizando aunque sea con data vacia
- [ ] Smoke test: llamar `callHF` desde una edge fn dummy y ver row en `ai_shadow_comparisons`

**Go/no-go F1 → F2**: monitor admin vivo, secrets configurados, 0 llamadas HF afectando a usuarios.

---

## 3. FASE 2 — Tier 1 (alto impacto, integracion directa)

### 3.1. Integracion #1 — bge-m3 + pgvector para busqueda semantica

**Modelo**: [`BAAI/bge-m3`](https://huggingface.co/BAAI/bge-m3) (embeddings multilingues, 1024 dim).
**Donde**: ficha clinica historica, directorio vets, servicios, refugios.
**Por que primero**: es la mas segura (no afecta IA medica, solo mejora busqueda), Supabase ya soporta pgvector.

**Paso a paso**:

1. **Migracion** `YYYYMMDDHHMMSS_pgvector_embeddings.sql`:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;

   -- Ficha clinica: vector por entry
   ALTER TABLE pet_medical_records ADD COLUMN IF NOT EXISTS embedding vector(1024);
   CREATE INDEX IF NOT EXISTS ix_medical_records_embedding
     ON pet_medical_records USING hnsw (embedding vector_cosine_ops);

   -- Vets/services/shelters: vector por registro
   ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS embedding vector(1024);
   CREATE INDEX IF NOT EXISTS ix_service_providers_embedding
     ON service_providers USING hnsw (embedding vector_cosine_ops);

   ALTER TABLE adoption_centers ADD COLUMN IF NOT EXISTS embedding vector(1024);
   CREATE INDEX IF NOT EXISTS ix_adoption_centers_embedding
     ON adoption_centers USING hnsw (embedding vector_cosine_ops);
   ```
2. **Edge function nueva**: `supabase/functions/embed-content/index.ts`
   - Input: `{ table: string, id: string, text: string }`
   - Llama HF Inference API con `BAAI/bge-m3`
   - Hace `UPDATE <table> SET embedding = $1 WHERE id = $2`
3. **Backfill job**: `supabase/functions/embed-backfill-cron/index.ts`
   - Procesa 50 rows por corrida (rate limit HF free tier)
   - Prioriza rows con `embedding IS NULL`
   - Corre 1x/hora hasta vaciar
4. **Trigger**: en update/insert de las 3 tablas, encolar en tabla `embedding_queue` (no llamar HF directo en trigger, es sincrono).
5. **RPC nuevo**: `search_medical_records_semantic(pet_id, query_text, limit)`:
   ```sql
   CREATE OR REPLACE FUNCTION search_medical_records_semantic(
     p_pet_id UUID, p_query_embedding vector(1024), p_limit INT DEFAULT 10
   ) RETURNS SETOF pet_medical_records AS $$
     SELECT * FROM pet_medical_records
     WHERE pet_id = p_pet_id AND embedding IS NOT NULL
     ORDER BY embedding <=> p_query_embedding
     LIMIT p_limit;
   $$ LANGUAGE sql STABLE;
   ```
6. **Frontend**: hook `useSemanticSearch(table, query)` que llama `embed-content` para el query + RPC. Componente `SemanticSearchBar` en pagina de ficha clinica.
7. **Flag**: `HF_SEMANTIC_SEARCH`. Default OFF. UI muestra busqueda clasica si flag OFF.

**Smoke test**: crear 5 medical records con textos conocidos, consultar con query semanticamente similar pero distinto literal, verificar top-1 correcto.

**Rollback**: flag OFF, busqueda vuelve a ILIKE. Migracion no se borra (las columnas `embedding` son NULL si flag OFF, no rompen nada).

**Beneficio cuantificado**:
- Usuario: encontrar "vomito con sangre" cuando la consulta original decia "hematemesis" o "sangrado gastrico".
- Tu: diferenciador vs competidores que siguen con LIKE/fulltext.

---

### 3.2. Integracion #2 — briaai/RMBG-2.0 (Paw Cards)

**Modelo**: [`briaai/RMBG-2.0`](https://huggingface.co/briaai/RMBG-2.0).
**Donde**: [src/components/paw-cards/](src/components/paw-cards/) al generar carta coleccionable.
**Por que segundo**: cero riesgo (visual), alto impacto viral/marketing, Pedro puede ver el diff al toque.

**Paso a paso**:

1. **Storage bucket nuevo**: `paw-card-processed` (Supabase Storage). Guarda la version con fondo removido.
2. **Edge function**: `supabase/functions/rmbg-paw-card/index.ts`
   - Input: `{ petId, sourceImageUrl }`
   - Llama HF Inference API con `briaai/RMBG-2.0`, recibe PNG transparente
   - Sube a `paw-card-processed/{petId}/{timestamp}.png`
   - Hace `UPDATE paw_cards SET processed_image_url = $1 WHERE pet_id = $2`
3. **Migracion**: agregar columna `processed_image_url TEXT NULL` en `paw_cards` (nullable → compatible con datos actuales).
4. **Cuando se ejecuta**: al crear o regenerar Paw Card. Asincrono, en cola (`paw_card_processing_queue`).
5. **UI**: mientras `processed_image_url IS NULL`, mostrar la foto original con mensaje "Generando tu carta premium...". Cuando aparece, swap visual con animacion holo.
6. **Flag**: `HF_RMBG_PAW_CARDS`. Default OFF. Si OFF, se muestra la foto original sin procesar.

**Smoke test**: subir 3 fotos de mascotas (pelo claro, pelo oscuro, ambiente complicado), validar PNG transparente correcto.

**Rollback**: flag OFF. UI vuelve a mostrar foto original. Imagenes procesadas quedan en storage (no se borran, por si se reactiva).

**Beneficio**:
- Usuario: Paw Cards lucen como producto premium de coleccion, aumentan share en redes.
- Tu: gancho viral + justificacion visual para features Paw Member.

---

### 3.3. Integracion #3 — Whisper large v3 (process-consultation-transcript)

**Modelo**: [`openai/whisper-large-v3`](https://huggingface.co/openai/whisper-large-v3) via Groq (mas rapido) o Replicate.
**Donde**: [supabase/functions/process-consultation-transcript/](supabase/functions/process-consultation-transcript/).
**Riesgo**: medio. Es feature activa de vets, si degrada impacta operacion clinica.

**Paso a paso**:

1. **Shadow mode (7 dias minimo)**:
   - En cada llamada a `process-consultation-transcript`, despues de obtener resultado con proveedor actual (OpenAI Whisper API), llamar a `callHF({ provider: 'groq', model: 'whisper-large-v3', ... })` en paralelo.
   - Guardar ambos outputs en `ai_shadow_comparisons`.
   - NO mostrar el output HF al usuario.
2. **Analisis offline (fin de shadow)**: calcular WER (Word Error Rate) comparando transcripciones. Si WER_hf <= WER_openai * 1.05, aprobar canary.
3. **Canary 10%**: flag `HF_WHISPER_SELFHOST_CANARY_PCT = 10`. Para 10% de vets (hash userId % 100 < 10), usar HF como primario. Fallback automatico si timeout o error.
4. **Escalar**: 10% → 25% → 50% → 100% con ventana de 48h entre steps.
5. **Monitor**: admin widget con WER samples, latencia, quejas (via feedback). Si quejas > baseline + 20%, rollback.

**Secrets**: `GROQ_API_KEY` en Supabase.

**Rollback**: `HF_WHISPER_SELFHOST_CANARY_PCT = 0`. Instantaneo.

**Beneficio**:
- Tu: ahorro estimado $0.006/min → $0.0001/min con Groq = 98% reduccion. Con 100 vets x 30 min/dia = $180/mes ahorrados con 0 degradacion de UX.
- Usuario: transcripciones 2-3x mas rapidas (Groq es famoso por velocidad).

---

### 3.4. Integracion #4 — Donut para OCR carnet vacunacion

**Modelo**: [`naver-clova-ix/donut-base-finetuned-cord-v2`](https://huggingface.co/naver-clova-ix/donut-base-finetuned-cord-v2) o fine-tune propio.
**Donde**: [supabase/functions/ocr-vaccination-card/](supabase/functions/ocr-vaccination-card/).
**Riesgo**: medio-alto. Carnets chilenos tienen formatos heterogeneos.

**Paso a paso**:

1. **Dataset de validacion**: pedir a Sofia (vet beta tester) y 2 vets mas 20 carnets reales diversos (buena foto, mala foto, manuscritos). Labelear manual como ground truth.
2. **Shadow mode**: en cada OCR, llamar primario (proveedor actual) + Donut. Comparar fields: `vacuna`, `fecha`, `lote`, `veterinario`, `proxima_dosis`.
3. **Metrica**: % de campos correctos sobre el dataset de validacion. Go si Donut >= primario * 0.95 **Y** tiempo/costo menor.
4. **Plan B si Donut no llega**: fine-tunear Donut con los 20 carnets + 50 sinteticos. Usar HF Autotrain o Colab (gratis para proyecto pequeno). Publicar el modelo fine-tuned privado en HF como `pawfriend/donut-carnet-vacunacion-cl`.
5. **Canary 10% → 100%** con misma cadencia que Whisper.

**Flag**: `HF_OCR_DONUT`.

**Rollback**: flag OFF, vuelve al proveedor original.

**Beneficio**:
- Usuario: menos errores, extraccion estructurada directa (menos campos que editar a mano).
- Tu: diferenciador unico en LATAM (carnets chilenos), base para vender feature "OCR ilimitado" en plan Paw Member si alguna vez se reactiva premium B2C.

---

### 3.5. Checklist F2

- [ ] Migracion pgvector aplicada, backfill corriendo
- [ ] `embed-content` deployado, 10% de records con embedding en 48h
- [ ] `rmbg-paw-card` vivo, Paw Cards nuevos con fondo removido
- [ ] Whisper shadow mode ejecutandose, dataset de WER >= 50 muestras
- [ ] Donut shadow mode con dataset de 20 carnets Sofia-aprobados
- [ ] Admin `AIShadowMonitor` mostrando las 4 integraciones
- [ ] 0 quejas de usuarios relacionadas con degradacion IA

**Go/no-go F2 → F3**: minimo 3 de 4 integraciones en canary 25%+ sin degradacion.

---

## 4. FASE 3 — Tier 2 (diferenciadores)

### 4.1. Integracion #5 — Llama 3.2 3B para routing de LLM

**Modelo**: [`meta-llama/Llama-3.2-3B-Instruct`](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct) via Groq.
**Donde**: router en `_shared/ai-base.ts` que decide entre Claude (caro, alta calidad) y Llama (barato, suficiente).
**Riesgo**: alto si se aplica mal en medical. Para **no medico** es bajo.

**Estrategia de routing**:

```ts
// supabase/functions/_shared/ai-router.ts
type Complexity = 'simple' | 'medium' | 'critical';

const ROUTING_RULES: Record<string, Complexity> = {
  'breed-tips': 'simple',
  'pet-assistant': 'medium',        // Claude si detecta urgencia
  'nutrition-coach': 'simple',
  'bereavement-assistant': 'medium', // Empatico: Claude
  'medical-suggestions': 'critical',  // Siempre Claude
  'symptom-triage': 'critical',       // Siempre Claude
  'wound-vision': 'critical',         // Siempre Claude
  'consultation-prep': 'medium',
};

export function pickLLM(feature: string, userInput: string): { provider, model } {
  const complexity = ROUTING_RULES[feature] ?? 'medium';
  if (complexity === 'critical') return anthropicConfig();

  // Deteccion de urgencia medica
  const emergencyRegex = /\b(sangre|convulsion|emergencia|urgente|muere|ahoga|no respira|veneno|intoxicacion)\b/i;
  if (emergencyRegex.test(userInput)) return anthropicConfig();

  // Routing por flag + complejidad
  if (complexity === 'simple' && getFlag('HF_LLAMA_ROUTING_SIMPLE')) return groqLlamaConfig();
  if (complexity === 'medium' && getFlag('HF_LLAMA_ROUTING_MEDIUM')) return groqLlamaConfig();
  return anthropicConfig();
}
```

**Paso a paso**:

1. Implementar router con tests unitarios (Vitest) para cada rule + emergency detection.
2. Shadow mode en `breed-tips` primero (menos riesgo).
3. Human eval: sesion con Sofia revisando 20 outputs Claude vs 20 Llama. Aprobar solo si > 80% "igual o mejor".
4. Canary en `breed-tips` → `nutrition-coach` → `pet-assistant` (no medico) → nunca en los `critical`.

**Flags**: `HF_LLAMA_ROUTING_SIMPLE`, `HF_LLAMA_ROUTING_MEDIUM`.

**Rollback**: flags OFF.

**Beneficio**:
- Tu: estimado -60-80% costo Anthropic en features de alto volumen (breed-tips, nutrition-coach). Con 500 users activos mes → $150-400/mes ahorrados.
- Usuario: sin cambio perceptible si routing bien calibrado.

---

### 4.2. Integracion #6 — Breed classifier en onboarding

**Modelos**:
- Perros: [`wesleyacheng/dogs-breed-image-classification`](https://huggingface.co/models?search=dog+breed) o [`microsoft/beit-base-patch16-224`](https://huggingface.co/microsoft/beit-base-patch16-224) fine-tune.
- Gatos: [`dennisjooo/cat-breeds-classifier`](https://huggingface.co/models?search=cat+breed).

**Donde**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx), al subir foto.

**Paso a paso**:

1. **Edge function**: `supabase/functions/detect-breed/index.ts`
   - Input: `{ imageUrl, species: 'dog'|'cat' }`
   - Llama HF Inference con modelo segun species
   - Retorna `{ primary_breed, confidence, alternatives: [...] }`
2. **UX**: user sube foto → "Estamos detectando la raza..." → si confidence > 0.7, sugerir raza (con boton "No es esa"). Si < 0.7, no sugerir nada.
3. **Respeto a "mestizo"**: si top-3 breeds tienen score similar (< 0.4 entre 1ro y 3ro), sugerir "Mestizo / Quiltro" como opcion principal. Importante por regla chilena ya normalizada.

**Flag**: `HF_BREED_CLASSIFIER`.

**Rollback**: flag OFF, onboarding vuelve a picker manual.

**Beneficio**:
- Usuario: onboarding 10 seg mas corto, experiencia magica.
- Tu: mejor calidad de data de razas (hoy muchos "quiltro" que realmente son razas identificables).

---

### 4.3. Integracion #7 — Moderacion texto con toxic-bert

**Modelo**: [`unitary/multilingual-toxic-xlm-roberta`](https://huggingface.co/unitary/multilingual-toxic-xlm-roberta) (incluye espanol).
**Donde**: feed posts, comments, reviews, chat, adoption posts.

**Paso a paso**:

1. **Edge function**: `supabase/functions/moderate-text/index.ts`
   - Input: `{ text, context: 'feed'|'review'|'chat'|'adoption' }`
   - Llama HF, retorna `{ scores: { toxic, insult, threat, ... }, should_block }`
2. **Integrar** en:
   - `useCreatePost()` antes de insert
   - `useCreateReview()` antes de insert
   - `useSendMessage()` antes de insert (chat)
3. **Thresholds**: `toxic > 0.7 → block`; `0.4-0.7 → flag para admin review (tabla `content_moderation_queue`)`; `< 0.4 → pasa`.
4. **UX cuando se bloquea**: toast "Tu mensaje contiene lenguaje que no permitimos. Revisalo y vuelve a intentar." Con link a guidelines.

**Flag**: `HF_TOXIC_MODERATION`.

**Beneficio**:
- Tu: moderacion a costo ~$0 (modelo chico, puede correr en Deno via transformers.js), cumple requisitos Play/App Store de UGC.
- Usuario: feed/reviews/chat mas sanos.

---

### 4.4. Integracion #8 — NSFW detector en fotos

**Modelo**: [`Falconsai/nsfw_image_detection`](https://huggingface.co/Falconsai/nsfw_image_detection).
**Donde**: upload de fotos de perfil, mascotas, feed posts.

**Paso a paso**:

1. **Edge function**: `supabase/functions/moderate-image/index.ts`
   - Input: `{ imageUrl }`
   - Retorna `{ nsfw_score, safe: boolean }`
2. **Hook a storage upload**: cada vez que se sube imagen via storage RLS, trigger posterior que llama `moderate-image` async.
3. **Si nsfw_score > 0.6**: marcar imagen en tabla `flagged_images` + notificar admin. Imagen sigue visible pendiente revision.
4. **Si nsfw_score > 0.9**: auto-block, reemplazar con placeholder, notificar admin + usuario.

**Flag**: `HF_NSFW_MODERATION`.

**Beneficio**:
- Tu: requisito App Store ("have filtering of objectionable material"). Sin esto, rechazos probables.
- Usuario: entorno seguro.

---

### 4.5. Checklist F3

- [ ] Router LLM en produccion para breed-tips + nutrition-coach
- [ ] Breed classifier activo en onboarding con opt-out
- [ ] Moderacion texto cubriendo 100% de posts/reviews/chat
- [ ] NSFW scan corriendo en todo upload de imagen
- [ ] Costo Anthropic/OpenAI mensual reducido >=40% vs baseline pre-HF
- [ ] 0 incidentes de contenido inapropiado reportados post-moderacion

**Go/no-go F3 → F4**: F3 estable 2 semanas sin incidentes, costo reducido verificado.

---

## 5. FASE 4 — Tier 3 (experimentales)

### 5.1. Integracion #9 — SAM2 para medicion de crecimiento

**Modelo**: [`facebook/sam2`](https://huggingface.co/facebook/sam2-hiera-large).
**Donde**: timeline de mascota, ficha clinica.
**Estado**: experimental. Requiere referencia de escala en foto (moneda, cinta metrica) para calcular tamanos reales.

**MVP**: en ficha clinica, opcion "Medir crecimiento desde foto". Subir foto con referencia → SAM2 segmenta mascota → calcula ratio. Mostrar grafico `altura_estimada vs tiempo`.

**Flag**: `HF_SAM2_SEGMENTATION`.

### 5.2. Integracion #10 — Feline Grimace Scale automatico

**Modelo**: no hay uno dominante en HF. Opciones:
- Investigar papers 2022-2025 de FGS automatico, ver si hay checkpoints publicos.
- Fine-tunear un CNN desde cero con dataset FGS + mentoria de Sofia.

**Plan real**: F4.1 es investigacion 1 semana. Si no hay modelo publicable, dejar en backlog hasta tener dataset propio (6+ meses).

**Flag**: `HF_FGS_AUTO_SCORE`.

### 5.3. Integracion #11 — NLLB-200 para expansion LATAM

**Modelo**: [`facebook/nllb-200-distilled-600M`](https://huggingface.co/facebook/nllb-200-distilled-600M).
**Cuando**: cuando Paw Friend se expanda a Brasil o Mexico (plan anio 3 segun market_projection).
**Accion ahora**: dejar hook en i18n preparado. Default OFF. No implementar hasta decision de expansion.

### 5.4. Integracion #12 — Stable Diffusion retratos memoriales

**Modelo**: [`stabilityai/stable-diffusion-xl-base-1.0`](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) + LoRA pet-style.
**Donde**: [src/pages/EnMemoria.tsx](src/pages/EnMemoria.tsx).
**UX**: subir foto → generar retrato artistico (3 estilos: acuarela, oleo, illustracion) → descargar PDF de recuerdo.

**Consideracion sensible**: es feature emocional. Se ofrece **solo** cuando usuario cliquea un CTA explicito ("Generar retrato de recuerdo"). Nunca automatico.

**Flag**: `HF_SD_MEMORIAL`.

---

## 6. Plan de rollback global

Si en cualquier momento se detecta degradacion critica:

1. **Rollback instantaneo**: setear todos los flags `HF_*` a `false` en tabla de feature flags (si aplica) o redeploy con env vars OFF.
2. **Validar**: smoke test del feature afectado vuelve a golden path.
3. **Postmortem**: guardar logs de `ai_shadow_comparisons` + telemetria del periodo afectado. Documentar en memoria `project_session_YYYY_MM_DD_hf_rollback.md`.

---

## 7. Metricas de exito

### 7.1. Tecnicas

| Metrica | Baseline pre-HF | Objetivo post-F3 | Objetivo post-F4 |
|---|---|---|---|
| Costo IA/mes (USD) | ~$X (medir ahora) | -40% | -60% |
| Latencia p95 pet-assistant | Y ms | <= baseline | <= baseline |
| WER transcripcion vet | Z% | <= baseline | < baseline |
| % posts moderados auto | 0% | 95%+ | 98%+ |
| Bundle client (solo agregados) | N MB | N + 0.5 MB max | N + 1 MB max |

### 7.2. Producto

- NPS vet (Sofia + betas): sin degradacion por IA, preferiblemente +5 puntos por features nuevas.
- Time-to-onboard mascota: -20% con breed classifier.
- Share de Paw Cards en redes: +50% con RMBG.
- Quejas de contenido inapropiado: -80% con moderacion automatica.

---

## 8. Secretos y credenciales requeridas

**A configurar por Paw Founder** (NO commitear):

| Variable | Proveedor | Costo estimado |
|---|---|---|
| `HF_API_TOKEN` | huggingface.co (free tier generoso) | $0-9/mes |
| `GROQ_API_KEY` | groq.com | $0.05/1M tokens |
| `REPLICATE_API_TOKEN` | replicate.com | Pay-per-second |
| `TOGETHER_API_KEY` (opcional) | together.ai | Pay-per-token |

Comando para setear secrets:
```bash
npx supabase secrets set HF_API_TOKEN=hf_xxx --project-ref gwailbjlvevkhwcrovfd
npx supabase secrets set GROQ_API_KEY=gsk_xxx --project-ref gwailbjlvevkhwcrovfd
```

---

## 9. Orden recomendado de ejecucion

Cronograma sugerido (4-6 semanas):

| Semana | Hitos |
|---|---|
| 1 | F1 completa (infra, tabla shadow, hf-client, monitor admin) |
| 2 | #1 bge-m3 en shadow, #2 RMBG en canary |
| 3 | #3 Whisper shadow + #4 Donut shadow, #2 RMBG en GA |
| 4 | #1 bge-m3 GA, #3 Whisper canary 10-50% |
| 5 | #5 Llama routing (breed-tips, nutrition-coach), #7 toxic-bert, #8 NSFW |
| 6 | #6 breed classifier, consolidacion, analisis de costos |
| 7-10 | F4 segun decision de prioridades post-F3 |

---

## 10. Decisiones pendientes que requieren input de Paw Founder

1. **Budget inicial HF/Groq/Replicate**: cuanto estas dispuesto a gastar/mes en API externas durante shadow mode? Estimacion: $10-30/mes primeras 4 semanas (mayoria shadow, poco volumen).
2. **Dataset carnets vacunacion**: disponibilidad de Sofia + 2 vets mas para labellear 20-30 carnets reales (1-2 horas de trabajo).
3. **Hosting: API externa vs VPS**: empezar con API externa (este plan) o montar VPS con GPU desde el dia 1? Recomendacion: API externa primero, VPS solo si el costo mensual supera $80.
4. **Modelos criticos medicos**: mantener Claude Sonnet 4.6 siempre en `medical-suggestions`, `symptom-triage`, `wound-vision` (no routing a HF). Confirmar.
5. **Publicar fine-tunes propios**: autorizacion para publicar modelos fine-tuned en HF bajo organizacion `pawfriend` (publicos o privados).

---

## 11. Riesgos identificados y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| HF API rate limits en free tier | Alta | Medio | Pay-as-you-go desde dia 1 ($9/mes PRO) + retry con backoff |
| Degradacion calidad medica con Llama | Media | Alto | Routing excluye medical, shadow mode minimo 7 dias, Sofia eval |
| Latencia HF > Anthropic (inference fria) | Media | Medio | Keep-warm con cron ping, timeout 10s con fallback automatico a Anthropic |
| Costo hidden de Groq/Replicate | Baja | Medio | Budget alerts en panel admin, kill switch automatico si costo > umbral/dia |
| Usuario percibe degradacion UX | Media | Alto | Shadow mode + canary gradual, feedback widget con campo "algo cambio en la IA?" |
| Cumplimiento datos personales (GDPR-like) | Baja | Alto | Provider europeo preferido (HF basado EU), no enviar PII a HF Inference (anonimizar input) |

---

## 12. Como iterar este plan

Este documento es vivo. Actualizar cuando:

- Se completa una fase (marcar checklist)
- Un modelo cambia de proveedor (p.ej. HF → Replicate)
- Un flag pasa de shadow → canary → GA
- Se descubre un riesgo nuevo
- Metricas de exito se ajustan segun datos reales

**Regla**: antes de mergear cambios a integraciones HF, actualizar la seccion correspondiente y mover el feature flag a su nuevo estado.

---

## Anexo A — Mapeo de edge functions impactadas

| Edge function actual | Integracion HF | Tipo de cambio |
|---|---|---|
| `pet-assistant` | #5 Llama routing | Router condicional |
| `breed-tips` | #5 Llama routing | Router condicional |
| `nutrition-coach` | #5 Llama routing | Router condicional |
| `bereavement-assistant` | #5 Llama (medium) | Router condicional con cuidado |
| `ocr-vaccination-card` | #4 Donut | Shadow → canary → primary |
| `process-consultation-transcript` | #3 Whisper | Shadow → canary → primary |
| `moderate-service-promotion` | #7 toxic-bert | Extender cobertura |
| (nueva) `embed-content` | #1 bge-m3 | Nueva |
| (nueva) `embed-backfill-cron` | #1 bge-m3 | Nueva |
| (nueva) `rmbg-paw-card` | #2 RMBG | Nueva |
| (nueva) `detect-breed` | #6 breed classifier | Nueva |
| (nueva) `moderate-text` | #7 toxic-bert | Nueva |
| (nueva) `moderate-image` | #8 NSFW | Nueva |
| Intactas (no cambian) | — | `medical-suggestions`, `symptom-triage`, `wound-vision`, `verify-vet-document`, `flow-*`, `google-calendar-*` |

---

## Anexo B — Comandos utiles

```bash
# Aplicar migracion localmente para test
npx supabase db reset --local

# Deploy una edge function especifica
npx supabase functions deploy embed-content --project-ref gwailbjlvevkhwcrovfd

# Ver logs en vivo
npx supabase functions logs embed-content --project-ref gwailbjlvevkhwcrovfd --follow

# Set secret
npx supabase secrets set HF_API_TOKEN=hf_xxx --project-ref gwailbjlvevkhwcrovfd

# Test local de edge function antes de deploy
npx supabase functions serve embed-content
```

---

**Fin del plan.** Cualquier agente IA o colaborador humano que trabaje en una integracion HF debe leer primero este documento y actualizarlo al completar su trabajo.
