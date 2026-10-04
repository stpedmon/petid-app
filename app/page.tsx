'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { PawPrint } from 'lucide-react'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else {
        const onboarded = localStorage.getItem('petid_onboarded')
        router.replace(onboarded ? '/dashboard' : '/onboarding')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0f1a' }}>
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, #1B6B4A, #2ECC71)' }}
      >
        <PawPrint size={32} color="#fff" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white/30 text-sm font-medium"
      >
        Cargando...
      </motion.p>
    </div>
  )
}
