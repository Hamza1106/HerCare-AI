import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import HealthQuestionnaire from './components/HealthQuestionnaire';
import SymptomChecker from './components/SymptomChecker';
import ReportUploader from './components/ReportUploader';
import SymptomLog from './components/SymptomLog';
import AssessmentHistory from './components/AssessmentHistory';
import ChatBot from './components/ChatBot';
import HealthLibrary from './components/HealthLibrary';
import AuthScreen, { getCurrentUser, logout } from './components/AuthScreen';
import LandingPage from './components/Landingpage';
import { t } from './i18n';
import { init3DCards } from './utils/use3DCard';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [language, setLanguage] = useState('en');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [user, setUser] = useState(() => getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const backendUrl = "https://hercare-ai.onrender.com";

  // Re-init 3D tilt whenever view changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const cleanup = init3DCards();
      return cleanup;
    }, 50);
    return () => clearTimeout(timer);
  }, [activeView]);

  // Document title
  useEffect(() => {
    const titles = {
      'dashboard':          'Patient Portal | HerCare AI',
      'risk-assessment':    'Hormonal & Health Risk Screening | HerCare AI',
      'assessment-history': 'Assessment History | HerCare AI',
      'symptom-checker':    "Women's Health Awareness Guide | HerCare AI",
      'report-explainer':   'Medical Report & Prescription Explainer | HerCare AI',
      'recovery-assistant': 'Post-Discharge Recovery tracker | HerCare AI',
      'health-library':     'Health Library | HerCare AI',
    };
    document.title = titles[activeView] || 'HerCare AI';
  }, [activeView]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':          return <DashboardView setActiveView={setActiveView} backendUrl={backendUrl} lang={language} userEmail={user?.email} />;
      case 'risk-assessment':    return <HealthQuestionnaire backendUrl={backendUrl} geminiKey={geminiKey} lang={language} userEmail={user?.email} />;
      case 'assessment-history': return <AssessmentHistory setActiveView={setActiveView} backendUrl={backendUrl} lang={language} userEmail={user?.email} />;
      case 'symptom-checker':    return <SymptomChecker backendUrl={backendUrl} lang={language} />;
      case 'report-explainer':   return <ReportUploader backendUrl={backendUrl} geminiKey={geminiKey} lang={language} />;
      case 'recovery-assistant': return <SymptomLog backendUrl={backendUrl} geminiKey={geminiKey} lang={language} userEmail={user?.email} />;
      case 'health-library':     return <HealthLibrary lang={language} />;
      default:                   return <DashboardView setActiveView={setActiveView} backendUrl={backendUrl} />;
    }
  };

  const getViewMeta = () => {
    switch (activeView) {
      case 'dashboard':          return { title: t('patientDashboard', language),      subtitle: t('patientDashboardSubtitle', language) };
      case 'risk-assessment':    return { title: t('riskAssessmentTitle', language),   subtitle: t('riskAssessmentSubtitle', language) };
      case 'assessment-history': return { title: t('assessmentHistoryTitle', language), subtitle: t('assessmentHistorySubtitle', language) };
      case 'symptom-checker':    return { title: t('symptomCheckerTitle', language),   subtitle: t('symptomCheckerSubtitle', language) };
      case 'report-explainer':   return { title: t('reportExplainerTitle', language),  subtitle: t('reportExplainerSubtitle', language) };
      case 'recovery-assistant': return { title: t('recoveryTitle', language),         subtitle: t('recoverySubtitle', language) };
      case 'health-library':     return { title: t('healthLibraryTitle', language),    subtitle: t('healthLibrarySubtitle', language) };
      default:                   return { title: 'HerCare AI Portal',                  subtitle: "Intelligent Women's Health Companion." };
    }
  };

  const meta = getViewMeta();

  if (!user) {
    return showAuth ? (
      <AuthScreen
        initialMode={authMode}
        onAuth={(session) => setUser(session)}
        onBack={() => setShowAuth(false)}
      />
    ) : (
      <LandingPage onGetStarted={(mode) => { setAuthMode(mode); setShowAuth(true); }} />
    );
  }

  const handleLogout = () => { logout(); setUser(null); setActiveView('dashboard'); setShowAuth(false); };

  // Sidebar width for main content margin
  const sidebarWidth = sidebarOpen ? '260px' : '60px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative',
      backgroundImage: `
        radial-gradient(at 5% 5%, rgba(91,141,239,0.16) 0px, transparent 52%),
        radial-gradient(at 95% 10%, rgba(94,200,196,0.13) 0px, transparent 52%),
        radial-gradient(at 50% 98%, rgba(91,141,239,0.09) 0px, transparent 52%)`,
      backgroundColor: 'var(--bg-primary)',
    }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        user={user}
        onLogout={handleLogout}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        lang={language}
      />

      {/* Main panel shifts with sidebar width */}
      <main style={{
        flex: 1,
        marginLeft: sidebarWidth,
        padding: '2rem 2.5rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Navbar
          title={meta.title}
          subtitle={meta.subtitle}
          language={language}
          setLanguage={setLanguage}
          user={user}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          sidebarOpen={sidebarOpen}
        />
        <div style={{ flex: 1, width: '100%' }}>
          {renderActiveView()}
        </div>
      </main>

      <ChatBot backendUrl={backendUrl} geminiKey={geminiKey} lang={language} />
    </div>
  );
}
