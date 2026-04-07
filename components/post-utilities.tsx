'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CommentsSection } from '@/components/comments-section';
import { PostEngagement } from '@/components/post-engagement';
import type { CommentNode } from '@/lib/database';

export function PostUtilities({
  postId,
  initialViews,
  initialLikes,
  comments,
  tags,
}: {
  postId: number;
  initialViews: number;
  initialLikes: number;
  comments: CommentNode[];
  tags: Array<{ id: number; name: string; slug: string }>;
}) {
  const [activePanel, setActivePanel] = useState<'comments' | 'topics' | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const togglePanel = (panel: 'comments' | 'topics') => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMessage('Link copied');
      window.setTimeout(() => setCopyMessage(null), 1800);
    } catch {
      setCopyMessage('Unable to copy');
      window.setTimeout(() => setCopyMessage(null), 1800);
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-30 hidden flex-col gap-3 lg:flex">
        <button type="button" className="theme-toggle w-auto px-4 text-sm" onClick={() => togglePanel('comments')}>
          Comments
        </button>
        <button type="button" className="theme-toggle w-auto px-4 text-sm" onClick={() => togglePanel('topics')}>
          Topics
        </button>
        <button type="button" className="theme-toggle w-auto px-4 text-sm" onClick={() => void handleCopyLink()}>
          Share
        </button>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-30 flex gap-3 lg:hidden">
        <button type="button" className="theme-toggle h-auto flex-1 py-3 text-sm" onClick={() => togglePanel('comments')}>
          Comments
        </button>
        <button type="button" className="theme-toggle h-auto flex-1 py-3 text-sm" onClick={() => togglePanel('topics')}>
          Topics
        </button>
        <button type="button" className="theme-toggle h-auto flex-1 py-3 text-sm" onClick={() => void handleCopyLink()}>
          Share
        </button>
      </div>

      {copyMessage ? (
        <div className="fixed bottom-24 right-5 z-30 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--ink-soft)]">
          {copyMessage}
        </div>
      ) : null}

      {activePanel ? (
        <div className="fixed inset-0 z-40 bg-black/25" onClick={() => setActivePanel(null)}>
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-[color:var(--border)] bg-[color:var(--background)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
                  {activePanel === 'comments' ? 'Conversation' : 'Topics'}
                </p>
                <h2 className="mt-2 font-serif text-3xl text-[color:var(--ink-strong)]">
                  {activePanel === 'comments' ? 'Comments' : 'Explore this post'}
                </h2>
              </div>
              <button type="button" className="theme-toggle" onClick={() => setActivePanel(null)} aria-label="Close panel">
                ×
              </button>
            </div>

            <div className="overflow-y-auto pb-12">
              {activePanel === 'comments' ? (
                <div className="space-y-8">
                  <PostEngagement postId={postId} initialViews={initialViews} initialLikes={initialLikes} className="max-w-none sm:max-w-none" />
                  <CommentsSection postId={postId} initialComments={comments} className="max-w-none sm:max-w-none" />
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">Tags</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Link key={tag.id} href={`/blog?tag=${tag.slug}`} className="pill" onClick={() => setActivePanel(null)}>
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">Quick actions</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" className="button-secondary" onClick={() => void handleCopyLink()}>
                        Copy article link
                      </button>
                      <button type="button" className="button-primary" onClick={() => setActivePanel('comments')}>
                        Open comments
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
