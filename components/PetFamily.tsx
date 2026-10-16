'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Copy, Check, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'

interface Member { user_id: string; full_name: string; avatar_url: string | null; sex: string | null; is_primary: boolean }

const roleLabel = (sex: string | null, isPrimary: boolean) =>
  sex === 'female' ? 'Mamá' : sex === 'male' ? 'Papá' : isPrimary ? 'Dueño principal' : 'Familia'

export default function PetFamily({ petId, petName }: { petId: string; petName: string }) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await supabase.rpc('pet_family', { p_pet_id: petId })
    setMembers((data as Member[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [petId]) // eslint-disable-line react-hooks/exhaustive-deps

  const me = members.find(m => m.user_id === user?.id)
  const isPrimary = !!me?.is_primary
  const link = code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pet/join/${code}` : ''
  const waText = `Te invito a compartir el perfil de ${petName} en PetID. Así los dos tenemos la misma información de vacunas, salud y recordatorios: ${link}`

  const openInvite = async () => {
    setError('')
    setInviteOpen(true)
    if (code) return
    setCreating(true)
    const { data, error: err } = await supabase.rpc('create_pet_invite', { p_pet_id: petId })
    if (err) setError('No pudimos crear la invitación. Intenta de nuevo.')
    else setCode(data as string)
    setCreating(false)
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }

  const remove = async (userId: string) => {
    const { error: err } = await supabase.rpc('remove_pet_owner', { p_pet_id: petId, p_user_id: userId })
    if (!err) load()
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: theme.text }}>
          <Users size={16} color={theme.primary} /> Familia
        </h3>
        {members.length < 2 && (
          <button onClick={openInvite} className="text-xs font-semibold flex items-center gap-1" style={{ color: theme.primary }}>
            <UserPlus size={14} /> Invitar
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs" style={{ color: theme.textMuted }}>Cargando...</p>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.user_id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: theme.primaryLight }}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold" style={{ color: theme.primary }}>{m.full_name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>
                  {m.full_name}{m.user_id === user?.id ? ' (tú)' : ''}
                </p>
                <p className="text-xs" style={{ color: theme.textMuted }}>{roleLabel(m.sex, m.is_primary)}</p>
              </div>
              {isPrimary && !m.is_primary && (
                <button onClick={() => remove(m.user_id)} aria-label="Quitar" className="p-2 rounded-lg" style={{ color: theme.textMuted }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {members.length < 2 && (
            <button
              onClick={openInvite}
              className="w-full mt-2 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: theme.primaryLight, color: theme.primary, border: `1px dashed ${theme.primary}55` }}
            >
              <UserPlus size={16} />
              {me?.sex === 'female' ? `Invitar al papá de ${petName}` : me?.sex === 'male' ? `Invitar a la mamá de ${petName}` : 'Compartir perfil con tu pareja'}
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {inviteOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center"
            style={{ background: 'rgba(31,31,31,0.45)' }}
            onClick={() => setInviteOpen(false)}
          >
            <motion.div
              initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl p-6 safe-bottom"
              style={{ background: theme.bgCard }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base" style={{ color: theme.text }}>Compartir el perfil de {petName}</h3>
                <button onClick={() => setInviteOpen(false)} aria-label="Cerrar" style={{ color: theme.textMuted }}><X size={20} /></button>
              </div>
              <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
                Quien abra este enlace y acepte verá y podrá editar la misma información de {petName}: vacunas, salud y recordatorios. Vence en 7 días.
              </p>

              {creating ? (
                <p className="text-sm" style={{ color: theme.textMuted }}>Generando enlace...</p>
              ) : error ? (
                <p className="text-sm" style={{ color: '#E55A5A' }}>{error}</p>
              ) : code && (
                <>
                  <div className="rounded-xl px-4 py-3 mb-3 flex items-center gap-2" style={{ background: theme.primaryLight }}>
                    <span className="flex-1 text-xs truncate font-mono" style={{ color: theme.text }}>{link}</span>
                    <button onClick={copy} aria-label="Copiar" className="p-1.5 rounded-lg" style={{ color: theme.primary }}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-center text-xs mb-4" style={{ color: theme.textMuted }}>
                    Código: <span className="font-bold tracking-widest" style={{ color: theme.text }}>{code}</span>
                  </p>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ background: '#25D366' }}
                  >
                    Enviar por WhatsApp
                  </a>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={() => navigator.share({ title: `PetID — ${petName}`, text: waText }).catch(() => {})}
                      className="w-full mt-2 py-3.5 rounded-xl font-semibold text-sm"
                      style={{ background: theme.primaryLight, color: theme.primary }}
                    >
                      Compartir de otra forma
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
