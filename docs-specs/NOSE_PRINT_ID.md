# Nose Print ID — Biometría nasal como identidad primaria en Paw Friend

> Spec para capturar, almacenar y matchear huellas nasales de perros y gatos como **identificador biométrico primario** en la experiencia Paw Friend. El microchip ISO se mantiene como dato legal secundario (requerido por Ley 21.020) pero no es el modo en que la mascota se "reconoce" en la app.
>
> **Reescrita 2026-04-23** tras conversación estratégica Pedro sobre postura ética hacia el chip implantado. Reemplaza versión previa "chip primario + nose print complemento" por la actual "nose print primario + chip como receipt legal".
>
> **Estado**: Aprobado para implementación en Fase 1 del [Refactor Maestro 2026-04-23](../docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md)
> **Prioridad**: Alta (pilar 2 de la Trinidad del Corazón)
> **Owner**: Paw Founder
> **Dependencias**:
> - Extension `vector` (pgvector) habilitada en Supabase — confirmado 2026-04-23 por Pedro ✅
> - Edge functions nose-print-embed + nose-print-match (Fase 1)
> - Modelo biométrico: API Petnow (trial) o modelo open source MobileNetV3 + fine-tuning
> - Postura pública: [POSTURA_BIOMETRIA_2026_04_23.md](../docs-raiz/pitch/POSTURA_BIOMETRIA_2026_04_23.md)

---

## 1. Postura de producto (explícita y central)

### 1.1. Qué es la huella nasal

El patrón de surcos y rugosidades en la nariz de perros y gatos es **único e inmutable desde ~6 meses de edad**. Funciona como huella digital:

- **Único por individuo** (igual que huella humana)
- **Estable en el tiempo** (no cambia con el crecimiento o la edad adulta)
- **Extraíble con una cámara de celular** usando deep learning
- **No invasivo**: no requiere implante, cirugía ni manipulación

Precedentes comerciales: Petnow (Corea, Series A $12M USD, partner Samsung). Precedentes académicos: Pet Biometric Challenge CVPR 2022 con 97–99% rank-1 accuracy.

### 1.2. Decisión de producto (reforzada 2026-04-23)

> **Paw Friend adopta la huella nasal como identidad PRIMARIA de la mascota. El microchip sigue en la ficha como trámite legal (Ley 21.020), pero no es el modo en que la app, la Pet ID Card, los partners ni el día a día "conocen" a la mascota.**

**Por qué esta postura**:

1. **Ética**: los animales no consienten al implante. Hoy existe alternativa no invasiva equivalente. Seguir prefiriendo el chip sobre la biometría es inercia histórica, no decisión ética defendible.
2. **Usabilidad**: cualquier celular escanea nariz. Ningún dueño tiene lector de chip. En el día a día (identificar mascota, compartir ficha, escanear en partner), la biometría funciona y el chip no.
3. **Diferenciación**: Chewy, Mars, Purina venden productos alineados con status quo del chip. No pueden tomar esta postura sin contradecirse. Paw Friend sí puede — es su marca.
4. **Data moat**: la huella nasal captada por la app (con embedding en pgvector) es el activo que conecta a la mascota con todas las otras tablas (timeline, historia, Pet ID Card, partners). Es la llave del modelo de datos.

### 1.3. Lo que NO hacemos (para no romper legal)

**NO le decimos al usuario "no le pongas chip a tu mascota"**. La Ley 21.020 lo exige en Chile. Hacerlo expondría al dueño a:
- Multas municipales (Providencia, Las Condes, Vitacura, Ñuñoa)
- Problemas de registro en Cholito (Registro Nacional de Mascotas)
- Bloqueo de viajes internacionales (UE, USA, LATAM exigen chip)
- Problemas en transferencia legal

**SÍ le decimos**: "el chip es el trámite legal. Nosotros lo registramos en tu ficha. Pero Paw Friend identifica a tu mascota por su huella nasal, igual que vos te identificas por tu huella digital."

