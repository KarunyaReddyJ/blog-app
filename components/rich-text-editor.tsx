'use client';

import { useEffect, useId, useRef } from 'react';
import type { OutputData } from '@editorjs/editorjs';
import { toEditorJsData } from '@/lib/content';

type EditorInstance = {
  save: () => Promise<unknown>;
  isReady: Promise<void>;
  destroy: () => void;
};

export function RichTextEditor({
  initialValue,
  onChange,
}: {
  initialValue: unknown;
  onChange: (value: unknown) => void;
}) {
  const holderId = useId().replace(/:/g, '-');
  const editorRef = useRef<EditorInstance | null>(null);
  const initialDataRef = useRef<OutputData>(toEditorJsData(initialValue) as unknown as OutputData);

  useEffect(() => {
    let mounted = true;

    const initializeEditor = async () => {
      const [{ default: EditorJS }, { default: Header }, { default: List }, { default: Quote }, { default: CodeTool }, { default: ImageTool }] =
        await Promise.all([
          import('@editorjs/editorjs'),
          import('@editorjs/header'),
          import('@editorjs/list'),
          import('@editorjs/quote'),
          import('@editorjs/code'),
          import('@editorjs/image'),
        ]);

      if (!mounted) return;

      const editor = new EditorJS({
        holder: holderId,
        data: initialDataRef.current,
        placeholder: 'Start writing here. Use "/" for blocks and the inline toolbar for emphasis.',
        inlineToolbar: ['bold', 'italic', 'link'],
        autofocus: true,
        tools: {
          header: {
            class: Header as unknown as never,
            inlineToolbar: ['bold', 'italic', 'link'],
            config: {
              placeholder: 'Section heading',
              levels: [2, 3, 4],
              defaultLevel: 2,
            },
          },
          list: {
            class: List as unknown as never,
            inlineToolbar: ['bold', 'italic', 'link'],
            config: {
              defaultStyle: 'unordered',
            },
          },
          quote: {
            class: Quote as unknown as never,
            inlineToolbar: ['bold', 'italic', 'link'],
            config: {
              quotePlaceholder: 'Pull quote or a memorable thought',
              captionPlaceholder: 'Optional attribution',
            },
          },
          code: {
            class: CodeTool as unknown as never,
          },
          image: {
            class: ImageTool as unknown as never,
            config: {
              uploader: {
                uploadByFile: async (file: File) => {
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

                  return {
                    success: 1,
                    file: {
                      url: payload.url,
                    },
                  };
                },
              },
            },
          },
        },
        async onChange(api) {
          const data = await api.saver.save();
          onChange(data);
        },
      }) as unknown as EditorInstance;

      editorRef.current = editor;

      await editor.isReady;
      const data = await editor.save();
      onChange(data);
    };

    void initializeEditor();

    return () => {
      mounted = false;
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [holderId, onChange]);

  return (
    <div className="rounded-[28px] border border-[color:var(--border)] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
        <span className="pill">Bold</span>
        <span className="pill">Italic</span>
        <span className="pill">Link</span>
        <span className="pill">Headings</span>
        <span className="pill">Quotes</span>
        <span className="pill">Code</span>
        <span className="pill">Images</span>
      </div>
      <div id={holderId} className="min-h-[420px] [&_.ce-block__content]:max-w-none [&_.ce-toolbar__content]:max-w-none" />
    </div>
  );
}
