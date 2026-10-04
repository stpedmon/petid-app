'use client'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { themes, ThemeId } from '@/lib/themes'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Check, User, Palette, LogOut, ChevronRight, HelpCircle, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { theme, themeId, setThemeId } = useTheme()
  const { user, signOut } = useAuth()

  const themeList = Object.values(themes)

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar title="Ajustes" />

      <div className="px-5 py-5 space-y-4">
        {/* User card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 2px 12px ${theme.primary}06`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
          />
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})` }}
            >
              <User size={24} color={theme.primary} />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: theme.text }}>Mi Cuenta</h3>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Theme selector */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 2px 12px ${theme.primary}06`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${theme.primary}12` }}
            >
              <Palette size={18} color={theme.primary} />
            </div>
            <h3 className="font-bold" style={{ color: theme.text }}>Tema</h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {themeList.map(t => {
              const isSelected = themeId === t.id
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setThemeId(t.id)}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all"
                  style={{
                    borderColor: isSelected ? t.primary : theme.border,
                    background: isSelected ? `${t.primary}08` : 'transparent',
                    boxShadow: isSelected ? `0 4px 12px ${t.primary}20` : 'none',
                  }}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: t.primary }}
                    >
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </motion.div>
                  )}
                  <div
                    className="w-9 h-9 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                      boxShadow: `0 3px 8px ${t.primary}30`,
                    }}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: theme.text }}>
                    {t.emoji} {t.name}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Menu items */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
          }}
        >
          {[
            { icon: Shield, label: 'Privacidad', sub: 'Gestiona tus datos' },
            { icon: HelpCircle, label: 'Ayuda', sub: 'Centro de soporte' },
          ].map((item, i) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 px-5 py-4 text-left"
              style={{ borderBottom: i === 0 ? `1px solid ${theme.border}` : 'none' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${theme.primary}08` }}
              >
                <item.icon size={18} color={theme.textMuted} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: theme.text }}>{item.label}</p>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>{item.sub}</p>
              </div>
              <ChevronRight size={18} color={theme.textMuted} className="opacity-40" />
            </button>
          ))}
        </motion.div>

        {/* Sign out */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
          style={{
            border: `1.5px solid rgba(239,68,68,0.25)`,
            color: '#ef4444',
            background: 'rgba(239,68,68,0.04)',
          }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </motion.button>

        <p className="text-center text-[10px] pt-2" style={{ color: theme.textMuted }}>
          Pet ID v1.0 · Made with 🐾
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
