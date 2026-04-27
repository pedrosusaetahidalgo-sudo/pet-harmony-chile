# Guía paso a paso — Fine-tune DINOv2-large en Colab

> **Objetivo**: si DINOv2-large pre-trained no discrimina suficiente tus 4 mascotas
> reales (Kai + 2 hermanos pastor suizo + Ema gato), fine-tunear con triplet loss
> sobre DogFaceNet + tus fotos. Output: modelo en HuggingFace listo para usar.
>
> **Tiempo total estimado**: 1.5–2 horas (GPU Colab gratis T4).
> **Costo**: $0 — todo en free tier.

---

## Pre-requisitos

- Cuenta Google Colab (gratis): https://colab.research.google.com/
- Token HuggingFace (lee+escribe) si querés subir el modelo entrenado: https://huggingface.co/settings/tokens
- ZIP con tus fotos: ya lo tenés en `c:\Users\psusa\Desktop\pet-harmony-chile-main\_pending\nose_print_test_photos.zip`

---

## Paso 1 — Abrir el notebook en Colab (3 min)

1. Subí el archivo [scripts/finetune_dinov2_nose_v2.ipynb](../scripts/finetune_dinov2_nose_v2.ipynb) a Google Drive (o abrilo directo en Colab).
2. Abrí Colab → File → Upload notebook → seleccioná el `.ipynb`.
3. Una vez abierto: **Runtime → Change runtime type → Hardware accelerator: T4 GPU** (o L4 si tenés Pro).
4. Verificá GPU activa: corré la celda `[2]` (la primera con `# Verificar GPU`). Debería decir:
   ```
   GPU disponible: True
   ```

⚠️ Si dice `GPU disponible: False`, no avances — esperá 5 min y reintentá Runtime/GPU.

---

## Paso 2 — Setup deps (5 min)

Corré la celda `[2]` completa. Instala torch + transformers + groundingdino + utils. Va a tardar ~3 min instalando.

**Esperado**: termina sin errores. Algún warning de pip está OK.

---

## Paso 3 — Descargar DogFaceNet (2 min)

Corré celda `[4]`. Baja un dataset público de ~8.000 fotos de caras de perros de Stanford. Esto es el dataset base para el pre-training de identidad canina.

**Esperado**: estructura `/content/dogfacenet/after_4_bis/` con subcarpetas por perro.

---

## Paso 4 — Subir tus fotos (2 min)

a) En Colab, en el panel izquierdo, click en el ícono de **carpeta** 📁 → "Upload to session storage".

b) Subí el archivo: `c:\Users\psusa\Desktop\pet-harmony-chile-main\_pending\nose_print_test_photos.zip`

c) Una vez subido, debería aparecer en `/content/nose_print_test_photos.zip` (mismo nombre).

d) Corré celda `[6]`. Descomprime el ZIP a `/content/test_photos/` con las 8 subcarpetas:
   ```
   border_collie_1/  border_collie_2/  border_collie_3/  mi_gato/
   pastor_suizo_1/  pastor_suizo_2/  pastor_suizo_3/  terrier_chileno/
   ```

**Esperado**: print con conteo de fotos. Algo como `89 fotos en 8 mascotas`.

---

## Paso 5 — Grounding DINO (crop automático de narices) (5 min)

Esto es lo más interesante: usa un modelo de detección abierto que recorta SOLO la nariz de cada foto (mejora dramáticamente la precisión).

a) Celda `[8]` — descarga pesos Grounding DINO (~700MB).
b) Celda `[9]` — monkey patch para que funcione con la versión actual de transformers.
c) Celda `[11]` — define la función `crop_nose()`. Probá con 1 imagen sample, debería mostrar el crop.

**Esperado**: ves un preview de una foto recortada solo a la nariz.

---

## Paso 6 — Procesar TODO el dataset (10–15 min)

a) Celda `[13]` — recorta narices de DogFaceNet (8k fotos).
b) Celda `[14]` — recorta narices de tus fotos test.

⚠️ Es lento porque corre Grounding DINO sobre miles de imágenes. Dejá correr.

**Esperado**: barras de progreso `tqdm` que terminan en `100%`.

---

## Paso 7 — Liberar GPU + cargar DINOv2-large (1 min)

Celdas `[16]` libera Grounding DINO de la GPU (importante para no quedarse sin memoria) y carga DINOv2-large (1024 dims).

---

## Paso 8 — Triplet loss training (~30 min)

