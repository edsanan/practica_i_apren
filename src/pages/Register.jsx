import { Link } from 'react-router-dom'
import { RegisterForm } from '../features/auth/RegisterForm'

export function Register() {
  return (
    <main>
      <h1>Registre per a pares</h1>
      <p>Crea un compte d&apos;administrador familiar per a gestionar els teus estudiants.</p>

      <RegisterForm />

      <p>
        Ja tens compte? <Link to="/login">Inicia sessió</Link>
      </p>
      <p>
        <Link to="/">Tornar a l&apos;inici</Link>
      </p>
    </main>
  )
}
