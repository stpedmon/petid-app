'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Dog, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export const dynamic = 'force-dynamic'

const pawPositions = [
  { top: '8%', left: '10%', size: 28, delay: '0s', dur: '6s' },
  { top: '15%', right: '15%', size: 22, delay: '1s', dur: '7s' },
  { top: '30%', left: '5%', size: 32, delay: '2s', dur: '5s' },
  { top: '45%', right: '8%', size: 26, delay: '0.5s', dur: '8s' },
  { top: '60%', left: '12%', size: 20, delay: '3s', dur: '6s' },
  { top: '70%', right: '20%', size: 30, delay: '1.5s', dur: '7s' },
  { top: '85%', left: '20%', size: 24, delay: '2.5s', dur: '5.5s' },
  { bottom: '10%', right: '10%', size: 28, delay: '0.8s', dur: '6.5s' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, phone } }
        })
        if (signUpError) throw signUpError

        // Create user in petid.users
        if (data.user) {
          await supabase.from('petid_users').insert({
            id: data.user.id,
            full_name: name,
            email,
            phone,
            role: 'owner'
          })
        }
        router.push('/dashboard')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1B6B4A 0%, #145236 50%, #0d3d28 100%)' }}>

      {/* Floating paw prints */}
      {pawPositions.map((p, i) => (
        <div
          key={i}
          className="absolute paw-float select-none pointer-events-none"
          style={{
            top: p.top, left: p.left, right: p.right, bottom: p.bottom,
            fontSize: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        >
          🐾
        </div>
      ))}

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: '#e8f5ef' }}>
            <Dog size={32} color="#1B6B4A" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#1B6B4A', fontFamily: "'Playfair Display', serif" }}>
            Pet ID
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7c8a' }}>
            Identidad digital para tu mascota
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full pl-4 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#e0ebe5', background: '#f8faf9' }}
                />
              </div>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#e0ebe5', background: '#f8faf9' }}
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6b7c8a" />
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2"
              style={{ borderColor: '#e0ebe5', background: '#f8faf9' }}
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6b7c8a" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none focus:ring-2"
              style={{ borderColor: '#e0ebe5', background: '#f8faf9' }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPass ? <EyeOff size={18} color="#6b7c8a" /> : <Eye size={18} color="#6b7c8a" />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
            style={{ background: '#1B6B4A' }}
          >
            {loading ? '...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#6b7c8a' }}>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="font-semibold"
            style={{ color: '#1B6B4A' }}
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  )
}
