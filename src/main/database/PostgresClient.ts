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

      let cleanHost = config.host;
      if (cleanHost.startsWith("https://")) {
        cleanHost = cleanHost.substring(8);
      } else if (cleanHost.startsWith("http://")) {
        cleanHost = cleanHost.substring(7);
      }

      const hostParts = cleanHost.split("/");
      cleanHost = hostParts[0];

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
      try {
        await this.client.end();
      } catch (error) {
        console.warn("Error during database disconnect:", error);
      } finally {
        this.client = null;
      }
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

      const columns: ColumnInfo[] = (result.fields || []).map((field) => ({
        name: field.name,
        dataType: this.getDataTypeName(field.dataTypeID),
        nullable: true,
      }));

      return {
        columns,
        rows: result.rows || [],
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
      console.log(
        "Could not fetch database list:",
        error.message || String(error)
      );
    }

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

    const tablesBySchema: { [key: string]: TableInfo[] } = {};
    for (const row of allTablesResult.rows) {
      if (!tablesBySchema[row.table_schema]) {
        tablesBySchema[row.table_schema] = [];
      }
      tablesBySchema[row.table_schema].push({
        name: row.table_name,
        columns: [],
        columnCount: row.column_count,
      });
    }

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

    const versionQuery = "SELECT version()";
    const versionResult = await this.client.query(versionQuery);
    const versionString = versionResult.rows[0].version;
    const versionMatch = versionString.match(/PostgreSQL (\d+)/);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;

    let functionsQuery: string;
    if (majorVersion >= 11) {
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

    const versionQuery = "SELECT version()";
    const versionResult = await this.client.query(versionQuery);
    const versionString = versionResult.rows[0].version;
    const versionMatch = versionString.match(/PostgreSQL (\d+)/);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;

    if (majorVersion < 11) {
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

    if (!sql || !sql.trim()) {
      throw new Error("SQL query is required for query plan analysis");
    }

    const trimmedSql = sql.trim();
    
    const forbiddenKeywords = /^\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE)\s+/i;
    if (forbiddenKeywords.test(trimmedSql)) {
      throw new Error("EXPLAIN is only supported for SELECT statements and non-destructive queries");
    }

    try {
      const planQuery = `EXPLAIN (FORMAT JSON, ANALYZE TRUE, BUFFERS TRUE) ${trimmedSql}`;
      const result = await this.client.query(planQuery);

      if (!result.rows || result.rows.length === 0) {
        throw new Error("No query plan data returned from database");
      }

      const planData = result.rows[0]["QUERY PLAN"];
      if (!planData) {
        throw new Error("Query plan column not found in result");
      }

      if (typeof planData === 'string') {
        try {
          return JSON.parse(planData);
        } catch (parseError) {
          console.warn("Failed to parse query plan JSON:", parseError);
          return planData;
        }
      }

      return planData;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      
      if (errorMessage.includes('permission denied')) {
        throw new Error("Permission denied: Unable to analyze query plan. Check database permissions.");
      } else if (errorMessage.includes('syntax error')) {
        throw new Error(`SQL syntax error: ${errorMessage}`);
      } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        throw new Error(`Table or relation not found: ${errorMessage}`);
      } else if (errorMessage.includes('connection')) {
        throw new Error("Database connection lost during query plan analysis");
      }
      
      throw new Error(`Failed to get query plan: ${errorMessage}`);
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

  async getTableRelationships(
    schemaName: string,
    tableName: string,
    depth: number = 3,
    visitedTables: Set<string> = new Set()
  ): Promise<any> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const tableKey = `${schemaName}.${tableName}`;
    if (visitedTables.has(tableKey) || depth <= 0) {
      return { table: tableKey, relationships: [] };
    }

    visitedTables.add(tableKey);

    const relationshipsQuery = `
      WITH foreign_keys AS (
        SELECT 
          'outgoing' as direction,
          tc.constraint_name,
          tc.table_schema,
          tc.table_name,
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = $1
          AND tc.table_name = $2
        
        UNION ALL
        
        SELECT 
          'incoming' as direction,
          tc.constraint_name,
          tc.table_schema,
          tc.table_name,
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = $1
          AND ccu.table_name = $2
          AND NOT (tc.table_schema = $1 AND tc.table_name = $2)
      )
      SELECT * FROM foreign_keys
      ORDER BY direction, foreign_table_schema, foreign_table_name;
    `;

    const result = await this.client.query(relationshipsQuery, [
      schemaName,
      tableName,
    ]);

    const relationships: any[] = [];
    const relatedTables: Set<string> = new Set();

    for (const row of result.rows) {
      const relationship = {
        direction: row.direction,
        constraintName: row.constraint_name,
        sourceSchema:
          row.direction === "outgoing" ? schemaName : row.table_schema,
        sourceTable: row.direction === "outgoing" ? tableName : row.table_name,
        sourceColumn:
          row.direction === "outgoing"
            ? row.column_name
            : row.foreign_column_name,
        targetSchema:
          row.direction === "outgoing" ? row.foreign_table_schema : schemaName,
        targetTable:
          row.direction === "outgoing" ? row.foreign_table_name : tableName,
        targetColumn:
          row.direction === "outgoing"
            ? row.foreign_column_name
            : row.column_name,
        hasMore: false,
        children: null,
      };

      relationships.push(relationship);

      if (row.direction === "outgoing") {
        relatedTables.add(
          `${row.foreign_table_schema}.${row.foreign_table_name}`
        );
      } else {
        relatedTables.add(`${row.table_schema}.${row.table_name}`);
      }
    }

    if (depth > 1) {
      for (const relationship of relationships) {
        const nextTableSchema =
          relationship.direction === "outgoing"
            ? relationship.targetSchema
            : relationship.sourceSchema;
        const nextTableName =
          relationship.direction === "outgoing"
            ? relationship.targetTable
            : relationship.sourceTable;

        const hasMoreQuery = `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints AS tc 
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND (
                (tc.table_schema = $1 AND tc.table_name = $2)
                OR EXISTS (
                  SELECT 1 
                  FROM information_schema.constraint_column_usage AS ccu
                  WHERE ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = $1
                    AND ccu.table_name = $2
                )
              )
          ) as has_more;
        `;

        const hasMoreResult = await this.client.query(hasMoreQuery, [
          nextTableSchema,
          nextTableName,
        ]);

        relationship.hasMore = hasMoreResult.rows[0].has_more;
      }
    }

    if (depth > 1) {
      for (const relationship of relationships) {
        const nextTableSchema =
          relationship.direction === "outgoing"
            ? relationship.targetSchema
            : relationship.sourceSchema;
        const nextTableName =
          relationship.direction === "outgoing"
            ? relationship.targetTable
            : relationship.sourceTable;

        const childRelationships = await this.getTableRelationships(
          nextTableSchema,
          nextTableName,
          depth - 1,
          new Set(visitedTables)
        );

        relationship.children = childRelationships;
      }
    }

    return {
      table: tableKey,
      schema: schemaName,
      name: tableName,
      relationships,
    };
  }
}
