import {
  DatabaseConnectionConfig,
  QueryResult,
  DatabaseSchema,
  ColumnInfo,
  ViewInfo,
  FunctionInfo,
  ProcedureInfo,
  SequenceInfo,
  TriggerInfo,
  IndexInfo,
  DomainInfo,
} from "../../main/database/interfaces";
import { QueryHistoryEntry } from "../../main/storage/StorageManager";

export interface IElectronAPI {
  // Database operations
  connectDatabase: (config: DatabaseConnectionConfig) => Promise<{
    success: boolean;
    connectionId?: number;
    error?: string;
  }>;
  disconnectDatabase: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  executeQuery: (sql: string) => Promise<{
    success: boolean;
    result?: QueryResult;
    error?: string;
  }>;
  getSchemaInfo: () => Promise<{
    success: boolean;
    schema?: DatabaseSchema;
    error?: string;
  }>;
  getTableColumns: (
    schemaName: string,
    tableName: string
  ) => Promise<{
    success: boolean;
    columns?: ColumnInfo[];
    error?: string;
  }>;
  getViewColumns: (
    schemaName: string,
    viewName: string
  ) => Promise<{
    success: boolean;
    columns?: ColumnInfo[];
    error?: string;
  }>;
  getViews: (schemaName: string) => Promise<{
    success: boolean;
    views?: ViewInfo[];
    error?: string;
  }>;
  getFunctions: (schemaName: string) => Promise<{
    success: boolean;
    functions?: FunctionInfo[];
    error?: string;
  }>;
  getProcedures: (schemaName: string) => Promise<{
    success: boolean;
    procedures?: ProcedureInfo[];
    error?: string;
  }>;
  getSequences: (schemaName: string) => Promise<{
    success: boolean;
    sequences?: SequenceInfo[];
    error?: string;
  }>;
  getTriggers: (schemaName: string) => Promise<{
    success: boolean;
    triggers?: TriggerInfo[];
    error?: string;
  }>;
  getIndexes: (schemaName: string) => Promise<{
    success: boolean;
    indexes?: IndexInfo[];
    error?: string;
  }>;
  getDomains: (schemaName: string) => Promise<{
    success: boolean;
    domains?: DomainInfo[];
    error?: string;
  }>;
  getTableRelationships: (
    schemaName: string,
    tableName: string,
    depth?: number
  ) => Promise<{
    success: boolean;
    relationships?: any;
    error?: string;
  }>;
  getQueryPlan: (sql: string) => Promise<{
    success: boolean;
    plan?: any;
    error?: string;
  }>;

  // Connection profiles
  getConnections: () => Promise<{
    success: boolean;
    connections?: DatabaseConnectionConfig[];
    error?: string;
  }>;
  saveConnection: (connection: DatabaseConnectionConfig) => Promise<{
    success: boolean;
    id?: number;
    error?: string;
  }>;
  deleteConnection: (id: number) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Query history
  getQueryHistory: (connectionId?: number) => Promise<{
    success: boolean;
    history?: QueryHistoryEntry[];
    error?: string;
  }>;

  // AI operations
  aiSetConfig: (config: { apiKey: string; model: string }) => Promise<any>;
  aiGetConfig: () => Promise<any>;
  aiGetModels: () => Promise<any>;
  aiAnalyzePlan: (query: string, plan: any) => Promise<any>;
  aiExplainQuery: (sql: string) => Promise<any>;
  aiCreateQuery: (prompt: string) => Promise<any>;
  aiOptimizeQuery: (sql: string) => Promise<any>;
  aiAnalyzeData: (prompt: string) => Promise<any>;

  generateQuery: (prompt: string) => Promise<{
    success: boolean;
    query?: string;
    error?: string;
  }>;
  explainQuery: (sql: string) => Promise<{
    success: boolean;
    explanation?: string;
    error?: string;
  }>;
  explainPlan: (plan: any) => Promise<{
    success: boolean;
    explanation?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
