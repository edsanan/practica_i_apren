import { Link } from 'react-router-dom'

export function Home() {
  return (
    <main>
      <h1>Practica i Aprén</h1>
      <p>Plataforma educativa de reforç per a 4t de Primària.</p>
      <nav>
        <Link to="/login">Iniciar sessió</Link>
        {' · '}
        <Link to="/registre">Registre per a pares</Link>
      </nav>
    </main>
  )
}
