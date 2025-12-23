import { useEffect, useRef, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';

import chart from '@toast-ui/editor-plugin-chart';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import tableMergedCell from '@toast-ui/editor-plugin-table-merged-cell';
import uml from '@toast-ui/editor-plugin-uml';

import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import '@toast-ui/editor-plugin-table-merged-cell/dist/toastui-editor-plugin-table-merged-cell.css';

import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';

import { Loader2 } from 'lucide-react';

interface MarkdownEditorProps {
  initialValue?: string;
  height?: string;
  onChange?: (markdown: string, html: string) => void;
  placeholder?: string;
}

interface UploadState {
  isUploading: boolean;
  filename: string;
}

async function uploadImage(
  blob: Blob, 
  filename: string,
  signal?: AbortSignal
): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, filename);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const data = await response.json();
  return data.url;
}

export function MarkdownEditor({
  initialValue = '',
  height = '500px',
  onChange,
  placeholder = 'Start writing your post...',
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ isUploading: false, filename: '' });
  const { toast } = useToast();

  const handleChange = useCallback(() => {
    if (editorInstanceRef.current && onChange) {
      const markdown = editorInstanceRef.current.getMarkdown();
      const html = editorInstanceRef.current.getHTML();
      onChange(markdown, html);
    }
  }, [onChange]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setUploadState({ isUploading: false, filename: '' });
      toast({
        title: 'Upload cancelled',
        description: 'Image upload was cancelled.',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (editorRef.current && !editorInstanceRef.current) {
      editorInstanceRef.current = new Editor({
        el: editorRef.current,
        height,
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        initialValue,
        placeholder,
        usageStatistics: false,
        customHTMLSanitizer: (html: string) => html,
        plugins: [
          [codeSyntaxHighlight, { highlighter: Prism }],
          tableMergedCell,
          chart,
          uml,
        ],
        hooks: {
          addImageBlobHook: async (blob: Blob, callback: (url: string, altText: string) => void) => {
            const filename = (blob as File).name || `image-${Date.now()}.png`;
            
            abortControllerRef.current = new AbortController();
            setUploadState({ isUploading: true, filename });
            
            try {
              const url = await uploadImage(blob, filename, abortControllerRef.current.signal);
              
              if (abortControllerRef.current) {
                callback(url, filename);
                toast({
                  title: 'Image uploaded',
                  description: `${filename} was uploaded successfully.`,
                });
              }
            } catch (error: any) {
              if (error.name === 'AbortError') {
                return;
              }
              console.error('Image upload failed:', error);
              toast({
                title: 'Upload failed',
                description: error.message || 'Failed to upload image. Please try again.',
                variant: 'destructive',
              });
            } finally {
              abortControllerRef.current = null;
              setUploadState({ isUploading: false, filename: '' });
            }
          },
        },
        events: {
          change: handleChange,
        },
      } as any);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorInstanceRef.current && initialValue !== undefined) {
      const currentMarkdown = editorInstanceRef.current.getMarkdown();
      if (currentMarkdown !== initialValue) {
        editorInstanceRef.current.setMarkdown(initialValue);
      }
    }
  }, [initialValue]);

  return (
    <div className="relative">
      <div 
        ref={editorRef} 
        className="w-full rounded-md overflow-hidden border border-border"
        data-testid="markdown-editor"
      />
      {uploadState.isUploading && (
        <div 
          className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 rounded-md"
          data-testid="upload-loading-overlay"
        >
          <div className="bg-card border border-border rounded-md p-6 flex flex-col items-center gap-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Uploading image...</p>
              <p className="text-sm text-muted-foreground mt-1">{uploadState.filename}</p>
            </div>
            <button
              onClick={cancelUpload}
              className="text-sm text-muted-foreground hover:text-foreground underline"
              data-testid="button-cancel-upload"
            >
              Cancel upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function getEditorInstance(ref: React.RefObject<HTMLDivElement>): Editor | null {
  return null;
}
