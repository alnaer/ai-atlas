"""Turn a painting into the two crops an island uses (hero 16:9 and square card), each with a depth map.

  python3 -I tools/make-island-art.py <picture> <id> --models <dir> [--fx 0.5] [--fy 0.45] [--cx 0.5] [--cy 0.45] [--out public/island-art]

  --fx/--fy   the hero crop's point of interest, as a fraction of the picture's width/height
  --cx/--cy   the same for the square card crop
  --models    a folder holding depth_anything_v2_vits.onnx (Apache-2.0,
              github.com/fabio-sim/Depth-Anything-ONNX/releases v2.0.0)

Writes <out>/images/<id>-hero.webp (1600x900), <id>-card.webp (800x800) and their depth maps in <out>/depth/.
Needs: pip install onnxruntime pillow numpy
"""
import argparse, os
import numpy as np
from PIL import Image, ImageFilter
import onnxruntime as ort

ap = argparse.ArgumentParser()
ap.add_argument("picture"); ap.add_argument("id")
ap.add_argument("--models", required=True)
ap.add_argument("--fx", type=float, default=0.5); ap.add_argument("--fy", type=float, default=0.45)
ap.add_argument("--cz", type=float, default=1.0, help="zoom into the card crop");
ap.add_argument("--cx", type=float, default=0.5); ap.add_argument("--cy", type=float, default=0.45)
ap.add_argument("--out", default="public/island-art")
a = ap.parse_args()

src = Image.open(a.picture).convert("RGB")
net = ort.InferenceSession(os.path.join(a.models, "depth_anything_v2_vits.onnx"), providers=["CPUExecutionProvider"])

def crop(img, w, h, fx, fy, z=1.0):
    W, H = img.size
    s = max(w / W, h / H) * z
    rw, rh = round(W * s), round(H * s)
    big = img.resize((rw, rh), Image.LANCZOS)
    x = min(max(0, round(fx * rw - w / 2)), rw - w); y = min(max(0, round(fy * rh - h / 2)), rh - h)
    return big.crop((x, y, x + w, y + h))

def depth(img):
    side = 518
    board = img.resize((side, side), Image.BICUBIC)
    x = (np.asarray(board, np.float32) / 255 - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    d = np.squeeze(net.run(None, {net.get_inputs()[0].name: x.astype(np.float32).transpose(2, 0, 1)[None]})[0])
    lo, hi = np.percentile(d, 1), np.percentile(d, 99.5)
    d = np.clip((d - lo) / (hi - lo + 1e-6), 0, 1)
    w, h = img.size
    return Image.fromarray((d * 255).astype(np.uint8)).resize((w // 2, h // 2), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))

os.makedirs(os.path.join(a.out, "images"), exist_ok=True); os.makedirs(os.path.join(a.out, "depth"), exist_ok=True)
for name, (w, h, fx, fy) in {"hero": (1600, 900, a.fx, a.fy), "card": (800, 800, a.cx, a.cy)}.items():
    im = crop(src, w, h, fx, fy, a.cz if name == "card" else 1.0)
    im.save(os.path.join(a.out, "images", f"{a.id}-{name}.webp"), quality=82, method=6)
    depth(im).save(os.path.join(a.out, "depth", f"{a.id}-{name}-depth.webp"), quality=80, method=6)
    print(name, w, h)
