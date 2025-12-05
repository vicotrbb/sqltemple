import React, { useState, useEffect } from "react";
import {
  DatabaseSchema,
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
} from "../../main/database/interfaces";
import { ContextMenu, ContextMenuItem } from "./ContextMenu";
import { TopologyIcon } from "./icons/IconLibrary";

interface SchemaExplorerProps {
  schema: DatabaseSchema | null;
  onTableClick?: (tableName: string, schemaName: string) => void;
  onViewClick?: (viewName: string, schemaName: string) => void;
  onRefresh?: () => void;
  onShowTopology?: (tableName: string, schemaName: string) => void;
}

type SchemaObjectType =
  | "views"
  | "functions"
  | "procedures"
  | "sequences"
  | "triggers"
  | "indexes"
  | "domains";

interface LoadedSchemaObjects {
  [schemaName: string]: {
    views?: ViewInfo[];
    functions?: FunctionInfo[];
    procedures?: ProcedureInfo[];
    sequences?: SequenceInfo[];
    triggers?: TriggerInfo[];
    indexes?: IndexInfo[];
    domains?: DomainInfo[];
  };
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schema,
  onTableClick,
  onViewClick,
  onRefresh,
  onShowTopology,
}) => {
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(
    new Set()
  );
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(
    new Set()
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(
    new Set()
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const [loadedTableColumns, setLoadedTableColumns] = useState<{
    [key: string]: ColumnInfo[];
  }>({});
  const [loadedViewColumns, setLoadedViewColumns] = useState<{
    [key: string]: ColumnInfo[];
  }>({});
  const [loadingObjects, setLoadingObjects] = useState<Set<string>>(new Set());
  const [loadedSchemaObjects, setLoadedSchemaObjects] =
    useState<LoadedSchemaObjects>({});

  useEffect(() => {
    if (schema?.schemas) {
      const tablesExpanded = new Set<string>();
      schema.schemas.forEach((schemaInfo) => {
        if (schemaInfo.tables.length > 0) {
          tablesExpanded.add(`${schemaInfo.name}.Tables`);
        }
      });
      setExpandedSections(tablesExpanded);
    }
  }, [schema]);

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

  const toggleSection = async (
    sectionKey: string,
    schemaName: string,
    objectType: SchemaObjectType
  ) => {
    const newExpanded = new Set(expandedSections);

    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);

      if (
        !loadedSchemaObjects[schemaName]?.[objectType] &&
        !loadingObjects.has(sectionKey)
      ) {
        setLoadingObjects((prev) => new Set(prev).add(sectionKey));

        try {
          let result: any;
          switch (objectType) {
            case "views":
              result = await window.api.getViews(schemaName);
              if (result.success && result.views) {
                setLoadedSchemaObjects((prev) => ({
                  ...prev,
                  [schemaName]: {
                    ...prev[schemaName],
                    views: result.views,
                  },
                }));
              }
              break;
            case "functions":
              result = await window.api.getFunctions(schemaName);
              if (result.success && result.functions) {
                setLoadedSchemaObjects((prev) => ({
                  ...prev,
                  [schemaName]: {
                    ...prev[schemaName],
                    functions: result.functions,
                  },
                }));
              }
              break;
            case "procedures":
              result = await window.api.getProcedures(schemaName);
              if (result.success && result.procedures) {
                setLoadedSchemaObjects((prev) => ({
                  ...prev,
                  [schemaName]: {
                    ...prev[schemaName],
                    procedures: result.procedures,
                  },
                }));
              }
              break;
            case "sequences":
              result = await window.api.getSequences(schemaName);
              if (result.success && result.sequences) {
                setLoadedSchemaObjects((prev) => ({
                  ...prev,
                  [schemaName]: {
                    ...prev[schemaName],
                    sequences: result.sequences,
                  },
                }));
              }
              break;
            case "triggers":
              result = await window.api.getTriggers(schemaName);
              if (result.success && result.triggers) {
                setLoadedSchemaObjects((prev) => ({
                  ...prev,
                  [schemaName]: {
                    ...prev[schemaName],
                    triggers: result.triggers,
                  },
                }));
              }
              break;
            case "indexes":
              result = await window.api.getIndexes(schemaName);
              if (result.success && result.indexes) {
                setLoadedSchemaObjects((prev) => ({
                  ...prev,
                  [schemaName]: {
                    ...prev[schemaName],
                    indexes: result.indexes,
                  },
                }));
              }
              break;
            case "domains":
              result = await window.api.getDomains(schemaName);
              if (result.success && result.domains) {
                setLoadedSchemaObjects((prev) => ({
                  ...prev,
                  [schemaName]: {
                    ...prev[schemaName],
                    domains: result.domains,
                  },
                }));
              }
              break;
          }
        } catch (error) {
          console.error(`Failed to load ${objectType}:`, error);
        } finally {
          setLoadingObjects((prev) => {
            const newSet = new Set(prev);
            newSet.delete(sectionKey);
            return newSet;
          });
        }
      }
    }

    setExpandedSections(newExpanded);
  };

  const toggleObject = async (
    objectKey: string,
    schemaName: string,
    objectName: string,
    objectType: "table" | "view"
  ) => {
    const newExpanded = new Set(expandedObjects);

    if (newExpanded.has(objectKey)) {
      newExpanded.delete(objectKey);
    } else {
      newExpanded.add(objectKey);

      // Load columns if not already loaded
      if (
        objectType === "table" &&
        !loadedTableColumns[objectKey] &&
        !loadingObjects.has(objectKey)
      ) {
        setLoadingObjects((prev) => new Set(prev).add(objectKey));

        try {
          const result = await window.api.getTableColumns(
            schemaName,
            objectName
          );
          if (result.success && result.columns) {
            setLoadedTableColumns((prev) => ({
              ...prev,
              [objectKey]: result.columns!,
            }));
          }
        } catch (error) {
          console.error("Failed to load table columns:", error);
        } finally {
          setLoadingObjects((prev) => {
            const newSet = new Set(prev);
            newSet.delete(objectKey);
            return newSet;
          });
        }
      } else if (
        objectType === "view" &&
        !loadedViewColumns[objectKey] &&
        !loadingObjects.has(objectKey)
      ) {
        setLoadingObjects((prev) => new Set(prev).add(objectKey));

        try {
          const result = await window.api.getViewColumns(
            schemaName,
            objectName
          );
          if (result.success && result.columns) {
            setLoadedViewColumns((prev) => ({
              ...prev,
              [objectKey]: result.columns!,
            }));
          }
        } catch (error) {
          console.error("Failed to load view columns:", error);
        } finally {
          setLoadingObjects((prev) => {
            const newSet = new Set(prev);
            newSet.delete(objectKey);
            return newSet;
          });
        }
      }
    }

    setExpandedObjects(newExpanded);
  };

  const renderColumns = (columns: ColumnInfo[]) => {
    return columns.map((column) => (
      <div
        key={column.name}
        className="px-3 py-0.5 text-sm hover:bg-vscode-bg-tertiary flex items-center justify-between group"
      >
        <div className="flex items-center">
          <svg
            className="w-3 h-3 mr-1 text-vscode-text-tertiary"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M3.5 2v12h9V2h-9zm1 1h7v10h-7V3z" />
          </svg>
          <span className="text-vscode-text-secondary">{column.name}</span>
        </div>
        <span className="text-xs text-vscode-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
          {column.dataType}
          {!column.nullable && " NOT NULL"}
        </span>
      </div>
    ));
  };

  const renderSchemaSection = (
    schemaInfo: SchemaInfo,
    sectionName: string,
    objectType: SchemaObjectType,
    icon: React.ReactNode,
    iconColor: string,
    objects: any[] | undefined,
    renderObject: (obj: any, schemaName: string) => React.ReactNode
  ) => {
    const sectionKey = `${schemaInfo.name}.${sectionName}`;
    const isLoading = loadingObjects.has(sectionKey);
    const isExpanded = expandedSections.has(sectionKey);
    const objectCount = objects?.length || 0;

    return (
      <div key={sectionName}>
        <div
          className="flex items-center px-6 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm"
          onClick={() => toggleSection(sectionKey, schemaInfo.name, objectType)}
        >
          <span className="mr-1 text-vscode-text-tertiary">
            {isExpanded ? "▼" : "▶"}
          </span>
          <div className={`w-4 h-4 mr-1 ${iconColor}`}>{icon}</div>
          <span className="flex-1 font-medium">{sectionName}</span>
          <span className="text-xs text-vscode-text-tertiary">
            ({objectCount})
          </span>
        </div>

        {isExpanded && (
          <div className="ml-6">
            {isLoading ? (
              <div className="px-3 py-1 text-sm text-vscode-text-tertiary flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-vscode-blue border-t-transparent mr-2"></div>
                Loading {sectionName.toLowerCase()}...
              </div>
            ) : objects && objects.length > 0 ? (
              objects.map((obj) => renderObject(obj, schemaInfo.name))
            ) : (
              <div className="px-3 py-1 text-sm text-vscode-text-tertiary">
                No {sectionName.toLowerCase()} found
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!schema) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-vscode-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase text-vscode-text-secondary tracking-wide">
              Explorer
            </h2>
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
          <h2 className="text-sm font-medium uppercase text-vscode-text-secondary tracking-wide">
            Explorer
          </h2>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-vscode-text-tertiary hover:text-vscode-text-secondary transition-colors"
              title="Refresh schema"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M13.5 2.5A6.5 6.5 0 0 0 1 7h1.5a5 5 0 1 1 5 5v1.5A6.5 6.5 0 0 0 13.5 2.5z" />
                <path d="M0 7.5L3 4v7z" />
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
                    {expandedDatabases.has(db.name) ? "▼" : "▶"}
                  </span>
                  <svg
                    className="w-4 h-4 mr-1 text-vscode-purple"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M1 3v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2zm2-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm1 2v1h8V4H4zm0 3v1h8V7H4zm0 3v1h4v-1H4z" />
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
                      label: "Refresh",
                      onClick: () => onRefresh?.(),
                      icon: (
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.5 2.5A6.5 6.5 0 0 0 1 7h1.5a5 5 0 1 1 5 5v1.5A6.5 6.5 0 0 0 13.5 2.5z" />
                          <path d="M0 7.5L3 4v7z" />
                        </svg>
                      ),
                    },
                  ],
                });
              }}
            >
              <span className="mr-1 text-vscode-text-tertiary">
                {expandedSchemas.has(schemaInfo.name) ? "▼" : "▶"}
              </span>
              <svg
                className="w-4 h-4 mr-1 text-vscode-yellow"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M1.5 1l1-1h11l1 1v3l-1 1v8l-1 1h-11l-1-1v-11zm1 1v10h10v-8h-10v-2zm0-1h10v1h-10z" />
              </svg>
              <span className="flex-1 font-medium">{schemaInfo.name}</span>
            </div>

            {expandedSchemas.has(schemaInfo.name) && (
              <div className="ml-3">
                {/* Tables Section */}
                <div>
                  <div
                    className="flex items-center px-6 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm"
                    onClick={() => {
                      const sectionKey = `${schemaInfo.name}.Tables`;
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has(sectionKey)) {
                        newExpanded.delete(sectionKey);
                      } else {
                        newExpanded.add(sectionKey);
                      }
                      setExpandedSections(newExpanded);
                    }}
                  >
                    <span className="mr-1 text-vscode-text-tertiary">
                      {expandedSections.has(`${schemaInfo.name}.Tables`)
                        ? "▼"
                        : "▶"}
                    </span>
                    <div className="w-4 h-4 mr-1 text-vscode-blue">
                      <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M14 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6.5L14 5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H3v12h10V4.5z" />
                      </svg>
                    </div>
                    <span className="flex-1 font-medium">Tables</span>
                    <span className="text-xs text-vscode-text-tertiary">
                      ({schemaInfo.tables.length})
                    </span>
                  </div>

                  {expandedSections.has(`${schemaInfo.name}.Tables`) && (
                    <div className="ml-6">
                      {schemaInfo.tables.map((table: TableInfo) => {
                        const tableKey = `${schemaInfo.name}.${table.name}`;
                        const columns =
                          loadedTableColumns[tableKey] || table.columns;
                        const isLoading = loadingObjects.has(tableKey);
                        const isExpanded = expandedObjects.has(tableKey);

                        return (
                          <div key={tableKey}>
                            <div
                              className="flex items-center px-3 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm"
                              onClick={() =>
                                toggleObject(
                                  tableKey,
                                  schemaInfo.name,
                                  table.name,
                                  "table"
                                )
                              }
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  items: [
                                    {
                                      label: "See Topology",
                                      onClick: () => {
                                        onShowTopology?.(
                                          table.name,
                                          schemaInfo.name
                                        );
                                        setContextMenu(null);
                                      },
                                      icon: <TopologyIcon size={14} />,
                                    },
                                    { divider: true },
                                    {
                                      label: "Select from Table",
                                      onClick: () => {
                                        onTableClick?.(
                                          table.name,
                                          schemaInfo.name
                                        );
                                        setContextMenu(null);
                                      },
                                      icon: (
                                        <svg
                                          viewBox="0 0 16 16"
                                          fill="currentColor"
                                        >
                                          <path d="M14 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6.5L14 5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H3v12h10V4.5z" />
                                        </svg>
                                      ),
                                    },
                                  ],
                                });
                              }}
                            >
                              <span className="mr-1 text-vscode-text-tertiary">
                                {isExpanded ? "▼" : "▶"}
                              </span>
                              <svg
                                className="w-4 h-4 mr-1 text-vscode-blue"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <path d="M14 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6.5L14 5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H3v12h10V4.5z" />
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
                                (
                                {table.columnCount !== undefined
                                  ? table.columnCount
                                  : columns.length}
                                )
                              </span>
                            </div>

                            {isExpanded && (
                              <div className="ml-6">
                                {isLoading ? (
                                  <div className="px-3 py-1 text-sm text-vscode-text-tertiary flex items-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-vscode-blue border-t-transparent mr-2"></div>
                                    Loading columns...
                                  </div>
                                ) : columns.length > 0 ? (
                                  renderColumns(columns)
                                ) : (
                                  <div className="px-3 py-1 text-sm text-vscode-text-tertiary">
                                    No columns found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Views Section */}
                {renderSchemaSection(
                  schemaInfo,
                  "Views",
                  "views",
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11zM2.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-11z" />
                    <path d="M7.5 5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0v-5zm2 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3zm2 0a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1z" />
                  </svg>,
                  "text-vscode-green",
                  loadedSchemaObjects[schemaInfo.name]?.views,
                  (view: ViewInfo, schemaName: string) => {
                    const viewKey = `${schemaName}.view.${view.name}`;
                    const columns = loadedViewColumns[viewKey] || [];
                    const isLoading = loadingObjects.has(viewKey);
                    const isExpanded = expandedObjects.has(viewKey);

                    return (
                      <div key={viewKey}>
                        <div
                          className="flex items-center px-3 py-1 hover:bg-vscode-bg-tertiary cursor-pointer text-sm"
                          onClick={() =>
                            toggleObject(viewKey, schemaName, view.name, "view")
                          }
                        >
                          <span className="mr-1 text-vscode-text-tertiary">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                          <svg
                            className="w-4 h-4 mr-1 text-vscode-green"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11zM2.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-11z" />
                            <path d="M7.5 5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0v-5zm2 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3zm2 0a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1z" />
                          </svg>
                          <span
                            className="flex-1 text-vscode-text hover:text-vscode-green transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewClick?.(view.name, schemaName);
                            }}
                          >
                            {view.name}
                          </span>
                          <span className="text-xs text-vscode-text-tertiary">
                            ({view.columnCount || columns.length})
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="ml-6">
                            {isLoading ? (
                              <div className="px-3 py-1 text-sm text-vscode-text-tertiary flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-vscode-green border-t-transparent mr-2"></div>
                                Loading columns...
                              </div>
                            ) : columns.length > 0 ? (
                              renderColumns(columns)
                            ) : (
                              <div className="px-3 py-1 text-sm text-vscode-text-tertiary">
                                No columns found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}

                {/* Functions Section */}
                {renderSchemaSection(
                  schemaInfo,
                  "Functions",
                  "functions",
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a2 2 0 0 0-2 2v4H3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-4a2 2 0 0 0 2-2V5h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H8z" />
                  </svg>,
                  "text-vscode-purple",
                  loadedSchemaObjects[schemaInfo.name]?.functions,
                  (func: FunctionInfo) => (
                    <div
                      key={func.name}
                      className="px-3 py-0.5 text-sm hover:bg-vscode-bg-tertiary flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-3 h-3 mr-1 text-vscode-purple"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 1a2 2 0 0 0-2 2v4H3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-4a2 2 0 0 0 2-2V5h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H8z" />
                        </svg>
                        <span className="text-vscode-text-secondary">
                          {func.name}
                        </span>
                      </div>
                      <span className="text-xs text-vscode-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                        {func.returnType} • {func.language}
                      </span>
                    </div>
                  )
                )}

                {/* Procedures Section */}
                {renderSchemaSection(
                  schemaInfo,
                  "Procedures",
                  "procedures",
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
                    <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                  </svg>,
                  "text-vscode-orange",
                  loadedSchemaObjects[schemaInfo.name]?.procedures,
                  (proc: ProcedureInfo) => (
                    <div
                      key={proc.name}
                      className="px-3 py-0.5 text-sm hover:bg-vscode-bg-tertiary flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-3 h-3 mr-1 text-vscode-orange"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
                          <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                        </svg>
                        <span className="text-vscode-text-secondary">
                          {proc.name}
                        </span>
                      </div>
                      <span className="text-xs text-vscode-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                        {proc.language}
                      </span>
                    </div>
                  )
                )}

                {/* Sequences Section */}
                {renderSchemaSection(
                  schemaInfo,
                  "Sequences",
                  "sequences",
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                  </svg>,
                  "text-vscode-cyan",
                  loadedSchemaObjects[schemaInfo.name]?.sequences,
                  (seq: SequenceInfo) => (
                    <div
                      key={seq.name}
                      className="px-3 py-0.5 text-sm hover:bg-vscode-bg-tertiary flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-3 h-3 mr-1 text-vscode-cyan"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                        </svg>
                        <span className="text-vscode-text-secondary">
                          {seq.name}
                        </span>
                      </div>
                      <span className="text-xs text-vscode-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                        {seq.dataType}
                      </span>
                    </div>
                  )
                )}

                {/* Triggers Section */}
                {renderSchemaSection(
                  schemaInfo,
                  "Triggers",
                  "triggers",
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
                  </svg>,
                  "text-vscode-red",
                  loadedSchemaObjects[schemaInfo.name]?.triggers,
                  (trigger: TriggerInfo) => (
                    <div
                      key={trigger.name}
                      className="px-3 py-0.5 text-sm hover:bg-vscode-bg-tertiary flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-3 h-3 mr-1 text-vscode-red"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
                        </svg>
                        <span className="text-vscode-text-secondary">
                          {trigger.name}
                        </span>
                      </div>
                      <span className="text-xs text-vscode-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                        on {trigger.tableName} • {trigger.actionTiming}
                      </span>
                    </div>
                  )
                )}

                {/* Indexes Section */}
                {renderSchemaSection(
                  schemaInfo,
                  "Indexes",
                  "indexes",
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z" />
                    <path
                      fillRule="evenodd"
                      d="M14 11V2h1v9h-1zM6 3v10H5V3h1z"
                    />
                    <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z" />
                  </svg>,
                  "text-vscode-pink",
                  loadedSchemaObjects[schemaInfo.name]?.indexes,
                  (index: IndexInfo) => (
                    <div
                      key={index.name}
                      className="px-3 py-0.5 text-sm hover:bg-vscode-bg-tertiary group"
                      title={index.definition}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          <svg
                            className="w-3 h-3 mr-1 text-vscode-pink flex-shrink-0"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z" />
                            <path
                              fillRule="evenodd"
                              d="M14 11V2h1v9h-1zM6 3v10H5V3h1z"
                            />
                            <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z" />
                          </svg>
                          <span className="text-vscode-text-secondary truncate">
                            {index.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index.isPrimary && (
                            <span className="text-xs px-1 py-0.5 bg-vscode-blue bg-opacity-20 text-vscode-blue rounded">
                              PK
                            </span>
                          )}
                          {index.isUnique && !index.isPrimary && (
                            <span className="text-xs px-1 py-0.5 bg-vscode-green bg-opacity-20 text-vscode-green rounded">
                              UQ
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-vscode-text-tertiary ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        on {index.tableName}
                      </div>
                    </div>
                  )
                )}

                {/* Domains Section */}
                {renderSchemaSection(
                  schemaInfo,
                  "Domains",
                  "domains",
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4v8z" />
                  </svg>,
                  "text-vscode-brown",
                  loadedSchemaObjects[schemaInfo.name]?.domains,
                  (domain: DomainInfo) => (
                    <div
                      key={domain.name}
                      className="px-3 py-0.5 text-sm hover:bg-vscode-bg-tertiary flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-3 h-3 mr-1 text-vscode-brown"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4v8z" />
                        </svg>
                        <span className="text-vscode-text-secondary">
                          {domain.name}
                        </span>
                      </div>
                      <span className="text-xs text-vscode-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                        {domain.dataType}
                        {!domain.nullable && " NOT NULL"}
                      </span>
                    </div>
                  )
                )}
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
