import React, { useMemo, useState, useEffect, useRef } from "react";
import { QueryResult } from "../../main/database/interfaces";
import { LoadingIcon, CheckIcon, ErrorIcon, TableIcon } from "./icons/IconLibrary";
import { ExportDialog } from "./ResultsGrid/ExportDialog";
import { AnalysisModal } from "./ResultsGrid/AnalysisModal";
import { StatisticsTooltip } from "./ResultsGrid/StatisticsTooltip";
import { RelationshipTooltip } from "./ResultsGrid/RelationshipTooltip";
import { ColumnHeader } from "./ResultsGrid/ColumnHeader";
import { useResultsExport } from "../hooks/useResultsExport";
import { useColumnResize } from "../hooks/useColumnResize";
import { useRowHeight } from "../hooks/useRowHeight";
import { ResultsAnalyzer, AnalysisResponse } from "./ResultsGrid/ResultsAnalyzer";
import { RelationshipManager, ForeignKeyRelationship } from "./ResultsGrid/RelationshipManager";
import { getColumnTypeInfo } from "./ResultsGrid/ColumnTypeMapping";
import { ExportOptions } from "./ResultsGrid/ResultsExporter";

interface EnhancedResultsGridProps {
  result: QueryResult | null;
  isLoading: boolean;
  currentQuery?: string;
}

const HEADER_HEIGHT = 60;
const BUFFER_SIZE = 10;

