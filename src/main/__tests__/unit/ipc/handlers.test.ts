import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ipcMain } from "electron";

jest.mock("electron");
jest.mock("../../../database/PostgresClient", () => ({
  PostgresClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    executeQuery: jest.fn(),
    getSchemaMetadata: jest.fn(),
    getTableColumns: jest.fn(),
    getTableData: jest.fn(),
    getTableDetails: jest.fn(),
    getQueryPlan: jest.fn(),
  })),
}));
jest.mock("../../../ai/AIService", () => ({
  AIService: jest.fn().mockImplementation(() => ({
    getAvailableProviders: jest.fn(() => []),
    getAvailableModels: jest.fn(() => Promise.resolve([])),
    validateConfig: jest.fn(() => ({ isValid: true, errors: [] })),
    saveConfig: jest.fn(() => Promise.resolve()),
    getConfig: jest.fn(() => Promise.resolve(null)),
    createQuery: jest.fn(),
    explainQuery: jest.fn(),
    optimizeQuery: jest.fn(),
    analyzePlan: jest.fn(),
    analyzeData: jest.fn(),
  })),
}));

const getPostgresMock = () =>
  (
    jest.requireMock("../../../database/PostgresClient") as {
      PostgresClient: jest.Mock;
    }
  ).PostgresClient;

const getHandleMock = () => ipcMain.handle as unknown as jest.Mock;

const createStorage = () => ({
  saveConnection: jest.fn(async () => 77),
  getConnections: jest.fn(async () => [{ id: 77, name: "saved" }]),
  addQueryHistory: jest.fn(async () => undefined),
  deleteConnection: jest.fn(async () => undefined),
});

const setupHandlers = async (storage: any) => {
  getHandleMock().mockClear();
  await jest.isolateModulesAsync(async () => {
    const module = await import("../../../ipc/handlers");
    await module.initializeIpcHandlers(storage);
  });
};

describe("IPC handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers core channels and saves connection on connect", async () => {
    const storage = createStorage();
    const mockClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      executeQuery: jest.fn(async () => ({
        rows: [],
        columns: [],
        rowCount: 0,
        duration: 12,
      })),
      getSchemaMetadata: jest.fn(async () => ({ databases: [], schemas: [] })),
      getTableColumns: jest.fn(),
      getTableData: jest.fn(),
      getTableDetails: jest.fn(),
      getQueryPlan: jest.fn(),
    };
    getPostgresMock().mockImplementation(() => mockClient);

    await setupHandlers(storage);

    const handleCalls = getHandleMock().mock.calls as Array<[string, Function]>;
    const channels = handleCalls.map(([channel]) => channel);
    expect(channels).toEqual(
      expect.arrayContaining([
        "connect-database",
        "disconnect-database",
        "execute-query",
        "get-schema-info",
        "get-connections",
        "save-connection",
      ])
    );

    const connectHandler = handleCalls.find(
      ([channel]) => channel === "connect-database"
    )?.[1] as Function;
    const executeHandler = handleCalls.find(
      ([channel]) => channel === "execute-query"
    )?.[1] as Function;

    const config = {
      name: "Local",
      type: "postgres",
      host: "localhost",
      port: 5432,
      database: "postgres",
      username: "admin",
      password: "secret",
      ssl: false,
    };

    const connectResult = await connectHandler({}, config);
    expect(connectResult).toEqual({ success: true, connectionId: 77 });
    expect(storage.saveConnection).toHaveBeenCalled();
    expect(mockClient.connect).toHaveBeenCalledWith(config);

    const executeResult = await executeHandler({}, "SELECT 1");
    expect(executeResult).toEqual({
      success: true,
      result: { rows: [], columns: [], rowCount: 0, duration: 12 },
    });
    expect(
      storage.addQueryHistory as unknown as jest.Mock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: 77,
        query: "SELECT 1",
        success: true,
      })
    );
  });

  it("returns an error when executing queries without a connection", async () => {
    const storage = createStorage();
    getPostgresMock().mockImplementation(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      executeQuery: jest.fn(),
    }));

    await setupHandlers(storage);

    const handleCalls = getHandleMock().mock.calls as Array<[string, Function]>;
    const executeHandler = handleCalls.find(
      ([channel]) => channel === "execute-query"
    )?.[1] as Function;

    const response = await executeHandler({}, "SELECT 1");
    expect(response).toEqual({
      success: false,
      error: "No database connection",
    });
  });

  it("delegates connection listing to the storage manager", async () => {
    const storage = createStorage();
    getPostgresMock().mockImplementation(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      executeQuery: jest.fn(),
    }));

    await setupHandlers(storage);

    const handleCalls = getHandleMock().mock.calls as Array<[string, Function]>;
    const handler = handleCalls.find(
      ([channel]) => channel === "get-connections"
    )?.[1] as Function;

    const result = await handler();
    expect(result).toEqual({
      success: true,
      connections: [{ id: 77, name: "saved" }],
    });
    expect(storage.getConnections).toHaveBeenCalled();
  });
});
