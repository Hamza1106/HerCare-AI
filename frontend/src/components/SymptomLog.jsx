import React, { useState, useEffect, useRef } from 'react';
import { Upload, Activity, AlertOctagon, Calendar, Thermometer, ShieldAlert, CheckCircle2, Bell, BellOff, BellRing, X } from 'lucide-react';
import { t } from '../i18n';
import { renderInlineMarkdown } from '../utils/markdown';

/** "14:00" -> "2:00 PM" */
function formatTime12(hhmm) {
  const [h, m] = (hhmm || '').split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Finds the soonest upcoming reminder across all medications (today, or
 * tomorrow if every reminder for today has already passed). */
function getNextReminder(medications, lang) {
  if (!medications || medications.length === 0) return null;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let best = null;
  medications.forEach(med => {
    (med.reminder_times || []).forEach(time => {
      const [h, m] = time.split(':').map(Number);
      const mins = h * 60 + m;
      const isTomorrow = mins < nowMinutes;
      const diff = isTomorrow ? (mins + 1440) - nowMinutes : mins - nowMinutes;
      if (!best || diff < best.diff) {
        best = { medName: med.name, time, diff, isTomorrow };
      }
    });
  });
  if (!best) return null;
  return { ...best, label: best.isTomorrow ? t('tomorrowLabel', lang) : t('todayLabel', lang) };
}

export default function SymptomLog({ backendUrl, geminiKey, lang = 'en', userEmail }) {
  const [dischargeFile, setDischargeFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [recoveryPlan, setRecoveryPlan] = useState(null);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Daily check-in logging fields
  const [painLevel, setPainLevel] = useState(3);
  const [feverTemp, setFeverTemp] = useState(37.0);
  const [fatigueLevel, setFatigueLevel] = useState(2);
  const [woundStatus, setWoundStatus] = useState('normal');
  const [daysFever, setDaysFever] = useState(0);

  const [logging, setLogging] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);

  // Track tasks completed by patient (persisted to backend when logged in)
  const [completedTasks, setCompletedTasks] = useState({});

  // Dose reminders / notifications
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [activeReminder, setActiveReminder] = useState(null); // banner for a just-fired reminder
  const firedRef = useRef(new Set()); // avoids re-notifying within the same minute/day

  // ── Load the last-saved recovery plan (if any) on mount / login ─────────
  useEffect(() => {
    let cancelled = false;
    async function loadSaved() {
      if (!userEmail) { setLoadingSaved(false); return; }
      setLoadingSaved(true);
      try {
        const res = await fetch(`${backendUrl}/api/recovery/${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.recovery && data.recovery.plan) {
          setRecoveryPlan(data.recovery.plan);
          setCompletedTasks(data.recovery.completed_tasks || {});
        }
      } catch (err) {
        console.error('Could not load saved recovery plan:', err);
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    }
    loadSaved();
    return () => { cancelled = true; };
  }, [userEmail, backendUrl]);

  // ── Check every 30s for a medication reminder due right now ──────────────
  useEffect(() => {
    if (!recoveryPlan?.medications?.length) return;

    const checkReminders = () => {
      const now = new Date();
      const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateKey = now.toDateString();

      recoveryPlan.medications.forEach((med, idx) => {
        (med.reminder_times || []).forEach(time => {
          if (time !== current) return;
          const fireKey = `${dateKey}|${idx}|${time}`;
          if (firedRef.current.has(fireKey)) return;
          firedRef.current.add(fireKey);

          if (notifPermission === 'granted' && typeof Notification !== 'undefined') {
            new Notification(`💊 ${t('doseReminderTitle', lang)}`, {
              body: `${med.name} — ${med.dosage} (${med.purpose})`,
            });
          }
          setActiveReminder({ idx, medName: med.name, dosage: med.dosage, purpose: med.purpose });
        });
      });
    };

    checkReminders(); // catch a reminder due right when this view opens
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [recoveryPlan, notifPermission, lang]);

  const requestNotifPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const persistTasks = async (updatedTasks) => {
    if (!userEmail) return;
    try {
      await fetch(`${backendUrl}/api/recovery/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, completed_tasks: updatedTasks }),
      });
    } catch (err) {
      console.error('Could not save checklist progress:', err);
    }
  };

  const handleDischargeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDischargeFile(file);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userEmail) formData.append('email', userEmail);

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

      if (!res.ok || data.error) {
        console.error("Discharge summary parse failed:", data.error, data.details);
        alert(data.error || "Failed to parse discharge summary. Please try again.");
        return;
      }

      setRecoveryPlan(data);

      // Fresh plan → fresh checklist
      const initialTasks = {};
      (data.medications || []).forEach((med, idx) => {
        initialTasks[`med_${idx}`] = false;
      });
      setCompletedTasks(initialTasks);
      firedRef.current = new Set();
      setActiveReminder(null);
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
    setCompletedTasks(prev => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      persistTasks(updated);
      return updated;
    });
  };

  const handleChangeSummary = async () => {
    if (userEmail) {
      try {
        await fetch(`${backendUrl}/api/recovery/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
      } catch (err) {
        console.error('Could not clear saved recovery plan:', err);
      }
    }
    setRecoveryPlan(null);
    setCompletedTasks({});
    setActiveReminder(null);
    firedRef.current = new Set();
  };

  const totalTasks = recoveryPlan ? recoveryPlan.medications.length : 0;
  const doneTasks = Object.values(completedTasks).filter(Boolean).length;
  const nextReminder = recoveryPlan ? getNextReminder(recoveryPlan.medications, lang) : null;

  if (loadingSaved) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', textAlign: 'center', padding: '4rem' }}>
        <Activity size={28} color="var(--text-muted)" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {!recoveryPlan ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="upload-icon" style={{ margin: '0 auto 1.5rem auto' }}>
            <Activity size={32} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            {t('recoveryAssistantLabel', lang)}

          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem auto', fontSize: '0.95rem' }}>
            {renderInlineMarkdown(t('recoveryAssistantDes', lang))}
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
          <div className="card span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>{t('recoveryForm', lang) }</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{recoveryPlan.procedure_name}</h2>
              {userEmail && (
                <span style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> {t('planSavedNote', lang)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Reminder permission toggle */}
              <button
                onClick={requestNotifPermission}
                disabled={notifPermission === 'granted' || notifPermission === 'unsupported'}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', opacity: notifPermission === 'unsupported' ? 0.5 : 1 }}
                title={notifPermission === 'denied' ? t('remindersBlocked', lang) : undefined}
              >
                {notifPermission === 'granted'
                  ? <><BellRing size={14} /> {t('remindersOn', lang)}</>
                  : notifPermission === 'denied'
                    ? <><BellOff size={14} /> {t('remindersBlocked', lang)}</>
                    : <><Bell size={14} /> {t('enableReminders', lang)}</>}
              </button>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('followUp', lang)}</span>
                <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1rem' }}>
                  <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {recoveryPlan.follow_up_date}
                </span>
              </div>

              <button className="btn btn-secondary" onClick={handleChangeSummary} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                {t('changeSummary' , lang)}
              </button>
            </div>
          </div>

          {/* Next-dose reminder strip */}
          {nextReminder && (
            <div className="card span-12" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.25rem', borderLeft: '4px solid var(--secondary)' }}>
              <Bell size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{t('nextDoseLabel', lang)}:</strong> {nextReminder.medName} — {formatTime12(nextReminder.time)} ({nextReminder.label})
              </span>
            </div>
          )}

          {/* Active reminder banner (fires the moment a scheduled dose-time hits) */}
          {activeReminder && (
            <div className="alert-banner span-12" style={{ background: 'var(--secondary)', animation: 'pulse 2s infinite' }}>
              <Bell size={30} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.15rem' }}>
                  {t('doseReminderTitle', lang)}
                </h3>
                <p style={{ fontSize: '0.85rem' }}>{activeReminder.medName} — {activeReminder.dosage} ({activeReminder.purpose})</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                  onClick={() => { toggleTask(`med_${activeReminder.idx}`); setActiveReminder(null); }}
                >
                  <CheckCircle2 size={13} /> {t('markTaken', lang)}
                </button>
                <button
                  onClick={() => setActiveReminder(null)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

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
            <div className="card-title" style={{ justifyContent: 'space-between', width: '100%', display: 'flex', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar />
                <span>{t('recovertRoutine', lang)}</span>
              </span>
              {totalTasks > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {t('adherenceToday', lang)}: {doneTasks}/{totalTasks}
                </span>
              )}
            </div>
            {totalTasks > 0 && (
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{
                  height: '100%', borderRadius: '3px', background: 'var(--success)',
                  width: `${(doneTasks / totalTasks) * 100}%`, transition: 'width 0.4s ease',
                }} />
              </div>
            )}
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
                    style={{ justifyContent: 'space-between', padding: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div className="custom-check"></div>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{med.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {med.purpose} • {med.dosage}
                        </span>
                        {med.reminder_times?.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '4px' }}>
                            <Bell size={11} /> {t('reminderTimesLabel', lang)}: {med.reminder_times.map(formatTime12).join(', ')}
                          </span>
                        )}
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
