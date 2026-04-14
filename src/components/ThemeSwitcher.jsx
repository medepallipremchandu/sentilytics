import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Moon, Palette, Sun } from 'lucide-react'
import { BRAND_BLUE, BRAND_GREEN } from '../lib/branding'

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
    else {
      html.classList.add('theme-light', 'theme-brand')
    }
    html.style.colorScheme = mode === 'dark' ? 'dark' : 'light'
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

export const BrandColorCodes = () => (
  <div
    className="brand-color-codes flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-slate-200/90 bg-white/90 px-2 py-1 text-[9px] shadow-sm sm:text-[10px]"
    title="Official brand colors"
  >
    <span className="inline-flex items-center gap-1.5 font-mono text-slate-700">
      <span className="h-3 w-3 rounded-sm border border-slate-300/80 shadow-sm" style={{ backgroundColor: BRAND_BLUE }} aria-hidden />
      <span>Blue {BRAND_BLUE}</span>
    </span>
    <span className="text-slate-300" aria-hidden>
      |
    </span>
    <span className="inline-flex items-center gap-1.5 font-mono text-slate-700">
      <span className="h-3 w-3 rounded-sm border border-slate-300/80 shadow-sm" style={{ backgroundColor: BRAND_GREEN }} aria-hidden />
      <span>Green {BRAND_GREEN}</span>
    </span>
  </div>
)

const THEME_OPTIONS = [
  {
    id: 'brand',
    label: 'Brand',
    icon: Palette,
    title: `Brand theme · Blue ${BRAND_BLUE} · Green ${BRAND_GREEN}`,
  },
  { id: 'light', label: 'Light', icon: Sun, title: 'Light mode' },
  { id: 'dark', label: 'Dark', icon: Moon, title: 'Dark mode' },
]

export const ThemeSwitcher = () => {
  const { mode, setMode } = useTheme()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Choose theme"
        className="theme-switcher-trigger flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 p-0 shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0970b8]/50 sm:h-11 sm:w-11"
      >
        <span
          className="theme-switcher-gradient flex h-full w-full items-center justify-center rounded-[10px]"
          style={{
            background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_BLUE} 100%)`,
          }}
          aria-hidden
        >
          <Palette className="h-[42%] w-[42%] min-h-[1.1rem] min-w-[1.1rem] text-white drop-shadow" strokeWidth={2.25} />
        </span>
        <span className="sr-only">Theme menu</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Theme"
          className="profile-menu theme-switcher-menu absolute right-0 z-[60] mt-1.5 min-w-[12rem] rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl"
        >
          {THEME_OPTIONS.map(({ id, label, icon: Icon, title }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              title={title}
              aria-selected={mode === id}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                mode === id
                  ? 'bg-slate-800/90 text-white'
                  : 'text-slate-200 hover:bg-slate-800'
              }`}
              onClick={() => {
                setMode(id)
                setOpen(false)
              }}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="flex-1">{label}</span>
              {mode === id ? <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
