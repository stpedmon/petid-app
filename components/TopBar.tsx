'use client'
import Image from 'next/image'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { LogOut, Bell } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TopBar({ title, compact }: { title?: string; compact?: boolean }) {
  const { theme } = useTheme()
  const { signOut } = useAuth()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 safe-top"
    >
      <div className="mx-3 mt-3">
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Image
              src="/petid-icon-color.png"
              alt="PetID"
              width={38}
              height={38}
              className="rounded-lg"
            />
            {!compact && (
            <div>
              <h1 className="font-extrabold text-[15px] leading-tight tracking-tight" style={{ color: theme.text }}>
                {title || (
                  <>
                    <span>Pet</span>
                    <span style={{ color: theme.primary }}>ID</span>
                  </>
                )}
              </h1>
              <p className="text-[9px] font-semibold tracking-[0.15em] uppercase" style={{ color: theme.textMuted }}>
                Siempre Contigo
              </p>
            </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: theme.primaryLight }}
            >
              <Bell size={18} color={theme.primary} strokeWidth={1.8} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={signOut}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#D94B5B12' }}
            >
              <LogOut size={18} color="#D94B5B" strokeWidth={1.8} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
