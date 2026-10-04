'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Camera, ArrowLeft, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'

const hobbies = [
  '🎾 Buscar pelota', '🏃 Correr', '💤 Dormir', '🦴 Morder huesos',
  '🏊 Nadar', '🐾 Pasear', '🧸 Juguetes', '🐕 Otros perros',
  '🌳 Parque', '🎯 Trucos', '🛋️ Sofá', '🍖 Comer'
]

const personalities = [
  '😊 Amigable', '🎉 Juguetón', '😴 Tranquilo', '🛡️ Protector',
  '🧠 Inteligente', '💕 Cariñoso', '🏃 Energético', '😎 Independiente'
]

export default function NewPetPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    name: '', species: 'canine', breed: '', sex: 'male',
    date_of_birth: '', color: '', weight: '', microchip_number: ''
  })
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([])
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const toggleChip = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    try {
      let photo_url = null

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('pet-photos')
          .upload(path, photoFile)
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('pet-photos')
            .getPublicUrl(path)
          photo_url = urlData.publicUrl
        }
      }

      const { data: pet, error: petErr } = await supabase
        .from('petid_pets')
        .insert({
          name: form.name,
          species: form.species,
          breed: form.breed,
          sex: form.sex,
          date_of_birth: form.date_of_birth || null,
          color: form.color || null,
          weight_kg: form.weight ? parseFloat(form.weight) : null,
          microchip_number: form.microchip_number || null,
          photo_url,
          hobbies: selectedHobbies,
          personality: selectedPersonality,
        })
        .select('id')
        .single()

      if (petErr) throw petErr

      const { data: petidUser } = await supabase
        .from('petid_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (pet && petidUser) {
        await supabase.from('petid_pet_owners').insert({
          pet_id: pet.id,
          user_id: petidUser.id,
          is_primary: true
        })
      }

      router.push(`/pet/${pet.id}`)
    } catch (err: any) {
      alert(err.message || 'Error al registrar mascota')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-4 py-3.5 rounded-xl border text-sm outline-none focus:ring-2 transition-all"

  const inputStyle = {
    borderColor: theme.border,
    background: theme.bgCard,
    color: theme.text,
    focusRingColor: `${theme.primary}30`,
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar title="Nueva Mascota" />

      <div className="px-5 py-5">
        <motion.button
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium mb-5"
          style={{ color: theme.primary }}
        >
          <ArrowLeft size={18} /> Volver
        </motion.button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center mb-2"
          >
            <label className="cursor-pointer group">
              <div
                className="w-28 h-28 rounded-3xl flex items-center justify-center overflow-hidden relative"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})`,
                  border: `3px dashed ${theme.primary}50`,
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Camera size={28} color={theme.primary} className="mx-auto mb-1" />
                    <span className="text-[10px] font-semibold" style={{ color: theme.primary }}>
                      Agregar foto
                    </span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </motion.div>

          {/* Basic info card */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 space-y-3.5"
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              boxShadow: `0 2px 12px ${theme.primary}06`,
            }}
          >
            <h3 className="font-bold text-sm" style={{ color: theme.text }}>Información básica</h3>

            <input
              type="text" placeholder="Nombre de la mascota *" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              style={{ borderColor: theme.border, background: theme.bg, color: theme.text }}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}
                className={inputClass}
                style={{ borderColor: theme.border, background: theme.bg, color: theme.text }}
              >
                <option value="canine">🐕 Perro</option>
                <option value="feline">🐈 Gato</option>
              </select>
              <select
                value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}
                className={inputClass}
                style={{ borderColor: theme.border, background: theme.bg, color: theme.text }}
              >
                <option value="male">♂ Macho</option>
                <option value="female">♀ Hembra</option>
              </select>
            </div>

            <input
              type="text" placeholder="Raza"
              value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })}
              className={inputClass}
              style={{ borderColor: theme.border, background: theme.bg, color: theme.text }}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date" placeholder="Nacimiento"
                value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                className={inputClass}
                style={{ borderColor: theme.border, background: theme.bg, color: theme.text }}
              />
              <input
                type="text" placeholder="Color"
                value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                className={inputClass}
                style={{ borderColor: theme.border, background: theme.bg, color: theme.text }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" step="0.1" placeholder="Peso (kg)"
                value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}
                className={inputClass}
                style={{ borderColor: theme.border, background: theme.bg, color: theme.text }}
              />
              <input
                type="text" placeholder="Microchip #"
                value={form.microchip_number} onChange={e => setForm({ ...form, microchip_number: e.target.value })}
                className={inputClass}
                style={{ borderColor: theme.border, background: theme.bg, color: theme.text }}
              />
            </div>
          </motion.div>

          {/* Hobbies */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5"
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              boxShadow: `0 2px 12px ${theme.primary}06`,
            }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: theme.text }}>Hobbies favoritos</h3>
            <div className="flex flex-wrap gap-2">
              {hobbies.map(h => {
                const selected = selectedHobbies.includes(h)
                return (
                  <motion.button
                    key={h} type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleChip(h, selectedHobbies, setSelectedHobbies)}
                    className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                    style={{
                      background: selected
                        ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                        : theme.bg,
                      color: selected ? '#fff' : theme.text,
                      borderColor: selected ? 'transparent' : theme.border,
                      boxShadow: selected ? `0 3px 10px ${theme.primary}25` : 'none',
                    }}
                  >
                    {h}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Personality */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-5"
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              boxShadow: `0 2px 12px ${theme.primary}06`,
            }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: theme.text }}>Personalidad</h3>
            <div className="flex flex-wrap gap-2">
              {personalities.map(p => {
                const selected = selectedPersonality.includes(p)
                return (
                  <motion.button
                    key={p} type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleChip(p, selectedPersonality, setSelectedPersonality)}
                    className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                    style={{
                      background: selected
                        ? `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`
                        : theme.bg,
                      color: selected ? '#fff' : theme.text,
                      borderColor: selected ? 'transparent' : theme.border,
                      boxShadow: selected ? `0 3px 10px ${theme.accent}25` : 'none',
                    }}
                  >
                    {p}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.button
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            type="submit" disabled={saving}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              boxShadow: `0 8px 25px ${theme.primary}30`,
            }}
          >
            {saving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Sparkles size={18} />
                Registrar Mascota
              </>
            )}
          </motion.button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
