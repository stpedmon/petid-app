import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Garantiza que exista la fila en petid_users para el usuario autenticado.
 * Necesario para inicios de sesión con Google / Apple / Microsoft, donde no
 * pasamos por el formulario de registro.
 */
export async function ensureProfile(user: User) {
  const { data: existing } = await supabase
    .from('petid_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (existing) return

  const meta = (user.user_metadata || {}) as Record<string, any>
  const fullName: string =
    meta.name ||
    meta.full_name ||
    [meta.given_name, meta.family_name].filter(Boolean).join(' ') ||
    (user.email ? user.email.split('@')[0] : 'Usuario')

  await supabase.from('petid_users').upsert(
    {
      id: user.id,
      full_name: fullName,
      email: user.email || '',
      phone: meta.phone || null,
      country: meta.country || null,
      sex: meta.sex === 'male' || meta.sex === 'female' ? meta.sex : null,
      avatar_url: meta.avatar_url || meta.picture || null,
      role: 'owner',
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )
}
