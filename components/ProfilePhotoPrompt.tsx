'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { Camera, X, Heart, Upload, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  show: boolean
  onClose: () => void
}

export default function ProfilePhotoPrompt({ show, onClose }: Props) {
  const { user, refreshAvatar } = useAuth()
  const { theme } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!file || !user) return
    setUploading(true)
    setUploadError(null)
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

      // Upload to storage
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

      // Update user record via RPC (bypasses view/RLS issues)
      const { error: rpcError } = await supabase.rpc('update_avatar_url', {
        new_avatar_url: avatarUrl,
      })
      if (rpcError) throw new Error(`DB: ${rpcError.message}`)

      await refreshAvatar()
      setDone(true)
      localStorage.setItem('petid_avatar_prompted', '1')
      setTimeout(() => {
        onClose()
        setDone(false)
        setPreview(null)
        setFile(null)
      }, 1500)
    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      setUploadError(err.message || 'Error al subir la foto')
    }
    setUploading(false)
  }

  const handleSkip = () => {
    localStorage.setItem('petid_avatar_prompted', '1')
    onClose()
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            onClick={handleSkip}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-3xl safe-bottom"
            style={{ background: theme.bgCard }}
          >
            <div className="p-6 pb-8">
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: theme.border }} />

              {/* Close */}
              <button
                onClick={handleSkip}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: theme.bg }}
              >
                <X size={16} color={theme.textMuted} />
              </button>

              {/* Done state */}
              {done ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: '#2E9D6815' }}
                  >
                    <Check size={36} color="#2E9D68" strokeWidth={2.5} />
                  </motion.div>
                  <p className="text-lg font-bold" style={{ color: theme.text }}>¡Perfecto!</p>
                  <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Tu foto de perfil fue actualizada</p>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.accent}20)` }}
                    >
                      <Heart size={28} color={theme.primary} strokeWidth={1.8} />
                    </motion.div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: theme.text }}>
                      ¡Agrega tu foto!
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                      Sube una foto con el consentido de la casa 🐾
                    </p>
                  </div>

                  {/* Photo preview / picker */}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {preview ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-4 mb-6"
                    >
                      <div
                        className="w-32 h-32 rounded-full overflow-hidden"
                        style={{ border: `3px solid ${theme.primary}` }}
                      >
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="text-xs font-semibold"
                        style={{ color: theme.primary }}
                      >
                        Cambiar foto
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl mb-4"
                      style={{ background: theme.bg, border: `1.5px dashed ${theme.primary}40` }}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: theme.primaryLight }}
                      >
                        <Camera size={24} color={theme.primary} strokeWidth={1.8} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold" style={{ color: theme.text }}>
                          Tomar o elegir foto
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
                          Aparecerá en tu perfil y tarjetas
                        </p>
                      </div>
                    </motion.button>
                  )}

                  {uploadError && (
                    <p className="text-xs font-medium text-center mb-2" style={{ color: '#ef4444' }}>{uploadError}</p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2.5">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={preview ? handleUpload : () => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                      style={{
                        background: preview
                          ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                          : theme.primary,
                        opacity: uploading ? 0.7 : 1,
                      }}
                    >
                      {uploading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Upload size={16} />
                        </motion.div>
                      ) : preview ? (
                        <>
                          <Upload size={16} />
                          Guardar foto
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          Seleccionar foto
                        </>
                      )}
                    </motion.button>

                    <button
                      onClick={handleSkip}
                      className="w-full py-3 text-sm font-medium"
                      style={{ color: theme.textMuted }}
                    >
                      Ahora no
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
