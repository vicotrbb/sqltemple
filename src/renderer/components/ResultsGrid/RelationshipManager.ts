export interface ForeignKeyRelationship {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  referencedSchema: string;
}

export class RelationshipManager {
  private static relationships: Map<string, ForeignKeyRelationship[]> = new Map();
  
  static async loadRelationships(tableName: string, schemaName: string): Promise<ForeignKeyRelationship[]> {
    const key = `${schemaName}.${tableName}`;
    
    if (this.relationships.has(key)) {
      return this.relationships.get(key)!;
    }
    
    try {
      const response = await window.api.executeQuery(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = '${tableName}' AND table_schema = '${schemaName}' LIMIT 1
      `);
      
      if (!response.success) {
        return [];
      }

      const foreignKeysResponse = await (window as any).electron?.ipcRenderer?.invoke('database:getForeignKeys', tableName, schemaName);
      
      if (!foreignKeysResponse?.success) {
        console.warn('Could not load foreign keys:', foreignKeysResponse?.error);
        return [];
      }

      const relationships = foreignKeysResponse.foreignKeys || [];
      this.relationships.set(key, relationships);
      return relationships;
    } catch (error) {
      console.warn('Error loading relationships:', error);
      return [];
    }
  }
  
  static async getRelatedData(
    foreignKeyValue: any,
    relationship: ForeignKeyRelationship
  ): Promise<any> {
    try {
      const response = await (window as any).electron?.ipcRenderer?.invoke('database:getRelatedData', 
        foreignKeyValue, 
        relationship.referencedSchema, 
        relationship.referencedTable, 
        relationship.referencedColumn
      );
      
      if (!response?.success) {
        return null;
      }
      
      return response.data;
    } catch (error) {
      console.warn('Error loading related data:', error);
      return null;
    }
  }
  
  static findRelationshipForColumn(columnName: string, relationships: ForeignKeyRelationship[]): ForeignKeyRelationship | null {
    return relationships.find(rel => rel.columnName === columnName) || null;
  }
  
  static clearCache(): void {
    this.relationships.clear();
  }
}