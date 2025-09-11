import { BaseAIProvider, AIConfig, AIPrompt, AIResponse, AIValidationResult } from "./AIProvider";

export class OllamaProvider extends BaseAIProvider {
  readonly name = "ollama";
  readonly displayName = "Ollama";
  readonly isLocal = true;
  readonly defaultBaseUrl = "http://localhost:11434";

  requiresApiKey(): boolean {
    return false;
  }

  validateConfig(config: AIConfig): AIValidationResult {
    const errors: string[] = [];

    if (!config.model || typeof config.model !== 'string') {
      errors.push('Model selection is required');
    } else if (config.model.trim().length === 0) {
      errors.push('Model name cannot be empty');
    }

    const baseUrl = config.baseUrl || this.defaultBaseUrl;
    if (!baseUrl) {
      errors.push('Base URL is required');
    } else {
      try {
        new URL(baseUrl);
      } catch {
        errors.push('Invalid base URL format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async validateApiKey(config: AIConfig): Promise<{ isValid: boolean; error?: string }> {
    try {
      const baseUrl = config.baseUrl || this.defaultBaseUrl;
      const response = await fetch(`${baseUrl}/api/tags`);
      
      if (!response.ok) {
        return { 
          isValid: false, 
          error: `Failed to connect to Ollama server: ${response.status} ${response.statusText}` 
        };
      }
      
      const data = await response.json();
      if (!data.models || !Array.isArray(data.models)) {
        return { 
          isValid: false, 
          error: 'Invalid response from Ollama server' 
        };
      }
      
      return { isValid: true };
    } catch (error: any) {
      let errorMessage = 'Failed to connect to Ollama server';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to Ollama. Make sure Ollama is running and accessible.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { isValid: false, error: errorMessage };
    }
  }

  async getAvailableModels(config?: AIConfig): Promise<string[]> {
    try {
      const baseUrl = (config?.baseUrl) || this.defaultBaseUrl;
      const response = await fetch(`${baseUrl}/api/tags`);
      
      if (!response.ok) {
        console.warn('Failed to fetch Ollama models, returning empty list');
        return [];
      }
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.warn('Error fetching Ollama models:', error);
      return [];
    }
  }

  async complete(prompt: AIPrompt, config: AIConfig): Promise<AIResponse> {
    const baseUrl = config.baseUrl || this.defaultBaseUrl;
    
    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          prompt: `${prompt.systemPrompt}\n\nUser: ${prompt.userPrompt}\n\nAssistant:`,
          stream: false,
          options: {
            temperature: prompt.temperature ?? 0.7,
            num_predict: prompt.maxTokens ?? 2000,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.response || "No response from Ollama",
        usage: {
          // Ollama doesn't provide detailed token usage
          promptTokens: undefined,
          completionTokens: undefined,
          totalTokens: undefined,
        }
      };
    } catch (error: any) {
      this.handleError(error);
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsVision(): boolean {
    return false; // Most Ollama models don't support vision
  }

  supportsToolCalling(): boolean {
    return false; // Most Ollama models don't support tool calling
  }
}