from PIL import Image
import numpy as np

src_path = r"C:\Users\asus\.gemini\antigravity-ide\brain\d02e13c2-5d90-4a88-8f7c-b3bf1714d58d\.user_uploaded\media_1790487165048.jpg"
img = Image.open(src_path).convert("RGBA")

# Navbar logo crop - tight: y: 14 to 38
nav = img.crop((60, 14, 162, 38))
nw, nh = nav.size
narr = np.array(nav, dtype=float)
nr, ng, nb = narr[:, :, 0], narr[:, :, 1], narr[:, :, 2]
nbright = np.maximum(nr, np.maximum(ng, nb))
# Key out black background cleanly
nalpha = np.clip((nbright - 25.0) / (75.0 - 25.0), 0.0, 1.0) * 255.0
narr[:, :, 3] = nalpha
nav_out = Image.fromarray(narr.astype(np.uint8))
nav_out.save(r"c:\Event website\public\assets\blackhawk_navbar_logo.png")

# Also create high-res game card assets without card frame if needed, or keeping the poster style
# Let's inspect game_bgmi.png, game_freefire.png, game_valorant.png, game_minecraft.png
print("Regenerated tight navbar logo!")
