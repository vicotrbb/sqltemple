import React, { useState, useEffect } from 'react';
import { aiService } from '../services/AIService';

interface AISettingsProps {
  onClose: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const modelsResult = await aiService.getModels();
      if (modelsResult.success && modelsResult.data) {
        setModels(modelsResult.data);
      }

      const configResult = await aiService.getConfig();
      if (configResult.success && configResult.data) {
        setApiKey(configResult.data.apiKey);
        setModel(configResult.data.model);
      }
    } catch (err) {
      setError('Failed to load AI settings');
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await aiService.setConfig({ apiKey, model });
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-6 w-[500px] max-w-[90vw]">
        <h2 className="text-lg font-semibold mb-4">AI Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm focus:outline-none focus:border-vscode-blue"
              placeholder="sk-..."
            />
            <p className="text-xs text-vscode-text-tertiary mt-1">
              Your API key is stored locally and never sent to our servers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm focus:outline-none focus:border-vscode-blue"
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <p className="text-xs text-vscode-text-tertiary mt-1">
              Different models have different capabilities and costs. GPT-4o and o1 models are more capable but more expensive.
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
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-vscode-blue hover:bg-vscode-blue-hover text-white rounded transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};