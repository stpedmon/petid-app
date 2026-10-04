'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import { ArrowLeft, Syringe, FileText, Edit } from 'lucide-react'
import RoleGuard from '@/components/RoleGuard'

function VetPetContent() {
  const { theme } = useTheme()
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [pet, setPet] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [petId])

  const fetchData = async () => {
    const { data: petData } = await supabase
      .from('petid_pets').select('*').eq('id', petId).single()
    if (petData) setPet(petData)

    const { data: vax } = await supabase
      .from('petid_vaccination_records')
      .select('*, vaccine:vaccine_id(name)')
      .eq('pet_id', petId).order('applied_date', { ascending: false })
    if (vax) setRecords(vax)

    setLoading(false)
  }

  if (loading || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <div className="animate-pulse text-4xl">🐾</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: theme.bg }}>
      <header className="px-5 py-4" style={{ background: theme.primary }}>
        <span className="text-white font-bold text-lg">Expediente — {pet.name}</span>
      </header>

      <div className="px-5 py-6 space-y-4">
        <button onClick={() => router.push('/vet')} className="flex items-center gap-1 text-sm" style={{ color: theme.primary }}>
          <ArrowLeft size={18} /> Panel veterinaria
        </button>

        {/* Pet summary */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: theme.bgCard }}>
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl"
            style={{ background: theme.primaryLight }}>
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (pet.species === 'canine' ? '🐕' : '🐈')}
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: theme.text }}>{pet.name}</p>
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {pet.breed} • {pet.sex === 'male' ? 'Macho' : 'Hembra'} •
              {pet.weight_kg ? ` ${pet.weight_kg}kg` : ''}
            </p>
            <p className="text-xs font-mono mt-1" style={{ color: theme.textMuted }}>
              ID: {pet.id.slice(0, 8)}
              {pet.microchip_number ? ` • Chip: ${pet.microchip_number}` : ''}
            </p>
          </div>
        </div>

        {/* Vaccine history */}
        <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: theme.text }}>
              <Syringe size={18} /> Historial de Vacunas
            </h3>
            <button
              onClick={() => router.push(`/vet/vaccinate?pet=${petId}`)}
              className="text-xs px-3 py-1.5 rounded-full text-white"
              style={{ background: theme.primary }}
            >
              + Vacunar
            </button>
          </div>

          {records.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: theme.textMuted }}>
              Sin vacunas registradas
            </p>
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="p-3 rounded-xl border" style={{ borderColor: theme.border }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm" style={{ color: theme.text }}>
                        {(r.vaccine as any)?.name}
                      </p>
                      <p className="text-xs" style={{ color: theme.textMuted }}>
                        {new Date(r.applied_date).toLocaleDateString('es')}
                        {r.veterinarian_name ? ` • Dr. ${r.veterinarian_name}` : ''}
                      </p>
                      {r.lot_number && (
                        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                          Lote: {r.lot_number} {r.manufacturer ? `• ${r.manufacturer}` : ''}
                        </p>
                      )}
                    </div>
                    {r.certificate_number && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: theme.primaryLight, color: theme.primary }}>
                        {r.certificate_number}
                      </span>
                    )}
                  </div>
                  {r.next_dose_date && (
                    <p className="text-xs mt-2 px-2 py-1 rounded-lg inline-block"
                      style={{ background: `${theme.accent}15`, color: theme.primaryDark }}>
                      Próxima: {new Date(r.next_dose_date).toLocaleDateString('es')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VetPetPage() {
  return (
    <RoleGuard allowedRoles={['vet', 'clinic_admin', 'admin']}>
      <VetPetContent />
    </RoleGuard>
  )
}
