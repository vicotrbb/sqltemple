import { QueryResult } from "../../../main/database/interfaces";

export interface QueryGeneratorOptions {
  tableName: string;
  schemaName?: string;
  queryType: 'insert' | 'select' | 'update';
  selectedRows?: number[];
}

export class SQLQueryGenerator {
  static generateInsert(results: QueryResult, options: QueryGeneratorOptions): string {
    if (results.rows.length === 0) return '';
    
    const tableName = options.schemaName 
      ? `${options.schemaName}.${options.tableName}`
      : options.tableName;
    
    const columns = results.columns.map(col => col.name);
    const columnList = columns.join(', ');
    
    const rowsToProcess = options.selectedRows?.length 
      ? options.selectedRows.map(index => results.rows[index]).filter(Boolean)
      : results.rows;
    
    const values = rowsToProcess.map(row => {
      const valueList = columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        return String(value);
      }).join(', ');
      return `  (${valueList})`;
    });
    
    return `INSERT INTO ${tableName} (${columnList})\nVALUES\n${values.join(',\n')};`;
  }
  
  static generateSelect(results: QueryResult, options: QueryGeneratorOptions): string {
    if (results.rows.length === 0) return '';
    
    const tableName = options.schemaName 
      ? `${options.schemaName}.${options.tableName}`
      : options.tableName;
    
    const columns = results.columns.map(col => col.name);
    const columnList = columns.join(', ');
    
    if (options.selectedRows?.length === 1) {
      const row = results.rows[options.selectedRows[0]];
      const conditions = columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return `${col} IS NULL`;
        if (typeof value === 'string') return `${col} = '${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `${col} = '${value.toISOString()}'`;
        if (typeof value === 'boolean') return `${col} = ${value ? 'TRUE' : 'FALSE'}`;
        return `${col} = ${value}`;
      }).join(' AND ');
      
      return `SELECT ${columnList}\nFROM ${tableName}\nWHERE ${conditions};`;
    }
    
    return `SELECT ${columnList}\nFROM ${tableName};`;
  }
  
  static generateUpdate(results: QueryResult, options: QueryGeneratorOptions): string {
    if (results.rows.length === 0 || !options.selectedRows?.length) return '';
    
    const tableName = options.schemaName 
      ? `${options.schemaName}.${options.tableName}`
      : options.tableName;
    
    const columns = results.columns.map(col => col.name);
    
    if (options.selectedRows.length === 1) {
      const row = results.rows[options.selectedRows[0]];
      
      const setClause = columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return `${col} = NULL`;
        if (typeof value === 'string') return `${col} = '${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `${col} = '${value.toISOString()}'`;
        if (typeof value === 'boolean') return `${col} = ${value ? 'TRUE' : 'FALSE'}`;
        return `${col} = ${value}`;
      }).join(',\n  ');
      
      return `UPDATE ${tableName}\nSET\n  ${setClause}\nWHERE -- Add your WHERE condition here\n  ;`;
    }
    
    return `UPDATE ${tableName}\nSET\n  -- Add your SET clause here\nWHERE -- Add your WHERE condition here\n  ;`;
  }
  
  static generateQuery(results: QueryResult, options: QueryGeneratorOptions): string {
    switch (options.queryType) {
      case 'insert':
        return this.generateInsert(results, options);
      case 'select':
        return this.generateSelect(results, options);
      case 'update':
        return this.generateUpdate(results, options);
      default:
        throw new Error(`Unsupported query type: ${options.queryType}`);
    }
  }
}