/* eslint-disable @next/next/no-img-element */

'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useState } from 'react';
import { PostBody } from '@/components/post-body';
import {
  CONTENT_LIMIT_BYTES,
  createEmptyContent,
  getContentSizeBytes,
  normalizeContent,
  toSerializableContent,
  type BlogBlock,
  type BlogBlockType,
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

const blockOptions: Array<{ value: BlogBlockType; label: string }> = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading', label: 'Heading' },
  { value: 'quote', label: 'Quote' },
  { value: 'list', label: 'List' },
  { value: 'code', label: 'Code' },
  { value: 'image', label: 'Image' },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function createBlock(type: BlogBlockType): BlogBlock {
  if (type === 'heading') return { type, content: '', level: 2 };
  if (type === 'quote') return { type, content: '', caption: '' };
  if (type === 'list') return { type, style: 'unordered', items: [''] };
  if (type === 'code') return { type, content: '', language: 'text' };
  if (type === 'image') return { type, url: '', caption: '' };
  return { type: 'paragraph', content: '' };
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
  const [blocks, setBlocks] = useState<BlogBlock[]>(
    normalizeContent(initialPost?.content || createEmptyContent()).blocks,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const serializedContent = useMemo(() => toSerializableContent(blocks), [blocks]);
  const contentSizeBytes = useMemo(() => getContentSizeBytes(serializedContent), [serializedContent]);
  const contentTooLarge = contentSizeBytes > CONTENT_LIMIT_BYTES;
  const tagList = useMemo(
    () => tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  );

  const updateBlock = (index: number, next: BlogBlock) => {
    setBlocks((current) => current.map((block, blockIndex) => (blockIndex === index ? next : block)));
  };

  const removeBlock = (index: number) => {
    setBlocks((current) => (current.length === 1 ? current : current.filter((_, blockIndex) => blockIndex !== index)));
  };

  const addBlock = (type: BlogBlockType) => {
    setBlocks((current) => [...current, createBlock(type)]);
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Upload failed');
      }

      setCoverImage(payload.url || '');
      setNotice('Cover image uploaded.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

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
              <label className="button-secondary cursor-pointer">
                {isUploading ? 'Uploading...' : 'Upload image'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => void handleCoverUpload(event.target.files?.[0] || null)}
                />
              </label>
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
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[color:var(--ink-strong)]">Story blocks</h2>
              <div className="flex flex-wrap gap-2">
                {blockOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="pill hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                    onClick={() => addBlock(option.value)}
                  >
                    + {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {blocks.map((block, index) => (
                <div key={`${block.type}-${index}`} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
                        Block {index + 1}
                      </span>
                      <select
                        value={block.type}
                        onChange={(event) => updateBlock(index, createBlock(event.target.value as BlogBlockType))}
                        className="rounded-full border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-[color:var(--ink-soft)]"
                      >
                        {blockOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="button" onClick={() => removeBlock(index)} className="text-sm text-[color:#9a4f32]">
                      Remove
                    </button>
                  </div>

                  {block.type === 'paragraph' ? (
                    <textarea
                      value={block.content}
                      onChange={(event) => updateBlock(index, { ...block, content: event.target.value })}
                      rows={5}
                      className="field-input min-h-[140px]"
                      placeholder="Write the body copy for this section"
                    />
                  ) : null}

                  {block.type === 'heading' ? (
                    <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                      <select
                        value={block.level || 2}
                        onChange={(event) =>
                          updateBlock(index, { ...block, level: Number(event.target.value) as 2 | 3 | 4 })
                        }
                        className="field-input"
                      >
                        <option value={2}>Heading 2</option>
                        <option value={3}>Heading 3</option>
                        <option value={4}>Heading 4</option>
                      </select>
                      <input
                        value={block.content}
                        onChange={(event) => updateBlock(index, { ...block, content: event.target.value })}
                        placeholder="Section heading"
                        className="field-input"
                      />
                    </div>
                  ) : null}

                  {block.type === 'quote' ? (
                    <div className="grid gap-3">
                      <textarea
                        value={block.content}
                        onChange={(event) => updateBlock(index, { ...block, content: event.target.value })}
                        rows={4}
                        className="field-input min-h-[120px]"
                        placeholder="Memorable quote or pullout"
                      />
                      <input
                        value={block.caption || ''}
                        onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })}
                        placeholder="Optional attribution"
                        className="field-input"
                      />
                    </div>
                  ) : null}

                  {block.type === 'list' ? (
                    <div className="grid gap-3">
                      <select
                        value={block.style || 'unordered'}
                        onChange={(event) =>
                          updateBlock(index, {
                            ...block,
                            style: event.target.value as 'ordered' | 'unordered',
                          })
                        }
                        className="field-input"
                      >
                        <option value="unordered">Bulleted list</option>
                        <option value="ordered">Numbered list</option>
                      </select>
                      <textarea
                        value={block.items.join('\n')}
                        onChange={(event) =>
                          updateBlock(index, {
                            ...block,
                            items: event.target.value.split('\n'),
                          })
                        }
                        rows={5}
                        className="field-input min-h-[140px]"
                        placeholder="One item per line"
                      />
                    </div>
                  ) : null}

                  {block.type === 'code' ? (
                    <div className="grid gap-3">
                      <input
                        value={block.language || ''}
                        onChange={(event) => updateBlock(index, { ...block, language: event.target.value })}
                        placeholder="Language, e.g. ts, sql, bash"
                        className="field-input"
                      />
                      <textarea
                        value={block.content}
                        onChange={(event) => updateBlock(index, { ...block, content: event.target.value })}
                        rows={8}
                        className="field-input min-h-[180px] font-mono text-sm"
                        placeholder="Paste code here"
                      />
                    </div>
                  ) : null}

                  {block.type === 'image' ? (
                    <div className="grid gap-3">
                      <input
                        value={block.url}
                        onChange={(event) => updateBlock(index, { ...block, url: event.target.value })}
                        placeholder="https://..."
                        className="field-input"
                      />
                      <input
                        value={block.caption || ''}
                        onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })}
                        placeholder="Optional caption"
                        className="field-input"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
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
