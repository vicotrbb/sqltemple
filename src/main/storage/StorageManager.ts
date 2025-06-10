import Database from "better-sqlite3";
import { app } from "electron";
import * as path from "path";
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

  constructor() {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "sqltemple.db");

    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    // Connections table
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

    // Query history table
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

    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_history_connection 
      ON query_history(connection_id);
      
      CREATE INDEX IF NOT EXISTS idx_history_run_at 
      ON query_history(run_at DESC);
    `);
  }

  // Connection management
  async getConnections(): Promise<DatabaseConnectionConfig[]> {
    const stmt = this.db.prepare("SELECT * FROM connections ORDER BY name");
    return stmt.all() as DatabaseConnectionConfig[];
  }

  async saveConnection(connection: DatabaseConnectionConfig): Promise<number> {
    if (connection.id) {
      // Update existing
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
        connection.password || null,
        connection.ssl ? 1 : 0,
        connection.id
      );

      return connection.id;
    } else {
      // Insert new
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
        connection.password || null,
        connection.ssl ? 1 : 0
      );

      return result.lastInsertRowid as number;
    }
  }

  async deleteConnection(id: number): Promise<void> {
    // Delete related history first
    this.db
      .prepare("DELETE FROM query_history WHERE connection_id = ?")
      .run(id);
    // Then delete connection
    this.db.prepare("DELETE FROM connections WHERE id = ?").run(id);
  }

  // Query history management
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

  // Settings management
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

  // AI Configuration
  async saveAIConfig(config: { apiKey: string; model: string }): Promise<void> {
    // Store API key securely (in a real app, consider using electron-store with encryption)
    await this.setSetting("ai_api_key", config.apiKey);
    await this.setSetting("ai_model", config.model);
  }

  async getAIConfig(): Promise<{ apiKey: string; model: string } | null> {
    const apiKey = await this.getSetting("ai_api_key");
    const model = await this.getSetting("ai_model");

    if (!apiKey) {
      return null;
    }

    return {
      apiKey,
      model: model || "gpt-4o-mini",
    };
  }

  close(): void {
    this.db.close();
  }
}
