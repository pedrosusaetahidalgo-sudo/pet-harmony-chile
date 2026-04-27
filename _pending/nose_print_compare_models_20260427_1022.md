# Nose Print Comparativa de Modelos (2026-04-27 10:32)

Dataset: _pending\nose_print_test_photos — 8 mascotas, 89 fotos.

## Resumen comparativo

| Modelo | Dim | Intra mean | Inter mean | Gap | Decisión |
|---|---|---|---|---|---|
| DINOv2-large | 1024 | 0.6040 | 0.2641 | **0.3400** | GO-WITH-FINETUNE |
| DINOv2-base | 768 | 0.6001 | 0.3104 | **0.2897** | GO-WITH-FINETUNE |
| SigLIP2-base (baseline 2026-04-24) | 768 | 0.8783 | 0.8050 | **0.0733** | GO-WITH-FINETUNE |

## Mejor candidato

**DINOv2-large** — gap 0.3400 → GO-WITH-FINETUNE

## Detalle por modelo

### SigLIP2-base (baseline 2026-04-24)

- Model ID: `google/siglip2-base-patch16-224`
- Embedding dim: 768
- Intra: mean=0.8783, min=0.7199, std=0.0493
- Inter: mean=0.8050, max=0.9208, std=0.0486
- Gap: **0.0733** — GO-WITH-FINETUNE
- Pares más confundibles:
  - pastor_suizo_1 vs pastor_suizo_2: 0.8674
  - border_collie_1 vs pastor_suizo_1: 0.8520
  - border_collie_2 vs border_collie_3: 0.8367

### DINOv2-base

- Model ID: `facebook/dinov2-base`
- Embedding dim: 768
- Intra: mean=0.6001, min=0.2068, std=0.1532
- Inter: mean=0.3104, max=0.8009, std=0.1986
- Gap: **0.2897** — GO-WITH-FINETUNE
- Pares más confundibles:
  - pastor_suizo_1 vs pastor_suizo_2: 0.6077
  - pastor_suizo_1 vs pastor_suizo_3: 0.6004
  - pastor_suizo_2 vs pastor_suizo_3: 0.5565

### DINOv2-large

- Model ID: `facebook/dinov2-large`
- Embedding dim: 1024
- Intra: mean=0.6040, min=0.1892, std=0.1538
- Inter: mean=0.2641, max=0.8212, std=0.1904
- Gap: **0.3400** — GO-WITH-FINETUNE
- Pares más confundibles:
  - pastor_suizo_1 vs pastor_suizo_2: 0.6491
  - pastor_suizo_1 vs pastor_suizo_3: 0.6447
  - pastor_suizo_2 vs pastor_suizo_3: 0.6100
