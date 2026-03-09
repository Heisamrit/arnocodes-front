'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    router.replace('/')
  }

  return (
    <main className='auth-page'>
      <div className='auth-card'>
        <h1>Create account ✨</h1>
        <p>Start your journey with a beautiful, endpoint-ready dashboard.</p>

        <form onSubmit={onSubmit} className='auth-form'>
          <input type='email' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type='submit' className='primary-btn' disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>

        {error && <p className='error'>{error}</p>}
        <p>Already a member? <Link href='/login'>Sign in</Link></p>
      </div>
    </main>
  )
}
