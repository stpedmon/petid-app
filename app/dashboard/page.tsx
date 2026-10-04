'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { PlusCircle, ChevronRight, Sparkles, Syringe, QrCode, Shield } from 'lucide-react'
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
    const { data: userData } = await supabase
      .from('petid_users')
      .select('full_name')
      .eq('id', user!.id)
      .single()
    if (userData) setUserName(userData.full_name)

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl"
        >
          🐾
        </motion.div>
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

  const firstName = userName ? userName.split(' ')[0] : 'amigo'

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar />

      <div className="px-5 py-5">
        {/* Greeting */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <h2
            className="text-2xl font-bold mb-0.5"
            style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}
          >
            Hola, {firstName} 👋
          </h2>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            {pets.length === 0
              ? 'Registra tu primera mascota'
              : `Cuidando ${pets.length} mascota${pets.length > 1 ? 's' : ''} con amor`}
          </p>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { icon: <QrCode size={18} />, value: pets.length, label: 'Mascotas', color: theme.primary },
            { icon: <Syringe size={18} />, value: 0, label: 'Vacunas', color: '#E65100' },
            { icon: <Shield size={18} />, value: 0, label: 'Alertas', color: '#7B1FA2' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="rounded-2xl p-4 text-center"
              style={{
                background: theme.bgCard,
                boxShadow: `0 2px 12px ${theme.primary}08`,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `${stat.color}12`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <p className="text-xl font-bold" style={{ color: theme.text }}>{stat.value}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: theme.textMuted }}>{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Pets section */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
              Mis Mascotas
            </h3>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => router.push('/pet/new')}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                color: '#fff',
                boxShadow: `0 4px 12px ${theme.primary}30`,
              }}
            >
              <PlusCircle size={14} /> Agregar
            </motion.button>
          </div>

          {pets.length === 0 ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-3xl p-8 text-center relative overflow-hidden"
              style={{
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                boxShadow: `0 4px 20px ${theme.primary}06`,
              }}
            >
              {/* Decorative gradient */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
                style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
              />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-6xl mb-4"
              >
                🐾
              </motion.div>
              <h4 className="font-bold text-lg mb-1" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
                ¡Comienza aquí!
              </h4>
              <p className="text-sm mb-5 max-w-[240px] mx-auto" style={{ color: theme.textMuted }}>
                Registra tu primera mascota y genera su tarjeta digital con QR único
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/pet/new')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  boxShadow: `0 6px 20px ${theme.primary}30`,
                }}
              >
                <Sparkles size={16} /> Registrar mascota
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {pets.map((pet, i) => (
                <motion.button
                  key={pet.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/pet/${pet.id}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left relative overflow-hidden group"
                  style={{
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 2px 12px ${theme.primary}06`,
                  }}
                >
                  {/* Left accent */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                    style={{ background: `linear-gradient(180deg, ${theme.primary}, ${theme.accent})` }}
                  />

                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 ml-2"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})`,
                      border: `2px solid ${theme.border}`,
                    }}
                  >
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      pet.species === 'canine' ? '🐕' : '🐈'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: theme.text }}>{pet.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                      {pet.breed || (pet.species === 'canine' ? 'Perro' : 'Gato')}
                      {pet.date_of_birth ? ` · ${getAge(pet.date_of_birth)}` : ''}
                    </p>
                    <div className="flex gap-1.5 mt-1.5">
                      <span
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${theme.primary}12`, color: theme.primary }}
                      >
                        {pet.sex === 'male' ? '♂ Macho' : '♀ Hembra'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    size={20}
                    color={theme.textMuted}
                    className="flex-shrink-0 opacity-40 group-hover:opacity-70 transition-opacity"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav />
    </div>
  )
}