a) Celda `[18]` — Dataset + DataLoader con triplets (anchor, positive, negative).
b) Celda `[20]` — Training loop, 3 epochs, lr 1e-5, AdamW.

**Esperado**: print por step de la loss, debería bajar de ~0.4 a ~0.05–0.1.

⚠️ Si la loss NO baja: posible problema de dataset. Avisame.

---

## Paso 9 — Evaluación contra tus 4 mascotas (5 min)

Celda `[22]` — corre el mismo test cross-pet que hicimos local pero con el modelo fine-tuneado. Va a mostrar:

```
INTRA-PET (foto-vs-foto del mismo animal)
  mean: X.XXXX

INTER-PET (foto-vs-foto de animales distintos)
  mean: X.XXXX

GAP: X.XXXX
```

**Comparación con baseline**:
| Métrica | Baseline DINOv2-large | Esperado post fine-tune |
|---|---|---|
| Intra-pet mean | 0.6040 | 0.85+ |
| Inter-pet mean | 0.2641 | 0.30 (similar) |
| **Gap** | 0.3400 | **0.50+** |

Si el gap sube a >0.50 con intra >0.85 → **GO**. Discrimina hermanos.

---

## Paso 10 — Subir modelo a HuggingFace (10 min, opcional)

Solo si Paso 9 dio buen resultado y querés deployar.

a) En Colab celda nueva, autenticá HF:
```python
from huggingface_hub import login
login(token='hf_xxx_TU_TOKEN_DE_HUGGINGFACE')
```

b) Subí el modelo (la celda `[24]` ya guarda el `.pt`):
```python
from huggingface_hub import upload_file
upload_file(
    path_or_fileobj='/content/dinov2_large_nose_v2_finetuned.pt',
    path_in_repo='model.pt',
    repo_id='pedrosusaeta/dinov2-nose-print-v2',  # cambia si querés
    repo_type='model',
)
```

c) En Supabase Dashboard → Edge Functions → Settings → Secrets:
- Cambiar `NOSE_PRINT_MODEL_ID` de `facebook/dinov2-large` a `pedrosusaeta/dinov2-nose-print-v2`

d) **NO necesitás re-deploy edge fn** — solo cambiar el secret y el siguiente request usa el modelo nuevo.

⚠️ **Limitación**: HuggingFace Inference API público puede no soportar modelos custom directamente. Si tira error 503, hay que:
- Subir el modelo a HF como **Inference Endpoint dedicado** (~$0.06–$1/hr según GPU)
- O hostearlo en **Replicate** ($0.0001/sec on demand)

---

## Paso 11 — Re-validar end-to-end (5 min)

Después de subir + cambiar el secret:

a) Borrá los nose_prints viejos guardados con el modelo baseline:
```sql
DELETE FROM public.nose_prints WHERE model_id = 'facebook/dinov2-large';
```

b) Re-capturá nose prints de tus 4 mascotas desde la app.

c) Probá `/nose-scan` con foto nueva → debería matchear correctamente sin confundir hermanos.

---

## Si algo falla en Colab

| Síntoma | Causa | Fix |
|---|---|---|
| `OutOfMemoryError` | DINOv2-large + Grounding DINO + batch grande | Reducí batch_size en celda `[18]` a 4 |
| `RuntimeError: GPU not found` | Free tier saturado | Esperá 10–30 min o usá Colab Pro |
| Loss no baja | Dataset chico | Sumá más fotos del outreach refugios |
| `groundingdino` import error | Versión incompatible | Re-correr celda `[2]` (reinstall) |

---

## Decisión final

| Resultado Paso 9 | Acción |
|---|---|
| Gap >0.50 + intra >0.85 | Subir modelo + cambiar secret + activar `NOSE_PRINT_PUBLIC_SCAN=true` ✅ |
| Gap 0.30–0.50 | Marginal. Sumar más fotos del outreach + re-train. |
| Gap <0.30 | Algo está mal. Avisame y debugueamos. |

---

## Atajo si el baseline DINOv2-large ya alcanza

Si el smoke test de la app con tus 4 mascotas reales (con cámara mobile, no las fotos WhatsApp comprimidas) ya discrimina correctamente sin fine-tune → **skip Colab completo**. El modelo pre-trained alcanza para tu caso.

Las fotos WhatsApp del baseline 0.34 eran de baja calidad (compresión + ángulos variables). Cámara mobile real puede dar gap mucho mejor sin tocar nada.
