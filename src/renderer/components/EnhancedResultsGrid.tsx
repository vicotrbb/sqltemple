import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { QueryResult } from "../../main/database/interfaces";
import {
  LoadingIcon,
  CheckIcon,
  ErrorIcon,
  TableIcon,
} from "./icons/IconLibrary";
import { ExportDialog } from "./ResultsGrid/ExportDialog";
import { AnalysisModal } from "./ResultsGrid/AnalysisModal";
import { StatisticsTooltip } from "./ResultsGrid/StatisticsTooltip";
import { RelationshipTooltip } from "./ResultsGrid/RelationshipTooltip";
import { ColumnHeader } from "./ResultsGrid/ColumnHeader";
import { useResultsExport } from "../hooks/useResultsExport";
import { useColumnResize } from "../hooks/useColumnResize";
import {
  useRowHeight,
  ROW_HEIGHT_MIN,
  ROW_HEIGHT_MAX,
} from "../hooks/useRowHeight";
import {
  ResultsAnalyzer,
  AnalysisResponse,
} from "./ResultsGrid/ResultsAnalyzer";
import {
  RelationshipManager,
  ForeignKeyRelationship,
} from "./ResultsGrid/RelationshipManager";
import { getColumnTypeInfo } from "./ResultsGrid/ColumnTypeMapping";
import { ExportOptions } from "./ResultsGrid/ResultsExporter";

interface EnhancedResultsGridProps {
  result: QueryResult | null;
  isLoading: boolean;
  currentQuery?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isAppending?: boolean;
}

const HEADER_HEIGHT = 60;
const BUFFER_SIZE = 10;
const ROW_RESIZE_HANDLE_HEIGHT = 6;

interface RowResizeHandleProps {
  rowHeight: number;
  onResize: (height: number) => void;
  className?: string;
}

const RowResizeHandle: React.FC<RowResizeHandleProps> = ({
  rowHeight,
  onResize,
  className = "",
}) => {
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(rowHeight);

  const clampHeight = useCallback(
    (value: number) =>
      Math.min(Math.max(value, ROW_HEIGHT_MIN), ROW_HEIGHT_MAX),
    []
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaY = event.clientY - startYRef.current;
      const nextHeight = clampHeight(startHeightRef.current + deltaY);
      onResize(nextHeight);
    },
    [clampHeight, onResize]
  );

  const stopResizing = useCallback(() => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (isResizingRef.current) {
        stopResizing();
      }
      startYRef.current = event.clientY;
      startHeightRef.current = rowHeight;
      isResizingRef.current = true;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [handleMouseMove, rowHeight, stopResizing]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? 10 : 4;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        onResize(clampHeight(rowHeight - step));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        onResize(clampHeight(rowHeight + step));
      } else if (event.key === "Home") {
        event.preventDefault();
        onResize(ROW_HEIGHT_MIN);
      } else if (event.key === "End") {
        event.preventDefault();
        onResize(ROW_HEIGHT_MAX);
      }
    },
    [clampHeight, onResize, rowHeight]
  );

  useEffect(() => stopResizing, [stopResizing]);

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Resize result row height"
      aria-orientation="vertical"
      aria-valuemin={ROW_HEIGHT_MIN}
      aria-valuemax={ROW_HEIGHT_MAX}
      aria-valuenow={Math.round(rowHeight)}
      className={`w-full cursor-row-resize bg-vscode-border/40 border-b border-vscode-border transition-colors hover:bg-vscode-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-vscode-blue ${className}`}
      style={{ height: ROW_RESIZE_HANDLE_HEIGHT }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
    />
  );
};

const formatCellValue = (
  value: any,
  column: any
): { display: React.ReactNode; fullText: string } => {
  if (value === null || value === undefined) {
    return {
      display: <span className="text-vscode-text-tertiary italic">NULL</span>,
      fullText: "NULL",
    };
  }

  const typeInfo = getColumnTypeInfo(column.dataType);
  const formattedValue = typeInfo.format(value);

  const fullText =
    typeof formattedValue === "string"
      ? formattedValue
      : formattedValue !== null && formattedValue !== undefined
        ? String(formattedValue)
        : "";

  return {
    display: formattedValue,
    fullText,
  };
};

