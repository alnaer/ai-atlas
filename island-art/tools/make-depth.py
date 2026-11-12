"""Make a spatial-photo depth map for any image (white = near, black = far).

Use it when you add or replace an island image.

  pip install onnxruntime huggingface_hub pillow numpy
  python make-depth.py path/to/image.webp            -> path/to/image-depth.webp
  python make-depth.py image.webp --out depth.webp --size 800

Model: Depth Anything V2 Small (Apache-2.0), ONNX build from onnx-community.
The depth map is saved at half the image width by default; that is plenty for the
parallax shader and keeps files around 5-15 KB.
"""
import argparse, os
import numpy as np
from PIL import Image, ImageFilter
import onnxruntime as ort
from huggingface_hub import hf_hub_download

ap = argparse.ArgumentParser()
ap.add_argument("image"); ap.add_argument("--out"); ap.add_argument("--size", type=int, default=0,
               help="output width in px (default: half the image width)")
a = ap.parse_args()

model = hf_hub_download("onnx-community/depth-anything-v2-small", "onnx/model.onnx")
sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
img = Image.open(a.image).convert("RGB")
w, h = img.size; s = 770 / max(w, h)
W, H = max(14, round(w * s / 14) * 14), max(14, round(h * s / 14) * 14)
x = (np.asarray(img.resize((W, H), Image.BICUBIC), np.float32) / 255 - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
d = sess.run(None, {"pixel_values": x.astype(np.float32).transpose(2, 0, 1)[None]})[0][0]
lo, hi = np.percentile(d, 1), np.percentile(d, 99.5)
d = np.clip((d - lo) / (hi - lo + 1e-6), 0, 1)
ow = a.size or w // 2; oh = round(ow * h / w)
out = Image.fromarray((d * 255).astype(np.uint8)).resize((ow, oh), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.6))
dst = a.out or os.path.splitext(a.image)[0] + "-depth.webp"
out.save(dst, quality=90, method=6)
print("wrote", dst, out.size)
