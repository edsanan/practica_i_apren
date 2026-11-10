import { useEffect, useRef, useState } from 'react'
import './MatchConcepts.css'

const ERROR_FLASH_MS = 500
const COMPLETE_DELAY_MS = 600

function shuffleItems(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function MatchConcepts({
  pairs = [],
  instruction = 'Relaciona cada element de la columna esquerra amb el de la dreta!',
  onAnswer,
}) {
  const [leftItems] = useState(() =>
    shuffleItems(pairs.map((pair, index) => ({ id: index, text: pair.left })))
  )
  const [rightItems] = useState(() =>
    shuffleItems(pairs.map((pair, index) => ({ id: index, text: pair.right })))
  )
  const [selectedLeftId, setSelectedLeftId] = useState(null)
  const [matchedIds, setMatchedIds] = useState([])
  const [errorPair, setErrorPair] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)

  const startTimeRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    startTimeRef.current = Date.now()
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  function handleLeftClick(itemId) {
    if (errorPair || isCompleted || matchedIds.includes(itemId)) return
    setSelectedLeftId((prev) => (prev === itemId ? null : itemId))
  }

  function handleRightClick(rightId) {
    if (
      selectedLeftId === null ||
      errorPair ||
      isCompleted ||
      matchedIds.includes(rightId)
    ) {
      return
    }

    if (selectedLeftId === rightId) {
      const nextMatched = [...matchedIds, rightId]
      setMatchedIds(nextMatched)
      setSelectedLeftId(null)

      if (nextMatched.length === pairs.length) {
        const elapsedSeconds = Math.max(
          1,
          Math.round((Date.now() - startTimeRef.current) / 1000)
        )
        setIsCompleted(true)
        timerRef.current = setTimeout(() => {
          onAnswer?.(true, elapsedSeconds)
        }, COMPLETE_DELAY_MS)
      }
      return
    }

    setErrorPair({ leftId: selectedLeftId, rightId })
    timerRef.current = setTimeout(() => {
      setErrorPair(null)
      setSelectedLeftId(null)
    }, ERROR_FLASH_MS)
  }

  return (
    <article className="match-card">
      <h2 className="match-card__title">{instruction}</h2>

      <div className="match-card__columns">
        <div className="match-card__column" role="group" aria-label="Columna esquerra">
          {leftItems.map((item) => {
            const isMatched = matchedIds.includes(item.id)
            const isSelected = selectedLeftId === item.id
            const isError = errorPair?.leftId === item.id

            let stateClass = ''
            if (isMatched) stateClass = 'match-item--matched'
            else if (isError) stateClass = 'match-item--error'
            else if (isSelected) stateClass = 'match-item--selected'

            return (
              <button
                key={`left-${item.id}`}
                type="button"
                className={`match-item ${stateClass}`.trim()}
                disabled={isMatched}
                aria-pressed={isSelected}
                onClick={() => handleLeftClick(item.id)}
              >
                {item.text}
              </button>
            )
          })}
        </div>

        <div className="match-card__column" role="group" aria-label="Columna dreta">
          {rightItems.map((item) => {
            const isMatched = matchedIds.includes(item.id)
            const isError = errorPair?.rightId === item.id

            let stateClass = ''
            if (isMatched) stateClass = 'match-item--matched'
            else if (isError) stateClass = 'match-item--error'

            return (
              <button
                key={`right-${item.id}`}
                type="button"
                className={`match-item ${stateClass}`.trim()}
                disabled={isMatched}
                onClick={() => handleRightClick(item.id)}
              >
                {item.text}
              </button>
            )
          })}
        </div>
      </div>

      {isCompleted ? (
        <p className="match-card__status match-card__status--done" role="status">
          Genial! Has emparellat tots els conceptes! 🎉
        </p>
      ) : (
        <p className="match-card__status">
          Parelles trobades: {matchedIds.length} / {pairs.length}
        </p>
      )}
    </article>
  )
}
