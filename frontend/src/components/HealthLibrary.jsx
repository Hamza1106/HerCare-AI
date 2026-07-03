import React, { useState } from 'react';
import { t } from '../i18n';
import {
  Activity, Droplets, Thermometer, Heart, Moon, Shield,
  Zap, Sun, Brain, Baby, HeartHandshake, AlertCircle,
  ChevronDown, ChevronUp, BookOpen, MapPin, Check, Circle, Diamond, Stethoscope
} from 'lucide-react';

const CONDITIONS = [
  {
    id: 'pcos',
    name: 'PCOS',
    fullName: 'Polycystic Ovary Syndrome',
    icon: Activity,
    color: '#8B7CF8',
    tag: 'Hormonal',
    summary: 'A hormonal disorder causing irregular periods, excess androgens, and small ovarian cysts.',
    symptoms: ['Irregular or missed periods', 'Excess facial/body hair', 'Acne', 'Weight gain', 'Hair thinning on scalp', 'Dark skin patches', 'Mood swings'],
    causes: ['Insulin resistance', 'Hormonal imbalance (excess androgens)', 'Genetic factors', 'Inflammation'],
    prevention: ['Maintain healthy weight', 'Low-glycemic diet', 'Regular exercise', 'Stress reduction'],
    urdu: 'PCOS ek hormonal masla hai jisme ovaries mein chhote cysts ban jaate hain aur periods irregular ho jaate hain.',
  },
  {
    id: 'menstrual_irregularities',
    name: 'Menstrual Irregularities',
    fullName: 'Irregular / Abnormal Periods',
    icon: Droplets,
    color: '#F5B7D2',
    tag: 'Menstrual',
    summary: 'Periods that are too heavy, too light, too frequent, or absent — often signaling an underlying condition.',
    symptoms: ['Very heavy bleeding', 'Missed periods', 'Periods less than 21 days apart', 'Periods longer than 35 days', 'Severe cramping', 'Spotting between periods'],
    causes: ['Hormonal imbalance', 'PCOS or thyroid disorders', 'Stress', 'Extreme weight changes', 'Uterine fibroids'],
    prevention: ['Manage stress levels', 'Maintain healthy BMI', 'Track cycle regularly', 'Avoid extreme dieting'],
    urdu: 'Periods ka bahut zyada ya kam hona, ya bilkul na aana — yeh kisi underlying masle ki nishani ho sakti hai.',
  },
  {
    id: 'anemia',
    name: 'Anemia',
    fullName: 'Iron Deficiency Anemia',
    icon: Heart,
    color: '#E85D75',
    tag: 'Blood',
    summary: 'Low iron levels causing fatigue, weakness, and pale skin — extremely common in Pakistani women.',
    symptoms: ['Constant fatigue', 'Pale skin', 'Dizziness', 'Shortness of breath', 'Cold hands and feet', 'Brittle nails', 'Headaches'],
    causes: ['Heavy menstrual bleeding', 'Poor iron-rich diet', 'Repeated pregnancies', 'Poor iron absorption'],
    prevention: ['Eat iron-rich foods (lentils, red meat, spinach)', 'Vitamin C with meals', 'Avoid tea/coffee with meals', 'Regular hemoglobin check'],
    urdu: 'Khoon mein iron ki kami — Pakistan mein khawateen mein bahut aam hai. Thakawat aur chakkar aana iske main symptoms hain.',
  },
  {
    id: 'thyroid',
    name: 'Thyroid Disorders',
    fullName: 'Hypo / Hyperthyroidism',
    icon: Thermometer,
    color: '#5EC8C4',
    tag: 'Hormonal',
    summary: 'The thyroid gland produces too little or too much hormone, affecting energy, weight, and mood.',
    symptoms: ['Unexplained weight changes', 'Extreme fatigue', 'Feeling too cold or too hot', 'Dry skin and hair', 'Heart palpitations', 'Mood changes', 'Irregular periods'],
    causes: ['Autoimmune disease (Hashimoto\'s, Graves\')', 'Iodine deficiency', 'Family history', 'Post-pregnancy changes'],
    prevention: ['Regular TSH blood test', 'Iodized salt', 'Selenium-rich foods', 'Avoid excessive soy intake'],
    urdu: 'Thyroid gland ya zyada ya kam hormone banata hai. Wajan ka anachey badna ya kum hona, thakawat — yeh iske signs hain.',
  },
  {
    id: 'endometriosis',
    name: 'Endometriosis',
    fullName: 'Endometriosis',
    icon: AlertCircle,
    color: '#F6A04D',
    tag: 'Reproductive',
    summary: 'Tissue similar to the uterine lining grows outside the uterus, causing severe pain and fertility issues.',
    symptoms: ['Severe period pain', 'Pain during intercourse', 'Painful bowel movements', 'Heavy periods', 'Chronic pelvic pain', 'Bloating', 'Difficulty conceiving'],
    causes: ['Retrograde menstruation', 'Immune system dysfunction', 'Genetic predisposition', 'Hormonal factors'],
    prevention: ['Early diagnosis is key', 'Hormonal management', 'Regular gynecology checkups', 'Anti-inflammatory diet'],
    urdu: 'Bachi dame ke andar ki teh bahar bhi ban jaati hai — isse periods mein shadeed dard hota hai.',
  },
  {
    id: 'menopause',
    name: 'Menopause',
    fullName: 'Menopause / Perimenopause',
    icon: Moon,
    color: '#8B7CF8',
    tag: 'Reproductive',
    summary: 'The natural end of menstrual cycles (usually 45–55), with hormonal shifts causing various symptoms.',
    symptoms: ['Hot flashes', 'Night sweats', 'Irregular periods', 'Sleep problems', 'Mood changes', 'Vaginal dryness', 'Memory issues'],
    causes: ['Natural decline in estrogen & progesterone', 'Surgical removal of ovaries', 'Chemotherapy', 'Premature ovarian failure'],
    prevention: ['Calcium & Vitamin D intake', 'Regular bone density check', 'Stay physically active', 'Hormone therapy (doctor-advised)'],
    urdu: '45-55 saal ki umar mein periods band ho jaate hain aur body mein badi tabdeeliyaan aati hain. Hot flashes aur mood changes common hain.',
  },
  {
    id: 'uti',
    name: 'UTI / Infections',
    fullName: 'Urinary Tract Infections',
    icon: Shield,
    color: '#5EC8C4',
    tag: 'Infection',
    summary: 'Bacterial infection in the urinary tract causing burning urination — very common in women.',
    symptoms: ['Burning sensation while urinating', 'Frequent urge to urinate', 'Cloudy or dark urine', 'Pelvic pain', 'Foul-smelling urine'],
    causes: ['Bacteria (E. coli) entering urethra', 'Sexual activity', 'Poor hygiene', 'Holding urine too long', 'Dehydration'],
    prevention: ['Drink plenty of water', 'Urinate after intercourse', 'Wipe front to back', 'Wear cotton underwear', 'Avoid harsh soaps'],
    urdu: 'Peeshab karte waqt jalan ya baar baar aaney ki zaroorat — yeh UTI ke symptoms hain. Paani zyada piyen aur saafai ka khayal rakhein.',
  },
  {
    id: 'pms_pmdd',
    name: 'PMS / PMDD',
    fullName: 'Premenstrual Syndrome / Disorder',
    icon: Zap,
    color: '#F5B7D2',
    tag: 'Menstrual',
    summary: 'Physical and emotional symptoms in the days before periods — PMDD is the severe form affecting daily life.',
    symptoms: ['Mood swings before periods', 'Bloating', 'Breast tenderness', 'Irritability', 'Anxiety', 'Food cravings', 'Fatigue', 'Difficulty concentrating'],
    causes: ['Hormonal changes before periods', 'Serotonin sensitivity', 'Stress', 'Nutritional deficiencies'],
    prevention: ['Track symptoms monthly', 'Reduce salt & sugar before periods', 'Regular exercise', 'Adequate sleep', 'Calcium supplements'],
    urdu: 'Periods se pehle mood kharab hona, bloating, irritability — yeh PMS hai. Agar bahut bura ho to PMDD ho sakta hai, doctor se milein.',
  },
  {
    id: 'vitamin_d_deficiency',
    name: 'Vitamin D Deficiency',
    fullName: 'Vitamin D / Bone Health',
    icon: Sun,
    color: '#F6A04D',
    tag: 'Nutritional',
    summary: 'Extremely common in Pakistan due to limited sun exposure — affects bones, immunity, mood, and energy.',
    symptoms: ['Bone or back pain', 'Muscle weakness', 'Fatigue', 'Frequent infections', 'Depression', 'Hair loss', 'Brain fog'],
    causes: ['Limited sunlight exposure', 'Dark clothing covering skin', 'Poor dietary intake', 'Malabsorption'],
    prevention: ['Morning sunlight (15–20 min)', 'Eggs, fish, fortified milk', 'Vitamin D3 supplements (doctor-advised)', 'Annual blood test'],
    urdu: 'Pakistan mein Vitamin D ki kami bahut aam hai. Dhoop mein baithein, eggs aur fish khayein, aur doctor se test karwayein.',
  },
  {
    id: 'stress_anxiety',
    name: 'Stress & Anxiety',
    fullName: 'Chronic Stress / Anxiety Disorder',
    icon: Brain,
    color: '#8B7CF8',
    tag: 'Mental Health',
    summary: 'Persistent stress and anxiety affecting physical health, hormones, sleep, and quality of life.',
    symptoms: ['Constant worry', 'Difficulty sleeping', 'Rapid heartbeat', 'Muscle tension', 'Digestive issues', 'Headaches', 'Feeling overwhelmed'],
    causes: ['Life pressures (family, work, finances)', 'Hormonal imbalances', 'Trauma', 'Social isolation', 'Perfectionism'],
    prevention: ['Daily breathing exercises', 'Physical activity', 'Set boundaries', 'Talk to someone you trust', 'Limit screen time before bed'],
    urdu: 'Zindagi ki zimmedariyan aur pressure se anxiety hoti hai. Yeh normal hai, lekin chronic ho jaaye to help lena zaroori hai.',
  },
  {
    id: 'pregnancy_health',
    name: 'Pregnancy Health',
    fullName: 'Pregnancy Awareness & Care',
    icon: Baby,
    color: '#5EC8C4',
    tag: 'Reproductive',
    summary: 'Essential health awareness for a safe pregnancy — early prenatal care is critical for mother and baby.',
    symptoms: ['Missed period', 'Nausea / morning sickness', 'Breast tenderness', 'Fatigue', 'Frequent urination', 'Food aversions', 'Light spotting'],
    causes: ['Fertilization of egg', 'Hormonal rise in hCG, progesterone, estrogen'],
    prevention: ['Start folic acid early', 'Regular prenatal checkups', 'Avoid smoking, alcohol, raw foods', 'Iron & calcium supplements', 'Gentle exercise'],
    urdu: 'Hamal ke dauran prenatal care bahut zaroori hai. Folic acid shuru karein, doctor se milti rahein, aur sehat ka khayal rakhein.',
  },
  {
    id: 'postpartum_health',
    name: 'Postpartum Health',
    fullName: 'Postpartum Recovery & Depression',
    icon: HeartHandshake,
    color: '#E85D75',
    tag: 'Mental Health',
    summary: 'Physical and emotional recovery after childbirth — postpartum depression affects 1 in 5 mothers.',
    symptoms: ['Excessive sadness after delivery', 'Crying spells', 'Anxiety', 'Difficulty bonding with baby', 'Extreme fatigue', 'Hair loss', 'Feeling disconnected'],
    causes: ['Rapid hormonal drop after delivery', 'Sleep deprivation', 'Lack of support', 'History of depression'],
    prevention: ['Accept help from family', 'Rest when baby sleeps', 'Speak openly about feelings', 'See a doctor if sadness lasts 2+ weeks'],
    urdu: 'Bachay ke baad 1-in-5 mahilaon ko postpartum depression hota hai. Madad maangna himmat hai — doctor se zaroor milein.',
  },
];

