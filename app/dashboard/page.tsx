'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { PlusCircle, ChevronRight, Sparkles, Syringe, QrCode, Shield, Camera, Heart, MapPin, Calendar, PawPrint } from 'lucide-react'
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
        >
          <PawPrint size={48} color={theme.primary} strokeWidth={1.5} />
        </motion.div>
      </div>
    )
  }

  const getAge = (dob: string | null) => {
    if (!dob) return ''
    const diff = Date.now() - new Date(dob).getTime()
    const years = Math.floor(diff / 31536000000)
    const months = Math.floor((diff % 31536000000) / 2592000000)
    if (years > 0) return `${years} ano${years > 1 ? 's' : ''}`
    return `${months} mes${months !== 1 ? 'es' : ''}`
  }

  const firstName = userName ? userName.split(' ')[0] : 'amigo'

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar />

      <div className="px-5 py-5">
        {/* Greeting — social media style */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <h2
            className="text-2xl font-bold mb-0.5"
            style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}
          >
            Hola, {firstName}
          </h2>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            {pets.length === 0
              ? 'Registra tu primera mascota'
              : pets.length === 1
                ? `${pets[0].sex === 'female' ? 'Mama' : 'Papa'} de ${pets[0].name}`
                : `${pets[0].sex === 'female' ? 'Mama' : 'Papa'} de ${pets.map(p => p.name).join(' y ')}`}
          </p>
        </motion.div>

        {/* Stories-style pet avatars — Instagram inspired */}
        {pets.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {/* Add new pet circle */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => router.push('/pet/new')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                  style={{
                    border: `2px dashed ${theme.border}`,
                    background: theme.bgCard,
                  }}
                >
                  <PlusCircle size={24} color={theme.textMuted} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>
                  Agregar
                </span>
              </motion.button>

              {/* Pet story circles */}
              {pets.map((pet, i) => (
                <motion.button
                  key={pet.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => router.push(`/pet/${pet.id}`)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  <div
                    className="w-[72px] h-[72px] rounded-full p-[3px]"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                      style={{ background: theme.bgCard }}
                    >
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={22} color={theme.textMuted} />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold truncate max-w-[72px]" style={{ color: theme.text }}>
                    {pet.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

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

        {/* Pets section — Social media feed style */}
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
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
                style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
              />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})` }}
              >
                <Camera size={32} color={theme.primary} />
              </motion.div>
              <h4 className="font-bold text-lg mb-1" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
                Comienza aqui
              </h4>
              <p className="text-sm mb-5 max-w-[240px] mx-auto" style={{ color: theme.textMuted }}>
                Registra tu primera mascota y genera su tarjeta digital con QR unico
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
            <div className="space-y-4">
              {pets.map((pet, i) => (
                <motion.button
                  key={pet.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/pet/${pet.id}`)}
                  className="w-full rounded-2xl text-left relative overflow-hidden group"
                  style={{
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 2px 16px ${theme.primary}06`,
                  }}
                >
                  {/* Large photo area — social media post style */}
                  <div
                    className="w-full aspect-square max-h-[280px] flex items-center justify-center overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})` }}
                  >
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera size={48} color={theme.textMuted} className="mx-auto mb-2" />
                        <p className="text-xs font-medium" style={{ color: theme.textMuted }}>Sin foto</p>
                      </div>
                    )}
                  </div>

                  {/* Info below photo — like Instagram post caption */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})`,
                            border: `2px solid ${theme.primary}30`,
                          }}
                        >
                          {pet.photo_url ? (
                            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={16} color={theme.textMuted} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: theme.text }}>{pet.name}</p>
                          <p className="text-[11px]" style={{ color: theme.textMuted }}>
                            {pet.breed || (pet.species === 'canine' ? 'Perro' : 'Gato')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        color={theme.textMuted}
                        className="opacity-40 group-hover:opacity-70 transition-opacity"
                      />
                    </div>

                    {/* Tags row */}
                    <div className="flex gap-2 mt-2">
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ background: `${theme.primary}10`, color: theme.primary }}
                      >
                        {pet.sex === 'male' ? 'Macho' : 'Hembra'}
                      </span>
                      {pet.date_of_birth && (
                        <span
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{ background: `${theme.accent}15`, color: theme.primaryDark }}
                        >
                          <Calendar size={10} />
                          {getAge(pet.date_of_birth)}
                        </span>
                      )}
                    </div>
                  </div>
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
