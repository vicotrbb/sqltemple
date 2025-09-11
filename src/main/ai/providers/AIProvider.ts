export interface AIConfig {
  provider: string;
  apiKey?: string; // Optional for local providers
  model: string;
  baseUrl?: string; // For local providers like Ollama, LM Studio
  [key: string]: any; // Allow for provider-specific config
}

export interface AIPrompt {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AIProvider {
  readonly name: string;
  readonly displayName: string;
  readonly isLocal: boolean; // Whether this provider runs locally
  readonly defaultBaseUrl?: string; // Default URL for local providers

  // Configuration
  validateConfig(config: AIConfig): AIValidationResult;
  validateApiKey(
    config: AIConfig
  ): Promise<{ isValid: boolean; error?: string }>;
  getAvailableModels(config?: AIConfig): Promise<string[]>; // Made async to support dynamic fetching

  // AI Operations
  complete(prompt: AIPrompt, config: AIConfig): Promise<AIResponse>;

  // Provider-specific features
  supportsStreaming(): boolean;
  supportsVision(): boolean;
  supportsToolCalling(): boolean;
  requiresApiKey(): boolean; // Whether API key is required
}

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly isLocal: boolean;
  readonly defaultBaseUrl?: string;

  abstract validateConfig(config: AIConfig): AIValidationResult;
  abstract validateApiKey(
    config: AIConfig
  ): Promise<{ isValid: boolean; error?: string }>;
  abstract getAvailableModels(config?: AIConfig): Promise<string[]>;
  abstract complete(prompt: AIPrompt, config: AIConfig): Promise<AIResponse>;
  abstract requiresApiKey(): boolean;

  supportsStreaming(): boolean {
    return false;
  }

  supportsVision(): boolean {
    return false;
  }

  supportsToolCalling(): boolean {
    return false;
  }

  protected handleError(error: any): never {
    let errorMessage = "AI request failed";

    if (error.status === 401) {
      errorMessage = "Invalid API key. Please check your credentials.";
    } else if (error.status === 429) {
      errorMessage = "API rate limit exceeded. Please try again later.";
    } else if (error.status === 403) {
      errorMessage = "API key does not have sufficient permissions.";
    } else if (error.status === 404) {
      errorMessage = "Model not found. Please select a different model.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}
