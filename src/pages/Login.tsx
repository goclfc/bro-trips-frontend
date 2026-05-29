import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { api, type User } from '../api';
import { useAuth } from '../auth';

type Mode = 'signin' | 'register';

const HAS_GOOGLE = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body =
        mode === 'register' ? { email, password, name } : { email, password };
      const path = mode === 'register' ? '/auth/register' : '/auth/login';
      const { token, user } = await api<{ token: string; user: User }>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      signIn(token, user);
      nav('/', { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <h1>bro-trips</h1>
      <p className="muted">Share the daily commute with your crew.</p>

      <div className="card" style={{ width: 320 }}>
        <div className="row" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={mode === 'signin' ? '' : 'secondary'}
            onClick={() => {
              setMode('signin');
              setErr(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'register' ? '' : 'secondary'}
            onClick={() => {
              setMode('register');
              setErr(null);
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div style={{ marginBottom: 8 }}>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'register' ? 8 : 1}
              required
            />
            {mode === 'register' && <div className="muted">At least 8 characters.</div>}
          </div>
          <button disabled={busy} style={{ width: '100%' }}>
            {mode === 'register' ? 'Create account' : 'Sign in'}
          </button>
          {err && <div className="error">{err}</div>}
        </form>

        {HAS_GOOGLE && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                margin: '16px 0',
                color: '#9ca3af',
                fontSize: 12,
              }}
            >
              <hr style={{ flex: 1, border: 0, borderTop: '1px solid #e5e7eb' }} />
              OR
              <hr style={{ flex: 1, border: 0, borderTop: '1px solid #e5e7eb' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={async (resp) => {
                  setErr(null);
                  try {
                    const { token, user } = await api<{ token: string; user: User }>(
                      '/auth/google',
                      {
                        method: 'POST',
                        body: JSON.stringify({ credential: resp.credential }),
                      },
                    );
                    signIn(token, user);
                    nav('/', { replace: true });
                  } catch (e) {
                    setErr((e as Error).message);
                  }
                }}
                onError={() => setErr('Google sign-in failed')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
