# Datasets para Fine-tuning Nose Print

> **Para Pedro**: ponés los datasets descomprimidos en las carpetas correspondientes.
> Todo lo que hay acá dentro está en `.gitignore` — NUNCA se committea (GBs de imágenes).

---

## Estructura

```
_pending/datasets/
├── README.md                ← este archivo (SÍ se committea)
├── dogfacenet/              ← DogFaceNet (recomendado)
├── oxford-pets/             ← Oxford-IIIT Pet Dataset (alternativa)
└── stanford-dogs/           ← Stanford Dogs (otra alternativa)
```

---

## 1. DogFaceNet (recomendado)

**URL**: https://github.com/GuillaumeMougeot/DogFaceNet/releases

Bajar los releases del repo. Normalmente son:
- `DogFaceNet_Dataset.zip` (o similar)
- Archivos `.npy` con imágenes preprocesadas
- `.csv` con labels

**Descomprimir acá**:
```
_pending/datasets/dogfacenet/
├── images/              ← fotos individuales (si el release las trae)
│   ├── dog_0001/
│   │   ├── 001.jpg
│   │   ├── 002.jpg
│   │   └── ...
│   └── dog_0002/
│       └── ...
├── labels.csv           ← mapping image → dog_id
└── splits.csv           ← train/val/test splits (si existe)
```

Si el release trae archivos `.npy` preprocesados (array numpy):
```
_pending/datasets/dogfacenet/
├── X_train.npy          ← (N, 224, 224, 3) imágenes
├── y_train.npy          ← (N,) etiquetas (dog_id)
├── X_val.npy
├── y_val.npy
└── ...
```

El notebook Colab que te armo después detecta ambos formatos automáticamente.

---

## 2. Oxford-IIIT Pet Dataset

**URLs**:
- https://www.robots.ox.ac.uk/~vgg/data/pets/data/images.tar.gz (~800 MB)
- https://www.robots.ox.ac.uk/~vgg/data/pets/data/annotations.tar.gz (~20 MB)

**Descomprimir acá**:
```
_pending/datasets/oxford-pets/
├── images/              ← images.tar.gz descomprimido acá
│   ├── Abyssinian_1.jpg
│   ├── Abyssinian_2.jpg
│   ├── american_bulldog_1.jpg
│   └── ... (7390 total)
└── annotations/         ← annotations.tar.gz descomprimido acá
    ├── list.txt
    ├── trainval.txt
    ├── test.txt
    ├── trimaps/         ← segmentación pixel-level
    └── xmls/            ← bounding boxes de cara en formato Pascal VOC
        ├── Abyssinian_1.xml
        └── ...
```

**Comando descompresión** (si tenés tar en tu Windows):
```powershell
cd _pending\datasets\oxford-pets
tar -xzf ..\..\..\images.tar.gz
tar -xzf ..\..\..\annotations.tar.gz
```

O usar 7-Zip / WinRAR.

---

## 3. Stanford Dogs Dataset

**URL**: http://vision.stanford.edu/aditya86/ImageNetDogs/images.tar

**Descomprimir acá**:
```
_pending/datasets/stanford-dogs/
├── Images/              ← 120 subcarpetas, una por raza
│   ├── n02085620-Chihuahua/
│   │   ├── n02085620_7.jpg
│   │   └── ...
│   └── n02086079-Pekinese/
└── Annotation/          ← bounding boxes
```

---

## Verificación post-descompresión

Desde la raíz del repo, correr:

```bash
# Contar imágenes por dataset
find _pending/datasets/dogfacenet -name "*.jpg" 2>/dev/null | wc -l
find _pending/datasets/oxford-pets/images -name "*.jpg" 2>/dev/null | wc -l
find _pending/datasets/stanford-dogs/Images -name "*.jpg" 2>/dev/null | wc -l
```

Debería retornar:
- DogFaceNet: ~8,677 (depende del release)
- Oxford Pets: ~7,390
- Stanford Dogs: ~20,580

---

## Próximos pasos

Una vez que tengas **al menos uno** de los datasets descomprimido:

1. Avisame cuál + verificación de `ls _pending/datasets/<nombre>/` para confirmar estructura
2. Yo armo el **Colab notebook** de fine-tuning apuntando a ese dataset
3. Vos subís el dataset a Colab (desde tu Drive o re-descarga directa en Colab)
4. Corrés el notebook — 30 min con GPU T4 gratis
5. Bajás el modelo fine-tuned + medimos mejora vs baseline 0.445

### Recomendación final

**DogFaceNet** es el más relevante (específico de re-identificación de perros, que es exactamente biometría nasal). Oxford Pets como backup si el release de DogFaceNet no funciona.

---

## Git tracking

- Este `README.md` SÍ se committea
- Todo lo demás dentro de `_pending/datasets/` está en `.gitignore`
- Los archivos `.gitkeep` mantienen las carpetas creadas aunque estén vacías

---

**Última actualización**: 2026-04-24 — sesión fine-tuning setup
