import { AgentTool, AgentToolResult } from "../AgentTool";
import { ToolContext } from "../ToolContext";

interface SuggestionInput {
  sql: string;
  description?: string;
}

export class QuerySuggestionTool implements AgentTool {
  readonly name = "query_suggestion";
  readonly description =
    "Use this tool to present a finished SQL query to the user. Provide JSON with a `sql` string and optional `description`.";
  readonly inputSchema =
    '{"type":"object","properties":{"sql":{"type":"string","description":"Full SQL text to recommend"},"description":{"type":"string","description":"Optional short explanation"}},"required":["sql"]}';

  async run(input: string, _context: ToolContext): Promise<AgentToolResult> {
    const args = this.parseInput(input);

    return {
      summary: "Prepared a SQL query suggestion for the user.",
      data: {
        type: "sql_suggestion",
        sql: args.sql,
        description: args.description ?? null,
      },
      kind: "sql_suggestion",
    };
  }

  private parseInput(raw: string): SuggestionInput {
    if (!raw?.trim()) {
      throw new Error("Input must include the SQL to share with the user.");
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.sql !== "string" || !parsed.sql.trim()) {
        throw new Error("Missing SQL. Provide a non-empty sql string.");
      }

      return {
        sql: parsed.sql.trim(),
        description:
          typeof parsed.description === "string"
            ? parsed.description.trim()
            : undefined,
      };
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Invalid JSON input for query_suggestion tool.");
    }
  }
}
