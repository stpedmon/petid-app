'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, Settings } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/pet/new', icon: PlusCircle, label: 'Nueva', isCenter: true },
  { href: '/settings', icon: Settings, label: 'Ajustes' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { theme } = useTheme()

  return (
    <motion.nav
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-safe safe-bottom"
    >
      <div
        className="flex justify-around items-center h-[68px] rounded-2xl mx-auto max-w-md glass"
        style={{
          background: `${theme.bgCard}e8`,
          boxShadow: `0 -4px 30px ${theme.primary}10, 0 4px 20px rgba(0,0,0,0.08)`,
          border: `1px solid ${theme.border}80`,
          marginBottom: '8px',
        }}
      >
        {navItems.map(({ href, icon: Icon, label, isCenter }) => {
          const active = pathname.startsWith(href)

          if (isCenter) {
            return (
              <Link key={href} href={href} className="relative -mt-5">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                    boxShadow: `0 4px 15px ${theme.primary}40`,
                  }}
                >
                  <Icon size={24} color="#fff" strokeWidth={2} />
                </motion.div>
              </Link>
            )
          }

          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-5 py-2">
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative"
              >
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full"
                    style={{ background: theme.primary }}
                  />
                )}
                <Icon
                  size={22}
                  color={active ? theme.primary : theme.textMuted}
                  strokeWidth={active ? 2.2 : 1.5}
                />
              </motion.div>
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? theme.primary : theme.textMuted }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
