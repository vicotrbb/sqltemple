import { DatabaseConnectionConfig } from '../main/database/interfaces';

export interface IElectronAPI {
  // Database operations
  connectDatabase: (config: DatabaseConnectionConfig) => Promise<any>;
  disconnectDatabase: () => Promise<any>;
  executeQuery: (sql: string) => Promise<any>;
  getSchemaInfo: () => Promise<any>;
  getQueryPlan: (sql: string) => Promise<any>;
  getTableColumns: (schemaName: string, tableName: string) => Promise<any>;
  getViewColumns: (schemaName: string, viewName: string) => Promise<any>;
  getViews: (schemaName: string) => Promise<any>;
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

  // Connection profiles
  getConnections: () => Promise<any>;
  saveConnection: (connection: DatabaseConnectionConfig) => Promise<any>;
  deleteConnection: (id: number) => Promise<any>;

  // Query history
  getQueryHistory: (connectionId?: number) => Promise<any>;

  // AI operations
  aiSetConfig: (config: { apiKey: string; model: string }) => Promise<any>;
  aiValidateConfig: (config: { apiKey: string; model: string }) => Promise<{ success: boolean; errors?: string[] }>;
  aiGetConfig: () => Promise<any>;
  aiGetModels: () => Promise<any>;
  aiAnalyzePlan: (query: string, plan: any) => Promise<any>;
  aiExplainQuery: (sql: string) => Promise<any>;
  aiCreateQuery: (prompt: string) => Promise<any>;
  aiOptimizeQuery: (sql: string) => Promise<any>;

  // General storage
  storage: {
    get: (key: string) => Promise<{ success: boolean; value: string | null; error?: string }>;
    set: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  };

  // File operations
  openQueryFile: () => Promise<{ success: boolean; content?: string; fileName?: string; filePath?: string; canceled?: boolean; error?: string }>;
  saveQueryFile: (content: string, currentFilePath?: string) => Promise<{ success: boolean; filePath?: string; fileName?: string; canceled?: boolean; error?: string }>;
  saveQueryFileAs: (content: string) => Promise<{ success: boolean; filePath?: string; fileName?: string; canceled?: boolean; error?: string }>;
  importConnections: () => Promise<{ success: boolean; connections?: any[]; canceled?: boolean; error?: string }>;
  exportConnections: () => Promise<{ success: boolean; filePath?: string; count?: number; canceled?: boolean; error?: string }>;

  // Menu communication
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
