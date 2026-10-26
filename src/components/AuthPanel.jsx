import { useState } from 'react';

export default function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onAuthenticated(email, password, mode);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  return (
    <main className="auth-shell">
      <header>
        <a className="brand" href="#">◈ taskflow<span>.</span></a>
        <small>PRIVATE TASK SCHEDULER</small>
      </header>

      <section className="auth-card">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>{mode === 'login' ? 'Welcome back.' : 'Make it yours.'}</h1>
        <p className="auth-copy">
          {mode === 'login'
            ? 'Sign in to pick up right where you left off.'
            : 'Create an account to keep your schedule private.'}
        </p>

        <form onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength="8"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {mode === 'register' && (
            <small className="password-hint">
              Use at least 8 characters (maximum 72 bytes).
            </small>
          )}

          {error && (
            <p className="error auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="primary auth-submit" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}{' '}
            ↗
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'New to TaskFlow?' : 'Already have an account?'}
          <button
            type="button"
            onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </section>

      <p className="auth-note">Your schedule belongs to you.</p>
    </main>
  );
}
