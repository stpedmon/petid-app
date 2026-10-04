export type ThemeId = 'petid' | 'forest' | 'ocean' | 'sunset' | 'lavender' | 'midnight' | 'rose' | 'coffee' | 'arctic' | 'mint'

export interface Theme {
  id: ThemeId
  name: string
  primary: string
  primaryLight: string
  primaryDark: string
  accent: string
  bg: string
  bgCard: string
  text: string
  textMuted: string
  border: string
}

export const themes: Record<ThemeId, Theme> = {
  petid: {
    id: 'petid', name: 'PetID',
    primary: '#FF6B6B', primaryLight: '#FFF0F0', primaryDark: '#E55A5A',
    accent: '#FFC857', bg: '#FFF7E9', bgCard: '#FFFFFF',
    text: '#1F1F1F', textMuted: '#6B6B6B', border: '#E8E0D4'
  },
  forest: {
    id: 'forest', name: 'Bosque',
    primary: '#1B6B4A', primaryLight: '#e8f5ef', primaryDark: '#145236',
    accent: '#2ECC71', bg: '#f0f7f4', bgCard: '#ffffff',
    text: '#1a1a2e', textMuted: '#6b7c8a', border: '#e0ebe5'
  },
  ocean: {
    id: 'ocean', name: 'Océano',
    primary: '#1565C0', primaryLight: '#e3f0fc', primaryDark: '#0D47A1',
    accent: '#42A5F5', bg: '#f0f5fb', bgCard: '#ffffff',
    text: '#1a1a2e', textMuted: '#6b7c8a', border: '#dce8f5'
  },
  sunset: {
    id: 'sunset', name: 'Atardecer',
    primary: '#E65100', primaryLight: '#fff3e0', primaryDark: '#BF360C',
    accent: '#FF9800', bg: '#fdf6f0', bgCard: '#ffffff',
    text: '#1a1a2e', textMuted: '#6b7c8a', border: '#f0e0d0'
  },
  lavender: {
    id: 'lavender', name: 'Lavanda',
    primary: '#7B1FA2', primaryLight: '#f3e5f5', primaryDark: '#6A1B9A',
    accent: '#CE93D8', bg: '#f8f0fc', bgCard: '#ffffff',
    text: '#1a1a2e', textMuted: '#6b7c8a', border: '#e8d5f0'
  },
  midnight: {
    id: 'midnight', name: 'Medianoche',
    primary: '#1a1a2e', primaryLight: '#2d2d44', primaryDark: '#12121f',
    accent: '#6C63FF', bg: '#0f0f1a', bgCard: '#1a1a2e',
    text: '#e8e8f0', textMuted: '#8888aa', border: '#2a2a40'
  },
  rose: {
    id: 'rose', name: 'Rosa',
    primary: '#E91E63', primaryLight: '#fce4ec', primaryDark: '#C2185B',
    accent: '#F48FB1', bg: '#fdf0f4', bgCard: '#ffffff',
    text: '#1a1a2e', textMuted: '#6b7c8a', border: '#f0d5e0'
  },
  coffee: {
    id: 'coffee', name: 'Café',
    primary: '#5D4037', primaryLight: '#efebe9', primaryDark: '#3E2723',
    accent: '#A1887F', bg: '#f5f0ed', bgCard: '#ffffff',
    text: '#1a1a2e', textMuted: '#6b7c8a', border: '#e0d5d0'
  },
  arctic: {
    id: 'arctic', name: 'Ártico',
    primary: '#0097A7', primaryLight: '#e0f7fa', primaryDark: '#00838F',
    accent: '#4DD0E1', bg: '#f0fafb', bgCard: '#ffffff',
    text: '#1a1a2e', textMuted: '#6b7c8a', border: '#d5eef0'
  },
  mint: {
    id: 'mint', name: 'Menta',
    primary: '#00897B', primaryLight: '#e0f2f1', primaryDark: '#00695C',
    accent: '#80CBC4', bg: '#f0f9f8', bgCard: '#ffffff',
    text: '#1a1a2e', textMuted: '#6b7c8a', border: '#d5ebe8'
  }
}

export function getTheme(id: ThemeId): Theme {
  return themes[id] || themes.petid
}
