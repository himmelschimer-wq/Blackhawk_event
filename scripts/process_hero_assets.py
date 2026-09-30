import shutil
import os
from PIL import Image
import numpy as np

gen_bg = r"C:\Users\asus\.gemini\antigravity-ide\brain\d02e13c2-5d90-4a88-8f7c-b3bf1714d58d\blackhawk_hero_bg_1790487429782.jpg"
target_bg = r"c:\Event website\public\assets\blackhawk_hero_artwork.jpg"
shutil.copy2(gen_bg, target_bg)
print("Copied hero artwork successfully!")

# Now let's process the floating emblem:
# We want the BlackHawk brushed emblem with its red brush circle and kanji,
# on a transparent background, but keeping the white and red strokes vibrant!
src_path = r"C:\Users\asus\.gemini\antigravity-ide\brain\d02e13c2-5d90-4a88-8f7c-b3bf1714d58d\.user_uploaded\media_1790487165048.jpg"
img = Image.open(src_path).convert("RGBA")
# Emblem coordinates: x: 350 to 650, y: 60 to 230
emblem = img.crop((355, 62, 645, 228))
ew, eh = emblem.size
arr = np.array(emblem, dtype=float)

# We want to isolate the brushed strokes (white letters, red lettering, red brush circle, kanji)
# In dark areas (where RGB < 25), alpha -> 0
# For red/white areas, alpha -> 1
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
# Max channel brightness
brightness = np.maximum(r, np.maximum(g, b))

# We also feather the outer edges in an oval
y, x = np.ogrid[:eh, :ew]
center_x, center_y = ew / 2.0, eh / 2.0
dist = np.sqrt(((x - center_x) / (ew * 0.48)) ** 2 + ((y - center_y) / (eh * 0.48)) ** 2)
edge_feather = np.clip((1.0 - dist) / 0.15, 0.0, 1.0)

# Screen / luminance alpha:
# Pixels with high brightness or high red saturation are kept
alpha_screen = np.clip((brightness - 18.0) / (85.0 - 18.0), 0.0, 1.0)
final_alpha = np.clip(alpha_screen * edge_feather * 255.0, 0, 255)

arr[:, :, 3] = final_alpha
emblem_out = Image.fromarray(arr.astype(np.uint8))
emblem_out.save(r"c:\Event website\public\assets\blackhawk_emblem.png")

# Also save a version with a subtle atmospheric dark radial aura (for perfect contrast on any background)
aura_arr = np.array(emblem, dtype=float)
aura_mask = np.clip((1.0 - dist) / 0.35, 0.0, 1.0)
aura_arr[:, :, 3] = np.clip(aura_mask * 255.0, 0, 255)
emblem_aura = Image.fromarray(aura_arr.astype(np.uint8))
emblem_aura.save(r"c:\Event website\public\assets\blackhawk_emblem_aura.png")

# Navbar logo
# (60, 12, 165, 42)
nav = img.crop((60, 14, 162, 42))
nw, nh = nav.size
narr = np.array(nav, dtype=float)
nr, ng, nb = narr[:, :, 0], narr[:, :, 1], narr[:, :, 2]
nbright = np.maximum(nr, np.maximum(ng, nb))
nalpha = np.clip((nbright - 20.0) / (70.0 - 20.0), 0.0, 1.0) * 255.0
narr[:, :, 3] = nalpha
nav_out = Image.fromarray(narr.astype(np.uint8))
nav_out.save(r"c:\Event website\public\assets\blackhawk_navbar_logo.png")

print("Processed all emblems and logos!")