const VirtualizedTable: React.FC<{ 
  result: QueryResult; 
  rowHeight: number;
  columnWidths: Record<string, number>;
  getColumnWidth: (key: string) => number;
  handleMouseDown: (key: string, e: React.MouseEvent) => void;
  relationships: ForeignKeyRelationship[];
}> = ({ result, rowHeight, columnWidths, getColumnWidth, handleMouseDown, relationships }) => {
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
  }>({ visible: false, position: { x: 0, y: 0 }, value: null, relationship: null });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight - HEADER_HEIGHT;
        setContainerHeight(height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const visibleRange = useMemo(() => {
    const rowsLength = result.rows?.length || 0;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_SIZE);
    const endIndex = Math.min(
      rowsLength,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + BUFFER_SIZE
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, result.rows?.length, rowHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const formatCellValue = (value: any, column: any): string | React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-vscode-text-tertiary italic">NULL</span>;
    }
    
    const typeInfo = getColumnTypeInfo(column.dataType);
    const formattedValue = typeInfo.format(value);
    
    if (formattedValue.length > 1000) {
      return (
        <span title={formattedValue}>
          {formattedValue.substring(0, 1000)}...
        </span>
      );
    }
    
    return formattedValue;
  };

  const handleStatsHover = (column: any, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setStatsTooltip({
      visible: true,
      position: { x: rect.left, y: rect.bottom + 5 },
      column
    });
  };

  const handleStatsLeave = () => {
    setStatsTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleCellHover = (value: any, column: any, e: React.MouseEvent) => {
    const relationship = RelationshipManager.findRelationshipForColumn(column.name, relationships);
    if (relationship && value !== null && value !== undefined) {
      const rect = e.currentTarget.getBoundingClientRect();
      setRelationshipTooltip({
        visible: true,
        position: { x: rect.right + 5, y: rect.top },
        value,
        relationship
      });
    }
  };

  const handleCellLeave = () => {
    setRelationshipTooltip(prev => ({ ...prev, visible: false }));
  };

  const totalHeight = (result.rows?.length || 0) * rowHeight;
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
      <div className="relative" style={{ height: totalHeight + HEADER_HEIGHT }}>
        <div 
          className="sticky top-0 z-10 bg-vscode-bg-quaternary border-b border-vscode-border"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex">
            {(result.columns || []).map((column, index) => (
              <ColumnHeader
                key={index}
                column={column}
                width={getColumnWidth(column.name)}
                onMouseDown={(e) => handleMouseDown(column.name, e)}
                onStatsHover={(e) => handleStatsHover(column, e)}
                onStatsLeave={handleStatsLeave}
              />
            ))}
          </div>
        </div>

        <div 
          className="absolute top-0 left-0 right-0"
          style={{ transform: `translateY(${offsetY + HEADER_HEIGHT}px)` }}
        >
          {(result.rows || []).slice(visibleRange.startIndex, visibleRange.endIndex).map((row, rowIndex) => {
            const actualRowIndex = visibleRange.startIndex + rowIndex;
            return (
              <div
                key={actualRowIndex}
                className="flex border-b border-vscode-border hover:bg-vscode-bg-tertiary"
                style={{ height: rowHeight }}
              >
                {(result.columns || []).map((column, colIndex) => (
                  <div
                    key={colIndex}
                    className="px-4 py-2 text-vscode-text border-r border-vscode-border last:border-r-0 overflow-hidden"
                    style={{ width: getColumnWidth(column.name), height: rowHeight }}
                    onMouseEnter={(e) => handleCellHover(row[column.name], column, e)}
                    onMouseLeave={handleCellLeave}
                  >
                    <div className="truncate">
                      {formatCellValue(row[column.name], column)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <StatisticsTooltip
        column={statsTooltip.column}
        data={statsTooltip.column ? (result.rows || []).map(row => row[statsTooltip.column.name]) : []}
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
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<ForeignKeyRelationship[]>([]);
  
  const { exportResults, isExporting, error: exportError } = useResultsExport();
  const { rowHeight, adjustRowHeight } = useRowHeight();
  
  const columnConfig = useMemo(() => {
    if (!result) return [];
    return result.columns.map(col => ({
      key: col.name,
      width: 150,
      minWidth: 80,
      maxWidth: 500,
    }));
  }, [result]);
  
  const { columnWidths, getColumnWidth, handleMouseDown } = useColumnResize(columnConfig);

  useEffect(() => {
    if (result && result.columns.length > 0) {
      const schemaName = 'public';
      const tableName = 'unknown';
      
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
        maxRows: 100
      });
      setAnalysis(analysisResult);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
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

  const shouldVirtualize = (result.rows?.length || 0) > 100;

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
              disabled={rowHeight <= 20}
            >
              -
            </button>
            <span className="w-8 text-center">{rowHeight}</span>
            <button
              onClick={() => adjustRowHeight(4)}
              className="px-1 hover:bg-vscode-bg-secondary rounded"
              disabled={rowHeight >= 100}
            >
              +
            </button>
          </div>
          
          <button
            onClick={() => setShowExportDialog(true)}
            disabled={isExporting}
            className="px-3 py-1 text-xs bg-vscode-blue text-white rounded hover:bg-vscode-blue-dark disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={analysisLoading}
            className="px-3 py-1 text-xs bg-vscode-green text-white rounded hover:bg-vscode-green-dark disabled:opacity-50"
          >
            {analysisLoading ? 'Analyzing...' : 'AI Analysis'}
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

      {result.columns.length > 0 && (
        shouldVirtualize ? (
          <VirtualizedTable 
            result={result} 
            rowHeight={rowHeight}
            columnWidths={columnWidths}
            getColumnWidth={getColumnWidth}
            handleMouseDown={handleMouseDown}
            relationships={relationships}
          />
        ) : (
          <div className="flex-1 overflow-auto" role="region" aria-label="Query results">
            <table 
              className="w-full text-sm" 
              role="table"
              aria-label={`Query results with ${result.rowCount} rows and ${result.columns.length} columns`}
            >
              <thead className="bg-vscode-bg-quaternary sticky top-0">
                <tr role="row">
                  {(result.columns || []).map((column, index) => (
                    <th
                      key={index}
                      role="columnheader"
                      className="px-4 py-2 text-left font-medium text-vscode-text border-r border-vscode-border last:border-r-0"
                      style={{ width: getColumnWidth(column.name) }}
                    >
                      <ColumnHeader
                        column={column}
                        width={getColumnWidth(column.name)}
                        onMouseDown={(e) => handleMouseDown(column.name, e)}
                        onStatsHover={() => {}}
                        onStatsLeave={() => {}}
                      />
                    </th>
                  ))}
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
                    {(result.columns || []).map((column, colIndex) => (
                      <td
                        key={colIndex}
                        role="cell"
                        className="px-4 py-2 text-vscode-text border-r border-vscode-border last:border-r-0"
                        style={{ width: getColumnWidth(column.name) }}
                      >
                        {row[column.name] !== null && row[column.name] !== undefined ? (
                          getColumnTypeInfo(column.dataType).format(row[column.name])
                        ) : (
                          <span className="text-vscode-text-tertiary italic">NULL</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

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