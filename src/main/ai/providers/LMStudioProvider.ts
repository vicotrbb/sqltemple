import {
  BaseAIProvider,
  AIConfig,
  AIPrompt,
  AIResponse,
  AIValidationResult,
} from "./AIProvider";

export class LMStudioProvider extends BaseAIProvider {
  readonly name = "lmstudio";
  readonly displayName = "LM Studio";
  readonly isLocal = true;
  readonly defaultBaseUrl = "http://localhost:1234";

  requiresApiKey(): boolean {
    return false;
  }

  validateConfig(config: AIConfig): AIValidationResult {
    const errors: string[] = [];

    if (!config.model || typeof config.model !== "string") {
      errors.push("Model selection is required");
    } else if (config.model.trim().length === 0) {
      errors.push("Model name cannot be empty");
    }

    const baseUrl = config.baseUrl || this.defaultBaseUrl;
    if (!baseUrl) {
      errors.push("Base URL is required");
    } else {
      try {
        new URL(baseUrl);
      } catch {
        errors.push("Invalid base URL format");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async validateApiKey(
    config: AIConfig
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const baseUrl = config.baseUrl || this.defaultBaseUrl;
      const response = await fetch(`${baseUrl}/v1/models`, {
        headers: config.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {},
      });

      if (!response.ok) {
        return {
          isValid: false,
          error: `Failed to connect to LM Studio server: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        return {
          isValid: false,
          error: "Invalid response from LM Studio server",
        };
      }

      return { isValid: true };
    } catch (error: any) {
      let errorMessage = "Failed to connect to LM Studio server";

      if (error.code === "ECONNREFUSED") {
        errorMessage =
          "Cannot connect to LM Studio. Make sure LM Studio is running with a local server.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { isValid: false, error: errorMessage };
    }
  }

  async getAvailableModels(config?: AIConfig): Promise<string[]> {
    try {
      const baseUrl = config?.baseUrl || this.defaultBaseUrl;
      const response = await fetch(`${baseUrl}/v1/models`, {
        headers: config?.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {},
      });

      if (!response.ok) {
        console.warn("Failed to fetch LM Studio models, returning empty list");
        return [];
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.warn("Error fetching LM Studio models:", error);
      return [];
    }
  }

  async complete(prompt: AIPrompt, config: AIConfig): Promise<AIResponse> {
    const baseUrl = config.baseUrl || this.defaultBaseUrl;

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey
            ? { Authorization: `Bearer ${config.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: prompt.systemPrompt },
            { role: "user", content: prompt.userPrompt },
          ],
          temperature: prompt.temperature ?? 0.7,
          max_tokens: prompt.maxTokens ?? 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        content:
          data.choices?.[0]?.message?.content || "No response from LM Studio",
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
      };
    } catch (error: any) {
      this.handleError(error);
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsVision(): boolean {
    return false;
  }

  supportsToolCalling(): boolean {
    return false;
  }
}
