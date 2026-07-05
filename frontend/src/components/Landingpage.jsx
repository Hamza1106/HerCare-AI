import React, { useState, useEffect } from 'react';
import {
  Heart, Sparkles, ShieldCheck, Languages, ArrowRight,
  ClipboardList, BookOpen, FileText, HeartPulse, Library, MessageCircle,
  CheckCircle2, Lock, ArrowUp
} from 'lucide-react';

// The six real modules of the product — used for both the hero "orbit"
// illustration and the features grid, so the marketing page always
// reflects what actually exists in the app instead of invented copy.
const MODULES = [
  { icon: ClipboardList, title: 'Risk Assessment', desc: "A short questionnaire that screens for PCOS, thyroid issues, anemia and more — with a clear, plain-language risk breakdown." },
  { icon: BookOpen,      title: 'Symptom Checker', desc: 'Search any symptom or condition and get warm, awareness-first guidance instead of a wall of medical jargon.' },
  { icon: FileText,      title: 'Report Explainer', desc: 'Upload a lab report or prescription photo and get every value explained — in English and Roman Urdu, side by side.' },
  { icon: HeartPulse,    title: 'Recovery Assistant', desc: 'Log symptoms after a procedure or discharge and get red-flag alerts the moment something needs urgent attention.' },
  { icon: Library,       title: 'Health Library', desc: "A growing, searchable library of women's health topics written for South Asian readers, not textbooks." },
  { icon: MessageCircle, title: 'AI Chat', desc: 'Ask a follow-up question anytime — HerCare AI remembers the conversation and answers in the language you write in.' },
];

const STATS = [
  { value: '6',    label: 'Health areas covered' },
  { value: '2',    label: 'Languages — EN & Roman Urdu' },
  { value: '24/7', label: 'Available whenever you need it' },
  { value: 'Free', label: 'To get started, no card needed' },
];

const PILLARS = [
  'Written for Pakistani & South Asian women, not translated from somewhere else',
  'Bilingual by design — nothing gets lost between English and Roman Urdu',
  'Warm and non-judgmental, never robotic one-liners',
  'Private by default — your data stays yours',
];

