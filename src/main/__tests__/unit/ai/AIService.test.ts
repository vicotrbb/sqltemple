import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { AIService } from "../../../ai/AIService";
import { aiProviderRegistry } from "../../../ai/AIProviderRegistry";
import { AIConfig, AIProvider } from "../../../ai/providers/AIProvider";

const createProvider = () => {
  const provider: AIProvider = {
    name: "test",
    displayName: "Test Provider",
    isLocal: false,
    defaultBaseUrl: undefined,
    validateConfig: jest.fn(() => ({ isValid: true, errors: [] })),
    validateApiKey: jest.fn(() => Promise.resolve({ isValid: true })),
    getAvailableModels: jest.fn(() => Promise.resolve(["test-model"])),
    complete: jest.fn(() =>
      Promise.resolve({
        content: "```sql\nSELECT 1;\n```",
      })
    ),
    supportsStreaming: () => false,
    supportsVision: () => false,
    supportsToolCalling: () => false,
    requiresApiKey: () => true,
  };
  return provider;
};

describe("AIService", () => {
  let storageManager: any;
  let provider: ReturnType<typeof createProvider>;
  let service: AIService;

  beforeEach(() => {
    const getAIConfigMock = jest
      .fn(async () => ({
        provider: "test",
        apiKey: "sk-test",
        model: "test-model",
      }))
      .mockResolvedValue({
        provider: "test",
        apiKey: "sk-test",
        model: "test-model",
      }) as jest.MockedFunction<() => Promise<any>>;

    const saveAIConfigMock = jest
      .fn(async () => undefined)
      .mockResolvedValue(undefined) as jest.MockedFunction<
      (config: any) => Promise<void>
    >;

    storageManager = {
      getAIConfig: getAIConfigMock,
      saveAIConfig: saveAIConfigMock,
    };

    provider = createProvider();

    jest
      .spyOn(aiProviderRegistry, "getProvider")
      .mockImplementation((name: string) =>
        name === "test" ? provider : null
      );
    jest
      .spyOn(aiProviderRegistry, "getAllProviders")
      .mockImplementation(() => [provider]);

    service = new AIService(storageManager as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists available providers with metadata", () => {
    const providers = service.getAvailableProviders();
    expect(providers).toEqual([
      {
        name: "test",
        displayName: "Test Provider",
        isLocal: false,
        requiresApiKey: true,
      },
    ]);
  });

  it("cleans markdown fences from generated SQL", async () => {
    const sql = await service.createQuery("Generate a query", {} as any);

    expect(provider.complete).toHaveBeenCalled();
    expect(sql).toBe("SELECT 1;");
  });

  it("validates API configuration using provider rules", async () => {
    const config: AIConfig = {
      provider: "test",
      apiKey: "sk-test",
      model: "test-model",
    };

    const result = service.validateConfig(config);

    expect(provider.validateConfig).toHaveBeenCalledWith(config);
    expect(result.isValid).toBe(true);
  });

  it("throws when provider configuration is missing", async () => {
    storageManager.getAIConfig.mockResolvedValue(null);

    await expect(service.createQuery("select", {} as any)).rejects.toThrow(
      /not configured/i
    );
  });
});
