'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Camera, ArrowLeft } from 'lucide-react'

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

      // Upload photo if exists
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

      // Insert pet
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

      // Get petid user id
      const { data: petidUser } = await supabase
        .from('petid_users')
        .select('id')
        .eq('id', user.id)
        .single()

      // Link owner to pet
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

  const inputStyle = {
    borderColor: theme.border,
    background: theme.bgCard,
    color: theme.text,
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.bg }}>
      <TopBar title="Nueva Mascota" />

      <div className="px-5 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4" style={{ color: theme.primary }}>
          <ArrowLeft size={18} /> Volver
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: theme.primaryLight, border: `3px dashed ${theme.primary}` }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Camera size={28} color={theme.primary} className="mx-auto" />
                    <span className="text-xs mt-1 block" style={{ color: theme.primary }}>Foto</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>

          {/* Basic info */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: theme.bgCard }}>
            <h3 className="font-semibold" style={{ color: theme.text }}>Información básica</h3>

            <input
              type="text" placeholder="Nombre de la mascota *" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={inputStyle}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}
                className="px-4 py-3 rounded-xl border text-sm outline-none"
                style={inputStyle}
              >
                <option value="canine">🐕 Perro</option>
                <option value="feline">🐈 Gato</option>
              </select>
              <select
                value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}
                className="px-4 py-3 rounded-xl border text-sm outline-none"
                style={inputStyle}
              >
                <option value="male">♂ Macho</option>
                <option value="female">♀ Hembra</option>
              </select>
            </div>

            <input
              type="text" placeholder="Raza"
              value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={inputStyle}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date" placeholder="Nacimiento"
                value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                className="px-4 py-3 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text" placeholder="Color"
                value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                className="px-4 py-3 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" step="0.1" placeholder="Peso (kg)"
                value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}
                className="px-4 py-3 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text" placeholder="Microchip #"
                value={form.microchip_number} onChange={e => setForm({ ...form, microchip_number: e.target.value })}
                className="px-4 py-3 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Hobbies */}
          <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
            <h3 className="font-semibold mb-3" style={{ color: theme.text }}>Hobbies favoritos</h3>
            <div className="flex flex-wrap gap-2">
              {hobbies.map(h => (
                <button
                  key={h} type="button"
                  onClick={() => toggleChip(h, selectedHobbies, setSelectedHobbies)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{
                    background: selectedHobbies.includes(h) ? theme.primary : theme.bgCard,
                    color: selectedHobbies.includes(h) ? '#fff' : theme.text,
                    borderColor: selectedHobbies.includes(h) ? theme.primary : theme.border,
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
            <h3 className="font-semibold mb-3" style={{ color: theme.text }}>Personalidad</h3>
            <div className="flex flex-wrap gap-2">
              {personalities.map(p => (
                <button
                  key={p} type="button"
                  onClick={() => toggleChip(p, selectedPersonality, setSelectedPersonality)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{
                    background: selectedPersonality.includes(p) ? theme.accent : theme.bgCard,
                    color: selectedPersonality.includes(p) ? '#fff' : theme.text,
                    borderColor: selectedPersonality.includes(p) ? theme.accent : theme.border,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50"
            style={{ background: theme.primary }}
          >
            {saving ? 'Registrando...' : '🐾 Registrar Mascota'}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
