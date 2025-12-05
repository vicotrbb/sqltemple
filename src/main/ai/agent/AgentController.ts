import { WebContents } from "electron";
import { randomUUID } from "crypto";
import { PostgresClient } from "../../database/PostgresClient";
import {
  DatabaseConnectionConfig,
  DatabaseSchema,
} from "../../database/interfaces";
import {
  AgentMessageRecord,
  AgentSessionRecord,
  StorageManager,
} from "../../storage/StorageManager";
import { AIService } from "../AIService";
import { AgentTool } from "./AgentTool";
import { ToolContext } from "./ToolContext";
import { AgentHistoryStore } from "./AgentHistoryStore";
import { AgentOrchestrator, OrchestratorEvent } from "./AgentOrchestrator";
import { AgentStreamEvent } from "./types";
import { buildDefaultTools } from "./tools";

interface AgentControllerDeps {
  aiService: AIService;
  storage: StorageManager;
  getClient: () => PostgresClient | null;
  getConnection: () => DatabaseConnectionConfig | null;
}

interface ActiveRun {
  abortController: AbortController;
  webContentsId: number;
}

export class AgentController {
  private readonly history: AgentHistoryStore;
  private readonly orchestrator: AgentOrchestrator;
  private readonly tools: AgentTool[];
  private readonly activeRuns = new Map<string, ActiveRun>();

  constructor(private readonly deps: AgentControllerDeps) {
    this.history = new AgentHistoryStore(deps.storage);
    this.tools = buildDefaultTools();
    this.orchestrator = new AgentOrchestrator(deps.aiService, this.tools);
  }

