import React, { useState, useEffect } from "react";
import { useConfig } from "../contexts/ConfigContext";
import { AISettings } from "./AISettings";
import {
  SettingsIcon,
  EyeIcon,
  FormatIcon,
  BrainIcon,
  DatabaseIcon,
  KeyboardIcon,
  CheckIcon,
  AlertTriangleIcon,
} from "./icons/IconLibrary";

interface PreferencesDialogProps {
  onClose: () => void;
}

type PreferencesTab =
  | "general"
  | "appearance"
  | "editor"
  | "ai"
  | "connections"
  | "shortcuts";

export const FunctionalPreferencesDialog: React.FC<PreferencesDialogProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PreferencesTab>("general");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { 
    config, 
    updateGeneralSettings, 
    updateAppearanceSettings, 
    updateEditorSettings, 
    updateAISettings, 
    updateConnectionSettings, 
    resetSettings,
    hasUnsavedChanges,
    isLoading 
  } = useConfig();

  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const tabs = [
    {
      id: "general" as const,
      label: "General",
      icon: <SettingsIcon size={16} />,
    },
    {
      id: "appearance" as const,
      label: "Appearance",
      icon: <EyeIcon size={16} />,
    },
    { id: "editor" as const, label: "Editor", icon: <FormatIcon size={16} /> },
    { id: "ai" as const, label: "AI Assistant", icon: <BrainIcon size={16} /> },
    {
      id: "connections" as const,
      label: "Connections",
      icon: <DatabaseIcon size={16} />,
    },
    {
      id: "shortcuts" as const,
      label: "Shortcuts",
      icon: <KeyboardIcon size={16} />,
    },
  ];

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      
      if (localConfig.ai.apiKey && localConfig.ai.apiKey.trim()) {
        const aiValidation = await window.api.aiValidateConfig({
          provider: 'openai', // Default to OpenAI for backward compatibility
          apiKey: localConfig.ai.apiKey,
          model: localConfig.ai.model
        });
        
        if (!aiValidation.success) {
          const errorMessage = aiValidation.errors?.join(', ') || 'AI configuration validation failed';
          alert(`AI Configuration Error: ${errorMessage}`);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
          return;
        }
      }
      
      await updateGeneralSettings(localConfig.general);
      await updateAppearanceSettings(localConfig.appearance);
      await updateEditorSettings(localConfig.editor);
      await updateAISettings(localConfig.ai);
      await updateConnectionSettings(localConfig.connections);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      await resetSettings();
      setLocalConfig(config);
    }
  };

  const handleResetSection = async () => {
    if (confirm(`Are you sure you want to reset ${activeTab} settings to defaults?`)) {
      await resetSettings(activeTab);
      setLocalConfig(config);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                General Settings
              </h3>
              <button
                onClick={handleResetSection}
                className="text-xs text-vscode-text-secondary hover:text-vscode-text transition-colors"
              >
                Reset to defaults
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label 
                    htmlFor="auto-save-queries"
                    className="text-sm font-medium text-vscode-text"
                  >
                    Auto-save queries
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Automatically save query changes
                  </p>
                </div>
                <input
                  id="auto-save-queries"
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.general.autoSaveQueries}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      general: { ...prev.general, autoSaveQueries: e.target.checked }
                    }))
                  }
                  aria-describedby="auto-save-queries-desc"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Query history limit
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Maximum number of queries to remember
                  </p>
                </div>
                <input
                  type="number"
                  value={localConfig.general.queryHistoryLimit}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      general: { ...prev.general, queryHistoryLimit: parseInt(e.target.value) || 100 }
                    }))
                  }
                  min="10"
                  max="1000"
                  className="w-20 px-2 py-1 bg-vscode-bg border border-vscode-border rounded text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Default connection on startup
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Automatically connect to last used database
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.general.defaultConnectionOnStartup}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      general: { ...prev.general, defaultConnectionOnStartup: e.target.checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Confirm before closing
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Show confirmation dialog when closing with unsaved changes
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.general.confirmBeforeClosing}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      general: { ...prev.general, confirmBeforeClosing: e.target.checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Appearance Settings
              </h3>
              <button
                onClick={handleResetSection}
                className="text-xs text-vscode-text-secondary hover:text-vscode-text transition-colors"
              >
                Reset to defaults
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-vscode-text block mb-2">
                  Theme
                </label>
                <select
                  value={localConfig.appearance.theme}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: e.target.value as 'dark' | 'light' | 'system' }
                    }))
                  }
                  className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-vscode-text block mb-2">
                  Font size: {localConfig.appearance.fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={localConfig.appearance.fontSize}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, fontSize: parseInt(e.target.value) }
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-vscode-text-secondary">
                  <span>12px</span>
                  <span>20px</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-vscode-text block mb-2">
                  Font family
                </label>
                <select
                  value={localConfig.appearance.fontFamily}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, fontFamily: e.target.value as any }
                    }))
                  }
                  className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm"
                >
                  <option value="monaco">Monaco</option>
                  <option value="consolas">Consolas</option>
                  <option value="courier">Courier New</option>
                  <option value="fira-code">Fira Code</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-vscode-text block mb-2">
                  UI Scale: {Math.round(localConfig.appearance.uiScale * 100)}%
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={localConfig.appearance.uiScale}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, uiScale: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-vscode-text-secondary">
                  <span>80%</span>
                  <span>150%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "editor":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Editor Settings
              </h3>
              <button
                onClick={handleResetSection}
                className="text-xs text-vscode-text-secondary hover:text-vscode-text transition-colors"
              >
                Reset to defaults
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Show line numbers
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Display line numbers in the editor
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.editor.showLineNumbers}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      editor: { ...prev.editor, showLineNumbers: e.target.checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Word wrap
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Wrap long lines
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.editor.wordWrap}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      editor: { ...prev.editor, wordWrap: e.target.checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Auto-complete
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Enable SQL auto-completion
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.editor.autoComplete}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      editor: { ...prev.editor, autoComplete: e.target.checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Tab size
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Number of spaces per tab
                  </p>
                </div>
                <input
                  type="number"
                  value={localConfig.editor.tabSize}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      editor: { ...prev.editor, tabSize: parseInt(e.target.value) || 2 }
                    }))
                  }
                  min="2"
                  max="8"
                  className="w-20 px-2 py-1 bg-vscode-bg border border-vscode-border rounded text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Format on save
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Automatically format queries when saving
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.editor.formatOnSave}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      editor: { ...prev.editor, formatOnSave: e.target.checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-6">
            <AISettings onClose={() => {}} embedded={true} />
          </div>
        );

      case "connections":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Connection Settings
              </h3>
              <button
                onClick={handleResetSection}
                className="text-xs text-vscode-text-secondary hover:text-vscode-text transition-colors"
              >
                Reset to defaults
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Default timeout (seconds)
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Connection timeout duration
                  </p>
                </div>
                <input
                  type="number"
                  value={localConfig.connections.defaultTimeout}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      connections: { ...prev.connections, defaultTimeout: parseInt(e.target.value) || 30 }
                    }))
                  }
                  min="5"
                  max="300"
                  className="w-20 px-2 py-1 bg-vscode-bg border border-vscode-border rounded text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Auto-reconnect
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Automatically reconnect on connection loss
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.connections.autoReconnect}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      connections: { ...prev.connections, autoReconnect: e.target.checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    SSL verification
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Verify SSL certificates
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.connections.sslVerification}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      connections: { ...prev.connections, sslVerification: e.target.checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-vscode-text">
                    Connection pooling
                  </label>
                  <p className="text-xs text-vscode-text-secondary">
                    Use connection pooling for better performance
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={localConfig.connections.connectionPooling}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      connections: { ...prev.connections, connectionPooling: e.target.checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case "shortcuts":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={handleResetSection}
                className="text-xs text-vscode-text-secondary hover:text-vscode-text transition-colors"
              >
                Reset to defaults
              </button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {Object.entries(
                localConfig.shortcuts.shortcuts.reduce((acc, shortcut) => {
                  if (!acc[shortcut.category]) acc[shortcut.category] = [];
                  acc[shortcut.category].push(shortcut);
                  return acc;
                }, {} as Record<string, typeof localConfig.shortcuts.shortcuts>)
              ).map(([category, shortcuts]) => (
                <div key={category} className="mb-4">
                  <h4 className="text-sm font-medium text-vscode-text mb-2 opacity-80">
                    {category}
                  </h4>
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-2 px-2 hover:bg-vscode-bg-quaternary rounded"
                    >
                      <div>
                        <span className="text-sm text-vscode-text">
                          {shortcut.name}
                        </span>
                        <p className="text-xs text-vscode-text-secondary">
                          {shortcut.description}
                        </p>
                      </div>
                      <kbd className="px-2 py-1 bg-vscode-bg-quaternary border border-vscode-border rounded text-xs">
                        {shortcut.customKeys?.[0] || shortcut.defaultKeys[0]}
                      </kbd>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-vscode-bg-secondary rounded-md shadow-2xl p-8 border border-vscode-border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vscode-blue mx-auto mb-4"></div>
            <p className="text-vscode-text">Loading preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-vscode-bg-secondary rounded-md shadow-2xl w-[800px] h-[600px] border border-vscode-border flex">
        {/* Sidebar */}
        <div className="w-48 bg-vscode-bg-tertiary border-r border-vscode-border">
          <div className="p-4 border-b border-vscode-border">
            <h2 className="text-lg font-medium text-vscode-text" id="preferences-title">
              Preferences
            </h2>
            {hasUnsavedChanges && (
              <p className="text-xs text-vscode-text-secondary mt-1" aria-live="polite">
                • Unsaved changes
              </p>
            )}
          </div>
          <nav className="p-2" role="tablist" aria-labelledby="preferences-title">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "bg-vscode-blue bg-opacity-20 text-vscode-blue"
                    : "text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-bg-quaternary"
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-vscode-border">
            <div className="flex items-center space-x-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center space-x-2 text-vscode-text-secondary">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vscode-blue"></div>
                  <span className="text-xs">Saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center space-x-2 text-vscode-green">
                  <CheckIcon size={14} />
                  <span className="text-xs">Saved!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center space-x-2 text-vscode-error">
                  <AlertTriangleIcon size={14} />
                  <span className="text-xs">Failed to save</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-vscode-text-secondary hover:text-vscode-text transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          <div 
            className="flex-1 p-6 overflow-y-auto"
            role="tabpanel"
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
          >
            {renderTabContent()}
          </div>

          <div className="p-4 border-t border-vscode-border flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-vscode-text-secondary hover:text-vscode-text transition-colors"
            >
              Reset All
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-vscode-text-secondary hover:text-vscode-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="px-4 py-2 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};