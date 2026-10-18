const metricIcons = {
  interviews: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="15" rx="3" />
      <path d="M8 5V3h8v2M8 11h8M8 15h5" />
    </svg>
  ),
  average: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 7 10 17l-5-5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  time: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),
}

function formatPracticeTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function Dashboard({ interviews, onNewInterview }) {
  const totalInterviews = interviews.length
  const scoredInterviews = interviews.filter((interview) => typeof interview.score === 'number')
  const averageScore = scoredInterviews.length
    ? scoredInterviews.reduce((total, interview) => total + interview.score, 0) / scoredInterviews.length
    : 0
  const successfulInterviews = scoredInterviews.filter((interview) => interview.score >= 7).length
  const successRate = scoredInterviews.length
    ? Math.round((successfulInterviews / scoredInterviews.length) * 100)
    : 0
  const practiceMinutes = interviews.reduce(
    (total, interview) => total + interview.durationMinutes,
    0,
  )

  const metrics = [
    {
      label: 'Total interviews',
      value: totalInterviews,
      detail: 'Completed practice sessions',
      icon: metricIcons.interviews,
      color: 'blue',
    },
    {
      label: 'Average rate',
      value: scoredInterviews.length ? `${averageScore.toFixed(1)} / 10` : '—',
      detail: 'Average agent score',
      icon: metricIcons.average,
      color: 'violet',
    },
    {
      label: 'Success rate',
      value: scoredInterviews.length ? `${successRate}%` : '—',
      detail: 'Scored 7/10 or higher',
      icon: metricIcons.success,
      color: 'green',
    },
    {
      label: 'Practice time',
      value: formatPracticeTime(practiceMinutes),
      detail: 'Time spent practising',
      icon: metricIcons.time,
      color: 'amber',
    },
  ]

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR OVERVIEW</div>
          <h1>Welcome back</h1>
          <p className="section-intro">A little practice today can make a big difference tomorrow.</p>
        </div>
        <span className="today-date">
          {new Intl.DateTimeFormat('en', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }).format(new Date())}
        </span>
      </div>

      <section className="metrics-grid" aria-label="Interview statistics">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className={`metric-icon metric-icon-${metric.color}`}>{metric.icon}</div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-detail">{metric.detail}</div>
          </article>
        ))}
      </section>

      <section className="welcome-card">
        <div className="welcome-decoration welcome-decoration-one" />
        <div className="welcome-decoration welcome-decoration-two" />
        <div className="welcome-copy">
          <span className="welcome-tag"><span /> YOUR NEXT BIG THING STARTS HERE</span>
          <h2>Ready to ace your next interview?</h2>
          <p>Build confidence, sharpen your answers, and show up ready for the opportunity.</p>
          <button className="primary-button welcome-button" onClick={onNewInterview}>
            <span aria-hidden="true">＋</span> New interview
          </button>
        </div>
        <div className="welcome-illustration" aria-hidden="true">
          <div className="illustration-card">
            <span className="illustration-check">✓</span>
            <span className="illustration-line illustration-line-long" />
            <span className="illustration-line" />
            <span className="illustration-line illustration-line-short" />
          </div>
          <div className="illustration-sparkle">✦</div>
        </div>
      </section>

      <section className="recent-section">
        <div className="section-heading-row">
          <div>
            <h2>Recent interviews</h2>
            <p>Your latest completed practice sessions</p>
          </div>
          {totalInterviews > 0 && (
            <span className="history-count">{totalInterviews} total</span>
          )}
        </div>

        {interviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">◷</div>
            <h3>Your practice history starts here</h3>
            <p>Complete your first interview and it’ll show up here.</p>
          </div>
        ) : (
          <div className="recent-list">
            {interviews.slice(0, 4).map((interview) => (
              <article className="recent-item" key={interview.id}>
                <div className="recent-role-icon" aria-hidden="true">
                  {metricIcons.interviews}
                </div>
                <div className="recent-info">
                  <h3>{interview.role}</h3>
                  <p>{interview.difficulty} <span>·</span> {formatDate(interview.completedAt)}</p>
                </div>
                <div className="recent-questions">
                  {interview.questionsAnswered} questions
                </div>
                <div className="recent-score">
                  {typeof interview.score === 'number'
                    ? <><strong>{interview.score.toFixed(1)}</strong><span> / 10</span></>
                    : <strong>—</strong>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Dashboard
