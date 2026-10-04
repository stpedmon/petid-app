'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Plus, Settings, PawPrint, QrCode, Syringe, X } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

const fabActions = [
  { href: '/pet/new', icon: PawPrint, label: 'Mascota', color: '#FF6B6B' },
  { href: '/vet/vaccinate', icon: Syringe, label: 'Vacuna', color: '#4ECDC4' },
  { href: '/scan', icon: QrCode, label: 'Escanear', color: '#FFD93D' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const [fabOpen, setFabOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  // Close FAB when navigating
  useEffect(() => {
    setFabOpen(false)
  }, [pathname])

  // Close FAB on outside click/touch
  useEffect(() => {
    if (!fabOpen) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [fabOpen])

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Inicio' },
    { href: '/settings', icon: Settings, label: 'Ajustes' },
  ]

  return (
    <>
      {/* Overlay backdrop */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-safe safe-bottom"
      >
        <div
          className="flex justify-around items-center h-[68px] rounded-2xl mx-auto max-w-md glass relative"
          style={{
            background: `${theme.bgCard}e8`,
            boxShadow: `0 -4px 30px ${theme.primary}10, 0 4px 20px rgba(0,0,0,0.08)`,
            border: `1px solid ${theme.border}80`,
            marginBottom: '8px',
          }}
        >
          {/* Left nav item */}
          <Link href={navItems[0].href} className="flex flex-col items-center gap-1 px-5 py-2">
            <motion.div whileTap={{ scale: 0.85 }} className="relative">
              {pathname.startsWith(navItems[0].href) && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full"
                  style={{ background: theme.primary }}
                />
              )}
              <Home
                size={22}
                color={pathname.startsWith(navItems[0].href) ? theme.primary : theme.textMuted}
                strokeWidth={pathname.startsWith(navItems[0].href) ? 2.2 : 1.5}
              />
            </motion.div>
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: pathname.startsWith(navItems[0].href) ? theme.primary : theme.textMuted }}
            >
              {navItems[0].label}
            </span>
          </Link>

          {/* Center FAB */}
          <div ref={fabRef} className="relative -mt-5">
            {/* FAB action items */}
            <AnimatePresence>
              {fabOpen && (
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-3">
                  {fabActions.map((action, i) => (
                    <motion.div
                      key={action.href}
                      initial={{ opacity: 0, y: 20, scale: 0.3 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          delay: i * 0.07,
                          type: 'spring',
                          stiffness: 400,
                          damping: 15,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        y: 10,
                        scale: 0.3,
                        transition: { delay: (fabActions.length - 1 - i) * 0.04, duration: 0.15 },
                      }}
                      className="flex items-center gap-3"
                    >
                      {/* Label pill */}
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.07 + 0.1 } }}
                        exit={{ opacity: 0, x: 10, transition: { duration: 0.1 } }}
                        className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg"
                        style={{
                          background: theme.bgCard,
                          color: theme.text,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        {action.label}
                      </motion.span>

                      {/* Icon circle */}
                      <button
                        onClick={() => {
                          setFabOpen(false)
                          router.push(action.href)
                        }}
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                        style={{
                          background: action.color,
                          boxShadow: `0 4px 15px ${action.color}50`,
                        }}
                      >
                        <action.icon size={22} color="#fff" strokeWidth={2} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Main FAB button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setFabOpen(!fabOpen)}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                boxShadow: `0 4px 15px ${theme.primary}40`,
              }}
            >
              <motion.div
                animate={{ rotate: fabOpen ? 135 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                {fabOpen ? (
                  <X size={24} color="#fff" strokeWidth={2.5} />
                ) : (
                  <Plus size={24} color="#fff" strokeWidth={2.5} />
                )}
              </motion.div>

              {/* Pulse ring when closed */}
              {!fabOpen && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ border: `2px solid ${theme.primary}` }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.button>
          </div>

          {/* Right nav item */}
          <Link href={navItems[1].href} className="flex flex-col items-center gap-1 px-5 py-2">
            <motion.div whileTap={{ scale: 0.85 }} className="relative">
              {pathname.startsWith(navItems[1].href) && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full"
                  style={{ background: theme.primary }}
                />
              )}
              <Settings
                size={22}
                color={pathname.startsWith(navItems[1].href) ? theme.primary : theme.textMuted}
                strokeWidth={pathname.startsWith(navItems[1].href) ? 2.2 : 1.5}
              />
            </motion.div>
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: pathname.startsWith(navItems[1].href) ? theme.primary : theme.textMuted }}
            >
              {navItems[1].label}
            </span>
          </Link>
        </div>
      </motion.nav>
    </>
  )
}
