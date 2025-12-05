import { ToolContext } from "./ToolContext";

export interface AgentToolResult {
  summary: string;
  data?: Record<string, any> | null;
  kind?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: string;

  run(input: string, context: ToolContext): Promise<AgentToolResult>;
}
