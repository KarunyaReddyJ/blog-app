/* eslint-disable @next/next/no-img-element */

'use client';

import { useMemo } from 'react';
import { normalizeContent } from '@/lib/content';
import { sanitizeInlineHtml } from '@/lib/html';

export function PostBody({ content }: { content: unknown }) {
  const { blocks } = normalizeContent(content);

  const sanitizedBlocks = useMemo(
    () =>
      blocks.map((block) => {
        if (block.type === 'image') {
          return block;
        }

        if (block.type === 'list') {
          return {
            ...block,
            items: block.items.map((item) => sanitizeInlineHtml(item)),
          };
        }

        return {
          ...block,
          content: sanitizeInlineHtml(block.content),
          ...(block.type === 'quote' ? { caption: sanitizeInlineHtml(block.caption || '') } : {}),
        };
      }),
    [blocks],
  );

  if (sanitizedBlocks.length === 0) {
    return (
      <div className="prose-block">
        <p>This piece is still in progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sanitizedBlocks.map((block, index) => {
        if (block.type === 'heading') {
          const Tag = block.level === 4 ? 'h4' : block.level === 3 ? 'h3' : 'h2';
          return (
            <Tag
              key={`${block.type}-${index}`}
              className="font-serif text-2xl text-[color:var(--ink-strong)] sm:text-3xl"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }

        if (block.type === 'quote') {
          return (
            <figure key={`${block.type}-${index}`} className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-5">
              <blockquote
                className="font-serif text-xl leading-9 text-[color:var(--ink-strong)]"
                dangerouslySetInnerHTML={{ __html: `“${block.content}”` }}
              />
              {block.caption ? (
                <figcaption
                  className="mt-3 text-sm uppercase tracking-[0.16em] text-[color:var(--ink-muted)]"
                  dangerouslySetInnerHTML={{ __html: block.caption }}
                />
              ) : null}
            </figure>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.style === 'ordered' ? 'ol' : 'ul';
          return (
            <ListTag
              key={`${block.type}-${index}`}
              className={`prose-block ml-5 space-y-3 ${
                block.style === 'ordered' ? 'list-decimal' : 'list-disc'
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ListTag>
          );
        }

        if (block.type === 'code') {
          return (
            <div key={`${block.type}-${index}`} className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[#1f2430]">
              <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/60">
                {block.language || 'text'}
              </div>
              <pre className="overflow-x-auto px-4 py-5 text-sm leading-7 text-white/90">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        if (block.type === 'image') {
          return (
            <figure key={`${block.type}-${index}`} className="space-y-3">
              <img
                src={block.url}
                alt={block.caption || 'Article image'}
                className="w-full rounded-[28px] border border-[color:var(--border)] object-cover"
              />
              {block.caption ? (
                <figcaption className="text-center text-sm text-[color:var(--ink-muted)]">
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        return (
          <div key={`${block.type}-${index}`} className="prose-block">
            <p dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );
      })}
    </div>
  );
}
