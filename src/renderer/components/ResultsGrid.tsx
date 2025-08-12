import React, { useMemo, useState, useEffect, useRef } from "react";
import { QueryResult } from "../../main/database/interfaces";
import {
  LoadingIcon,
  CheckIcon,
  ErrorIcon,
  TableIcon,
} from "./icons/IconLibrary";

interface ResultsGridProps {
  result: QueryResult | null;
  isLoading: boolean;
}

const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 40;
const BUFFER_SIZE = 10;

const VirtualizedTable: React.FC<{ result: QueryResult }> = ({ result }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(300);
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
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      result.rows.length,
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_SIZE
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, result.rows.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const formatCellValue = (value: any): string | React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-vscode-text-tertiary italic">NULL</span>;
    }
    
    const str = String(value);
    if (str.length > 1000) {
      return (
        <span title={str}>
          {str.substring(0, 1000)}...
        </span>
      );
    }
    
    return str;
  };

  const totalHeight = result.rows.length * ROW_HEIGHT;
  const offsetY = visibleRange.startIndex * ROW_HEIGHT;

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
            {result.columns.map((column, index) => (
              <div
                key={index}
                className="px-4 py-2 text-left font-medium text-vscode-text border-r border-vscode-border last:border-r-0 min-w-[120px] flex-shrink-0"
                style={{ height: HEADER_HEIGHT }}
              >
                <div className="truncate">
                  {column.name}
                  <span className="ml-1 text-xs text-vscode-text-tertiary">
                    ({column.dataType})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div 
          className="absolute top-0 left-0 right-0"
          style={{ transform: `translateY(${offsetY + HEADER_HEIGHT}px)` }}
        >
          {result.rows.slice(visibleRange.startIndex, visibleRange.endIndex).map((row, rowIndex) => {
            const actualRowIndex = visibleRange.startIndex + rowIndex;
            return (
              <div
                key={actualRowIndex}
                className="flex border-b border-vscode-border hover:bg-vscode-bg-tertiary"
                style={{ height: ROW_HEIGHT }}
              >
                {result.columns.map((column, colIndex) => (
                  <div
                    key={colIndex}
                    className="px-4 py-2 text-vscode-text border-r border-vscode-border last:border-r-0 min-w-[120px] flex-shrink-0 overflow-hidden"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div className="truncate">
                      {formatCellValue(row[column.name])}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  result,
  isLoading,
}) => {
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

  const shouldVirtualize = result.rows.length > 100;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 bg-vscode-bg-tertiary border-b border-vscode-border">
        <div className="flex items-center space-x-2">
          <CheckIcon className="w-5 h-5 text-vscode-green" />
          <span className="text-sm font-medium text-vscode-text">
            {result.rowCount} rows returned
          </span>
          {shouldVirtualize && (
            <span className="text-xs bg-vscode-blue bg-opacity-20 text-vscode-blue px-2 py-1 rounded">
              Virtualized
            </span>
          )}
        </div>
        <span className="text-xs text-vscode-text-secondary">
          Executed in {result.duration}ms
        </span>
      </div>

      {result.columns.length > 0 && (
        shouldVirtualize ? (
          <VirtualizedTable result={result} />
        ) : (
          <div className="flex-1 overflow-auto" role="region" aria-label="Query results">
            <table 
              className="w-full text-sm" 
              role="table"
              aria-label={`Query results with ${result.rowCount} rows and ${result.columns.length} columns`}
            >
              <thead className="bg-vscode-bg-quaternary sticky top-0">
                <tr role="row">
                  {result.columns.map((column, index) => (
                    <th
                      key={index}
                      role="columnheader"
                      className="px-4 py-2 text-left font-medium text-vscode-text border-r border-vscode-border last:border-r-0"
                      aria-sort="none"
                    >
                      {column.name}
                      <span className="ml-1 text-xs text-vscode-text-tertiary">
                        ({column.dataType})
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    role="row"
                    className="border-b border-vscode-border hover:bg-vscode-bg-tertiary"
                    aria-rowindex={rowIndex + 1}
                  >
                    {result.columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        role="cell"
                        className="px-4 py-2 text-vscode-text border-r border-vscode-border last:border-r-0"
                        aria-label={`${column.name}: ${row[column.name] ?? 'NULL'}`}
                      >
                        {row[column.name] !== null &&
                        row[column.name] !== undefined ? (
                          String(row[column.name])
                        ) : (
                          <span className="text-vscode-text-tertiary italic">
                            NULL
                          </span>
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
    </div>
  );
};
