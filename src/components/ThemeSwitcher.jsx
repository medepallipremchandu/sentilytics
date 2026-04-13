import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Moon, Palette, Sun } from 'lucide-react'

const ThemeContext = createContext({
  mode: 'brand',
  setMode: () => {},
})

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('sentilytics-theme') || 'brand')

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('theme-dark', 'theme-light', 'theme-brand')
    if (mode === 'light') html.classList.add('theme-light')
    else if (mode === 'dark') html.classList.add('theme-dark')
    else html.classList.add('theme-brand')
    html.style.colorScheme = mode === 'light' ? 'light' : 'dark'
    localStorage.setItem('sentilytics-theme', mode)
  }, [mode])

  const value = useMemo(() => ({
    mode,
    setMode,
  }), [mode])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

export const ThemeSwitcher = () => {
  const { mode, setMode } = useTheme()
  const options = [
    { id: 'brand', label: 'Brand', icon: Palette, title: 'Sentilytics brand theme (green/blue)', activeClass: 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)]' },
    { id: 'light', label: 'Light', icon: Sun, title: 'Switch to light mode', activeClass: 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.3)]' },
    { id: 'dark', label: 'Dark', icon: Moon, title: 'Switch to dark mode', activeClass: 'bg-slate-700 text-white shadow-[0_0_14px_rgba(148,163,184,0.25)]' },
  ]

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1">
      {options.map(({ id, label, icon: Icon, title, activeClass }) => (
        <button
          key={id}
          type="button"
          onClick={() => setMode(id)}
          aria-label={label}
          className={`inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-xs transition-all sm:px-2.5 ${
            mode === id
              ? activeClass
              : 'text-slate-300 hover:bg-slate-800/90'
          }`}
          title={title}
        >
          <span className="inline-flex items-center gap-1 sm:gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden text-[11px] font-medium sm:inline">{label}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
