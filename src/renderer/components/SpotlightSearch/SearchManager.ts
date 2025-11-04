import {
  DatabaseConnectionConfig,
  DatabaseSchema,
} from "../../../main/database/interfaces";

export interface SearchResult {
  id: string;
  type:
    | "connection"
    | "database"
    | "schema"
    | "table"
    | "view"
    | "function"
    | "procedure"
    | "column"
    | "index"
    | "trigger";
  name: string;
  path: string[];
  icon: string;
  score: number;
  metadata?: any;
}

export interface SearchOptions {
  connections: DatabaseConnectionConfig[];
  currentConnection: DatabaseConnectionConfig | null;
  schema: DatabaseSchema | null;
}

export class SearchManager {
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    const connectionResults = this.searchConnections(
      query,
      options.connections
    );
    results.push(...connectionResults);

    if (options.schema) {
      const schemaResults = this.searchDatabaseObjects(query, options.schema);
      results.push(...schemaResults);
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private searchConnections(
    query: string,
    connections: DatabaseConnectionConfig[]
  ): SearchResult[] {
    return connections
      .map((conn) => ({
        id: `connection-${conn.id || conn.name}`,
        type: "connection" as const,
        name: conn.name,
        path: [],
        icon: "database",
        score: this.calculateScore(conn.name, query),
        metadata: { connection: conn },
      }))
      .filter((result) => result.score > 0);
  }

  private searchDatabaseObjects(
    query: string,
    schema: DatabaseSchema
  ): SearchResult[] {
    const results: SearchResult[] = [];

    schema.schemas.forEach((schemaInfo) => {
      const schemaScore = this.calculateScore(schemaInfo.name, query);
      if (schemaScore > 0) {
        results.push({
          id: `schema-${schemaInfo.name}`,
          type: "schema",
          name: schemaInfo.name,
          path: [],
          icon: "folder",
          score: schemaScore,
          metadata: { schema: schemaInfo },
        });
      }

      schemaInfo.tables.forEach((table) => {
        const tableScore = this.calculateScore(table.name, query);
        if (tableScore > 0) {
          results.push({
            id: `table-${schemaInfo.name}-${table.name}`,
            type: "table",
            name: table.name,
            path: [schemaInfo.name],
            icon: "table",
            score: tableScore,
            metadata: { schema: schemaInfo.name, table },
          });
        }

        table.columns.forEach((column) => {
          const columnScore = this.calculateScore(column.name, query);
          if (columnScore > 0) {
            results.push({
              id: `column-${schemaInfo.name}-${table.name}-${column.name}`,
              type: "column",
              name: column.name,
              path: [schemaInfo.name, table.name],
              icon: "column",
              score: columnScore * 0.8,
              metadata: { schema: schemaInfo.name, table: table.name, column },
            });
          }
        });
      });

      schemaInfo.views?.forEach((view) => {
        const viewScore = this.calculateScore(view.name, query);
        if (viewScore > 0) {
          results.push({
            id: `view-${schemaInfo.name}-${view.name}`,
            type: "view",
            name: view.name,
            path: [schemaInfo.name],
            icon: "view",
            score: viewScore,
            metadata: { schema: schemaInfo.name, view },
          });
        }
      });

      schemaInfo.functions?.forEach((func) => {
        const funcScore = this.calculateScore(func.name, query);
        if (funcScore > 0) {
          results.push({
            id: `function-${schemaInfo.name}-${func.name}`,
            type: "function",
            name: func.name,
            path: [schemaInfo.name],
            icon: "function",
            score: funcScore,
            metadata: { schema: schemaInfo.name, function: func },
          });
        }
      });

      schemaInfo.procedures?.forEach((proc) => {
        const procScore = this.calculateScore(proc.name, query);
        if (procScore > 0) {
          results.push({
            id: `procedure-${schemaInfo.name}-${proc.name}`,
            type: "procedure",
            name: proc.name,
            path: [schemaInfo.name],
            icon: "procedure",
            score: procScore,
            metadata: { schema: schemaInfo.name, procedure: proc },
          });
        }
      });
    });

    return results;
  }

  private calculateScore(text: string, query: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText === lowerQuery) return 100;

    if (lowerText.startsWith(lowerQuery)) return 80;

    if (lowerText.includes(lowerQuery)) return 50;

    let queryIndex = 0;
    let score = 0;
    for (
      let i = 0;
      i < lowerText.length && queryIndex < lowerQuery.length;
      i++
    ) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        score += 10 - i * 0.1;
        queryIndex++;
      }
    }

    return queryIndex === lowerQuery.length ? Math.max(score, 1) : 0;
  }
}
