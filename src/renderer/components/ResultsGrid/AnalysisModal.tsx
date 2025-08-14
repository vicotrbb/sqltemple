import React from 'react';
import { AnalysisResponse } from './ResultsAnalyzer';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  error
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-vscode-bg border border-vscode-border rounded-lg p-6 w-4/5 max-w-4xl max-h-4/5 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-vscode-text">AI Data Analysis</h2>
          <button
            onClick={onClose}
            className="text-vscode-text-secondary hover:text-vscode-text"
          >
            ✕
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vscode-blue"></div>
            <span className="ml-2 text-vscode-text">Analyzing data...</span>
          </div>
        )}

        {error && (
          <div className="bg-vscode-red bg-opacity-10 border border-vscode-red border-opacity-30 rounded p-3 mb-4">
            <p className="text-vscode-red">{error}</p>
          </div>
        )}

        {analysis && !isLoading && (
          <div className="space-y-6">
            <section>
              <h3 className="text-md font-medium text-vscode-text mb-2">Summary</h3>
              <p className="text-vscode-text-secondary bg-vscode-bg-secondary p-3 rounded">
                {analysis.summary}
              </p>
            </section>

            <section>
              <h3 className="text-md font-medium text-vscode-text mb-2">Data Quality</h3>
              <div className="grid grid-cols-3 gap-4 bg-vscode-bg-secondary p-3 rounded">
                <div className="text-center">
                  <div className="text-lg font-semibold text-vscode-text">
                    {analysis.dataQuality.nullPercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-vscode-text-secondary">NULL Values</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-vscode-text">
                    {analysis.dataQuality.duplicateCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-vscode-text-secondary">Duplicates</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-vscode-text">
                    {analysis.dataQuality.uniqueValues.toLocaleString()}
                  </div>
                  <div className="text-sm text-vscode-text-secondary">Unique Values</div>
                </div>
              </div>
            </section>

            {analysis.insights.length > 0 && (
              <section>
                <h3 className="text-md font-medium text-vscode-text mb-2">Key Insights</h3>
                <ul className="space-y-2">
                  {analysis.insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-vscode-blue mr-2">•</span>
                      <span className="text-vscode-text-secondary">{insight}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {analysis.patterns.length > 0 && (
              <section>
                <h3 className="text-md font-medium text-vscode-text mb-2">Patterns Detected</h3>
                <ul className="space-y-2">
                  {analysis.patterns.map((pattern, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-vscode-green mr-2">•</span>
                      <span className="text-vscode-text-secondary">{pattern}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {analysis.recommendations.length > 0 && (
              <section>
                <h3 className="text-md font-medium text-vscode-text mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-vscode-yellow mr-2">•</span>
                      <span className="text-vscode-text-secondary">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-vscode-blue text-white rounded hover:bg-vscode-blue-dark"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};