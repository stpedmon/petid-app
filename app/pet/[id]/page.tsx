'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, Syringe, FileText, Share2, QrCode, Camera, Plus, Save, X, Pencil, Trash2, Download, Clock, ChevronRight, Weight, Calendar, Dna } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'
import { toPng } from 'html-to-image'
import Image from 'next/image'

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

function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
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
  const [tab, setTab] = useState<'vaccines' | 'history' | 'profile' | 'qr'>('profile')
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloadingCard, setDownloadingCard] = useState(false)

  useEffect(() => { fetchPet() }, [petId])
  useEffect(() => { if (tab === 'history') fetchAdventurePhotos() }, [tab])

  const fetchPet = async () => {
    const { data } = await supabase.from('petid_pets').select('*').eq('id', petId).single()
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
    const { data } = await supabase.from('petid_pet_photos').select('*').eq('pet_id', petId).order('created_at', { ascending: false })
    if (data) setAdventurePhotos(data)
  }

  const startEdit = () => {
    if (!pet) return
    setEditData({ name: pet.name, nickname: pet.nickname, color: pet.color, weight_kg: pet.weight_kg, microchip_number: pet.microchip_number, date_of_birth: pet.date_of_birth })
    setEditing(true)
  }

  const cancelEdit = () => { setEditing(false); setEditData({}) }

  const saveEdit = async () => {
    if (!pet) return
    setSaving(true)
    try {
      const { error } = await supabase.from('petid_pets').update({
        name: editData.name || pet.name, nickname: editData.nickname || null,
        color: editData.color || null, weight_kg: editData.weight_kg || null,
        microchip_number: editData.microchip_number || null, date_of_birth: editData.date_of_birth || null,
      }).eq('id', petId)
      if (error) throw error
      await fetchPet()
      setEditing(false)
    } catch (err: any) { alert(err.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pet) return
    setUploadingPhoto(true)
    try {
      const compressed = await compressImage(file, 600, 0.8)
      const path = `profiles/${petId}_${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('pet-photos').upload(path, compressed, { contentType: 'image/jpeg', upsert: false })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(path)
      const { error: updErr } = await supabase.from('petid_pets').update({ photo_url: urlData.publicUrl }).eq('id', petId)
      if (updErr) throw updErr
      setPet({ ...pet, photo_url: urlData.publicUrl })
    } catch (err: any) { alert(err.message || 'Error al subir foto') }
    finally { setUploadingPhoto(false); if (profilePhotoRef.current) profilePhotoRef.current.value = '' }
  }

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
      const { error: upErr } = await supabase.storage.from('pet-photos').upload(path, compressed, { contentType: 'image/jpeg', upsert: false })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(path)
      const { error: insErr } = await supabase.from('petid_pet_photos').insert({ pet_id: petId, photo_url: urlData.publicUrl, caption: adventureCaption.trim() || null })
      if (insErr) throw insErr
      setShowCaptionInput(false); setPendingAdventureFile(null); setAdventureCaption('')
      await fetchAdventurePhotos()
    } catch (err: any) { alert(err.message || 'Error al subir foto') }
    finally { setUploadingAdventure(false); if (adventurePhotoRef.current) adventurePhotoRef.current.value = '' }
  }

  const deleteAdventurePhoto = async (photo: AdventurePhoto) => {
    try {
      const { error } = await supabase.from('petid_pet_photos').delete().eq('id', photo.id)
      if (error) throw error
      setAdventurePhotos(prev => prev.filter(p => p.id !== photo.id))
      setViewingPhoto(null)
    } catch (err: any) { alert(err.message || 'Error al eliminar') }
  }

  const downloadCard = async () => {
    if (!cardRef.current || !pet) return
    setDownloadingCard(true)
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 3 })
      if (navigator.share) {
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        const file = new File([blob], `PetID-${pet.name}.png`, { type: 'image/png' })
        await navigator.share({ title: `Pet ID - ${pet.name}`, files: [file] })
      } else {
        const link = document.createElement('a'); link.download = `PetID-${pet.name}.png`; link.href = dataUrl; link.click()
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        try { const d = await toPng(cardRef.current!, { quality: 1, pixelRatio: 3 }); const l = document.createElement('a'); l.download = `PetID-${pet.name}.png`; l.href = d; l.click() } catch { }
      }
    } finally { setDownloadingCard(false) }
  }

  const getAge = (dob: string | null) => {
    if (!dob) return null
    const diff = Date.now() - new Date(dob).getTime()
    const y = Math.floor(diff / 31536000000)
    const m = Math.floor((diff % 31536000000) / 2592000000)
    if (y > 0) return `${y} año${y > 1 ? 's' : ''}${m > 0 ? ` ${m}m` : ''}`
    return `${m} mes${m !== 1 ? 'es' : ''}`
  }

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/public/pet/${petId}` : ''

  if (loading || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: theme.primaryLight }}>
            <Image src="/petid-icon.svg" alt="PetID" width={28} height={28} />
          </div>
        </motion.div>
      </div>
    )
  }

  const age = getAge(pet.date_of_birth)

  const tabs = [
    { key: 'vaccines' as const, label: 'Vacunas', icon: Syringe },
    { key: 'history' as const, label: 'Historial', icon: Clock },
    { key: 'profile' as const, label: 'Perfil', icon: FileText },
    { key: 'qr' as const, label: 'QR', icon: QrCode },
  ]

  const nextVaccine = vaxRecords.find(r => r.next_dose_date && new Date(r.next_dose_date) > new Date())

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      {/* Hidden file inputs */}
      <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
      <input ref={adventurePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleAdventurePhotoSelect} />

      {/* Hero photo header — full width, mobile-first */}
      <div className="relative">
        {/* Back button overlay */}
        <button
          onClick={() => router.push('/pets')}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>

        {/* Edit button overlay */}
        {!editing && (
          <button
            onClick={startEdit}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
          >
            <Pencil size={16} color="#fff" />
          </button>
        )}

        {/* Large pet photo */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => profilePhotoRef.current?.click()}
          disabled={uploadingPhoto}
          className="w-full aspect-[4/3] max-h-[320px] flex items-center justify-center overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})` }}
        >
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <Camera size={48} color={theme.textMuted} className="mx-auto mb-2" />
              <p className="text-sm font-medium" style={{ color: theme.textMuted }}>Toca para agregar foto</p>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Camera badge */}
          {!uploadingPhoto && (
            <div
              className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.9)' }}
            >
              <Camera size={16} color={theme.primary} />
            </div>
          )}

          {uploadingPhoto && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-3 border-white border-t-transparent rounded-full" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Pet info card — overlapping the photo slightly */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="rounded-2xl p-5" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          {editing ? (
            <div className="space-y-3">
              <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })}
                placeholder="Nombre" className="w-full text-xl font-bold bg-transparent outline-none px-3 py-2 rounded-xl"
                style={{ color: theme.text, border: `1px solid ${theme.primary}40` }} />
              <input type="text" value={editData.nickname || ''} onChange={e => setEditData({ ...editData, nickname: e.target.value })}
                placeholder="Apodo (opcional)" className="w-full text-sm bg-transparent outline-none px-3 py-2 rounded-xl"
                style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }} />
              <div className="flex gap-2 pt-1">
                <button onClick={cancelEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: theme.primaryLight, color: theme.textMuted }}>
                  <X size={14} /> Cancelar
                </button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: theme.primary, color: '#fff' }}>
                  <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: theme.text }}>{pet.name}</h1>
                  {pet.nickname && (
                    <p className="text-sm" style={{ color: theme.primary }}>&ldquo;{pet.nickname}&rdquo;</p>
                  )}
                  <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>{pet.breed}</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg" style={{ background: theme.primaryLight, color: theme.textMuted }}>
                  ID: {pet.id.slice(0, 8)}
                </span>
              </div>

              {/* Stats row — age, weight, sex */}
              <div className="flex gap-2">
                {age && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-1"
                    style={{ background: `${theme.primary}08`, border: `1px solid ${theme.border}` }}>
                    <Calendar size={14} color={theme.primary} />
                    <span className="text-xs font-semibold" style={{ color: theme.text }}>{age}</span>
                  </div>
                )}
                {pet.weight_kg && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-1"
                    style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}` }}>
                    <Weight size={14} color={theme.accent} />
                    <span className="text-xs font-semibold" style={{ color: theme.text }}>{pet.weight_kg} kg</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-1"
                  style={{ background: `${theme.primary}08`, border: `1px solid ${theme.border}` }}>
                  <Dna size={14} color={theme.primary} />
                  <span className="text-xs font-semibold" style={{ color: theme.text }}>
                    {pet.sex === 'male' ? 'Macho' : 'Hembra'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs — icon-based matching reference */}
      <div className="px-5 mt-4">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: theme.primaryLight }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-semibold"
              style={{
                background: tab === t.key ? theme.bgCard : 'transparent',
                color: tab === t.key ? theme.primary : theme.textMuted,
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <t.icon size={18} strokeWidth={tab === t.key ? 2 : 1.5} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-5 py-4">
        {/* Vaccines tab */}
        {tab === 'vaccines' && (
          <div className="space-y-3">
            {/* Next vaccine card */}
            {nextVaccine && (
              <div className="rounded-2xl p-4" style={{ background: `${theme.accent}12`, border: `1px solid ${theme.accent}30` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: theme.accent }}>Próxima vacuna</p>
                <p className="font-bold text-sm" style={{ color: theme.text }}>
                  {(nextVaccine.vaccine as any)?.name}
                </p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                  {new Date(nextVaccine.next_dose_date!).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}

            {vaxRecords.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <Syringe size={36} color={theme.textMuted} className="mx-auto mb-3" />
                <p className="font-semibold" style={{ color: theme.text }}>Sin vacunas registradas</p>
                <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                  Tu veterinaria registrará las vacunas aquí
                </p>
              </div>
            ) : (
              vaxRecords.map((r, i) => (
                <motion.div key={r.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm" style={{ color: theme.text }}>
                      {(r.vaccine as any)?.name || 'Vacuna'}
                    </p>
                    {r.certificate_number && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: '#2E9D6815', color: '#2E9D68' }}>
                        ✓ Certificada
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    Aplicada: {new Date(r.applied_date).toLocaleDateString('es')}
                  </p>
                  {r.next_dose_date && (
                    <p className="text-xs mt-0.5" style={{ color: theme.accent }}>
                      Próxima: {new Date(r.next_dose_date).toLocaleDateString('es')}
                    </p>
                  )}
                  {r.veterinarian_name && (
                    <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                      Dr. {r.veterinarian_name}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* History tab — photos + visit history */}
        {tab === 'history' && (
          <div className="space-y-4">
            {/* Last vet visit */}
            {vaxRecords.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: theme.textMuted }}>Última visita veterinaria</p>
                <p className="font-bold text-sm" style={{ color: theme.text }}>
                  {new Date(vaxRecords[0].applied_date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {vaxRecords[0].veterinarian_name && (
                  <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Dr. {vaxRecords[0].veterinarian_name}</p>
                )}
              </div>
            )}

            {/* Adventure photos section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-sm" style={{ color: theme.text }}>Fotos</p>
                <button onClick={() => adventurePhotoRef.current?.click()} disabled={uploadingAdventure}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: theme.primaryLight, color: theme.primary }}>
                  <Camera size={12} /> Agregar
                </button>
              </div>

              {/* Caption input */}
              <AnimatePresence>
                {showCaptionInput && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-3">
                    <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bgCard, border: `1px solid ${theme.primary}30` }}>
                      {pendingAdventureFile && (
                        <div className="w-full h-40 rounded-xl overflow-hidden">
                          <img src={URL.createObjectURL(pendingAdventureFile)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input type="text" value={adventureCaption} onChange={e => setAdventureCaption(e.target.value)}
                        placeholder="Describe esta aventura... (opcional)"
                        className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                        style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowCaptionInput(false); setPendingAdventureFile(null); setAdventureCaption('') }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                          style={{ background: theme.primaryLight, color: theme.textMuted }}>
                          Cancelar
                        </button>
                        <button onClick={uploadAdventurePhoto} disabled={uploadingAdventure}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                          style={{ background: theme.primary, color: '#fff' }}>
                          {uploadingAdventure ? 'Subiendo...' : 'Publicar'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {adventurePhotos.length === 0 ? (
                <div className="rounded-2xl p-6 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                  <Camera size={28} color={theme.textMuted} className="mx-auto mb-2" />
                  <p className="text-sm font-medium" style={{ color: theme.text }}>Sin fotos</p>
                  <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                    Comparte los mejores momentos de {pet.name}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {adventurePhotos.map((photo, i) => (
                    <motion.button key={photo.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }} onClick={() => setViewingPhoto(photo)}
                      className="aspect-square rounded-xl overflow-hidden relative group">
                      <img src={photo.photo_url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-[10px] truncate">{photo.caption}</p>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-5" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm" style={{ color: theme.text }}>Datos</h3>
                {!editing && (
                  <button onClick={startEdit} className="text-xs font-semibold" style={{ color: theme.primary }}>
                    Editar
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Fecha de nacimiento</label>
                    <input type="date" value={editData.date_of_birth || ''}
                      onChange={e => setEditData({ ...editData, date_of_birth: e.target.value })}
                      className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Color</label>
                      <input type="text" value={editData.color || ''} placeholder="Ej: Dorado"
                        onChange={e => setEditData({ ...editData, color: e.target.value })}
                        className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                        style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Peso (kg)</label>
                      <input type="number" step="0.1" value={editData.weight_kg || ''}
                        onChange={e => setEditData({ ...editData, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                        style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Microchip</label>
                    <input type="text" value={editData.microchip_number || ''} placeholder="Número"
                      onChange={e => setEditData({ ...editData, microchip_number: e.target.value })}
                      className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}` }} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={cancelEdit} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: theme.primaryLight, color: theme.textMuted }}>Cancelar</button>
                    <button onClick={saveEdit} disabled={saving}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                      style={{ background: theme.primary, color: '#fff' }}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Especie', value: pet.species === 'canine' ? 'Perro' : pet.species === 'feline' ? 'Gato' : pet.species },
                    { label: 'Raza', value: pet.breed },
                    { label: 'Sexo', value: pet.sex === 'male' ? 'Macho' : 'Hembra' },
                    { label: 'Edad', value: age },
                    { label: 'Color', value: pet.color },
                    { label: 'Peso', value: pet.weight_kg ? `${pet.weight_kg} kg` : null },
                    { label: 'Microchip', value: pet.microchip_number },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="flex justify-between text-sm py-1" style={{ borderBottom: `1px solid ${theme.border}40` }}>
                      <span style={{ color: theme.textMuted }}>{label}</span>
                      <span className="font-medium" style={{ color: theme.text }}>{value}</span>
                    </div>
                  ) : null)}
                </div>
              )}
            </div>

            {/* Hobbies */}
            {pet.hobbies && pet.hobbies.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: theme.text }}>Hobbies</h3>
                <div className="flex flex-wrap gap-2">
                  {pet.hobbies.map((h: string) => (
                    <span key={h} className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: theme.primaryLight, color: theme.primary }}>{h}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Personality */}
            {pet.personality_tags && pet.personality_tags.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: theme.text }}>Personalidad</h3>
                <div className="flex flex-wrap gap-2">
                  {pet.personality_tags.map((p: string) => (
                    <span key={p} className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: `${theme.accent}15`, color: theme.primaryDark }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR tab */}
        {tab === 'qr' && (
          <div className="space-y-4">
            {/* ID Card */}
            <div ref={cardRef} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${theme.border}` }}>
              {/* Card header */}
              <div className="px-5 py-3 flex items-center justify-between"
                style={{ background: theme.primary }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center p-1">
                    <Image src="/petid-icon.svg" alt="PetID" width={18} height={18} className="brightness-0 invert" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide">PetID</span>
                </div>
                <span className="text-white/60 text-[10px] font-medium tracking-widest uppercase">Identidad Digital</span>
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-24 rounded-xl overflow-hidden flex items-center justify-center"
                      style={{ background: '#f0f0f0', border: '2px solid #e0e0e0' }}>
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : <Camera size={20} color="#999" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-gray-900 truncate">{pet.name}</p>
                    <div className="space-y-1 mt-2">
                      {[
                        { l: 'Raza', v: pet.breed },
                        { l: 'Especie', v: pet.species === 'canine' ? 'Canino' : 'Felino' },
                        { l: 'Sexo', v: pet.sex === 'male' ? 'Macho' : 'Hembra' },
                        ...(age ? [{ l: 'Edad', v: age }] : []),
                      ].map(r => (
                        <div key={r.l} className="flex text-[11px]">
                          <span className="text-gray-400 w-14 flex-shrink-0">{r.l}</span>
                          <span className="text-gray-700 font-semibold truncate">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 flex items-center gap-4" style={{ borderTop: '1px dashed #e0e0e0' }}>
                  <div className="flex-shrink-0 bg-white p-1.5 rounded-lg" style={{ border: '1px solid #eee' }}>
                    <QRCode value={publicUrl} size={72} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">ID</p>
                    <p className="text-xs text-gray-700 font-bold font-mono">{pet.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-medium">Verificado</p>
                    <p className="text-xs text-gray-700 font-semibold">
                      {new Date().toLocaleDateString('es', { year: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-2 flex items-center justify-between"
                style={{ background: theme.primaryLight }}>
                <span className="text-[9px] font-medium tracking-wider" style={{ color: theme.primary }}>
                  petid.app
                </span>
                <span className="text-[9px] font-medium" style={{ color: theme.textMuted }}>✓ Verificado</span>
              </div>
            </div>

            {/* QR sharing section */}
            <div className="rounded-2xl p-6 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <p className="font-bold text-sm mb-4" style={{ color: theme.text }}>QR de Identidad</p>
              <div className="inline-block p-4 rounded-2xl" style={{ background: '#fff', border: `1px solid ${theme.border}` }}>
                <QRCode value={publicUrl} size={160} />
              </div>
              <p className="text-xs mt-3 mb-4" style={{ color: theme.textMuted }}>
                Escanea para ver el perfil de {pet.name}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: `Pet ID - ${pet.name}`, url: publicUrl })
                  } else {
                    navigator.clipboard.writeText(publicUrl).then(() => alert('Link copiado'))
                  }
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: theme.primary, color: '#fff' }}
              >
                <Share2 size={16} className="inline mr-2" />
                Compartir QR
              </motion.button>
            </div>

            {/* Wallet & action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => alert('Apple Wallet estará disponible próximamente')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#000', color: '#fff' }}>
                Apple Wallet
              </button>
              <button onClick={() => alert('Google Wallet estará disponible próximamente')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#1a73e8', color: '#fff' }}>
                Google Wallet
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={downloadCard} disabled={downloadingCard}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text }}>
                <Download size={16} color={theme.primary} />
                {downloadingCard ? 'Guardando...' : 'Guardar tarjeta'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { navigator.clipboard.writeText(publicUrl).then(() => alert('Link copiado')) }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text }}>
                <QrCode size={16} color={theme.primary} />
                Copiar link
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Photo viewer modal */}
      <AnimatePresence>
        {viewingPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => setViewingPhoto(null)}>
            <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <p className="text-white/80 text-xs">
                  {new Date(viewingPhoto.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => deleteAdventurePhoto(viewingPhoto)}
                    className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Trash2 size={16} color="#ff6b6b" />
                  </button>
                  <button onClick={() => setViewingPhoto(null)}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                    <X size={18} color="#fff" />
                  </button>
                </div>
              </div>
              <img src={viewingPhoto.photo_url} alt={viewingPhoto.caption || ''} className="w-full rounded-2xl max-h-[70vh] object-contain" />
              {viewingPhoto.caption && <p className="text-white text-sm mt-3 text-center">{viewingPhoto.caption}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
