import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../services/supabase'
import './AdminExerciseCreator.css'

const SUBJECT_META = {
  math: { label: 'Matemàtiques', language: 'valencià' },
  valencian: { label: 'Valencià', language: 'valencià' },
  science: { label: 'Coneixement del Medi', language: 'valencià' },
  spanish: { label: 'Llengua Castellana', language: 'castellà' },
  english: { label: 'Anglés', language: 'anglés' },
}

const EXERCISE_SCHEMAS = {
  qa: `{
  "question": "Text clar de la pregunta",
  "options": ["Opció 1", "Opció 2", "Opció 3", "Opció 4"],
  "correctOption": "Opció 1"
}`,
  match: `{
  "instruction": "Relaciona cada concepte amb la seua parella",
  "pairs": [
    { "left": "Concepte 1", "right": "Parella 1" },
    { "left": "Concepte 2", "right": "Parella 2" },
    { "left": "Concepte 3", "right": "Parella 3" }
  ]
}`,
  fill_blanks: `{
  "sentence": "Frase amb un espai en blanc marcat així: ___ per a completar.",
  "options": ["paraula1", "paraula2", "paraula3"],
  "correctOption": "paraula1"
}`,
}

function getSubjectInfo(subjectName) {
  const key = String(subjectName ?? '').trim().toLowerCase()
  return (
    SUBJECT_META[key] ?? {
      label: subjectName || 'Assignatura',
      language: 'valencià',
    }
  )
}

function validateExercisePayload(type, parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return 'El format no és un JSON vàlid'
  }

  if (type === 'qa') {
    const hasQuestion =
      typeof parsed.question === 'string' && parsed.question.trim().length > 0
    const hasOptions = Array.isArray(parsed.options) && parsed.options.length >= 2
    const correctVal = parsed.correctOption ?? parsed.correctAnswer

    if (!hasQuestion) {
      return "El JSON de tipus 'qa' ha de contindre el camp 'question'."
    }
    if (!hasOptions) {
      return "El JSON de tipus 'qa' ha de contindre un array 'options' amb almenys 2 opcions."
    }
    if (correctVal === undefined || correctVal === null || String(correctVal).trim() === '') {
      return "El JSON de tipus 'qa' ha de contindre el camp 'correctOption'."
    }
    const optionStrings = parsed.options.map((opt) =>
      typeof opt === 'object' && opt !== null ? String(opt.text ?? opt.label ?? '') : String(opt)
    )
    if (!optionStrings.includes(String(correctVal))) {
      return "El valor de 'correctOption' ha de coincidir exactament amb una de les opcions."
    }
    return null
  }

  if (type === 'match') {
    if (!Array.isArray(parsed.pairs) || parsed.pairs.length < 2) {
      return "El JSON de tipus 'match' ha de contindre un array 'pairs' amb almenys 2 parelles."
    }
    const validPairs = parsed.pairs.every(
      (pair) =>
        pair &&
        typeof pair === 'object' &&
        typeof pair.left === 'string' &&
        pair.left.trim().length > 0 &&
        typeof pair.right === 'string' &&
        pair.right.trim().length > 0
    )
    if (!validPairs) {
      return "Cada element de 'pairs' ha de tindre els camps de text 'left' i 'right'."
    }
    return null
  }

  if (type === 'fill_blanks') {
    const hasSentence =
      typeof parsed.sentence === 'string' && /_{2,}/.test(parsed.sentence)
    const hasOptions = Array.isArray(parsed.options) && parsed.options.length >= 2
    const hasCorrectOption =
      typeof parsed.correctOption === 'string' && parsed.correctOption.trim().length > 0

    if (!hasSentence) {
      return "El JSON de tipus 'fill_blanks' ha de contindre 'sentence' amb el marcador ___."
    }
    if (!hasOptions) {
      return "El JSON de tipus 'fill_blanks' ha de contindre un array 'options' amb almenys 2 paraules."
    }
    if (!hasCorrectOption || !parsed.options.includes(parsed.correctOption)) {
      return "El camp 'correctOption' ha d'existir i coincidir amb una de les opcions."
    }
    return null
  }

  return "Tipus d'exercici no reconegut."
}