Ver [POSTURA_BIOMETRIA_2026_04_23.md](../docs-raiz/pitch/POSTURA_BIOMETRIA_2026_04_23.md) para el manifiesto completo publicable.

### 1.4. Casos de uso ordenados

| # | Caso | Prioridad | Fase |
|---|---|---|---|
| 1 | Onboarding mascota: capturar huella como ID permanente + recordatorio de chip opcional | Alta | Fase 0–1 |
| 2 | Pet ID Card — nose print hash visible como llave biométrica (junto a card_number, microchip) | Alta | Fase 0 |
| 3 | Mascota perdida: quien encuentra escanea en `/nose-scan` → match → contacto dueño (consent-gated) | Alta | Fase 1 |
| 4 | Scanner físico en partner (vet, retail, peluquería, refugio) — identifica mascota al entrar | Media | Fase 2 |
| 5 | Verificación en transferencia refugio → adoptante | Media | Fase 2 |
| 6 | Re-auth en consulta vet: vet escanea para confirmar identidad del paciente | Baja | Fase 2+ |
| 7 | Evidencia forense de maltrato animal (identificar post-mortem) | Baja | Fase 2+ |
| 8 | Re-claim de mascota rescatada con nose print previa | Media | Fase 1 |

### 1.5. Segmentos ganados

Frente a competidores (Chewy, Petnow Korea, Petco LoveLost, apps chilenas locales):

- **Dueños urbanos tech-forward**: adoptan nose print por ética + conveniencia
- **Rescatistas / refugios**: capturan huella al ingresar mascota (sin chip barato)
- **Vets progresistas**: valoran reducir procedimientos invasivos
- **Dueños rurales**: sin acceso a vet para implantar chip, biometría vía celular resuelve
- **Mercados LATAM sin adopción de chip (88%)**: leapfrog directo desde identificación por collar a biometría digital

---

## 2. Arquitectura técnica

### 2.1. Captura — frontend

**Componente**: `src/components/onboarding/NosePrintCapture.tsx` (a crear Fase 1)

**Flujo**:

1. Permiso de cámara con `getUserMedia` (video continuo)
2. Overlay visual guía: contorno de nariz superpuesto sobre el video
3. Detección on-device de presencia de nariz con modelo face-detection ligero (~200 KB TFLite)
4. Cuando el modelo detecta nariz enfocada + bien iluminada → captura 3 frames automáticos
5. Validación de calidad: resolución mínima 600×600, nitidez score > threshold (Laplacian variance > 100)
6. Si calidad OK → envío a backend para embedding
7. Si calidad insuficiente → retry hasta 5 veces con hint visual

**Tiempo usuario**: <30 segundos promedio.

**Edad mínima**: 6 meses (consenso técnico). En mascotas menores, la app agenda recordatorio "capturar huella cuando cumpla 6 meses" y genera Pet ID Card sin nose print temporalmente.

### 2.2. Embedding — edge function

**Archivo**: `supabase/functions/nose-print-embed/index.ts`

**Input**: `{ pet_id: UUID, images: [base64, base64, base64] }` (3 frames)

**Proceso**:

1. Validar auth (caller debe ser owner del pet o admin)
2. Decodificar imágenes, normalizar (resize 224×224, channel RGB)
3. Llamar a modelo:
   - **Opción A (Fase 1 inicial)**: API comercial Petnow (`POST https://api.petnow.io/v1/embeddings`) en modo trial → $0 hasta 100 req/mes
   - **Opción B (Fase 1 maduro)**: modelo propio MobileNetV3 fine-tuned en CVPR 2022 Pet Biometric dataset, inferencia serverless con `@tensorflow/tfjs-node` o vía edge function Python (Deno soporta Python via WebAssembly)
4. Cada imagen genera 1 embedding de 512 floats. Promediar los 3 → 1 embedding consolidado
5. Quality score: similitud promedio entre los 3 embeddings originales (debe ser >0.92 — si no, al menos una foto es de otra mascota o mal capturada)
6. Guardar en `nose_prints(pet_id, embedding, short_hash, quality_score, captured_at)`
7. Generar `short_hash` visible para Pet ID Card: `NP-` + primeras 8 chars del SHA256 del embedding, separado por guión (ej: `NP-A4F29X12`)

