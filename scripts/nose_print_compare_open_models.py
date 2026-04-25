#!/usr/bin/env python3
"""
Comparativa de modelos open-source para nose print biometrico.

Refactor Maestro Fase 1 §6.2.

El test SigLIP2-base del 2026-04-24 dio 🟡 GO-WITH-FINETUNE (gap 0.0733,
hermanos confundibles). Antes de invertir en fine-tune, probamos otros
modelos open-source que pueden venir mejor calibrados para fine-grained
discrimination.

Modelos comparados (todos via transformers, CPU local):
    - facebook/dinov2-base       (768 dim — drop-in replacement)
    - facebook/dinov2-large      (1024 dim — requiere migrar VECTOR(1024))
    - google/siglip2-base-patch16-224 (768 dim — baseline ya medido)

Reporta: intra-mean, inter-mean, gap, decision por modelo + mejor candidato.

Costo: $0. Tiempo: ~10-15 min en CPU con 89 fotos x 3 modelos.
"""

import sys
from datetime import datetime
from pathlib import Path
from itertools import combinations
from collections import defaultdict

# UTF-8 para consolas Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    import torch
    from transformers import AutoModel, AutoProcessor, AutoImageProcessor
    from PIL import Image
    import numpy as np
except ImportError as e:
    print(f"[ERROR] Falta instalar: {e}")
    print("Ejecutar: pip install -r scripts/requirements_nose_print_siglip2.txt")
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
REPORT_PATH = REPO_ROOT / "_pending" / f"nose_print_compare_models_{datetime.now().strftime('%Y%m%d_%H%M')}.md"

VALID_EXT = {".jpg", ".jpeg", ".png", ".webp"}

# Modelos a comparar
MODELS = [
    {
        "id": "google/siglip2-base-patch16-224",
        "label": "SigLIP2-base (baseline 2026-04-24)",
        "kind": "siglip",
        "dim": 768,
    },
    {
        "id": "facebook/dinov2-base",
        "label": "DINOv2-base",
        "kind": "dinov2",
        "dim": 768,
    },
    {
        "id": "facebook/dinov2-large",
        "label": "DINOv2-large",
        "kind": "dinov2",
        "dim": 1024,
    },
]

GO_GAP_MIN = 0.10
GO_INTRA_MIN = 0.90
GO_INTER_MAX = 0.85


