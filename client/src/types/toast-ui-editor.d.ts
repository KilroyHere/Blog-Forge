declare module '@toast-ui/editor' {
  export interface EditorOptions {
    el: HTMLElement;
    height?: string;
    initialEditType?: 'markdown' | 'wysiwyg';
    previewStyle?: 'vertical' | 'tab';
    initialValue?: string;
    placeholder?: string;
    usageStatistics?: boolean;
    events?: {
      change?: () => void;
      focus?: () => void;
      blur?: () => void;
    };
  }

  export default class Editor {
    constructor(options: EditorOptions);
    getMarkdown(): string;
    getHTML(): string;
    setMarkdown(markdown: string): void;
    setHTML(html: string): void;
    destroy(): void;
  }
}
