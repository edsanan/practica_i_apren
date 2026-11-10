import { useState } from 'react'
import { supabase } from '../../services/supabase'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!supabase) {
      setError('El servei de Supabase no està configurat.')
      return
    }

    setSubmitting(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: 'admin',
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      setSuccessMessage(
        'El teu compte ha sigut creat i està a l’espera de ser validat pel superadmin.'
      )
      setEmail('')
      setPassword('')
    } catch {
      setError("S'ha produït un error inesperat en crear el compte.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="register-email">Correu electrònic</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="register-password">Contrasenya</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error && <p role="alert">{error}</p>}
      {successMessage && <p role="status">{successMessage}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Registrant...' : 'Crear compte'}
      </button>
    </form>
  )
}
