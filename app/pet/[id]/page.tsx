'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, CreditCard, Syringe, FileText, Share2, QrCode, Camera, PawPrint, Plus, Save, X, Pencil, ImageIcon, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'

interface Pet {
  id: string; name: string; nickname: string | null; species: string; breed: string; sex: string;
  date_of_birth: string | null; color: string | null; weight_kg: number | null;
  microchip_number: string | null; photo_url: string | null;
  hobbies: string[] | null; personality_tags: string[] | null;
}

interface VaxRecord {
  id: string; applied_date: string; next_dose_date: string | null;
  veterinarian_name: string | null; certificate_number: string | null;
  vaccine: { name: string };
}

interface AdventurePhoto {
  id: string; photo_url: string; caption: string | null; created_at: string;
}

// Compress image helper
function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => blob ? resolve(blob) : reject('Compression failed'), 'image/jpeg', quality)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PetProfilePage() {
  const { theme } = useTheme()
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [pet, setPet] = useState<Pet | null>(null)
  const [vaxRecords, setVaxRecords] = useState<VaxRecord[]>([])
  const [adventurePhotos, setAdventurePhotos] = useState<AdventurePhoto[]>([])
  const [tab, setTab] = useState<'info' | 'vaccines' | 'photos' | 'card'>('info')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Pet>>({})
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingAdventure, setUploadingAdventure] = useState(false)
  const [adventureCaption, setAdventureCaption] = useState('')
  const [showCaptionInput, setShowCaptionInput] = useState(false)
  const [pendingAdventureFile, setPendingAdventureFile] = useState<File | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<AdventurePhoto | null>(null)

  const profilePhotoRef = useRef<HTMLInputElement>(null)
  const adventurePhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPet()
  }, [petId])

  useEffect(() => {
    if (tab === 'photos') fetchAdventurePhotos()
  }, [tab])

  const fetchPet = async () => {
    const { data } = await supabase
      .from('petid_pets')
      .select('*')
      .eq('id', petId)
      .single()
    if (data) setPet(data)

    const { data: vax } = await supabase
      .from('petid_vaccination_records')
      .select('*, vaccine:vaccine_id(name)')
      .eq('pet_id', petId)
      .order('applied_date', { ascending: false })
    if (vax) setVaxRecords(vax as any)

    setLoading(false)
  }

  const fetchAdventurePhotos = async () => {
    const { data } = await supabase
      .from('petid_pet_photos')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
    if (data) setAdventurePhotos(data)
  }

  const startEdit = () => {
    if (!pet) return
    setEditData({
      name: pet.name,
      nickname: pet.nickname,
      color: pet.color,
      weight_kg: pet.weight_kg,
      microchip_number: pet.microchip_number,
      date_of_birth: pet.date_of_birth,
    })
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditData({})
  }

  const saveEdit = async () => {
    if (!pet) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('petid_pets')
        .update({
          name: editData.name || pet.name,
          nickname: editData.nickname || null,
          color: editData.color || null,
          weight_kg: editData.weight_kg || null,
          microchip_number: editData.microchip_number || null,
          date_of_birth: editData.date_of_birth || null,
        })
        .eq('id', petId)
      if (error) throw error
      await fetchPet()
      setEditing(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Profile photo change
  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pet) return
    setUploadingPhoto(true)
    try {
      const compressed = await compressImage(file, 600, 0.8)
      const ext = 'jpg'
      const path = `profiles/${petId}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('pet-photos').upload(path, compressed, {
        contentType: 'image/jpeg', upsert: false,
      })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(path)
      const newUrl = urlData.publicUrl
      const { error: updErr } = await supabase
        .from('petid_pets')
        .update({ photo_url: newUrl })
        .eq('id', petId)
      if (updErr) throw updErr
      setPet({ ...pet, photo_url: newUrl })
    } catch (err: any) {
      alert(err.message || 'Error al subir foto')
    } finally {
      setUploadingPhoto(false)
      if (profilePhotoRef.current) profilePhotoRef.current.value = ''
    }
  }

  // Adventure photo upload
  const handleAdventurePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingAdventureFile(file)
    setShowCaptionInput(true)
  }

  const uploadAdventurePhoto = async () => {
    if (!pendingAdventureFile || !pet) return
    setUploadingAdventure(true)
    try {
      const compressed = await compressImage(pendingAdventureFile, 1200, 0.8)
      const path = `adventures/${petId}_${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('pet-photos').upload(path, compressed, {
        contentType: 'image/jpeg', upsert: false,
      })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(path)
      const { error: insErr } = await supabase.from('petid_pet_photos').insert({
        pet_id: petId,
        photo_url: urlData.publicUrl,
        caption: adventureCaption.trim() || null,
      })
      if (insErr) throw insErr
      setShowCaptionInput(false)
      setPendingAdventureFile(null)
      setAdventureCaption('')
      await fetchAdventurePhotos()
    } catch (err: any) {
      alert(err.message || 'Error al subir foto')
    } finally {
      setUploadingAdventure(false)
      if (adventurePhotoRef.current) adventurePhotoRef.current.value = ''
    }
  }

  const deleteAdventurePhoto = async (photo: AdventurePhoto) => {
    try {
      const { error } = await supabase.from('petid_pet_photos').delete().eq('id', photo.id)
      if (error) throw error
      setAdventurePhotos(prev => prev.filter(p => p.id !== photo.id))
      setViewingPhoto(null)
    } catch (err: any) {
      alert(err.message || 'Error al eliminar')
    }
  }

  const getAge = (dob: string | null) => {
    if (!dob) return null
    const diff = Date.now() - new Date(dob).getTime()
    const y = Math.floor(diff / 31536000000)
    const m = Math.floor((diff % 31536000000) / 2592000000)
    if (y > 0) return `${y} año${y > 1 ? 's' : ''}${m > 0 ? ` ${m} mes${m > 1 ? 'es' : ''}` : ''}`
    return `${m} mes${m !== 1 ? 'es' : ''}`
  }

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/public/pet/${petId}` : ''

  if (loading || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <PawPrint size={48} color={theme.primary} strokeWidth={1.5} />
        </motion.div>
      </div>
    )
  }

  const age = getAge(pet.date_of_birth)

  const tabs = [
    { key: 'info', label: 'Perfil', icon: FileText },
    { key: 'vaccines', label: 'Vacunas', icon: Syringe },
    { key: 'photos', label: 'Fotos', icon: ImageIcon },
    { key: 'card', label: 'Tarjeta', icon: CreditCard },
  ] as const

  // Helper: animated empty-state row for missing info
  const EmptyField = ({ label, onAdd }: { label: string; onAdd: () => void }) => (
    <motion.button
      onClick={onAdd}
      className="flex items-center justify-between w-full text-sm py-1"
      whileTap={{ scale: 0.97 }}
    >
      <span style={{ color: theme.textMuted }}>{label}</span>
      <motion.span
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: `${theme.primary}12`, color: theme.primary }}
      >
        <Plus size={12} /> Agregar
      </motion.span>
    </motion.button>
  )

  const infoRows: { label: string; value: string | null; field: string }[] = [
    { label: 'Especie', value: pet.species === 'canine' ? 'Perro' : 'Gato', field: 'species' },
    { label: 'Sexo', value: pet.sex === 'male' ? 'Macho' : 'Hembra', field: 'sex' },
    { label: 'Edad', value: age, field: 'date_of_birth' },
    { label: 'Color', value: pet.color, field: 'color' },
    { label: 'Peso', value: pet.weight_kg ? `${pet.weight_kg} kg` : null, field: 'weight_kg' },
    { label: 'Microchip', value: pet.microchip_number, field: 'microchip_number' },
  ]

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.bg }}>
      <TopBar title={pet.nickname || pet.name} />

      {/* Hidden file inputs */}
      <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
      <input ref={adventurePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleAdventurePhotoSelect} />

      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-sm" style={{ color: theme.primary }}>
            <ArrowLeft size={18} /> Mis mascotas
          </button>
          {!editing ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={startEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                color: '#fff',
                boxShadow: `0 4px 15px ${theme.primary}30`,
              }}
            >
              <Pencil size={14} /> Editar perfil
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={cancelEdit}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: theme.bgCard, color: theme.textMuted, border: `1px solid ${theme.border}` }}
              >
                <X size={14} /> Cancelar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={saveEdit}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  color: '#fff',
                }}
              >
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Pet header */}
        <div className="flex items-center gap-4 mb-5">
          {/* Tappable profile photo */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => profilePhotoRef.current?.click()}
            disabled={uploadingPhoto}
            className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl relative group"
            style={{ background: theme.primaryLight }}
          >
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Camera size={22} color={theme.textMuted} />
              </motion.div>
            )}
            {/* Overlay on hover/tap */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} color="#fff" />
            </div>
            {/* Uploading spinner */}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                />
              </div>
            )}
            {/* Small camera badge */}
            {!uploadingPhoto && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2"
                style={{ background: theme.primary, borderColor: theme.bg }}
              >
                <Camera size={12} color="#fff" />
              </div>
            )}
          </motion.button>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full text-lg font-bold bg-transparent outline-none px-2 py-1 rounded-lg"
                  style={{ color: theme.text, border: `1px solid ${theme.primary}50` }}
                />
                <input
                  type="text"
                  value={editData.nickname || ''}
                  onChange={e => setEditData({ ...editData, nickname: e.target.value })}
                  placeholder="Apodo (opcional)"
                  className="w-full text-sm bg-transparent outline-none px-2 py-1 rounded-lg"
                  style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold truncate" style={{ color: theme.text }}>{pet.name}</h2>
                {pet.nickname && (
                  <p className="text-sm" style={{ color: theme.primary }}>&ldquo;{pet.nickname}&rdquo;</p>
                )}
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  {pet.breed}{age ? ` • ${age}` : ''}
                </p>
                <p className="text-xs mt-0.5 font-mono" style={{ color: theme.textMuted }}>
                  ID: {pet.id.slice(0, 8)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: theme.primaryLight }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-medium"
              style={{
                background: tab === t.key ? theme.bgCard : 'transparent',
                color: tab === t.key ? theme.primary : theme.textMuted,
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {tab === 'info' && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 space-y-3" style={{ background: theme.bgCard }}>
              <h3 className="font-semibold" style={{ color: theme.text }}>Datos</h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Fecha de nacimiento</label>
                    <input type="date" value={editData.date_of_birth || ''}
                      onChange={e => setEditData({ ...editData, date_of_birth: e.target.value })}
                      className="w-full text-sm bg-transparent outline-none px-3 py-2 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Color</label>
                      <input type="text" value={editData.color || ''} placeholder="Ej: Dorado"
                        onChange={e => setEditData({ ...editData, color: e.target.value })}
                        className="w-full text-sm bg-transparent outline-none px-3 py-2 rounded-xl"
                        style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Peso (kg)</label>
                      <input type="number" step="0.1" value={editData.weight_kg || ''} placeholder="Ej: 8.5"
                        onChange={e => setEditData({ ...editData, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full text-sm bg-transparent outline-none px-3 py-2 rounded-xl"
                        style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Microchip</label>
                    <input type="text" value={editData.microchip_number || ''} placeholder="Número"
                      onChange={e => setEditData({ ...editData, microchip_number: e.target.value })}
                      className="w-full text-sm bg-transparent outline-none px-3 py-2 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                  </div>
                </div>
              ) : (
                <>
                  {infoRows.map(({ label, value }) => (
                    value ? (
                      <div key={label} className="flex justify-between text-sm">
                        <span style={{ color: theme.textMuted }}>{label}</span>
                        <span className="font-medium" style={{ color: theme.text }}>{value}</span>
                      </div>
                    ) : (
                      <EmptyField key={label} label={label} onAdd={startEdit} />
                    )
                  ))}
                </>
              )}
            </div>

            {/* Hobbies */}
            {pet.hobbies && pet.hobbies.length > 0 ? (
              <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
                <h3 className="font-semibold mb-3" style={{ color: theme.text }}>Hobbies</h3>
                <div className="flex flex-wrap gap-2">
                  {pet.hobbies.map((h: string) => (
                    <span key={h} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: theme.primaryLight, color: theme.primary }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                className="rounded-xl p-5 text-center"
                style={{ background: theme.bgCard }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${theme.primary}10` }}
                >
                  <PawPrint size={24} color={theme.primary} />
                </motion.div>
                <p className="font-medium text-sm mb-1" style={{ color: theme.text }}>Sin hobbies</p>
                <p className="text-xs mb-3" style={{ color: theme.textMuted }}>Agrega los hobbies de {pet.name}</p>
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${theme.primary}15`, color: theme.primary }}
                >
                  <Plus size={14} /> Agregar hobbies
                </button>
              </motion.div>
            )}

            {/* Personality */}
            {pet.personality_tags && pet.personality_tags.length > 0 ? (
              <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
                <h3 className="font-semibold mb-3" style={{ color: theme.text }}>Personalidad</h3>
                <div className="flex flex-wrap gap-2">
                  {pet.personality_tags.map((p: string) => (
                    <span key={p} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: `${theme.accent}20`, color: theme.primaryDark }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                className="rounded-xl p-5 text-center"
                style={{ background: theme.bgCard }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${theme.accent}15` }}
                >
                  <span className="text-2xl">✨</span>
                </motion.div>
                <p className="font-medium text-sm mb-1" style={{ color: theme.text }}>Sin personalidad definida</p>
                <p className="text-xs mb-3" style={{ color: theme.textMuted }}>Describe como es {pet.name}</p>
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${theme.accent}15`, color: theme.primaryDark }}
                >
                  <Plus size={14} /> Agregar personalidad
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Vaccines tab */}
        {tab === 'vaccines' && (
          <div className="space-y-3">
            {vaxRecords.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: theme.bgCard }}>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Syringe size={40} color={theme.textMuted} className="mx-auto mb-3" />
                </motion.div>
                <p className="font-medium" style={{ color: theme.text }}>Sin vacunas registradas</p>
                <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                  Tu veterinaria registrará las vacunas aquí
                </p>
              </div>
            ) : (
              vaxRecords.map(r => (
                <div key={r.id} className="rounded-xl p-4" style={{ background: theme.bgCard }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm" style={{ color: theme.text }}>
                      {(r.vaccine as any)?.name || 'Vacuna'}
                    </p>
                    {r.certificate_number && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: theme.primaryLight, color: theme.primary }}>
                        ✓ Certificada
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    Aplicada: {new Date(r.applied_date).toLocaleDateString('es')}
                  </p>
                  {r.next_dose_date && (
                    <p className="text-xs" style={{ color: theme.accent }}>
                      Próxima: {new Date(r.next_dose_date).toLocaleDateString('es')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Photos (adventure gallery) tab */}
        {tab === 'photos' && (
          <div className="space-y-4">
            {/* Upload button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => adventurePhotoRef.current?.click()}
              disabled={uploadingAdventure}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                color: '#fff',
                boxShadow: `0 4px 15px ${theme.primary}30`,
              }}
            >
              <Camera size={18} />
              {uploadingAdventure ? 'Subiendo...' : 'Agregar foto de aventura'}
            </motion.button>

            {/* Caption input modal */}
            <AnimatePresence>
              {showCaptionInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl p-4 space-y-3" style={{ background: theme.bgCard, border: `1px solid ${theme.primary}30` }}>
                    {pendingAdventureFile && (
                      <div className="w-full h-40 rounded-lg overflow-hidden bg-black/5">
                        <img
                          src={URL.createObjectURL(pendingAdventureFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={adventureCaption}
                      onChange={e => setAdventureCaption(e.target.value)}
                      placeholder="Describe esta aventura... (opcional)"
                      className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}` }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowCaptionInput(false); setPendingAdventureFile(null); setAdventureCaption('') }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                        style={{ background: theme.primaryLight, color: theme.textMuted }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={uploadAdventurePhoto}
                        disabled={uploadingAdventure}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: theme.primary, color: '#fff' }}
                      >
                        {uploadingAdventure ? 'Subiendo...' : 'Publicar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Photo grid */}
            {adventurePhotos.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: theme.bgCard }}>
                <motion.div
                  animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${theme.primary}10` }}
                >
                  <ImageIcon size={32} color={theme.primary} />
                </motion.div>
                <p className="font-medium" style={{ color: theme.text }}>Sin fotos de aventuras</p>
                <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                  Comparte los mejores momentos de {pet.name}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {adventurePhotos.map((photo, i) => (
                  <motion.button
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setViewingPhoto(photo)}
                    className="aspect-square rounded-xl overflow-hidden relative group"
                  >
                    <img src={photo.photo_url} alt={photo.caption || 'Aventura'} className="w-full h-full object-cover" />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] leading-tight truncate">{photo.caption}</p>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photo viewer modal */}
        <AnimatePresence>
          {viewingPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.9)' }}
              onClick={() => setViewingPhoto(null)}
            >
              <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-white/80 text-xs">
                    {new Date(viewingPhoto.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteAdventurePhoto(viewingPhoto)}
                      className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center"
                    >
                      <Trash2 size={16} color="#ff6b6b" />
                    </button>
                    <button
                      onClick={() => setViewingPhoto(null)}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                    >
                      <X size={18} color="#fff" />
                    </button>
                  </div>
                </div>
                <img
                  src={viewingPhoto.photo_url}
                  alt={viewingPhoto.caption || 'Aventura'}
                  className="w-full rounded-2xl max-h-[70vh] object-contain"
                />
                {viewingPhoto.caption && (
                  <p className="text-white text-sm mt-3 text-center">{viewingPhoto.caption}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card tab */}
        {tab === 'card' && (
          <div className="space-y-4">
            {/* Digital card */}
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: theme.primary }}>
              <div className="p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Pet ID
                  </span>
                  <span className="text-xs opacity-70">Digital</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={20} color="rgba(255,255,255,0.6)" />
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-bold">{pet.name}</p>
                    {pet.nickname && <p className="text-xs opacity-70">&ldquo;{pet.nickname}&rdquo;</p>}
                    <p className="text-sm opacity-80">{pet.breed}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs opacity-70">
                  <span>ID: {pet.id.slice(0, 8)}</span>
                  <span>{pet.species === 'canine' ? 'Canino' : 'Felino'}</span>
                </div>
              </div>
              {/* QR section */}
              <div className="bg-white p-4 flex items-center justify-center">
                <div className="bg-white p-3 rounded-xl">
                  <QRCode value={publicUrl} size={140} />
                </div>
              </div>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: `Pet ID - ${pet.name}`, url: publicUrl })
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                style={{ background: '#25D366', color: '#fff' }}
              >
                <Share2 size={18} /> WhatsApp
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border"
                style={{ borderColor: theme.border, color: theme.text, background: theme.bgCard }}
              >
                <QrCode size={18} /> Copiar link
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
