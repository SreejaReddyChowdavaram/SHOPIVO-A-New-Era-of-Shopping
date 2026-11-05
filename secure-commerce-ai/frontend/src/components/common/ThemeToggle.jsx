import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

/**
 * ThemeToggle.jsx — Reusable Theme Toggle Button
 * Supports single global theme switching between Light and Dark modes.
 */
const ThemeToggle = ({ className = 'theme-toggle-btn', style, size = 18 }) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={style}
    >
      {theme === 'dark' ? (
        <Sun size={size} strokeWidth={2} />
      ) : (
        <Moon size={size} strokeWidth={2} />
      )}
    </button>
  )
}

export default ThemeToggle
