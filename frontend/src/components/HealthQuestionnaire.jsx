import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, RotateCcw, AlertTriangle, Check, ArrowRight, Download } from 'lucide-react';
import { generateAssessmentPDF } from '../utils/generateReport';
import { t } from '../i18n';

export default function HealthQuestionnaire({ backendUrl, geminiKey, lang = 'en', userEmail }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: 26,
    weight: 62,
    height: 160,
    cycle_length: 28,
    cycle_regularity: 1, // 1 = regular, 2 = irregular
    exercise: true,
    fast_food: false,
    follicle_num_l: 5,
    follicle_num_r: 6
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const symptomsList = [
    { id: "irregular periods", labelKey: "sym_irregular_periods", categoryKey: "catCycleHormones" },
    { id: "periods missed for 2+ months", labelKey: "sym_periods_missed_2m", categoryKey: "catCycleHormones" },
    { id: "cycle shorter than 21 days", labelKey: "sym_cycle_short", categoryKey: "catCycleHormones" },
    { id: "cycle longer than 35 days", labelKey: "sym_cycle_long", categoryKey: "catCycleHormones" },
    { id: "extremely heavy bleeding", labelKey: "sym_heavy_bleeding", categoryKey: "catCycleHormones" },
    { id: "bleeding between periods", labelKey: "sym_bleeding_between", categoryKey: "catCycleHormones" },
    { id: "periods lasting 7+ days", labelKey: "sym_periods_long", categoryKey: "catCycleHormones" },

    { id: "excess facial hair", labelKey: "sym_facial_hair", categoryKey: "catSkinHair" },
    { id: "excess body hair", labelKey: "sym_body_hair", categoryKey: "catSkinHair" },
    { id: "acne", labelKey: "sym_acne", categoryKey: "catSkinHair" },
    { id: "hair thinning on scalp", labelKey: "sym_hair_thin", categoryKey: "catSkinHair" },
    { id: "hair fall", labelKey: "sym_hair_fall", categoryKey: "catSkinHair" },
    { id: "dark skin patches", labelKey: "sym_dark_patches", categoryKey: "catSkinHair" },
    { id: "pale skin", labelKey: "sym_pale_skin", categoryKey: "catSkinHair" },
    { id: "brittle nails", labelKey: "sym_brittle_nails", categoryKey: "catSkinHair" },

    { id: "weight gain", labelKey: "sym_weight_gain", categoryKey: "catEnergyWeight" },
    { id: "weight loss", labelKey: "sym_weight_loss", categoryKey: "catEnergyWeight" },
    { id: "difficulty losing weight", labelKey: "sym_diff_losing_weight", categoryKey: "catEnergyWeight" },
    { id: "constant fatigue", labelKey: "sym_fatigue", categoryKey: "catEnergyWeight" },
    { id: "weakness", labelKey: "sym_weakness", categoryKey: "catEnergyWeight" },
    { id: "cold intolerance", labelKey: "sym_cold_intolerance", categoryKey: "catEnergyWeight" },
    { id: "dry skin", labelKey: "sym_dry_skin", categoryKey: "catEnergyWeight" },
    { id: "depression", labelKey: "sym_depression", categoryKey: "catEnergyWeight" },
    { id: "mood swings", labelKey: "sym_mood_swings", categoryKey: "catEnergyWeight" },
    { id: "anxiety", labelKey: "sym_anxiety", categoryKey: "catEnergyWeight" },
    { id: "difficulty sleeping", labelKey: "sym_insomnia", categoryKey: "catEnergyWeight" },
    { id: "rapid heartbeat", labelKey: "sym_rapid_heartbeat", categoryKey: "catEnergyWeight" },
    { id: "excessive sweating", labelKey: "sym_sweating", categoryKey: "catEnergyWeight" },
    { id: "tremors", labelKey: "sym_tremors", categoryKey: "catEnergyWeight" },

    { id: "severe pelvic pain", labelKey: "sym_pelvic_pain", categoryKey: "catPainInfections" },
    { id: "pain during periods", labelKey: "sym_period_pain", categoryKey: "catPainInfections" },
    { id: "pain during intercourse", labelKey: "sym_intercourse_pain", categoryKey: "catPainInfections" },
    { id: "pain during bowel movements", labelKey: "sym_bowel_pain", categoryKey: "catPainInfections" },
    { id: "lower back pain", labelKey: "sym_back_pain", categoryKey: "catPainInfections" },
    { id: "burning during urination", labelKey: "sym_burning_urination", categoryKey: "catPainInfections" },
    { id: "unusual discharge", labelKey: "sym_discharge", categoryKey: "catPainInfections" },
    { id: "frequent urge to urinate", labelKey: "sym_frequent_urge", categoryKey: "catPainInfections" },

    { id: "hot flashes", labelKey: "sym_hot_flashes", categoryKey: "catAgeTransition" },
    { id: "night sweats", labelKey: "sym_night_sweats", categoryKey: "catAgeTransition" },
    { id: "vaginal dryness", labelKey: "sym_vaginal_dryness", categoryKey: "catAgeTransition" }
  ].map(s => ({ ...s, label: t(s.labelKey, lang), category: t(s.categoryKey, lang) }));

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId) 
        : [...prev, symptomId]
    );
  };

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        symptoms: selectedSymptoms,
        lang,
        email: userEmail, // backend persists this user's result to data/users.json
      };
      
      const res = await fetch(`${backendUrl}/api/assess-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      setResults(data);
      setStep(3);
    } catch (err) {
      console.error("Error submitting health assessment:", err);
      alert("Failed to connect to the backend server. Please make sure the Flask backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedSymptoms([]);
    setResults(null);
  };

  const categoryKeys = ["catCycleHormones", "catSkinHair", "catEnergyWeight", "catPainInfections", "catAgeTransition"];
  const categories = categoryKeys.map(k => t(k, lang));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Step Progress Bar */}
      <div className="steps-indicator">
        <div className={`step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          {step > 1 ? <Check size={18} /> : "1"}
        </div>
        <div className={`step-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          {step > 2 ? <Check size={18} /> : "2"}
        </div>
        <div className={`step-node ${step >= 3 ? 'active' : ''}`}>
          3
        </div>
      </div>

      {step === 1 && (
        <div className="card">
          <div className="card-title">
            {t('step1Label', lang)}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>{t('ageLabel', lang)}</label>
              <input 
                type="number" 
                name="age" 
                className="form-control" 
                value={formData.age} 
                onChange={handleInputChange} 
                min="10" 
                max="100" 
              />
            </div>
            
            <div className="form-group">
              <label>{t('weightLabel', lang)}</label>
              <input 
                type="number" 
                name="weight" 
                className="form-control" 
                value={formData.weight} 
                onChange={handleInputChange} 
                min="30" 
                max="200" 
              />
            </div>

            <div className="form-group">
              <label>{t('heightLabel', lang)}</label>
              <input 
                type="number" 
                name="height" 
                className="form-control" 
                value={formData.height} 
                onChange={handleInputChange} 
                min="100" 
                max="250" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>{t('cycleLengthLabel', lang)}</label>
              <input 
                type="number" 
                name="cycle_length" 
                className="form-control" 
                value={formData.cycle_length} 
                onChange={handleInputChange} 
                min="15" 
                max="90" 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('typicalCycleHint', lang)}</span>
            </div>

            <div className="form-group">
              <label>{t('cycleRegularityLabel', lang)}</label>
              <select 
                name="cycle_regularity" 
                className="form-control"
                value={formData.cycle_regularity}
                onChange={handleInputChange}
              >
                <option value={1}>{t('cycleRegularOption', lang)}</option>
                <option value={2}>{t('cycleIrregularOption', lang)}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div className="checkbox-tile checked" style={{ border: 'none', background: 'none', padding: 0 }}>
              <label className={`checkbox-tile ${formData.exercise ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  name="exercise" 
                  checked={formData.exercise} 
                  onChange={handleInputChange} 
                />
                <div className="custom-check"></div>
                <span>{t('exerciseLabel', lang)}</span>
              </label>
            </div>

            <div className="checkbox-tile checked" style={{ border: 'none', background: 'none', padding: 0 }}>
              <label className={`checkbox-tile ${formData.fast_food ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  name="fast_food" 
                  checked={formData.fast_food} 
                  onChange={handleInputChange} 
                />
                <div className="custom-check"></div>
                <span>{t('fastFoodLabel', lang)}</span>
              </label>
            </div>
          </div>

          <div className="btn-container">
            <div></div>
            <button className="btn btn-primary" onClick={handleNext}>
              {t('nextSymptomsBtn', lang)} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-title">
            <span>{t('step2Label', lang)}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {t('selectSymptomsHint', lang)}
          </p>

          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
                {cat}
              </h3>
              <div className="checkbox-grid">
                {symptomsList.filter(s => s.category === cat).map(symptom => {
                  const isChecked = selectedSymptoms.includes(symptom.id);
                  return (
                    <label key={symptom.id} className={`checkbox-tile ${isChecked ? 'checked' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => toggleSymptom(symptom.id)} 
                      />
                      <div className="custom-check"></div>
                      <span style={{ fontSize: '0.85rem' }}>{symptom.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="btn-container">
            <button className="btn btn-secondary" onClick={handlePrev}>
              <ChevronLeft size={18} /> {t('prevBtn', lang)}
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? t('analyzingBtn', lang) : t('analyzeBtn', lang)}
                <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && results && (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="result-header">
              <span style={{ color: 'var(--text-secondary)' }}>{t('massIndex', lang)}</span>
              <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: '800', margin: '0.2rem 0' }}>
                {results.bmi}
              </h2>
              <span style={{ 
                fontSize: '0.85rem', 
                color: results.bmi > 25 ? 'var(--warning)' : (results.bmi < 18.5 ? 'var(--warning)' : 'var(--success)') 
              }}>
                {results.bmi > 25 ? t('overweight', lang) : (results.bmi < 18.5 ?  t('underweight', lang) : t('normalWeight', lang))}
              </span>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            {t('resultsTitle', lang)}
          </h2>

          <div className="result-card-list">
            {Object.entries(results.results).map(([id, result]) => (
              <div key={id} className="result-card">
                <div className="result-card-header">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
                    {result.name}
                  </h3>
                  <span className={`badge ${result.risk_level.toLowerCase()}`}>
                    {result.risk_level} Risk ({result.risk_score}%)
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem' }}>
                  {result.explanation}
                </p>

                {result.matched_symptoms.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      {t('matchedSymptoms', lang)}:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {result.matched_symptoms.map(s => (
                        <span key={s} style={{ backgroundColor: 'var(--bg-tertiary)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('Urgency', lang)}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: result.urgency.includes('urgent') ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {result.urgency} - <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>{result.urgency_desc}</span>
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t("LifestyleAdvice", lang)} (Tips):</span>
                    <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem' }}>
                      {result.lifestyle_tips.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="disclaimer-box">
            <strong>Disclaimer:</strong> {t('disclaimer', lang)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => generateAssessmentPDF(results, localStorage.getItem('user_name') || 'Patient')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} /> {t('downloadPDF', lang)}
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} /> {t('startNewAssessment', lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}