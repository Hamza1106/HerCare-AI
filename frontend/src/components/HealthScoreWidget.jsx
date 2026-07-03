import React, { useState, useEffect, useRef } from 'react';
import { Activity, ArrowRight, RefreshCw, TrendingUp } from 'lucide-react';
import { t } from '../i18n';

// Score/top-risk are now computed and persisted by the Flask backend
// (see app.py: compute_health_score / get_top_risk, saved via
// user_store.save_assessment) so this widget just displays what the
// backend already calculated instead of recomputing it from localStorage.

function getScoreLabel(score, lang) {
  if (score >= 80) return t('excellent', lang);
  if (score >= 60) return t('good', lang);
  if (score >= 40) return t('fair', lang);
  return t('needsAttention', lang);
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return '#5EC8C4';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

/** Animated SVG ring */
function ScoreRing({ score, color, size = 120 }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setAnimated(Math.round(score * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  const offset = circ - (animated / 100) * circ;

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--bg-tertiary)" strokeWidth="10"
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke 0.3s' }}
      />
      {/* Score text */}
      <text
        x={size / 2} y={size / 2 - 6}
        textAnchor="middle" dominantBaseline="middle"
        fill={color}
        style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)' }}
      >
        {animated}
      </text>
      <text
        x={size / 2} y={size / 2 + 16}
        textAnchor="middle" dominantBaseline="middle"
        fill="var(--text-muted)"
        style={{ fontSize: '10px', fontFamily: 'var(--font-body)' }}
      >
        / 100
      </text>
    </svg>
  );
}

export default function HealthScoreWidget({ setActiveView, lang = 'en', backendUrl, userEmail }) {
  const [score, setScore] = useState(null);
  const [topRisk, setTopRisk] = useState(null);
  const [assessedAt, setAssessedAt] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFromBackend() {
      if (!userEmail) return;
      try {
        const res = await fetch(`${backendUrl}/api/user/${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error('Failed to load user data');
        const data = await res.json();
        if (cancelled) return;

        const assessment = data.user?.last_assessment;
        if (assessment) {
          // health_score / top_risk_name are computed and saved by the
          // backend itself (see app.py assess-health + user_store.py), so
          // this widget no longer needs to recompute them client-side from
          // whatever happened to be sitting in localStorage.
          setScore(assessment.health_score ?? null);
          setTopRisk(assessment.results
            ? Object.values(assessment.results).reduce((max, r) =>
                (!max || (r.risk_score || 0) > (max.risk_score || 0)) ? r : max, null)
            : null);
          setAssessedAt(assessment.timestamp ? new Date(assessment.timestamp) : null);
        } else {
          setScore(null);
          setTopRisk(null);
          setAssessedAt(null);
        }
        setLoadFailed(false);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    }

    loadFromBackend();
    return () => { cancelled = true; };
  }, [userEmail, backendUrl]);

  const color = score !== null ? getScoreColor(score) : 'var(--text-muted)';
  const label = score !== null ? getScoreLabel(score, lang) : '';

  const formatDate = (d) => {
    if (!d) return '';
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="card span-4 dashboard-tilt-card" style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '240px',
      borderTop: `3px solid ${color}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: `${color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={18} color={color} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {t('healthScore', lang)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {t('healthScoreSubtitle', lang)}
            </div>
          </div>
        </div>
        <TrendingUp size={16} color="var(--text-muted)" />
      </div>

      {score !== null ? (
        <>
          {/* Score ring + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
            <ScoreRing score={score} color={color} size={110} />

            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-block', padding: '3px 12px', borderRadius: '999px',
                background: `${color}20`, color, fontSize: '0.78rem', fontWeight: 700,
                marginBottom: '0.6rem',
              }}>
                {label}
              </div>

              {topRisk && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {t('topRisk', lang)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {topRisk.name}
                  </div>
                  <div style={{
                    height: '4px', borderRadius: '2px', marginTop: '4px',
                    background: 'var(--bg-tertiary)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${topRisk.risk_score}%`,
                      background: getScoreColor(100 - topRisk.risk_score),
                      borderRadius: '2px',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              )}

              {assessedAt && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {t('lastAssessed', lang)}: {formatDate(assessedAt)}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.45rem 0.5rem' }}
              onClick={() => setActiveView('risk-assessment')}
            >
              <RefreshCw size={13} /> {t('runAssessment', lang)}
            </button>
          </div>
        </>
      ) : (
        /* Empty state */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.75rem',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={24} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {t('healthScoreEmpty', lang)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('healthScoreEmptyHint', lang)}
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            onClick={() => setActiveView('risk-assessment')}
          >
            {t('runAssessment', lang)} <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}