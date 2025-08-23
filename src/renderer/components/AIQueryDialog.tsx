import React, { useState } from 'react';
import { aiService } from '../services/AIService';

interface AIQueryDialogProps {
  onClose: () => void;
  onQueryGenerated: (query: string) => void;
}

export const AIQueryDialog: React.FC<AIQueryDialogProps> = ({ onClose, onQueryGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe what query you want to create');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await aiService.createQuery(prompt);
    if (result.success && result.data) {
      onQueryGenerated(result.data);
      onClose();
    } else {
      setError(result.error || 'Failed to generate query');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-6 w-[600px] max-w-[90vw]">
        <h2 className="text-lg font-semibold mb-4">Create Query with AI</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Describe the query you want</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm focus:outline-none focus:border-vscode-blue resize-none"
              rows={6}
              placeholder="Example: Show me all users who made purchases in the last 30 days, including their total spend and number of orders"
              autoFocus
            />
            <p className="text-xs text-vscode-text-tertiary mt-1">
              Be specific about tables, columns, and conditions you want in your query
            </p>
          </div>

          {error && (
            <div className="text-vscode-red text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-vscode-bg-tertiary hover:bg-vscode-bg-quaternary border border-vscode-border rounded transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="px-4 py-2 text-sm bg-vscode-blue hover:bg-vscode-blue-hover text-white rounded transition-colors flex items-center gap-2"
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14.5 2H8L7 3H1.5l-.5.5v10l.5.5h13l.5-.5v-11l-.5-.5zM13 12H3V6h10v6zm0-7H8.5l-1-1H13v2z"/>
                  </svg>
                  Generate Query
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};