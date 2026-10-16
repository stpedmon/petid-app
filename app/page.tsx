'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import PetIDLoader from '@/components/PetIDLoader'

export const dynamic = 'force-dynamic'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else {
        const joinCode = localStorage.getItem('petid_join_code')
        if (joinCode) {
          router.replace(`/pet/join/${joinCode}`)
          return
        }
        const onboarded = localStorage.getItem('petid_onboarded')
        router.replace(onboarded ? '/dashboard' : '/onboarding')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#FFF7E9' }}>
      <PetIDLoader label="Cargando..." />
    </div>
  )
}
