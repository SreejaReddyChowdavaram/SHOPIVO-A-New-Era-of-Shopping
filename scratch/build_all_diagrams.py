import os
import html

OUT_DIR = r"c:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai\docs\diagrams"
os.makedirs(OUT_DIR, exist_ok=True)

# Common SVG header generator
def svg_wrap(width, height, title, subtitle, content):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#050505; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Gradients -->
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#04DB7E" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#04DB7E" stop-opacity="0.0" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#04DB7E" />
      <stop offset="100%" stop-color="#028c50" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141414" />
      <stop offset="100%" stop-color="#0d0d0d" />
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#be123c" />
    </linearGradient>

    <!-- Drop Shadows & Glows -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.7"/>
    </filter>

    <!-- Arrow Markers -->
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#04DB7E" />
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#3b82f6" />
    </marker>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#666666" />
    </marker>
    <marker id="arrow-rose" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#f43f5e" />
    </marker>

    <!-- Background Grid Pattern -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="40" y2="0" stroke="#141414" stroke-width="0.7" />
      <line x1="0" y1="0" x2="0" y2="40" stroke="#141414" stroke-width="0.7" />
    </pattern>
  </defs>

  <!-- Background Grid -->
  <rect width="100%" height="100%" fill="#050505" />
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Outer Canvas Border -->
  <rect x="15" y="15" width="{width - 30}" height="{height - 30}" rx="16" fill="none" stroke="#1f1f1f" stroke-width="1.5" />

  <!-- Header Banner -->
  <rect x="25" y="25" width="{width - 50}" height="76" rx="12" fill="#0c0c0c" stroke="#242424" stroke-width="1" />
  <rect x="25" y="25" width="{width - 50}" height="76" rx="12" fill="url(#headerGrad)" />
  <line x1="25" y1="101" x2="{width - 25}" y2="101" stroke="#04DB7E" stroke-opacity="0.3" stroke-width="1" />

  <!-- Brand Glyph & Title -->
  <circle cx="55" cy="63" r="18" fill="#141414" stroke="#04DB7E" stroke-width="2" />
  <polygon points="51,55 63,63 51,71" fill="#04DB7E" />

  <text x="85" y="55" fill="#FFFFFF" font-size="20" font-weight="700" letter-spacing="0.5">SHOPIVO <tspan fill="#04DB7E" font-weight="400">|</tspan> {html.escape(title)}</text>
  <text x="85" y="77" fill="#888888" font-size="12" font-weight="400">{html.escape(subtitle)}</text>

  <!-- Faculty Demonstration Badge -->
  <rect x="{width - 290}" y="45" width="250" height="36" rx="8" fill="#161616" stroke="#04DB7E" stroke-opacity="0.5" stroke-width="1" />
  <circle cx="{width - 272}" cy="63" r="4" fill="#04DB7E" />
  <text x="{width - 258}" y="67" fill="#EEEEEE" font-size="11" font-weight="600" letter-spacing="0.3">COLLEGE FACULTY DEMO</text>

  <!-- Diagram Content -->
  <g transform="translate(0, 0)">
{content}
  </g>

  <!-- Footer / Confidentiality -->
  <text x="35" y="{height - 25}" fill="#555555" font-size="10" font-family="monospace">SHOPIVO ENTERPRISE MARKETPLACE • SEMESTER 2 AI PLATFORM ARCHITECTURE • CYBERFORGE THEME</text>
  <text x="{width - 35}" y="{height - 25}" text-anchor="end" fill="#555555" font-size="10" font-family="monospace">SPRING BOOT 3.4.3 • REACT 19 • POSTGRESQL</text>
</svg>"""

print("Base setup ready.")

