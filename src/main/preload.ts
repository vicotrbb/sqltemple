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
  getViewColumns: (schemaName: string, viewName: string) =>
    ipcRenderer.invoke("get-view-columns", schemaName, viewName),
  getViews: (schemaName: string) => ipcRenderer.invoke("get-views", schemaName),
  getFunctions: (schemaName: string) =>
    ipcRenderer.invoke("get-functions", schemaName),
  getProcedures: (schemaName: string) =>
    ipcRenderer.invoke("get-procedures", schemaName),
  getSequences: (schemaName: string) =>
    ipcRenderer.invoke("get-sequences", schemaName),
  getTriggers: (schemaName: string) =>
    ipcRenderer.invoke("get-triggers", schemaName),
  getIndexes: (schemaName: string) =>
    ipcRenderer.invoke("get-indexes", schemaName),
  getDomains: (schemaName: string) =>
    ipcRenderer.invoke("get-domains", schemaName),
  getQueryPlan: (sql: string) => ipcRenderer.invoke("get-query-plan", sql),
  getTableRelationships: (
    schemaName: string,
    tableName: string,
    depth?: number
  ) =>
    ipcRenderer.invoke("get-table-relationships", schemaName, tableName, depth),

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

  // Menu communication - simplified approach
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => {
      const validChannels = [
        "menu:new-tab",
        "menu:open-query",
        "menu:save-query",
        "menu:save-query-as",
        "menu:show-preferences",
        "menu:import-connections",
        "menu:export-connections",
        "menu:find",
        "menu:replace",
        "menu:format-query",
        "menu:toggle-connections",
        "menu:toggle-schema",
        "menu:toggle-results",
        "menu:toggle-history",
        "menu:connect-database",
        "menu:disconnect-database",
        "menu:refresh-schema",
        "menu:execute-query",
        "menu:execute-selected",
        "menu:explain-query",
        "menu:show-topology",
        "menu:ai-create-query",
        "menu:ai-explain-query",
        "menu:ai-optimize-query",
        "menu:ai-settings",
        "menu:close-tab",
        "menu:next-tab",
        "menu:previous-tab",
        "menu:show-keyboard-shortcuts",
        "menu:show-about",
      ];

      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, listener);
      }
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, listener);
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
    send: (channel: string, ...args: any[]) => {
      if (channel === "update-menu-state") {
        ipcRenderer.send(channel, ...args);
      }
    },
  },
});
