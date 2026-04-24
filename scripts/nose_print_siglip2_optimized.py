#!/usr/bin/env python3
"""
Nose Print SigLIP2 + Optimizations — Pipeline optimizado para biometria nasal

Usa SigLIP2-base (mejor modelo open source probado 2026-04-24) + 3 optimizaciones:
  1. Crop preciso: detecta el area central mas enfocada en vez de crop cuadrado generico
  2. Embedding ensemble con augmentation: original + flip horizontal, promediado
  3. Ensemble multi-modelo: combina SigLIP2 + DINOv2-large (opcional con --ensemble)

Target: llevar same-pet mean de 0.923 (SigLIP2 base) a >0.95 sin fine-tuning.

Uso:
    python scripts/nose_print_siglip2_optimized.py
    python scripts/nose_print_siglip2_optimized.py --ensemble  # SigLIP2 + DINOv2-large

Proximo nivel (si todavia falta): fine-tuning con Pet Biometric Challenge 2022 dataset.
"""

import sys
import time
from pathlib import Path
from itertools import combinations

try:
    import torch
    from transformers import AutoImageProcessor, AutoModel
    from PIL import Image, ImageOps
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    print(f"[ERROR] Falta dependencia: {e}")
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def collect_photos():
    pets = {}
    for pet_dir in PHOTOS_DIR.iterdir():
        if pet_dir.is_dir() and not pet_dir.name.startswith("."):
            photos = [
                p for p in pet_dir.iterdir()
                if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS
            ]
            if len(photos) >= 2:
                pets[pet_dir.name] = photos
    return pets


def smart_crop(img):
    """
    Optimizacion 1: crop mas inteligente que el centro cuadrado.

    Estrategia: tomar un crop central mas pequeno (60% del lado menor) para
    enfocarse en la zona central de la foto, que es donde la gente suele
    enmarcar la nariz cuando la fotografia. Reduce el area de background.
    """
    w, h = img.size
    crop_size = int(min(w, h) * 0.60)
    left = (w - crop_size) // 2
    top = (h - crop_size) // 2
    return img.crop((left, top, left + crop_size, top + crop_size))


def augmented_crops(img):
    """
    Optimizacion 2: generar multiples vistas de la misma imagen
    para reducir varianza por angulo/flip.

    Retorna: [original_crop, h_flip, slight_zoom_in]
    """
    base = smart_crop(img)
    h_flip = ImageOps.mirror(base)
    # Zoom-in ligero (crop del 85% central de la imagen ya croppeada)
    w, h = base.size
    z_size = int(min(w, h) * 0.85)
    zl, zt = (w - z_size) // 2, (h - z_size) // 2
    zoom_in = base.crop((zl, zt, zl + z_size, zt + z_size))
    return [base, h_flip, zoom_in]


def extract_embedding_augmented(processor, model, image_path, model_id):
    """Optimizacion 2 aplicada: promediar embeddings de 3 vistas."""
    try:
        img = Image.open(image_path).convert("RGB")
        crops = augmented_crops(img)
        embeddings = []
        for crop in crops:
            inputs = processor(images=crop, return_tensors="pt")
            with torch.no_grad():
                if "siglip" in model_id.lower():
                    outputs = model.vision_model(**inputs)
                    emb = outputs.pooler_output.squeeze().numpy()
                else:
                    outputs = model(**inputs)
                    if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                        emb = outputs.pooler_output.squeeze().numpy()
                    else:
                        emb = outputs.last_hidden_state[:, 0, :].squeeze().numpy()
            # Normalizar antes de promediar
            emb = emb / np.linalg.norm(emb)
            embeddings.append(emb)
        # Promedio + renormalizar
        avg = np.mean(embeddings, axis=0)
        avg = avg / np.linalg.norm(avg)
        return avg
    except Exception as e:
        print(f"[WARN] Error en {image_path.name}: {e}")
        return None


def compute_embeddings(processor, model, pets, model_id):
    embeddings = {}
    total = sum(len(p) for p in pets.values())
    done = 0
    for pet_name, photos in pets.items():
        embeddings[pet_name] = []
        for photo in photos:
            done += 1
            emb = extract_embedding_augmented(processor, model, photo, model_id)
            if emb is not None:
                embeddings[pet_name].append({"photo": photo.name, "embedding": emb})
    return embeddings


