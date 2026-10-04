'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { Search, Syringe, Dog, Users, BarChart3, LogOut } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function VetDashboardPage() {
  const { user, userRole, signOut } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [stats, setStats] = useState({ pets: 0, vaccines: 0, scans: 0 })
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { count: petCount } = await supabase
      .schema('petid' as any).from('pets').select('*', { count: 'exact', head: true })
    const { count: vaxCount } = await supabase
      .schema('petid' as any).from('vaccination_records').select('*', { count: 'exact', head: true })
    const { count: scanCount } = await supabase
      .schema('petid' as any).from('qr_scans').select('*', { count: 'exact', head: true })
    setStats({
      pets: petCount || 0,
      vaccines: vaxCount || 0,
      scans: scanCount || 0,
    })
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setSearching(true)
    const term = searchTerm.trim()

    const { data } = await supabase
      .schema('petid' as any)
      .from('pets')
      .select('id, name, species, breed, photo_url, microchip_number')
      .or(`name.ilike.%${term}%,microchip_number.ilike.%${term}%,id.eq.${term.length === 36 ? term : '00000000-0000-0000-0000-000000000000'}`)
      .limit(10)

    setResults(data || [])
    setSearching(false)
  }

  return (
    <div className="min-h-screen" style={{ background: theme.bg }}>
      {/* Vet header */}
      <header className="px-5 py-4 flex items-center justify-between" style={{ background: theme.primary }}>
        <div className="flex items-center gap-2">
          <Syringe size={24} color="#fff" />
          <span className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pet ID — Veterinaria
          </span>
        </div>
        <button onClick={signOut} className="p-2 rounded-lg hover:bg-white/10">
          <LogOut size={20} color="#fff" />
        </button>
      </header>

      <div className="px-5 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mascotas', value: stats.pets, icon: Dog, color: theme.primary },
            { label: 'Vacunas', value: stats.vaccines, icon: Syringe, color: theme.accent },
            { label: 'Escaneos QR', value: stats.scans, icon: BarChart3, color: '#E65100' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: theme.bgCard }}>
              <s.icon size={22} color={s.color} className="mx-auto mb-2" />
              <p className="text-xl font-bold" style={{ color: theme.text }}>{s.value}</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="rounded-xl p-5" style={{ background: theme.bgCard }}>
          <h3 className="font-semibold mb-3" style={{ color: theme.text }}>Buscar mascota</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color={theme.textMuted} />
              <input
                type="text"
                placeholder="Nombre, ID o microchip..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: theme.border, background: theme.bg }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-5 py-3 rounded-xl text-white text-sm font-medium"
              style={{ background: theme.primary }}
            >
              {searching ? '...' : 'Buscar'}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              {results.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => router.push(`/vet/pet/${pet.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:opacity-80"
                  style={{ background: theme.primaryLight }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ background: theme.bgCard }}>
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      pet.species === 'canine' ? '🐕' : '🐈'
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: theme.text }}>{pet.name}</p>
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      {pet.breed} • ID: {pet.id.slice(0, 8)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick action */}
        <button
          onClick={() => router.push('/vet/vaccinate')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold"
          style={{ background: theme.primary }}
        >
          <Syringe size={20} /> Registrar Vacunación
        </button>
      </div>
    </div>
  )
}
