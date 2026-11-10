import { useEffect, useRef, useState } from 'react'
import './QuestionAnswer.css'

const FEEDBACK_DELAY_MS = 1500

function getOptionLabel(option) {
  if (typeof option === 'object' && option !== null) {
    return String(option.text ?? option.label ?? option.value ?? '')
  }
  return String(option ?? '')
}

function isOptionCorrect(option, index, correctAnswer) {
  if (typeof option === 'object' && option !== null) {
    if ('isCorrect' in option || 'is_correct' in option) {
      return Boolean(option.isCorrect ?? option.is_correct)
    }
  }

  if (typeof correctAnswer === 'number') {
    return index === correctAnswer
  }

  return getOptionLabel(option) === String(correctAnswer ?? '')
}

export function QuestionAnswer({ question, options = [], correctAnswer, onAnswer }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isSelectedCorrect, setIsSelectedCorrect] = useState(null)
  const startTimeRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    startTimeRef.current = Date.now()
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [question, options])

  function handleOptionClick(option, index) {
    if (selectedIndex !== null) return

    const correct = isOptionCorrect(option, index, correctAnswer)
    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    )

    setSelectedIndex(index)
    setIsSelectedCorrect(correct)

    timerRef.current = setTimeout(() => {
      onAnswer?.(correct, elapsedSeconds)
    }, FEEDBACK_DELAY_MS)
  }

  return (
    <article className="qa-card">
      <h2 className="qa-card__question">{question}</h2>

      <div className="qa-card__options">
        {options.map((option, index) => {
          const label = getOptionLabel(option)
          const optionCorrect = isOptionCorrect(option, index, correctAnswer)
          const isSelected = selectedIndex === index

          let stateClass = ''
          if (selectedIndex !== null) {
            if (isSelected) {
              stateClass = isSelectedCorrect
                ? 'qa-option--correct'
                : 'qa-option--incorrect'
            } else if (!isSelectedCorrect && optionCorrect) {
              stateClass = 'qa-option--correct'
            } else {
              stateClass = 'qa-option--dimmed'
            }
          }

          return (
            <button
              key={`${index}-${label}`}
              type="button"
              className={`qa-option ${stateClass}`.trim()}
              disabled={selectedIndex !== null}
              onClick={() => handleOptionClick(option, index)}
            >
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {selectedIndex !== null && (
        <p
          role="status"
          className={`qa-card__feedback ${
            isSelectedCorrect
              ? 'qa-card__feedback--correct'
              : 'qa-card__feedback--incorrect'
          }`}
        >
          {isSelectedCorrect
            ? 'Molt bé! Resposta correcta! 🎉'
            : 'Vaja, aquesta no era! Ànims per a la següent! 💪'}
        </p>
      )}
    </article>
  )
}
