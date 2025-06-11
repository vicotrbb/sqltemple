import OpenAI from "openai";

export interface AIConfig {
  apiKey: string;
  model: string;
}

export interface AIPrompt {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private openai: any | null = null;
  private config: AIConfig | null = null;

  constructor() {
    // Initialize with empty config
  }

  setConfig(config: AIConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
    });
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

  async analyzeQueryPlan(query: string, plan: any): Promise<string> {
    if (!this.openai || !this.config) {
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

    return this.callOpenAI({ systemPrompt, userPrompt });
  }

  async explainQuery(query: string, schema?: any): Promise<string> {
    if (!this.openai || !this.config) {
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

    return this.callOpenAI({ systemPrompt, userPrompt });
  }

  async createQuery(userRequest: string, schema: any): Promise<string> {
    if (!this.openai || !this.config) {
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

    const result = await this.callOpenAI({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
    });
    return this.cleanSQLResponse(result);
  }

  async optimizeQuery(query: string, plan: any, schema: any): Promise<string> {
    if (!this.openai || !this.config) {
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

    const result = await this.callOpenAI({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
    });
    return this.cleanSQLResponse(result);
  }

  private cleanSQLResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.trim();

    // Remove ```sql or ``` markers
    cleaned = cleaned.replace(/^```(?:sql)?\s*\n?/i, "");
    cleaned = cleaned.replace(/\n?```\s*$/i, "");

    // Remove any leading/trailing whitespace
    return cleaned.trim();
  }

  private async callOpenAI(prompt: AIPrompt): Promise<string> {
    if (!this.openai || !this.config) {
      throw new Error("AI service not configured");
    }

    try {
      // o1 models have special requirements
      const isO1Model = this.config.model.startsWith("o1-");

      const params: any = {
        model: this.config.model,
        messages: [
          { role: "system", content: prompt.systemPrompt },
          { role: "user", content: prompt.userPrompt },
        ],
      };

      // o1 models don't support temperature, top_p, etc.
      if (!isO1Model) {
        params.temperature = prompt.temperature ?? 0.7;
        params.max_tokens = prompt.maxTokens ?? 2000;
      } else {
        // o1 models use max_completion_tokens instead
        params.max_completion_tokens = prompt.maxTokens ?? 2000;
      }

      const response = await this.openai.chat.completions.create(params);

      return response.choices[0]?.message?.content || "No response from AI";
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error("Invalid API key. Please check your OpenAI API key.");
      } else if (error.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error.status === 404) {
        throw new Error(
          `Model "${this.config.model}" not found. Please select a different model.`
        );
      } else {
        throw new Error(`AI request failed: ${error.message}`);
      }
    }
  }
}
