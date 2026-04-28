# Handoff Fine-tuning Nose Print — Google Colab

> **Propósito**: continuar el fine-tuning de DINOv2-large con los datasets
> descargados, desde Google Colab (gratis, GPU Tesla T4) en vez de tu
> desktop. Más rápido, más estable, no depende de tu setup local.
>
> **Fecha**: 2026-04-24
> **Estado actual**: datasets descomprimidos en `_pending/datasets/`,
> baseline DINOv2-large = 0.445 separación, target >0.80.

---

## TL;DR (si solo querés los pasos)

1. Abrí **https://colab.research.google.com/**
2. **File → Upload notebook** → seleccioná `scripts/finetune_dinov2_nose.ipynb` del repo
3. **Runtime → Change runtime type → T4 GPU** → Save
4. Subí los 3 ZIP de los datasets a Google Drive (carpeta `Paw Friend/`)
5. Corré celdas una por una (Shift+Enter en cada)
6. ~30–60 min total, output: modelo `.pt` descargable
7. Me pasás los números finales (same-pet mean, cross-pet mean, separación) y decidimos si es suficiente o siguiente iteración

---

## Setup Colab (una sola vez)

### 1. Abrir Colab con GPU

- Ir a https://colab.research.google.com/
- **File → New Notebook** (o uploadear el que yo te armo)
- **Runtime → Change runtime type**
  - Hardware accelerator: **T4 GPU** (gratis)
  - Save

### 2. Montar Google Drive

En la primera celda:
```python
from google.colab import drive
drive.mount('/content/drive')
```

Te pide permisos → aceptar. Queda montado en `/content/drive/MyDrive/`.

### 3. Subir los datasets a Drive

**Opción A — Subida manual desde tu laptop**:
- Crear carpeta `Paw Friend/` en tu Drive
- Subir los 3 archivos comprimidos (ZIP, tar.gz, tar)

**Opción B — Re-descarga directa en Colab (más rápido)**:

```python
# Oxford Pets (~800 MB, 2 min)
!wget -q https://www.robots.ox.ac.uk/~vgg/data/pets/data/images.tar.gz -O /content/oxford_images.tar.gz
!wget -q https://www.robots.ox.ac.uk/~vgg/data/pets/data/annotations.tar.gz -O /content/oxford_annotations.tar.gz

# Stanford Dogs (~750 MB, 2 min)
!wget -q http://vision.stanford.edu/aditya86/ImageNetDogs/images.tar -O /content/stanford_dogs.tar

# DogFaceNet (variable, ~1.5 GB)
!git clone https://github.com/GuillaumeMougeot/DogFaceNet.git /content/dogfacenet
```

### 4. Descomprimir

```python
!mkdir -p /content/data/oxford-pets /content/data/stanford-dogs /content/data/dogfacenet
!tar -xzf /content/oxford_images.tar.gz -C /content/data/oxford-pets
!tar -xzf /content/oxford_annotations.tar.gz -C /content/data/oxford-pets
!tar -xf /content/stanford_dogs.tar -C /content/data/stanford-dogs
# DogFaceNet ya está en /content/dogfacenet (git clone)
```

---

## Subir tus fotos de test (las 49 de perros+Ema)

Para medir el modelo fine-tuned contra el baseline 0.445, necesitamos
tus 49 fotos en Colab. Dos opciones:

**Opción A — Zipealas y subilas**:
```powershell
# En tu PowerShell local:
cd C:\Users\psusa\Desktop\pet-harmony-chile-main\_pending
Compress-Archive -Path nose_print_test_photos -DestinationPath nose_print_test_photos.zip
```

Después subís ese ZIP a `Paw Friend/` en tu Drive.

En Colab:
```python
!cp /content/drive/MyDrive/Paw\ Friend/nose_print_test_photos.zip /content/
!unzip -q /content/nose_print_test_photos.zip -d /content/
```

**Opción B — Sincronización Drive directa**:
Copiar la carpeta `_pending/nose_print_test_photos/` a tu Drive desde el cliente de Drive for Desktop (si lo tenés instalado).

---

## Notebook de fine-tuning

El notebook `scripts/finetune_dinov2_nose.ipynb` que dejo en el repo
hace esto (tú solo corrés celda por celda):

1. Instala dependencias (PyTorch, transformers, etc.)
2. Carga DINOv2-large pre-entrenado
3. Define dataset + dataloader con triplet loss
4. Fine-tunea por 5-10 épocas
5. Evalúa en tus 49 fotos
6. Compara resultados vs baseline
7. Exporta modelo fine-tuned como `.pt`
8. Comprime + descarga

**Tiempo estimado** con T4 GPU:
- Setup inicial (deps + modelo): ~5 min
- Carga + preproceso datasets: ~5 min
- Fine-tuning 10 épocas × DogFaceNet (~8k imágenes): ~20-30 min
- Evaluación: ~2 min
- Total: **~40-60 min**

---

## Qué hacer con el modelo fine-tuned (cuando termine)

El notebook exporta `dinov2_large_nose_finetuned.pt` (~1.2 GB).

**Opciones para usarlo en producción**:

**A. Edge function cloud (recomendado)**:
- Subirlo a Supabase Storage (bucket privado `models/`)
- Edge function `nose-print-embed` lo descarga al arrancar
- Usa GPU si tu plan Supabase lo tiene, CPU si no

**B. HuggingFace Inference endpoint**:
- Subir modelo a tu cuenta HF privada
- Exponer como endpoint serverless
- La app hace HTTP POST con imagen → recibe embedding

**C. Self-hosted con ONNX Runtime**:
- Convertir `.pt` a `.onnx` (el notebook incluye este paso)
- Correr con onnxruntime-web (en browser) o onnxruntime-gpu (server)
- Más rápido que PyTorch, menos memoria

