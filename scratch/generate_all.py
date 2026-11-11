import os
import html
import json

OUT_DIR = r"c:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai\docs\diagrams"
os.makedirs(OUT_DIR, exist_ok=True)

def drawio_cell(id_val, val, x, y, w, h, style, parent="1", edge=False, source=None, target=None):
    if edge:
        return f'        <mxCell id="{id_val}" value="{html.escape(val)}" style="{style}" edge="1" parent="{parent}" source="{source}" target="{target}"><mxGeometry relative="1" as="geometry"/></mxCell>'
    return f'        <mxCell id="{id_val}" value="{html.escape(val)}" style="{style}" vertex="1" parent="{parent}"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def make_drawio(title, cells_xml):
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-11-11T00:00:00.000Z" agent="Shopivo CyberForge" version="21.0.0" type="device">
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

def card(x, y, w, h, title, items, badge="COMPONENT", badge_color="#04DB7E", border="#242424", bg="#101010"):
    svg = f"""
    <g transform="translate({x}, {y})" filter="url(#shadow)">
      <rect width="{w}" height="{h}" rx="10" fill="{bg}" stroke="{border}" stroke-width="1.5" />
      <rect x="0" y="0" width="{w}" height="32" rx="10" fill="#161616" />
      <rect x="0" y="24" width="{w}" height="8" fill="#161616" />
      <line x1="0" y1="32" x2="{w}" y2="32" stroke="{border}" stroke-width="1" />
      
      <!-- Badge -->
      <rect x="10" y="7" width="{len(badge)*7 + 12}" height="18" rx="4" fill="{badge_color}" fill-opacity="0.15" stroke="{badge_color}" stroke-opacity="0.4" stroke-width="1" />
      <text x="16" y="20" fill="{badge_color}" font-size="9" font-weight="700" letter-spacing="0.5">{badge}</text>
      
      <!-- Title -->
      <text x="{len(badge)*7 + 28}" y="21" fill="#FFFFFF" font-size="12" font-weight="600">{html.escape(title)}</text>
      
      <!-- Items -->
    """
    dy = 50
    for item in items:
        svg += f"""
      <circle cx="16" cy="{dy - 4}" r="2" fill="{badge_color}" />
      <text x="26" y="{dy}" fill="#CCCCCC" font-size="11">{html.escape(item)}</text>
        """
        dy += 20
    svg += "</g>"
    return svg

def connection(x1, y1, x2, y2, label="", color="#04DB7E", marker="arrow", dash=False):
    dash_attr = 'stroke-dasharray="4,4"' if dash else ''
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2
    label_svg = ""
    if label:
        lw = len(label) * 6 + 16
        label_svg = f"""
        <rect x="{mid_x - lw/2}" y="{mid_y - 10}" width="{lw}" height="20" rx="4" fill="#0d0d0d" stroke="#242424" stroke-width="1" />
        <text x="{mid_x}" y="{mid_y + 4}" fill="#04DB7E" font-size="9" font-weight="600" text-anchor="middle">{html.escape(label)}</text>
        """
    return f"""
    <path d="M {x1} {y1} L {x2} {y2}" stroke="{color}" stroke-width="1.8" {dash_attr} marker-end="url(#{marker})" />
    {label_svg}
    """

def connection_curve(x1, y1, cx, cy, x2, y2, label="", color="#04DB7E", marker="arrow", dash=False):
    dash_attr = 'stroke-dasharray="4,4"' if dash else ''
    label_svg = ""
    if label:
        lw = len(label) * 6 + 16
        label_svg = f"""
        <rect x="{cx - lw/2}" y="{cy - 10}" width="{lw}" height="20" rx="4" fill="#0d0d0d" stroke="#242424" stroke-width="1" />
        <text x="{cx}" y="{cy + 4}" fill="#04DB7E" font-size="9" font-weight="600" text-anchor="middle">{html.escape(label)}</text>
        """
    return f"""
    <path d="M {x1} {y1} Q {cx} {cy} {x2} {y2}" stroke="{color}" stroke-width="1.8" fill="none" {dash_attr} marker-end="url(#{marker})" />
    {label_svg}
    """

print("Helper functions defined successfully.")

