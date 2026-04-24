#!/usr/bin/env python3
"""
Nose Print — Crop Preciso con Grounding DINO + DINOv2-large

Paso 1 del plan "llevar separacion a 80%":
En vez de croppear el centro generico de la foto, usamos Grounding DINO
(modelo de deteccion por prompt de texto) para localizar la nariz
exacta en cada imagen, croppear con padding, y pasar ese crop al
DINOv2-large. Hipotesis: elimina ruido de fondo/pelo/ojos → baja stdev
same-pet → sube separacion.

Grounding DINO (IDEA-Research/grounding-dino-tiny): ~170MB download,
detecta objetos descriptos en texto libre. Estado del arte 2023 para
zero-shot detection.

Uso:
    python scripts/nose_print_crop_precise.py

Output: comparativa contra baseline sin crop preciso.
"""

import sys
import time
from pathlib import Path
from itertools import combinations

try:
    import torch
    from transformers import (
        AutoImageProcessor,
        AutoModel,
        AutoProcessor,
        AutoModelForZeroShotObjectDetection,
    )
    from PIL import Image
    import numpy as np
except ImportError as e:
    print(f"[ERROR] Falta dependencia: {e}")
    sys.exit(1)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Cosine similarity sin scipy/sklearn (evita DLL flapack issue en Windows)."""
    a = np.asarray(a)
    b = np.asarray(b)
    if a.ndim == 1:
        a = a.reshape(1, -1)
    if b.ndim == 1:
        b = b.reshape(1, -1)
    a_norm = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-12)
    b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-12)
    return a_norm @ b_norm.T


REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Prompts a probar (Grounding DINO acepta multiples descripciones)
NOSE_PROMPTS = "a dog nose. a cat nose. animal nose."

# Padding alrededor del bbox detectado (proporcional al tamaño del bbox)
CROP_PADDING_RATIO = 0.25

# Threshold confianza minima para considerar deteccion valida
MIN_CONFIDENCE = 0.25


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
                print(f"[OK] {pet_dir.name}: {len(photos)} fotos")
    total = sum(len(p) for p in pets.values())
    print(f"[INFO] Total: {len(pets)} mascotas, {total} fotos\n")
    return pets


def load_detector():
    print("[INFO] Cargando Grounding DINO tiny (detector de nariz)...")
    print("       Primera vez descarga ~170MB")
    processor = AutoProcessor.from_pretrained("IDEA-Research/grounding-dino-tiny")
    model = AutoModelForZeroShotObjectDetection.from_pretrained(
        "IDEA-Research/grounding-dino-tiny"
    )
    model.eval()
    print("[INFO] Grounding DINO cargado.\n")
    return processor, model


def load_embedder():
    print("[INFO] Cargando DINOv2-large (embedder)...")
    processor = AutoImageProcessor.from_pretrained("facebook/dinov2-large")
    model = AutoModel.from_pretrained("facebook/dinov2-large")
    model.eval()
    print("[INFO] DINOv2-large cargado.\n")
    return processor, model


def detect_nose_bbox(detector_processor, detector_model, img: Image.Image):
    """
    Usa Grounding DINO para detectar nariz. Retorna (left, top, right, bottom)
    del mejor bbox o None si no encontró nariz con confianza suficiente.
    """
    inputs = detector_processor(images=img, text=NOSE_PROMPTS, return_tensors="pt")
    with torch.no_grad():
        outputs = detector_model(**inputs)

    results = detector_processor.post_process_grounded_object_detection(
        outputs,
        inputs.input_ids,
        box_threshold=MIN_CONFIDENCE,
        text_threshold=MIN_CONFIDENCE,
        target_sizes=[img.size[::-1]],  # (H, W)
    )[0]

    if len(results["scores"]) == 0:
        return None

    # Elegir el bbox con mayor score
    best_idx = int(torch.argmax(results["scores"]).item())
    box = results["boxes"][best_idx].cpu().numpy()  # [x1, y1, x2, y2]
    return tuple(int(v) for v in box)


def smart_crop_with_detector(detector_processor, detector_model, img: Image.Image):
    """
    Crop alrededor de la nariz detectada con padding.
    Si no detecta nariz, fallback a crop central cuadrado.
    """
    bbox = detect_nose_bbox(detector_processor, detector_model, img)
    if bbox is None:
        # Fallback: crop central cuadrado
        w, h = img.size
        crop_size = min(w, h)
        left = (w - crop_size) // 2
        top = (h - crop_size) // 2
        return img.crop((left, top, left + crop_size, top + crop_size)), False

    x1, y1, x2, y2 = bbox
    bbox_w = x2 - x1
    bbox_h = y2 - y1

    # Agregar padding proporcional
    pad_x = int(bbox_w * CROP_PADDING_RATIO)
    pad_y = int(bbox_h * CROP_PADDING_RATIO)

    crop_left = max(0, x1 - pad_x)
    crop_top = max(0, y1 - pad_y)
    crop_right = min(img.size[0], x2 + pad_x)
    crop_bottom = min(img.size[1], y2 + pad_y)

    # Hacer cuadrado (el lado mayor determina)
    w = crop_right - crop_left
    h = crop_bottom - crop_top
    if w > h:
        diff = w - h
        crop_top = max(0, crop_top - diff // 2)
        crop_bottom = min(img.size[1], crop_bottom + (diff - diff // 2))
    elif h > w:
        diff = h - w
        crop_left = max(0, crop_left - diff // 2)
        crop_right = min(img.size[0], crop_right + (diff - diff // 2))

    return img.crop((crop_left, crop_top, crop_right, crop_bottom)), True


def extract_embedding(embed_processor, embed_model, img: Image.Image):
    inputs = embed_processor(images=img, return_tensors="pt")
    with torch.no_grad():
        outputs = embed_model(**inputs)
        if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
            emb = outputs.pooler_output.squeeze().numpy()
        else:
            emb = outputs.last_hidden_state[:, 0, :].squeeze().numpy()
    # Normalizar
    emb = emb / np.linalg.norm(emb)
    return emb


def main():
    import gc

    print("=" * 70)
    print("NOSE PRINT — CROP PRECISO (Grounding DINO + DINOv2-large)")
    print("=" * 70)
    print()

    pets = collect_photos()
    total = sum(len(p) for p in pets.values())

    # ─── FASE 1: detectar narices + guardar crops en memoria (sin embedder) ───
    det_proc, det_model = load_detector()
    print("[INFO] FASE 1/2: detectando narices...\n")

    crops_cache: dict[str, list[dict]] = {}
    detected_count = 0
    fallback_count = 0
    done = 0
    t_start = time.time()

    for pet_name, photos in pets.items():
        crops_cache[pet_name] = []
        for photo in photos:
            done += 1
            try:
                img = Image.open(photo).convert("RGB")
                crop, detected = smart_crop_with_detector(det_proc, det_model, img)
                if detected:
                    detected_count += 1
                    status = "NOSE"
                else:
                    fallback_count += 1
                    status = "fallback"
                # Guardar crop (como PIL Image) en memoria, no como path
                crops_cache[pet_name].append({"photo": photo.name, "crop": crop})
                print(f"[{done}/{total}] {pet_name}/{photo.name}... {status}")
            except Exception as e:
                print(f"[{done}/{total}] {photo.name}... ERROR: {e}")

    det_time = time.time() - t_start
    print(f"\n[INFO] Deteccion completa en {det_time:.1f}s")
    print(f"[INFO] Narices detectadas: {detected_count}/{total} ({100 * detected_count / total:.0f}%)")

    # Liberar Grounding DINO antes de cargar DINOv2
    print("\n[INFO] Liberando Grounding DINO de memoria...")
    del det_model
    del det_proc
    gc.collect()
    try:
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass

    # ─── FASE 2: cargar DINOv2-large + extraer embeddings de los crops ───
    emb_proc, emb_model = load_embedder()
    print("[INFO] FASE 2/2: extrayendo embeddings...\n")

    embeddings = {}
    done = 0
    t_emb = time.time()
    for pet_name, items in crops_cache.items():
        embeddings[pet_name] = []
        for item in items:
            done += 1
            try:
                emb = extract_embedding(emb_proc, emb_model, item["crop"])
                embeddings[pet_name].append({"photo": item["photo"], "embedding": emb})
                if done % 10 == 0 or done == total:
                    print(f"[{done}/{total}] embeddings OK")
            except Exception as e:
                print(f"[{done}/{total}] ERROR embedding: {e}")

    emb_time = time.time() - t_emb
    elapsed = time.time() - t_start
    print(f"\n[INFO] Embeddings en {emb_time:.1f}s")
    print(f"[INFO] Total pipeline: {elapsed:.1f}s ({elapsed / total:.2f}s/img)")
    print(f"[INFO] Fallback (crop central): {fallback_count}/{total}")

    # Analisis
    print("\n[INFO] Calculando similitudes...")
    same_sims = []
    cross_sims = []
    pet_names = list(embeddings.keys())

    for pet, entries in embeddings.items():
        for i, j in combinations(range(len(entries)), 2):
            emb_i = entries[i]["embedding"].reshape(1, -1)
            emb_j = entries[j]["embedding"].reshape(1, -1)
            sim = float(cosine_similarity(emb_i, emb_j)[0][0])
            same_sims.append({
                "pet": pet,
                "pair": (entries[i]["photo"], entries[j]["photo"]),
                "sim": sim,
            })

    for pa, pb in combinations(pet_names, 2):
        for ea in embeddings[pa]:
            for eb in embeddings[pb]:
                emb_a = ea["embedding"].reshape(1, -1)
                emb_b = eb["embedding"].reshape(1, -1)
                sim = float(cosine_similarity(emb_a, emb_b)[0][0])
                cross_sims.append({"pets": (pa, pb), "sim": sim})

    # Metricas
    same_vals = [s["sim"] for s in same_sims]
    cross_vals = [s["sim"] for s in cross_sims]
    same_mean = np.mean(same_vals)
    same_stdev = np.std(same_vals)
    cross_mean = np.mean(cross_vals)
    separation = same_mean - cross_mean

    print("\n" + "=" * 70)
    print("RESULTADOS — CROP PRECISO + DINOv2-large")
    print("=" * 70)
    print(f"  SAME-PET ({len(same_sims)} pares):")
    print(f"    Min:    {min(same_vals):.3f}")
    print(f"    Max:    {max(same_vals):.3f}")
    print(f"    Mean:   {same_mean:.3f}")
    print(f"    Stdev:  {same_stdev:.3f}")
    print(f"  CROSS-PET ({len(cross_sims)} pares):")
    print(f"    Mean:   {cross_mean:.3f}")
    print(f"  SEPARACION: {separation:.3f}")
    print()

    # Comparativa contra baseline
    print("=" * 70)
    print("COMPARATIVA CONTRA BASELINE (sin crop preciso)")
    print("=" * 70)
    print(f"  Baseline DINOv2-large (crop central):")
    print(f"    same=0.718 stdev=0.140 cross=0.272 separacion=0.445")
    print(f"  Este test (crop preciso via Grounding DINO):")
    print(f"    same={same_mean:.3f} stdev={same_stdev:.3f} cross={cross_mean:.3f} separacion={separation:.3f}")
    print()
    delta = separation - 0.445
    if delta > 0.05:
        print(f"  [BUENO] Mejora significativa: +{delta:.3f} en separacion")
    elif delta > 0.01:
        print(f"  [OK] Mejora marginal: +{delta:.3f}")
    elif delta > -0.01:
        print(f"  [NEUTRO] Sin cambio significativo: {delta:+.3f}")
    else:
        print(f"  [PEOR] Empeora: {delta:+.3f}")

    # Peores same-pet pairs (diagnostico)
    print("\n--- Peores same-pet pairs (candidatos de re-captura) ---")
    worst = sorted(same_sims, key=lambda x: x["sim"])[:5]
    for w in worst:
        print(f"  {w['pet']}: {w['pair'][0]} vs {w['pair'][1]} = {w['sim']:.3f}")

    # Mejores cross-pet (falsos positivos potenciales)
    print("\n--- Mejores cross-pet pairs (falsos positivos) ---")
    worst_cross = sorted(cross_sims, key=lambda x: -x["sim"])[:5]
    for w in worst_cross:
        print(f"  {w['pets'][0]} vs {w['pets'][1]} = {w['sim']:.3f}")


if __name__ == "__main__":
    main()
