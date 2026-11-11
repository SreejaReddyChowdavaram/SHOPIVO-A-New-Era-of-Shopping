from PIL import Image
import os

artifact_dir = r"C:\Users\SREEJA\.gemini\antigravity\brain\61bb6741-0cd9-4228-8598-484b7f0b2add"
files = [
    "customer_dashboard_light.png",
    "customer_dashboard_dark.png",
    "seller_dashboard_light.png",
    "seller_dashboard_dark.png",
    "admin_dashboard_light.png",
    "admin_dashboard_dark.png"
]

print("=== IMAGE VERIFICATION ===")
for f in files:
    p = os.path.join(artifact_dir, f)
    if not os.path.exists(p):
        print(f"MISSING: {f}")
        continue
    img = Image.open(p)
    print(f"File: {f} | Size: {img.size} | Mode: {img.mode} | Bytes: {os.path.getsize(p)}")

