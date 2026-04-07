'use client';

import { useState } from 'react';
import type { SiteResume } from '@/lib/site';

export function AdminResumeForm({ initialResume }: { initialResume: SiteResume }) {
  const [title, setTitle] = useState(initialResume.title);
  const [summary, setSummary] = useState(initialResume.summary);
  const [resumeUrl, setResumeUrl] = useState(initialResume.resume_url || '');
  const [highlights, setHighlights] = useState(initialResume.highlights.join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          resume_url: resumeUrl,
          highlights: highlights.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error || 'Unable to save resume.');
        return;
      }

      setMessage('Resume updated.');
    } catch {
      setError('Unable to save resume.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Resume</p>
        <h1 className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">Public resume page</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
          Publish a public resume link and a short summary for visitors.
        </p>
      </section>

      <section className="editor-card space-y-5">
        <label className="field-shell">
          <span className="field-label">Title</span>
          <input className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">Summary</span>
          <textarea className="field-input min-h-[120px]" value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">Resume URL</span>
          <input className="field-input" value={resumeUrl} onChange={(event) => setResumeUrl(event.target.value)} placeholder="https://..." />
        </label>
        <label className="field-shell">
          <span className="field-label">Highlights</span>
          <textarea className="field-input min-h-[110px]" value={highlights} onChange={(event) => setHighlights(event.target.value)} />
        </label>
      </section>

      {error ? <p className="text-sm text-[color:#b25535]">{error}</p> : null}
      {message ? <p className="text-sm text-[color:var(--accent)]">{message}</p> : null}

      <button type="button" className="button-primary" onClick={() => void handleSave()} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save resume'}
      </button>
    </div>
  );
}
