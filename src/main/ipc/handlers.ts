import { ipcMain } from "electron";
import { PostgresClient } from "../database/PostgresClient";
import { StorageManager } from "../storage/StorageManager";
import { AIService } from "../ai/AIService";
import { DatabaseConnectionConfig, QueryResult } from "../database/interfaces";

let currentClient: PostgresClient | null = null;
let currentConnection: DatabaseConnectionConfig | null = null;
let storageManager: StorageManager;
let aiService: AIService;

export async function initializeIpcHandlers(
  storage: StorageManager
): Promise<void> {
  storageManager = storage;
  aiService = new AIService();

  // Load saved AI config
  const savedConfig = await storageManager.getAIConfig();
  if (savedConfig) {
    aiService.setConfig(savedConfig);
  }

  // Database connection handlers
  ipcMain.handle(
    "connect-database",
    async (event, config: DatabaseConnectionConfig) => {
      try {
        console.log("Attempting to connect to database:", config.host);

        // Disconnect current connection if any
        if (currentClient) {
          await currentClient.disconnect();
        }

        currentClient = new PostgresClient();
        await currentClient.connect(config);
        currentConnection = config;

        // Save or update connection
        if (!config.id) {
          config.id = await storageManager.saveConnection(config);
        }

        console.log("Successfully connected to database");
        return { success: true, connectionId: config.id };
      } catch (error: any) {
        console.error("Database connection error:", error);
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle("disconnect-database", async () => {
    try {
      if (currentClient) {
        await currentClient.disconnect();
        currentClient = null;
        currentConnection = null;
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Query execution
  ipcMain.handle("execute-query", async (event, sql: string) => {
    if (!currentClient || !currentConnection) {
      return {
        success: false,
        error: "No database connection",
      };
    }

    try {
      const result = await currentClient.executeQuery(sql);

      // Log to history
      await storageManager.addQueryHistory({
        connectionId: currentConnection.id!,
        query: sql,
        runAt: new Date().toISOString(),
        duration: result.duration,
        rowCount: result.rowCount,
        success: !result.error,
      });

      return { success: true, result };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Schema information
  ipcMain.handle("get-schema-info", async () => {
    if (!currentClient) {
      return { success: false, error: "No database connection" };
    }

    try {
      const schema = await currentClient.getSchemaMetadata();
      return { success: true, schema };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Get table columns (lazy loading)
  ipcMain.handle(
    "get-table-columns",
    async (event, schemaName: string, tableName: string) => {
      if (!currentClient) {
        return { success: false, error: "No database connection" };
      }

      try {
        if (currentClient.getTableColumns) {
          const columns = await currentClient.getTableColumns(
            schemaName,
            tableName
          );
          return { success: true, columns };
        } else {
          return { success: false, error: "Method not supported" };
        }
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  // Query plan
  ipcMain.handle("get-query-plan", async (event, sql: string) => {
    if (!currentClient) {
      return { success: false, error: "No database connection" };
    }

    try {
      const plan = await currentClient.getQueryPlan(sql);
      return { success: true, plan };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Connection profiles
  ipcMain.handle("get-connections", async () => {
    try {
      const connections = await storageManager.getConnections();
      return { success: true, connections };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle(
    "save-connection",
    async (event, connection: DatabaseConnectionConfig) => {
      try {
        const id = await storageManager.saveConnection(connection);
        return { success: true, id };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle("delete-connection", async (event, id: number) => {
    try {
      await storageManager.deleteConnection(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Query history
  ipcMain.handle("get-query-history", async (event, connectionId?: number) => {
    try {
      const history = await storageManager.getQueryHistory(connectionId);
      return { success: true, history };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // AI configuration
  ipcMain.handle(
    "ai-set-config",
    async (event, config: { apiKey: string; model: string }) => {
      try {
        aiService.setConfig(config);
        // Store config securely
        await storageManager.saveAIConfig(config);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle("ai-get-config", async () => {
    try {
      const config = await storageManager.getAIConfig();
      return { success: true, config };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("ai-get-models", async () => {
    try {
      const models = aiService.getAvailableModels();
      return { success: true, models };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // AI operations
  ipcMain.handle("ai-analyze-plan", async (event, query: string, plan: any) => {
    try {
      const analysis = await aiService.analyzeQueryPlan(query, plan);
      return { success: true, result: analysis };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("ai-explain-query", async (event, sql: string) => {
    try {
      const schema = currentClient
        ? await currentClient.getSchemaMetadata()
        : undefined;
      const explanation = await aiService.explainQuery(sql, schema);
      return { success: true, result: explanation };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("ai-create-query", async (event, prompt: string) => {
    try {
      if (!currentClient) {
        throw new Error("No database connection");
      }
      const schema = await currentClient.getSchemaMetadata();
      const query = await aiService.createQuery(prompt, schema);
      return { success: true, result: query };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("ai-optimize-query", async (event, sql: string) => {
    try {
      if (!currentClient) {
        throw new Error("No database connection");
      }

      // Get the query plan
      const plan = await currentClient.getQueryPlan(sql);
      const schema = await currentClient.getSchemaMetadata();

      const optimizedQuery = await aiService.optimizeQuery(sql, plan, schema);
      return { success: true, result: optimizedQuery };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });
}
