interface IElectronAPI {
  // Database operations
  connectDatabase: (config: DatabaseConnectionConfig) => Promise<any>;
  disconnectDatabase: () => Promise<any>;
  executeQuery: (sql: string) => Promise<any>;
  getSchemaInfo: () => Promise<any>;
  getTableColumns: (schemaName: string, tableName: string) => Promise<any>;
  getViewColumns: (schemaName: string, viewName: string) => Promise<any>;
  getViews: (schemaName: string) => Promise<any>;
  getFunctions: (schemaName: string) => Promise<any>;
  getProcedures: (schemaName: string) => Promise<any>;
  getSequences: (schemaName: string) => Promise<any>;
  getTriggers: (schemaName: string) => Promise<any>;
  getIndexes: (schemaName: string) => Promise<any>;
  getDomains: (schemaName: string) => Promise<any>;
  getQueryPlan: (sql: string) => Promise<any>;
  getTableRelationships: (
    schemaName: string,
    tableName: string,
    depth?: number
  ) => Promise<any>;

  // Connection profiles
  getConnections: () => Promise<any>;
  saveConnection: (connection: DatabaseConnectionConfig) => Promise<any>;
  deleteConnection: (id: number) => Promise<any>;
}
