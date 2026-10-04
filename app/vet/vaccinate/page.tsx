'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { ArrowLeft, Syringe, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function VaccinatePage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [vaccines, setVaccines] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    pet_id: '',
    vaccine_id: '',
    applied_date: new Date().toISOString().split('T')[0],
    next_dose_date: '',
    veterinarian_name: '',
    lot_number: '',
    manufacturer: '',
    dose_ml: '',
    route: 'subcutaneous',
    notes: '',
  })

  useEffect(() => {
    supabase.from('petid_vaccines').select('*').then(({ data }) => {
      if (data) setVaccines(data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('petid_vaccination_records').insert({
      pet_id: form.pet_id,
      vaccine_id: form.vaccine_id,
      applied_date: form.applied_date,
      next_dose_date: form.next_dose_date || null,
      veterinarian_name: form.veterinarian_name || null,
      lot_number: form.lot_number || null,
      manufacturer: form.manufacturer || null,
      dose_ml: form.dose_ml ? parseFloat(form.dose_ml) : null,
      route: form.route,
      notes: form.notes || null,
      administered_by: user?.id,
    })

    setSaving(false)
    if (error) {
      alert(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/vet'), 2000)
    }
  }

  const inputStyle = { borderColor: theme.border, background: theme.bg, color: theme.text }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: theme.bg }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: theme.primaryLight }}>
          <Check size={40} color={theme.primary} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: theme.text }}>¡Vacunación registrada!</h2>
        <p className="text-sm" style={{ color: theme.textMuted }}>Certificado digital generado automáticamente</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: theme.bg }}>
      <header className="px-5 py-4" style={{ background: theme.primary }}>
        <div className="flex items-center gap-2">
          <Syringe size={24} color="#fff" />
          <span className="text-white font-bold text-lg">Registrar Vacunación</span>
        </div>
      </header>

      <div className="px-5 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4" style={{ color: theme.primary }}>
          <ArrowLeft size={18} /> Volver
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl p-5 space-y-4" style={{ background: theme.bgCard }}>
            <h3 className="font-semibold" style={{ color: theme.text }}>Datos de la vacunación</h3>

            <input
              type="text" placeholder="ID de la mascota (UUID) *" required
              value={form.pet_id} onChange={e => setForm({ ...form, pet_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none font-mono"
              style={inputStyle}
            />

            <select
              value={form.vaccine_id} onChange={e => setForm({ ...form, vaccine_id: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={inputStyle}
            >
              <option value="">Seleccionar vacuna *</option>
              {vaccines.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.species})</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: theme.textMuted }}>Fecha aplicación *</label>
                <input type="date" required value={form.applied_date}
                  onChange={e => setForm({ ...form, applied_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: theme.textMuted }}>Próxima dosis</label>
                <input type="date" value={form.next_dose_date}
                  onChange={e => setForm({ ...form, next_dose_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={inputStyle} />
              </div>
            </div>

            <input
              type="text" placeholder="Nombre del veterinario"
              value={form.veterinarian_name} onChange={e => setForm({ ...form, veterinarian_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={inputStyle}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" placeholder="Número de lote"
                value={form.lot_number} onChange={e => setForm({ ...form, lot_number: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={inputStyle}
              />
              <input
                type="text" placeholder="Fabricante"
                value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" step="0.1" placeholder="Dosis (ml)"
                value={form.dose_ml} onChange={e => setForm({ ...form, dose_ml: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={inputStyle}
              />
              <select
                value={form.route} onChange={e => setForm({ ...form, route: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={inputStyle}
              >
                <option value="subcutaneous">Subcutánea</option>
                <option value="intramuscular">Intramuscular</option>
                <option value="intranasal">Intranasal</option>
                <option value="oral">Oral</option>
              </select>
            </div>

            <textarea
              placeholder="Notas adicionales"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50"
            style={{ background: theme.primary }}
          >
            {saving ? 'Registrando...' : '💉 Registrar Vacunación'}
          </button>
        </form>
      </div>
    </div>
  )
}
