'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import type { CommentNode } from '@/lib/database';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function CommentForm({
  postId,
  parentId,
  onSubmitted,
  onCancel,
  submitLabel,
}: {
  postId: number;
  parentId?: number | null;
  onSubmitted: (comment: CommentNode) => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setAuthorName('');
    setAuthorEmail('');
    setContent('');
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          parentId,
          authorName,
          authorEmail,
          content,
        }),
      });

      const payload = (await response.json()) as { error?: string; data?: CommentNode };

      if (!response.ok || !payload.data) {
        setError(payload.error || 'Unable to post comment right now.');
        return;
      }

      onSubmitted({ ...payload.data, replies: [] });
      reset();
      onCancel?.();
    } catch {
      setError('Unable to post comment right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--background-muted)] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-shell">
          <span className="field-label">Name</span>
          <input
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            className="field-input"
            maxLength={60}
            required
          />
        </label>
        <label className="field-shell">
          <span className="field-label">Email</span>
          <input
            type="email"
            value={authorEmail}
            onChange={(event) => setAuthorEmail(event.target.value)}
            className="field-input"
            maxLength={120}
            placeholder="Optional"
          />
        </label>
      </div>

      <label className="field-shell">
        <span className="field-label">Comment</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="field-input min-h-32 resize-y"
          maxLength={2000}
          required
        />
      </label>

      {error ? <p className="text-sm text-[color:#b25535]">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="button-primary">
          {isSubmitting ? 'Posting...' : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="button-secondary">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function addReply(nodes: CommentNode[], parentId: number, reply: CommentNode): CommentNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, replies: [...node.replies, reply] };
    }

    return { ...node, replies: addReply(node.replies, parentId, reply) };
  });
}

function CommentItem({
  comment,
  postId,
  onReplySubmitted,
}: {
  comment: CommentNode;
  postId: number;
  onReplySubmitted: (parentId: number, reply: CommentNode) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="space-y-4 border-l border-[color:var(--border)] pl-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--ink-muted)]">
          <span className="font-medium text-[color:var(--ink-strong)]">{comment.author_name}</span>
          <span>{formatDate(comment.created_at)}</span>
        </div>
        <p className="whitespace-pre-wrap text-base leading-7 text-[color:var(--ink-soft)]">{comment.content}</p>
        <button type="button" onClick={() => setIsReplying((value) => !value)} className="text-sm font-medium text-[color:var(--accent)]">
          {isReplying ? 'Close reply' : 'Reply'}
        </button>
      </div>

      {isReplying ? (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          submitLabel="Post reply"
          onCancel={() => setIsReplying(false)}
          onSubmitted={(reply) => onReplySubmitted(comment.id, reply)}
        />
      ) : null}

      {comment.replies.length > 0 ? (
        <div className="space-y-6">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} onReplySubmitted={onReplySubmitted} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentsSection({
  postId,
  initialComments,
  className = '',
}: {
  postId: number;
  initialComments: CommentNode[];
  className?: string;
}) {
  const [comments, setComments] = useState(initialComments);

  return (
    <section className={`mx-auto max-w-3xl space-y-8 sm:max-w-[52rem] ${className}`}>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">Discussion</p>
        <h2 className="font-serif text-4xl text-[color:var(--ink-strong)]">Comments</h2>
        <p className="max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
          Share a thought, add context, or reply to another reader.
        </p>
      </div>

      <CommentForm
        postId={postId}
        submitLabel="Post comment"
        onSubmitted={(comment) => setComments((current) => [...current, comment])}
      />

      {comments.length > 0 ? (
        <div className="space-y-8">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReplySubmitted={(parentId, reply) => {
                setComments((current) => addReply(current, parentId, reply));
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-base text-[color:var(--ink-soft)]">No comments yet. Start the conversation.</p>
      )}
    </section>
  );
}
