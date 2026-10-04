'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { ShieldAlert } from 'lucide-react'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, userRole, loading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return null

  if (!allowedRoles.includes(userRole || 'owner')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4" style={{ background: theme.bg }}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: theme.primaryLight }}
        >
          <ShieldAlert size={32} color={theme.primary} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: theme.text }}>
          Acceso restringido
        </h1>
        <p className="text-center text-sm" style={{ color: theme.textMuted }}>
          No tienes permisos para acceder a esta sección.
        </p>
        <button
          onClick={() => router.replace('/dashboard')}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: theme.primary }}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return <>{children}</>
}
