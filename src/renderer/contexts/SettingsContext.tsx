import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  defaultKeys: string[];
  customKeys?: string[];
}

export interface Settings {
  keyboardShortcuts: KeyboardShortcut[];
}

interface SettingsContextType {
  settings: Settings;
  updateShortcut: (id: string, keys: string[]) => void;
  resetShortcuts: () => void;
  getShortcut: (id: string) => string[];
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    id: 'execute-query',
    name: 'Execute Query',
    description: 'Run the current SQL query',
    defaultKeys: ['Cmd+Enter', 'Ctrl+Enter']
  },
  {
    id: 'explain-query',
    name: 'Explain Query',
    description: 'Show query execution plan',
    defaultKeys: ['Cmd+E', 'Ctrl+E']
  },
  {
    id: 'new-tab',
    name: 'New Tab',
    description: 'Create a new query tab',
    defaultKeys: ['Cmd+T', 'Ctrl+T']
  },
  {
    id: 'close-tab',
    name: 'Close Tab',
    description: 'Close the current tab',
    defaultKeys: ['Cmd+W', 'Ctrl+W']
  },
  {
    id: 'toggle-history',
    name: 'Toggle History',
    description: 'Show/hide query history',
    defaultKeys: ['Cmd+H', 'Ctrl+H']
  },
  {
    id: 'format-query',
    name: 'Format Query',
    description: 'Format the current SQL query',
    defaultKeys: ['Shift+Alt+F']
  },
  {
    id: 'save-query',
    name: 'Save Query',
    description: 'Save the current query',
    defaultKeys: ['Cmd+S', 'Ctrl+S']
  },
  {
    id: 'explain-query-ai',
    name: 'Explain Query with AI',
    description: 'Get AI explanation for selected query',
    defaultKeys: ['Cmd+Shift+E', 'Ctrl+Shift+E']
  },
  {
    id: 'optimize-query-ai',
    name: 'Optimize Query with AI',
    description: 'Optimize selected query using AI',
    defaultKeys: ['Cmd+Shift+O', 'Ctrl+Shift+O']
  },
  {
    id: 'create-query-ai',
    name: 'Create Query with AI',
    description: 'Open AI query creation dialog',
    defaultKeys: ['Cmd+Shift+N', 'Ctrl+Shift+N']
  }
];

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    keyboardShortcuts: defaultShortcuts
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('sqltemple-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sqltemple-settings', JSON.stringify(settings));
  }, [settings]);

  const updateShortcut = (id: string, keys: string[]) => {
    setSettings(prev => ({
      ...prev,
      keyboardShortcuts: prev.keyboardShortcuts.map(shortcut =>
        shortcut.id === id ? { ...shortcut, customKeys: keys } : shortcut
      )
    }));
  };

  const resetShortcuts = () => {
    setSettings({
      keyboardShortcuts: defaultShortcuts
    });
  };

  const getShortcut = (id: string): string[] => {
    const shortcut = settings.keyboardShortcuts.find(s => s.id === id);
    if (!shortcut) return [];
    return shortcut.customKeys || shortcut.defaultKeys;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateShortcut, resetShortcuts, getShortcut }}>
      {children}
    </SettingsContext.Provider>
  );
};