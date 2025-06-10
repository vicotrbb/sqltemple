import React, { useState } from 'react';
import { DatabaseSchema, DatabaseInfo, SchemaInfo, TableInfo } from '../../main/database/interfaces';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface SchemaExplorerProps {
  schema: DatabaseSchema | null;
  onTableClick?: (tableName: string, schemaName: string) => void;
  onRefresh?: () => void;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ 
  schema, 
  onTableClick, 
  onRefresh 
}) => {
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const toggleDatabase = (dbName: string) => {
    const newExpanded = new Set(expandedDatabases);
    if (newExpanded.has(dbName)) {
      newExpanded.delete(dbName);
    } else {
      newExpanded.add(dbName);
    }
    setExpandedDatabases(newExpanded);
  };

  const toggleSchema = (schemaName: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schemaName)) {
      newExpanded.delete(schemaName);
    } else {
      newExpanded.add(schemaName);
    }
    setExpandedSchemas(newExpanded);
  };

  const toggleTable = (tableKey: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableKey)) {
      newExpanded.delete(tableKey);
    } else {
      newExpanded.add(tableKey);
    }
    setExpandedTables(newExpanded);
  };

  if (!schema) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-vscode-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase text-vscode-text-secondary tracking-wide">Explorer</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-vscode-text-tertiary text-sm">No connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 pt-8 border-b border-vscode-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase text-vscode-text-secondary tracking-wide">Explorer</h2>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-vscode-text-tertiary hover:text-vscode-text-secondary transition-colors"
              title="Refresh schema"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.5 2.5A6.5 6.5 0 0 0 1 7h1.5a5 5 0 1 1 5 5v1.5A6.5 6.5 0 0 0 13.5 2.5z"/>
                <path d="M0 7.5L3 4v7z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Databases Section */}
        {schema.databases && schema.databases.length > 0 && (
          <div className="mb-4">
            <div className="px-3 py-1 text-xs font-medium uppercase text-vscode-text-tertiary">
              Databases
            </div>
            {schema.databases.map((db) => (
              <div key={db.name}>
                <div
                  className="flex items-center px-3 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm"
                  onClick={() => toggleDatabase(db.name)}
                >
                  <span className="mr-1 text-vscode-text-tertiary">
                    {expandedDatabases.has(db.name) ? '▼' : '▶'}
                  </span>
                  <svg className="w-4 h-4 mr-1 text-vscode-purple" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 3v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2zm2-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm1 2v1h8V4H4zm0 3v1h8V7H4zm0 3v1h4v-1H4z"/>
                  </svg>
                  <span className="flex-1 font-medium">{db.name}</span>
                  {db.size && (
                    <span className="text-xs text-vscode-text-tertiary">
                      {db.size}
                    </span>
                  )}
                </div>
                {expandedDatabases.has(db.name) && db.owner && (
                  <div className="ml-8 px-3 py-1 text-xs text-vscode-text-tertiary">
                    Owner: {db.owner}
                  </div>
                )}
              </div>
            ))}
            <div className="border-b border-vscode-border my-2"></div>
          </div>
        )}

        {/* Schemas Section */}
        <div className="px-3 py-1 text-xs font-medium uppercase text-vscode-text-tertiary">
          Schemas
        </div>
        {schema.schemas.map((schemaInfo: SchemaInfo) => (
          <div key={schemaInfo.name}>
            <div
              className="flex items-center px-3 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm"
              onClick={() => toggleSchema(schemaInfo.name)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  items: [
                    {
                      label: 'Refresh',
                      onClick: () => onRefresh?.(),
                      icon: (
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.5 2.5A6.5 6.5 0 0 0 1 7h1.5a5 5 0 1 1 5 5v1.5A6.5 6.5 0 0 0 13.5 2.5z"/>
                          <path d="M0 7.5L3 4v7z"/>
                        </svg>
                      )
                    }
                  ]
                });
              }}
            >
              <span className="mr-1 text-vscode-text-tertiary">
                {expandedSchemas.has(schemaInfo.name) ? '▼' : '▶'}
              </span>
              <svg className="w-4 h-4 mr-1 text-vscode-yellow" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.5 1l1-1h11l1 1v3l-1 1v8l-1 1h-11l-1-1v-11zm1 1v10h10v-8h-10v-2zm0-1h10v1h-10z"/>
              </svg>
              <span className="flex-1 font-medium">{schemaInfo.name}</span>
              <span className="text-xs text-vscode-text-tertiary">
                ({schemaInfo.tables.length})
              </span>
            </div>
            
            {expandedSchemas.has(schemaInfo.name) && (
              <div className="ml-3">
                {schemaInfo.tables.map((table: TableInfo) => {
                  const tableKey = `${schemaInfo.name}.${table.name}`;
                  return (
                    <div key={tableKey}>
                      <div
                        className="flex items-center px-3 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm"
                        onClick={() => toggleTable(tableKey)}
                      >
                        <span className="mr-1 text-vscode-text-tertiary">
                          {expandedTables.has(tableKey) ? '▼' : '▶'}
                        </span>
                        <svg className="w-4 h-4 mr-1 text-vscode-blue" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M14 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6.5L14 5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H3v12h10V4.5z"/>
                        </svg>
                        <span 
                          className="flex-1 text-vscode-text hover:text-vscode-blue transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTableClick?.(table.name, schemaInfo.name);
                          }}
                        >
                          {table.name}
                        </span>
                        <span className="text-xs text-vscode-text-tertiary">
                          ({table.columns.length})
                        </span>
                      </div>
                      
                      {expandedTables.has(tableKey) && (
                        <div className="ml-6">
                          {table.columns.map((column) => (
                            <div
                              key={column.name}
                              className="px-3 py-0.5 text-sm hover:bg-vscode-bg-tertiary flex items-center justify-between group"
                            >
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-1 text-vscode-text-tertiary" viewBox="0 0 16 16" fill="currentColor">
                                  <path d="M3.5 2v12h9V2h-9zm1 1h7v10h-7V3z"/>
                                </svg>
                                <span className="text-vscode-text-secondary">{column.name}</span>
                              </div>
                              <span className="text-xs text-vscode-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                                {column.dataType}
                                {!column.nullable && ' NOT NULL'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};