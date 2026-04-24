#!/usr/bin/env python3
"""
Nose Print Quick Check — Version LIGHT (sin torch)

Version alternativa del script de validacion usando solo:
- Pillow (imagenes)
- numpy
- imagehash (perceptual hashing)

Util cuando torch no se puede instalar (ej: Python 3.14 muy nuevo) o
cuando quieres un check rapido sin setup pesado.

Menos preciso que el script principal (usa image hashing vs deep learning)
pero sirve para validar que el setup funciona + ver similitud entre fotos
del mismo animal.

Uso:
    pip install --user Pillow imagehash numpy
    python scripts/nose_print_quick_light.py

Interpretacion:
- imagehash da distancia de hamming (0 = identicas, >10 = muy distintas)
- Similitud = 1 - (hamming_distance / total_bits)
- Umbral razonable: similitud >0.85 para mismo animal

Limitacion: imagehash es mucho menos preciso que MobileNetV3. Usar el
script principal cuando torch este disponible.
"""

import os
import sys
from pathlib import Path
from itertools import combinations

try:
    from PIL import Image
    import imagehash
    import numpy as np
except ImportError as e:
    print(f"[ERROR] Falta dependencia: {e}")
    print("Instalar con: python -m pip install --user Pillow imagehash numpy")
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Hashes a probar: phash suele ser el mas robusto
HASH_METHODS = {
    "phash": imagehash.phash,      # Perceptual hash, bueno para comparar contenido visual
    "dhash": imagehash.dhash,      # Difference hash, bueno para bordes/gradientes
    "whash": imagehash.whash,      # Wavelet hash, robusto a cambios ligeros
}


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

    if not pets:
        print(f"\n[ERROR] No se encontraron fotos en: {PHOTOS_DIR}")
        sys.exit(1)

    total = sum(len(p) for p in pets.values())
    print(f"\n[INFO] Total: {len(pets)} mascotas, {total} fotos\n")
    return pets


def compute_hashes(pets, method_name):
    method_fn = HASH_METHODS[method_name]
    hashes = {}
    for pet_name, photos in pets.items():
        hashes[pet_name] = []
        for photo_path in photos:
            try:
                img = Image.open(photo_path).convert("RGB")
                # Crop central approx (las narices suelen estar cerca del centro)
                w, h = img.size
                crop_size = min(w, h) // 2
                left = (w - crop_size) // 2
                top = (h - crop_size) // 2
                img_cropped = img.crop((left, top, left + crop_size, top + crop_size))
                h_val = method_fn(img_cropped, hash_size=16)  # 256 bits
                hashes[pet_name].append({"photo": photo_path.name, "hash": h_val})
            except Exception as e:
                print(f"[WARN] Error en {photo_path.name}: {e}")
    return hashes


def analyze(hashes):
    same_sims = []
    cross_sims = []

    pet_names = list(hashes.keys())

    # Same-pet
    for pet in pet_names:
        entries = hashes[pet]
        for i, j in combinations(range(len(entries)), 2):
            dist = entries[i]["hash"] - entries[j]["hash"]
            sim = 1.0 - (dist / 256.0)  # 256 bits total
            same_sims.append({
                "pet": pet,
                "pair": (entries[i]["photo"], entries[j]["photo"]),
                "hamming_distance": dist,
                "similarity": sim
            })

    # Cross-pet
    for pet_a, pet_b in combinations(pet_names, 2):
        for ea in hashes[pet_a]:
            for eb in hashes[pet_b]:
                dist = ea["hash"] - eb["hash"]
                sim = 1.0 - (dist / 256.0)
                cross_sims.append({
                    "pets": (pet_a, pet_b),
                    "photos": (ea["photo"], eb["photo"]),
                    "hamming_distance": dist,
                    "similarity": sim
                })

    return same_sims, cross_sims


def summarize(same, cross, method_name):
    if not same:
        return None

    same_sims_values = [s["similarity"] for s in same]
    print(f"\n{'=' * 70}")
    print(f"MÉTODO: {method_name.upper()}")
    print(f"{'=' * 70}")
    print(f"  Pares same-pet: {len(same)}")
    print(f"  Similitud min={min(same_sims_values):.3f}, max={max(same_sims_values):.3f}, mean={np.mean(same_sims_values):.3f}")

    # Top 3 peores same-pet pairs (sospechosos)
    worst = sorted(same, key=lambda x: x["similarity"])[:3]
    print(f"\n  Pares same-pet con MENOR similitud (sospechosos de mala calidad):")
    for w in worst:
        print(f"    - {w['pet']}: {w['pair'][0]} vs {w['pair'][1]} → sim={w['similarity']:.3f} (hamming={w['hamming_distance']})")

    if cross:
        cross_sims_values = [s["similarity"] for s in cross]
        print(f"\n  Pares cross-pet: {len(cross)}")
        print(f"  Similitud min={min(cross_sims_values):.3f}, max={max(cross_sims_values):.3f}, mean={np.mean(cross_sims_values):.3f}")

        # Top 3 cross-pet pairs con mayor similitud (falsos positivos potenciales)
        worst_cross = sorted(cross, key=lambda x: -x["similarity"])[:3]
        print(f"\n  Pares cross-pet con MAYOR similitud (falsos positivos potenciales):")
        for w in worst_cross:
            print(f"    - {w['pets'][0]}/{w['photos'][0]} vs {w['pets'][1]}/{w['photos'][1]} → sim={w['similarity']:.3f}")

        # Separacion
        sep = np.mean(same_sims_values) - np.mean(cross_sims_values)
        print(f"\n  Separación (mean same - mean cross): {sep:.3f}")
        if sep > 0.15:
            print(f"  ✅ Buena separacion: el modelo distingue bien same vs cross")
        elif sep > 0.05:
            print(f"  ⚠️  Separacion marginal: necesita mejor modelo (torch/MobileNetV3)")
        else:
            print(f"  ❌ Sin separacion clara: image hashing no sirve aqui. Usar deep learning.")

    return {
        "method": method_name,
        "same_mean": float(np.mean(same_sims_values)),
        "same_min": float(min(same_sims_values)),
        "cross_mean": float(np.mean([s["similarity"] for s in cross])) if cross else None,
        "separation": float(np.mean(same_sims_values) - np.mean([s["similarity"] for s in cross])) if cross else None,
    }


def main():
    print("=" * 70)
    print("NOSE PRINT QUICK CHECK — version LIGHT (image hashing)")
    print("  Menos preciso que deep learning pero funciona sin torch")
    print("=" * 70)
    print()

    pets = collect_photos()

    results = {}
    for method in HASH_METHODS.keys():
        print(f"\n[INFO] Computando {method} hashes...")
        hashes = compute_hashes(pets, method)
        same, cross = analyze(hashes)
        results[method] = summarize(same, cross, method)

    print("\n" + "=" * 70)
    print("CONCLUSION")
    print("=" * 70)
    if len(pets) == 1:
        print("  Solo 1 mascota → solo podemos medir 'same-pet similarity'.")
        print("  Si similitud mean >0.80 en algun metodo → las fotos son consistentes.")
        print("  Para validacion completa, necesitamos 2+ mascotas.")
    else:
        print("  Este script usa image hashing (simple). El script principal")
        print("  (nose_print_validation.py) usa deep learning que es mucho mas")
        print("  preciso. Usar este solo como sanity check del setup.")
    print("=" * 70)
    print()


if __name__ == "__main__":
    main()
