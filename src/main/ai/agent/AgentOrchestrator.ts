import { AIService } from "../AIService";
import { AgentTool } from "./AgentTool";
import { ToolContext } from "./ToolContext";
import { AgentMessageRecord } from "../../storage/StorageManager";
import { AgentToolSpec } from "./types";
import { buildAgentPrompt, parseLLMResponse } from "./prompts";

export type OrchestratorEvent =
  | { kind: "thought"; text: string }
  | { kind: "action"; tool: string; input: string }
  | {
      kind: "observation";
      tool: string;
      output: string;
      resultKind?: string;
      resultData?: Record<string, any> | null;
    }
  | { kind: "final"; text: string };

export interface OrchestratorRunParams {
  sessionId: string;
  intent: string;
  history: AgentMessageRecord[];
  toolContext: ToolContext;
  signal?: AbortSignal;
}

const MAX_STEPS = 10;

export class AgentOrchestrator {
  private readonly toolMap: Map<string, AgentTool>;
  private readonly toolSpecs: AgentToolSpec[];

  constructor(
    private readonly aiService: AIService,
    tools: AgentTool[]
  ) {
    this.toolMap = new Map(tools.map((tool) => [tool.name, tool]));
    this.toolSpecs = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  async *run({
    sessionId,
    intent,
    history,
    toolContext,
    signal,
  }: OrchestratorRunParams): AsyncGenerator<OrchestratorEvent> {
    const scratchpad: string[] = [];

    for (let step = 0; step < MAX_STEPS; step++) {
      if (signal?.aborted) {
        break;
      }

      const prompt = buildAgentPrompt({
        intent,
        messages: history,
        toolSpecs: this.toolSpecs,
        scratchpad,
      });

      const responseText = await this.aiService.completePrompt({
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        temperature: 0.1,
      });

      const parsed = parseLLMResponse(responseText);
      yield {
        kind: "thought",
        text: parsed.thought || "(no thought provided)",
      };

      scratchpad.push(`Thought: ${parsed.thought || "(none)"}`);

      if (parsed.actionName) {
        const tool = this.toolMap.get(parsed.actionName);
        if (!tool) {
          const message = `Tool "${parsed.actionName}" is not available.`;
          scratchpad.push(`Observation: ${message}`);
          yield {
            kind: "observation",
            tool: parsed.actionName,
            output: message,
          };
          continue;
        }

        const input = parsed.actionInput || "{}";
        yield { kind: "action", tool: tool.name, input };
        scratchpad.push(`Action: ${tool.name} with ${input}`);

        try {
          const toolResult = await tool.run(input, toolContext);
          const serializedResult = JSON.stringify(
            toolResult.data ?? {},
            null,
            2
          );
          const observation = `${toolResult.summary}\n${serializedResult}`;
          scratchpad.push(`Observation: ${toolResult.summary}`);
          yield {
            kind: "observation",
            tool: tool.name,
            output: observation,
            resultKind: toolResult.kind,
            resultData: toolResult.data ?? null,
          };

          history = [
            ...history,
            {
              id: `${sessionId}-tool-${step}`,
              sessionId,
              role: "tool",
              content: observation,
              createdAt: new Date().toISOString(),
            },
          ];
          continue;
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          scratchpad.push(`Observation: ${errorMessage}`);

          yield {
            kind: "observation",
            tool: tool.name,
            output: `Tool failed: ${errorMessage}`,
          };

          continue;
        }
      }

      if (parsed.finalAnswer) {
        scratchpad.push(`Final: ${parsed.finalAnswer}`);
        yield { kind: "final", text: parsed.finalAnswer };
        return;
      }
    }

    yield {
      kind: "final",
      text: "I could not complete the request within the allotted steps. Please refine the question or try again.",
    };
  }
}
