'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Syringe, Calendar, CheckCircle2, AlertCircle, PawPrint } from 'lucide-react'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

interface VaxRecord {
  id: string
  applied_date: string
  next_dose_date: string | null
  veterinarian_name: string | null
  certificate_number: string | null
  pet: { id: string; name: string; photo_url: string | null }
  vaccine: { name: string }
}

export default function VaccinesPage() {
  const { user, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [records, setRecords] = useState<VaxRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
      return
    }
    if (user) fetchVaccines()
  }, [user, authLoading])

  const fetchVaccines = async () => {
    // Get user's pets first
    const { data: ownerData } = await supabase
      .from('petid_pet_owners')
      .select('pet_id')
      .eq('user_id', user!.id)

    if (ownerData && ownerData.length > 0) {
      const petIds = ownerData.map((o: any) => o.pet_id)
      const { data } = await supabase
        .from('petid_vaccination_records')
        .select('*, pet:pet_id(id, name, photo_url), vaccine:vaccine_id(name)')
        .in('pet_id', petIds)
        .order('applied_date', { ascending: false })
      if (data) setRecords(data as any)
    }
    setLoading(false)
  }

  const isUpcoming = (date: string | null) => {
    if (!date) return false
    const d = new Date(date)
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000 // within 30 days
  }

  const isOverdue = (date: string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
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

  const upcoming = records.filter(r => isUpcoming(r.next_dose_date))
  const overdue = records.filter(r => isOverdue(r.next_dose_date))

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar title="Vacunas" />

      <div className="px-5 py-4">
        <h2 className="text-xl font-bold mb-1" style={{ color: theme.text }}>
          Vacunas
        </h2>
        <p className="text-sm mb-5" style={{ color: theme.textMuted }}>
          Historial de vacunación de tus mascotas
        </p>

        {/* Alerts */}
        {overdue.length > 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl mb-4"
            style={{ background: '#D94B5B15', border: '1px solid #D94B5B30' }}
          >
            <AlertCircle size={20} color="#D94B5B" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#D94B5B' }}>
                {overdue.length} vacuna{overdue.length > 1 ? 's' : ''} vencida{overdue.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Contacta a tu veterinaria
              </p>
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl mb-4"
            style={{ background: '#F0A62B15', border: '1px solid #F0A62B30' }}
          >
            <Calendar size={20} color="#F0A62B" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F0A62B' }}>
                {upcoming.length} vacuna{upcoming.length > 1 ? 's' : ''} próxima{upcoming.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                En los próximos 30 días
              </p>
            </div>
          </div>
        )}

        {/* Vaccine records */}
        {records.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: theme.primaryLight }}
            >
              <Syringe size={28} color={theme.primary} />
            </motion.div>
            <p className="font-bold text-lg mb-1" style={{ color: theme.text }}>
              Sin vacunas registradas
            </p>
            <p className="text-sm" style={{ color: theme.textMuted }}>
              Tu veterinaria registrará las vacunas de tus mascotas aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-4"
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
              >
                <div className="flex items-start gap-3">
                  {/* Pet avatar */}
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: theme.primaryLight }}
                  >
                    {(r.pet as any)?.photo_url ? (
                      <img src={(r.pet as any).photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint size={16} color={theme.primary} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm" style={{ color: theme.text }}>
                        {(r.vaccine as any)?.name || 'Vacuna'}
                      </p>
                      {r.certificate_number && (
                        <CheckCircle2 size={16} color="#2E9D68" />
                      )}
                    </div>
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      {(r.pet as any)?.name} • Aplicada: {new Date(r.applied_date).toLocaleDateString('es')}
                    </p>
                    {r.next_dose_date && (
                      <p className="text-xs mt-1" style={{
                        color: isOverdue(r.next_dose_date) ? '#D94B5B'
                          : isUpcoming(r.next_dose_date) ? '#F0A62B'
                          : '#2E9D68'
                      }}>
                        Próxima: {new Date(r.next_dose_date).toLocaleDateString('es')}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
