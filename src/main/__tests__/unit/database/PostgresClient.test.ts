import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { PostgresClient } from "../../../database/PostgresClient";
import { DatabaseConnectionConfig } from "../../../database/interfaces";
import { Client as PgClient } from "pg";

jest.mock("pg");

describe("PostgresClient", () => {
  const ClientMock = PgClient as unknown as jest.Mock;
  let mockPgInstance: any;
  let client: PostgresClient;
  const baseConfig: DatabaseConnectionConfig = {
    name: "Test",
    type: "postgres",
    host: "https://example.org/database",
    port: 5432,
    database: "postgres",
    username: "postgres",
    password: "secret",
    ssl: true,
  };

  beforeEach(() => {
    mockPgInstance = {
      connect: jest.fn(),
      end: jest.fn(),
      query: jest.fn(),
    } as any;
    ClientMock.mockImplementation(() => mockPgInstance);
    client = new PostgresClient();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await client.disconnect();
  });

  it("normalizes host values before connecting", async () => {
    await client.connect(baseConfig);

    expect(ClientMock).toHaveBeenCalledWith({
      host: "example.org",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: "secret",
      ssl: { rejectUnauthorized: false },
    });
    expect(mockPgInstance.connect).toHaveBeenCalled();
  });

  it("returns structured results for successful queries", async () => {
    await client.connect(baseConfig);

    mockPgInstance.query.mockResolvedValue({
      rows: [{ id: 1 }],
      rowCount: 1,
      fields: [{ name: "id", dataTypeID: 23 }],
    });

    const result = await client.executeQuery("SELECT 1");

    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(1);
    expect(result.columns).toEqual([
      { name: "id", dataType: "integer", nullable: true },
    ]);
  });

  it("captures and returns query errors", async () => {
    await client.connect(baseConfig);

    mockPgInstance.query.mockRejectedValue(new Error("syntax error"));

    const result = await client.executeQuery("INVALID");

    expect(result.error).toBe("syntax error");
    expect(result.rows).toHaveLength(0);
    expect(result.rowCount).toBe(0);
  });

  it("paginates table data using LIMIT and OFFSET", async () => {
    await client.connect(baseConfig);

    mockPgInstance.query.mockResolvedValue({
      rows: Array.from({ length: 5 }, (_, index) => ({ id: index })),
      fields: [{ name: "id", dataTypeID: 23 }],
    });

    const page = await client.getTableData("public", "users", 5, 10);

    expect(mockPgInstance.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM "public"."users"'),
      [10, 6]
    );
    expect(page.rows).toHaveLength(5);
    expect(page.nextOffset).toBe(15);
  });
});
