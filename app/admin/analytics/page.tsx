import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isAdminUser } from '@/lib/admin';
import { getAdminPosts } from '@/lib/blog';

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const isAdmin = await isAdminUser(session.user.id, session.user.role);
  if (!isAdmin) {
    redirect('/');
  }

  const posts = await getAdminPosts(session.user.id);
  const rankedByViews = [...posts].sort((a, b) => b.view_count - a.view_count);
  const rankedByLikes = [...posts].sort((a, b) => b.like_count - a.like_count);

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_30px_80px_rgba(31,36,48,0.08)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Analytics</p>
        <h1 className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">What readers are responding to</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[color:var(--ink-soft)]">
          This view keeps the analytics simple: which posts are getting attention, which ones are earning likes, and
          how your current library is split between drafts and published work.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Total posts</p>
          <p className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">{posts.length}</p>
        </div>
        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Published</p>
          <p className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">
            {posts.filter((post) => Boolean(post.published_at)).length}
          </p>
        </div>
        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Drafts</p>
          <p className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">
            {posts.filter((post) => !post.published_at).length}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_30px_80px_rgba(31,36,48,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Top by views</p>
              <h2 className="mt-2 font-serif text-3xl text-[color:var(--ink-strong)]">Most-read posts</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {rankedByViews.slice(0, 5).map((post) => (
              <div key={post.id} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl text-[color:var(--ink-strong)]">{post.title}</h3>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      {post.view_count} views and {post.readingTime} min read
                    </p>
                  </div>
                  <Link href={`/admin/posts/${post.id}/edit`} className="button-secondary">
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_30px_80px_rgba(31,36,48,0.08)]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Top by likes</p>
            <h2 className="mt-2 font-serif text-3xl text-[color:var(--ink-strong)]">Most-loved posts</h2>
          </div>

          <div className="mt-6 space-y-4">
            {rankedByLikes.slice(0, 5).map((post) => (
              <div key={post.id} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl text-[color:var(--ink-strong)]">{post.title}</h3>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      {post.like_count} likes and {post.view_count} views
                    </p>
                  </div>
                  <Link href={`/admin/posts/${post.id}/edit`} className="button-secondary">
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
