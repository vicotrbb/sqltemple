import OpenAI from "openai";
import { BaseAIProvider, AIConfig, AIPrompt, AIResponse, AIValidationResult } from "./AIProvider";

export class OpenAIProvider extends BaseAIProvider {
  readonly name = "openai";
  readonly displayName = "OpenAI";
  
  validateConfig(config: AIConfig): AIValidationResult {
    const errors: string[] = [];

    if (!config.apiKey || typeof config.apiKey !== 'string') {
      errors.push('API key is required');
    } else if (config.apiKey.trim().length === 0) {
      errors.push('API key cannot be empty');
    } else if (!config.apiKey.startsWith('sk-')) {
      errors.push('API key must start with "sk-"');
    } else if (config.apiKey.length < 20) {
      errors.push('API key appears to be too short');
    }

    if (!config.model || typeof config.model !== 'string') {
      errors.push('Model selection is required');
    } else if (!this.getAvailableModels().includes(config.model)) {
      errors.push(`Invalid model "${config.model}". Must be one of: ${this.getAvailableModels().join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  async validateApiKey(config: AIConfig): Promise<{ isValid: boolean; error?: string }> {
    try {
      const testOpenAI = new OpenAI({ apiKey: config.apiKey });
      await testOpenAI.models.list();
      return { isValid: true };
    } catch (error: any) {
      let errorMessage = 'API key validation failed';
      
      if (error.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key.';
      } else if (error.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (error.status === 403) {
        errorMessage = 'API key does not have sufficient permissions.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { isValid: false, error: errorMessage };
    }
  }
  
  getAvailableModels(): string[] {
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "o1-preview",
      "o1-mini",
      "gpt-4-turbo",
      "gpt-4-turbo-preview",
      "gpt-4",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
    ];
  }
  
  async complete(prompt: AIPrompt, config: AIConfig): Promise<AIResponse> {
    const openai = new OpenAI({ apiKey: config.apiKey });
    
    try {
      const isO1Model = config.model.startsWith("o1-");

      const params: any = {
        model: config.model,
        messages: [
          { role: "system", content: prompt.systemPrompt },
          { role: "user", content: prompt.userPrompt },
        ],
      };

      if (!isO1Model) {
        params.temperature = prompt.temperature ?? 0.7;
        params.max_tokens = prompt.maxTokens ?? 2000;
      } else {
        params.max_completion_tokens = prompt.maxTokens ?? 2000;
      }

      const response = await openai.chat.completions.create(params);

      return {
        content: response.choices[0]?.message?.content || "No response from AI",
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
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
    return true;
  }
  
  supportsToolCalling(): boolean {
    return true;
  }
}