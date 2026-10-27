import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const storedTokenKey = 'resume-ready-access-token';

function scoreState(score) {
  if (score >= 75) return { label: 'Good', color: 'bg-score-good', text: 'text-score-good' };
  if (score >= 50)
    return { label: 'Average', color: 'bg-score-average', text: 'text-score-average' };
  return { label: 'Low', color: 'bg-score-low', text: 'text-score-low' };
}

function ScoreCard({ label, score, suffix = '/100' }) {
  const state = scoreState(score);
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5"
      aria-label={`${label}: ${score} ${state.label}`}
    >
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-slate-950">
          {score}
          <span className="text-base font-medium text-slate-500">{suffix}</span>
        </p>
        <span className={`text-sm font-semibold ${state.text}`}>{state.label}</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div className={`h-full rounded-full ${state.color}`} style={{ width: `${score}%` }} />
      </div>
    </section>
  );
}

function Header({ user, onSignOut, onNavigate }) {
  return (
    <header className="app-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <button className="brand-lockup" onClick={() => onNavigate('dashboard')}>
          <img src="/resumeready-icon.svg" alt="" width="32" height="32" />
          <span>ResumeReady</span>
        </button>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:block">{user.email}</span>
            <button
              className="text-sm font-medium text-brand underline-offset-4 hover:underline"
              onClick={onSignOut}
            >
              Sign out
            </button>
          </div>
        ) : (
          <span className="text-sm text-slate-600">Estimated ATS readiness</span>
        )}
      </div>
    </header>
  );
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const result =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.register({ email, password });
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md items-center px-5 py-12">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">
          Resume review, made clear
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-3 text-base leading-6 text-slate-600">
          {mode === 'login'
            ? 'Sign in to analyze a resume.'
            : 'Start with a private, clear resume review.'}
        </p>
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-800">
            Email address
            <input
              className="field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Password
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength="12"
              required
            />
            {mode === 'register' && (
              <span className="mt-1 block text-sm font-normal text-slate-500">
                At least 12 characters.
              </span>
            )}
          </label>
          {error && (
            <p className="notice-error" role="alert">
              {error}
            </p>
          )}
          <button className="button-primary w-full" disabled={pending}>
            {pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button
          className="mt-6 text-sm font-medium text-brand underline-offset-4 hover:underline"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  );
}

