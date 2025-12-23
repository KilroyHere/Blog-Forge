import { Check, Loader2, AlertCircle } from 'lucide-react';

interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div 
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-md bg-card border border-border shadow-lg"
      data-testid="save-indicator"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-600 dark:text-green-400">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">Error saving</span>
        </>
      )}
    </div>
  );
}
