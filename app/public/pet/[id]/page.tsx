'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Phone, MessageCircle, ShieldCheck, Syringe, Dog, User, Heart } from 'lucide-react'
import { getPetAge } from '@/lib/petAge'

interface Pet {
  id: string; name: string; species: string; breed: string; sex: string;
  date_of_birth: string | null; color: string | null; weight_kg: number | null;
  photo_url: string | null; hobbies: string[] | null; personality: string[] | null;
}

interface Owner {
  full_name: string; phone: string | null;
}

function maskPhone(phone: string): string {
  // Show last 4 digits masked: ••••••1234
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 4) return '••••••••'
  return '••••••' + digits.slice(-4)
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

  const getAge = (dob: string | null) => getPetAge(dob)

  // Check if vaccines are up to date (no overdue next_dose)
  const vaccinesUpToDate = vaccines.length > 0 && vaccines.every(v => {
    if (!v.next_dose_date) return true
    return new Date(v.next_dose_date) >= new Date()
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAF9' }}>
        <div className="animate-pulse text-4xl">🐾</div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F8FAF9' }}>
        <Dog size={64} color="#CBD5E1" style={{ marginBottom: 16 }} />
        <h1 className="text-xl font-bold mb-2" style={{ color: '#1F1F1F' }}>Mascota no encontrada</h1>
        <p className="text-sm text-center" style={{ color: '#94A3B8' }}>El código QR no corresponde a ninguna mascota registrada.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8FAF9' }}>
      {/* PetID Branding Header */}
      <div className="text-center pt-5 pb-2">
        <span className="text-sm font-bold tracking-wider" style={{ color: '#2E9D68', letterSpacing: '0.08em' }}>
          PetID
        </span>
      </div>

      {/* Pet Hero Card */}
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8EDE9' }}>
        {/* Photo + Name */}
        <div className="text-center pt-6 pb-4 px-5">
          <div
            className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center text-4xl"
            style={{ background: '#E8F5EE', border: '3px solid #2E9D68' }}
          >
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              pet.species === 'canine' ? '🐕' : '🐈'
            )}
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1F1F1F' }}>
            {pet.name}
          </h1>
          <p className="text-sm mb-3" style={{ color: '#64748B' }}>
            {pet.breed}{getAge(pet.date_of_birth) ? ` · ${getAge(pet.date_of_birth)}` : ''}
          </p>

          {/* Verified Badge - Prominent */}
          <div
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ background: '#E8F5EE', color: '#2E9D68' }}
          >
            <ShieldCheck size={14} />
            IDENTIDAD VERIFICADA
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#E8EDE9' }} />

        {/* Info Section */}
        <div className="px-5 py-4 space-y-3">
          {/* Owner */}
          {owner && (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#F1F5F9' }}
              >
                <User size={16} color="#64748B" />
              </div>
              <div>
                <span className="text-xs" style={{ color: '#94A3B8' }}>Propietario</span>
                <p className="text-sm font-semibold" style={{ color: '#1F1F1F' }}>{owner.full_name}</p>
              </div>
            </div>
          )}

          {/* Masked Phone */}
          {owner?.phone && (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#F1F5F9' }}
              >
                <Phone size={16} color="#64748B" />
              </div>
              <div>
                <span className="text-xs" style={{ color: '#94A3B8' }}>Teléfono</span>
                <p className="text-sm font-medium" style={{ color: '#1F1F1F' }}>{maskPhone(owner.phone)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#E8EDE9' }} />

        {/* Health Status */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: vaccinesUpToDate ? '#E8F5EE' : '#FFF4E6' }}
            >
              <Heart size={16} color={vaccinesUpToDate ? '#2E9D68' : '#F0A62B'} />
            </div>
            <div>
              <span className="text-xs" style={{ color: '#94A3B8' }}>Salud</span>
              <p className="text-sm font-semibold" style={{ color: vaccinesUpToDate ? '#2E9D68' : '#F0A62B' }}>
                {vaccines.length === 0
                  ? 'Sin registros de vacunas'
                  : vaccinesUpToDate
                    ? '💉 Vacunas al día'
                    : '⚠️ Vacunas pendientes'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons — Prominent */}
      {owner?.phone && (
        <div className="mx-4 mt-4 space-y-3">
          <a
            href={`tel:${owner.phone}`}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base font-bold text-white w-full"
            style={{ background: '#2E9D68', boxShadow: '0 2px 8px rgba(46,157,104,0.25)' }}
          >
            <Phone size={20} />
            Llamar al propietario
          </a>
          <a
            href={`https://wa.me/${owner.phone.replace(/\D/g, '')}`}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base font-bold w-full"
            style={{
              background: '#FFFFFF',
              color: '#2E9D68',
              border: '2px solid #2E9D68',
            }}
          >
            <MessageCircle size={20} />
            Contactar
          </a>
        </div>
      )}

      {/* Pet Details (compact) */}
      <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E8EDE9' }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: '#1F1F1F' }}>Información</h3>
        <div className="grid grid-cols-2 gap-y-2.5 text-sm">
          {[
            ['Especie', pet.species === 'canine' ? 'Perro' : pet.species === 'feline' ? 'Gato' : pet.species],
            ['Sexo', pet.sex === 'male' ? 'Macho' : 'Hembra'],
            ['Color', pet.color || '—'],
            ['Peso', pet.weight_kg ? `${pet.weight_kg} kg` : '—'],
          ].map(([l, v]) => (
            <div key={l}>
              <span className="text-xs" style={{ color: '#94A3B8' }}>{l}</span>
              <p className="font-medium" style={{ color: '#1F1F1F' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vaccine History (if any) */}
      {vaccines.length > 0 && (
        <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E8EDE9' }}>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1F1F1F' }}>
            <Syringe size={16} color="#2E9D68" /> Vacunas registradas
          </h3>
          <div className="space-y-2">
            {vaccines.map(v => (
              <div key={v.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1F1F1F' }}>{(v.vaccine as any)?.name}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    {new Date(v.applied_date).toLocaleDateString('es')}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E8F5EE', color: '#2E9D68' }}>✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 mt-2">
        <p className="text-xs" style={{ color: '#94A3B8' }}>
          Powered by <strong style={{ color: '#2E9D68' }}>PetID</strong> — petid.app
        </p>
      </div>
    </div>
  )
}
