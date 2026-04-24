#!/usr/bin/env python3
"""
Dedupe Photos — detecta y elimina fotos duplicadas en _pending/nose_print_test_photos/

Usa hash MD5 del contenido del archivo (identicas byte-a-byte) + similarity
visual (MSE sobre thumbnail) para detectar casi-duplicadas (mismo archivo
con metadata distinta).

Uso:
    python scripts/dedupe_photos.py            # solo reporta duplicadas
    python scripts/dedupe_photos.py --delete   # elimina duplicadas
"""
import sys
import hashlib
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
except ImportError as e:
    print(f"[ERROR] {e}")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = REPO_ROOT / "_pending" / "nose_print_test_photos"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def file_md5(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def visual_hash(path: Path, size: int = 32) -> bytes:
    """Hash perceptual simple: redimensionar a 32x32 grayscale."""
    try:
        img = Image.open(path).convert("L").resize((size, size))
        return bytes(img.tobytes())
    except Exception:
        return b""


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--delete", action="store_true", help="Eliminar duplicadas")
    args = parser.parse_args()

    if not PHOTOS_DIR.exists():
        print(f"[ERROR] No existe {PHOTOS_DIR}")
        sys.exit(1)

    all_photos = []
    for pet_dir in PHOTOS_DIR.iterdir():
        if pet_dir.is_dir() and not pet_dir.name.startswith("."):
            for p in pet_dir.iterdir():
                if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS:
                    all_photos.append(p)

    print(f"[INFO] Total fotos: {len(all_photos)}")

    # MD5 dedup (byte-a-byte identicas)
    md5_map = {}
    exact_dupes = []
    for p in all_photos:
        h = file_md5(p)
        if h in md5_map:
            exact_dupes.append((md5_map[h], p))
        else:
            md5_map[h] = p

    print(f"[INFO] Duplicadas exactas (byte-identicas): {len(exact_dupes)}")

    # Visual dedup (mismo contenido visual pero metadata distinta)
    visual_map = {}
    visual_dupes = []
    already_dupes = {p for _, p in exact_dupes}
    for p in all_photos:
        if p in already_dupes:
            continue
        vh = visual_hash(p)
        if not vh:
            continue
        if vh in visual_map:
            visual_dupes.append((visual_map[vh], p))
        else:
            visual_map[vh] = p

    print(f"[INFO] Duplicadas visuales (casi-identicas): {len(visual_dupes)}")

    total_dupes = exact_dupes + visual_dupes
    if not total_dupes:
        print("[OK] No hay duplicadas.")
        return

    print("\n--- Duplicadas detectadas ---")
    for original, dupe in total_dupes:
        print(f"  ORIGINAL: {original.relative_to(REPO_ROOT)}")
        print(f"    DUPE:   {dupe.relative_to(REPO_ROOT)}")
        if args.delete:
            dupe.unlink()
            print(f"    [DELETED]")
    if not args.delete:
        print("\nPara eliminar: python scripts/dedupe_photos.py --delete")
    else:
        print(f"\n[OK] {len(total_dupes)} duplicadas eliminadas.")


if __name__ == "__main__":
    main()
