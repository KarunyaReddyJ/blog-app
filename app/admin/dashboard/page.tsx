import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isAdminUser } from '@/lib/admin';
import { getAdminPosts } from '@/lib/blog';

function formatDate(value: string | null) {
  if (!value) return 'Draft';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const isAdmin = await isAdminUser(session.user.id, session.user.role);
  if (!isAdmin) {
    redirect('/');
  }

  const posts = await getAdminPosts(session.user.id);
  const publishedPosts = posts.filter((post) => Boolean(post.published_at));
  const draftPosts = posts.filter((post) => !post.published_at);
  const totalViews = posts.reduce((sum, post) => sum + post.view_count, 0);
  const totalLikes = posts.reduce((sum, post) => sum + post.like_count, 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_30px_80px_rgba(31,36,48,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Overview</p>
          <h1 className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">Publishing dashboard</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
            Track what is live, what still needs editing, and which posts are drawing the most attention.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/posts/new" className="button-primary">
              Write a new post
            </Link>
            <Link href="/blog" className="button-secondary">
              View public site
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Publishing</p>
            <p className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">{publishedPosts.length}</p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{draftPosts.length} drafts waiting in progress.</p>
          </div>
          <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Engagement</p>
            <p className="mt-3 font-serif text-4xl text-[color:var(--ink-strong)]">{totalViews}</p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{totalLikes} likes across all posts.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-[32px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_30px_80px_rgba(31,36,48,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Library</p>
              <h2 className="mt-2 font-serif text-3xl text-[color:var(--ink-strong)]">All posts</h2>
            </div>
            <Link href="/admin/analytics" className="text-sm font-medium text-[color:var(--accent)]">
              Open analytics
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="mt-6 space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
                        <span>{formatDate(post.published_at || post.updated_at)}</span>
                        <span>{post.readingTime} min read</span>
                        <span>{post.view_count} views</span>
                        <span>{post.like_count} likes</span>
                      </div>

                      <div>
                        <h3 className="font-serif text-2xl text-[color:var(--ink-strong)]">{post.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
                          {post.excerpt || 'No excerpt yet.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span key={tag.id} className="pill">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em] ${
                          post.published_at
                            ? 'bg-[#e9f3ec] text-[#446155]'
                            : 'bg-[#f6f1e6] text-[#7d6842]'
                        }`}
                      >
                        {post.published_at ? 'Published' : 'Draft'}
                      </span>
                      <Link href={`/admin/posts/${post.id}/edit`} className="button-secondary">
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-[color:var(--border)] p-8 text-center">
              <h3 className="font-serif text-2xl text-[color:var(--ink-strong)]">No posts yet</h3>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Start with a draft and this dashboard will begin to fill out with real publishing activity.
              </p>
              <Link href="/admin/posts/new" className="button-primary mt-5 inline-flex">
                Create your first draft
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_30px_80px_rgba(31,36,48,0.08)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Workflow</p>
            <ul className="mt-4 space-y-4 text-sm leading-7 text-[color:var(--ink-soft)]">
              <li>Create the draft in the editor.</li>
              <li>Add a cover, tags, and SEO text.</li>
              <li>Preview the content blocks.</li>
              <li>Publish when the piece feels ready.</li>
            </ul>
          </div>

          <div className="rounded-[32px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_30px_80px_rgba(31,36,48,0.08)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">Top post</p>
            {posts[0] ? (
              <>
                <h3 className="mt-3 font-serif text-2xl text-[color:var(--ink-strong)]">{posts[0].title}</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                  {posts[0].view_count} views and {posts[0].like_count} likes so far.
                </p>
                <Link href={`/admin/posts/${posts[0].id}/edit`} className="button-secondary mt-5 inline-flex">
                  Open post
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                Publish something to see your top-performing article here.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
