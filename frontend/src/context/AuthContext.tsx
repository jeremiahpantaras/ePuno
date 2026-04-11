import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { auth } from '../services/firebase'
import { logout as authLogout } from '../services/authService'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthContext - Setting up auth state listener')
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('AuthContext - Auth state changed:', user ? 'User logged in' : 'No user')
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await authLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthContext must be used within AuthContextProvider')
  return context
}