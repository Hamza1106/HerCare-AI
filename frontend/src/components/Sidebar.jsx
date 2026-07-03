import React from 'react';
import {
  LayoutDashboard, ClipboardList, BookOpen, Library,
  FileText, HeartPulse, Key, MessageCircle, LogOut,
  User, ChevronLeft, ChevronRight
} from 'lucide-react';
import { t } from '../i18n';

const NAV_ITEMS = [
  { view: 'dashboard',          icon: LayoutDashboard, labelKey: 'dashboard' },
  { view: 'risk-assessment',    icon: ClipboardList,   labelKey: 'assessment' },
  { view: 'symptom-checker',    icon: BookOpen,        labelKey: 'symptomChecker' },
  { view: 'health-library',     icon: Library,         labelKey: 'healthLibraryNav' },
  { view: 'report-explainer',   icon: FileText,        labelKey: 'reportExplainerNav' },
  { view: 'recovery-assistant', icon: HeartPulse,      labelKey: 'recoveryAssistantNav' },
];

export default function Sidebar({
  activeView, setActiveView,
  geminiKey, setGeminiKey,
  user, onLogout,
  open, onToggle,
  lang = 'en',
}) {
  return (
    <aside
      style={{
        width: open ? '260px' : '60px',
        minWidth: open ? '260px' : '60px',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRight: '1px solid rgba(91,141,239,0.14)',
        height: '100vh',
        position: 'fixed',
        left: 0, top: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '4px 0 24px rgba(91,141,239,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Logo + Toggle button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        padding: open ? '1.5rem 1rem 1.25rem 1.25rem' : '1.5rem 0 1.25rem',
        borderBottom: '1px solid rgba(91,141,239,0.10)',
        flexShrink: 0,
      }}>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px var(--primary-glow)', flexShrink: 0,
            }}>
              <HeartPulse size={18} color="#fff" />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '1.1rem', letterSpacing: '0.3px',
              background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--primary) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>HERCARE AI</span>
          </div>
        )}

        {/* Toggle button — always visible */}
        <button
          onClick={onToggle}
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            width: '28px', height: '28px',
            borderRadius: '8px',
            border: '1px solid rgba(91,141,239,0.20)',
            background: 'var(--bg-secondary)',
            color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.18s',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(91,141,239,0.10)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
        >
          {open ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: open ? '1rem 0.75rem' : '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {NAV_ITEMS.map(({ view, icon: Icon, labelKey }) => {
          const isActive = activeView === view;
          const label = t(labelKey, lang);
          return (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              title={!open ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: open ? '0.75rem' : '0',
                justifyContent: open ? 'flex-start' : 'center',
                padding: open ? '0.65rem 0.85rem' : '0.65rem',
                borderRadius: '10px',
                border: `1px solid ${isActive ? 'rgba(91,141,239,0.40)' : 'transparent'}`,
                background: isActive
                  ? 'linear-gradient(90deg, rgba(91,141,239,0.18), rgba(94,200,196,0.10))'
                  : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.88rem',
                width: '100%',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 14px rgba(91,141,239,0.12)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(91,141,239,0.08)'; e.currentTarget.style.color = 'var(--primary)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {open && <span>{label}</span>}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(91,141,239,0.10)', margin: '0.4rem 0.25rem' }} />

        {/* AI Chat */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('hercare-open-chat'))}
          title={!open ? t('aiChat', lang) : undefined}
          style={{
            display: 'flex', alignItems: 'center',
            gap: open ? '0.75rem' : '0',
            justifyContent: open ? 'flex-start' : 'center',
            padding: open ? '0.65rem 0.85rem' : '0.65rem',
            borderRadius: '10px', border: '1px solid transparent',
            background: 'transparent', color: 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: '0.88rem', width: '100%',
            transition: 'all 0.18s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,141,239,0.08)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <MessageCircle size={18} style={{ flexShrink: 0 }} />
          {open && <span>{t('aiChat', lang)}</span>}
        </button>
      </nav>

      {/* Footer — user + gemini key (only when open) */}
      <div style={{
        borderTop: '1px solid rgba(91,141,239,0.10)',
        padding: open ? '1rem 0.75rem' : '0.75rem 0.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.65rem', flexShrink: 0,
      }}>
        {/* User row */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: open ? '0.6rem' : '0',
            justifyContent: open ? 'flex-start' : 'center',
            padding: open ? '0.55rem 0.65rem' : '0.5rem',
            background: 'var(--bg-tertiary)', borderRadius: '10px',
            border: '1px solid rgba(91,141,239,0.12)',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={14} color="#fff" />
            </div>
            {open && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title={t('signOut', lang)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px', borderRadius: '6px', transition: 'all 0.15s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#E85D75'; e.currentTarget.style.background = 'rgba(232,93,117,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                >
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        )}

        
      </div>
    </aside>
  );
}