import { jest } from "@jest/globals";

export interface MockChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MockOpenAIClient {
  chat: {
    completions: {
      create: jest.MockedFunction<any>;
    };
  };
  models: {
    list: jest.MockedFunction<any>;
  };
}

const createMockCompletion = (
  content: string = "Mock AI response"
): MockChatCompletion => ({
  id: "chatcmpl-mock123",
  object: "chat.completion",
  created: Date.now(),
  model: "gpt-4o-mini",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content,
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
});

const createMockClient = (): MockOpenAIClient => ({
  chat: {
    completions: {
      create: jest.fn(() => Promise.resolve(createMockCompletion())),
    },
  },
  models: {
    list: jest.fn(() =>
      Promise.resolve({
        data: [
          { id: "gpt-4o", object: "model" },
          { id: "gpt-4o-mini", object: "model" },
          { id: "gpt-3.5-turbo", object: "model" },
        ],
      })
    ),
  },
});

// Store mock clients for different API keys
export const mockClients = new Map<string, MockOpenAIClient>();

export default class OpenAI {
  constructor(config: { apiKey: string; baseURL?: string }) {
    const clientKey = `${config.apiKey}-${config.baseURL || "default"}`;

    if (!mockClients.has(clientKey)) {
      mockClients.set(clientKey, createMockClient());
    }

    return mockClients.get(clientKey) as any;
  }
}

// Helper functions for tests
export const getMockClient = (
  apiKey: string,
  baseURL?: string
): MockOpenAIClient => {
  const clientKey = `${apiKey}-${baseURL || "default"}`;
  return mockClients.get(clientKey) || createMockClient();
};

export const clearMockClients = (): void => {
  mockClients.clear();
};

export const setMockCompletionResponse = (
  content: string,
  apiKey: string = "test-key",
  baseURL?: string
): void => {
  const client = getMockClient(apiKey, baseURL);
  client.chat.completions.create.mockResolvedValue(
    createMockCompletion(content)
  );
};

export const setMockCompletionError = (
  error: Error,
  apiKey: string = "test-key",
  baseURL?: string
): void => {
  const client = getMockClient(apiKey, baseURL);
  client.chat.completions.create.mockRejectedValue(error);
};

export const setMockModelsResponse = (
  models: string[],
  apiKey: string = "test-key",
  baseURL?: string
): void => {
  const client = getMockClient(apiKey, baseURL);
  client.models.list.mockResolvedValue({
    data: models.map((id) => ({ id, object: "model" })),
  });
};

export const mockResponses = {
  queryGeneration: createMockCompletion("SELECT * FROM users WHERE id = 1;"),
  queryExplanation: createMockCompletion(
    "This query selects all columns from the users table where the id equals 1."
  ),
  queryOptimization: createMockCompletion(
    "SELECT id, name FROM users WHERE id = 1 LIMIT 1;"
  ),
  planAnalysis: createMockCompletion(
    "The query plan shows a sequential scan which could be optimized with an index."
  ),
};
