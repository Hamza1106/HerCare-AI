import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, RotateCcw } from 'lucide-react';
import { t } from '../i18n';
import MarkdownBlock from '../utils/markdown';

const SUGGESTED_QUESTIONS = [
  "PCOS ke symptoms kya hain?",
  "Thyroid test kab karwana chahiye?",
  "Periods irregular kyun hote hain?",
  "Anemia se kaise bachein?",
  "Menopause kya hota hai?",
];

const SYSTEM_PROMPT = `You are HerCare AI, an intelligent and empathetic women's health companion built for Pakistani and South Asian women. You are knowledgeable, warm, and culturally sensitive.

Your expertise covers:
- PCOS (Polycystic Ovary Syndrome)
- Thyroid disorders (hypothyroidism, hyperthyroidism)
- Anemia and iron deficiency
- Endometriosis
- Menstrual irregularities and period health
- Menopause and perimenopause
- General gynecological health
- Post-discharge recovery
- Nutrition and lifestyle for women's health

Guidelines:
- Respond in the same language the user writes in (Roman Urdu or English)
- Be warm, empathetic, and non-judgmental
- Give detailed, helpful, medically accurate responses
- Always remind users to consult a qualified doctor for diagnosis or treatment
- You have full memory of this conversation — refer back to what was discussed
- Never give a robotic or generic response — be genuinely helpful and contextual
- If the user describes symptoms, ask follow-up questions to better understand their situation
- Format responses clearly with bullet points or numbered lists when listing information`;

async function callGeminiDirect(messages, geminiKey) {
  // Build conversation history for Gemini
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      ...history,
      { role: 'user', parts: [{ text: lastMessage.content }] }
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
    },
  };

  const apiKey = geminiKey || 'AIzaSyDemo'; // fallback to mock if no key
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Mock fallback when no API key
function getMockResponse(userText) {
  const text = userText.toLowerCase();
  if (text.includes('pcos')) return `PCOS (Polycystic Ovary Syndrome) ek common hormonal condition hai jo reproductive age ki women mein hoti hai.\n\n**Common symptoms:**\n• Irregular or missed periods\n• Weight gain, especially around the abdomen\n• Excess facial/body hair (hirsutism)\n• Acne aur oily skin\n• Hair thinning or loss\n• Difficulty getting pregnant\n\n**Management:**\n• Low-glycemic diet (vegetables, whole grains, legumes)\n• Regular exercise — even 30 min daily helpful hai\n• Stress management\n• Doctor se milein hormonal evaluation ke liye\n\nAap kaunse specific symptoms experience kar rahin hain? Main aur detail mein bata sakti hoon. 😊`;
  if (text.includes('thyroid')) return `Thyroid disorders Pakistan mein kafi common hain, especially women mein.\n\n**Hypothyroidism (underactive) symptoms:**\n• Fatigue aur weakness\n• Weight gain\n• Cold intolerance\n• Hair loss\n• Depression\n• Slow heart rate\n\n**Hyperthyroidism (overactive) symptoms:**\n• Weight loss\n• Rapid heartbeat\n• Anxiety\n• Heat intolerance\n• Tremors\n\n**Test:** TSH blood test se pata chalta hai. Agar TSH abnormal ho to T3/T4 bhi check karte hain.\n\nKya aap koi specific symptom feel kar rahi hain?`;
  if (text.includes('period') || text.includes('period')) return `Irregular periods kaafi reasons se ho sakti hain:\n\n• **Hormonal imbalance** — PCOS, thyroid issues\n• **Stress** — physical ya emotional\n• **Weight changes** — sudden gain ya loss\n• **Excessive exercise**\n• **Nutritional deficiencies** — especially iron, vitamin D\n• **Medications**\n\nAgar 3+ months se periods miss ho rahe hain ya bahut heavy/painful hain, to gynecologist se zaroor milein.\n\nKitne time se irregularity hai aur kya aur koi symptoms hain?`;
  return `Main aapki baat samajh gayi. Women's health ke baare mein aapka sawaal bahut important hai.\n\nSahi jawab dene ke liye please apna Gemini API key sidebar mein enter karein — isse main aapko detailed, personalized guidance de sakti hoon.\n\nAbhi ke liye: agar aap koi specific symptom ya concern describe karein, main apni best knowledge se help karne ki koshish karti hoon. 💙`;
}

