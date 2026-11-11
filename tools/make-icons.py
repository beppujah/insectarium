"""Draws the app icons in public/ (a beetle on notebook paper). Needs Pillow: python3 tools/make-icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

PAPER, INK, MOSS, AMBER = "#efe6cf", "#1d1a14", "#3f6b2a", "#d99a2b"
S = 2048  # drawn large, then scaled down for smooth edges
OUT = Path(__file__).resolve().parent.parent / "public"


def draw():
    image = Image.new("RGB", (S, S), PAPER)
    d = ImageDraw.Draw(image)
    u = S / 100  # the beetle stays inside the middle 60%, safe for round and rounded masks
    cx = 50 * u

    def line(points, width=2.6):
        d.line([(x * u, y * u) for x, y in points], fill=INK, width=round(width * u), joint="curve")
        for x, y in (points[0], points[-1]):
            r = width * u / 2
            d.ellipse((x * u - r, y * u - r, x * u + r, y * u + r), fill=INK)

    # legs and antennae, mirrored left and right
    for side in (-1, 1):
        def m(points):
            return [(50 + side * (x - 50), y) for x, y in points]
        line(m([(60, 44), (70, 38), (75, 30)]))
        line(m([(63, 55), (75, 55), (80, 61)]))
        line(m([(60, 66), (70, 72), (73, 81)]))
        line(m([(53, 27), (57, 20), (64, 18)]), 2)

    d.ellipse((cx - 8 * u, 24 * u, cx + 8 * u, 38 * u), fill=INK)                 # head
    d.rounded_rectangle((cx - 12 * u, 33 * u, cx + 12 * u, 46 * u), 5 * u, fill=INK)  # thorax
    d.ellipse((cx - 15 * u, 40 * u, cx + 15 * u, 80 * u), fill=MOSS)              # wing cases
    d.ellipse((cx - 15 * u, 40 * u, cx + 15 * u, 80 * u), outline=INK, width=round(2.4 * u))
    d.line((cx, 43 * u, cx, 79 * u), fill=INK, width=round(1.8 * u))
    for x, y in ((43, 55), (57, 55), (44, 67), (56, 67)):
        d.ellipse((x * u - 2.2 * u, y * u - 2.2 * u, x * u + 2.2 * u, y * u + 2.2 * u), fill=AMBER)
    return image


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    icon = draw()
    for name, size in (("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180), ("favicon.png", 64)):
        icon.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
        print("wrote", name)
