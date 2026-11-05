/**
 * AuthAnimatedBackground.jsx — Progressive Connecting Node Graph Background
 * 
 * Recreates the visual style of the reference image:
 * - Clean dark/light ambient background with soft blurred gradient spheres
 * - Progressive graph cluster drawing: dots appear one by one, lines draw sequentially
 * - Staggered cycles across 4 spatial clusters (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
 * - Drifting ambient accent nodes with soft glowing halos
 * - Subtle side typographic accents ("SAFER SHOPPING TOGETHER", "INTELLIGENCE FOR A TRUSTED TOMORROW")
 * - 100% deterministic SVG + CSS hardware-accelerated animations
 * - Seamless theme integration (Light / Dark) & full prefers-reduced-motion support
 */

import React, { useMemo } from 'react'

// ── Deterministic Graph Cluster Definitions ──
const CLUSTERS = [
  {
    id: 'c-top-left',
    className: 'cluster-top-left',
    width: 360,
    height: 280,
    cycle: 14, // 14s total cycle
    nodes: [
      { id: 'tl-1', x: 50,  y: 60,  r: 6, glow: 8.5, appear: 0.4 },
      { id: 'tl-2', x: 170, y: 35,  r: 5, glow: 7.5, appear: 1.5 },
      { id: 'tl-3', x: 280, y: 90,  r: 7, glow: 9.5, appear: 2.8 },
      { id: 'tl-4', x: 230, y: 200, r: 8, glow: 10.5, appear: 4.1 },
      { id: 'tl-5', x: 100, y: 170, r: 6, glow: 8.5, appear: 5.4 },
      { id: 'tl-6', x: 40,  y: 230, r: 4, glow: 6.5, appear: 6.7 },
    ],
    edges: [
      { id: 'tle-1', from: 'tl-1', to: 'tl-2', start: 1.0, dur: 0.9 },
      { id: 'tle-2', from: 'tl-2', to: 'tl-3', start: 2.3, dur: 0.9 },
      { id: 'tle-3', from: 'tl-3', to: 'tl-4', start: 3.6, dur: 0.9 },
      { id: 'tle-4', from: 'tl-4', to: 'tl-5', start: 4.9, dur: 0.9 },
      { id: 'tle-5', from: 'tl-5', to: 'tl-1', start: 6.1, dur: 0.9 },
      { id: 'tle-6', from: 'tl-5', to: 'tl-6', start: 7.2, dur: 0.8 },
      { id: 'tle-7', from: 'tl-2', to: 'tl-5', start: 7.8, dur: 0.9 },
    ],
  },
  {
    id: 'c-top-right',
    className: 'cluster-top-right',
    width: 380,
    height: 300,
    cycle: 16, // 16s cycle
    nodes: [
      { id: 'tr-1', x: 80,  y: 110, r: 5, glow: 7.5, appear: 0.6 },
      { id: 'tr-2', x: 190, y: 40,  r: 8, glow: 10.5, appear: 1.9 },
      { id: 'tr-3', x: 310, y: 70,  r: 6, glow: 8.5, appear: 3.2 },
      { id: 'tr-4', x: 330, y: 200, r: 5, glow: 7.5, appear: 4.6 },
      { id: 'tr-5', x: 210, y: 220, r: 7, glow: 9.5, appear: 5.9 },
      { id: 'tr-6', x: 120, y: 250, r: 4, glow: 6.5, appear: 7.2 },
    ],
    edges: [
      { id: 'tre-1', from: 'tr-1', to: 'tr-2', start: 1.4, dur: 0.9 },
      { id: 'tre-2', from: 'tr-2', to: 'tr-3', start: 2.7, dur: 0.9 },
      { id: 'tre-3', from: 'tr-3', to: 'tr-4', start: 4.0, dur: 0.9 },
      { id: 'tre-4', from: 'tr-4', to: 'tr-5', start: 5.3, dur: 0.9 },
      { id: 'tre-5', from: 'tr-5', to: 'tr-2', start: 6.5, dur: 0.9 },
      { id: 'tre-6', from: 'tr-1', to: 'tr-5', start: 7.6, dur: 0.8 },
      { id: 'tre-7', from: 'tr-5', to: 'tr-6', start: 8.4, dur: 0.8 },
    ],
  },
  {
    id: 'c-bottom-left',
    className: 'cluster-bottom-left',
    width: 360,
    height: 290,
    cycle: 15, // 15s cycle
    nodes: [
      { id: 'bl-1', x: 60,  y: 190, r: 7, glow: 9.5, appear: 0.5 },
      { id: 'bl-2', x: 130, y: 80,  r: 5, glow: 7.5, appear: 1.8 },
      { id: 'bl-3', x: 230, y: 60,  r: 8, glow: 10.5, appear: 3.1 },
      { id: 'bl-4', x: 290, y: 160, r: 6, glow: 8.5, appear: 4.4 },
      { id: 'bl-5', x: 180, y: 230, r: 5, glow: 7.5, appear: 5.7 },
      { id: 'bl-6', x: 80,  y: 260, r: 4, glow: 6.5, appear: 7.0 },
    ],
    edges: [
      { id: 'ble-1', from: 'bl-1', to: 'bl-2', start: 1.3, dur: 0.9 },
      { id: 'ble-2', from: 'bl-2', to: 'bl-3', start: 2.6, dur: 0.9 },
      { id: 'ble-3', from: 'bl-3', to: 'bl-4', start: 3.9, dur: 0.9 },
      { id: 'ble-4', from: 'bl-4', to: 'bl-5', start: 5.2, dur: 0.9 },
      { id: 'ble-5', from: 'bl-5', to: 'bl-1', start: 6.4, dur: 0.9 },
      { id: 'ble-6', from: 'bl-2', to: 'bl-4', start: 7.5, dur: 0.8 },
      { id: 'ble-7', from: 'bl-1', to: 'bl-6', start: 8.3, dur: 0.8 },
    ],
  },
  {
    id: 'c-bottom-right',
    className: 'cluster-bottom-right',
    width: 380,
    height: 310,
    cycle: 17, // 17s cycle
    nodes: [
      { id: 'br-1', x: 70,  y: 120, r: 5, glow: 7.5, appear: 0.8 },
      { id: 'br-2', x: 180, y: 80,  r: 8, glow: 10.5, appear: 2.1 },
      { id: 'br-3', x: 300, y: 130, r: 6, glow: 8.5, appear: 3.5 },
      { id: 'br-4', x: 260, y: 240, r: 7, glow: 9.5, appear: 4.9 },
      { id: 'br-5', x: 140, y: 220, r: 5, glow: 7.5, appear: 6.2 },
      { id: 'br-6', x: 50,  y: 270, r: 4, glow: 6.5, appear: 7.5 },
    ],
    edges: [
      { id: 'bre-1', from: 'br-1', to: 'br-2', start: 1.6, dur: 0.9 },
      { id: 'bre-2', from: 'br-2', to: 'br-3', start: 3.0, dur: 0.9 },
      { id: 'bre-3', from: 'br-3', to: 'br-4', start: 4.4, dur: 0.9 },
      { id: 'bre-4', from: 'br-4', to: 'br-5', start: 5.7, dur: 0.9 },
      { id: 'bre-5', from: 'br-5', to: 'br-1', start: 6.9, dur: 0.9 },
      { id: 'bre-6', from: 'br-2', to: 'br-4', start: 8.0, dur: 0.8 },
      { id: 'bre-7', from: 'br-5', to: 'br-6', start: 8.8, dur: 0.8 },
    ],
  },
]

