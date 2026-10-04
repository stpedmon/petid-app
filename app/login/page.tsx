'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, PawPrint } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'

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

        if (data.user) {
          await supabase.from('petid_users').insert({
            id: data.user.id,
            full_name: name,
            email,
            phone,
            role: 'owner'
          })
        }
        router.push('/onboarding')
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
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#0a0f1a' }}>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #1B6B4A 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 30, -30, 0],
            scale: [1, 0.8, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-20 w-72 h-72 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #2ECC71 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -20, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-10 w-60 h-60 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #145236 0%, transparent 70%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo & Title */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5"
            style={{
              background: 'linear-gradient(135deg, #1B6B4A, #2ECC71)',
              boxShadow: '0 12px 40px rgba(27,107,74,0.4)',
            }}
          >
            <PawPrint size={36} color="#fff" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pet ID
          </h1>
          <p className="text-white/40 text-sm mt-2 tracking-wide">
            La identidad digital de tu mascota
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md mx-auto"
        >
          <div
            className="rounded-3xl p-7 glass"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Tab toggle */}
            <div
              className="flex rounded-xl p-1 mb-6"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              {['Iniciar sesión', 'Registrarse'].map((label, idx) => {
                const isActive = idx === 0 ? !isRegister : isRegister
                return (
                  <button
                    key={label}
                    onClick={() => { setIsRegister(idx === 1); setError('') }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative"
                    style={{
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                      background: isActive ? 'rgba(27,107,74,0.6)' : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="register-fields"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3.5 overflow-hidden"
                  >
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.3)" />
                      <input
                        type="text" placeholder="Nombre completo" required
                        value={name} onChange={e => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    </div>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.3)" />
                      <input
                        type="tel" placeholder="Teléfono"
                        value={phone} onChange={e => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.3)" />
                <input
                  type="email" placeholder="correo@ejemplo.com" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.3)" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Contraseña" required minLength={6}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPass
                    ? <EyeOff size={18} color="rgba(255,255,255,0.3)" />
                    : <Eye size={18} color="rgba(255,255,255,0.3)" />
                  }
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-center py-2.5 px-4 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{
                  background: 'linear-gradient(135deg, #1B6B4A, #2ECC71)',
                  boxShadow: '0 8px 25px rgba(27,107,74,0.35)',
                }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs mt-6"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Protegemos los datos de tu mascota con encriptación
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
