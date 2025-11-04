import React, { useState, useEffect, useCallback } from "react";
import { aiService } from "../services/AIService";
import {
  errorService,
  ErrorLevel,
  ErrorCategory,
} from "../services/ErrorService";

interface AIProvider {
  name: string;
  displayName: string;
  isLocal?: boolean;
  requiresApiKey?: boolean;
}

export interface AIConfigurationState {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface AISettingsProps {
  onClose: () => void;
  embedded?: boolean;
  onConfigChange?: (config: AIConfigurationState) => void;
}

export const AISettings: React.FC<AISettingsProps> = ({
  onClose,
  embedded = false,
  onConfigChange,
}) => {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const loadSettings = async () => {
    try {
      const providersResult = await aiService.getProviders();
      if (providersResult.success && providersResult.data) {
        setProviders(providersResult.data);
      }
      const configResult = await aiService.getConfig();
      if (configResult.success && configResult.data) {
        setProvider(configResult.data.provider || "openai");
        setApiKey(configResult.data.apiKey || "");
        setModel(configResult.data.model || "");
        setBaseUrl(configResult.data.baseUrl || "");
      }
    } catch (error) {
      console.error("Failed to load AI settings:", error);
      setError("Failed to load AI settings");
    } finally {
      setSettingsLoaded(true);
    }
  };

  const loadModels = useCallback(async () => {
    try {
      const config = {
        provider,
        apiKey,
        model: "",
        baseUrl: baseUrl || undefined,
      };

      const modelsResult = await aiService.getModels(provider, config);
      if (modelsResult.success && modelsResult.data) {
        setModels(modelsResult.data);

        if (!model && modelsResult.data.length > 0) {
          if (provider === "openai") {
            setModel("gpt-4o-mini");
          } else if (provider === "claude") {
            setModel("claude-3-5-sonnet-20241022");
          } else {
            setModel(modelsResult.data[0]);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load models:", error);
      setModels([]);
    }
  }, [apiKey, baseUrl, model, provider]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const emitConfigChange = useCallback(
    (
      currentProvider: string,
      currentApiKey: string,
      currentModel: string,
      currentBaseUrl: string
    ) => {
      if (!onConfigChange) {
        return;
      }

      onConfigChange({
        provider: currentProvider,
        apiKey: currentApiKey,
        model: currentModel,
        baseUrl: currentBaseUrl || undefined,
      });
    },
    [onConfigChange]
  );

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }
    emitConfigChange(provider, apiKey, model, baseUrl);
  }, [provider, apiKey, model, baseUrl, emitConfigChange, settingsLoaded]);

  const getCurrentProvider = (): AIProvider | undefined => {
    return providers.find((p) => p.name === provider);
  };

  const getDefaultBaseUrlForProvider = (providerName: string): string => {
    if (providerName === "ollama") return "http://localhost:11434";
    if (providerName === "lmstudio") return "http://localhost:1234";
    return "";
  };

  const getDefaultBaseUrl = (): string => {
    return getDefaultBaseUrlForProvider(provider);
  };

  const isApiKeyRequired = (): boolean => {
    const currentProvider = getCurrentProvider();
    return (
      currentProvider?.requiresApiKey !== false && !currentProvider?.isLocal
    );
  };

  const isLocalProvider = (): boolean => {
    const currentProvider = getCurrentProvider();
    return currentProvider?.isLocal === true;
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setApiKey("");
    setModel("");
    setBaseUrl(getDefaultBaseUrlForProvider(newProvider));
    setError(null);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setError(null);

    const config = {
      provider,
      apiKey: apiKey || undefined,
      model: model || "test-model",
      baseUrl: baseUrl || undefined,
    };

    try {
      const result = await aiService.validateConfig(config);
      if (result.success) {
        setError(null);
        errorService.logError(
          ErrorLevel.INFO,
          ErrorCategory.AI,
          "AI connection test successful",
          {
            userMessage: "AI connection test successful",
            autoHide: true,
            duration: 3000,
          }
        );
      } else {
        const message = result.error || "Connection test failed";
        setError(message);
        errorService.logError(
          ErrorLevel.ERROR,
          ErrorCategory.AI,
          "AI connection test failed",
          {
            userMessage: message,
            details: message,
            autoHide: false,
          }
        );
      }
    } catch (error) {
      setError("Connection test failed");
      errorService.logError(
        ErrorLevel.ERROR,
        ErrorCategory.AI,
        "AI connection test failed",
        {
          userMessage: "Connection test failed",
          details: error instanceof Error ? error.message : String(error),
          autoHide: false,
        }
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (isApiKeyRequired() && !apiKey.trim()) {
      setError("API key is required for this provider");
      return;
    }

    if (!model.trim()) {
      setError("Model selection is required");
      return;
    }

    setLoading(true);
    setError(null);

    const config = {
      provider,
      apiKey: apiKey || undefined,
      model,
      baseUrl: baseUrl || undefined,
    };

    try {
      const result = await aiService.setConfig(config);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save AI settings:", error);
      setError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const settingsContent = (
    <div
      className={
        embedded
          ? ""
          : "bg-vscode-bg-secondary border border-vscode-border rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
      }
    >
      {!embedded && <h2 className="text-lg font-semibold mb-4">AI Settings</h2>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">AI Provider</label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm focus:outline-none focus:border-vscode-blue"
          >
            {providers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName} {p.isLocal ? "(Local)" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-vscode-text-tertiary mt-1">
            Choose your preferred AI provider. Local providers run on your
            machine.
          </p>
        </div>

        {isLocalProvider() && (
          <div>
            <label className="block text-sm font-medium mb-1">Server URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm focus:outline-none focus:border-vscode-blue"
              placeholder={getDefaultBaseUrl()}
            />
            <p className="text-xs text-vscode-text-tertiary mt-1">
              The URL where your {getCurrentProvider()?.displayName} server is
              running
            </p>
          </div>
        )}

        {isApiKeyRequired() && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {getCurrentProvider()?.displayName} API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm focus:outline-none focus:border-vscode-blue"
              placeholder={
                provider === "openai"
                  ? "sk-..."
                  : provider === "claude"
                    ? "sk-ant-..."
                    : "Enter your API key"
              }
            />
            <p className="text-xs text-vscode-text-tertiary mt-1">
              Your API key is stored locally and encrypted
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm focus:outline-none focus:border-vscode-blue"
            disabled={models.length === 0}
          >
            {models.length === 0 && (
              <option value="">
                {isLocalProvider()
                  ? "No models available (check server connection)"
                  : "Loading models..."}
              </option>
            )}
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <p className="text-xs text-vscode-text-tertiary mt-1">
            {provider === "openai" &&
              "Different models have different capabilities and costs. GPT-4o and o1 models are more capable but more expensive."}
            {provider === "claude" &&
              "Claude models offer different speeds and capabilities. Sonnet provides the best balance of speed and quality."}
            {isLocalProvider() &&
              "Available models from your local server. Make sure the server is running and accessible."}
          </p>
        </div>

        {(isLocalProvider() || (isApiKeyRequired() && apiKey)) && (
          <div>
            <button
              onClick={testConnection}
              className="px-4 py-2 text-sm bg-vscode-bg-tertiary hover:bg-vscode-bg-quaternary border border-vscode-border rounded transition-colors"
              disabled={testingConnection}
            >
              {testingConnection ? "Testing..." : "Test Connection"}
            </button>
          </div>
        )}

        {error && <div className="text-vscode-red text-sm">{error}</div>}

        {!embedded && (
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
              disabled={loading || models.length === 0}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return embedded ? (
    settingsContent
  ) : (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {settingsContent}
    </div>
  );
};