**Output**: `{ success: true, short_hash: "NP-A4F29X12", quality_score: 0.95 }`

### 2.3. Matching — edge function

**Archivo**: `supabase/functions/nose-print-match/index.ts`

**Input**: `{ image: base64, threshold?: number }` (default threshold 0.85)

**Proceso**:

1. Generar embedding de la imagen nueva (mismo modelo que 2.2)
2. Llamar a RPC `match_nose_print(p_embedding, p_threshold, p_limit)` que hace similarity search con pgvector (`<=>` cosine distance) sobre tabla `nose_prints`
3. Retornar top-3 matches con score

**Output**: `{ matches: [{ pet_id, similarity, public_info }, ...] }`

Donde `public_info` respeta el **consent del dueño** (solo muestra datos si el dueño activó "modo emergencia público" o "modo compartir"). En modo privado retorna solo `pet_id` y solicita verificación adicional al dueño via push.

### 2.4. Schema de DB

Ver migración: `supabase/migrations/20260815000000_nose_print_system.sql` (a crear Fase 1)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.nose_prints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  embedding VECTOR(512) NOT NULL,
  short_hash TEXT NOT NULL UNIQUE,            -- Ej: NP-A4F29X12, visible en ID Card
  capture_url TEXT,                            -- Thumbnail 200x200 en storage
  quality_score REAL NOT NULL CHECK (quality_score BETWEEN 0 AND 1),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_by_user_id UUID REFERENCES auth.users(id),
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  source TEXT NOT NULL DEFAULT 'onboarding'
    CHECK (source IN ('onboarding', 'partner_scanner', 'recapture', 'admin_upload')),
  UNIQUE (pet_id, is_primary) DEFERRABLE INITIALLY DEFERRED  -- Solo 1 primario activo
);

CREATE INDEX idx_nose_prints_embedding
  ON public.nose_prints
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_nose_prints_short_hash ON public.nose_prints(short_hash);
CREATE INDEX idx_nose_prints_pet_id ON public.nose_prints(pet_id);

ALTER TABLE public.nose_prints ENABLE ROW LEVEL SECURITY;

-- Owner ve y gestiona sus propias huellas
CREATE POLICY "Owners manage own nose prints"
  ON public.nose_prints FOR ALL
  USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));

-- Matching permitido a cualquier autenticado (pero solo retorna pet_id;
-- detalles se revelan via edge fn con consent)
CREATE POLICY "Authenticated can match"
  ON public.nose_prints FOR SELECT TO authenticated USING (true);

