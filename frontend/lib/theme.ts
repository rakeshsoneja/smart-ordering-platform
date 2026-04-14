import { appConfig } from './config'

export type ThemeKey = 'default' | 'sweetshop'

export type AppTheme = {
  primary: string
  primaryHover: string
  primaryLight: string
  primaryMuted: string
  textPrimary: string
  textSecondary: string
  gradientFrom: string
  gradientTo: string
  softBackground: string
  metaThemeColor: string
}

export const THEMES: Record<ThemeKey, AppTheme> = {
  default: {
    primary: '#FF6A3D',
    primaryHover: '#FF5A2D',
    primaryLight: '#FFF1EB',
    primaryMuted: '#FFB49E',
    textPrimary: '#1A1A1A',
    textSecondary: '#555555',
    gradientFrom: '#FF6A3D',
    gradientTo: '#FF3D68',
    softBackground: '#FFF7F3',
    metaThemeColor: '#FF6A3D',
  },
  sweetshop: {
    primary: '#2E7D32',
    primaryHover: '#2E7D32',
    primaryLight: '#E8F5E9',
    primaryMuted: '#A5D6A7',
    textPrimary: '#1A1A1A',
    textSecondary: '#555555',
    gradientFrom: '#2E7D32',
    gradientTo: '#2E7D32',
    softBackground: '#F3FFF5',
    metaThemeColor: '#2E7D32',
  },
}

export function getAppTheme(themeKey = appConfig.themeKey): AppTheme {
  const normalized = (themeKey || '').trim().toLowerCase() as ThemeKey
  return THEMES[normalized] || THEMES.default
}

