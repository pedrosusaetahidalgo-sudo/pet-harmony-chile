"""
Descarga imágenes de Dog.ceo + The Cat API para suplementar el pre-training.

NO sirven para fine-tuning de re-identificación (no hay labels por individuo)
pero sí ayudan al encoder a generalizar mejor "esto es nariz de perro/gato".

Output:
    _pending/datasets/pretraining-extras/
        dogs/<breed>/img_NNNN.jpg   (Dog.ceo, agrupado por raza)
        cats/img_NNNN.jpg           (Cat API, sin label de raza)

Uso:
    python scripts/download_pretraining_extras.py --dogs-per-breed 30 --cats-total 2000

Requiere: requests, tqdm
    pip install requests tqdm
"""

import argparse
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

try:
    import requests
    from tqdm import tqdm
except ImportError:
    print("ERROR: faltan dependencias. Instalá con:")
    print("  pip install requests tqdm")
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = REPO_ROOT / "_pending" / "datasets" / "pretraining-extras"

DOG_CEO_BASE = "https://dog.ceo/api"
CAT_API_BASE = "https://api.thecatapi.com/v1"

DEFAULT_HEADERS = {
    "User-Agent": "PawFriend-Dataset-Builder/1.0 (educational, non-commercial)"
}


def fetch_json(url: str, headers: dict | None = None, retries: int = 3) -> dict:
    last_err = None
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=headers or DEFAULT_HEADERS, timeout=15)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            last_err = e
            time.sleep(2 ** attempt)
    raise RuntimeError(f"GET {url} fallido tras {retries} intentos: {last_err}")


def download_image(url: str, dest: Path, headers: dict | None = None) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return False
    try:
        r = requests.get(url, headers=headers or DEFAULT_HEADERS, timeout=20, stream=True)
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return True
    except Exception as e:
        print(f"  skip {url}: {e}")
        if dest.exists():
            try:
                dest.unlink()
            except OSError:
                pass
        return False


def download_dogceo(per_breed: int) -> int:
    print(f"\n=== Dog.ceo ({per_breed} fotos por raza) ===")
    data = fetch_json(f"{DOG_CEO_BASE}/breeds/list/all")
    if data.get("status") != "success":
        raise RuntimeError(f"Dog.ceo respondió status={data.get('status')}")

    breeds = data["message"]
    flat_breeds: list[str] = []
    for breed, subs in breeds.items():
        if subs:
            for sub in subs:
                flat_breeds.append(f"{breed}/{sub}")
        else:
            flat_breeds.append(breed)

    print(f"Razas detectadas: {len(flat_breeds)}")
    total_downloaded = 0

    for breed_path in tqdm(flat_breeds, desc="razas"):
        try:
            list_data = fetch_json(f"{DOG_CEO_BASE}/breed/{breed_path}/images")
            if list_data.get("status") != "success":
                continue
            urls = list_data["message"][:per_breed]

            safe_breed = breed_path.replace("/", "-")
            breed_dir = OUT_ROOT / "dogs" / safe_breed

            for i, img_url in enumerate(urls):
                ext = Path(urlparse(img_url).path).suffix.lower() or ".jpg"
                if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
                    ext = ".jpg"
                dest = breed_dir / f"img_{i:04d}{ext}"
                if download_image(img_url, dest):
                    total_downloaded += 1
        except Exception as e:
            print(f"  raza {breed_path} falló: {e}")
            continue

    print(f"Dog.ceo: {total_downloaded} imágenes nuevas descargadas")
    return total_downloaded


def download_catapi(total: int, api_key: str | None) -> int:
    print(f"\n=== Cat API (objetivo {total} fotos) ===")
    headers = dict(DEFAULT_HEADERS)
    if api_key:
        headers["x-api-key"] = api_key

    cats_dir = OUT_ROOT / "cats"
    cats_dir.mkdir(parents=True, exist_ok=True)

    existing = sum(1 for _ in cats_dir.glob("img_*.*"))
    if existing >= total:
        print(f"Cat API: ya hay {existing} fotos (>= {total}), skip")
        return 0

    page_size = 100
    pages_needed = (total - existing + page_size - 1) // page_size
    counter = existing
    downloaded = 0

    for page in tqdm(range(pages_needed), desc="páginas"):
        try:
            url = f"{CAT_API_BASE}/images/search?limit={page_size}&page={page}&order=RAND"
            items = fetch_json(url, headers=headers)
            if not isinstance(items, list):
                continue
            for item in items:
                if counter >= total:
                    break
                img_url = item.get("url")
                if not img_url:
                    continue
                ext = Path(urlparse(img_url).path).suffix.lower() or ".jpg"
                if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
                    ext = ".jpg"
                dest = cats_dir / f"img_{counter:05d}{ext}"
                if download_image(img_url, dest, headers=headers):
                    downloaded += 1
                counter += 1
            time.sleep(0.3)
        except Exception as e:
            print(f"  page {page} falló: {e}")
            continue

    print(f"Cat API: {downloaded} imágenes nuevas descargadas (total carpeta: {counter})")
    return downloaded


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dogs-per-breed", type=int, default=30,
                        help="Fotos por raza de Dog.ceo (default: 30, ~120 razas = ~3.600 fotos)")
    parser.add_argument("--cats-total", type=int, default=2000,
                        help="Total de fotos de Cat API (default: 2000)")
    parser.add_argument("--cat-api-key", type=str,
                        default=os.environ.get("CAT_API_KEY"),
                        help="API key de The Cat API (o env CAT_API_KEY)")
    parser.add_argument("--skip-dogs", action="store_true", help="No descargar Dog.ceo")
    parser.add_argument("--skip-cats", action="store_true", help="No descargar Cat API")
    args = parser.parse_args()

    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    print(f"Output: {OUT_ROOT}")

    total = 0
    if not args.skip_dogs:
        total += download_dogceo(args.dogs_per_breed)
    if not args.skip_cats:
        total += download_catapi(args.cats_total, args.cat_api_key)

    print(f"\n✓ Listo. Total nuevas imágenes: {total}")
    print(f"  Carpeta: {OUT_ROOT}")
    print("\nNota: estas imágenes son para PRE-TRAINING general (encoder más diverso).")
    print("Para re-ID (>0.80 separación) seguís necesitando datos etiquetados por individuo:")
    print("  - Refugios chilenos (mismo perro fotografiado en distintos días)")
    print("  - /nose-print-test crowdsourcing (5 fotos x mascota)")
    print("  - DogFaceNet zip real (no el git que sólo trae código)")


if __name__ == "__main__":
    main()
