'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import { getPetAge } from '@/lib/petAge'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, Syringe, FileText, Share2, QrCode, Camera, Plus, Save, X, Pencil, Trash2, Download, Clock, ChevronRight, Weight, Calendar, Dna, PawPrint, Compass, MapPin, ShieldCheck, ShieldAlert, Pill, Bug, Stethoscope, ClipboardList, Heart, AlertCircle } from 'lucide-react'
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
  id: string; date_administered: string; next_dose_date: string | null;
  administered_by: string | null; certificate_number: string | null;
  is_verified: boolean; added_by_user_id: string | null;
  vaccine: { name: string };
}

interface MedicationRecord {
  id: string; name: string; type: string; applied_date: string;
  duration_days: number | null; next_dose_date: string | null;
  notes: string | null; created_at: string;
}

interface VaccineCatalogItem {
  id: string; name: string; default_interval_days: number | null;
}

interface AdventurePhoto {
  id: string; photo_url: string; caption: string | null; created_at: string;
}

const medicationPresets = [
  { name: 'Bravecto', duration: 90, type: 'antiparasitario' },
  { name: 'NexGard', duration: 30, type: 'antiparasitario' },
  { name: 'Simparica', duration: 35, type: 'antiparasitario' },
  { name: 'Frontline', duration: 30, type: 'antiparasitario' },
  { name: 'Revolution', duration: 30, type: 'antiparasitario' },
  { name: 'Heartgard', duration: 30, type: 'antiparasitario' },
  { name: 'Seresto (collar)', duration: 240, type: 'antiparasitario' },
]

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
  const searchParams = useSearchParams()
  const petId = params.id as string
  const initialTab = searchParams.get('tab') as 'vaccines' | 'history' | 'profile' | 'qr' | null
  const [pet, setPet] = useState<Pet | null>(null)
  const [vaxRecords, setVaxRecords] = useState<VaxRecord[]>([])
  const [medications, setMedications] = useState<MedicationRecord[]>([])
  const [vaccineCatalog, setVaccineCatalog] = useState<VaccineCatalogItem[]>([])
  const [adventurePhotos, setAdventurePhotos] = useState<AdventurePhoto[]>([])
  const [tab, setTab] = useState<'vaccines' | 'history' | 'profile' | 'qr'>(initialTab || 'profile')
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
  const [ownerSex, setOwnerSex] = useState<string | null>(null)

  // Vaccine & medication form states
  const [showAddVax, setShowAddVax] = useState(false)
  const [showAddMed, setShowAddMed] = useState(false)
  const [vaxFormVaccineId, setVaxFormVaccineId] = useState('')
  const [vaxFormDate, setVaxFormDate] = useState(() => new Date().toISOString().split('T')[0])
  const [vaxFormNotes, setVaxFormNotes] = useState('')
  const [vaxSubmitting, setVaxSubmitting] = useState(false)
  const [medFormPreset, setMedFormPreset] = useState('')
  const [medFormCustomName, setMedFormCustomName] = useState('')
  const [medFormDate, setMedFormDate] = useState(() => new Date().toISOString().split('T')[0])
  const [medFormDuration, setMedFormDuration] = useState<number | ''>('')
  const [medFormNotes, setMedFormNotes] = useState('')
  const [medSubmitting, setMedSubmitting] = useState(false)
  const [showRegisterMenu, setShowRegisterMenu] = useState(false)
  const [registerType, setRegisterType] = useState<'vaccine' | 'deworming' | 'medication' | null>(null)

  const profilePhotoRef = useRef<HTMLInputElement>(null)
  const adventurePhotoRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloadingCard, setDownloadingCard] = useState(false)

  useEffect(() => { fetchPet() }, [petId])
  useEffect(() => { if (tab === 'history') fetchAdventurePhotos() }, [tab])
  useEffect(() => {
    fetchMedications()
    fetchVaccineCatalog()
  }, [petId])
  useEffect(() => {
    if (tab === 'vaccines' && initialTab === 'vaccines') setShowAddVax(true)
  }, [tab])

  const fetchPet = async () => {
    const { data } = await supabase.from('petid_pets').select('*').eq('id', petId).single()
    if (data) setPet(data)
    const { data: vax } = await supabase
      .from('petid_vaccination_records')
      .select('*, vaccine:vaccine_id(name)')
      .eq('pet_id', petId)
      .order('date_administered', { ascending: false })
    if (vax) setVaxRecords(vax as any)
    // Fetch owner sex
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: ownerData } = await supabase.from('petid_users').select('sex').eq('id', authUser.id).single()
      if (ownerData) setOwnerSex(ownerData.sex)
    }
    setLoading(false)
  }

  const fetchMedications = async () => {
    const { data } = await supabase
      .from('petid_pet_medications')
      .select('*')
      .eq('pet_id', petId)
      .order('applied_date', { ascending: false })
    if (data) setMedications(data)
  }

  const fetchVaccineCatalog = async () => {
    const { data } = await supabase.from('petid_vaccines').select('id, name, default_interval_days').order('name')
    if (data) setVaccineCatalog(data)
  }

  const fetchAdventurePhotos = async () => {
    const { data } = await supabase.from('petid_pet_photos').select('*').eq('pet_id', petId).order('created_at', { ascending: false })
    if (data) setAdventurePhotos(data)
  }

  const submitVaccine = async () => {
    if (!vaxFormVaccineId || !vaxFormDate) return
    setVaxSubmitting(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const selectedVaccine = vaccineCatalog.find(v => v.id === vaxFormVaccineId)
      let nextDose: string | null = null
      if (selectedVaccine?.default_interval_days) {
        const d = new Date(vaxFormDate)
        d.setDate(d.getDate() + selectedVaccine.default_interval_days)
        nextDose = d.toISOString().split('T')[0]
      }
      const { error } = await supabase.from('petid_vaccination_records').insert({
        pet_id: petId,
        vaccine_id: vaxFormVaccineId,
        date_administered: vaxFormDate,
        next_dose_date: nextDose,
        notes: vaxFormNotes.trim() || null,
        added_by_user_id: authUser?.id || null,
        is_verified: false,
      })
      if (error) throw error
      // Refresh and reset
      const { data: vax } = await supabase
        .from('petid_vaccination_records')
        .select('*, vaccine:vaccine_id(name)')
        .eq('pet_id', petId)
        .order('date_administered', { ascending: false })
      if (vax) setVaxRecords(vax as any)
      setShowAddVax(false)
      setVaxFormVaccineId('')
      setVaxFormDate(new Date().toISOString().split('T')[0])
      setVaxFormNotes('')
    } catch (err: any) {
      alert(err.message || 'Error al agregar vacuna')
    } finally {
      setVaxSubmitting(false)
    }
  }

  const submitMedication = async () => {
    const name = medFormPreset || medFormCustomName.trim()
    if (!name || !medFormDate) return
    setMedSubmitting(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const duration = medFormDuration || null
      let nextDose: string | null = null
      if (duration && duration > 0) {
        const d = new Date(medFormDate)
        d.setDate(d.getDate() + duration)
        nextDose = d.toISOString().split('T')[0]
      }
      const preset = medicationPresets.find(p => p.name === medFormPreset)
      const { error } = await supabase.from('petid_pet_medications').insert({
        pet_id: petId,
        name,
        type: preset?.type || 'otro',
        applied_date: medFormDate,
        duration_days: duration,
        next_dose_date: nextDose,
        notes: medFormNotes.trim() || null,
        added_by_user_id: authUser?.id || null,
      })
      if (error) throw error
      await fetchMedications()
      setShowAddMed(false)
      setMedFormPreset('')
      setMedFormCustomName('')
      setMedFormDate(new Date().toISOString().split('T')[0])
      setMedFormDuration('')
      setMedFormNotes('')
    } catch (err: any) {
      alert(err.message || 'Error al agregar medicamento')
    } finally {
      setMedSubmitting(false)
    }
  }

  const getDaysUntil = (date: string | null) => {
    if (!date) return null
    const diff = new Date(date).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
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

  const getAge = (dob: string | null) => getPetAge(dob) || null

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/public/pet/${petId}` : ''

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
    { key: 'vaccines' as const, label: 'Salud', icon: Heart },
    { key: 'history' as const, label: 'Historial', icon: ClipboardList },
    { key: 'profile' as const, label: 'Perfil', icon: FileText },
    { key: 'qr' as const, label: 'QR', icon: QrCode },
  ]

  // Computed health counts
  const dewormingMeds = medications.filter(m => m.type === 'antiparasitario')
  const generalMeds = medications.filter(m => m.type !== 'antiparasitario')

  // Helper for status tags
  const getHealthStatus = (nextDate: string | null): { label: string; color: string; bg: string } => {
    if (!nextDate) return { label: 'Completado', color: '#6B7280', bg: '#6B728012' }
    const days = getDaysUntil(nextDate)
    if (days === null) return { label: 'Completado', color: '#6B7280', bg: '#6B728012' }
    if (days < 0) return { label: 'Vencido', color: '#D94B5B', bg: '#D94B5B12' }
    if (days <= 7) return { label: 'Próximo', color: '#F0A62B', bg: '#F0A62B12' }
    return { label: 'Al día', color: '#2E9D68', bg: '#2E9D6812' }
  }

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
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg" style={{ background: theme.primaryLight, color: theme.textMuted }}>
                    ID: {pet.id.slice(0, 8)}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#2E9D6815', color: '#2E9D68' }}>
                    <ShieldCheck size={10} />
                    Identidad verificada
                  </span>
                </div>
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
        {/* ===== SALUD tab ===== */}
        {tab === 'vaccines' && (
          <div className="space-y-3">
            {/* Health summary cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Syringe, label: 'Vacunas', count: vaxRecords.length, color: theme.primary },
                { icon: Bug, label: 'Desparasitación', count: dewormingMeds.length, color: '#E8913A' },
                { icon: Pill, label: 'Medicamentos', count: generalMeds.length, color: '#4D91C6' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-3 text-center"
                  style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
                >
                  <div className="w-8 h-8 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${item.color}12` }}>
                    <item.icon size={16} color={item.color} />
                  </div>
                  <p className="text-lg font-bold leading-none" style={{ color: theme.text }}>{item.count}</p>
                  <p className="text-[9px] font-semibold mt-0.5" style={{ color: theme.textMuted }}>{item.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Upcoming reminders widget */}
            {(() => {
              const upcoming = [
                ...vaxRecords.filter(r => r.next_dose_date && getDaysUntil(r.next_dose_date)! >= 0).map(r => ({
                  name: (r.vaccine as any)?.name || 'Vacuna',
                  type: 'vaccine' as const,
                  daysLeft: getDaysUntil(r.next_dose_date)!,
                  date: r.next_dose_date!,
                  color: theme.primary,
                  icon: Syringe,
                })),
                ...medications.filter(m => m.next_dose_date && getDaysUntil(m.next_dose_date)! >= 0).map(m => ({
                  name: m.name,
                  type: m.type === 'antiparasitario' ? 'deworming' as const : 'medication' as const,
                  daysLeft: getDaysUntil(m.next_dose_date)!,
                  date: m.next_dose_date!,
                  color: m.type === 'antiparasitario' ? '#E8913A' : '#4D91C6',
                  icon: m.type === 'antiparasitario' ? Bug : Pill,
                })),
              ].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3)

              if (upcoming.length === 0) return null
              return (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-2xl p-4"
                  style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} color={theme.accent} />
                    <p className="text-xs font-bold" style={{ color: theme.text }}>Próximos recordatorios</p>
                  </div>
                  <div className="space-y-2.5">
                    {upcoming.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}12` }}>
                          <item.icon size={14} color={item.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: theme.text }}>{item.name}</p>
                          <p className="text-[10px]" style={{ color: theme.textMuted }}>
                            {new Date(item.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{
                          background: item.daysLeft <= 7 ? '#F0A62B15' : '#2E9D6815',
                          color: item.daysLeft <= 7 ? '#F0A62B' : '#2E9D68',
                        }}>
                          {item.daysLeft === 0 ? 'Hoy' : `En ${item.daysLeft}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })()}

            {/* Unified register button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowRegisterMenu(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
              style={{ background: theme.primary, color: '#fff', boxShadow: `0 4px 14px ${theme.primary}30` }}
            >
              <Plus size={16} />
              Registrar información
            </motion.button>

            {/* Add vaccine form */}
            <AnimatePresence>
              {showAddVax && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bgCard, border: `1px solid ${theme.primary}30` }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: theme.text }}>Agregar vacuna</p>
                      <button onClick={() => { setShowAddVax(false); setRegisterType(null) }}>
                        <X size={16} color={theme.textMuted} />
                      </button>
                    </div>
                    <select
                      value={vaxFormVaccineId}
                      onChange={e => setVaxFormVaccineId(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl appearance-none"
                      style={{ color: vaxFormVaccineId ? theme.text : theme.textMuted, border: `1px solid ${theme.border}`, background: theme.bg }}
                    >
                      <option value="">Seleccionar vacuna...</option>
                      {vaccineCatalog.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={vaxFormDate}
                      onChange={e => setVaxFormDate(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }}
                    />
                    <input
                      type="text"
                      value={vaxFormNotes}
                      onChange={e => setVaxFormNotes(e.target.value)}
                      placeholder="Notas (opcional)"
                      className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }}
                    />
                    <div className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
                      <ShieldAlert size={14} color="#D94B5B" />
                      <span>Se mostrará como &quot;No verificada&quot; hasta que tu veterinario la confirme</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={submitVaccine}
                      disabled={!vaxFormVaccineId || vaxSubmitting}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                      style={{ background: theme.primary, color: '#fff' }}
                    >
                      {vaxSubmitting ? 'Guardando...' : 'Agregar vacuna'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add deworming form */}
            <AnimatePresence>
              {registerType === 'deworming' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bgCard, border: `1px solid #E8913A30` }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: theme.text }}>Agregar desparasitación</p>
                      <button onClick={() => { setRegisterType(null); setShowAddMed(false) }}>
                        <X size={16} color={theme.textMuted} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {medicationPresets.map(p => (
                        <button
                          key={p.name}
                          onClick={() => {
                            setMedFormPreset(medFormPreset === p.name ? '' : p.name)
                            setMedFormCustomName('')
                            setMedFormDuration(p.duration || '')
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={{
                            background: medFormPreset === p.name ? '#E8913A' : '#E8913A12',
                            color: medFormPreset === p.name ? '#fff' : '#E8913A',
                            border: `1px solid ${medFormPreset === p.name ? '#E8913A' : '#E8913A30'}`,
                          }}
                        >
                          {p.name} {p.duration > 0 && `(${p.duration}d)`}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium mb-1 block" style={{ color: theme.textMuted }}>Fecha aplicación</label>
                        <input type="date" value={medFormDate} onChange={e => setMedFormDate(e.target.value)}
                          className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                          style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium mb-1 block" style={{ color: theme.textMuted }}>Duración (días)</label>
                        <input type="number" value={medFormDuration} onChange={e => setMedFormDuration(e.target.value ? parseInt(e.target.value) : '')}
                          placeholder="Ej: 90" className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                          style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }} />
                      </div>
                    </div>
                    <input type="text" value={medFormNotes} onChange={e => setMedFormNotes(e.target.value)}
                      placeholder="Notas (opcional)" className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }} />
                    {medFormDuration && medFormDate && (
                      <div className="flex items-center gap-2 text-xs px-1" style={{ color: '#E8913A' }}>
                        <Clock size={14} />
                        <span>Próxima dosis: {new Date(new Date(medFormDate).getTime() + Number(medFormDuration) * 86400000).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={submitMedication}
                      disabled={!medFormPreset || medSubmitting}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                      style={{ background: '#E8913A', color: '#fff' }}>
                      {medSubmitting ? 'Guardando...' : 'Agregar desparasitación'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add medication form (general, non-antiparasitario) */}
            <AnimatePresence>
              {registerType === 'medication' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bgCard, border: `1px solid #4D91C630` }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: theme.text }}>Agregar medicamento</p>
                      <button onClick={() => { setRegisterType(null); setShowAddMed(false) }}>
                        <X size={16} color={theme.textMuted} />
                      </button>
                    </div>
                    <input type="text" value={medFormCustomName} onChange={e => setMedFormCustomName(e.target.value)}
                      placeholder="Nombre del medicamento" className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }} />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium mb-1 block" style={{ color: theme.textMuted }}>Fecha aplicación</label>
                        <input type="date" value={medFormDate} onChange={e => setMedFormDate(e.target.value)}
                          className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                          style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium mb-1 block" style={{ color: theme.textMuted }}>Duración (días)</label>
                        <input type="number" value={medFormDuration} onChange={e => setMedFormDuration(e.target.value ? parseInt(e.target.value) : '')}
                          placeholder="Ej: 30" className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                          style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }} />
                      </div>
                    </div>
                    <input type="text" value={medFormNotes} onChange={e => setMedFormNotes(e.target.value)}
                      placeholder="Notas (opcional)" className="w-full text-sm bg-transparent outline-none px-3 py-2.5 rounded-xl"
                      style={{ color: theme.text, border: `1px solid ${theme.border}`, background: theme.bg }} />
                    {medFormDuration && medFormDate && (
                      <div className="flex items-center gap-2 text-xs px-1" style={{ color: '#4D91C6' }}>
                        <Clock size={14} />
                        <span>Próxima dosis: {new Date(new Date(medFormDate).getTime() + Number(medFormDuration) * 86400000).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={submitMedication}
                      disabled={!medFormCustomName.trim() || medSubmitting}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                      style={{ background: '#4D91C6', color: '#fff' }}>
                      {medSubmitting ? 'Guardando...' : 'Agregar medicamento'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* === Vaccines section === */}
            <div className="flex items-center gap-2 pt-1">
              <Syringe size={15} color={theme.primary} />
              <h3 className="font-bold text-sm" style={{ color: theme.text }}>Vacunas</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: theme.primaryLight, color: theme.textMuted }}>
                {vaxRecords.length}
              </span>
            </div>

            {vaxRecords.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <Syringe size={28} color={theme.textMuted} className="mx-auto mb-2" />
                <p className="font-semibold text-sm" style={{ color: theme.text }}>Sin vacunas registradas</p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                  Agrega vacunas con el botón &quot;Registrar información&quot;
                </p>
              </div>
            ) : (
              vaxRecords.map((r, i) => {
                const status = getHealthStatus(r.next_dose_date)
                return (
                  <motion.div key={r.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm" style={{ color: theme.text }}>
                        {(r.vaccine as any)?.name || 'Vacuna'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                        {r.is_verified ? (
                          <ShieldCheck size={14} color="#2E9D68" />
                        ) : (
                          <ShieldAlert size={14} color="#D94B5B" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      Aplicada: {new Date(r.date_administered).toLocaleDateString('es')}
                    </p>
                    {r.next_dose_date && (
                      <p className="text-xs mt-0.5" style={{ color: status.color }}>
                        Próxima: {new Date(r.next_dose_date).toLocaleDateString('es')}
                      </p>
                    )}
                  </motion.div>
                )
              })
            )}

            {/* === Deworming section === */}
            <div className="flex items-center gap-2 pt-3 mt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
              <Bug size={15} color="#E8913A" />
              <h3 className="font-bold text-sm" style={{ color: theme.text }}>Desparasitación</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#E8913A12', color: theme.textMuted }}>
                {dewormingMeds.length}
              </span>
            </div>

            {dewormingMeds.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <Bug size={28} color={theme.textMuted} className="mx-auto mb-2" />
                <p className="font-semibold text-sm" style={{ color: theme.text }}>Sin desparasitación registrada</p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                  Registra productos como Bravecto, NexGard, etc.
                </p>
              </div>
            ) : (
              dewormingMeds.map((m, i) => {
                const daysLeft = getDaysUntil(m.next_dose_date)
                const status = getHealthStatus(m.next_dose_date)
                return (
                  <motion.div key={m.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm" style={{ color: theme.text }}>{m.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      Aplicado: {new Date(m.applied_date).toLocaleDateString('es')}
                    </p>
                    {m.next_dose_date && daysLeft !== null && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock size={12} color={status.color} />
                        <p className="text-xs font-semibold" style={{ color: status.color }}>
                          {daysLeft < 0
                            ? `Vencido hace ${Math.abs(daysLeft)} días`
                            : daysLeft === 0 ? 'Hoy toca la próxima dosis'
                            : `Próxima dosis en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )
              })
            )}

            {/* === General medications section === */}
            <div className="flex items-center gap-2 pt-3 mt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
              <Pill size={15} color="#4D91C6" />
              <h3 className="font-bold text-sm" style={{ color: theme.text }}>Medicamentos</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#4D91C612', color: theme.textMuted }}>
                {generalMeds.length}
              </span>
            </div>

            {generalMeds.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <Pill size={28} color={theme.textMuted} className="mx-auto mb-2" />
                <p className="font-semibold text-sm" style={{ color: theme.text }}>Sin medicamentos registrados</p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                  Registra medicamentos generales
                </p>
              </div>
            ) : (
              generalMeds.map((m, i) => {
                const daysLeft = getDaysUntil(m.next_dose_date)
                const status = getHealthStatus(m.next_dose_date)
                return (
                  <motion.div key={m.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm" style={{ color: theme.text }}>{m.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      Aplicado: {new Date(m.applied_date).toLocaleDateString('es')}
                    </p>
                    {m.next_dose_date && daysLeft !== null && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock size={12} color={status.color} />
                        <p className="text-xs font-semibold" style={{ color: status.color }}>
                          {daysLeft < 0
                            ? `Vencido hace ${Math.abs(daysLeft)} días`
                            : daysLeft === 0 ? 'Hoy toca la próxima dosis'
                            : `Próxima dosis en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    )}
                    {m.notes && <p className="text-xs mt-1" style={{ color: theme.textMuted }}>{m.notes}</p>}
                  </motion.div>
                )
              })
            )}
          </div>
        )}

        {/* Historial tab — unified treatment timeline + adventures */}
        {tab === 'history' && (
          <div className="space-y-4">
            {/* Unified treatment history */}
            {(() => {
              const allRecords = [
                ...vaxRecords.map(r => ({
                  id: `vax-${r.id}`,
                  name: (r.vaccine as any)?.name || 'Vacuna',
                  type: 'vaccine' as const,
                  date: r.date_administered,
                  nextDate: r.next_dose_date,
                  notes: null as string | null,
                  verified: r.is_verified,
                  icon: Syringe,
                  color: theme.primary,
                  typeLabel: 'Vacuna',
                })),
                ...dewormingMeds.map(m => ({
                  id: `dew-${m.id}`,
                  name: m.name,
                  type: 'deworming' as const,
                  date: m.applied_date,
                  nextDate: m.next_dose_date,
                  notes: m.notes,
                  verified: false,
                  icon: Bug,
                  color: '#E8913A',
                  typeLabel: 'Desparasitación',
                })),
                ...generalMeds.map(m => ({
                  id: `med-${m.id}`,
                  name: m.name,
                  type: 'medication' as const,
                  date: m.applied_date,
                  nextDate: m.next_dose_date,
                  notes: m.notes,
                  verified: false,
                  icon: Pill,
                  color: '#4D91C6',
                  typeLabel: 'Medicamento',
                })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

              return allRecords.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-8 text-center"
                  style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
                >
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: theme.primaryLight }}>
                    <ClipboardList size={28} color={theme.primary} strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: theme.text }}>Sin registros aún</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    Los tratamientos que registres aparecerán aquí organizados cronológicamente
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-sm" style={{ color: theme.text }}>
                      Línea de tiempo
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: theme.primaryLight, color: theme.textMuted }}>
                      {allRecords.length} registro{allRecords.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {allRecords.map((rec, i) => {
                    const status = getHealthStatus(rec.nextDate)
                    const RecIcon = rec.icon
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-2xl p-4 flex gap-3.5"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
                      >
                        {/* Icon column */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${rec.color}12` }}
                        >
                          <RecIcon size={18} color={rec.color} strokeWidth={1.8} />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                              style={{ background: `${rec.color}15`, color: rec.color }}>
                              {rec.typeLabel}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                            {rec.verified && <ShieldCheck size={13} color="#2E9D68" />}
                          </div>
                          <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{rec.name}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
                            {new Date(rec.date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {rec.nextDate && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Clock size={11} color={status.color} />
                              <p className="text-[11px] font-medium" style={{ color: status.color }}>
                                Próxima: {new Date(rec.nextDate).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                          {rec.notes && (
                            <p className="text-[11px] mt-1 truncate" style={{ color: theme.textMuted }}>{rec.notes}</p>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Adventures section — separated by divider */}
            <div className="flex items-center gap-2 pt-3 mt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
              <Compass size={15} color={theme.primary} />
              <h3 className="font-bold text-sm" style={{ color: theme.text }}>Aventuras</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: theme.primaryLight, color: theme.textMuted }}>
                {adventurePhotos.length}
              </span>
            </div>

            {/* Add adventure button */}
            {adventurePhotos.length < 30 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => adventurePhotoRef.current?.click()}
                disabled={uploadingAdventure}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold disabled:opacity-50"
                style={{ background: theme.primaryLight, color: theme.primary, border: `1.5px dashed ${theme.primary}40` }}
              >
                <Camera size={16} />
                Agregar aventura
                <span className="text-xs opacity-70">({adventurePhotos.length}/30)</span>
              </motion.button>
            )}

            {/* Caption input for new post */}
            <AnimatePresence>
              {showCaptionInput && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl overflow-hidden" style={{ background: theme.bgCard, border: `1px solid ${theme.primary}30` }}>
                  {pendingAdventureFile && (
                    <div className="w-full aspect-[4/3] overflow-hidden">
                      <img src={URL.createObjectURL(pendingAdventureFile)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <input type="text" value={adventureCaption} onChange={e => setAdventureCaption(e.target.value)}
                      placeholder={`¿Qué hacía ${pet.name}?`}
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

            {/* Adventure photos feed */}
            {adventurePhotos.length === 0 && !showCaptionInput ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  Comparte fotos de las aventuras de {pet?.name || 'tu mascota'} 📸
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {adventurePhotos.map((photo, i) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                          style={{ background: theme.primaryLight }}>
                          {pet.photo_url ? (
                            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PawPrint size={14} color={theme.primary} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight" style={{ color: theme.text }}>{pet.name}</p>
                          <p className="text-[10px]" style={{ color: theme.textMuted }}>
                            {new Date(photo.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewingPhoto(photo)}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: theme.primaryLight }}
                      >
                        <MapPin size={12} color={theme.primary} />
                      </button>
                    </div>
                    <button onClick={() => setViewingPhoto(photo)} className="w-full">
                      <img src={photo.photo_url} alt={photo.caption || ''} className="w-full aspect-[4/3] object-cover" />
                    </button>
                    {photo.caption && (
                      <div className="px-4 py-3">
                        <p className="text-sm" style={{ color: theme.text }}>
                          <span className="font-bold mr-1.5">{pet.name}</span>
                          {photo.caption}
                        </p>
                      </div>
                    )}
                    <div className="px-4 pb-3">
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>
                        {(() => {
                          const diff = Date.now() - new Date(photo.created_at).getTime()
                          const mins = Math.floor(diff / 60000)
                          if (mins < 60) return `hace ${mins}m`
                          const hrs = Math.floor(mins / 60)
                          if (hrs < 24) return `hace ${hrs}h`
                          const days = Math.floor(hrs / 24)
                          if (days < 30) return `hace ${days}d`
                          return new Date(photo.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })
                        })()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Image src="/petid-icon-white.png" alt="PetID" width={24} height={24} />
                  </div>
                  <span className="text-white font-bold text-[15px] tracking-wide">PetID</span>
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
                    navigator.share({ title: `PetID — ${pet.name}`, text: `Identidad digital de ${pet.name}`, url: publicUrl })
                  } else {
                    navigator.clipboard.writeText(publicUrl).then(() => alert('Link copiado'))
                  }
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: theme.primary, color: '#fff' }}
              >
                <Share2 size={16} className="inline mr-2" />
                Compartir identidad
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

      {/* Register type selector bottom sheet */}
      <AnimatePresence>
        {showRegisterMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShowRegisterMenu(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[91] rounded-t-3xl safe-bottom"
              style={{ background: theme.bgCard }}
            >
              <div className="p-6 pb-8">
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: theme.border }} />
                <h3 className="text-base font-bold text-center mb-1" style={{ color: theme.text }}>
                  Registrar información
                </h3>
                <p className="text-xs text-center mb-5" style={{ color: theme.textMuted }}>
                  ¿Qué deseas registrar para {pet?.name || 'tu mascota'}?
                </p>
                <div className="space-y-2.5">
                  {[
                    { type: 'vaccine' as const, icon: Syringe, label: 'Vacuna', sub: 'Registra una nueva vacuna aplicada', color: theme.primary },
                    { type: 'deworming' as const, icon: Bug, label: 'Desparasitación', sub: 'Bravecto, NexGard, Simparica...', color: '#E8913A' },
                    { type: 'medication' as const, icon: Pill, label: 'Medicamento', sub: 'Medicamentos generales', color: '#4D91C6' },
                  ].map(opt => (
                    <motion.button
                      key={opt.type}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setShowRegisterMenu(false)
                        if (opt.type === 'vaccine') {
                          setShowAddVax(true)
                        } else {
                          setRegisterType(opt.type)
                        }
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left"
                      style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${opt.color}12` }}
                      >
                        <opt.icon size={22} color={opt.color} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: theme.text }}>{opt.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{opt.sub}</p>
                      </div>
                      <ChevronRight size={16} color={theme.textMuted} className="opacity-40" />
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={() => setShowRegisterMenu(false)}
                  className="w-full py-3 mt-4 text-sm font-medium"
                  style={{ color: theme.textMuted }}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
