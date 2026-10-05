'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  FileCheck,
  CheckSquare,
  Square,
  Palette,
  Check,
  PawPrint,
  Plus,
  Minus,
  QrCode,
  Heart,
  Shield,
  Bell,
  MapPin,
  Camera,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { themes, ThemeId } from '@/lib/themes'

export const dynamic = 'force-dynamic'

/* ─── Brand colors ─── */
const C = {
  coral: '#FF6B6B',
  yellow: '#FFCC57',
  sky: '#BEE3F8',
  ivory: '#FFF7E9',
  charcoal: '#1F1F1F',
  white: '#FFFFFF',
}

/* ─── Onboarding feature slides ─── */
const slides = [
  {
    icon: <PawPrint size={44} strokeWidth={1.8} />,
    title: '¿Qué es PetID?',
    subtitle: 'Una identidad digital para tu mascota.',
    description: 'PetID convierte la información de tu mascota en una tarjeta digital inteligente, siempre accesible.',
    accent: C.coral,
    bgGradient: `linear-gradient(180deg, ${C.ivory} 0%, ${C.white} 100%)`,
    iconBg: C.coral,
  },
  {
    icon: <QrCode size={44} strokeWidth={1.8} />,
    title: 'Identidad digital única',
    subtitle: 'Su identidad siempre a mano.',
    description: 'Cada mascota recibe un QR exclusivo. Quien lo escanee puede ver su perfil y contactarte al instante.',
    accent: C.yellow,
    bgGradient: `linear-gradient(180deg, ${C.white} 0%, ${C.ivory} 100%)`,
    iconBg: C.yellow,
  },
  {
    icon: <Heart size={44} strokeWidth={1.8} />,
    title: 'Historial de salud completo',
    subtitle: 'Vacunas, historial y cuidados en un solo lugar.',
    description: 'Registra vacunas, consultas y tratamientos. Tu veterinario puede actualizar todo directamente.',
    accent: C.coral,
    bgGradient: `linear-gradient(180deg, ${C.ivory} 0%, ${C.white} 100%)`,
    iconBg: C.coral,
  },
  {
    icon: <Bell size={44} strokeWidth={1.8} />,
    title: 'Recordatorios a tiempo',
    subtitle: 'No olvides una vacuna, medicamento o cita.',
    description: 'Recibe alertas automáticas cuando se acerque la próxima dosis o una cita veterinaria importante.',
    accent: C.sky,
    bgGradient: `linear-gradient(180deg, ${C.white} 0%, ${C.sky}30 100%)`,
    iconBg: C.sky,
  },
  {
    icon: <MapPin size={44} strokeWidth={1.8} />,
    title: 'Todo en tu bolsillo',
    subtitle: 'Si alguna vez se pierde, su información puede ayudarte a encontrarlo.',
    description: 'Comparte el QR de tu mascota para que cualquier persona pueda identificarla y contactarte de inmediato.',
    accent: C.yellow,
    bgGradient: `linear-gradient(180deg, ${C.ivory} 0%, ${C.white} 100%)`,
    iconBg: C.yellow,
  },
  {
    icon: <Camera size={44} strokeWidth={1.8} />,
    title: 'Para todas sus etapas de vida',
    subtitle: 'Guarda sus momentos y acompaña cada etapa de su vida.',
    description: 'Desde cachorro hasta senior, PetID crece con tu mascota y guarda toda su historia en un solo lugar.',
    accent: C.coral,
    bgGradient: `linear-gradient(180deg, ${C.white} 0%, ${C.ivory} 100%)`,
    iconBg: C.coral,
  },
  {
    icon: <Shield size={44} strokeWidth={1.8} />,
    title: 'Más que salud',
    subtitle: 'Siempre contigo.',
    description: 'PetID es la plataforma de identidad digital que tu mascota merece. Moderna, segura y fácil de usar.',
    accent: C.coral,
    bgGradient: `linear-gradient(180deg, ${C.ivory} 0%, ${C.coral}10 100%)`,
    iconBg: C.coral,
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
  const { setThemeId } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('petid')
  const [petCount, setPetCount] = useState(1)

  // Steps: 7 feature slides + theme + pet count + consent = 10
  const totalSteps = slides.length + 3
  const isThemeStep = step === slides.length
  const isPetCountStep = step === slides.length + 1
  const isConsentStep = step === slides.length + 2

  const themeList = Object.values(themes)

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
    localStorage.setItem('petid_onboarding_pet_count', String(petCount))
    setSaving(false)
    router.push('/pet/new?onboarding=1&total=' + petCount + '&current=1')
  }

  const next = () => {
    if (isConsentStep) {
      saveConsent()
    } else if (isThemeStep) {
      setThemeId(selectedTheme)
      setStep(s => s + 1)
    } else {
      setStep(s => s + 1)
    }
  }

  const skip = () => {
    setStep(slides.length)
  }

  /* ─── Current slide data (for feature slides only) ─── */
  const currentSlide = step < slides.length ? slides[step] : null

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: currentSlide ? currentSlide.bgGradient : `linear-gradient(180deg, ${C.ivory} 0%, ${C.white} 100%)`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'background 0.5s ease',
      }}
    >
      {/* Top bar: skip button */}
      <div className="relative z-20 flex justify-between items-center px-6 pt-6 safe-top">
        {step > 0 && !isConsentStep ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="text-sm font-semibold transition-colors"
            style={{ color: `${C.charcoal}80` }}
          >
            Atrás
          </button>
        ) : (
          <div />
        )}
        {step < slides.length && (
          <button
            onClick={skip}
            className="text-sm font-semibold transition-colors"
            style={{ color: `${C.charcoal}60` }}
          >
            Omitir
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6">
        <AnimatePresence mode="wait">
          {/* ─── FEATURE SLIDES ─── */}
          {currentSlide && (
            <motion.div
              key={`slide-${step}`}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="text-center"
            >
              {/* Large icon circle */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                className="inline-flex items-center justify-center w-28 h-28 rounded-[32px] mb-8"
                style={{
                  background: currentSlide.iconBg,
                  boxShadow: `0 16px 48px ${currentSlide.iconBg}40`,
                }}
              >
                <div className="text-white">{currentSlide.icon}</div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="text-[28px] font-extrabold mb-3 tracking-tight leading-tight"
                style={{ color: C.charcoal }}
              >
                {currentSlide.title}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.26 }}
                className="text-base font-semibold mb-4"
                style={{ color: currentSlide.accent }}
              >
                {currentSlide.subtitle}
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.32 }}
                className="text-sm leading-relaxed max-w-xs mx-auto"
                style={{ color: `${C.charcoal}99` }}
              >
                {currentSlide.description}
              </motion.p>
            </motion.div>
          )}

          {/* ─── THEME STEP ─── */}
          {isThemeStep && (
            <motion.div
              key="theme"
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] mb-5"
                  style={{
                    background: `linear-gradient(135deg, ${C.coral}, ${C.yellow})`,
                    boxShadow: `0 16px 48px ${C.coral}40`,
                  }}
                >
                  <Palette size={40} color="#fff" strokeWidth={1.8} />
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.18 }}
                  className="text-[26px] font-extrabold mb-2 tracking-tight"
                  style={{ color: C.charcoal }}
                >
                  Elige tu Estilo
                </motion.h2>
                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.24 }}
                  className="text-sm"
                  style={{ color: `${C.charcoal}70` }}
                >
                  Personaliza la apariencia de tu app
                </motion.p>
              </div>

              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="max-w-sm mx-auto"
              >
                <div className="grid grid-cols-5 gap-3">
                  {themeList.map((t, i) => {
                    const isSelected = selectedTheme === t.id
                    return (
                      <motion.button
                        key={t.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.35 + i * 0.04, type: 'spring', stiffness: 300 }}
                        onClick={() => setSelectedTheme(t.id)}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="w-12 h-12 rounded-2xl relative flex items-center justify-center transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                            boxShadow: isSelected ? `0 4px 16px ${t.primary}50` : `0 2px 8px ${t.primary}20`,
                            border: isSelected ? `2.5px solid ${C.charcoal}` : '2.5px solid transparent',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                            >
                              <Check size={12} color={t.primary} strokeWidth={3} />
                            </motion.div>
                          )}
                        </div>
                        <span
                          className="text-[9px] font-semibold"
                          style={{ color: isSelected ? C.charcoal : `${C.charcoal}60` }}
                        >
                          {t.id === 'petid' ? 'Estándar' : t.name}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── PET COUNT STEP ─── */}
          {isPetCountStep && (
            <motion.div
              key="petcount"
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] mb-5"
                  style={{
                    background: `linear-gradient(135deg, ${C.yellow}, ${C.coral})`,
                    boxShadow: `0 16px 48px ${C.yellow}40`,
                  }}
                >
                  <PawPrint size={40} color="#fff" strokeWidth={1.8} />
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.18 }}
                  className="text-[26px] font-extrabold mb-2 tracking-tight"
                  style={{ color: C.charcoal }}
                >
                  ¿Cuántas mascotas tienes?
                </motion.h2>
                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.24 }}
                  className="text-sm"
                  style={{ color: `${C.charcoal}70` }}
                >
                  Las registraremos una por una al terminar
                </motion.p>
              </div>

              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-6"
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPetCount(c => Math.max(1, c - 1))}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: petCount <= 1 ? `${C.charcoal}08` : `${C.charcoal}10`,
                    border: `1.5px solid ${C.charcoal}15`,
                    opacity: petCount <= 1 ? 0.35 : 1,
                  }}
                >
                  <Minus size={22} color={C.charcoal} />
                </motion.button>

                <motion.div
                  key={petCount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 rounded-3xl flex items-center justify-center"
                  style={{
                    background: `${C.coral}12`,
                    border: `2px solid ${C.coral}40`,
                  }}
                >
                  <span className="text-5xl font-extrabold" style={{ color: C.charcoal }}>{petCount}</span>
                </motion.div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPetCount(c => Math.min(10, c + 1))}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: petCount >= 10 ? `${C.charcoal}08` : `${C.charcoal}10`,
                    border: `1.5px solid ${C.charcoal}15`,
                    opacity: petCount >= 10 ? 0.35 : 1,
                  }}
                >
                  <Plus size={22} color={C.charcoal} />
                </motion.button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-xs mt-4"
                style={{ color: `${C.charcoal}50` }}
              >
                Puedes agregar más después
              </motion.p>
            </motion.div>
          )}

          {/* ─── CONSENT STEP ─── */}
          {isConsentStep && (
            <motion.div
              key="consent"
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] mb-5"
                  style={{
                    background: `linear-gradient(135deg, ${C.coral}, ${C.yellow})`,
                    boxShadow: `0 16px 48px ${C.coral}40`,
                  }}
                >
                  <FileCheck size={40} color="#fff" strokeWidth={1.8} />
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.18 }}
                  className="text-[26px] font-extrabold mb-2 tracking-tight"
                  style={{ color: C.charcoal }}
                >
                  Tratamiento de Datos
                </motion.h2>
                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.24 }}
                  className="text-sm"
                  style={{ color: `${C.charcoal}70` }}
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
                    style={{
                      background: C.white,
                      border: `1px solid ${C.charcoal}10`,
                      boxShadow: `0 2px 8px ${C.charcoal}06`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${C.coral}15` }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: C.coral }}>
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: `${C.charcoal}90` }}>
                      {item}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Checkbox */}
              <motion.button
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65 }}
                onClick={() => setConsentChecked(!consentChecked)}
                className="flex items-center gap-3 mx-auto p-3 rounded-xl max-w-sm w-full transition-all"
                style={{
                  background: consentChecked ? `${C.coral}10` : C.white,
                  border: `1.5px solid ${consentChecked ? C.coral : `${C.charcoal}15`}`,
                }}
              >
                {consentChecked ? (
                  <CheckSquare size={22} color={C.coral} strokeWidth={2} />
                ) : (
                  <Square size={22} color={`${C.charcoal}35`} strokeWidth={1.5} />
                )}
                <span
                  className="text-xs font-medium text-left"
                  style={{ color: consentChecked ? C.charcoal : `${C.charcoal}70` }}
                >
                  Acepto el tratamiento de mis datos personales y los de mi mascota según lo descrito
                </span>
              </motion.button>
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
                background: i === step ? C.coral : `${C.charcoal}15`,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          disabled={(isConsentStep && !consentChecked) || saving}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm transition-opacity"
          style={{
            background: isConsentStep && !consentChecked
              ? `${C.charcoal}30`
              : C.coral,
            boxShadow: isConsentStep && !consentChecked
              ? 'none'
              : `0 8px 30px ${C.coral}35`,
            opacity: saving ? 0.7 : 1,
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
          ) : isThemeStep ? (
            <>
              Confirmar Tema
              <ArrowRight size={18} />
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
