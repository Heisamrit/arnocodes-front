import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const useMockBackend = process.env.NEXT_PUBLIC_USE_MOCK_BACKEND === 'true'

type MockSession = {
  access_token: string
  user: {
    id: string
    email: string
  }
}

type AuthStateListener = (event: string, session: MockSession | null) => void

function createMockSupabaseClient() {
  let session: MockSession | null = null
  const listeners = new Set<AuthStateListener>()

  const notify = (event: string) => {
    listeners.forEach((listener) => listener(event, session))
  }

  return {
    auth: {
      async getSession() {
        return { data: { session }, error: null }
      },
      async signInWithPassword({ email }: { email: string; password: string }) {
        session = {
          access_token: 'mock-access-token',
          user: { id: 'mock-user-id', email },
        }
        notify('SIGNED_IN')
        return { data: { user: session.user, session }, error: null }
      },
      async signUp({ email }: { email: string; password: string }) {
        session = {
          access_token: 'mock-access-token',
          user: { id: 'mock-user-id', email },
        }
        notify('SIGNED_IN')
        return { data: { user: session.user, session }, error: null }
      },
      async signOut() {
        session = null
        notify('SIGNED_OUT')
        return { error: null }
      },
      onAuthStateChange(callback: AuthStateListener) {
        listeners.add(callback)
        return {
          data: {
            subscription: {
              unsubscribe: () => listeners.delete(callback),
            },
          },
        }
      },
    },
  }
}

if (!useMockBackend && (!supabaseUrl || !supabaseAnonKey)) {
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars are missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = useMockBackend
  ? createMockSupabaseClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
