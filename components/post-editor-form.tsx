/* eslint-disable @next/next/no-img-element */

'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useState } from 'react';
import { PostBody } from '@/components/post-body';
import { RichTextEditor } from '@/components/rich-text-editor';
import {
  CONTENT_LIMIT_BYTES,
  createEmptyContent,
  getContentSizeBytes,
  toEditorJsData,
} from '@/lib/content';

interface EditablePost {
  id?: number;
  title: string;
  excerpt: string;
  cover_image: string;
  seo_title: string;
  seo_description: string;
  content: unknown;
  tags: string[];
  published_at?: string | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PostEditorForm({
  initialPost,
  mode,
}: {
  initialPost?: EditablePost;
  mode: 'new' | 'edit';
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title || '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [coverImage, setCoverImage] = useState(initialPost?.cover_image || '');
  const [seoTitle, setSeoTitle] = useState(initialPost?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialPost?.seo_description || '');
  const [tagsInput, setTagsInput] = useState((initialPost?.tags || []).join(', '));
  const [editorData, setEditorData] = useState<unknown>(
    toEditorJsData(initialPost?.content || createEmptyContent()),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const serializedContent = useMemo(() => editorData, [editorData]);
  const contentSizeBytes = useMemo(() => getContentSizeBytes(serializedContent), [serializedContent]);
  const contentTooLarge = contentSizeBytes > CONTENT_LIMIT_BYTES;
  const tagList = useMemo(
    () => tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  );

  const savePost = async (publishAfterSave: boolean) => {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      if (contentTooLarge) {
        throw new Error('Content must be 16 MB or smaller before you can save.');
      }

      const response = await fetch('/api/admin/posts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: initialPost?.id,
          title,
          excerpt,
          cover_image: coverImage,
          seo_title: seoTitle,
          seo_description: seoDescription,
          content: serializedContent,
          tags: tagList,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save post');
      }

      const savedPost = payload.data as { id: number };

      if (publishAfterSave) {
        const publishResponse = await fetch(`/api/admin/publish?id=${savedPost.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publish: true }),
        });

        const publishPayload = await publishResponse.json();
        if (!publishResponse.ok) {
          throw new Error(publishPayload.error || 'Failed to publish post');
        }
      }

      startTransition(() => {
        router.push(`/admin/posts/${savedPost.id}/edit`);
        router.refresh();
      });

      setNotice(publishAfterSave ? 'Post published successfully.' : 'Draft saved successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-[color:var(--border)] bg-white/90 p-5 shadow-[0_30px_80px_rgba(31,36,48,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">
            {mode === 'new' ? 'New article' : 'Edit article'}
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[color:var(--ink-strong)]">
            {title || 'Untitled post'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="button-secondary" onClick={() => setShowPreview((current) => !current)}>
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={isSaving || contentTooLarge}
            onClick={() => void savePost(false)}
          >
            {isSaving ? 'Saving...' : 'Save draft'}
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={isSaving || contentTooLarge}
            onClick={() => void savePost(true)}
          >
            {isSaving ? 'Working...' : 'Save and publish'}
          </button>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-[#fdf0e8] px-4 py-3 text-sm text-[#9a4f32]">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#446155]">{notice}</div> : null}
      <div
        className={`rounded-2xl px-4 py-3 text-sm ${
          contentTooLarge
            ? 'bg-[#fdf0e8] text-[#9a4f32]'
            : 'bg-white/70 text-[color:var(--ink-soft)]'
        }`}
      >
        Content payload: {formatBytes(contentSizeBytes)} / {formatBytes(CONTENT_LIMIT_BYTES)}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="space-y-6">
          <section className="editor-card space-y-5">
            <div className="grid gap-5">
              <label className="field-shell">
                <span className="field-label">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="A clear title that feels worth opening"
                  className="field-input"
                />
                <span className="text-xs text-[color:var(--ink-muted)]">{title.length} characters</span>
              </label>

              <label className="field-shell">
                <span className="field-label">Excerpt</span>
                <textarea
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder="A short summary for cards and SEO snippets"
                  rows={3}
                  className="field-input min-h-[110px]"
                />
                <span className="text-xs text-[color:var(--ink-muted)]">{excerpt.length} characters</span>
              </label>
            </div>
          </section>

          <section className="editor-card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[color:var(--ink-strong)]">Cover image</h2>
            </div>

            <label className="field-shell">
              <span className="field-label">Image URL</span>
              <input
                value={coverImage}
                onChange={(event) => setCoverImage(event.target.value)}
                placeholder="https://..."
                className="field-input"
              />
              <span className="text-xs text-[color:var(--ink-muted)]">{coverImage.length} characters</span>
            </label>

            {coverImage ? (
              <img
                src={coverImage}
                alt="Cover preview"
                className="h-72 w-full rounded-[24px] border border-[color:var(--border)] object-cover"
              />
            ) : null}
          </section>

          <section className="editor-card space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-[color:var(--ink-strong)]">Writing canvas</h2>
                <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                  Use the inline toolbar for bold, italic, and links. Type <code>/</code> to insert blocks.
                </p>
              </div>
            </div>
            <RichTextEditor initialValue={serializedContent} onChange={setEditorData} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="editor-card space-y-5">
            <h2 className="font-serif text-2xl text-[color:var(--ink-strong)]">Organization</h2>
            <label className="field-shell">
              <span className="field-label">Tags</span>
              <input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="design, writing, engineering"
                className="field-input"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <span key={tag} className="pill">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="editor-card space-y-5">
            <h2 className="font-serif text-2xl text-[color:var(--ink-strong)]">SEO details</h2>
            <label className="field-shell">
              <span className="field-label">SEO title</span>
              <input
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                placeholder="Optional override"
                className="field-input"
              />
              <span className="text-xs text-[color:var(--ink-muted)]">{seoTitle.length} characters</span>
            </label>

            <label className="field-shell">
              <span className="field-label">SEO description</span>
              <textarea
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                rows={4}
                placeholder="Optional search/social summary"
                className="field-input min-h-[120px]"
              />
              <span className="text-xs text-[color:var(--ink-muted)]">{seoDescription.length} characters</span>
            </label>
          </section>

          {showPreview ? (
            <section className="editor-card space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">Live preview</p>
                <h2 className="mt-2 font-serif text-3xl text-[color:var(--ink-strong)]">{title || 'Untitled post'}</h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">{excerpt || 'Add an excerpt to preview your intro.'}</p>
              </div>
              <PostBody content={serializedContent} />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
