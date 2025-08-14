import React, { useState } from "react";
import { ExportOptions } from "./ResultsExporter";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState<'csv' | 'tsv' | 'json' | 'xml'>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [dateFormat, setDateFormat] = useState<'iso' | 'local' | 'unix'>('iso');
  const [nullValue, setNullValue] = useState('');
  const [delimiter, setDelimiter] = useState(',');

  if (!isOpen) return null;

  const handleExport = () => {
    onExport({
      format,
      includeHeaders,
      dateFormat,
      nullValue,
      delimiter: format === 'csv' ? delimiter : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-vscode-bg border border-vscode-border rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold text-vscode-text mb-4">Export Results</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vscode-text mb-2">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full p-2 bg-vscode-bg-secondary border border-vscode-border rounded text-vscode-text"
            >
              <option value="csv">CSV</option>
              <option value="tsv">TSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
          </div>

          {(format === 'csv' || format === 'tsv') && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeHeaders"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="includeHeaders" className="text-sm text-vscode-text">
                  Include headers
                </label>
              </div>

              {format === 'csv' && (
                <div>
                  <label className="block text-sm font-medium text-vscode-text mb-2">
                    Delimiter
                  </label>
                  <input
                    type="text"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    className="w-full p-2 bg-vscode-bg-secondary border border-vscode-border rounded text-vscode-text"
                    placeholder=","
                    maxLength={1}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-vscode-text mb-2">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as any)}
              className="w-full p-2 bg-vscode-bg-secondary border border-vscode-border rounded text-vscode-text"
            >
              <option value="iso">ISO 8601</option>
              <option value="local">Local</option>
              <option value="unix">Unix Timestamp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-vscode-text mb-2">
              NULL Value
            </label>
            <input
              type="text"
              value={nullValue}
              onChange={(e) => setNullValue(e.target.value)}
              className="w-full p-2 bg-vscode-bg-secondary border border-vscode-border rounded text-vscode-text"
              placeholder="(empty)"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-vscode-text-secondary hover:text-vscode-text border border-vscode-border rounded hover:bg-vscode-bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-vscode-blue text-white rounded hover:bg-vscode-blue-dark"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};