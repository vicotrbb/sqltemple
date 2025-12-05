import { AgentTool, AgentToolResult } from "../AgentTool";
import { ToolContext } from "../ToolContext";

interface SchemaToolInput {
  schema?: string;
  table?: string;
}

const DEFAULT_LIST_LIMIT = 12;
const COLUMN_PREVIEW_LIMIT = 6;

export class SchemaExplorerTool implements AgentTool {
  readonly name = "schema_inspector";
  readonly description =
    "Use this tool to understand the connected database schema, list tables, or inspect a table's columns.";
  readonly inputSchema =
    '{"type":"object","properties":{"schema":{"type":"string","description":"Schema name"},"table":{"type":"string","description":"Optional table name to inspect"}}}';

  async run(input: string, context: ToolContext): Promise<AgentToolResult> {
    if (!context.connection) {
      throw new Error("Connect to a database before inspecting schemas.");
    }
    const args = this.parseInput(input);
    const schemaName = args.schema?.trim() || "public";

    if (args.table) {
      return this.describeTable(schemaName, args.table, context);
    }

    return this.describeSchema(schemaName, context);
  }

  private async describeSchema(
    schemaName: string,
    context: ToolContext
  ): Promise<AgentToolResult> {
    const totalTablesResult = await context.executeSql(
      `
        SELECT COUNT(*) AS count
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
          AND table_schema = '${this.escapeLiteral(schemaName)}';
      `
    );
    const totalTables = Number(totalTablesResult.rows[0]?.count || 0);

    const previewResult = await context.executeSql(
      `
        SELECT
          t.table_name,
          COUNT(c.column_name) AS column_count,
          COALESCE(
            JSON_AGG(c.column_name ORDER BY c.ordinal_position)
              FILTER (WHERE c.ordinal_position <= ${COLUMN_PREVIEW_LIMIT}),
            '[]'
          ) AS sample_columns
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c
          ON c.table_schema = t.table_schema
         AND c.table_name = t.table_name
        WHERE t.table_type = 'BASE TABLE'
          AND t.table_schema = '${this.escapeLiteral(schemaName)}'
        GROUP BY t.table_name
        ORDER BY column_count DESC, t.table_name
        LIMIT ${DEFAULT_LIST_LIMIT};
      `
    );

    const tablesPreview = previewResult.rows.map((row) => ({
      name: row.table_name as string,
      columnCount: Number(row.column_count || 0),
      columns: this.parseJsonArray(row.sample_columns),
    }));

    return {
      summary: `Schema ${schemaName} exposes ${totalTables} tables.`,
      data: {
        schema: schemaName,
        totalTables,
        tablesPreview,
      },
    };
  }

  private async describeTable(
    schemaName: string,
    tableName: string,
    context: ToolContext
  ): Promise<AgentToolResult> {
    const columnResult = await context.executeSql(
      `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = '${this.escapeLiteral(schemaName)}'
          AND table_name = '${this.escapeLiteral(tableName)}'
        ORDER BY ordinal_position;
      `
    );

    const columns = columnResult.rows.map((row) => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === "YES",
      default: row.column_default || null,
    }));

    if (columns.length === 0) {
      throw new Error(
        `Table "${tableName}" was not found in schema "${schemaName}" or has no columns.`
      );
    }

    return {
      summary: `Schema ${schemaName}.${tableName} has ${columns.length} columns.`,
      data: {
        schema: schemaName,
        table: tableName,
        columnCount: columns.length,
        columns,
      },
    };
  }

  private parseInput(raw: string): SchemaToolInput {
    if (!raw?.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        schema: typeof parsed.schema === "string" ? parsed.schema : undefined,
        table: typeof parsed.table === "string" ? parsed.table : undefined,
      };
    } catch {
      return {};
    }
  }

  private parseJsonArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.slice(0, COLUMN_PREVIEW_LIMIT);
    }
    if (typeof value === "string" && value.trim() !== "") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.slice(0, COLUMN_PREVIEW_LIMIT)
          : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private escapeLiteral(value: string): string {
    return value.replace(/'/g, "''");
  }
}
