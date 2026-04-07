import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getSiteProfile, getSiteResume } from '@/lib/site';

export default async function ResumePage() {
  const [profile, resume] = await Promise.all([getSiteProfile(), getSiteResume()]);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <section className="space-y-6 border-b border-[color:var(--border)] pb-10">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Resume</p>
          <h1 className="font-serif text-5xl text-[color:var(--ink-strong)] sm:text-6xl">{profile.full_name}</h1>
          <p className="max-w-3xl text-xl leading-9 text-[color:var(--ink-soft)]">{resume.summary}</p>

          <div className="flex flex-wrap gap-3">
            {resume.resume_url ? (
              <a href={resume.resume_url} className="button-primary" target="_blank" rel="noreferrer">
                Open PDF resume
              </a>
            ) : null}
            <Link href="/blog" className="button-secondary">
              Read writing
            </Link>
          </div>
        </section>

        <section className="grid gap-10 py-12 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Snapshot</p>
            <p className="text-base leading-8 text-[color:var(--ink-soft)]">{profile.short_bio}</p>
            {profile.location ? <p className="text-sm text-[color:var(--ink-muted)]">Based in {profile.location}</p> : null}
          </div>

          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Highlights</p>
            <ul className="space-y-4 text-base leading-8 text-[color:var(--ink-soft)]">
              {resume.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
