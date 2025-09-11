import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
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

  getConnections: () => ipcRenderer.invoke("get-connections"),
  saveConnection: (connection: any) =>
    ipcRenderer.invoke("save-connection", connection),
  deleteConnection: (id: number) => ipcRenderer.invoke("delete-connection", id),

  getQueryHistory: (connectionId?: number) =>
    ipcRenderer.invoke("get-query-history", connectionId),

  aiSetConfig: (config: { provider: string; apiKey?: string; model: string; baseUrl?: string }) =>
    ipcRenderer.invoke("ai-set-config", config),
  aiValidateConfig: (config: { provider: string; apiKey?: string; model: string; baseUrl?: string }) =>
    ipcRenderer.invoke("ai-validate-config", config),
  aiGetConfig: () => ipcRenderer.invoke("ai-get-config"),
  aiGetModels: (providerName?: string, config?: { provider: string; apiKey?: string; model: string; baseUrl?: string }) => 
    ipcRenderer.invoke("ai-get-models", providerName, config),
  aiGetProviders: () => ipcRenderer.invoke("ai-get-providers"),
  aiAnalyzePlan: (query: string, plan: any) =>
    ipcRenderer.invoke("ai-analyze-plan", query, plan),
  aiExplainQuery: (sql: string) => ipcRenderer.invoke("ai-explain-query", sql),
  aiCreateQuery: (prompt: string) =>
    ipcRenderer.invoke("ai-create-query", prompt),
  aiOptimizeQuery: (sql: string) =>
    ipcRenderer.invoke("ai-optimize-query", sql),
  aiAnalyzeData: (prompt: string) =>
    ipcRenderer.invoke("ai-analyze-data", prompt),

  localModel: {
    list: () => ipcRenderer.invoke("localModel:list"),
    status: (modelName: string) => ipcRenderer.invoke("localModel:status", modelName),
    download: (modelName: string) => ipcRenderer.invoke("localModel:download", modelName),
    cancelDownload: (modelName: string) => ipcRenderer.invoke("localModel:cancelDownload", modelName),
    load: (modelName: string) => ipcRenderer.invoke("localModel:load", modelName),
    unload: () => ipcRenderer.invoke("localModel:unload"),
    delete: (modelName: string) => ipcRenderer.invoke("localModel:delete", modelName),
    getSystemResources: () => ipcRenderer.invoke("localModel:getSystemResources"),
    getRecommendation: (modelName: string) => ipcRenderer.invoke("localModel:getRecommendation", modelName),
    getCurrentModel: () => ipcRenderer.invoke("localModel:getCurrentModel"),
  },

  storage: {
    get: (key: string) => ipcRenderer.invoke("storage-get", key),
    set: (key: string, value: string) => ipcRenderer.invoke("storage-set", key, value),
  },

  openQueryFile: () => ipcRenderer.invoke("file:open-query"),
  saveQueryFile: (content: string, currentFilePath?: string) => 
    ipcRenderer.invoke("file:save-query", content, currentFilePath),
  saveQueryFileAs: (content: string) => 
    ipcRenderer.invoke("file:save-query-as", content),
  importConnections: () => ipcRenderer.invoke("file:import-connections"),
  exportConnections: () => ipcRenderer.invoke("file:export-connections"),

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
