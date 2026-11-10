import { useEffect, useState } from 'react'
import { SubjectCard } from '../components/student/SubjectCard'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../services/supabase'
import './StudentDashboard.css'

export function StudentDashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [scoresBySubject, setScoresBySubject] = useState({})
  const [totalScore, setTotalScore] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [loading, setLoading] = useState(Boolean(supabase && user?.id))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase || !user?.id) {
      return undefined
    }

    let isMounted = true

    async function fetchDashboardData() {
      const [subjectsResult, scoresResult] = await Promise.all([
        supabase
          .from('subjects')
          .select('id, name')
          .order('id', { ascending: true }),
        supabase
          .from('student_scores')
          .select('subject_id, total_score, current_streak, best_streak')
          .eq('student_id', user.id),
      ])

      if (!isMounted) return

      if (subjectsResult.error || scoresResult.error) {
        console.error(
          'Error loading student dashboard:',
          subjectsResult.error?.message || scoresResult.error?.message
        )
        setError("No s'han pogut carregar les assignatures i puntuacions.")
        setLoading(false)
        return
      }

      const subjectList = subjectsResult.data ?? []
      const scoreList = scoresResult.data ?? []

      const mappedScores = {}
      let accumulatedScore = 0
      let highestStreak = 0

      for (const entry of scoreList) {
        mappedScores[entry.subject_id] = entry
        accumulatedScore += entry.total_score ?? 0
        if ((entry.best_streak ?? 0) > highestStreak) {
          highestStreak = entry.best_streak
        }
      }

      setSubjects(subjectList)
      setScoresBySubject(mappedScores)
      setTotalScore(accumulatedScore)
      setBestStreak(highestStreak)
      setLoading(false)
    }

    fetchDashboardData()

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
    <main className="student-dashboard">
      <div className="student-dashboard__container">
        <header className="student-dashboard__topbar">
          <div>
            <h1 className="student-dashboard__greeting">Hola, campió o campiona!</h1>
            <p className="student-dashboard__intro">
              Tria una assignatura per a continuar jugant i aprenent.
            </p>
          </div>
          <button
            type="button"
            className="student-dashboard__logout"
            onClick={handleSignOut}
          >
            Eixir
          </button>
        </header>

        <section className="student-scoreboard" aria-label="Marcador global">
          <div className="student-scoreboard__stat">
            <span className="student-scoreboard__emoji" aria-hidden="true">
              🏆
            </span>
            <div>
              <span className="student-scoreboard__label">Puntuació total</span>
              <span className="student-scoreboard__value">{totalScore} punts</span>
            </div>
          </div>

          <div className="student-scoreboard__stat">
            <span className="student-scoreboard__emoji" aria-hidden="true">
              🔥
            </span>
            <div>
              <span className="student-scoreboard__label">Millor ratxa</span>
              <span className="student-scoreboard__value">{bestStreak} encerts</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="subjects-heading">
          <h2 id="subjects-heading" className="student-dashboard__section-title">
            Les teues assignatures
          </h2>

          {loading ? (
            <p className="student-dashboard__status">Carregant el teu tauler...</p>
          ) : error ? (
            <p
              className="student-dashboard__status student-dashboard__status--error"
              role="alert"
            >
              {error}
            </p>
          ) : subjects.length === 0 ? (
            <p className="student-dashboard__status">
              Encara no hi ha assignatures disponibles.
            </p>
          ) : (
            <div className="student-subjects-grid">
              {subjects.map((subject) => {
                const subjectScore = scoresBySubject[subject.id]
                return (
                  <SubjectCard
                    key={subject.id}
                    id={subject.id}
                    name={subject.name}
                    score={subjectScore?.total_score ?? 0}
                    currentStreak={subjectScore?.current_streak ?? 0}
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
