import {
  AgentMessageRecord,
  AgentSessionRecord,
  AgentSessionStatus,
} from "../../storage/StorageManager";

export type AgentRole = AgentMessageRecord["role"];

export interface AgentToolSpec {
  name: string;
  description: string;
  inputSchema: string;
}

export type AgentStreamEvent =
  | { type: "session-started"; session: AgentSessionRecord }
  | { type: "message"; sessionId: string; message: AgentMessageRecord }
  | {
      type: "token";
      sessionId: string;
      messageId: string;
      token: string;
    }
  | {
      type: "tool-call";
      sessionId: string;
      name: string;
      input: string;
    }
  | {
      type: "tool-result";
      sessionId: string;
      name: string;
      output: string;
    }
  | {
      type: "status";
      sessionId: string;
      status: AgentSessionStatus;
    }
  | { type: "error"; sessionId: string; error: string };

export interface AgentRunRequest {
  sessionId: string;
  intent: string;
  messages: AgentMessageRecord[];
  toolSpecs: AgentToolSpec[];
}
