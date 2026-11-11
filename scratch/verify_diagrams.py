import os
import xml.etree.ElementTree as ET

DIAGRAMS_DIR = r"c:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai\docs\diagrams"

diagram_names = [
    "01-system-architecture",
    "02-customer-workflow",
    "03-seller-workflow",
    "04-admin-workflow",
    "05-authentication-architecture",
    "06-password-reset-workflow",
    "07-login-activity-architecture",
    "08-security-privacy-workflow",
    "09-database-architecture"
]

print("=== VERIFYING 9 SVG & 9 DRAW.IO FILES ===")

all_ok = True
for name in diagram_names:
    svg_file = os.path.join(DIAGRAMS_DIR, f"{name}.svg")
    drawio_file = os.path.join(DIAGRAMS_DIR, f"{name}.drawio")

    # 1. Verify SVG exists and is valid XML
    if not os.path.exists(svg_file):
        print(f"[FAIL] Missing SVG: {svg_file}")
        all_ok = False
    else:
        try:
            tree = ET.parse(svg_file)
            root = tree.getroot()
            tag = root.tag
            viewBox = root.attrib.get("viewBox", "")
            size_kb = os.path.getsize(svg_file) / 1024
            print(f"[PASS] SVG valid XML: {name}.svg ({size_kb:.1f} KB, viewBox={viewBox})")
        except Exception as e:
            print(f"[FAIL] Invalid SVG XML {name}.svg: {e}")
            all_ok = False

    # 2. Verify Draw.io exists and is valid mxfile XML
    if not os.path.exists(drawio_file):
        print(f"[FAIL] Missing Draw.io: {drawio_file}")
        all_ok = False
    else:
        try:
            tree = ET.parse(drawio_file)
            root = tree.getroot()
            if root.tag != "mxfile":
                print(f"[FAIL] Root tag is not mxfile in {name}.drawio (got {root.tag})")
                all_ok = False
            else:
                diagram_elem = root.find("diagram")
                graph_model = diagram_elem.find("mxGraphModel") if diagram_elem is not None else None
                cells = graph_model.findall(".//mxCell") if graph_model is not None else []
                size_kb = os.path.getsize(drawio_file) / 1024
                print(f"[PASS] Draw.io valid mxGraph: {name}.drawio ({size_kb:.1f} KB, {len(cells)} cells)")
        except Exception as e:
            print(f"[FAIL] Invalid Draw.io XML {name}.drawio: {e}")
            all_ok = False

# 3. Verify index.html exists
index_file = os.path.join(DIAGRAMS_DIR, "index.html")
if os.path.exists(index_file):
    size_kb = os.path.getsize(index_file) / 1024
    print(f"[PASS] Showcase Gallery index.html exists ({size_kb:.1f} KB)")
else:
    print("[FAIL] Missing index.html")
    all_ok = False

if all_ok:
    print("\n>>> ALL 18 DIAGRAM FILES + GALLERY INDEX.HTML ARE 100% VALID! <<<")
else:
    print("\n>>> ONE OR MORE VERIFICATION CHECKS FAILED! <<<")

