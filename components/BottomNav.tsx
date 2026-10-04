'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PawPrint, Syringe, MoreHorizontal } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/pets', icon: PawPrint, label: 'Mascotas' },
  { href: '/vaccines', icon: Syringe, label: 'Vacunas' },
  { href: '/settings', icon: MoreHorizontal, label: 'Más' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { theme } = useTheme()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/pets') return pathname.startsWith('/pet')
    if (href === '/vaccines') return pathname.startsWith('/vaccine') || pathname.startsWith('/vet')
    if (href === '/settings') return pathname.startsWith('/settings')
    return false
  }

  return (
    <motion.nav
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50 px-4 safe-bottom"
    >
      <div
        className="flex justify-around items-center h-[64px] rounded-2xl mx-auto max-w-md"
        style={{
          background: theme.bgCard,
          boxShadow: `0 -2px 20px rgba(0,0,0,0.06)`,
          border: `1px solid ${theme.border}`,
          marginBottom: '8px',
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-4 relative"
            >
              <motion.div whileTap={{ scale: 0.85 }}>
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full"
                    style={{ background: theme.primary }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  size={22}
                  color={active ? theme.primary : theme.textMuted}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </motion.div>
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? theme.primary : theme.textMuted }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