export function AdminExerciseCreator() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [exerciseType, setExerciseType] = useState('qa')
  const [jsonInput, setJsonInput] = useState('')
  const [loadingCatalog, setLoadingCatalog] = useState(Boolean(supabase))
  const [catalogError, setCatalogError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    async function loadCurriculum() {
      const [subjectsResult, topicsResult] = await Promise.all([
        supabase.from('subjects').select('id, name').order('id', { ascending: true }),
        supabase
          .from('topics')
          .select('id, subject_id, name')
          .order('id', { ascending: true }),
      ])

      if (!isMounted) return

      if (subjectsResult.error || topicsResult.error) {
        console.error(
          'Error loading curriculum:',
          subjectsResult.error?.message || topicsResult.error?.message
        )
        setCatalogError("No s'han pogut carregar les assignatures i blocs temàtics.")
        setLoadingCatalog(false)
        return
      }

      const subjectList = subjectsResult.data ?? []
      const topicList = topicsResult.data ?? []

      setSubjects(subjectList)
      setTopics(topicList)

      if (subjectList.length > 0) {
        const firstSubjectId = String(subjectList[0].id)
        setSelectedSubjectId(firstSubjectId)
        const firstTopic = topicList.find(
          (topic) => String(topic.subject_id) === firstSubjectId
        )
        if (firstTopic) {
          setSelectedTopicId(String(firstTopic.id))
        }
      }

      setLoadingCatalog(false)
    }

    loadCurriculum()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredTopics = topics.filter(
    (topic) => String(topic.subject_id) === String(selectedSubjectId)
  )

  const currentSubject = subjects.find(
    (subject) => String(subject.id) === String(selectedSubjectId)
  )
  const currentTopic = filteredTopics.find(
    (topic) => String(topic.id) === String(selectedTopicId)
  )

  const subjectInfo = getSubjectInfo(currentSubject?.name)
  const topicLabel = currentTopic?.name || '[BLOC TEMÀTIC]'
  const schemaText = EXERCISE_SCHEMAS[exerciseType]

  const generatedPrompt = `Actua com un mestre de 4t de primària. Dissenya un exercici sobre "${topicLabel}" de "${subjectInfo.label}" en ${subjectInfo.language}. Retorna ÚNICAMENT un objecte JSON vàlid (sense text addicional ni blocs markdown) amb aquesta estructura estricta:
${schemaText}`

  function handleSubjectChange(event) {
    const nextSubjectId = event.target.value
    setSelectedSubjectId(nextSubjectId)
    const firstMatchingTopic = topics.find(
      (topic) => String(topic.subject_id) === nextSubjectId
    )
    setSelectedTopicId(firstMatchingTopic ? String(firstMatchingTopic.id) : '')
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(generatedPrompt)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      setCopySuccess(false)
    }
  }

  async function handleUploadExercise() {
    setValidationError('')
    setUploadSuccess('')

    if (!supabase || !user?.id) {
      setValidationError('No hi ha una sessió activa amb connexió a Supabase.')
      return
    }

    if (!selectedTopicId) {
      setValidationError('Selecciona una assignatura i un bloc temàtic.')
      return
    }

    let parsedJson
    try {
      parsedJson = JSON.parse(jsonInput.trim())
    } catch {
      setValidationError('El format no és un JSON vàlid')
      return
    }

    const fieldError = validateExercisePayload(exerciseType, parsedJson)
    if (fieldError) {
      setValidationError(fieldError)
      return
    }

    setSubmitting(true)

    try {
      const numericTopicId = Number(selectedTopicId)
      const { error: insertError } = await supabase.from('exercises').insert({
        topic_id: Number.isNaN(numericTopicId) ? selectedTopicId : numericTopicId,
        type: exerciseType,
        content: parsedJson,
        created_by: user.id,
        status: 'pending_validation',
      })

      if (insertError) {
        setValidationError(`No s'ha pogut guardar l'exercici: ${insertError.message}`)
        return
      }

      setJsonInput('')
      setUploadSuccess(
        "Exercici pujat correctament! S'ha quedat en estat pendent de validació."
      )
    } catch {
      setValidationError("S'ha produït un error inesperat en pujar l'exercici.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-creator">
      <div className="admin-creator__container">
        <header className="admin-creator__header">
          <div>
            <h1 className="admin-creator__title">Importació d&apos;Exercicis amb IA</h1>
            <p className="admin-creator__subtitle">
              Genera el prompt adequat, copia la resposta JSON de la teua IA i puja-la per
              a validar.
            </p>
          </div>
          <Link to="/admin/dashboard" className="admin-creator__back-link">
            Tornar al panell
          </Link>
        </header>

        {catalogError && (
          <p className="admin-creator__alert admin-creator__alert--error" role="alert">
            {catalogError}
          </p>
        )}

        <div className="admin-creator__sections">
          <section className="admin-creator__card" aria-labelledby="section-generate-heading">
            <h2 id="section-generate-heading" className="admin-creator__section-title">
              1. Genera l&apos;exercici amb IA
            </h2>

            <div className="admin-creator__selectors">
              <div className="admin-creator__field">
                <label htmlFor="creator-subject" className="admin-creator__label">
                  Assignatura
                </label>
                <select
                  id="creator-subject"
                  className="admin-creator__select"
                  value={selectedSubjectId}
                  onChange={handleSubjectChange}
                  disabled={loadingCatalog || subjects.length === 0}
                >
                  {subjects.length === 0 ? (
                    <option value="">Sense assignatures</option>
                  ) : (
                    subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {getSubjectInfo(subject.name).label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="admin-creator__field">
                <label htmlFor="creator-topic" className="admin-creator__label">
                  Bloc Temàtic
                </label>
                <select
                  id="creator-topic"
                  className="admin-creator__select"
                  value={selectedTopicId}
                  onChange={(event) => setSelectedTopicId(event.target.value)}
                  disabled={loadingCatalog || filteredTopics.length === 0}
                >
                  {filteredTopics.length === 0 ? (
                    <option value="">Sense blocs disponibles</option>
                  ) : (
                    filteredTopics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="admin-creator__field">
                <label htmlFor="creator-type" className="admin-creator__label">
                  Tipus d&apos;exercici
                </label>
                <select
                  id="creator-type"
                  className="admin-creator__select"
                  value={exerciseType}
                  onChange={(event) => setExerciseType(event.target.value)}
                >
                  <option value="qa">Pregunta i respostes (qa)</option>
                  <option value="match">Enllaçar conceptes (match)</option>
                  <option value="fill_blanks">Completar frases (fill_blanks)</option>
                </select>
              </div>
            </div>

            <div className="admin-creator__prompt-header">
              <span className="admin-creator__label">Prompt preparat per a la IA</span>
              <div className="admin-creator__actions">
                {copySuccess && (
                  <span className="admin-creator__copy-feedback" role="status">
                    Prompt copiat!
                  </span>
                )}
                <button
                  type="button"
                  className="admin-creator__btn admin-creator__btn--secondary"
                  onClick={handleCopyPrompt}
                >
                  Copiar Prompt
                </button>
              </div>
            </div>

            <pre className="admin-creator__prompt-box">{generatedPrompt}</pre>
          </section>

          <section className="admin-creator__card" aria-labelledby="section-import-heading">
            <h2 id="section-import-heading" className="admin-creator__section-title">
              2. Importa el resultat
            </h2>

            <div className="admin-creator__field">
              <label htmlFor="creator-json-input" className="admin-creator__label">
                Enganxa ací el JSON generat per la IA
              </label>
              <textarea
                id="creator-json-input"
                className="admin-creator__textarea"
                placeholder="Enganxa el resultat JSON complet ací..."
                value={jsonInput}
                onChange={(event) => setJsonInput(event.target.value)}
              />
            </div>

            {validationError && (
              <p className="admin-creator__alert admin-creator__alert--error" role="alert">
                {validationError}
              </p>
            )}

            {uploadSuccess && (
              <p className="admin-creator__alert admin-creator__alert--success" role="status">
                {uploadSuccess}
              </p>
            )}

            <div className="admin-creator__actions">
              <button
                type="button"
                className="admin-creator__btn admin-creator__btn--primary"
                disabled={submitting}
                onClick={handleUploadExercise}
              >
                {submitting ? 'Pujant...' : 'Pujar Exercici'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
