import React, { useState, useEffect } from "react";
import { AISettings } from "./AISettings";
import {
  SettingsIcon,
  EyeIcon,
  FormatIcon,
  BrainIcon,
  DatabaseIcon,
  KeyboardIcon,
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

export const PreferencesDialog: React.FC<PreferencesDialogProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PreferencesTab>("general");
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(false);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [isCheckingForUpdates, setIsCheckingForUpdates] =
    useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<string>("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const autoUpdateResult =
        await window.api.storage.get("autoUpdateEnabled");
      if (autoUpdateResult.success && autoUpdateResult.value) {
        setAutoUpdateEnabled(autoUpdateResult.value === "true");
      }

      const statusResult = await window.api.update.getStatus();
      if (statusResult.success && statusResult.currentVersion) {
        setCurrentVersion(statusResult.currentVersion);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleAutoUpdateToggle = async (enabled: boolean) => {
    try {
      await window.api.storage.set("autoUpdateEnabled", enabled.toString());
      setAutoUpdateEnabled(enabled);
    } catch (error) {
      console.error("Failed to save auto-update setting:", error);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingForUpdates(true);
    setUpdateStatus("Checking for updates...");

    try {
      const result = await window.api.update.check();
      if (result.success) {
        if (result.updateInfo) {
          setUpdateStatus(`Update available: ${result.updateInfo.version}`);
        } else {
          setUpdateStatus("Your application is up to date");
        }
      } else {
        setUpdateStatus(result.error || "Failed to check for updates");
      }
    } catch (error) {
      setUpdateStatus("Failed to check for updates");
    } finally {
      setIsCheckingForUpdates(false);
    }
  };

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                General Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-vscode-text">
                      Auto-save queries
                    </label>
                    <p className="text-xs text-vscode-text-secondary">
                      Automatically save query changes
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
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
                    defaultValue={100}
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
                  <input type="checkbox" className="toggle" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Application Updates
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-vscode-text">
                      Auto-update
                    </label>
                    <p className="text-xs text-vscode-text-secondary">
                      Automatically check for and install updates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={autoUpdateEnabled}
                    onChange={(e) => handleAutoUpdateToggle(e.target.checked)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-vscode-text">
                        Current version
                      </label>
                      <p className="text-xs text-vscode-text-secondary">
                        {currentVersion || "Unknown"}
                      </p>
                    </div>
                    <button
                      onClick={handleCheckForUpdates}
                      disabled={isCheckingForUpdates}
                      className="px-3 py-1 bg-vscode-blue hover:bg-vscode-blue-light disabled:bg-vscode-bg-quaternary disabled:text-vscode-text-secondary text-white rounded text-sm font-medium transition-colors"
                    >
                      {isCheckingForUpdates
                        ? "Checking..."
                        : "Check for Updates"}
                    </button>
                  </div>

                  {updateStatus && (
                    <div className="text-xs text-vscode-text-secondary">
                      {updateStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Appearance Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-vscode-text block mb-2">
                    Theme
                  </label>
                  <select className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-vscode-text block mb-2">
                    Font size
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    defaultValue="14"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-vscode-text-secondary">
                    <span>12px</span>
                    <span>20px</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-vscode-text block mb-2">
                    Editor font family
                  </label>
                  <select className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm">
                    <option value="monaco">Monaco</option>
                    <option value="consolas">Consolas</option>
                    <option value="courier">Courier New</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case "editor":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Editor Settings
              </h3>
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
                  <input type="checkbox" className="toggle" defaultChecked />
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
                  <input type="checkbox" className="toggle" />
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
                  <input type="checkbox" className="toggle" defaultChecked />
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
                    defaultValue={2}
                    min="2"
                    max="8"
                    className="w-20 px-2 py-1 bg-vscode-bg border border-vscode-border rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                AI Assistant Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-vscode-text block mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your OpenAI API key"
                    className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-vscode-text block mb-2">
                    Model
                  </label>
                  <select className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm">
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-vscode-text block mb-2">
                    Temperature
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="0.3"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-vscode-text-secondary">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-vscode-text">
                      Enable AI suggestions
                    </label>
                    <p className="text-xs text-vscode-text-secondary">
                      Show AI-powered query suggestions
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );

      case "connections":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Connection Settings
              </h3>
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
                    defaultValue={30}
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
                  <input type="checkbox" className="toggle" defaultChecked />
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
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );

      case "shortcuts":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4">
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3">
                {[
                  { action: "Execute Query", shortcut: "⌘+↵" },
                  { action: "New Tab", shortcut: "⌘+T" },
                  { action: "Close Tab", shortcut: "⌘+W" },
                  { action: "Query History", shortcut: "⌘+H" },
                  { action: "AI Create Query", shortcut: "⌘+Shift+N" },
                  { action: "Explain Query", shortcut: "⌘+E" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-vscode-border"
                  >
                    <span className="text-sm text-vscode-text">
                      {item.action}
                    </span>
                    <kbd className="px-2 py-1 bg-vscode-bg-quaternary border border-vscode-border rounded text-xs">
                      {item.shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-vscode-bg-secondary rounded-md shadow-2xl w-[800px] h-[600px] border border-vscode-border flex">
        {/* Sidebar */}
        <div className="w-48 bg-vscode-bg-tertiary border-r border-vscode-border">
          <div className="p-4 border-b border-vscode-border">
            <h2 className="text-lg font-medium text-vscode-text">
              Preferences
            </h2>
          </div>
          <nav className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "bg-vscode-blue bg-opacity-20 text-vscode-blue"
                    : "text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-bg-quaternary"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-vscode-border">
            <div></div>
            <button
              onClick={onClose}
              className="text-vscode-text-secondary hover:text-vscode-text transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">{renderTabContent()}</div>

          <div className="p-4 border-t border-vscode-border flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-vscode-text-secondary hover:text-vscode-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
