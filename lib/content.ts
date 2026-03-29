export type BlogBlockType =
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'list'
  | 'code'
  | 'image';

export interface ParagraphBlock {
  type: 'paragraph';
  content: string;
}

export interface HeadingBlock {
  type: 'heading';
  content: string;
  level?: 2 | 3 | 4;
}

export interface QuoteBlock {
  type: 'quote';
  content: string;
  caption?: string;
}

export interface ListBlock {
  type: 'list';
  style?: 'ordered' | 'unordered';
  items: string[];
}

export interface CodeBlock {
  type: 'code';
  content: string;
  language?: string;
}

export interface ImageBlock {
  type: 'image';
  url: string;
  caption?: string;
}

export type BlogBlock =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ListBlock
  | CodeBlock
  | ImageBlock;

export interface BlogContent {
  blocks: BlogBlock[];
}

export const CONTENT_LIMIT_BYTES = 16 * 1024 * 1024;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

function normalizeEditorBlock(rawBlock: unknown): BlogBlock | null {
  const block = asRecord(rawBlock);
  if (!block) return null;

  const type = readString(block.type);
  const data = asRecord(block.data) ?? {};

  if (type === 'header' || type === 'heading') {
    const level = Number(data.level);
    return {
      type: 'heading',
      content: stripHtml(readString(data.text) || readString(block.content)),
      level: level === 3 || level === 4 ? level : 2,
    };
  }

  if (type === 'paragraph') {
    return {
      type: 'paragraph',
      content: stripHtml(readString(data.text) || readString(block.content)),
    };
  }

  if (type === 'quote') {
    return {
      type: 'quote',
      content: stripHtml(readString(data.text) || readString(block.content)),
      caption: stripHtml(readString(data.caption) || readString(block.caption)),
    };
  }

  if (type === 'list') {
    const items = Array.isArray(data.items)
      ? data.items.map((item) => stripHtml(readString(item))).filter(Boolean)
      : [];

    return {
      type: 'list',
      style: readString(data.style) === 'ordered' ? 'ordered' : 'unordered',
      items,
    };
  }

  if (type === 'code') {
    return {
      type: 'code',
      content: readString(data.code) || readString(block.content),
      language: readString(data.language) || 'text',
    };
  }

  if (type === 'image') {
    const file = asRecord(data.file);
    return {
      type: 'image',
      url: readString(data.url) || readString(file?.url) || readString(block.url),
      caption: stripHtml(readString(data.caption) || readString(block.caption)),
    };
  }

  return null;
}

export function normalizeContent(value: unknown): BlogContent {
  if (!value) {
    return {
      blocks: [],
    };
  }

  const content = asRecord(value);
  const rawBlocks = Array.isArray(content?.blocks)
    ? content.blocks
    : Array.isArray(value)
      ? value
      : [];

  const blocks = rawBlocks
    .map((rawBlock) => normalizeEditorBlock(rawBlock))
    .filter((block): block is BlogBlock => {
      if (!block) return false;
      if (block.type === 'image') return Boolean(block.url);
      if (block.type === 'list') return block.items.length > 0;
      return Boolean(block.content);
    });

  return { blocks };
}

export function getContentText(value: unknown): string {
  const { blocks } = normalizeContent(value);
  return blocks
    .map((block) => {
      if (block.type === 'list') return block.items.join(' ');
      if (block.type === 'image') return block.caption || '';
      return block.content;
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getReadingTimeMinutes(value: unknown): number {
  const words = getContentText(value).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function getContentSizeBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value ?? null)).length;
}

export function createEmptyContent(): BlogContent {
  return {
    blocks: [
      {
        type: 'paragraph',
        content: '',
      },
    ],
  };
}

export function toSerializableContent(blocks: BlogBlock[]): BlogContent {
  return {
    blocks: blocks.map((block) => {
      if (block.type === 'heading') {
        return {
          type: 'heading',
          content: block.content,
          level: block.level || 2,
        };
      }

      if (block.type === 'list') {
        return {
          type: 'list',
          style: block.style || 'unordered',
          items: block.items.filter(Boolean),
        };
      }

      if (block.type === 'quote') {
        return {
          type: 'quote',
          content: block.content,
          caption: block.caption || '',
        };
      }

      if (block.type === 'code') {
        return {
          type: 'code',
          content: block.content,
          language: block.language || 'text',
        };
      }

      if (block.type === 'image') {
        return {
          type: 'image',
          url: block.url,
          caption: block.caption || '',
        };
      }

      return {
        type: 'paragraph',
        content: block.content,
      };
    }),
  };
}
