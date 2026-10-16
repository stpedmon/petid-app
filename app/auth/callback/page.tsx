'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PawPrint } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ensureProfile } from '@/lib/ensureProfile'

export const dynamic = 'force-dynamic'

/**
 * Página de retorno para Google / Apple / Microsoft.
 * supabase-js detecta el `?code=` en la URL y completa el intercambio PKCE
 * en el navegador; aquí solo esperamos la sesión, creamos el perfil si falta
 * y enviamos al usuario a la app.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let done = false
    const finish = async (userId?: string) => {
      if (done) return
      done = true
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await ensureProfile(user)
      router.replace('/')
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) {
      setFailed(true)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        finish(session.user.id)
      }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) finish(session.user.id)
    })
    const timeout = setTimeout(() => { if (!done) setFailed(true) }, 12000)

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FFF7E9' }}>
      {failed ? (
        <>
          <p className="text-base font-semibold" style={{ color: '#1F1F1F' }}>No pudimos completar el inicio de sesión.</p>
          <button
            onClick={() => router.replace('/login')}
            className="mt-4 px-6 py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: '#FF6B6B' }}
          >
            Volver a intentar
          </button>
        </>
      ) : (
        <>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
            <PawPrint size={44} color="#FF6B6B" strokeWidth={1.5} />
          </motion.div>
          <p className="mt-4 text-sm font-medium" style={{ color: '#FF6B6B99' }}>Conectando tu cuenta...</p>
        </>
      )}
    </div>
  )
}
