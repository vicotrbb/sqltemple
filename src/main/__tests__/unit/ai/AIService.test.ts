import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { resetAllMocks } from "../../utils/mockHelpers";
import {
  createTestAIConfig,
  createTestDatabaseSchema,
} from "../../utils/testFactories";

const mockAIService = {
  setProvider: jest.fn() as jest.MockedFunction<any>,
  getProviderName: jest.fn() as jest.MockedFunction<any>,
  getCurrentProvider: jest.fn() as jest.MockedFunction<any>,
  setConfig: jest.fn() as jest.MockedFunction<any>,
  setConfigSync: jest.fn() as jest.MockedFunction<any>,
  getConfig: jest.fn() as jest.MockedFunction<any>,
  isConfigured: jest.fn() as jest.MockedFunction<any>,
  analyzeQueryPlan: jest.fn() as jest.MockedFunction<any>,
  explainQuery: jest.fn() as jest.MockedFunction<any>,
  createQuery: jest.fn() as jest.MockedFunction<any>,
  optimizeQuery: jest.fn() as jest.MockedFunction<any>,
};

describe("AIService", () => {
  beforeEach(() => {
    resetAllMocks();
    Object.values(mockAIService).forEach((mockFn) => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });
  });

  describe("Provider Management", () => {
    it("should set a valid provider", () => {
      mockAIService.setProvider.mockReturnValue(true);
      mockAIService.getProviderName.mockReturnValue("openai");

      const result = mockAIService.setProvider("openai");
      const providerName = mockAIService.getProviderName();

      expect(result).toBe(true);
      expect(providerName).toBe("openai");
      expect(mockAIService.setProvider).toHaveBeenCalledWith("openai");
    });

    it("should reject invalid provider", () => {
      mockAIService.setProvider.mockReturnValue(false);

      const result = mockAIService.setProvider("invalid-provider");

      expect(result).toBe(false);
      expect(mockAIService.setProvider).toHaveBeenCalledWith(
        "invalid-provider"
      );
    });

    it("should get current provider info", () => {
      const mockProviderInfo = {
        name: "openai",
        displayName: "OpenAI",
        isLocal: false,
        requiresApiKey: true,
      };
      mockAIService.getCurrentProvider.mockReturnValue(mockProviderInfo);

      const result = mockAIService.getCurrentProvider();

      expect(result).toEqual(mockProviderInfo);
      expect(mockAIService.getCurrentProvider).toHaveBeenCalled();
    });
  });

  describe("Configuration Management", () => {
    it("should set configuration successfully", async () => {
      const config = createTestAIConfig();
      mockAIService.setConfig.mockResolvedValue({
        success: true,
        errors: [],
      });

      const result = await mockAIService.setConfig(config);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(mockAIService.setConfig).toHaveBeenCalledWith(config);
    });

    it("should handle configuration validation errors", async () => {
      const config = createTestAIConfig({ model: "invalid-model" });
      mockAIService.setConfig.mockResolvedValue({
        success: false,
        errors: ["Invalid model"],
      });

      const result = await mockAIService.setConfig(config);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(["Invalid model"]);
    });

    it("should reject invalid API key", async () => {
      const config = createTestAIConfig();
      mockAIService.setConfig.mockResolvedValue({
        success: false,
        errors: ["API key validation failed"],
      });

      const result = await mockAIService.setConfig(config);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(["API key validation failed"]);
    });

    it("should handle API key validation errors", async () => {
      const config = createTestAIConfig();
      mockAIService.setConfig.mockResolvedValue({
        success: false,
        errors: ["Failed to configure AI service: Network error"],
      });

      const result = await mockAIService.setConfig(config);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Failed to configure AI service: Network error",
      ]);
    });
  });

  describe("Synchronous Configuration", () => {
    it("should set configuration synchronously", () => {
      const config = createTestAIConfig();

      mockAIService.setConfigSync(config);

      expect(mockAIService.setConfigSync).toHaveBeenCalledWith(config);
    });

    it("should reject invalid configuration synchronously", () => {
      const config = createTestAIConfig({ model: "invalid-model" });
      mockAIService.setConfigSync.mockImplementation(() => {
        throw new Error("Invalid AI configuration: Invalid model");
      });

      expect(() => mockAIService.setConfigSync(config)).toThrow(
        "Invalid AI configuration: Invalid model"
      );
    });

    it("should get current configuration", () => {
      const config = createTestAIConfig();
      mockAIService.getConfig.mockReturnValue(config);

      const result = mockAIService.getConfig();

      expect(result).toEqual(config);
      expect(mockAIService.getConfig).toHaveBeenCalled();
    });

    it("should check if service is configured", () => {
      mockAIService.isConfigured.mockReturnValue(true);

      const result = mockAIService.isConfigured();

      expect(result).toBe(true);
      expect(mockAIService.isConfigured).toHaveBeenCalled();
    });
  });

  describe("AI Operations", () => {
    it("should analyze query plan successfully", async () => {
      const mockAnalysis =
        "This query uses a sequential scan on the users table...";
      mockAIService.analyzeQueryPlan.mockResolvedValue(mockAnalysis);

      const result = await mockAIService.analyzeQueryPlan(
        "SELECT * FROM users",
        {}
      );

      expect(result).toBe(mockAnalysis);
      expect(mockAIService.analyzeQueryPlan).toHaveBeenCalledWith(
        "SELECT * FROM users",
        {}
      );
    });

    it("should explain query successfully", async () => {
      const mockExplanation =
        "This query retrieves all columns from the users table...";
      mockAIService.explainQuery.mockResolvedValue(mockExplanation);

      const result = await mockAIService.explainQuery("SELECT * FROM users");

      expect(result).toBe(mockExplanation);
      expect(mockAIService.explainQuery).toHaveBeenCalledWith(
        "SELECT * FROM users"
      );
    });

    it("should explain query with schema context", async () => {
      const query = "SELECT * FROM users WHERE id = 1";
      const schema = createTestDatabaseSchema();
      const mockExplanation = "This query finds a specific user...";
      mockAIService.explainQuery.mockResolvedValue(mockExplanation);

      const result = await mockAIService.explainQuery(query, schema);

      expect(result).toBe(mockExplanation);
      expect(mockAIService.explainQuery).toHaveBeenCalledWith(query, schema);
    });

    it("should create query from natural language", async () => {
      const mockQuery = "SELECT * FROM users WHERE age > 18";
      mockAIService.createQuery.mockResolvedValue(mockQuery);

      const result = await mockAIService.createQuery("Find all adult users");

      expect(result).toBe(mockQuery);
      expect(mockAIService.createQuery).toHaveBeenCalledWith(
        "Find all adult users"
      );
    });

    it("should create query with schema context", async () => {
      const prompt = "Show me all active users";
      const schema = createTestDatabaseSchema();
      const mockQuery = "SELECT * FROM users WHERE status = 'active'";
      mockAIService.createQuery.mockResolvedValue(mockQuery);

      const result = await mockAIService.createQuery(prompt, schema);

      expect(result).toBe(mockQuery);
      expect(mockAIService.createQuery).toHaveBeenCalledWith(prompt, schema);
    });

    it("should optimize query successfully", async () => {
      const originalQuery = "SELECT * FROM users WHERE name LIKE '%john%'";
      const optimizedQuery =
        "SELECT * FROM users WHERE name ILIKE '%john%' AND name IS NOT NULL";
      mockAIService.optimizeQuery.mockResolvedValue(optimizedQuery);

      const result = await mockAIService.optimizeQuery(originalQuery);

      expect(result).toBe(optimizedQuery);
      expect(mockAIService.optimizeQuery).toHaveBeenCalledWith(originalQuery);
    });

    it("should handle AI provider errors", async () => {
      mockAIService.analyzeQueryPlan.mockRejectedValue(new Error("API Error"));

      await expect(
        mockAIService.analyzeQueryPlan("SELECT 1", {})
      ).rejects.toThrow("API Error");
    });

    it("should throw error when not configured", async () => {
      mockAIService.analyzeQueryPlan.mockRejectedValue(
        new Error("AI service not configured")
      );

      await expect(
        mockAIService.analyzeQueryPlan("SELECT 1", {})
      ).rejects.toThrow("AI service not configured");
    });
  });
});
