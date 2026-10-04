'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { PlusCircle, ChevronRight, Syringe, QrCode, Camera, Calendar, PawPrint, AlertCircle, Bell } from 'lucide-react'
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

interface UpcomingVax {
  id: string
  next_dose_date: string
  pet: { id: string; name: string; photo_url: string | null }
  vaccine: { name: string }
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [upcomingVax, setUpcomingVax] = useState<UpcomingVax[]>([])
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

      // Fetch upcoming/overdue vaccines
      const { data: vaxData } = await supabase
        .from('petid_vaccination_records')
        .select('id, next_dose_date, pet:pet_id(id, name, photo_url), vaccine:vaccine_id(name)')
        .in('pet_id', petIds)
        .not('next_dose_date', 'is', null)
        .order('next_dose_date', { ascending: true })
        .limit(5)
      if (vaxData) setUpcomingVax(vaxData as any)
    }
    setLoading(false)
  }

  const isOverdue = (date: string) => new Date(date) < new Date()
  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
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

  const firstName = userName ? userName.split(' ')[0] : 'amigo'
  const overdueCount = upcomingVax.filter(v => isOverdue(v.next_dose_date)).length

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar />

      <div className="px-5 py-4">
        {/* Greeting */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-5"
        >
          <h2 className="text-2xl font-bold mb-0.5" style={{ color: theme.text }}>
            Hola, {firstName}
          </h2>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            {pets.length === 0
              ? 'Registra tu primera mascota'
              : `${pets.length} mascota${pets.length > 1 ? 's' : ''} registrada${pets.length > 1 ? 's' : ''}`}
          </p>
        </motion.div>

        {/* Stories-style pet avatars */}
        {pets.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {/* Add new pet circle */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => router.push('/pet/new')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center"
                  style={{
                    border: `2px dashed ${theme.border}`,
                    background: theme.bgCard,
                  }}
                >
                  <PlusCircle size={22} color={theme.textMuted} />
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
                    className="w-[68px] h-[68px] rounded-full p-[3px]"
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
                        <Camera size={20} color={theme.textMuted} />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold truncate max-w-[68px]" style={{ color: theme.text }}>
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
          className="grid grid-cols-3 gap-3 mb-5"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push('/pets')}
            className="rounded-2xl p-3.5 text-center"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: theme.primaryLight, color: theme.primary }}
            >
              <PawPrint size={18} />
            </div>
            <p className="text-xl font-bold" style={{ color: theme.text }}>{pets.length}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: theme.textMuted }}>Mascotas</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push('/vaccines')}
            className="rounded-2xl p-3.5 text-center"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: '#2E9D6812', color: '#2E9D68' }}
            >
              <Syringe size={18} />
            </div>
            <p className="text-xl font-bold" style={{ color: theme.text }}>
              {upcomingVax.length}
            </p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: theme.textMuted }}>Vacunas</p>
          </motion.button>

          <motion.div
            className="rounded-2xl p-3.5 text-center"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{
                background: overdueCount > 0 ? '#D94B5B12' : '#4D91C612',
                color: overdueCount > 0 ? '#D94B5B' : '#4D91C6',
              }}
            >
              {overdueCount > 0 ? <AlertCircle size={18} /> : <Bell size={18} />}
            </div>
            <p className="text-xl font-bold" style={{ color: theme.text }}>{overdueCount}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: theme.textMuted }}>Alertas</p>
          </motion.div>
        </motion.div>

        {/* Overdue alert banner */}
        {overdueCount > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            onClick={() => router.push('/vaccines')}
            className="flex items-center gap-3 p-4 rounded-2xl mb-5 cursor-pointer"
            style={{ background: '#D94B5B10', border: '1px solid #D94B5B25' }}
          >
            <AlertCircle size={20} color="#D94B5B" />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#D94B5B' }}>
                {overdueCount} vacuna{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Toca para ver detalles
              </p>
            </div>
            <ChevronRight size={16} color="#D94B5B" />
          </motion.div>
        )}

        {/* Upcoming vaccines section */}
        {upcomingVax.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold" style={{ color: theme.text }}>
                Proximas vacunas
              </h3>
              <button
                onClick={() => router.push('/vaccines')}
                className="text-xs font-semibold"
                style={{ color: theme.primary }}
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingVax.slice(0, 3).map((vax, i) => {
                const overdue = isOverdue(vax.next_dose_date)
                const days = daysUntil(vax.next_dose_date)
                return (
                  <motion.div
                    key={vax.id}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: theme.primaryLight }}
                    >
                      {(vax.pet as any)?.photo_url ? (
                        <img src={(vax.pet as any).photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <PawPrint size={16} color={theme.primary} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>
                        {(vax.vaccine as any)?.name}
                      </p>
                      <p className="text-xs" style={{ color: theme.textMuted }}>
                        {(vax.pet as any)?.name} • {new Date(vax.next_dose_date).toLocaleDateString('es')}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: overdue ? '#D94B5B12' : days <= 7 ? '#F0A62B12' : '#2E9D6812',
                        color: overdue ? '#D94B5B' : days <= 7 ? '#F0A62B' : '#2E9D68',
                      }}
                    >
                      {overdue ? 'Vencida' : days <= 7 ? `${days}d` : `${days}d`}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="text-base font-bold mb-3" style={{ color: theme.text }}>
            Acciones rapidas
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <PlusCircle size={20} />,
                label: 'Registrar mascota',
                sub: 'Crear tarjeta digital',
                action: () => router.push('/pet/new'),
                color: theme.primary,
                bg: theme.primaryLight,
              },
              {
                icon: <QrCode size={20} />,
                label: 'Escanear QR',
                sub: 'Ver mascota',
                action: () => {},
                color: '#4D91C6',
                bg: '#4D91C612',
              },
              {
                icon: <Syringe size={20} />,
                label: 'Vacunas',
                sub: 'Ver historial',
                action: () => router.push('/vaccines'),
                color: '#2E9D68',
                bg: '#2E9D6812',
              },
              {
                icon: <Calendar size={20} />,
                label: 'Recordatorios',
                sub: 'Proximas citas',
                action: () => router.push('/vaccines'),
                color: '#F0A62B',
                bg: '#F0A62B12',
              },
            ].map((item) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.96 }}
                onClick={item.action}
                className="rounded-2xl p-4 text-left flex items-start gap-3"
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg, color: item.color }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold" style={{ color: theme.text }}>
                    {item.label}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>
                    {item.sub}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Empty state — only when no pets */}
        {pets.length === 0 && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-8 text-center mt-5"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: theme.primaryLight }}
            >
              <PawPrint size={36} color={theme.primary} />
            </motion.div>
            <h4 className="font-bold text-lg mb-1" style={{ color: theme.text }}>
              Comienza aqui
            </h4>
            <p className="text-sm mb-5 max-w-[240px] mx-auto" style={{ color: theme.textMuted }}>
              Registra tu primera mascota y genera su tarjeta digital con QR unico
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/pet/new')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: theme.primary }}
            >
              <PlusCircle size={16} /> Registrar mascota
            </motion.button>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
