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

  private getOrCreateEncryptionKey(): Buffer {
    const keyPath = path.join(app.getPath("userData"), ".encryption-key");

    try {
      const fs = require("fs");

      if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath);
      }
    } catch (error) {}

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

    stmt.run(
      entry.connectionId,
      entry.query,
      entry.runAt,
      entry.duration,
      entry.rowCount,
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
      ...row,
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

    // If no provider is set, default to OpenAI for backward compatibility
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

  close(): void {
    this.db.close();
  }
}
