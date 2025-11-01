import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import Database from "better-sqlite3";
import { StorageManager } from "../../../storage/StorageManager";
import { DatabaseConnectionConfig } from "../../../database/interfaces";

jest.mock("better-sqlite3");

const DatabaseMock = Database as unknown as jest.Mock;

describe("StorageManager", () => {
  let mockDb: any;
  let manager: StorageManager;

  beforeEach(() => {
    mockDb = {
      exec: jest.fn(),
      prepare: jest.fn(),
      close: jest.fn(),
    } as any;
    DatabaseMock.mockReturnValue(mockDb);
    manager = new StorageManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
    manager.close();
  });

  it("stores encrypted passwords when saving connections", async () => {
    const insertedRows: any[] = [];
    const insertStatement = {
      run: jest.fn((...args: any[]) => {
        insertedRows.push(args);
        return { lastInsertRowid: 7 };
      }),
    };

    mockDb.prepare.mockImplementation((sql: string) => {
      if (sql.startsWith("INSERT INTO connections")) {
        return insertStatement as any;
      }
      if (sql.startsWith("SELECT * FROM connections")) {
        return { all: jest.fn(() => []) } as any;
      }
      if (sql.startsWith("UPDATE connections")) {
        return { run: jest.fn() } as any;
      }
      return { run: jest.fn(), all: jest.fn(() => []), get: jest.fn() } as any;
    });

    const config: DatabaseConnectionConfig = {
      name: "Local",
      type: "postgres",
      host: "localhost",
      port: 5432,
      database: "postgres",
      username: "admin",
      password: "super-secret",
      ssl: false,
    };

    const id = await manager.saveConnection(config);

    expect(id).toBe(7);
    expect(insertStatement.run).toHaveBeenCalled();
    const passwordParam = insertedRows[0][6];
    expect(passwordParam).toBe("encrypted-data");
  });

  it("decrypts stored passwords when loading connections", async () => {
    const selectStatement = {
      all: jest.fn(() => [
        {
          id: 1,
          name: "Local",
          type: "postgres",
          host: "localhost",
          port: 5432,
          database: "postgres",
          username: "admin",
          password: "iv:encrypted-data",
          ssl: 0,
        },
      ]),
    };

    mockDb.prepare.mockImplementation((sql: string) => {
      if (sql.startsWith("SELECT * FROM connections")) {
        return selectStatement as any;
      }
      return { run: jest.fn(), all: jest.fn(() => []), get: jest.fn() } as any;
    });

    const connections = await manager.getConnections();

    expect(selectStatement.all).toHaveBeenCalled();
    expect(connections).toHaveLength(1);
    expect(connections[0].password).toBe("decrypted-data");
  });
});
