import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface GeneralSettings {
  autoSaveQueries: boolean;
  queryHistoryLimit: number;
  defaultConnectionOnStartup: boolean;
  confirmBeforeClosing: boolean;
  checkForUpdates: boolean;
}

export interface AppearanceSettings {
  theme: "dark" | "light" | "system";
  fontSize: number;
  fontFamily: "monaco" | "consolas" | "courier" | "fira-code";
  uiScale: number;
  compactMode: boolean;
}

export interface EditorSettings {
  showLineNumbers: boolean;
  wordWrap: boolean;
  autoComplete: boolean;
  tabSize: number;
  insertSpaces: boolean;
  formatOnSave: boolean;
  highlightActiveLine: boolean;
  showWhitespace: boolean;
  enableCodeFolding: boolean;
}

export interface AISettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableSuggestions: boolean;
  autoExplain: boolean;
  includeSchema: boolean;
}

export interface ConnectionSettings {
  defaultTimeout: number;
  autoReconnect: boolean;
  sslVerification: boolean;
  maxConnections: number;
  connectionPooling: boolean;
  keepAliveInterval: number;
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  defaultKeys: string[];
  customKeys?: string[];
  category: string;
}

export interface ShortcutSettings {
  shortcuts: KeyboardShortcut[];
  enableGlobalShortcuts: boolean;
}

export interface AppConfig {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  editor: EditorSettings;
  ai: AISettings;
  connections: ConnectionSettings;
  shortcuts: ShortcutSettings;
  version: string;
  lastModified: string;
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    id: "file:new-tab",
    name: "New Tab",
    description: "Create a new query tab",
    defaultKeys: ["Cmd+T", "Ctrl+T"],
    category: "File",
  },
  {
    id: "file:open-query",
    name: "Open Query",
    description: "Open a query file",
    defaultKeys: ["Cmd+O", "Ctrl+O"],
    category: "File",
  },
  {
    id: "file:save-query",
    name: "Save Query",
    description: "Save the current query",
    defaultKeys: ["Cmd+S", "Ctrl+S"],
    category: "File",
  },
  {
    id: "file:save-query-as",
    name: "Save Query As",
    description: "Save query with new filename",
    defaultKeys: ["Cmd+Shift+S", "Ctrl+Shift+S"],
    category: "File",
  },

  {
    id: "edit:undo",
    name: "Undo",
    description: "Undo last action",
    defaultKeys: ["Cmd+Z", "Ctrl+Z"],
    category: "Edit",
  },
  {
    id: "edit:redo",
    name: "Redo",
    description: "Redo last action",
    defaultKeys: ["Cmd+Shift+Z", "Ctrl+Y"],
    category: "Edit",
  },
  {
    id: "edit:find",
    name: "Find",
    description: "Find text in editor",
    defaultKeys: ["Cmd+F", "Ctrl+F"],
    category: "Edit",
  },
  {
    id: "edit:replace",
    name: "Replace",
    description: "Find and replace text",
    defaultKeys: ["Cmd+H", "Ctrl+H"],
    category: "Edit",
  },
  {
    id: "edit:format-query",
    name: "Format Query",
    description: "Format the current SQL query",
    defaultKeys: ["Cmd+Shift+F", "Ctrl+Shift+F"],
    category: "Edit",
  },

  {
    id: "database:execute-query",
    name: "Execute Query",
    description: "Run the current SQL query",
    defaultKeys: ["Cmd+Enter", "Ctrl+Enter"],
    category: "Database",
  },
  {
    id: "database:execute-selected",
    name: "Execute Selected",
    description: "Run selected SQL text",
    defaultKeys: ["Cmd+Shift+Enter", "Ctrl+Shift+Enter"],
    category: "Database",
  },
  {
    id: "database:explain-query",
    name: "Explain Query",
    description: "Show query execution plan",
    defaultKeys: ["Cmd+E", "Ctrl+E"],
    category: "Database",
  },
  {
    id: "database:refresh-schema",
    name: "Refresh Schema",
    description: "Reload database schema",
    defaultKeys: ["F5"],
    category: "Database",
  },

  {
    id: "view:toggle-history",
    name: "Toggle History",
    description: "Show/hide query history",
    defaultKeys: ["Cmd+H", "Ctrl+H"],
    category: "View",
  },
  {
    id: "view:toggle-connections",
    name: "Toggle Connections",
    description: "Show/hide connections panel",
    defaultKeys: ["Cmd+1", "Ctrl+1"],
    category: "View",
  },
  {
    id: "view:toggle-schema",
    name: "Toggle Schema",
    description: "Show/hide schema explorer",
    defaultKeys: ["Cmd+2", "Ctrl+2"],
    category: "View",
  },
  {
    id: "view:toggle-results",
    name: "Toggle Results",
    description: "Show/hide results panel",
    defaultKeys: ["Cmd+3", "Ctrl+3"],
    category: "View",
  },

  {
    id: "ai:create-query",
    name: "Create Query with AI",
    description: "Open AI query creation dialog",
    defaultKeys: ["Cmd+Shift+N", "Ctrl+Shift+N"],
    category: "AI",
  },
  {
    id: "ai:explain-query",
    name: "Explain Query with AI",
    description: "Get AI explanation for selected query",
    defaultKeys: ["Cmd+Shift+E", "Ctrl+Shift+E"],
    category: "AI",
  },
  {
    id: "ai:optimize-query",
    name: "Optimize Query with AI",
    description: "Optimize selected query using AI",
    defaultKeys: ["Cmd+Shift+O", "Ctrl+Shift+O"],
    category: "AI",
  },

  {
    id: "window:close-tab",
    name: "Close Tab",
    description: "Close the current tab",
    defaultKeys: ["Cmd+W", "Ctrl+W"],
    category: "Window",
  },
  {
    id: "window:next-tab",
    name: "Next Tab",
    description: "Switch to next tab",
    defaultKeys: ["Cmd+Tab", "Ctrl+Tab"],
    category: "Window",
  },
  {
    id: "window:previous-tab",
    name: "Previous Tab",
    description: "Switch to previous tab",
    defaultKeys: ["Cmd+Shift+Tab", "Ctrl+Shift+Tab"],
    category: "Window",
  },
];

