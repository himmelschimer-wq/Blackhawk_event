import os
from PIL import Image
import numpy as np

src_path = r"C:\Users\asus\.gemini\antigravity-ide\brain\d02e13c2-5d90-4a88-8f7c-b3bf1714d58d\.user_uploaded\media_1790489782576.png"
dst_hq = r"c:\Event website\public\assets\blackhawk_emblem_hq.png"
dst_floating = r"c:\Event website\public\assets\blackhawk_emblem_floating.png"
dst_emblem = r"c:\Event website\public\assets\blackhawk_emblem.png"

img = Image.open(src_path).convert("RGB")
arr = np.array(img, dtype=float)
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

# Perceived brightness and channel max
max_val = np.maximum(r, np.maximum(g, b))

# Crop tightly to emblem bounding box with comfortable padding
mask = max_val > 14
ys, xs = np.where(mask)
pad = 12
ymin, ymax = max(0, ys.min() - pad), min(arr.shape[0], ys.max() + pad)
xmin, xmax = max(0, xs.min() - pad), min(arr.shape[1], xs.max() + pad)

sub_arr = arr[ymin:ymax, xmin:xmax]
sub_max = max_val[ymin:ymax, xmin:xmax]

# Screen/luminance alpha curve:
# Sub-noise threshold (< 12) -> alpha 0
# Full opacity threshold (> 85) -> alpha 1
# Smooth cubic Hermite interpolation in between
t = np.clip((sub_max - 12.0) / (85.0 - 12.0), 0.0, 1.0)
alpha = t * t * (3.0 - 2.0 * t)

# Matte Un-premultiplication:
# The original pixels were rendered on a black background (RGB * alpha).
# To make them transparent without dark fringing on light/colored backgrounds,
# un-premultiply RGB by alpha:
safe_alpha = np.maximum(alpha, 0.05)
unpremult_rgb = sub_arr / safe_alpha[:, :, None]
unpremult_rgb = np.clip(unpremult_rgb, 0.0, 255.0)

# Build RGBA array
out_rgba = np.zeros((sub_arr.shape[0], sub_arr.shape[1], 4), dtype=np.uint8)
out_rgba[:, :, :3] = unpremult_rgb.astype(np.uint8)
out_rgba[:, :, 3] = (alpha * 255.0).astype(np.uint8)

out_im = Image.fromarray(out_rgba)
out_im.save(dst_hq, optimize=True)
out_im.save(dst_floating, optimize=True)
out_im.save(dst_emblem, optimize=True)

print(f"Generated transparent BlackHawk emblem: size={out_im.size}, saved to {dst_hq}")
