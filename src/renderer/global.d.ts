import { DatabaseConnectionConfig } from '../main/database/interfaces';

export interface IElectronAPI {
  connectDatabase: (config: DatabaseConnectionConfig) => Promise<any>;
  disconnectDatabase: () => Promise<any>;
  executeQuery: (sql: string) => Promise<any>;
  getSchemaInfo: () => Promise<any>;
  getQueryPlan: (sql: string) => Promise<any>;
  getTableColumns: (schemaName: string, tableName: string) => Promise<any>;
  getViewColumns: (schemaName: string, viewName: string) => Promise<any>;
  getViews: (schemaName: string) => Promise<any>;
  getTableData: (
    schemaName: string,
    tableName: string,
    limit?: number,
    offset?: number
  ) => Promise<any>;
  getTableDetails: (schemaName: string, tableName: string) => Promise<any>;
  getFunctions: (schemaName: string) => Promise<any>;
  getProcedures: (schemaName: string) => Promise<any>;
  getSequences: (schemaName: string) => Promise<any>;
  getTriggers: (schemaName: string) => Promise<any>;
  getIndexes: (schemaName: string) => Promise<any>;
  getDomains: (schemaName: string) => Promise<any>;
  getTableRelationships: (
    schemaName: string,
    tableName: string,
    depth?: number
  ) => Promise<any>;

  getConnections: () => Promise<any>;
  saveConnection: (connection: DatabaseConnectionConfig) => Promise<any>;
  deleteConnection: (id: number) => Promise<any>;

  getQueryHistory: (connectionId?: number) => Promise<any>;

  aiSetConfig: (config: { provider: string; apiKey?: string; model: string; baseUrl?: string }) => Promise<any>;
  aiValidateConfig: (config: { provider: string; apiKey?: string; model: string; baseUrl?: string }) => Promise<{ success: boolean; errors?: string[] }>;
  aiGetConfig: () => Promise<any>;
  aiGetModels: (providerName?: string, config?: { provider: string; apiKey?: string; model: string; baseUrl?: string }) => Promise<any>;
  aiGetProviders: () => Promise<any>;
  aiAnalyzePlan: (query: string, plan: any) => Promise<any>;
  aiExplainQuery: (sql: string) => Promise<any>;
  aiCreateQuery: (prompt: string) => Promise<any>;
  aiOptimizeQuery: (sql: string) => Promise<any>;
  aiAnalyzeData: (prompt: string) => Promise<any>;

  storage: {
    get: (key: string) => Promise<{ success: boolean; value: string | null; error?: string }>;
    set: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  };

  openQueryFile: () => Promise<{ success: boolean; content?: string; fileName?: string; filePath?: string; canceled?: boolean; error?: string }>;
  saveQueryFile: (content: string, currentFilePath?: string) => Promise<{ success: boolean; filePath?: string; fileName?: string; canceled?: boolean; error?: string }>;
  saveQueryFileAs: (content: string) => Promise<{ success: boolean; filePath?: string; fileName?: string; canceled?: boolean; error?: string }>;
  importConnections: () => Promise<{ success: boolean; connections?: any[]; canceled?: boolean; error?: string }>;
  exportConnections: () => Promise<{ success: boolean; filePath?: string; count?: number; canceled?: boolean; error?: string }>;

  update: {
    check: () => Promise<{ success: boolean; updateInfo?: any; currentVersion?: string; error?: string }>;
    getStatus: () => Promise<{ success: boolean; currentVersion?: string; isPackaged?: boolean; error?: string }>;
    install: () => Promise<{ success: boolean; error?: string }>;
  };

  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeListener: (
      channel: string,
      listener: (...args: any[]) => void
    ) => void;
    removeAllListeners: (channel: string) => void;
    send: (channel: string, ...args: any[]) => void;
  };
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
