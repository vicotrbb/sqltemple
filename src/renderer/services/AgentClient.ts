import type {
  AgentMessageRecord,
  AgentSessionRecord,
} from "../../main/storage/StorageManager";
import type { AgentStreamEvent } from "../../main/ai/agent/types";

type AgentEventListener = (event: AgentStreamEvent) => void;

class AgentClient {
  private listeners = new Set<AgentEventListener>();

  constructor() {
    window.api.ipcRenderer.on("agent:event", (_event, payload) => {
      if (payload) {
        this.listeners.forEach((listener) => listener(payload));
      }
    });
  }

  onEvent(listener: AgentEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async startSession(
    intent: string,
    sessionId?: string
  ): Promise<AgentSessionRecord> {
    const result = await window.api.agent.start(intent, sessionId);
    if (!result.success || !result.session) {
      throw new Error(result.error || "Failed to start agent session");
    }
    return result.session;
  }

  async cancelSession(sessionId: string): Promise<void> {
    const result = await window.api.agent.cancel(sessionId);
    if (!result.success) {
      throw new Error(result.error || "Failed to cancel agent session");
    }
  }

  async listSessions(): Promise<AgentSessionRecord[]> {
    const result = await window.api.agent.listSessions();
    if (!result.success || !result.sessions) {
      throw new Error(result.error || "Failed to load agent sessions");
    }
    return result.sessions;
  }

  async getSession(
    sessionId: string
  ): Promise<{
    session: AgentSessionRecord | null;
    messages: AgentMessageRecord[];
  }> {
    const result = await window.api.agent.getSession(sessionId);
    if (!result.success) {
      throw new Error(result.error || "Failed to load agent session");
    }
    return {
      session: result.session ?? null,
      messages: result.messages ?? [],
    };
  }
}

export const agentClient = new AgentClient();
