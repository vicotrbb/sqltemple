import { jest } from "@jest/globals";

/**
 * Reset all mocks to their initial state
 */
export const resetAllMocks = (): void => {
  jest.clearAllMocks();
};

/**
 * Setup mock for successful database connection
 */
export const setupMockDatabaseConnection = (_config?: any): void => {
  // Mock implementation - would set up pg client mock
};

/**
 * Setup mock for failed database connection
 */
export const setupMockDatabaseConnectionFailure = (
  _error?: Error,
  _config?: any
): void => {
  // Mock implementation - would set up pg client connection failure
};

/**
 * Setup mock for successful AI provider response
 */
export const setupMockAIResponse = (
  content: string,
  provider: string = "openai",
  _apiKey: string = "test-key"
): void => {
  // Mock implementation would be added here if needed
  console.log(`Setting up AI response for ${provider}:`, content);
};

/**
 * Setup mock for AI provider error
 */
export const setupMockAIError = (
  error: Error,
  provider: string = "openai",
  _apiKey: string = "test-key"
): void => {
  // Mock implementation would be added here if needed
  console.log(`Setting up AI error for ${provider}:`, error.message);
};

/**
 * Setup mock for SQLite database operations
 */
export const setupMockSQLite = (_dbPath: string = ":memory:"): void => {
  // Mock implementation - would set up better-sqlite3 mock
};

/**
 * Setup mock for file dialog operations
 */
export const setupMockFileDialogs = (): void => {
  // Mock implementation - would set up electron dialog mocks
};

/**
 * Setup mock for IPC handlers
 */
export const setupMockIPC = (): void => {
  // Mock implementation - would set up IPC main handlers
};

/**
 * Invoke a mock IPC handler
 */
export const invokeMockIPC = async (
  _channel: string,
  ..._args: any[]
): Promise<any> => {
  // Mock implementation - would invoke registered IPC handler
  return Promise.resolve();
};

/**
 * Setup mock for Electron app paths
 */
export const setupMockAppPaths = (
  _paths: { [key: string]: string } = {}
): void => {
  // Mock implementation - would set up electron app.getPath mock
};

/**
 * Create a mock event object for IPC handlers
 */
export const createMockEvent = (overrides: any = {}) => ({
  sender: {
    id: 1,
    send: jest.fn(),
    ...overrides.sender,
  },
  preventDefault: jest.fn(),
  reply: jest.fn(),
  ...overrides,
});

/**
 * Wait for all promises to resolve (useful for async test cleanup)
 */
export const flushPromises = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Create a mock timer for testing time-dependent code
 */
export const setupMockTimer = (): void => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
};

/**
 * Restore real timers
 */
export const restoreTimers = (): void => {
  jest.useRealTimers();
};

/**
 * Mock console methods to prevent output during tests
 */
export const setupMockConsole = (): void => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "debug").mockImplementation(() => {});
};

/**
 * Restore console methods
 */
export const restoreConsole = (): void => {
  jest.restoreAllMocks();
};
