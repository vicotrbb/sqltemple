import React from "react";
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-vscode-bg-tertiary border-b border-vscode-border">
        <div className="flex items-center space-x-2">
          <CheckIcon className="w-5 h-5 text-vscode-green" />
          <span className="text-sm font-medium text-vscode-text">
            {result.rowCount} rows returned
          </span>
        </div>
        <span className="text-xs text-vscode-text-secondary">
          Executed in {result.duration}ms
        </span>
      </div>

      {/* Table */}
      {result.columns.length > 0 && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-vscode-bg-quaternary sticky top-0">
              <tr>
                {result.columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 text-left font-medium text-vscode-text border-r border-vscode-border last:border-r-0"
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
                  className="border-b border-vscode-border hover:bg-vscode-bg-tertiary"
                >
                  {result.columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-4 py-2 text-vscode-text border-r border-vscode-border last:border-r-0"
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
      )}
    </div>
  );
};
