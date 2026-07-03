import React, { useState } from 'react';
import { Upload, Activity, AlertOctagon, Heart, Calendar, Eye, HelpCircle, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { t } from '../i18n';

export default function SymptomLog({ backendUrl, geminiKey , lang = 'en' }) {
  const [dischargeFile, setDischargeFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [recoveryPlan, setRecoveryPlan] = useState(null);

  // Daily check-in logging fields
  const [painLevel, setPainLevel] = useState(3);
  const [feverTemp, setFeverTemp] = useState(37.0);
  const [fatigueLevel, setFatigueLevel] = useState(2);
  const [woundStatus, setWoundStatus] = useState('normal');
  const [daysFever, setDaysFever] = useState(0);

  const [logging, setLogging] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  
  // Track tasks completed by patient
  const [completedTasks, setCompletedTasks] = useState({});

  const handleDischargeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDischargeFile(file);
    setParsing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const headers = {};
      if (geminiKey) {
        headers['Authorization'] = `Bearer ${geminiKey}`;
      }
      
      const res = await fetch(`${backendUrl}/api/discharge-summary`, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      
      const data = await res.json();
      setRecoveryPlan(data);
      
      // Initialize empty checklist
      const initialTasks = {};
      data.medications.forEach((med, idx) => {
        initialTasks[`med_${idx}`] = false;
      });
      setCompletedTasks(initialTasks);
      
    } catch (err) {
      console.error("Error parsing discharge summary:", err);
      alert("Failed to parse discharge summary. Ensure backend is running.");
    } finally {
      setParsing(false);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    setLogging(true);
    try {
      const payload = {
        pain_level: painLevel,
        fever_temp: feverTemp,
        fatigue_level: fatigueLevel,
        wound_status: woundStatus,
        days_with_fever: daysFever
      };
      
      const res = await fetch(`${backendUrl}/api/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      setCheckinResult(data);
      
      // Scroll to result
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (err) {
      console.error("Error logging symptoms:", err);
      alert("Error submitting check-in.");
    } finally {
      setLogging(false);
    }
  };

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {!recoveryPlan ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="upload-icon" style={{ margin: '0 auto 1.5rem auto' }}>
            <Activity size={32} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            {t('recoveryAssistantLabel', lang)}
            
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem auto', fontSize: '0.95rem' }}>
            {t('recoveryAssistantDes', lang)}
          </p>

          <label className="btn btn-primary" style={{ margin: '0 auto', display: 'inline-flex', width: 'fit-content' }}>
            <Upload size={18} />
            {parsing ? "Parsing Recovery Guidelines..." : t('recoveryAssistantBtn', lang) }
            <input 
              type="file" 
              style={{ display: 'none' }} 
              onChange={handleDischargeUpload}
              accept="image/*,.pdf"
              disabled={parsing}
            />
          </label>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Recovery Overview Header */}
          <div className="card span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary)' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>{t('recoveryForm', lang) }</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{recoveryPlan.procedure_name}</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('followUp', lang)}</span>
                <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1rem' }}>
                  <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {recoveryPlan.follow_up_date}
                </span>
              </div>
              
              <button className="btn btn-secondary" onClick={() => setRecoveryPlan(null)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                {t('changeSummary' , lang)}
              </button>
            </div>
          </div>

          {/* Red Flag Alerts (Dynamic from check-in logs) */}
          {checkinResult && checkinResult.is_red_flag_alert && (
            <div className="alert-banner span-12" style={{ animation: 'pulse 2s infinite' }}>
              <ShieldAlert size={36} />
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.25rem', fontWeight: '700' }}>
                  {t('redflagalter', lang)}
                </h3>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  {checkinResult.alerts.map((alert, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{alert}</li>
                  ))}
                </ul>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong>{t('nextSteps', lang)}:</strong>
                  <ol style={{ paddingLeft: '1.2rem', marginTop: '0.25rem' }}>
                    {checkinResult.next_steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}

          {checkinResult && !checkinResult.is_red_flag_alert && (
            <div className="card span-12" style={{ borderLeft: '4px solid var(--success)', backgroundColor: 'var(--success-glow)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <CheckCircle2 color="var(--success)" size={24} />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: '700' }}>{t('onTrack', lang)}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{checkinResult.status_summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Column Left: Active Medication Timeline & Checklist */}
          <div className="card span-7">
            <div className="card-title">
              <Calendar />
              <span>{t('recovertRoutine', lang)}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {t('recoverytick', lang)}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recoveryPlan.medications.map((med, idx) => {
                const taskId = `med_${idx}`;
                const isCompleted = completedTasks[taskId];
                return (
                  <div 
                    key={idx} 
                    className={`checkbox-tile ${isCompleted ? 'checked' : ''}`}
                    onClick={() => toggleTask(taskId)}
                    style={{ justifyContent: 'space-between', padding: '1rem' }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div className="custom-check"></div>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{med.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {med.purpose} • {med.dosage}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--primary)', fontWeight: '600' }}>
                      {med.timing}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Restrictions list */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {t('rules', lang)}
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Dietary Advice:</span>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1rem' }}>
                    {recoveryPlan.dietary_restrictions.map((r, idx) => <li key={idx}>{r}</li>)}
                  </ul>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Avoid Activities:</span>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1rem' }}>
                    {recoveryPlan.activities_to_avoid.map((a, idx) => <li key={idx}>{a}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Column Right: Daily Check-in logger */}
          <div className="card span-5">
            <div className="card-title">
              <Activity />
              <span>{t('checkin', lang)}</span>
            </div>
            
            <form onSubmit={handleCheckinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>{t('scale', lang)}: {painLevel}/10</label>
                <div className="range-slider">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('nopain', lang)}</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={painLevel} 
                    onChange={(e) => setPainLevel(Number(e.target.value))} 
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 'bold' }}>{t('severe', lang)}</span>
                </div>
              </div>

              <div className="form-group">
                <label>{t('feverTemp', lang)}: {feverTemp}°C ({((feverTemp * 9/5) + 32).toFixed(1)}°F)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Thermometer size={20} color="var(--primary)" />
                  <input 
                    type="number" 
                    step="0.1" 
                    min="35" 
                    max="42" 
                    className="form-control" 
                    value={feverTemp}
                    onChange={(e) => setFeverTemp(Number(e.target.value))}
                  />
                </div>
                <div className="fever-btn-group">
                  <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setFeverTemp(37.0)}>Normal (37.0°C)</button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setFeverTemp(38.5)}>Fever (38.5°C)</button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setFeverTemp(39.5)}>High Fever (39.5°C)</button>
                </div>
              </div>

              {feverTemp >= 37.8 && (
                <div className="form-group">
                  <label>{t('consecutiveDays', lang)}</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={daysFever} 
                    onChange={(e) => setDaysFever(Number(e.target.value))} 
                    min="0"
                    max="14"
                  />
                </div>
              )}

              <div className="form-group">
                <label>{t('fatig', lang)}: {fatigueLevel}/10</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={fatigueLevel} 
                  onChange={(e) => setFatigueLevel(Number(e.target.value))} 
                />
              </div>

              <div className="form-group">
                <label>{t('status', lang)} (Zakhmo ka haal)</label>
                <select 
                  className="form-control" 
                  value={woundStatus} 
                  onChange={(e) => setWoundStatus(e.target.value)}
                >
                    <option value="normal">{t('woundNormal', lang)}</option>
                    <option value="redness">{t('woundRedness', lang)}</option>
                    <option value="bleeding">{t('woundBleeding', lang)}</option>
                    <option value="pus">{t('woundPus', lang)}</option>
                    <option value="open">{t('woundOpen', lang)}</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={logging}>
                {logging ? t('analyze', lang) : t('log', lang)}
              </button>
            </form>
          </div>

          {/* Warning signs checklist */}
          <div className="card span-12" style={{ borderLeft: '4px solid var(--danger)' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertOctagon size={18} />
              {t('redflag', lang)}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {t('reddec', lang)}
            </p>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.25rem' }}>
              {recoveryPlan.warning_signs.map((sign, idx) => (
                <li key={idx}>{sign}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