const TAG_COLORS = {
  'Hormonal':     { bg: 'rgba(139,124,248,0.15)', text: '#8B7CF8' },
  'Menstrual':    { bg: 'rgba(245,183,210,0.2)',  text: '#d4739e' },
  'Blood':        { bg: 'rgba(232,93,117,0.15)',  text: '#E85D75' },
  'Reproductive': { bg: 'rgba(94,200,196,0.15)',  text: '#5EC8C4' },
  'Infection':    { bg: 'rgba(246,160,77,0.15)',  text: '#F6A04D' },
  'Nutritional':  { bg: 'rgba(246,160,77,0.12)',  text: '#F6A04D' },
  'Mental Health':{ bg: 'rgba(139,124,248,0.12)', text: '#a78bfa' },
};

const ALL_TAGS = ['All', ...Object.keys(TAG_COLORS)];

function ConditionCard({ cond, lang = 'en' }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = cond.icon;
  const tagStyle = TAG_COLORS[cond.tag] || { bg: 'rgba(255,255,255,0.05)', text: 'var(--text-muted)' };

  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${expanded ? cond.color + '55' : hovered ? cond.color + '40' : 'var(--border-color)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: expanded
          ? `0 8px 28px ${cond.color}26`
          : hovered
            ? `0 12px 28px ${cond.color}22`
            : '0 2px 8px rgba(15,39,64,0.06)',
        transform: hovered && !expanded ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
      }}
    >
      {/* Card top accent */}
      <div style={{
        height: hovered ? '5px' : '3px',
        background: cond.color,
        transition: 'height 0.25s ease',
      }} />

      <div style={{ padding: '1.25rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
            background: cond.color + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <Icon size={20} color={cond.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {cond.name}
              </span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                background: tagStyle.bg, color: tagStyle.text,
              }}>
                {cond.tag}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              {cond.fullName}
            </p>
          </div>
        </div>

        {/* Summary */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
          {cond.summary}
        </p>

        {/* Roman Urdu */}
        <p style={{
          fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5,
          background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '0.5rem 0.75rem',
          margin: '0 0 0.75rem', fontStyle: 'italic',
          display: 'flex', gap: '0.4rem', alignItems: 'flex-start',
        }}>
          <MapPin size={12} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          {cond.urdu}
        </p>

        {/* Toggle button */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.4rem', padding: '0.5rem', borderRadius: '10px',
            background: expanded ? cond.color + '18' : hovered ? cond.color + '0F' : 'var(--bg-tertiary)',
            border: `1px solid ${expanded ? cond.color + '44' : hovered ? cond.color + '33' : 'var(--border-color)'}`,
            color: expanded ? cond.color : hovered ? cond.color : 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {expanded ? <><ChevronUp size={14} /> {t('collapseBtn', lang)}</> : <><ChevronDown size={14} /> {t('expandBtn', lang)}</>}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Section title={t('symptomsSection', lang)} color={cond.color} items={cond.symptoms} bulletIcon="circle" />
            <Section title={t('causesSection', lang)} color="#F6A04D" items={cond.causes} bulletIcon="diamond" />
            <Section title={t('preventionSection', lang)} color="#5EC8C4" items={cond.prevention} bulletIcon="check" />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, color, items, bulletIcon }) {
  const BulletIcon = bulletIcon === 'check' ? Check : bulletIcon === 'diamond' ? Diamond : Circle;
  return (
    <div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color, marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
        {title.toUpperCase()}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <BulletIcon size={10} color={color} style={{ flexShrink: 0, marginTop: '4px' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HealthLibrary({ lang = 'en' }) {
  const [activeTag, setActiveTag] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = CONDITIONS.filter(c => {
    const matchTag = activeTag === 'All' || c.tag === activeTag;
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q);
    return matchTag && matchSearch;
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <BookOpen size={22} color="var(--primary)" />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)', margin: 0 }}>
          Health Library
        </h2>
        <span style={{
          fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px',
          background: 'rgba(139,124,248,0.15)', color: 'var(--primary)',
        }}>
          {CONDITIONS.length} {t('libraryConditions', lang)}
        </span>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1.5rem' }}>
        {t('librarySubtitle', lang)}
      </p>

      {/* Search + filter row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder={t('librarySearch', lang)}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: '360px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '12px', padding: '0.6rem 1rem',
            color: 'var(--text-primary)', fontSize: '0.83rem',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
        />

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {ALL_TAGS.map(tag => {
            const ts = TAG_COLORS[tag];
            const active = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                style={{
                  padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: active ? `1.5px solid ${ts?.text || 'var(--primary)'}` : '1px solid var(--border-color)',
                  background: active ? (ts?.bg || 'rgba(139,124,248,0.15)') : 'var(--bg-secondary)',
                  color: active ? (ts?.text || 'var(--primary)') : 'var(--text-muted)',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', fontSize: '0.85rem' }}>
          {t('libraryNoResults', lang)} "{search}"
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map(c => <ConditionCard key={c.id} cond={c} lang={lang} />)}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: '2rem', padding: '0.85rem 1rem', borderRadius: '10px',
        background: 'rgba(139,124,248,0.08)', border: '1px solid rgba(139,124,248,0.2)',
        fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6,
        display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
      }}>
        <Stethoscope size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span><strong style={{ color: 'var(--text-secondary)' }}>Disclaimer:</strong> {t('libraryDisclaimer', lang)}</span>
      </div>
    </div>
  );
}