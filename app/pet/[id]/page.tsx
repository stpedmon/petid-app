'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, CreditCard, Syringe, FileText, Edit, Share2, QrCode, Camera } from 'lucide-react'
import QRCode from 'react-qr-code'

interface Pet {
  id: string; name: string; species: string; breed: string; sex: string;
  date_of_birth: string | null; color: string | null; weight_kg: number | null;
  microchip_number: string | null; photo_url: string | null;
  hobbies: string[] | null; personality: string[] | null;
}

interface VaxRecord {
  id: string; applied_date: string; next_dose_date: string | null;
  veterinarian_name: string | null; certificate_number: string | null;
  vaccine: { name: string };
}

export default function PetProfilePage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [pet, setPet] = useState<Pet | null>(null)
  const [vaxRecords, setVaxRecords] = useState<VaxRecord[]>([])
  const [tab, setTab] = useState<'info' | 'vaccines' | 'card'>('info')
  const [loading, setLoading] = useState(true)

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

  const getAge = (dob: string | null) => {
    if (!dob) return 'Edad desconocida'
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
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
          <QrCode size={24} color="#fff" />
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'info', label: 'Perfil', icon: FileText },
    { key: 'vaccines', label: 'Vacunas', icon: Syringe },
    { key: 'card', label: 'Tarjeta', icon: CreditCard },
  ] as const

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.bg }}>
      <TopBar title={pet.name} />

      <div className="px-5 py-4">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-sm mb-4" style={{ color: theme.primary }}>
          <ArrowLeft size={18} /> Mis mascotas
        </button>

        {/* Pet header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl"
            style={{ background: theme.primaryLight }}>
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <Camera size={22} color={theme.textMuted} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: theme.text }}>{pet.name}</h2>
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {pet.breed} • {getAge(pet.date_of_birth)}
            </p>
            <p className="text-xs mt-1 font-mono" style={{ color: theme.textMuted }}>
              ID: {pet.id.slice(0, 8)}
            </p>
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
              {[
                ['Especie', pet.species === 'canine' ? 'Perro' : 'Gato'],
                ['Sexo', pet.sex === 'male' ? 'Macho' : 'Hembra'],
                ['Color', pet.color || '—'],
                ['Peso', pet.weight_kg ? `${pet.weight_kg} kg` : '—'],
                ['Microchip', pet.microchip_number || 'Sin microchip'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: theme.textMuted }}>{label}</span>
                  <span className="font-medium" style={{ color: theme.text }}>{value}</span>
                </div>
              ))}
            </div>

            {pet.hobbies && pet.hobbies.length > 0 && (
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
            )}

            {pet.personality && pet.personality.length > 0 && (
              <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
                <h3 className="font-semibold mb-3" style={{ color: theme.text }}>Personalidad</h3>
                <div className="flex flex-wrap gap-2">
                  {pet.personality.map((p: string) => (
                    <span key={p} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: `${theme.accent}20`, color: theme.primaryDark }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vaccines tab */}
        {tab === 'vaccines' && (
          <div className="space-y-3">
            {vaxRecords.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: theme.bgCard }}>
                <Syringe size={40} color={theme.textMuted} className="mx-auto mb-3" />
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
