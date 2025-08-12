import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onClose }) => {
  const { settings, updateShortcut, resetShortcuts } = useSettings();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempKeys, setTempKeys] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);

  const handleStartEdit = (id: string) => {
    const shortcut = settings.keyboardShortcuts.find(s => s.id === id);
    if (shortcut) {
      setEditingId(id);
      setTempKeys(shortcut.customKeys || shortcut.defaultKeys);
    }
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateShortcut(editingId, tempKeys);
      setEditingId(null);
      setTempKeys([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempKeys([]);
    setRecording(false);
  };

  const handleRecordShortcut = () => {
    setRecording(true);
    setTempKeys([]);

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];
      if (e.metaKey) keys.push('Cmd');
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      }

      if (keys.length > 0) {
        setTempKeys([keys.join('+')]);
        setRecording(false);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    setTimeout(() => {
      document.removeEventListener('keydown', handleKeyDown);
      setRecording(false);
    }, 5000);
  };

  const formatKeys = (keys: string[]): string => {
    return keys.join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-vscode-bg-secondary rounded-md shadow-2xl w-[800px] max-h-[85vh] overflow-hidden border border-vscode-border animate-fadeIn">
        <div className="px-6 py-4 border-b border-vscode-border flex justify-between items-center bg-vscode-bg-tertiary">
          <h2 className="text-lg font-medium text-vscode-text">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-vscode-text-secondary hover:text-vscode-text transition-colors text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {settings.keyboardShortcuts.map(shortcut => {
              const isEditing = editingId === shortcut.id;
              const currentKeys = shortcut.customKeys || shortcut.defaultKeys;
              
              return (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between p-4 bg-vscode-bg rounded border border-vscode-border hover:border-vscode-blue transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-vscode-text">{shortcut.name}</h3>
                    <p className="text-sm text-vscode-text-secondary mt-1">{shortcut.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <div className="px-3 py-1 bg-vscode-bg-tertiary rounded border border-vscode-border min-w-[150px] text-center">
                          {recording ? (
                            <span className="text-vscode-blue animate-pulse">Press keys...</span>
                          ) : (
                            <span className="font-mono text-sm">{formatKeys(tempKeys)}</span>
                          )}
                        </div>
                        <button
                          onClick={handleRecordShortcut}
                          disabled={recording}
                          className="px-3 py-1 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Record
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-vscode-green hover:opacity-90 text-vscode-bg rounded text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-vscode-bg-quaternary hover:bg-vscode-bg text-vscode-text border border-vscode-border rounded text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-1 bg-vscode-bg-tertiary rounded font-mono text-sm min-w-[150px] text-center">
                          {formatKeys(currentKeys)}
                        </div>
                        <button
                          onClick={() => handleStartEdit(shortcut.id)}
                          className="px-3 py-1 bg-vscode-bg-quaternary hover:bg-vscode-bg text-vscode-text border border-vscode-border rounded text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={resetShortcuts}
              className="px-4 py-2 bg-vscode-red bg-opacity-20 hover:bg-opacity-30 text-vscode-red border border-vscode-red border-opacity-30 rounded text-sm font-medium transition-colors"
            >
              Reset All to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};