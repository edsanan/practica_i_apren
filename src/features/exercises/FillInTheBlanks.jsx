import { useEffect, useRef, useState } from 'react'
import './FillInTheBlanks.css'

const FEEDBACK_DELAY_MS = 1500
const BLANK_PATTERN = /_{2,}/

export function FillInTheBlanks({
  sentence = '',
  options = [],
  correctOption = '',
  onAnswer,
}) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null)

  const startTimeRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    startTimeRef.current = Date.now()
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [sentence, options])

  function handleOptionClick(option) {
    if (selectedOption !== null) return

    const isCorrect = String(option) === String(correctOption)
    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    )

    setSelectedOption(option)
    setIsCorrectAnswer(isCorrect)

    timerRef.current = setTimeout(() => {
      onAnswer?.(isCorrect, elapsedSeconds)
    }, FEEDBACK_DELAY_MS)
  }

  const parts = String(sentence).split(BLANK_PATTERN)
  const hasBlank = parts.length > 1

  const slotStateClass =
    selectedOption === null
      ? ''
      : isCorrectAnswer
        ? 'fill-blanks-slot--filled fill-blanks-slot--correct'
        : 'fill-blanks-slot--filled fill-blanks-slot--incorrect'

  return (
    <article className="fill-blanks-card">
      <p className="fill-blanks-card__sentence">
        {hasBlank ? (
          <>
            {parts[0]}
            <span className={`fill-blanks-slot ${slotStateClass}`.trim()}>
              {selectedOption ?? '_____'}
            </span>
            {parts.slice(1).join('___')}
          </>
        ) : (
          <>
            {sentence}{' '}
            <span className={`fill-blanks-slot ${slotStateClass}`.trim()}>
              {selectedOption ?? '_____'}
            </span>
          </>
        )}
      </p>

      <div className="fill-blanks-card__options">
        {options.map((option, index) => {
          const isSelected = selectedOption === option
          let optionClass = ''

          if (selectedOption !== null) {
            if (isSelected) {
              optionClass = isCorrectAnswer
                ? 'fill-blanks-option--correct'
                : 'fill-blanks-option--incorrect'
            } else {
              optionClass = 'fill-blanks-option--dimmed'
            }
          }

          return (
            <button
              key={`${index}-${option}`}
              type="button"
              className={`fill-blanks-option ${optionClass}`.trim()}
              disabled={selectedOption !== null}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </button>
          )
        })}
      </div>

      {selectedOption !== null && (
        <p
          role="status"
          className={`fill-blanks-card__feedback ${
            isCorrectAnswer
              ? 'fill-blanks-card__feedback--correct'
              : 'fill-blanks-card__feedback--incorrect'
          }`}
        >
          {isCorrectAnswer
            ? 'Molt bé! Has completat la frase perfectament! 🎉'
            : `Quasi! La resposta correcta era "${correctOption}". 💪`}
        </p>
      )}
    </article>
  )
}
