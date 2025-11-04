import { jest } from "@jest/globals";
import { mockIpcMain } from "../__mocks__/electron";

export interface IPCTestHelper {
  registerHandler: (channel: string, handler: Function) => void;
  invokeHandler: (channel: string, ...args: any[]) => Promise<any>;
  getRegisteredHandlers: () => string[];
  clearHandlers: () => void;
  mockEvent: any;
}

/**
 * Helper class for testing IPC communications
 */
class IPCTestHelperImpl implements IPCTestHelper {
  private handlers = new Map<string, Function>();

  public mockEvent = {
    sender: {
      id: 1,
      send: jest.fn(),
      webContents: {
        id: 1,
        send: jest.fn(),
      },
    },
    preventDefault: jest.fn(),
    reply: jest.fn(),
    returnValue: undefined,
  };

  constructor() {
    this.setupMockIPC();
  }

  private setupMockIPC(): void {
    mockIpcMain.handle.mockImplementation((...args: any[]) => {
      const [channel, handler] = args;
      this.handlers.set(channel, handler);
      return Promise.resolve();
    });

    mockIpcMain.on.mockImplementation((...args: any[]) => {
      const [channel, handler] = args;
      this.handlers.set(channel, handler);
      return mockIpcMain;
    });
  }

  /**
   * Register a mock IPC handler
   */
  registerHandler(channel: string, handler: Function): void {
    this.handlers.set(channel, handler);
  }

  /**
   * Invoke a registered IPC handler
   */
  async invokeHandler(channel: string, ...args: any[]): Promise<any> {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for channel: ${channel}`);
    }

    return await handler(this.mockEvent, ...args);
  }

  /**
   * Get list of registered handler channels
   */
  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all registered handlers
   */
  clearHandlers(): void {
    this.handlers.clear();
    mockIpcMain.handle.mockClear();
    mockIpcMain.on.mockClear();
  }

  /**
   * Create a mock browser window for testing
   */
  createMockBrowserWindow(id: number = 1) {
    return {
      id,
      webContents: {
        id,
        send: jest.fn(),
        executeJavaScript: jest.fn(),
        on: jest.fn(),
      },
      on: jest.fn(),
      close: jest.fn(),
      minimize: jest.fn(),
      maximize: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
    };
  }

  /**
   * Simulate an IPC event from the renderer
   */
  simulateRendererEvent(channel: string, ...args: any[]): void {
    const handler = this.handlers.get(channel);
    if (handler) {
      handler(this.mockEvent, ...args);
    }
  }

  /**
   * Assert that a specific IPC handler was registered
   */
  expectHandlerRegistered(channel: string): void {
    if (!this.handlers.has(channel)) {
      throw new Error(
        `Expected IPC handler for channel '${channel}' to be registered`
      );
    }
  }

  /**
   * Assert that a specific IPC handler was not registered
   */
  expectHandlerNotRegistered(channel: string): void {
    if (this.handlers.has(channel)) {
      throw new Error(
        `Expected IPC handler for channel '${channel}' not to be registered`
      );
    }
  }

  /**
   * Wait for all IPC operations to complete
   */
  async flushIPCOperations(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  /**
   * Create a mock event with custom properties
   */
  createMockEvent(overrides: any = {}) {
    return {
      ...this.mockEvent,
      ...overrides,
      sender: {
        ...this.mockEvent.sender,
        ...overrides.sender,
      },
    };
  }
}

// Export singleton instance
export const ipcTestHelper = new IPCTestHelperImpl();

/**
 * Helper function to test IPC error handling
 */
export const testIPCErrorHandling = async (
  channel: string,
  errorToThrow: Error,
  args: any[] = []
): Promise<any> => {
  // Register a handler that throws the specified error
  ipcTestHelper.registerHandler(channel, async () => {
    throw errorToThrow;
  });

  return await ipcTestHelper.invokeHandler(channel, ...args);
};

/**
 * Helper function to test IPC success scenarios
 */
export const testIPCSuccessHandling = async (
  channel: string,
  expectedResult: any,
  args: any[] = []
): Promise<any> => {
  // Register a handler that returns the expected result
  ipcTestHelper.registerHandler(channel, async () => {
    return expectedResult;
  });

  const result = await ipcTestHelper.invokeHandler(channel, ...args);
  return result;
};
