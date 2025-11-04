import React, { useState, useEffect, useCallback } from "react";
import { QueryHistoryEntry } from "../../main/storage/StorageManager";
import { queryHistoryService } from "../services/QueryHistoryService";

interface QueryHistoryProps {
  connectionId?: number;
  onQuerySelect: (query: string) => void;
  onClose: () => void;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  connectionId,
  onQuerySelect,
  onClose,
}) => {
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const result = await queryHistoryService.getQueryHistory(connectionId);
    if (result.success && result.data) {
      setHistory(result.data);
    } else {
      console.error("Failed to load query history:", result.error);
    }
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-vscode-bg-secondary rounded-md shadow-2xl w-[900px] max-h-[85vh] overflow-hidden border border-vscode-border animate-fadeIn">
        <div className="px-6 py-4 border-b border-vscode-border flex justify-between items-center bg-vscode-bg-tertiary">
          <h2 className="text-lg font-medium text-vscode-text">
            Query History
          </h2>
          <button
            onClick={onClose}
            className="text-vscode-text-secondary hover:text-vscode-text transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-8 text-center text-vscode-text-secondary">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-vscode-blue border-t-transparent"></div>
                <span>Loading history...</span>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-vscode-text-tertiary">
              <svg
                className="w-16 h-16 mx-auto mb-3 opacity-50"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z" />
                <path d="M7.5 4v5h1V4h-1zm0 6v1h1v-1h-1z" />
              </svg>
              <p>No query history found</p>
            </div>
          ) : (
            <div className="divide-y divide-vscode-border">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="px-6 py-4 hover:bg-vscode-bg-tertiary cursor-pointer transition-colors group"
                  onClick={() => onQuerySelect(entry.query)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <code className="text-sm text-vscode-blue font-mono group-hover:text-vscode-blue-light transition-colors">
                        {queryHistoryService.truncateQuery(entry.query)}
                      </code>
                    </div>
                    <div className="ml-4 text-xs text-vscode-text-tertiary whitespace-nowrap">
                      {queryHistoryService.formatDate(entry.runAt)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    <span
                      className={`flex items-center ${
                        entry.success ? "text-vscode-green" : "text-vscode-red"
                      }`}
                    >
                      {entry.success ? "✓" : "✗"}{" "}
                      {entry.success ? "Success" : "Failed"}
                    </span>
                    <span className="text-vscode-text-tertiary">
                      {queryHistoryService.formatDuration(entry.duration)}
                    </span>
                    <span className="text-vscode-text-tertiary">
                      {queryHistoryService.formatRowCount(entry.rowCount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
