'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Plus, ChevronRight, Camera, PawPrint } from 'lucide-react'
import { motion } from 'framer-motion'

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

export default function PetsPage() {
  const { user, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
      return
    }
    if (user) fetchPets()
  }, [user, authLoading])

  const fetchPets = async () => {
    const { data: ownerData } = await supabase
      .from('petid_pet_owners')
      .select('pet_id')
      .eq('user_id', user!.id)

    if (ownerData && ownerData.length > 0) {
      const petIds = ownerData.map((o: any) => o.pet_id)
      const { data: petsData } = await supabase
        .from('petid_pets')
        .select('*')
        .in('id', petIds)
      if (petsData) setPets(petsData)
    }
    setLoading(false)
  }

  const getAge = (dob: string | null) => {
    if (!dob) return ''
    const diff = Date.now() - new Date(dob).getTime()
    const years = Math.floor(diff / 31536000000)
    const months = Math.floor((diff % 31536000000) / 2592000000)
    if (years > 0) return `${years} año${years > 1 ? 's' : ''}`
    return `${months} mes${months !== 1 ? 'es' : ''}`
  }

  if (authLoading || loading) {
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

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar title="Mis Mascotas" />

      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold" style={{ color: theme.text }}>
              Mis Mascotas
            </h2>
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {pets.length} mascota{pets.length !== 1 ? 's' : ''} registrada{pets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => router.push('/pet/new')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: theme.primary,
              color: '#fff',
            }}
          >
            <Plus size={16} /> Agregar
          </motion.button>
        </div>

        {/* Pet list — clean card style matching reference */}
        {pets.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: theme.primaryLight }}
            >
              <PawPrint size={36} color={theme.primary} />
            </motion.div>
            <h4 className="font-bold text-lg mb-1" style={{ color: theme.text }}>
              Sin mascotas
            </h4>
            <p className="text-sm mb-5" style={{ color: theme.textMuted }}>
              Registra tu primera mascota y genera su tarjeta digital
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/pet/new')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: theme.primary }}
            >
              <Plus size={16} /> Registrar mascota
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {pets.map((pet, i) => (
              <motion.button
                key={pet.id}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/pet/${pet.id}`)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left"
                style={{
                  background: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                }}
              >
                {/* Pet photo thumbnail */}
                <div
                  className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: theme.primaryLight }}
                >
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={20} color={theme.textMuted} />
                  )}
                </div>

                {/* Pet info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] truncate" style={{ color: theme.text }}>
                    {pet.name}
                  </p>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    {pet.breed}
                  </p>
                  {pet.date_of_birth && (
                    <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                      {getAge(pet.date_of_birth)}
                    </p>
                  )}
                </div>

                {/* Chevron */}
                <ChevronRight size={20} color={theme.textMuted} className="opacity-40 flex-shrink-0" />
              </motion.button>
            ))}

            {/* Add more link */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/pet/new')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
              style={{ color: theme.primary, border: `1px dashed ${theme.border}` }}
            >
              <Plus size={16} /> Agregar Mascota
            </motion.button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
