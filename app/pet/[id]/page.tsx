'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, CreditCard, Syringe, FileText, Share2, QrCode, Camera, PawPrint, Plus, Save, X, Pencil } from 'lucide-react'
import { motion } from 'framer-motion'
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

export default function PetProfilePage() {
  const { theme } = useTheme()
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [pet, setPet] = useState<Pet | null>(null)
  const [vaxRecords, setVaxRecords] = useState<VaxRecord[]>([])
  const [tab, setTab] = useState<'info' | 'vaccines' | 'card'>('info')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Pet>>({})

  useEffect(() => {
    fetchPet()
  }, [petId])

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
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl"
            style={{ background: theme.primaryLight }}>
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
          </div>
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium"
              style={{
                background: tab === t.key ? theme.bgCard : 'transparent',
                color: tab === t.key ? theme.primary : theme.textMuted,
              }}
            >
              <t.icon size={16} /> {t.label}
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
