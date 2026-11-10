import { Link } from 'react-router-dom'
import { LoginForm } from '../features/auth/LoginForm'

export function Login() {
  return (
    <main>
      <h1>Iniciar sessió</h1>
      <p>Accedeix amb el teu correu electrònic i contrasenya.</p>

      <LoginForm />

      <p>
        No tens compte de pare o mare? <Link to="/registre">Registra&apos;t ací</Link>
      </p>
      <p>
        <Link to="/">Tornar a l&apos;inici</Link>
      </p>
    </main>
  )
}
