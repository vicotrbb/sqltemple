import { describe, it, expect, jest } from "@jest/globals";
import {
  AgentOrchestrator,
  OrchestratorEvent,
} from "../../../ai/agent/AgentOrchestrator";
import { AgentTool } from "../../../ai/agent/AgentTool";
import { ToolContext } from "../../../ai/agent/ToolContext";
import { AgentMessageRecord } from "../../../storage/StorageManager";
import { AIService } from "../../../ai/AIService";

const createToolContext = (): ToolContext => ({
  connection: { id: 1 } as any,
  getSchema: jest.fn(async () => ({ schemas: [] }) as any),
  executeSql: jest.fn(async () => ({
    rows: [],
    columns: [],
    rowCount: 0,
    duration: 0,
  })),
});

const baseHistory: AgentMessageRecord[] = [
  {
    id: "history-1",
    sessionId: "session-1",
    role: "user",
    content: "Describe task executions",
    metadata: null,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

const collectEvents = async (
  generator: AsyncGenerator<OrchestratorEvent, void, unknown>
): Promise<OrchestratorEvent[]> => {
  const events: OrchestratorEvent[] = [];
  for await (const event of generator) {
    events.push(event);
  }
  return events;
};

const createAIService = () => {
  const completePrompt = jest.fn(async () => "");
  const service = { completePrompt } as unknown as AIService;
  return { service, completePrompt };
};

type MockTool = AgentTool & {
  run: jest.MockedFunction<AgentTool["run"]>;
};

const createTool = (overrides: Partial<AgentTool> = {}): MockTool => {
  const run: jest.MockedFunction<AgentTool["run"]> = jest.fn(async () => ({
    summary: "Schema ready",
    data: { tables: 3 },
    kind: "schema",
  }));

  return {
    name: "schema_inspector",
    description: "Inspect schemas",
    inputSchema: "{}",
    run,
    ...overrides,
  } as MockTool;
};

describe("AgentOrchestrator", () => {
  it("executes requested tools and yields final answers", async () => {
    const { service: aiService, completePrompt } = createAIService();
    const tool = createTool();
    completePrompt
      .mockResolvedValueOnce(
        JSON.stringify({
          thought: "Need the schema",
          action: { name: tool.name, input: '{"table":"task_executions"}' },
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          thought: "Ready to answer",
          action: null,
          finalAnswer: "Here is the query",
        })
      );

    const orchestrator = new AgentOrchestrator(aiService, [tool]);
    const context = createToolContext();

    const events = await collectEvents(
      orchestrator.run({
        sessionId: "session-1",
        intent: "Fetch executions",
        history: baseHistory,
        toolContext: context,
      })
    );

    expect(completePrompt).toHaveBeenCalledTimes(2);
    expect(tool.run).toHaveBeenCalledWith(
      '{"table":"task_executions"}',
      context
    );

    expect(events[0]).toEqual({ kind: "thought", text: "Need the schema" });
    expect(events[1]).toEqual({
      kind: "action",
      tool: tool.name,
      input: '{"table":"task_executions"}',
    });
    expect(events[2]).toEqual({
      kind: "observation",
      tool: tool.name,
      output: expect.stringContaining("Schema ready"),
      resultKind: "schema",
      resultData: { tables: 3 },
    });
    expect(events[3]).toEqual({ kind: "thought", text: "Ready to answer" });
    expect(events[4]).toEqual({
      kind: "final",
      text: "Here is the query",
    });
  });

  it("reports missing tools as observations", async () => {
    const { service: aiService, completePrompt } = createAIService();
    completePrompt
      .mockResolvedValueOnce(
        JSON.stringify({
          thought: "Need helper",
          action: { name: "unknown_tool", input: "{}" },
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          thought: "Fallback",
          action: null,
          finalAnswer: "Unable to use that tool",
        })
      );

    const orchestrator = new AgentOrchestrator(aiService, []);

    const events = await collectEvents(
      orchestrator.run({
        sessionId: "session-1",
        intent: "Investigate",
        history: baseHistory,
        toolContext: createToolContext(),
      })
    );

    expect(events[0]).toEqual({ kind: "thought", text: "Need helper" });
    expect(events[1]).toEqual({
      kind: "observation",
      tool: "unknown_tool",
      output: 'Tool "unknown_tool" is not available.',
      resultKind: undefined,
      resultData: undefined,
    });
    expect(events[2]).toEqual({ kind: "thought", text: "Fallback" });
    expect(events[3]).toEqual({
      kind: "final",
      text: "Unable to use that tool",
    });
  });

  it("surface tool failures and continues processing", async () => {
    const { service: aiService, completePrompt } = createAIService();
    const failingRun: jest.MockedFunction<AgentTool["run"]> = jest.fn(
      async () => {
        throw new Error("boom");
      }
    );
    const tool = createTool({ run: failingRun });

    completePrompt
      .mockResolvedValueOnce(
        JSON.stringify({
          thought: "Call tool",
          action: { name: tool.name, input: "{}" },
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          thought: "Answer anyway",
          action: null,
          finalAnswer: "Recovered",
        })
      );

    const orchestrator = new AgentOrchestrator(aiService, [tool]);

    const events = await collectEvents(
      orchestrator.run({
        sessionId: "session-1",
        intent: "Investigate",
        history: baseHistory,
        toolContext: createToolContext(),
      })
    );

    expect(tool.run).toHaveBeenCalledTimes(1);
    expect(events[2]).toEqual({
      kind: "observation",
      tool: tool.name,
      output: "Tool failed: boom",
      resultKind: undefined,
      resultData: undefined,
    });
    expect(events[events.length - 1]).toEqual({
      kind: "final",
      text: "Recovered",
    });
  });

  it("stops immediately when aborted", async () => {
    const { service: aiService, completePrompt } = createAIService();
    const orchestrator = new AgentOrchestrator(aiService, []);
    const signal = new AbortController();
    signal.abort();

    const events = await collectEvents(
      orchestrator.run({
        sessionId: "session-1",
        intent: "stop",
        history: baseHistory,
        toolContext: createToolContext(),
        signal: signal.signal,
      })
    );

    expect(completePrompt).not.toHaveBeenCalled();
    expect(events).toEqual([
      {
        kind: "final",
        text: "I could not complete the request within the allotted steps. Please refine the question or try again.",
      },
    ]);
  });
});
