/* eslint-disable @next/next/no-img-element */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PostBody } from '@/components/post-body';
import { PostCard } from '@/components/post-card';
import { PostEngagement } from '@/components/post-engagement';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPublishedPostBySlug, getPublishedPostSlugs, getPublishedPosts } from '@/lib/blog';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post not found',
    };
  }

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || 'Read the latest article from Northstar Notes.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.published_at || undefined,
      images: post.cover_image ? [{ url: post.cover_image, alt: post.title }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = (await getPublishedPosts({ limit: 4, sort: 'recent' })).filter(
    (candidate) => candidate.slug !== post.slug,
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    image: post.cover_image || undefined,
    keywords: post.tags.map((tag) => tag.name),
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <article className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-5">
            <Link href="/blog" className="text-sm font-medium text-[color:var(--accent)]">
              Back to journal
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
              <span>{formatDate(post.published_at)}</span>
              <span>{post.readingTime} min read</span>
              <span>{post.view_count} views</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-5xl leading-[1.02] text-[color:var(--ink-strong)] sm:text-6xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="max-w-3xl text-xl leading-8 text-[color:var(--ink-soft)]">{post.excerpt}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link key={tag.id} href={`/blog?tag=${tag.slug}`} className="pill">
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>

          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full rounded-[36px] border border-[color:var(--border)] object-cover shadow-[0_30px_80px_rgba(31,36,48,0.08)]"
            />
          ) : null}

          <PostEngagement postId={post.id} initialViews={post.view_count} initialLikes={post.like_count} />

          <div className="card-surface p-6 sm:p-8">
            <PostBody content={post.content} />
          </div>
        </article>

        {relatedPosts.length > 0 ? (
          <section className="mt-16 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Keep reading</p>
              <h2 className="mt-2 font-serif text-4xl text-[color:var(--ink-strong)]">More from the journal</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {relatedPosts.slice(0, 3).map((relatedPost) => (
                <PostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        ) : null}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
