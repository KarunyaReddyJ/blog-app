'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('That login did not work. Double-check the credentials and admin role.');
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (signInError) {
      console.error(signInError);
      setError('Unable to sign in right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--ink-muted)]">Northstar Notes</p>
          <h1 className="font-serif text-5xl leading-[1.02] text-[color:var(--ink-strong)] sm:text-6xl">
            Sign in to edit, publish, and shape the journal.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[color:var(--ink-soft)]">
            This workspace is for your editorial team. Once you’re in, you can draft posts, upload covers, add tags,
            and publish directly to the public site.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/75 p-5">
              <p className="font-serif text-2xl text-[color:var(--ink-strong)]">Write in blocks</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Build clean article layouts with headings, quotes, code, lists, and images.
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/75 p-5">
              <p className="font-serif text-2xl text-[color:var(--ink-strong)]">Publish with context</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Add excerpts, tags, and metadata so the public site feels polished from day one.
              </p>
            </div>
          </div>
        </section>

        <section className="card-surface p-6 sm:p-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Admin access</p>
            <h2 className="font-serif text-3xl text-[color:var(--ink-strong)]">Welcome back</h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="field-shell">
              <span className="field-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-input"
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="field-shell">
              <span className="field-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-input"
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </label>

            {error ? <div className="rounded-2xl bg-[#fdf0e8] px-4 py-3 text-sm text-[#9a4f32]">{error}</div> : null}

            <button type="submit" disabled={isLoading} className="button-primary w-full">
              {isLoading ? 'Signing in...' : 'Enter dashboard'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-4 text-sm text-[color:var(--ink-soft)]">
            <Link href="/" className="hover:text-[color:var(--ink-strong)]">
              Return to homepage
            </Link>
            <Link href="/blog" className="hover:text-[color:var(--ink-strong)]">
              Read the journal
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