// ── Independent Floating Ambient Dots ──
const AMBIENT_DOTS = [
  { id: 'ad-1', top: '18%', left: '26%', size: 9, dur: '11s', delay: '0s' },
  { id: 'ad-2', top: '38%', left: '12%', size: 14, dur: '13s', delay: '-3s' },
  { id: 'ad-3', top: '24%', right: '22%', size: 10, dur: '12s', delay: '-5s' },
  { id: 'ad-4', top: '65%', right: '14%', size: 12, dur: '14s', delay: '-2s' },
  { id: 'ad-5', bottom: '15%', left: '30%', size: 8, dur: '10s', delay: '-4s' },
  { id: 'ad-6', bottom: '22%', right: '28%', size: 11, dur: '15s', delay: '-6s' },
]

const AuthAnimatedBackground = () => {
  // Generate keyframes stylesheet for each cluster's nodes and edges
  const keyframesStyle = useMemo(() => {
    let css = ''

    CLUSTERS.forEach((cluster) => {
      const T = cluster.cycle
      const nodeMap = new Map()
      cluster.nodes.forEach((n) => nodeMap.set(n.id, n))

      // 1. Node Keyframes
      cluster.nodes.forEach((n) => {
        const appearPct = ((n.appear / T) * 100).toFixed(2)
        const popPct = (((n.appear + 0.35) / T) * 100).toFixed(2)
        const settlePct = (((n.appear + 0.6) / T) * 100).toFixed(2)
        const holdPct = 80.0
        const fadePct = 90.0

        css += `
          @keyframes nodeAnim_${n.id} {
            0%, ${Math.max(0, appearPct - 0.01)}% {
              opacity: 0;
              transform: scale(0);
            }
            ${popPct}% {
              opacity: 1;
              transform: scale(1.25);
            }
            ${settlePct}%, ${holdPct}% {
              opacity: 1;
              transform: scale(1);
            }
            ${fadePct}%, 100% {
              opacity: 0;
              transform: scale(0.3);
            }
          }
        `
      })

      // 2. Edge Keyframes (Progressive Stroke Drawing)
      cluster.edges.forEach((e) => {
        const startPct = ((e.start / T) * 100).toFixed(2)
        const endPct = (((e.start + e.dur) / T) * 100).toFixed(2)
        const holdPct = 80.0
        const fadePct = 90.0

        css += `
          @keyframes edgeAnim_${e.id} {
            0%, ${Math.max(0, startPct - 0.01)}% {
              stroke-dashoffset: var(--edge-len-${e.id});
              opacity: 0;
            }
            ${startPct}% {
              stroke-dashoffset: var(--edge-len-${e.id});
              opacity: 1;
            }
            ${endPct}%, ${holdPct}% {
              stroke-dashoffset: 0;
              opacity: 1;
            }
            ${fadePct}%, 100% {
              stroke-dashoffset: 0;
              opacity: 0;
            }
          }
        `
      })
    })

    return css
  }, [])

  return (
    <div className="auth-graph-bg-container" aria-hidden="true">
      {/* Dynamic Keyframes for Progressive Drawing */}
      <style>{keyframesStyle}</style>

      {/* ── 1. Soft Ambient Glowing Spheres / Blobs ── */}
      <div className="ambient-sphere sphere-top-right" />
      <div className="ambient-sphere sphere-bottom-left" />
      <div className="ambient-sphere sphere-side-left" />
      <div className="ambient-sphere sphere-side-right" />

      {/* ── 2. Subtle Side Typographic Brand Accents ── */}
      <div className="auth-slogan auth-slogan-left">
        <span>SAFER</span>
        <span>SHOPPING</span>
        <span>TOGETHER</span>
      </div>

      <div className="auth-slogan auth-slogan-right">
        <span>INTELLIGENCE</span>
        <span>FOR A TRUSTED</span>
        <span>TOMORROW</span>
      </div>

      {/* ── 3. Progressive Graph Clusters ── */}
      {CLUSTERS.map((cluster) => {
        const nodeMap = new Map()
        cluster.nodes.forEach((n) => nodeMap.set(n.id, n))

        return (
          <div key={cluster.id} className={`graph-cluster-wrapper ${cluster.className}`}>
            <svg
              className="graph-cluster-svg"
              viewBox={`0 0 ${cluster.width} ${cluster.height}`}
              width={cluster.width}
              height={cluster.height}
            >
              <defs>
                {/* Radial gradient for glowing nodes */}
                <radialGradient id={`node-grad-${cluster.id}`} cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="45%" stopColor="var(--auth-graph-node)" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="var(--auth-graph-node-edge)" stopOpacity="0.75" />
                </radialGradient>

                {/* Soft drop shadow for node glow */}
                <filter id={`glow-${cluster.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Sequential Connecting Lines */}
              {cluster.edges.map((edge) => {
                const n1 = nodeMap.get(edge.from)
                const n2 = nodeMap.get(edge.to)
                if (!n1 || !n2) return null

                const length = Math.ceil(Math.hypot(n2.x - n1.x, n2.y - n1.y))

                return (
                  <line
                    key={edge.id}
                    x1={n1.x}
                    y1={n1.y}
                    x2={n2.x}
                    y2={n2.y}
                    className="graph-edge-line"
                    style={{
                      strokeDasharray: length,
                      strokeDashoffset: length,
                      ['--edge-len-' + edge.id]: `${length}px`,
                      animation: `edgeAnim_${edge.id} ${cluster.cycle}s cubic-bezier(0.25, 0.1, 0.25, 1) infinite`,
                    }}
                  />
                )
              })}

              {/* Progressive Nodes */}
              {cluster.nodes.map((node) => (
                <g
                  key={node.id}
                  className="graph-node-group"
                  style={{
                    transformOrigin: `${node.x}px ${node.y}px`,
                    animation: `nodeAnim_${node.id} ${cluster.cycle}s cubic-bezier(0.34, 1.56, 0.64, 1) infinite`,
                  }}
                >
                  {/* Glowing Outer Halo */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r + 2.5}
                    className="graph-node-halo"
                  />

                  {/* Core Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={`url(#node-grad-${cluster.id})`}
                    filter={`url(#glow-${cluster.id})`}
                    className="graph-node-core"
                  />
                </g>
              ))}
            </svg>
          </div>
        )
      })}

      {/* ── 4. Independent Drifting Ambient Nodes ── */}
      {AMBIENT_DOTS.map((dot) => (
        <div
          key={dot.id}
          className="ambient-floating-dot"
          style={{
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            top: dot.top,
            left: dot.left,
            right: dot.right,
            bottom: dot.bottom,
            animationDuration: dot.dur,
            animationDelay: dot.delay,
          }}
        >
          <div className="ambient-dot-halo" />
          <div className="ambient-dot-core" />
        </div>
      ))}
    </div>
  )
}

export default React.memo(AuthAnimatedBackground)
