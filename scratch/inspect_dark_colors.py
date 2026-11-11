from PIL import Image
import numpy as np
import os

artifact_dir = r"C:\Users\SREEJA\.gemini\antigravity\brain\61bb6741-0cd9-4228-8598-484b7f0b2add"

for f in ["seller_dashboard_dark.png", "admin_dashboard_dark.png", "customer_dashboard_dark.png"]:
    p = os.path.join(artifact_dir, f)
    img = Image.open(p)
    arr = np.array(img)
    # Check top-left, center, sidebar area
    print(f"\n{f}:")
    print("  Top-left (0,0):", arr[0, 0])
    print("  Header (32, 200):", arr[32, 200])
    print("  Sidebar (300, 50):", arr[300, 50])
    print("  Center (450, 720):", arr[450, 720])

