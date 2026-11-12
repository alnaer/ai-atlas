"""Turn a generated full-figure picture into a cut-out with a depth map for the opening scene.

  python3 -I tools/make-figure.py <picture> <id> --reach right|left --models <dir> [--out public/island-art/pages]

  <picture>   the generated image (one figure on a plain background)
  <id>        the manifest id, e.g. hero-figure-human or hero-figure-machine
  --reach     which way the figure's outstretched hand points (the human reaches right, the machine left)
  --models    a folder holding the two ONNX models (both Apache-2.0):
                isnet-general-use.onnx       github.com/danielgatis/rembg/releases (v0.0.0)
                depth_anything_v2_vits.onnx  github.com/fabio-sim/Depth-Anything-ONNX/releases (v2.0.0)

It writes  <out>/images/<id>-cut.webp  and  <out>/depth/<id>-cut-depth.webp  and prints the numbers the
manifest entry needs: the size, and the fingertip anchor (x%, y% of the cut-out) found as the outermost
point of the figure on its reaching side. Check the anchor by eye; pass --anchor x,y to set it yourself.

Needs: pip install onnxruntime pillow numpy
"""
import argparse, json, os
import numpy as np
from PIL import Image, ImageFilter
import onnxruntime as ort

ap = argparse.ArgumentParser()
ap.add_argument("picture"); ap.add_argument("id")
ap.add_argument("--reach", choices=["right", "left"], required=True)
ap.add_argument("--models", required=True)
ap.add_argument("--out", default="public/island-art/pages")
ap.add_argument("--long", type=int, default=1800, help="longest side of the cut-out in px")
ap.add_argument("--anchor", help="fingertip as x,y in percent of the cut-out, to override the automatic one")
a = ap.parse_args()

def session(name):
    return ort.InferenceSession(os.path.join(a.models, name), providers=["CPUExecutionProvider"])

src = Image.open(a.picture).convert("RGB")
W, H = src.size

# 1. Cut-out: IS-Net gives a soft mask of the main subject.
net = session("isnet-general-use.onnx")
x = np.asarray(src.resize((1024, 1024), Image.LANCZOS), np.float32)
x = (x / max(1.0, x.max()) - 0.5) / 1.0
pred = net.run(None, {net.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-6)
mask = Image.fromarray((pred * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
# keep the largest connected blob's neighbourhood honest: drop faint haze, keep soft edges
m = np.asarray(mask, np.float32) / 255
m = np.clip((m - 0.08) / 0.84, 0, 1)
alpha = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))

# 2. Trim to the figure with a little air, then size it.
box = Image.fromarray((np.asarray(alpha) > 20).astype(np.uint8) * 255).getbbox()
if not box:
    raise SystemExit("No figure found in the picture.")
pad = round(max(box[2] - box[0], box[3] - box[1]) * 0.012)
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(W, box[2] + pad), min(H, box[3] + pad))
rgb, alpha = src.crop(box), alpha.crop(box)
w, h = rgb.size
s = min(1.0, a.long / max(w, h))
if s < 1:
    rgb, alpha = rgb.resize((round(w * s), round(h * s)), Image.LANCZOS), alpha.resize((round(w * s), round(h * s)), Image.LANCZOS)
w, h = rgb.size
cut = rgb.copy(); cut.putalpha(alpha)

# 3. Depth: Depth Anything V2 on the figure over mid grey, stretched over the figure only (white = near).
net = session("depth_anything_v2_vits.onnx")
flat = Image.composite(rgb, Image.new("RGB", (w, h), (128, 128, 128)), alpha)
shape = net.get_inputs()[0].shape                                 # this export takes a fixed square (518 x 518)
side = shape[2] if isinstance(shape[2], int) else 518
k = side / max(w, h)
dw, dh = max(14, round(w * k)), max(14, round(h * k))
ox, oy = (side - dw) // 2, (side - dh) // 2                        # letterboxed on grey, so the figure keeps its proportions
board = Image.new("RGB", (side, side), (128, 128, 128)); board.paste(flat.resize((dw, dh), Image.BICUBIC), (ox, oy))
x = (np.asarray(board, np.float32) / 255 - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
d = np.squeeze(net.run(None, {net.get_inputs()[0].name: x.astype(np.float32).transpose(2, 0, 1)[None]})[0])[oy:oy + dh, ox:ox + dw]
am = np.asarray(alpha.resize((dw, dh), Image.BILINEAR), np.float32) / 255
inside = d[am > 0.5]
lo, hi = np.percentile(inside, 1), np.percentile(inside, 99.5)
d = np.clip((d - lo) / (hi - lo + 1e-6), 0, 1) * 0.88 + 0.12      # the figure never falls to "far"
d = d * am                                                        # nothing behind it
ow = w // 2; oh = round(ow * h / w)
depth = Image.fromarray((d * 255).astype(np.uint8)).resize((ow, oh), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.6))

# 4. Fingertip: the outermost solid point on the reaching side.
al = np.asarray(alpha)
cols = np.where((al > 128).any(axis=0))[0]
edge = cols.max() if a.reach == "right" else cols.min()
band = max(2, round(w * 0.006))
strip = al[:, edge - band:edge + 1] if a.reach == "right" else al[:, edge:edge + band + 1]
rows = np.where((strip > 128).any(axis=1))[0]
ax, ay = 100 * (edge + 0.5) / w, 100 * float(np.median(rows) + 0.5) / h
if a.anchor:
    ax, ay = (float(v) for v in a.anchor.split(","))

os.makedirs(os.path.join(a.out, "images"), exist_ok=True); os.makedirs(os.path.join(a.out, "depth"), exist_ok=True)
cut_path = os.path.join(a.out, "images", f"{a.id}-cut.webp"); depth_path = os.path.join(a.out, "depth", f"{a.id}-cut-depth.webp")
cut.save(cut_path, quality=90, method=6, exact=True)
depth.convert("RGB").save(depth_path, quality=90, method=6)
print(json.dumps({
    "id": a.id, "files": {"cut": f"images/{a.id}-cut.webp", "cutDepth": f"depth/{a.id}-cut-depth.webp"},
    "size": {"cut": [w, h]}, "anchor": [round(ax, 1), round(ay, 1)], "reach": a.reach,
    "bytes": {"cut": os.path.getsize(cut_path), "depth": os.path.getsize(depth_path)},
}, indent=1))
