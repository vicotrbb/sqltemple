import React, { useState, useEffect } from "react";
import { ExplorerNode } from "./ExplorerNode";
import { ContextMenu, ContextMenuItem } from "./ContextMenu";
import {
  ServerIcon,
  FolderIcon,
  SchemaIcon,
  TableIcon,
  ViewIcon,
  FunctionIcon,
  ProcedureIcon,
  SequenceIcon,
  TriggerIcon,
  IndexIcon,
  DomainIcon,
  ColumnIcon,
  AddConnectionIcon,
  RefreshIcon,
} from "./icons/IconLibrary";
import {
  DatabaseConnectionConfig,
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

interface UnifiedExplorerProps {
  currentConnection: DatabaseConnectionConfig | null;
  schema: DatabaseSchema | null;
  onConnect: (config: DatabaseConnectionConfig) => void;
  onDisconnect: () => void;
  onEdit: (config: DatabaseConnectionConfig) => void;
  onRefresh: () => void;
  onTableClick?: (tableName: string, schemaName: string) => void;
  onViewClick?: (viewName: string, schemaName: string) => void;
  onShowTopology?: (tableName: string, schemaName: string) => void;
  onShowConnectionManager?: () => void;
  onTableDoubleClick?: (tableName: string, schemaName: string) => void;
  showConnectionsPanel?: boolean;
  showSchemaExplorer?: boolean;
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

export const UnifiedExplorer: React.FC<UnifiedExplorerProps> = ({
  currentConnection,
  schema,
  onConnect,
  onDisconnect,
  onEdit,
  onRefresh,
  onTableClick,
  onViewClick,
  onShowTopology,
  onShowConnectionManager,
  onTableDoubleClick,
  showConnectionsPanel = true,
  showSchemaExplorer = true,
}) => {
  const [connections, setConnections] = useState<DatabaseConnectionConfig[]>(
    []
  );
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(
    new Set()
  );
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

  const [loadedTableColumns, setLoadedTableColumns] = useState<{
    [key: string]: ColumnInfo[];
  }>({});
  const [loadedViewColumns, setLoadedViewColumns] = useState<{
    [key: string]: ColumnInfo[];
  }>({});
  const [loadingObjects, setLoadingObjects] = useState<Set<string>>(new Set());
  const [loadedSchemaObjects, setLoadedSchemaObjects] =
    useState<LoadedSchemaObjects>({});

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    // Auto-expand current connection when connected
    if (currentConnection?.id) {
      setExpandedConnections((prev) =>
        new Set(prev).add(currentConnection.id!.toString())
      );
    }
  }, [currentConnection]);

  useEffect(() => {
    // Auto-expand schemas with tables when schema loads
    if (schema?.schemas) {
      const tablesExpanded = new Set<string>();
      schema.schemas.forEach((schemaInfo) => {
        if (schemaInfo.tables.length > 0) {
          tablesExpanded.add(`${schemaInfo.name}.Tables`);
        }
      });
      setExpandedSections((prev) => new Set([...prev, ...tablesExpanded]));
    }
  }, [schema]);

  const loadConnections = async () => {
    const result = await window.api.getConnections();
    if (result.success && result.connections) {
      setConnections(result.connections);
    }
  };

  const toggleConnection = (connectionId: string) => {
    const newExpanded = new Set(expandedConnections);
    if (newExpanded.has(connectionId)) {
      newExpanded.delete(connectionId);
    } else {
      newExpanded.add(connectionId);
    }
    setExpandedConnections(newExpanded);
  };

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
                  [schemaName]: { ...prev[schemaName], views: result.views },
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

  const handleConnectionContextMenu = (
    e: React.MouseEvent,
    conn: DatabaseConnectionConfig
  ) => {
    e.preventDefault();
    const isConnected = currentConnection?.id === conn.id;

    const items: ContextMenuItem[] = [];

    if (isConnected) {
      items.push({
        label: "Refresh",
        onClick: onRefresh,
        icon: <RefreshIcon size={14} />,
      });
      items.push({
        label: "Disconnect",
        onClick: onDisconnect,
        icon: <ServerIcon size={14} />,
      });
    } else {
      items.push({
        label: "Connect",
        onClick: () => onConnect(conn),
        icon: <ServerIcon size={14} />,
      });
    }

    items.push({ divider: true });

    items.push({
      label: "Edit Connection",
      onClick: () => onEdit(conn),
      icon: <RefreshIcon size={14} />,
    });

    items.push({
      label: "Delete Connection",
      onClick: async () => {
        if (conn.id && confirm(`Delete connection "${conn.name}"?`)) {
          await window.api.deleteConnection(conn.id);
          loadConnections();
        }
      },
      icon: <RefreshIcon size={14} />,
      disabled: isConnected,
    });

    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const handleTableContextMenu = (
    e: React.MouseEvent,
    table: TableInfo,
    schemaName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [
      {
        label: "See Topology",
        onClick: () => {
          onShowTopology?.(table.name, schemaName);
          setContextMenu(null);
        },
        icon: <RefreshIcon size={14} />,
      },
      { divider: true },
      {
        label: "Select from Table",
        onClick: () => {
          onTableClick?.(table.name, schemaName);
          setContextMenu(null);
        },
        icon: <TableIcon size={14} />,
      },
    ];

    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const handleTableDoubleClick = (table: TableInfo, schemaName: string) => {
    onTableDoubleClick?.(table.name, schemaName);
  };

  const renderColumns = (columns: ColumnInfo[]) => {
    if (!columns) return null;
    return columns.map((column) => (
      <ExplorerNode
        key={column.name}
        id={column.name}
        label={column.name}
        icon={<ColumnIcon size={12} />}
        iconColor="text-vscode-text-tertiary"
        level={5}
        hasChildren={false}
      />
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
      <ExplorerNode
        key={sectionName}
        id={sectionKey}
        label={sectionName}
        icon={icon}
        iconColor={iconColor}
        count={objectCount}
        isExpanded={isExpanded}
        isLoading={isLoading}
        level={3}
        hasChildren={true}
        onClick={() => toggleSection(sectionKey, schemaInfo.name, objectType)}
      >
        {isExpanded && objects && objects.length > 0 && (
          <div>{objects.map((obj) => renderObject(obj, schemaInfo.name))}</div>
        )}
        {isExpanded && (!objects || objects.length === 0) && !isLoading && (
          <ExplorerNode
            id={`${sectionKey}-empty`}
            label={`No ${sectionName.toLowerCase()} found`}
            level={4}
            hasChildren={false}
          />
        )}
      </ExplorerNode>
    );
  };

  const renderAddConnection = () => (
    <ExplorerNode
      id="add-connection"
      label="Add New Connection"
      icon={<AddConnectionIcon size={16} />}
      iconColor="text-vscode-blue"
      level={0}
      hasChildren={false}
      onClick={() => {
        onShowConnectionManager?.();
      }}
    />
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-vscode-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase text-vscode-text-secondary tracking-wide">
            Explorer
          </h2>
          <button
            onClick={loadConnections}
            className="text-vscode-text-tertiary hover:text-vscode-text-secondary transition-colors"
            title="Refresh connections"
          >
            <RefreshIcon size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!showConnectionsPanel && (
          <div className="p-4 text-sm text-vscode-text-tertiary">
            Connections panel hidden. Use View &gt; Toggle Connections Panel to
            show it again.
          </div>
        )}

        {showConnectionsPanel && connections.length === 0 && (
          <div className="p-4 text-sm text-vscode-text-tertiary">
            No saved connections. Add a new connection to get started.
          </div>
        )}

        {showConnectionsPanel &&
          connections.length > 0 &&
          connections.map((conn) => {
            const isConnected = currentConnection?.id === conn.id;
            const connectionId = conn.id!.toString();
            const isExpanded = expandedConnections.has(connectionId);

            return (
              <ExplorerNode
                key={conn.id}
                id={connectionId}
                label={`${conn.name} (${conn.host}:${conn.port}/${conn.database})`}
                icon={<ServerIcon size={16} />}
                iconColor={
                  isConnected
                    ? "text-vscode-green"
                    : "text-vscode-text-secondary"
                }
                isExpanded={isExpanded}
                isConnected={isConnected}
                level={0}
                hasChildren={true}
                onClick={() => {
                  if (!isConnected) {
                    onConnect(conn);
                  } else {
                    toggleConnection(connectionId);
                  }
                }}
                onContextMenu={(e) => handleConnectionContextMenu(e, conn)}
              >
                {isExpanded &&
                  isConnected &&
                  schema &&
                  (showSchemaExplorer ? (
                    <div>
                      {/* Databases Section */}
                      {schema.databases && schema.databases.length > 0 && (
                        <div>
                          {schema.databases.map((db) => (
                            <ExplorerNode
                              key={db.name}
                              id={db.name}
                              label={db.name}
                              icon={<FolderIcon size={16} />}
                              iconColor="text-vscode-purple"
                              isExpanded={expandedDatabases.has(db.name)}
                              level={1}
                              hasChildren={true}
                              onClick={() => toggleDatabase(db.name)}
                            >
                              {expandedDatabases.has(db.name) && db.owner && (
                                <ExplorerNode
                                  id={`${db.name}-owner`}
                                  label={`Owner: ${db.owner}`}
                                  level={2}
                                  hasChildren={false}
                                />
                              )}
                            </ExplorerNode>
                          ))}
                        </div>
                      )}

                      {/* Schemas Section */}
                      {schema.schemas &&
                        schema.schemas.map((schemaInfo: SchemaInfo) => (
                          <ExplorerNode
                            key={schemaInfo.name}
                            id={schemaInfo.name}
                            label={schemaInfo.name}
                            icon={<SchemaIcon size={16} />}
                            iconColor="text-vscode-yellow"
                            isExpanded={expandedSchemas.has(schemaInfo.name)}
                            level={
                              schema.databases && schema.databases.length > 0
                                ? 2
                                : 1
                            }
                            hasChildren={true}
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
                                    icon: <RefreshIcon size={14} />,
                                  },
                                ],
                              });
                            }}
                          >
                            {expandedSchemas.has(schemaInfo.name) && (
                              <div>
                                {/* Tables Section */}
                                <ExplorerNode
                                  id={`${schemaInfo.name}.Tables`}
                                  label="Tables"
                                  icon={<TableIcon size={16} />}
                                  iconColor="text-vscode-blue"
                                  count={schemaInfo.tables.length}
                                  isExpanded={expandedSections.has(
                                    `${schemaInfo.name}.Tables`
                                  )}
                                  level={
                                    schema.databases &&
                                    schema.databases.length > 0
                                      ? 3
                                      : 2
                                  }
                                  hasChildren={true}
                                  onClick={() => {
                                    const sectionKey = `${schemaInfo.name}.Tables`;
                                    const newExpanded = new Set(
                                      expandedSections
                                    );
                                    if (newExpanded.has(sectionKey)) {
                                      newExpanded.delete(sectionKey);
                                    } else {
                                      newExpanded.add(sectionKey);
                                    }
                                    setExpandedSections(newExpanded);
                                  }}
                                >
                                  {expandedSections.has(
                                    `${schemaInfo.name}.Tables`
                                  ) && (
                                    <div>
                                      {schemaInfo.tables &&
                                        schemaInfo.tables.map(
                                          (table: TableInfo) => {
                                            const tableKey = `${schemaInfo.name}.${table.name}`;
                                            const columns =
                                              loadedTableColumns[tableKey] ||
                                              table.columns;
                                            const isLoading =
                                              loadingObjects.has(tableKey);
                                            const isExpanded =
                                              expandedObjects.has(tableKey);

                                            return (
                                              <ExplorerNode
                                                key={tableKey}
                                                id={tableKey}
                                                label={table.name}
                                                icon={<TableIcon size={16} />}
                                                iconColor="text-vscode-blue"
                                                count={
                                                  table.columnCount !==
                                                  undefined
                                                    ? table.columnCount
                                                    : columns.length
                                                }
                                                isExpanded={isExpanded}
                                                isLoading={isLoading}
                                                level={
                                                  schema.databases &&
                                                  schema.databases.length > 0
                                                    ? 4
                                                    : 3
                                                }
                                                hasChildren={true}
                                                onClick={() =>
                                                  toggleObject(
                                                    tableKey,
                                                    schemaInfo.name,
                                                    table.name,
                                                    "table"
                                                  )
                                                }
                                                onDoubleClick={() =>
                                                  handleTableDoubleClick(
                                                    table,
                                                    schemaInfo.name
                                                  )
                                                }
                                                onContextMenu={(e) =>
                                                  handleTableContextMenu(
                                                    e,
                                                    table,
                                                    schemaInfo.name
                                                  )
                                                }
                                              >
                                                {isExpanded &&
                                                  columns.length > 0 &&
                                                  renderColumns(columns)}
                                                {isExpanded &&
                                                  columns.length === 0 &&
                                                  !isLoading && (
                                                    <ExplorerNode
                                                      id={`${tableKey}-no-columns`}
                                                      label="No columns found"
                                                      level={
                                                        schema.databases &&
                                                        schema.databases
                                                          .length > 0
                                                          ? 5
                                                          : 4
                                                      }
                                                      hasChildren={false}
                                                    />
                                                  )}
                                              </ExplorerNode>
                                            );
                                          }
                                        )}
                                    </div>
                                  )}
                                </ExplorerNode>

                                {/* Views Section */}
                                {renderSchemaSection(
                                  schemaInfo,
                                  "Views",
                                  "views",
                                  <ViewIcon size={16} />,
                                  "text-vscode-green",
                                  loadedSchemaObjects[schemaInfo.name]?.views,
                                  (view: ViewInfo, schemaName: string) => {
                                    const viewKey = `${schemaName}.view.${view.name}`;
                                    const columns =
                                      loadedViewColumns[viewKey] || [];
                                    const isLoading =
                                      loadingObjects.has(viewKey);
                                    const isExpanded =
                                      expandedObjects.has(viewKey);

                                    return (
                                      <ExplorerNode
                                        key={viewKey}
                                        id={viewKey}
                                        label={view.name}
                                        icon={<ViewIcon size={16} />}
                                        iconColor="text-vscode-green"
                                        count={
                                          view.columnCount || columns.length
                                        }
                                        isExpanded={isExpanded}
                                        isLoading={isLoading}
                                        level={
                                          schema.databases &&
                                          schema.databases.length > 0
                                            ? 4
                                            : 3
                                        }
                                        hasChildren={true}
                                        onClick={() =>
                                          toggleObject(
                                            viewKey,
                                            schemaName,
                                            view.name,
                                            "view"
                                          )
                                        }
                                      >
                                        {isExpanded &&
                                          columns.length > 0 &&
                                          renderColumns(columns)}
                                        {isExpanded &&
                                          columns.length === 0 &&
                                          !isLoading && (
                                            <ExplorerNode
                                              id={`${viewKey}-no-columns`}
                                              label="No columns found"
                                              level={
                                                schema.databases &&
                                                schema.databases.length > 0
                                                  ? 5
                                                  : 4
                                              }
                                              hasChildren={false}
                                            />
                                          )}
                                      </ExplorerNode>
                                    );
                                  }
                                )}

                                {/* Functions Section */}
                                {renderSchemaSection(
                                  schemaInfo,
                                  "Functions",
                                  "functions",
                                  <FunctionIcon size={16} />,
                                  "text-vscode-purple",
                                  loadedSchemaObjects[schemaInfo.name]
                                    ?.functions,
                                  (func: FunctionInfo) => (
                                    <ExplorerNode
                                      key={func.name}
                                      id={func.name}
                                      label={func.name}
                                      icon={<FunctionIcon size={16} />}
                                      iconColor="text-vscode-purple"
                                      level={
                                        schema.databases &&
                                        schema.databases.length > 0
                                          ? 4
                                          : 3
                                      }
                                      hasChildren={false}
                                    />
                                  )
                                )}

                                {/* Procedures Section */}
                                {renderSchemaSection(
                                  schemaInfo,
                                  "Procedures",
                                  "procedures",
                                  <ProcedureIcon size={16} />,
                                  "text-vscode-orange",
                                  loadedSchemaObjects[schemaInfo.name]
                                    ?.procedures,
                                  (proc: ProcedureInfo) => (
                                    <ExplorerNode
                                      key={proc.name}
                                      id={proc.name}
                                      label={proc.name}
                                      icon={<ProcedureIcon size={16} />}
                                      iconColor="text-vscode-orange"
                                      level={
                                        schema.databases &&
                                        schema.databases.length > 0
                                          ? 4
                                          : 3
                                      }
                                      hasChildren={false}
                                    />
                                  )
                                )}

                                {/* Sequences Section */}
                                {renderSchemaSection(
                                  schemaInfo,
                                  "Sequences",
                                  "sequences",
                                  <SequenceIcon size={16} />,
                                  "text-vscode-cyan",
                                  loadedSchemaObjects[schemaInfo.name]
                                    ?.sequences,
                                  (seq: SequenceInfo) => (
                                    <ExplorerNode
                                      key={seq.name}
                                      id={seq.name}
                                      label={seq.name}
                                      icon={<SequenceIcon size={16} />}
                                      iconColor="text-vscode-cyan"
                                      level={
                                        schema.databases &&
                                        schema.databases.length > 0
                                          ? 4
                                          : 3
                                      }
                                      hasChildren={false}
                                    />
                                  )
                                )}

                                {/* Triggers Section */}
                                {renderSchemaSection(
                                  schemaInfo,
                                  "Triggers",
                                  "triggers",
                                  <TriggerIcon size={16} />,
                                  "text-vscode-red",
                                  loadedSchemaObjects[schemaInfo.name]
                                    ?.triggers,
                                  (trigger: TriggerInfo) => (
                                    <ExplorerNode
                                      key={trigger.name}
                                      id={trigger.name}
                                      label={trigger.name}
                                      icon={<TriggerIcon size={16} />}
                                      iconColor="text-vscode-red"
                                      level={
                                        schema.databases &&
                                        schema.databases.length > 0
                                          ? 4
                                          : 3
                                      }
                                      hasChildren={false}
                                    />
                                  )
                                )}

                                {/* Indexes Section */}
                                {renderSchemaSection(
                                  schemaInfo,
                                  "Indexes",
                                  "indexes",
                                  <IndexIcon size={16} />,
                                  "text-vscode-pink",
                                  loadedSchemaObjects[schemaInfo.name]?.indexes,
                                  (index: IndexInfo) => (
                                    <ExplorerNode
                                      key={index.name}
                                      id={index.name}
                                      label={index.name}
                                      icon={<IndexIcon size={16} />}
                                      iconColor="text-vscode-pink"
                                      level={
                                        schema.databases &&
                                        schema.databases.length > 0
                                          ? 4
                                          : 3
                                      }
                                      hasChildren={false}
                                    />
                                  )
                                )}

                                {/* Domains Section */}
                                {renderSchemaSection(
                                  schemaInfo,
                                  "Domains",
                                  "domains",
                                  <DomainIcon size={16} />,
                                  "text-vscode-brown",
                                  loadedSchemaObjects[schemaInfo.name]?.domains,
                                  (domain: DomainInfo) => (
                                    <ExplorerNode
                                      key={domain.name}
                                      id={domain.name}
                                      label={domain.name}
                                      icon={<DomainIcon size={16} />}
                                      iconColor="text-vscode-brown"
                                      level={
                                        schema.databases &&
                                        schema.databases.length > 0
                                          ? 4
                                          : 3
                                      }
                                      hasChildren={false}
                                    />
                                  )
                                )}
                              </div>
                            )}
                          </ExplorerNode>
                        ))}
                    </div>
                  ) : (
                    <ExplorerNode
                      id={`${connectionId}-schema-hidden`}
                      label="Schema explorer hidden. Use View &gt; Toggle Schema Explorer to show it."
                      level={1}
                      hasChildren={false}
                    />
                  ))}

                {isExpanded && !isConnected && (
                  <ExplorerNode
                    id={`${connectionId}-not-connected`}
                    label="Not connected"
                    level={1}
                    hasChildren={false}
                  />
                )}
              </ExplorerNode>
            );
          })}

        {showConnectionsPanel && renderAddConnection()}
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
