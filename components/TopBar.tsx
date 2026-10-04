'use client'
import Image from 'next/image'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { LogOut, Bell } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TopBar({ title }: { title?: string }) {
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
          className="flex items-center justify-between px-5 py-3 rounded-2xl glass"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}ee, ${theme.primaryDark}dd)`,
            boxShadow: `0 8px 32px ${theme.primary}30`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center p-1.5">
              <Image src="/petid-icon.svg" alt="PetID" width={24} height={24} className="brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight tracking-tight">
                {title || 'Pet ID'}
              </h1>
              <p className="text-white/60 text-[10px] font-medium tracking-wider uppercase">
                Digital Identity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform">
              <Bell size={18} color="rgba(255,255,255,0.85)" />
            </button>
            <button
              onClick={signOut}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform"
            >
              <LogOut size={18} color="rgba(255,255,255,0.85)" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
