import { AgentTool } from "../AgentTool";
import { SchemaExplorerTool } from "./SchemaExplorerTool";
import { RunSqlTool } from "./RunSqlTool";
import { QuerySuggestionTool } from "./QuerySuggestionTool";
import { DatabaseSearchTool } from "./DatabaseSearchTool";

export function buildDefaultTools(): AgentTool[] {
  return [
    new SchemaExplorerTool(),
    new RunSqlTool(),
    new QuerySuggestionTool(),
    new DatabaseSearchTool(),
  ];
}
