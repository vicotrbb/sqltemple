export interface IElectronAPI {
  // Database operations
  connectDatabase: (config: any) => Promise<any>;
  disconnectDatabase: () => Promise<any>;
  executeQuery: (sql: string) => Promise<any>;
  getSchemaInfo: () => Promise<any>;
  getQueryPlan: (sql: string) => Promise<any>;
  
  // Connection profiles
  getConnections: () => Promise<any>;
  saveConnection: (connection: any) => Promise<any>;
  deleteConnection: (id: number) => Promise<any>;
  
  // Query history
  getQueryHistory: (connectionId?: number) => Promise<any>;
  
  // AI operations
  aiSetConfig: (config: { apiKey: string; model: string }) => Promise<any>;
  aiGetConfig: () => Promise<any>;
  aiGetModels: () => Promise<any>;
  aiAnalyzePlan: (query: string, plan: any) => Promise<any>;
  aiExplainQuery: (sql: string) => Promise<any>;
  aiCreateQuery: (prompt: string) => Promise<any>;
  aiOptimizeQuery: (sql: string) => Promise<any>;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}