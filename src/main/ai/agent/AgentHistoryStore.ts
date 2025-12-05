import {
  AgentMessageRecord,
  AgentSessionRecord,
  AgentSessionStatus,
  StorageManager,
} from "../../storage/StorageManager";

export interface CreateAgentSessionInput {
  id?: string;
  connectionId?: number | null;
  title: string;
  status?: AgentSessionStatus;
  lastMessage?: string | null;
  metadata?: Record<string, any> | null;
}

export interface AgentMessageInput {
  id?: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  metadata?: Record<string, any> | null;
}

export class AgentHistoryStore {
  constructor(private storage: StorageManager) {}

  async createSession(
    payload: CreateAgentSessionInput
  ): Promise<AgentSessionRecord> {
    return this.storage.createAgentSession(payload);
  }

  async appendMessage(
    sessionId: string,
    message: AgentMessageInput
  ): Promise<AgentMessageRecord> {
    return this.storage.addAgentMessage(sessionId, message);
  }

  async updateSession(
    sessionId: string,
    update: {
      status?: AgentSessionStatus;
      lastMessage?: string | null;
      metadata?: Record<string, any> | null;
      title?: string;
    }
  ): Promise<void> {
    await this.storage.updateAgentSession(sessionId, update);
  }

  async getSessionWithMessages(sessionId: string): Promise<{
    session: AgentSessionRecord | null;
    messages: AgentMessageRecord[];
  }> {
    return this.storage.getAgentSessionWithMessages(sessionId);
  }

  async listSessions(limit?: number): Promise<AgentSessionRecord[]> {
    return this.storage.listAgentSessions(limit);
  }
}
