'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Phone, MessageCircle, MapPin, Syringe, Dog, Shield } from 'lucide-react'

interface Pet {
  id: string; name: string; species: string; breed: string; sex: string;
  date_of_birth: string | null; color: string | null; weight_kg: number | null;
  photo_url: string | null; hobbies: string[] | null; personality: string[] | null;
}

interface Owner {
  full_name: string; phone: string | null;
}

export default function PublicPetPage() {
  const params = useParams()
  const petId = params.id as string
  const [pet, setPet] = useState<Pet | null>(null)
  const [owner, setOwner] = useState<Owner | null>(null)
  const [vaccines, setVaccines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublicData()
    // Log QR scan
    supabase.from('petid_qr_scans').insert({ pet_id: petId })
  }, [petId])

  const fetchPublicData = async () => {
    const { data: petData } = await supabase
      .from('petid_pets').select('*').eq('id', petId).single()
    if (petData) setPet(petData)

    const { data: ownerLink } = await supabase
      .from('petid_pet_owners').select('user_id').eq('pet_id', petId).eq('is_primary', true).single()
    if (ownerLink) {
      const { data: userData } = await supabase
        .from('petid_users').select('full_name, phone').eq('id', ownerLink.user_id).single()
      if (userData) setOwner(userData as Owner)
    }

    const { data: vax } = await supabase
      .from('petid_vaccination_records')
      .select('*, vaccine:vaccine_id(name)')
      .eq('pet_id', petId).order('applied_date', { ascending: false }).limit(5)
    if (vax) setVaccines(vax)

    setLoading(false)
  }

  const getAge = (dob: string | null) => {
    if (!dob) return ''
    const diff = Date.now() - new Date(dob).getTime()
    const y = Math.floor(diff / 31536000000)
    const m = Math.floor((diff % 31536000000) / 2592000000)
    if (y > 0) return `${y} año${y > 1 ? 's' : ''}`
    return `${m} mes${m !== 1 ? 'es' : ''}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-4xl">🐾</div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <Dog size={64} className="text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Mascota no encontrada</h1>
        <p className="text-gray-500 text-sm text-center">El código QR no corresponde a ninguna mascota registrada.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative" style={{ background: 'linear-gradient(135deg, #1B6B4A, #145236)' }}>
        <div className="px-5 py-8 text-center text-white">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-white/20 flex items-center justify-center text-4xl">
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              pet.species === 'canine' ? '🐕' : '🐈'
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {pet.name}
          </h1>
          <p className="text-sm opacity-80">{pet.breed} • {getAge(pet.date_of_birth)}</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Shield size={14} />
            <span className="text-xs">Verificado por Pet ID</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 -mt-2">
        {/* Contact buttons - NO phone number visible, only action buttons */}
        {owner && (
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-3">Dueño: <strong className="text-gray-800">{owner.full_name}</strong></p>
            <div className="grid grid-cols-2 gap-3">
              {owner.phone && (
                <>
                  <a href={`tel:${owner.phone}`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white"
                    style={{ background: '#1B6B4A' }}>
                    <Phone size={18} /> Llamar
                  </a>
                  <a href={`https://wa.me/${owner.phone.replace(/\D/g, '')}`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white"
                    style={{ background: '#25D366' }}>
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pet info */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Información</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            {[
              ['Especie', pet.species === 'canine' ? 'Perro' : 'Gato'],
              ['Sexo', pet.sex === 'male' ? 'Macho' : 'Hembra'],
              ['Color', pet.color || '—'],
              ['Peso', pet.weight_kg ? `${pet.weight_kg} kg` : '—'],
            ].map(([l, v]) => (
              <div key={l}>
                <span className="text-gray-400 text-xs">{l}</span>
                <p className="text-gray-800 font-medium">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hobbies */}
        {pet.hobbies && pet.hobbies.length > 0 && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Hobbies</h3>
            <div className="flex flex-wrap gap-2">
              {pet.hobbies.map(h => (
                <span key={h} className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Vaccines */}
        {vaccines.length > 0 && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Syringe size={18} /> Vacunas
            </h3>
            <div className="space-y-2">
              {vaccines.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{(v.vaccine as any)?.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(v.applied_date).toLocaleDateString('es')}
                    </p>
                  </div>
                  {v.certificate_number && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            🐾 Powered by Pet ID — petid.app
          </p>
        </div>
      </div>
    </div>
  )
}
