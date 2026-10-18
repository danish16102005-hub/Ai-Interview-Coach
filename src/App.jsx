import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Dashboard from './Pages/Dashboard'
import {
  requestNextQuestion,
  startInterview as startAgentInterview,
  submitAnswer as submitAgentAnswer,
} from './services/interviewService'
import './App.css'

const STORAGE_KEY = 'prepai.completedInterviews'

function readInterviews() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { interviews: [], error: '' }

    const interviews = JSON.parse(stored)
    if (
      !Array.isArray(interviews) ||
      interviews.some(
        (interview) =>
          typeof interview.id !== 'string' ||
          typeof interview.role !== 'string' ||
          typeof interview.difficulty !== 'string' ||
          (typeof interview.score !== 'number' && interview.score !== null) ||
          typeof interview.questionsAnswered !== 'number' ||
          typeof interview.durationMinutes !== 'number' ||
          typeof interview.completedAt !== 'string',
      )
    ) {
      throw new Error('Saved interview history has an unexpected format.')
    }

    return { interviews, error: '' }
  } catch (error) {
    return {
      interviews: [],
      error: `Interview history could not be loaded: ${error.message}`,
    }
  }
}

function App() {
  const navigate = useNavigate()
  const [history, setHistory] = useState(readInterviews)
  const [session, setSession] = useState(null)
  const [storageError, setStorageError] = useState(history.error)

  function startInterview(settings) {
    setSession({ ...settings, startedAt: Date.now() })
    navigate('/interview')
  }

  function finishInterview(result) {
    setSession({ ...session, result })
    navigate('/completion')
  }

  function saveInterview() {
    if (!session?.result) return

    const record = {
      id: `${Date.now()}`,
      role: session.role,
      difficulty: session.difficulty,
      score: session.result.score,
      questionsAnswered: session.result.questionsAnswered,
      durationMinutes: Math.max(1, Math.ceil((Date.now() - session.startedAt) / 60000)),
      completedAt: new Date().toISOString(),
    }
    const nextHistory = [record, ...history.interviews]

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory))
      setHistory({ interviews: nextHistory, error: '' })
      setStorageError('')
      setSession(null)
      navigate('/')
    } catch (error) {
      setStorageError(`Interview could not be saved: ${error.message}`)
    }
  }

  function abandonInterview() {
    setSession(null)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/')} aria-label="PrepAI home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 18V6l7 7 7-7v12" />
              <path d="M5 18h14" />
            </svg>
          </span>
          <span>Prep<span className="brand-accent">AI</span></span>
        </button>
        <div className="profile">
          <div className="profile-copy">
            <span className="profile-name">Your practice space</span>
            <span className="profile-caption">Interview coach</span>
          </div>
          <div className="profile-avatar" aria-hidden="true">P</div>
        </div>
      </header>

      {storageError && (
        <div className="storage-notice" role="alert">
          {storageError}
        </div>
      )}

      <main className="page-content">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                interviews={history.interviews}
                onNewInterview={() => navigate('/new-interview')}
              />
            }
          />
          <Route
            path="/new-interview"
            element={<SetupPage onBack={() => navigate('/')} onStart={startInterview} />}
          />
          <Route
            path="/interview"
            element={
              session ? (
                <InterviewPage
                  key={session.startedAt}
                  session={session}
                  onEnd={abandonInterview}
                  onFinish={finishInterview}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/completion"
            element={
              session?.result ? (
                <CompletionPage
                  session={session}
                  error={storageError}
                  onDone={saveInterview}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>PrepAI</span>
        <span>Practice makes progress.</span>
      </footer>
    </div>
  )
}

function SetupPage({ onBack, onStart }) {
  const [role, setRole] = useState('Software Developer')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [questionCount, setQuestionCount] = useState(5)

  return (
    <section className="setup-layout">
      <button className="back-button" onClick={onBack}>
        <span aria-hidden="true">←</span> Back to dashboard
      </button>
      <div className="setup-card">
        <div className="eyebrow">LET’S GET YOU READY</div>
        <h1>Set up your interview</h1>
        <p className="section-intro">A little practice goes a long way. Make this session yours.</p>

        <div className="form-section">
          <label className="field-label" htmlFor="job-role">Job role</label>
          <select id="job-role" value={role} onChange={(event) => setRole(event.target.value)}>
            {['Software Developer', 'Frontend Developer', 'AI/ML Engineer'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <fieldset className="form-section choice-fieldset">
          <legend className="field-label">Difficulty</legend>
          <div className="choice-grid">
            {['Beginner', 'Intermediate', 'Advanced'].map((option) => (
              <button
                className={`choice-card ${difficulty === option ? 'is-selected' : ''}`}
                type="button"
                key={option}
                onClick={() => setDifficulty(option)}
                aria-pressed={difficulty === option}
              >
                <span className="choice-dot" />
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-section choice-fieldset">
          <legend className="field-label">Number of questions</legend>
          <div className="choice-grid question-count-grid">
            {[5, 10].map((option) => (
              <button
                className={`choice-card ${questionCount === option ? 'is-selected' : ''}`}
                type="button"
                key={option}
                onClick={() => setQuestionCount(option)}
                aria-pressed={questionCount === option}
              >
                <span className="choice-dot" />
                {option} questions
              </button>
            ))}
          </div>
        </fieldset>

        <button
          className="primary-button setup-submit"
          onClick={() => onStart({ role, difficulty, questionCount })}
        >
          Start interview <span aria-hidden="true">→</span>
        </button>
        <p className="demo-note">Your interview will be coached by the local AI agent.</p>
      </div>
    </section>
  )
}

function InterviewPage({ session, onEnd, onFinish }) {
  const [agentSessionId, setAgentSessionId] = useState('')
  const [question, setQuestion] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [answerResults, setAnswerResults] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [answerError, setAnswerError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const submitted = feedback !== null
  const progress = (answerResults.length / session.questionCount) * 100

  useEffect(() => {
    let active = true

    startAgentInterview(session.role, session.difficulty)
      .then((interview) => {
        if (!active) return
        setAgentSessionId(interview.sessionId)
        setQuestion(interview.question)
        setLoading(false)
      })
      .catch((error) => {
        if (!active) return
        setAnswerError(error.message)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [retryCount, session.difficulty, session.role])

  function retryConnection() {
    setAnswerError('')
    setLoading(true)
    setRetryCount((count) => count + 1)
  }

  async function submitAnswer() {
    if (!answer.trim()) {
      setAnswerError('Write an answer before submitting.')
      return
    }

    setLoading(true)
    setAnswerError('')
    try {
      const result = await submitAgentAnswer(agentSessionId, question, answer.trim())
      setFeedback(result)
      setAnswerResults((results) => [...results, result])
    } catch (error) {
      setAnswerError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function continueInterview() {
    if (!submitted || loading) return
    if (answerResults.length === session.questionCount) {
      const scores = answerResults
        .map((result) => result.score)
        .filter((score) => typeof score === 'number' && Number.isFinite(score))
      onFinish({
        score: scores.length
          ? Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) / 10
          : null,
        questionsAnswered: answerResults.length,
        scoredQuestions: scores.length,
      })
      return
    }

    setLoading(true)
    setAnswerError('')
    try {
      const nextQuestion = feedback.nextQuestion ||
        await requestNextQuestion(agentSessionId, session.role)
      setQuestion(nextQuestion)
      setQuestionIndex((index) => index + 1)
      setAnswer('')
      setFeedback(null)
    } catch (error) {
      setAnswerError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="interview-layout">
      <div className="interview-topline">
        <div>
          <div className="eyebrow">PRACTICE SESSION</div>
          <h1>Your interview</h1>
        </div>
        <button className="text-button end-button" onClick={onEnd}>End interview</button>
      </div>

      <div className="interview-meta">
        <span className="meta-pill">{session.role}</span>
        <span className="meta-pill">{session.difficulty}</span>
      </div>

      <div className="progress-heading">
        <span>Question {questionIndex + 1} <span className="muted">of {session.questionCount}</span></span>
        <span className="muted">{Math.round(progress)}% complete</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Interview progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(progress)}
      >
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="question-card">
        {loading && !question ? (
          <p className="agent-loading" role="status">Connecting to your interview coach…</p>
        ) : answerError && !question ? (
          <div>
            <p className="form-error" role="alert">{answerError}</p>
            <button className="primary-button retry-button" onClick={retryConnection}>
              Retry connection
            </button>
          </div>
        ) : (
          <>
            <div className="question-number">QUESTION {String(questionIndex + 1).padStart(2, '0')}</div>
            <h2>{question}</h2>
            <label className="field-label answer-label" htmlFor="answer">Your answer</label>
            <textarea
              id="answer"
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value)
                if (event.target.value.trim()) setAnswerError('')
              }}
              placeholder="Take a moment to structure your thoughts, then write your answer..."
              rows="8"
              disabled={submitted || loading}
              aria-describedby={answerError ? 'answer-error' : undefined}
            />
          </>
        )}
        {answerError && question && <p className="form-error" id="answer-error">{answerError}</p>}
        {submitted && (
          <AgentFeedback feedback={feedback} />
        )}
        <div className="answer-actions">
          <span className="answer-hint">Your progress is only saved when you finish.</span>
          {!submitted && question ? (
            <button className="primary-button" onClick={submitAnswer} disabled={!answer.trim() || loading}>
              {loading ? 'Evaluating…' : 'Submit answer'} <span aria-hidden="true">→</span>
            </button>
          ) : submitted ? (
            <button className="primary-button" onClick={continueInterview} disabled={loading}>
              {loading
                ? 'Loading…'
                : answerResults.length === session.questionCount
                  ? 'View results'
                  : 'Next question'}
              <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function AgentFeedback({ feedback }) {
  const hasStructuredFeedback = feedback.score !== null ||
    feedback.strengths.length > 0 ||
    feedback.improvements.length > 0 ||
    feedback.improvedAnswer

  if (!hasStructuredFeedback) {
    return <div className="agent-feedback-text" role="status">{feedback.text}</div>
  }

  return (
    <section className="agent-feedback" aria-label="Interview coach feedback">
      {feedback.score !== null && (
        <div className="agent-feedback-score">
          <strong>{feedback.score}</strong><span> / 10</span>
        </div>
      )}
      {feedback.strengths.length > 0 && (
        <div>
          <h3>Strengths</h3>
          <ul>{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}
      {feedback.improvements.length > 0 && (
        <div>
          <h3>Areas for improvement</h3>
          <ul>{feedback.improvements.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}
      {feedback.improvedAnswer && (
        <div>
          <h3>Improved answer</h3>
          <p>{feedback.improvedAnswer}</p>
        </div>
      )}
      {feedback.nextQuestion && (
        <p className="agent-next-question"><strong>Next question:</strong> {feedback.nextQuestion}</p>
      )}
    </section>
  )
}

function CompletionPage({ session, error, onDone }) {
  const result = session.result
  const hasScore = typeof result.score === 'number'

  return (
    <section className="completion-layout">
      <div className="completion-card">
        <div className="completion-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="m6 12 4 4 8-9" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div className="eyebrow">SESSION COMPLETE</div>
        <h1>That’s a wrap!</h1>
        <p className="section-intro">You showed up and put in the work. Take a look at your practice recap.</p>

        <div className="result-score">
          <span className="result-score-value">{hasScore ? result.score.toFixed(1) : '—'}</span>
          {hasScore && <span className="result-score-total">/ 10</span>}
          <span className="result-score-label">Final score</span>
        </div>

        <div className="result-stats">
          <div>
            <span className="result-stat-value">{result.questionsAnswered}</span>
            <span className="result-stat-label">Questions answered</span>
          </div>
          <div>
            <span className="result-stat-value">
              {hasScore ? <>{result.score.toFixed(1)}<small> / 10</small></> : '—'}
            </span>
            <span className="result-stat-label">Average agent score</span>
          </div>
        </div>

        <div className="feedback-box">
          <span className="feedback-label">Interview results</span>
          <p>{hasScore
            ? `Average of ${result.scoredQuestions} score${result.scoredQuestions === 1 ? '' : 's'} returned by your interview coach.`
            : 'The interview coach did not return a numeric score for this session.'}</p>
        </div>
        {error && <p className="form-error save-error" role="alert">{error}</p>}
        <button className="primary-button done-button" onClick={onDone}>
          Done <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

export default App
