import React, { useState, useEffect } from 'react';
import { ClipboardList, FileText, HeartPulse, Sparkles, BookOpen, Award, ArrowRight, ChevronRight } from 'lucide-react';
import { t } from '../i18n';
import HealthScoreWidget from './HealthScoreWidget';

export default function DashboardView({ setActiveView, backendUrl, lang = 'en', userEmail }) {
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || 'Guest Patient');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [healthTip, setHealthTip] = useState('');

  useEffect(() => {
    const tips = t('tips', lang);
    setHealthTip(tips[Math.floor(Math.random() * tips.length)]);
  }, [lang]);

  // 3D tilt — attach after render so DOM cards exist
  useEffect(() => {
    const MAX_TILT = 5;
    const cards = document.querySelectorAll('.dashboard-tilt-card');

    function onEnter(e) { e.currentTarget.style.animationPlayState = 'paused'; }

    function onMove(e) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ry = ((x - rect.width / 2) / (rect.width / 2)) * MAX_TILT;
      const rx = -((y - rect.height / 2) / (rect.height / 2)) * MAX_TILT;
      card.style.setProperty('--card-rx', rx.toFixed(2) + 'deg');
      card.style.setProperty('--card-ry', ry.toFixed(2) + 'deg');
      card.style.setProperty('--card-gx', ((x / rect.width) * 100).toFixed(1) + '%');
      card.style.setProperty('--card-gy', ((y / rect.height) * 100).toFixed(1) + '%');
      card.style.transition = 'box-shadow 0.35s ease, border-color 0.25s ease';
    }

    function onLeave(e) {
      const card = e.currentTarget;
      card.style.setProperty('--card-rx', '0deg');
      card.style.setProperty('--card-ry', '0deg');
      card.style.setProperty('--card-gx', '50%');
      card.style.setProperty('--card-gy', '50%');
      card.style.transition = 'box-shadow 0.35s ease, border-color 0.25s ease, transform 0.55s cubic-bezier(0.2,0.7,0.3,1)';
      e.currentTarget.style.animationPlayState = '';
    }

    cards.forEach(card => {
      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });

    return () => {
      cards.forEach(card => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem('user_name', trimmed);
    }
    setIsEditingName(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Welcome Header — blue left border */}
      <div className="card span-12" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(91,141,239,0.07) 100%)',
        borderLeft: '4px solid var(--primary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('welcomeBack', lang)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    style={{ padding: '4px 10px', fontSize: '1.25rem', width: '200px' }}
                  />
                  <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={handleSaveName}>
                    {t('save', lang)}
                  </button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '800' }}>
                    {t('dashboardGreeting', lang)}, {userName}!
                  </h2>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                    onClick={() => { setNameInput(userName); setIsEditingName(true); }}
                  >
                    {t('editName', lang)}
                  </button>
                </>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {t('dashboardSubtitle', lang)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: 0 }}>
            <Award size={36} color="var(--primary)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', minWidth: 0 }}>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>{t('platformSubmission', lang)}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600', wordBreak: 'break-word' }}>{t('platformOrg', lang)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main widgets grid */}
      <div className="dashboard-grid">

        {/* Health Score Widget */}
        <HealthScoreWidget setActiveView={setActiveView} lang={lang} backendUrl={backendUrl} userEmail={userEmail} />

        {/* Quick action: Risk Assessment */}
        <div className="card span-4 dashboard-tilt-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '240px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            backgroundColor: 'rgba(91,141,239,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', marginBottom: '1.25rem'
          }}>
            <ClipboardList size={22} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {t('riskScreening', lang)}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1 }}>
            {t('riskScreeningDesc', lang)}
          </p>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => setActiveView('risk-assessment')}>
            {t('startScreening', lang)} <ArrowRight size={14} />
          </button>
        </div>

        {/* Quick action: Report Explainer */}
        <div className="card span-4 dashboard-tilt-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '240px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            backgroundColor: 'rgba(94,200,196,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--secondary)', marginBottom: '1.25rem'
          }}>
            <FileText size={22} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {t('reportExplainer', lang)}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1 }}>
            {t('reportExplainerDesc', lang)}
          </p>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => setActiveView('report-explainer')}>
            {t('explainReport', lang)} <ArrowRight size={14} />
          </button>
        </div>

        {/* Tip of the day */}
        <div className="card span-8 dashboard-tilt-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{
            padding: '0.75rem', borderRadius: '12px',
            backgroundColor: 'rgba(91,141,239,0.10)',
            color: 'var(--primary)', flexShrink: 0
          }}>
            <Sparkles size={28} />
          </div>
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {t('dailyTip', lang)} 
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', lineHeight: '1.5' }}>
              "{healthTip}"
            </p>
          </div>
        </div>

        {/* Recovery Assistant */}
        <div className="card span-4 dashboard-tilt-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            backgroundColor: 'rgba(76,175,80,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--success)', marginBottom: '1.25rem'
          }}>
            <HeartPulse size={22} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {t('recoveryAssistant', lang)}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1 }}>
            {t('recoveryAssistantDesc', lang)}
          </p>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => setActiveView('recovery-assistant')}>
            {t('trackRecovery', lang)} <ArrowRight size={14} />
          </button>
        </div>

        {/* Health Library shortcut */}
        <div className="card span-4 dashboard-tilt-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setActiveView('health-library')}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(91,141,239,0.10)', color: 'var(--primary)' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: '700' }}>
                {t('healthLibrary', lang)}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('browseLibrary', lang)}
              </span>
            </div>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </div>
      </div>

      <div className="disclaimer-box" style={{ marginTop: '2rem' }}>
        {t('disclaimer', lang)}
      </div>
    </div>
  );
}
