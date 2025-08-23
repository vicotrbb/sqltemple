export interface AIConfig {
  apiKey: string;
  model: string;
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
  
  // Configuration
  validateConfig(config: AIConfig): AIValidationResult;
  validateApiKey(config: AIConfig): Promise<{ isValid: boolean; error?: string }>;
  getAvailableModels(): string[];
  
  // AI Operations
  complete(prompt: AIPrompt, config: AIConfig): Promise<AIResponse>;
  
  // Provider-specific features
  supportsStreaming(): boolean;
  supportsVision(): boolean;
  supportsToolCalling(): boolean;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  
  abstract validateConfig(config: AIConfig): AIValidationResult;
  abstract validateApiKey(config: AIConfig): Promise<{ isValid: boolean; error?: string }>;
  abstract getAvailableModels(): string[];
  abstract complete(prompt: AIPrompt, config: AIConfig): Promise<AIResponse>;
  
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
    let errorMessage = 'AI request failed';
    
    if (error.status === 401) {
      errorMessage = 'Invalid API key. Please check your credentials.';
    } else if (error.status === 429) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
    } else if (error.status === 403) {
      errorMessage = 'API key does not have sufficient permissions.';
    } else if (error.status === 404) {
      errorMessage = 'Model not found. Please select a different model.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}