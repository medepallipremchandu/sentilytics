import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const ThemeContext = createContext({
  mode: 'dark',
  setMode: () => {},
  toggleMode: () => {},
})

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('voxintent-theme') || 'dark')

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('theme-dark', 'theme-light')
    html.classList.add(mode === 'light' ? 'theme-light' : 'theme-dark')
    html.style.colorScheme = mode
    localStorage.setItem('voxintent-theme', mode)
  }, [mode])

  const value = useMemo(() => ({
    mode,
    setMode,
    toggleMode: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
  }), [mode])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

export const ThemeSwitcher = () => {
  const { mode, toggleMode } = useTheme()
  const isLight = mode === 'light'
  return (
    <button
      type="button"
      onClick={toggleMode}
      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 hover:bg-slate-800"
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className="inline-flex items-center gap-2 text-sm">
        {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        {isLight ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}
