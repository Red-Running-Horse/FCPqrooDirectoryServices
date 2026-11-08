# Alpha-key the fcp-wordmark-v12 backdrop in the existing post pass.
#
# Why keying over a re-render: Blender 4.0.2's EEVEE has no shadow catcher
# (4.2+), so "film transparent" would force a Cycles re-render and re-lit the
# approved v12 look. Keying works on the approved pixels themselves. Measured
# separation is huge: backdrop saturation (max-min) is 13-15, letters >= 58,
# so a threshold at ~32 is bulletproof; the backdrop is a smooth cream field
# with gentle shadows (k >= 0.85), which we keep as partial alpha.
#
# Model: for each pixel I with local backdrop estimate L (heavy gaussian with
# letters masked out):
#   - letter pixels (saturated): alpha 1, RGB = I
#   - backdrop pixels: alpha = 1 - I.lum / L.lum (shadow darkness), RGB = 0 —
#     premultiplied-style black so the shadow behaves multiplicatively over
#     any cream the card uses
import numpy as np
from PIL import Image, ImageFilter

SRC = "/home/mc/records/fcp-wordmark-v12.png"
DST = "public/img/fcp-letters.webp"
MAX_W = 1920

im = Image.open(SRC).convert("RGB")
w, h = im.size
rgb = np.asarray(im).astype(np.float32)  # h,w,3
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
s = np.max(rgb, axis=-1) - np.min(rgb, axis=-1)  # saturation spread

# letter membership with a soft ramp 24..40 (measured: backdrop <=15, letters >=58)
a_letter = np.clip((s - 24.0) / 16.0, 0.0, 1.0)
mask_hard = s >= 32

# local backdrop field: two-stage gaussian with letters replaced first
blur64 = im.filter(ImageFilter.GaussianBlur(64))
stage = np.where(mask_hard[..., None], np.asarray(blur64), np.asarray(im)).astype(np.uint8)
L_img = Image.fromarray(stage).filter(ImageFilter.GaussianBlur(48))
L = np.asarray(L_img).astype(np.float32)
lum_i = 0.2126 * r + 0.7152 * g + 0.0722 * b
lum_l = 0.2126 * L[..., 0] + 0.7152 * L[..., 1] + 0.0722 * L[..., 2]
k = np.clip(lum_i / np.maximum(lum_l, 1.0), 0.0, 1.2)
a_shadow = np.clip((1.0 - k - 0.015) / 0.97, 0.0, 1.0)
a_shadow = np.where(mask_hard, 0.0, a_shadow)

alpha = np.maximum(a_letter, a_shadow)
fg = np.where((a_letter >= a_shadow)[..., None], rgb, 0.0)

# letters' bounding box (dilated letter mask) + modest padding
ys, xs = np.where(mask_hard)
pad = 40
x0, x1 = max(0, xs.min() - pad), min(w, xs.max() + pad)
y0, y1 = max(0, ys.min() - pad), min(h, ys.max() + pad)
print("letters bbox:", xs.min(), ys.min(), xs.max(), ys.max(), "-> crop", x0, y0, x1, y1)

# border fade so no tone step can sit at the crop edge
alpha[:6, :] *= np.linspace(0, 1, 6)[:, None]
alpha[-6:, :] *= np.linspace(1, 0, 6)[:, None]
alpha[:, :6] *= np.linspace(0, 1, 6)[None, :]
alpha[:, -6:] *= np.linspace(1, 0, 6)[None, :]

crop_a = alpha[y0:y1, x0:x1]
crop_f = fg[y0:y1, x0:x1]
out = Image.fromarray(np.dstack([crop_f, crop_a * 255.0]).astype(np.uint8), "RGBA")
if out.size[0] > MAX_W:
    out = out.resize((MAX_W, round(out.size[1] * MAX_W / out.size[0])), Image.LANCZOS)
out.save(DST, quality=85)

a = np.asarray(out)[..., 3].astype(np.float32) / 255.0
print("saved", DST, out.size)
print("alpha: opaque px", round(float((a >= 0.99).mean() * 100), 1), "%",
      "| shadow band (0.02..0.9)", round(float(((a >= 0.02) & (a < 0.9)).mean() * 100), 2), "%",
      "| max", float(a.max()))
print("corners alpha:", [int(v) for v in (a[0, 0], a[0, -1], a[-1, 0], a[-1, -1])])
