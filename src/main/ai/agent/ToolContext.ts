import {
  DatabaseConnectionConfig,
  DatabaseSchema,
  QueryResult,
} from "../../database/interfaces";

export interface ToolContext {
  connection: DatabaseConnectionConfig | null;
  getSchema: () => Promise<DatabaseSchema | null>;
  executeSql: (sql: string) => Promise<QueryResult>;
}
