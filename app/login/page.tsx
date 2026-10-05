'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, PawPrint } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'

// Floating paw positions — scattered around the screen
const floatingPaws = [
  { x: '8%', y: '12%', size: 20, delay: 0, duration: 5, rotate: -20 },
  { x: '82%', y: '8%', size: 16, delay: 1.2, duration: 6.5, rotate: 15 },
  { x: '15%', y: '35%', size: 14, delay: 2.5, duration: 5.5, rotate: 30 },
  { x: '88%', y: '30%', size: 18, delay: 0.8, duration: 7, rotate: -10 },
  { x: '5%', y: '60%', size: 22, delay: 3, duration: 6, rotate: 25 },
  { x: '90%', y: '55%', size: 15, delay: 1.5, duration: 5.8, rotate: -35 },
  { x: '25%', y: '80%', size: 17, delay: 2, duration: 6.2, rotate: 10 },
  { x: '75%', y: '78%', size: 13, delay: 0.5, duration: 5.3, rotate: -25 },
  { x: '50%', y: '5%', size: 12, delay: 3.5, duration: 7.2, rotate: 40 },
  { x: '40%', y: '90%', size: 19, delay: 1.8, duration: 6.8, rotate: -15 },
]

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenExpired = searchParams.get('error') === 'token_expired'
  const confirmed = searchParams.get('confirmed') === '1'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        const siteUrl = window.location.origin
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, phone },
            emailRedirectTo: `${siteUrl}/api/auth/callback`,
          }
        })
        if (signUpError) throw signUpError

        if (data.user) {
          await supabase.from('petid_users').insert({
            id: data.user.id,
            full_name: name,
            email,
            phone,
            sex,
            role: 'owner'
          })
        }

        // If email confirmation is required, user won't have a session yet
        if (data.session) {
          // Autoconfirm is on — go straight to onboarding
          router.push('/onboarding')
        } else {
          // Show "check your email" screen
          setPendingVerification(true)
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        router.push('/dashboard')
      }
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('User already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      } else if (msg.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.')
      } else if (msg.includes('Password should be at least')) {
        setError('La contraseña debe tener al menos 6 caracteres.')
      } else if (msg.includes('Unable to validate email')) {
        setError('Ingresa un correo electrónico válido.')
      } else {
        setError(msg || 'Error al iniciar sesión. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: '#FFF7E9' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-6xl mb-6"
        >
          📧
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center max-w-sm"
        >
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#1F1F1F' }}>
            Revisa tu correo
          </h1>
          <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
            Enviamos un enlace de verificación a:
          </p>
          <p className="text-sm font-semibold mb-6" style={{ color: '#FF6B6B' }}>
            {email}
          </p>
          <p className="text-xs mb-8" style={{ color: '#6B6B6B' }}>
            Haz clic en el enlace del correo para activar tu cuenta. Si no lo ves, revisa la carpeta de spam.
          </p>
          <button
            onClick={() => {
              setPendingVerification(false)
              setIsRegister(false)
              setError('')
            }}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#FF6B6B' }}
          >
            Volver a iniciar sesión
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#FFF7E9' }}>

      {/* Floating paw prints */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingPaws.map((paw, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: paw.x,
              top: paw.y,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.3, 0.15, 0.3, 0],
              scale: [0.5, 1, 1.1, 1, 0.5],
              y: [0, -15, -25, -15, 0],
              rotate: [paw.rotate, paw.rotate + 10, paw.rotate, paw.rotate - 10, paw.rotate],
            }}
            transition={{
              duration: paw.duration,
              delay: paw.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <PawPrint
              size={paw.size}
              color="#FF6B6B"
              strokeWidth={1.8}
            />
          </motion.div>
        ))}
      </div>

      {/* Soft gradient orbs — warm brand colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #FF6B6B 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 30, -30, 0],
            scale: [1, 0.8, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-20 w-72 h-72 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #FFC857 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -20, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-10 w-60 h-60 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #BEE3F8 0%, transparent 70%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="flex justify-center mb-3"
          >
            <Image
              src="/petid-logo-color.png"
              alt="PetID"
              width={240}
              height={80}
              priority
              className="h-auto"
            />
          </motion.div>
          <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
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
            className="rounded-2xl p-6"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E0D4',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            {/* Tab toggle */}
            <div
              className="flex rounded-xl p-1 mb-5"
              style={{ background: '#FFF7E9' }}
            >
              {['Iniciar sesion', 'Registrarse'].map((label, idx) => {
                const isActive = idx === 0 ? !isRegister : isRegister
                return (
                  <button
                    key={label}
                    onClick={() => { setIsRegister(idx === 1); setError('') }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      color: isActive ? '#FFFFFF' : '#6B6B6B',
                      background: isActive ? '#FF6B6B' : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {confirmed && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-center py-2.5 px-4 rounded-xl mb-3"
                style={{ background: '#2E9D6815', color: '#2E9D68' }}
              >
                ✅ Cuenta verificada. Inicia sesión.
              </motion.p>
            )}
            {tokenExpired && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-center py-2.5 px-4 rounded-xl mb-3"
                style={{ background: '#D94B5B15', color: '#D94B5B' }}
              >
                El enlace expiró o ya fue usado. Intenta iniciar sesión o regístrate de nuevo.
              </motion.p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="register-fields"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" color="#6B6B6B" />
                      <input
                        type="text" placeholder="Nombre completo" required
                        value={name} onChange={e => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6B6B]/30"
                        style={{
                          background: '#FFF7E9',
                          border: '1px solid #E8E0D4',
                          color: '#1F1F1F',
                        }}
                      />
                    </div>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2" color="#6B6B6B" />
                      <input
                        type="tel" placeholder="Telefono"
                        value={phone} onChange={e => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6B6B]/30"
                        style={{
                          background: '#FFF7E9',
                          border: '1px solid #E8E0D4',
                          color: '#1F1F1F',
                        }}
                      />
                    </div>
                    {/* Sex selector */}
                    <div className="flex gap-2">
                      {[
                        { value: 'male' as const, label: 'Papá 🐾', emoji: '👨' },
                        { value: 'female' as const, label: 'Mamá 🐾', emoji: '👩' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSex(opt.value)}
                          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            background: sex === opt.value ? '#FF6B6B' : '#FFF7E9',
                            color: sex === opt.value ? '#FFFFFF' : '#6B6B6B',
                            border: `1px solid ${sex === opt.value ? '#FF6B6B' : '#E8E0D4'}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" color="#6B6B6B" />
                <input
                  type="email" placeholder="correo@ejemplo.com" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6B6B]/30"
                  style={{
                    background: '#FFF7E9',
                    border: '1px solid #E8E0D4',
                    color: '#1F1F1F',
                  }}
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" color="#6B6B6B" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Contrasena" required minLength={6}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6B6B]/30"
                  style={{
                    background: '#FFF7E9',
                    border: '1px solid #E8E0D4',
                    color: '#1F1F1F',
                  }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPass
                    ? <EyeOff size={18} color="#6B6B6B" />
                    : <Eye size={18} color="#6B6B6B" />
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
                    style={{ background: '#D94B5B15', color: '#D94B5B' }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                style={{
                  background: '#FF6B6B',
                  boxShadow: '0 6px 20px rgba(255,107,107,0.3)',
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
                    {isRegister ? 'Crear cuenta' : 'Iniciar sesion'}
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
            style={{ color: '#6B6B6B' }}
          >
            Protegemos los datos de tu mascota con encriptacion
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF7E9' }}>
        <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: '#FF6B6B', borderTopColor: 'transparent' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
