import { createContext, useContext, useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'secure-ai-theme'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
})

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // 1. Check saved preference
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
    // 2. System preference fallback
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore localStorage errors (e.g. private browsing storage limits)
    }
  }, [theme])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
