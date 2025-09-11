import { errorService, ErrorLevel, ErrorCategory } from "./ErrorService";

export interface AIServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AIExplanationResult {
  type: "explain";
  content: string;
}

export interface AIOptimizationResult {
  type: "optimize";
  content: string;
  originalQuery: string;
}

export type AIResult = AIExplanationResult | AIOptimizationResult;

export class AIService {
  async explainQuery(query: string): Promise<AIServiceResult<string>> {
    try {
      const result = await window.api.aiExplainQuery(query);
      if (result.success && result.result) {
        return { success: true, data: result.result };
      } else {
        return { success: false, error: result.error || "Failed to explain query" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "Query explanation failed", 
        error instanceof Error ? error.message : String(error),
        { query: query.substring(0, 100) + (query.length > 100 ? '...' : '') }
      );
      return { success: false, error: "Failed to explain query" };
    }
  }

  async optimizeQuery(query: string): Promise<AIServiceResult<string>> {
    try {
      const result = await window.api.aiOptimizeQuery(query);
      if (result.success && result.result) {
        return { success: true, data: result.result };
      } else {
        return { success: false, error: result.error || "Failed to optimize query" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "Query optimization failed", 
        error instanceof Error ? error.message : String(error),
        { query: query.substring(0, 100) + (query.length > 100 ? '...' : '') }
      );
      return { success: false, error: "Failed to optimize query" };
    }
  }

  async createQuery(prompt: string): Promise<AIServiceResult<string>> {
    try {
      const result = await window.api.aiCreateQuery(prompt);
      if (result.success && result.result) {
        return { success: true, data: result.result };
      } else {
        return { success: false, error: result.error || "Failed to create query" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "Query creation failed", 
        error instanceof Error ? error.message : String(error),
        { prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '') }
      );
      return { success: false, error: "Failed to create query" };
    }
  }

  async getConfig(): Promise<AIServiceResult<{ provider: string; apiKey?: string; model: string; baseUrl?: string }>> {
    try {
      const result = await window.api.aiGetConfig();
      if (result.success && result.config) {
        return { success: true, data: result.config };
      } else {
        return { success: false, error: result.error || "Failed to get AI config" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "Failed to get AI configuration", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "Failed to get AI config" };
    }
  }

  async setConfig(config: { provider: string; apiKey?: string; model: string; baseUrl?: string }): Promise<AIServiceResult<void>> {
    try {
      const result = await window.api.aiSetConfig(config);
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || "Failed to set AI config" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "Failed to set AI configuration", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "Failed to set AI config" };
    }
  }

  async validateConfig(config: { provider: string; apiKey?: string; model: string; baseUrl?: string }): Promise<AIServiceResult<boolean>> {
    try {
      const result = await window.api.aiValidateConfig(config);
      if (result.success) {
        return { success: true, data: true };
      } else {
        return { success: false, error: result.errors?.join(', ') || "Failed to validate AI config" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "AI configuration validation failed", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "Failed to validate AI config" };
    }
  }

  async getModels(providerName?: string, config?: { provider: string; apiKey?: string; model: string; baseUrl?: string }): Promise<AIServiceResult<string[]>> {
    try {
      const result = await window.api.aiGetModels(providerName, config);
      if (result.success && result.models) {
        return { success: true, data: result.models };
      } else {
        return { success: false, error: result.error || "Failed to get AI models" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "Failed to get AI models list", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "Failed to get AI models" };
    }
  }

  async getProviders(): Promise<AIServiceResult<Array<{name: string, displayName: string, isLocal?: boolean, requiresApiKey?: boolean}>>> {
    try {
      const result = await window.api.aiGetProviders();
      if (result.success && result.providers) {
        return { success: true, data: result.providers };
      } else {
        return { success: false, error: result.error || "Failed to get AI providers" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "Failed to get AI providers list", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "Failed to get AI providers" };
    }
  }

  async analyzePlan(query: string, plan: any): Promise<AIServiceResult<string>> {
    try {
      const result = await window.api.aiAnalyzePlan(query, plan);
      if (result.success && result.result) {
        return { success: true, data: result.result };
      } else {
        return { success: false, error: result.error || "Failed to analyze plan" };
      }
    } catch (error) {
      const errorId = errorService.logAIError(
        "Query plan analysis failed", 
        error instanceof Error ? error.message : String(error),
        { query: query.substring(0, 100) + (query.length > 100 ? '...' : '') }
      );
      return { success: false, error: "Failed to analyze plan" };
    }
  }
}

export const aiService = new AIService();