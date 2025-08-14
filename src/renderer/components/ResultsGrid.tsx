import React from "react";
import { QueryResult } from "../../main/database/interfaces";
import { EnhancedResultsGrid } from "./EnhancedResultsGrid";

interface ResultsGridProps {
  result: QueryResult | null;
  isLoading: boolean;
  currentQuery?: string;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  result,
  isLoading,
  currentQuery,
}) => {
  return (
    <EnhancedResultsGrid 
      result={result} 
      isLoading={isLoading} 
      currentQuery={currentQuery}
    />
  );
};
