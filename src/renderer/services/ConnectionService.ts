import { DatabaseConnectionConfig } from "../../main/database/interfaces";

export interface ConnectionServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ConnectionService {
  async getConnections(): Promise<ConnectionServiceResult<DatabaseConnectionConfig[]>> {
    try {
      const result = await window.api.getConnections();
      if (result.success && result.connections) {
        return { success: true, data: result.connections };
      } else {
        return { success: false, error: result.error || "Failed to load connections" };
      }
    } catch (error) {
      console.error("Failed to load connections:", error);
      return { success: false, error: "An unexpected error occurred while loading connections." };
    }
  }

  async saveConnection(connection: DatabaseConnectionConfig): Promise<ConnectionServiceResult<number>> {
    try {
      const result = await window.api.saveConnection(connection);
      if (result.success) {
        return { success: true, data: result.connectionId };
      } else {
        return { success: false, error: result.error || "Failed to save connection" };
      }
    } catch (error) {
      console.error("Failed to save connection:", error);
      return { success: false, error: "An unexpected error occurred while saving connection." };
    }
  }

  async deleteConnection(id: number): Promise<ConnectionServiceResult<void>> {
    try {
      const result = await window.api.deleteConnection(id);
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || "Failed to delete connection" };
      }
    } catch (error) {
      console.error("Failed to delete connection:", error);
      return { success: false, error: "An unexpected error occurred while deleting connection." };
    }
  }

  async testConnection(config: DatabaseConnectionConfig): Promise<ConnectionServiceResult<void>> {
    try {
      const result = await window.api.connectDatabase(config);
      if (result.success) {
        // Disconnect immediately after testing
        await window.api.disconnectDatabase();
        return { success: true };
      } else {
        return { success: false, error: result.error || "Connection test failed" };
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      return { success: false, error: "An unexpected error occurred while testing connection." };
    }
  }
}

export const connectionService = new ConnectionService();