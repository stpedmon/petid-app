'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Shield, Syringe, Bell, ArrowRight, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

const steps = [
  {
    icon: <QrCode size={48} strokeWidth={1.5} />,
    emoji: '🐾',
    title: 'Tarjeta Digital Única',
    subtitle: 'Tu mascota, siempre identificada',
    description: 'Cada mascota recibe un código QR exclusivo que cualquiera puede escanear para ver su información y contactarte.',
    color: '#1B6B4A',
    gradient: 'linear-gradient(135deg, #1B6B4A, #2ECC71)',
    features: ['QR único por mascota', 'Perfil público seguro', 'Compatible con wallets'],
  },
  {
    icon: <Syringe size={48} strokeWidth={1.5} />,
    emoji: '💉',
    title: 'Control de Vacunas',
    subtitle: 'Nunca olvides una vacuna',
    description: 'Registra vacunas, historial médico y recibe recordatorios automáticos cuando se acerque la próxima dosis.',
    color: '#E65100',
    gradient: 'linear-gradient(135deg, #E65100, #FF9800)',
    features: ['Historial completo', 'Recordatorios automáticos', 'Notas del veterinario'],
  },
  {
    icon: <Shield size={48} strokeWidth={1.5} />,
    emoji: '🏥',
    title: 'Red Veterinaria',
    subtitle: 'Conectado con tu veterinario',
    description: 'Tu veterinario puede actualizar el historial directamente. Sin papeles, sin cartillas que se pierden.',
    color: '#1565C0',
    gradient: 'linear-gradient(135deg, #1565C0, #42A5F5)',
    features: ['Panel veterinario', 'Actualizaciones en tiempo real', 'Historial compartido'],
  },
  {
    icon: <Bell size={48} strokeWidth={1.5} />,
    emoji: '🔔',
    title: 'Mascota Perdida',
    subtitle: 'Tranquilidad para ti',
    description: 'Si alguien encuentra a tu mascota, solo necesita escanear el QR para contactarte al instante.',
    color: '#7B1FA2',
    gradient: 'linear-gradient(135deg, #7B1FA2, #CE93D8)',
    features: ['Alerta de mascota perdida', 'Contacto directo', 'Geolocalización'],
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const current = steps[step]
  const isLast = step === steps.length - 1

  const next = () => {
    if (isLast) {
      localStorage.setItem('petid_onboarded', 'true')
      router.push('/dashboard')
    } else {
      setStep(s => s + 1)
    }
  }

  const skip = () => {
    localStorage.setItem('petid_onboarded', 'true')
    router.push('/dashboard')
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

      {/* Skip button */}
      <div className="relative z-20 flex justify-end px-6 pt-6 safe-top">
        <button
          onClick={skip}
          className="text-white/30 text-sm font-medium hover:text-white/50 transition-colors"
        >
          Omitir
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6">
        <AnimatePresence mode="wait">
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
                background: current.gradient,
                boxShadow: `0 20px 60px ${current.color}40`,
              }}
            >
              <div className="text-white">{current.icon}</div>
            </motion.div>

            {/* Emoji badge */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-5xl mb-4"
            >
              {current.emoji}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white mb-2 tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {current.title}
            </motion.h2>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-medium mb-4"
              style={{ color: current.color }}
            >
              {current.subtitle}
            </motion.p>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto mb-8"
            >
              {current.description}
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {current.features.map((f, i) => (
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
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-10 safe-bottom">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
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
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm"
          style={{
            background: current.gradient,
            boxShadow: `0 8px 30px ${current.color}35`,
          }}
        >
          {isLast ? (
            <>
              <Sparkles size={18} />
              Comenzar ahora
            </>
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
