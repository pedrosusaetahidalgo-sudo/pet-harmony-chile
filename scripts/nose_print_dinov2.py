#!/usr/bin/env python3
"""
Nose Print Validation — DINOv2 (Meta)

Version especializada con modelo self-supervised DINOv2 de Meta AI.
DINOv2 aprende representaciones visuales sin etiquetas (self-supervised
learning) y produce embeddings mucho mas ricos que MobileNetV3 para
tareas de similarity/matching.

Ventajas vs MobileNetV3:
- Modelo mas grande y potente (ViT-S/14 base: 86M params)
- Self-supervised → mejor para matching de patrones sin labels
- Estado del arte 2024 en image retrieval/similarity
- Free, local, sin API key

Uso:
    pip install --user torch torchvision transformers Pillow numpy scikit-learn
    python scripts/nose_print_dinov2.py [--quick]

Fuentes:
- Paper DINOv2: https://arxiv.org/abs/2304.07193
- Model card: https://huggingface.co/facebook/dinov2-base
"""

import sys
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
    print("Instalar: python -m pip install --user torch torchvision transformers Pillow numpy scikit-learn")
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


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
        print("[ERROR] No hay fotos")
        sys.exit(1)
    print(f"[INFO] Total: {len(pets)} mascotas, {sum(len(p) for p in pets.values())} fotos\n")
    return pets


MODEL_OPTIONS = {
    "base": ("facebook/dinov2-base", "86M params, 768 dims, rapido"),
    "large": ("facebook/dinov2-large", "300M params, 1024 dims, +3-5% accuracy"),
    "giant": ("facebook/dinov2-giant", "1.1B params, 1536 dims, maxima precision, 4x mas lento"),
}


def load_dinov2(size="base"):
    model_id, desc = MODEL_OPTIONS[size]
    print(f"[INFO] Cargando DINOv2-{size} ({model_id})")
    print(f"       {desc}")
    print(f"       Primera vez descarga. Tardara proporcional al tamano.")
    processor = AutoImageProcessor.from_pretrained(model_id)
    model = AutoModel.from_pretrained(model_id)
    model.eval()
    print(f"[INFO] Modelo DINOv2-{size} cargado.")
    return processor, model


