#!/usr/bin/env python3
"""
Nose Print Validation Script — Fase -1 del Refactor Maestro Paw Friend

Valida si un modelo biométrico pre-entrenado (MobileNetV3 base) distingue
correctamente entre mascotas usando fotos de nariz.

Uso:
    1. Crear carpeta _pending/nose_print_test_photos/ (ignorada por git)
    2. Adentro, 1 subcarpeta por mascota (ej: kai/, ema/, otto/, luna/, coco/)
    3. En cada subcarpeta, 3-5 fotos .jpg/.png de la nariz
    4. python scripts/nose_print_validation.py

Output:
    - Reporte en _pending/H2_nose_print_validation_report_<fecha>.md
    - Accuracy same-pet, false positive rate cross-pet
    - Recomendación GO / GO-with-finetune / NO-GO

Costo: $0 (todo local, no API).
Tiempo: ~2-5 minutos con 20-30 fotos.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
from itertools import combinations
from collections import defaultdict

try:
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
    from PIL import Image
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    print(f"[ERROR] Falta instalar dependencias: {e}")
    print("Ejecutar: pip install -r scripts/requirements_nose_print.txt")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# Configuracion
# ─────────────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
REPORT_PATH = REPO_ROOT / "_pending" / f"H2_nose_print_validation_report_{datetime.now().strftime('%Y%m%d')}.md"

# Threshold de similitud para considerar "match"
# Iteramos sobre varios para encontrar el optimo
THRESHOLDS = [0.70, 0.75, 0.80, 0.85, 0.90, 0.92, 0.95]

# Formato de imagen esperado
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Transformaciones standard para MobileNetV3
IMAGE_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ─────────────────────────────────────────────────────────────────────────────
# Modelo: MobileNetV3 pre-entrenado en ImageNet
# ─────────────────────────────────────────────────────────────────────────────
# NOTA: Para produccion deberíamos usar un modelo fine-tuned en el Pet
# Biometric Challenge dataset. Para esta validacion inicial usamos el modelo
# base pre-entrenado en ImageNet, que genera embeddings generales de imagen.
# Si la accuracy con este modelo es >80%, con fine-tuning deberia subir a >95%.

def load_model():
    print("[INFO] Cargando MobileNetV3-Large pre-entrenado en ImageNet...")
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)

    # Remover la capa final de clasificacion para usar el penultimo layer como embedding
    model.classifier = nn.Sequential(*list(model.classifier.children())[:-1])
    model.eval()
    print(f"[INFO] Modelo cargado. Output embedding dim: 1280")
    return model


def extract_embedding(model, image_path):
    """Extrae embedding de una imagen (vector 1280-dim)."""
    try:
        img = Image.open(image_path).convert("RGB")
        img_tensor = IMAGE_TRANSFORM(img).unsqueeze(0)
        with torch.no_grad():
            embedding = model(img_tensor).squeeze().numpy()
        return embedding
    except Exception as e:
        print(f"[WARN] Error procesando {image_path.name}: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Validacion
# ─────────────────────────────────────────────────────────────────────────────

def collect_photos():
    """Recolecta fotos organizadas por mascota."""
    if not PHOTOS_DIR.exists():
        print(f"[ERROR] Carpeta no existe: {PHOTOS_DIR}")
        print(f"\nPor favor crear la estructura:")
        print(f"  {PHOTOS_DIR}/")
        print(f"    kai/foto1.jpg foto2.jpg foto3.jpg ...")
        print(f"    ema/foto1.jpg foto2.jpg foto3.jpg ...")
        print(f"    otto/ ... luna/ ... coco/ ...")
        sys.exit(1)

    pets = {}
    for pet_dir in PHOTOS_DIR.iterdir():
        if pet_dir.is_dir() and not pet_dir.name.startswith("."):
            photos = [
                p for p in pet_dir.iterdir()
                if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS
            ]
            if len(photos) < 2:
                print(f"[WARN] {pet_dir.name} tiene solo {len(photos)} fotos. Necesitamos al menos 2.")
                continue
            pets[pet_dir.name] = photos
            print(f"[OK] {pet_dir.name}: {len(photos)} fotos")

    if len(pets) < 2:
        print(f"\n[ERROR] Necesitamos al menos 2 mascotas con 2+ fotos cada una.")
        print(f"Encontradas: {len(pets)}")
        sys.exit(1)

    print(f"\n[INFO] Total: {len(pets)} mascotas, {sum(len(p) for p in pets.values())} fotos")
    return pets


def compute_embeddings(model, pets):
    """Computa embeddings para todas las fotos."""
    embeddings = {}
    total = sum(len(p) for p in pets.values())
    done = 0

    for pet_name, photos in pets.items():
        embeddings[pet_name] = []
        for photo in photos:
            done += 1
            print(f"[{done}/{total}] {pet_name}/{photo.name}...", end=" ", flush=True)
            emb = extract_embedding(model, photo)
            if emb is not None:
                embeddings[pet_name].append({
                    "photo": photo.name,
                    "embedding": emb
                })
                print("OK")
            else:
                print("SKIP")

    return embeddings


def analyze_similarities(embeddings):
    """Calcula similitudes intra-pet (same) y cross-pet (different)."""
    same_pet_sims = []     # Similitudes entre fotos de la misma mascota
    cross_pet_sims = []    # Similitudes entre fotos de mascotas distintas
    detailed = {
        "same_pet": defaultdict(list),
        "cross_pet": []
    }

    pet_names = list(embeddings.keys())

    # Same-pet: todas las combinaciones de fotos dentro de la misma mascota
    for pet in pet_names:
        photos = embeddings[pet]
        for i, j in combinations(range(len(photos)), 2):
            emb_i = photos[i]["embedding"].reshape(1, -1)
            emb_j = photos[j]["embedding"].reshape(1, -1)
            sim = float(cosine_similarity(emb_i, emb_j)[0][0])
            same_pet_sims.append(sim)
            detailed["same_pet"][pet].append({
                "pair": (photos[i]["photo"], photos[j]["photo"]),
                "similarity": sim
            })

    # Cross-pet: todas las combinaciones de fotos entre mascotas distintas
    for pet_a, pet_b in combinations(pet_names, 2):
        for ph_a in embeddings[pet_a]:
            for ph_b in embeddings[pet_b]:
                emb_a = ph_a["embedding"].reshape(1, -1)
                emb_b = ph_b["embedding"].reshape(1, -1)
                sim = float(cosine_similarity(emb_a, emb_b)[0][0])
                cross_pet_sims.append(sim)
                detailed["cross_pet"].append({
                    "pets": (pet_a, pet_b),
                    "photos": (ph_a["photo"], ph_b["photo"]),
                    "similarity": sim
                })

    return same_pet_sims, cross_pet_sims, detailed


def compute_metrics(same_sims, cross_sims, thresholds):
    """Calcula accuracy y false positive rate para distintos thresholds."""
    metrics = []
    for t in thresholds:
        # Same-pet: cuantas pasan el threshold (idealmente todas)
        same_pass = sum(1 for s in same_sims if s >= t)
        same_acc = same_pass / len(same_sims) if same_sims else 0

        # Cross-pet: cuantas NO deberian pasar el threshold
        cross_fail = sum(1 for s in cross_sims if s >= t)
        fp_rate = cross_fail / len(cross_sims) if cross_sims else 0

        metrics.append({
            "threshold": t,
            "same_accuracy": same_acc,
            "false_positive_rate": fp_rate,
            "same_pairs": len(same_sims),
            "cross_pairs": len(cross_sims)
        })
    return metrics


def decide_go_no_go(metrics):
    """Recomendacion go/no-go basada en el mejor threshold encontrado."""
    # Buscar threshold con mejor compromiso (alta accuracy same, bajo FP cross)
    best = max(metrics, key=lambda m: m["same_accuracy"] - m["false_positive_rate"])

    if best["same_accuracy"] >= 0.95 and best["false_positive_rate"] <= 0.02:
        return "GO", "Modelo base funciona — proceder Fase 1 con MobileNetV3 o similar", best
    elif best["same_accuracy"] >= 0.85 and best["false_positive_rate"] <= 0.05:
        return "GO-WITH-FINETUNE", "Modelo base decente, fine-tuning en Pet Biometric Dataset deberia llevarlo a >95%", best
    elif best["same_accuracy"] >= 0.70:
        return "PIVOT-TO-API", "Modelo base insuficiente, usar API comercial Petnow ($0.0005/match)", best
    else:
        return "NO-GO", "Biometria en razas chilenas mixtas es problematica, repensar Fase 1", best


# ─────────────────────────────────────────────────────────────────────────────
# Reporte
# ─────────────────────────────────────────────────────────────────────────────

def write_report(pets, embeddings, same_sims, cross_sims, metrics, decision):
    lines = []
    lines.append(f"# H2 Nose Print Validation Report — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append("")
    lines.append(f"> Ejecutado con `scripts/nose_print_validation.py`")
    lines.append(f"> Modelo: MobileNetV3-Large pre-entrenado en ImageNet (sin fine-tuning)")
    lines.append(f"> Referencia: [_pending/FASE_-1_VALIDACION_2026_04_24.md](FASE_-1_VALIDACION_2026_04_24.md)")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Input")
    lines.append("")
    lines.append(f"- **Mascotas testeadas**: {len(pets)}")
    for pet_name, photos in pets.items():
        lines.append(f"  - {pet_name}: {len(photos)} fotos")
    lines.append(f"- **Total fotos**: {sum(len(p) for p in pets.values())}")
    lines.append(f"- **Pares same-pet analizados**: {len(same_sims)}")
    lines.append(f"- **Pares cross-pet analizados**: {len(cross_sims)}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Metricas por threshold")
    lines.append("")
    lines.append("| Threshold | Accuracy same-pet | False positive rate cross-pet |")
    lines.append("|---|---|---|")
    for m in metrics:
        lines.append(f"| {m['threshold']:.2f} | {m['same_accuracy']*100:.1f}% | {m['false_positive_rate']*100:.1f}% |")
    lines.append("")
    lines.append(f"**Same-pet similitudes**: min={min(same_sims):.3f}, max={max(same_sims):.3f}, mean={sum(same_sims)/len(same_sims):.3f}")
    lines.append(f"**Cross-pet similitudes**: min={min(cross_sims):.3f}, max={max(cross_sims):.3f}, mean={sum(cross_sims)/len(cross_sims):.3f}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Decision")
    lines.append("")
    verdict, reason, best = decision
    lines.append(f"**Veredicto**: {verdict}")
    lines.append("")
    lines.append(f"**Razon**: {reason}")
    lines.append("")
    lines.append(f"**Mejor threshold**: {best['threshold']:.2f} (accuracy {best['same_accuracy']*100:.1f}%, FP {best['false_positive_rate']*100:.1f}%)")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Interpretacion del veredicto")
    lines.append("")
    lines.append("- **GO**: proceder Fase 1 sin cambios. Modelo base funciona en razas chilenas.")
    lines.append("- **GO-WITH-FINETUNE**: proceder Fase 1 presupuestando $3-8k USD para fine-tuning con Pet Biometric Challenge dataset.")
    lines.append("- **PIVOT-TO-API**: proceder Fase 1 usando API comercial Petnow ($0.0005/match) en lugar de modelo propio.")
    lines.append("- **NO-GO**: revision mayor del plan. Nose print puede no ser viable como pilar 2 de la Trinidad en el corto plazo.")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Notas")
    lines.append("")
    lines.append("Esta es una validacion minima con 5 mascotas. Para decision final en Fase 1 se")
    lines.append("recomienda ampliar a 20-30 mascotas de distintas razas.")
    lines.append("")
    lines.append("Modelo usado: MobileNetV3 pre-entrenado en ImageNet. No esta especializado en")
    lines.append("narices de mascotas. Un modelo fine-tuned en Pet Biometric Challenge dataset")
    lines.append("(2022) o comercial (Petnow) deberia tener accuracy significativamente mayor.")
    lines.append("")

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n[OK] Reporte escrito en: {REPORT_PATH}")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("NOSE PRINT VALIDATION — Fase -1 Refactor Maestro Paw Friend")
    print("=" * 70)
    print()

    pets = collect_photos()
    model = load_model()
    embeddings = compute_embeddings(model, pets)

    print("\n[INFO] Analizando similitudes...")
    same_sims, cross_sims, detailed = analyze_similarities(embeddings)

    print(f"\n[INFO] Calculando metricas para {len(THRESHOLDS)} thresholds...")
    metrics = compute_metrics(same_sims, cross_sims, THRESHOLDS)

    decision = decide_go_no_go(metrics)

    # Print summary
    print("\n" + "=" * 70)
    print("RESULTADOS")
    print("=" * 70)
    for m in metrics:
        print(f"  Threshold {m['threshold']:.2f}: Same-pet acc={m['same_accuracy']*100:.1f}%, FP cross-pet={m['false_positive_rate']*100:.1f}%")
    print()
    verdict, reason, best = decision
    print(f"  VEREDICTO: {verdict}")
    print(f"  Razon: {reason}")
    print(f"  Mejor threshold: {best['threshold']:.2f}")
    print()

    write_report(pets, embeddings, same_sims, cross_sims, metrics, decision)

    print("=" * 70)
    print("Proximo paso: enviar reporte a Claude para decision Fase 1")
    print("=" * 70)


if __name__ == "__main__":
    main()
