import Anthropic from "@anthropic-ai/sdk";
import {
  BaseAIProvider,
  AIConfig,
  AIPrompt,
  AIResponse,
  AIValidationResult,
} from "./AIProvider";

export class ClaudeProvider extends BaseAIProvider {
  readonly name = "claude";
  readonly displayName = "Claude (Anthropic)";
  readonly isLocal = false;

  requiresApiKey(): boolean {
    return true;
  }

  validateConfig(config: AIConfig): AIValidationResult {
    const errors: string[] = [];

    if (!config.apiKey || typeof config.apiKey !== "string") {
      errors.push("API key is required");
    } else if (config.apiKey.trim().length === 0) {
      errors.push("API key cannot be empty");
    } else if (!config.apiKey.startsWith("sk-ant-")) {
      errors.push('API key must start with "sk-ant-"');
    } else if (config.apiKey.length < 30) {
      errors.push("API key appears to be too short");
    }

    if (!config.model || typeof config.model !== "string") {
      errors.push("Model selection is required");
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
      const anthropic = new Anthropic({ apiKey: config.apiKey });

      await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [{ role: "user", content: "Test" }],
      });

      return { isValid: true };
    } catch (error: any) {
      let errorMessage = "API key validation failed";

      if (error.status === 401) {
        errorMessage = "Invalid API key. Please check your Anthropic API key.";
      } else if (error.status === 429) {
        errorMessage = "API rate limit exceeded. Please try again later.";
      } else if (error.status === 403) {
        errorMessage = "API key does not have sufficient permissions.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { isValid: false, error: errorMessage };
    }
  }

  async getAvailableModels(_config?: AIConfig): Promise<string[]> {
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ];
  }

  async complete(prompt: AIPrompt, config: AIConfig): Promise<AIResponse> {
    const anthropic = new Anthropic({ apiKey: config.apiKey });

    try {
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: prompt.maxTokens ?? 2000,
        temperature: prompt.temperature ?? 0.7,
        system: prompt.systemPrompt,
        messages: [{ role: "user", content: prompt.userPrompt }],
      });

      const content = response.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("");

      return {
        content: content || "No response from Claude",
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
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
    return true;
  }

  supportsToolCalling(): boolean {
    return true;
  }
}
