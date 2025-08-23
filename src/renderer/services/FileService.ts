import { DatabaseConnectionConfig } from "../../main/database/interfaces";
import { errorService, ErrorLevel, ErrorCategory } from "./ErrorService";

export interface FileServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  canceled?: boolean;
}

export interface QueryFileResult {
  content: string;
  fileName?: string;
}

export interface ConnectionsFileResult {
  connections: DatabaseConnectionConfig[];
}

export interface ExportResult {
  count: number;
  filePath: string;
}

export class FileService {
  async openQueryFile(): Promise<FileServiceResult<QueryFileResult>> {
    try {
      const result = await window.api.openQueryFile();
      if (result.success && result.content) {
        return {
          success: true,
          data: {
            content: result.content,
            fileName: result.fileName,
          },
        };
      } else if (result.canceled) {
        return { success: false, canceled: true };
      } else {
        return { success: false, error: result.error || "Failed to open file" };
      }
    } catch (error) {
      const errorId = errorService.logFileError(
        "File open operation failed", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "An unexpected error occurred while opening the file." };
    }
  }

  async saveQueryFile(content: string, currentFilePath?: string): Promise<FileServiceResult<QueryFileResult>> {
    if (!content.trim()) {
      return { success: false, error: "Cannot save empty content" };
    }

    try {
      const result = await window.api.saveQueryFile(content, currentFilePath);
      if (result.success && result.fileName) {
        return {
          success: true,
          data: {
            content,
            fileName: result.fileName,
          },
        };
      } else if (result.canceled) {
        return { success: false, canceled: true };
      } else {
        return { success: false, error: result.error || "Failed to save file" };
      }
    } catch (error) {
      const errorId = errorService.logFileError(
        "File save operation failed", 
        error instanceof Error ? error.message : String(error),
        { filePath: currentFilePath }
      );
      return { success: false, error: "An unexpected error occurred while saving the file." };
    }
  }

  async saveQueryFileAs(content: string): Promise<FileServiceResult<QueryFileResult>> {
    if (!content.trim()) {
      return { success: false, error: "Cannot save empty content" };
    }

    try {
      const result = await window.api.saveQueryFileAs(content);
      if (result.success && result.fileName) {
        return {
          success: true,
          data: {
            content,
            fileName: result.fileName,
          },
        };
      } else if (result.canceled) {
        return { success: false, canceled: true };
      } else {
        return { success: false, error: result.error || "Failed to save file" };
      }
    } catch (error) {
      const errorId = errorService.logFileError(
        "File save-as operation failed", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "An unexpected error occurred while saving the file." };
    }
  }

  async importConnections(): Promise<FileServiceResult<{ imported: number; failed: number }>> {
    try {
      const result = await window.api.importConnections();
      if (result.success && result.connections) {
        let importedCount = 0;
        let failedCount = 0;

        for (const connection of result.connections) {
          try {
            await window.api.saveConnection(connection);
            importedCount++;
          } catch (error) {
            errorService.logError(
              ErrorLevel.WARNING, 
              ErrorCategory.FILE, 
              "Failed to import connection",
              {
                details: error instanceof Error ? error.message : String(error),
                context: { connectionName: connection.name },
                userMessage: `Failed to import connection '${connection.name}'`
              }
            );
            failedCount++;
          }
        }

        return {
          success: true,
          data: { imported: importedCount, failed: failedCount },
        };
      } else if (result.canceled) {
        return { success: false, canceled: true };
      } else {
        return { success: false, error: result.error || "Failed to import connections" };
      }
    } catch (error) {
      const errorId = errorService.logFileError(
        "Connections import failed", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "An unexpected error occurred while importing connections." };
    }
  }

  async exportConnections(): Promise<FileServiceResult<ExportResult>> {
    try {
      const result = await window.api.exportConnections();
      if (result.success) {
        return {
          success: true,
          data: {
            count: result.count || 0,
            filePath: result.filePath || '',
          },
        };
      } else if (result.canceled) {
        return { success: false, canceled: true };
      } else {
        return { success: false, error: result.error || "Failed to export connections" };
      }
    } catch (error) {
      const errorId = errorService.logFileError(
        "Connections export failed", 
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: "An unexpected error occurred while exporting connections." };
    }
  }
}

export const fileService = new FileService();