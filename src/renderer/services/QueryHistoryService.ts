import { QueryHistoryEntry } from "../../main/storage/StorageManager";

export interface QueryHistoryServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class QueryHistoryService {
  async getQueryHistory(
    connectionId?: number,
    limit: number = 100
  ): Promise<QueryHistoryServiceResult<QueryHistoryEntry[]>> {
    try {
      const result = await window.api.getQueryHistory(connectionId);
      if (result.success && result.history) {
        return { success: true, data: result.history };
      } else {
        return {
          success: false,
          error: result.error || "Failed to load query history",
        };
      }
    } catch (error) {
      console.error("Failed to load query history:", error);
      return {
        success: false,
        error: "An unexpected error occurred while loading query history.",
      };
    }
  }

  async addQueryToHistory(
    entry: QueryHistoryEntry
  ): Promise<QueryHistoryServiceResult<void>> {
    try {
      // The history is typically added by the main process after query execution
      // This method is here for completeness in case manual history management is needed
      return { success: true };
    } catch (error) {
      console.error("Failed to add query to history:", error);
      return {
        success: false,
        error: "An unexpected error occurred while adding query to history.",
      };
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  truncateQuery(query: string, maxLength: number = 100): string {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + "...";
  }

  formatDuration(duration: number): string {
    if (duration < 1000) {
      return `${duration}ms`;
    } else {
      return `${(duration / 1000).toFixed(2)}s`;
    }
  }

  formatRowCount(rowCount?: number | null): string {
    const safeRowCount =
      typeof rowCount === "number" && !isNaN(rowCount) ? rowCount : 0;

    if (safeRowCount === 1) {
      return "1 row";
    }
    return `${safeRowCount.toLocaleString()} rows`;
  }
}

export const queryHistoryService = new QueryHistoryService();
