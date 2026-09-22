import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMe, login as loginRequest, logout as logoutRequest, updateProfile } from '../services/api/auth'
import type { AuthSession, AuthUser, LoginPayload } from '../types/auth'

export const ACCESS_TOKEN_KEY = 'fincorder_access_token'
export const USER_KEY = 'fincorder_user'
export const AVATAR_KEY = 'fincorder_avatar'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  signIn: (payload: LoginPayload) => Promise<void>
  signInWithSession: (session: AuthSession, email?: string) => void
  saveProfile: (name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) as AuthUser : null
  } catch {
    return null
  }
}

function persistUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)))

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      return
    }

    getMe()
      .then((currentUser) => {
        const nextUser = { ...currentUser, email: user?.email }
        setUser(nextUser)
        persistUser(nextUser)
      })
      .catch(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [user?.email])

  function setSession(session: AuthSession, email?: string) {
    const nextUser = { ...session, email: email ?? session.email }
    localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token)
    persistUser(nextUser)
    setUser(nextUser)
  }

  async function signIn(payload: LoginPayload) {
    setSession(await loginRequest(payload), payload.email)
  }

  async function saveProfile(name: string) {
    const updated = await updateProfile(name)
    const nextUser = { ...updated, email: user?.email }
    persistUser(nextUser)
    setUser(nextUser)
  }

  async function signOut() {
    try {
      if (localStorage.getItem(ACCESS_TOKEN_KEY)) await logoutRequest()
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem('fincorder_active_conversation')
      setUser(null)
    }
  }

  const value = { user, isLoading, signIn, signInWithSession: setSession, saveProfile, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The hook intentionally lives beside its provider so auth state has one public entry point.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
