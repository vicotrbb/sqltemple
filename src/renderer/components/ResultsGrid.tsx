import React from "react";
import { QueryResult } from "../../main/database/interfaces";
import { EnhancedResultsGrid } from "./EnhancedResultsGrid";

interface ResultsGridProps {
  result: QueryResult | null;
  isLoading: boolean;
  currentQuery?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isAppending?: boolean;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  result,
  isLoading,
  currentQuery,
  onLoadMore,
  hasMore,
  isAppending,
}) => {
  return (
    <EnhancedResultsGrid
      result={result}
      isLoading={isLoading}
      currentQuery={currentQuery}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isAppending={isAppending}
    />
  );
};
