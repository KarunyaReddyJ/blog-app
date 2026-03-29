import type { Metadata } from 'next';
import Link from 'next/link';
import { PostCard } from '@/components/post-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getAllPublicTags, getPublishedPosts, type PostSort } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'A collection of essays, notes, and tutorials from Northstar Notes.',
};

function getSortLabel(sort: PostSort) {
  if (sort === 'liked') return 'Most liked';
  if (sort === 'viewed') return 'Most viewed';
  return 'Most recent';
}

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const sort = (resolvedSearchParams.sort || 'recent') as PostSort;
  const selectedTag = resolvedSearchParams.tag || undefined;

  const [posts, tags] = await Promise.all([
    getPublishedPosts({ sort, tag: selectedTag, limit: 24 }),
    getAllPublicTags(),
  ]);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">The journal</p>
            <h1 className="font-serif text-5xl text-[color:var(--ink-strong)] sm:text-6xl">Articles designed to be read, not skimmed.</h1>
            <p className="max-w-3xl text-lg leading-8 text-[color:var(--ink-soft)]">
              Browse the latest writing, sort by what people are reading, or filter into a topic when you want
              something specific.
            </p>
          </div>

          <div className="card-surface flex flex-col gap-5 p-5 sm:p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Sort by</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['recent', 'liked', 'viewed'] as PostSort[]).map((option) => (
                  <Link
                    key={option}
                    href={`/blog?sort=${option}${selectedTag ? `&tag=${selectedTag}` : ''}`}
                    className={`pill ${sort === option ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
                  >
                    {getSortLabel(option)}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Topics</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/blog?sort=${sort}`}
                  className={`pill ${!selectedTag ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
                >
                  All topics
                </Link>
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog?sort=${sort}&tag=${tag.slug}`}
                    className={`pill ${selectedTag === tag.slug ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} layout="list" />
              ))}
            </div>
          ) : (
            <div className="card-surface p-8">
              <h2 className="font-serif text-3xl text-[color:var(--ink-strong)]">No posts match this view yet.</h2>
              <p className="mt-3 text-base leading-7 text-[color:var(--ink-soft)]">
                Try a different sort or tag filter, or publish a new article from the admin dashboard.
              </p>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
