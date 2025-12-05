import { AgentTool, AgentToolResult } from "../AgentTool";
import { ToolContext } from "../ToolContext";

interface RunSqlInput {
  sql: string;
  limitRows?: number;
}

const MAX_ROWS_IN_SUMMARY = 25;

export class RunSqlTool implements AgentTool {
  readonly name = "sql_runner";
  readonly description =
    "Executes a SQL statement against the active connection. Prefer SELECT statements unless the user explicitly asks for data changes.";
  readonly inputSchema =
    '{"type":"object","properties":{"sql":{"type":"string","description":"SQL statement to execute"},"limitRows":{"type":"number","description":"Optional row limit for previews"}},"required":["sql"]}';

  async run(input: string, context: ToolContext): Promise<AgentToolResult> {
    const args = this.parseInput(input);
    if (!args.sql) {
      throw new Error("sql field is required.");
    }

    const result = await context.executeSql(args.sql);
    const previewRows = Array.isArray(result.rows)
      ? result.rows.slice(0, args.limitRows ?? MAX_ROWS_IN_SUMMARY)
      : [];

    return {
      summary: `Query executed in ${result.duration}ms with ${result.rowCount} rows.`,
      data: {
        sql: args.sql,
        duration: result.duration,
        rowCount: result.rowCount,
        columns: result.columns.map((column) => ({
          name: column.name,
          type: column.dataType,
        })),
        rows: previewRows,
        truncated:
          (args.limitRows ?? MAX_ROWS_IN_SUMMARY) < (result.rowCount || 0),
        error: result.error,
      },
    };
  }

  private parseInput(raw: string): RunSqlInput {
    if (!raw?.trim()) {
      throw new Error("Input must be a JSON string containing the sql field.");
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.sql !== "string" || !parsed.sql.trim()) {
        throw new Error("sql must be a non-empty string.");
      }

      return {
        sql: parsed.sql,
        limitRows:
          typeof parsed.limitRows === "number" && parsed.limitRows > 0
            ? Math.min(parsed.limitRows, MAX_ROWS_IN_SUMMARY)
            : undefined,
      };
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Invalid JSON input for sql_runner tool.");
    }
  }
}
