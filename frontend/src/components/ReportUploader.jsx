import React, { useState, useRef } from 'react';
import { UploadCloud, MessageSquare, Send, Sparkles, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { t } from '../i18n';

// Simple markdown renderer
function MarkdownLine({ line, idx }) {
  if (line.startsWith('# '))
    return <h2 key={idx} style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', margin: '1.5rem 0 0.75rem', color: 'var(--primary)' }}>{line.slice(2)}</h2>;
  if (line.startsWith('## '))
    return <h3 key={idx} style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: '1.25rem 0 0.5rem', color: 'var(--text-primary)' }}>{line.slice(3)}</h3>;
  if (line.startsWith('### '))
    return <h4 key={idx} style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', margin: '1rem 0 0.4rem', color: 'var(--primary)' }}>{line.slice(4)}</h4>;
  if (line.startsWith('- ') || line.startsWith('* '))
    return <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{renderBold(line.slice(2))}</li>;
  if (line.trim() === '---')
    return <hr key={idx} style={{ border: 'none', borderBottom: '1px solid rgba(91,141,239,0.15)', margin: '1.25rem 0' }} />;
  if (!line.trim()) return <div key={idx} style={{ height: '0.5rem' }} />;
  return <p key={idx} style={{ marginBottom: '0.6rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{renderBold(line)}</p>;
}

function renderBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part}</strong>
      : part
  );
}

export default function ReportUploader({ backendUrl, lang = 'en' }) {
  const [file, setFile] = useState(null);
  const [langPref, setLangPref] = useState('both');
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lang', langPref);
      const res = await fetch(`${backendUrl}/api/explain-report`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setChatMessages([{ role: 'assistant', content: t('chatWelcomeReport', lang) }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(t('reportError', lang));
    } finally {
      setUploading(false);
    }
  };

  const handleChat = async () => {
    const userText = chatInput.trim();
    if (!userText || chatLoading) return;
    setChatInput('');

    const updatedMessages = [...chatMessages, { role: 'user', content: userText }];
    setChatMessages(updatedMessages);
    setChatLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const messagesWithContext = [
        {
          role: 'user',
          content: `[REPORT CONTEXT — use this to answer follow-up questions]\n\n${analysis.explanation}\n\n[END CONTEXT]\n\nUser question: ${userText}`
        },
        ...updatedMessages.slice(1).map(m => ({ role: m.role, content: m.content }))
      ];

      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesWithContext }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply || t('chatErrorReply', lang) }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: t('chatConnectionError', lang) }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {!analysis ? (
        <div className="card">
          <div className="card-title"><Sparkles /><span>{t('uploadTitle', lang)}</span></div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.92rem' }}>
            {t('uploadDesc', lang)}
          </p>

          {/* Dropzone */}
          <div
            className="upload-dropzone"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            style={{ borderColor: dragOver ? 'var(--primary)' : file ? 'var(--success)' : undefined }}
          >
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} accept="image/*,.pdf" />
            <div className="upload-icon" style={{ background: file ? 'rgba(76,175,80,0.12)' : undefined, color: file ? 'var(--success)' : undefined }}>
              {file ? <CheckCircle2 size={32} /> : <UploadCloud size={32} />}
            </div>
            {file ? (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--success)', display: 'block', fontSize: '1rem' }}>{file.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB • {t('clickToReplace', lang)}</span>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 700, display: 'block', fontSize: '1.05rem' }}>{t('dragDrop', lang)}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('fileTypeHint', lang)}</span>
              </div>
            )}
          </div>

          {/* Lang + Submit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('explanationLabel', lang)}:</span>
              <div className="lang-switch">
                {[['both', t('langBoth', lang)], ['en', t('langEnOnly', lang)], ['ur', t('langUrOnly', lang)]].map(([val, label]) => (
                  <button key={val} className={`lang-btn ${langPref === val ? 'active' : ''}`} onClick={() => setLangPref(val)}>{label}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={!file || uploading}>
              {uploading ? (
                <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', marginRight: 8 }} />{t('processingBtn', lang)}</>
              ) : <><Sparkles size={16} /> {t('explainBtn', lang)}</>}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(232,93,117,0.08)', border: '1px solid rgba(232,93,117,0.25)', borderRadius: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#E85D75', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />{error}
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Result card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(91,141,239,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 color="var(--success)" size={22} />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>{t('analysisComplete', lang)}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('viaLabel', lang)} {analysis.provider}</span>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }} onClick={() => { setAnalysis(null); setFile(null); setChatMessages([]); }}>
                <FileText size={14} /> {t('uploadAnother', lang)}
              </button>
            </div>

            <div style={{ fontSize: '0.93rem', lineHeight: 1.7 }}>
              {analysis.explanation.split('\n').map((line, idx) => <MarkdownLine key={idx} line={line} idx={idx} />)}
            </div>
          </div>

          {/* Follow-up chat */}
          <div className="card">
            <div className="card-title"><MessageSquare /><span>{t('chatTitle', lang)}</span></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '1rem' }}>
              {t('chatHint', lang)}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', height: '320px', background: 'var(--bg-tertiary)', borderRadius: '14px', border: '1px solid rgba(91,141,239,0.12)', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%', padding: '0.65rem 0.95rem', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : '#fff',
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.83rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(91,141,239,0.14)',
                      boxShadow: msg.role === 'user' ? '0 4px 12px var(--primary-glow)' : 'none',
                    }}>{msg.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '0.65rem 1rem', borderRadius: '16px 16px 16px 4px', background: '#fff', border: '1px solid rgba(91,141,239,0.14)', display: 'flex', gap: 4 }}>
                      {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', animation: `chatDot 1.2s ease-in-out ${i*0.2}s infinite`, display: 'inline-block' }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(91,141,239,0.12)', display: 'flex', gap: '0.5rem', background: '#fff' }}>
                <input
                  type="text" value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder={t('chatPlaceholder', lang)}
                  style={{ flex: 1, padding: '0.6rem 0.85rem', background: 'var(--bg-tertiary)', border: '1px solid rgba(91,141,239,0.18)', borderRadius: '10px', fontSize: '0.83rem', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(91,141,239,0.18)'}
                />
                <button onClick={handleChat} disabled={!chatInput.trim() || chatLoading}
                  style={{ width: 38, height: 38, borderRadius: '10px', border: 'none', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', background: chatInput.trim() && !chatLoading ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={15} color={chatInput.trim() && !chatLoading ? '#fff' : 'var(--text-muted)'} />
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes chatDot { 0%,80%,100%{transform:scale(0.7);opacity:0.4} 40%{transform:scale(1);opacity:1} }
          `}</style>
        </div>
      )}
    </div>
  );
}