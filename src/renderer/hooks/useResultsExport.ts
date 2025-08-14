import { useState } from 'react';
import { QueryResult } from '../../main/database/interfaces';
import { ResultsExporter, ExportOptions } from '../components/ResultsGrid/ResultsExporter';

export const useResultsExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportResults = async (results: QueryResult, options: ExportOptions) => {
    setIsExporting(true);
    setError(null);

    try {
      const exportResult = await ResultsExporter.exportResults(results, options);
      
      const blob = new Blob([exportResult.data], { type: exportResult.mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = exportResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportResults,
    isExporting,
    error,
    clearError: () => setError(null),
  };
};