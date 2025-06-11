import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // Database operations
  connectDatabase: (config: any) =>
    ipcRenderer.invoke("connect-database", config),
  disconnectDatabase: () => ipcRenderer.invoke("disconnect-database"),
  executeQuery: (sql: string) => ipcRenderer.invoke("execute-query", sql),
  getSchemaInfo: () => ipcRenderer.invoke("get-schema-info"),
  getTableColumns: (schemaName: string, tableName: string) =>
    ipcRenderer.invoke("get-table-columns", schemaName, tableName),
  getQueryPlan: (sql: string) => ipcRenderer.invoke("get-query-plan", sql),

  // Connection profiles
  getConnections: () => ipcRenderer.invoke("get-connections"),
  saveConnection: (connection: any) =>
    ipcRenderer.invoke("save-connection", connection),
  deleteConnection: (id: number) => ipcRenderer.invoke("delete-connection", id),

  // Query history
  getQueryHistory: (connectionId?: number) =>
    ipcRenderer.invoke("get-query-history", connectionId),

  // AI operations
  aiSetConfig: (config: { apiKey: string; model: string }) =>
    ipcRenderer.invoke("ai-set-config", config),
  aiGetConfig: () => ipcRenderer.invoke("ai-get-config"),
  aiGetModels: () => ipcRenderer.invoke("ai-get-models"),
  aiAnalyzePlan: (query: string, plan: any) =>
    ipcRenderer.invoke("ai-analyze-plan", query, plan),
  aiExplainQuery: (sql: string) => ipcRenderer.invoke("ai-explain-query", sql),
  aiCreateQuery: (prompt: string) =>
    ipcRenderer.invoke("ai-create-query", prompt),
  aiOptimizeQuery: (sql: string) =>
    ipcRenderer.invoke("ai-optimize-query", sql),
});
