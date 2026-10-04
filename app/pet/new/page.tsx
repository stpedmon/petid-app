'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import {
  Camera, ArrowRight, Sparkles, Check,
  ChevronLeft, X, Weight, Cpu
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'

const hobbies = [
  'Buscar pelota', 'Correr', 'Dormir', 'Morder huesos',
  'Nadar', 'Pasear', 'Juguetes', 'Otros perros',
  'Parque', 'Trucos', 'Sofa', 'Comer'
]

const personalities = [
  'Amigable', 'Jugueton', 'Tranquilo', 'Protector',
  'Inteligente', 'Carinoso', 'Energetico', 'Independiente'
]

const breeds: Record<string, string[]> = {
  canine: [
    'Mestizo', 'Labrador', 'Golden Retriever', 'Pastor Aleman', 'Bulldog Frances',
    'Chihuahua', 'Poodle', 'Husky Siberiano', 'Beagle', 'Rottweiler',
    'Yorkshire Terrier', 'Boxer', 'Dachshund', 'Pitbull', 'Schnauzer',
    'Cocker Spaniel', 'Pomerania', 'Shih Tzu', 'Border Collie', 'Otro'
  ],
  feline: [
    'Mestizo', 'Siames', 'Persa', 'Maine Coon', 'Bengala',
    'Ragdoll', 'British Shorthair', 'Abisinio', 'Scottish Fold',
    'Sphynx', 'Angora', 'Burmese', 'Otro'
  ],
}

const TOTAL_STEPS = 6

