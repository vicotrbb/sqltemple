import { jest } from "@jest/globals";

// Mock Electron APIs globally
jest.mock("electron", () => ({
  app: {
    getPath: jest.fn(() => "/tmp/test"),
    isPackaged: false,
    on: jest.fn(),
    quit: jest.fn(),
  },
  BrowserWindow: jest.fn(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      on: jest.fn(),
    },
  })),
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  Menu: {
    setApplicationMenu: jest.fn(),
  },
}));

// Mock electron-updater
jest.mock("electron-updater", () => ({
  autoUpdater: {
    setFeedURL: jest.fn(),
    checkForUpdatesAndNotify: jest.fn(),
    on: jest.fn(),
  },
}));

// Mock better-sqlite3 using in-memory implementation
jest.mock("better-sqlite3", () =>
  require("./mocks/inMemoryBetterSqlite").createBetterSqliteMock()
);

// Mock pg
jest.mock("pg", () => ({
  Client: jest.fn(() => ({
    connect: jest.fn(),
    end: jest.fn(),
    query: jest.fn(),
  })),
}));

// Mock crypto for consistent tests
Object.defineProperty(global, "crypto", {
  value: {
    randomBytes: jest.fn(() => Buffer.from("mock-random-bytes-32-chars-long")),
    createCipheriv: jest.fn(() => ({
      update: jest.fn(() => "encrypted-data"),
      final: jest.fn(() => ""),
    })),
    createDecipheriv: jest.fn(() => ({
      update: jest.fn(() => "decrypted-data"),
      final: jest.fn(() => ""),
    })),
  },
});

// Mock fs for file operations
jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

// Mock path module for consistent path handling
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  basename: jest.fn((filePath: string, ext?: string) => {
    const base = filePath.split("/").pop() || "";
    return ext ? base.replace(ext, "") : base;
  }),
  extname: jest.fn((filePath: string) => {
    const parts = filePath.split(".");
    return parts.length > 1 ? `.${parts.pop()}` : "";
  }),
}));

// Set up test environment variables
process.env.NODE_ENV = "test";
process.env.TEST_MODE = "true";

// Global test configuration
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any test state
  jest.restoreAllMocks();
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console output during tests (uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