const VirtualizedTable: React.FC<{
  result: QueryResult;
  rowHeight: number;
  columnWidths: Record<string, number>;
  getColumnWidth: (key: string) => number;
  handleMouseDown: (key: string, e: React.MouseEvent) => void;
  relationships: ForeignKeyRelationship[];
  onRowHeightChange: (height: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isAppending?: boolean;
}> = ({
  result,
  rowHeight,
  columnWidths: _columnWidths,
  getColumnWidth,
  handleMouseDown,
  relationships,
  onRowHeightChange,
  onLoadMore,
  hasMore,
  isAppending,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(300);
  const [statsTooltip, setStatsTooltip] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    column: any;
  }>({ visible: false, position: { x: 0, y: 0 }, column: null });
  const [relationshipTooltip, setRelationshipTooltip] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    value: any;
    relationship: ForeignKeyRelationship | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    value: null,
    relationship: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height =
          containerRef.current.clientHeight -
          HEADER_HEIGHT -
          ROW_RESIZE_HANDLE_HEIGHT;
        setContainerHeight(Math.max(height, 0));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const visibleRange = useMemo(() => {
    const rowsLength = result.rows?.length || 0;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - BUFFER_SIZE
    );
    const endIndex = Math.min(
      rowsLength,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + BUFFER_SIZE
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, result.rows?.length, rowHeight]);

  const hasMoreRows = Boolean(hasMore);
  const totalHeight = (result.rows?.length || 0) * rowHeight;
  const indicatorHeight = hasMoreRows ? 48 : 0;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);

    if (hasMoreRows && onLoadMore && !isAppending) {
      const target = e.currentTarget;
      const scrollBottom = target.scrollTop + target.clientHeight;
      const threshold = totalHeight - rowHeight * 5;
      if (scrollBottom >= threshold) {
        onLoadMore();
      }
    }
  };

  const handleStatsHover = (column: any, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setStatsTooltip({
      visible: true,
      position: { x: rect.left, y: rect.bottom + 5 },
      column,
    });
  };

  const handleStatsLeave = () => {
    setStatsTooltip((prev) => ({ ...prev, visible: false }));
  };

  const handleCellHover = (value: any, column: any, e: React.MouseEvent) => {
    const relationship = RelationshipManager.findRelationshipForColumn(
      column.name,
      relationships
    );
    if (relationship && value !== null && value !== undefined) {
      const rect = e.currentTarget.getBoundingClientRect();
      setRelationshipTooltip({
        visible: true,
        position: { x: rect.right + 5, y: rect.top },
        value,
        relationship,
      });
    }
  };

  const handleCellLeave = () => {
    setRelationshipTooltip((prev) => ({ ...prev, visible: false }));
  };

  const offsetY = visibleRange.startIndex * rowHeight;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto"
      onScroll={handleScroll}
      role="region"
      aria-label={`Virtualized query results with ${result.rowCount} rows`}
      tabIndex={0}
    >
      <div
        className="relative"
        style={{
          height:
            totalHeight +
            HEADER_HEIGHT +
            ROW_RESIZE_HANDLE_HEIGHT +
            indicatorHeight,
        }}
      >
        <div
          className="sticky top-0 z-10 bg-vscode-bg-quaternary border-b border-vscode-border"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex">
            {(result.columns || []).map((column, index) => {
              const columnWidth = getColumnWidth(column.name);
              return (
                <ColumnHeader
                  key={index}
                  column={column}
                  width={columnWidth}
                  onMouseDown={(e) => handleMouseDown(column.name, e)}
                  onStatsHover={(e) => handleStatsHover(column, e)}
                  onStatsLeave={handleStatsLeave}
                />
              );
            })}
          </div>
        </div>

        <RowResizeHandle
          rowHeight={rowHeight}
          onResize={onRowHeightChange}
          className="relative z-10"
        />

        <div
          className="absolute top-0 left-0 right-0"
          style={{
            transform: `translateY(${
              offsetY + HEADER_HEIGHT + ROW_RESIZE_HANDLE_HEIGHT
            }px)`,
          }}
        >
          {(result.rows || [])
            .slice(visibleRange.startIndex, visibleRange.endIndex)
            .map((row, rowIndex) => {
              const actualRowIndex = visibleRange.startIndex + rowIndex;
              return (
                <div
                  key={actualRowIndex}
                  className="flex border-b border-vscode-border hover:bg-vscode-bg-tertiary"
                  style={{ height: rowHeight }}
                >
                  {(result.columns || []).map((column, colIndex) => {
                    const { display, fullText } = formatCellValue(
                      row[column.name],
                      column
                    );
                    const columnWidth = getColumnWidth(column.name);
                    return (
                      <div
                        key={colIndex}
                        className="flex h-full items-center px-4 text-vscode-text border-r border-vscode-border last:border-r-0 overflow-hidden"
                        style={{
                          width: columnWidth,
                          maxWidth: columnWidth,
                        }}
                        onMouseEnter={(e) =>
                          handleCellHover(row[column.name], column, e)
                        }
                        onMouseLeave={handleCellLeave}
                        title={fullText}
                      >
                        <div className="truncate w-full">{display}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>

        {hasMoreRows && (
          <div
            className="absolute left-0 right-0 flex justify-center"
            style={{
              transform: `translateY(${
                totalHeight + HEADER_HEIGHT + ROW_RESIZE_HANDLE_HEIGHT
              }px)`,
            }}
          >
            <div className="w-full bg-vscode-bg py-3 flex items-center justify-center space-x-2 text-xs text-vscode-text-secondary">
              {isAppending && <LoadingIcon className="w-4 h-4 animate-spin" />}
              <span>
                {isAppending
                  ? "Loading more rows..."
                  : "Scroll to load more rows"}
              </span>
            </div>
          </div>
        )}
      </div>

      <StatisticsTooltip
        column={statsTooltip.column}
        data={
          statsTooltip.column
            ? (result.rows || []).map((row) => row[statsTooltip.column.name])
            : []
        }
        position={statsTooltip.position}
        visible={statsTooltip.visible}
      />

      <RelationshipTooltip
        value={relationshipTooltip.value}
        relationship={relationshipTooltip.relationship!}
        position={relationshipTooltip.position}
        visible={relationshipTooltip.visible}
      />
    </div>
  );
};

export const EnhancedResultsGrid: React.FC<EnhancedResultsGridProps> = ({
  result,
  isLoading,
  currentQuery = "",
  onLoadMore,
  hasMore = false,
  isAppending = false,
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<ForeignKeyRelationship[]>(
    []
  );

  const { exportResults, isExporting, error: exportError } = useResultsExport();
  const { rowHeight, adjustRowHeight, setRowHeight } = useRowHeight();

  const columnConfig = useMemo(() => {
    if (!result) return [];
    return result.columns.map((col) => ({
      key: col.name,
      width: 150,
      minWidth: 80,
      maxWidth: 320,
    }));
  }, [result]);

  const { columnWidths, getColumnWidth, handleMouseDown } =
    useColumnResize(columnConfig);

  useEffect(() => {
    if (result && result.columns.length > 0) {
      const schemaName = "public";
      const tableName = "unknown";

      RelationshipManager.loadRelationships(tableName, schemaName)
        .then(setRelationships)
        .catch(console.warn);
    }
  }, [result]);

  const handleExport = async (options: ExportOptions) => {
    if (!result) return;
    await exportResults(result, options);
  };

  const handleAnalyze = async () => {
    if (!result) return;

    setAnalysisLoading(true);
    setAnalysisError(null);
    setShowAnalysisModal(true);

    try {
      const analysisResult = await ResultsAnalyzer.analyzeResults({
        query: currentQuery,
        results: result,
        maxRows: 100,
      });
      setAnalysis(analysisResult);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Analysis failed"
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <LoadingIcon className="w-16 h-16 mx-auto mb-3 opacity-50 animate-spin" />
          <p className="text-vscode-text-secondary">Executing query...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <TableIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="text-vscode-text-secondary">No query results</p>
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-4">
        <div className="flex items-start space-x-3 bg-vscode-red bg-opacity-10 border border-vscode-red border-opacity-30 rounded p-3">
          <ErrorIcon className="w-5 h-5 text-vscode-red flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-vscode-red">Query Error</h3>
            <p className="text-sm text-vscode-text-secondary mt-1">
              {result.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const shouldVirtualize = (result.rows?.length || 0) > 100 || hasMore;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 bg-vscode-bg-tertiary border-b border-vscode-border">
        <div className="flex items-center space-x-2">
          <CheckIcon className="w-5 h-5 text-vscode-green" />
          <span className="text-sm font-medium text-vscode-text">
            {result.rowCount.toLocaleString()} rows returned
          </span>
          {shouldVirtualize && (
            <span className="text-xs bg-vscode-blue bg-opacity-20 text-vscode-blue px-2 py-1 rounded">
              Virtualized
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-vscode-text-secondary">
            <span>Row height:</span>
            <button
              onClick={() => adjustRowHeight(-4)}
              className="px-1 hover:bg-vscode-bg-secondary rounded"
              disabled={rowHeight <= ROW_HEIGHT_MIN}
            >
              -
            </button>
            <span className="w-8 text-center">{rowHeight}</span>
            <button
              onClick={() => adjustRowHeight(4)}
              className="px-1 hover:bg-vscode-bg-secondary rounded"
              disabled={rowHeight >= ROW_HEIGHT_MAX}
            >
              +
            </button>
          </div>

          <button
            onClick={() => setShowExportDialog(true)}
            disabled={isExporting}
            className="px-3 py-1 text-xs bg-vscode-blue text-white rounded hover:bg-vscode-blue-dark disabled:opacity-50"
          >
            {isExporting ? "Exporting..." : "Export"}
          </button>

          <button
            onClick={handleAnalyze}
            disabled={analysisLoading}
            className="px-3 py-1 text-xs bg-vscode-green text-white rounded hover:bg-vscode-green-dark disabled:opacity-50"
          >
            {analysisLoading ? "Analyzing..." : "AI Analysis"}
          </button>

          <span className="text-xs text-vscode-text-secondary">
            Executed in {result.duration}ms
          </span>
        </div>
      </div>

      {exportError && (
        <div className="p-2 bg-vscode-red bg-opacity-10 border-b border-vscode-red border-opacity-30">
          <p className="text-sm text-vscode-red">{exportError}</p>
        </div>
      )}

      {result.columns.length > 0 &&
        (shouldVirtualize ? (
          <VirtualizedTable
            result={result}
            rowHeight={rowHeight}
            columnWidths={columnWidths}
            getColumnWidth={getColumnWidth}
            handleMouseDown={handleMouseDown}
            relationships={relationships}
            onRowHeightChange={setRowHeight}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            isAppending={isAppending}
          />
        ) : (
          <div
            className="flex-1 overflow-auto"
            role="region"
            aria-label="Query results"
            onScroll={(e) => {
              if (!hasMore || !onLoadMore || isAppending) return;
              const target = e.currentTarget;
              if (
                target.scrollTop + target.clientHeight >=
                target.scrollHeight - rowHeight * 2
              ) {
                onLoadMore();
              }
            }}
          >
            <table
              className="w-full text-sm"
              role="table"
              aria-label={`Query results with ${result.rowCount} rows and ${result.columns.length} columns`}
            >
              <thead className="bg-vscode-bg-quaternary sticky top-0">
                <tr role="row">
                  {(result.columns || []).map((column, index) => {
                    const columnWidth = getColumnWidth(column.name);
                    return (
                      <th
                        key={index}
                        role="columnheader"
                        className="px-4 py-2 text-left font-medium text-vscode-text border-r border-vscode-border last:border-r-0"
                        style={{ width: columnWidth, maxWidth: columnWidth }}
                      >
                        <ColumnHeader
                          column={column}
                          width={columnWidth}
                          onMouseDown={(e) => handleMouseDown(column.name, e)}
                          onStatsHover={() => {}}
                          onStatsLeave={() => {}}
                        />
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  <th colSpan={result.columns.length} className="p-0">
                    <RowResizeHandle
                      rowHeight={rowHeight}
                      onResize={setRowHeight}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {(result.rows || []).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    role="row"
                    className="border-b border-vscode-border hover:bg-vscode-bg-tertiary"
                    style={{ height: rowHeight }}
                  >
                    {(result.columns || []).map((column, colIndex) => {
                      const { display, fullText } = formatCellValue(
                        row[column.name],
                        column
                      );
                      const columnWidth = getColumnWidth(column.name);
                      return (
                        <td
                          key={colIndex}
                          role="cell"
                          className="p-0 border-r border-vscode-border last:border-r-0"
                          style={{
                            width: columnWidth,
                            maxWidth: columnWidth,
                            height: rowHeight,
                          }}
                        >
                          <div
                            className="flex h-full items-center px-4 text-vscode-text overflow-hidden"
                            title={fullText}
                          >
                            <div className="truncate w-full">{display}</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="flex justify-center py-3 text-xs text-vscode-text-secondary space-x-2">
                {isAppending && (
                  <LoadingIcon className="w-4 h-4 animate-spin" />
                )}
                <span>
                  {isAppending
                    ? "Loading more rows..."
                    : "Scroll to load more rows"}
                </span>
              </div>
            )}
          </div>
        ))}

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />

      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        analysis={analysis}
        isLoading={analysisLoading}
        error={analysisError}
      />
    </div>
  );
};
