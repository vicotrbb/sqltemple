import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnInfo,
  QueryResult,
  TableDetails as TableDetailsMeta,
  TableColumnDetail,
} from "../../main/database/interfaces";
import { ResultsGrid } from "./ResultsGrid";
import {
  RefreshIcon,
  TableIcon,
  DatabaseIcon,
  IndexIcon,
  TriggerIcon,
  ConnectIcon,
  ViewIcon,
  LoadingIcon,
} from "./icons/IconLibrary";

interface TableDetailsViewProps {
  schema: string;
  table: string;
  connectionName?: string;
  onOpenInEditor?: (sql: string, title?: string) => void;
}

interface DataState {
  columns: ColumnInfo[];
  rows: any[];
  nextOffset: number;
  hasMore: boolean;
  isLoading: boolean;
  isAppending: boolean;
  error: string | null;
}

interface DetailsState {
  data: TableDetailsMeta | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_DATA_STATE: DataState = {
  columns: [],
  rows: [],
  nextOffset: 0,
  hasMore: true,
  isLoading: true,
  isAppending: false,
  error: null,
};

const INITIAL_DETAILS_STATE: DetailsState = {
  data: null,
  isLoading: true,
  error: null,
};

export const TableDetailsView: React.FC<TableDetailsViewProps> = ({
  schema,
  table,
  connectionName,
  onOpenInEditor,
}) => {
  const [activeTab, setActiveTab] = useState<"data" | "details">("data");
  const [dataState, setDataState] = useState<DataState>(INITIAL_DATA_STATE);
  const [detailsState, setDetailsState] = useState<DetailsState>(
    INITIAL_DETAILS_STATE
  );

  useEffect(() => {
    setActiveTab("data");
    setDataState(INITIAL_DATA_STATE);
    setDetailsState(INITIAL_DETAILS_STATE);
    fetchInitialData();
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, table]);

  const fetchInitialData = async () => {
    await fetchDataPage(0, true);
  };

  const fetchDataPage = async (offset: number, reset = false) => {
    setDataState((prev) => ({
      ...prev,
      isLoading: reset,
      isAppending: !reset,
      error: null,
    }));

    try {
      const response = await window.api.getTableData(
        schema,
        table,
        100,
        offset
      );
      if (response.success && response.page) {
        setDataState((prev) => {
          const columns =
            reset || prev.columns.length === 0
              ? response.page.columns || []
              : prev.columns;

          const rows = reset
            ? response.page.rows || []
            : [...prev.rows, ...(response.page.rows || [])];

          return {
            columns,
            rows,
            nextOffset: response.page.nextOffset || rows.length,
            hasMore: Boolean(response.page.hasMore),
            isLoading: false,
            isAppending: false,
            error: null,
          };
        });
      } else {
        setDataState((prev) => ({
          ...prev,
          isLoading: false,
          isAppending: false,
          error: response.error || "Unable to load table data.",
        }));
      }
    } catch (error) {
      setDataState((prev) => ({
        ...prev,
        isLoading: false,
        isAppending: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while loading data.",
      }));
    }
  };

  const fetchDetails = async () => {
    setDetailsState({ data: null, isLoading: true, error: null });
    try {
      const response = await window.api.getTableDetails(schema, table);
      if (response.success && response.details) {
        setDetailsState({
          data: response.details,
          isLoading: false,
          error: null,
        });
      } else {
        setDetailsState({
          data: null,
          isLoading: false,
          error: response.error || "Unable to load table metadata.",
        });
      }
    } catch (error) {
      setDetailsState({
        data: null,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while loading metadata.",
      });
    }
  };

  const handleLoadMoreRows = () => {
    if (!dataState.hasMore || dataState.isLoading || dataState.isAppending) {
      return;
    }
    fetchDataPage(dataState.nextOffset, false);
  };

  const refreshData = () => fetchDataPage(0, true);

  const dataResult: QueryResult | null = useMemo(() => {
    if (dataState.columns.length === 0) {
      return null;
    }
    return {
      columns: dataState.columns,
      rows: dataState.rows,
      rowCount: dataState.rows.length,
      duration: 0,
    };
  }, [dataState.columns, dataState.rows]);

  const outgoingRelationships = useMemo(
    () =>
      detailsState.data?.relationships.filter(
        (rel) => rel.direction === "outgoing"
      ) || [],
    [detailsState.data]
  );

  const incomingRelationships = useMemo(
    () =>
      detailsState.data?.relationships.filter(
        (rel) => rel.direction === "incoming"
      ) || [],
    [detailsState.data]
  );

  const handleOpenSelectQuery = () => {
    if (!onOpenInEditor) return;
    const sql = `SELECT * FROM ${schema}.${table} LIMIT 100;`;
    onOpenInEditor(sql, table);
  };

  const renderDataTab = () => (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-vscode-bg-secondary border-b border-vscode-border px-3 py-2">
        <div className="flex items-center space-x-2 text-sm">
          <TableIcon className="w-4 h-4 text-vscode-text-secondary" />
          <span className="text-vscode-text">
            {dataState.rows.length.toLocaleString()} row
            {dataState.rows.length === 1 ? "" : "s"} loaded
          </span>
          {dataState.hasMore && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-vscode-bg text-vscode-text-secondary border border-vscode-border">
              More available
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onOpenInEditor && (
            <button
              onClick={handleOpenSelectQuery}
              className="px-3 py-1 text-xs rounded bg-vscode-blue text-white hover:bg-vscode-blue-light transition-colors"
            >
              Open Query Tab
            </button>
          )}
          <button
            onClick={refreshData}
            className="px-3 py-1 text-xs rounded border border-vscode-border text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-bg-tertiary transition-colors flex items-center space-x-2"
            disabled={dataState.isLoading}
          >
            <RefreshIcon className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {dataState.error && (
        <div className="p-3 text-sm text-vscode-red bg-vscode-red bg-opacity-10 border-b border-vscode-red border-opacity-30">
          {dataState.error}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <ResultsGrid
          result={dataResult}
          isLoading={dataState.isLoading}
          currentQuery={`SELECT * FROM ${schema}.${table}`}
          onLoadMore={handleLoadMoreRows}
          hasMore={dataState.hasMore}
          isAppending={dataState.isAppending}
        />
      </div>
    </div>
  );

  const renderColumnStats = (column: TableColumnDetail) => (
    <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-vscode-text-secondary">
      <div>
        <span className="font-medium text-vscode-text">Distinct</span>
        <div>
          {column.statistics?.distinctValues !== null &&
          column.statistics?.distinctValues !== undefined
            ? column.statistics.distinctValues
            : "—"}
        </div>
      </div>
      <div>
        <span className="font-medium text-vscode-text">Null %</span>
        <div>
          {column.statistics?.nullFraction !== null &&
          column.statistics?.nullFraction !== undefined
            ? `${(column.statistics.nullFraction * 100).toFixed(2)}%`
            : "—"}
        </div>
      </div>
      <div>
        <span className="font-medium text-vscode-text">Avg width</span>
        <div>
          {column.statistics?.averageWidth !== null &&
          column.statistics?.averageWidth !== undefined
            ? `${column.statistics.averageWidth} bytes`
            : "—"}
        </div>
      </div>
    </div>
  );

  const renderRelationships = (
    relationships: TableDetailsMeta["relationships"],
    directionLabel: string
  ) => {
    if (!relationships.length) {
      return (
        <p className="text-sm text-vscode-text-secondary">
          No {directionLabel.toLowerCase()} relationships.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {relationships.map((rel) => (
          <div
            key={`${rel.direction}-${rel.constraintName}-${rel.relatedSchema}-${rel.relatedTable}`}
            className="rounded border border-vscode-border bg-vscode-bg px-3 py-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-vscode-text">
                {rel.relatedSchema}.{rel.relatedTable}
              </span>
              <span className="text-xs text-vscode-text-secondary">
                {rel.constraintName}
              </span>
            </div>
            <div className="mt-2 text-xs text-vscode-text-secondary space-y-1">
              {rel.columns.map((colPair, index) => (
                <div
                  key={`${rel.constraintName}-${index}`}
                  className="flex items-center space-x-2"
                >
                  <span className="text-vscode-text">
                    {colPair.localColumn}
                  </span>
                  <span className="text-vscode-text-tertiary">→</span>
                  <span className="text-vscode-text">
                    {colPair.relatedColumn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailsTab = () => {
    if (detailsState.isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-3 text-vscode-text-secondary">
            <LoadingIcon className="w-5 h-5 animate-spin" />
            <span>Loading metadata…</span>
          </div>
        </div>
      );
    }

    if (detailsState.error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-vscode-red bg-vscode-red bg-opacity-10 border border-vscode-red border-opacity-30 px-4 py-3 rounded">
            {detailsState.error}
          </div>
        </div>
      );
    }

    if (!detailsState.data) {
      return null;
    }

    const details = detailsState.data;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="space-y-4 py-3">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium text-vscode-text">
                  <DatabaseIcon className="w-4 h-4 text-vscode-text-secondary" />
                  <span>Overview</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-vscode-text-secondary">
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Estimated Rows
                    </span>
                    <span>
                      {details.rowEstimate !== null &&
                      details.rowEstimate !== undefined
                        ? details.rowEstimate.toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Total Size
                    </span>
                    <span>{details.totalSize || "—"}</span>
                  </div>
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Table Size
                    </span>
                    <span>{details.tableSize || "—"}</span>
                  </div>
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Index Size
                    </span>
                    <span>{details.indexSize || "—"}</span>
                  </div>
                </div>
                {details.comment && (
                  <div className="text-sm text-vscode-text">
                    <span className="font-medium block text-vscode-text-secondary mb-1">
                      Comment
                    </span>
                    <p className="leading-relaxed">{details.comment}</p>
                  </div>
                )}
              </div>

              <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium text-vscode-text">
                  <RefreshIcon className="w-4 h-4 text-vscode-text-secondary" />
                  <span>Maintenance</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-vscode-text-secondary">
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Vacuum
                    </span>
                    <span>{details.lastVacuum || "—"}</span>
                  </div>
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Auto Vacuum
                    </span>
                    <span>{details.lastAutovacuum || "—"}</span>
                  </div>
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Analyze
                    </span>
                    <span>{details.lastAnalyze || "—"}</span>
                  </div>
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Auto Analyze
                    </span>
                    <span>{details.lastAutoanalyze || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium text-vscode-text">
                  <IndexIcon className="w-4 h-4 text-vscode-text-secondary" />
                  <span>Primary & Indexes</span>
                </div>
                <div className="space-y-2 text-sm text-vscode-text-secondary">
                  <div>
                    <span className="text-vscode-text font-medium block">
                      Primary Key
                    </span>
                    {details.primaryKey ? (
                      <span>
                        {toStringArray(details.primaryKey.columns).join(", ") ||
                          "—"}
                      </span>
                    ) : (
                      <span>No primary key defined</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-vscode-text font-medium block">
                      Indexes
                    </span>
                    {details.indexes.length ? (
                      <ul className="space-y-1">
                        {details.indexes.map((index) => (
                          <li key={index.name}>
                            <span className="text-vscode-text">
                              {index.name}
                            </span>
                            {index.isUnique && (
                              <span className="ml-2 text-xs text-vscode-text-tertiary uppercase tracking-wide">
                                Unique
                              </span>
                            )}
                            <div className="text-xs">
                              {toStringArray(index.columns).join(", ") ||
                                index.definition ||
                                "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>No indexes</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm font-medium text-vscode-text">
                    <TriggerIcon className="w-4 h-4 text-vscode-text-secondary" />
                    <span>Triggers</span>
                  </div>
                </div>
                <div className="text-sm text-vscode-text-secondary">
                  {details.triggers.length ? (
                    <ul className="space-y-1">
                      {details.triggers.map((trigger) => (
                        <li key={trigger.name}>
                          <span className="text-vscode-text">
                            {trigger.name}
                          </span>
                          <div className="text-xs">
                            {trigger.actionTiming} {trigger.eventManipulation}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No triggers defined</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium text-vscode-text">
                  <ConnectIcon className="w-4 h-4 text-vscode-text-secondary" />
                  <span>References</span>
                </div>
                {renderRelationships(outgoingRelationships, "References")}
              </div>
              <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium text-vscode-text">
                  <ViewIcon className="w-4 h-4 text-vscode-text-secondary" />
                  <span>Referenced By</span>
                </div>
                {renderRelationships(incomingRelationships, "Referenced by")}
              </div>
            </div>

            <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-4">
              <div className="flex items-center justify-between text-sm font-medium text-vscode-text">
                <span>Columns</span>
                <span className="text-xs text-vscode-text-secondary">
                  {details.columns.length} column
                  {details.columns.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-vscode-bg-tertiary">
                    <tr className="text-left text-vscode-text-secondary uppercase text-xs tracking-wide">
                      <th className="px-3 py-2 font-medium">Column</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Nullable</th>
                      <th className="px-3 py-2 font-medium">Default</th>
                      <th className="px-3 py-2 font-medium">Indexes</th>
                      <th className="px-3 py-2 font-medium">Stats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.columns.map((column) => (
                      <tr
                        key={column.name}
                        className="border-b border-vscode-border hover:bg-vscode-bg-tertiary align-top"
                      >
                        <td className="px-3 py-2 text-vscode-text">
                          <div className="font-medium text-sm">
                            {column.name}
                          </div>
                          {column.comment && (
                            <div className="text-xs text-vscode-text-secondary mt-1">
                              {column.comment}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-vscode-text-secondary">
                          {column.dataType}
                          {column.isPrimaryKey && (
                            <span className="ml-2 text-xs text-vscode-text-tertiary uppercase tracking-wide">
                              PK
                            </span>
                          )}
                          {column.isUnique && !column.isPrimaryKey && (
                            <span className="ml-2 text-xs text-vscode-text-tertiary uppercase tracking-wide">
                              Unique
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-vscode-text-secondary">
                          {column.nullable ? "YES" : "NO"}
                        </td>
                        <td className="px-3 py-2 text-sm text-vscode-text-secondary">
                          {column.defaultValue || "—"}
                        </td>
                        <td className="px-3 py-2 text-sm text-vscode-text-secondary">
                          {column.hasIndex ? "Indexed" : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {renderColumnStats(column)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-vscode-border px-4 py-3 bg-vscode-bg-secondary">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-vscode-text truncate">
            {table}
          </h2>
          <p className="text-sm text-vscode-text-secondary truncate">
            {schema}.{table}
            {connectionName ? ` • ${connectionName}` : ""}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("data")}
            className={`px-3 py-1 text-xs rounded ${
              activeTab === "data"
                ? "bg-vscode-blue text-white"
                : "bg-vscode-bg text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-bg-tertiary"
            }`}
          >
            Data
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`px-3 py-1 text-xs rounded ${
              activeTab === "details"
                ? "bg-vscode-blue text-white"
                : "bg-vscode-bg text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-bg-tertiary"
            }`}
          >
            Details
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 bg-vscode-bg">
        {activeTab === "data" ? renderDataTab() : renderDetailsTab()}
      </div>
    </div>
  );
};
const toStringArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
};
