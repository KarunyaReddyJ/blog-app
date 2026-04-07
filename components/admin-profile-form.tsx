'use client';

import { useState } from 'react';
import type { SiteProfile } from '@/lib/site';

export function AdminProfileForm({ initialProfile }: { initialProfile: SiteProfile }) {
  const [fullName, setFullName] = useState(initialProfile.full_name);
  const [headline, setHeadline] = useState(initialProfile.headline);
  const [shortBio, setShortBio] = useState(initialProfile.short_bio);
  const [longBio, setLongBio] = useState(initialProfile.long_bio || '');
  const [location, setLocation] = useState(initialProfile.location || '');
  const [email, setEmail] = useState(initialProfile.email || '');
  const [githubUrl, setGithubUrl] = useState(initialProfile.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedin_url || '');
  const [xUrl, setXUrl] = useState(initialProfile.x_url || '');
  const [focusAreas, setFocusAreas] = useState(initialProfile.focus_areas.join(', '));
  const [currentInterests, setCurrentInterests] = useState(initialProfile.current_interests.join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          headline,
          short_bio: shortBio,
          long_bio: longBio,
          location,
          email,
          github_url: githubUrl,
          linkedin_url: linkedinUrl,
          x_url: xUrl,
          focus_areas: focusAreas.split(',').map((item) => item.trim()).filter(Boolean),
          current_interests: currentInterests.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error || 'Unable to save profile.');
        return;
      }

      setMessage('Profile updated.');
    } catch {
      setError('Unable to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Profile</p>
        <h1 className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">Public intro</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
          These details power the public homepage and personal identity sections.
        </p>
      </section>

      <section className="editor-card space-y-5">
        <label className="field-shell">
          <span className="field-label">Full name</span>
          <input className="field-input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">Headline</span>
          <input className="field-input" value={headline} onChange={(event) => setHeadline(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">Short bio</span>
          <textarea className="field-input min-h-[120px]" value={shortBio} onChange={(event) => setShortBio(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">Long bio</span>
          <textarea className="field-input min-h-[150px]" value={longBio} onChange={(event) => setLongBio(event.target.value)} />
        </label>
      </section>

      <section className="editor-card grid gap-5 md:grid-cols-2">
        <label className="field-shell">
          <span className="field-label">Location</span>
          <input className="field-input" value={location} onChange={(event) => setLocation(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">Email</span>
          <input className="field-input" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">GitHub URL</span>
          <input className="field-input" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">LinkedIn URL</span>
          <input className="field-input" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} />
        </label>
        <label className="field-shell md:col-span-2">
          <span className="field-label">X URL</span>
          <input className="field-input" value={xUrl} onChange={(event) => setXUrl(event.target.value)} />
        </label>
      </section>

      <section className="editor-card grid gap-5 md:grid-cols-2">
        <label className="field-shell">
          <span className="field-label">Focus areas</span>
          <textarea className="field-input min-h-[120px]" value={focusAreas} onChange={(event) => setFocusAreas(event.target.value)} />
        </label>
        <label className="field-shell">
          <span className="field-label">Current interests</span>
          <textarea className="field-input min-h-[120px]" value={currentInterests} onChange={(event) => setCurrentInterests(event.target.value)} />
        </label>
      </section>

      {error ? <p className="text-sm text-[color:#b25535]">{error}</p> : null}
      {message ? <p className="text-sm text-[color:var(--accent)]">{message}</p> : null}

      <button type="button" className="button-primary" onClick={() => void handleSave()} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save profile'}
      </button>
    </div>
  );
}
