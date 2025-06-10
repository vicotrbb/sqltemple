import React from 'react';
import { QueryResult } from '../../main/database/interfaces';

interface ResultsGridProps {
  result: QueryResult | null;
  isLoading?: boolean;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2 text-vscode-text-secondary">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-vscode-blue border-t-transparent"></div>
          <span>Executing query...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-vscode-text-tertiary text-center">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-50" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6.5L14 5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H3v12h10V4.5z"/>
            <path d="M4.5 6.5h7v1h-7zm0 2h7v1h-7zm0 2h7v1h-7z"/>
          </svg>
          <p className="text-sm">No results to display</p>
          <p className="text-xs mt-1 text-vscode-text-tertiary">Execute a query to see results here</p>
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="h-full p-4 overflow-auto">
        <div className="bg-vscode-red bg-opacity-10 border border-vscode-red border-opacity-30 rounded p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-vscode-red flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.6 1l6.4 11.3-.9 1.7H1.9l-.9-1.7L7.4 1h1.2zm-.7 2L2.8 12h10.4L8.1 3h-.2zM8 9V6h1v3H8zm0 3v-1h1v1H8z"/>
            </svg>
            <div>
              <h3 className="text-vscode-red font-medium mb-1">Query Error</h3>
              <pre className="text-sm text-vscode-text whitespace-pre-wrap font-mono">{result.error}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.rows.length === 0) {
    return (
      <div className="h-full p-4">
        <div className="bg-vscode-green bg-opacity-10 border border-vscode-green border-opacity-30 rounded p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-vscode-green" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 2L6 10l-3-3-1 1 4 4L15 3z"/>
            </svg>
            <div>
              <p className="text-vscode-text">Query executed successfully</p>
              <p className="text-sm text-vscode-text-secondary mt-1">
                {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} affected in {result.duration}ms
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-vscode-border flex items-center justify-between bg-vscode-bg-tertiary">
        <div className="text-sm text-vscode-text-secondary">
          {result.rows.length} row{result.rows.length !== 1 ? 's' : ''} 
          <span className="text-vscode-text-tertiary"> • {result.duration}ms</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-vscode-bg-tertiary border-b border-vscode-border">
            <tr>
              <th className="px-3 py-2 text-left text-vscode-text-secondary font-medium border-r border-vscode-border w-12">
                #
              </th>
              {result.columns.map((column, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-vscode-text-secondary font-medium border-r border-vscode-border"
                >
                  <div className="flex flex-col">
                    <span>{column.name}</span>
                    <span className="text-xs text-vscode-text-tertiary font-normal">
                      {column.dataType}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-vscode-border hover:bg-vscode-bg-tertiary transition-colors ${
                  rowIndex % 2 === 0 ? 'bg-vscode-bg' : 'bg-vscode-bg-secondary'
                }`}
              >
                <td className="px-3 py-2 text-vscode-text-tertiary border-r border-vscode-border">
                  {rowIndex + 1}
                </td>
                {result.columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-3 py-2 text-vscode-text border-r border-vscode-border font-mono text-xs"
                  >
                    {formatCellValue(row[column.name])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatCellValue(value: any): string {
  if (value === null) {
    return 'NULL';
  }
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}