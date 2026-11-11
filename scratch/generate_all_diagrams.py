import os
import html

OUT_DIR = r"c:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai\docs\diagrams"
os.makedirs(OUT_DIR, exist_ok=True)

def wrap_svg(width, height, title, subtitle, content):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#050505; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Gradients -->
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#04DB7E" stop-opacity="0.18" />
      <stop offset="60%" stop-color="#04DB7E" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#050505" stop-opacity="0.0" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141414" />
      <stop offset="100%" stop-color="#0c0c0c" />
    </linearGradient>
    <linearGradient id="tierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#161616" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0e0e0e" stop-opacity="0.9" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
    <filter id="cardGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#04DB7E" flood-opacity="0.15"/>
    </filter>

    <!-- Arrow Markers -->
    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#04DB7E" />
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
    </marker>
    <marker id="arrow-rose" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
    </marker>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#71717a" />
    </marker>

    <!-- Grid Pattern -->
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="30" y2="0" stroke="#121212" stroke-width="0.8" />
      <line x1="0" y1="0" x2="0" y2="30" stroke="#121212" stroke-width="0.8" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="#050505" />
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Outer Border -->
  <rect x="12" y="12" width="{width - 24}" height="{height - 24}" rx="14" fill="none" stroke="#222222" stroke-width="1.2" />

  <!-- Header Banner -->
  <rect x="24" y="24" width="{width - 48}" height="76" rx="12" fill="#0d0d0d" stroke="#262626" stroke-width="1" />
  <rect x="24" y="24" width="{width - 48}" height="76" rx="12" fill="url(#headerGrad)" />
  <line x1="24" y1="100" x2="{width - 24}" y2="100" stroke="#04DB7E" stroke-opacity="0.35" stroke-width="1.5" />

  <!-- Brand Glyph & Title -->
  <circle cx="56" cy="62" r="18" fill="#141414" stroke="#04DB7E" stroke-width="2" />
  <polygon points="52,54 64,62 52,70" fill="#04DB7E" />

  <text x="88" y="55" fill="#FFFFFF" font-size="20" font-weight="700" letter-spacing="0.5">SHOPIVO <tspan fill="#04DB7E">|</tspan> {html.escape(title)}</text>
  <text x="88" y="77" fill="#888888" font-size="12" font-weight="400">{html.escape(subtitle)}</text>

  <!-- College Faculty Demo Badge -->
  <rect x="{width - 290}" y="44" width="250" height="36" rx="8" fill="#141414" stroke="#04DB7E" stroke-opacity="0.5" stroke-width="1" />
  <circle cx="{width - 272}" cy="62" r="4.5" fill="#04DB7E" />
  <text x="{width - 258}" y="66" fill="#EEEEEE" font-size="11" font-weight="600" letter-spacing="0.5">COLLEGE FACULTY DEMO</text>

  <!-- Diagram Body -->
{content}

  <!-- Footer -->
  <line x1="24" y1="{height - 40}" x2="{width - 24}" y2="{height - 40}" stroke="#1f1f1f" stroke-width="1" />
  <text x="32" y="{height - 20}" fill="#555555" font-size="10" font-family="monospace">SHOPIVO ENTERPRISE MARKETPLACE • SEMESTER 2 AI PLATFORM ARCHITECTURE • CYBERFORGE THEME</text>
  <text x="{width - 32}" y="{height - 20}" text-anchor="end" fill="#555555" font-size="10" font-family="monospace">SPRING BOOT 3.4.3 • REACT 19 • POSTGRESQL</text>
</svg>"""

def card_svg(x, y, w, h, title, items, badge="COMPONENT", badge_col="#04DB7E", border="#262626", bg="url(#cardGrad)", highlight=False):
    glow_attr = 'filter="url(#cardGlow)"' if highlight else 'filter="url(#shadow)"'
    border_col = badge_col if highlight else border
    svg = f"""
  <g transform="translate({x}, {y})" {glow_attr}>
    <rect width="{w}" height="{h}" rx="10" fill="{bg}" stroke="{border_col}" stroke-width="{1.5 if highlight else 1.2}" />
    <rect x="0" y="0" width="{w}" height="32" rx="10" fill="#161616" />
    <rect x="0" y="22" width="{w}" height="10" fill="#161616" />
    <line x1="0" y1="32" x2="{w}" y2="32" stroke="{border}" stroke-width="1" />
    <rect x="10" y="7" width="{len(badge)*6.8 + 12}" height="18" rx="4" fill="{badge_col}" fill-opacity="0.15" stroke="{badge_col}" stroke-opacity="0.4" stroke-width="1" />
    <text x="16" y="20" fill="{badge_col}" font-size="9" font-weight="700" letter-spacing="0.5">{badge}</text>
    <text x="{len(badge)*6.8 + 26}" y="21" fill="#FFFFFF" font-size="12" font-weight="600">{html.escape(title)}</text>
    """
    dy = 52
    for item in items:
        svg += f"""
    <circle cx="16" cy="{dy - 4}" r="2" fill="{badge_col}" />
    <text x="26" y="{dy}" fill="#C8C8C8" font-size="11">{html.escape(item)}</text>
        """
        dy += 21
    svg += "  </g>"
    return svg

def conn_svg(x1, y1, x2, y2, label="", col="#04DB7E", marker="arrow", dash=False):
    dash_attr = 'stroke-dasharray="4,4"' if dash else ''
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2
    lbl_svg = ""
    if label:
        lw = len(label) * 6.5 + 16
        lbl_svg = f"""
    <rect x="{mid_x - lw/2}" y="{mid_y - 10}" width="{lw}" height="20" rx="4" fill="#0d0d0d" stroke="#2a2a2a" stroke-width="1" />
    <text x="{mid_x}" y="{mid_y + 4}" fill="{col}" font-size="9.5" font-weight="600" text-anchor="middle">{html.escape(label)}</text>
        """
    return f"""
  <path d="M {x1} {y1} L {x2} {y2}" stroke="{col}" stroke-width="1.8" {dash_attr} marker-end="url(#{marker})" />
  {lbl_svg}
    """

def drawio_wrap(title, cells_xml):
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

print("Base setup ready.")

