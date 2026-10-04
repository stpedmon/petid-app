'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Shield, Syringe, Bell, ArrowRight, Sparkles, FileCheck, CheckSquare, Square } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

export const dynamic = 'force-dynamic'

const infoSteps = [
  {
    icon: <QrCode size={48} strokeWidth={1.5} />,
    title: 'Tarjeta Digital Única',
    subtitle: 'Tu mascota, siempre identificada',
    description: 'Cada mascota recibe un código QR exclusivo que cualquiera puede escanear para ver su información y contactarte.',
    color: '#1B6B4A',
    gradient: 'linear-gradient(135deg, #1B6B4A, #2ECC71)',
    features: ['QR único por mascota', 'Perfil público seguro', 'Compatible con wallets'],
  },
  {
    icon: <Syringe size={48} strokeWidth={1.5} />,
    title: 'Control de Vacunas',
    subtitle: 'Nunca olvides una vacuna',
    description: 'Registra vacunas, historial médico y recibe recordatorios automáticos cuando se acerque la próxima dosis.',
    color: '#E65100',
    gradient: 'linear-gradient(135deg, #E65100, #FF9800)',
    features: ['Historial completo', 'Recordatorios automáticos', 'Notas del veterinario'],
  },
  {
    icon: <Shield size={48} strokeWidth={1.5} />,
    title: 'Red Veterinaria',
    subtitle: 'Conectado con tu veterinario',
    description: 'Tu veterinario puede actualizar el historial directamente. Sin papeles, sin cartillas que se pierden.',
    color: '#1565C0',
    gradient: 'linear-gradient(135deg, #1565C0, #42A5F5)',
    features: ['Panel veterinario', 'Actualizaciones en tiempo real', 'Historial compartido'],
  },
  {
    icon: <Bell size={48} strokeWidth={1.5} />,
    title: 'Mascota Perdida',
    subtitle: 'Tranquilidad para ti',
    description: 'Si alguien encuentra a tu mascota, solo necesita escanear el QR para contactarte al instante.',
    color: '#7B1FA2',
    gradient: 'linear-gradient(135deg, #7B1FA2, #CE93D8)',
    features: ['Alerta de mascota perdida', 'Contacto directo', 'Geolocalización'],
  },
]

const consentItems = [
  'Recopilamos datos de tu mascota (nombre, raza, foto, historial médico) para generar su tarjeta digital.',
  'Tu información de contacto se muestra al escanear el QR para que puedan contactarte si encuentran a tu mascota.',
  'Los veterinarios autorizados pueden actualizar el historial médico de tu mascota.',
  'Puedes solicitar la eliminación completa de tus datos en cualquier momento desde Ajustes.',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [consentChecked, setConsentChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const totalSteps = infoSteps.length + 1 // info steps + consent step
  const isConsentStep = step === infoSteps.length
  const isLast = step === totalSteps - 1

  const consentColor = '#1B6B4A'
  const consentGradient = 'linear-gradient(135deg, #1B6B4A, #2ECC71)'

  const current = isConsentStep
    ? { color: consentColor, gradient: consentGradient }
    : infoSteps[step]

  const saveConsent = async () => {
    if (!user) return
    setSaving(true)
    try {
      await supabase
        .from('petid_users')
        .update({
          data_consent_accepted: true,
          data_consent_date: new Date().toISOString(),
        })
        .eq('id', user.id)
    } catch (e) {
      console.error('Error saving consent:', e)
    }
    localStorage.setItem('petid_onboarded', 'true')
    setSaving(false)
    router.push('/dashboard')
  }

  const next = () => {
    if (isConsentStep) {
      saveConsent()
    } else {
      setStep(s => s + 1)
    }
  }

  const skip = () => {
    // Skip goes to consent step, can't skip consent
    setStep(infoSteps.length)
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#0a0f1a' }}>
      {/* Animated background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-15"
            style={{
              background: `radial-gradient(circle, ${current.color} 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Skip button — only on info steps */}
      <div className="relative z-20 flex justify-end px-6 pt-6 safe-top">
        {!isConsentStep && (
          <button
            onClick={skip}
            className="text-white/30 text-sm font-medium hover:text-white/50 transition-colors"
          >
            Omitir
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6">
        <AnimatePresence mode="wait">
          {isConsentStep ? (
            <motion.div
              key="consent"
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Consent icon */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] mb-5"
                  style={{
                    background: consentGradient,
                    boxShadow: `0 20px 60px ${consentColor}40`,
                  }}
                >
                  <FileCheck size={42} color="#fff" strokeWidth={1.5} />
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-white mb-1 tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Tratamiento de Datos
                </motion.h2>
                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm text-white/40"
                >
                  Antes de continuar, necesitamos tu consentimiento
                </motion.p>
              </div>

              {/* Consent items */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 mb-6 max-w-sm mx-auto"
              >
                {consentItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className="flex gap-3 items-start p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${consentColor}25` }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: consentColor }}>
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{item}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Checkbox */}
              <motion.button
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65 }}
                onClick={() => setConsentChecked(!consentChecked)}
                className="flex items-center gap-3 mx-auto p-3 rounded-xl max-w-sm w-full"
                style={{
                  background: consentChecked ? `${consentColor}15` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${consentChecked ? consentColor : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.2s',
                }}
              >
                {consentChecked ? (
                  <CheckSquare size={22} color={consentColor} strokeWidth={2} />
                ) : (
                  <Square size={22} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
                )}
                <span className="text-xs font-medium text-left" style={{ color: consentChecked ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  Acepto el tratamiento de mis datos personales y los de mi mascota según lo descrito
                </span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                className="inline-flex items-center justify-center w-28 h-28 rounded-[32px] mb-8"
                style={{
                  background: (current as typeof infoSteps[0]).gradient,
                  boxShadow: `0 20px 60px ${current.color}40`,
                }}
              >
                <div className="text-white">{(current as typeof infoSteps[0]).icon}</div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {(current as typeof infoSteps[0]).title}
              </motion.h2>

              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-medium mb-4"
                style={{ color: current.color }}
              >
                {(current as typeof infoSteps[0]).subtitle}
              </motion.p>

              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto mb-8"
              >
                {(current as typeof infoSteps[0]).description}
              </motion.p>

              {/* Feature pills */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-2"
              >
                {(current as typeof infoSteps[0]).features.map((f: string, i: number) => (
                  <motion.span
                    key={f}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.45 + i * 0.08, type: 'spring' }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: `${current.color}15`,
                      color: current.color,
                      border: `1px solid ${current.color}25`,
                    }}
                  >
                    {f}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-10 safe-bottom">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === step ? 28 : 8,
                background: i === step ? current.color : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          disabled={isConsentStep && !consentChecked || saving}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm transition-opacity"
          style={{
            background: current.gradient,
            boxShadow: `0 8px 30px ${current.color}35`,
            opacity: (isConsentStep && !consentChecked) ? 0.4 : 1,
          }}
        >
          {isConsentStep ? (
            saving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Sparkles size={18} />
                Aceptar y Comenzar
              </>
            )
          ) : (
            <>
              Siguiente
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
