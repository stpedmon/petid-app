'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, userRole, loading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()

  const hasAccess = allowedRoles.includes(userRole || 'owner')

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
    if (!loading && user && !hasAccess) {
      router.replace('/dashboard')
    }
  }, [loading, user, hasAccess, router])

  if (loading || !user || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return <>{children}</>
}