-- Función RPC de matching
CREATE OR REPLACE FUNCTION public.match_nose_print(
  p_embedding VECTOR(512),
  p_threshold REAL DEFAULT 0.85,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (pet_id UUID, similarity REAL, short_hash TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    pet_id,
    1 - (embedding <=> p_embedding) AS similarity,
    short_hash
  FROM nose_prints
  WHERE is_primary = TRUE
    AND 1 - (embedding <=> p_embedding) > p_threshold
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit;
$$;
```

### 2.5. Integración con Pet ID Card

La Pet ID Card (generada por `generate-pet-id-card` edge fn) **incluye el `short_hash` del nose print primario** como uno de los 3 identificadores visibles:

- Card Number (`PF-2026-A4F29X`)
- Nose Print Hash (`NP-A4F2-9X`)
- Microchip ISO (`956000012345678`, si tiene)

Los 3 son llaves independientes que resuelven al mismo `pet_id` via RPC `resolve_pet_identity`. Ver [Plan Maestro §2.4.1](../docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md).

---

## 3. Validación Fase -1 (pre-Fase 1)

Antes de construir toda la infraestructura, validamos que la tecnología funciona con mascotas chilenas reales. Ver detalle en [_pending/FASE_-1_VALIDACION_2026_04_24.md](../_pending/FASE_-1_VALIDACION_2026_04_24.md).

**Criterios de go/no-go**:

- Accuracy >95% same-pet, <2% false positive cross-pet → GO con modelo base
- Accuracy 85–95% → GO con fine-tuning local en Fase 1 (+$3–8k USD GPU training)
- Accuracy <85% → pivotar a API comercial Petnow (dependencia externa, $0.0005/match)

**Pedro tomará 3–5 fotos de cada una de sus 5 mascotas propias (3 perros + 2 gatos) y Claude corre script de validación** (`scripts/nose_print_validation.py`, a crear).

---

## 4. Costos proyectados

### Fase 1 (validación + MVP)
- API Petnow trial: $0
- Si uso real >100 matches/mes: $0.0005/match × ~500 matches = $0.25/mes
- Supabase pgvector: $0–15/mes
- **Total Fase 1**: <$20/mes

### Fase 2 (escala)
- Si 10k mascotas con nose print registrado + 5k matches/mes:
- API comercial: $2.50/mes — despreciable
- Si modelo propio: training one-time $3–8k USD + inferencia serverless ~$50–150/mes
- **Decisión Y2**: si >50k matches/mes → pasar a modelo propio (más barato + más privacidad)

---

## 5. Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Accuracy baja en razas mixtas chilenas | Media | Alto | Validación Fase -1 antes de Fase 1 |
| Dueños no confían en biometría digital | Baja | Medio | Postura pública transparente + tutorial claro |
| Regulador chileno (SAG) objeta mensaje "chip secundario" | Baja | Alto | Legal review de postura biométrica + copy explícita "ley pide chip, lo registramos" |
| Competidor global (Petnow, Chewy) entra a LATAM | Media | Alto | Velocidad + red partners + data moat + postura ética |
| API Petnow cierra trial o sube precios | Media | Bajo | Migrar a modelo propio en Y2 (ya planeado) |
| pgvector performance con 100k+ embeddings | Baja | Medio | HNSW index + benchmark Fase 1 |

---

## 6. Privacidad y consent

**Principios**:

- El dueño consiente explícitamente al capturar huella nasal de su mascota
- El embedding NUNCA se comparte individualmente con terceros
- El matching retorna solo `pet_id` público — los datos del dueño se revelan solo con su consent o en modo emergencia (mascota perdida)
- El dueño puede borrar su huella en cualquier momento (`DELETE FROM nose_prints WHERE pet_id = ?`)
- Data agregada anónima (ej: "accuracy del modelo" o "cuántas mascotas escaneadas por raza") se puede usar para insights B2B con k-anonymity k≥50

**Compliance Ley 21.720 Chile (datos personales)**:

Aunque datos de mascotas no son "datos personales" bajo la ley chilena, los metadatos asociados (nombre del dueño, contacto) sí lo son. Por eso:

- Consent banner en onboarding
- Política de privacidad clara sobre uso de nose print
- Derecho al olvido implementado

---

## 7. Próximos pasos

- [x] Spec reescrito con postura nueva (este documento, 2026-04-23)
- [ ] Postura pública manifestada en [POSTURA_BIOMETRIA_2026_04_23.md](../docs-raiz/pitch/POSTURA_BIOMETRIA_2026_04_23.md)
- [ ] Fase -1: validación con 5 mascotas de Pedro (Script Python, 1 semana)
- [ ] Fase 1 Semana 1: aplicar migración `20260815000000_nose_print_system.sql`
- [ ] Fase 1 Semana 2-3: edge functions embed + match
- [ ] Fase 1 Semana 4: componente NosePrintCapture en onboarding
- [ ] Fase 1 Semana 5: ruta pública `/nose-scan`
- [ ] Fase 1 Semana 6: integración con Pet ID Card (short_hash visible)

---

## 8. Historial

| Fecha | Cambio |
|---|---|
| 2026-04-21 | Primera versión del spec (chip primario + nose print complemento) |
| 2026-04-23 | **Reescrito completo**: nose print primario, chip como receipt legal, postura ética explícita. Autor: Claude Opus 4.7 tras conversación estratégica con Pedro |
