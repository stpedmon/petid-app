import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Handle PKCE code exchange (magic link / OAuth)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // Handle token hash (email confirmation link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      // Email confirmed — redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard?confirmed=1', origin))
    }
    // Token invalid or expired
    return NextResponse.redirect(new URL('/login?error=token_expired', origin))
  }

  return NextResponse.redirect(new URL('/login', origin))
}
