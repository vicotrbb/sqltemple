import { AgentTool, AgentToolResult } from "../AgentTool";
import { ToolContext } from "../ToolContext";

interface SearchInput {
  query: string;
  limit?: number;
}

const DEFAULT_LIMIT = 25;

export class DatabaseSearchTool implements AgentTool {
  readonly name = "database_search";
  readonly description =
    "Fuzzy search for schemas, tables, views, and columns. Use when you need to discover object names.";
  readonly inputSchema =
    '{"type":"object","properties":{"query":{"type":"string","description":"Search text"},"limit":{"type":"integer","description":"Maximum number of results"}},"required":["query"]}';

  async run(input: string, context: ToolContext): Promise<AgentToolResult> {
    if (!context.connection) {
      throw new Error("Connect to a database before searching metadata.");
    }

    const args = this.parseInput(input);
    const limit = Math.min(Math.max(args.limit ?? DEFAULT_LIMIT, 5), 100);
    const pattern = `%${this.escapeLike(args.query)}%`;

    const searchResult = await context.executeSql(
      `
      WITH objects AS (
        SELECT
          'table' AS type,
          table_schema,
          table_name AS name,
          COUNT(c.column_name) AS column_count,
          COALESCE(
            JSON_AGG(c.column_name ORDER BY c.ordinal_position)
              FILTER (WHERE c.ordinal_position <= 5),
            '[]'
          ) AS sample_columns,
          NULL::text AS parent
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c
          ON c.table_schema = t.table_schema
         AND c.table_name = t.table_name
        WHERE t.table_type = 'BASE TABLE'
          AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
          AND (t.table_name ILIKE '${pattern}' OR t.table_schema ILIKE '${pattern}')
        GROUP BY table_schema, table_name
        UNION ALL
        SELECT
          'view' AS type,
          table_schema,
          table_name,
          0 AS column_count,
          '[]' AS sample_columns,
          NULL::text AS parent
        FROM information_schema.views
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          AND (table_name ILIKE '${pattern}' OR table_schema ILIKE '${pattern}')
        UNION ALL
        SELECT
          'column' AS type,
          table_schema,
          column_name,
          0 AS column_count,
          '[]' AS sample_columns,
          table_name AS parent
        FROM information_schema.columns
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          AND (column_name ILIKE '${pattern}'
            OR table_name ILIKE '${pattern}'
            OR table_schema ILIKE '${pattern}')
      )
      SELECT *,
        COUNT(*) OVER () AS total_matches
      FROM objects
      ORDER BY
        CASE type WHEN 'table' THEN 1 WHEN 'view' THEN 2 ELSE 3 END,
        column_count DESC,
        name
      LIMIT ${limit};
    `
    );

    const totalMatches = Number(searchResult.rows[0]?.total_matches || 0);
    const results = searchResult.rows.map((row) => ({
      type: row.type as string,
      schema: row.table_schema as string,
      name: row.name as string,
      parent: row.parent || null,
      columnCount: Number(row.column_count || 0),
      sampleColumns: this.parseJsonArray(row.sample_columns),
    }));

    return {
      summary: `Found ${totalMatches} objects matching "${args.query}". Showing top ${results.length}.`,
      data: {
        query: args.query,
        totalMatches,
        results,
      },
    };
  }

  private parseInput(raw: string): SearchInput {
    if (!raw?.trim()) {
      throw new Error("Provide a JSON payload with a search query.");
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed.query !== "string" || !parsed.query.trim()) {
      throw new Error("The query field must be a non-empty string.");
    }

    return {
      query: parsed.query.trim(),
      limit:
        typeof parsed.limit === "number" && Number.isFinite(parsed.limit)
          ? parsed.limit
          : undefined,
    };
  }

  private parseJsonArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private escapeLike(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
      .replace(/'/g, "''");
  }
}
