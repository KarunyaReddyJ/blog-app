import Link from 'next/link';
import { PostCard } from '@/components/post-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPublishedPosts } from '@/lib/blog';
import { getSiteProfile } from '@/lib/site';

export default async function HomePage() {
  const [profile, posts] = await Promise.all([
    getSiteProfile(),
    getPublishedPosts({ limit: 3, sort: 'recent' }),
  ]);

  const links = [
    profile.github_url ? { href: profile.github_url, label: 'GitHub' } : null,
    profile.linkedin_url ? { href: profile.linkedin_url, label: 'LinkedIn' } : null,
    profile.x_url ? { href: profile.x_url, label: 'X' } : null,
    profile.email ? { href: `mailto:${profile.email}`, label: 'Email' } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <SiteHeader />

      <main>
        <section className="plain-section">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
            <div className="space-y-7">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">Software engineer</p>
              <div className="space-y-5">
                <h1 className="max-w-4xl font-serif text-5xl leading-[1.02] text-[color:var(--ink-strong)] sm:text-6xl">
                  {profile.full_name}
                </h1>
                <p className="max-w-3xl text-2xl leading-10 text-[color:var(--ink-soft)]">{profile.headline}</p>
                <p className="max-w-3xl text-lg leading-8 text-[color:var(--ink-soft)]">{profile.short_bio}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/blog" className="button-primary">
                  Read writing
                </Link>
                <Link href="/resume" className="button-secondary">
                  View resume
                </Link>
              </div>

              {links.length > 0 ? (
                <div className="flex flex-wrap gap-3 pt-2">
                  {links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="pill"
                      target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-8 border-l border-[color:var(--border)] pl-0 lg:pl-10">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">About</p>
                <p className="mt-4 text-base leading-8 text-[color:var(--ink-soft)]">
                  {profile.long_bio || profile.short_bio}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Focus</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.focus_areas.map((item) => (
                    <span key={item} className="pill">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Currently exploring</p>
                <ul className="mt-4 space-y-3 text-base leading-7 text-[color:var(--ink-soft)]">
                  {profile.current_interests.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Writing</p>
              <h2 className="mt-2 font-serif text-4xl text-[color:var(--ink-strong)]">Recent posts</h2>
            </div>
            <Link href="/blog" className="text-sm font-medium text-[color:var(--accent)]">
              View all writing
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {posts.map((post, index) => (
                <PostCard key={post.id} post={post} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[color:var(--border)] px-0 py-10">
              <h3 className="font-serif text-3xl text-[color:var(--ink-strong)]">Writing will appear here.</h3>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
                Publish from the admin workspace and this section will start reflecting your latest work.
              </p>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
