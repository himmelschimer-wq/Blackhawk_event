import shutil
import os
from PIL import Image

artifacts_dir = r"C:\Users\asus\.gemini\antigravity-ide\brain\d02e13c2-5d90-4a88-8f7c-b3bf1714d58d"
public_assets = r"c:\Event website\public\assets"

files_to_copy = {
    "art_bgmi_1790487538643.jpg": "poster_bgmi.jpg",
    "art_freefire_1790487556891.jpg": "poster_freefire.jpg",
    "art_valorant_1790487574599.jpg": "poster_valorant.jpg",
    "art_minecraft_1790487595534.jpg": "poster_minecraft.jpg",
}

for src_name, dst_name in files_to_copy.items():
    src_file = os.path.join(artifacts_dir, src_name)
    dst_file = os.path.join(public_assets, dst_name)
    if os.path.exists(src_file):
        shutil.copy2(src_file, dst_file)
        print(f"Copied {src_name} -> {dst_name}")

# Now let's crop the game logo badges directly from the user's reference image:
# media_1790487165048.jpg
mockup_path = os.path.join(artifacts_dir, ".user_uploaded", "media_1790487165048.jpg")
img = Image.open(mockup_path)

# In the cards (y: 350 to 445):
# BGMI badge: (85, 362, 130, 395)
bgmi_badge = img.crop((85, 362, 130, 395))
bgmi_badge.save(os.path.join(public_assets, "badge_bgmi.png"))

# Free Fire 'F' badge: (300, 360, 335, 398)
ff_badge = img.crop((300, 360, 335, 398))
ff_badge.save(os.path.join(public_assets, "badge_freefire.png"))

# Valorant 'V' badge: (522, 363, 555, 396)
val_badge = img.crop((522, 363, 555, 396))
val_badge.save(os.path.join(public_assets, "badge_valorant.png"))

# Minecraft block badge: (742, 362, 775, 396)
mc_badge = img.crop((742, 362, 775, 396))
mc_badge.save(os.path.join(public_assets, "badge_minecraft.png"))

print("All badges and game posters successfully created!")
