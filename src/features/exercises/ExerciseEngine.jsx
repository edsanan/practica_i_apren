import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../services/supabase'
import { FillInTheBlanks } from './FillInTheBlanks'
import { MatchConcepts } from './MatchConcepts'
import { QuestionAnswer } from './QuestionAnswer'
import './ExerciseEngine.css'

const POINTS_PER_CORRECT = 10

export function ExerciseEngine({ topic_id }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exercises, setExercises] = useState([])
  const [topicName, setTopicName] = useState('')
  const [subjectId, setSubjectId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [loading, setLoading] = useState(Boolean(supabase && topic_id))
  const [error, setError] = useState('')
  const scoreQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    if (!supabase || !topic_id) {
      return undefined
    }

    let isMounted = true

    async function loadTopicExercises() {
      const [topicResult, exercisesResult] = await Promise.all([
        supabase
          .from('topics')
          .select('id, name, subject_id')
          .eq('id', topic_id)
          .single(),
        supabase
          .from('exercises')
          .select('*')
          .eq('topic_id', topic_id)
          .eq('status', 'active')
          .order('id', { ascending: true }),
      ])

      if (!isMounted) return

      if (exercisesResult.error) {
        console.error('Error loading exercises:', exercisesResult.error.message)
        setError("No s'han pogut carregar els exercicis d'aquest bloc.")
        setLoading(false)
        return
      }

      if (topicResult.data) {
        setTopicName(topicResult.data.name ?? '')
        setSubjectId(topicResult.data.subject_id ?? null)
      }

      setExercises(exercisesResult.data ?? [])
      setCurrentIndex(0)
      setCorrectCount(0)
      setEarnedPoints(0)
      setLoading(false)
    }

    loadTopicExercises()

    return () => {
      isMounted = false
    }
  }, [topic_id])

  async function persistMetric(exerciseId, isCorrect, timeSpent) {
    if (!supabase || !user?.id) return

    const { error: insertError } = await supabase.from('metrics').insert({
      student_id: user.id,
      exercise_id: exerciseId,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
    })

    if (insertError) {
      console.error('Error inserting exercise metric:', insertError.message)
    }
  }

  async function persistStudentScore(isCorrect) {
    if (!supabase || !user?.id || !subjectId) return

    const { data: existingScore, error: fetchScoreError } = await supabase
      .from('student_scores')
      .select('total_score, current_streak, best_streak')
      .eq('student_id', user.id)
      .eq('subject_id', subjectId)
      .maybeSingle()

    if (fetchScoreError) {
      console.error('Error reading student score:', fetchScoreError.message)
      return
    }

    const previousTotal = existingScore?.total_score ?? 0
    const previousStreak = existingScore?.current_streak ?? 0
    const previousBest = existingScore?.best_streak ?? 0

    const nextTotal = isCorrect ? previousTotal + POINTS_PER_CORRECT : previousTotal
    const nextStreak = isCorrect ? previousStreak + 1 : 0
    const nextBest = Math.max(previousBest, nextStreak)

    const { error: upsertError } = await supabase.from('student_scores').upsert(
      {
        student_id: user.id,
        subject_id: subjectId,
        total_score: nextTotal,
        current_streak: nextStreak,
        best_streak: nextBest,
      },
      { onConflict: 'student_id,subject_id' }
    )

    if (upsertError) {
      console.error('Error updating student score:', upsertError.message)
    }
  }

  function handleAnswer(isCorrect, timeSpent) {
    const answeredExercise = exercises[currentIndex]
    if (!answeredExercise) return

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1)
      setEarnedPoints((prev) => prev + POINTS_PER_CORRECT)
    }

    setCurrentIndex((prev) => prev + 1)

    void persistMetric(answeredExercise.id, isCorrect, timeSpent)
    scoreQueueRef.current = scoreQueueRef.current
      .then(() => persistStudentScore(isCorrect))
      .catch((err) => {
        console.error('Unexpected error updating score:', err)
      })
  }

  if (loading) {
    return <p className="exercise-engine__status">Preparant els exercicis...</p>
  }

  if (error) {
    return (
      <div className="exercise-engine">
        <p className="exercise-engine__status exercise-engine__status--error" role="alert">
          {error}
        </p>
        <button
          type="button"
          className="exercise-engine__dashboard-btn"
          onClick={() => navigate('/estudiant/dashboard')}
        >
          Tornar al Dashboard
        </button>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <section className="exercise-engine__card">
        <span className="exercise-engine__trophy" aria-hidden="true">
          📚
        </span>
        <h1 className="exercise-engine__title">Encara no hi ha exercicis</h1>
        <p className="exercise-engine__summary">
          Aquest bloc encara no té exercicis actius disponibles.
        </p>
        <button
          type="button"
          className="exercise-engine__dashboard-btn"
          onClick={() => navigate('/estudiant/dashboard')}
        >
          Tornar al Dashboard
        </button>
      </section>
    )
  }

  if (currentIndex >= exercises.length) {
    return (
      <section className="exercise-engine__card">
        <span className="exercise-engine__trophy" aria-hidden="true">
          🏆
        </span>
        <h1 className="exercise-engine__title">Repàs completat!</h1>
        <p className="exercise-engine__summary">
          Has acabat tots els exercicis{topicName ? ` de ${topicName}` : ''}. Bona faena!
        </p>

        <div className="exercise-engine__stats">
          <span className="exercise-engine__stat-pill">
            ✅ {correctCount} / {exercises.length} encerts
          </span>
          <span className="exercise-engine__stat-pill">⭐ +{earnedPoints} punts</span>
        </div>

        <button
          type="button"
          className="exercise-engine__dashboard-btn"
          onClick={() => navigate('/estudiant/dashboard')}
        >
          Tornar al Dashboard
        </button>
      </section>
    )
  }

  const currentExercise = exercises[currentIndex]
  const content = currentExercise.content ?? {}
  const progressPercentage = Math.round(((currentIndex + 1) / exercises.length) * 100)

  function renderExercise() {
    switch (currentExercise.type) {
      case 'qa': {
        const questionText =
          content.question ??
          content.prompt ??
          content.statement ??
          content.enunciat ??
          ''
        const options = Array.isArray(content.options) ? content.options : []
        const correctAnswer =
          content.correctOption ??
          content.correct_option ??
          content.correctAnswer ??
          content.correct_answer ??
          content.answer ??
          content.correctIndex ??
          content.correct_index

        return (
          <QuestionAnswer
            key={currentExercise.id}
            question={questionText}
            options={options}
            correctAnswer={correctAnswer}
            onAnswer={handleAnswer}
          />
        )
      }

      case 'match': {
        const pairs = Array.isArray(content.pairs) ? content.pairs : []
        const instruction =
          content.instruction ??
          content.question ??
          content.prompt ??
          'Relaciona cada element de la columna esquerra amb el de la dreta!'

        return (
          <MatchConcepts
            key={currentExercise.id}
            pairs={pairs}
            instruction={instruction}
            onAnswer={handleAnswer}
          />
        )
      }

      case 'fill_blanks': {
        const sentence = content.sentence ?? content.text ?? content.question ?? ''
        const options = Array.isArray(content.options) ? content.options : []
        const correctOption =
          content.correctOption ??
          content.correct_option ??
          content.correctAnswer ??
          content.correct_answer ??
          content.answer ??
          ''

        return (
          <FillInTheBlanks
            key={currentExercise.id}
            sentence={sentence}
            options={options}
            correctOption={correctOption}
            onAnswer={handleAnswer}
          />
        )
      }

      default:
        return (
          <section className="exercise-engine__card">
            <p className="exercise-engine__summary">
              Aquest tipus d&apos;exercici ({currentExercise.type}) no és compatible.
            </p>
            <button
              type="button"
              className="exercise-engine__dashboard-btn"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
            >
              Següent pregunta
            </button>
          </section>
        )
    }
  }

  return (
    <div className="exercise-engine">
      <div className="exercise-engine__progress-wrap">
        <div className="exercise-engine__progress-meta">
          <span>{topicName || 'Repàs'}</span>
          <span>
            Pregunta {currentIndex + 1} de {exercises.length}
          </span>
        </div>
        <div
          className="exercise-engine__progress-track"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={exercises.length}
        >
          <div
            className="exercise-engine__progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {renderExercise()}
    </div>
  )
}
