import os
import shutil
from PIL import Image

src_dir = r"C:\Users\asus\.gemini\antigravity-ide\brain\d02e13c2-5d90-4a88-8f7c-b3bf1714d58d\.user_uploaded"
dst_dir = r"c:\Event website\public\assets"
os.makedirs(dst_dir, exist_ok=True)

# 1. Hero Banner: media_1790489231871.png (1024x409)
hero_banner_src = os.path.join(src_dir, "media_1790489231871.png")
shutil.copy2(hero_banner_src, os.path.join(dst_dir, "blackhawk_hero_official_banner.png"))

# Also save a horizontally flipped version if needed for right-aligned raven/torii gate
banner_im = Image.open(hero_banner_src)
banner_flipped = banner_im.transpose(Image.FLIP_LEFT_RIGHT)
banner_flipped.save(os.path.join(dst_dir, "blackhawk_hero_official_banner_flipped.png"))

# 2. BGMI asset: media_1790488902496.png
bgmi_src = os.path.join(src_dir, "media_1790488902496.png")
shutil.copy2(bgmi_src, os.path.join(dst_dir, "official_game_bgmi.png"))

# 3. Free Fire asset: media_1790488980692.png
ff_src = os.path.join(src_dir, "media_1790488980692.png")
shutil.copy2(ff_src, os.path.join(dst_dir, "official_game_freefire.png"))

# 4. Minecraft asset: media_1790489033423.png
mc_src = os.path.join(src_dir, "media_1790489033423.png")
shutil.copy2(mc_src, os.path.join(dst_dir, "official_game_minecraft.png"))

# 5. Valorant asset: media_1790489373024.png
val_src = os.path.join(src_dir, "media_1790489373024.png")
shutil.copy2(val_src, os.path.join(dst_dir, "official_game_valorant.png"))

print("Successfully copied and processed all 5 user-provided assets!")
