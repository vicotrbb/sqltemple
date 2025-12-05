import { aiProviderRegistry } from "./AIProviderRegistry";
import type { AIConfig, AIProvider } from "./providers/AIProvider";
import { StorageManager } from "../storage/StorageManager";

export type { AIConfig, AIPrompt } from "./providers/AIProvider";

export class AIService {
  constructor(private storageManager: StorageManager) {}

  private async getConfigAndProvider(): Promise<{
    config: AIConfig;
    provider: AIProvider;
  }> {
    const config = await this.storageManager.getAIConfig();
    if (!config) {
      throw new Error("AI service not configured. Please set your API key.");
    }

    const provider = aiProviderRegistry.getProvider(config.provider);
    if (!provider) {
      throw new Error(`Provider ${config.provider} not found`);
    }

    return { config, provider };
  }

  getAvailableProviders(): Array<{
    name: string;
    displayName: string;
    isLocal: boolean;
    requiresApiKey: boolean;
  }> {
    return aiProviderRegistry.getAllProviders().map((p) => ({
      name: p.name,
      displayName: p.displayName,
      isLocal: p.isLocal,
      requiresApiKey: p.requiresApiKey(),
    }));
  }

  validateConfig(config: AIConfig): { isValid: boolean; errors: string[] } {
    const provider = aiProviderRegistry.getProvider(config.provider);
    if (!provider) {
      return {
        isValid: false,
        errors: [`Unknown provider: ${config.provider}`],
      };
    }
    return provider.validateConfig(config);
  }

  async validateApiKey(
    config: AIConfig
  ): Promise<{ isValid: boolean; error?: string }> {
    const provider = aiProviderRegistry.getProvider(config.provider);
    if (!provider) {
      return { isValid: false, error: `Unknown provider: ${config.provider}` };
    }
    return provider.validateApiKey(config);
  }

  async getAvailableModels(
    providerName?: string,
    config?: AIConfig
  ): Promise<string[]> {
    let provider: AIProvider | null = null;

    if (providerName) {
      provider = aiProviderRegistry.getProvider(providerName);
    } else if (config) {
      provider = aiProviderRegistry.getProvider(config.provider);
    }

    if (!provider) {
      return [];
    }

    return await provider.getAvailableModels(config);
  }

  async completePrompt(prompt: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const { config, provider } = await this.getConfigAndProvider();
    const response = await provider.complete(
      {
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        temperature: prompt.temperature,
        maxTokens: prompt.maxTokens,
      },
      config
    );
    return response.content;
  }

  async analyzeQueryPlan(query: string, plan: any): Promise<string> {
    const { config, provider } = await this.getConfigAndProvider();

    const systemPrompt = `You are an expert database performance analyst specializing in PostgreSQL query optimization. Your role is to analyze query execution plans and provide clear, actionable insights.

When analyzing a query plan, you should:
1. Identify the most expensive operations (by cost and time)
2. Look for common performance issues like:
   - Sequential scans on large tables that could benefit from indexes
   - Nested loops with high iteration counts
   - Sort operations that could be avoided
   - Missing or unused indexes
   - Inefficient join orders
3. Provide specific recommendations for optimization
4. Explain complex operations in simple terms

Format your response with clear sections:
- Summary of the execution plan
- Key performance bottlenecks
- Specific optimization recommendations
- Potential index suggestions`;

    const userPrompt = `Please analyze this PostgreSQL query and its execution plan:

QUERY:
${query}

EXECUTION PLAN:
${JSON.stringify(plan, null, 2)}

Provide a detailed analysis with specific optimization recommendations.`;

    const response = await provider.complete(
      { systemPrompt, userPrompt },
      config
    );
    return response.content;
  }

  async explainQuery(query: string, schema?: any): Promise<string> {
    const { config, provider } = await this.getConfigAndProvider();

    const systemPrompt = `You are an expert SQL instructor who explains queries in a clear, educational manner. Your explanations should be:
1. Accurate and technically correct
2. Easy to understand for developers of all levels
3. Include what the query does step-by-step
4. Highlight any potential issues or anti-patterns
5. Suggest improvements when appropriate

Structure your explanation with:
- What the query does (high-level summary)
- Step-by-step breakdown
- Key concepts used
- Potential issues or improvements`;

    const userPrompt = `Please explain this SQL query in detail:

${query}

${
  schema
    ? `Available schema information:
${JSON.stringify(schema, null, 2)}`
    : ""
}

Provide a comprehensive explanation that helps understand what this query does and how it works.`;

    const response = await provider.complete(
      { systemPrompt, userPrompt },
      config
    );
    return response.content;
  }

  async createQuery(userRequest: string, schema: any): Promise<string> {
    const { config, provider } = await this.getConfigAndProvider();

    const systemPrompt = `You are an expert SQL query writer. Your role is to create efficient, correct SQL queries based on user requirements and database schema.

Guidelines:
1. Write clean, readable SQL with proper formatting
2. Use appropriate JOINs instead of subqueries where possible
3. Include helpful comments for complex logic
4. Follow SQL best practices
5. Consider performance implications
6. ONLY return the SQL query, no explanations or markdown
7. Use appropriate table aliases for readability
8. Include proper error handling with COALESCE/NULLIF where needed`;

    const userPrompt = `Create a SQL query for the following request:

USER REQUEST: ${userRequest}

DATABASE SCHEMA:
${JSON.stringify(schema, null, 2)}

Return ONLY the SQL query without any explanations or markdown formatting.`;

    const response = await provider.complete(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.3,
      },
      config
    );
    return this.cleanSQLResponse(response.content);
  }

  async optimizeQuery(query: string, plan: any, schema: any): Promise<string> {
    const { config, provider } = await this.getConfigAndProvider();

    const systemPrompt = `You are a database optimization expert. Your task is to rewrite SQL queries for better performance based on their execution plans.

Optimization strategies to consider:
1. Add or suggest appropriate indexes
2. Rewrite subqueries as JOINs when beneficial
3. Use CTEs for better readability and potential performance
4. Optimize JOIN order based on cardinality
5. Use appropriate aggregate functions and window functions
6. Eliminate unnecessary operations
7. Consider using EXPLAIN ANALYZE results

Return ONLY the optimized SQL query without explanations or markdown.`;

    const userPrompt = `Optimize this PostgreSQL query based on its execution plan:

ORIGINAL QUERY:
${query}

EXECUTION PLAN:
${JSON.stringify(plan, null, 2)}

DATABASE SCHEMA:
${JSON.stringify(schema, null, 2)}

Return ONLY the optimized SQL query.`;

    const response = await provider.complete(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.2,
      },
      config
    );
    return this.cleanSQLResponse(response.content);
  }

  async analyzeData(prompt: string): Promise<string> {
    const { config, provider } = await this.getConfigAndProvider();

    const systemPrompt = `You are an expert data analyst. Your role is to analyze query results and provide insights about the data.

When analyzing data, you should:
1. Identify patterns and trends in the data
2. Highlight data quality issues (nulls, duplicates, outliers)
3. Provide business insights and observations
4. Suggest recommendations for further analysis
5. Note any anomalies or interesting findings

Return your response as valid JSON in the exact format requested, without any markdown formatting or additional text.`;

    const response = await provider.complete(
      {
        systemPrompt,
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 1000,
      },
      config
    );

    return response.content;
  }

  private cleanSQLResponse(response: string): string {
    let cleaned = response.trim();

    cleaned = cleaned.replace(/^```(?:sql)?\s*\n?/i, "");
    cleaned = cleaned.replace(/\n?```\s*$/i, "");

    return cleaned.trim();
  }
}
