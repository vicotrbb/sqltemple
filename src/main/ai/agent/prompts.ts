import { AgentMessageRecord } from "../../storage/StorageManager";
import { AgentToolSpec } from "./types";

export interface PromptContext {
  intent: string;
  messages: AgentMessageRecord[];
  toolSpecs: AgentToolSpec[];
  scratchpad: string[];
}

export interface ParsedLLMReply {
  thought: string;
  actionName?: string;
  actionInput?: string;
  finalAnswer?: string;
}

const SYSTEM_PROMPT = `You are SQLTemple's autonomous database co-pilot. 
- You understand PostgreSQL schemas, SQL, and data workflows.
- You can reason using tools and must only execute the minimum SQL needed.
- Always double-check destructive operations before running them.
- Prefer concise, actionable language and return answers tailored to data engineers.`;

export function buildAgentPrompt(context: PromptContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const conversation = context.messages
    .filter((message) => message.role !== "system")
    .map((message) => {
      const speaker =
        message.role === "user"
          ? "User"
          : message.role === "assistant"
            ? "Assistant"
            : "Tool";
      return `${speaker}: ${message.content}`;
    })
    .join("\n");

  const toolsDescription = context.toolSpecs
    .map(
      (tool) =>
        `- ${tool.name}: ${tool.description}\n  input: ${tool.inputSchema}`
    )
    .join("\n");

  const scratchpad = context.scratchpad.join("\n");

  const userPrompt = `
Conversation so far:
${conversation || "(no previous turns)"}

User intent:
${context.intent}

Available tools:
${toolsDescription}

Previous tool interactions:
${scratchpad || "(none yet)"}

Respond strictly as compact JSON with this shape:
{
  "thought": "short reasoning here",
  "action": { "name": "<tool name>", "input": "<json string>" } | null,
  "finalAnswer": "Use this when you are ready to answer the user"
}

If you do not need a tool, set "action" to null and provide "finalAnswer".`;

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
  };
}

export function parseLLMResponse(raw: string): ParsedLLMReply {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return { thought: "", finalAnswer: "" };
  }

  const parsed = tryParseJsonBlock(trimmed);
  if (!parsed) {
    return {
      thought: trimmed,
      finalAnswer: trimmed,
    };
  }

  const thought =
    typeof parsed.thought === "string"
      ? parsed.thought
      : typeof parsed.reasoning === "string"
        ? parsed.reasoning
        : "";

  const action = parsed.action ?? null;
  const actionName =
    typeof parsed.actionName === "string"
      ? parsed.actionName
      : typeof action?.name === "string"
        ? action.name
        : undefined;

  let actionInput: string | undefined;
  const candidateInput =
    typeof parsed.actionInput === "string"
      ? parsed.actionInput
      : typeof action?.input === "string"
        ? action.input
        : typeof action?.input === "object" && action?.input !== null
          ? JSON.stringify(action.input)
          : undefined;
  if (candidateInput) {
    actionInput = candidateInput;
  }

  const finalAnswer =
    typeof parsed.finalAnswer === "string"
      ? parsed.finalAnswer
      : typeof parsed.answer === "string"
        ? parsed.answer
        : undefined;

  return {
    thought,
    actionName,
    actionInput,
    finalAnswer,
  };
}

function tryParseJsonBlock(content: string): any | null {
  try {
    return JSON.parse(content);
  } catch {
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    const block = content.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(block);
    } catch {
      return null;
    }
  }
}