export default function NewPetPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  // Form state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoRetried, setPhotoRetried] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const name = `${firstName} ${lastName}`.trim()
  const [species, setSpecies] = useState<'canine' | 'feline' | ''>('')
  const [breed, setBreed] = useState('')
  const [customBreed, setCustomBreed] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | ''>('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [color, setColor] = useState('')
  const [weight, setWeight] = useState('')
  const [microchip, setMicrochip] = useState('')
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([])
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([])

  const compressToJpeg = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX = 600
          let w = img.naturalWidth, h = img.naturalHeight
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
            else { w = Math.round((w * MAX) / h); h = MAX }
          }
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          } else {
            reject(new Error('Canvas not supported'))
          }
        }
        img.onerror = () => reject(new Error('Image decode failed'))
        img.src = ev.target?.result as string
      }
      reader.onerror = () => reject(new Error('FileReader failed'))
      reader.readAsDataURL(file)
    })
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoRetried(false)

    // Always compress through canvas — guaranteed JPEG output
    // This handles HEIC/HEIF, oversized images, and exotic formats
    try {
      const jpegUrl = await compressToJpeg(file)
      setPhotoPreview(jpegUrl)
    } catch {
      // Last resort fallback: blob URL
      try {
        setPhotoPreview(URL.createObjectURL(file))
      } catch {
        console.error('Photo preview failed completely')
      }
    }
  }

  const handleImgError = () => {
    if (!photoFile || photoRetried) return
    setPhotoRetried(true)
    // If canvas JPEG failed, try raw blob URL
    try {
      setPhotoPreview(URL.createObjectURL(photoFile))
    } catch {
      setPhotoPreview(null)
    }
  }

  const removePhoto = () => {
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoRetried(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleChip = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  const canContinue = () => {
    switch (step) {
      case 1: return firstName.trim().length > 0 && lastName.trim().length > 0
      case 2: return species !== ''
      case 3: return sex !== ''
      case 4: return breed !== '' && dateOfBirth !== '' && color.trim() !== '' && weight !== ''
      case 5: return true // hobbies optional
      case 6: return true // personality optional
      default: return false
    }
  }

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1)
      setStep(step + 1)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)

    try {
      let photo_url = null

      if (photoFile) {
        // Convert to JPEG blob for consistent upload format
        let uploadBlob: Blob = photoFile
        let uploadExt = photoFile.name.split('.').pop() || 'jpg'
        let uploadContentType = photoFile.type || 'image/jpeg'

        try {
          const jpegDataUrl = await compressToJpeg(photoFile)
          const res = await fetch(jpegDataUrl)
          uploadBlob = await res.blob()
          uploadExt = 'jpg'
          uploadContentType = 'image/jpeg'
        } catch {
          // Use original file if compression fails
        }

        const filePath = `${user.id}/${Date.now()}.${uploadExt}`
        const { error: uploadErr } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, uploadBlob, { contentType: uploadContentType, upsert: true })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('pet-photos')
            .getPublicUrl(filePath)
          photo_url = urlData.publicUrl
        }
      }

      const finalBreed = breed === 'Otro' ? customBreed : breed

      const { data: pet, error: petErr } = await supabase
        .from('petid_pets')
        .insert({
          name,
          nickname: nickname.trim() || null,
          species: species || 'canine',
          breed: finalBreed,
          sex: sex || 'male',
          date_of_birth: dateOfBirth || null,
          color: color || null,
          weight_kg: weight ? parseFloat(weight) : null,
          microchip_number: microchip || null,
          photo_url,
          hobbies: selectedHobbies,
          personality_tags: selectedPersonality,
        })
        .select('id')
        .single()

      if (petErr) throw petErr

      const { data: petidUser } = await supabase
        .from('petid_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (pet && petidUser) {
        await supabase.from('petid_pet_owners').insert({
          pet_id: pet.id,
          user_id: petidUser.id,
          is_primary: true
        })
      }

      router.push(`/pet/${pet.id}`)
    } catch (err: any) {
      alert(err.message || 'Error al registrar mascota')
    } finally {
      setSaving(false)
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  }

  const progressWidth = `${(step / TOTAL_STEPS) * 100}%`

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bg }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={step > 1 ? goBack : () => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <ChevronLeft size={20} color={theme.text} />
          </motion.button>
          <span className="text-xs font-semibold" style={{ color: theme.textMuted }}>
            {step} de {TOTAL_STEPS}
          </span>
          {step > 1 ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goNext}
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ color: theme.textMuted }}
            >
              Saltar
            </motion.button>
          ) : <div className="w-10" />}
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: theme.primaryLight }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
            animate={{ width: progressWidth }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-5 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 px-5 pt-4 pb-24 overflow-y-auto"
          >
            {/* Step 1: Name + Photo */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
                    Como se llama tu mascota?
                  </h1>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    Dale un nombre unico a tu nuevo compañero
                  </p>
                </div>

                {/* Large photo upload */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <label className="cursor-pointer block">
                      <div
                        className="w-32 h-32 rounded-[2rem] flex items-center justify-center overflow-hidden"
                        style={{
                          background: photoPreview
                            ? 'transparent'
                            : `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})`,
                          border: photoPreview ? 'none' : `3px dashed ${theme.primary}40`,
                          boxShadow: photoPreview ? `0 8px 30px ${theme.primary}20` : 'none',
                        }}
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt={name || 'Preview'}
                            onError={handleImgError}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center"
                              style={{ background: `${theme.primary}15` }}>
                              <Camera size={24} color={theme.primary} />
                            </div>
                            <span className="text-[10px] font-semibold" style={{ color: theme.primary }}>
                              Agregar foto
                            </span>
                          </div>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    </label>
                    {photoPreview && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
                      >
                        <X size={14} color={theme.textMuted} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {/* Name fields */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                      <label className="text-[10px] font-semibold mb-1.5 block uppercase tracking-wider" style={{ color: theme.textMuted }}>
                        Nombre *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Luna"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        autoFocus
                        className="w-full text-sm font-bold bg-transparent outline-none"
                        style={{ color: theme.text }}
                      />
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                      <label className="text-[10px] font-semibold mb-1.5 block uppercase tracking-wider" style={{ color: theme.textMuted }}>
                        Apellido *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Montenegro"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full text-sm font-bold bg-transparent outline-none"
                        style={{ color: theme.text }}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <label className="text-[10px] font-semibold mb-1.5 block uppercase tracking-wider" style={{ color: theme.textMuted }}>
                      Apodo (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Lunita, Gordito..."
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none"
                      style={{ color: theme.text }}
                    />
                  </div>
                  {name && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-sm mt-2"
                      style={{ color: theme.primary }}
                    >
                      {nickname ? `${name} "${nickname}"` : name} suena increible!
                    </motion.p>
                  )}
                </motion.div>
              </div>
            )}

            {/* Step 2: Species */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
                    {name} es un...
                  </h1>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    Selecciona el tipo de mascota
                  </p>
                </div>

                {/* Decorative header image */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="flex justify-center"
                >
                  <img
                    src="/icons/pets-header.png"
                    alt="Mascotas"
                    className="w-32 h-32 object-contain"
                  />
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'canine', label: 'Perro', emoji: '🐕' },
                    { value: 'feline', label: 'Gato', emoji: '🐈' },
                  ].map(({ value, label, emoji }) => {
                    const selected = species === value
                    return (
                      <motion.button
                        key={value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSpecies(value as any); setBreed('') }}
                        className="rounded-3xl p-6 text-center relative overflow-hidden"
                        style={{
                          background: selected
                            ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                            : theme.bgCard,
                          border: selected ? 'none' : `2px solid ${theme.border}`,
                          boxShadow: selected ? `0 8px 25px ${theme.primary}30` : 'none',
                        }}
                      >
                        <p className="text-3xl mb-2">{emoji}</p>
                        <p className="font-bold text-lg"
                          style={{ color: selected ? '#fff' : theme.text }}>
                          {label}
                        </p>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                          >
                            <Check size={14} color="#fff" />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Sex */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
                    {name} es...
                  </h1>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    Selecciona el sexo de {name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {[
                    { value: 'male', label: 'Macho', color: '#4A90D9' },
                    { value: 'female', label: 'Hembra', color: '#E87DA0' },
                  ].map(({ value, label, color: c }) => {
                    const selected = sex === value
                    return (
                      <motion.button
                        key={value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSex(value as any)}
                        className="rounded-3xl p-6 text-center relative overflow-hidden"
                        style={{
                          background: selected
                            ? `linear-gradient(135deg, ${c}, ${c}CC)`
                            : theme.bgCard,
                          border: selected ? 'none' : `2px solid ${theme.border}`,
                          boxShadow: selected ? `0 8px 25px ${c}30` : 'none',
                        }}
                      >
                        <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl"
                          style={{
                            background: selected ? 'rgba(255,255,255,0.2)' : `${c}15`,
                          }}>
                          <span style={{ color: selected ? '#fff' : c, fontSize: '2rem', lineHeight: 1 }}>
                            {value === 'male' ? '♂' : '♀'}
                          </span>
                        </div>
                        <p className="font-bold text-lg"
                          style={{ color: selected ? '#fff' : theme.text }}>
                          {label}
                        </p>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                          >
                            <Check size={14} color="#fff" />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Breed + Details */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
                    Cuentanos mas de {name}
                  </h1>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    Completa los datos de {name} para su tarjeta
                  </p>
                </div>

                {/* Breed selector */}
                <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: theme.textMuted }}>Raza</label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {(breeds[species || 'canine'] || breeds.canine).map(b => {
                      const selected = breed === b
                      return (
                        <motion.button
                          key={b}
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setBreed(b)}
                          className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                          style={{
                            background: selected
                              ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                              : theme.bg,
                            color: selected ? '#fff' : theme.text,
                            border: `1px solid ${selected ? 'transparent' : theme.border}`,
                          }}
                        >
                          {b}
                        </motion.button>
                      )
                    })}
                  </div>
                  {breed === 'Otro' && (
                    <motion.input
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      type="text"
                      placeholder="Escribe la raza..."
                      value={customBreed}
                      onChange={e => setCustomBreed(e.target.value)}
                      className="w-full mt-3 px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                    />
                  )}
                </div>

                {/* Date + Color row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: theme.textMuted }}>Nacimiento</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none"
                      style={{ color: theme.text }}
                    />
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: theme.textMuted }}>Color</label>
                    <input
                      type="text"
                      placeholder="Ej: Dorado"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none"
                      style={{ color: theme.text }}
                    />
                  </div>
                </div>

                {/* Weight + Microchip row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: theme.textMuted }}>
                      <Weight size={12} /> Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 8.5"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none"
                      style={{ color: theme.text }}
                    />
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: theme.textMuted }}>
                      <Cpu size={12} /> Microchip
                    </label>
                    <input
                      type="text"
                      placeholder="Numero"
                      value={microchip}
                      onChange={e => setMicrochip(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none"
                      style={{ color: theme.text }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Hobbies */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
                    Que le gusta a {name}?
                  </h1>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    Selecciona los hobbies favoritos de {name}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {hobbies.map((h, i) => {
                    const selected = selectedHobbies.includes(h)
                    return (
                      <motion.button
                        key={h}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleChip(h, selectedHobbies, setSelectedHobbies)}
                        className="px-4 py-3 rounded-2xl text-sm font-medium transition-all"
                        style={{
                          background: selected
                            ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                            : theme.bgCard,
                          color: selected ? '#fff' : theme.text,
                          border: `1.5px solid ${selected ? 'transparent' : theme.border}`,
                          boxShadow: selected ? `0 4px 15px ${theme.primary}25` : 'none',
                        }}
                      >
                        {h}
                      </motion.button>
                    )
                  })}
                </div>

                {selectedHobbies.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-center"
                    style={{ color: theme.primary }}
                  >
                    {selectedHobbies.length} hobbie{selectedHobbies.length > 1 ? 's' : ''} seleccionado{selectedHobbies.length > 1 ? 's' : ''}
                  </motion.p>
                )}
              </div>
            )}

            {/* Step 6: Personality */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: theme.text, fontFamily: "'Playfair Display', serif" }}>
                    Como es la personalidad de {name}?
                  </h1>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    Describe como es {name} en su dia a dia
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {personalities.map((p, i) => {
                    const selected = selectedPersonality.includes(p)
                    return (
                      <motion.button
                        key={p}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleChip(p, selectedPersonality, setSelectedPersonality)}
                        className="px-4 py-3 rounded-2xl text-sm font-medium transition-all"
                        style={{
                          background: selected
                            ? `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`
                            : theme.bgCard,
                          color: selected ? '#fff' : theme.text,
                          border: `1.5px solid ${selected ? 'transparent' : theme.border}`,
                          boxShadow: selected ? `0 4px 15px ${theme.accent}25` : 'none',
                        }}
                      >
                        {p}
                      </motion.button>
                    )
                  })}
                </div>

                {selectedPersonality.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-center"
                    style={{ color: theme.accent }}
                  >
                    {name} es {selectedPersonality.join(', ')}
                  </motion.p>
                )}

                {/* Summary preview */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl p-5 mt-4"
                  style={{
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 20px ${theme.primary}08`,
                  }}
                >
                  <p className="text-xs font-semibold mb-3" style={{ color: theme.textMuted }}>
                    Vista previa de la tarjeta
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.bg})` }}>
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt={name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <Camera size={18} color={theme.textMuted} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: theme.text }}>{name || 'Tu mascota'}</p>
                      <p className="text-xs" style={{ color: theme.textMuted }}>
                        {breed && breed !== 'Otro' ? breed : customBreed || (species === 'feline' ? 'Gato' : 'Perro')}
                        {sex === 'male' ? ' - Macho' : sex === 'female' ? ' - Hembra' : ''}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      <div className="px-5 pb-8 pt-3" style={{ background: theme.bg }}>
        {step < TOTAL_STEPS ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goNext}
            disabled={!canContinue()}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30"
            style={{
              background: canContinue()
                ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                : theme.border,
              boxShadow: canContinue() ? `0 8px 25px ${theme.primary}30` : 'none',
            }}
          >
            Continuar <ArrowRight size={18} />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              boxShadow: `0 8px 25px ${theme.primary}30`,
            }}
          >
            {saving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Sparkles size={18} />
                Crear tarjeta de {name}
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  )
}