---

## SQL PENDIENTES DE APLICAR — Sesión 2026-04-23 + 24

Antes de cerrar la sesión, Pedro debería aplicar estas migraciones en
Supabase Dashboard → SQL Editor. Ver documento maestro:
[MIGRACIONES_CONSOLIDADAS_SESION_2026_04_23_24.md](MIGRACIONES_CONSOLIDADAS_SESION_2026_04_23_24.md)

**Orden estricto**:

| # | Archivo | Propósito |
|---|---|---|
| 1 | [20260725000012_harden_vaccine_schedule_and_check.sql](../supabase/migrations/20260725000012_harden_vaccine_schedule_and_check.sql) | Hotfix trigger vacunas (blindar con EXCEPTION) |
| 2 | [20260424000000_deprecate_orphan_tables.sql](../supabase/migrations/20260424000000_deprecate_orphan_tables.sql) | Rename 4 tablas huérfanas |
| 3 | [20260525000000_pet_timeline_events.sql](../supabase/migrations/20260525000000_pet_timeline_events.sql) | Timeline unificado 10 categorías |
| 4 | [20260530000000_pet_id_cards.sql](../supabase/migrations/20260530000000_pet_id_cards.sql) | Pet ID Card + RPC resolve_pet_identity |
| 5 | [20260601000000_owner_audio_notes.sql](../supabase/migrations/20260601000000_owner_audio_notes.sql) | Audio notes dueño (requiere #3) |
| 6 | [20260424100000_nose_print_test_sessions.sql](../supabase/migrations/20260424100000_nose_print_test_sessions.sql) | Página pública /nose-print-test |

**Acciones adicionales no-SQL**:

- Storage → crear bucket `nose-print-tests` (público, 5MB limit, image/*) con políticas RLS — ver doc consolidado sección A1
- Terminal (cuando quieras, después de aplicar las 6 SQL):
  ```bash
  npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
  npx tsc -b
  git add src/integrations/supabase/types.ts
  git commit -m "chore(types): regenerate Supabase types post Fase 0"
  git push
  ```

---

## Cómo continuar desde tu desktop (cuando llegues)

### Opción A — Solo para ejecutar Colab (no requiere clonar repo)

Si solo querés correr el fine-tuning sin tocar código:

1. Abrí Chrome/Edge en tu desktop
2. Login con tu cuenta Google
3. https://colab.research.google.com/
4. Abrí el notebook (`File → Open notebook → GitHub → pedrosusaetahidalgo-sudo/pet-harmony-chile → scripts/finetune_dinov2_nose.ipynb`)
5. Runtime → GPU T4 → Save
6. Correr celdas

Todo corre en cloud. Tu desktop solo necesita browser.

### Opción B — Clonar el repo local también (para seguir refactor después)

```powershell
# En tu desktop (PowerShell):
cd C:\Users\TuUsuarioDesktop\Desktop   # o donde quieras
git clone https://github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile.git
cd pet-harmony-chile
npm install
npm run dev  # confirmar que la app corre local
```

Y podés seguir haciendo `git pull` en la laptop también para mantener sincronización.

**Setup Python para correr scripts local** (opcional):
```powershell
# Instalar Python 3.11 (NO 3.14, muy inestable)
# Desde https://www.python.org/downloads/
python -m venv .venv-nose-print
.\.venv-nose-print\Scripts\Activate.ps1
pip install torch torchvision transformers Pillow numpy
# Scikit-learn opcional, si da error flapack, ignorar
```

---

## Estado final de la sesión 2026-04-24

**Lo que quedó listo (commits en `origin/main`)**:
- ✅ Plan maestro refactor (2.5k líneas) aprobado
- ✅ 6 migraciones SQL redactadas + smoke tests
- ✅ 30 feature flags agregados (en false, listos para activar)
- ✅ Componentes frontend trinidad: PetIdCardDisplay, HistoriaTimelineView, PetHeroCard, NextActionCard, HomePetFocusV2
- ✅ Hook usePetHistoryTimeline con fallback a tablas existentes
- ✅ BottomTab V2 con feature flag
- ✅ Página pública `/nose-print-test` con captura guiada + migration table
- ✅ Script validación nose print + comparativa modelos + DINOv2 optimized
- ✅ Decisión modelo final: DINOv2-large (tras descartar SigLIP2 en test multi-mascota)
- ✅ Datasets candidatos setup (carpetas + README + gitignore)

**Lo que Pedro tiene que hacer**:
- ⏳ Aplicar 6 migraciones SQL (lista arriba)
- ⏳ Crear bucket Storage `nose-print-tests`
- ⏳ Regenerar types.ts post-migraciones
- ⏳ Correr Colab notebook para fine-tuning
- ⏳ Compartir link `/nose-print-test` con amigos/testers (post-deploy)

**Lo que queda pendiente para próxima sesión**:
- Activar feature flags uno a uno (BOTTOM_TAB_V2, HOME_PET_FOCUS, etc.)
- Edge function `generate-pet-id-card` (SVG+PNG+PDF)
- Edge function `process-consultation-transcript` extendida para owner
- Sidebar colapsado 3 grupos
- Onboarding V2 minimal 3 pasos
- Integrar modelo fine-tuned (cuando esté listo)

---

## Contacto / continuidad

Cuando abras el Colab en tu desktop, avisame el resultado final del fine-tuning
(copy-paste del output de evaluación). Decidimos juntos el siguiente paso según:

- Si separación >0.80 → deploy modelo, activar nose print en producción
- Si separación 0.60–0.80 → iterar hiperparámetros (más épocas, learning rate)
- Si separación <0.60 → problema de protocolo de captura, no de modelo → foco en página de captura guiada + más data
