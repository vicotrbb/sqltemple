import { ipcMain, dialog, BrowserWindow, app } from "electron";
import { autoUpdater } from "electron-updater";
import * as fs from "fs/promises";
import * as path from "path";
import { PostgresClient } from "../database/PostgresClient";
import { StorageManager } from "../storage/StorageManager";
import { AIService } from "../ai/AIService";
import { AgentController } from "../ai/agent/AgentController";
import { MenuBuilder } from "../menu/menuBuilder";
import { DatabaseConnectionConfig } from "../database/interfaces";

let currentClient: PostgresClient | null = null;
let currentConnection: DatabaseConnectionConfig | null = null;
let storageManager: StorageManager;
let aiService: AIService;
let agentController: AgentController;
let menuBuilderInstance: MenuBuilder | null = null;

export function registerMenuBuilder(builder: MenuBuilder | null): void {
  menuBuilderInstance = builder;
}

export async function initializeIpcHandlers(
  storage: StorageManager
): Promise<void> {
  storageManager = storage;
  aiService = new AIService(storageManager);
  agentController = new AgentController({
    aiService,
    storage: storageManager,
    getClient: () => currentClient,
    getConnection: () => currentConnection,
  });

  ipcMain.handle(
    "connect-database",
    async (event, config: DatabaseConnectionConfig) => {
      try {
        console.log("Attempting to connect to database:", config.host);

        if (currentClient) {
          await currentClient.disconnect();
        }

        currentClient = new PostgresClient();
        await currentClient.connect(config);
        currentConnection = config;

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

  ipcMain.handle("execute-query", async (event, sql: string) => {
    if (!currentClient || !currentConnection) {
      return {
        success: false,
        error: "No database connection",
      };
    }

    try {
      const result = await currentClient.executeQuery(sql);

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

  ipcMain.handle(
    "get-table-columns",
    async (event, schemaName: string, tableName: string) => {
      try {
        if (!currentClient || !currentClient.getTableColumns) {
          throw new Error("Database not connected or method not supported");
        }

        const columns = await currentClient.getTableColumns(
          schemaName,
          tableName
        );
        return { success: true, columns };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle(
    "get-table-data",
    async (
      event,
      schemaName: string,
      tableName: string,
      limit?: number,
      offset?: number
    ) => {
      try {
        if (!currentClient || !currentClient.getTableData) {
          throw new Error("Database not connected or method not supported");
        }
        const result = await currentClient.getTableData(
          schemaName,
          tableName,
          limit,
          offset
        );
        return { success: true, page: result };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle(
    "get-table-details",
    async (event, schemaName: string, tableName: string) => {
      try {
        if (!currentClient || !currentClient.getTableDetails) {
          throw new Error("Database not connected or method not supported");
        }
        const details = await currentClient.getTableDetails(
          schemaName,
          tableName
        );
        return { success: true, details };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

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
        return { success: true, connectionId: id, id };
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

  ipcMain.handle("get-query-history", async (event, connectionId?: number) => {
    try {
      const history = await storageManager.getQueryHistory(connectionId);
      return { success: true, history };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle(
    "ai-set-config",
    async (
      event,
      config: {
        provider: string;
        apiKey?: string;
        model: string;
        baseUrl?: string;
      }
    ) => {
      try {
        const validation = aiService.validateConfig(config);
        if (!validation.isValid) {
          return { success: false, error: validation.errors.join("; ") };
        }

        const apiValidation = await aiService.validateApiKey(config);
        if (!apiValidation.isValid) {
          return {
            success: false,
            error: apiValidation.error || "API key validation failed",
          };
        }

        await storageManager.saveAIConfig(config);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle(
    "ai-validate-config",
    async (
      event,
      config: {
        provider: string;
        apiKey?: string;
        model: string;
        baseUrl?: string;
      }
    ) => {
      try {
        const validation = aiService.validateConfig(config);
        if (!validation.isValid) {
          return { success: false, errors: validation.errors };
        }

        const apiValidation = await aiService.validateApiKey(config);
        if (!apiValidation.isValid) {
          return {
            success: false,
            errors: [apiValidation.error || "API key validation failed"],
          };
        }

        return { success: true };
      } catch (error: any) {
        return { success: false, errors: [error.message || String(error)] };
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

  ipcMain.handle(
    "ai-get-models",
    async (
      event,
      providerName?: string,
      config?: {
        provider: string;
        apiKey?: string;
        model: string;
        baseUrl?: string;
      }
    ) => {
      try {
        const models = await aiService.getAvailableModels(providerName, config);
        return { success: true, models };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle("ai-get-providers", async () => {
    try {
      const providers = aiService.getAvailableProviders();
      return { success: true, providers };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

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

      const plan = await currentClient.getQueryPlan(sql);
      const schema = await currentClient.getSchemaMetadata();

      const optimizedQuery = await aiService.optimizeQuery(sql, plan, schema);
      return { success: true, result: optimizedQuery };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("ai-analyze-data", async (event, prompt: string) => {
    try {
      const result = await aiService.analyzeData(prompt);
      return { success: true, result };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle(
    "agent:start",
    async (
      event,
      payload: {
        intent: string;
        sessionId?: string;
      }
    ) => {
      try {
        if (!payload?.intent) {
          throw new Error("Intent is required.");
        }
        const session = await agentController.startOrContinueSession(
          payload.intent,
          event.sender,
          payload.sessionId
        );
        return { success: true, session };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle("agent:cancel", async (event, sessionId: string) => {
    try {
      await agentController.cancel(sessionId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("agent:listSessions", async () => {
    try {
      const sessions = await agentController.listSessions(100);
      return { success: true, sessions };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("agent:getSession", async (event, sessionId: string) => {
    try {
      const session = await agentController.getSessionWithMessages(sessionId);
      return { success: true, ...session };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle(
    "get-view-columns",
    async (event, schemaName: string, viewName: string) => {
      try {
        if (!currentClient || !currentClient.getViewColumns) {
          throw new Error("Database not connected or method not supported");
        }

        const columns = await currentClient.getViewColumns(
          schemaName,
          viewName
        );
        return { success: true, columns };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle("get-views", async (event, schemaName: string) => {
    try {
      if (!currentClient || !currentClient.getViews) {
        throw new Error("Database not connected or method not supported");
      }

      const views = await currentClient.getViews(schemaName);
      return { success: true, views };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("get-functions", async (event, schemaName: string) => {
    try {
      if (!currentClient || !currentClient.getFunctions) {
        throw new Error("Database not connected or method not supported");
      }

      const functions = await currentClient.getFunctions(schemaName);
      return { success: true, functions };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("get-procedures", async (event, schemaName: string) => {
    try {
      if (!currentClient || !currentClient.getProcedures) {
        throw new Error("Database not connected or method not supported");
      }

      const procedures = await currentClient.getProcedures(schemaName);
      return { success: true, procedures };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("get-sequences", async (event, schemaName: string) => {
    try {
      if (!currentClient || !currentClient.getSequences) {
        throw new Error("Database not connected or method not supported");
      }

      const sequences = await currentClient.getSequences(schemaName);
      return { success: true, sequences };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("get-triggers", async (event, schemaName: string) => {
    try {
      if (!currentClient || !currentClient.getTriggers) {
        throw new Error("Database not connected or method not supported");
      }

      const triggers = await currentClient.getTriggers(schemaName);
      return { success: true, triggers };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("get-indexes", async (event, schemaName: string) => {
    try {
      if (!currentClient || !currentClient.getIndexes) {
        throw new Error("Database not connected or method not supported");
      }

      const indexes = await currentClient.getIndexes(schemaName);
      return { success: true, indexes };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("get-domains", async (event, schemaName: string) => {
    try {
      if (!currentClient || !currentClient.getDomains) {
        throw new Error("Database not connected or method not supported");
      }

      const domains = await currentClient.getDomains(schemaName);
      return { success: true, domains };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle(
    "get-table-relationships",
    async (event, schemaName: string, tableName: string, depth: number = 3) => {
      try {
        if (!currentClient || !currentClient.getTableRelationships) {
          throw new Error("Database not connected or method not supported");
        }

        const relationships = await currentClient.getTableRelationships(
          schemaName,
          tableName,
          depth
        );
        return { success: true, relationships };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle("storage-get", async (event, key: string) => {
    try {
      const value = await storageManager.getSetting(key);
      return { success: true, value };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("storage-set", async (event, key: string, value: string) => {
    try {
      await storageManager.setSetting(key, value);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.on("update-menu-state", (event, state) => {
    menuBuilderInstance?.updateState(state);
  });

  ipcMain.handle("file:open-query", async (event) => {
    try {
      const mainWindow = BrowserWindow.fromWebContents(event.sender);
      if (!mainWindow) {
        throw new Error("No window found");
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        title: "Open SQL Query File",
        filters: [
          { name: "SQL Files", extensions: ["sql", "SQL"] },
          { name: "Text Files", extensions: ["txt"] },
          { name: "All Files", extensions: ["*"] },
        ],
        properties: ["openFile"],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const filePath = result.filePaths[0];
      const content = await fs.readFile(filePath, "utf-8");
      const fileName = path.basename(filePath, path.extname(filePath));

      return {
        success: true,
        content,
        fileName,
        filePath,
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle(
    "file:save-query",
    async (event, content: string, currentFilePath?: string) => {
      try {
        const mainWindow = BrowserWindow.fromWebContents(event.sender);
        if (!mainWindow) {
          throw new Error("No window found");
        }

        let filePath = currentFilePath;

        if (!filePath) {
          const result = await dialog.showSaveDialog(mainWindow, {
            title: "Save SQL Query",
            defaultPath: "query.sql",
            filters: [
              { name: "SQL Files", extensions: ["sql"] },
              { name: "Text Files", extensions: ["txt"] },
              { name: "All Files", extensions: ["*"] },
            ],
          });

          if (result.canceled || !result.filePath) {
            return { success: false, canceled: true };
          }

          filePath = result.filePath;
        }

        await fs.writeFile(filePath, content, "utf-8");
        const fileName = path.basename(filePath, path.extname(filePath));

        return {
          success: true,
          filePath,
          fileName,
        };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  ipcMain.handle("file:save-query-as", async (event, content: string) => {
    try {
      const mainWindow = BrowserWindow.fromWebContents(event.sender);
      if (!mainWindow) {
        throw new Error("No window found");
      }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Save SQL Query As",
        defaultPath: "query.sql",
        filters: [
          { name: "SQL Files", extensions: ["sql"] },
          { name: "Text Files", extensions: ["txt"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      await fs.writeFile(result.filePath, content, "utf-8");
      const fileName = path.basename(
        result.filePath,
        path.extname(result.filePath)
      );

      return {
        success: true,
        filePath: result.filePath,
        fileName,
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("file:import-connections", async (event) => {
    try {
      const mainWindow = BrowserWindow.fromWebContents(event.sender);
      if (!mainWindow) {
        throw new Error("No window found");
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        title: "Import Connections",
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
        properties: ["openFile"],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const filePath = result.filePaths[0];
      const content = await fs.readFile(filePath, "utf-8");
      const connections = JSON.parse(content);

      if (!Array.isArray(connections)) {
        throw new Error("Invalid connections format: expected an array");
      }

      return {
        success: true,
        connections,
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle("file:export-connections", async (event) => {
    try {
      const mainWindow = BrowserWindow.fromWebContents(event.sender);
      if (!mainWindow) {
        throw new Error("No window found");
      }

      const connections = await storageManager.getConnections();

      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Export Connections",
        defaultPath: "sqltemple-connections.json",
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      const exportableConnections = connections.map((conn) => ({
        ...conn,
        password: undefined,
        id: undefined,
      }));

      await fs.writeFile(
        result.filePath,
        JSON.stringify(exportableConnections, null, 2),
        "utf-8"
      );

      return {
        success: true,
        filePath: result.filePath,
        count: connections.length,
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle(
    "database:getForeignKeys",
    async (_event, tableName: string, schemaName: string) => {
      try {
        if (!currentClient) {
          throw new Error("Database not connected");
        }

        const escapeLiteral = (value: string): string =>
          value.replace(/'/g, "''");

        const query = `
        SELECT 
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE 
          tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = '${escapeLiteral(tableName)}'
          AND tc.table_schema = '${escapeLiteral(schemaName)}';
      `;

        const result = await currentClient.executeQuery(query);
        const foreignKeys = result.rows.map((row) => ({
          columnName: row.column_name,
          referencedSchema: row.foreign_table_schema,
          referencedTable: row.foreign_table_name,
          referencedColumn: row.foreign_column_name,
        }));

        return { success: true, foreignKeys };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );

  // Update handlers
  ipcMain.handle("update:check", async () => {
    try {
      if (!app.isPackaged) {
        return {
          success: false,
          error: "Update checking is only available in packaged applications",
        };
      }

      const result = await autoUpdater.checkForUpdates();
      return {
        success: true,
        updateInfo: result?.updateInfo || null,
        currentVersion: app.getVersion(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  });

  ipcMain.handle("update:getStatus", async () => {
    try {
      return {
        success: true,
        currentVersion: app.getVersion(),
        isPackaged: app.isPackaged,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  });

  ipcMain.handle("update:install", async () => {
    try {
      if (!app.isPackaged) {
        return {
          success: false,
          error:
            "Update installation is only available in packaged applications",
        };
      }

      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  });

  ipcMain.handle(
    "database:getRelatedData",
    async (
      event,
      foreignKeyValue: any,
      referencedSchema: string,
      referencedTable: string,
      referencedColumn: string
    ) => {
      try {
        if (!currentClient) {
          throw new Error("Database not connected");
        }

        const query = `SELECT * FROM ${referencedSchema}.${referencedTable} WHERE ${referencedColumn} = $1 LIMIT 1`;
        const result = await currentClient.executeQuery(query);

        return { success: true, data: result.rows[0] || null };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    }
  );
}