def extract_embedding(processor, model, image_path):
    try:
        img = Image.open(image_path).convert("RGB")
        # Crop central cuadrado (aprox area de nariz)
        w, h = img.size
        crop_size = min(w, h)
        left = (w - crop_size) // 2
        top = (h - crop_size) // 2
        img_cropped = img.crop((left, top, left + crop_size, top + crop_size))

        inputs = processor(images=img_cropped, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            # Usar el [CLS] token como embedding (pooler_output)
            embedding = outputs.last_hidden_state[:, 0, :].squeeze().numpy()
        return embedding
    except Exception as e:
        print(f"[WARN] Error procesando {image_path.name}: {e}")
        return None


def compute_embeddings(processor, model, pets):
    embeddings = {}
    total = sum(len(p) for p in pets.values())
    done = 0
    for pet_name, photos in pets.items():
        embeddings[pet_name] = []
        for photo in photos:
            done += 1
            print(f"[{done}/{total}] {pet_name}/{photo.name}...", end=" ", flush=True)
            emb = extract_embedding(processor, model, photo)
            if emb is not None:
                embeddings[pet_name].append({"photo": photo.name, "embedding": emb})
                print("OK")
            else:
                print("SKIP")
    return embeddings


def analyze_similarities(embeddings):
    same_sims = []
    cross_sims = []
    pet_names = list(embeddings.keys())

    # Same-pet
    for pet in pet_names:
        photos = embeddings[pet]
        for i, j in combinations(range(len(photos)), 2):
            emb_i = photos[i]["embedding"].reshape(1, -1)
            emb_j = photos[j]["embedding"].reshape(1, -1)
            sim = float(cosine_similarity(emb_i, emb_j)[0][0])
            same_sims.append({
                "pet": pet,
                "pair": (photos[i]["photo"], photos[j]["photo"]),
                "similarity": sim
            })

    # Cross-pet
    for pet_a, pet_b in combinations(pet_names, 2):
        for ph_a in embeddings[pet_a]:
            for ph_b in embeddings[pet_b]:
                emb_a = ph_a["embedding"].reshape(1, -1)
                emb_b = ph_b["embedding"].reshape(1, -1)
                sim = float(cosine_similarity(emb_a, emb_b)[0][0])
                cross_sims.append({
                    "pets": (pet_a, pet_b),
                    "photos": (ph_a["photo"], ph_b["photo"]),
                    "similarity": sim
                })

    return same_sims, cross_sims


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--size", choices=list(MODEL_OPTIONS.keys()), default="base",
                        help="DINOv2 size: base (rapido) | large (mejor) | giant (top)")
    args = parser.parse_args()

    print("=" * 70)
    print(f"NOSE PRINT VALIDATION — DINOv2-{args.size} (Meta, self-supervised)")
    print("=" * 70)
    print()

    pets = collect_photos()
    processor, model = load_dinov2(size=args.size)
    embeddings = compute_embeddings(processor, model, pets)

    print("\n[INFO] Analizando similitudes...")
    same_sims, cross_sims = analyze_similarities(embeddings)

    if same_sims:
        same_vals = [s["similarity"] for s in same_sims]
        print(f"\n{'='*70}")
        print("SAME-PET (¿reconoce al mismo animal en distintas fotos?)")
        print("=" * 70)
        print(f"  Pares: {len(same_sims)}")
        print(f"  Min:   {min(same_vals):.3f}")
        print(f"  Max:   {max(same_vals):.3f}")
        print(f"  Mean:  {np.mean(same_vals):.3f}")
        print(f"  Stdev: {np.std(same_vals):.3f}")

        # Peores same-pet pairs
        worst = sorted(same_sims, key=lambda x: x["similarity"])[:3]
        print(f"\n  Peores pares same-pet (posible mala calidad de foto):")
        for w in worst:
            print(f"    - {w['pet']}: {w['pair'][0]} vs {w['pair'][1]} = {w['similarity']:.3f}")

    if cross_sims:
        cross_vals = [s["similarity"] for s in cross_sims]
        print(f"\n{'='*70}")
        print("CROSS-PET (¿evita confundir animales distintos?)")
        print("=" * 70)
        print(f"  Pares: {len(cross_sims)}")
        print(f"  Min:   {min(cross_vals):.3f}")
        print(f"  Max:   {max(cross_vals):.3f}")
        print(f"  Mean:  {np.mean(cross_vals):.3f}")
        print(f"  Stdev: {np.std(cross_vals):.3f}")

        # Peores cross-pet pairs (falsos positivos potenciales)
        worst_cross = sorted(cross_sims, key=lambda x: -x["similarity"])[:3]
        print(f"\n  Cross-pet con mayor similitud (falsos positivos potenciales):")
        for w in worst_cross:
            print(f"    - {w['pets'][0]}/{w['photos'][0]} vs {w['pets'][1]}/{w['photos'][1]} = {w['similarity']:.3f}")

        # Separacion
        sep = np.mean([s["similarity"] for s in same_sims]) - np.mean(cross_vals)
        print(f"\n{'='*70}")
        print("SEPARACION (mean same - mean cross)")
        print("=" * 70)
        print(f"  Valor: {sep:.3f}")
        print()
        if sep > 0.25:
            print("  [EXCELENTE] Separacion muy clara. DINOv2 funciona sin fine-tuning.")
            print("  Recomendacion: proceder Fase 1 con DINOv2 + pgvector.")
        elif sep > 0.15:
            print("  [BUENO] Separacion decente. DINOv2 viable, con fine-tuning seria aun mejor.")
            print("  Recomendacion: proceder Fase 1 con DINOv2 + considerar fine-tuning.")
        elif sep > 0.05:
            print("  [MARGINAL] Separacion existe pero debil. Fine-tuning necesario.")
            print("  Recomendacion: usar DINOv2 con fine-tuning o Petnow API.")
        else:
            print("  [BAJO] Sin separacion clara. Probar Petnow API (modelo especializado).")
            print("  Recomendacion: suscribir Petnow API antes de Fase 1.")
    else:
        print("\n[WARN] Solo 1 mascota: no se puede medir cross-pet. Subir fotos de otra mascota.")

    print()


if __name__ == "__main__":
    main()
