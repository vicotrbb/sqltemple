import { jest } from "@jest/globals";

interface ConnectionRow {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string | null;
  ssl: number;
}

interface HistoryRow {
  id: number;
  connection_id: number;
  query: string;
  run_at: string;
  duration: number;
  row_count: number;
  success: number;
}

export interface MockStatement {
  run: jest.MockedFunction<any>;
  get: jest.MockedFunction<any>;
  all: jest.MockedFunction<any>;
}

export interface MockDatabase {
  exec: jest.MockedFunction<any>;
  prepare: jest.MockedFunction<any>;
  close: jest.MockedFunction<any>;
  statements: Map<string, MockStatement>;
  connections: ConnectionRow[];
  history: HistoryRow[];
}

const normalize = (sql: string) =>
  sql.trim().replace(/\s+/g, " ").toUpperCase();

const createStatement = (
  overrides: Partial<MockStatement> = {}
): MockStatement => ({
  run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
  get: jest.fn(() => null),
  all: jest.fn(() => []),
  ...overrides,
});

const createBaseDatabase = (): MockDatabase => ({
  exec: jest.fn(),
  prepare: jest.fn(),
  close: jest.fn(),
  statements: new Map<string, MockStatement>(),
  connections: [],
  history: [],
});

export const mockDatabases = new Map<string, MockDatabase>();

class InMemoryDatabase {
  public exec: jest.MockedFunction<any>;
  public prepare: jest.MockedFunction<any>;
  public close: jest.MockedFunction<any>;
  public statements: Map<string, MockStatement>;
  public connections: ConnectionRow[];
  public history: HistoryRow[];

  constructor(private readonly dbPath: string = ":memory:") {
    const base = createBaseDatabase();
    this.exec = base.exec;
    this.prepare = base.prepare;
    this.close = base.close;
    this.statements = base.statements;
    this.connections = base.connections;
    this.history = base.history;

    this.exec.mockImplementation(() => undefined);
    this.prepare.mockImplementation((sql: string) =>
      this.prepareStatement(sql)
    );
    this.close.mockImplementation(() => undefined);

    mockDatabases.set(this.dbPath, this as unknown as MockDatabase);
  }

  private prepareStatement(sql: string): MockStatement {
    const normalized = normalize(sql);
    const statement = createStatement();

    if (normalized.startsWith("INSERT INTO CONNECTIONS")) {
      statement.run.mockImplementation(
        (
          name: string,
          type: string,
          host: string,
          port: number,
          database: string,
          username: string,
          password: string | null,
          ssl: number
        ) => {
          const id = this.connections.length + 1;
          this.connections.push({
            id,
            name,
            type,
            host,
            port,
            database,
            username,
            password,
            ssl,
          });
          return { lastInsertRowid: id, changes: 1 };
        }
      );
    } else if (normalized.startsWith("UPDATE CONNECTIONS")) {
      statement.run.mockImplementation(
        (
          name: string,
          type: string,
          host: string,
          port: number,
          database: string,
          username: string,
          password: string | null,
          ssl: number,
          id: number
        ) => {
          const row = this.connections.find((c) => c.id === id);
          if (row) {
            Object.assign(row, {
              name,
              type,
              host,
              port,
              database,
              username,
              password,
              ssl,
            });
          }
          return { lastInsertRowid: id, changes: row ? 1 : 0 };
        }
      );
    } else if (normalized.startsWith("SELECT * FROM CONNECTIONS")) {
      statement.all.mockImplementation(() => [...this.connections]);
    } else if (normalized.startsWith("DELETE FROM CONNECTIONS")) {
      statement.run.mockImplementation((id: number) => {
        this.connections = this.connections.filter((c) => c.id !== id);
        return { changes: 1 };
      });
    } else if (normalized.startsWith("INSERT INTO QUERY_HISTORY")) {
      statement.run.mockImplementation(
        (
          connectionId: number,
          query: string,
          runAt: string,
          duration: number,
          rowCount: number,
          success: number
        ) => {
          const id = this.history.length + 1;
          this.history.push({
            id,
            connection_id: connectionId,
            query,
            run_at: runAt,
            duration,
            row_count: rowCount,
            success,
          });
          return { lastInsertRowid: id, changes: 1 };
        }
      );
    } else if (normalized.startsWith("SELECT * FROM QUERY_HISTORY")) {
      statement.all.mockImplementation(() => [...this.history]);
    } else if (normalized.startsWith("DELETE FROM QUERY_HISTORY")) {
      statement.run.mockImplementation((connectionId: number) => {
        this.history = this.history.filter(
          (h) => h.connection_id !== connectionId
        );
        return { changes: 1 };
      });
    }

    this.statements.set(sql, statement);
    return statement;
  }
}

const Database: any = jest.fn().mockImplementation(function (
  this: any,
  ...args: any[]
) {
  const path = args[0];
  const instance = new InMemoryDatabase(path);
  return instance as unknown as MockDatabase;
});

export const getMockDatabase = (path: string = ":memory:"): MockDatabase => {
  return mockDatabases.get(path) || createBaseDatabase();
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
  const stmt = db.prepare(sql);
  (stmt as any)[method].mockReturnValue(response);
};

export default Database;
