import { DatabaseConnectionConfig } from "../../database/interfaces";
import { QueryHistoryEntry } from "../../storage/StorageManager";
import { AIConfig } from "../../ai/providers/AIProvider";

/**
 * Factory for creating test database connection configurations
 */
export const createTestConnectionConfig = (
  overrides: Partial<DatabaseConnectionConfig> = {}
): DatabaseConnectionConfig => ({
  id: 1,
  name: "Test Connection",
  type: "postgres",
  host: "localhost",
  port: 5432,
  database: "test_db",
  username: "test_user",
  password: "test_password",
  ssl: false,
  ...overrides,
});

/**
 * Factory for creating test query history entries
 */
export const createTestQueryHistory = (
  overrides: Partial<QueryHistoryEntry> = {}
): QueryHistoryEntry => ({
  id: 1,
  connectionId: 1,
  query: "SELECT * FROM users;",
  runAt: new Date().toISOString(),
  duration: 100,
  rowCount: 5,
  success: true,
  ...overrides,
});

/**
 * Factory for creating test AI configurations
 */
export const createTestAIConfig = (
  overrides: Partial<AIConfig> = {}
): AIConfig => ({
  provider: "openai",
  apiKey: "test-api-key",
  model: "gpt-4o-mini",
  baseUrl: undefined,
  ...overrides,
});

/**
 * Factory for creating test database schemas
 */
export const createTestDatabaseSchema = () => ({
  databases: [
    {
      name: "test_db",
      size: "10 MB",
      owner: "test_user",
    },
  ],
  schemas: [
    {
      name: "public",
      tables: [
        {
          name: "users",
          columns: [],
          columnCount: 4,
        },
        {
          name: "posts",
          columns: [],
          columnCount: 6,
        },
      ],
    },
    {
      name: "test_schema",
      tables: [
        {
          name: "test_table",
          columns: [],
          columnCount: 3,
        },
      ],
    },
  ],
});

/**
 * Factory for creating test table columns
 */
export const createTestTableColumns = () => [
  {
    name: "id",
    dataType: "integer",
    nullable: false,
  },
  {
    name: "name",
    dataType: "varchar(255)",
    nullable: false,
  },
  {
    name: "email",
    dataType: "varchar(255)",
    nullable: true,
  },
  {
    name: "created_at",
    dataType: "timestamp",
    nullable: false,
  },
];

/**
 * Factory for creating test query results
 */
export const createTestQueryResult = (rowCount: number = 3) => ({
  columns: createTestTableColumns(),
  rows: Array.from({ length: rowCount }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    created_at: new Date().toISOString(),
  })),
  rowCount,
  duration: 150,
});

/**
 * Factory for creating test query plans
 */
export const createTestQueryPlan = () => [
  {
    Plan: {
      "Node Type": "Seq Scan",
      "Relation Name": "users",
      Alias: "users",
      "Startup Cost": 0.0,
      "Total Cost": 22.5,
      "Plan Rows": 1000,
      "Plan Width": 244,
      "Actual Startup Time": 0.042,
      "Actual Total Time": 0.167,
      "Actual Rows": 1000,
      "Actual Loops": 1,
      Filter: "(id = 1)",
      "Rows Removed by Filter": 999,
      Buffers: {
        "Shared Hit": 12,
      },
    },
    "Planning Time": 0.123,
    "Execution Time": 0.234,
  },
];

/**
 * Factory for creating mock file dialog results
 */
export const createTestFileDialogResult = (canceled: boolean = false) => ({
  canceled,
  filePaths: canceled ? [] : ["/tmp/test-file.sql"],
  filePath: canceled ? undefined : "/tmp/test-file.sql",
});

/**
 * Factory for creating test AI responses
 */
export const createTestAIResponse = (content: string) => ({
  content,
  usage: {
    promptTokens: 10,
    completionTokens: 20,
    totalTokens: 30,
  },
});

/**
 * Factory for creating test error objects
 */
export const createTestError = (
  message: string = "Test error",
  code?: string
) => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};

/**
 * Factory for creating test database connection errors
 */
export const createTestConnectionError = (
  message: string = "Connection failed"
) => {
  const error = new Error(message);
  (error as any).code = "ECONNREFUSED";
  return error;
};

/**
 * Factory for creating test SQL syntax errors
 */
export const createTestSQLError = (message: string = "SQL syntax error") => {
  const error = new Error(message);
  (error as any).code = "42601";
  (error as any).position = "7";
  return error;
};
