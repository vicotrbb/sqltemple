import { Client } from 'pg';
import {
  IDatabaseClient,
  DatabaseConnectionConfig,
  QueryResult,
  DatabaseSchema,
  DatabaseInfo,
  SchemaInfo,
  TableInfo,
  ColumnInfo
} from './interfaces';

export class PostgresClient implements IDatabaseClient {
  private client: Client | null = null;
  private config: DatabaseConnectionConfig | null = null;

  async connect(config: DatabaseConnectionConfig): Promise<void> {
    try {
      this.config = config;
      
      // Clean the host URL - remove protocol if present
      let cleanHost = config.host;
      if (cleanHost.startsWith('https://')) {
        cleanHost = cleanHost.substring(8);
      } else if (cleanHost.startsWith('http://')) {
        cleanHost = cleanHost.substring(7);
      }
      
      // Remove any trailing slashes or paths
      const hostParts = cleanHost.split('/');
      cleanHost = hostParts[0];
      
      // Remove port if included in the host (e.g., host:5432)
      const hostPortParts = cleanHost.split(':');
      if (hostPortParts.length > 1) {
        cleanHost = hostPortParts[0];
      }
      
      this.client = new Client({
        host: cleanHost,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false
      });

      await this.client.connect();
    } catch (error: any) {
      throw new Error(`Failed to connect to database: ${error.message || String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }

  async executeQuery(sql: string): Promise<QueryResult> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const startTime = Date.now();
    
    try {
      const result = await this.client.query(sql);
      const duration = Date.now() - startTime;

      const columns: ColumnInfo[] = result.fields.map(field => ({
        name: field.name,
        dataType: this.getDataTypeName(field.dataTypeID),
        nullable: true // PG doesn't provide this in the result fields
      }));

      return {
        columns,
        rows: result.rows,
        rowCount: result.rowCount || 0,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        duration,
        error: error.message || String(error)
      };
    }
  }

  async getSchemaMetadata(): Promise<DatabaseSchema> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    // Get all databases (if we have permission)
    let databases: DatabaseInfo[] = [];
    try {
      const databasesQuery = `
        SELECT 
          datname as name,
          pg_size_pretty(pg_database_size(datname)) as size,
          pg_catalog.pg_get_userbyid(datdba) as owner
        FROM pg_database
        WHERE datistemplate = false
        ORDER BY datname;
      `;
      
      const databasesResult = await this.client.query(databasesQuery);
      databases = databasesResult.rows.map(row => ({
        name: row.name,
        size: row.size,
        owner: row.owner
      }));
    } catch (error: any) {
      // If we don't have permission to query pg_database, that's okay
      console.log('Could not fetch database list:', error.message || String(error));
    }

    // Get all schemas
    const schemasQuery = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name;
    `;

    const schemasResult = await this.client.query(schemasQuery);
    const schemas: SchemaInfo[] = [];

    for (const schemaRow of schemasResult.rows) {
      const schemaName = schemaRow.schema_name;
      
      // Get tables for this schema
      const tablesQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      
      const tablesResult = await this.client.query(tablesQuery, [schemaName]);
      const tables: TableInfo[] = [];

      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name;
        
        // Get columns for this table
        const columnsQuery = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;
        
        const columnsResult = await this.client.query(columnsQuery, [schemaName, tableName]);
        
        const columns: ColumnInfo[] = columnsResult.rows.map(col => ({
          name: col.column_name,
          dataType: this.formatDataType(col),
          nullable: col.is_nullable === 'YES'
        }));

        tables.push({ name: tableName, columns });
      }

      schemas.push({ name: schemaName, tables });
    }

    return { databases, schemas };
  }

  async getQueryPlan(sql: string): Promise<any> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    try {
      const planQuery = `EXPLAIN (FORMAT JSON, ANALYZE TRUE, BUFFERS TRUE) ${sql}`;
      const result = await this.client.query(planQuery);
      
      // PostgreSQL returns the plan as a JSON string in the first row
      if (result.rows.length > 0 && result.rows[0]['QUERY PLAN']) {
        return result.rows[0]['QUERY PLAN'];
      }
      
      throw new Error('No query plan returned');
    } catch (error: any) {
      throw new Error(`Failed to get query plan: ${error.message || String(error)}`);
    }
  }

  private formatDataType(column: any): string {
    let dataType = column.data_type;
    
    if (column.character_maximum_length) {
      dataType += `(${column.character_maximum_length})`;
    } else if (column.numeric_precision && column.numeric_scale !== null) {
      dataType += `(${column.numeric_precision},${column.numeric_scale})`;
    } else if (column.numeric_precision) {
      dataType += `(${column.numeric_precision})`;
    }
    
    return dataType;
  }

  private getDataTypeName(oid: number): string {
    // Common PostgreSQL type OIDs
    const typeMap: { [key: number]: string } = {
      16: 'boolean',
      20: 'bigint',
      21: 'smallint',
      23: 'integer',
      25: 'text',
      114: 'json',
      700: 'real',
      701: 'double precision',
      1043: 'varchar',
      1082: 'date',
      1083: 'time',
      1114: 'timestamp',
      1184: 'timestamptz',
      1700: 'numeric',
      3802: 'jsonb'
    };
    
    return typeMap[oid] || 'unknown';
  }
}