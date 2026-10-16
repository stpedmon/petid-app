'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PawPrint, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

export const dynamic = 'force-dynamic'

interface Peek { pet_id: string; pet_name: string; photo_url: string | null; species: string; inviter_name: string; inviter_sex: string | null; valid: boolean }

export default function JoinPetPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [info, setInfo] = useState<Peek | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'accepting' | 'done' | 'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.rpc('peek_pet_invite', { p_code: code }).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : data
      if (!row) { setState('error'); setMsg('Este enlace no es válido.'); return }
      if (!row.valid) { setState('error'); setMsg('Esta invitación ya fue usada o expiró. Pide una nueva.'); return }
      setInfo(row as Peek)
      setState('ready')
    })
  }, [code])

  useEffect(() => {
    // Sin sesión: recordamos el código y mandamos a iniciar sesión / registrarse
    if (!authLoading && !user && state === 'ready') {
      try { localStorage.setItem('petid_join_code', code) } catch {}
      router.replace('/login')
    }
  }, [authLoading, user, state, code, router])

  const accept = async () => {
    setState('accepting')
    const { data, error } = await supabase.rpc('accept_pet_invite', { p_code: code })
    if (error) { setState('error'); setMsg(error.message || 'No pudimos aceptar la invitación.'); return }
    try { localStorage.removeItem('petid_join_code'); localStorage.setItem('petid_onboarded', 'true') } catch {}
    setState('done')
    setTimeout(() => router.replace(`/pet/${data}`), 900)
  }

  const inviterRole = info?.inviter_sex === 'female' ? 'la mamá' : info?.inviter_sex === 'male' ? 'el papá' : 'la familia'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FFF7E9' }}>
      {state === 'loading' || (state === 'ready' && (authLoading || !user)) ? (
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <PawPrint size={44} color="#FF6B6B" strokeWidth={1.5} />
        </motion.div>
      ) : state === 'error' ? (
        <>
          <p className="text-base font-semibold" style={{ color: '#1F1F1F' }}>{msg}</p>
          <button onClick={() => router.replace('/')} className="mt-4 px-6 py-3 rounded-xl text-white font-semibold text-sm" style={{ background: '#FF6B6B' }}>
            Ir a la app
          </button>
        </>
      ) : info && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 shadow-lg" style={{ background: '#FFE3E3', border: '4px solid #fff' }}>
            {info.photo_url ? (
              <img src={info.photo_url} alt={info.pet_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><PawPrint size={40} color="#FF6B6B" /></div>
            )}
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#1F1F1F' }}>{info.pet_name} te espera</h1>
          <p className="text-sm mt-2" style={{ color: '#6B6B6B' }}>
            <strong>{info.inviter_name}</strong>, {inviterRole} de {info.pet_name}, quiere compartir su perfil contigo.
            Tendrán la misma información de vacunas, salud y recordatorios.
          </p>

          {state === 'done' ? (
            <p className="mt-6 text-sm font-semibold flex items-center justify-center gap-2" style={{ color: '#2F7657' }}>
              <Heart size={16} /> Ya eres parte de la familia de {info.pet_name}
            </p>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={state === 'accepting'}
              onClick={accept}
              className="w-full mt-6 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
              style={{ background: '#FF6B6B', boxShadow: '0 6px 20px rgba(255,107,107,0.3)' }}
            >
              {state === 'accepting' ? 'Un momento...' : `Aceptar y ver a ${info.pet_name}`}
            </motion.button>
          )}
          <button onClick={() => router.replace('/')} className="mt-3 text-xs font-medium" style={{ color: '#9A948C' }}>Ahora no</button>
        </motion.div>
      )}
    </div>
  )
}
