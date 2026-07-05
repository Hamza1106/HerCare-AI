import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, ChevronDown, ChevronUp, ArrowRight, Activity } from 'lucide-react';
import { t } from '../i18n';

function getScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return '#5EC8C4';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export default function AssessmentHistory({ setActiveView, lang = 'en', backendUrl, userEmail }) {
  const [history, setHistory] = useState([]); // oldest -> newest, as stored
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/user/${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error('Failed to load user data');
        const data = await res.json();
        if (cancelled) return;
        setHistory(data.user?.assessments || []);
        setLoadFailed(false);
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userEmail, backendUrl]);

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Show newest first for readability
  const rows = [...history].reverse();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div className="card span-12" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">
          <ClipboardList />
          <span>{t('assessmentHistoryTitle', lang)}</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {t('assessmentHistorySubtitle', lang)}
        </p>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Activity size={28} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>Loading...</p>
        </div>
      )}

      {!loading && loadFailed && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', borderLeft: '4px solid var(--danger)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Couldn't load your history. Make sure the backend is running and try again.
          </p>
        </div>
      )}

      {!loading && !loadFailed && rows.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="upload-icon" style={{ margin: '0 auto 1.5rem auto' }}>
            <ClipboardList size={32} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {t('historyEmptyTitle', lang)}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
            {t('historyEmptyHint', lang)}
          </p>
          <button className="btn btn-primary" style={{ margin: '0 auto', display: 'inline-flex' }} onClick={() => setActiveView('risk-assessment')}>
            {t('runAssessment', lang)} <ArrowRight size={14} />
          </button>
        </div>
      )}

      {!loading && !loadFailed && rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rows.map((entry, idx) => {
            const color = getScoreColor(entry.health_score ?? 0);
            const isExpanded = expandedIdx === idx;
            const conditionEntries = entry.results ? Object.entries(entry.results) : [];

            return (
              <div key={idx} className="card" style={{ borderLeft: `4px solid ${color}`, padding: '1rem 1.25rem' }}>
                <div
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: '0.75rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('historyScore', lang)}</div>
                      <div style={{ fontWeight: 700, color, fontSize: '1rem' }}>{entry.health_score ?? '—'}/100</div>
                    </div>

                    {entry.top_risk_name && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('historyTopRisk', lang)}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{entry.top_risk_name}</div>
                      </div>
                    )}

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('historyBmi', lang)}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{entry.bmi ?? '—'}</div>
                    </div>

                    {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                  </div>
                </div>

                {isExpanded && conditionEntries.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {conditionEntries.map(([condId, cond]) => (
                      <div key={condId} style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '0.75rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{cond.name || condId}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {t('historyTopRisk', lang)}: {cond.risk_level || '—'} ({cond.risk_score ?? 0}%)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
