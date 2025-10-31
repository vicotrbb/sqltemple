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
  TableColumnDetail,
  TableDataPage,
  TableDetails,
  TableRelationship,
} from "./interfaces";

export class PostgresClient implements IDatabaseClient {
  private client: Client | null = null;
  private config: DatabaseConnectionConfig | null = null;
  private readonly DEFAULT_TABLE_DATA_LIMIT = 100;

  private quoteIdentifier(identifier: string): string {
    if (identifier.includes("\u0000")) {
      throw new Error("Invalid identifier");
    }
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private normalizeTextArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "string");
    }
    if (typeof value === "string" && value.length > 0) {
      return [value];
    }
    if (value == null) {
      return [];
    }
    return [];
  }

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

  async getTableData(
    schemaName: string,
    tableName: string,
    limit: number = this.DEFAULT_TABLE_DATA_LIMIT,
    offset: number = 0
  ): Promise<TableDataPage> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const safeSchema = this.quoteIdentifier(schemaName);
    const safeTable = this.quoteIdentifier(tableName);

    const pageSize = Math.max(1, Math.min(limit, 1000));
    const query = `
      SELECT *
      FROM ${safeSchema}.${safeTable}
      OFFSET $1
      LIMIT $2;
    `;

    const result = await this.client.query(query, [offset, pageSize + 1]);
    const hasMore = result.rows.length > pageSize;
    const rows = hasMore ? result.rows.slice(0, pageSize) : result.rows;

    const columns: ColumnInfo[] = (result.fields || []).map((field) => ({
      name: field.name,
      dataType: this.getDataTypeName(field.dataTypeID),
      nullable: true,
    }));

    return {
      columns,
      rows,
      nextOffset: offset + rows.length,
      hasMore,
    };
  }

  async getTableDetails(
    schemaName: string,
    tableName: string
  ): Promise<TableDetails> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    const fullName = `${schemaName}.${tableName}`;
    const regClass = `to_regclass(format('%I.%I', $1::text, $2::text))`;

    const columnsQuery = `
      SELECT 
        c.column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
        c.is_nullable = 'YES' AS is_nullable,
        c.column_default,
        pg_catalog.col_description(a.attrelid, a.attnum) AS comment,
        EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.constraint_schema = kcu.constraint_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = c.table_schema
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
        ) AS is_primary_key,
        EXISTS (
          SELECT 1
          FROM pg_index i
          WHERE i.indrelid = ${regClass}
            AND i.indisunique
            AND a.attnum = ANY(i.indkey)
        ) AS is_unique,
        EXISTS (
          SELECT 1
          FROM pg_index i
          WHERE i.indrelid = ${regClass}
            AND a.attnum = ANY(i.indkey)
        ) AS has_index,
        stats.n_distinct,
        stats.null_frac,
        stats.avg_width
      FROM information_schema.columns c
      JOIN pg_catalog.pg_attribute a
        ON a.attname = c.column_name
       AND a.attrelid = ${regClass}
      LEFT JOIN pg_stats stats
        ON stats.schemaname = c.table_schema
       AND stats.tablename = c.table_name
       AND stats.attname = c.column_name
      WHERE c.table_schema = $1
        AND c.table_name = $2
      ORDER BY c.ordinal_position;
    `;

    const primaryKeyQuery = `
      SELECT 
        tc.constraint_name,
        ARRAY_AGG(kcu.column_name ORDER BY kcu.ordinal_position) AS columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.constraint_schema = kcu.constraint_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      GROUP BY tc.constraint_name;
    `;

    const outgoingFkQuery = `
      SELECT
        tc.constraint_name,
        ccu.table_schema AS related_schema,
        ccu.table_name AS related_table,
        kcu.column_name AS local_column,
        ccu.column_name AS related_column,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.constraint_schema = kcu.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.constraint_schema = tc.constraint_schema
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
       AND rc.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      ORDER BY tc.constraint_name, kcu.ordinal_position;
    `;

    const incomingFkQuery = `
      SELECT
        tc.constraint_name,
        kcu.table_schema AS related_schema,
        kcu.table_name AS related_table,
        ccu.column_name AS local_column,
        kcu.column_name AS related_column,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.constraint_schema = kcu.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.constraint_schema = tc.constraint_schema
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
       AND rc.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = $1
        AND ccu.table_name = $2
      ORDER BY tc.constraint_name, kcu.ordinal_position;
    `;

    const indexesQuery = `
      SELECT
        idx.indexname AS name,
        idx.indexdef AS definition,
        i.indisunique AS is_unique,
        i.indisprimary AS is_primary,
        ARRAY(
          SELECT pg_get_indexdef(i.indexrelid, k + 1, TRUE)
          FROM generate_subscripts(i.indkey, 1) AS k
          ORDER BY k
        ) AS columns
      FROM pg_indexes idx
      JOIN pg_class ic ON ic.relname = idx.indexname
      JOIN pg_index i ON i.indexrelid = ic.oid
      WHERE idx.schemaname = $1
        AND idx.tablename = $2
      ORDER BY idx.indexname;
    `;

    const triggersQuery = `
      SELECT 
        trigger_name AS name,
        event_object_table AS table_name,
        event_manipulation AS event_manipulation,
        action_timing AS action_timing,
        action_statement AS action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = $1
        AND event_object_table = $2
      ORDER BY trigger_name;
    `;

    const statsQuery = `
      SELECT
        c.reltuples::bigint AS row_estimate,
        pg_total_relation_size(${regClass}) AS total_bytes,
        pg_relation_size(${regClass}) AS table_bytes,
        pg_indexes_size(${regClass}) AS index_bytes,
        GREATEST(
          pg_total_relation_size(${regClass}) - pg_relation_size(${regClass}) - pg_indexes_size(${regClass}),
          0
        ) AS toast_bytes,
        pg_size_pretty(pg_total_relation_size(${regClass})) AS total_size,
        pg_size_pretty(pg_relation_size(${regClass})) AS table_size,
        pg_size_pretty(pg_indexes_size(${regClass})) AS index_size,
        pg_size_pretty(
          GREATEST(
            pg_total_relation_size(${regClass}) - pg_relation_size(${regClass}) - pg_indexes_size(${regClass}),
            0
          )
        ) AS toast_size,
        obj_description(${regClass}) AS comment
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
        AND c.relname = $2;
    `;

    const maintenanceQuery = `
      SELECT
        to_char(s.last_vacuum, 'YYYY-MM-DD HH24:MI:SS') AS last_vacuum,
        to_char(s.last_autovacuum, 'YYYY-MM-DD HH24:MI:SS') AS last_autovacuum,
        to_char(s.last_analyze, 'YYYY-MM-DD HH24:MI:SS') AS last_analyze,
        to_char(s.last_autoanalyze, 'YYYY-MM-DD HH24:MI:SS') AS last_autoanalyze
      FROM pg_stat_user_tables s
      WHERE s.schemaname = $1
        AND s.relname = $2;
    `;

    const [
      columnsResult,
      primaryKeyResult,
      outgoingFkResult,
      incomingFkResult,
      indexesResult,
      triggersResult,
      statsResult,
      maintenanceResult,
    ] = await Promise.all([
      this.client.query(columnsQuery, [schemaName, tableName]),
      this.client.query(primaryKeyQuery, [schemaName, tableName]),
      this.client.query(outgoingFkQuery, [schemaName, tableName]),
      this.client.query(incomingFkQuery, [schemaName, tableName]),
      this.client.query(indexesQuery, [schemaName, tableName]),
      this.client.query(triggersQuery, [schemaName, tableName]),
      this.client.query(statsQuery, [schemaName, tableName]),
      this.client.query(maintenanceQuery, [schemaName, tableName]),
    ]);

    const columns: TableColumnDetail[] = columnsResult.rows.map((row) => ({
      name: row.column_name,
      dataType: row.data_type,
      nullable: row.is_nullable,
      defaultValue: row.column_default,
      comment: row.comment,
      isPrimaryKey: row.is_primary_key,
      isUnique: row.is_unique,
      hasIndex: row.has_index,
      statistics: {
        distinctValues: row.n_distinct !== null ? Number(row.n_distinct) : null,
        nullFraction: row.null_frac !== null ? Number(row.null_frac) : null,
        averageWidth: row.avg_width !== null ? Number(row.avg_width) : null,
      },
    }));

    const relationships: TableRelationship[] = [];
    const addRelationship = (
      rows: any[],
      direction: "outgoing" | "incoming"
    ) => {
      const grouped = new Map<
        string,
        {
          constraintName: string;
          relatedSchema: string;
          relatedTable: string;
          updateRule: string;
          deleteRule: string;
          columns: Array<{ localColumn: string; relatedColumn: string }>;
        }
      >();

      for (const row of rows) {
        const key = row.constraint_name;
        if (!grouped.has(key)) {
          grouped.set(key, {
            constraintName: row.constraint_name,
            relatedSchema: row.related_schema,
            relatedTable: row.related_table,
            updateRule: row.update_rule,
            deleteRule: row.delete_rule,
            columns: [],
          });
        }
        grouped.get(key)!.columns.push({
          localColumn: row.local_column,
          relatedColumn: row.related_column,
        });
      }

      grouped.forEach((value) => {
        relationships.push({
          constraintName: value.constraintName,
          relatedSchema: value.relatedSchema,
          relatedTable: value.relatedTable,
          updateRule: value.updateRule,
          deleteRule: value.deleteRule,
          columns: value.columns,
          direction,
        });
      });
    };

    addRelationship(outgoingFkResult.rows, "outgoing");
    addRelationship(incomingFkResult.rows, "incoming");

    const primaryKey =
      primaryKeyResult.rows.length > 0
        ? {
            name: primaryKeyResult.rows[0].constraint_name,
            columns: this.normalizeTextArray(primaryKeyResult.rows[0].columns),
          }
        : null;

    const statsRow = statsResult.rows[0] || {};
    const maintenanceRow = maintenanceResult.rows[0] || {};

    return {
      schema: schemaName,
      name: tableName,
      comment: statsRow.comment || null,
      rowEstimate: statsRow.row_estimate ? Number(statsRow.row_estimate) : null,
      totalBytes: statsRow.total_bytes ? Number(statsRow.total_bytes) : null,
      tableBytes: statsRow.table_bytes ? Number(statsRow.table_bytes) : null,
      indexBytes: statsRow.index_bytes ? Number(statsRow.index_bytes) : null,
      toastBytes: statsRow.toast_bytes ? Number(statsRow.toast_bytes) : null,
      totalSize: statsRow.total_size || null,
      tableSize: statsRow.table_size || null,
      indexSize: statsRow.index_size || null,
      toastSize: statsRow.toast_size || null,
      lastVacuum: maintenanceRow?.last_vacuum || null,
      lastAutovacuum: maintenanceRow?.last_autovacuum || null,
      lastAnalyze: maintenanceRow?.last_analyze || null,
      lastAutoanalyze: maintenanceRow?.last_autoanalyze || null,
      columns,
      primaryKey,
      indexes: indexesResult.rows.map((row) => ({
        name: row.name,
        tableName: tableName,
        isUnique: row.is_unique,
        isPrimary: row.is_primary,
        columns: this.normalizeTextArray(row.columns),
        definition: row.definition,
      })),
      triggers: triggersResult.rows.map((row) => ({
        name: row.name,
        tableName: row.table_name,
        eventManipulation: row.event_manipulation,
        actionTiming: row.action_timing,
        actionStatement: row.action_statement,
      })),
      relationships,
    };
  }

  async getQueryPlan(sql: string): Promise<any> {
    if (!this.client) {
      throw new Error("Database not connected");
    }

    if (!sql || !sql.trim()) {
      throw new Error("SQL query is required for query plan analysis");
    }

    const trimmedSql = sql.trim();

    const forbiddenKeywords =
      /^\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE)\s+/i;
    if (forbiddenKeywords.test(trimmedSql)) {
      throw new Error(
        "EXPLAIN is only supported for SELECT statements and non-destructive queries"
      );
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

      if (typeof planData === "string") {
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

      if (errorMessage.includes("permission denied")) {
        throw new Error(
          "Permission denied: Unable to analyze query plan. Check database permissions."
        );
      } else if (errorMessage.includes("syntax error")) {
        throw new Error(`SQL syntax error: ${errorMessage}`);
      } else if (
        errorMessage.includes("relation") &&
        errorMessage.includes("does not exist")
      ) {
        throw new Error(`Table or relation not found: ${errorMessage}`);
      } else if (errorMessage.includes("connection")) {
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
