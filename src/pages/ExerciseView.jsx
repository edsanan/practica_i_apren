import { useNavigate, useParams } from 'react-router-dom'
import { ExerciseEngine } from '../features/exercises/ExerciseEngine'
import './ExerciseView.css'

export function ExerciseView() {
  const { id_topic } = useParams()
  const navigate = useNavigate()
  const numericTopicId = Number(id_topic)
  const topicId = Number.isNaN(numericTopicId) ? id_topic : numericTopicId

  return (
    <main className="exercise-view">
      <div className="exercise-view__header">
        <button
          type="button"
          className="exercise-view__exit-btn"
          onClick={() => navigate('/estudiant/dashboard')}
        >
          Eixir del repàs
        </button>
      </div>

      <div className="exercise-view__content">
        <ExerciseEngine topic_id={topicId} />
      </div>
    </main>
  )
}
