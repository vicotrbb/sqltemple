import Database from "better-sqlite3";
import { app } from "electron";
import * as path from "path";
import * as crypto from "crypto";
import { DatabaseConnectionConfig } from "../database/interfaces";

export interface QueryHistoryEntry {
  id?: number;
  connectionId: number;
  query: string;
  runAt: string;
  duration: number;
  rowCount: number;
  success: boolean;
}

export type AgentSessionStatus = "running" | "completed" | "error";

export interface AgentSessionRecord {
  id: string;
  connectionId?: number | null;
  title: string;
  status: AgentSessionStatus;
  lastMessage?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessageRecord {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export class StorageManager {
  private db: Database.Database;
  private encryptionKey: Buffer;

  constructor() {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "sqltemple.db");

    this.db = new Database(dbPath);
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.initializeTables();
  }

  private normalizeRowCount(rowCount: unknown): number {
    if (typeof rowCount === "number" && Number.isFinite(rowCount)) {
      return Math.max(0, Math.trunc(rowCount));
    }

    if (typeof rowCount === "string" && rowCount.trim() !== "") {
      const parsed = Number(rowCount);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return Math.max(0, Math.trunc(parsed));
      }
    }

    return 0;
  }

  private getOrCreateEncryptionKey(): Buffer {
    const keyPath = path.join(app.getPath("userData"), ".encryption-key");

    try {
      const fs = require("fs");

      if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath);
      }
    } catch (error) {
      console.warn("Failed to load encryption key from disk:", error);
    }

    const key = crypto.randomBytes(32);
    try {
      const fs = require("fs");
      fs.writeFileSync(keyPath, key, { mode: 0o600 });
    } catch (error) {
      console.warn("Failed to save encryption key to disk:", error);
    }

    return key;
  }

  private encrypt(text: string): string {
    if (!text) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.encryptionKey, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  }

  private decrypt(encryptedText: string): string {
    if (!encryptedText || encryptedText.split(":").length !== 2)
      return encryptedText;

    try {
      const parts = encryptedText.split(":");
      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        this.encryptionKey,
        iv
      );

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Failed to decrypt data:", error);
      return encryptedText;
    }
  }

  private serializeMetadata(value?: Record<string, any> | null): string | null {
    if (!value || Object.keys(value).length === 0) {
      return null;
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn("Failed to serialize metadata:", error);
      return null;
    }
  }

  private deserializeMetadata(
    value?: string | null
  ): Record<string, any> | null {
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("Failed to deserialize metadata:", error);
      return null;
    }
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        database TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT,
        ssl BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS query_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        connection_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        run_at DATETIME NOT NULL,
        duration INTEGER NOT NULL,
        row_count INTEGER NOT NULL,
        success BOOLEAN NOT NULL,
        FOREIGN KEY (connection_id) REFERENCES connections (id)
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_history_connection 
      ON query_history(connection_id);
      
      CREATE INDEX IF NOT EXISTS idx_history_run_at 
      ON query_history(run_at DESC);

    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_sessions (
        id TEXT PRIMARY KEY,
        connection_id INTEGER,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        last_message TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (connection_id) REFERENCES connections (id)
      );

      CREATE TABLE IF NOT EXISTS agent_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_agent_messages_session 
        ON agent_messages(session_id, created_at);
    `);
  }

  async getConnections(): Promise<DatabaseConnectionConfig[]> {
    const stmt = this.db.prepare("SELECT * FROM connections ORDER BY name");
    const connections = stmt.all() as DatabaseConnectionConfig[];

    return connections.map((conn) => ({
      ...conn,
      password: conn.password ? this.decrypt(conn.password) : undefined,
    }));
  }

  async saveConnection(connection: DatabaseConnectionConfig): Promise<number> {
    const encryptedPassword = connection.password
      ? this.encrypt(connection.password)
      : null;

    if (connection.id) {
      const stmt = this.db.prepare(`
        UPDATE connections 
        SET name = ?, type = ?, host = ?, port = ?, 
            database = ?, username = ?, password = ?, ssl = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        connection.name,
        connection.type,
        connection.host,
        connection.port,
        connection.database,
        connection.username,
        encryptedPassword,
        connection.ssl ? 1 : 0,
        connection.id
      );

      return connection.id;
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO connections (name, type, host, port, database, username, password, ssl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        connection.name,
        connection.type,
        connection.host,
        connection.port,
        connection.database,
        connection.username,
        encryptedPassword,
        connection.ssl ? 1 : 0
      );

      return result.lastInsertRowid as number;
    }
  }

  async deleteConnection(id: number): Promise<void> {
    this.db
      .prepare("DELETE FROM query_history WHERE connection_id = ?")
      .run(id);
    this.db.prepare("DELETE FROM connections WHERE id = ?").run(id);
  }

  async addQueryHistory(entry: QueryHistoryEntry): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO query_history (connection_id, query, run_at, duration, row_count, success)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const normalizedRowCount = this.normalizeRowCount(entry.rowCount);

    stmt.run(
      entry.connectionId,
      entry.query,
      entry.runAt,
      entry.duration,
      normalizedRowCount,
      entry.success ? 1 : 0
    );
  }

  async getQueryHistory(
    connectionId?: number,
    limit: number = 100
  ): Promise<QueryHistoryEntry[]> {
    let query = "SELECT * FROM query_history";
    const params: any[] = [];

    if (connectionId !== undefined) {
      query += " WHERE connection_id = ?";
      params.push(connectionId);
    }

    query += " ORDER BY run_at DESC LIMIT ?";
    params.push(limit);

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params);

    return results.map((row: any) => ({
      id: row.id,
      connectionId: row.connection_id,
      query: row.query,
      runAt: row.run_at,
      duration: row.duration,
      rowCount: this.normalizeRowCount(row.row_count),
      success: Boolean(row.success),
    }));
  }

  async getSetting(key: string): Promise<string | null> {
    const stmt = this.db.prepare("SELECT value FROM settings WHERE key = ?");
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
    `);
    stmt.run(key, value);
  }

  async saveAIConfig(config: {
    provider: string;
    apiKey?: string;
    model: string;
    baseUrl?: string;
  }): Promise<void> {
    await this.setSetting("ai_provider", config.provider);
    await this.setSetting("ai_model", config.model);

    if (config.apiKey) {
      const encryptedApiKey = this.encrypt(config.apiKey);
      await this.setSetting("ai_api_key", encryptedApiKey);
    } else {
      await this.setSetting("ai_api_key", "");
    }

    if (config.baseUrl) {
      await this.setSetting("ai_base_url", config.baseUrl);
    } else {
      await this.setSetting("ai_base_url", "");
    }
  }

  async getAIConfig(): Promise<{
    provider: string;
    apiKey?: string;
    model: string;
    baseUrl?: string;
  } | null> {
    const provider = await this.getSetting("ai_provider");
    const model = await this.getSetting("ai_model");
    const encryptedApiKey = await this.getSetting("ai_api_key");
    const baseUrl = await this.getSetting("ai_base_url");

    if (!provider) {
      return null;
    }

    let apiKey: string | undefined;
    if (encryptedApiKey && encryptedApiKey.trim() !== "") {
      apiKey = this.decrypt(encryptedApiKey);
    }

    return {
      provider,
      apiKey,
      model: model || "gpt-4o-mini",
      baseUrl: baseUrl && baseUrl.trim() !== "" ? baseUrl : undefined,
    };
  }

  async createAgentSession(data: {
    id?: string;
    connectionId?: number | null;
    title: string;
    status?: AgentSessionStatus;
    lastMessage?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<AgentSessionRecord> {
    const id = data.id || crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO agent_sessions (id, connection_id, title, status, last_message, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const metadata = this.serializeMetadata(data.metadata);
    stmt.run(
      id,
      data.connectionId ?? null,
      data.title,
      data.status ?? "running",
      data.lastMessage ?? null,
      metadata
    );

    return {
      id,
      connectionId: data.connectionId ?? null,
      title: data.title,
      status: data.status ?? "running",
      lastMessage: data.lastMessage ?? null,
      metadata: data.metadata ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async updateAgentSession(
    sessionId: string,
    update: {
      status?: AgentSessionStatus;
      lastMessage?: string | null;
      metadata?: Record<string, any> | null;
      title?: string;
    }
  ): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (update.status) {
      fields.push("status = ?");
      params.push(update.status);
    }

    if (update.lastMessage !== undefined) {
      fields.push("last_message = ?");
      params.push(update.lastMessage);
    }

    if (update.metadata !== undefined) {
      fields.push("metadata = ?");
      params.push(this.serializeMetadata(update.metadata));
    }

    if (update.title !== undefined) {
      fields.push("title = ?");
      params.push(update.title);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");

    const stmt = this.db.prepare(
      `UPDATE agent_sessions SET ${fields.join(", ")} WHERE id = ?`
    );
    stmt.run(...params, sessionId);
  }

  async addAgentMessage(
    sessionId: string,
    message: {
      id?: string;
      role: "user" | "assistant" | "tool" | "system";
      content: string;
      metadata?: Record<string, any> | null;
    }
  ): Promise<AgentMessageRecord> {
    const id = message.id || crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO agent_messages (id, session_id, role, content, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sessionId,
      message.role,
      message.content,
      this.serializeMetadata(message.metadata),
      createdAt
    );

    return {
      id,
      sessionId,
      role: message.role,
      content: message.content,
      metadata: message.metadata ?? null,
      createdAt,
    };
  }

  async listAgentSessions(limit: number = 50): Promise<AgentSessionRecord[]> {
    const stmt = this.db.prepare(`
      SELECT id, connection_id, title, status, last_message, metadata, created_at, updated_at
      FROM agent_sessions
      ORDER BY updated_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map((row) => ({
      id: row.id,
      connectionId: row.connection_id ?? null,
      title: row.title,
      status: row.status,
      lastMessage: row.last_message ?? null,
      metadata: this.deserializeMetadata(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getAgentSessionWithMessages(
    sessionId: string
  ): Promise<{
    session: AgentSessionRecord | null;
    messages: AgentMessageRecord[];
  }> {
    const sessionRow = this.db
      .prepare(
        `SELECT id, connection_id, title, status, last_message, metadata, created_at, updated_at
         FROM agent_sessions WHERE id = ?`
      )
      .get(sessionId) as any;

    const session = sessionRow
      ? {
          id: sessionRow.id,
          connectionId: sessionRow.connection_id ?? null,
          title: sessionRow.title,
          status: sessionRow.status,
          lastMessage: sessionRow.last_message ?? null,
          metadata: this.deserializeMetadata(sessionRow.metadata),
          createdAt: sessionRow.created_at,
          updatedAt: sessionRow.updated_at,
        }
      : null;

    const messagesStmt = this.db.prepare(
      `SELECT id, session_id, role, content, metadata, created_at
       FROM agent_messages
       WHERE session_id = ?
       ORDER BY datetime(created_at)`
    );

    const messages = messagesStmt.all(sessionId).map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      metadata: this.deserializeMetadata(row.metadata),
      createdAt: row.created_at,
    }));

    return { session, messages };
  }

  close(): void {
    this.db.close();
  }
}
