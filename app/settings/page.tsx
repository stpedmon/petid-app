'use client'
import { useState, useRef } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { themes, ThemeId } from '@/lib/themes'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Check, User, Palette, LogOut, ChevronRight, HelpCircle, Shield, Trash2, AlertTriangle, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { theme, themeId, setThemeId } = useTheme()
  const { user, userAvatarUrl, signOut, refreshAvatar } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [avatarError, setAvatarError] = useState<string | null>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    setAvatarError(null)
    try {
      // Verify auth session is active
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesión expirada. Inicia sesión de nuevo.')

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${user.id}/avatar.${ext}`
      const mimeType = file.type || 'image/jpeg'

      // Read file as ArrayBuffer to avoid mobile browser issues
      const arrayBuffer = await file.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: mimeType })

      // Upload to Supabase Storage (avatars bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          upsert: true,
          contentType: mimeType,
        })
      if (uploadError) throw new Error(`Upload: ${uploadError.message}`)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      const avatarUrl = urlData.publicUrl + '?t=' + Date.now()

      // Save URL in DB via RPC (bypasses view/RLS issues)
      const { error: rpcError } = await supabase.rpc('update_avatar_url', {
        new_avatar_url: avatarUrl,
      })
      if (rpcError) throw new Error(`DB: ${rpcError.message}`)

      await refreshAvatar()
      localStorage.setItem('petid_avatar_prompted', '1')
    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      setAvatarError(err.message || 'Error al subir la foto')
    }
    setUploadingAvatar(false)
  }

  const themeList = Object.values(themes)

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'ELIMINAR') return
    setDeleting(true)
    try {
      // Delete user's pets, pet_owners links, vaccines, photos
      const { data: ownerData } = await supabase
        .from('petid_pet_owners')
        .select('pet_id')
        .eq('user_id', user.id)

      if (ownerData && ownerData.length > 0) {
        const petIds = ownerData.map((o: any) => o.pet_id)

        // Delete vaccine records
        await supabase.from('petid_vaccine_records').delete().in('pet_id', petIds)

        // Delete pet photos
        await supabase.from('petid_pet_photos').delete().in('pet_id', petIds)

        // Delete pet_owners links
        await supabase.from('petid_pet_owners').delete().eq('user_id', user.id)

        // Delete pets
        await supabase.from('petid_pets').delete().in('id', petIds)
      }

      // Delete user record
      await supabase.from('petid_users').delete().eq('id', user.id)

      // Sign out
      await signOut()
      localStorage.removeItem('petid_onboarded')
      window.location.href = '/login'
    } catch (e) {
      console.error('Error deleting account:', e)
      alert('Error al eliminar la cuenta. Intenta de nuevo.')
    }
    setDeleting(false)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar title="Ajustes" />

      <div className="px-5 py-5 space-y-4">
        {/* User card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 2px 12px ${theme.primary}06`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{
                background: userAvatarUrl ? 'transparent' : `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})`,
                border: `2px solid ${theme.primary}30`,
              }}
            >
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={28} color={theme.primary} />
              )}
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: theme.primary, border: `2px solid ${theme.bgCard}` }}
              >
                <Camera size={12} color="#fff" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                </div>
              )}
            </motion.button>
            <div>
              <h3 className="font-bold" style={{ color: theme.text }}>Mi Cuenta</h3>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{user?.email}</p>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="text-[11px] font-semibold mt-1"
                style={{ color: theme.primary }}
              >
                {userAvatarUrl ? 'Cambiar foto' : 'Agregar foto'}
              </button>
              {avatarError && (
                <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#ef4444' }}>{avatarError}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Theme selector */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 2px 12px ${theme.primary}06`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${theme.primary}12` }}
            >
              <Palette size={18} color={theme.primary} />
            </div>
            <h3 className="font-bold" style={{ color: theme.text }}>Tema</h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {themeList.map(t => {
              const isSelected = themeId === t.id
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setThemeId(t.id)}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all"
                  style={{
                    borderColor: isSelected ? t.primary : theme.border,
                    background: isSelected ? `${t.primary}08` : 'transparent',
                    boxShadow: isSelected ? `0 4px 12px ${t.primary}20` : 'none',
                  }}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: t.primary }}
                    >
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </motion.div>
                  )}
                  <div
                    className="w-9 h-9 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                      boxShadow: `0 3px 8px ${t.primary}30`,
                    }}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: theme.text }}>
                    {t.name}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Menu items */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
          }}
        >
          {[
            { icon: Shield, label: 'Privacidad', sub: 'Gestiona tus datos' },
            { icon: HelpCircle, label: 'Ayuda', sub: 'Centro de soporte' },
          ].map((item, i) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 px-5 py-4 text-left"
              style={{ borderBottom: i === 0 ? `1px solid ${theme.border}` : 'none' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${theme.primary}08` }}
              >
                <item.icon size={18} color={theme.textMuted} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: theme.text }}>{item.label}</p>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>{item.sub}</p>
              </div>
              <ChevronRight size={18} color={theme.textMuted} className="opacity-40" />
            </button>
          ))}
        </motion.div>

        {/* Sign out */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
          style={{
            border: `1.5px solid rgba(239,68,68,0.25)`,
            color: '#ef4444',
            background: 'rgba(239,68,68,0.04)',
          }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </motion.button>

        {/* Delete account */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium"
          style={{
            color: theme.textMuted,
          }}
        >
          <Trash2 size={14} />
          Eliminar mi cuenta y datos
        </motion.button>

        <p className="text-center text-[10px] pt-2" style={{ color: theme.textMuted }}>
          Pet ID v1.0
        </p>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={() => !deleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 relative"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
            >
              <div className="text-center mb-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                >
                  <AlertTriangle size={32} color="#ef4444" />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: theme.text }}>
                  Eliminar Cuenta
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                  Esta acción eliminará permanentemente tu cuenta, todas tus mascotas registradas, historial de vacunas y fotos. Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="mb-4">
                <label className="text-[11px] font-semibold block mb-2" style={{ color: theme.textMuted }}>
                  Escribe <span style={{ color: '#ef4444' }}>ELIMINAR</span> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none"
                  style={{
                    background: theme.bg,
                    border: `1.5px solid ${deleteConfirmText === 'ELIMINAR' ? '#ef4444' : theme.border}`,
                    color: theme.text,
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'ELIMINAR' || deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-opacity"
                  style={{
                    background: deleteConfirmText === 'ELIMINAR' ? '#ef4444' : '#999',
                    opacity: deleteConfirmText === 'ELIMINAR' ? 1 : 0.4,
                  }}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