function Dashboard({ token, onAnalysis }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState('');
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const fileInputRef = useRef(null);
  const progressTimerRef = useRef(null);
  useEffect(() => {
    api
      .listAnalyses(token)
      .then(({ analyses }) => setHistory(analyses))
      .catch((requestError) => setHistoryError(requestError.message));
  }, [token]);
  async function submit(event) {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF or DOCX resume before continuing.');
      return;
    }
    if (jobDescription.trim() && jobDescription.trim().length < 100) {
      setError(
        'Add at least 100 characters to the job description, or remove it to analyze only your resume.',
      );
      return;
    }
    setError('');
    try {
      setStage({ step: 1, text: 'Uploading and reading your resume…' });
      const resume = await api.uploadResume(file, token);
      setStage({ step: 2, text: 'Checking ATS readiness and writing clarity…' });
      if (jobDescription.trim()) {
        progressTimerRef.current = setTimeout(() => {
          setStage({ step: 3, text: 'Comparing your resume with the target role…' });
        }, 1_500);
      }
      const result = await api.analyze(
        {
          resumeId: resume.resumeId,
          ...(jobDescription.trim() && { jobDescription: jobDescription.trim() }),
        },
        token,
      );
      onAnalysis(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      clearTimeout(progressTimerRef.current);
      setStage('');
    }
  }
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Analyze one resume
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Upload your resume, then optionally add a job description to see how well they align.
        </p>
      </div>
      <form
        className="mt-8 max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6"
        onSubmit={submit}
      >
        <label className="block text-sm font-medium text-slate-800">
          Resume file
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={Boolean(stage)}
          />
          <span className="mt-2 flex flex-wrap items-center gap-3">
            <button
              className="button-secondary"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={Boolean(stage)}
            >
              Choose resume file
            </button>
            <span className="text-sm font-normal text-slate-700" aria-live="polite">
              {file ? file.name : 'No file selected'}
            </span>
          </span>
          <span className="mt-2 block text-sm font-normal leading-5 text-slate-500">
            PDF or DOCX, up to 5 MB. Image-only files cannot be read yet.
          </span>
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Target job description <span className="font-normal text-slate-500">(optional)</span>
          <textarea
            className="field mt-2 min-h-40 resize-y"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste a job description to compare skills and requirements."
            disabled={Boolean(stage)}
          />
          <span className="mt-1 block text-sm font-normal text-slate-500">
            {jobDescription.trim().length > 0 && jobDescription.trim().length < 100
              ? `${jobDescription.trim().length}/100 characters minimum`
              : 'Optional. Add at least 100 characters for job-match results.'}
          </span>
        </label>
        {error && (
          <p className="notice-error" role="alert">
            {error}
          </p>
        )}
        {stage && (
          <AnalysisProgress stage={stage} hasJobDescription={Boolean(jobDescription.trim())} />
        )}
        <button className="button-primary" disabled={Boolean(stage)}>
          {stage ? 'Analyzing…' : 'Analyze resume'}
        </button>
      </form>
      <section className="mt-12" aria-labelledby="history-title">
        <h2 id="history-title" className="text-xl font-semibold text-slate-950">
          Recent analyses
        </h2>
        <p className="mt-1 text-base text-slate-600">Your 20 most recent saved results.</p>
        {historyError && (
          <p className="notice-error mt-4" role="alert">
            {historyError}
          </p>
        )}
        {!historyError && history.length === 0 && (
          <p className="mt-5 text-base text-slate-600">
            No analyses yet. Upload a resume to create your first result.
          </p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((item) => (
            <button
              key={item.analysisId}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-slate-400"
              onClick={() => onAnalysis(item)}
            >
              <p className="text-sm text-slate-600">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                Overall {item.scores.overall}/100
              </p>
              <p className="mt-1 text-sm text-slate-600">
                ATS {item.scores.ats}%
                {item.scores.jobMatch !== null ? ` · Job match ${item.scores.jobMatch}%` : ''}
              </p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function AnalysisProgress({ stage, hasJobDescription }) {
  const totalSteps = hasJobDescription ? 3 : 2;
  const progress = Math.round((stage.step / totalSteps) * 100);
  return (
    <section
      className="analysis-progress"
      role="status"
      aria-live="assertive"
      aria-label="Analysis in progress"
    >
      <div className="flex items-center gap-3">
        <span className="loader" aria-hidden="true" />
        <div>
          <p className="font-semibold text-brand">Analyzing your resume</p>
          <p className="mt-1 text-sm leading-5 text-slate-700">{stage.text}</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-soft" aria-hidden="true">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Step {stage.step} of {totalSteps}. Please keep this page open.
      </p>
    </section>
  );
}

function SkillGap({ skillGap }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Skills for this role</h2>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-score-good">Matched</h3>
        <p className="mt-2 text-base leading-6 text-slate-700">
          {skillGap.matchedSkills.length
            ? skillGap.matchedSkills.join(', ')
            : 'No direct skill matches were identified.'}
        </p>
        <h3 className="mt-5 text-sm font-semibold text-score-average">Missing or unclear</h3>
        <ul className="mt-2 space-y-3">
          {skillGap.missingSkills.length ? (
            skillGap.missingSkills.map(({ skill, priority, reason }) => (
              <li key={skill}>
                <p className="font-medium text-slate-900">
                  {skill}{' '}
                  <span className="ml-1 text-sm font-normal text-slate-600">
                    · {priority} priority
                  </span>
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{reason}</p>
              </li>
            ))
          ) : (
            <li className="text-base text-slate-700">No material gaps were identified.</li>
          )}
        </ul>
      </div>
    </section>
  );
}

function Results({ analysis, onBack }) {
  const hasJobMatch = analysis.scores.jobMatch !== null && analysis.scores.jobMatch !== undefined;
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
      <button
        className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        onClick={onBack}
      >
        ← Back to dashboard
      </button>
      <div className="mt-5 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Results</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Your resume review
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          These are estimated scores, not a prediction of any employer’s ATS decision.
        </p>
      </div>
      <section
        className={`mt-8 grid gap-4 ${hasJobMatch ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}
        aria-label="Score summary"
      >
        <ScoreCard label="Overall score" score={analysis.scores.overall} />
        <ScoreCard label="ATS readiness" score={analysis.scores.ats} suffix="%" />
        {hasJobMatch && <ScoreCard label="Job match" score={analysis.scores.jobMatch} suffix="%" />}
      </section>
      <div className="mt-9 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <h2 className="text-xl font-semibold text-slate-950">ATS breakdown</h2>
          <div className="mt-4 space-y-3">
            {analysis.breakdown.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.label}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{item.message}</p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${item.passed ? 'text-score-good' : 'text-score-low'}`}
                  >
                    {item.score}/{item.maxScore}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-950">Recommended next steps</h2>
            <ol className="mt-4 space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <li
                  key={recommendation}
                  className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {index + 1}
                  </span>
                  <p className="text-base leading-6 text-slate-700">{recommendation}</p>
                </li>
              ))}
            </ol>
          </section>
          {hasJobMatch && analysis.skillGap && <SkillGap skillGap={analysis.skillGap} />}
        </aside>
      </div>
    </main>
  );
}