  async startOrContinueSession(
    intent: string,
    sender: WebContents,
    existingSessionId?: string
  ): Promise<AgentSessionRecord> {
    const connection = this.deps.getConnection();
    const client = this.deps.getClient();

    if (!connection || !client) {
      throw new Error("Connect to a database before using the agent.");
    }

    let sessionId = existingSessionId;
    let sessionData: {
      session: AgentSessionRecord | null;
      messages: AgentMessageRecord[];
    };

    if (sessionId) {
      sessionData = await this.history.getSessionWithMessages(sessionId);

      if (!sessionData.session) {
        sessionId = undefined;
      }
    } else {
      sessionData = { session: null, messages: [] };
    }

    if (!sessionId) {
      const title = intent.slice(0, 80) || "New Agent Session";
      const session = await this.history.createSession({
        connectionId: connection.id,
        title,
        status: "running",
        lastMessage: intent,
      });

      sessionId = session.id;
      sessionData = { session, messages: [] };

      this.emit(sender, { type: "session-started", session });
    }

    const sessionRecord = sessionData.session!;

    if (this.activeRuns.has(sessionRecord.id)) {
      throw new Error("That session is already running. Please wait.");
    }

    const userMessage = await this.history.appendMessage(sessionRecord.id, {
      role: "user",
      content: intent,
      metadata: { type: "user" },
    });

    this.emit(sender, {
      type: "message",
      sessionId: sessionRecord.id,
      message: userMessage,
    });

    await this.history.updateSession(sessionRecord.id, {
      lastMessage: intent,
      status: "running",
    });

    const runningSession: AgentSessionRecord = {
      ...sessionRecord,
      lastMessage: intent,
      status: "running",
      updatedAt: new Date().toISOString(),
    };

    const abortController = new AbortController();
    this.activeRuns.set(runningSession.id, {
      abortController,
      webContentsId: sender.id,
    });

    const schemaCache: { value?: DatabaseSchema } = {};
    const toolContext: ToolContext = {
      connection,
      getSchema: async () => {
        if (schemaCache.value) {
          return schemaCache.value;
        }
        schemaCache.value = await client.getSchemaMetadata();
        return schemaCache.value;
      },
      executeSql: async (sql: string) => {
        return client.executeQuery(sql);
      },
    };

    const fullHistory = [...sessionData.messages, userMessage];
    this.runOrchestration({
      session: runningSession,
      history: fullHistory,
      intent,
      toolContext,
      sender,
      abortController,
    }).catch((error) => {
      this.emit(sender, {
        type: "error",
        sessionId: runningSession.id,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return runningSession;
  }

  async cancel(sessionId: string): Promise<void> {
    const active = this.activeRuns.get(sessionId);
    if (active) {
      active.abortController.abort();
      this.activeRuns.delete(sessionId);
      await this.history.updateSession(sessionId, { status: "error" });
    }
  }

  async listSessions(limit?: number): Promise<AgentSessionRecord[]> {
    return this.history.listSessions(limit);
  }

  async getSessionWithMessages(sessionId: string) {
    return this.history.getSessionWithMessages(sessionId);
  }

  private async runOrchestration(params: {
    session: AgentSessionRecord;
    history: AgentMessageRecord[];
    intent: string;
    toolContext: ToolContext;
    sender: WebContents;
    abortController: AbortController;
  }): Promise<void> {
    const { session, history, intent, toolContext, sender, abortController } =
      params;

    try {
      for await (const event of this.orchestrator.run({
        sessionId: session.id,
        intent,
        history,
        toolContext,
        signal: abortController.signal,
      })) {
        await this.handleOrchestratorEvent(session, sender, event);
      }

      await this.history.updateSession(session.id, { status: "completed" });
      this.emit(sender, {
        type: "status",
        sessionId: session.id,
        status: "completed",
      });
    } catch (error: any) {
      await this.history.updateSession(session.id, { status: "error" });
      this.emit(sender, {
        type: "error",
        sessionId: session.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.activeRuns.delete(session.id);
    }
  }

  private async handleOrchestratorEvent(
    session: AgentSessionRecord,
    sender: WebContents,
    event: OrchestratorEvent
  ): Promise<void> {
    switch (event.kind) {
      case "thought": {
        const message = await this.history.appendMessage(session.id, {
          role: "assistant",
          content: event.text,
          metadata: { type: "thought" },
        });
        this.emit(sender, {
          type: "message",
          sessionId: session.id,
          message,
        });
        break;
      }
      case "action": {
        const message = await this.history.appendMessage(session.id, {
          role: "assistant",
          content: `Calling tool ${event.tool}`,
          metadata: { type: "tool_call", input: event.input },
        });
        this.emit(sender, {
          type: "tool-call",
          sessionId: session.id,
          name: event.tool,
          input: event.input,
        });
        this.emit(sender, {
          type: "message",
          sessionId: session.id,
          message,
        });
        break;
      }
      case "observation": {
        const message = await this.history.appendMessage(session.id, {
          role: "tool",
          content: event.output,
          metadata: { type: "tool_result", tool: event.tool },
        });
        this.emit(sender, {
          type: "tool-result",
          sessionId: session.id,
          name: event.tool,
          output: event.output,
        });
        this.emit(sender, {
          type: "message",
          sessionId: session.id,
          message,
        });

        if (
          event.resultKind === "sql_suggestion" &&
          event.resultData?.sql &&
          typeof event.resultData.sql === "string"
        ) {
          const content =
            event.resultData.description ||
            "I prepared a SQL query that you can insert or run.";

          const suggestionMessage = await this.history.appendMessage(
            session.id,
            {
              role: "assistant",
              content,
              metadata: {
                type: "sql_suggestion",
                sql: event.resultData.sql,
                description: event.resultData.description ?? null,
              },
            }
          );

          this.emit(sender, {
            type: "message",
            sessionId: session.id,
            message: suggestionMessage,
          });
        }
        break;
      }
      case "final": {
        await this.streamFinalMessage(session.id, sender, event.text);
        break;
      }
    }
  }

  private async streamFinalMessage(
    sessionId: string,
    sender: WebContents,
    text: string
  ): Promise<void> {
    const messageId = randomUUID();
    const createdAt = new Date().toISOString();

    // Announce placeholder message so the renderer can start appending tokens.
    this.emit(sender, {
      type: "message",
      sessionId,
      message: {
        id: messageId,
        sessionId,
        role: "assistant",
        content: "",
        metadata: { type: "final", streaming: true },
        createdAt,
      },
    });

    for (const token of chunkText(text)) {
      this.emit(sender, {
        type: "token",
        sessionId,
        messageId,
        token,
      });
    }

    const stored = await this.history.appendMessage(sessionId, {
      id: messageId,
      role: "assistant",
      content: text,
      metadata: { type: "final" },
    });

    this.emit(sender, {
      type: "message",
      sessionId,
      message: stored,
    });
  }

  private emit(sender: WebContents, payload: AgentStreamEvent): void {
    if (!sender.isDestroyed()) {
      sender.send("agent:event", payload);
    }
  }
}

function chunkText(text: string, chunkSize = 80): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}
