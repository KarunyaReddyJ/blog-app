import Link from 'next/link';
import { PostCard } from '@/components/post-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getAllPublicTags, getPublishedPosts } from '@/lib/blog';

export default async function HomePage() {
  const [featuredPosts, tags] = await Promise.all([
    getPublishedPosts({ limit: 3, sort: 'recent' }),
    getAllPublicTags(),
  ]);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <SiteHeader />

      <main>
        <section className="hero-shell">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div className="space-y-7">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
                Editorial blog platform
              </p>
              <div className="space-y-5">
                <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] text-[color:var(--ink-strong)] sm:text-6xl">
                  Built for publishing thoughtful writing, not just storing posts.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[color:var(--ink-soft)]">
                  The app now supports a real journal experience: elegant public reading pages, a proper authoring flow,
                  and admin tools that feel closer to a product than a backend demo.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/blog" className="button-primary">
                  Explore the journal
                </Link>
                <Link href="/admin/dashboard" className="button-secondary">
                  Open dashboard
                </Link>
              </div>
            </div>

            <div className="card-surface overflow-hidden p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] bg-[color:var(--surface)] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Writing</p>
                  <p className="mt-4 font-serif text-3xl text-[color:var(--ink-strong)]">Blocks</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    Structured story sections with live preview and publishing controls.
                  </p>
                </div>
                <div className="rounded-[24px] bg-[color:var(--surface)] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Readers</p>
                  <p className="mt-4 font-serif text-3xl text-[color:var(--ink-strong)]">Metrics</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    Views, likes, and tag browsing built into the public experience.
                  </p>
                </div>
                <div className="rounded-[24px] bg-[color:var(--surface)] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Design</p>
                  <p className="mt-4 font-serif text-3xl text-[color:var(--ink-strong)]">Calm</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    A quieter visual system with warmer tones and more editorial spacing.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-[color:var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Popular topics</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.slice(0, 8).map((tag) => (
                      <Link key={tag.id} href={`/blog?tag=${tag.slug}`} className="pill">
                        {tag.name}
                      </Link>
                    ))
                  ) : (
                    <span className="text-sm text-[color:var(--ink-soft)]">
                      Add tags from the editor and they will show up here.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Latest writing</p>
              <h2 className="mt-2 font-serif text-4xl text-[color:var(--ink-strong)]">Recent notes from the journal</h2>
            </div>
            <Link href="/blog" className="text-sm font-medium text-[color:var(--accent)]">
              View all posts
            </Link>
          </div>

          {featuredPosts.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredPosts.map((post, index) => (
                <PostCard key={post.id} post={post} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="card-surface p-8">
              <h3 className="font-serif text-3xl text-[color:var(--ink-strong)]">Your first article will land beautifully here.</h3>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
                Sign into the admin dashboard, create a post, and publish it to light up the journal and homepage cards.
              </p>
              <Link href="/admin/posts/new" className="button-primary mt-6 inline-flex">
                Create the first post
              </Link>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