function Feature({ title, text }) {
  return (
    <article className="p-7">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-base leading-6 text-slate-600">{text}</p>
    </article>
  );
}
function Landing({ onStart }) {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-5 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">
          Resume review, made clear
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Know what your resume needs before you apply.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Get a clear estimate of ATS readiness, skill gaps, and practical next steps for a role you
          want.
        </p>
        <button className="button-primary mt-9" onClick={onStart}>
          Analyze my resume
        </button>
        <p className="mt-4 text-sm text-slate-500">PDF and DOCX · Up to 5 MB · Estimated results</p>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Feature
            title="Clear scores"
            text="Every score includes a plain-language state, not colour alone."
          />
          <Feature
            title="Practical guidance"
            text="See the most useful changes to make before you apply."
          />
          <Feature
            title="Private by default"
            text="Your uploaded file is processed in memory, not stored as a binary."
          />
        </div>
      </section>
    </main>
  );
}

export default function ResumeApp() {
  const [session, setSession] = useState(() => ({
    token: localStorage.getItem(storedTokenKey),
    user: null,
  }));
  const [screen, setScreen] = useState(() =>
    localStorage.getItem(storedTokenKey) ? 'dashboard' : 'landing',
  );
  const [analysis, setAnalysis] = useState(null);
  useEffect(() => {
    if (session.token && !session.user)
      api
        .getMe(session.token)
        .then(({ user }) => setSession((current) => ({ ...current, user })))
        .catch(() => {
          localStorage.removeItem(storedTokenKey);
          setSession({ token: null, user: null });
          setScreen('landing');
        });
  }, [session.token, session.user]);
  function authenticated({ accessToken, user }) {
    localStorage.setItem(storedTokenKey, accessToken);
    setSession({ token: accessToken, user });
    setScreen('dashboard');
  }
  function signOut() {
    localStorage.removeItem(storedTokenKey);
    setSession({ token: null, user: null });
    setAnalysis(null);
    setScreen('landing');
  }
  function openAnalysis(result) {
    setAnalysis(result);
    setScreen('results');
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header user={session.user} onSignOut={signOut} onNavigate={setScreen} />
      {screen === 'landing' && (
        <Landing onStart={() => setScreen(session.token ? 'dashboard' : 'auth')} />
      )}
      {screen === 'auth' && <AuthScreen onAuthenticated={authenticated} />}
      {screen === 'dashboard' && session.token && (
        <Dashboard token={session.token} onAnalysis={openAnalysis} />
      )}
      {screen === 'results' && analysis && (
        <Results analysis={analysis} onBack={() => setScreen('dashboard')} />
      )}
    </div>
  );
}
