'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, PawPrint, Heart, MoreHorizontal, X, Settings, HelpCircle, Shield, QrCode } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const mainNavItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/pets', icon: PawPrint, label: 'Mascotas' },
  { href: '/vaccines', icon: Heart, label: 'Salud' },
]

const moreMenuItems = [
  { href: '/settings', icon: Settings, label: 'Configuración', color: '#FF6B6B' },
  { href: '/vet', icon: Shield, label: 'Panel Vet', color: '#2E9D68' },
  { href: '#', icon: QrCode, label: 'Escanear QR', color: '#4D91C6' },
  { href: '#', icon: HelpCircle, label: 'Ayuda', color: '#F0A62B' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const [showMore, setShowMore] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/pets') return pathname.startsWith('/pet')
    if (href === '/vaccines') return pathname.startsWith('/vaccine') || pathname.startsWith('/vet')
    return false
  }

  const isMoreActive = pathname.startsWith('/settings')

  return (
    <>
      {/* Overlay backdrop */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating menu items */}
      <AnimatePresence>
        {showMore && (
          <div className="fixed bottom-[84px] right-4 z-50 flex flex-col items-end gap-3">
            {moreMenuItems.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{
                  delay: i * 0.05,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                onClick={() => {
                  setShowMore(false)
                  if (item.href !== '#') router.push(item.href)
                }}
                className="flex items-center gap-3"
              >
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="text-[13px] font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                  style={{
                    background: theme.bgCard,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {item.label}
                </motion.span>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }}
                >
                  <item.icon size={20} color={item.color} strokeWidth={1.8} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Bottom navigation bar */}
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
            boxShadow: '0 -2px 20px rgba(0,0,0,0.06)',
            border: `1px solid ${theme.border}`,
            marginBottom: '8px',
          }}
        >
          {mainNavItems.map((item) => {
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

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-4 relative"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              animate={{ rotate: showMore ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {(isMoreActive && !showMore) && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full"
                  style={{ background: theme.primary }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {showMore ? (
                <X
                  size={22}
                  color={theme.primary}
                  strokeWidth={2.2}
                />
              ) : (
                <MoreHorizontal
                  size={22}
                  color={isMoreActive ? theme.primary : theme.textMuted}
                  strokeWidth={isMoreActive ? 2.2 : 1.8}
                />
              )}
            </motion.div>
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: showMore || isMoreActive ? theme.primary : theme.textMuted }}
            >
              Más
            </span>
          </button>
        </div>
      </motion.nav>
    </>
  )
}
