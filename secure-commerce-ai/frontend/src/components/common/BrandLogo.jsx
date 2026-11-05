/**
 * BrandLogo.jsx — Official Shopivo Brand Component
 * 
 * Format: [Shopivo Logo] Shopivo
 * Structure:
 * - Approved official logo icon on the LEFT
 * - "Shopivo" wordmark immediately on the RIGHT
 * - Preserves exact aspect ratio and vertical alignment
 * - Fully responsive and theme-adaptive
 */

import React from 'react'
import { Link } from 'react-router-dom'
import shopivoLogo from '@/assets/shopivo-logo.png'

const SIZES = {
  sm: { img: 26, font: '1.05rem', gap: '0.45rem' },
  md: { img: 32, font: '1.2rem',  gap: '0.55rem' },
  lg: { img: 38, font: '1.35rem', gap: '0.65rem' },
  xl: { img: 46, font: '1.55rem', gap: '0.75rem' },
}

const BrandLogo = ({
  size = 'md',
  showWordmark = true,
  to = '/',
  className = '',
  style = {},
  imgStyle = {},
  textStyle = {},
  subtitle = null,
  subtitleStyle = {},
  ariaLabel = 'Shopivo Home',
}) => {
  const config = typeof size === 'string' ? SIZES[size] || SIZES.md : { img: size, font: `${size * 0.95}px`, gap: '0.55rem' }

  const content = (
    <div
      className={`shopivo-brand-lockup ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: config.gap,
        textDecoration: 'none',
        userSelect: 'none',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {/* Official Shopivo Logo Icon */}
      <img
        src={shopivoLogo}
        alt="Shopivo Logo"
        width={config.img}
        height={config.img}
        style={{
          width: `${config.img}px`,
          height: `${config.img}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          ...imgStyle,
        }}
        loading="eager"
      />

      {/* Shopivo Wordmark */}
      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span
            className="shopivo-brand-wordmark"
            style={{
              fontWeight: '800',
              fontSize: config.font,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              ...textStyle,
            }}
          >
            Shopivo
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-text-disabled)',
                marginTop: '1px',
                lineHeight: 1,
                ...subtitleStyle,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'inline-flex' }} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  }

  return content
}

export default React.memo(BrandLogo)
