import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const ROLE_ROUTES = {
  student: '/estudiant/dashboard',
  admin: '/admin/dashboard',
  superadmin: '/superadmin/dashboard',
}

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('El servei de Supabase no està configurat.')
      return
    }

    setSubmitting(true)

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (authError) {
        setError(authError.message)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profileData) {
        setError("No s'ha pogut carregar el perfil de l'usuari.")
        return
      }

      const targetRoute = ROLE_ROUTES[profileData.role] ?? '/'
      navigate(targetRoute, { replace: true })
    } catch {
      setError("S'ha produït un error inesperat en iniciar sessió.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="login-email">Correu electrònic</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="login-password">Contrasenya</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Accedint...' : 'Entrar'}
      </button>
    </form>
  )
}
