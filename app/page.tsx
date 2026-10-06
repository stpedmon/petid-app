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
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#FFF7E9' }}>
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mb-4"
      >
        <PawPrint size={48} color="#FF6B6B" strokeWidth={1.5} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm font-medium"
        style={{ color: '#FF6B6B80' }}
      >
        Cargando...
      </motion.p>
    </div>
  )
}
