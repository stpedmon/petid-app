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

/* ─── Floating Pill Badge Component ─── */
function Pill({
  icon,
  title,
  subtitle,
  className = '',
  style = {},
  delay = 0,
}: {
  icon: string
  title: string
  subtitle: string
  className?: string
  style?: React.CSSProperties
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      className={`absolute flex items-center gap-2.5 bg-white rounded-2xl px-3 py-2.5 z-10 ${className}`}
      style={{
        boxShadow: '0 8px 28px rgba(31,31,31,0.10)',
        ...style,
      }}
    >
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-[11px] font-bold" style={{ color: C.charcoal }}>
          {title}
        </div>
        <div className="text-[9px] font-medium" style={{ color: '#8a919c' }}>
          {subtitle}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Pet Illustration ─── */
function PetVisual({ size = 130, type = 'dog', delay = 0.15 }: { size?: number; type?: 'dog' | 'cat'; delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 18 }}
      className="relative"
      style={{ fontSize: size }}
    >
      {type === 'dog' ? '🐶' : '🐱'}
    </motion.div>
  )
}

/* ─── Health Item Row ─── */
function HealthRow({ icon, title, subtitle, delay }: { icon: string; title: string; subtitle: string; delay: number }) {
  return (
    <motion.div
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      className="flex items-center gap-3 py-3 border-b"
      style={{ borderColor: `${C.charcoal}08` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
        style={{ background: `${C.coral}12` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[13px] font-bold" style={{ color: C.charcoal }}>
          {title}
        </div>
        <div className="text-[10px] font-medium" style={{ color: '#8a919c' }}>
          {subtitle}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Consent items ─── */
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
  const [selectedSpecies, setSelectedSpecies] = useState<'dog' | 'cat' | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('petid')
  const router = useRouter()
  const { user } = useAuth()
  const { setThemeId } = useTheme()

  // 10 feature slides + theme + consent = 12 steps
  const FEATURE_COUNT = 10
  const totalSteps = FEATURE_COUNT + 2
  const isThemeStep = step === FEATURE_COUNT
  const isConsentStep = step === FEATURE_COUNT + 1

  const themeList = Object.values(themes)

  // Get current theme colors for live preview
  const activeTheme = themes[selectedTheme]
  const liveAccent = isThemeStep ? activeTheme.primary : C.coral
  const liveBg = isThemeStep ? activeTheme.bg : C.ivory

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

  const skip = () => {
    setStep(FEATURE_COUNT)
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

  /* ─── Render the visual content for each feature slide ─── */
  const renderFeatureVisual = (idx: number) => {
    switch (idx) {
      /* ── SCREEN 1: Splash with logo + pets + floating badges ── */
      case 0:
        return (
          <div className="relative flex-1 flex flex-col items-center min-h-0">
            {/* Logo */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center mb-3"
            >
              <div className="flex items-center gap-2">
                <img
                  src="/images/petid-logo-black.png"
                  alt="PetID"
                  className="w-14 h-14 object-contain"
                />
                <div>
                  <div className="text-[32px] font-extrabold tracking-tight leading-none" style={{ color: C.charcoal }}>
                    Pet<span style={{ color: C.coral }}>ID</span>
                  </div>
                  <div className="text-[8px] font-bold tracking-[3px] uppercase" style={{ color: C.charcoal }}>
                    SIEMPRE CONTIGO
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[26px] font-extrabold text-center leading-tight tracking-tight mb-2"
              style={{ color: C.charcoal }}
            >
              La identidad digital
              <br />
              de <span style={{ color: C.coral }}>tu mascota</span>
            </motion.h1>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="text-[13px] text-center max-w-[280px] mb-4"
              style={{ color: '#5b6470' }}
            >
              Todo su historial de salud, cuidados y contacto en un solo lugar.
            </motion.p>

            {/* Pet composition with floating badges */}
            <div className="relative w-full flex-1 flex items-end justify-center min-h-[300px]">
              {/* Background blobs */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute rounded-full"
                style={{
                  width: 200,
                  height: 200,
                  background: `${C.yellow}70`,
                  left: '10%',
                  bottom: '15%',
                }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35 }}
                className="absolute rounded-full"
                style={{
                  width: 120,
                  height: 120,
                  background: `${C.sky}90`,
                  right: '12%',
                  bottom: '8%',
                }}
              />

              {/* Paw print watermarks */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.06 }}
                className="absolute text-[80px]"
                style={{ right: '5%', top: '5%' }}
              >
                🐾
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.06 }}
                className="absolute text-[50px]"
                style={{ left: '2%', top: '20%' }}
              >
                🐾
              </motion.div>

              {/* Floating pills */}
              <Pill icon="💉" title="Vacunas" subtitle="Siempre al día" style={{ left: 0, top: 10 }} delay={0.5} />
              <Pill icon="📄" title="Historial" subtitle="Completo" style={{ right: 0, top: 40 }} delay={0.6} />
              <Pill icon="🔔" title="Recordatorios" subtitle="Nunca se olvida" style={{ left: 0, bottom: 80 }} delay={0.7} />
              <Pill icon="📱" title="Identidad QR" subtitle="Siempre contigo" style={{ right: 0, bottom: 110 }} delay={0.8} />

              {/* Heart floating */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: 'spring' }}
                className="absolute text-2xl"
                style={{ right: '15%', top: '15%', color: C.coral }}
              >
                ❤️
              </motion.div>

              {/* Main pets */}
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
                className="relative z-[3] flex items-end justify-center"
              >
                <span className="text-[120px] leading-none" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }}>🐶</span>
                <span
                  className="text-[80px] leading-none -ml-6 mb-0"
                  style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }}
                >
                  🐱
                </span>
              </motion.div>

              {/* Pet tags */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="absolute z-[4] w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: C.coral,
                  boxShadow: `0 4px 12px ${C.coral}40`,
                  bottom: '20%',
                  left: '40%',
                }}
              >
                <img src="/images/petid-logo-black.png" alt="" className="w-4 h-4 invert brightness-200" />
              </motion.div>
            </div>
          </div>
        )

      /* ── SCREEN 2: ¿Qué es PetID? ── */
      case 1:
        return (
          <div className="text-center flex-1 flex flex-col">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: C.charcoal }}
            >
              ¿Qué es <span style={{ color: C.coral }}>PetID?</span>
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] max-w-[300px] mx-auto mb-6"
              style={{ color: '#5b6470' }}
            >
              Una identidad digital, un historial de salud y más, para que tu mascota siempre esté contigo.
            </motion.p>

            <div className="relative flex-1 flex items-center justify-center min-h-[340px]">
              {/* Central phone mockup */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-[170px] rounded-[24px] bg-white p-4 relative z-[2]"
                style={{ boxShadow: '0 16px 48px rgba(31,31,31,0.12)', border: `3px solid ${C.charcoal}` }}
              >
                <div className="text-center">
                  <div className="text-[14px] font-extrabold tracking-tight mb-2" style={{ color: C.charcoal }}>
                    Pet<span style={{ color: C.coral }}>ID</span>
                  </div>
                  <div className="text-[56px] mb-2">🐶</div>
                  <div className="text-[11px] font-bold mb-3" style={{ color: C.charcoal }}>Max</div>
                  <div className="space-y-2">
                    {[
                      { icon: '🪪', label: 'Identidad digital' },
                      { icon: '📋', label: 'Historial de salud' },
                      { icon: '🔔', label: 'Recordatorios' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-2 py-2 px-3 rounded-lg text-[9px] font-semibold"
                        style={{ background: `${C.ivory}`, color: C.charcoal }}
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Floating feature pills */}
              <Pill icon="🪪" title="Identidad digital" subtitle="QR único" style={{ left: -10, top: 20 }} delay={0.5} />
              <Pill icon="❤️" title="Historial de salud" subtitle="Todo registrado" style={{ right: -10, top: 60 }} delay={0.6} />
              <Pill icon="🔔" title="Recordatorios" subtitle="A tiempo" style={{ left: -10, bottom: 80 }} delay={0.7} />
              <Pill icon="📍" title="Siempre contigo" subtitle="Acceso total" style={{ right: -10, bottom: 40 }} delay={0.8} />
            </div>
          </div>
        )

      /* ── SCREEN 3: Identidad digital única ── */
      case 2:
        return (
          <div className="text-center flex-1 flex flex-col">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: C.charcoal }}
            >
              Identidad digital
              <br />
              <span style={{ color: C.coral }}>única</span>
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] max-w-[300px] mx-auto mb-6"
              style={{ color: '#5b6470' }}
            >
              Cada mascota tiene un QR único con su información. Si se pierde, puede volver a casa más rápido.
            </motion.p>

            <div className="relative flex-1 flex items-center justify-center min-h-[320px]">
              {/* Yellow blob */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute rounded-full"
                style={{ width: 180, height: 180, background: `${C.yellow}50`, left: '5%', top: '10%' }}
              />

              {/* QR Card */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-[20px] p-5 text-center relative z-[2]"
                style={{ boxShadow: '0 16px 48px rgba(31,31,31,0.12)', width: 180 }}
              >
                <div className="text-[70px] mb-2">🐶</div>
                <div className="text-[16px] font-extrabold" style={{ color: C.charcoal }}>Max</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-1 mt-1 mb-3"
                >
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#e9f7ee' }}>
                    <span className="text-[8px]" style={{ color: '#29936a' }}>✓</span>
                  </div>
                  <span className="text-[9px] font-semibold" style={{ color: '#29936a' }}>Identidad verificada</span>
                </motion.div>
                {/* QR placeholder */}
                <div
                  className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center text-4xl"
                  style={{ background: `${C.ivory}`, border: `1px solid ${C.charcoal}10` }}
                >
                  📱
                </div>
              </motion.div>

              {/* Dog emoji */}
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute text-[90px] z-[1]"
                style={{ left: 0, bottom: 20, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }}
              >
                🐕
              </motion.div>

              {/* Info items */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-0 right-0 space-y-2"
              >
                {['Información de contacto', 'Datos de la mascota', 'Acceso rápido y seguro'].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-medium" style={{ color: '#5b6470' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: `${C.coral}15` }}>
                      <span style={{ color: C.coral, fontSize: 8 }}>✓</span>
                    </div>
                    {text}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        )

      /* ── SCREEN 4: Historial de salud completo ── */
      case 3:
        return (
          <div className="text-center flex-1 flex flex-col">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: C.charcoal }}
            >
              Historial de salud
              <br />
              <span style={{ color: C.coral }}>completo</span>
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] max-w-[300px] mx-auto mb-4"
              style={{ color: '#5b6470' }}
            >
              Registra vacunas, desparasitación, medicamentos, consultas y más. Todo en un solo lugar.
            </motion.p>

            <div className="flex-1 flex flex-col justify-center">
              {/* Health items list */}
              <div className="max-w-sm mx-auto w-full px-2">
                <HealthRow icon="💉" title="Vacunas" subtitle="Siempre al día" delay={0.25} />
                <HealthRow icon="🐛" title="Desparasitación" subtitle="Interna y externa" delay={0.35} />
                <HealthRow icon="💊" title="Medicamentos" subtitle="Tratamientos" delay={0.45} />
                <HealthRow icon="🩺" title="Consultas" subtitle="Visitas veterinarias" delay={0.55} />
              </div>

              {/* Próxima vacuna card */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="mt-5 mx-auto w-full max-w-sm"
              >
                <div
                  className="bg-white rounded-2xl p-4 flex items-center gap-3"
                  style={{ boxShadow: '0 8px 28px rgba(31,31,31,0.08)', border: `1px solid ${C.coral}20` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${C.coral}12` }}
                  >
                    <span className="text-xl">📋</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold" style={{ color: C.charcoal }}>Próxima vacuna</div>
                    <div className="text-[11px] font-semibold" style={{ color: C.coral }}>Rabia</div>
                    <div className="text-[9px]" style={{ color: '#8a919c' }}>15 de noviembre de 2026</div>
                  </div>
                  <ArrowRight size={16} style={{ color: `${C.charcoal}30` }} />
                </div>
              </motion.div>

              {/* Cat illustration */}
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute right-2 top-20 text-[60px]"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}
              >
                🐱
              </motion.div>

              {/* Bell decoration */}
              <motion.div
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="absolute right-4 bottom-10 text-[36px]"
              >
                🔔
              </motion.div>
            </div>
          </div>
        )

      /* ── SCREEN 5: Recordatorios a tiempo ── */
      case 4:
        return (
          <div className="text-center flex-1 flex flex-col">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: C.charcoal }}
            >
              Recordatorios
              <br />
              <span style={{ color: C.coral }}>a tiempo</span>
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] max-w-[280px] mx-auto mb-6"
              style={{ color: '#5b6470' }}
            >
              Recibe alertas antes de cada vacuna, tratamiento o consulta. Para que nunca se te pase un cuidado importante.
            </motion.p>

            <div className="relative flex-1 flex items-center justify-center min-h-[300px]">
              {/* Large bell */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="text-[100px] absolute top-0"
                style={{ filter: 'drop-shadow(0 8px 20px rgba(255,204,87,0.3))' }}
              >
                🔔
              </motion.div>

              {/* Notification cards */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-12 w-full space-y-3 px-2"
              >
                {[
                  { text: 'Vacuna antirrábica en 3 días', time: 'Hoy 9:00 AM', icon: '💉' },
                  { text: 'Desparasitación pendiente', time: 'Mañana', icon: '🐛' },
                  { text: 'Cita veterinaria próxima', time: 'Vie 10:30 AM', icon: '🩺' },
                ].map((notif, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: i % 2 === 0 ? -30 : 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.12 }}
                    className="bg-white rounded-2xl p-3 flex items-center gap-3"
                    style={{ boxShadow: '0 6px 20px rgba(31,31,31,0.08)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${C.coral}12` }}
                    >
                      {notif.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold" style={{ color: C.charcoal }}>{notif.text}</div>
                      <div className="text-[9px]" style={{ color: '#8a919c' }}>{notif.time}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Cat at corner */}
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute right-0 top-[60px] text-[70px]"
                style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.1))' }}
              >
                🐱
              </motion.div>
            </div>
          </div>
        )

      /* ── SCREEN 6: Todo en tu bolsillo ── */
      case 5:
        return (
          <div className="text-center flex-1 flex flex-col">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: C.charcoal }}
            >
              Todo <span style={{ color: C.coral }}>en tu bolsillo</span>
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] max-w-[300px] mx-auto mb-4"
              style={{ color: '#5b6470' }}
            >
              Accede desde cualquier lugar a la información de tu mascota, comparte su identidad y mantén su historial siempre actualizado.
            </motion.p>

            <div className="relative flex-1 flex items-center justify-center min-h-[320px]">
              {/* Phone mockup */}
              <motion.div
                initial={{ y: 50, opacity: 0, rotate: -5 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                className="bg-white rounded-[28px] p-4 relative z-[2]"
                style={{
                  boxShadow: '0 20px 60px rgba(31,31,31,0.15)',
                  border: `4px solid ${C.charcoal}`,
                  width: 185,
                }}
              >
                <div className="text-center">
                  <div className="text-[11px] font-extrabold mb-2" style={{ color: C.charcoal }}>
                    Pet<span style={{ color: C.coral }}>ID</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <div className="text-[36px]">🐶</div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold" style={{ color: C.charcoal }}>Max</div>
                      <div className="text-[8px]" style={{ color: '#8a919c' }}>Siempre al día</div>
                    </div>
                    <div
                      className="px-2 py-0.5 rounded-full text-[7px] font-bold"
                      style={{ background: '#e9f7ee', color: '#29936a' }}
                    >
                      Identificado
                    </div>
                  </div>
                  {/* Mini tabs */}
                  <div className="flex gap-1 mb-2">
                    {['Vacunas', 'Historial'].map((tab, i) => (
                      <div
                        key={tab}
                        className="flex-1 py-1.5 rounded-lg text-[8px] font-bold text-center"
                        style={{
                          background: i === 0 ? C.coral : `${C.charcoal}06`,
                          color: i === 0 ? C.white : `${C.charcoal}60`,
                        }}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>
                  {/* Mini nav */}
                  <div className="flex justify-around mt-3 pt-2" style={{ borderTop: `1px solid ${C.charcoal}08` }}>
                    {['🏠', '🐾', '💉', '⚙️'].map((icon, i) => (
                      <div key={i} className="text-lg opacity-60">
                        {icon}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Floating elements */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="absolute text-[30px] -left-1 top-10"
              >
                ❤️
              </motion.div>
              <Pill icon="📱" title="QR" subtitle="Compartir" style={{ right: -5, bottom: 80 }} delay={0.7} />
            </div>
          </div>
        )

      /* ── SCREEN 7: Para todas sus etapas de vida ── */
      case 6:
        return (
          <div className="text-center flex-1 flex flex-col">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: C.charcoal }}
            >
              Para todas sus
              <br />
              <span style={{ color: C.coral }}>etapas de vida</span>
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] max-w-[300px] mx-auto mb-8"
              style={{ color: '#5b6470' }}
            >
              Desde cachorro hasta adulto mayor. PetID te acompaña en cada etapa con los cuidados que necesita.
            </motion.p>

            <div className="relative flex-1 flex items-end justify-center pb-8 min-h-[300px]">
              {/* Life stages */}
              <div className="flex items-end gap-4 justify-center w-full">
                {[
                  { emoji: '🐕', label: 'Cachorro', age: '0 - 1 año', size: 60 },
                  { emoji: '🐶', label: 'Adulto', age: '1 - 7 años', size: 80 },
                  { emoji: '🦮', label: 'Senior', age: '+ 7 años', size: 65 },
                ].map((stage, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
                    className="flex flex-col items-center"
                  >
                    <span
                      className="mb-2"
                      style={{
                        fontSize: stage.size,
                        filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.1))',
                      }}
                    >
                      {stage.emoji}
                    </span>
                    <span className="text-[12px] font-bold" style={{ color: C.charcoal }}>{stage.label}</span>
                    <span className="text-[9px]" style={{ color: '#8a919c' }}>{stage.age}</span>
                  </motion.div>
                ))}
              </div>

              {/* Cats too */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 0.3 }}
                transition={{ delay: 0.8 }}
                className="absolute text-[40px] left-2 top-8"
              >
                🐱
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 0.3 }}
                transition={{ delay: 0.9 }}
                className="absolute text-[35px] right-4 top-14"
              >
                🐈
              </motion.div>
            </div>
          </div>
        )

      /* ── SCREEN 8: Más que salud ── */
      case 7:
        return (
          <div className="text-center flex-1 flex flex-col">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: C.charcoal }}
            >
              <span style={{ color: C.coral }}>Más que salud</span>
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] max-w-[300px] mx-auto mb-6"
              style={{ color: '#5b6470' }}
            >
              También puedes guardar fotos, notas, aventuras y momentos especiales. Porque cada historia merece ser recordada.
            </motion.p>

            <div className="relative flex-1 flex items-center justify-center min-h-[300px]">
              {/* Photo-frame style layout */}
              <div className="flex items-center gap-4 justify-center">
                <motion.div
                  initial={{ rotate: -15, scale: 0, opacity: 0 }}
                  animate={{ rotate: -8, scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="bg-white rounded-2xl p-3 text-center"
                  style={{ boxShadow: '0 12px 32px rgba(31,31,31,0.10)' }}
                >
                  <div className="text-[70px] mb-1">🐶</div>
                  <div className="text-[8px] font-medium" style={{ color: '#8a919c' }}>📸 Primer día</div>
                </motion.div>

                <motion.div
                  initial={{ rotate: 15, scale: 0, opacity: 0 }}
                  animate={{ rotate: 6, scale: 1, opacity: 1 }}
                  transition={{ delay: 0.45, type: 'spring' }}
                  className="bg-white rounded-2xl p-3 text-center"
                  style={{ boxShadow: '0 12px 32px rgba(31,31,31,0.10)' }}
                >
                  <div className="text-[70px] mb-1">🐕</div>
                  <div className="text-[8px] font-medium" style={{ color: '#8a919c' }}>🌳 Aventura</div>
                </motion.div>
              </div>

              {/* Heart decoration */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="absolute top-4 right-8 text-3xl"
              >
                ❤️
              </motion.div>

              {/* Caption card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="absolute bottom-10 bg-white rounded-xl px-4 py-2 flex items-center gap-2"
                style={{ boxShadow: '0 6px 20px rgba(31,31,31,0.08)' }}
              >
                <span className="text-lg">📖</span>
                <span className="text-[10px] font-semibold italic" style={{ color: C.charcoal }}>
                  Mi primera aventura 🐾
                </span>
              </motion.div>
            </div>
          </div>
        )

      /* ── SCREEN 9: Siempre contigo ── */
      case 8:
        return (
          <div className="text-center flex-1 flex flex-col">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[26px] font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: C.charcoal }}
            >
              Siempre <span style={{ color: C.coral }}>contigo</span>
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] max-w-[280px] mx-auto mb-8"
              style={{ color: '#5b6470' }}
            >
              Más seguridad, mejor salud y momentos inolvidables para tu mascota.
            </motion.p>

            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Check items */}
              <div className="w-full max-w-sm px-4 space-y-4">
                {[
                  { icon: '✅', text: 'Identidad siempre accesible' },
                  { icon: '✅', text: 'Cuidado y salud organizados' },
                  { icon: '✅', text: 'Más seguridad en caso de pérdida' },
                  { icon: '✅', text: 'Momentos especiales guardados' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#e9f7ee' }}
                    >
                      <span className="text-sm" style={{ color: '#29936a' }}>✓</span>
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: C.charcoal }}>
                      {item.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Heart */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="mt-8 text-5xl"
              >
                ❤️
              </motion.div>
            </div>
          </div>
        )

      /* ── SCREEN 10: ¿Cuál es tu primera mascota? ── */
      case 9:
        return (
          <div className="text-center flex-1 flex flex-col">
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

            {/* Species selection */}
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
        )

      default:
        return null
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: isThemeStep
          ? `linear-gradient(180deg, ${liveBg} 0%, ${C.white} 100%)`
          : `linear-gradient(180deg, ${C.ivory} 0%, ${C.white} 100%)`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'background 0.5s ease',
      }}
    >
      {/* Top bar */}
      <div className="relative z-20 flex justify-between items-center px-5 pt-5">
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
        {step < FEATURE_COUNT && step > 0 && (
          <button
            onClick={skip}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
            style={{ background: `${C.white}B0`, color: '#344054' }}
          >
            Omitir
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pt-2 pb-0 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`step-${step}`}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col relative min-h-0"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            {/* Feature slides */}
            {step < FEATURE_COUNT && renderFeatureVisual(step)}

            {/* ─── THEME STEP ─── */}
            {isThemeStep && (
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${liveAccent}, ${activeTheme.accent})`,
                      boxShadow: `0 12px 36px ${liveAccent}40`,
                      transition: 'background 0.4s ease, box-shadow 0.4s ease',
                    }}
                  >
                    <Palette size={36} color="#fff" strokeWidth={1.8} />
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
                          onClick={() => {
                            setSelectedTheme(t.id)
                          }}
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
                  className="mt-6 mx-auto w-full max-w-[240px] rounded-2xl p-4 text-center"
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

            {/* ─── CONSENT STEP ─── */}
            {isConsentStep && (
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-5">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${C.coral}, ${C.yellow})`,
                      boxShadow: `0 12px 36px ${C.coral}40`,
                    }}
                  >
                    <FileCheck size={36} color="#fff" strokeWidth={1.8} />
                  </motion.div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.18 }}
                    className="text-[24px] font-extrabold mb-2 tracking-tight"
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
                  className="space-y-2.5 mb-5 max-w-sm mx-auto w-full"
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
      <div className="relative z-10 px-5 pb-8 pt-3">
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
          /* First screen: Comenzar button */
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
        ) : step === FEATURE_COUNT - 1 ? (
          /* Last feature screen (species selection): Continuar */
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            disabled={!selectedSpecies}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-[28px] text-white font-bold text-[15px] transition-opacity"
            style={{
              background: selectedSpecies ? C.coral : `${C.charcoal}30`,
              boxShadow: selectedSpecies ? `0 10px 30px ${C.coral}30` : 'none',
              opacity: selectedSpecies ? 1 : 0.7,
            }}
          >
            Continuar
            <ArrowRight size={18} />
          </motion.button>
        ) : isConsentStep ? (
          /* Consent: Aceptar y Comenzar */
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
          /* Theme: Confirmar Tema */
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
          /* Regular: Next arrow button */
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium" style={{ color: '#9299a3' }}>
              {step} de {FEATURE_COUNT}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={next}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{
                background: C.coral,
                boxShadow: `0 6px 20px ${C.coral}35`,
              }}
            >
              <ArrowRight size={20} />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
