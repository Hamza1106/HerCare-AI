import React, { useState, useEffect } from 'react';
import { Search, Info, CheckCircle, ChevronRight, Stethoscope } from 'lucide-react';
import { t } from '../i18n';

export default function SymptomChecker({ backendUrl, lang = 'en' }) {
  const [conditions, setConditions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [hoveredKey, setHoveredKey] = useState(null);

  // Re-fetch whenever language changes so all condition text is in the right language
  useEffect(() => {
    async function loadConditions() {
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/conditions?lang=${lang}`);
        const data = await res.json();
        setConditions(data);
        setSelectedCondition(prev => (prev && data[prev]) ? prev : Object.keys(data)[0] || null);
      } catch (err) {
        console.error('Failed to load conditions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConditions();
  }, [backendUrl, lang]);

  const filteredKeys = Object.keys(conditions).filter(key => {
    const c = conditions[key];
    const q = searchTerm.toLowerCase();
    return c.name?.toLowerCase().includes(q) ||
      c.symptoms?.some(s => s.toLowerCase().includes(q)) ||
      c.explanation?.toLowerCase().includes(q);
  });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      {t('loadingConditions', lang)}
    </div>
  );

  const selected = selectedCondition ? conditions[selectedCondition] : null;
  const urgencyClass = selected?.urgency?.toLowerCase().includes('urgent') || selected?.urgency?.toLowerCase().includes('foran')
    ? 'high'
    : (selected?.urgency?.toLowerCase().includes('soon') || selected?.urgency?.toLowerCase().includes('jald'))
      ? 'medium' : 'low';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder={t('searchPlaceholder', lang)}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="dashboard-grid">
        {/* Left: conditions list */}
        <div className="card span-4" style={{ height: 'fit-content', maxHeight: '550px', overflowY: 'auto', padding: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', padding: '0 0.5rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem', color: 'var(--primary)' }}>
            {t('conditionsLabel', lang)} ({filteredKeys.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {filteredKeys.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>
                {t('noConditionsMatch', lang)}
              </span>
            ) : filteredKeys.map(key => {
              const cond = conditions[key];
              const isActive = selectedCondition === key;
              const isHovered = hoveredKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCondition(key)}
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{
                    width: '100%', border: 'none', textAlign: 'left',
                    padding: '0.85rem 1rem', borderRadius: '10px', cursor: 'pointer',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(91,141,239,0.16), rgba(94,200,196,0.08))'
                      : isHovered ? 'var(--bg-tertiary)' : 'transparent',
                    borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                    paddingLeft: isActive ? 'calc(1rem - 4px)' : isHovered ? 'calc(1rem - 2px)' : '1rem',
                    transform: isHovered && !isActive ? 'translateX(3px)' : 'translateX(0)',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: isActive ? '0 4px 14px rgba(91,141,239,0.12)' : 'none',
                  }}
                >
                  <strong style={{ fontSize: '0.9rem', color: isActive ? 'var(--primary)' : 'var(--text-primary)', display: 'block', transition: 'color 0.2s' }}>
                    {cond.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {cond.symptoms?.slice(0, 3).join(', ')}...
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: detail */}
        <div className="span-8">
          {selected ? (
            <div className="card" style={{ borderLeft: '4px solid var(--primary)', minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(91,141,239,0.12)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0,
                  }}>
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '800' }}>
                      {selected.name}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('clinicalInfo', lang)}</span>
                  </div>
                </div>
                <span
                  className={`badge ${urgencyClass}`}
                  style={{ cursor: 'default', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {selected.urgency}
                </span>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={16} /> {t('urduExplanation', lang)}
                </h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.7', borderLeft: '3px solid var(--secondary)', paddingLeft: '0.85rem' }}>
                  {selected.explanation}
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                  {t('associatedSymptoms', lang)}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
                  {selected.symptoms?.map(sym => (
                    <div
                      key={sym}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem',
                        color: 'var(--text-secondary)', padding: '0.4rem 0.6rem', borderRadius: '8px',
                        transition: 'background 0.15s, transform 0.15s', cursor: 'default',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,141,239,0.06)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                      <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                      <span>{sym}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="two-col-grid" style={{ gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--bg-tertiary)', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,141,239,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>{t('urgencyDetails', lang)}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.urgency_desc}</span>
                </div>
                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--bg-tertiary)', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,141,239,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>{t('lifestyleTips', lang)}</span>
                  <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                    {selected.lifestyle_tips?.map((tip, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="disclaimer-box" style={{ marginTop: '2rem' }}>
                {t('symptomDisclaimer', lang)}
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
              {t('selectCondition', lang)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
