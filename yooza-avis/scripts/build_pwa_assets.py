#!/usr/bin/env python3
"""Construit les assets PWA à partir des logos Yooza fournis par le client.

Le script préserve le logo officiel et ne génère aucun élément de marque nouveau.
Il isole le mot-symbole jaune pour la sidebar et recadre le Y officiel pour les
icônes d’application aux formats Android et iOS.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ICONS = ASSETS / "icons"
SOURCE_LOGO = ASSETS / "yooza-logo-jaune.png"

YOOZA_BLACK = (30, 30, 28, 255)


def make_near_black_transparent(image: Image.Image) -> Image.Image:
    """Rend transparent le fond noir du fichier source sans toucher au logo jaune."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if r < 25 and g < 25 and b < 25:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def visible_bbox(image: Image.Image):
    """Retourne la boîte englobante des pixels non transparents."""
    alpha = image.getchannel("A")
    return alpha.getbbox()


def save_sidebar_logo(clean_logo: Image.Image) -> None:
    bbox = visible_bbox(clean_logo)
    if not bbox:
        raise RuntimeError("Le logo source ne contient aucun pixel visible.")
    cropped = clean_logo.crop(bbox)
    cropped.save(ASSETS / "yooza-logo-sidebar.png", optimize=True)


def create_icon(clean_logo: Image.Image, size: int, safe_ratio: float, output: Path) -> None:
    """Crée une icône carrée anthracite avec le Y officiel jaune au centre."""
    # Premier caractère Y dans le logo officiel, avec marges de sécurité.
    w, h = clean_logo.size
    y_mark = clean_logo.crop((int(w * 0.06), int(h * 0.07), int(w * 0.235), int(h * 0.82)))
    bbox = visible_bbox(y_mark)
    if not bbox:
        raise RuntimeError("Impossible d'isoler le Y du logo source.")
    y_mark = y_mark.crop(bbox)

    canvas = Image.new("RGBA", (size, size), YOOZA_BLACK)
    available = int(size * safe_ratio)
    scale = min(available / y_mark.width, available / y_mark.height)
    dimensions = (max(1, int(y_mark.width * scale)), max(1, int(y_mark.height * scale)))
    y_mark = y_mark.resize(dimensions, Image.Resampling.LANCZOS)
    position = ((size - y_mark.width) // 2, (size - y_mark.height) // 2)
    canvas.alpha_composite(y_mark, position)
    canvas.save(output, optimize=True)


def main() -> None:
    if not SOURCE_LOGO.exists():
        raise FileNotFoundError(f"Logo source introuvable : {SOURCE_LOGO}")
    ICONS.mkdir(parents=True, exist_ok=True)

    clean_logo = make_near_black_transparent(Image.open(SOURCE_LOGO))
    save_sidebar_logo(clean_logo)

    # App icon standards: normal, iOS, and maskable icon with larger safe zone.
    create_icon(clean_logo, 512, 0.72, ICONS / "icon-512.png")
    create_icon(clean_logo, 192, 0.72, ICONS / "icon-192.png")
    create_icon(clean_logo, 512, 0.52, ICONS / "icon-maskable-512.png")
    create_icon(clean_logo, 180, 0.72, ICONS / "apple-touch-icon.png")
    create_icon(clean_logo, 32, 0.72, ICONS / "favicon-32.png")
    create_icon(clean_logo, 16, 0.72, ICONS / "favicon-16.png")

    print("Assets PWA générés :")
    for asset in sorted(ICONS.glob("*.png")):
        print(f"- {asset.relative_to(ROOT)}")
    print(f"- {(ASSETS / 'yooza-logo-sidebar.png').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
