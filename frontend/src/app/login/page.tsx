'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.replace('/')
  }

  return (
    <main className='auth-page'>
      <div className='auth-card'>
        <h1>Welcome back 👋</h1>
        <p>Sign in to open your ArnoCodes command center.</p>

        <form onSubmit={onSubmit} className='auth-form'>
          <input type='email' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type='submit' className='primary-btn' disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>

        {error && <p className='error'>{error}</p>}
        <p>New here? <Link href='/signup'>Create an account</Link></p>
      </div>
    </main>
  )
}
