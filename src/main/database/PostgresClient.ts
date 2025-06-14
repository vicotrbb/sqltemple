import { Client } from "pg";
import {
  IDatabaseClient,
  DatabaseConnectionConfig,
  QueryResult,
  DatabaseSchema,
  DatabaseInfo,
  SchemaInfo,
  TableInfo,
  ColumnInfo,
  ViewInfo,
  FunctionInfo,
  ProcedureInfo,
  SequenceInfo,
  TriggerInfo,
  IndexInfo,
  DomainInfo,
} from "./interfaces";

export class PostgresClient implements IDatabaseClient {
  private client: Client | null = null;
  private config: DatabaseConnectionConfig | null = null;

  async connect(config: DatabaseConnectionConfig): Promise<void> {
    try {
      this.config = config;

      // Clean the host URL - remove protocol if present
      let cleanHost = config.host;
      if (cleanHost.startsWith("https://")) {
        cleanHost = cleanHost.substring(8);
      } else if (cleanHost.startsWith("http://")) {
        cleanHost = cleanHost.substring(7);
      }

      // Remove any trailing slashes or paths
      const hostParts = cleanHost.split("/");
      cleanHost = hostParts[0];

      // Remove port if included in the host (e.g., host:5432)
      const hostPortParts = cleanHost.split(":");
      if (hostPortParts.length > 1) {
        cleanHost = hostPortParts[0];
      }

      this.client = new Client({
        host: cleanHost,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
      });

      await this.client.connect();
    } catch (error: any) {
      throw new Error(
        `Failed to connect to database: ${error.message || String(error)}`
      );
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
      throw new Error("Database not connected");
    }

    const startTime = Date.now();

    try {
      const result = await this.client.query(sql);
      const duration = Date.now() - startTime;

      const columns: ColumnInfo[] = result.fields.map((field) => ({
        name: field.name,
        dataType: this.getDataTypeName(field.dataTypeID),
        nullable: true, // PG doesn't provide this in the result fields
      }));

      return {
        columns,
        rows: result.rows,
        rowCount: result.rowCount || 0,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        duration,
        error: error.message || String(error),
      };
    }
  }

  async getSchemaMetadata(): Promise<DatabaseSchema> {
    if (!this.client) {
      throw new Error("Database not connected");
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
      databases = databasesResult.rows.map((row) => ({
        name: row.name,
        size: row.size,
        owner: row.owner,
      }));
    } catch (error: any) {
      // If we don't have permission to query pg_database, that's okay
      console.log(
        "Could not fetch database list:",
        error.message || String(error)
      );
    }

    // Get all schemas with table counts
    const schemasQuery = `
      SELECT 
        s.schema_name,
        COUNT(t.table_name) as table_count
      FROM information_schema.schemata s
      LEFT JOIN information_schema.tables t 
        ON s.schema_name = t.table_schema 
        AND t.table_type = 'BASE TABLE'
      WHERE s.schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      GROUP BY s.schema_name
      ORDER BY s.schema_name;
    `;

    const schemasResult = await this.client.query(schemasQuery);
    const schemas: SchemaInfo[] = [];

    // Get all tables in one query for better performance
    const allTablesQuery = `
      SELECT 
        table_schema,
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns c 
         WHERE c.table_schema = t.table_schema 
         AND c.table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY table_schema, table_name;
    `;

    const allTablesResult = await this.client.query(allTablesQuery);

    // Group tables by schema
    const tablesBySchema: { [key: string]: TableInfo[] } = {};
    for (const row of allTablesResult.rows) {
      if (!tablesBySchema[row.table_schema]) {
        tablesBySchema[row.table_schema] = [];
      }
      tablesBySchema[row.table_schema].push({
        name: row.table_name,
        columns: [], // Empty initially, will be loaded on demand
        columnCount: row.column_count,
      });
    }

    // Build schema objects
    for (const schemaRow of schemasResult.rows) {
      const schemaName = schemaRow.schema_name;
      schemas.push({
        name: schemaName,
        tables: tablesBySchema[schemaName] || [],
      });
    }

    return { databases, schemas };
  }

