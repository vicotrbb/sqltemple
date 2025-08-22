import React, { useEffect } from 'react';

interface AIResultDialogProps {
  title: string;
  content: string;
  onClose: () => void;
  onApply?: (content: string) => void;
  loading?: boolean;
  error?: string | null;
}

export const AIResultDialog: React.FC<AIResultDialogProps> = ({ 
  title, 
  content, 
  onClose, 
  onApply,
  loading,
  error
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-6 w-[800px] max-w-[90vw] max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-vscode-text-secondary hover:text-vscode-text transition-colors text-xl"
            disabled={false}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-vscode-blue" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-vscode-text-secondary">Processing with AI...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-vscode-bg-tertiary border border-vscode-red rounded">
              <p className="text-vscode-red">{error}</p>
            </div>
          ) : (
            <div className="bg-vscode-bg rounded border border-vscode-border p-4">
              <pre className="whitespace-pre-wrap text-sm text-vscode-text font-mono">
                {content}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-vscode-bg-tertiary hover:bg-vscode-bg-quaternary border border-vscode-border rounded transition-colors"
            disabled={false}
          >
            Close
          </button>
          {onApply && !loading && !error && (
            <button
              onClick={() => onApply(content)}
              className="px-4 py-2 text-sm bg-vscode-blue hover:bg-vscode-blue-hover text-white rounded transition-colors"
            >
              Apply to Editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
};