import { DatabaseConnectionConfig, DatabaseSchema, QueryResult } from "../../main/database/interfaces";
import { errorService, ErrorLevel, ErrorCategory } from "./ErrorService";

export interface DatabaseServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class DatabaseService {
  private currentConnection: DatabaseConnectionConfig | null = null;
  private isConnected: boolean = false;

  async connect(config: DatabaseConnectionConfig): Promise<DatabaseServiceResult<void>> {
    try {
      const result = await window.api.connectDatabase(config);
      if (result.success) {
        this.currentConnection = config;
        this.isConnected = true;
        return { success: true };
      } else {
        const errorMessage = result.error || "Unknown connection error";
        let userMessage = "Connection failed";

        if (
          errorMessage.includes("ENOTFOUND") ||
          errorMessage.includes("ECONNREFUSED")
        ) {
          userMessage =
            "Cannot reach the database server. Please check the host and port.";
        } else if (errorMessage.includes("authentication failed")) {
          userMessage =
            "Authentication failed. Please check your username and password.";
        } else if (
          errorMessage.includes("database") &&
          errorMessage.includes("does not exist")
        ) {
          userMessage = "The specified database does not exist.";
        } else if (errorMessage.includes("timeout")) {
          userMessage =
            "Connection timed out. The server may be slow or unreachable.";
        } else {
          userMessage = `Connection failed: ${errorMessage}`;
        }

        return { success: false, error: userMessage };
      }
    } catch (error) {
      const errorId = errorService.logDatabaseError(
        "Database connection failed", 
        error instanceof Error ? error.message : String(error),
        { config: { ...config, password: "[REDACTED]" } }
      );
      return { success: false, error: "An unexpected error occurred while connecting to the database." };
    }
  }

  async disconnect(): Promise<DatabaseServiceResult<void>> {
    try {
      const result = await window.api.disconnectDatabase();
      if (result.success) {
        this.isConnected = false;
        this.currentConnection = null;
        return { success: true };
      } else {
        return { success: false, error: result.error || "Failed to disconnect" };
      }
    } catch (error) {
      const errorId = errorService.logDatabaseError(
        "Database disconnection failed", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "An unexpected error occurred while disconnecting." };
    }
  }

  async executeQuery(query: string): Promise<DatabaseServiceResult<QueryResult>> {
    if (!this.isConnected || !query.trim()) {
      return { success: false, error: "Not connected or empty query" };
    }

    try {
      const result = await window.api.executeQuery(query);

      if (result.success && result.result) {
        return { success: true, data: result.result };
      } else {
        const errorMessage = result.error || "Unknown error";
        let userFriendlyError = errorMessage;

        if (errorMessage.includes("syntax error")) {
          userFriendlyError =
            "SQL syntax error. Please check your query syntax.";
        } else if (errorMessage.includes("permission denied")) {
          userFriendlyError =
            "Permission denied. You don't have rights to perform this operation.";
        } else if (
          errorMessage.includes("relation") &&
          errorMessage.includes("does not exist")
        ) {
          userFriendlyError =
            "Table or column not found. Please check the table and column names.";
        } else if (errorMessage.includes("connection")) {
          userFriendlyError =
            "Database connection lost. Please reconnect and try again.";
        } else if (errorMessage.includes("timeout")) {
          userFriendlyError =
            "Query execution timed out. The query may be too complex.";
        }

        return {
          success: false,
          data: {
            columns: [],
            rows: [],
            rowCount: 0,
            duration: 0,
            error: userFriendlyError,
          },
        };
      }
    } catch (error) {
      const errorId = errorService.logDatabaseError(
        "Query execution failed", 
        error instanceof Error ? error.message : String(error),
        { query: query.substring(0, 100) + (query.length > 100 ? '...' : '') }
      );
      return {
        success: false,
        data: {
          columns: [],
          rows: [],
          rowCount: 0,
          duration: 0,
          error: "An unexpected error occurred while executing the query",
        },
      };
    }
  }

  async loadSchema(): Promise<DatabaseServiceResult<DatabaseSchema>> {
    try {
      const result = await window.api.getSchemaInfo();
      if (result.success && result.schema) {
        return { success: true, data: result.schema };
      } else {
        return { success: false, error: result.error || "Failed to load schema" };
      }
    } catch (error) {
      const errorId = errorService.logDatabaseError(
        "Schema loading failed", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "An unexpected error occurred while loading schema." };
    }
  }

  async getQueryPlan(query: string): Promise<DatabaseServiceResult<any>> {
    try {
      const result = await window.api.getQueryPlan(query);
      if (result.success && result.plan) {
        return { success: true, data: result.plan };
      } else {
        return { success: false, error: result.error || "Failed to get query plan" };
      }
    } catch (error) {
      const errorId = errorService.logDatabaseError(
        "Query plan generation failed", 
        error instanceof Error ? error.message : String(error),
        { query: query.substring(0, 100) + (query.length > 100 ? '...' : '') }
      );
      return { success: false, error: "An unexpected error occurred while getting query plan." };
    }
  }

  async loadConnections(): Promise<DatabaseServiceResult<DatabaseConnectionConfig[]>> {
    try {
      const result = await window.api.getConnections();
      if (result.success && result.connections) {
        return { success: true, data: result.connections };
      } else {
        return { success: false, error: result.error || "Failed to load connections" };
      }
    } catch (error) {
      const errorId = errorService.logDatabaseError(
        "Failed to load saved connections", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "An unexpected error occurred while loading connections." };
    }
  }

  getCurrentConnection(): DatabaseConnectionConfig | null {
    return this.currentConnection;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const databaseService = new DatabaseService();