  async getTableColumns(
    schemaName: string,
    tableName: string
  ): Promise<ColumnInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

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

    const columnsResult = await this.client.query(columnsQuery, [
      schemaName,
      tableName,
    ]);

    return columnsResult.rows.map((col) => ({
      name: col.column_name,
      dataType: this.formatDataType(col),
      nullable: col.is_nullable === "YES",
    }));
  }

  async getViewColumns(
    schemaName: string,
    viewName: string
  ): Promise<ColumnInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position;
    `;

    const columnsResult = await this.client.query(columnsQuery, [
      schemaName,
      viewName,
    ]);

    return columnsResult.rows.map((col) => ({
      name: col.column_name,
      dataType: this.formatDataType(col),
      nullable: col.is_nullable === "YES",
    }));
  }

  async getViews(schemaName: string): Promise<ViewInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const viewsQuery = `
      SELECT 
        v.table_name as view_name,
        (SELECT COUNT(*) FROM information_schema.columns c 
         WHERE c.table_schema = v.table_schema 
         AND c.table_name = v.table_name) as column_count
      FROM information_schema.views v
      WHERE v.table_schema = $1
      ORDER BY v.table_name;
    `;

    const viewsResult = await this.client.query(viewsQuery, [schemaName]);

    return viewsResult.rows.map((row) => ({
      name: row.view_name,
      columnCount: row.column_count,
    }));
  }

  async getFunctions(schemaName: string): Promise<FunctionInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    // Check PostgreSQL version to use appropriate query
    const versionQuery = "SELECT version()";
    const versionResult = await this.client.query(versionQuery);
    const versionString = versionResult.rows[0].version;
    const versionMatch = versionString.match(/PostgreSQL (\d+)/);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;

    let functionsQuery: string;
    if (majorVersion >= 11) {
      // PostgreSQL 11+ has prokind column
      functionsQuery = `
        SELECT 
          p.proname as function_name,
          pg_catalog.pg_get_function_result(p.oid) as return_type,
          pg_catalog.pg_get_function_arguments(p.oid) as arguments,
          l.lanname as language
        FROM pg_catalog.pg_proc p
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        LEFT JOIN pg_catalog.pg_language l ON l.oid = p.prolang
        WHERE n.nspname = $1
          AND p.prokind = 'f'
        ORDER BY p.proname;
      `;
    } else {
      // Older PostgreSQL versions use proisagg and proiswindow
      functionsQuery = `
        SELECT 
          p.proname as function_name,
          pg_catalog.pg_get_function_result(p.oid) as return_type,
          pg_catalog.pg_get_function_arguments(p.oid) as arguments,
          l.lanname as language
        FROM pg_catalog.pg_proc p
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        LEFT JOIN pg_catalog.pg_language l ON l.oid = p.prolang
        WHERE n.nspname = $1
          AND NOT p.proisagg
          AND p.prorettype != 'pg_catalog.trigger'::pg_catalog.regtype
        ORDER BY p.proname;
      `;
    }

    const functionsResult = await this.client.query(functionsQuery, [
      schemaName,
    ]);

    return functionsResult.rows.map((row) => ({
      name: row.function_name,
      returnType: row.return_type,
      arguments: row.arguments,
      language: row.language,
    }));
  }

  async getProcedures(schemaName: string): Promise<ProcedureInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    // Check PostgreSQL version to use appropriate query
    const versionQuery = "SELECT version()";
    const versionResult = await this.client.query(versionQuery);
    const versionString = versionResult.rows[0].version;
    const versionMatch = versionString.match(/PostgreSQL (\d+)/);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;

    if (majorVersion < 11) {
      // Procedures don't exist before PostgreSQL 11
      return [];
    }

    const proceduresQuery = `
      SELECT 
        p.proname as procedure_name,
        pg_catalog.pg_get_function_arguments(p.oid) as arguments,
        l.lanname as language
      FROM pg_catalog.pg_proc p
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      LEFT JOIN pg_catalog.pg_language l ON l.oid = p.prolang
      WHERE n.nspname = $1
        AND p.prokind = 'p'
      ORDER BY p.proname;
    `;

    const proceduresResult = await this.client.query(proceduresQuery, [
      schemaName,
    ]);

    return proceduresResult.rows.map((row) => ({
      name: row.procedure_name,
      arguments: row.arguments,
      language: row.language,
    }));
  }

  async getSequences(schemaName: string): Promise<SequenceInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const sequencesQuery = `
      SELECT 
        sequence_name,
        data_type,
        start_value,
        minimum_value,
        maximum_value,
        increment,
        cycle_option
      FROM information_schema.sequences
      WHERE sequence_schema = $1
      ORDER BY sequence_name;
    `;

    const sequencesResult = await this.client.query(sequencesQuery, [
      schemaName,
    ]);

    return sequencesResult.rows.map((row) => ({
      name: row.sequence_name,
      dataType: row.data_type,
      startValue: row.start_value,
      minValue: row.minimum_value,
      maxValue: row.maximum_value,
      incrementBy: row.increment,
      cycleOption: row.cycle_option === "YES",
    }));
  }

  async getTriggers(schemaName: string): Promise<TriggerInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const triggersQuery = `
      SELECT 
        trigger_name,
        event_object_table as table_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = $1
      ORDER BY event_object_table, trigger_name;
    `;

    const triggersResult = await this.client.query(triggersQuery, [schemaName]);

    return triggersResult.rows.map((row) => ({
      name: row.trigger_name,
      tableName: row.table_name,
      eventManipulation: row.event_manipulation,
      actionTiming: row.action_timing,
      actionStatement: row.action_statement,
    }));
  }

  async getIndexes(schemaName: string): Promise<IndexInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const indexesQuery = `
      SELECT 
        i.indexname as index_name,
        i.tablename as table_name,
        i.indexdef as definition,
        idx.indisunique as is_unique,
        idx.indisprimary as is_primary
      FROM pg_indexes i
      JOIN pg_class c ON c.relname = i.indexname
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_index idx ON idx.indexrelid = c.oid
      WHERE i.schemaname = $1
        AND n.nspname = $1
      ORDER BY i.tablename, i.indexname;
    `;

    const indexesResult = await this.client.query(indexesQuery, [schemaName]);

    return indexesResult.rows.map((row) => ({
      name: row.index_name,
      tableName: row.table_name,
      isUnique: row.is_unique,
      isPrimary: row.is_primary,
      definition: row.definition,
    }));
  }

  async getDomains(schemaName: string): Promise<DomainInfo[]> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const domainsQuery = `
      SELECT 
        domain_name,
        data_type,
        is_nullable,
        domain_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.domains
      WHERE domain_schema = $1
      ORDER BY domain_name;
    `;

    const domainsResult = await this.client.query(domainsQuery, [schemaName]);

    return domainsResult.rows.map((row) => ({
      name: row.domain_name,
      dataType: this.formatDataType(row),
      nullable: row.is_nullable === "YES",
      defaultValue: row.domain_default,
    }));
  }

  async getQueryPlan(sql: string): Promise<any> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    try {
      const planQuery = `EXPLAIN (FORMAT JSON, ANALYZE TRUE, BUFFERS TRUE) ${sql}`;
      const result = await this.client.query(planQuery);

      // PostgreSQL returns the plan as a JSON string in the first row
      if (result.rows.length > 0 && result.rows[0]["QUERY PLAN"]) {
        return result.rows[0]["QUERY PLAN"];
      }

      throw new Error("No query plan returned");
    } catch (error: any) {
      throw new Error(
        `Failed to get query plan: ${error.message || String(error)}`
      );
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
      16: "boolean",
      20: "bigint",
      21: "smallint",
      23: "integer",
      25: "text",
      114: "json",
      700: "real",
      701: "double precision",
      1043: "varchar",
      1082: "date",
      1083: "time",
      1114: "timestamp",
      1184: "timestamptz",
      1700: "numeric",
      3802: "jsonb",
    };

    return typeMap[oid] || "unknown";
  }
}
