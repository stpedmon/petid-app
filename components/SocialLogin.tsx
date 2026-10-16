'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Provider = 'google' | 'apple' | 'azure'

const providers: { id: Provider; label: string; icon: JSX.Element }[] = [
  {
    id: 'google',
    label: 'Google',
    icon: (
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.1z"/>
        <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/>
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="#1F1F1F">
        <path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3-.1 1.7-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.2-1.2 3-2.5.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.7-1-2.7-4zM13.9 5.3c.7-.8 1.2-2 1-3.2-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.9-1.3z"/>
      </svg>
    ),
  },
  {
    id: 'azure',
    label: 'Microsoft',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022"/>
        <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00"/>
        <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF"/>
        <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900"/>
      </svg>
    ),
  },
]

export default function SocialLogin({ onError }: { onError?: (msg: string) => void }) {
  const [busy, setBusy] = useState<Provider | null>(null)

  const signIn = async (provider: Provider) => {
    setBusy(provider)
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        // Microsoft: cuentas personales (Hotmail/Outlook/Live) y de trabajo
        ...(provider === 'azure'
          ? { scopes: 'openid email profile', queryParams: { prompt: 'select_account' } }
          : {}),
        ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    })
    if (error) {
      setBusy(null)
      onError?.('No pudimos conectar con ' + providers.find(p => p.id === provider)?.label + '. Intenta de nuevo.')
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: '#E8E0D4' }} />
        <span className="text-xs font-medium" style={{ color: '#9A948C' }}>o continúa con</span>
        <div className="flex-1 h-px" style={{ background: '#E8E0D4' }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {providers.map(p => (
          <motion.button
            key={p.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={busy !== null}
            onClick={() => signIn(p.id)}
            aria-label={`Continuar con ${p.label}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: '#FFFFFF', border: '1px solid #E8E0D4', color: '#1F1F1F' }}
          >
            {busy === p.id ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 rounded-full border-2"
                style={{ borderColor: '#FF6B6B', borderTopColor: 'transparent' }}
              />
            ) : (
              <>
                {p.icon}
                <span className="hidden sm:inline">{p.label}</span>
              </>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
