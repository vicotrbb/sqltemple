import { aiProviderRegistry } from "./AIProviderRegistry";
import { AIConfig, AIPrompt, AIProvider } from "./providers/AIProvider";

export { AIConfig, AIPrompt } from "./providers/AIProvider";

export class AIService {
  private config: AIConfig | null = null;
  private provider: AIProvider | null = null;
  private providerName: string = "openai";

  constructor() {
    this.provider = aiProviderRegistry.getDefaultProvider();
  }

  setProvider(providerName: string): boolean {
    const provider = aiProviderRegistry.getProvider(providerName);
    if (provider) {
      this.provider = provider;
      this.providerName = providerName;
      return true;
    }
    return false;
  }

  getProviderName(): string {
    return this.providerName;
  }

  getAvailableProviders(): Array<{name: string, displayName: string}> {
    return aiProviderRegistry.getAllProviders().map(p => ({
      name: p.name,
      displayName: p.displayName
    }));
  }

  validateConfig(config: AIConfig): { isValid: boolean; errors: string[] } {
    if (!this.provider) {
      return { isValid: false, errors: ['No AI provider configured'] };
    }
    return this.provider.validateConfig(config);
  }

  async validateApiKey(config: AIConfig): Promise<{ isValid: boolean; error?: string }> {
    if (!this.provider) {
      return { isValid: false, error: 'No AI provider configured' };
    }
    return this.provider.validateApiKey(config);
  }

  async setConfig(config: AIConfig): Promise<{ success: boolean; errors?: string[] }> {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    try {
      const apiValidation = await this.validateApiKey(config);
      if (!apiValidation.isValid) {
        return { success: false, errors: [apiValidation.error || 'API key validation failed'] };
      }

      this.config = config;
      return { success: true };
    } catch (error: any) {
      return { success: false, errors: [`Failed to configure AI service: ${error.message}`] };
    }
  }

  setConfigSync(config: AIConfig) {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid AI configuration: ${validation.errors.join(', ')}`);
    }

    this.config = config;
  }

  getAvailableModels(): string[] {
    if (!this.provider) {
      return [];
    }
    return this.provider.getAvailableModels();
  }

  async analyzeQueryPlan(query: string, plan: any): Promise<string> {
    if (!this.provider || !this.config) {
      throw new Error("AI service not configured. Please set your API key.");
    }

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

    const response = await this.provider.complete({ systemPrompt, userPrompt }, this.config);
    return response.content;
  }

  async explainQuery(query: string, schema?: any): Promise<string> {
    if (!this.provider || !this.config) {
      throw new Error("AI service not configured. Please set your API key.");
    }

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

    const response = await this.provider.complete({ systemPrompt, userPrompt }, this.config);
    return response.content;
  }

  async createQuery(userRequest: string, schema: any): Promise<string> {
    if (!this.provider || !this.config) {
      throw new Error("AI service not configured. Please set your API key.");
    }

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

    const response = await this.provider.complete({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
    }, this.config);
    return this.cleanSQLResponse(response.content);
  }

  async optimizeQuery(query: string, plan: any, schema: any): Promise<string> {
    if (!this.provider || !this.config) {
      throw new Error("AI service not configured. Please set your API key.");
    }

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

    const response = await this.provider.complete({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
    }, this.config);
    return this.cleanSQLResponse(response.content);
  }

  async analyzeData(prompt: string): Promise<string> {
    if (!this.provider || !this.config) {
      throw new Error("AI service not configured. Please set your API key.");
    }

    const systemPrompt = `You are an expert data analyst. Your role is to analyze query results and provide insights about the data.

When analyzing data, you should:
1. Identify patterns and trends in the data
2. Highlight data quality issues (nulls, duplicates, outliers)
3. Provide business insights and observations
4. Suggest recommendations for further analysis
5. Note any anomalies or interesting findings

Return your response as valid JSON in the exact format requested, without any markdown formatting or additional text.`;

    const response = await this.provider.complete({
      systemPrompt,
      userPrompt: prompt,
      temperature: 0.7,
      maxTokens: 1000,
    }, this.config);

    return response.content;
  }

  private cleanSQLResponse(response: string): string {
    let cleaned = response.trim();

    cleaned = cleaned.replace(/^```(?:sql)?\s*\n?/i, "");
    cleaned = cleaned.replace(/\n?```\s*$/i, "");

    return cleaned.trim();
  }

}