export default function ChatBot({ backendUrl, geminiKey, lang = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Assalam-o-Alaikum! 💙 Main HerCare AI hoon — aapki women's health companion.\n\nMain yahan hoon aapki madad ke liye — PCOS, thyroid, periods, anemia, menopause, ya koi bhi sehat ka sawaal. Poochhein, bilkul freely!\n\n(Note: Main health awareness deti hoon. Diagnosis ya treatment ke liye apne doctor se zaroor milein.)",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('hercare-open-chat', handler);
    return () => window.removeEventListener('hercare-open-chat', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setShowSuggestions(false);
    setInput('');

    const updatedMessages = [...messages, { role: 'user', content: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Always go to backend — backend handles Gemini key from .env
      const headers = { 'Content-Type': 'application/json' };
      // If user has entered key in sidebar, send it too (overrides .env)
      if (geminiKey && geminiKey.trim().length > 10) {
        headers['Authorization'] = `Bearer ${geminiKey}`;
      }

      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || getMockResponse(userText);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getMockResponse(userText),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Assalam-o-Alaikum! 💙 Main HerCare AI hoon — nayi conversation shuru karte hain!\n\nKya poochna chahti hain aap?",
    }]);
    setShowSuggestions(true);
    setInput('');
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(p => !p)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '58px', height: '58px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px var(--primary-glow)', zIndex: 1000,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Open AI health chatbot"
      >
        {isOpen ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>

      {!isOpen && (
        <span style={{
          position: 'fixed', bottom: 'calc(2rem + 38px)', right: 'calc(2rem - 2px)',
          width: '12px', height: '12px', borderRadius: '50%',
          background: 'var(--secondary)', border: '2px solid var(--bg-primary)', zIndex: 1001,
        }} />
      )}

      {/* Chat window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 'calc(2rem + 70px)', right: '2rem',
          width: '370px', maxWidth: 'calc(100vw - 2rem)',
          height: '540px', maxHeight: 'calc(100vh - 120px)',
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(91,141,239,0.18)',
          borderRadius: '20px', boxShadow: '0 16px 48px rgba(91,141,239,0.20)',
          display: 'flex', flexDirection: 'column', zIndex: 999, overflow: 'hidden',
          animation: 'chatSlideUp 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>HerCare AI</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                  {geminiKey ? '● Gemini Connected' : '● Smart Responses Active'}
                </div>
              </div>
            </div>
            <button onClick={resetChat} title="New chat"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                    : 'var(--bg-tertiary)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(91,141,239,0.14)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.83rem', lineHeight: '1.6', whiteSpace: 'pre-wrap',
                  boxShadow: msg.role === 'user' ? '0 4px 12px var(--primary-glow)' : 'none',
                }}>
                  {msg.role === 'assistant' ? <MarkdownBlock content={msg.content} /> : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.65rem 1rem', borderRadius: '16px 16px 16px 4px', background: 'var(--bg-tertiary)', border: '1px solid rgba(91,141,239,0.14)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', animation: `chatDot 1.2s ease-in-out ${i*0.2}s infinite`, display: 'inline-block' }} />
                  ))}
                </div>
              </div>
            )}

            {showSuggestions && messages.length === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '2px' }}>{t('suggestedQuestionsLabel', lang)}</span>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid rgba(91,141,239,0.18)', borderRadius: '10px', padding: '0.45rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(91,141,239,0.18)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >{q}</button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(91,141,239,0.12)', display: 'flex', gap: '0.5rem', flexShrink: 0, background: 'var(--bg-secondary)' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chatInputPlaceholder', lang)}
              rows={1}
              style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid rgba(91,141,239,0.18)', borderRadius: '12px', padding: '0.6rem 0.85rem', color: 'var(--text-primary)', fontSize: '0.83rem', resize: 'none', outline: 'none', fontFamily: 'var(--font-body)', lineHeight: '1.4', maxHeight: '100px', overflowY: 'auto' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'rgba(91,141,239,0.18)'}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: '38px', height: '38px', borderRadius: '12px', background: input.trim() && !loading ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--bg-tertiary)', border: '1px solid rgba(91,141,239,0.18)', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end', transition: 'background 0.2s' }}
              aria-label="Send">
              <Send size={15} color={input.trim() && !loading ? '#fff' : 'var(--text-muted)'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </>
  );
}