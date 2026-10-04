'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { PlusCircle, ChevronRight, Dog as DogIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  photo_url: string | null
  sex: string
  date_of_birth: string | null
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
      return
    }
    if (user) fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    // Get user name
    const { data: userData } = await supabase
      .schema('petid' as any)
      .from('users')
      .select('name')
      .eq('auth_id', user!.id)
      .single()
    if (userData) setUserName(userData.name)

    // Get pets
    const { data: ownerData } = await supabase
      .schema('petid' as any)
      .from('pet_owners')
      .select('pet_id')
      .eq('user_id', user!.id)

    if (ownerData && ownerData.length > 0) {
      const petIds = ownerData.map((o: any) => o.pet_id)
      const { data: petsData } = await supabase
        .schema('petid' as any)
        .from('pets')
        .select('*')
        .in('id', petIds)
      if (petsData) setPets(petsData)
    }
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <div className="animate-pulse text-4xl">🐾</div>
      </div>
    )
  }

  const getAge = (dob: string | null) => {
    if (!dob) return ''
    const diff = Date.now() - new Date(dob).getTime()
    const years = Math.floor(diff / 31536000000)
    const months = Math.floor((diff % 31536000000) / 2592000000)
    if (years > 0) return `${years} año${years > 1 ? 's' : ''}`
    return `${months} mes${months !== 1 ? 'es' : ''}`
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.bg }}>
      <TopBar />

      <div className="px-5 py-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: theme.text }}>
          Hola, {userName || 'amigo'} 👋
        </h2>
        <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
          {pets.length === 0 ? 'Registra tu primera mascota' : `Tienes ${pets.length} mascota${pets.length > 1 ? 's' : ''}`}
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl p-4" style={{ background: theme.primaryLight }}>
            <p className="text-2xl font-bold" style={{ color: theme.primary }}>{pets.length}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>Mascotas</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: theme.primaryLight }}>
            <p className="text-2xl font-bold" style={{ color: theme.primary }}>0</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>Vacunas pendientes</p>
          </div>
        </div>

        {/* Pet list */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: theme.text }}>Mis Mascotas</h3>
          <button
            onClick={() => router.push('/pet/new')}
            className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full"
            style={{ background: theme.primary, color: '#fff' }}
          >
            <PlusCircle size={16} /> Agregar
          </button>
        </div>

        {pets.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: theme.bgCard }}
          >
            <DogIcon size={48} color={theme.textMuted} className="mx-auto mb-3" />
            <p className="font-medium mb-1" style={{ color: theme.text }}>Sin mascotas registradas</p>
            <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
              Agrega tu primera mascota para generar su tarjeta digital
            </p>
            <button
              onClick={() => router.push('/pet/new')}
              className="px-6 py-2.5 rounded-xl text-white font-medium text-sm"
              style={{ background: theme.primary }}
            >
              Registrar mascota
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => router.push(`/pet/${pet.id}`)}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left"
                style={{ background: theme.bgCard }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl overflow-hidden flex-shrink-0"
                  style={{ background: theme.primaryLight }}
                >
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    pet.species === 'canine' ? '🐕' : '🐈'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: theme.text }}>{pet.name}</p>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    {pet.breed} {pet.date_of_birth ? `• ${getAge(pet.date_of_birth)}` : ''}
                  </p>
                </div>
                <ChevronRight size={20} color={theme.textMuted} />
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
