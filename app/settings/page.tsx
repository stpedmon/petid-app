'use client'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { themes, ThemeId } from '@/lib/themes'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Check, User, Palette } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { theme, themeId, setThemeId } = useTheme()
  const { user, signOut } = useAuth()

  const themeList = Object.values(themes)

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.bg }}>
      <TopBar title="Ajustes" />

      <div className="px-5 py-6 space-y-5">
        {/* User info */}
        <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
          <div className="flex items-center gap-3 mb-3">
            <User size={20} color={theme.primary} />
            <h3 className="font-semibold" style={{ color: theme.text }}>Mi cuenta</h3>
          </div>
          <p className="text-sm" style={{ color: theme.textMuted }}>{user?.email}</p>
        </div>

        {/* Theme selector */}
        <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} color={theme.primary} />
            <h3 className="font-semibold" style={{ color: theme.text }}>Tema</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {themeList.map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className="relative flex flex-col items-center gap-2 p-3 rounded-xl border-2"
                style={{
                  borderColor: themeId === t.id ? t.primary : theme.border,
                  background: themeId === t.id ? t.primaryLight : 'transparent',
                }}
              >
                {themeId === t.id && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: t.primary }}>
                    <Check size={12} color="#fff" />
                  </div>
                )}
                <div className="w-8 h-8 rounded-full" style={{ background: t.primary }} />
                <span className="text-xs font-medium" style={{ color: theme.text }}>
                  {t.emoji} {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full py-3 rounded-xl text-sm font-medium border"
          style={{ borderColor: '#ef4444', color: '#ef4444', background: theme.bgCard }}
        >
          Cerrar sesión
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
