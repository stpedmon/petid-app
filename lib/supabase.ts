import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time (SSG), env vars may not be available
    // Return a dummy client that will be replaced at runtime
    if (typeof window === 'undefined') {
      return null as unknown as SupabaseClient
    }
    throw new Error('Supabase URL and Anon Key are required')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = getSupabaseClient()
