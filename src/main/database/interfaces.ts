export interface DatabaseConnectionConfig {
  id?: number;
  name: string;
  type: 'postgres'; // Can be extended later
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl?: boolean;
}

export interface QueryResult {
  columns: ColumnInfo[];
  rows: any[];
  rowCount: number;
  duration: number;
  error?: string;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  nullable?: boolean;
}

export interface DatabaseSchema {
  databases?: DatabaseInfo[];
  schemas: SchemaInfo[];
}

export interface DatabaseInfo {
  name: string;
  size?: string;
  owner?: string;
}

export interface SchemaInfo {
  name: string;
  tables: TableInfo[];
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface IDatabaseClient {
  connect(config: DatabaseConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery(sql: string): Promise<QueryResult>;
  getSchemaMetadata(): Promise<DatabaseSchema>;
  getQueryPlan(sql: string): Promise<any>;
}