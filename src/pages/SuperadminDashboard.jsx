import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import './SuperadminDashboard.css'

const ROLE_LABELS = {
  student: 'Estudiant',
  admin: 'Admin (Pare/Mare)',
  superadmin: 'Superadmin',
}

const SUBJECT_LABELS = {
  math: 'Matemàtiques',
  valencian: 'Valencià',
  spanish: 'Llengua Castellana',
  english: 'Anglés',
  science: 'Coneixement del Medi',
}

const TYPE_LABELS = {
  qa: 'Pregunta i respostes (qa)',
  match: 'Enllaçar conceptes (match)',
  fill_blanks: 'Completar frases (fill_blanks)',
}

function formatSubjectName(rawName) {
  const key = String(rawName ?? '').trim().toLowerCase()
  return SUBJECT_LABELS[key] ?? rawName ?? 'Sense assignatura'
}

export function SuperadminDashboard() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [pendingExercises, setPendingExercises] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyKey, setBusyKey] = useState('')

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    async function loadPendingValidations() {
      const [usersResult, exercisesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('status', 'pending_validation')
          .order('created_at', { ascending: true }),
        supabase
          .from('exercises')
          .select(
            'id, type, content, status, created_at, topics ( id, name, subjects ( id, name ) )'
          )
          .eq('status', 'pending_validation')
          .order('created_at', { ascending: true }),
      ])

      if (!isMounted) return

      if (usersResult.error || exercisesResult.error) {
        console.error(
          'Error loading pending validations:',
          usersResult.error?.message || exercisesResult.error?.message
        )
        setError("No s'han pogut carregar les validacions pendents.")
        setLoading(false)
        return
      }

      setPendingUsers(usersResult.data ?? [])
      setPendingExercises(exercisesResult.data ?? [])
      setLoading(false)
    }

    loadPendingValidations()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleActivateUser(userId) {
    if (!supabase) return
    setActionError('')
    setBusyKey(`user-${userId}`)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', userId)

    setBusyKey('')

    if (updateError) {
      setActionError(`No s'ha pogut activar l'usuari: ${updateError.message}`)
      return
    }

    setPendingUsers((prev) => prev.filter((item) => item.id !== userId))
  }

  async function handleExerciseDecision(exerciseId, nextStatus) {
    if (!supabase) return
    setActionError('')
    setBusyKey(`exercise-${exerciseId}`)

    const { error: updateError } = await supabase
      .from('exercises')
      .update({ status: nextStatus })
      .eq('id', exerciseId)

    setBusyKey('')

    if (updateError) {
      setActionError(`No s'ha pogut actualitzar l'exercici: ${updateError.message}`)
      return
    }

    setPendingExercises((prev) => prev.filter((item) => item.id !== exerciseId))
  }

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  return (
    <main className="superadmin-dashboard">
      <div className="superadmin-dashboard__container">
        <header className="superadmin-dashboard__header">
          <div>
            <h1 className="superadmin-dashboard__title">Panell de Superadmin</h1>
            <p className="superadmin-dashboard__subtitle">
              Revisa i valida nous comptes i exercicis pendents d&apos;aprovació.
            </p>
          </div>
          <button
            type="button"
            className="superadmin-dashboard__logout"
            onClick={handleSignOut}
          >
            Tancar sessió
          </button>
        </header>

        {error && (
          <p className="superadmin-dashboard__error" role="alert">
            {error}
          </p>
        )}

        {actionError && (
          <p className="superadmin-dashboard__error" role="alert">
            {actionError}
          </p>
        )}

        <section
          className="superadmin-dashboard__panel"
          aria-labelledby="pending-users-heading"
        >
          <div className="superadmin-dashboard__panel-header">
            <h2
              id="pending-users-heading"
              className="superadmin-dashboard__section-title"
            >
              Usuaris pendents d&apos;aprovació
            </h2>
            <span className="superadmin-dashboard__count">{pendingUsers.length}</span>
          </div>

          {loading ? (
            <p className="superadmin-dashboard__message">Carregant usuaris...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="superadmin-dashboard__message">
              No hi ha cap usuari pendent d&apos;aprovació.
            </p>
          ) : (
            <div className="superadmin-dashboard__table-wrapper">
              <table className="superadmin-dashboard__table">
                <thead>
                  <tr>
                    <th>Usuari</th>
                    <th>Rol</th>
                    <th className="superadmin-dashboard__actions-cell">Acció</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((pendingUser) => {
                    const displayLabel =
                      pendingUser.full_name ||
                      pendingUser.name ||
                      pendingUser.email ||
                      pendingUser.id
                    const isBusy = busyKey === `user-${pendingUser.id}`

                    return (
                      <tr key={pendingUser.id}>
                        <td>{displayLabel}</td>
                        <td>
                          <span className="superadmin-dashboard__role-badge">
                            {ROLE_LABELS[pendingUser.role] ?? pendingUser.role}
                          </span>
                        </td>
                        <td className="superadmin-dashboard__actions-cell">
                          <button
                            type="button"
                            className="superadmin-dashboard__btn superadmin-dashboard__btn--approve"
                            disabled={isBusy}
                            onClick={() => handleActivateUser(pendingUser.id)}
                          >
                            {isBusy ? 'Activant...' : 'Activar'}
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

        <section
          className="superadmin-dashboard__panel"
          aria-labelledby="pending-exercises-heading"
        >
          <div className="superadmin-dashboard__panel-header">
            <h2
              id="pending-exercises-heading"
              className="superadmin-dashboard__section-title"
            >
              Exercicis pendents de validació
            </h2>
            <span className="superadmin-dashboard__count">{pendingExercises.length}</span>
          </div>

          {loading ? (
            <p className="superadmin-dashboard__message">Carregant exercicis...</p>
          ) : pendingExercises.length === 0 ? (
            <p className="superadmin-dashboard__message">
              No hi ha cap exercici pendent de validació.
            </p>
          ) : (
            <div className="superadmin-dashboard__exercises-list">
              {pendingExercises.map((exercise) => {
                const subjectName = formatSubjectName(exercise.topics?.subjects?.name)
                const topicName = exercise.topics?.name ?? 'Sense tema'
                const typeLabel = TYPE_LABELS[exercise.type] ?? exercise.type
                const isBusy = busyKey === `exercise-${exercise.id}`

                return (
                  <article key={exercise.id} className="superadmin-exercise-item">
                    <div className="superadmin-exercise-item__meta">
                      <div className="superadmin-exercise-item__tags">
                        <span className="superadmin-exercise-item__tag">
                          {subjectName}
                        </span>
                        <span className="superadmin-exercise-item__tag">{topicName}</span>
                        <span className="superadmin-exercise-item__tag">{typeLabel}</span>
                      </div>
                    </div>

                    <pre className="superadmin-exercise-item__preview">
                      {JSON.stringify(exercise.content, null, 2)}
                    </pre>

                    <div className="superadmin-exercise-item__actions">
                      <button
                        type="button"
                        className="superadmin-dashboard__btn superadmin-dashboard__btn--reject"
                        disabled={isBusy}
                        onClick={() => handleExerciseDecision(exercise.id, 'inactive')}
                      >
                        Rebutjar
                      </button>
                      <button
                        type="button"
                        className="superadmin-dashboard__btn superadmin-dashboard__btn--approve"
                        disabled={isBusy}
                        onClick={() => handleExerciseDecision(exercise.id, 'active')}
                      >
                        Aprovar
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
