import os
import numpy as np
from PIL import Image

src_path = r"C:\Users\asus\.gemini\antigravity-ide\brain\d02e13c2-5d90-4a88-8f7c-b3bf1714d58d\.user_uploaded\media_1790487165048.jpg"
out_dir = r"c:\Event website\public\assets"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
w, h = img.size

# 1. Navbar Logo: clean crop and transparent background
# Top left logo is at (65, 12, 160, 44)
nav_logo = img.crop((65, 12, 160, 44))
# Convert very dark pixels to transparent or feather
nav_arr = np.array(nav_logo, dtype=float)
# The logo is white and red text on near-black background.
# Brightness = max(r, g, b)
brightness = np.maximum(nav_arr[:, :, 0], np.maximum(nav_arr[:, :, 1], nav_arr[:, :, 2]))
alpha = np.clip((brightness - 25) / (120 - 25) * 255, 0, 255)
nav_arr[:, :, 3] = alpha
clean_nav_logo = Image.fromarray(nav_arr.astype(np.uint8))
clean_nav_logo.save(os.path.join(out_dir, "blackhawk_nav_logo.png"))

# 2. Hero Floating Emblem: circular feather fade
# Center emblem is around (360, 50, 650, 235)
emblem = img.crop((360, 50, 650, 235))
ew, eh = emblem.size
emb_arr = np.array(emblem, dtype=float)

# Create an elliptical radial fade mask so the outer rectangular edge smoothly fades to 0
y, x = np.ogrid[:eh, :ew]
center_x, center_y = ew / 2.0, eh / 2.0
# Normalized distance from center
dist = np.sqrt(((x - center_x) / (ew * 0.48)) ** 2 + ((y - center_y) / (eh * 0.48)) ** 2)
radial_alpha = np.clip((1.0 - dist) / 0.35, 0.0, 1.0) * 255.0

# Also fade out very dark black pixels around outer rim
lum = (emb_arr[:, :, 0] * 0.299 + emb_arr[:, :, 1] * 0.587 + emb_arr[:, :, 2] * 0.114)
black_alpha = np.clip((lum - 10) / 30, 0, 1)

final_alpha = radial_alpha * black_alpha
emb_arr[:, :, 3] = np.clip(final_alpha, 0, 255)
clean_emblem = Image.fromarray(emb_arr.astype(np.uint8))
clean_emblem.save(os.path.join(out_dir, "blackhawk_emblem_floating.png"))

# 3. Hero Atmospheric Artwork (Blood moon, torii gate, raven on the right, dark forest)
# Crop from hero area: (280, 0, 1024, 340)
hero_art = img.crop((280, 0, 1024, 340))
haw, hah = hero_art.size
hero_arr = np.array(hero_art, dtype=float)

# Fade left edge to pure black/transparent, and bottom to black
# Left fade: from x=0 to x=180
fade_left = np.clip(np.arange(haw) / 180.0, 0.0, 1.0)
# Bottom fade: from y=hah-80 to y=hah
fade_bottom = np.clip((hah - np.arange(hah)[:, np.newaxis]) / 80.0, 0.0, 1.0)
# Top fade: slight fade at top 30px
fade_top = np.clip(np.arange(hah)[:, np.newaxis] / 30.0, 0.0, 1.0)

mask_2d = fade_left[np.newaxis, :] * fade_bottom * fade_top
hero_arr[:, :, 3] = hero_arr[:, :, 3] * mask_2d
clean_hero_art = Image.fromarray(hero_arr.astype(np.uint8))
clean_hero_art.save(os.path.join(out_dir, "hero_raven_bloodmoon.png"))

# 4. Also keep hero_full_backdrop
# Full hero backdrop (0 to 340) with smooth bottom fade to pure black
hero_full = img.crop((0, 0, 1024, 340))
hfw, hfh = hero_full.size
hfull_arr = np.array(hero_full, dtype=float)
# Fade bottom 60px into black
for yy in range(hfh - 60, hfh):
    factor = (hfh - yy) / 60.0
    hfull_arr[yy, :, :3] *= factor

clean_hero_full = Image.fromarray(hfull_arr[:, :, :3].astype(np.uint8))
clean_hero_full.save(os.path.join(out_dir, "hero_cinematic_bg.jpg"))

# 5. Extract Game Cards and Game Artworks
games = [
    ("bgmi", (70, 350, 280, 445)),
    ("freefire", (290, 350, 500, 445)),
    ("valorant", (510, 350, 720, 445)),
    ("minecraft", (730, 350, 940, 445))
]

for name, box in games:
    g_crop = img.crop(box)
    g_crop.save(os.path.join(out_dir, f"game_{name}.png"))

print("All enhanced assets extracted successfully!")
