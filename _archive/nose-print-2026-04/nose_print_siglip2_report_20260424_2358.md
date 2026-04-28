# Nose Print Validation — SigLIP2-base (2026-04-24 23:59)

**Modelo**: `google/siglip2-base-patch16-224`

**Mascotas**: 8  
**Embeddings**: 89

## Resumen estadístico

| Métrica | Valor |
|---|---|
| Intra-pet mean (similitud misma mascota) | **0.8783** |
| Intra-pet std | 0.0493 |
| Intra-pet min | 0.7199 |
| Inter-pet mean (similitud entre mascotas distintas) | **0.8050** |
| Inter-pet std | 0.0486 |
| Inter-pet max | 0.9208 |
| **Gap (intra - inter)** | **0.0733** |

## Decisión

🟡 GO-WITH-FINETUNE — Gap aceptable, pero conviene fine-tunear DINOv2-large con triplet loss para producción robusta. Mientras tanto activar PUBLIC_SCAN solo en pre-producción.

## Umbrales objetivo

- Intra mean ≥ 0.9
- Inter mean ≤ 0.85
- Gap ≥ 0.1

## Intra-pet por mascota

| Mascota | N pares | Mean | Min |
|---|---|---|---|
| border_collie_1 | 10 | 0.8789 | 0.8565 |
| border_collie_2 | 10 | 0.9266 | 0.8800 |
| border_collie_3 | 780 | 0.8735 | 0.7199 |
| mi_gato | 15 | 0.9297 | 0.9002 |
| pastor_suizo_1 | 15 | 0.8958 | 0.8342 |
| pastor_suizo_2 | 10 | 0.9165 | 0.8773 |
| pastor_suizo_3 | 153 | 0.8878 | 0.7699 |
| terrier_chileno | 6 | 0.9459 | 0.9110 |

## Inter-pet por par (ordenadas por similarity desc)

| Par | Mean similarity | Riesgo |
|---|---|---|
| pastor_suizo_1 vs pastor_suizo_2 | 0.8674 | ⚠️ alto |
| border_collie_1 vs pastor_suizo_1 | 0.8520 | ⚠️ alto |
| border_collie_2 vs border_collie_3 | 0.8367 | 🟡 medio |
| border_collie_2 vs pastor_suizo_1 | 0.8318 | 🟡 medio |
| border_collie_1 vs border_collie_2 | 0.8301 | 🟡 medio |
| border_collie_2 vs pastor_suizo_2 | 0.8280 | 🟡 medio |
| border_collie_1 vs pastor_suizo_2 | 0.8261 | 🟡 medio |
| border_collie_1 vs border_collie_3 | 0.8253 | 🟡 medio |
| border_collie_1 vs pastor_suizo_3 | 0.8245 | 🟡 medio |
| pastor_suizo_1 vs pastor_suizo_3 | 0.8223 | 🟡 medio |
| border_collie_3 vs pastor_suizo_3 | 0.8216 | 🟡 medio |
| border_collie_3 vs pastor_suizo_1 | 0.8174 | 🟡 medio |
| border_collie_2 vs pastor_suizo_3 | 0.8161 | 🟡 medio |
| border_collie_3 vs pastor_suizo_2 | 0.8079 | 🟡 medio |
| pastor_suizo_2 vs pastor_suizo_3 | 0.8079 | 🟡 medio |
| border_collie_3 vs terrier_chileno | 0.8010 | 🟡 medio |
| pastor_suizo_3 vs terrier_chileno | 0.7993 | 🟡 medio |
| border_collie_2 vs terrier_chileno | 0.7973 | 🟡 medio |
| border_collie_1 vs terrier_chileno | 0.7670 | 🟡 medio |
| pastor_suizo_1 vs terrier_chileno | 0.7660 | 🟡 medio |
| mi_gato vs terrier_chileno | 0.7606 | 🟡 medio |
| pastor_suizo_2 vs terrier_chileno | 0.7573 | 🟡 medio |
| border_collie_3 vs mi_gato | 0.7442 | 🟢 bajo |
| mi_gato vs pastor_suizo_3 | 0.7400 | 🟢 bajo |
| border_collie_1 vs mi_gato | 0.7325 | 🟢 bajo |
| mi_gato vs pastor_suizo_2 | 0.7276 | 🟢 bajo |
| border_collie_2 vs mi_gato | 0.7253 | 🟢 bajo |
| mi_gato vs pastor_suizo_1 | 0.7188 | 🟢 bajo |

## Datos crudos

```json
{
  "model_id": "google/siglip2-base-patch16-224",
  "pets": [
    "border_collie_1",
    "border_collie_2",
    "border_collie_3",
    "mi_gato",
    "pastor_suizo_1",
    "pastor_suizo_2",
    "pastor_suizo_3",
    "terrier_chileno"
  ],
  "intra_mean": 0.8783,
  "inter_mean": 0.805,
  "gap": 0.0733,
  "decision": "\ud83d\udfe1 GO-WITH-FINETUNE \u2014 Gap aceptable, pero conviene fine-tunear DINOv2-large con triplet loss para producci\u00f3n robusta. Mientras tanto activar PUBLIC_SCAN solo en pre-producci\u00f3n.",
  "thresholds": {
    "intra_min": 0.9,
    "inter_max": 0.85,
    "gap_min": 0.1
  }
}
```