def ensemble_embeddings(embeddings_a, embeddings_b):
    """Optimizacion 3: promedio de 2 modelos, ambos normalizados."""
    merged = {}
    for pet in embeddings_a.keys():
        merged[pet] = []
        photos_a = {e["photo"]: e["embedding"] for e in embeddings_a[pet]}
        photos_b = {e["photo"]: e["embedding"] for e in embeddings_b.get(pet, [])}
        for photo_name, emb_a in photos_a.items():
            if photo_name not in photos_b:
                continue
            emb_b = photos_b[photo_name]
            # Concatenar vs promediar: concatenar es mejor cuando dimensiones distintas
            # Normalizar cada uno y concatenar
            combined = np.concatenate([emb_a, emb_b])
            combined = combined / np.linalg.norm(combined)
            merged[pet].append({"photo": photo_name, "embedding": combined})
    return merged


def analyze(embeddings, label):
    same_sims = []
    cross_sims = []
    pet_names = list(embeddings.keys())

    for pet, photos in embeddings.items():
        for i, j in combinations(range(len(photos)), 2):
            emb_i = photos[i]["embedding"].reshape(1, -1)
            emb_j = photos[j]["embedding"].reshape(1, -1)
            sim = float(cosine_similarity(emb_i, emb_j)[0][0])
            same_sims.append(sim)

    for pa, pb in combinations(pet_names, 2):
        for ea in embeddings[pa]:
            for eb in embeddings[pb]:
                emb_a = ea["embedding"].reshape(1, -1)
                emb_b = eb["embedding"].reshape(1, -1)
                sim = float(cosine_similarity(emb_a, emb_b)[0][0])
                cross_sims.append(sim)

    print(f"\n{'=' * 70}")
    print(f"RESULTADO: {label}")
    print("=" * 70)
    if same_sims:
        print(f"  SAME-PET ({len(same_sims)} pares):")
        print(f"    Min={min(same_sims):.3f} Max={max(same_sims):.3f}")
        print(f"    Mean={np.mean(same_sims):.3f} Stdev={np.std(same_sims):.3f}")
    if cross_sims:
        print(f"  CROSS-PET ({len(cross_sims)} pares):")
        print(f"    Mean={np.mean(cross_sims):.3f}")
        sep = np.mean(same_sims) - np.mean(cross_sims)
        print(f"  SEPARACION: {sep:.3f}")
        return {"mean_same": np.mean(same_sims), "stdev_same": np.std(same_sims),
                "mean_cross": np.mean(cross_sims), "separation": sep}
    return {"mean_same": np.mean(same_sims) if same_sims else None,
            "stdev_same": np.std(same_sims) if same_sims else None}


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--ensemble", action="store_true",
                        help="Probar ensemble SigLIP2 + DINOv2-large (mas lento, mejor resultado)")
    args = parser.parse_args()

    print("=" * 70)
    print("NOSE PRINT SigLIP2 + OPTIMIZACIONES")
    print("  Opt 1: crop 60% central (vs 100%)")
    print("  Opt 2: ensemble original + h-flip + zoom-in")
    if args.ensemble:
        print("  Opt 3: ensemble SigLIP2 + DINOv2-large")
    print("=" * 70)

    pets = collect_photos()
    if not pets:
        print("[ERROR] No hay fotos")
        sys.exit(1)

    for pet_name, photos in pets.items():
        print(f"[OK] {pet_name}: {len(photos)} fotos")
    print()

    # SigLIP2 con optimizaciones
    print("\n[INFO] Cargando SigLIP2-base...")
    proc1 = AutoImageProcessor.from_pretrained("google/siglip2-base-patch16-224")
    model1 = AutoModel.from_pretrained("google/siglip2-base-patch16-224")
    model1.eval()

    print("[INFO] Extrayendo embeddings con augmentation (x3)...")
    t0 = time.time()
    emb_siglip2 = compute_embeddings(proc1, model1, pets, "google/siglip2-base-patch16-224")
    print(f"[INFO] Completado en {time.time()-t0:.1f}s")

    r1 = analyze(emb_siglip2, "SigLIP2 + crop inteligente + augmentation (opt 1+2)")

    # Ensemble con DINOv2-large
    if args.ensemble:
        print("\n[INFO] Cargando DINOv2-large...")
        proc2 = AutoImageProcessor.from_pretrained("facebook/dinov2-large")
        model2 = AutoModel.from_pretrained("facebook/dinov2-large")
        model2.eval()

        print("[INFO] Extrayendo embeddings con augmentation...")
        t0 = time.time()
        emb_dinov2 = compute_embeddings(proc2, model2, pets, "facebook/dinov2-large")
        print(f"[INFO] Completado en {time.time()-t0:.1f}s")

        merged = ensemble_embeddings(emb_siglip2, emb_dinov2)
        r2 = analyze(merged, "ENSEMBLE SigLIP2 + DINOv2-large + opt 1+2")

    print()
    print("=" * 70)
    print("BASELINE (SigLIP2 sin opt): same_mean=0.923 stdev=0.020")
    print("=" * 70)


if __name__ == "__main__":
    main()
