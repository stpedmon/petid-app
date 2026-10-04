'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  userRole: string | null
  userAvatarUrl: string | null
  loading: boolean
  signOut: () => Promise<void>
  refreshAvatar: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  userAvatarUrl: null,
  loading: true,
  signOut: async () => {},
  refreshAvatar: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async (userId: string) => {
    const { data } = await supabase
      .from('petid_users')
      .select('role, avatar_url')
      .eq('id', userId)
      .single()
    setUserRole(data?.role || 'owner')
    setUserAvatarUrl(data?.avatar_url || null)
  }

  const refreshAvatar = async () => {
    if (!user) return
    const { data } = await supabase
      .from('petid_users')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
    setUserAvatarUrl(data?.avatar_url || null)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchUserData(session.user.id)
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        await fetchUserData(session.user.id)
      } else {
        setUserRole(null)
        setUserAvatarUrl(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, userRole, userAvatarUrl, loading, signOut, refreshAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
