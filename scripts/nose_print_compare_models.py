#!/usr/bin/env python3
"""
Nose Print Compare Models — mide same-pet similarity en 4 modelos open source

Corre secuencialmente los 4 mejores embedding models de HuggingFace y reporta
cual funciona mejor para biometria nasal. Util para decidir antes del test
completo con multiples mascotas.

Modelos probados:
    1. facebook/dinov2-large          (300M, baseline confirmado Pedro)
    2. facebook/dinov2-giant          (1.1B, ~4.5GB descarga primera vez)
    3. google/siglip-base-patch16-224 (400M, Google 2024, paradigma vision-language)
    4. facebook/dinov2-base           (86M, comparacion vs chico)

NOTA: DINOv2-giant descarga ~4.5GB primera vez. Si tenes conexion lenta,
comenta la linea correspondiente en MODELS_TO_TEST.

Uso:
    python scripts/nose_print_compare_models.py [--skip-giant]

Output:
    Tabla comparativa final + recomendacion del mejor modelo.
"""

import sys
import time
from pathlib import Path
from itertools import combinations

try:
    import torch
    from transformers import AutoImageProcessor, AutoModel
    from PIL import Image
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    print(f"[ERROR] Falta dependencia: {e}")
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Modelos a testear. Orden: pequeno primero, gigante ultimo.
MODELS_TO_TEST = [
    {
        "id": "facebook/dinov2-base",
        "label": "DINOv2-base",
        "size": "86M params, 768 dims",
    },
    {
        "id": "facebook/dinov2-large",
        "label": "DINOv2-large",
        "size": "300M params, 1024 dims",
    },
    {
        "id": "google/siglip-base-patch16-224",
        "label": "SigLIP-base",
        "size": "400M params, 768 dims (Google)",
    },
    {
        "id": "google/siglip2-base-patch16-224",
        "label": "SigLIP2-base",
        "size": "400M params, 768 dims (Google 2024, mejorado)",
    },
    {
        "id": "facebook/dinov2-giant",
        "label": "DINOv2-giant",
        "size": "1.1B params, 1536 dims (~4.5GB download)",
    },
]


def collect_photos():
    if not PHOTOS_DIR.exists():
        print(f"[ERROR] Carpeta no existe: {PHOTOS_DIR}")
        sys.exit(1)
    pets = {}
    for pet_dir in PHOTOS_DIR.iterdir():
        if pet_dir.is_dir() and not pet_dir.name.startswith("."):
            photos = [
                p for p in pet_dir.iterdir()
                if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS
            ]
            if len(photos) >= 2:
                pets[pet_dir.name] = photos
                print(f"[OK] {pet_dir.name}: {len(photos)} fotos")
    total = sum(len(p) for p in pets.values())
    print(f"[INFO] Total: {len(pets)} mascotas, {total} fotos\n")
    return pets


