'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { themes, getTheme, ThemeId, Theme } from './themes'

interface ThemeContextType {
  theme: Theme
  themeId: ThemeId
  setThemeId: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.petid,
  themeId: 'petid',
  setThemeId: () => {}
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('petid')

  useEffect(() => {
    const saved = localStorage.getItem('petid-theme') as ThemeId
    if (saved && themes[saved]) setThemeId(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('petid-theme', themeId)
    const t = getTheme(themeId)
    const root = document.documentElement
    root.style.setProperty('--color-primary', t.primary)
    root.style.setProperty('--color-primary-light', t.primaryLight)
    root.style.setProperty('--color-primary-dark', t.primaryDark)
    root.style.setProperty('--color-accent', t.accent)
    root.style.setProperty('--color-bg', t.bg)
    root.style.setProperty('--color-bg-card', t.bgCard)
    root.style.setProperty('--color-text', t.text)
    root.style.setProperty('--color-text-muted', t.textMuted)
    root.style.setProperty('--color-border', t.border)
  }, [themeId])

  return (
    <ThemeContext.Provider value={{ theme: getTheme(themeId), themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
