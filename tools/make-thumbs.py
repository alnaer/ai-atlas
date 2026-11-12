#!/usr/bin/env python3
"""Make small copies of the art for thumbnails and cards.

    python3 tools/make-thumbs.py

Reads the manifests in public/island-art and writes WebP copies to public/thumbs/:
  pages/path-<key>-hero.webp  path engravings for the path cards, 720 px wide
  pages/path-<key>-cut.webp   path cut-outs for the path cards, 640 px tall
  islands/<ID>.webp           island paintings for route medallions, 112 px square
  map/<ID>.webp               island paintings for the atlas map medallions, 256 px square (sharp on Retina)

    python3 tools/make-thumbs.py --map    only the atlas map medallions
Only sizes down art that ships in the design folder; nothing else is touched.
"""
import json, os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ART = os.path.join(ROOT, "public", "island-art")
OUT = os.path.join(ROOT, "public", "thumbs")

def save(src, dst, max_w=None, max_h=None, quality=78):
    im = Image.open(src)
    w, h = im.size
    s = min((max_w or w) / w, (max_h or h) / h, 1)
    if s < 1:
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, "WEBP", quality=quality, method=6)
    return os.path.getsize(src), os.path.getsize(dst)

def main():
    if "--map" in sys.argv:
        return make_map()
    pages = json.load(open(os.path.join(ART, "pages", "pages.json")))["pages"]
    before = after = n = 0
    for p in pages:
        if not p["id"].startswith("path-"):
            continue
        for variant, rel in p["files"].items():
            if variant not in ("hero", "cut"):
                continue
            src = os.path.join(ART, "pages", rel)
            dst = os.path.join(OUT, "pages", f"{p['id']}-{variant}.webp")
            a, b = save(src, dst, max_h=640) if variant == "cut" else save(src, dst, max_w=720)
            before += a; after += b; n += 1
    islands = json.load(open(os.path.join(ART, "islands.json")))["islands"]
    for i in islands:
        a, b = save(os.path.join(ART, i["files"]["card"]), os.path.join(OUT, "islands", f"{i['id']}.webp"), max_w=112, quality=74)
        before += a; after += b; n += 1
    print(f"{n} thumbnails written to public/thumbs ({before // 1024} KB -> {after // 1024} KB)")

def make_map():
    # The map shows each painting at most ~120 px wide; a 256 px copy is sharp on Retina and far cheaper
    # to download and decode than the 800 px card (decoding 31 of those made the map stutter on Safari).
    islands = json.load(open(os.path.join(ART, "islands.json")))["islands"]
    before = after = 0
    for i in islands:
        a, b = save(os.path.join(ART, i["files"]["card"]), os.path.join(OUT, "map", f"{i['id']}.webp"), max_w=256, quality=80)
        before += a; after += b
    print(f"{len(islands)} map medallions written to public/thumbs/map ({before // 1024} KB -> {after // 1024} KB)")

if __name__ == "__main__":
    sys.exit(main())
