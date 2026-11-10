import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../services/supabase'
import './AdminDashboard.css'

const STATUS_LABELS = {
  active: { label: 'Actiu', className: 'admin-dashboard__status-badge--active' },
  pending_validation: {
    label: 'Pendent de validació',
    className: 'admin-dashboard__status-badge--pending',
  },
  inactive: { label: 'Inactiu', className: 'admin-dashboard__status-badge--inactive' },
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase && user?.id))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase || !user?.id) {
      return undefined
    }

    let isMounted = true

    async function fetchAssignedStudents() {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false })

      if (!isMounted) return

      if (fetchError) {
        console.error('Error fetching assigned students:', fetchError.message)
        setError("No s'ha pogut carregar la llista d'alumnes assignats.")
        setLoading(false)
        return
      }

      setStudents(data ?? [])
      setLoading(false)
    }

    fetchAssignedStudents()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  return (
    <main className="admin-dashboard">
      <div className="admin-dashboard__container">
        <header className="admin-dashboard__header">
          <div>
            <h1 className="admin-dashboard__title">Panell de Família</h1>
            <p className="admin-dashboard__subtitle">
              Benvingut/da{user?.email ? `, ${user.email}` : ''}. Gestiona i supervisa el
              progrés dels teus alumnes.
            </p>
          </div>
          <div className="admin-dashboard__header-actions">
            <Link
              to="/admin/exercicis"
              className="admin-dashboard__btn admin-dashboard__btn--primary admin-dashboard__link-btn"
            >
              Crear exercicis
            </Link>
            <button
              type="button"
              className="admin-dashboard__logout"
              onClick={handleSignOut}
            >
              Tancar sessió
            </button>
          </div>
        </header>

        <section className="admin-dashboard__panel" aria-labelledby="students-list-heading">
          <div className="admin-dashboard__panel-header">
            <h2 id="students-list-heading" className="admin-dashboard__section-title">
              Alumnes assignats
            </h2>
          </div>

          {loading ? (
            <p className="admin-dashboard__message">Carregant alumnes...</p>
          ) : error ? (
            <p className="admin-dashboard__error" role="alert">
              {error}
            </p>
          ) : students.length === 0 ? (
            <div className="admin-dashboard__empty">
              <p className="admin-dashboard__empty-text">
                Encara no tens cap alumne vinculat al teu compte.
              </p>
              <button
                type="button"
                className="admin-dashboard__btn admin-dashboard__btn--primary"
              >
                Vincular nou alumne
              </button>
            </div>
          ) : (
            <div className="admin-dashboard__table-wrapper">
              <table className="admin-dashboard__table">
                <thead>
                  <tr>
                    <th>Alumne</th>
                    <th>Estat</th>
                    <th className="admin-dashboard__actions-cell">Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const displayName =
                      student.full_name || student.name || student.email || student.id
                    const statusInfo = STATUS_LABELS[student.status] ?? {
                      label: student.status || 'Desconegut',
                      className: 'admin-dashboard__status-badge--inactive',
                    }

                    return (
                      <tr key={student.id}>
                        <td>{displayName}</td>
                        <td>
                          <span
                            className={`admin-dashboard__status-badge ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="admin-dashboard__actions-cell">
                          <button
                            type="button"
                            className="admin-dashboard__btn admin-dashboard__btn--secondary"
                          >
                            Veure progrés
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