def extract_embedding(processor, model, image_path, model_id=""):
    try:
        img = Image.open(image_path).convert("RGB")
        w, h = img.size
        crop_size = min(w, h)
        left = (w - crop_size) // 2
        top = (h - crop_size) // 2
        img_cropped = img.crop((left, top, left + crop_size, top + crop_size))

        # SigLIP: usar solo vision tower (sin text input)
        if "siglip" in model_id.lower():
            inputs = processor(images=img_cropped, return_tensors="pt")
            with torch.no_grad():
                # Llamar directamente al vision_model para evitar requerir text input
                outputs = model.vision_model(**inputs)
                embedding = outputs.pooler_output.squeeze().numpy()
            return embedding

        # DINOv2 y otros: usar AutoModel standard
        inputs = processor(images=img_cropped, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                embedding = outputs.pooler_output.squeeze().numpy()
            else:
                embedding = outputs.last_hidden_state[:, 0, :].squeeze().numpy()
        return embedding
    except Exception as e:
        print(f"[WARN] Error procesando {image_path.name}: {e}")
        return None


def test_model(model_info, pets):
    print(f"\n{'=' * 70}")
    print(f"MODELO: {model_info['label']} ({model_info['size']})")
    print(f"ID: {model_info['id']}")
    print("=" * 70)

    start_load = time.time()
    try:
        processor = AutoImageProcessor.from_pretrained(model_info["id"])
        model = AutoModel.from_pretrained(model_info["id"])
        model.eval()
    except Exception as e:
        print(f"[ERROR] No se pudo cargar modelo: {e}")
        return None
    load_time = time.time() - start_load
    print(f"[INFO] Modelo cargado en {load_time:.1f}s")

    # Extraer embeddings
    embeddings = {}
    total = sum(len(p) for p in pets.values())
    done = 0
    start_embed = time.time()
    for pet_name, photos in pets.items():
        embeddings[pet_name] = []
        for photo in photos:
            done += 1
            emb = extract_embedding(processor, model, photo, model_info["id"])
            if emb is not None:
                embeddings[pet_name].append({"photo": photo.name, "embedding": emb})
    embed_time = time.time() - start_embed
    print(f"[INFO] {done} embeddings extraidos en {embed_time:.1f}s ({embed_time/done:.2f}s/img)")

    # Same-pet similarity
    same_sims = []
    for pet_name, photos in embeddings.items():
        for i, j in combinations(range(len(photos)), 2):
            emb_i = photos[i]["embedding"].reshape(1, -1)
            emb_j = photos[j]["embedding"].reshape(1, -1)
            sim = float(cosine_similarity(emb_i, emb_j)[0][0])
            same_sims.append(sim)

    # Cross-pet si hay >1 mascota
    cross_sims = []
    pet_names = list(embeddings.keys())
    for pa, pb in combinations(pet_names, 2):
        for ea in embeddings[pa]:
            for eb in embeddings[pb]:
                emb_a = ea["embedding"].reshape(1, -1)
                emb_b = eb["embedding"].reshape(1, -1)
                sim = float(cosine_similarity(emb_a, emb_b)[0][0])
                cross_sims.append(sim)

    result = {
        "model": model_info["label"],
        "model_id": model_info["id"],
        "load_time_s": load_time,
        "embed_time_s": embed_time,
        "time_per_img_s": embed_time / done if done else 0,
        "same_pairs": len(same_sims),
        "same_min": min(same_sims) if same_sims else None,
        "same_max": max(same_sims) if same_sims else None,
        "same_mean": float(np.mean(same_sims)) if same_sims else None,
        "same_stdev": float(np.std(same_sims)) if same_sims else None,
        "cross_pairs": len(cross_sims),
        "cross_mean": float(np.mean(cross_sims)) if cross_sims else None,
        "separation": (
            float(np.mean(same_sims)) - float(np.mean(cross_sims))
            if same_sims and cross_sims
            else None
        ),
    }

    # Report
    print(f"\n  SAME-PET:")
    print(f"    Pares:  {result['same_pairs']}")
    print(f"    Min:    {result['same_min']:.3f}")
    print(f"    Max:    {result['same_max']:.3f}")
    print(f"    Mean:   {result['same_mean']:.3f}")
    print(f"    Stdev:  {result['same_stdev']:.3f}")
    if result["cross_mean"] is not None:
        print(f"  CROSS-PET:")
        print(f"    Pares:  {result['cross_pairs']}")
        print(f"    Mean:   {result['cross_mean']:.3f}")
        print(f"  SEPARACION (same - cross): {result['separation']:.3f}")

    return result


def print_comparative_table(results):
    print("\n" + "=" * 90)
    print("COMPARATIVA FINAL")
    print("=" * 90)
    print(f"{'Modelo':<20} {'Same Mean':<12} {'Same Stdev':<12} {'Cross Mean':<12} {'Separacion':<12} {'Time/img':<10}")
    print("-" * 90)
    for r in results:
        if r is None:
            continue
        same_mean = f"{r['same_mean']:.3f}" if r.get('same_mean') is not None else "N/A"
        same_std = f"{r['same_stdev']:.3f}" if r.get('same_stdev') is not None else "N/A"
        cross_mean = f"{r['cross_mean']:.3f}" if r.get('cross_mean') is not None else "N/A"
        sep = f"{r['separation']:.3f}" if r.get('separation') is not None else "N/A"
        time_per = f"{r.get('time_per_img_s', 0):.2f}s"
        print(f"{r['model']:<20} {same_mean:<12} {same_std:<12} {cross_mean:<12} {sep:<12} {time_per:<10}")
    print("=" * 90)

    # Recomendacion
    print("\nRECOMENDACION:")
    valid_results = [r for r in results if r is not None and r.get("same_mean") is not None]
    if not valid_results:
        print("  Sin datos suficientes.")
        return

    if any(r.get("separation") is not None for r in valid_results):
        # Con multiples mascotas, rankear por separacion
        best = max(valid_results, key=lambda r: r.get("separation") or -1)
        print(f"  Mejor por SEPARACION: {best['model']} (sep={best['separation']:.3f})")
    else:
        # Con 1 sola mascota, rankear por same_mean alto + stdev bajo
        # Score combinado: mean - stdev (penaliza inconsistencia)
        best = max(valid_results, key=lambda r: r["same_mean"] - r["same_stdev"])
        print(f"  Mejor por consistencia same-pet: {best['model']}")
        print(f"    Mean: {best['same_mean']:.3f}, Stdev: {best['same_stdev']:.3f}")
        print(f"    (Con mas mascotas el ranking usa 'separacion', que es mas robusto)")


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-giant", action="store_true",
                        help="Skip DINOv2-giant (evita download de 4.5GB)")
    args = parser.parse_args()

    print("=" * 70)
    print("COMPARATIVA DE MODELOS EMBEDDING — Nose Print Validation")
    print("=" * 70)
    print()
    print("Modelos a probar:")
    models_to_run = MODELS_TO_TEST[:-1] if args.skip_giant else MODELS_TO_TEST
    for m in models_to_run:
        print(f"  - {m['label']} ({m['size']})")
    print()
    if not args.skip_giant:
        print("NOTA: DINOv2-giant descarga ~4.5GB primera vez (puede tardar 5-15 min).")
        print("      Usar --skip-giant para omitirlo.")
        print()

    pets = collect_photos()

    results = []
    for model_info in models_to_run:
        try:
            result = test_model(model_info, pets)
            results.append(result)
        except Exception as e:
            print(f"[ERROR] Fallo con {model_info['label']}: {e}")
            results.append(None)

    print_comparative_table(results)


if __name__ == "__main__":
    main()
