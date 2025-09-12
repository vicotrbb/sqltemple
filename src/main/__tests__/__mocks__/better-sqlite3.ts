import { jest } from "@jest/globals";

export interface MockStatement {
  run: jest.MockedFunction<any>;
  get: jest.MockedFunction<any>;
  all: jest.MockedFunction<any>;
  prepare: jest.MockedFunction<any>;
}

export interface MockDatabase {
  exec: jest.MockedFunction<any>;
  prepare: jest.MockedFunction<any>;
  close: jest.MockedFunction<any>;
  statements: Map<string, MockStatement>;
}

const createMockStatement = (): MockStatement => ({
  run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
  get: jest.fn(() => null),
  all: jest.fn(() => []),
  prepare: jest.fn(),
});

const createMockDatabase = (): MockDatabase => {
  const statements = new Map<string, MockStatement>();

  return {
    exec: jest.fn(),
    prepare: jest.fn((sql: string) => {
      if (!statements.has(sql)) {
        statements.set(sql, createMockStatement());
      }
      return statements.get(sql);
    }),
    close: jest.fn(),
    statements,
  };
};

export const mockDatabases = new Map<string, MockDatabase>();

const Database = jest.fn((path?: string) => {
  const dbPath = path || ":memory:";

  if (!mockDatabases.has(dbPath)) {
    mockDatabases.set(dbPath, createMockDatabase());
  }

  return mockDatabases.get(dbPath);
});

export const getMockDatabase = (path: string = ":memory:"): MockDatabase => {
  return mockDatabases.get(path) || createMockDatabase();
};

export const clearMockDatabases = (): void => {
  mockDatabases.clear();
};

export const setMockDatabaseResponse = (
  path: string,
  sql: string,
  method: "run" | "get" | "all",
  response: any
): void => {
  const db = getMockDatabase(path);
  const stmt = db.prepare(sql) as MockStatement;
  stmt[method].mockReturnValue(response);
};

export default Database;
