import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
export const THEME_STORAGE_KEY = 'fincorder_theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let currentTheme: Theme = getInitialTheme()
const listeners = new Set<() => void>()

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function setTheme(theme: Theme) {
  currentTheme = theme
  if (typeof window !== 'undefined') window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  applyTheme(theme)
  listeners.forEach((listener) => listener())
}

export function initializeTheme() {
  currentTheme = getInitialTheme()
  applyTheme(currentTheme)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getThemeSnapshot() {
  return currentTheme
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => 'light')
  return { theme, toggleTheme: () => setTheme(currentTheme === 'dark' ? 'light' : 'dark') }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY) return
    initializeTheme()
    listeners.forEach((listener) => listener())
  })
}