const defaultConfig: AppConfig = {
  general: {
    autoSaveQueries: true,
    queryHistoryLimit: 100,
    defaultConnectionOnStartup: false,
    confirmBeforeClosing: true,
    checkForUpdates: true,
  },
  appearance: {
    theme: "dark",
    fontSize: 14,
    fontFamily: "monaco",
    uiScale: 1.0,
    compactMode: false,
  },
  editor: {
    showLineNumbers: true,
    wordWrap: false,
    autoComplete: true,
    tabSize: 2,
    insertSpaces: true,
    formatOnSave: false,
    highlightActiveLine: true,
    showWhitespace: false,
    enableCodeFolding: true,
  },
  ai: {
    apiKey: "",
    model: "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 2000,
    enableSuggestions: true,
    autoExplain: false,
    includeSchema: true,
  },
  connections: {
    defaultTimeout: 30,
    autoReconnect: true,
    sslVerification: true,
    maxConnections: 10,
    connectionPooling: true,
    keepAliveInterval: 30,
  },
  shortcuts: {
    shortcuts: defaultShortcuts,
    enableGlobalShortcuts: true,
  },
  version: "1.0.0",
  lastModified: new Date().toISOString(),
};

interface ConfigContextType {
  config: AppConfig;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => Promise<void>;
  updateAppearanceSettings: (
    settings: Partial<AppearanceSettings>
  ) => Promise<void>;
  updateEditorSettings: (settings: Partial<EditorSettings>) => Promise<void>;
  updateAISettings: (settings: Partial<AISettings>) => Promise<void>;
  updateConnectionSettings: (
    settings: Partial<ConnectionSettings>
  ) => Promise<void>;
  updateShortcut: (id: string, keys: string[]) => Promise<void>;
  resetShortcuts: () => Promise<void>;
  resetSettings: (
    section?: keyof Omit<AppConfig, "version" | "lastModified">
  ) => Promise<void>;
  getShortcut: (id: string) => string[];
  exportConfig: () => string;
  importConfig: (configData: string) => Promise<boolean>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveConfig = useCallback(async () => {
    try {
      const configToSave = {
        ...config,
        lastModified: new Date().toISOString(),
      };

      if (window.api && "storage" in window.api) {
        const storage = (window.api as any).storage;
        await storage.set("app_config", JSON.stringify(configToSave));
      } else {
        localStorage.setItem("sqltemple-config", JSON.stringify(configToSave));
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }, [config]);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);

      if (window.api && "storage" in window.api) {
        const storage = (window.api as any).storage;
        const result = await storage.get("app_config");
        if (result.success && result.value) {
          const parsedConfig = JSON.parse(result.value);
          setConfig({ ...defaultConfig, ...parsedConfig });
        }
      } else {
        const savedConfig = localStorage.getItem("sqltemple-config");
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig({ ...defaultConfig, ...parsedConfig });
        }
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!isLoading && hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveConfig();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, isLoading, saveConfig]);

  const updateConfig = (updater: (prevConfig: AppConfig) => AppConfig) => {
    setConfig(updater);
    setHasUnsavedChanges(true);
  };

  const updateGeneralSettings = async (settings: Partial<GeneralSettings>) => {
    updateConfig((prev) => ({
      ...prev,
      general: { ...prev.general, ...settings },
    }));
  };

  const updateAppearanceSettings = async (
    settings: Partial<AppearanceSettings>
  ) => {
    updateConfig((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...settings },
    }));
  };

  const updateEditorSettings = async (settings: Partial<EditorSettings>) => {
    updateConfig((prev) => ({
      ...prev,
      editor: { ...prev.editor, ...settings },
    }));
  };

  const updateAISettings = async (settings: Partial<AISettings>) => {
    updateConfig((prev) => ({
      ...prev,
      ai: { ...prev.ai, ...settings },
    }));
  };

  const updateConnectionSettings = async (
    settings: Partial<ConnectionSettings>
  ) => {
    updateConfig((prev) => ({
      ...prev,
      connections: { ...prev.connections, ...settings },
    }));
  };

  const updateShortcut = async (id: string, keys: string[]) => {
    updateConfig((prev) => ({
      ...prev,
      shortcuts: {
        ...prev.shortcuts,
        shortcuts: prev.shortcuts.shortcuts.map((shortcut) =>
          shortcut.id === id ? { ...shortcut, customKeys: keys } : shortcut
        ),
      },
    }));
  };

  const resetShortcuts = async () => {
    updateConfig((prev) => ({
      ...prev,
      shortcuts: { ...prev.shortcuts, shortcuts: defaultShortcuts },
    }));
  };

  const resetSettings = async (
    section?: keyof Omit<AppConfig, "version" | "lastModified">
  ) => {
    if (section) {
      updateConfig((prev) => ({
        ...prev,
        [section]: defaultConfig[section],
      }));
    } else {
      setConfig(defaultConfig);
      setHasUnsavedChanges(true);
    }
  };

  const getShortcut = (id: string): string[] => {
    const shortcut = config.shortcuts.shortcuts.find((s) => s.id === id);
    if (!shortcut) return [];
    return shortcut.customKeys || shortcut.defaultKeys;
  };

  const exportConfig = (): string => {
    return JSON.stringify(config, null, 2);
  };

  const importConfig = async (configData: string): Promise<boolean> => {
    try {
      const importedConfig = JSON.parse(configData);
      if (
        !importedConfig.general ||
        !importedConfig.appearance ||
        !importedConfig.editor
      ) {
        throw new Error("Invalid config format");
      }

      const mergedConfig = { ...defaultConfig, ...importedConfig };
      setConfig(mergedConfig);
      setHasUnsavedChanges(true);
      return true;
    } catch (error) {
      console.error("Failed to import config:", error);
      return false;
    }
  };

  const contextValue: ConfigContextType = {
    config,
    updateGeneralSettings,
    updateAppearanceSettings,
    updateEditorSettings,
    updateAISettings,
    updateConnectionSettings,
    updateShortcut,
    resetShortcuts,
    resetSettings,
    getShortcut,
    exportConfig,
    importConfig,
    isLoading,
    hasUnsavedChanges,
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export interface Settings {
  keyboardShortcuts: KeyboardShortcut[];
}

export const useSettings = () => {
  const { config, updateShortcut, resetShortcuts, getShortcut } = useConfig();

  return {
    settings: { keyboardShortcuts: config.shortcuts.shortcuts },
    updateShortcut,
    resetShortcuts,
    getShortcut,
  };
};

export const SettingsProvider = ConfigProvider;
