'use client';

import { startTransition, useEffect, useState } from 'react';

export function PostEngagement({
  postId,
  initialViews,
  initialLikes,
  className = '',
}: {
  postId: number;
  initialViews: number;
  initialLikes: number;
  className?: string;
}) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      try {
        const [metricsResponse, likedResponse] = await Promise.all([
          fetch(`/api/metrics?id=${postId}`),
          fetch(`/api/like?id=${postId}`),
          fetch(`/api/view?id=${postId}`, { method: 'POST' }),
        ]);

        if (!active) return;

        if (metricsResponse.ok) {
          const metricsPayload = await metricsResponse.json();
          setViews(metricsPayload.data?.views ?? initialViews);
          setLikes(metricsPayload.data?.likes ?? initialLikes);
        }

        if (likedResponse.ok) {
          const likePayload = await likedResponse.json();
          setLiked(Boolean(likePayload.liked));
        }
      } catch {
        // Leave initial values in place if tracking is unavailable.
      }
    };

    loadState();

    return () => {
      active = false;
    };
  }, [initialLikes, initialViews, postId]);

  const handleLike = async () => {
    if (busy || liked) return;

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/like?id=${postId}`, {
        method: 'POST',
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || 'Unable to save your like right now.');
        return;
      }

      startTransition(() => {
        setLiked(true);
        setLikes((current) => current + 1);
      });
    } catch {
      setMessage('Unable to save your like right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`mx-auto flex max-w-3xl flex-col gap-4 border-y border-[color:var(--border)] py-5 sm:max-w-[52rem] sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--ink-soft)]">
        <span className="pill">{views} views</span>
        <span className="pill">{likes} likes</span>
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        <button
          type="button"
          onClick={handleLike}
          disabled={busy || liked}
          className={`rounded-full px-4 py-2 text-sm transition ${
            liked
              ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
              : 'bg-[color:var(--accent)] text-white hover:opacity-90'
          } disabled:cursor-not-allowed disabled:opacity-75`}
        >
          {liked ? 'Liked' : busy ? 'Saving...' : 'Like this article'}
        </button>

        {message ? <p className="text-sm text-[color:#9a4f32]">{message}</p> : null}
      </div>
    </div>
  );
}
