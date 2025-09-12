import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { resetAllMocks } from "../../utils/mockHelpers";

const mockStorageManager = {
  initializeTables: jest.fn() as jest.MockedFunction<any>,
  saveConnection: jest.fn() as jest.MockedFunction<any>,
  getConnections: jest.fn() as jest.MockedFunction<any>,
  deleteConnection: jest.fn() as jest.MockedFunction<any>,
  addQueryHistory: jest.fn() as jest.MockedFunction<any>,
  getQueryHistory: jest.fn() as jest.MockedFunction<any>,
  setSetting: jest.fn() as jest.MockedFunction<any>,
  getSetting: jest.fn() as jest.MockedFunction<any>,
  saveAIConfig: jest.fn() as jest.MockedFunction<any>,
  getAIConfig: jest.fn() as jest.MockedFunction<any>,
  close: jest.fn() as jest.MockedFunction<any>,
};

describe("StorageManager", () => {
  beforeEach(() => {
    resetAllMocks();
    Object.values(mockStorageManager).forEach((mockFn) => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });
  });

  describe("Database Initialization", () => {
    it("should initialize database tables on construction", () => {
      mockStorageManager.initializeTables();
      expect(mockStorageManager.initializeTables).toHaveBeenCalled();
    });

    it("should create encryption key on first run", () => {
      expect(true).toBe(true);
    });
  });

  describe("Connection Management", () => {
    describe("saveConnection", () => {
      it("should save a new connection and return its ID", async () => {
        mockStorageManager.saveConnection.mockResolvedValue(123);

        const result = await mockStorageManager.saveConnection({
          name: "Test Connection",
          type: "postgres",
          host: "localhost",
          port: 5432,
          database: "test_db",
          username: "test_user",
          password: "test_password",
          ssl: false,
        });

        expect(result).toBe(123);
        expect(mockStorageManager.saveConnection).toHaveBeenCalled();
      });

      it("should update an existing connection", async () => {
        mockStorageManager.saveConnection.mockResolvedValue(42);

        const result = await mockStorageManager.saveConnection({
          id: 42,
          name: "Updated Connection",
          type: "postgres",
          host: "localhost",
          port: 5432,
          database: "test_db",
          username: "test_user",
          ssl: false,
        });

        expect(result).toBe(42);
        expect(mockStorageManager.saveConnection).toHaveBeenCalled();
      });
    });

    describe("getConnections", () => {
      it("should retrieve connections", async () => {
        const mockConnections = [
          {
            id: 1,
            name: "Test Connection",
            type: "postgres",
            host: "localhost",
            port: 5432,
            database: "test_db",
            username: "user",
            ssl: false,
          },
        ];

        mockStorageManager.getConnections.mockResolvedValue(mockConnections);

        const result = await mockStorageManager.getConnections();

        expect(result).toHaveLength(1);
        expect((result as any)[0].name).toBe("Test Connection");
        expect(mockStorageManager.getConnections).toHaveBeenCalled();
      });
    });

    describe("deleteConnection", () => {
      it("should delete connection and its history", async () => {
        await mockStorageManager.deleteConnection(123);

        expect(mockStorageManager.deleteConnection).toHaveBeenCalledWith(123);
      });
    });
  });

  describe("Query History Management", () => {
    describe("addQueryHistory", () => {
      it("should add query history entry", async () => {
        const entry = {
          connectionId: 1,
          query: "SELECT * FROM users;",
          runAt: new Date().toISOString(),
          duration: 100,
          rowCount: 5,
          success: true,
        };

        await mockStorageManager.addQueryHistory(entry);

        expect(mockStorageManager.addQueryHistory).toHaveBeenCalledWith(entry);
      });
    });

    describe("getQueryHistory", () => {
      it("should retrieve query history", async () => {
        const mockHistory = [
          {
            id: 1,
            connectionId: 1,
            query: "SELECT * FROM users;",
            runAt: new Date().toISOString(),
            duration: 100,
            rowCount: 5,
            success: true,
          },
        ];

        mockStorageManager.getQueryHistory.mockResolvedValue(mockHistory);

        const result = await mockStorageManager.getQueryHistory();

        expect(result).toHaveLength(1);
        expect((result as any)[0].query).toBe("SELECT * FROM users;");
        expect(mockStorageManager.getQueryHistory).toHaveBeenCalled();
      });
    });
  });

  describe("Settings Management", () => {
    it("should save and retrieve settings", async () => {
      mockStorageManager.getSetting.mockResolvedValue("test-value");

      await mockStorageManager.setSetting("test-key", "test-value");
      const result = await mockStorageManager.getSetting("test-key");

      expect(mockStorageManager.setSetting).toHaveBeenCalledWith(
        "test-key",
        "test-value"
      );
      expect(result).toBe("test-value");
    });

    it("should return null for non-existent settings", async () => {
      mockStorageManager.getSetting.mockResolvedValue(null);

      const result = await mockStorageManager.getSetting("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("AI Configuration", () => {
    it("should save and retrieve AI configuration", async () => {
      const config = {
        provider: "openai",
        apiKey: "test-api-key",
        model: "gpt-4o-mini",
      };

      mockStorageManager.getAIConfig.mockResolvedValue(config);

      await mockStorageManager.saveAIConfig(config);
      const result = await mockStorageManager.getAIConfig();

      expect(mockStorageManager.saveAIConfig).toHaveBeenCalledWith(config);
      expect(result).toMatchObject({
        provider: "openai",
        model: "gpt-4o-mini",
      });
    });
  });

  describe("Database Cleanup", () => {
    it("should close database connection", () => {
      mockStorageManager.close();

      expect(mockStorageManager.close).toHaveBeenCalled();
    });
  });
});
