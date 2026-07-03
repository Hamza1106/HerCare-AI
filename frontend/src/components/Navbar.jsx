import React from 'react';
import { Heart, User } from 'lucide-react';
import { t } from '../i18n';

export default function Navbar({ title, subtitle, language, setLanguage, user, onToggleSidebar, sidebarOpen }) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('goodMorning', language);
    if (h < 17) return t('goodAfternoon', language);
    return t('goodEvening', language);
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
<div className="page-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="lang-switch">
          <button
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
          <button
            className={`lang-btn ${language === 'ur' ? 'active' : ''}`}
            onClick={() => setLanguage('ur')}
          >
            Roman Urdu
          </button>
        </div>

        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.85rem', borderRadius: '999px',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
          }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <User size={13} color="#fff" />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {greeting() },{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{user.name.split(' ')[0]}</strong>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
          <Heart size={20} fill="var(--accent)" />
          <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>SIMPACT '26</span>
        </div>
      </div>
    </header>
  );
}