import os
from PIL import Image

src_path = r"C:\Users\asus\.gemini\antigravity-ide\brain\d02e13c2-5d90-4a88-8f7c-b3bf1714d58d\.user_uploaded\media_1790487165048.jpg"
out_dir = r"c:\Event website\public\assets"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path)
w, h = img.size
print(f"Original image size: {w}x{h}")

# Save full copy
img.save(os.path.join(out_dir, "reference_full.jpg"))

# 1. BlackHawk Nav Logo (top left area)
# Looking at 1024x682: navbar logo is around x: 65 to 160, y: 15 to 45
logo_crop = img.crop((60, 10, 165, 48))
logo_crop.save(os.path.join(out_dir, "blackhawk_logo_raw.png"))

# 2. BlackHawk Floating Emblem (center/right of hero)
# In 1024x682: the brush circle with kanji and "BLACKHAWK" is around x: 350 to 650, y: 60 to 225
emblem_crop = img.crop((350, 60, 650, 230))
emblem_crop.save(os.path.join(out_dir, "blackhawk_emblem_raw.png"))

# 3. Hero background banner (the whole top hero area without the bottom UI cards)
# From y: 0 to ~320
hero_bg = img.crop((0, 0, 1024, 330))
hero_bg.save(os.path.join(out_dir, "hero_bg_cropped.jpg"))

# 4. Game cards:
# Cards row is around y: 350 to 450
# BGMI card: around x: 70 to 280, y: 350 to 445
bgmi_crop = img.crop((70, 350, 280, 445))
bgmi_crop.save(os.path.join(out_dir, "card_bgmi.jpg"))

# Free Fire: around x: 290 to 500, y: 350 to 445
ff_crop = img.crop((290, 350, 500, 445))
ff_crop.save(os.path.join(out_dir, "card_freefire.jpg"))

# Valorant: around x: 510 to 720, y: 350 to 445
val_crop = img.crop((510, 350, 720, 445))
val_crop.save(os.path.join(out_dir, "card_valorant.jpg"))

# Minecraft: around x: 730 to 940, y: 350 to 445
mc_crop = img.crop((730, 350, 940, 445))
mc_crop.save(os.path.join(out_dir, "card_minecraft.jpg"))

print("Cropped preliminary assets successfully!")
