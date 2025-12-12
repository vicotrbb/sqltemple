---
title: Agent sidebar
description: Streamed, tool-aware conversations that inspect schema, propose SQL, and insert or run queries with one click.
order: 8
---

SQLTemple ships with an autonomous, database-aware agent that lives in a right-hand sidebar. It can read your intent, inspect the connected database, call safe tools, and stream answers, complete with a persistent conversation history.

## Opening the sidebar

- Click the **Agent** button in the main toolbar or press **Cmd+L / Ctrl+L**.
- The sidebar auto-hides when closed, but SQLTemple remembers the panel width and your most recent session.

## Starting conversations

1. Click **New Conversation** to spin up a blank draft (no prompt needed).
2. Or reopen any past conversation from the list on the left—the agent persists every turn locally.
3. Draft sessions convert into permanent sessions as soon as you send the first intent.

## Understanding the ReAct trace

- Each user prompt collapses intermediate “Processing” entries (thoughts and tool calls) inside a dropdown so the chat stays clean.
- Expand the dropdown to inspect which tools ran—schema inspection, fuzzy database search, SQL execution, etc.—and the data each tool returned.
- Responses stream token-by-token so you can watch the agent think in real time.

## Tool-aware intelligence

The agent automatically reuses the active database connection and AI provider/model. It can:

- Inspect schemas and tables with real column counts.
- Run fuzzy searches across schemas, tables, views, and columns to find matching objects.
- Execute read-only SQL to gather facts.
- Propose complete SQL queries tailored to the schema it just explored.

## Applying SQL suggestions

When the agent is confident in a query, it emits an **SQL suggestion card**:

- **Insert** - appends the exact SQL to your current editor tab (without clearing existing text).
- **Run** - executes immediately, opens the results grid, and streams rows using the same safeguards as manual execution.

Cards stay inside the chat history so you can revisit, copy, or re-run them later.

## Tips for great results

- Be specific about the business question (“Join task_executions with execution_events by correlation_id”) to reduce follow-up tool calls.
- Use the conversation history to branch: reopen a past session, then continue or start a new draft.
- Keep an eye on the Processing dropdowns when troubleshooting, if a tool failed (e.g., no schema access), the agent will log that there.

With the agent sidebar you can go from idea → verified SQL → executed results without leaving SQLTemple or losing the audit trail of how the answer was produced.