def extract_embedding_siglip(model, processor, image_path, device):
    """SigLIP2 — usa pooler_output del vision_model."""
    img = Image.open(image_path).convert("RGB")
    inputs = processor(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        out = model.vision_model(**inputs)
        emb = out.pooler_output.squeeze().cpu().numpy()
    norm = np.linalg.norm(emb)
    if norm > 0:
        emb = emb / norm
    return emb.astype(np.float32)


def extract_embedding_dinov2(model, processor, image_path, device):
    """DINOv2 — usa pooler_output (CLS token) directamente."""
    img = Image.open(image_path).convert("RGB")
    inputs = processor(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        out = model(**inputs)
        # DINOv2: pooler_output es CLS token features (preferido para image-level reps)
        emb = out.pooler_output.squeeze().cpu().numpy()
    norm = np.linalg.norm(emb)
    if norm > 0:
        emb = emb / norm
    return emb.astype(np.float32)


def cosine(a, b):
    return float(np.dot(a, b))


def evaluate_model(spec, device):
    """Carga un modelo y devuelve metricas intra/inter sobre PHOTOS_DIR."""
    print(f"\n{'='*72}")
    print(f"Evaluando {spec['label']}")
    print(f"{'='*72}")

    model = AutoModel.from_pretrained(spec["id"]).to(device).eval()
    if spec["kind"] == "siglip":
        processor = AutoProcessor.from_pretrained(spec["id"])
        extract_fn = extract_embedding_siglip
    else:
        processor = AutoImageProcessor.from_pretrained(spec["id"])
        extract_fn = extract_embedding_dinov2

    pet_dirs = sorted([d for d in PHOTOS_DIR.iterdir() if d.is_dir()])
    pet_embeddings = {}
    for pd in pet_dirs:
        photos = sorted([p for p in pd.iterdir() if p.suffix.lower() in VALID_EXT])
        if not photos:
            continue
        print(f"  {pd.name}: {len(photos)} fotos…", flush=True)
        embs = []
        for ph in photos:
            try:
                e = extract_fn(model, processor, ph, device)
                embs.append(e)
            except Exception as ex:
                print(f"    [WARN] {ph.name}: {ex}")
        if embs:
            pet_embeddings[pd.name] = embs

    # Free memory antes del siguiente modelo
    del model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    # Calcular intra/inter
    intra = []
    inter_pair_means = {}
    for pet, embs in pet_embeddings.items():
        for a, b in combinations(embs, 2):
            intra.append(cosine(a, b))

    pet_list = list(pet_embeddings.keys())
    inter_all = []
    for p1, p2 in combinations(pet_list, 2):
        sims = [cosine(a, b) for a in pet_embeddings[p1] for b in pet_embeddings[p2]]
        if sims:
            inter_pair_means[(p1, p2)] = float(np.mean(sims))
            inter_all.extend(sims)

    intra_mean = float(np.mean(intra)) if intra else 0.0
    intra_min = float(np.min(intra)) if intra else 0.0
    intra_std = float(np.std(intra)) if intra else 0.0
    inter_mean = float(np.mean(inter_all)) if inter_all else 0.0
    inter_max = float(np.max(inter_all)) if inter_all else 0.0
    inter_std = float(np.std(inter_all)) if inter_all else 0.0
    gap = intra_mean - inter_mean

    if intra_mean >= GO_INTRA_MIN and inter_mean <= GO_INTER_MAX and gap >= GO_GAP_MIN:
        decision = "GO"
    elif gap >= 0.05:
        decision = "GO-WITH-FINETUNE"
    else:
        decision = "NO-GO"

    print(f"  intra: mean={intra_mean:.4f}  min={intra_min:.4f}  std={intra_std:.4f}")
    print(f"  inter: mean={inter_mean:.4f}  max={inter_max:.4f}  std={inter_std:.4f}")
    print(f"  GAP:   {gap:.4f}   →  {decision}")

    # Top peores pares
    worst = sorted(inter_pair_means.items(), key=lambda x: -x[1])[:3]
    print("  Peores pares (mas confundibles):")
    for (p1, p2), m in worst:
        print(f"    {p1} vs {p2}: {m:.4f}")

    return {
        "id": spec["id"],
        "label": spec["label"],
        "dim": spec["dim"],
        "intra_mean": intra_mean,
        "intra_min": intra_min,
        "intra_std": intra_std,
        "inter_mean": inter_mean,
        "inter_max": inter_max,
        "inter_std": inter_std,
        "gap": gap,
        "decision": decision,
        "worst_pairs": worst,
    }


def main():
    if not PHOTOS_DIR.exists():
        print(f"[ERROR] {PHOTOS_DIR} no existe")
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    results = []
    for spec in MODELS:
        try:
            r = evaluate_model(spec, device)
            results.append(r)
        except Exception as e:
            print(f"[ERROR] {spec['id']}: {e}")
            import traceback
            traceback.print_exc()

    if not results:
        print("[ERROR] Ningún modelo evaluado correctamente")
        sys.exit(1)

    # Resumen comparativo
    print(f"\n{'='*72}")
    print("COMPARATIVA FINAL")
    print(f"{'='*72}")
    print(f"{'Modelo':<45} {'dim':>5} {'intra':>8} {'inter':>8} {'gap':>8} {'decision':<20}")
    for r in sorted(results, key=lambda x: -x["gap"]):
        print(
            f"{r['label']:<45} {r['dim']:>5} "
            f"{r['intra_mean']:>8.4f} {r['inter_mean']:>8.4f} {r['gap']:>8.4f} "
            f"{r['decision']:<20}"
        )

    # Mejor candidato
    best = max(results, key=lambda x: x["gap"])
    print(f"\n🏆 MEJOR: {best['label']}  (gap={best['gap']:.4f}, decision={best['decision']})")

    # Markdown report
    lines = []
    lines.append(f"# Nose Print Comparativa de Modelos ({datetime.now().strftime('%Y-%m-%d %H:%M')})\n")
    lines.append(f"Dataset: {PHOTOS_DIR.relative_to(REPO_ROOT)} — 8 mascotas, 89 fotos.\n")
    lines.append(f"## Resumen comparativo\n")
    lines.append(f"| Modelo | Dim | Intra mean | Inter mean | Gap | Decisión |")
    lines.append(f"|---|---|---|---|---|---|")
    for r in sorted(results, key=lambda x: -x["gap"]):
        lines.append(
            f"| {r['label']} | {r['dim']} | {r['intra_mean']:.4f} | "
            f"{r['inter_mean']:.4f} | **{r['gap']:.4f}** | {r['decision']} |"
        )
    lines.append("")
    lines.append(f"## Mejor candidato\n\n**{best['label']}** — gap {best['gap']:.4f} → {best['decision']}\n")
    lines.append(f"## Detalle por modelo\n")
    for r in results:
        lines.append(f"### {r['label']}\n")
        lines.append(f"- Model ID: `{r['id']}`")
        lines.append(f"- Embedding dim: {r['dim']}")
        lines.append(f"- Intra: mean={r['intra_mean']:.4f}, min={r['intra_min']:.4f}, std={r['intra_std']:.4f}")
        lines.append(f"- Inter: mean={r['inter_mean']:.4f}, max={r['inter_max']:.4f}, std={r['inter_std']:.4f}")
        lines.append(f"- Gap: **{r['gap']:.4f}** — {r['decision']}")
        lines.append(f"- Pares más confundibles:")
        for (p1, p2), m in r["worst_pairs"]:
            lines.append(f"  - {p1} vs {p2}: {m:.4f}")
        lines.append("")
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n[INFO] Reporte: {REPORT_PATH}")


if __name__ == "__main__":
    main()
