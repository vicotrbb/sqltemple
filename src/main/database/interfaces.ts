export interface DatabaseConnectionConfig {
  id?: number;
  name: string;
  type: "postgres"; // Can be extended later
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
  views?: ViewInfo[];
  functions?: FunctionInfo[];
  procedures?: ProcedureInfo[];
  sequences?: SequenceInfo[];
  triggers?: TriggerInfo[];
  indexes?: IndexInfo[];
  domains?: DomainInfo[];
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  columnCount?: number; // Optional, for lazy loading
}

export interface ViewInfo {
  name: string;
  definition?: string;
  columns?: ColumnInfo[];
  columnCount?: number;
}

export interface FunctionInfo {
  name: string;
  returnType?: string;
  arguments?: string;
  language?: string;
  definition?: string;
}

export interface ProcedureInfo {
  name: string;
  arguments?: string;
  language?: string;
  definition?: string;
}

export interface SequenceInfo {
  name: string;
  dataType?: string;
  startValue?: string;
  minValue?: string;
  maxValue?: string;
  incrementBy?: string;
  cycleOption?: boolean;
}

export interface TriggerInfo {
  name: string;
  tableName: string;
  eventManipulation: string;
  actionTiming: string;
  actionStatement?: string;
}

export interface IndexInfo {
  name: string;
  tableName: string;
  isUnique: boolean;
  isPrimary: boolean;
  columns?: string[];
  definition?: string;
}

export interface DomainInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  checkConstraint?: string;
}

export interface IDatabaseClient {
  connect(config: DatabaseConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery(sql: string): Promise<QueryResult>;
  getSchemaMetadata(): Promise<DatabaseSchema>;
  getQueryPlan(sql: string): Promise<any>;
  getTableColumns?(
    schemaName: string,
    tableName: string
  ): Promise<ColumnInfo[]>; // Optional for backward compatibility
  getViewColumns?(schemaName: string, viewName: string): Promise<ColumnInfo[]>;
  getViews?(schemaName: string): Promise<ViewInfo[]>;
  getFunctions?(schemaName: string): Promise<FunctionInfo[]>;
  getProcedures?(schemaName: string): Promise<ProcedureInfo[]>;
  getSequences?(schemaName: string): Promise<SequenceInfo[]>;
  getTriggers?(schemaName: string): Promise<TriggerInfo[]>;
  getIndexes?(schemaName: string): Promise<IndexInfo[]>;
  getDomains?(schemaName: string): Promise<DomainInfo[]>;
}
