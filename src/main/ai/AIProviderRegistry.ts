import { AIProvider } from "./providers/AIProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { ClaudeProvider } from "./providers/ClaudeProvider";
import { OllamaProvider } from "./providers/OllamaProvider";
import { LMStudioProvider } from "./providers/LMStudioProvider";

export class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string = "openai";

  constructor() {
    this.registerDefaultProviders();
  }

  private registerDefaultProviders(): void {
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new ClaudeProvider());
    this.registerProvider(new OllamaProvider());
    this.registerProvider(new LMStudioProvider());
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): AIProvider | null {
    return this.providers.get(name) || null;
  }

  getDefaultProvider(): AIProvider {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`Default provider '${this.defaultProvider}' not found`);
    }
    return provider;
  }

  setDefaultProvider(name: string): boolean {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
      return true;
    }
    return false;
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }
}

export const aiProviderRegistry = new AIProviderRegistry();