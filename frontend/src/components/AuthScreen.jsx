import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, UserPlus, LogIn, AlertCircle, CheckCircle, Lock, ArrowLeft, Heart } from 'lucide-react';

const BACKEND_URL = "http://localhost:5000";

// Session (who is currently logged in) still lives in localStorage — that's
// fine, it's just "remember me" for this browser. The actual account data
// (name/email/password) and health assessment history now live on the
// backend in data/users.json, so they survive across browsers/devices and
// don't disappear when localStorage is cleared.
export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('hercare_session') || 'null'); }
  catch { return null; }
}
export function logout() { localStorage.removeItem('hercare_session'); }

export default function AuthScreen({ onAuth, onBack, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setError(''); };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    const { name, email, password, confirm } = form;

    if (mode === 'register') {
      if (!name.trim())         return setError('Please enter your name.');
      if (!email.includes('@')) return setError('Please enter a valid email.');
      if (password.length < 6)  return setError('Password must be at least 6 characters.');
      if (password !== confirm) return setError('Passwords do not match.');

      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) { setLoading(false); return setError(data.error || 'Could not create account.'); }

        const session = { name: data.user.name, email: data.user.email, loggedInAt: Date.now() };
        localStorage.setItem('hercare_session', JSON.stringify(session));
        localStorage.setItem('user_name', data.user.name);
        setLoading(false);
        setSuccess('Account created! Welcome to HerCare AI');
        setTimeout(() => onAuth(session), 800);
      } catch (err) {
        setLoading(false);
        setError('Could not connect to the backend. Please make sure the Flask server is running.');
      }
    } else {
      if (!email.trim())    return setError('Please enter your email.');
      if (!password.trim()) return setError('Please enter your password.');

      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) { setLoading(false); return setError(data.error || 'Incorrect email or password.'); }

        const session = { name: data.user.name, email: data.user.email, loggedInAt: Date.now() };
        localStorage.setItem('hercare_session', JSON.stringify(session));
        localStorage.setItem('user_name', data.user.name);
        setLoading(false);
        onAuth(session);
      } catch (err) {
        setLoading(false);
        setError('Could not connect to the backend. Please make sure the Flask server is running.');
      }
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Blue background blobs — no purple */}
      <div style={{
        position: 'absolute', top: '-120px', left: '-120px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,141,239,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', right: '-100px',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(94,200,196,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
              fontFamily: 'var(--font-display)', marginBottom: '1rem', padding: 0,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={15} /> Back to home
          </button>
        )}

      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(91,141,239,0.15)',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(91,141,239,0.18)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header — blue to teal gradient */}
        <div style={{
          padding: '2rem 2rem 1.5rem',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          textAlign: 'center',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.75rem',
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '1.5rem', color: '#fff', margin: '0 0 0.25rem',
          }}>HerCare AI</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', margin: 0 }}>
            Women's Health Intelligence Platform
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: 'flex', background: 'var(--bg-tertiary)',
          margin: '1.5rem 1.5rem 0', borderRadius: '10px', padding: '4px', gap: '4px',
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess(''); setForm({ name: '', email: '', password: '', confirm: '' }); }}
              style={{
                flex: 1, padding: '0.55rem', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem',
                transition: 'all 0.18s',
                background: mode === m ? 'var(--bg-secondary)' : 'transparent',
                color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 2px 8px rgba(91,141,239,0.15)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {mode === 'register' && (
              <Field label="Full Name" value={form.name} onChange={set('name')}
                placeholder="e.g. Ali Khan" onKeyDown={handleKeyDown} />
            )}
            <Field label="Email Address" type="email" value={form.email} onChange={set('email')}
              placeholder="your.email@example.com" onKeyDown={handleKeyDown} />
            <Field
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={form.password} onChange={set('password')}
              placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
              onKeyDown={handleKeyDown}
              suffix={
                <button onClick={() => setShowPass(s => !s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                  tabIndex={-1}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            {mode === 'register' && (
              <Field label="Confirm Password" type={showPass ? 'text' : 'password'}
                value={form.confirm} onChange={set('confirm')}
                placeholder="Re-enter password" onKeyDown={handleKeyDown} />
            )}

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 0.85rem', borderRadius: '8px',
                background: 'rgba(232,93,117,0.10)', border: '1px solid rgba(232,93,117,0.25)',
                color: '#E85D75', fontSize: '0.8rem',
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />{error}
              </div>
            )}
            {success && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 0.85rem', borderRadius: '8px',
                background: 'rgba(94,200,196,0.12)', border: '1px solid rgba(94,200,196,0.30)',
                color: '#5EC8C4', fontSize: '0.8rem',
              }}>
                <CheckCircle size={14} style={{ flexShrink: 0 }} />{success}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} className="btn btn-primary"
              style={{ justifyContent: 'center', marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  {mode === 'register' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : mode === 'login' ? (
                <><LogIn size={16} /> Sign In</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>

            {mode === 'login' && (
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => { setForm({ name: '', email: 'demo@hercare.ai', password: 'demo123', confirm: '' }); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'underline' }}>
                  Use demo account
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0.85rem 1.5rem 1.25rem', textAlign: 'center', borderTop: '1px solid rgba(91,141,239,0.10)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            <Lock size={11} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            Your data stays on your device. HerCare AI does not store health data on external servers.
          </p>
        </div>
      </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', onKeyDown, suffix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--bg-tertiary)',
        border: `1px solid ${focused ? 'var(--primary)' : 'rgba(91,141,239,0.18)'}`,
        borderRadius: '10px', transition: 'border-color 0.15s',
        boxShadow: focused ? '0 0 0 3px var(--primary-glow)' : 'none',
      }}>
        <input
          type={type} value={value} onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, padding: '0.7rem 0.9rem',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'var(--font-body)',
          }}
        />
        {suffix && <div style={{ paddingRight: '0.75rem' }}>{suffix}</div>}
      </div>
    </div>
  );
}