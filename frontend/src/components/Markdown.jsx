import React from 'react';

/**
 * Turns **bold** segments within a single line of text into <strong> spans.
 * Shared by ReportUploader (report analysis + follow-up chat) and ChatBot,
 * so AI responses that use markdown-style **bold** actually render as bold
 * instead of showing the literal asterisks.
 */
export function renderInlineMarkdown(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong>
      : part
  );
}

/** One line of a markdown-ish block: headers, bullets, dividers, or plain text with inline bold. */
function MarkdownLine({ line, idx }) {
  if (line.startsWith('# '))
    return <h2 key={idx} style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', margin: '1.5rem 0 0.75rem', color: 'var(--primary)' }}>{renderInlineMarkdown(line.slice(2))}</h2>;
  if (line.startsWith('## '))
    return <h3 key={idx} style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: '1.25rem 0 0.5rem', color: 'var(--text-primary)' }}>{renderInlineMarkdown(line.slice(3))}</h3>;
  if (line.startsWith('### '))
    return <h4 key={idx} style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', margin: '1rem 0 0.4rem', color: 'var(--primary)' }}>{renderInlineMarkdown(line.slice(4))}</h4>;
  if (line.startsWith('- ') || line.startsWith('* '))
    return <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '0.3rem', lineHeight: 1.6 }}>{renderInlineMarkdown(line.slice(2))}</li>;
  if (line.trim() === '---')
    return <hr key={idx} style={{ border: 'none', borderBottom: '1px solid rgba(91,141,239,0.15)', margin: '1.25rem 0' }} />;
  if (!line.trim()) return <div key={idx} style={{ height: '0.5rem' }} />;
  return <p key={idx} style={{ marginBottom: '0.6rem', lineHeight: 1.7 }}>{renderInlineMarkdown(line)}</p>;
}

/**
 * Renders a full block of markdown-ish AI output (multiple lines, possibly
 * with headers/bullets/bold) as React elements. Use this for anything that
 * could contain ## headers or **bold** — report analyses, chat replies, etc.
 */
export default function MarkdownBlock({ content }) {
  if (!content) return null;
  return content.split('\n').map((line, idx) => <MarkdownLine key={idx} line={line} idx={idx} />);
}
