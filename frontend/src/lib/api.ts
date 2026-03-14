import { supabase } from '@/lib/supabase'
import { mockApiFetch } from '@/lib/mockBackend'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

const useMockBackend = process.env.NEXT_PUBLIC_USE_MOCK_BACKEND === 'true'

export async function apiFetch(path: string, init: RequestInit = {}) {
  if (useMockBackend) {
    return mockApiFetch(path, init)
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('unauthenticated')
  }

  const headers = new Headers(init.headers ?? {})
  headers.set('Authorization', `Bearer ${session.access_token}`)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })
}
