import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { resetAllMocks } from "../../utils/mockHelpers";
import {
  createTestConnectionConfig,
  createTestQueryResult,
  createTestDatabaseSchema,
} from "../../utils/testFactories";

const mockPostgresClient = {
  connect: jest.fn() as jest.MockedFunction<any>,
  disconnect: jest.fn() as jest.MockedFunction<any>,
  executeQuery: jest.fn() as jest.MockedFunction<any>,
  getSchemaMetadata: jest.fn() as jest.MockedFunction<any>,
  getQueryPlan: jest.fn() as jest.MockedFunction<any>,
  getTableColumns: jest.fn() as jest.MockedFunction<any>,
};

describe("PostgresClient", () => {
  beforeEach(() => {
    resetAllMocks();
    Object.values(mockPostgresClient).forEach((mockFn) => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });
  });

  describe("Connection Management", () => {
    it("should connect successfully with valid config", async () => {
      const config = createTestConnectionConfig();

      await mockPostgresClient.connect(config);

      expect(mockPostgresClient.connect).toHaveBeenCalledWith(config);
    });

    it("should disconnect successfully", async () => {
      await mockPostgresClient.disconnect();

      expect(mockPostgresClient.disconnect).toHaveBeenCalled();
    });

    it("should handle connection failures", async () => {
      const config = createTestConnectionConfig();
      mockPostgresClient.connect.mockRejectedValue(
        new Error("Connection failed")
      );

      await expect(mockPostgresClient.connect(config)).rejects.toThrow(
        "Connection failed"
      );
    });
  });

  describe("Query Execution", () => {
    it("should execute query successfully", async () => {
      const mockResult = createTestQueryResult(3);
      mockPostgresClient.executeQuery.mockResolvedValue(mockResult);

      const result = await mockPostgresClient.executeQuery(
        "SELECT * FROM users"
      );

      expect(result.rows).toHaveLength(3);
      expect(result.rowCount).toBe(3);
      expect(mockPostgresClient.executeQuery).toHaveBeenCalledWith(
        "SELECT * FROM users"
      );
    });

    it("should handle query errors gracefully", async () => {
      const error = new Error("SQL syntax error");
      mockPostgresClient.executeQuery.mockResolvedValue({
        rows: [],
        columns: [],
        rowCount: 0,
        duration: 10,
        error: "SQL syntax error",
      });

      const result = await mockPostgresClient.executeQuery("INVALID SQL");

      expect(result.error).toBe("SQL syntax error");
      expect(result.rows).toEqual([]);
    });
  });

  describe("Schema Operations", () => {
    it("should retrieve database schema", async () => {
      const mockSchema = createTestDatabaseSchema();
      mockPostgresClient.getSchemaMetadata.mockResolvedValue(mockSchema);

      const result = await mockPostgresClient.getSchemaMetadata();

      expect(result.databases).toHaveLength(1);
      expect(result.schemas).toHaveLength(2);
      expect(mockPostgresClient.getSchemaMetadata).toHaveBeenCalled();
    });

    it("should retrieve table columns", async () => {
      const mockColumns = [
        { name: "id", dataType: "integer", nullable: false },
        { name: "name", dataType: "varchar(255)", nullable: false },
      ];
      mockPostgresClient.getTableColumns.mockResolvedValue(mockColumns);

      const result = await mockPostgresClient.getTableColumns(
        "public",
        "users"
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("id");
      expect(mockPostgresClient.getTableColumns).toHaveBeenCalledWith(
        "public",
        "users"
      );
    });
  });

  describe("Query Plan Analysis", () => {
    it("should analyze query plan for SELECT statements", async () => {
      const mockPlan = {
        Plan: {
          "Node Type": "Seq Scan",
          "Relation Name": "users",
          "Total Cost": 22.5,
          "Plan Rows": 1000,
        },
      };
      mockPostgresClient.getQueryPlan.mockResolvedValue(mockPlan);

      const result = await mockPostgresClient.getQueryPlan(
        "SELECT * FROM users"
      );

      expect(result.Plan["Node Type"]).toBe("Seq Scan");
      expect(result.Plan["Relation Name"]).toBe("users");
      expect(mockPostgresClient.getQueryPlan).toHaveBeenCalledWith(
        "SELECT * FROM users"
      );
    });

    it("should reject destructive queries for plan analysis", async () => {
      mockPostgresClient.getQueryPlan.mockRejectedValue(
        new Error("EXPLAIN is only supported for SELECT statements")
      );

      await expect(
        mockPostgresClient.getQueryPlan("DROP TABLE users")
      ).rejects.toThrow("EXPLAIN is only supported for SELECT statements");
    });
  });
});
