#!/usr/bin/env python3
"""
Nose Print Validation Script — SigLIP2-base test cross-pet.

Refactor Maestro Fase 1 §6.2 — Pilar 1 Trinidad del Corazon.

Reemplaza al script anterior (MobileNetV3, 0.691 mean) por SigLIP2-base
(0.923 mean en test previo con Ema). Esta validacion responde la pregunta
clave del plan: ¿discrimina hermanos genéticamente similares?

Uso:
    1. Activar venv (opcional pero recomendado)
    2. pip install -r scripts/requirements_nose_print_siglip2.txt
    3. python scripts/nose_print_validation_siglip2.py

Lee:
    _pending/nose_print_test_photos/<pet_name>/*.{jpg,jpeg,png,webp}

Reporta:
    - Mean intra-pet similarity (foto-vs-foto del mismo animal)
    - Mean inter-pet similarity (foto-vs-foto de animales distintos)
    - Gap = intra - inter (lo importante)
    - Por par de mascotas: similarity matrix
    - Decisión GO / GO-with-finetune / NO-GO

Costo: $0 (descarga modelo 1ra vez, ~700 MB).
Tiempo: ~5 min con 8 mascotas y ~90 fotos (CPU). GPU si disponible.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
from itertools import combinations
from collections import defaultdict

# Forzar UTF-8 en stdout/stderr para que los caracteres unicode (→, ✅, etc)
# no rompan en consolas Windows con encoding cp1252.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    import torch
    from transformers import AutoModel, AutoProcessor
    from PIL import Image
    import numpy as np
except ImportError as e:
    print(f"[ERROR] Falta instalar: {e}")
    print("Ejecutar: pip install -r scripts/requirements_nose_print_siglip2.txt")
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
REPORT_PATH = REPO_ROOT / "_pending" / f"nose_print_siglip2_report_{datetime.now().strftime('%Y%m%d_%H%M')}.md"

VALID_EXT = {".jpg", ".jpeg", ".png", ".webp"}

# Modelo elegido (memoria 2026-04-24 + commit 971b6f2d)
MODEL_ID = "google/siglip2-base-patch16-224"

# Threshold de decision por par (cosine similarity)
# El plan dice que un buen sistema biometrico tiene gap >0.10 entre intra
# (mismo animal) e inter (animales distintos)
GO_GAP_MIN = 0.10
GO_INTRA_MIN = 0.90
GO_INTER_MAX = 0.85


def load_model():
    print(f"[INFO] Cargando {MODEL_ID}…")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[INFO] Device: {device}")
    model = AutoModel.from_pretrained(MODEL_ID).to(device).eval()
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    print(f"[INFO] Modelo listo. Embedding dim: {model.config.vision_config.hidden_size}")
    return model, processor, device


def extract_embedding(model, processor, image_path, device):
    try:
        img = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"[WARN] Error abriendo {image_path.name}: {e}")
        return None

    inputs = processor(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        # SigLIP2 vision_model devuelve last_hidden_state + pooler_output
        outputs = model.vision_model(**inputs)
        # Usamos pooler_output como embedding final (más estable que mean del last_hidden)
        emb = outputs.pooler_output.squeeze().cpu().numpy()

    # L2 normalize para cosine similarity directa
    norm = np.linalg.norm(emb)
    if norm > 0:
        emb = emb / norm
    return emb.astype(np.float32)


def cosine(a, b):
    return float(np.dot(a, b))


def main():
    if not PHOTOS_DIR.exists():
        print(f"[ERROR] {PHOTOS_DIR} no existe")
        sys.exit(1)

    pet_dirs = sorted([d for d in PHOTOS_DIR.iterdir() if d.is_dir()])
    if len(pet_dirs) < 2:
        print(f"[ERROR] Necesito al menos 2 mascotas en {PHOTOS_DIR}, encontré {len(pet_dirs)}")
        sys.exit(1)

    model, processor, device = load_model()

    # Extraer embeddings por mascota
    pet_embeddings = {}
    for pet_dir in pet_dirs:
        photos = sorted([p for p in pet_dir.iterdir() if p.suffix.lower() in VALID_EXT])
        if not photos:
            print(f"[WARN] {pet_dir.name} sin fotos válidas, skip")
            continue
        print(f"\n[INFO] Procesando {pet_dir.name} ({len(photos)} fotos)…")
        embs = []
        for ph in photos:
            emb = extract_embedding(model, processor, ph, device)
            if emb is not None:
                embs.append((ph.name, emb))
        if embs:
            pet_embeddings[pet_dir.name] = embs
            print(f"[INFO]   → {len(embs)} embeddings extraídos")

    if len(pet_embeddings) < 2:
        print("[ERROR] No hay suficientes mascotas con embeddings válidos")
        sys.exit(1)

    # ─────────────────────────────────────────────────────────────────────
    # Análisis intra-pet (foto-vs-foto del mismo animal)
    # ─────────────────────────────────────────────────────────────────────
    intra_pet_sims = defaultdict(list)
    intra_pet_pairs = defaultdict(list)
    for pet_name, embs in pet_embeddings.items():
        for (n1, e1), (n2, e2) in combinations(embs, 2):
            s = cosine(e1, e2)
            intra_pet_sims[pet_name].append(s)
            intra_pet_pairs[pet_name].append((n1, n2, s))

    # ─────────────────────────────────────────────────────────────────────
    # Análisis inter-pet (foto-vs-foto de animales distintos)
    # ─────────────────────────────────────────────────────────────────────
    inter_pet_sims = defaultdict(list)
    inter_pet_pair_means = {}
    pet_list = list(pet_embeddings.keys())
    for p1, p2 in combinations(pet_list, 2):
        sims = []
        for (_, e1) in pet_embeddings[p1]:
            for (_, e2) in pet_embeddings[p2]:
                s = cosine(e1, e2)
                sims.append(s)
                inter_pet_sims[(p1, p2)].append(s)
        inter_pet_pair_means[(p1, p2)] = np.mean(sims) if sims else 0.0

    # ─────────────────────────────────────────────────────────────────────
    # Resumen estadístico
    # ─────────────────────────────────────────────────────────────────────
    all_intra = [s for sims in intra_pet_sims.values() for s in sims]
    all_inter = [s for sims in inter_pet_sims.values() for s in sims]

    intra_mean = float(np.mean(all_intra)) if all_intra else 0.0
    intra_std = float(np.std(all_intra)) if all_intra else 0.0
    intra_min = float(np.min(all_intra)) if all_intra else 0.0
    inter_mean = float(np.mean(all_inter)) if all_inter else 0.0
    inter_std = float(np.std(all_inter)) if all_inter else 0.0
    inter_max = float(np.max(all_inter)) if all_inter else 0.0
    gap = intra_mean - inter_mean

    # Decisión
    if intra_mean >= GO_INTRA_MIN and inter_mean <= GO_INTER_MAX and gap >= GO_GAP_MIN:
        decision = "✅ GO — SigLIP2-base discrimina suficiente, activar NOSE_PRINT_PUBLIC_SCAN"
    elif gap >= 0.05:
        decision = "🟡 GO-WITH-FINETUNE — Gap aceptable, pero conviene fine-tunear DINOv2-large con triplet loss para producción robusta. Mientras tanto activar PUBLIC_SCAN solo en pre-producción."
    else:
        decision = "🔴 NO-GO — El modelo confunde animales distintos. NO activar PUBLIC_SCAN. Plan B: fine-tunear DINOv2-large con dataset crowdsourced (notebook scripts/finetune_dinov2_nose_v2.ipynb)."

    # ─────────────────────────────────────────────────────────────────────
    # Imprimir + escribir reporte
    # ─────────────────────────────────────────────────────────────────────
    print("\n" + "=" * 72)
    print("RESUMEN — SigLIP2-base sobre nose prints reales")
    print("=" * 72)
    print(f"Mascotas analizadas: {len(pet_embeddings)}")
    print(f"Embeddings totales: {sum(len(e) for e in pet_embeddings.values())}")
    print(f"\nINTRA-PET (foto-vs-foto del mismo animal)")
    print(f"  mean: {intra_mean:.4f}   std: {intra_std:.4f}   min: {intra_min:.4f}")
    print(f"\nINTER-PET (foto-vs-foto de animales distintos)")
    print(f"  mean: {inter_mean:.4f}   std: {inter_std:.4f}   max: {inter_max:.4f}")
    print(f"\nGAP (intra - inter): {gap:.4f}")
    print(f"\nDECISIÓN: {decision}")

    # Tabla por par
    print("\nINTRA-PET por mascota:")
    for pet_name, sims in sorted(intra_pet_sims.items()):
        if sims:
            print(f"  {pet_name:25s} n={len(sims):3d}  mean={np.mean(sims):.4f}  min={np.min(sims):.4f}")

    print("\nINTER-PET por par (las que están más cerca son las más peligrosas):")
    sorted_pairs = sorted(inter_pet_pair_means.items(), key=lambda x: -x[1])
    for (p1, p2), m in sorted_pairs[:15]:
        warn = "⚠️" if m > 0.85 else "  "
        print(f"  {warn} {p1:20s} vs {p2:20s}  mean={m:.4f}")

    # Reporte markdown
    lines = []
    lines.append(f"# Nose Print Validation — SigLIP2-base ({datetime.now().strftime('%Y-%m-%d %H:%M')})\n")
    lines.append(f"**Modelo**: `{MODEL_ID}`\n")
    lines.append(f"**Mascotas**: {len(pet_embeddings)}  ")
    lines.append(f"**Embeddings**: {sum(len(e) for e in pet_embeddings.values())}\n")
    lines.append(f"## Resumen estadístico\n")
    lines.append(f"| Métrica | Valor |")
    lines.append(f"|---|---|")
    lines.append(f"| Intra-pet mean (similitud misma mascota) | **{intra_mean:.4f}** |")
    lines.append(f"| Intra-pet std | {intra_std:.4f} |")
    lines.append(f"| Intra-pet min | {intra_min:.4f} |")
    lines.append(f"| Inter-pet mean (similitud entre mascotas distintas) | **{inter_mean:.4f}** |")
    lines.append(f"| Inter-pet std | {inter_std:.4f} |")
    lines.append(f"| Inter-pet max | {inter_max:.4f} |")
    lines.append(f"| **Gap (intra - inter)** | **{gap:.4f}** |\n")
    lines.append(f"## Decisión\n\n{decision}\n")
    lines.append(f"## Umbrales objetivo\n")
    lines.append(f"- Intra mean ≥ {GO_INTRA_MIN}")
    lines.append(f"- Inter mean ≤ {GO_INTER_MAX}")
    lines.append(f"- Gap ≥ {GO_GAP_MIN}\n")
    lines.append(f"## Intra-pet por mascota\n")
    lines.append(f"| Mascota | N pares | Mean | Min |")
    lines.append(f"|---|---|---|---|")
    for pet_name, sims in sorted(intra_pet_sims.items()):
        if sims:
            lines.append(f"| {pet_name} | {len(sims)} | {np.mean(sims):.4f} | {np.min(sims):.4f} |")
    lines.append("")
    lines.append(f"## Inter-pet por par (ordenadas por similarity desc)\n")
    lines.append(f"| Par | Mean similarity | Riesgo |")
    lines.append(f"|---|---|---|")
    for (p1, p2), m in sorted_pairs:
        risk = "⚠️ alto" if m > 0.85 else ("🟡 medio" if m > 0.75 else "🟢 bajo")
        lines.append(f"| {p1} vs {p2} | {m:.4f} | {risk} |")
    lines.append("")
    lines.append(f"## Datos crudos\n")
    lines.append("```json")
    lines.append(json.dumps({
        "model_id": MODEL_ID,
        "pets": list(pet_embeddings.keys()),
        "intra_mean": round(intra_mean, 4),
        "inter_mean": round(inter_mean, 4),
        "gap": round(gap, 4),
        "decision": decision,
        "thresholds": {"intra_min": GO_INTRA_MIN, "inter_max": GO_INTER_MAX, "gap_min": GO_GAP_MIN},
    }, indent=2))
    lines.append("```")
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n[INFO] Reporte: {REPORT_PATH}")


if __name__ == "__main__":
    main()
