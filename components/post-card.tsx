/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import type { PostWithTags } from '@/lib/blog';

type PostCardLayout = 'stacked' | 'list';

function formatDate(value: string | null) {
  if (!value) return 'Draft';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function clampStyle(lines: number) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  };
}

export function PostCard({
  post,
  priority = false,
  layout = 'stacked',
}: {
  post: PostWithTags;
  priority?: boolean;
  layout?: PostCardLayout;
}) {
  const isList = layout === 'list';

  return (
    <article
      className={`card-surface flex h-full flex-col overflow-hidden ${
        isList
          ? 'md:grid md:grid-cols-[280px_minmax(0,1fr)]'
          : priority
            ? 'lg:grid lg:grid-cols-[1.15fr_0.85fr]'
            : ''
      }`}
    >
      <div
        className={`relative overflow-hidden bg-[color:var(--surface-strong)] ${
          isList ? 'min-h-[220px] md:min-h-full' : 'min-h-[220px]'
        }`}
      >
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className={`h-full w-full object-cover transition duration-700 hover:scale-[1.03] ${
              isList ? 'md:aspect-[4/3]' : ''
            }`}
          />
        ) : (
          <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(106,123,110,0.28),_transparent_55%),linear-gradient(160deg,_rgba(237,231,218,1),_rgba(219,226,218,1))] p-6">
            <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
              Essay
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-6 p-6 sm:p-7">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
            <span>{formatDate(post.published_at)}</span>
            <span>{post.readingTime} min read</span>
            <span>{post.view_count} views</span>
          </div>

          <div className="space-y-3">
            <h2
              className={`font-serif leading-tight text-[color:var(--ink-strong)] ${
                isList ? 'text-2xl sm:text-[2rem]' : 'text-2xl sm:text-3xl'
              }`}
              style={clampStyle(isList ? 3 : 4)}
            >
              <Link href={`/blog/${post.slug}`} className="hover:text-[color:var(--accent)]">
                {post.title}
              </Link>
            </h2>
            <p
              className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)] sm:text-base"
              style={clampStyle(isList ? 5 : 6)}
            >
              {post.excerpt || 'A clear, grounded note from the journal.'}
            </p>
          </div>
        </div>

        <div className={`flex flex-wrap gap-4 ${isList ? 'items-start justify-between' : 'items-center justify-between'}`}>
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`} className="pill">
                {tag.name}
              </Link>
            ))}
          </div>

          <Link href={`/blog/${post.slug}`} className="text-sm font-medium text-[color:var(--accent)]">
            Read article
          </Link>
        </div>
      </div>
    </article>
  );
}
