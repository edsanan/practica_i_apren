import { useNavigate } from 'react-router-dom'
import './SubjectCard.css'

const SUBJECT_THEMES = {
  math: {
    label: 'Matemàtiques',
    icon: '🧮',
    variant: 'math',
  },
  valencian: {
    label: 'Valencià',
    icon: '📚',
    variant: 'valencian',
  },
  spanish: {
    label: 'Llengua Castellana',
    icon: '✏️',
    variant: 'spanish',
  },
  english: {
    label: 'Anglés',
    icon: '🌍',
    variant: 'english',
  },
  science: {
    label: 'Coneixement del Medi',
    icon: '🔬',
    variant: 'science',
  },
}

export function SubjectCard({ id, name, score = 0, currentStreak = 0 }) {
  const navigate = useNavigate()
  const normalizedKey = String(name ?? '').trim().toLowerCase()
  const theme = SUBJECT_THEMES[normalizedKey] ?? {
    label: name || 'Assignatura',
    icon: '🎯',
    variant: 'default',
  }

  function handleClick() {
    navigate(`/estudiant/assignatura/${id}`)
  }

  return (
    <button
      type="button"
      className={`subject-card subject-card--${theme.variant}`}
      onClick={handleClick}
    >
      <div className="subject-card__header">
        <span className="subject-card__icon" aria-hidden="true">
          {theme.icon}
        </span>
        <span className="subject-card__score-badge">
          <span aria-hidden="true">⭐</span>
          <span>{score} pts</span>
        </span>
      </div>

      <div className="subject-card__body">
        <h2 className="subject-card__title">{theme.label}</h2>
        <p className="subject-card__subtitle">Toca per a practicar i sumar punts</p>
      </div>

      <div className="subject-card__footer">
        <span className="subject-card__streak">
          {currentStreak > 0 ? `🔥 Ratxa: ${currentStreak}` : '🚀 A per totes!'}
        </span>
        <span className="subject-card__cta" aria-hidden="true">
          Jugar →
        </span>
      </div>
    </button>
  )
}
