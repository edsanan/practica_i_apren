import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true
    let requestCounter = 0

    async function syncAuthState(nextSession) {
      const requestId = ++requestCounter
      const nextUser = nextSession?.user ?? null

      setSession(nextSession)
      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', nextUser.id)
        .single()

      if (!isMounted || requestId !== requestCounter) return

      if (error) {
        console.error('Error fetching user profile:', error.message)
        setProfile(null)
      } else {
        setProfile(data)
      }

      setLoading(false)
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return
      if (error) {
        console.error('Error getting Supabase session:', error.message)
      }
      syncAuthState(data?.session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      syncAuthState(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user,
    profile,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
