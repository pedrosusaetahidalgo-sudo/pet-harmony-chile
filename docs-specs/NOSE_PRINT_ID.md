# Nose Print ID — Biometria nasal para mascotas

> Spec para capturar, almacenar y matchear huellas nasales de perros y gatos como identificador biometrico unico. Complementa (no reemplaza) el microchip legal.

**Estado**: Pendiente de aprobacion tecnica
**Prioridad**: Alta (feature diferenciadora unica en Chile/LATAM)
**Fecha**: 2026-04-21
**Owner**: Paw Founder
**Dependencias**:
- Campo `microchip_number` ya existe en `pets` (se mantiene)
- Requiere extension `vector` (pgvector) habilitada en Supabase — prerequisito del [plan HF integraciones #1](../docs-raiz/planes/HUGGINGFACE_INTEGRATIONS_PLAN.md)
- [/qr/:token](../src/pages/QRLanding.tsx) landing publica existente (se extendera)

---

## 1. Contexto y decision de producto

### 1.1. Que es

La **huella nasal** (nose print) de perros y gatos es un patron unico de surcos y rugosidades que:
- Es distinto para cada individuo (como una huella digital humana).
- No cambia con el tiempo una vez que el animal es adulto (>6 meses).
- Puede extraerse con una foto frontal de la nariz usando deep learning.

Ya hay precedentes comerciales (Petnow en Corea del Sur, respaldado por Samsung) y academicos (Pet Biometric Challenge CVPR 2022, papers 2021-2024).

### 1.2. Decision de producto (confirmada 2026-04-21)

**Nose Print ID es COMPLEMENTO, NO REEMPLAZO del microchip.**

Razones:
- **Ley 21.020** (Ley Cholito) y el Registro Nacional de Mascotas aceptan microchip ISO 11784/11785 como identificacion legal, no nose print.
- Viajes internacionales (UE, USA, LATAM) **exigen microchip**. Nose print no es aceptado en ningun pais hoy.
- Algunas municipalidades (Providencia, Las Condes, Vitacura, Nunoa) exigen chip para patente.
- Promover "no necesitas chip, tenes nose print" podria exponer a dueños a multas, problemas de registro o viajes bloqueados.

**Posicionamiento correcto**:
> "Paw Friend es la primera app en Chile que identifica a tu mascota con biometria — complementando el microchip o cuando no tiene."

### 1.3. Casos de uso

| # | Caso | Prioridad |
|---|---|---|
| 1 | Onboarding de mascota: capturar nose print como ID permanente + recordatorio de chip | Alta |
| 2 | Lost pet: quien encuentra una mascota sin collar/QR escanea nariz en [/nose-scan](../src/pages/NoseScan.tsx) → match contra DB | Alta |
| 3 | Verificacion de titularidad en transferencias (refugios → adoptante, ventas) | Media |
| 4 | Vets: verificar identidad del paciente en cada consulta | Baja (nice-to-have) |
| 5 | Registro de mascotas rescatadas sin chip en refugios | Media-Alta |

### 1.4. Segmentos ganados

- **Dueños con chip** (~15-25% en Chile): nose print es bonus + backup emocional.
- **Dueños sin chip** (~75-85% en Chile): nose print es su **primera identificacion real** hoy.
- **Refugios**: pueden registrar rescatados en el momento + QR + nose print, aunque no tengan chip aun.
- **Vets**: ganan una herramienta gratis, no les quitas venta de chip.

---

## 2. Modelo ML — Pet Biometric Challenge

### 2.1. Fuente

- **Repo**: [Pet_Biometric_Challenge (CVPR 2022)](https://github.com/wkrcarry/Pet_Biometric_Challenge) — codigo abierto del challenge TIANCHI CVPR2022 Biometrics Workshop.
- **Paper**: Dog Nose-Print Identification Using Deep Neural Networks (2021).
- **Arquitectura tipica**: Siamese network con backbone ResNet-50 o EfficientNet, output embedding 512-d, loss triplet o arcface.
- **Dataset challenge**: ~6.000 perros chinos, ~50 imagenes por individuo.

### 2.2. Licencia y restricciones

- Repos referenciados estan bajo MIT / Apache 2.0 (revisar cada fork antes de usar).
- Pesos pre-entrenados suelen ser libres para uso no comercial; para comercial hay que revisar licencia exacta y alternativas (Siamese propio sobre embeddings SigLIP2, por ejemplo).
- **TODO pre-implementacion**: leer LICENSE del repo elegido y documentar en este spec. Si no permite comercial, usar alternativa con licencia permisiva.

### 2.3. Limitaciones honestas

| Limitacion | Mitigacion |
|---|---|
| Entrenado en perros chinos, puede rendir peor en razas exoticas/mestizos chilenos | Recolectar 200-500 fotos chilenas los primeros 3 meses; si accuracy < 80%, fine-tune |
| Gatos con nariz oscura tienen menos contraste en el patron → peor matching | Mensaje UI "para gatos con nariz negra, usa buena luz". Threshold mas alto para confirmar match en gatos |
| Requiere foto frontal y cercana (< 15 cm) → fricccion UX | Overlay de camara con guia visual ("alinea la nariz en el circulo, sin mover") |
| Cachorros (< 6 meses) tienen nariz que aun cambia | Permitir captura pero marcar "preliminar", re-captura obligatoria a los 8 meses |
| Foto borrosa o mal enfocada rompe el embedding | Validacion de calidad: sharpness score > umbral antes de aceptar |

### 2.4. Hosting del modelo

**Opcion elegida (MVP)**: Replicate o HF Inference API.

- Pros: cero infra, pay-per-use, rollback facil.
- Costo estimado: $0.0005 - $0.002 por inferencia (captura y match son 2 inferencias).
- Con 1000 mascotas registradas + 100 matches/mes = ~$5/mes total.

**Opcion futura (post-MVP, solo si volumen justifica)**: self-host con ONNX runtime en edge fn Supabase o VPS pequeno.

---

## 3. Arquitectura tecnica

### 3.1. Flujo de captura (onboarding + re-captura)

```
[App Capacitor/Web]
  → Usuario abre AddPet o EditPet
  → Click "Capturar Nose Print"
  → Camara overlay (guia visual)
  → Foto frontal de nariz
  → Validacion cliente: sharpness, encuadre
  → Upload a Storage bucket `nose-prints/{petId}/{timestamp}.jpg`
  → Llama a edge fn `capture-nose-print`
      → Edge fn descarga imagen
      → Llama al modelo (Replicate/HF) → embedding 512-d
      → UPDATE pets SET nose_print_embedding = $1,
                        nose_print_image_url = $2,
                        nose_print_captured_at = now(),
                        nose_print_quality_score = $3
        WHERE id = $4
      → INSERT en pet_nose_print_history (log para re-capturas)
      → Retorna {success, quality_score, is_duplicate_candidate}
  → UI muestra check verde + "ID biometrico capturado"
```

### 3.2. Flujo de matching (lost pet)

```
[Landing publica /nose-scan, sin login]
  → Usuario encuentra mascota
  → Click "Escanear nariz"
  → Captura foto (mismo overlay)
  → Upload a Storage bucket `nose-scans-public/{sessionId}.jpg` (TTL 24h)
  → Llama edge fn `match-nose-print` (publica, con rate limit)
      → Descarga imagen
      → Llama al modelo → embedding 512-d
      → Query: SELECT id, name, species, owner_id,
                      1 - (nose_print_embedding <=> $1) as similarity
               FROM pets
               WHERE nose_print_embedding IS NOT NULL
                 AND species = $2
               ORDER BY nose_print_embedding <=> $1
               LIMIT 5;
      → Filtrar matches con similarity > 0.85 (threshold configurable)
      → Retorna {matches: [...], total_candidates}
  → UI muestra top-3 candidatos con foto + nombre + boton "Contactar al dueno"
      → Contacto se hace via form (no expone email/telefono directo)
      → Edge fn `notify-pet-found` envia email al dueno via Resend
```

### 3.3. Almacenamiento

| Asset | Bucket | Retention | RLS |
|---|---|---|---|
| Foto de captura (dueno) | `nose-prints` (privado) | Permanente | Solo dueno + service_role |
| Foto de captura (refugio) | `nose-prints` (privado) | Permanente hasta transferencia | Refugio + adoptante + service_role |
| Foto de scan publica (lost pet) | `nose-scans-public` (privado con TTL) | 24h, luego cron purge | Solo service_role |
| Embedding vector | Columna `pets.nose_print_embedding` | Permanente | Mismas reglas que pets |

---

## 4. Migraciones SQL

### 4.1. Migracion principal

**Archivo**: `supabase/migrations/YYYYMMDDHHMMSS_nose_print_id.sql`

```sql
-- Requiere pgvector ya habilitado (del plan HF #1).
-- Si no lo esta:
CREATE EXTENSION IF NOT EXISTS vector;

-- Columnas en pets (todas nullable: backwards compatible con datos existentes — regla 9.7).
ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS nose_print_embedding vector(512),
  ADD COLUMN IF NOT EXISTS nose_print_image_url TEXT,
  ADD COLUMN IF NOT EXISTS nose_print_captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nose_print_quality_score NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS nose_print_model_version TEXT DEFAULT 'v1';

-- Indice vector para busqueda rapida (cosine similarity).
CREATE INDEX IF NOT EXISTS ix_pets_nose_print_embedding
  ON pets USING hnsw (nose_print_embedding vector_cosine_ops)
  WHERE nose_print_embedding IS NOT NULL;

-- Indice auxiliar por especie + embedding para filtrar antes de matching.
CREATE INDEX IF NOT EXISTS ix_pets_species_with_nose
  ON pets (species)
  WHERE nose_print_embedding IS NOT NULL;

-- Historial de capturas (re-captura cachorros, cambios de calidad, auditoria).
CREATE TABLE IF NOT EXISTS pet_nose_print_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  captured_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  embedding vector(512),
  image_url TEXT NOT NULL,
  quality_score NUMERIC(4,3),
  model_version TEXT NOT NULL DEFAULT 'v1',
  capture_source TEXT NOT NULL CHECK (capture_source IN ('onboarding', 'recapture', 'vet_visit', 'shelter_intake')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_nose_print_history_pet
  ON pet_nose_print_history (pet_id, created_at DESC);

ALTER TABLE pet_nose_print_history ENABLE ROW LEVEL SECURITY;

-- Dueno puede leer su historial.
CREATE POLICY "owner_select_nose_history" ON pet_nose_print_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = pet_nose_print_history.pet_id
        AND (pets.owner_id = auth.uid() OR pets.created_by_vet_id = auth.uid()
             OR pets.created_by_shelter_id IN (SELECT id FROM adoption_centers WHERE user_id = auth.uid()))
    )
  );

-- Solo service_role inserta (desde edge fns).
-- No hay insert policy → bloqueado para usuarios directos.

-- Admin lee todo para auditoria.
CREATE POLICY "admin_select_nose_history" ON pet_nose_print_history
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ));

-- Tabla de intentos publicos de scan (rate limit + auditoria anti-abuso).
CREATE TABLE IF NOT EXISTS public_nose_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  image_url TEXT NOT NULL,
  matched_pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  top_similarity NUMERIC(4,3),
  owner_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS ix_public_nose_scans_ip_hash
  ON public_nose_scans (ip_hash, created_at DESC);

ALTER TABLE public_nose_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_public_scans" ON public_nose_scans
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ));

-- Cron: purgar scans publicas expiradas + imagenes del storage.
-- (la purga de storage se hace en edge fn aparte)
CREATE OR REPLACE FUNCTION purge_expired_public_nose_scans() RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM public_nose_scans WHERE expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION purge_expired_public_nose_scans IS 'Invocado por edge fn purge-nose-scans-cron (1x/dia)';
```

### 4.2. Smoke test de la migracion (regla 9.2.1)

Al final del mismo archivo SQL, agregar:

```sql
-- Smoke test: verificar que las columnas aceptan un embedding dummy y el indice funciona.
DO $$
DECLARE
  v_pet_id UUID;
  v_embedding vector(512);
BEGIN
  -- Vector dummy (todo ceros).
  v_embedding := (SELECT array_agg(0.0)::vector(512) FROM generate_series(1, 512));

  -- Buscar cualquier pet existente para prueba (o insertar dummy si tabla vacia).
  SELECT id INTO v_pet_id FROM pets LIMIT 1;

  IF v_pet_id IS NOT NULL THEN
    -- Simular captura.
    UPDATE pets SET nose_print_embedding = v_embedding WHERE id = v_pet_id;

    -- Simular matching: ordenar por cosine similarity.
    PERFORM id FROM pets
      WHERE nose_print_embedding IS NOT NULL
      ORDER BY nose_print_embedding <=> v_embedding
      LIMIT 5;

    -- Cleanup.
    UPDATE pets SET nose_print_embedding = NULL WHERE id = v_pet_id;
  END IF;

  RAISE NOTICE 'Nose print smoke test passed';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Nose print smoke test failed: %', SQLERRM;
END $$;
```

---

## 5. Edge Functions

### 5.1. `capture-nose-print`

**Archivo**: `supabase/functions/capture-nose-print/index.ts`

**Input**: `{ petId: string, imageStoragePath: string }` (auth requerida).

**Salida**: `{ success, quality_score, duplicate_candidates: [{ pet_id, name, similarity }] }`.

**Flujo**:
1. `verifyAuth` (del helper [_shared/ai-base.ts](../supabase/functions/_shared/ai-base.ts)).
2. Verificar ownership: el `petId` pertenece al user (owner, vet creator o shelter creator).
3. Descargar imagen de storage.
4. Validacion cliente-servidor: sharpness score via OpenCV wasm o similar (opcional, mejor tener validacion en cliente).
5. Llamar al modelo via `_shared/hf-client.ts` con `provider: 'replicate'` o `hf-inference`.
6. Si quality_score < 0.5, retornar error "calidad insuficiente, intenta de nuevo".
7. **Deteccion de duplicados**: antes de guardar, buscar si este embedding ya existe con similarity > 0.95 en otra mascota. Si si → retornar `duplicate_candidates` y NO guardar. Previene fraude (alguien registra la mascota de otro).
8. `UPDATE pets` + `INSERT pet_nose_print_history`.
9. `withTelemetry` wrapper (patron existente).

**Rate limit**: 5 capturas por user por dia (evitar abuso).

**Codigo resumido** (adaptar patron de [create-patient/index.ts](../supabase/functions/create-patient/index.ts)):

```ts
serve(withTelemetry('capture-nose-print', async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });
  const { user, supabase } = await verifyAuth(req);
  const { petId, imageStoragePath } = await req.json();

  // Feature flag gate.
  if (!isFeatureEnabled('HF_NOSE_PRINT_ID')) {
    return errorResponse('Feature not available', 404, req);
  }

  // Ownership.
  const { data: pet } = await supabase.from('pets').select('*').eq('id', petId).single();
  if (!pet) return errorResponse('Pet not found', 404, req);
  if (pet.owner_id !== user.id && pet.created_by_vet_id !== user.id) {
    // Verificar tambien shelter creator...
    return errorResponse('Not authorized', 403, req);
  }

  // Rate limit.
  const captureCountToday = await getCapturesByUserToday(supabase, user.id);
  if (captureCountToday >= 5) return errorResponse('Rate limit exceeded', 429, req);

  // Descargar + inferir.
  const imageBytes = await downloadFromStorage(supabase, imageStoragePath);
  const { output } = await callHF({
    provider: 'replicate',
    model: 'pawfriend/nose-print-encoder',  // placeholder, definir modelo final
    input: { image: imageBytes },
    feature: 'capture-nose-print',
    userId: user.id,
  });
  const embedding: number[] = output.embedding;
  const qualityScore: number = output.quality_score;

  if (qualityScore < 0.5) {
    return jsonResponse({ success: false, reason: 'low_quality', quality_score: qualityScore }, 200, req);
  }

  // Deteccion de duplicados (otra mascota con mismo nose print).
  const { data: duplicates } = await supabase.rpc('search_nose_print', {
    p_embedding: embedding,
    p_species: pet.species,
    p_exclude_pet_id: petId,
    p_threshold: 0.95,
    p_limit: 3,
  });

  if (duplicates && duplicates.length > 0) {
    return jsonResponse({
      success: false,
      reason: 'possible_duplicate',
      duplicate_candidates: duplicates,
    }, 200, req);
  }

  // Guardar.
  await supabase.from('pets').update({
    nose_print_embedding: embedding,
    nose_print_image_url: imageStoragePath,
    nose_print_captured_at: new Date().toISOString(),
    nose_print_quality_score: qualityScore,
    nose_print_model_version: 'v1',
  }).eq('id', petId);

  await supabase.from('pet_nose_print_history').insert({
    pet_id: petId,
    captured_by: user.id,
    embedding,
    image_url: imageStoragePath,
    quality_score: qualityScore,
    model_version: 'v1',
    capture_source: req.headers.get('x-capture-source') ?? 'onboarding',
  });

  return jsonResponse({ success: true, quality_score: qualityScore }, 200, req);
}));
```

### 5.2. `match-nose-print` (publica, sin auth)

**Archivo**: `supabase/functions/match-nose-print/index.ts`

**Input**: `{ imageStoragePath: string, sessionId: string, species?: 'dog'|'cat' }` (publica).

**Salida**: `{ matches: [{ pet_id, name, thumbnail_url, similarity, contact_token }], total_candidates }`.

**Flujo**:
1. Rate limit por IP: max 10 scans / hora / IP.
2. Validar session_id (UUID generado client-side).
3. Descargar imagen del bucket publico con TTL.
4. Inferir embedding.
5. Query top-5 via RPC `search_nose_print`.
6. Filtrar similarity > 0.85 (configurable env var `NOSE_PRINT_MATCH_THRESHOLD`).
7. Para cada match, generar `contact_token` firmado (JWT corto 24h) que permite al finder contactar al dueno sin ver email/telefono.
8. `INSERT public_nose_scans` para auditoria.
9. Retornar matches. **Nunca** exponer email, telefono, RUT, direccion del dueno.

**Seguridad**:
- Rate limit agresivo (10/hora/IP).
- Hash de IP (no guardar IP cruda).
- Las fotos publicas expiran en 24h (cron purga).
- Si un IP hace > 50 scans en 24h, bloquear + alertar admin (posible scraping).

**RPC complementaria** en migracion:

```sql
CREATE OR REPLACE FUNCTION search_nose_print(
  p_embedding vector(512),
  p_species TEXT DEFAULT NULL,
  p_exclude_pet_id UUID DEFAULT NULL,
  p_threshold NUMERIC DEFAULT 0.85,
  p_limit INT DEFAULT 5
) RETURNS TABLE (
  pet_id UUID,
  name TEXT,
  species TEXT,
  thumbnail_url TEXT,
  similarity NUMERIC
) AS $$
  SELECT
    p.id,
    p.name,
    p.species,
    p.profile_image_url,
    (1 - (p.nose_print_embedding <=> p_embedding))::NUMERIC as similarity
  FROM pets p
  WHERE p.nose_print_embedding IS NOT NULL
    AND (p_species IS NULL OR p.species = p_species)
    AND (p_exclude_pet_id IS NULL OR p.id != p_exclude_pet_id)
    AND (1 - (p.nose_print_embedding <=> p_embedding)) >= p_threshold
  ORDER BY p.nose_print_embedding <=> p_embedding
  LIMIT p_limit;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION search_nose_print FROM public;
GRANT EXECUTE ON FUNCTION search_nose_print TO service_role, authenticated;
```

### 5.3. `notify-pet-found`

**Input**: `{ contactToken: string, finderName: string, finderContact: string, message: string }` (publica, rate limit).

**Flujo**:
1. Verificar `contact_token` (firmado, 24h).
2. Obtener `pet_id` + `owner_id` del token.
3. Buscar email del dueno.
4. Enviar email via Resend (template similar a [send-pet-invitation](../supabase/functions/send-pet-invitation/)):
   - Asunto: "Alguien encontro a tu mascota"
   - Contenido: foto, nombre, datos del finder (NOMBRE + CONTACTO que el finder provee), mensaje opcional.
   - CTA: abrir la app.
5. `UPDATE public_nose_scans SET owner_notified = true`.

### 5.4. `purge-nose-scans-cron`

Cron 1x/dia. Borra entries `public_nose_scans` con `expires_at < now()` + borra imagenes asociadas del bucket.

---

## 6. UI / UX

### 6.1. Onboarding (nueva mascota)

En [src/pages/AddPet.tsx](../src/pages/AddPet.tsx), agregar **paso opcional** despues de foto principal:

```
[Foto principal de Kai ✓]
───
[Captura nose print ID (opcional pero recomendado)]
  "Agregale un ID biometrico unico a Kai. Sirve si alguna vez se pierde
   y aun no tiene microchip."
  [Boton: Capturar ahora]   [Saltar → Mas tarde]
```

**Componente**: `src/components/nose-print/NosePrintCapture.tsx`:
- Abre camara full-screen (Capacitor `Camera` o `getUserMedia` en web).
- Overlay circular transparente + texto "Alinea la nariz aqui".
- Boton disparador. Al capturar → preview + 2 opciones: "Aceptar" o "Repetir".
- Al aceptar → upload a storage + call `capture-nose-print`.
- Loading state: "Creando ID biometrico..."
- Resultado:
  - Exito: check verde + "ID creado. Calidad: excelente (92%)" + animacion Paw Card-like.
  - Baja calidad: "La foto salio borrosa. Intenta con mejor luz."
  - Duplicado: "Esta nariz ya esta registrada a nombre de otra cuenta. Si creciste adoptaste, contactanos."

### 6.2. Ficha de mascota

En ficha clinica (shared `PetHeader`), agregar chip de estado:

```
Identificacion
  ├── Microchip:  987654321098765  [Verificar Registro Nacional]
  ├── Nose Print: ✓ Capturado  (calidad 92%)  [Ver historial]  [Recapturar]
  ├── QR Tag:     ✓ Activo     [Ver pagina publica]
  └── Registro:   No vinculado [Vincular]
```

Si no hay nose print:
```
  └── Nose Print: — [Capturar ahora]
```

### 6.3. Landing publica `/nose-scan`

**Nueva ruta publica** en [src/App.tsx](../src/App.tsx). Archivo: `src/pages/NoseScan.tsx`.

Layout (mobile-first):
```
Paw Friend logo
"Encontraste una mascota?"

[Imagen ilustrativa de captura]
"Toma una foto clara de su nariz.
 Si esta registrada en Paw Friend, conectaremos a su dueno."

[Boton grande: Abrir camara]
```

Al capturar → mismo overlay → call `match-nose-print`.

Resultado:
- Si hay matches > 0.85:
  ```
  Probable match encontrado!

  [Foto del pet] Kai
  Perro, 3 anos, Las Condes
  Coincidencia: 94%

  [Boton: Contactar al dueno]
  ```
- Si no hay match:
  ```
  No encontramos match en nuestra base.

  Probablemente la mascota no esta registrada en Paw Friend.
  [Sugerencias: publicar en redes, llevar al vet mas cercano, llamar al municipio]

  [Ver veterinarios cercanos]
  ```

Form de contacto al encontrar match:
```
Nombre (para que el dueno sepa quien lo contacta)
Telefono o email (como te contactan a vos)
Mensaje (opcional, ej: "La encontre cerca del parque Araucano")

[Enviar notificacion al dueno]
```

El dueno recibe email. El finder NO ve datos del dueno. El dueno decide si contesta.

### 6.4. Refugios

En dashboard de refugio, al cargar mascotas en `/shelter/bulk-import` o individual, proponer capturar nose print en la foto de intake. Misma UI que dueno pero en contexto shelter.

---

## 7. Feature flag y rollout

### 7.1. Flag

Agregar a [src/lib/featureFlags.ts](../src/lib/featureFlags.ts):

```ts
export const HF_NOSE_PRINT_ID = false; // Default OFF hasta completar F1-F3 del rollout.
```

Server-side: `FLAG_HF_NOSE_PRINT_ID` env var en Supabase secrets.

### 7.2. Fases de rollout

| Fase | Duracion | Accion |
|---|---|---|
| **F1 — Interno** | 1 semana | Flag ON solo para admin_access. Pedro + Sofia + 2 testers usan con sus mascotas reales. Validar golden path. |
| **F2 — Beta cerrado** | 2 semanas | Flag ON para 20 users seleccionados. Medir: tasa de exito de captura, tasa de falsos positivos en matching, calidad promedio. |
| **F3 — Canary 10%** | 1 semana | Flag ON para hash(user.id) % 100 < 10. Monitorear admin widget. |
| **F4 — GA** | — | Flag ON para todos. Anuncio en home, redes, prensa. |

### 7.3. Criterios go/no-go

**Go F1 → F2**:
- 0 crashes en 50+ capturas.
- Quality score promedio > 0.75.
- Rollback verificado (flag OFF → feature desaparece sin romper nada).

**Go F2 → F3**:
- Tasa de exito captura > 85%.
- 0 falsos positivos de duplicados en pool de 20 users.
- Smoke test de matching con 5 mascotas reales: top-1 correcto en 100% de los casos.

**Go F3 → F4**:
- < 1% de quejas en canary.
- Costo observado en linea con proyeccion ($5-10/mes por 1000 mascotas).
- PR / comunicacion de launch lista.

---

## 8. Anti-fraude y privacidad

### 8.1. Riesgos de abuso

| Riesgo | Mitigacion |
|---|---|
| Alguien registra nose print de mascota ajena para reclamarla | Deteccion de duplicados: si otro user ya tiene embedding similarity > 0.95, bloquear y alertar admin |
| Scraping masivo del endpoint publico | Rate limit por IP (10/hora), hash IP, captcha si > 5 scans consecutivos |
| Envenenamiento: user sube imagenes aleatorias para llenar la DB | Quality score threshold + validacion de "esto es una nariz" (clasificador auxiliar simple) |
| Fotos sensibles subidas al bucket publico | TTL 24h + cron purge automatico + moderacion NSFW (integracion #8 del plan HF) |
| Re-identificacion de mascotas (alguien roba mascota, elimina chip, usa nose print de otra) | Unicidad enforced: si alguien intenta cambiar nose print de una mascota, requiere re-auth + notificacion email al dueno |

### 8.2. Privacidad

- El embedding no es reversible a una imagen reconocible humanamente. Aun asi, tratamos el vector como dato personal sensible (proxy biometrico).
- Bucket `nose-prints` nunca publico. Signed URLs con expiracion corta cuando sea necesario.
- El dueno puede borrar su nose print en cualquier momento desde `/profile/settings`:
  - Setea todas las columnas nose_print_* a NULL.
  - Borra imagen del bucket.
  - Borra historial (soft delete con `deleted_at`).
- Cumple principio minimizacion: no exponemos embedding ni imagen a terceros, solo el resultado del matching.

### 8.3. Consentimiento

En onboarding, al primer uso del feature:
```
"Paw Friend creara un ID biometrico unico para Kai a partir de la foto
 de su nariz. Este ID se usa solo para identificarlo si se pierde.
 Podes borrarlo cuando quieras.
 [Aceptar]  [Leer mas]  [Cancelar]"
```

Link a [/privacy](../src/pages/Privacy.tsx) con seccion nueva "Datos biometricos".

---

## 9. Impacto en features existentes

| Feature | Impacto |
|---|---|
| `AddPet` | Paso opcional agregado, no rompe flujo actual |
| `EditPet` | Seccion "Identificacion" nueva, con campos existentes (chip) + nose print |
| `MyPets` | Badge "ID biometrico" si captured |
| Paw Card | Backside muestra "Nose Print ID ✓ capturado YYYY-MM-DD" |
| QR Landing [/qr/:token](../src/pages/QRLanding.tsx) | Si encuentra mascota via QR + dueno tiene nose print, mostrar "Verificado biometricamente" |
| Refugio `/shelter/bulk-import` | Opcion "Capturar nose print" en form individual (no en CSV bulk) |
| Transferencia refugio → adoptante | Nose print se transfiere junto con la mascota |
| Admin panel | Nueva seccion `Admin > Sistema > Nose Print`: metricas de captura/matching, casos flag duplicado |

---

## 10. Metricas de exito

### 10.1. Primer trimestre post-GA

| Metrica | Objetivo |
|---|---|
| Tasa adopcion captura (% users que capturan al crear pet) | > 40% |
| Tasa adopcion captura retro (% users existentes que capturan dentro 30d) | > 15% |
| Mascotas con nose print en DB | > 500 |
| Scans publicos `/nose-scan` / mes | > 50 |
| Matches confirmados (finder contacto → dueno responde) | > 3 |
| Costo mensual modelo | < $15 USD |
| Tasa exito captura (sin errores) | > 90% |
| Quality score promedio | > 0.80 |
| Falsos positivos duplicados | < 1% |

### 10.2. Primer ano

- Al menos **1 historia de reencuentro** documentada con permiso del dueno → caso PR.
- Mencion en prensa chilena (Biobio, Emol, TVN, Radio Concierto).
- **5k+ mascotas con nose print** como base instalada.

---

## 11. Checklist de implementacion

### 11.1. Fase 0 — Prerequisitos

- [ ] Confirmar licencia del modelo elegido (Pet_Biometric_Challenge u otro)
- [ ] Confirmar hosting: Replicate, HF Inference o self-host
- [ ] Obtener secret `REPLICATE_API_TOKEN` o `HF_API_TOKEN` en Supabase
- [ ] pgvector extension habilitada en produccion

### 11.2. Fase 1 — Backend

- [ ] Migracion `YYYYMMDDHHMMSS_nose_print_id.sql` aplicada
- [ ] Smoke test de migracion pasa
- [ ] Buckets `nose-prints` (privado) y `nose-scans-public` (privado con TTL) creados
- [ ] Policies RLS de buckets revisadas
- [ ] Edge fn `capture-nose-print` deployada
- [ ] Edge fn `match-nose-print` deployada
- [ ] Edge fn `notify-pet-found` deployada
- [ ] Edge fn `purge-nose-scans-cron` deployada + cron programado
- [ ] RPC `search_nose_print` creada y testeada

### 11.3. Fase 2 — Frontend

- [ ] Componente `NosePrintCapture.tsx` creado
- [ ] Integracion en `AddPet.tsx` y `EditPet.tsx`
- [ ] Seccion Identificacion en `PetHeader` ficha
- [ ] Ruta publica `/nose-scan` (`NoseScan.tsx`)
- [ ] Badge "ID biometrico" en Paw Card
- [ ] Integracion en `/shelter/*` para refugios
- [ ] Widget admin `AdminNosePrintMetrics.tsx`

### 11.4. Fase 3 — Validacion

- [ ] Testing con 50+ fotos reales (variedad razas + gatos)
- [ ] Falsos positivos < 1% en batch de 100 matches
- [ ] Rollback probado (flag OFF elimina UI sin romper data)
- [ ] Documentacion en [CLAUDE.md](../CLAUDE.md) actualizada
- [ ] Diagrama [FLUJO_COMPLETO.mmd](../diagrams/FLUJO_COMPLETO.mmd) actualizado (regla 9.6.1)
- [ ] Docs vivos actualizados ([MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md))

### 11.5. Fase 4 — Launch

- [ ] Flag ON interno (Pedro + Sofia + betas)
- [ ] Flag ON para beta cerrado 20 users
- [ ] Flag ON canary 10%
- [ ] Flag ON GA
- [ ] Comunicacion: home banner, redes, email newsletter
- [ ] Pitch update (INDEX + pitch-inversionistas/) mencionando feature unica

---

## 12. Rollback

Si en cualquier momento se detecta degradacion critica:

1. **Inmediato**: setear `FLAG_HF_NOSE_PRINT_ID=false` en Supabase secrets + `HF_NOSE_PRINT_ID=false` en [featureFlags.ts](../src/lib/featureFlags.ts). Deploy en 5 min.
2. **Verificar**: la UI de captura desaparece. Fichas existentes no muestran la seccion. Landing `/nose-scan` responde con "feature no disponible temporalmente".
3. **Datos**: embeddings y historial quedan en DB (no se borran). Permite reactivar sin perder capturas.
4. **Postmortem**: guardar logs + crear memoria `project_session_YYYY_MM_DD_nose_print_rollback.md`.

---

## 13. Preguntas abiertas para Paw Founder

1. **Modelo final**: Replicate/HF Inference para MVP (recomendado) o buscar hosting self-host directo?
2. **Gatos**: incluir en MVP (mayor esfuerzo, peor accuracy) o solo perros en F1-F2, gatos en F3?
3. **Monetizacion**: nose print queda gratis para siempre, o en el futuro se puede paywall features avanzadas (history visual, comparacion lado a lado)?
4. **Prensa**: una vez en GA, arrancamos outreach a medios o esperamos primer reencuentro real documentado?
5. **Comunicacion con SUBDERE**: informar al organismo del Registro Nacional como "complemento no oficial" para tener tranquilidad regulatoria, o no comunicar salvo que pregunten?

---

## 14. Referencias

- [Pet_Biometric_Challenge — GitHub](https://github.com/wkrcarry/Pet_Biometric_Challenge)
- [Dog Nose-Print Identification Using Deep Neural Networks — 2021](https://www.researchgate.net/publication/350365646_Dog_Nose-Print_Identification_Using_Deep_Neural_Networks)
- [Canine Nose Pattern as Biometric Marker — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8697952/)
- [Petnow — referencia comercial](https://www.petnow.io/en)
- [Plan HF Integraciones — docs-raiz/planes](../docs-raiz/planes/HUGGINGFACE_INTEGRATIONS_PLAN.md)
- [Spec Microchip Registro Nacional — complementario](MICROCHIP_REGISTRO_NACIONAL.md)
- Regla 9.2.1 CLAUDE.md — smoke tests en triggers plpgsql
- Regla 9.7 CLAUDE.md — proteccion de usuarios existentes
