import { jest } from "@jest/globals";

export interface MockQueryResult {
  rows: any[];
  fields?: any[];
  rowCount?: number;
  command?: string;
}

export interface MockClient {
  connect: jest.MockedFunction<any>;
  end: jest.MockedFunction<any>;
  query: jest.MockedFunction<any>;
  on: jest.MockedFunction<any>;
  removeListener: jest.MockedFunction<any>;
}

const createMockClient = (): MockClient => ({
  connect: jest.fn(() => Promise.resolve()),
  end: jest.fn(() => Promise.resolve()),
  query: jest.fn(() =>
    Promise.resolve({
      rows: [],
      fields: [],
      rowCount: 0,
      command: "SELECT",
    })
  ),
  on: jest.fn(),
  removeListener: jest.fn(),
});

export const mockClients = new Map<string, MockClient>();

export const Client = jest.fn((config?: any) => {
  const clientKey = config ? JSON.stringify(config) : "default";

  if (!mockClients.has(clientKey)) {
    mockClients.set(clientKey, createMockClient());
  }

  return mockClients.get(clientKey);
});

export default {
  Client,
};

export const getMockClient = (config?: any): MockClient => {
  const clientKey = config ? JSON.stringify(config) : "default";
  return mockClients.get(clientKey) || createMockClient();
};

export const clearMockClients = (): void => {
  mockClients.clear();
};

export const setMockQueryResponse = (
  response: MockQueryResult,
  config?: any
): void => {
  const client = getMockClient(config);
  client.query.mockResolvedValue(response);
};

export const setMockQueryError = (error: Error, config?: any): void => {
  const client = getMockClient(config);
  client.query.mockRejectedValue(error);
};

export const setMockConnectionError = (error: Error, config?: any): void => {
  const client = getMockClient(config);
  client.connect.mockRejectedValue(error);
};

export const mockFields = {
  textField: { name: "text_col", dataTypeID: 25 },
  integerField: { name: "int_col", dataTypeID: 23 },
  booleanField: { name: "bool_col", dataTypeID: 16 },
  timestampField: { name: "ts_col", dataTypeID: 1114 },
  jsonField: { name: "json_col", dataTypeID: 114 },
  numericField: { name: "num_col", dataTypeID: 1700 },
};

export const mockResponses = {
  emptyResult: { rows: [], fields: [], rowCount: 0 },
  singleRow: {
    rows: [{ id: 1, name: "Test" }],
    fields: [mockFields.integerField, mockFields.textField],
    rowCount: 1,
  },
  schemaResult: {
    rows: [
      { schema_name: "public", table_count: 5 },
      { schema_name: "test", table_count: 2 },
    ],
    fields: [mockFields.textField, mockFields.integerField],
    rowCount: 2,
  },
  tableResult: {
    rows: [
      { table_schema: "public", table_name: "users", column_count: 4 },
      { table_schema: "public", table_name: "posts", column_count: 6 },
    ],
    fields: [
      mockFields.textField,
      mockFields.textField,
      mockFields.integerField,
    ],
    rowCount: 2,
  },
};