export default function LandingPage({ onGetStarted }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor window scrolling status to show or hide the Back to Top indicator
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogoClick = () => {
    window.location.reload();
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      backgroundImage: `
        radial-gradient(at 5% 5%, rgba(91,141,239,0.16) 0px, transparent 52%),
        radial-gradient(at 95% 10%, rgba(94,200,196,0.13) 0px, transparent 52%),
        radial-gradient(at 50% 98%, rgba(91,141,239,0.09) 0px, transparent 52%)`,
      color: 'var(--text-primary)',
    }}>
      {/* ─────────── NAV (STICKY) ─────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem clamp(1.25rem, 5vw, 3.5rem)',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))', 
        backdropFilter: 'var(--glass-blur, blur(12px))', 
        WebkitBackdropFilter: 'var(--glass-blur, blur(12px))',
        borderBottom: '1px solid rgba(91,141,239,0.12)',
      }}>
        {/* LOGO: Clicks trigger full app refresh */}
        <div 
          onClick={handleLogoClick}
          style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 18px var(--primary-glow)', flexShrink: 0,
          }}>
            <Heart size={19} color="#fff" fill="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.3px',
            background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>HerCare AI</span>
        </div>

        <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.0rem' }}>
          <a href="#features" onClick={scrollTo('features')} className="landing-nav-link">Features</a>
          <a href="#about" onClick={scrollTo('about')} className="landing-nav-link">About</a>
          <a href="#how" onClick={scrollTo('how')} className="landing-nav-link">How it works</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={() => onGetStarted('login')} className="btn btn-secondary" style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}>
            Sign In
          </button>
          <button onClick={() => onGetStarted('register')} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
            Get Started <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ─────────── HERO ─────────── */}
      <header style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: 'clamp(3rem, 7vw, 5.5rem) clamp(1.25rem, 5vw, 3.5rem) clamp(2rem, 5vw, 3rem)',
        display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,0.95fr)', gap: '3rem', alignItems: 'center',
      }} className="landing-hero-grid">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.9rem', borderRadius: 999,
            background: 'rgba(91,141,239,0.10)', border: '1px solid rgba(91,141,239,0.22)',
            color: 'var(--primary)', fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.4rem',
          }}>
            <Sparkles size={13} /> AI health companion for women
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em',
            fontSize: 'clamp(2.1rem, 4.4vw, 3.2rem)', lineHeight: 1.12, marginBottom: '1.25rem',
            color: 'var(--text-primary)',
          }}>
            Your body's questions,<br />answered in your own words.
          </h1>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '520px', marginBottom: '1.9rem' }}>
            HerCare AI helps you understand symptoms, lab reports, and hormonal health —
            in English or Roman Urdu — so a busy clinic visit is never the only place
            you get answers.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '2.1rem' }}>
            <button onClick={() => onGetStarted('register')} className="btn btn-primary" style={{ fontSize: '0.95rem', padding: '0.85rem 1.6rem' }}>
              Get Started Free <ArrowRight size={16} />
            </button>
            <button onClick={scrollTo('about')} className="btn btn-secondary" style={{ fontSize: '0.95rem', padding: '0.85rem 1.6rem' }}>
              Learn More
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {[[Lock, 'Private by design'], [Languages, 'English & Roman Urdu'], [ShieldCheck, 'Awareness, not diagnosis']].map(([Icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                <Icon size={15} color="var(--secondary)" /> {label}
              </div>
            ))}
          </div>
        </div>

        {/* Signature illustration: the six modules orbiting a pulsing heart */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HeroOrbit />
        </div>
      </header>

      {/* Heartbeat divider — signature motif, reused as a section break */}
      <PulseDivider />

      {/* ─────────── STATS ─────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.75rem clamp(1.25rem, 5vw, 3.5rem)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
        }} className="landing-stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem', cursor: 'default' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.9rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── FEATURES ─────────── */}
      <section id="features" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem clamp(1.25rem, 5vw, 3.5rem) 4rem' }}>
        <SectionHeading
          eyebrow="Everything in one place"
          title="One companion, six kinds of support"
          sub="Every module below is live in the app today — this isn't a roadmap, it's what you get from day one."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginTop: '2.5rem' }} className="landing-features-grid">
          {MODULES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(91,141,239,0.12)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem',
                cursor: 'default', flexShrink: 0,
              }}>
                <Icon size={22} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── ABOUT ─────────── */}
      <section id="about" style={{
        background: 'linear-gradient(180deg, rgba(91,141,239,0.05), transparent)',
        borderTop: '1px solid rgba(91,141,239,0.10)', borderBottom: '1px solid rgba(91,141,239,0.10)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '4.5rem clamp(1.25rem, 5vw, 3.5rem)',
          display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '3.5rem', alignItems: 'center',
        }} className="landing-hero-grid">
          <div>
            <SectionHeading
              eyebrow="Why HerCare AI"
              title={<>Built for women who've been told to<br />"just wait it out."</>}
              align="left"
            />
            <p style={{ fontSize: '0.98rem', lineHeight: 1.75, color: 'var(--text-secondary)', margin: '1.25rem 0 1.75rem' }}>
              PCOS, thyroid disorders, anemia, and menstrual irregularities are common
              across Pakistan and South Asia — but awareness and access to a doctor who
              has time to explain things clearly are not. HerCare AI closes that gap:
              a patient, judgment-free companion that speaks the language you actually
              think in, available the moment a question comes up, not just at your
              next appointment.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {PILLARS.map((p) => (
                <div key={p} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--secondary)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          <ConditionCloud />
        </div>
      </section>

      {/* ─────────── HOW IT WORKS ─────────── */}
      <section id="how" style={{ maxWidth: '1000px', margin: '0 auto', padding: '4.5rem clamp(1.25rem, 5vw, 3.5rem)' }}>
        <SectionHeading
          eyebrow="How it works"
          title="From a question to a clear next step"
          sub="Three steps, every time — no account required just to look around."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2.75rem', position: 'relative' }} className="landing-features-grid">
          {[
            { n: '01', t: 'Share how you feel', d: 'Answer a short questionnaire, describe a symptom, or upload a report or prescription photo.' },
            { n: '02', t: 'AI reads the details', d: 'HerCare AI analyzes it against known patterns for PCOS, thyroid, anemia and more.' },
            { n: '03', t: 'Get a clear next step', d: 'Receive a plain-language explanation in English and Roman Urdu, plus guidance on what to do next.' },
          ].map((step) => (
            <div key={step.n} className="card" style={{ padding: '1.75rem', textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem',
                color: '#fff', background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem', boxShadow: '0 6px 14px var(--primary-glow)',
              }}>{step.n}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.02rem', marginBottom: '0.5rem' }}>{step.t}</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── CTA BAND ─────────── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1.25rem, 5vw, 3.5rem) 4.5rem' }}>
        <div style={{
          borderRadius: 24, padding: 'clamp(2.25rem, 5vw, 3.5rem)',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem',
          boxShadow: '0 24px 60px var(--primary-glow)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: '#fff', marginBottom: '0.5rem' }}>
              Your health story deserves to be heard.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
              Create a free account and get your first assessment in under two minutes.
            </p>
          </div>
          <button
            onClick={() => onGetStarted('register')}
            style={{
              background: '#fff', color: 'var(--primary)', border: 'none',
              padding: '0.9rem 1.75rem', borderRadius: 12, fontFamily: 'var(--font-display)',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              position: 'relative', zIndex: 1, transition: 'transform 0.18s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer style={{ borderTop: '1px solid rgba(91,141,239,0.12)', padding: '2.5rem clamp(1.25rem, 5vw, 3.5rem)' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Heart size={14} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>HerCare AI</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '480px', lineHeight: 1.6 }}>
            <Lock size={11} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            For awareness only, not a medical diagnosis. Your data stays on your device.
          </p>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>© {new Date().getFullYear()} HerCare AI</span>
        </div>
      </footer>

      {/* ─────────── BACK TO TOP BUTTON ─────────── */}
      <button
        onClick={handleScrollToTop}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '62px',
          height: '62px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px var(--primary-glow)',
          zIndex: 99,
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: showScrollTop ? 'auto' : 'none',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
        title="Back to Top"
      >
        <ArrowUp size={20} />
      </button>

      <style>{`
        .landing-nav-link {
          font-family: var(--font-display); font-weight: 600; font-size: 0.88rem;
          color: var(--text-secondary); text-decoration: none; transition: color 0.15s ease;
        }
        .landing-nav-link:hover { color: var(--primary); }
        @media (max-width: 880px) {
          .landing-nav-links { display: none !important; }
          .landing-hero-grid { grid-template-columns: 1fr !important; }
          .landing-features-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .landing-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .landing-features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub, align = 'center' }) {
  return (
    <div style={{ textAlign: align, maxWidth: align === 'center' ? '640px' : 'none', margin: align === 'center' ? '0 auto' : 0 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        color: 'var(--secondary)', fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem',
      }}>
        {eyebrow}
      </div>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.01em',
        fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.25, color: 'var(--text-primary)',
      }}>
        {title}
      </h2>
      {sub && <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

// Signature hero illustration — the six real modules of the product,
// orbiting a slowly pulsing heart. A stand-in for a stock photo that
// actually encodes what the app does.
function HeroOrbit() {
  const radius = 128;
  const items = MODULES.map(({ icon: Icon }, i) => {
    const angle = (i / MODULES.length) * 2 * Math.PI - Math.PI / 2;
    return { Icon, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });

  return (
    <div style={{ position: 'relative', width: 320, height: 320, flexShrink: 0 }} className="landing-orbit">
      <svg width="320" height="320" viewBox="0 0 320 320" style={{ position: 'absolute', inset: 0, animation: 'orbitSpin 40s linear infinite' }}>
        <circle cx="160" cy="160" r={radius} fill="none" stroke="rgba(91,141,239,0.28)" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" />
      </svg>

      {items.map(({ Icon, x, y }, i) => (
        <div key={i} style={{
          position: 'absolute', top: `calc(50% + ${y}px - 22px)`, left: `calc(50% + ${x}px - 22px)`,
          width: 44, height: 44, borderRadius: 13, background: '#fff',
          border: '1px solid rgba(91,141,239,0.18)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
          animation: `floatB ${6 + i}s ease-in-out infinite`,
        }}>
          <Icon size={19} />
        </div>
      ))}

      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 92, height: 92, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 10px rgba(91,141,239,0.10), 0 16px 40px var(--primary-glow)',
        animation: 'pulseRing 2.6s ease-in-out infinite',
      }}>
        <Heart size={34} color="#fff" fill="#fff" />
      </div>

      <style>{`
        @keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 10px rgba(91,141,239,0.10), 0 16px 40px var(--primary-glow); }
          50%      { box-shadow: 0 0 0 16px rgba(91,141,239,0.06), 0 16px 40px var(--primary-glow); }
        }
        @media (max-width: 880px) { .landing-orbit { width: 260px !important; height: 260px !important; transform: scale(0.85); } }
      `}</style>
    </div>
  );
}

// Signature motif reused as a section break: a slowly-drawing ECG line,
// echoing the "HeartPulse" idea that already runs through the app
// (recovery tracking, the heart logomark) instead of a plain <hr>.
function PulseDivider() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(1.25rem, 5vw, 3.5rem)' }}>
      <svg viewBox="0 0 1200 60" width="100%" height="60" preserveAspectRatio="none" style={{ display: 'block' }}>
        <path
          d="M0,30 L260,30 L290,10 L315,50 L340,30 L370,30 L395,15 L415,45 L440,30 L1200,30"
          fill="none" stroke="url(#pulseGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="pulse-path"
        />
        <defs>
          <linearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--primary)" />
            <stop offset="50%" stopColor="var(--secondary)" />
            <stop offset="80%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <style>{`
        .pulse-path { stroke-dasharray: 1600; stroke-dashoffset: 1600; animation: drawPulse 3.5s ease-out infinite; }
        @keyframes drawPulse { 0% { stroke-dashoffset: 1600; } 55% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -1600; } }
      `}</style>
    </div>
  );
}

// A loose cloud of the conditions HerCare AI screens for — grounded,
// specific copy standing in for the "about" section's visual.
function ConditionCloud() {
  const conditions = [
    { label: 'PCOS', size: 'lg' },
    { label: 'Thyroid disorders', size: 'md' },
    { label: 'Anemia', size: 'md' },
    { label: 'Endometriosis', size: 'sm' },
    { label: 'Menstrual health', size: 'lg' },
    { label: 'Menopause & perimenopause', size: 'sm' },
    { label: 'Post-discharge recovery', size: 'md' },
  ];
  const sizeMap = { sm: '0.8rem', md: '0.92rem', lg: '1.08rem' };
  const padMap = { sm: '0.55rem 1rem', md: '0.7rem 1.2rem', lg: '0.85rem 1.5rem' };

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', justifyContent: 'center',
      padding: '2.5rem', borderRadius: 24, background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
      border: '1px solid rgba(91,141,239,0.14)', boxShadow: 'var(--shadow-md)',
    }}>
      {conditions.map((c, i) => (
        <span key={c.label} style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)',
          fontSize: sizeMap[c.size], padding: padMap[c.size], borderRadius: 999,
          background: i % 2 === 0 ? 'rgba(91,141,239,0.10)' : 'rgba(94,200,196,0.14)',
          border: `1px solid ${i % 2 === 0 ? 'rgba(91,141,239,0.22)' : 'rgba(94,200,196,0.28)'}`,
          animation: `floatA ${6 + (i % 4)}s ease-in-out infinite`,
        }}>
          {c.label}
        </span>
      ))}
    </div>
  );
}