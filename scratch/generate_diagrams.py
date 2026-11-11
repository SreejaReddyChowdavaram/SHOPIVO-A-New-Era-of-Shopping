import os
import html

OUT_DIR = r"c:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai\docs\diagrams"
os.makedirs(OUT_DIR, exist_ok=True)

# Helper for DrawIO XML generation
def make_drawio(title, cells_xml):
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-11-11T00:00:00.000Z" agent="Shopivo CyberForge Architecture" version="21.0.0" type="device">
  <diagram name="{html.escape(title)}" id="diagram-1">
    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1000" background="#050505" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
{cells_xml}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""

# Let's define the 9 diagrams with rich, beautiful SVGs
print("Starting diagram generation...")

