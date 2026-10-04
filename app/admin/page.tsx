'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import RoleGuard from '@/components/RoleGuard'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Building2, Plus, Search, CheckCircle, XCircle, Users, PawPrint, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'

interface Clinic {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  license_number: string | null
  is_verified: boolean
  created_at: string
}

interface Stats {
  totalUsers: number
  totalPets: number
  totalClinics: number
  totalVets: number
}

function AdminContent() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPets: 0, totalClinics: 0, totalVets: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // New clinic form
  const [newClinic, setNewClinic] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    license_number: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch clinics
      const { data: clinicsData } = await supabase
        .from('petid_clinics')
        .select('*')
        .order('created_at', { ascending: false })

      setClinics(clinicsData || [])

      // Fetch stats
      const [usersRes, petsRes, clinicsRes, vetsRes] = await Promise.all([
        supabase.from('petid_users').select('id', { count: 'exact', head: true }),
        supabase.from('petid_pets').select('id', { count: 'exact', head: true }),
        supabase.from('petid_clinics').select('id', { count: 'exact', head: true }),
        supabase.from('petid_users').select('id', { count: 'exact', head: true }).eq('role', 'vet'),
      ])

      setStats({
        totalUsers: usersRes.count || 0,
        totalPets: petsRes.count || 0,
        totalClinics: clinicsRes.count || 0,
        totalVets: vetsRes.count || 0,
      })
    } catch (err) {
      console.error('Error fetching admin data:', err)
    }
    setLoading(false)
  }

  const handleCreateClinic = async () => {
    if (!newClinic.name.trim()) return
    setCreating(true)
    try {
      const { error } = await supabase.from('petid_clinics').insert({
        name: newClinic.name.trim(),
        address: newClinic.address.trim() || null,
        phone: newClinic.phone.trim() || null,
        email: newClinic.email.trim() || null,
        license_number: newClinic.license_number.trim() || null,
        is_verified: true,
      })

      if (error) throw error

      setNewClinic({ name: '', address: '', phone: '', email: '', license_number: '' })
      setShowCreateModal(false)
      fetchData()
    } catch (err) {
      console.error('Error creating clinic:', err)
      alert('Error al crear la clínica')
    }
    setCreating(false)
  }

  const toggleVerified = async (clinicId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('petid_clinics')
      .update({ is_verified: !currentStatus })
      .eq('id', clinicId)

    if (!error) {
      setClinics(prev => prev.map(c =>
        c.id === clinicId ? { ...c, is_verified: !currentStatus } : c
      ))
    }
  }

  const filteredClinics = clinics.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statCards = [
    { label: 'Usuarios', value: stats.totalUsers, icon: Users, color: '#4D91C6' },
    { label: 'Mascotas', value: stats.totalPets, icon: PawPrint, color: '#2E9D68' },
    { label: 'Clínicas', value: stats.totalClinics, icon: Building2, color: '#E8913A' },
    { label: 'Veterinarios', value: stats.totalVets, icon: Users, color: '#D94B5B' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <TopBar title="Panel Admin" />

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}15` }}
                >
                  <stat.icon size={16} color={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: theme.text }}>
                {loading ? '—' : stat.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Clinics section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: theme.text }}>Clínicas Veterinarias</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: theme.primary }}
            >
              <Plus size={14} />
              Nueva
            </button>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <Search size={16} color={theme.textMuted} />
            <input
              type="text"
              placeholder="Buscar clínica..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: theme.text }}
            />
          </div>

          {/* Clinic list */}
          <div className="space-y-2">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
              </div>
            ) : filteredClinics.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 size={32} color={theme.textMuted} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  {searchTerm ? 'Sin resultados' : 'No hay clínicas registradas'}
                </p>
              </div>
            ) : (
              filteredClinics.map((clinic) => (
                <motion.div
                  key={clinic.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4"
                  style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate" style={{ color: theme.text }}>
                          {clinic.name}
                        </h3>
                        {clinic.is_verified ? (
                          <CheckCircle size={14} color="#2E9D68" />
                        ) : (
                          <XCircle size={14} color="#D94B5B" />
                        )}
                      </div>
                      {clinic.address && (
                        <p className="text-xs mt-1 truncate" style={{ color: theme.textMuted }}>
                          {clinic.address}
                        </p>
                      )}
                      {clinic.email && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: theme.textMuted }}>
                          {clinic.email}
                        </p>
                      )}
                      {clinic.license_number && (
                        <p className="text-[11px] mt-1 px-2 py-0.5 rounded-full inline-block" style={{ background: `${theme.primary}12`, color: theme.primary }}>
                          Lic: {clinic.license_number}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleVerified(clinic.id, clinic.is_verified)}
                      className="ml-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{
                        background: clinic.is_verified ? '#D94B5B15' : '#2E9D6815',
                        color: clinic.is_verified ? '#D94B5B' : '#2E9D68',
                      }}
                    >
                      {clinic.is_verified ? 'Desactivar' : 'Verificar'}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create clinic modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto"
              style={{ background: theme.bgCard }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: theme.text }}>
                  Nueva Clínica Veterinaria
                </h2>
                <button onClick={() => setShowCreateModal(false)}>
                  <X size={20} color={theme.textMuted} />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'name', label: 'Nombre *', placeholder: 'Ej: Clínica Veterinaria San Marcos' },
                  { key: 'address', label: 'Dirección', placeholder: 'Calle, número, ciudad' },
                  { key: 'phone', label: 'Teléfono', placeholder: '+52 55 1234 5678' },
                  { key: 'email', label: 'Email', placeholder: 'contacto@clinica.com' },
                  { key: 'license_number', label: 'Número de licencia', placeholder: 'Licencia profesional' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: theme.textMuted }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={(newClinic as any)[field.key]}
                      onChange={e => setNewClinic(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: theme.bg,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                      }}
                    />
                  </div>
                ))}

                <button
                  onClick={handleCreateClinic}
                  disabled={creating || !newClinic.name.trim()}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white mt-2 disabled:opacity-50"
                  style={{ background: theme.primary }}
                >
                  {creating ? 'Creando...' : 'Crear Clínica'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminContent />
    </RoleGuard>
  )
}
