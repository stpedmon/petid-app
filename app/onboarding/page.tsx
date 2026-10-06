'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  FileCheck,
  CheckSquare,
  Square,
  Palette,
  Check,
  QrCode,
  Heart,
  Bell,
  ShieldCheck,
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

/* ─── Consent items ─── */
const consentItems = [
  'Recopilamos datos de tu mascota (nombre, raza, foto, historial médico) para generar su tarjeta digital.',
  'Tu información de contacto se muestra al escanear el QR para que puedan contactarte si encuentran a tu mascota.',
  'Los veterinarios autorizados pueden actualizar el historial médico de tu mascota.',
  'Puedes solicitar la eliminación completa de tus datos en cualquier momento desde Ajustes.',
]

/* ─── Feature items for the overview screen ─── */
const features = [
  {
    icon: QrCode,
    title: 'Identidad digital con QR',
    desc: 'Un código único para que siempre puedan identificar a tu mascota.',
    color: C.coral,
  },
  {
    icon: Heart,
    title: 'Historial de salud',
    desc: 'Vacunas, tratamientos y consultas en un solo lugar.',
    color: '#E85D75',
  },
  {
    icon: Bell,
    title: 'Recordatorios a tiempo',
    desc: 'Alertas para que nunca se pase un cuidado importante.',
    color: C.yellow,
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad si se pierde',
    desc: 'Al escanear el QR, pueden contactarte de inmediato.',
    color: C.sky,
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [consentChecked, setConsentChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('petid')
  const [selectedSpecies, setSelectedSpecies] = useState<'dog' | 'cat' | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const { setThemeId } = useTheme()

  // 5 steps: Welcome → Features → Species → Theme → Consent
  const totalSteps = 5
  const isSpeciesStep = step === 2
  const isThemeStep = step === 3
  const isConsentStep = step === 4

  const themeList = Object.values(themes)
  const activeTheme = themes[selectedTheme]
  const liveAccent = isThemeStep ? activeTheme.primary : C.coral

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
    localStorage.setItem('petid_onboarding_pet_count', '1')
    if (selectedSpecies) {
      localStorage.setItem('petid_onboarding_species', selectedSpecies)
    }
    setSaving(false)
    router.push('/pet/new?onboarding=1&total=1&current=1')
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

  const prev = () => {
    if (step > 0) setStep(s => s - 1)
  }

  // Swipe gesture
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x < -50 && info.velocity.x < -100) {
        if (step < totalSteps - 1) next()
      } else if (info.offset.x > 50 && info.velocity.x > 100) {
        if (step > 0) prev()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step]
  )

  return (
    <div
      className="flex flex-col relative"
      style={{
        height: '100dvh',
        background: isThemeStep
          ? `linear-gradient(180deg, ${activeTheme.bg} 0%, ${C.white} 100%)`
          : `linear-gradient(180deg, ${C.ivory} 0%, ${C.white} 100%)`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'background 0.5s ease',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div className="relative z-20 flex justify-between items-center px-5 pt-5 flex-shrink-0">
        {step > 0 ? (
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: `${C.charcoal}06` }}
          >
            <span className="text-lg" style={{ color: C.charcoal }}>←</span>
          </button>
        ) : (
          <div className="w-9" />
        )}
        <div className="w-9" />
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pt-2 pb-0 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`step-${step}`}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col relative min-h-0 overflow-y-auto scrollbar-hide"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            {/* ─── STEP 0: Welcome Splash ─── */}
            {step === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {/* Logo */}
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 mb-5"
                >
                  <img
                    src="/images/petid-logo-black.png"
                    alt="PetID"
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <div className="text-[28px] font-extrabold tracking-tight leading-none" style={{ color: C.charcoal }}>
                      Pet<span style={{ color: C.coral }}>ID</span>
                    </div>
                    <div className="text-[7px] font-bold tracking-[3px] uppercase" style={{ color: C.charcoal }}>
                      SIEMPRE CONTIGO
                    </div>
                  </div>
                </motion.div>

                {/* Main pets */}
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                  className="relative mb-5"
                >
                  {/* Background blob */}
                  <div
                    className="absolute rounded-full -z-[1]"
                    style={{
                      width: 180,
                      height: 180,
                      background: `${C.yellow}50`,
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                  <div className="flex items-end justify-center">
                    <span className="text-[100px] leading-none" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }}>🐶</span>
                    <span className="text-[70px] leading-none -ml-4" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }}>🐱</span>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[24px] font-extrabold text-center leading-tight tracking-tight mb-2"
                  style={{ color: C.charcoal }}
                >
                  La identidad digital
                  <br />
                  de <span style={{ color: C.coral }}>tu mascota</span>
                </motion.h1>

                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[13px] text-center max-w-[280px]"
                  style={{ color: '#5b6470' }}
                >
                  Todo su historial de salud, cuidados y contacto en un solo lugar.
                </motion.p>
              </div>
            )}

            {/* ─── STEP 1: Features Overview ─── */}
            {step === 1 && (
              <div className="flex-1 flex flex-col">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-[24px] font-extrabold tracking-tight leading-tight mb-2 text-center"
                  style={{ color: C.charcoal }}
                >
                  Todo lo que <span style={{ color: C.coral }}>necesitas</span>
                </motion.h1>
                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[13px] text-center max-w-[300px] mx-auto mb-6"
                  style={{ color: '#5b6470' }}
                >
                  PetID cuida a tu mascota de principio a fin.
                </motion.p>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-3 max-w-sm mx-auto w-full">
                    {features.map((feat, i) => {
                      const Icon = feat.icon
                      return (
                        <motion.div
                          key={i}
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex items-center gap-4 bg-white rounded-2xl p-4"
                          style={{
                            boxShadow: '0 4px 16px rgba(31,31,31,0.06)',
                            border: `1px solid ${C.charcoal}06`,
                          }}
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${feat.color}15` }}
                          >
                            <Icon size={22} color={feat.color} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold" style={{ color: C.charcoal }}>
                              {feat.title}
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: '#8a919c' }}>
                              {feat.desc}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Species Selection ─── */}
            {isSpeciesStep && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
                  style={{ color: C.charcoal }}
                >
                  ¿Cuál es tu <span style={{ color: C.coral }}>primera mascota?</span>
                </motion.h1>
                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[13px] max-w-[280px] mx-auto mb-8"
                  style={{ color: '#5b6470' }}
                >
                  Comienza registrando a tu mascota para crear su identidad digital.
                </motion.p>

                {/* Species cards */}
                <div className="flex gap-4 justify-center mb-4">
                  {[
                    { id: 'dog' as const, emoji: '🐶', label: 'Perro' },
                    { id: 'cat' as const, emoji: '🐱', label: 'Gato' },
                  ].map((species, i) => (
                    <motion.button
                      key={species.id}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSpecies(species.id)}
                      className="flex-1 max-w-[140px] py-5 rounded-[20px] flex flex-col items-center gap-2 transition-all"
                      style={{
                        background: C.white,
                        border: `2.5px solid ${selectedSpecies === species.id ? C.coral : '#e8e8e8'}`,
                        boxShadow: selectedSpecies === species.id
                          ? `0 8px 28px ${C.coral}25`
                          : '0 6px 20px rgba(31,31,31,0.06)',
                        transform: selectedSpecies === species.id ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >
                      <span className="text-[64px] leading-none">{species.emoji}</span>
                      <span className="text-[14px] font-bold" style={{ color: C.charcoal }}>
                        {species.label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-[10px]"
                  style={{ color: '#8a919c' }}
                >
                  También podrás agregar más mascotas después.
                </motion.p>
              </div>
            )}

            {/* ─── STEP 3: Theme Selection ─── */}
            {isThemeStep && (
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-5">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-[18px] mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${liveAccent}, ${activeTheme.accent})`,
                      boxShadow: `0 10px 30px ${liveAccent}40`,
                      transition: 'background 0.4s ease, box-shadow 0.4s ease',
                    }}
                  >
                    <Palette size={30} color="#fff" strokeWidth={1.8} />
                  </motion.div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.18 }}
                    className="text-[24px] font-extrabold mb-1 tracking-tight"
                    style={{ color: C.charcoal }}
                  >
                    Elige tu Estilo
                  </motion.h2>
                  <motion.p
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.24 }}
                    className="text-[13px]"
                    style={{ color: `${C.charcoal}70` }}
                  >
                    Personaliza la apariencia de tu app
                  </motion.p>
                </div>

                {/* Theme grid */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="max-w-sm mx-auto w-full"
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
                            className="w-12 h-12 rounded-2xl relative flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                              boxShadow: isSelected ? `0 4px 16px ${t.primary}50` : `0 2px 8px ${t.primary}20`,
                              border: isSelected ? `2.5px solid ${C.charcoal}` : '2.5px solid transparent',
                              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                              transition: 'all 0.25s ease',
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

                {/* Live preview card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-5 mx-auto w-full max-w-[240px] rounded-2xl p-4 text-center"
                  style={{
                    background: activeTheme.bgCard,
                    border: `1.5px solid ${activeTheme.border}`,
                    boxShadow: `0 8px 24px ${activeTheme.primary}15`,
                    transition: 'all 0.4s ease',
                  }}
                >
                  <div className="text-3xl mb-1">🐶</div>
                  <div className="text-[12px] font-bold" style={{ color: activeTheme.text, transition: 'color 0.3s' }}>
                    Max
                  </div>
                  <div
                    className="text-[9px] mt-1 font-medium"
                    style={{ color: activeTheme.textMuted, transition: 'color 0.3s' }}
                  >
                    Golden Retriever · 3 años
                  </div>
                  <div
                    className="mt-2 py-1.5 rounded-lg text-[10px] font-bold text-white"
                    style={{
                      background: activeTheme.primary,
                      transition: 'background 0.3s ease',
                    }}
                  >
                    Ver perfil
                  </div>
                </motion.div>
              </div>
            )}

            {/* ─── STEP 3: Data Consent ─── */}
            {isConsentStep && (
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-[18px] mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${C.coral}, ${C.yellow})`,
                      boxShadow: `0 10px 30px ${C.coral}40`,
                    }}
                  >
                    <FileCheck size={30} color="#fff" strokeWidth={1.8} />
                  </motion.div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.18 }}
                    className="text-[22px] font-extrabold mb-1 tracking-tight"
                    style={{ color: C.charcoal }}
                  >
                    Tratamiento de Datos
                  </motion.h2>
                  <motion.p
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.24 }}
                    className="text-[12px]"
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
                  className="space-y-2 mb-4 max-w-sm mx-auto w-full"
                >
                  {consentItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      className="flex gap-2.5 items-start p-3 rounded-xl"
                      style={{
                        background: C.white,
                        border: `1px solid ${C.charcoal}08`,
                        boxShadow: `0 2px 8px ${C.charcoal}05`,
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
                      <p className="text-[11px] leading-relaxed" style={{ color: `${C.charcoal}90` }}>
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
                    <CheckSquare size={20} color={C.coral} strokeWidth={2} />
                  ) : (
                    <Square size={20} color={`${C.charcoal}35`} strokeWidth={1.5} />
                  )}
                  <span
                    className="text-[11px] font-medium text-left"
                    style={{ color: consentChecked ? C.charcoal : `${C.charcoal}70` }}
                  >
                    Acepto el tratamiento de mis datos personales y los de mi mascota
                  </span>
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-5 pb-8 pt-3 flex-shrink-0">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className="h-[6px] rounded-full"
              animate={{
                width: i === step ? 24 : 6,
                background: i === step ? (isThemeStep ? liveAccent : C.coral) : `${C.charcoal}15`,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* CTA */}
        {step === 0 ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-[28px] text-white font-bold text-[15px]"
            style={{
              background: C.coral,
              boxShadow: `0 10px 30px ${C.coral}30`,
            }}
          >
            Comenzar
            <ArrowRight size={18} />
          </motion.button>
        ) : isSpeciesStep ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            disabled={!selectedSpecies}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-[28px] text-white font-bold text-[15px] transition-opacity"
            style={{
              background: selectedSpecies ? C.coral : `${C.charcoal}30`,
              boxShadow: selectedSpecies ? `0 10px 30px ${C.coral}30` : 'none',
            }}
          >
            Continuar
            <ArrowRight size={18} />
          </motion.button>
        ) : isConsentStep ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            disabled={!consentChecked || saving}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-[28px] text-white font-bold text-[15px] transition-opacity"
            style={{
              background: consentChecked ? C.coral : `${C.charcoal}30`,
              boxShadow: consentChecked ? `0 10px 30px ${C.coral}30` : 'none',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Sparkles size={18} />
                Aceptar y Comenzar
              </>
            )}
          </motion.button>
        ) : isThemeStep ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-[28px] text-white font-bold text-[15px]"
            style={{
              background: liveAccent,
              boxShadow: `0 10px 30px ${liveAccent}30`,
              transition: 'background 0.4s ease, box-shadow 0.4s ease',
            }}
          >
            Confirmar Tema
            <ArrowRight size={18} />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-[28px] text-white font-bold text-[15px]"
            style={{
              background: C.coral,
              boxShadow: `0 10px 30px ${C.coral}30`,
            }}
          >
            Continuar
            <ArrowRight size={18} />
          </motion.button>
        )}
      </div>
    </div>
  )
}
